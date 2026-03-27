import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { auth } from "@/lib/auth";
import { SignupView } from "@/modules/auth/views/SignupView";

export const unstable_instant = { prefetch: "static" };

async function AuthGuard() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (session?.user) {
    if (session.user.role === "hospital") {
      redirect(session.user.isApproved ? "/dashboard/hospital" : "/pending");
    }
    if (session.user.role === "admin") {
      redirect("/admin");
    }
    redirect("/dashboard/patient");
  }

  return <SignupView />;
}

export default function SignupPage() {
  return (
    <Suspense>
      <AuthGuard />
    </Suspense>
  );
}
