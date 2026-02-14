"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useScheduleStore } from "@/stores/useScheduleStore";
import PageLayout from "@/components/layout/PageLayout";
import type { ScheduleCategory, FinanceCategory, FinanceType, ScheduleWithCategories } from "@/types/schedule";
import styles from "./ScheduleForm.module.scss";

interface ScheduleFormData {
  title: string;
  schedule_date: string;
  schedule_time: string;
  schedule_category_id: string;
  has_finance: boolean;
  finance_type: FinanceType | "";
  amount: string;
  finance_category_id: string;
  is_receivable: boolean;
  memo: string;
}

interface ScheduleEditFormProps {
  scheduleId: string;
}

export default function ScheduleEditForm({ scheduleId }: ScheduleEditFormProps) {
  const router = useRouter();
  const { updateSchedule, removeSchedule } = useScheduleStore();
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [scheduleCategories, setScheduleCategories] = useState<ScheduleCategory[]>([]);
  const [financeCategories, setFinanceCategories] = useState<FinanceCategory[]>([]);

  const [formData, setFormData] = useState<ScheduleFormData>({
    title: "",
    schedule_date: format(new Date(), "yyyy-MM-dd"),
    schedule_time: "",
    schedule_category_id: "",
    has_finance: false,
    finance_type: "",
    amount: "",
    finance_category_id: "",
    is_receivable: false,
    memo: "",
  });

  // 기존 데이터 및 카테고리 불러오기
  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient();

      try {
        // 카테고리와 스케줄 데이터 동시에 불러오기
        const [scheduleRes, scheduleCatRes, financeCatRes] = await Promise.all([
          supabase
            .from("schedules")
            .select(`
              *,
              schedule_category:schedule_categories(name, color),
              finance_category:finance_categories(name, type)
            `)
            .eq("id", scheduleId)
            .single(),
          supabase
            .from("schedule_categories")
            .select("*")
            .order("sort_order", { ascending: true }),
          supabase
            .from("finance_categories")
            .select("*")
            .order("sort_order", { ascending: true }),
        ]);

        if (scheduleRes.error) {
          throw new Error("일정을 불러올 수 없습니다.");
        }

        const schedule = scheduleRes.data as ScheduleWithCategories;

        // 폼 데이터 설정
        setFormData({
          title: schedule.title,
          schedule_date: schedule.schedule_date,
          schedule_time: schedule.schedule_time?.slice(0, 5) || "",
          schedule_category_id: schedule.schedule_category_id,
          has_finance: schedule.has_finance,
          finance_type: schedule.finance_type || "",
          amount: schedule.amount?.toString() || "",
          finance_category_id: schedule.finance_category_id || "",
          is_receivable: schedule.is_receivable || false,
          memo: schedule.memo || "",
        });

        if (scheduleCatRes.data) {
          setScheduleCategories(scheduleCatRes.data);
        }

        if (financeCatRes.data) {
          setFinanceCategories(financeCatRes.data);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "데이터를 불러오는데 실패했습니다.");
      } finally {
        setInitialLoading(false);
      }
    };

    fetchData();
  }, [scheduleId]);

  // 필터링된 금액 카테고리
  const filteredFinanceCategories = financeCategories.filter(
    (cat) => cat.type === formData.finance_type
  );

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;

    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({
        ...prev,
        [name]: checked,
        ...(name === "has_finance" && !checked
          ? { finance_type: "", amount: "", finance_category_id: "", is_receivable: false }
          : {}),
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
        ...(name === "finance_type" ? { finance_category_id: "" } : {}),
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();

      const scheduleData = {
        title: formData.title,
        schedule_date: formData.schedule_date,
        schedule_time: formData.schedule_time ? formData.schedule_time + ":00" : null,
        schedule_category_id: formData.schedule_category_id,
        has_finance: formData.has_finance,
        finance_type: formData.has_finance && formData.finance_type ? formData.finance_type : null,
        amount: formData.has_finance && formData.amount ? Number(formData.amount) : null,
        finance_category_id: formData.has_finance && formData.finance_category_id ? formData.finance_category_id : null,
        is_receivable: formData.has_finance ? formData.is_receivable : false,
        memo: formData.memo || null,
        updated_at: new Date().toISOString(),
      };

      const { data, error: updateError } = await supabase
        .from("schedules")
        .update(scheduleData)
        .eq("id", scheduleId)
        .select(`
          *,
          schedule_category:schedule_categories(name, color),
          finance_category:finance_categories(name, type)
        `)
        .single();

      if (updateError) {
        throw new Error(updateError.message);
      }

      // 스토어 업데이트
      updateSchedule(data);

      // 캘린더로 이동
      router.push("/calendar");
    } catch (err) {
      setError(err instanceof Error ? err.message : "일정 수정에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("이 일정을 삭제하시겠습니까?")) {
      return;
    }

    setDeleting(true);
    setError(null);

    try {
      const supabase = createClient();

      const { error: deleteError } = await supabase
        .from("schedules")
        .delete()
        .eq("id", scheduleId);

      if (deleteError) {
        throw new Error(deleteError.message);
      }

      // 스토어에서 제거
      removeSchedule(scheduleId);

      // 캘린더로 이동
      router.push("/calendar");
    } catch (err) {
      setError(err instanceof Error ? err.message : "일정 삭제에 실패했습니다.");
    } finally {
      setDeleting(false);
    }
  };

  if (initialLoading) {
    return (
      <PageLayout title="일정 수정">
        <div className={styles.loadingWrapper}>로딩 중...</div>
      </PageLayout>
    );
  }

  const deleteButton = (
    <button onClick={handleDelete} className={styles.deleteButton} disabled={deleting}>
      <Trash2 size={20} />
    </button>
  );

  return (
    <PageLayout title="일정 수정" rightAction={deleteButton}>
      <form onSubmit={handleSubmit} className={styles.form}>
        {error && <div className={styles.error}>{error}</div>}

        <div className={styles.field}>
          <label htmlFor="title" className={styles.label}>
            제목 <span className={styles.required}>*</span>
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="일정 제목을 입력하세요"
            required
            className={styles.input}
          />
        </div>

        <div className={styles.row}>
          <div className={styles.field}>
            <label htmlFor="schedule_date" className={styles.label}>
              날짜 <span className={styles.required}>*</span>
            </label>
            <input
              type="date"
              id="schedule_date"
              name="schedule_date"
              value={formData.schedule_date}
              onChange={handleChange}
              required
              className={styles.input}
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="schedule_time" className={styles.label}>
              시간
            </label>
            <input
              type="time"
              id="schedule_time"
              name="schedule_time"
              value={formData.schedule_time}
              onChange={handleChange}
              className={styles.input}
            />
          </div>
        </div>

        <div className={styles.field}>
          <label htmlFor="schedule_category_id" className={styles.label}>
            카테고리 <span className={styles.required}>*</span>
          </label>
          <select
            id="schedule_category_id"
            name="schedule_category_id"
            value={formData.schedule_category_id}
            onChange={handleChange}
            required
            className={styles.select}
          >
            {scheduleCategories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.checkboxField}>
          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              name="has_finance"
              checked={formData.has_finance}
              onChange={handleChange}
              className={styles.checkbox}
            />
            <span>금액 정보 추가</span>
          </label>
        </div>

        {formData.has_finance && (
          <div className={styles.financeSection}>
            <div className={styles.field}>
              <label htmlFor="finance_type" className={styles.label}>
                유형 <span className={styles.required}>*</span>
              </label>
              <select
                id="finance_type"
                name="finance_type"
                value={formData.finance_type}
                onChange={handleChange}
                required={formData.has_finance}
                className={styles.select}
              >
                <option value="">선택하세요</option>
                <option value="income">수입</option>
                <option value="expense">지출</option>
                <option value="savings">저축</option>
              </select>
            </div>

            <div className={styles.field}>
              <label htmlFor="amount" className={styles.label}>
                금액 <span className={styles.required}>*</span>
              </label>
              <input
                type="number"
                id="amount"
                name="amount"
                value={formData.amount}
                onChange={handleChange}
                placeholder="0"
                required={formData.has_finance}
                min="0"
                className={styles.input}
              />
            </div>

            <div className={styles.checkboxField}>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  name="is_receivable"
                  checked={formData.is_receivable}
                  onChange={handleChange}
                  className={styles.checkbox}
                />
                <span>미수</span>
              </label>
            </div>

            {formData.finance_type && filteredFinanceCategories.length > 0 && (
              <div className={styles.field}>
                <label htmlFor="finance_category_id" className={styles.label}>
                  금액 카테고리
                </label>
                <select
                  id="finance_category_id"
                  name="finance_category_id"
                  value={formData.finance_category_id}
                  onChange={handleChange}
                  className={styles.select}
                >
                  <option value="">선택하세요</option>
                  {filteredFinanceCategories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        )}

        <div className={styles.field}>
          <label htmlFor="memo" className={styles.label}>
            메모
          </label>
          <textarea
            id="memo"
            name="memo"
            value={formData.memo}
            onChange={handleChange}
            placeholder="메모를 입력하세요"
            rows={3}
            className={styles.textarea}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className={styles.submitButton}
        >
          {loading ? "수정 중..." : "수정하기"}
        </button>
      </form>
    </PageLayout>
  );
}
