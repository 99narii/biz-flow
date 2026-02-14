import ScheduleEditForm from "@/components/schedule/ScheduleEditForm";

interface EditSchedulePageProps {
  params: Promise<{ id: string }>;
}

export default async function EditSchedulePage({ params }: EditSchedulePageProps) {
  const { id } = await params;
  return <ScheduleEditForm scheduleId={id} />;
}
