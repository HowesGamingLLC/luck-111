import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from "react";
import { supabase } from "@/lib/supabase";
import { useAuthSafe } from "./AuthContext";

export enum CurrencyType {
  GC = "GC", // Gold Coins (fun play)
  SC = "SC", // Sweep Coins (real money)
}

export interface UserBalance {
  goldCoins: number;
  sweepCoins: number;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  balance: UserBalance;
  isNewUser: boolean;
  lastDailySpinClaim: Date | null;
  totalWagered: {
    goldCoins: number;
    sweepCoins: number;
  };
  totalWon: {
    goldCoins: number;
    sweepCoins: number;
  };
  verified: boolean;
  level: number;
}

export interface Transaction {
  id: string;
  type: "win" | "wager" | "bonus" | "deposit" | "withdrawal";
  currency: CurrencyType;
  amount: number;
  description: string;
  timestamp: Date;
  gameType?: string;
}

interface CurrencyContextType {
  user: UserProfile | null;
  selectedCurrency: CurrencyType;
  setSelectedCurrency: (currency: CurrencyType) => void;
  updateBalance: (
    currency: CurrencyType,
    amount: number,
    description: string,
    type?: "win" | "wager" | "bonus",
  ) => Promise<void>;
  canAffordWager: (currency: CurrencyType, amount: number) => boolean;
  addTransaction: (
    transaction: Omit<Transaction, "id" | "timestamp">,
  ) => Promise<void>;
  getTransactionHistory: () => Transaction[];
  claimWelcomeBonus: () => Promise<void>;
  canClaimDailySpin: () => boolean;
  claimDailySpin: () => Promise<void>;
  initializeUser: (userData: Partial<UserProfile>) => void;
  isLoading: boolean;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(
  undefined,
);

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const authContext = useAuthSafe();
  const authUser = authContext?.user || null;

  const [user, setUser] = useState<UserProfile | null>(null);
  const [selectedCurrency, setSelectedCurrency] = useState<CurrencyType>(
    CurrencyType.GC,
  );
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load user balance and transactions from Supabase
  const loadUserData = useCallback(async () => {
    if (!authUser || !supabase) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);

      // Fetch user balance
      const { data: balanceData, error: balanceError } = await supabase
        .from("user_balances")
        .select("*")
        .eq("user_id", authUser.id)
        .single();

      if (balanceError && balanceError.code !== "PGRST116") {
        console.error("Error loading balance:", balanceError);
      }

      // Fetch transactions
      const { data: transactionData, error: transError } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", authUser.id)
        .order("created_at", { ascending: false })
        .limit(100);

      if (transError) {
        console.error("Error loading transactions:", transError);
      }

      // Build user profile
      const profile: UserProfile = {
        id: authUser.id,
        email: authUser.email,
        name: authUser.name || "",
        balance: {
          goldCoins: balanceData?.gold_coins || 0,
          sweepCoins: balanceData?.sweep_coins || 0,
        },
        isNewUser: !balanceData?.gold_coins,
        lastDailySpinClaim: authUser.lastDailySpinClaim || null,
        totalWagered: authUser.totalWagered || { goldCoins: 0, sweepCoins: 0 },
        totalWon: authUser.totalWon || { goldCoins: 0, sweepCoins: 0 },
        verified: authUser.verified || false,
        level: authUser.level || 1,
      };

      setUser(profile);

      // Convert transactions
      const mappedTransactions: Transaction[] = (transactionData || []).map(
        (t: any) => ({
          id: t.id,
          type: t.type,
          currency: t.currency,
          amount: t.amount,
          description: t.description,
          timestamp: new Date(t.created_at),
          gameType: t.game_type,
        }),
      );

      setTransactions(mappedTransactions);
    } catch (error) {
      console.error("Error loading user data:", error);
    } finally {
      setIsLoading(false);
    }
  }, [authUser]);

  // Load data when auth user changes
  useEffect(() => {
    loadUserData();
  }, [loadUserData]);

  // Create or update user balance
  const ensureUserBalance = useCallback(async (userId: string) => {
    if (!supabase) return;

    const { data: existing } = await supabase
      .from("user_balances")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (!existing) {
      await supabase.from("user_balances").insert({
        user_id: userId,
        gold_coins: 10000, // Welcome bonus
        sweep_coins: 10,
        bonus_coins: 0,
      });
    }
  }, []);

  const updateBalance = useCallback(
    async (
      currency: CurrencyType,
      amount: number,
      description: string,
      type: "win" | "wager" | "bonus" = "win",
    ) => {
      if (!authUser || !supabase || !user) return;

      try {
        const field =
          currency === CurrencyType.GC ? "gold_coins" : "sweep_coins";

        // Update balance in database
        const { data: currentBalance } = await supabase
          .from("user_balances")
          .select(field)
          .eq("user_id", authUser.id)
          .single();

        const newBalance = Math.max(0, (currentBalance?.[field] || 0) + amount);

        await supabase
          .from("user_balances")
          .update({ [field]: newBalance })
          .eq("user_id", authUser.id);

        // Record transaction
        await supabase.from("transactions").insert({
          user_id: authUser.id,
          type,
          currency,
          amount,
          description,
          balance_before: currentBalance?.[field] || 0,
          balance_after: newBalance,
        });

        // Update local state
        setUser((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            balance: {
              ...prev.balance,
              [currency === CurrencyType.GC ? "goldCoins" : "sweepCoins"]:
                newBalance,
            },
          };
        });

        // Reload transactions
        await loadUserData();
      } catch (error) {
        console.error("Error updating balance:", error);
      }
    },
    [authUser, user, loadUserData],
  );

  const canAffordWager = (currency: CurrencyType, amount: number): boolean => {
    if (!user) return false;

    if (currency === CurrencyType.GC) {
      return user.balance.goldCoins >= amount;
    } else {
      return user.balance.sweepCoins >= amount;
    }
  };

  const addTransaction = useCallback(
    async (transaction: Omit<Transaction, "id" | "timestamp">) => {
      if (!authUser || !supabase) return;

      try {
        const { data } = await supabase.from("transactions").insert({
          user_id: authUser.id,
          type: transaction.type,
          currency: transaction.currency,
          amount: transaction.amount,
          description: transaction.description,
          game_type: transaction.gameType,
        });

        // Reload transactions
        await loadUserData();
      } catch (error) {
        console.error("Error adding transaction:", error);
      }
    },
    [authUser, loadUserData],
  );

  const getTransactionHistory = (): Transaction[] => {
    return transactions;
  };

  const claimWelcomeBonus = useCallback(async () => {
    if (!user || !user.isNewUser || !authUser || !supabase) return;

    try {
      // Update to non-new-user status (handled in auth context)
      // Add welcome bonus
      await updateBalance(
        CurrencyType.GC,
        10000,
        "Welcome Bonus - Gold Coins",
        "bonus",
      );
      await updateBalance(
        CurrencyType.SC,
        10,
        "Welcome Bonus - Sweep Coins",
        "bonus",
      );
    } catch (error) {
      console.error("Error claiming welcome bonus:", error);
    }
  }, [user, authUser, updateBalance]);

  const canClaimDailySpin = (): boolean => {
    if (!user) return false;

    if (!user.lastDailySpinClaim) return true;

    const now = new Date();
    const lastClaim = new Date(user.lastDailySpinClaim);
    const timeDiff = now.getTime() - lastClaim.getTime();
    const hoursDiff = timeDiff / (1000 * 3600);

    return hoursDiff >= 24;
  };

  const claimDailySpin = useCallback(async () => {
    if (!user || !canClaimDailySpin() || !authUser || !supabase) return;

    try {
      // Update last daily spin claim in profiles table
      await supabase
        .from("profiles")
        .update({ last_daily_spin_claim: new Date().toISOString() })
        .eq("id", authUser.id);

      setUser((prev) => {
        if (!prev) return prev;
        return { ...prev, lastDailySpinClaim: new Date() };
      });
    } catch (error) {
      console.error("Error claiming daily spin:", error);
    }
  }, [user, authUser, canClaimDailySpin]);

  const initializeUser = (userData: Partial<UserProfile>) => {
    if (!user) {
      setUser({
        id: userData.id || "",
        email: userData.email || "",
        name: userData.name || "",
        balance: userData.balance || { goldCoins: 0, sweepCoins: 0 },
        isNewUser: userData.isNewUser !== false,
        lastDailySpinClaim: userData.lastDailySpinClaim || null,
        totalWagered: userData.totalWagered || { goldCoins: 0, sweepCoins: 0 },
        totalWon: userData.totalWon || { goldCoins: 0, sweepCoins: 0 },
        verified: userData.verified || false,
        level: userData.level || 1,
      });
    } else {
      setUser((prev) => (prev ? { ...prev, ...userData } : null));
    }
  };

  const contextValue: CurrencyContextType = {
    user,
    selectedCurrency,
    setSelectedCurrency,
    updateBalance,
    canAffordWager,
    addTransaction,
    getTransactionHistory,
    claimWelcomeBonus,
    canClaimDailySpin,
    claimDailySpin,
    initializeUser,
    isLoading,
  };

  return (
    <CurrencyContext.Provider value={contextValue}>
      {children}
    </CurrencyContext.Provider>
  );
}

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error("useCurrency must be used within a CurrencyProvider");
  }
  return context;
};

// Safe version of useCurrency that returns null if not available
export const useCurrencySafe = () => {
  const context = useContext(CurrencyContext);
  return context;
};

// Utility functions
export const formatCurrency = (
  amount: number,
  currency: CurrencyType,
): string => {
  const formatted = amount.toLocaleString(undefined, {
    minimumFractionDigits: currency === CurrencyType.SC ? 2 : 0,
    maximumFractionDigits: currency === CurrencyType.SC ? 2 : 0,
  });

  return `${formatted} ${currency}`;
};

export const getCurrencyColor = (currency: CurrencyType): string => {
  return currency === CurrencyType.GC ? "text-gold" : "text-teal";
};

export const getCurrencyIcon = (currency: CurrencyType): string => {
  return currency === CurrencyType.GC ? "🪙" : "💎";
};
