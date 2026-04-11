import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TradingAgents Research – AI-Powered Equity Analysis",
  description: "AI-powered stock analysis platform.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
