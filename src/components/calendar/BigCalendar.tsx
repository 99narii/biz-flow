"use client";

import { useEffect, useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import { format, parse, startOfWeek, getDay, addMonths, subMonths } from "date-fns";
import { ko } from "date-fns/locale";
import { useScheduleStore } from "@/stores/useScheduleStore";
import { useSwipe } from "@/hooks/useSwipe";
import CalendarToolbar from "./CalendarToolbar";
import type { CalendarEvent, ScheduleWithCategories } from "@/types/schedule";
import "react-big-calendar/lib/css/react-big-calendar.css";
import styles from "./BigCalendar.module.scss";

const locales = { ko };

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 0 }),
  getDay,
  locales,
});

const messages = {
  today: "오늘",
  previous: "이전",
  next: "다음",
  month: "월",
  week: "주",
  day: "일",
  agenda: "일정",
  date: "날짜",
  time: "시간",
  event: "이벤트",
  noEventsInRange: "이 기간에 일정이 없습니다.",
  showMore: (total: number) => `+${total}개`,
};

// 시간 + 제목 + 금액 포맷
function formatEventTitle(schedule: ScheduleWithCategories, showFinanceOnly: boolean): string {
  const time = schedule.schedule_time.slice(0, 5); // HH:mm

  if (showFinanceOnly && schedule.has_finance && schedule.amount) {
    const formattedAmount = new Intl.NumberFormat("ko-KR").format(schedule.amount);
    const prefix = schedule.finance_type === "income" ? "+" : "-";
    return `${time} ${prefix}${formattedAmount}원`;
  }

  let title = `${time} ${schedule.title}`;

  if (schedule.has_finance && schedule.amount) {
    const formattedAmount = new Intl.NumberFormat("ko-KR").format(schedule.amount);
    const prefix = schedule.finance_type === "income" ? "+" : "-";
    title += ` ${prefix}${formattedAmount}원`;
  }

  return title;
}

interface BigCalendarProps {
  initialSchedules?: ScheduleWithCategories[];
}

export default function BigCalendar({ initialSchedules }: BigCalendarProps) {
  const router = useRouter();
  const {
    schedules,
    events,
    loading,
    error,
    currentYear,
    currentMonth,
    setSchedules,
    setCurrentDate,
    fetchSchedules,
  } = useScheduleStore();

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showFinanceOnly, setShowFinanceOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // 초기 데이터 설정
  useEffect(() => {
    if (initialSchedules && initialSchedules.length > 0) {
      setSchedules(initialSchedules);
    } else {
      fetchSchedules(currentYear, currentMonth);
    }
  }, []);

  const currentDate = useMemo(
    () => new Date(currentYear, currentMonth - 1, 1),
    [currentYear, currentMonth]
  );

  // 필터링된 이벤트
  const filteredEvents = useMemo(() => {
    let filtered = schedules;

    // 검색 필터
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (s) =>
          s.title.toLowerCase().includes(query) ||
          s.memo?.toLowerCase().includes(query) ||
          s.schedule_category?.name.toLowerCase().includes(query)
      );
    }

    // 금액만 보기 필터
    if (showFinanceOnly) {
      filtered = filtered.filter((s) => s.has_finance && s.amount);
    }

    // 시간순 정렬 (날짜 + 시간)
    filtered = [...filtered].sort((a, b) => {
      // 날짜 비교
      const dateCompare = a.schedule_date.localeCompare(b.schedule_date);
      if (dateCompare !== 0) return dateCompare;

      // 시간 비교 (HH:mm:ss 형식을 분 단위로 변환)
      const [aHours, aMinutes] = a.schedule_time.split(":").map(Number);
      const [bHours, bMinutes] = b.schedule_time.split(":").map(Number);
      const aTimeValue = aHours * 60 + aMinutes;
      const bTimeValue = bHours * 60 + bMinutes;

      return aTimeValue - bTimeValue;
    });

    // 이벤트로 변환
    return filtered.map((schedule) => {
      const [hours, minutes] = schedule.schedule_time.split(":").map(Number);
      const startDate = new Date(schedule.schedule_date);
      startDate.setHours(hours, minutes, 0, 0);

      const endDate = new Date(startDate);
      endDate.setHours(hours + 1, minutes, 0, 0);

      // 금액 색상: 입금은 초록, 지출은 빨강
      let color = schedule.schedule_category?.color || "#6366F1";
      if (showFinanceOnly && schedule.has_finance) {
        color = schedule.finance_type === "income" ? "#22C55E" : "#EF4444";
      }

      return {
        id: schedule.id,
        title: formatEventTitle(schedule, showFinanceOnly),
        start: startDate,
        end: endDate,
        allDay: false,
        resource: {
          schedule,
          color,
          amount: schedule.amount,
          financeType: schedule.finance_type,
        },
      } as CalendarEvent;
    });
  }, [schedules, searchQuery, showFinanceOnly]);

  // 선택된 날짜의 스케줄 필터링
  const selectedDateSchedules = useMemo(() => {
    const dateStr = format(selectedDate, "yyyy-MM-dd");
    let filtered = schedules.filter((s) => s.schedule_date === dateStr);

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (s) =>
          s.title.toLowerCase().includes(query) ||
          s.memo?.toLowerCase().includes(query) ||
          s.schedule_category?.name.toLowerCase().includes(query)
      );
    }

    if (showFinanceOnly) {
      filtered = filtered.filter((s) => s.has_finance && s.amount);
    }

    // 시간순 정렬
    return [...filtered].sort((a, b) => {
      const [aHours, aMinutes] = a.schedule_time.split(":").map(Number);
      const [bHours, bMinutes] = b.schedule_time.split(":").map(Number);
      return (aHours * 60 + aMinutes) - (bHours * 60 + bMinutes);
    });
  }, [schedules, selectedDate, searchQuery, showFinanceOnly]);

  const handleNavigate = useCallback(
    (newDate: Date) => {
      const year = newDate.getFullYear();
      const month = newDate.getMonth() + 1;

      if (year !== currentYear || month !== currentMonth) {
        setCurrentDate(year, month);
        fetchSchedules(year, month);
      }
    },
    [currentYear, currentMonth, setCurrentDate, fetchSchedules]
  );

  // 스와이프로 월 이동
  const handleSwipeLeft = useCallback(() => {
    const newDate = addMonths(currentDate, 1);
    handleNavigate(newDate);
  }, [currentDate, handleNavigate]);

  const handleSwipeRight = useCallback(() => {
    const newDate = subMonths(currentDate, 1);
    handleNavigate(newDate);
  }, [currentDate, handleNavigate]);

  const swipeHandlers = useSwipe({
    onSwipeLeft: handleSwipeLeft,
    onSwipeRight: handleSwipeRight,
  });

  const handleSelectSlot = useCallback(({ start }: { start: Date }) => {
    setSelectedDate(start);
  }, []);

  // 날짜 클릭 (빈 칸 포함)
  const handleDrillDown = useCallback((date: Date) => {
    setSelectedDate(date);
  }, []);

  const handleSelectEvent = useCallback((event: CalendarEvent) => {
    setSelectedDate(event.start);
  }, []);

  // 이벤트 스타일
  const eventStyleGetter = useCallback((event: CalendarEvent) => {
    return {
      style: {
        backgroundColor: event.resource.color,
        borderRadius: "4px",
        opacity: 0.9,
        color: "white",
        border: "none",
        fontSize: "11px",
        padding: "1px 4px",
      },
    };
  }, []);

  // 날짜 셀 스타일 (선택된 날짜 표시)
  const dayPropGetter = useCallback(
    (date: Date) => {
      const isSelected =
        format(date, "yyyy-MM-dd") === format(selectedDate, "yyyy-MM-dd");
      return {
        className: isSelected ? styles.selectedDay : "",
      };
    },
    [selectedDate]
  );

  // 일정 아이템 색상 (금액 모드)
  const getScheduleItemColor = (schedule: ScheduleWithCategories) => {
    if (showFinanceOnly && schedule.has_finance) {
      return schedule.finance_type === "income" ? "#22C55E" : "#EF4444";
    }
    return schedule.schedule_category?.color || "#6366F1";
  };

  if (error) {
    return (
      <div className={styles.errorWrapper}>
        <p className={styles.errorText}>{error}</p>
        <button
          onClick={() => fetchSchedules(currentYear, currentMonth)}
          className={styles.retryButton}
        >
          다시 시도
        </button>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* 커스텀 툴바 */}
      <CalendarToolbar
        date={currentDate}
        onNavigate={handleNavigate}
        showFinanceOnly={showFinanceOnly}
        onFinanceToggle={() => setShowFinanceOnly(!showFinanceOnly)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        isSearchOpen={isSearchOpen}
        onSearchToggle={() => setIsSearchOpen(!isSearchOpen)}
      />

      <div className={styles.calendarWrapper} {...swipeHandlers}>
        {loading && <div className={styles.loadingOverlay}>로딩 중...</div>}
        <Calendar
          localizer={localizer}
          events={filteredEvents}
          date={currentDate}
          onNavigate={handleNavigate}
          onSelectEvent={handleSelectEvent}
          onSelectSlot={handleSelectSlot}
          onDrillDown={handleDrillDown}
          drilldownView={null}
          eventPropGetter={eventStyleGetter}
          dayPropGetter={dayPropGetter}
          selectable
          messages={messages}
          culture="ko"
          views={["month"]}
          defaultView="month"
          toolbar={false}
          popup
        />
      </div>

      {/* 선택된 날짜의 일정 리스트 */}
      <div className={styles.scheduleList}>
        <div className={styles.scheduleListHeader}>
          <span className={styles.selectedDateLabel}>
            {format(selectedDate, "M월 d일 (EEEE)", { locale: ko })}
          </span>
          <span className={styles.scheduleCount}>
            {selectedDateSchedules.length}건
          </span>
        </div>

        <div className={styles.scheduleListContent}>
          {selectedDateSchedules.length === 0 ? (
            <button
              className={styles.addScheduleButton}
              onClick={() => router.push(`/calendar/new?date=${format(selectedDate, "yyyy-MM-dd")}`)}
            >
              + 등록하기
            </button>
          ) : (
            selectedDateSchedules.map((schedule) => {
              const time = schedule.schedule_time.slice(0, 5);
              const hasAmount = schedule.has_finance && schedule.amount;
              const amountText = hasAmount
                ? `${schedule.finance_type === "income" ? "+" : "-"}${new Intl.NumberFormat("ko-KR").format(schedule.amount!)}원`
                : null;

              return (
                <button
                  key={schedule.id}
                  className={styles.scheduleItem}
                  style={{
                    borderLeftColor: getScheduleItemColor(schedule),
                  }}
                  onClick={() => router.push(`/calendar/${schedule.id}`)}
                >
                  <span className={styles.scheduleTime}>{time}</span>
                  <div className={styles.scheduleInfo}>
                    <span className={styles.scheduleTitle}>{schedule.title}</span>
                    {hasAmount && (
                      <span
                        className={`${styles.scheduleAmount} ${
                          schedule.finance_type === "income"
                            ? styles.income
                            : styles.expense
                        }`}
                      >
                        {amountText}
                      </span>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
