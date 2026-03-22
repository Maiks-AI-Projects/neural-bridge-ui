"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, ShieldCheck, ShieldX } from "lucide-react";

function TokenLoginHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function handleLogin() {
      if (!token) {
        setError("Invalid link: No token found.");
        return;
      }

      try {
        const response = await fetch(`/api/auth/token-login?token=${token}`);
        if (response.ok) {
          router.push("/app");
        } else {
          const data = await response.json();
          setError(data.error || "Login failed. Please try again.");
        }
      } catch (err) {
        console.error("Login error:", err);
        setError("An error occurred during login.");
      }
    }

    handleLogin();
  }, [token, router]);

  return (
    <main className="min-h-screen bg-black flex flex-col items-center justify-center p-6 text-center">
      {!error ? (
        <div className="space-y-6">
          <div className="relative">
            <div className="w-24 h-24 bg-blue-500/10 rounded-full flex items-center justify-center animate-pulse">
              <ShieldCheck className="text-blue-500 w-12 h-12" />
            </div>
            <Loader2 className="absolute top-0 right-0 w-8 h-8 text-blue-500 animate-spin" />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tighter italic">AUTHENTICATING...</h1>
          <p className="text-zinc-400 font-medium max-w-xs mx-auto">
            Verifying your bridge connection. Please wait while we secure your session.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="w-24 h-24 bg-red-500/10 rounded-full flex items-center justify-center mx-auto">
            <ShieldX className="text-red-500 w-12 h-12" />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tighter italic">ACCESS DENIED</h1>
          <p className="text-red-400 font-medium max-w-xs mx-auto">
            {error}
          </p>
          <button 
            onClick={() => router.push("/")}
            className="mt-4 px-8 py-3 bg-zinc-800 text-white rounded-2xl font-bold active:scale-95 transition-all"
          >
            Back to Home
          </button>
        </div>
      )}
    </main>
  );
}

export default function MagicLinkPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-black flex flex-col items-center justify-center p-6 text-center">
        <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
      </main>
    }>
      <TokenLoginHandler />
    </Suspense>
  );
}
