import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { auth } from "@/lib/auth";
import { LoginView } from "@/modules/auth/views/LoginView";

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

  return <LoginView />;
}

export default function LoginPage() {
  return (
    <Suspense>
      <AuthGuard />
    </Suspense>
  );
}
