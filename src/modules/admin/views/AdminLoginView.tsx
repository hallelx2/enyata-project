"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

export function AdminLoginView() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Clear any existing session first
      await authClient.signOut();

      console.log("Attempting admin login for:", email);

      const { data, error: authError } = await authClient.signIn.email({
        email,
        password,
        callbackURL: "/admin",
      });

      if (authError) {
        console.error("Auth Error:", authError);
        setError(authError.message || "Invalid administrator credentials");
        setLoading(false);
      } else {
        console.log("Login successful, redirecting...");
        router.push("/admin");
      }
    } catch (err) {
      console.error("Unexpected error during login:", err);
      setError("An unexpected error occurred. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] flex flex-col items-center justify-center p-6 font-body">
      <div className="w-full max-w-[400px]">
        <div className="text-center mb-8">
          <h1 className="text-white font-headline text-3xl font-extrabold tracking-tighter mb-2">
            AuraHealth{" "}
            <span className="text-primary font-medium text-lg ml-1">Admin</span>
          </h1>
          <p className="text-slate-400 text-sm">
            Please enter your credentials to access the control panel.
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-lg shadow-2xl p-8">
          {error && (
            <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold rounded flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">error</span>
              {error}
            </div>
          )}

          <form className="space-y-6" onSubmit={handleLogin}>
            <div className="space-y-2">
              <label className="text-slate-300 text-xs font-bold uppercase tracking-widest ml-1">
                Admin Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-800 rounded py-3 px-4 text-white focus:outline-none focus:border-primary transition-colors font-mono text-sm"
                placeholder="admin@aurahealth.com"
              />
            </div>

            <div className="space-y-2">
              <label className="text-slate-300 text-xs font-bold uppercase tracking-widest ml-1">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded py-3 px-4 pr-10 text-white focus:outline-none focus:border-primary transition-colors font-mono text-sm"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  <span className="material-symbols-outlined text-lg">
                    {showPassword ? "visibility_off" : "visibility"}
                  </span>
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3 rounded transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-2"
            >
              {loading ? "Authenticating..." : "Login to Control Panel"}
              <span className="material-symbols-outlined text-sm">vpn_key</span>
            </button>
          </form>
        </div>

        <div className="mt-8 text-center">
          <a
            href="/"
            className="text-slate-500 text-xs font-bold uppercase tracking-widest hover:text-slate-300 transition-colors"
          >
            ← Back to Main Site
          </a>
        </div>
      </div>
    </div>
  );
}
