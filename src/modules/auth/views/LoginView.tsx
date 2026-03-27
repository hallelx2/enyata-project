"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { signIn } from "@/lib/auth-client";
import { AuthLayout } from "../components/AuthLayout";

export function LoginView() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { data, error } = await signIn.email({
      email,
      password,
      callbackURL: "/",
    });
    setLoading(false);
    if (error) {
      alert(error.message);
    } else {
      router.push("/");
    }
  };

  return (
    <AuthLayout>
      <div className="flex flex-col gap-2">
        <span className="font-headline text-2xl font-bold tracking-tighter text-on-surface">
          AuraHealth
        </span>
        <h2 className="font-headline text-4xl font-extrabold tracking-tight text-on-surface">
          Welcome Back
        </h2>
        <p className="text-on-surface-variant text-base">
          Log in to access your healthcare portal.
        </p>
      </div>

      <form className="space-y-6" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <label
            htmlFor="email"
            className="block text-sm font-semibold text-on-surface-variant ml-1"
          >
            Email Address
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@example.com"
            className="w-full bg-surface-container-high border-none rounded-xl py-4 px-6 focus:ring-2 focus:ring-primary-fixed text-on-surface placeholder:text-outline-variant/60 transition-all font-body"
            required
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between mb-2">
            <label
              htmlFor="password"
              className="block text-sm font-semibold text-on-surface-variant ml-1"
            >
              Password
            </label>
            <Link
              href="/forgot-password"
              className="text-sm font-semibold text-primary hover:opacity-80 transition-all font-headline"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-surface-container-high border-none rounded-xl py-4 px-6 pr-12 focus:ring-2 focus:ring-primary-fixed text-on-surface placeholder:text-outline-variant/60 transition-all font-body"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-outline-variant hover:text-on-surface transition-colors"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              <span className="material-symbols-outlined text-xl">
                {showPassword ? "visibility_off" : "visibility"}
              </span>
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 aura-gradient-bg text-white font-bold rounded-xl shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {loading ? "Signing In..." : "Sign In"}
          {!loading && (
            <span className="material-symbols-outlined text-xl">login</span>
          )}
        </button>
      </form>

      <div className="space-y-4">
        <p className="text-center text-sm text-on-surface-variant">
          Don&apos;t have an account?{" "}
          <Link
            href="/signup"
            className="text-primary font-bold hover:underline underline-offset-4"
          >
            Create an account
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}
