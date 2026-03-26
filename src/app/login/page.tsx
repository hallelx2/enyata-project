import { Suspense } from "react";
import { LoginView } from "@/modules/auth/views/LoginView";

export default async function LoginPage() {
  "use cache";
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginView />
    </Suspense>
  );
}
