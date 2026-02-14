"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { createClient } from "@/lib/supabase/client";
import { useScheduleStore } from "@/stores/useScheduleStore";
import PageLayout from "@/components/layout/PageLayout";
import type { ScheduleCategory, FinanceCategory, FinanceType } from "@/types/schedule";
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

export default function ScheduleForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { addSchedule } = useScheduleStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [scheduleCategories, setScheduleCategories] = useState<ScheduleCategory[]>([]);
  const [financeCategories, setFinanceCategories] = useState<FinanceCategory[]>([]);

  // URL에서 날짜 파라미터 가져오기
  const dateParam = searchParams.get("date");
  const initialDate = dateParam || format(new Date(), "yyyy-MM-dd");

  const [formData, setFormData] = useState<ScheduleFormData>({
    title: "",
    schedule_date: initialDate,
    schedule_time: "",
    schedule_category_id: "",
    has_finance: false,
    finance_type: "",
    amount: "",
    finance_category_id: "",
    is_receivable: false,
    memo: "",
  });

  // 기본 카테고리 생성
  const createDefaultCategories = async (supabase: ReturnType<typeof createClient>, userId: string) => {
    const DEFAULT_SCHEDULE_CATEGORIES = [
      { name: "업무", color: "#6366F1", sort_order: 1 },
      { name: "미팅", color: "#8B5CF6", sort_order: 2 },
      { name: "개인", color: "#EC4899", sort_order: 3 },
      { name: "기타", color: "#94A3B8", sort_order: 4 },
    ];

    const DEFAULT_FINANCE_CATEGORIES = [
      { name: "프로젝트", type: "income", sort_order: 1 },
      { name: "용역", type: "income", sort_order: 2 },
      { name: "기타수입", type: "income", sort_order: 3 },
      { name: "경비", type: "expense", sort_order: 1 },
      { name: "식비", type: "expense", sort_order: 2 },
      { name: "교통비", type: "expense", sort_order: 3 },
      { name: "기타지출", type: "expense", sort_order: 4 },
    ];

    await Promise.all([
      supabase.from("schedule_categories").insert(
        DEFAULT_SCHEDULE_CATEGORIES.map(cat => ({ ...cat, user_id: userId }))
      ),
      supabase.from("finance_categories").insert(
        DEFAULT_FINANCE_CATEGORIES.map(cat => ({ ...cat, user_id: userId }))
      ),
    ]);
  };

  // 카테고리 불러오기
  useEffect(() => {
    const fetchCategories = async () => {
      const supabase = createClient();

      // 현재 사용자 확인
      const { data: userData } = await supabase.auth.getUser();

      const [scheduleRes, financeRes] = await Promise.all([
        supabase
          .from("schedule_categories")
          .select("*")
          .order("sort_order", { ascending: true }),
        supabase
          .from("finance_categories")
          .select("*")
          .order("sort_order", { ascending: true }),
      ]);

      // 카테고리가 없으면 기본 카테고리 생성
      if (userData.user && (!scheduleRes.data || scheduleRes.data.length === 0)) {
        await createDefaultCategories(supabase, userData.user.id);
        // 다시 불러오기
        const [newScheduleRes, newFinanceRes] = await Promise.all([
          supabase
            .from("schedule_categories")
            .select("*")
            .order("sort_order", { ascending: true }),
          supabase
            .from("finance_categories")
            .select("*")
            .order("sort_order", { ascending: true }),
        ]);

        if (newScheduleRes.data) {
          setScheduleCategories(newScheduleRes.data);
          if (newScheduleRes.data.length > 0) {
            setFormData(prev => ({ ...prev, schedule_category_id: newScheduleRes.data[0].id }));
          }
        }
        if (newFinanceRes.data) {
          setFinanceCategories(newFinanceRes.data);
        }
        return;
      }

      if (scheduleRes.data) {
        setScheduleCategories(scheduleRes.data);
        if (scheduleRes.data.length > 0 && !formData.schedule_category_id) {
          setFormData(prev => ({ ...prev, schedule_category_id: scheduleRes.data[0].id }));
        }
      }

      if (financeRes.data) {
        setFinanceCategories(financeRes.data);
      }
    };

    fetchCategories();
  }, []);

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
        // 금액 체크 해제 시 관련 필드 초기화
        ...(name === "has_finance" && !checked
          ? { finance_type: "", amount: "", finance_category_id: "", is_receivable: false }
          : {}),
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
        // finance_type 변경 시 finance_category_id 초기화
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

      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        throw new Error("로그인이 필요합니다.");
      }

      const scheduleData = {
        user_id: userData.user.id,
        title: formData.title,
        schedule_date: formData.schedule_date,
        schedule_time: formData.schedule_time ? formData.schedule_time + ":00" : null,
        schedule_category_id: formData.schedule_category_id || null,
        has_finance: formData.has_finance,
        finance_type: formData.has_finance && formData.finance_type ? formData.finance_type : null,
        amount: formData.has_finance && formData.amount ? Number(formData.amount) : null,
        finance_category_id: formData.has_finance && formData.finance_category_id ? formData.finance_category_id : null,
        is_receivable: formData.has_finance ? formData.is_receivable : false,
        memo: formData.memo || null,
      };

      console.log("Creating schedule:", scheduleData);

      const { data, error: insertError } = await supabase
        .from("schedules")
        .insert(scheduleData)
        .select(`
          *,
          schedule_category:schedule_categories(name, color),
          finance_category:finance_categories(name, type)
        `)
        .single();

      if (insertError) {
        console.error("Insert error:", insertError);
        throw new Error(insertError.message);
      }

      // 스토어에 추가
      addSchedule(data);

      // 캘린더로 이동
      router.push("/calendar");
    } catch (err) {
      setError(err instanceof Error ? err.message : "일정 등록에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageLayout title="일정 등록">
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
          {loading ? "등록 중..." : "등록하기"}
        </button>
      </form>
    </PageLayout>
  );
}
