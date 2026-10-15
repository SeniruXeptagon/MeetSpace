"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

export type Room = "Room A" | "Room B";
export type Booking = {
  id: string;
  room: Room;
  date: string;
  start: number;
  end: number;
  title: string;
  mine: boolean;
  status: "Confirmed" | "Cancelled";
};

export const START_MINUTE = 8 * 60;
export const END_MINUTE = 18 * 60;

export function localDate(offset = 0) {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function displayDate(value: string, options?: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat("en-US", options ?? { weekday: "long", month: "long", day: "numeric", year: "numeric" }).format(new Date(`${value}T12:00:00`));
}

export function timeLabel(minutes: number) {
  const hour = Math.floor(minutes / 60);
  const minute = String(minutes % 60).padStart(2, "0");
  const period = hour >= 12 ? "PM" : "AM";
  return `${hour % 12 || 12}:${minute} ${period}`;
}

export function durationLabel(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  if (!hours) return `${remainder} min`;
  if (!remainder) return `${hours} ${hours === 1 ? "hour" : "hours"}`;
  return `${hours} hr ${remainder} min`;
}

const initialBookings = (): Booking[] => [
  { id: "demo-1", room: "Room A", date: localDate(), start: 9 * 60 + 15, end: 10 * 60 + 20, title: "Product sync", mine: false, status: "Confirmed" },
  { id: "demo-2", room: "Room A", date: localDate(), start: 12 * 60 + 40, end: 14 * 60 + 5, title: "Design review", mine: false, status: "Confirmed" },
  { id: "demo-3", room: "Room A", date: localDate(), start: 15 * 60 + 35, end: 16 * 60 + 25, title: "Team catch-up", mine: false, status: "Confirmed" },
  { id: "demo-4", room: "Room B", date: localDate(), start: 10 * 60 + 30, end: 11 * 60 + 55, title: "Planning session", mine: false, status: "Confirmed" },
  { id: "demo-5", room: "Room B", date: localDate(), start: 14 * 60 + 10, end: 15 * 60 + 5, title: "Client call", mine: false, status: "Confirmed" },
  { id: "demo-6", room: "Room B", date: localDate(1), start: 10 * 60, end: 11 * 60, title: "Weekly standup", mine: true, status: "Confirmed" },
  { id: "demo-7", room: "Room A", date: localDate(2), start: 11 * 60, end: 12 * 60 + 30, title: "Project workshop", mine: true, status: "Confirmed" },
];

type BookingContextValue = {
  bookings: Booking[];
  addBooking: (booking: Omit<Booking, "id" | "mine" | "status">) => void;
  cancelBooking: (id: string) => void;
};

const BookingContext = createContext<BookingContextValue | null>(null);

export function BookingProvider({ children }: { children: ReactNode }) {
  const [bookings, setBookings] = useState<Booking[]>(initialBookings);

  function addBooking(booking: Omit<Booking, "id" | "mine" | "status">) {
    setBookings((current) => [...current, { ...booking, id: `new-${Date.now()}-${Math.random()}`, mine: true, status: "Confirmed" }]);
  }

  function cancelBooking(id: string) {
    setBookings((current) => current.map((booking) => booking.id === id && booking.mine ? { ...booking, status: "Cancelled" } : booking));
  }

  return <BookingContext.Provider value={{ bookings, addBooking, cancelBooking }}>{children}</BookingContext.Provider>;
}

export function useBookings() {
  const context = useContext(BookingContext);
  if (!context) throw new Error("useBookings must be used within BookingProvider");
  return context;
}
