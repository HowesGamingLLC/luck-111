import { RequestHandler } from "express";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || "",
  process.env.VITE_SUPABASE_ANON_KEY || "",
);

// Get user transactions
export const getUserTransactions: RequestHandler = async (req, res) => {
  try {
    const userId = req.query.userId as string;
    const limit = parseInt(req.query.limit as string) || 100;

    if (!userId) {
      return res.status(400).json({ error: "userId is required" });
    }

    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ transactions: data });
  } catch (error) {
    console.error("Error fetching transactions:", error);
    res.status(500).json({ error: "Failed to fetch transactions" });
  }
};

// Get user balance
export const getUserBalance: RequestHandler = async (req, res) => {
  try {
    const userId = req.query.userId as string;

    if (!userId) {
      return res.status(400).json({ error: "userId is required" });
    }

    const { data, error } = await supabase
      .from("user_balances")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (error && error.code !== "PGRST116") {
      return res.status(400).json({ error: error.message });
    }

    // If no balance record exists, create one
    if (!data) {
      const { data: newBalance, error: createError } = await supabase
        .from("user_balances")
        .insert({
          user_id: userId,
          gold_coins: 10000,
          sweep_coins: 10,
          bonus_coins: 0,
        })
        .select()
        .single();

      if (createError) {
        return res.status(400).json({ error: createError.message });
      }

      return res.json({
        balance: {
          goldCoins: newBalance.gold_coins,
          sweepCoins: newBalance.sweep_coins,
          bonusCoins: newBalance.bonus_coins,
        },
      });
    }

    res.json({
      balance: {
        goldCoins: data.gold_coins,
        sweepCoins: data.sweep_coins,
        bonusCoins: data.bonus_coins,
      },
    });
  } catch (error) {
    console.error("Error fetching balance:", error);
    res.status(500).json({ error: "Failed to fetch balance" });
  }
};

// Record transaction
export const recordTransaction: RequestHandler = async (req, res) => {
  try {
    const { userId, type, currency, amount, description, gameType } = req.body;

    if (!userId || !type || !currency || amount === undefined) {
      return res.status(400).json({
        error: "Missing required fields: userId, type, currency, amount",
      });
    }

    // Get current balance
    const { data: balance } = await supabase
      .from("user_balances")
      .select(currency === "GC" ? "gold_coins" : "sweep_coins")
      .eq("user_id", userId)
      .single();

    const currentBalance = balance?.[currency === "GC" ? "gold_coins" : "sweep_coins"] || 0;
    const newBalance = Math.max(0, currentBalance + amount);

    // Update balance
    const field = currency === "GC" ? "gold_coins" : "sweep_coins";
    await supabase
      .from("user_balances")
      .update({ [field]: newBalance })
      .eq("user_id", userId);

    // Record transaction
    const { data, error } = await supabase
      .from("transactions")
      .insert({
        user_id: userId,
        type,
        currency,
        amount,
        description,
        game_type: gameType,
        balance_before: currentBalance,
        balance_after: newBalance,
      })
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({
      transaction: data,
      newBalance,
    });
  } catch (error) {
    console.error("Error recording transaction:", error);
    res.status(500).json({ error: "Failed to record transaction" });
  }
};
