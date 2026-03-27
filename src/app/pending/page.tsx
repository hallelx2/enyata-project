import Link from "next/link";
import { AuthLayout } from "@/modules/auth/components/AuthLayout";

export default async function PendingApprovalPage() {
  "use cache";
  return (
    <AuthLayout>
      <div className="flex flex-col gap-2">
        <span className="font-headline text-2xl font-bold tracking-tighter text-on-surface">
          AuraHealth
        </span>
        <h2 className="font-headline text-4xl font-extrabold tracking-tight text-on-surface">
          Account Pending Review
        </h2>
        <p className="text-on-surface-variant text-base leading-relaxed mt-4">
          Thank you for registering as a hospital partner. Our administrative
          team is currently reviewing your application.
        </p>
        <p className="text-on-surface-variant text-base leading-relaxed mb-6">
          You will receive an email notification once your account is approved
          and you can begin integrating your EMR systems.
        </p>

        <Link
          href="/"
          className="w-full py-4 aura-gradient-bg text-white font-bold rounded-xl shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-2 mt-4 text-center"
        >
          Return to Homepage
          <span className="material-symbols-outlined text-xl">home</span>
        </Link>
      </div>
    </AuthLayout>
  );
}
