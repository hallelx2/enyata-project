import { Suspense } from "react";
import { SignupView } from "@/modules/auth/views/SignupView";

export default async function SignupPage() {
  "use cache";
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SignupView />
    </Suspense>
  );
}
