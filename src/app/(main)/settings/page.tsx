"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useSettingsStore } from "@/stores/useSettingsStore";
import styles from "./page.module.scss";

export default function SettingsPage() {
  const router = useRouter();
  const { theme, accent, setTheme, setAccent } = useSettingsStore();

  const handleLogout = async () => {
    // 자동 로그인 설정 끄기
    localStorage.setItem("bizflow_auto_login", "false");

    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>설정</h1>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>테마</h2>
        <div className={styles.card}>
          <div className={styles.item}>
            <span className={styles.itemLabel}>다크 모드</span>
            <select
              value={theme}
              onChange={(e) => setTheme(e.target.value as typeof theme)}
              className={styles.itemValue}
            >
              <option value="system">시스템 설정</option>
              <option value="light">라이트</option>
              <option value="dark">다크</option>
            </select>
          </div>
          <div className={styles.item}>
            <span className={styles.itemLabel}>포인트 컬러</span>
            <select
              value={accent}
              onChange={(e) => setAccent(e.target.value as typeof accent)}
              className={styles.itemValue}
            >
              <option value="indigo">인디고</option>
              <option value="pink">핑크</option>
              <option value="purple">퍼플</option>
              <option value="mint">민트</option>
            </select>
          </div>
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>계정</h2>
        <button onClick={handleLogout} className={styles.logoutButton}>
          로그아웃
        </button>
      </div>
    </div>
  );
}
