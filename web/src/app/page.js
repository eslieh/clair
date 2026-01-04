"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  Globe,
  Lock,
  ShieldCheck,
  Sparkles,
  Users,
  Video,
  Wand2,
  Image as ImageIcon
} from "lucide-react";
import styles from "./page.module.css";

export default function Home() {
  const reduceMotion = useReducedMotion();

  const fadeUp = {
    hidden: { opacity: 0, y: 14 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link className={styles.brand} href="/">
            <span className={styles.brandMark} aria-hidden="true" />
            <span className={styles.brandName}>Clair</span>
          </Link>
          <nav className={styles.nav} aria-label="Primary">
            <a className={styles.navLink} href="#features">
              Features
            </a>
            <a className={styles.navLink} href="#security">
              Security
            </a>
            <a className={styles.navLink} href="#why">
              Why P2P
            </a>
          </nav>
          <div className={styles.headerCtas}>
            <Link className={styles.headerGhost} href="/auth">
              Join waitlist
            </Link>
            <Link className={styles.headerPrimary} href="/auth">
              Get early access
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </header>

      <main className={styles.main}>
        <section className={styles.hero}>
          <motion.div
            className={styles.heroCopy}
            initial={reduceMotion ? "visible" : "hidden"}
            animate="visible"
            variants={fadeUp}
            transition={{ duration: 0.55, ease: [0.2, 0.8, 0.2, 1] }}
          >
            <div className={styles.kicker}>
              <span className={styles.kickerIcon}>
                <Sparkles size={14} aria-hidden="true" />
              </span>
              <span>Next‑gen P2P video calling</span>
            </div>

            <h1 className={styles.headline}>
              Calls that feel
              <span className={styles.headlineAccent}> in the room</span>.
            </h1>
            <p className={styles.subhead}>
              Clair is a peer‑to‑peer video chat built for presence: crystal‑clear
              streams, instant reactions, watch parties, and immersive effects—
              without the “meeting app” vibe.
            </p>

            <div className={styles.heroCtas}>
              <Link className={styles.primaryBtn} href="/auth">
                Get early access
                <ArrowRight size={18} aria-hidden="true" />
              </Link>
              <a className={styles.secondaryBtn} href="#features">
                Explore features
              </a>
            </div>

            <div className={styles.heroMeta}>
              <div className={styles.metaItem}>
                <Video size={16} aria-hidden="true" />
                <span>Low‑latency HD</span>
              </div>
              <div className={styles.metaItem}>
                <Users size={16} aria-hidden="true" />
                <span>1:1 and groups</span>
              </div>
              <div className={styles.metaItem}>
                <Globe size={16} aria-hidden="true" />
                <span>Works everywhere</span>
              </div>
            </div>
          </motion.div>

          <motion.div
            className={styles.heroVisual}
            initial={reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.05, ease: [0.2, 0.8, 0.2, 1] }}
          >
             <div className={styles.imagePlaceholder}>
                <ImageIcon size={48} className={styles.imagePlaceholderIcon} />
                <span>Product / App Screenshot</span>
             </div>
          </motion.div>
        </section>

        <section className={styles.section} id="features">
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Built for presence.</h2>
            <p className={styles.sectionSubtitle}>
              Clair keeps the call lightweight and responsive, then adds delight.
            </p>
          </div>

          <div className={styles.featureGrid}>
            <div className={styles.featureCard}>
              <div className={styles.featureImage}>Reference Image</div>
              <h3 className={styles.featureTitle}>Crystal‑clear video</h3>
              <p className={styles.featureText}>
                Adaptive quality with smooth motion so you stay present even on variable networks.
              </p>
            </div>

            <div className={styles.featureCard}>
              <div className={styles.featureImage}>Reference Image</div>
              <h3 className={styles.featureTitle}>Immersive effects</h3>
              <p className={styles.featureText}>
                Subtle, tasteful effects and reactions designed for conversation, not distraction.
              </p>
            </div>

            <div className={styles.featureCard}>
               <div className={styles.featureImage}>Reference Image</div>
              <h3 className={styles.featureTitle}>Smart Layouts</h3>
              <p className={styles.featureText}>
                Prioritizes who’s speaking without turning your call into a generic grid.
              </p>
            </div>
            
             <div className={styles.featureCard}>
               <div className={styles.featureImage}>Reference Image</div>
              <h3 className={styles.featureTitle}>Watch parties</h3>
              <p className={styles.featureText}>
                Share a moment with synced playback and low‑latency voice.
              </p>
            </div>
          </div>
        </section>

        <section className={styles.section} id="security">
          <div className={styles.split}>
            <div className={styles.splitCopy}>
              <h2 className={styles.sectionTitle}>Private by design.</h2>
              <p className={styles.sectionSubtitle}>
                Peer‑to‑peer connections keep your call direct. Clair is built to
                minimize data and maximize control.
              </p>
              <div className={styles.checks}>
                <div className={styles.checkItem}>
                  <ShieldCheck size={20} className={styles.kickerIcon} style={{color: '#0071e3'}} />
                  <span>End‑to‑end encrypted media</span>
                </div>
                <div className={styles.checkItem}>
                  <Lock size={20} className={styles.kickerIcon} style={{color: '#0071e3'}} />
                  <span>Ephemeral rooms and links</span>
                </div>
                <div className={styles.checkItem}>
                  <Globe size={20} className={styles.kickerIcon} style={{color: '#0071e3'}} />
                  <span>Direct P2P Routing</span>
                </div>
              </div>
            </div>

            <div className={styles.splitVisual}>
                 <span>Security Diagram / Visual</span>
            </div>
          </div>
        </section>

        <section className={styles.section} id="why">
          <div className={styles.ctaCard}>
            <h2 className={styles.ctaTitle}>Meet Clair, the new default.</h2>
            <p className={styles.ctaText}>
              Built for friends, teams, and creators who want video that feels
              effortless.
            </p>
            <div className={styles.ctaActions}>
              <Link className={styles.primaryBtn} href="/auth">
                Join the waitlist
                <ArrowRight size={18} aria-hidden="true" />
              </Link>
              <a className={styles.secondaryBtn} href="#features">
                Learn more
              </a>
            </div>
          </div>
        </section>
      </main>

      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <div className={styles.footerBrand}>
            <span className={styles.brandMarkSmall} aria-hidden="true" />
            <span>Clair</span>
          </div>
          <div className={styles.footerNote}>
            <span>© {new Date().getFullYear()} Clair</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
