import { getMonthlySchedules } from "@/lib/api/schedules";
import BigCalendar from "@/components/calendar/BigCalendar";

export default async function CalendarPage() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  const { data: initialSchedules, error } = await getMonthlySchedules(
    year,
    month
  );

  if (error) {
    console.error("Failed to load schedules:", error);
  }

  return <BigCalendar initialSchedules={initialSchedules || []} />;
}
