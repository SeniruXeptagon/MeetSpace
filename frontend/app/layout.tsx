import type { Metadata } from "next";
import { Suspense } from "react";
import { BookingProvider } from "./components/booking-context";
import { AuthProvider } from "./components/auth-context";
import "./globals.css";
import "./booking-api.css";

export const metadata: Metadata = {
  title: "MeetSpace | Meeting room bookings",
  description: "Find the right space for your next meeting.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body><Suspense fallback={<div className="app-loading">Loading MeetSpace…</div>}><AuthProvider><BookingProvider>{children}</BookingProvider></AuthProvider></Suspense></body></html>;
}
