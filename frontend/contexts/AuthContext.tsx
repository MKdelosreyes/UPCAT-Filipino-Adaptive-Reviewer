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

interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  avatar_url?: string;
  email_confirmed: boolean;
}

interface AuthTokens {
  access: string;
  refresh: string;
}

interface AuthContextType {
  user: User | null;
  supabaseUser: SupabaseUser | null;
  tokens: AuthTokens | null;
  logout: () => Promise<void>;
  isLoading: boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null);
  const [tokens, setTokens] = useState<AuthTokens | null>(null);
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
    // ✅ FIX: getSession() only returns session, get user from session.user
    const {
      data: { session },
    } = await supabase.auth.getSession();

    const sbUser = session?.user || null;

    setSupabaseUser(sbUser);
    setUser(mapSupabaseUser(sbUser));

    if (session) {
      setTokens({
        access: session.access_token,
        refresh: session.refresh_token,
      });
    } else {
      setTokens(null);
    }
  };

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      const sbUser = session?.user || null;

      setSupabaseUser(sbUser);
      setUser(mapSupabaseUser(sbUser));

      if (session) {
        const tokens = {
          access: session.access_token,
          refresh: session.refresh_token,
        };
        setTokens(tokens);
        localStorage.setItem("tokens", JSON.stringify(tokens));
      } else {
        setTokens(null);
        localStorage.removeItem("tokens");
      }

      setIsLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const sbUser = session?.user || null;

      setSupabaseUser(sbUser);
      setUser(mapSupabaseUser(sbUser));

      if (session) {
        setTokens({
          access: session.access_token,
          refresh: session.refresh_token,
        });
      } else {
        setTokens(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSupabaseUser(null);
    setTokens(null);
    localStorage.removeItem("tokens");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        supabaseUser,
        tokens,
        logout,
        isLoading,
        refreshUser,
      }}
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
