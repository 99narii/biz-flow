"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { Calendar, Wallet, Search, X, ChevronDown, Plus } from "lucide-react";
import styles from "./CalendarToolbar.module.scss";

interface CalendarToolbarProps {
  date: Date;
  onNavigate: (date: Date) => void;
  showFinanceOnly: boolean;
  onFinanceToggle: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  isSearchOpen: boolean;
  onSearchToggle: () => void;
}

export default function CalendarToolbar({
  date,
  onNavigate,
  showFinanceOnly,
  onFinanceToggle,
  searchQuery,
  onSearchChange,
  isSearchOpen,
  onSearchToggle,
}: CalendarToolbarProps) {
  const router = useRouter();
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [selectedYear, setSelectedYear] = useState(date.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(date.getMonth() + 1);
  const pickerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // 년월 표시 포맷
  const displayDate = format(date, "yyyy년 M월", { locale: ko });

  // 피커 열 때 현재 날짜로 설정
  useEffect(() => {
    if (isPickerOpen) {
      setSelectedYear(date.getFullYear());
      setSelectedMonth(date.getMonth() + 1);
    }
  }, [isPickerOpen, date]);

  // 외부 클릭 시 피커 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setIsPickerOpen(false);
      }
    };

    if (isPickerOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isPickerOpen]);

  // 검색 열릴 때 포커스
  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchOpen]);

  const handleYearMonthSelect = () => {
    const newDate = new Date(selectedYear, selectedMonth - 1, 1);
    onNavigate(newDate);
    setIsPickerOpen(false);
  };

  const years = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 5 + i);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  // 검색 모드
  if (isSearchOpen) {
    return (
      <div className={styles.toolbar}>
        <div className={styles.searchMode}>
          <Search size={18} className={styles.searchIcon} />
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="일정 검색..."
            className={styles.searchInput}
          />
          <button
            onClick={() => {
              onSearchChange("");
              onSearchToggle();
            }}
            className={styles.closeButton}
          >
            <X size={18} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.toolbar}>
      {/* 좌측: 년월 표시 */}
      <div className={styles.leftSection} ref={pickerRef}>
        <button
          className={styles.dateButton}
          onClick={() => setIsPickerOpen(!isPickerOpen)}
        >
          <span>{displayDate}</span>
          <ChevronDown size={16} className={isPickerOpen ? styles.rotated : ""} />
        </button>

        {/* 년월 선택 드롭다운 */}
        {isPickerOpen && (
          <div className={styles.picker}>
            <div className={styles.pickerSelects}>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className={styles.select}
              >
                {years.map((year) => (
                  <option key={year} value={year}>
                    {year}년
                  </option>
                ))}
              </select>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className={styles.select}
              >
                {months.map((month) => (
                  <option key={month} value={month}>
                    {month}월
                  </option>
                ))}
              </select>
            </div>
            <button onClick={handleYearMonthSelect} className={styles.confirmButton}>
              이동
            </button>
          </div>
        )}
      </div>

      {/* 우측: 필터 아이콘들 */}
      <div className={styles.rightSection}>
        {/* 스위치 박스: 일정/가계부 */}
        <div className={styles.switchBox}>
          <button
            className={`${styles.switchButton} ${!showFinanceOnly ? styles.active : ""}`}
            onClick={() => showFinanceOnly && onFinanceToggle()}
            title="일정 보기"
          >
            <Calendar size={18} />
          </button>
          <button
            className={`${styles.switchButton} ${showFinanceOnly ? styles.active : ""}`}
            onClick={() => !showFinanceOnly && onFinanceToggle()}
            title="가계부 보기"
          >
            <Wallet size={18} />
          </button>
        </div>
        <button
          className={styles.iconButton}
          onClick={onSearchToggle}
          title="검색"
        >
          <Search size={20} />
        </button>
        <button
          className={`${styles.iconButton} ${styles.addButton}`}
          onClick={() => router.push("/calendar/new")}
          title="일정 등록"
        >
          <Plus size={20} />
        </button>
      </div>
    </div>
  );
}
