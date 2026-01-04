"use client";

import { useRouter } from "next/navigation";
import styles from "../routes.module.css";

export default function AccountPage() {
  const router = useRouter();

  return (
    <div className={styles.overlayWide}>
      <div className={styles.overlayTitle}>Account</div>
      <div className={styles.overlayText}>
        This is currently a temporary local session for UI development.
      </div>

      <button
        type="button"
        className={styles.dangerBtn}
        onClick={() => {
          try {
            localStorage.removeItem("clair_authed");
          } catch {}
          router.replace("/auth");
        }}
      >
        Sign out
      </button>
    </div>
  );
}
