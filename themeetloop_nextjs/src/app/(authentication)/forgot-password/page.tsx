import type { Metadata } from "next";

import { ForgotPasswordView } from "@/modules/authentication/views/ForgotPasswordView";

export const metadata: Metadata = {
  title: "Forgot password",
  description: "Request a secure MeetLoop password reset link.",
};
export default function ForgotPasswordPage() {
  return <ForgotPasswordView />;
}
