import styles from "./Spinner.module.scss";

interface SpinnerProps {
  size?: "sm" | "md" | "lg";
}

export default function Spinner({ size = "md" }: SpinnerProps) {
  return (
    <div className={`${styles.spinner} ${styles[size]}`}>
      <div className={styles.ring} />
    </div>
  );
}
