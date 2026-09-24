import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { admin } from "better-auth/plugins";
import { db } from "./db";

export const auth = betterAuth({
  database: prismaAdapter(db, {
    provider: "postgresql",
  }),

  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
  },

  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // Update session every 24 hours
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5, // 5 minutes
    },
  },

  user: {
    additionalFields: {
      role: {
        type: "string",
        required: false,
        defaultValue: "CUSTOMER",
        input: false, // Don't allow setting role during registration
      },
    },
  },

  // Built-in rate limiting (per IP). Production: on by default; development: off (set enabled: true to test).
  rateLimit: {
    window: 60,
    max: 100,
    // In-memory counters: the app runs as one long-lived process on the VPS. "database" storage
    // wrote a row on every page view (the header checks the session on each load), which grew the
    // rateLimit table past 80,000 rows. Counters reset on restart; if the app is ever scaled to
    // several processes or serverless, switch to shared storage (e.g. Redis via secondaryStorage).
    storage: "memory",
    customRules: {
      "/sign-in/email": { window: 10, max: 3 },
      "/sign-up/email": { window: 60, max: 5 },
    },
  },

  plugins: [
    nextCookies(),
    admin({
      adminRoles: ["ADMIN"],
      defaultRole: "CUSTOMER",
    }),
  ],

  trustedOrigins: [
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  ],
});

// Export auth types
export type Session = typeof auth.$Infer.Session;
export type User = typeof auth.$Infer.Session.user;
