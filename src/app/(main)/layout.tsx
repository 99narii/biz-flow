import TabBar from "@/components/layout/TabBar";
import styles from "@/components/layout/MainLayout.module.scss";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={styles.container}>
      <main className={styles.main}>{children}</main>
      <TabBar />
    </div>
  );
}
