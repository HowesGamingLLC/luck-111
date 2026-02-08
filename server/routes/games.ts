import { RequestHandler } from "express";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || "",
  process.env.VITE_SUPABASE_ANON_KEY || "",
);

// Get all active games
export const getAllGames: RequestHandler = async (req, res) => {
  try {
    const gameType = req.query.type as string;

    let query = supabase.from("games").select("*").eq("active", true);

    if (gameType) {
      query = query.eq("type", gameType);
    }

    const { data, error } = await query;

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ games: data });
  } catch (error) {
    console.error("Error fetching games:", error);
    res.status(500).json({ error: "Failed to fetch games" });
  }
};

// Get game by ID
export const getGame: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from("games")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      return res.status(404).json({ error: "Game not found" });
    }

    res.json({ game: data });
  } catch (error) {
    console.error("Error fetching game:", error);
    res.status(500).json({ error: "Failed to fetch game" });
  }
};

// Create game session
export const createGameSession: RequestHandler = async (req, res) => {
  try {
    const { userId, gameId, currency, wagerAmount } = req.body;

    if (!userId || !gameId || !currency || !wagerAmount) {
      return res.status(400).json({
        error: "Missing required fields: userId, gameId, currency, wagerAmount",
      });
    }

    // Verify user has sufficient balance
    const { data: balance } = await supabase
      .from("user_balances")
      .select(currency === "GC" ? "gold_coins" : "sweep_coins")
      .eq("user_id", userId)
      .single();

    const fieldName = currency === "GC" ? "gold_coins" : "sweep_coins";
    const currentBalance = balance?.[fieldName] || 0;

    if (currentBalance < wagerAmount) {
      return res.status(400).json({ error: "Insufficient balance" });
    }

    // Generate session token and seeds
    const sessionToken = crypto.randomBytes(32).toString("hex");
    const serverSeed = crypto.randomBytes(32).toString("hex");

    // Deduct wager from balance
    const newBalance = currentBalance - wagerAmount;
    await supabase
      .from("user_balances")
      .update({ [fieldName]: newBalance })
      .eq("user_id", userId);

    // Record wager transaction
    await supabase.from("transactions").insert({
      user_id: userId,
      type: "wager",
      currency,
      amount: -wagerAmount,
      description: `Game wager - ${gameId}`,
      game_type: gameId,
      balance_before: currentBalance,
      balance_after: newBalance,
    });

    // Create game session
    const { data: session, error } = await supabase
      .from("game_sessions")
      .insert({
        user_id: userId,
        game_id: gameId,
        session_token: sessionToken,
        wager: wagerAmount,
        currency,
        status: "active",
        provably_fair_seed: serverSeed,
        nonce: 0,
      })
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({
      session: {
        id: session.id,
        sessionToken,
        serverSeed,
      },
      newBalance,
    });
  } catch (error) {
    console.error("Error creating game session:", error);
    res.status(500).json({ error: "Failed to create game session" });
  }
};

// End game session and process win
export const endGameSession: RequestHandler = async (req, res) => {
  try {
    const { sessionId, userId, winAmount, clientSeed } = req.body;

    if (!sessionId || !userId) {
      return res.status(400).json({
        error: "Missing required fields: sessionId, userId",
      });
    }

    // Get session
    const { data: session, error: sessionError } = await supabase
      .from("game_sessions")
      .select("*")
      .eq("id", sessionId)
      .single();

    if (sessionError) {
      return res.status(404).json({ error: "Session not found" });
    }

    if (session.status !== "active") {
      return res.status(400).json({ error: "Session is not active" });
    }

    // Update session
    await supabase
      .from("game_sessions")
      .update({
        status: "completed",
        end_time: new Date().toISOString(),
        win_amount: winAmount || 0,
        client_seed: clientSeed,
        nonce: (session.nonce || 0) + 1,
      })
      .eq("id", sessionId);

    // Process win if applicable
    if (winAmount && winAmount > 0) {
      const { data: balance } = await supabase
        .from("user_balances")
        .select(session.currency === "GC" ? "gold_coins" : "sweep_coins")
        .eq("user_id", userId)
        .single();

      const fieldName =
        session.currency === "GC" ? "gold_coins" : "sweep_coins";
      const currentBalance = balance?.[fieldName] || 0;
      const newBalance = currentBalance + winAmount;

      // Update balance
      await supabase
        .from("user_balances")
        .update({ [fieldName]: newBalance })
        .eq("user_id", userId);

      // Record win transaction
      await supabase.from("transactions").insert({
        user_id: userId,
        type: "win",
        currency: session.currency,
        amount: winAmount,
        description: `Game win`,
        game_type: session.game_id,
        balance_before: currentBalance,
        balance_after: newBalance,
      });
    }

    res.json({ success: true });
  } catch (error) {
    console.error("Error ending game session:", error);
    res.status(500).json({ error: "Failed to end game session" });
  }
};

// Validate game session
export const validateGameSession: RequestHandler = async (req, res) => {
  try {
    const { sessionToken } = req.body;

    if (!sessionToken) {
      return res.status(400).json({ error: "sessionToken is required" });
    }

    const { data: session, error } = await supabase
      .from("game_sessions")
      .select("*")
      .eq("session_token", sessionToken)
      .single();

    if (error) {
      return res.status(404).json({ error: "Session not found" });
    }

    const isValid = session.status === "active";

    res.json({ valid: isValid, session });
  } catch (error) {
    console.error("Error validating session:", error);
    res.status(500).json({ error: "Failed to validate session" });
  }
};
