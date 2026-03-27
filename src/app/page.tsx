import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { auth } from "@/lib/auth";
import { LandingView } from "@/modules/landing/views/LandingView";

// { prefetch: 'static' } — instant navigation to the landing page.
// Runtime data (cookies) is pushed into AuthGuard, inside <Suspense>,
// so the static shell can still be prerendered. (AGENTS.md pattern)
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

  return <LandingView />;
}

export default function Page() {
  return (
    <Suspense>
      <AuthGuard />
    </Suspense>
  );
}
