import { Figtree } from "next/font/google";
import "./globals.css";

const figtree = Figtree({
  variable: "--font-figtree",
  subsets: ["latin"],
});

export const metadata = {
  metadataBase: new URL("https://clairrr.vercel.app"),
  title: "Clair | Next‑Gen P2P Video Calling",
  description: "Experience crystal-clear, low-latency video calls with Clair. Built for privacy and presence with peer-to-peer technology.",
  keywords: ["video calling", "P2P", "peer-to-peer", "WebRTC", "privacy", "secure calls", "HD video"],
  authors: [{ name: "Clair Team" }],
  openGraph: {
    title: "Clair | Next‑Gen P2P Video Calling",
    description: "Experience crystal-clear, low-latency video calls with Clair. Built for privacy and presence.",
    url: "https://clairrr.vercel.app",
    siteName: "Clair",
    images: [
      {
        url: "/images/hero.png",
        width: 1200,
        height: 630,
        alt: "Clair Landing Page Hero",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Clair | Next‑Gen P2P Video Calling",
    description: "Experience crystal-clear, low-latency video calls with Clair. Built for privacy and presence.",
    images: ["/images/hero.png"],
  },
  viewport: "width=device-width, initial-scale=1",
  robots: "index, follow",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${figtree.variable}`}>
        {children}
      </body>
    </html>
  );
}
