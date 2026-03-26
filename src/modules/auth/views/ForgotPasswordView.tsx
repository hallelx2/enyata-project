"use client";

import Link from "next/link";
import { AuthLayout } from "../components/AuthLayout";

export function ForgotPasswordView() {
  return (
    <AuthLayout>
      <div className="flex flex-col gap-2">
        <span className="font-headline text-2xl font-bold tracking-tighter text-on-surface">
          AuraHealth
        </span>
        <h2 className="font-headline text-4xl font-extrabold tracking-tight text-on-surface">
          Recover Access
        </h2>
        <p className="text-on-surface-variant text-base">
          Enter your email address and we&apos;ll send you a link to reset your
          password.
        </p>
      </div>

      <form className="space-y-6">
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-on-surface-variant ml-1">
            Email Address
          </label>
          <input
            className="w-full bg-surface-container-high border-none rounded-xl py-4 px-6 focus:ring-2 focus:ring-primary-fixed text-on-surface placeholder:text-outline-variant/60 transition-all"
            placeholder="name@example.com"
            type="email"
          />
        </div>

        <button
          className="w-full py-4 aura-gradient-bg text-white font-bold rounded-xl shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-2"
          type="button"
        >
          Send Reset Link
          <span className="material-symbols-outlined text-xl">
            mark_email_read
          </span>
        </button>
      </form>

      <p className="text-center text-sm text-on-surface-variant">
        Remembered your password?{" "}
        <Link
          className="text-primary font-bold hover:underline underline-offset-4"
          href="/login"
        >
          Return to login
        </Link>
      </p>
    </AuthLayout>
  );
}
