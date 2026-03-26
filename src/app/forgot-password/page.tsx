import { Suspense } from "react";
import { ForgotPasswordView } from "@/modules/auth/views/ForgotPasswordView";

export default async function ForgotPasswordPage() {
  "use cache";
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ForgotPasswordView />
    </Suspense>
  );
}
