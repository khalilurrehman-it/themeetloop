import type { Metadata } from "next";
import { Geist_Mono, Manrope } from "next/font/google";
import NextTopLoader from "nextjs-toploader";

import { ApplicationToastNotifications } from "@/components/feedback/ApplicationToastNotifications";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "MeetLoop — Meetings that remember",
    template: "%s · MeetLoop",
  },
  description:
    "Live multilingual transcription, actionable meeting notes, and memory that carries across every conversation.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${manrope.variable} ${geistMono.variable} h-full scroll-smooth antialiased`}
    >
      <body className="flex min-h-full flex-col bg-white text-neutral-950">
        <NextTopLoader
          color="#171717"
          height={2}
          showSpinner={false}
          shadow={false}
          easing="ease-out"
          speed={250}
        />
        <ApplicationToastNotifications />
        <TooltipProvider>{children}</TooltipProvider>
      </body>
    </html>
  );
}
