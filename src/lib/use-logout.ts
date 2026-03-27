"use client";

import { useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "./auth-client";

const CHANNEL = "aura-auth";

/**
 * Sets up a BroadcastChannel listener so that when any tab calls logout(),
 * ALL open tabs are redirected to /login automatically.
 *
 * Returns a `logout` function to call from UI buttons.
 */
export function useLogout() {
  const router = useRouter();

  // Listen for logout events from other tabs
  useEffect(() => {
    const ch = new BroadcastChannel(CHANNEL);
    ch.onmessage = (e: MessageEvent<{ type: string }>) => {
      if (e.data?.type === "logout") {
        router.push("/login");
        router.refresh();
      }
    };
    return () => ch.close();
  }, [router]);

  // Call this from the logout button
  const logout = useCallback(async () => {
    // Notify all other tabs first
    const ch = new BroadcastChannel(CHANNEL);
    ch.postMessage({ type: "logout" });
    ch.close();

    await signOut();
    router.push("/login");
    router.refresh();
  }, [router]);

  return logout;
}
