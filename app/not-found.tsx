import Link from "next/link";
import clsx from "clsx";
import styles from "./not-found.module.css";

export default function NotFound() {
  return (
    <div className={clsx("theme-daniel", styles.page)}>
      <div className={styles.container}>
        <h1 className={styles.title}>404 - Friend Not Found</h1>
        <p className={styles.message}>This friend doesn&apos;t have a dashboard yet.</p>
        <Link href="/" className={clsx("widget-button", styles.homeLink)}>
          Go Home
        </Link>
      </div>
    </div>
  );
}
