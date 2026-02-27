import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "founders.ai — Autonomous Business Intelligence",
  description: "Transform business intent into structured strategy through autonomous multi-agent intelligence. Dynamic team generation, adversarial debate, and production-ready operational plans.",
  keywords: ["AI", "business strategy", "multi-agent", "autonomous planning", "startup", "executive AI"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="noise-overlay grid-bg" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
