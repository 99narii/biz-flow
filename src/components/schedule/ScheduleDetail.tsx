"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { Pencil, Trash2, Clock, Calendar, Tag, Wallet, FileText } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useScheduleStore } from "@/stores/useScheduleStore";
import PageLayout from "@/components/layout/PageLayout";
import Spinner from "@/components/common/Spinner";
import type { ScheduleWithCategories } from "@/types/schedule";
import styles from "./ScheduleDetail.module.scss";

interface ScheduleDetailProps {
  scheduleId: string;
}

export default function ScheduleDetail({ scheduleId }: ScheduleDetailProps) {
  const router = useRouter();
  const { removeSchedule } = useScheduleStore();
  const [schedule, setSchedule] = useState<ScheduleWithCategories | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSchedule = async () => {
      const supabase = createClient();

      try {
        const { data, error: fetchError } = await supabase
          .from("schedules")
          .select(`
            *,
            schedule_category:schedule_categories(name, color),
            finance_category:finance_categories(name, type)
          `)
          .eq("id", scheduleId)
          .single();

        if (fetchError) {
          throw new Error("일정을 불러올 수 없습니다.");
        }

        setSchedule(data as ScheduleWithCategories);
      } catch (err) {
        setError(err instanceof Error ? err.message : "데이터를 불러오는데 실패했습니다.");
      } finally {
        setLoading(false);
      }
    };

    fetchSchedule();
  }, [scheduleId]);

  const handleDelete = async () => {
    if (!confirm("이 일정을 삭제하시겠습니까?")) {
      return;
    }

    setDeleting(true);

    try {
      const supabase = createClient();

      const { error: deleteError } = await supabase
        .from("schedules")
        .delete()
        .eq("id", scheduleId);

      if (deleteError) {
        throw new Error(deleteError.message);
      }

      removeSchedule(scheduleId);
      router.push("/calendar");
    } catch (err) {
      setError(err instanceof Error ? err.message : "일정 삭제에 실패했습니다.");
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <PageLayout title="일정 상세">
        <div className={styles.loading}>
          <Spinner size="lg" />
        </div>
      </PageLayout>
    );
  }

  if (error || !schedule) {
    return (
      <PageLayout title="일정 상세">
        <div className={styles.error}>{error || "일정을 찾을 수 없습니다."}</div>
      </PageLayout>
    );
  }

  const dateObj = new Date(schedule.schedule_date);
  const formattedDate = format(dateObj, "yyyy년 M월 d일 (EEEE)", { locale: ko });
  const formattedTime = schedule.schedule_time?.slice(0, 5) || null;

  const getFinanceTypeLabel = (type: string | null) => {
    switch (type) {
      case "income": return "수입";
      case "expense": return "지출";
      case "savings": return "저축";
      default: return "";
    }
  };

  const formattedAmount = schedule.amount
    ? new Intl.NumberFormat("ko-KR").format(schedule.amount)
    : null;

  const headerActions = (
    <>
      <Link
        href={`/calendar/${scheduleId}/edit`}
        className={styles.editButton}
        prefetch={true}
      >
        <Pencil size={18} />
      </Link>
      <button
        onClick={handleDelete}
        className={styles.deleteButton}
        disabled={deleting}
      >
        <Trash2 size={18} />
      </button>
    </>
  );

  return (
    <PageLayout title="일정 상세" rightAction={headerActions}>
      <div className={styles.content}>
        {/* 제목 섹션 */}
        <div className={styles.titleSection}>
          <div
            className={styles.categoryBadge}
            style={{ backgroundColor: schedule.schedule_category?.color || "#6366F1" }}
          >
            {schedule.schedule_category?.name || "미분류"}
          </div>
          <h2 className={styles.title}>{schedule.title}</h2>
        </div>

        {/* 정보 카드 */}
        <div className={styles.infoCard}>
          <div className={styles.infoRow}>
            <div className={styles.infoIcon}>
              <Calendar size={16} />
            </div>
            <div className={styles.infoContent}>
              <span className={styles.infoLabel}>날짜</span>
              <span className={styles.infoValue}>{formattedDate}</span>
            </div>
          </div>

          {formattedTime && (
            <div className={styles.infoRow}>
              <div className={styles.infoIcon}>
                <Clock size={16} />
              </div>
              <div className={styles.infoContent}>
                <span className={styles.infoLabel}>시간</span>
                <span className={styles.infoValue}>{formattedTime}</span>
              </div>
            </div>
          )}

          {schedule.schedule_category && (
            <div className={styles.infoRow}>
              <div className={styles.infoIcon}>
                <Tag size={16} />
              </div>
              <div className={styles.infoContent}>
                <span className={styles.infoLabel}>카테고리</span>
                <span className={styles.infoValue}>{schedule.schedule_category.name}</span>
              </div>
            </div>
          )}
        </div>

        {/* 금액 정보 */}
        {schedule.has_finance && schedule.amount && (
          <div className={styles.financeCard}>
            <div className={styles.financeHeader}>
              <Wallet size={16} />
              <span>금액 정보</span>
            </div>
            <div className={styles.financeContent}>
              <div className={styles.financeType}>
                <span
                  className={`${styles.financeTypeBadge} ${
                    schedule.finance_type === "income"
                      ? styles.income
                      : schedule.finance_type === "expense"
                      ? styles.expense
                      : styles.savings
                  }`}
                >
                  {getFinanceTypeLabel(schedule.finance_type)}
                </span>
              </div>
              <div
                className={`${styles.financeAmount} ${
                  schedule.finance_type === "income"
                    ? styles.income
                    : schedule.finance_type === "expense"
                    ? styles.expense
                    : styles.savings
                }`}
              >
                {schedule.finance_type === "income" ? "+" : "-"}
                {formattedAmount}원
              </div>
            </div>
            {schedule.finance_category && (
              <div className={styles.financeCategory}>
                {schedule.finance_category.name}
              </div>
            )}
          </div>
        )}

        {/* 메모 */}
        {schedule.memo && (
          <div className={styles.memoCard}>
            <div className={styles.memoHeader}>
              <FileText size={16} />
              <span>메모</span>
            </div>
            <p className={styles.memoContent}>{schedule.memo}</p>
          </div>
        )}
      </div>
    </PageLayout>
  );
}
