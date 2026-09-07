import type { Metadata } from "next";
import { SettingsView } from "@/modules/settings/views/SettingsView";
export const metadata: Metadata = { title: "Settings" };
export default function SettingsPage() {
  return <SettingsView />;
}
