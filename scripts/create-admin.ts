/**
 * Create or reset the AuraHealth admin account.
 *
 * Usage:
 *   bun run scripts/create-admin.ts
 *
 * This script:
 *   1. Creates an admin via the Better Auth signup API (no-op if one exists)
 *   2. Confirms the account to the console
 *
 * Credentials come from the environment — never hardcode them, this repo is public:
 *   ADMIN_EMAIL=admin@aurahealth.ng ADMIN_PASSWORD='...' bun run scripts/create-admin.ts
 */

const BASE_URL = process.env.BETTER_AUTH_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const ADMIN_NAME = process.env.ADMIN_NAME ?? "AuraHealth Admin";

async function main() {
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    console.error(
      "ADMIN_EMAIL and ADMIN_PASSWORD must be set in the environment.\n" +
        "Example: ADMIN_EMAIL=admin@aurahealth.ng ADMIN_PASSWORD='...' bun run scripts/create-admin.ts",
    );
    process.exit(1);
  }

  console.log("Creating admin account...\n");

  // Use the Better Auth sign-up API endpoint directly
  const res = await fetch(`${BASE_URL}/api/auth/sign-up/email`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      name: ADMIN_NAME,
      role: "admin",
      isApproved: true,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    // If user already exists, that's fine
    if (text.includes("already") || text.includes("exists") || text.includes("UNIQUE")) {
      console.log("Admin account already exists. Credentials:");
    } else {
      console.error("Failed to create admin:", res.status, text);
      process.exit(1);
    }
  } else {
    console.log("Admin account created successfully!");
  }

  console.log(`\n  Email:    ${ADMIN_EMAIL}`);
  console.log("  Password: (the ADMIN_PASSWORD you supplied)");
  console.log("  Login at: /admin/login\n");
}

main().catch(console.error);
