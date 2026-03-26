"use client";

import { AuthLayout } from "../components/AuthLayout";

export function ResetPasswordView() {
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

      <form className="space-y-6">
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-on-surface-variant ml-1">
            New Password
          </label>
          <input
            className="w-full bg-surface-container-high border-none rounded-xl py-4 px-6 focus:ring-2 focus:ring-primary-fixed text-on-surface placeholder:text-outline-variant/60 transition-all"
            placeholder="••••••••"
            type="password"
          />
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-on-surface-variant ml-1">
            Confirm Password
          </label>
          <input
            className="w-full bg-surface-container-high border-none rounded-xl py-4 px-6 focus:ring-2 focus:ring-primary-fixed text-on-surface placeholder:text-outline-variant/60 transition-all"
            placeholder="••••••••"
            type="password"
          />
        </div>

        <button
          className="w-full py-4 aura-gradient-bg text-white font-bold rounded-xl shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-2"
          type="button"
        >
          Update Password
          <span className="material-symbols-outlined text-xl">lock_reset</span>
        </button>
      </form>
    </AuthLayout>
  );
}
