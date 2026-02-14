"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import styles from "@/components/auth/AuthForm.module.scss";

const STORAGE_KEY_EMAIL = "bizflow_saved_email";
const STORAGE_KEY_REMEMBER = "bizflow_remember_email";
const STORAGE_KEY_AUTO_LOGIN = "bizflow_auto_login";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberEmail, setRememberEmail] = useState(false);
  const [autoLogin, setAutoLogin] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      const savedAutoLogin = localStorage.getItem(STORAGE_KEY_AUTO_LOGIN) === "true";
      const savedRemember = localStorage.getItem(STORAGE_KEY_REMEMBER) === "true";
      const savedEmail = localStorage.getItem(STORAGE_KEY_EMAIL) || "";

      setRememberEmail(savedRemember);
      setAutoLogin(savedAutoLogin);
      if (savedRemember && savedEmail) {
        setEmail(savedEmail);
      }

      // 자동 로그인이 켜져 있으면 세션 확인
      if (savedAutoLogin) {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          router.push("/calendar");
          return;
        }
      }

      setChecking(false);
    };

    checkSession();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // 설정 저장
    localStorage.setItem(STORAGE_KEY_REMEMBER, String(rememberEmail));
    localStorage.setItem(STORAGE_KEY_AUTO_LOGIN, String(autoLogin));
    if (rememberEmail) {
      localStorage.setItem(STORAGE_KEY_EMAIL, email);
    } else {
      localStorage.removeItem(STORAGE_KEY_EMAIL);
    }

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push("/calendar");
    router.refresh();
  };

  // 세션 확인 중에는 로딩 표시
  if (checking) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <div className={styles.logo}>
            <span className={styles.logoText}>BizFlow</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.logo}>
          <span className={styles.logoText}>BizFlow</span>
        </div>
        <h1 className={styles.title}>로그인</h1>

        <form onSubmit={handleSubmit} className={styles.form}>
          {error && <div className={styles.error}>{error}</div>}

          <div className={styles.field}>
            <label htmlFor="email" className={styles.label}>
              이메일
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@example.com"
              className={styles.input}
              required
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="password" className={styles.label}>
              비밀번호
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="비밀번호를 입력하세요"
              className={styles.input}
              required
            />
          </div>

          <div className={styles.checkboxGroup}>
            <label className={styles.checkbox}>
              <input
                type="checkbox"
                checked={rememberEmail}
                onChange={(e) => setRememberEmail(e.target.checked)}
              />
              <span>아이디 기억하기</span>
            </label>
            <label className={styles.checkbox}>
              <input
                type="checkbox"
                checked={autoLogin}
                onChange={(e) => setAutoLogin(e.target.checked)}
              />
              <span>자동 로그인</span>
            </label>
          </div>

          <button
            type="submit"
            className={styles.submitButton}
            disabled={loading}
          >
            {loading ? "로그인 중..." : "로그인"}
          </button>
        </form>

        <div className={styles.footer}>
          계정이 없으신가요?{" "}
          <Link href="/signup" className={styles.link}>
            회원가입
          </Link>
        </div>
      </div>
    </div>
  );
}
