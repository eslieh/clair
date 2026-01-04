"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Info, Link2, Phone, User, Video, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import styles from "./app.module.css";

export default function AppLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const reduceMotion = useReducedMotion();

  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const [authState, setAuthState] = useState("checking");
  const [camState, setCamState] = useState("idle");
  const [camError, setCamError] = useState(null);

  const [accountOpen, setAccountOpen] = useState(false);
  const photoInputRef = useRef(null);

  const recents = useMemo(
    () => [
      {
        section: "Yesterday",
        items: [
          { name: "Mommy ❤️❤️", meta: "mobile · Yesterday" },
          { name: "Mark", meta: "mobile · Yesterday" },
        ],
      },
      {
        section: "Last Week",
        items: [
          { name: "Brian", meta: "mobile · 20/12/2025" },
          { name: "Ian, Work", meta: "phone · 19/12/2025" },
          { name: "Sonie", meta: "mobile · 18/12/2025" },
          { name: "Kirk 💯💪", meta: "mobile · 18/12/2025" },
          { name: "Dennis, Work", meta: "phone · 18/12/2025" },
        ],
      },
    ],
    []
  );

  const startCamera = useCallback(async () => {
    setCamError(null);
    setCamState("requesting");

    try {
      if (!navigator?.mediaDevices?.getUserMedia) {
        setCamState("error");
        setCamError("Camera is not supported in this browser.");
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        try {
          await videoRef.current.play();
        } catch {}
      }

      setCamState("ready");
    } catch (e) {
      const name = e?.name || "";
      if (name === "NotAllowedError" || name === "SecurityError") {
        setCamState("denied");
        setCamError("Camera permission was blocked.");
        return;
      }

      setCamState("error");
      setCamError("Could not start the camera.");
    }
  }, []);

  useEffect(() => {
    try {
      const ok = localStorage.getItem("clair_authed") === "1";
      setAuthState(ok ? "authed" : "guest");
      if (!ok) router.replace("/auth");
    } catch {
      setAuthState("guest");
      router.replace("/auth");
    }
  }, [router]);

  useEffect(() => {
    if (authState !== "authed") return;
    startCamera();

    return () => {
      const stream = streamRef.current;
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }
      streamRef.current = null;
    };
  }, [authState, startCamera]);

  const contactCard = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("clair_contact_card") || "{}");
    } catch {
      return {};
    }
  }, []);

  const [contactName, setContactName] = useState(contactCard?.name || "");
  const [contactPhone, setContactPhone] = useState(contactCard?.phone || "");
  const [contactEmail, setContactEmail] = useState(contactCard?.email || "");
  const [contactPhoto, setContactPhoto] = useState(contactCard?.photo || "");
  const [contactPrimary, setContactPrimary] = useState(contactCard?.primary || "auto");

  const primaryValue = useMemo(() => {
    if (contactPrimary === "phone") return contactPhone || contactEmail;
    if (contactPrimary === "email") return contactEmail || contactPhone;
    return contactEmail || contactPhone;
  }, [contactEmail, contactPhone, contactPrimary]);

  const saveContactCard = useCallback(() => {
    try {
      localStorage.setItem(
        "clair_contact_card",
        JSON.stringify({
          name: contactName,
          phone: contactPhone,
          email: contactEmail,
          photo: contactPhoto,
          primary: contactPrimary,
        })
      );
    } catch {}
  }, [contactEmail, contactName, contactPhone, contactPhoto, contactPrimary]);

  useEffect(() => {
    if (!accountOpen) return;

    const onKeyDown = (e) => {
      if (e.key === "Escape") setAccountOpen(false);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [accountOpen]);

  const motionProps = reduceMotion
    ? { initial: false, animate: { opacity: 1 }, exit: { opacity: 0 } }
    : {
        initial: { opacity: 0, y: 8 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -8 },
      };

  const showGate = authState !== "authed";
  const showSidebar = authState === "authed";

  return (
    <div className={styles.shell}>
      {showSidebar ? (
        <aside className={styles.sidebar} aria-label="Sidebar">
          <div className={styles.sidebarTop}>
            <div className={styles.sidebarActions}>
              <button type="button" className={styles.actionBtn}>
                <Link2 size={16} aria-hidden="true" />
                Create Link
              </button>
              <button type="button" className={styles.actionBtnPrimary}>
                <Video size={16} aria-hidden="true" />
                New Clair Call
              </button>
            </div>
          </div>

          <div className={styles.sidebarScroll}>
            {recents.map((group) => (
              <div key={group.section} className={styles.recentGroup}>
                <div className={styles.recentHeading}>{group.section}</div>
                <div className={styles.recentList}>
                  {group.items.map((item) => (
                    <div key={item.name} className={styles.recentRow}>
                      <div className={styles.avatar} aria-hidden="true">
                        {item.name.trim().slice(0, 1).toUpperCase()}
                      </div>
                      <div className={styles.recentText}>
                        <div className={styles.recentName}>{item.name}</div>
                        <div className={styles.recentMeta}>{item.meta}</div>
                      </div>
                      <div className={styles.recentIcons} aria-hidden="true">
                        <Info size={16} />
                        <Phone size={16} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            <button
              type="button"
              className={styles.accountEntry}
              onClick={() => setAccountOpen(true)}
            >
              <span className={styles.accountEntryIcon} aria-hidden="true">
                <User size={16} />
              </span>
              <span className={styles.accountEntryText}>
                <span className={styles.accountEntryTitle}>Account</span>
                <span className={styles.accountEntrySubtitle}>
                  Edit your contact card
                </span>
              </span>
            </button>
          </div>
        </aside>
      ) : null}

      <div className={styles.stage}>
        <video
          ref={videoRef}
          className={styles.video}
          playsInline
          muted
          autoPlay
        />
        <div className={styles.vignette} aria-hidden="true" />

        <div
          className={`${styles.stageContent} ${showSidebar ? styles.stageContentWithSidebar : ""}`}
        >
          <AnimatePresence mode="wait" initial={false}>
            {showGate ? (
              <motion.div
                key="gate"
                className={styles.centerCard}
                {...motionProps}
                transition={{ duration: 0.35, ease: [0.2, 0.8, 0.2, 1] }}
              >
                <div className={styles.centerTitle}>Redirecting…</div>
                <div className={styles.centerText}>
                  You need to be logged in to use Clair.
                </div>
                <Link className={styles.centerBtn} href="/auth">
                  Go to auth
                </Link>
              </motion.div>
            ) : camState === "requesting" ? (
              <motion.div
                key="cam-request"
                className={styles.centerCard}
                {...motionProps}
                transition={{ duration: 0.35, ease: [0.2, 0.8, 0.2, 1] }}
              >
                <div className={styles.centerTitle}>Starting camera…</div>
                <div className={styles.centerText}>
                  Allow camera access to preview your video.
                </div>
              </motion.div>
            ) : camState === "denied" || camState === "error" ? (
              <motion.div
                key="cam-error"
                className={styles.centerCard}
                {...motionProps}
                transition={{ duration: 0.35, ease: [0.2, 0.8, 0.2, 1] }}
              >
                <div className={styles.centerTitle}>Camera unavailable</div>
                <div className={styles.centerText}>
                  {camError || "Please check permissions and try again."}
                </div>
                <button
                  type="button"
                  className={styles.centerBtn}
                  onClick={startCamera}
                >
                  Try again
                </button>
              </motion.div>
            ) : (
              <motion.div
                key={pathname}
                className={styles.route}
                {...motionProps}
                transition={{ duration: 0.35, ease: [0.2, 0.8, 0.2, 1] }}
              >
                {children}
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {showSidebar && accountOpen ? (
              <motion.div
                key="account-sheet"
                className={styles.accountSheetWrap}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <button
                  type="button"
                  className={styles.accountSheetBackdrop}
                  aria-label="Close account"
                  onClick={() => setAccountOpen(false)}
                />

                <motion.aside
                  className={styles.accountSheet}
                  initial={{ x: 28, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: 28, opacity: 0 }}
                  transition={{ duration: 0.28, ease: [0.2, 0.8, 0.2, 1] }}
                  aria-label="Account"
                >
                  <div className={styles.accountSheetHeader}>
                    <button
                      type="button"
                      className={styles.accountSheetClose}
                      onClick={() => setAccountOpen(false)}
                      aria-label="Close"
                    >
                      <X size={16} aria-hidden="true" />
                    </button>
                  </div>

                  <div className={styles.accountSheetBody}>
                    <div className={styles.contactCardPreview}>
                      <button
                        type="button"
                        className={styles.contactAvatarBtn}
                        onClick={() => photoInputRef.current?.click()}
                        aria-label="Edit photo"
                      >
                        {contactPhoto ? (
                          <img
                            className={styles.contactAvatarImg}
                            src={contactPhoto}
                            alt=""
                          />
                        ) : (
                          <span className={styles.contactAvatarFallback} aria-hidden="true">
                            {contactName?.trim()?.slice(0, 1)?.toUpperCase() || "?"}
                          </span>
                        )}
                        <span className={styles.contactAvatarEdit}>edit</span>
                      </button>

                      <div className={styles.contactCardName}>
                        {contactName?.trim() || "Your name"}
                      </div>
                      <div className={styles.contactCardMeta}>
                        {primaryValue || "Add email or phone"}
                      </div>

                      <input
                        ref={photoInputRef}
                        type="file"
                        accept="image/*"
                        className={styles.hiddenFile}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          const reader = new FileReader();
                          reader.onload = () => {
                            if (typeof reader.result === "string") {
                              setContactPhoto(reader.result);
                            }
                          };
                          reader.readAsDataURL(file);
                        }}
                      />
                    </div>

                    <label className={styles.field}>
                      <span className={styles.label}>Name</span>
                      <input
                        className={styles.input}
                        value={contactName}
                        onChange={(e) => setContactName(e.target.value)}
                        placeholder="Your name"
                        autoComplete="name"
                      />
                    </label>

                    <label className={styles.field}>
                      <span className={styles.label}>Phone</span>
                      <input
                        className={styles.input}
                        value={contactPhone}
                        onChange={(e) => setContactPhone(e.target.value)}
                        placeholder="+1 (555) 000‑0000"
                        autoComplete="tel"
                      />
                    </label>

                    <label className={styles.field}>
                      <span className={styles.label}>Email</span>
                      <input
                        className={styles.input}
                        value={contactEmail}
                        onChange={(e) => setContactEmail(e.target.value)}
                        placeholder="you@example.com"
                        autoComplete="email"
                      />
                    </label>

                    <label className={styles.field}>
                      <span className={styles.label}>Default</span>
                      <select
                        className={styles.select}
                        value={contactPrimary}
                        onChange={(e) => setContactPrimary(e.target.value)}
                      >
                        <option value="auto">Email (fallback to phone)</option>
                        <option value="email">Email only</option>
                        <option value="phone">Phone only</option>
                      </select>
                    </label>
                  </div>

                  <div className={styles.accountSheetActions}>
                    <button
                      type="button"
                      className={styles.accountSheetBtn}
                      onClick={() => {
                        saveContactCard();
                        setAccountOpen(false);
                      }}
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      className={styles.accountSheetBtnSecondary}
                      onClick={() => setAccountOpen(false)}
                    >
                      Cancel
                    </button>
                  </div>
                </motion.aside>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
