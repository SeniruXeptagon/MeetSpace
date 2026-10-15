import type { Metadata } from "next";
import { Suspense } from "react";
import { BookingProvider } from "./components/booking-context";
import "./globals.css";

export const metadata: Metadata = {
  title: "MeetSpace | Meeting room bookings",
  description: "Find the right space for your next meeting.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body><Suspense fallback={<div className="app-loading">Loading MeetSpace…</div>}><BookingProvider>{children}</BookingProvider></Suspense></body></html>;
}
