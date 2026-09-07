import type { Metadata } from "next";

import { ResetPasswordView } from "@/modules/authentication/views/ResetPasswordView";

export const metadata: Metadata = {
  title: "Reset password",
  description: "Choose a new password for your MeetLoop account.",
};
export default function ResetPasswordPage() {
  return <ResetPasswordView />;
}
