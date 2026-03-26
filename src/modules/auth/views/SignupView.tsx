"use client";

import { useState } from "react";
import Link from "next/link";
import { AuthLayout } from "../components/AuthLayout";

export function SignupView() {
  const [activeTab, setActiveTab] = useState<"patient" | "hospital">("patient");

  return (
    <AuthLayout>
      <div className="flex flex-col gap-2">
        <span className="font-headline text-2xl font-bold tracking-tighter text-on-surface">
          AuraHealth
        </span>
        <h2 className="font-headline text-4xl font-extrabold tracking-tight text-on-surface">
          Join the Network
        </h2>
        <p className="text-on-surface-variant text-base">
          Select your account type to create an account.
        </p>
      </div>

      <div className="bg-surface-container-low p-1.5 rounded-full flex relative">
        <button
          onClick={() => setActiveTab("patient")}
          className={`flex-1 py-3 text-sm font-bold rounded-full transition-all duration-300 z-10 ${activeTab === "patient" ? "bg-surface-container-lowest text-primary shadow-sm" : "text-on-surface-variant hover:text-on-surface"}`}
        >
          Patient
        </button>
        <button
          onClick={() => setActiveTab("hospital")}
          className={`flex-1 py-3 text-sm font-bold rounded-full transition-all duration-300 z-10 ${activeTab === "hospital" ? "bg-surface-container-lowest text-primary shadow-sm" : "text-on-surface-variant hover:text-on-surface"}`}
        >
          Hospital
        </button>
      </div>

      <form className="space-y-6">
        {activeTab === "patient" && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-on-surface-variant ml-1">
                Full Name
              </label>
              <input
                className="w-full bg-surface-container-high border-none rounded-xl py-4 px-6 focus:ring-2 focus:ring-primary-fixed text-on-surface placeholder:text-outline-variant/60 transition-all"
                placeholder="Jane Doe"
                type="text"
              />
            </div>
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
            <div className="space-y-2">
              <label className="text-sm font-semibold text-on-surface-variant ml-1">
                Create Password
              </label>
              <input
                className="w-full bg-surface-container-high border-none rounded-xl py-4 px-6 focus:ring-2 focus:ring-primary-fixed text-on-surface placeholder:text-outline-variant/60 transition-all"
                placeholder="••••••••"
                type="password"
              />
            </div>
          </div>
        )}

        {activeTab === "hospital" && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-on-surface-variant ml-1">
                Hospital Name
              </label>
              <input
                className="w-full bg-surface-container-high border-none rounded-xl py-4 px-6 focus:ring-2 focus:ring-primary-fixed text-on-surface placeholder:text-outline-variant/60 transition-all"
                placeholder="General Medical Center"
                type="text"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-on-surface-variant ml-1">
                Contact Email
              </label>
              <input
                className="w-full bg-surface-container-high border-none rounded-xl py-4 px-6 focus:ring-2 focus:ring-primary-fixed text-on-surface placeholder:text-outline-variant/60 transition-all"
                placeholder="partnership@hospital.org"
                type="email"
              />
            </div>
          </div>
        )}

        <button
          className="w-full py-4 aura-gradient-bg text-white font-bold rounded-xl shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-2"
          type="button"
        >
          Create Account
          <span className="material-symbols-outlined text-xl">
            arrow_forward
          </span>
        </button>

        <div className="flex items-center gap-4 py-2">
          <div className="h-[1px] flex-1 bg-outline-variant/30"></div>
          <span className="text-xs font-bold text-outline-variant uppercase tracking-widest">
            Or Use Escrow Direct
          </span>
          <div className="h-[1px] flex-1 bg-outline-variant/30"></div>
        </div>

        <button
          className="w-full py-4 border border-outline-variant/20 bg-surface-container-lowest text-on-surface font-bold rounded-xl hover:bg-surface-container-low transition-all flex items-center justify-center gap-3"
          type="button"
        >
          <div className="w-6 h-6 bg-secondary/10 rounded flex items-center justify-center">
            <span
              className="material-symbols-outlined text-secondary text-sm"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              payments
            </span>
          </div>
          Auth with Interswitch API
        </button>
      </form>

      <p className="text-center text-sm text-on-surface-variant">
        Already have an account?{" "}
        <Link
          className="text-primary font-bold hover:underline underline-offset-4"
          href="/login"
        >
          Sign in here
        </Link>
      </p>
    </AuthLayout>
  );
}
