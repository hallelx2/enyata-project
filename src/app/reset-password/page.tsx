import { Suspense } from "react";
import { ResetPasswordView } from "@/modules/auth/views/ResetPasswordView";

export default async function ResetPasswordPage() {
  "use cache";
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ResetPasswordView />
    </Suspense>
  );
}
