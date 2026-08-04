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
        <AuraLogo className="w-8 h-8" withText textClassName="text-xl" />

        <div className="flex items-center gap-3">
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
