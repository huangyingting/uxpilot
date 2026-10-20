import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/Providers";

export const metadata: Metadata = {
  title: "UX Pilot Studio — AI UI/UX Design, Wireframing & Predictive Review",
  description:
    "AI-powered UI design canvas, wireframing, design system import, predictive eye-tracking UX reviews, GitHub PR reviews, and shader labs.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#0b0f19] text-slate-100 antialiased selection:bg-indigo-500 selection:text-white">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
