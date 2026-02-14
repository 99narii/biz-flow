"use client";

import { useEffect, useCallback, useMemo, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
  const time = schedule.schedule_time?.slice(0, 5) || ""; // HH:mm

  if (showFinanceOnly && schedule.has_finance && schedule.amount) {
    const formattedAmount = new Intl.NumberFormat("ko-KR").format(schedule.amount);
    const prefix = schedule.finance_type === "income" ? "+" : "-";
    return time ? `${time} ${prefix}${formattedAmount}원` : `${prefix}${formattedAmount}원`;
  }

  let title = time ? `${time} ${schedule.title}` : schedule.title;

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

  // 선택된 날짜 문자열 (최적화용)
  const selectedDateStr = format(selectedDate, "yyyy-MM-dd");

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

      // 시간 비교 (HH:mm:ss 형식을 분 단위로 변환) - null 처리
      const aTime = a.schedule_time || "00:00";
      const bTime = b.schedule_time || "00:00";
      const [aHours, aMinutes] = aTime.split(":").map(Number);
      const [bHours, bMinutes] = bTime.split(":").map(Number);
      const aTimeValue = aHours * 60 + aMinutes;
      const bTimeValue = bHours * 60 + bMinutes;

      return aTimeValue - bTimeValue;
    });

    // 이벤트로 변환
    return filtered.map((schedule) => {
      const time = schedule.schedule_time || "00:00";
      const [hours, minutes] = time.split(":").map(Number);
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
    let filtered = schedules.filter((s) => s.schedule_date === selectedDateStr);

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

    // 시간순 정렬 - null 처리
    return [...filtered].sort((a, b) => {
      const aTime = a.schedule_time || "00:00";
      const bTime = b.schedule_time || "00:00";
      const [aHours, aMinutes] = aTime.split(":").map(Number);
      const [bHours, bMinutes] = bTime.split(":").map(Number);
      return (aHours * 60 + aMinutes) - (bHours * 60 + bMinutes);
    });
  }, [schedules, selectedDateStr, searchQuery, showFinanceOnly]);

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

  // 터치 상태 추적
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  // 더블클릭/더블탭 감지용
  const lastTapRef = useRef<{ date: string; time: number } | null>(null);
  // 중복 이벤트 방지용
  const lastEventTimeRef = useRef<number>(0);

  // 날짜 선택 핸들러 - 즉시 반응하도록 최적화
  const handleDateSelect = useCallback((date: Date) => {
    setSelectedDate(date);
  }, []);

  // 날짜 계산 헬퍼 함수
  const getClickedDate = useCallback(
    (target: HTMLElement): Date | null => {
      const dayBg = target.closest('.rbc-day-bg') as HTMLElement;
      if (!dayBg) return null;

      const rowBg = dayBg.closest('.rbc-row-bg');
      const monthRow = dayBg.closest('.rbc-month-row');
      if (!rowBg || !monthRow) return null;

      const dayIndex = Array.from(rowBg.children).indexOf(dayBg);
      const monthView = monthRow.closest('.rbc-month-view');
      if (!monthView) return null;

      const allRows = Array.from(monthView.querySelectorAll('.rbc-month-row'));
      const rowIndex = allRows.indexOf(monthRow);

      const firstDayOfMonth = new Date(currentYear, currentMonth - 1, 1);
      const startDayOfWeek = firstDayOfMonth.getDay();

      const dayOffset = rowIndex * 7 + dayIndex - startDayOfWeek;
      return new Date(currentYear, currentMonth - 1, 1 + dayOffset);
    },
    [currentYear, currentMonth]
  );

  // 탭/클릭 처리 (더블탭 시 등록 페이지로 이동)
  const handleTapOnDate = useCallback(
    (clickedDate: Date) => {
      const now = Date.now();
      const dateStr = format(clickedDate, "yyyy-MM-dd");

      // 중복 이벤트 방지 (100ms 이내 동일 날짜 이벤트 무시)
      if (
        now - lastEventTimeRef.current < 100 &&
        lastTapRef.current?.date === dateStr
      ) {
        return;
      }
      lastEventTimeRef.current = now;

      // 더블탭 감지: 같은 날짜를 500ms 이내에 다시 탭
      if (
        lastTapRef.current &&
        lastTapRef.current.date === dateStr &&
        now - lastTapRef.current.time < 500
      ) {
        // 더블탭 - 등록 페이지로 이동
        lastTapRef.current = null;
        router.push(`/calendar/new?date=${dateStr}`);
        return;
      }

      // 첫 번째 탭 또는 다른 날짜 탭 - 날짜 선택
      lastTapRef.current = { date: dateStr, time: now };
      handleDateSelect(clickedDate);
    },
    [handleDateSelect, router]
  );

  // react-big-calendar에서 처리되면 wrapper에서 중복 처리 방지
  const handledByCalendarRef = useRef<boolean>(false);

  const handleSelectSlot = useCallback(({ start }: { start: Date }) => {
    handledByCalendarRef.current = true;
    handleTapOnDate(start);
    // 다음 틱에서 리셋
    setTimeout(() => { handledByCalendarRef.current = false; }, 0);
  }, [handleTapOnDate]);

  // 날짜 클릭 (빈 칸 포함)
  const handleDrillDown = useCallback((date: Date) => {
    handledByCalendarRef.current = true;
    handleTapOnDate(date);
    setTimeout(() => { handledByCalendarRef.current = false; }, 0);
  }, [handleTapOnDate]);

  const handleSelectEvent = useCallback((event: CalendarEvent) => {
    handleDateSelect(event.start);
  }, [handleDateSelect]);

  // 이벤트 스타일
  const eventStyleGetter = useCallback((event: CalendarEvent) => {
    return {
      style: {
        backgroundColor: event.resource.color,
        borderRadius: "4px",
        opacity: 0.9,
        color: "white",
        border: "none",
      },
    };
  }, []);

  // 날짜 셀 스타일 (선택된 날짜 표시) - 최적화
  const dayPropGetter = useCallback(
    (date: Date) => {
      const dateStr = format(date, "yyyy-MM-dd");
      return {
        className: dateStr === selectedDateStr ? styles.selectedDay : "",
      };
    },
    [selectedDateStr]
  );

  // 일정 아이템 색상 (금액 모드)
  const getScheduleItemColor = (schedule: ScheduleWithCategories) => {
    if (showFinanceOnly && schedule.has_finance) {
      return schedule.finance_type === "income" ? "#22C55E" : "#EF4444";
    }
    return schedule.schedule_category?.color || "#6366F1";
  };

  // 캘린더 클릭 핸들러 - 빈 칸도 클릭 가능하도록 (react-big-calendar에서 처리 안 된 경우만)
  const handleCalendarClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      // react-big-calendar에서 이미 처리했으면 무시
      if (handledByCalendarRef.current) return;

      const clickedDate = getClickedDate(e.target as HTMLElement);
      if (clickedDate) {
        handleTapOnDate(clickedDate);
      }
    },
    [getClickedDate, handleTapOnDate]
  );

  // 캘린더 터치 핸들러
  const handleCalendarTouchStart = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    const touch = e.touches[0];
    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now(),
    };
  }, []);

  const handleCalendarTouchEnd = useCallback(
    (e: React.TouchEvent<HTMLDivElement>) => {
      if (!touchStartRef.current) return;

      // react-big-calendar에서 이미 처리했으면 무시
      if (handledByCalendarRef.current) {
        touchStartRef.current = null;
        return;
      }

      const touch = e.changedTouches[0];
      const deltaX = Math.abs(touch.clientX - touchStartRef.current.x);
      const deltaY = Math.abs(touch.clientY - touchStartRef.current.y);
      const deltaTime = Date.now() - touchStartRef.current.time;

      // 탭: 이동 거리가 15px 미만이고 300ms 이내
      if (deltaX < 15 && deltaY < 15 && deltaTime < 300) {
        const clickedDate = getClickedDate(e.target as HTMLElement);
        if (clickedDate) {
          handleTapOnDate(clickedDate);
        }
      }

      touchStartRef.current = null;
    },
    [getClickedDate, handleTapOnDate]
  );

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

      <div
        className={styles.calendarWrapper}
        {...swipeHandlers}
        onClick={handleCalendarClick}
        onTouchStart={handleCalendarTouchStart}
        onTouchEnd={handleCalendarTouchEnd}
      >
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
          longPressThreshold={10}
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
            <Link
              href={`/calendar/new?date=${format(selectedDate, "yyyy-MM-dd")}`}
              className={styles.addScheduleButton}
              prefetch={true}
            >
              + 등록하기
            </Link>
          ) : (
            selectedDateSchedules.map((schedule) => {
              const time = schedule.schedule_time?.slice(0, 5) || "";
              const hasAmount = schedule.has_finance && schedule.amount;
              const amountText = hasAmount
                ? `${schedule.finance_type === "income" ? "+" : "-"}${new Intl.NumberFormat("ko-KR").format(schedule.amount!)}원`
                : null;

              return (
                <Link
                  key={schedule.id}
                  href={`/calendar/${schedule.id}`}
                  className={styles.scheduleItem}
                  style={{
                    borderLeftColor: getScheduleItemColor(schedule),
                  }}
                  prefetch={true}
                >
                  {time && <span className={styles.scheduleTime}>{time}</span>}
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
                        {schedule.is_receivable && <span className={styles.receivableBadge}>미수</span>}
                      </span>
                    )}
                  </div>
                </Link>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
