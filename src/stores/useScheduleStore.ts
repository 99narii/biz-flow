import { create } from "zustand";
import { createClient } from "@/lib/supabase/client";
import type {
  ScheduleWithCategories,
  CalendarEvent,
  FinanceType,
} from "@/types/schedule";

interface ScheduleState {
  schedules: ScheduleWithCategories[];
  events: CalendarEvent[];
  loading: boolean;
  error: string | null;
  currentYear: number;
  currentMonth: number;

  // Actions
  setSchedules: (schedules: ScheduleWithCategories[]) => void;
  setCurrentDate: (year: number, month: number) => void;
  fetchSchedules: (year: number, month: number) => Promise<void>;
  addSchedule: (schedule: ScheduleWithCategories) => void;
  updateSchedule: (schedule: ScheduleWithCategories) => void;
  removeSchedule: (id: string) => void;
}

// 시간 + 제목 + 금액 포맷 todo : 포멧 함수 분리 필요
function formatEventTitle(schedule: ScheduleWithCategories): string {
  const time = schedule.schedule_time?.slice(0, 5) || ""; // HH:mm
  let title = time ? `${time} ${schedule.title}` : schedule.title;

  if (schedule.has_finance && schedule.amount) {
    const formattedAmount = new Intl.NumberFormat("ko-KR").format(schedule.amount);
    const prefix = schedule.finance_type === "income" ? "+" : "-";
    title += ` ${prefix}${formattedAmount}원`;
  }

  return title;
}

// 스케줄을 캘린더 이벤트로 변환
function scheduleToEvent(schedule: ScheduleWithCategories): CalendarEvent {
  const time = schedule.schedule_time || "00:00";
  const [hours, minutes] = time.split(":").map(Number);
  const startDate = new Date(schedule.schedule_date);
  startDate.setHours(hours, minutes, 0, 0);

  const endDate = new Date(startDate);
  endDate.setHours(hours + 1, minutes, 0, 0);

  return {
    id: schedule.id,
    title: formatEventTitle(schedule),
    start: startDate,
    end: endDate,
    allDay: false,
    resource: {
      schedule,
      color: schedule.schedule_category?.color || "#6366F1",
      amount: schedule.amount,
      financeType: schedule.finance_type as FinanceType | null,
    },
  };
}

export const useScheduleStore = create<ScheduleState>((set, get) => ({
  schedules: [],
  events: [],
  loading: false,
  error: null,
  currentYear: new Date().getFullYear(),
  currentMonth: new Date().getMonth() + 1,

  setSchedules: (schedules) => {
    const events = schedules.map(scheduleToEvent);
    set({ schedules, events, error: null });
  },

  setCurrentDate: (year, month) => {
    set({ currentYear: year, currentMonth: month });
  },

  fetchSchedules: async (year, month) => {
    set({ loading: true, error: null });

    try {
      const supabase = createClient();

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
        set({ error: error.message, loading: false });
        return;
      }

      const schedules = data as ScheduleWithCategories[];
      const events = schedules.map(scheduleToEvent);

      set({
        schedules,
        events,
        loading: false,
        currentYear: year,
        currentMonth: month,
      });
    } catch (err) {
      set({ error: "스케줄을 불러오는데 실패했습니다.", loading: false });
    }
  },

  addSchedule: (schedule) => {
    const { schedules, currentYear, currentMonth } = get();

    // 현재 월 범위 확인
    const scheduleDate = new Date(schedule.schedule_date);
    const scheduleYear = scheduleDate.getFullYear();
    const scheduleMonth = scheduleDate.getMonth() + 1;

    // 현재 보고 있는 월과 같은 경우에만 추가
    if (scheduleYear === currentYear && scheduleMonth === currentMonth) {
      const newSchedules = [...schedules, schedule].sort((a, b) => {
        const dateCompare = a.schedule_date.localeCompare(b.schedule_date);
        if (dateCompare !== 0) return dateCompare;
        const aTime = a.schedule_time || "00:00";
        const bTime = b.schedule_time || "00:00";
        return aTime.localeCompare(bTime);
      });
      const events = newSchedules.map(scheduleToEvent);
      set({ schedules: newSchedules, events });
    }
  },

  updateSchedule: (schedule) => {
    const { schedules, currentYear, currentMonth } = get();

    // 현재 월 범위 확인
    const scheduleDate = new Date(schedule.schedule_date);
    const scheduleYear = scheduleDate.getFullYear();
    const scheduleMonth = scheduleDate.getMonth() + 1;
    const isInCurrentMonth = scheduleYear === currentYear && scheduleMonth === currentMonth;

    // 기존 스케줄 찾기
    const existingSchedule = schedules.find(s => s.id === schedule.id);

    let newSchedules: ScheduleWithCategories[];

    if (existingSchedule) {
      if (isInCurrentMonth) {
        // 현재 월에 있는 스케줄 업데이트
        newSchedules = schedules
          .map((s) => (s.id === schedule.id ? schedule : s))
          .sort((a, b) => {
            const dateCompare = a.schedule_date.localeCompare(b.schedule_date);
            if (dateCompare !== 0) return dateCompare;
            const aTime = a.schedule_time || "00:00";
            const bTime = b.schedule_time || "00:00";
            return aTime.localeCompare(bTime);
          });
      } else {
        // 날짜가 다른 월로 변경된 경우 현재 목록에서 제거
        newSchedules = schedules.filter(s => s.id !== schedule.id);
      }
    } else if (isInCurrentMonth) {
      // 새로 현재 월로 들어온 경우 추가
      newSchedules = [...schedules, schedule].sort((a, b) => {
        const dateCompare = a.schedule_date.localeCompare(b.schedule_date);
        if (dateCompare !== 0) return dateCompare;
        const aTime = a.schedule_time || "00:00";
        const bTime = b.schedule_time || "00:00";
        return aTime.localeCompare(bTime);
      });
    } else {
      // 현재 월과 관련 없음
      return;
    }

    const events = newSchedules.map(scheduleToEvent);
    set({ schedules: newSchedules, events });
  },

  removeSchedule: (id) => {
    const { schedules } = get();
    const newSchedules = schedules.filter((s) => s.id !== id);
    const events = newSchedules.map(scheduleToEvent);
    set({ schedules: newSchedules, events });
  },
}));
