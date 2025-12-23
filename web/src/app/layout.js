import { Figtree } from "next/font/google";
import "./globals.css";

const figtree = Figtree({
  variable: "--font-figtree",
  subsets: ["latin"],
});

export const metadata = {
  title: "Clair",
  description: "Clair — next‑gen peer‑to‑peer video calling.",
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
