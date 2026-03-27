import { AuraLogo } from "@/components/AuraLogo";
import { ProfileMenu } from "./ProfileMenu";

interface DashboardNavProps {
  user: {
    name: string;
    email: string;
    role: string;
  };
}

export function DashboardNav({ user }: DashboardNavProps) {
  return (
    <nav className="bg-white/95 backdrop-blur-xl border-b border-slate-100 z-50 sticky top-0">
      <div className="flex justify-between items-center w-full px-6 py-4 max-w-screen-2xl mx-auto">
        <div className="flex items-center gap-8">
          <AuraLogo className="w-8 h-8" withText textClassName="text-xl" />
          <div className="hidden md:flex items-center gap-6">
            <span className="text-primary font-semibold border-b-2 border-primary font-headline">
              Dashboard
            </span>
            <button type="button" className="text-slate-500 hover:bg-primary/5 px-3 py-1 rounded-lg transition-all font-headline">
              Patient Flow
            </button>
            <button type="button" className="text-slate-500 hover:bg-primary/5 px-3 py-1 rounded-lg transition-all font-headline">
              Resources
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center bg-primary/5 px-4 py-2 rounded-full border border-primary/20">
            <span
              className="material-symbols-outlined text-primary text-sm mr-2"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              security
            </span>
            <span className="text-xs font-bold text-primary tracking-widest uppercase">
              Active Escrow
            </span>
          </div>
          <button
            type="button"
            className="material-symbols-outlined text-slate-500 hover:bg-primary/5 p-2 rounded-full transition-all"
          >
            notifications
          </button>
          <ProfileMenu
            name={user.name}
            email={user.email}
            userRole={user.role}
          />
        </div>
      </div>
    </nav>
  );
}
