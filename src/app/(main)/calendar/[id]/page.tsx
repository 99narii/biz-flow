import ScheduleDetail from "@/components/schedule/ScheduleDetail";

interface ScheduleDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function ScheduleDetailPage({ params }: ScheduleDetailPageProps) {
  const { id } = await params;
  return <ScheduleDetail scheduleId={id} />;
}
