import Link from "next/link";
import { AuraLogo } from "@/components/AuraLogo";

export function Header() {
  return (
    <header className="fixed top-0 w-full z-50 bg-white/60 dark:bg-slate-950/60 backdrop-blur-xl shadow-sm dark:shadow-none">
      <nav className="flex justify-between items-center w-full px-6 py-4 max-w-7xl mx-auto">
        <AuraLogo
          className="w-8 h-8 dark:text-slate-50"
          withText
          textClassName="text-2xl"
        />
        <div className="hidden md:flex items-center gap-8">
          <Link
            className="text-blue-700 dark:text-blue-400 font-bold border-b-2 border-blue-700 dark:border-blue-400 pb-1 font-headline"
            href="#"
          >
            For Patients
          </Link>
          <Link
            className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors font-headline font-semibold tracking-tight"
            href="#"
          >
            For Hospitals
          </Link>
          <Link
            className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors font-headline font-semibold tracking-tight"
            href="#"
          >
            Solutions
          </Link>
          <Link
            className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors font-headline font-semibold tracking-tight"
            href="#"
          >
            About Us
          </Link>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/login"
            className="hidden sm:block text-slate-600 dark:text-slate-400 hover:opacity-80 transition-all font-headline font-semibold"
          >
            Login
          </Link>
          <Link
            href="/signup"
            className="aura-gradient-bg text-on-primary px-6 py-2.5 rounded-full font-headline font-bold scale-95 active:scale-90 transition-transform shadow-lg shadow-primary/20"
          >
            Get Started
          </Link>
        </div>
      </nav>
    </header>
  );
}
