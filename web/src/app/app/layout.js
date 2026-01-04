"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Info, Link2, Phone, User, Video } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { CallProvider, useCall } from "@/contexts/CallContext";
import CallOverlay from "@/components/CallOverlay";
import Ringer from "@/components/Ringer";
import NewCallModal from "@/components/NewCallModal";
import { getCallHistory } from "@/app/app/calls/actions";
import styles from "./app.module.css";

export default function AppLayout({ children }) {
  return (
    <CallProvider>
      <AppLayoutContent>{children}</AppLayoutContent>
    </CallProvider>
  );
}

function AppLayoutContent({ children }) {
  const pathname = usePathname();
  const reduceMotion = useReducedMotion();

  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const [hasAuth, setHasAuth] = useState(false);
  const [camState, setCamState] = useState("idle");
  const [camError, setCamError] = useState(null);
  
  const [isNewCallModalOpen, setIsNewCallModalOpen] = useState(false);

  const [recentGroups, setRecentGroups] = useState([]);

  useEffect(() => {
    // Only fetch if authenticated to avoid errors
    if (hasAuth) {
      getCallHistory().then(calls => {
        const groups = groupCallsByDate(calls);
        setRecentGroups(groups);
      });
    }
  }, [hasAuth]);

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
    // Check for auth session to enable camera
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setHasAuth(!!data?.user);
    });
  }, []);

  useEffect(() => {
    if (!hasAuth) return;
    startCamera();

    return () => {
      const stream = streamRef.current;
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }
      streamRef.current = null;
    };
  }, [hasAuth, startCamera]);

  const motionProps = reduceMotion
    ? { initial: false, animate: { opacity: 1 }, exit: { opacity: 0 } }
    : {
        initial: { opacity: 0, y: 8 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -8 },
      };

  const isCallPage = pathname.startsWith("/app/call/");
  const showSidebar = !isCallPage;

  const { startCall } = useCall();

  const handleRedial = (item) => {
    if (item.other?.id) {
      startCall(item.other.id, item.other.display_name || 'User');
    }
  };

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
              <button 
                type="button" 
                className={styles.actionBtnPrimary}
                onClick={() => setIsNewCallModalOpen(true)}
              >
                <Video size={16} aria-hidden="true" />
                New Clair Call
              </button>
            </div>
          </div>

          <div className={styles.sidebarScroll}>
            {recentGroups.map((group) => (
              <div key={group.section} className={styles.recentGroup}>
                <div className={styles.recentHeading}>{group.section}</div>
                <div className={styles.recentList}>
                  {group.items.map((item) => (
                    <div key={item.id} className={styles.recentRow}>
                      <div className={styles.avatar} aria-hidden="true">
                        <img 
                          src={item.other?.avatar_url || `https://ui-avatars.com/api/?name=${item.other?.display_name || '?'}&background=random`} 
                          alt="" 
                          style={{width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%'}}
                        />
                      </div>
                      <div className={styles.recentText}>
                        <div className={styles.recentName}>{item.other?.display_name || 'Unknown'}</div>
                        <div className={styles.recentMeta}>
                          <span className={item.rawStatus === 'missed' ? styles.statusMissed : ''}>
                            {item.status}
                          </span>
                          {' • '}{item.meta}
                        </div>
                      </div>
                      <div className={styles.recentIcons} aria-hidden="true">
                        <Info size={16} title="Call Details" />
                        <Phone 
                          size={16} 
                          title="Call back" 
                          className={styles.clickableIcon}
                          onClick={() => handleRedial(item)} 
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            <Link
              href="/app/account"
              className={styles.accountEntry}
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
            </Link>
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
             {camState === "requesting" ? (
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

        </div>
      </div>
      <CallOverlay />
      <Ringer />
      {isNewCallModalOpen && (
        <NewCallModal onClose={() => setIsNewCallModalOpen(false)} />
      )}
    </div>
  );
}

function groupCallsByDate(calls) {
  const groups = {
    today: [],
    yesterday: [],
    lastWeek: [],
    older: [],
  };

  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  calls.forEach(call => {
    const date = new Date(call.date);
    const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const isToday = date.toDateString() === today.toDateString();
    const isYesterday = date.toDateString() === yesterday.toDateString();
    const isLastWeek = (today - date) < 7 * 24 * 60 * 60 * 1000;

    const item = {
      ...call,
      meta: isToday ? timeStr : (isYesterday ? 'Yesterday' : date.toLocaleDateString())
    };

    if (isToday) groups.today.push(item);
    else if (isYesterday) groups.yesterday.push(item);
    else if (isLastWeek) groups.lastWeek.push(item);
    else groups.older.push(item);
  });

  const result = [];
  if (groups.today.length > 0) result.push({ section: 'Today', items: groups.today });
  if (groups.yesterday.length > 0) result.push({ section: 'Yesterday', items: groups.yesterday });
  if (groups.lastWeek.length > 0) result.push({ section: 'Last Week', items: groups.lastWeek });
  if (groups.older.length > 0) result.push({ section: 'Older', items: groups.older });

  return result;
}
