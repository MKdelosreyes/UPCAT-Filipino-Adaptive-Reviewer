"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { User as SupabaseUser } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  avatar_url?: string;
  email_confirmed: boolean;
}

interface AuthContextType {
  user: User | null;
  supabaseUser: SupabaseUser | null;
  logout: () => Promise<void>;
  isLoading: boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const mapSupabaseUser = (sbUser: SupabaseUser | null): User | null => {
    if (!sbUser) return null;

    const metadata = sbUser.user_metadata || {};
    return {
      id: sbUser.id,
      email: sbUser.email!,
      first_name:
        metadata.first_name || metadata.full_name?.split(" ")[0] || "",
      last_name:
        metadata.last_name ||
        metadata.full_name?.split(" ").slice(1).join(" ") ||
        "",
      avatar_url: metadata.avatar_url || sbUser.user_metadata?.picture,
      email_confirmed: sbUser.email_confirmed_at !== null,
    };
  };

  const refreshUser = async () => {
    const {
      data: { user: sbUser },
    } = await supabase.auth.getUser();
    setSupabaseUser(sbUser);
    setUser(mapSupabaseUser(sbUser));
  };

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSupabaseUser(session?.user || null);
      setUser(mapSupabaseUser(session?.user || null));
      setIsLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSupabaseUser(session?.user || null);
      setUser(mapSupabaseUser(session?.user || null));
    });

    return () => subscription.unsubscribe();
  }, []);

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSupabaseUser(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, supabaseUser, logout, isLoading, refreshUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
