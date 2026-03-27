"use client";

import { useRef, useState, useEffect } from "react";
import { useLogout } from "@/lib/use-logout";

interface ProfileMenuProps {
  name: string;
  email: string;
  userRole: string;
}

const roleLabel: Record<string, string> = {
  patient: "Patient",
  hospital: "Hospital Admin",
  admin: "System Admin",
};

export function ProfileMenu({ name, email, userRole: role }: ProfileMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const logout = useLogout();

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const initials = name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 hover:bg-primary/5 px-2 py-1 rounded-xl transition-all"
        aria-label="Profile menu"
      >
        <div className="h-9 w-9 rounded-full aura-gradient-bg flex items-center justify-center ring-2 ring-white shadow-sm">
          <span className="text-white text-xs font-extrabold tracking-wide">
            {initials}
          </span>
        </div>
        <span className="hidden md:block text-sm font-semibold text-on-surface max-w-[120px] truncate">
          {name}
        </span>
        <span className="material-symbols-outlined text-slate-400 text-sm">
          expand_more
        </span>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl shadow-xl border border-outline-variant/10 overflow-hidden z-50">
          {/* User Info Header */}
          <div className="px-5 py-4 bg-surface-container-low border-b border-outline-variant/10">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full aura-gradient-bg flex items-center justify-center shrink-0">
                <span className="text-white text-sm font-extrabold">
                  {initials}
                </span>
              </div>
              <div className="min-w-0">
                <p className="font-bold text-sm text-on-surface truncate">
                  {name}
                </p>
                <p className="text-xs text-on-surface-variant truncate">
                  {email}
                </p>
                <span className="inline-block mt-1 px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-bold rounded-full uppercase tracking-widest">
                  {roleLabel[role] ?? role}
                </span>
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <div className="py-2">
            <button
              type="button"
              className="w-full flex items-center gap-3 px-5 py-3 text-sm text-on-surface hover:bg-surface-container-low transition-colors text-left"
            >
              <span className="material-symbols-outlined text-slate-400 text-lg">
                account_circle
              </span>
              View Profile
            </button>
            <button
              type="button"
              className="w-full flex items-center gap-3 px-5 py-3 text-sm text-on-surface hover:bg-surface-container-low transition-colors text-left"
            >
              <span className="material-symbols-outlined text-slate-400 text-lg">
                settings
              </span>
              Settings
            </button>
          </div>

          <div className="border-t border-outline-variant/10 py-2">
            <button
              type="button"
              onClick={logout}
              className="w-full flex items-center gap-3 px-5 py-3 text-sm text-error hover:bg-error/5 transition-colors text-left font-semibold"
            >
              <span className="material-symbols-outlined text-lg">logout</span>
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
