import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useAuthSafe } from "@/contexts/AuthContext";
import { useCurrency, CurrencyType } from "@/contexts/CurrencyContext";

export interface JackpotData {
  id: string;
  name: string;
  amount: number;
  maxAmount: number;
  lastWon: Date | null;
  contributionPerSpin: number;
  winFrequency: string;
  color: string;
  isHot: boolean;
}

interface JackpotWin {
  id: string;
  userId: string;
  amount: number;
  type: string;
  timestamp: Date;
}

interface JackpotContextType {
  jackpots: JackpotData[];
  isOptedIn: boolean;
  totalContributed: number;
  recentWins: JackpotWin[];
  toggleOptIn: () => void;
  contributeToJackpot: (currencyType: CurrencyType) => void;
  checkJackpotEligibility: (
    combination: string[],
    theme: string,
  ) => string | null;
  triggerJackpotWin: (jackpotId: string) => JackpotWin | null;
  getJackpotProgress: (jackpot: JackpotData) => number;
}

const JackpotContext = createContext<JackpotContextType | undefined>(undefined);

// Initial jackpot data with 500 SC max cap and starting from 0
const initialJackpots: JackpotData[] = [
  {
    id: "mega",
    name: "Mega Jackpot",
    amount: 347.25,
    maxAmount: 500,
    lastWon: new Date("2024-01-15"),
    contributionPerSpin: 0.01,
    winFrequency: "Weekly",
    color: "text-red-500",
    isHot: true,
  },
  {
    id: "major",
    name: "Major Jackpot",
    amount: 234.8,
    maxAmount: 250,
    lastWon: new Date("2024-01-18"),
    contributionPerSpin: 0.01,
    winFrequency: "3-4 days",
    color: "text-purple-500",
    isHot: false,
  },
  {
    id: "minor",
    name: "Minor Jackpot",
    amount: 87.45,
    maxAmount: 100,
    lastWon: new Date("2024-01-20"),
    contributionPerSpin: 0.01,
    winFrequency: "Daily",
    color: "text-gold",
    isHot: true,
  },
  {
    id: "mini",
    name: "Mini Jackpot",
    amount: 23.9,
    maxAmount: 50,
    lastWon: new Date("2024-01-21"),
    contributionPerSpin: 0.01,
    winFrequency: "Few hours",
    color: "text-teal",
    isHot: false,
  },
];

export function JackpotProvider({ children }: { children: ReactNode }) {
  const authContext = useAuthSafe();
  const { updateBalance } = useCurrency();

  // Use safe values when context isn't available
  const user = authContext?.user || null;
  const updateJackpotOptIn = authContext?.updateJackpotOptIn || (() => {});

  const [jackpots, setJackpots] = useState<JackpotData[]>(initialJackpots);
  const [totalContributed, setTotalContributed] = useState(0);
  const [recentWins, setRecentWins] = useState<JackpotWin[]>([
    {
      id: "win_1",
      userId: "user_999",
      amount: 45.8,
      type: "Mini Jackpot",
      timestamp: new Date("2024-01-21T14:30:00"),
    },
    {
      id: "win_2",
      userId: "user_888",
      amount: 98.5,
      type: "Minor Jackpot",
      timestamp: new Date("2024-01-20T09:15:00"),
    },
    {
      id: "win_3",
      userId: "user_777",
      amount: 247.3,
      type: "Major Jackpot",
      timestamp: new Date("2024-01-18T16:45:00"),
    },
  ]);

  const isOptedIn = user?.jackpotOptIn || false;

  // Simulate jackpot growth from other players
  useEffect(() => {
    const interval = setInterval(() => {
      setJackpots((prevJackpots) =>
        prevJackpots.map((jackpot) => {
          // Simulate contributions from other opted-in players
          const randomContribution = Math.random() * 0.05; // 0-0.05 SC from other players
          const newAmount = Math.min(
            jackpot.amount + randomContribution,
            jackpot.maxAmount,
          );

          return {
            ...jackpot,
            amount: newAmount,
            isHot: newAmount > jackpot.maxAmount * 0.8, // Mark as hot when 80%+ of max
          };
        }),
      );
    }, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, []);

  // Load user contribution total from localStorage
  useEffect(() => {
    if (user) {
      const savedContributions = localStorage.getItem(
        `jackpot_contributions_${user.id}`,
      );
      if (savedContributions) {
        setTotalContributed(parseFloat(savedContributions));
      }
    }
  }, [user]);

  // Save contribution total to localStorage
  useEffect(() => {
    if (user && totalContributed > 0) {
      localStorage.setItem(
        `jackpot_contributions_${user.id}`,
        totalContributed.toString(),
      );
    }
  }, [user, totalContributed]);

  const toggleOptIn = () => {
    if (user) {
      updateJackpotOptIn(!user.jackpotOptIn);
    }
  };

  const contributeToJackpot = (currencyType: CurrencyType) => {
    if (!isOptedIn || currencyType !== CurrencyType.SC) {
      return; // Only SC contributions count for real money jackpots
    }

    const contributionAmount = 0.01; // 1 cent per spin

    // Distribute contribution across jackpots based on their current fill percentage
    setJackpots((prevJackpots) =>
      prevJackpots.map((jackpot) => {
        const fillPercentage = jackpot.amount / jackpot.maxAmount;
        const weight = 1 - fillPercentage; // Lower fill = higher weight
        const contribution = contributionAmount * (weight / 4); // Divide among 4 jackpots

        return {
          ...jackpot,
          amount: Math.min(jackpot.amount + contribution, jackpot.maxAmount),
        };
      }),
    );

    setTotalContributed((prev) => prev + contributionAmount);
  };

  const checkJackpotEligibility = (
    combination: string[],
    theme: string,
  ): string | null => {
    if (!isOptedIn) return null; // Must be opted in to win jackpots

    // Define jackpot symbols
    const jackpotSymbols = ["🎰", "👸", "💰", "⭐", "✨", "🔱", "💎", "7️⃣"];

    // Check for matching jackpot symbols
    const hasJackpotSymbol = combination.some((symbol) =>
      jackpotSymbols.includes(symbol),
    );

    if (!hasJackpotSymbol) return null;

    // Count consecutive matching symbols
    let maxConsecutive = 1;
    let currentConsecutive = 1;

    for (let i = 1; i < combination.length; i++) {
      if (
        combination[i] === combination[i - 1] &&
        jackpotSymbols.includes(combination[i])
      ) {
        currentConsecutive++;
        maxConsecutive = Math.max(maxConsecutive, currentConsecutive);
      } else {
        currentConsecutive = 1;
      }
    }

    // Determine jackpot type based on consecutive matches and probability
    const random = Math.random();

    if (maxConsecutive >= 5 && random < 0.001) return "mega"; // 0.1% chance
    if (maxConsecutive >= 4 && random < 0.005) return "major"; // 0.5% chance
    if (maxConsecutive >= 3 && random < 0.02) return "minor"; // 2% chance
    if (maxConsecutive >= 2 && random < 0.05) return "mini"; // 5% chance

    return null;
  };

  const triggerJackpotWin = (jackpotId: string): JackpotWin | null => {
    if (!user || !isOptedIn) return null;

    const jackpot = jackpots.find((j) => j.id === jackpotId);
    if (!jackpot) return null;

    const winAmount = jackpot.amount;

    // Reset jackpot to 0 and restart growth
    setJackpots((prevJackpots) =>
      prevJackpots.map((j) =>
        j.id === jackpotId
          ? { ...j, amount: 0, lastWon: new Date(), isHot: false }
          : j,
      ),
    );

    // Add winnings to user balance
    updateBalance(CurrencyType.SC, winAmount, `${jackpot.name} Win`, "win");

    // Create win record
    const win: JackpotWin = {
      id: `win_${Date.now()}`,
      userId: user.id,
      amount: winAmount,
      type: jackpot.name,
      timestamp: new Date(),
    };

    // Add to recent wins
    setRecentWins((prev) => [win, ...prev.slice(0, 9)]); // Keep last 10 wins

    return win;
  };

  const getJackpotProgress = (jackpot: JackpotData): number => {
    return (jackpot.amount / jackpot.maxAmount) * 100;
  };

  const contextValue: JackpotContextType = {
    jackpots,
    isOptedIn,
    totalContributed,
    recentWins,
    toggleOptIn,
    contributeToJackpot,
    checkJackpotEligibility,
    triggerJackpotWin,
    getJackpotProgress,
  };

  return (
    <JackpotContext.Provider value={contextValue}>
      {children}
    </JackpotContext.Provider>
  );
}

export const useJackpot = () => {
  const context = useContext(JackpotContext);
  if (context === undefined) {
    throw new Error("useJackpot must be used within a JackpotProvider");
  }
  return context;
};
