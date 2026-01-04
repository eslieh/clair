"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Chrome,
  Eye,
  EyeOff,
  Lock,
  Mail,
  User,
} from "lucide-react";
import { useId, useMemo, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { login, signup } from "./actions";
import styles from "./auth.module.css";

export default function AuthPage() {
  const reduceMotion = useReducedMotion();
  const idBase = useId();
  const router = useRouter();

  const [mode, setMode] = useState("signup");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const copy = useMemo(() => {
    if (mode === "signin") {
      return {
        title: "Welcome back",
        subtitle: "Sign in to pick up your next call.",
        primary: "Sign in",
        toggleLead: "New here?",
        toggleAction: "Create an account",
      };
    }

    return {
      title: "Create your account",
      subtitle: "Start calling with next‑gen P2P video.",
      primary: "Create account",
      toggleLead: "Already have an account?",
      toggleAction: "Sign in",
    };
  }, [mode]);

  const nameId = `${idBase}-name`;
  const emailId = `${idBase}-email`;
  const passwordId = `${idBase}-password`;

  async function handleSubmit(e) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    
    try {
      const action = mode === 'signup' ? signup : login;
      const result = await action(formData);
      
      if (result?.error) {
        setError(result.error);
        setIsSubmitting(false);
      }
    } catch (e) {
      // In case of network error etc
      setError("Something went wrong. Please try again.");
      setIsSubmitting(false);
    }
  }

  const handleGoogleLogin = async () => {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  const enter = reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 };
  const initial = reduceMotion ? { opacity: 1 } : { opacity: 0, y: 12 };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link className={styles.brand} href="/">
          <span className={styles.brandMark} aria-hidden="true" />
          <span className={styles.brandName}>Clair</span>
        </Link>
        <Link className={styles.back} href="/">
          <ArrowLeft size={16} aria-hidden="true" />
          Back to home
        </Link>
      </header>

      <main className={styles.main}>
        <motion.section
          className={styles.panel}
          initial={initial}
          animate={enter}
          transition={{ duration: 0.55, ease: [0.2, 0.8, 0.2, 1] }}
        >
          <div className={styles.panelSide}>
            <div className={styles.kicker}>Next‑gen video calling</div>
            <h1 className={styles.headline}>Clair</h1>
            <p className={styles.tagline}>
              A peer‑to‑peer video chat built for presence: fast, clear, and
              designed to feel human.
            </p>
            <div className={styles.sideStats} aria-hidden="true">
              <div className={styles.stat}>
                <span className={styles.statIcon}>
                  <Lock size={16} />
                </span>
                <span>Private sessions</span>
              </div>
              <div className={styles.stat}>
                <span className={styles.statIcon}>
                  <Chrome size={16} />
                </span>
                <span>Works in browser</span>
              </div>
            </div>
          </div>

          <div className={styles.cardWrap}>
            <div className={styles.cardHeader}>
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={mode}
                  initial={initial}
                  animate={enter}
                  exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -10 }}
                  transition={{ duration: 0.28, ease: [0.2, 0.8, 0.2, 1] }}
                >
                  <h2 className={styles.cardTitle}>{copy.title}</h2>
                  <p className={styles.cardSubtitle}>{copy.subtitle}</p>
                </motion.div>
              </AnimatePresence>
            </div>

            <button
              type="button"
              className={styles.googleBtn}
              onClick={handleGoogleLogin}
              aria-label="Continue with Google"
            >
              <Chrome size={18} aria-hidden="true" />
              Continue with Google
            </button>

            <div className={styles.divider} role="separator" aria-label="or" />

            <form className={styles.form} onSubmit={handleSubmit}>
              {error && (
                <div style={{ color: 'var(--red-500, #ef4444)', fontSize: '0.875rem', marginBottom: '1rem', textAlign: 'center' }}>
                  {error}
                </div>
              )}
              <AnimatePresence initial={false} mode="popLayout">
                {mode === "signup" ? (
                  <motion.div
                    key="name"
                    className={styles.field}
                    initial={initial}
                    animate={enter}
                    exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -8 }}
                    transition={{ duration: 0.22, ease: [0.2, 0.8, 0.2, 1] }}
                  >
                    <label className={styles.label} htmlFor={nameId}>
                      Name
                    </label>
                    <div className={styles.inputWrap}>
                      <User size={18} aria-hidden="true" />
                      <input
                        id={nameId}
                        name="name"
                        type="text"
                        autoComplete="name"
                        placeholder="Your name"
                        required
                        className={styles.input}
                      />
                    </div>
                  </motion.div>
                ) : null}
              </AnimatePresence>

              <div className={styles.field}>
                <label className={styles.label} htmlFor={emailId}>
                  Email
                </label>
                <div className={styles.inputWrap}>
                  <Mail size={18} aria-hidden="true" />
                  <input
                    id={emailId}
                    name="email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@domain.com"
                    required
                    className={styles.input}
                  />
                </div>
              </div>

              <div className={styles.field}>
                <label className={styles.label} htmlFor={passwordId}>
                  Password
                </label>
                <div className={`${styles.inputWrap} ${styles.inputWrapWithBtn}`}>
                  <Lock size={18} aria-hidden="true" />
                  <input
                    id={passwordId}
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete={mode === "signin" ? "current-password" : "new-password"}
                    placeholder="••••••••"
                    required
                    minLength={8}
                    className={styles.input}
                  />
                  <button
                    type="button"
                    className={styles.iconBtn}
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <EyeOff size={18} aria-hidden="true" />
                    ) : (
                      <Eye size={18} aria-hidden="true" />
                    )}
                  </button>
                </div>
              </div>

              <button
                className={styles.submit}
                type="submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Please wait…" : copy.primary}
                <ArrowRight size={18} aria-hidden="true" />
              </button>

              <div className={styles.bottomRow}>
                <span className={styles.bottomText}>{copy.toggleLead}</span>
                <button
                  type="button"
                  className={styles.linkBtn}
                  onClick={() => setMode((m) => (m === "signin" ? "signup" : "signin"))}
                >
                  {copy.toggleAction}
                </button>
              </div>
            </form>
          </div>
        </motion.section>
      </main>
    </div>
  );
}
