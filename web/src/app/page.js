"use client";

import { useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  Globe,
  Lock,
  ShieldCheck,
  Sparkles,
  Users,
  Video,
} from "lucide-react";
import styles from "./page.module.css";

export default function Home() {
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    // Warm up the Render backend
    const warmUp = async () => {
      try {
        // Both HTTP and WSS usually wake up the service on Render
        // We'll use the HTTPS endpoint for a simple pulse
        const backendUrl = "https://clair.onrender.com";
        console.log("[Clair] Warming up backend...");
        await fetch(backendUrl, { mode: 'no-cors' });
      } catch (e) {
        // Ignore errors, it's just a pulse
      }
    };
    warmUp();
  }, []);

  const container = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const fadeUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.6,
        ease: [0.22, 1, 0.36, 1]
      }
    },
  };

  const landingImages = {
    hero: {
      src: "/images/hero.png",
      alt: "Clair video calling interface",
    },
    features: [
      {
        src: "/images/feature-video.png",
        alt: "Crystal clear video",
        title: "Crystal‑clear video",
        text: "Adaptive quality with smooth motion so you stay present even on variable networks.",
      },
      {
        src: "/images/feature-effects.png",
        alt: "Immersive effects",
        title: "Immersive effects",
        text: "Subtle, tasteful effects and reactions designed for conversation, not distraction.",
      },
      {
        src: "/images/feature-layouts.png",
        alt: "Smart layouts",
        title: "Smart Layouts",
        text: "Prioritizes who’s speaking without turning your call into a generic grid.",
      },
      {
        src: "/images/feature-watch.png",
        alt: "Watch parties",
        title: "Watch parties",
        text: "Share a moment with synced playback and low‑latency voice.",
      },
    ],
    security: {
      src: "/images/security.png",
      alt: "Peer-to-peer encrypted connection",
    },
  };

  return (
    <div className={styles.page}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            "name": "Clair",
            "operatingSystem": "Web",
            "applicationCategory": "CommunicationApplication",
            "offers": {
              "@type": "Offer",
              "price": "0",
              "priceCurrency": "USD"
            },
            "description": "Experience crystal-clear, low-latency video calls with Clair. Built for privacy and presence with peer-to-peer technology."
          })
        }}
      />
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
              Try it out
            </Link>
            <Link className={styles.headerPrimary} href="/app">
              Go to app
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
              streams, instant reactions, watch parties, and immersive effects.
            </p>

            <div className={styles.heroCtas}>
              <Link className={styles.primaryBtn} href="/auth">
                Try it out
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
            initial={reduceMotion ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          >
             <div className={styles.imageFrame}>
              <Image
                src={landingImages.hero.src}
                alt={landingImages.hero.alt}
                width={1200}
                height={800}
                className={styles.heroImg}
                priority
              />
            </div>
          </motion.div>
        </section>

        <section className={styles.section} id="features">
          <motion.div 
            className={styles.sectionHeader}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeUp}
          >
            <h2 className={styles.sectionTitle}>Built for presence.</h2>
            <p className={styles.sectionSubtitle}>
              Clair keeps the call lightweight and responsive, then adds delight.
            </p>
          </motion.div>

          <motion.div 
            className={styles.featureGrid}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={container}
          >
            {landingImages.features.map((feature, i) => (
              <motion.div 
                key={i} 
                className={styles.featureCard}
                variants={fadeUp}
                whileHover={{ y: -5, transition: { duration: 0.2 } }}
              >
                <div className={styles.featureImageContainer}>
                  <Image
                    src={feature.src}
                    alt={feature.alt}
                    width={400}
                    height={300}
                    className={styles.featureImg}
                  />
                </div>
                <h3 className={styles.featureTitle}>{feature.title}</h3>
                <p className={styles.featureText}>{feature.text}</p>
              </motion.div>
            ))}
          </motion.div>
        </section>

        <section className={styles.section} id="security">
          <div className={styles.split}>
            <motion.div 
              className={styles.splitCopy}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={fadeUp}
            >
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
            </motion.div>

            <motion.div 
              className={styles.splitVisual}
              initial={reduceMotion ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            >
               <Image
                  src={landingImages.security.src}
                  alt={landingImages.security.alt}
                  width={600}
                  height={400}
                  className={styles.securityImg}
               />
            </motion.div>
          </div>
        </section>

        <section className={styles.section} id="why">
          <motion.div 
            className={styles.ctaCard}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeUp}
          >
            <h2 className={styles.ctaTitle}>Meet Clair, the new default.</h2>
            <p className={styles.ctaText}>
              Built for friends, teams, and creators who want video that feels
              effortless.
            </p>
            <div className={styles.ctaActions}>
              <Link className={styles.primaryBtn} href="/auth">
                Continue to app
                <ArrowRight size={18} aria-hidden="true" />
              </Link>
              <a className={styles.secondaryBtn} href="#features">
                Learn more
              </a>
            </div>
          </motion.div>
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
