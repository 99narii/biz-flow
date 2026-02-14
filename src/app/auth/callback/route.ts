import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// 기본 스케줄 카테고리
const DEFAULT_SCHEDULE_CATEGORIES = [
  { name: "업무", color: "#6366F1", sort_order: 1 },
  { name: "미팅", color: "#8B5CF6", sort_order: 2 },
  { name: "개인", color: "#EC4899", sort_order: 3 },
  { name: "기타", color: "#94A3B8", sort_order: 4 },
];

// 기본 금액 카테고리
const DEFAULT_FINANCE_CATEGORIES = [
  { name: "프로젝트", type: "income", sort_order: 1 },
  { name: "용역", type: "income", sort_order: 2 },
  { name: "기타수입", type: "income", sort_order: 3 },
  { name: "경비", type: "expense", sort_order: 1 },
  { name: "식비", type: "expense", sort_order: 2 },
  { name: "교통비", type: "expense", sort_order: 3 },
  { name: "기타지출", type: "expense", sort_order: 4 },
];

async function createDefaultCategories(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  // 기존 카테고리가 있는지 확인
  const { data: existingScheduleCategories } = await supabase
    .from("schedule_categories")
    .select("id")
    .eq("user_id", userId)
    .limit(1);

  // 스케줄 카테고리가 없으면 생성
  if (!existingScheduleCategories || existingScheduleCategories.length === 0) {
    const scheduleCategories = DEFAULT_SCHEDULE_CATEGORIES.map(cat => ({
      ...cat,
      user_id: userId,
    }));
    await supabase.from("schedule_categories").insert(scheduleCategories);
  }

  // 기존 금액 카테고리가 있는지 확인
  const { data: existingFinanceCategories } = await supabase
    .from("finance_categories")
    .select("id")
    .eq("user_id", userId)
    .limit(1);

  // 금액 카테고리가 없으면 생성
  if (!existingFinanceCategories || existingFinanceCategories.length === 0) {
    const financeCategories = DEFAULT_FINANCE_CATEGORIES.map(cat => ({
      ...cat,
      user_id: userId,
    }));
    await supabase.from("finance_categories").insert(financeCategories);
  }
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/calendar";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // 사용자 정보 가져오기
      const { data: userData } = await supabase.auth.getUser();

      if (userData.user) {
        // 새 사용자인 경우 기본 카테고리 생성
        await createDefaultCategories(supabase, userData.user.id);
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // 에러 발생 시 로그인 페이지로 리다이렉트
  return NextResponse.redirect(`${origin}/login?error=auth_callback_error`);
}
