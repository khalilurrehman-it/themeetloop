import type { Metadata } from "next";
import { MeetingsListView } from "@/modules/meetings/views/MeetingsListView";
export const metadata: Metadata = { title: "Meetings" };
export default function MeetingsPage() {
  return <MeetingsListView />;
}
