"use client";

import { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import styles from "./PageLayout.module.scss";

interface PageLayoutProps {
  children: ReactNode;
  title?: string;
  showBackButton?: boolean;
  rightAction?: ReactNode;
}

export default function PageLayout({
  children,
  title,
  showBackButton = true,
  rightAction,
}: PageLayoutProps) {
  const router = useRouter();

  return (
    <div className={styles.container}>
      {title && (
        <header className={styles.header}>
          {showBackButton ? (
            <button onClick={() => router.back()} className={styles.backButton}>
              <ChevronLeft size={24} />
            </button>
          ) : (
            <div className={styles.headerSpacer} />
          )}
          <h1 className={styles.title}>{title}</h1>
          {rightAction ? (
            <div className={styles.rightAction}>{rightAction}</div>
          ) : (
            <div className={styles.headerSpacer} />
          )}
        </header>
      )}
      <div className={styles.content}>{children}</div>
    </div>
  );
}
