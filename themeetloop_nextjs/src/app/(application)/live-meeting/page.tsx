import type { Metadata } from "next";
import { LiveMeetingView } from "@/modules/meetings/views/LiveMeetingView";
export const metadata: Metadata = { title: "Live meeting" };
export default function LiveMeetingPage() {
  return <LiveMeetingView />;
}
