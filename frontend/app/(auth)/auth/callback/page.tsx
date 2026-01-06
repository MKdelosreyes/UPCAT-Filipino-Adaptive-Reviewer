"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function AuthCallback() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        console.log("🔄 Processing auth callback...");

        // Get the current URL hash/query params
        const hashParams = new URLSearchParams(
          window.location.hash.substring(1)
        );
        const queryParams = new URLSearchParams(window.location.search);

        // Check for error in URL
        const errorParam = hashParams.get("error") || queryParams.get("error");
        const errorDescription =
          hashParams.get("error_description") ||
          queryParams.get("error_description");

        if (errorParam) {
          console.error("❌ Auth error:", errorParam, errorDescription);
          setError(errorDescription || errorParam);
          setTimeout(() => router.push("/login"), 3000);
          return;
        }

        // Check for session
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) {
          console.error("❌ Session error:", sessionError);
          setError(sessionError.message);
          setTimeout(() => router.push("/login"), 3000);
          return;
        }

        if (session) {
          console.log("✅ Session found, redirecting to dashboard...");
          router.push("/dashboard");
        } else {
          console.log("⏳ Waiting for auth state change...");

          // Wait for auth state change
          const {
            data: { subscription },
          } = supabase.auth.onAuthStateChange((event, session) => {
            console.log("🔔 Auth state changed:", event);

            if (event === "SIGNED_IN" && session) {
              subscription.unsubscribe();
              console.log("✅ Signed in, redirecting...");
              router.push("/dashboard");
            } else if (event === "SIGNED_OUT") {
              subscription.unsubscribe();
              console.log("🚪 Signed out, redirecting to login...");
              router.push("/login");
            }
          });

          // Timeout after 10 seconds
          setTimeout(() => {
            subscription.unsubscribe();
            if (!session) {
              setError("Authentication timeout");
              router.push("/login");
            }
          }, 10000);
        }
      } catch (err) {
        console.error("❌ Callback error:", err);
        setError("Authentication failed");
        setTimeout(() => router.push("/login"), 3000);
      }
    };

    handleCallback();
  }, [router]);

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center max-w-md p-8">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-3">
            Authentication Failed
          </h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <p className="text-sm text-gray-500">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold text-gray-800 mb-2">
          Completing authentication...
        </h2>
        <p className="text-gray-600">Please wait</p>
      </div>
    </div>
  );
}
