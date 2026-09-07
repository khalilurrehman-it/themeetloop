import { MeetingDetailView } from "@/modules/meeting-details/views/MeetingDetailView";
export default async function MeetingDetailPage({
  params,
}: {
  params: Promise<{ meetingId: string }>;
}) {
  const { meetingId } = await params;
  return <MeetingDetailView meetingId={meetingId} />;
}
