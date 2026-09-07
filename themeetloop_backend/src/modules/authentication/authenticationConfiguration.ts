import { betterAuth } from "better-auth";

import { environmentVariables } from "../../configuration/environmentVariablesConfiguration.js";
import { postgresqlConnectionPool } from "../../infrastructure/database/postgresqlConnectionPool.js";
import { sendAuthenticationEmail } from "../../infrastructure/email/authenticationEmailService.js";

export const auth = betterAuth({
  appName: "MeetLoop",
  baseURL: environmentVariables.BETTER_AUTH_URL,
  secret: environmentVariables.BETTER_AUTH_SECRET,
  database: postgresqlConnectionPool,
  // A previous hook stamped `emailVerified: true` on every new account, which meant anyone
  // could register an address they did not control and have it recorded as verified. The
  // flag is now earned by clicking the emailed link. Sign-in is deliberately NOT gated on it
  // (`requireEmailVerification` stays false) so no existing account is locked out; the flag
  // is simply honest, and can be enforced once every active user has verified.
  trustedOrigins: [environmentVariables.FRONTEND_URL],
  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    expiresIn: 60 * 60 * 24,
    sendVerificationEmail: async ({ user, url }) => {
      void sendAuthenticationEmail({
        recipientEmailAddress: user.email,
        subject: "Confirm your MeetLoop email address",
        heading: "Confirm your email address",
        message:
          "Confirm this address so MeetLoop can be sure the account belongs to you. This link expires in 24 hours.",
        actionLabel: "Confirm email address",
        actionUrl: url,
      }).catch(() => {
        console.error("Authentication verification email delivery failed");
      });
    },
  },
  advanced: {
    database: { joins: true },
    useSecureCookies: environmentVariables.NODE_ENV === "production",
  },
  session: { expiresIn: 60 * 60 * 24 * 30, updateAge: 60 * 60 * 24 },
  emailAndPassword: {
    enabled: true,
    disableSignUp: false,
    requireEmailVerification: false,
    autoSignIn: true,
    minPasswordLength: 8,
    maxPasswordLength: 128,
    resetPasswordTokenExpiresIn: 60 * 60,
    revokeSessionsOnPasswordReset: true,
    sendResetPassword: async ({ user, url }) => {
      void sendAuthenticationEmail({
        recipientEmailAddress: user.email,
        subject: "Reset your MeetLoop password",
        heading: "Reset your password",
        message:
          "Use the secure link below to choose a new MeetLoop password. This link expires in one hour.",
        actionLabel: "Reset password",
        actionUrl: url,
      }).catch(() => {
        console.error("Authentication password-reset email delivery failed");
      });
    },
  },
});
