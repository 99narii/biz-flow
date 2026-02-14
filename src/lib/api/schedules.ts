import { createClient } from "@/lib/supabase/server";
import type { ScheduleWithCategories } from "@/types/schedule";

// 월별 스케줄 조회 (서버용)
export async function getMonthlySchedules(
  year: number,
  month: number
): Promise<{ data: ScheduleWithCategories[] | null; error: string | null }> {
  try {
    const supabase = await createClient();

    // 해당 월의 시작일과 종료일
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const startDateStr = startDate.toISOString().split("T")[0];
    const endDateStr = endDate.toISOString().split("T")[0];

    const { data, error } = await supabase
      .from("schedules")
      .select(
        `
        *,
        schedule_category:schedule_categories(name, color),
        finance_category:finance_categories(name, type)
      `
      )
      .gte("schedule_date", startDateStr)
      .lte("schedule_date", endDateStr)
      .order("schedule_date", { ascending: true })
      .order("schedule_time", { ascending: true });

    if (error) {
      console.error("Failed to fetch schedules:", error);
      return { data: null, error: error.message };
    }

    return { data: data as ScheduleWithCategories[], error: null };
  } catch (err) {
    console.error("Unexpected error:", err);
    return { data: null, error: "스케줄을 불러오는데 실패했습니다." };
  }
}

// 날짜 범위로 스케줄 조회
export async function getSchedulesByDateRange(
  startDate: string,
  endDate: string
): Promise<{ data: ScheduleWithCategories[] | null; error: string | null }> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("schedules")
      .select(
        `
        *,
        schedule_category:schedule_categories(name, color),
        finance_category:finance_categories(name, type)
      `
      )
      .gte("schedule_date", startDate)
      .lte("schedule_date", endDate)
      .order("schedule_date", { ascending: true })
      .order("schedule_time", { ascending: true });

    if (error) {
      console.error("Failed to fetch schedules:", error);
      return { data: null, error: error.message };
    }

    return { data: data as ScheduleWithCategories[], error: null };
  } catch (err) {
    console.error("Unexpected error:", err);
    return { data: null, error: "스케줄을 불러오는데 실패했습니다." };
  }
}
