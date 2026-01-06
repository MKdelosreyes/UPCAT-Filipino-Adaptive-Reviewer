import { supabase } from "@/lib/supabase";

export interface SignUpData {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
}

// Helper to get correct redirect URL
const getRedirectURL = () => {
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/auth/callback`;
  }

  return process.env.NEXT_PUBLIC_SITE_URL 
    ? `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`
    : 'http://localhost:3000/auth/callback';
};

// Email/Password Sign Up
export async function signUp(data: SignUpData) {
  const { data: authData, error } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
    options: {
      data: {
        first_name: data.first_name || "",
        last_name: data.last_name || "",
      },
      emailRedirectTo: getRedirectURL(),
    },
  });

  if (error) throw error;
  return authData;
}

// Email/Password Sign In
export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;
  return data;
}

// Google Sign In
export async function signInWithGoogle() {
  const redirectURL = getRedirectURL();
  
  console.log('🔗 OAuth Redirect URL:', redirectURL); 
  
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: redirectURL, 
      queryParams: {
        access_type: "offline",
        prompt: "consent",
      },
    },
  });

  if (error) throw error;
  return data;
}

// Resend confirmation email
export async function resendConfirmationEmail(email: string) {
  const { error } = await supabase.auth.resend({
    type: "signup",
    email,
  });

  if (error) throw error;
}

// Sign Out
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}