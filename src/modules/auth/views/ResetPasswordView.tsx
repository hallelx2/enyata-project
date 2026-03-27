"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { AuthLayout } from "../components/AuthLayout";

export function ResetPasswordView() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }
    setLoading(true);
    const { error } = await authClient.resetPassword({
      newPassword: password,
    });
    setLoading(false);
    if (error) {
      alert(error.message);
    } else {
      alert("Password updated successfully");
      router.push("/login");
    }
  };

  return (
    <AuthLayout>
      <div className="flex flex-col gap-2">
        <span className="font-headline text-2xl font-bold tracking-tighter text-on-surface">
          AuraHealth
        </span>
        <h2 className="font-headline text-4xl font-extrabold tracking-tight text-on-surface">
          Set New Password
        </h2>
        <p className="text-on-surface-variant text-base">
          Please enter and confirm your new password below.
        </p>
      </div>

      <form className="space-y-6" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-on-surface-variant ml-1">
            New Password
          </label>
          <div className="relative">
            <input
              className="w-full bg-surface-container-high border-none rounded-xl py-4 px-6 pr-12 focus:ring-2 focus:ring-primary-fixed text-on-surface placeholder:text-outline-variant/60 transition-all"
              placeholder="••••••••"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-on-surface-variant ml-1">
            Confirm Password
          </label>
          <div className="relative">
            <input
              className="w-full bg-surface-container-high border-none rounded-xl py-4 px-6 pr-12 focus:ring-2 focus:ring-primary-fixed text-on-surface placeholder:text-outline-variant/60 transition-all"
              placeholder="••••••••"
              type={showConfirmPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword((v) => !v)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-outline-variant hover:text-on-surface transition-colors"
              aria-label={showConfirmPassword ? "Hide password" : "Show password"}
            >
              <span className="material-symbols-outlined text-xl">
                {showConfirmPassword ? "visibility_off" : "visibility"}
              </span>
            </button>
          </div>
        </div>

        <button
          className="w-full py-4 aura-gradient-bg text-white font-bold rounded-xl shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50"
          type="submit"
          disabled={loading}
        >
          {loading ? "Updating..." : "Update Password"}
          {!loading && (
            <span className="material-symbols-outlined text-xl">
              lock_reset
            </span>
          )}
        </button>
      </form>
    </AuthLayout>
  );
}
