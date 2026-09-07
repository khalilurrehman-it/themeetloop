import type { Metadata } from "next";

import { DashboardView } from "@/modules/dashboard/views/DashboardView";

export const metadata: Metadata = { title: "Dashboard", description: "Your MeetLoop workspace." };
export default function DashboardPage() {
  return <DashboardView />;
}
