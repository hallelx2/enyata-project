import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "./db";
import * as schema from "./db/schema";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: schema.user,
      session: schema.session,
      account: schema.account,
      verification: schema.verification,
      userRelations: schema.userRelations,
      sessionRelations: schema.sessionRelations,
      accountRelations: schema.accountRelations,
    },
  }),
  emailAndPassword: {
    enabled: true,
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: true,
        defaultValue: "patient",
        input: true,
      },
      phoneNumber: {
        type: "string",
        required: false,
        input: true,
      },
      isApproved: {
        type: "boolean",
        required: true,
        defaultValue: true,
        input: true,
      },
    },
  },
});
