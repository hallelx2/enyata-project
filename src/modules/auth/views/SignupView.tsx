"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { signUp } from "@/lib/auth-client";
import { AuthLayout } from "../components/AuthLayout";

export function SignupView() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [role, setRole] = useState<"patient" | "hospital">("patient");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Hospitals need approval, patients are auto-approved
    const isApproved = role === "patient";

    const { data, error } = await signUp.email({
      email,
      password,
      name,
      phoneNumber,
      isApproved,
      role,
      callbackURL: "/",
    });

    setLoading(false);
    if (error) {
      alert(error.message);
    } else {
      if (role === "hospital") {
        alert(
          "Registration successful! Your hospital account is pending review by our administrators.",
        );
        router.push("/login");
      } else {
        router.push("/");
      }
    }
  };

  return (
    <AuthLayout>
      <div className="flex flex-col gap-2">
        <span className="font-headline text-2xl font-bold tracking-tighter text-on-surface">
          AuraHealth
        </span>
        <h2 className="font-headline text-4xl font-extrabold tracking-tight text-on-surface">
          Get Protected
        </h2>
        <p className="text-on-surface-variant text-base">
          {role === "patient"
            ? "Join thousands of patients and get instant care."
            : "Partner with us to provide zero-friction emergency care."}
        </p>
      </div>

      <form className="space-y-6" onSubmit={handleSubmit}>
        <div className="space-y-3">
          <label className="block text-sm font-semibold text-on-surface-variant ml-1">
            I am a...
          </label>
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setRole("patient")}
              className={`py-3 rounded-xl border font-headline font-bold transition-all ${
                role === "patient"
                  ? "aura-gradient-bg text-white border-transparent shadow-md"
                  : "bg-surface-container-high text-on-surface-variant border-transparent hover:bg-surface-container-highest"
              }`}
            >
              Patient
            </button>
            <button
              type="button"
              onClick={() => setRole("hospital")}
              className={`py-3 rounded-xl border font-headline font-bold transition-all ${
                role === "hospital"
                  ? "aura-gradient-bg text-white border-transparent shadow-md"
                  : "bg-surface-container-high text-on-surface-variant border-transparent hover:bg-surface-container-highest"
              }`}
            >
              Hospital
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <label
            htmlFor="full-name"
            className="block text-sm font-semibold text-on-surface-variant ml-1"
          >
            {role === "patient" ? "Full Name" : "Hospital Name"}
          </label>
          <input
            type="text"
            id="full-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={role === "patient" ? "John Doe" : "St. Jude Medical"}
            className="w-full bg-surface-container-high border-none rounded-xl py-4 px-6 focus:ring-2 focus:ring-primary-fixed text-on-surface placeholder:text-outline-variant/60 transition-all font-body"
            required
          />
        </div>

        <div className="space-y-2">
          <label
            htmlFor="email"
            className="block text-sm font-semibold text-on-surface-variant ml-1"
          >
            {role === "patient" ? "Email Address" : "Contact Email"}
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

        {role === "hospital" && (
          <div className="space-y-2">
            <label
              htmlFor="phone"
              className="block text-sm font-semibold text-on-surface-variant ml-1"
            >
              Phone Number
            </label>
            <input
              type="tel"
              id="phone"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="+234..."
              className="w-full bg-surface-container-high border-none rounded-xl py-4 px-6 focus:ring-2 focus:ring-primary-fixed text-on-surface placeholder:text-outline-variant/60 transition-all font-body"
              required
            />
          </div>
        )}

        <div className="space-y-2">
          <label
            htmlFor="password"
            className="block text-sm font-semibold text-on-surface-variant ml-1"
          >
            Password
          </label>
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
          {loading ? "Creating Account..." : "Create Account"}
          {!loading && (
            <span className="material-symbols-outlined text-xl">
              arrow_forward
            </span>
          )}
        </button>
      </form>

      <div className="space-y-4">
        <p className="text-center text-sm text-on-surface-variant">
          Already have an account?{" "}
          <Link
            href="/login"
            className="text-primary font-bold hover:underline underline-offset-4"
          >
            Sign In
          </Link>
        </p>

        <p className="text-center text-[10px] text-on-surface-variant/60 leading-relaxed font-body px-4">
          By creating an account, you agree to our{" "}
          <Link href="/terms" className="underline font-semibold">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="underline font-semibold">
            Privacy Policy
          </Link>
          .
        </p>
      </div>
    </AuthLayout>
  );
}
