import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

export const metadata: Metadata = {
    title: "TradingAgents Research - AI-Powered Equity Analysis",
    description: "AI-powered stock analysis platform. Get 1 free analysis, then subscribe for unlimited access.",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
          <ClerkProvider>
                <html lang="en">
                        <body
                                    className={`${geistSans.variable} ${geistMono.variable} antialiased`}
                                  >
                          {children}
                        </body>body>
                </html>html>
          </ClerkProvider>ClerkProvider>
        );
}</ClerkProvider>
