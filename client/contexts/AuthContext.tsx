import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { supabase } from "@/lib/supabase";

export interface User {
  id: string;
  email: string;
  name: string;
  isAdmin: boolean;
  verified: boolean;
  kycStatus: "pending" | "approved" | "rejected" | "not_submitted";
  kycDocuments?: {
    idDocument?: string;
    proofOfAddress?: string;
    selfie?: string;
  };
  createdAt: Date;
  lastLoginAt: Date;
  totalLosses: number;
  jackpotOptIn: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  confirmPassword: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (credentials: LoginCredentials) => Promise<boolean>;
  register: (data: RegisterData) => Promise<boolean>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<User>) => Promise<void>;
  updateKYCStatus: (status: User["kycStatus"]) => Promise<void>;
  updateJackpotOptIn: (optIn: boolean) => Promise<void>;
  addLoss: (amount: number) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const PROFILES_TABLE = "profiles";

function mapProfileRowToUser(row: any): User {
  return {
    id: row.id,
    email: row.email,
    name: row.name ?? "",
    isAdmin: !!row.is_admin,
    verified: !!row.verified,
    kycStatus: (row.kyc_status as User["kycStatus"]) ?? "not_submitted",
    kycDocuments: row.kyc_documents ?? undefined,
    createdAt: row.created_at ? new Date(row.created_at) : new Date(),
    lastLoginAt: row.last_login_at ? new Date(row.last_login_at) : new Date(),
    totalLosses: typeof row.total_losses === "number" ? row.total_losses : 0,
    jackpotOptIn: !!row.jackpot_opt_in,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!supabase) {
      setIsLoading(false);
      return;
    }

    const init = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user) {
        await loadAndSetProfile(session.user.id);
      }

      setIsLoading(false);
    };

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (session?.user) {
          await loadAndSetProfile(session.user.id);
        } else {
          setUser(null);
          localStorage.removeItem("coinkrazy_auth_user");
        }
      },
    );

    init();
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const loadAndSetProfile = async (userId: string) => {
    if (!supabase) return;

    const { data, error } = await supabase
      .from(PROFILES_TABLE)
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    if (error) {
      console.error("Error loading profile:", error);
      return;
    }

    if (data) {
      const mapped = mapProfileRowToUser(data);
      setUser(mapped);
      localStorage.setItem("coinkrazy_auth_user", JSON.stringify(mapped));
      // Update last login timestamp
      await supabase
        .from(PROFILES_TABLE)
        .update({ last_login_at: new Date().toISOString() })
        .eq("id", userId);
    }
  };

  const login = async (credentials: LoginCredentials): Promise<boolean> => {
    if (!supabase) return false;

    setIsLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email: credentials.email,
      password: credentials.password,
    });

    if (error || !data.session?.user) {
      setIsLoading(false);
      return false;
    }

    await loadAndSetProfile(data.session.user.id);
    setIsLoading(false);
    return true;
  };

  const register = async (data: RegisterData): Promise<boolean> => {
    if (!supabase) return false;

    setIsLoading(true);

    if (data.password !== data.confirmPassword) {
      setIsLoading(false);
      return false;
    }

    const { data: signUpRes, error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: { name: data.name },
      },
    });

    if (error || !signUpRes.user) {
      setIsLoading(false);
      return false;
    }

    const profilePayload = {
      id: signUpRes.user.id,
      email: data.email,
      name: data.name,
      is_admin: false,
      verified: false,
      kyc_status: "not_submitted",
      kyc_documents: null,
      created_at: new Date().toISOString(),
      last_login_at: new Date().toISOString(),
      total_losses: 0,
      jackpot_opt_in: false,
    };

    const { error: profileErr } = await supabase
      .from(PROFILES_TABLE)
      .insert(profilePayload);

    if (profileErr) {
      console.error("Error creating profile:", profileErr);
    }

    // If email confirmation is enabled, user may need to verify before session exists
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (session?.user) {
      await loadAndSetProfile(session.user.id);
    }

    setIsLoading(false);
    return true;
  };

  const logout = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    setUser(null);
    localStorage.removeItem("coinkrazy_auth_user");
    localStorage.removeItem("coinkrazy_user");
    localStorage.removeItem("coinkrazy_transactions");
  };

  const updateProfile = async (updates: Partial<User>) => {
    if (!user || !supabase) return;

    const updateRow: Record<string, any> = {};
    if (updates.name !== undefined) updateRow.name = updates.name;
    if (updates.verified !== undefined) updateRow.verified = updates.verified;
    if (updates.kycStatus !== undefined)
      updateRow.kyc_status = updates.kycStatus;
    if (updates.kycDocuments !== undefined)
      updateRow.kyc_documents = updates.kycDocuments;
    if (updates.totalLosses !== undefined)
      updateRow.total_losses = updates.totalLosses;
    if (updates.jackpotOptIn !== undefined)
      updateRow.jackpot_opt_in = updates.jackpotOptIn;

    if (Object.keys(updateRow).length === 0) return;

    const { error } = await supabase
      .from(PROFILES_TABLE)
      .update(updateRow)
      .eq("id", user.id);

    if (!error) {
      const updatedUser = { ...user, ...updates } as User;
      setUser(updatedUser);
      localStorage.setItem("coinkrazy_auth_user", JSON.stringify(updatedUser));
    } else {
      console.error("Error updating profile:", error);
    }
  };

  const updateKYCStatus = async (status: User["kycStatus"]) => {
    await updateProfile({ kycStatus: status });
  };

  const updateJackpotOptIn = async (optIn: boolean) => {
    await updateProfile({ jackpotOptIn: optIn });
  };

  const addLoss = async (amount: number) => {
    if (!user) return;
    const newLoss = user.totalLosses + amount;
    await updateProfile({ totalLosses: newLoss });
  };

  const contextValue: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    isAdmin: user?.isAdmin || false,
    login,
    register,
    logout,
    updateProfile,
    updateKYCStatus,
    updateJackpotOptIn,
    addLoss,
  };

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const getAllUsers = async (): Promise<
  (User & { password?: never })[]
> => {
  if (!supabase) return [];

  const { data, error } = await supabase.from(PROFILES_TABLE).select("*");
  if (error) {
    console.error("Error fetching users:", error);
    return [];
  }
  return (data ?? []).map(mapProfileRowToUser);
};
