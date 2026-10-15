"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { useAuth } from "./auth-context";

export type Room = string;
export type RoomInfo = { id: number; name: string };
export type Booking = {
  id: number;
  roomId: number;
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

type ApiBooking = {
  id: number;
  roomId: number;
  startTime: string;
  endTime: string;
  isMine: boolean;
  isCancelled: boolean;
};

function minuteFromUtc(value: string) {
  return Number(value.slice(11, 13)) * 60 + Number(value.slice(14, 16));
}

function timeForApi(minutes: number) {
  return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}:00`;
}

function toBooking(value: ApiBooking, rooms: RoomInfo[]): Booking {
  return {
    id: value.id,
    roomId: value.roomId,
    room: rooms.find((room) => room.id === value.roomId)?.name ?? `Room ${value.roomId}`,
    date: value.startTime.slice(0, 10),
    start: minuteFromUtc(value.startTime),
    end: minuteFromUtc(value.endTime),
    title: value.isMine ? "My meeting" : "Booked",
    mine: value.isMine,
    status: value.isCancelled ? "Cancelled" : "Confirmed",
  };
}

export class BookingApiError extends Error {
  constructor(message: string, public status: number) { super(message); }
}

async function readResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const body = await response.json().catch(() => null) as { message?: string } | null;
    throw new BookingApiError(body?.message ?? `Booking API returned ${response.status}.`, response.status);
  }
  return response.json() as Promise<T>;
}

type BookingContextValue = {
  rooms: RoomInfo[];
  bookings: Booking[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  loadRoomBookings: (roomId: number, date: string) => Promise<Booking[]>;
  addBooking: (booking: { roomId: number; date: string; start: number; end: number }) => Promise<Booking>;
  cancelBooking: (id: number) => Promise<void>;
};

const BookingContext = createContext<BookingContextValue | null>(null);

export function BookingProvider({ children }: { children: ReactNode }) {
  const { state, apiRequest } = useAuth();
  const [rooms, setRooms] = useState<RoomInfo[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [roomResponse, mineResponse] = await Promise.all([
        apiRequest("/api/rooms"),
        apiRequest("/api/bookings/mine"),
      ]);
      const nextRooms = await readResponse<RoomInfo[]>(roomResponse);
      const mine = await readResponse<ApiBooking[]>(mineResponse);
      setRooms(nextRooms);
      setBookings(mine.map((booking) => toBooking(booking, nextRooms)));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not load bookings.");
    } finally {
      setLoading(false);
    }
  }, [apiRequest]);

  useEffect(() => {
    let cancelled = false;
    if (state === "authenticated") queueMicrotask(() => { if (!cancelled) void refresh(); });
    return () => { cancelled = true; };
  }, [state, refresh]);

  const loadRoomBookings = useCallback(async (roomId: number, date: string) => {
    const response = await apiRequest(`/api/rooms/${roomId}/bookings?date=${encodeURIComponent(date)}`);
    return (await readResponse<ApiBooking[]>(response)).map((booking) => toBooking(booking, rooms));
  }, [apiRequest, rooms]);

  async function addBooking(booking: { roomId: number; date: string; start: number; end: number }) {
    const response = await apiRequest(`/api/rooms/${booking.roomId}/bookings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date: booking.date, startTime: timeForApi(booking.start), endTime: timeForApi(booking.end) }),
    });
    const saved = toBooking(await readResponse<ApiBooking>(response), rooms);
    setBookings((current) => [...current, saved]);
    return saved;
  }

  async function cancelBooking(id: number) {
    const response = await apiRequest(`/api/bookings/${id}`, { method: "DELETE" });
    if (!response.ok) {
      const body = await response.json().catch(() => null) as { message?: string } | null;
      throw new BookingApiError(body?.message ?? `Cancellation failed (${response.status}).`, response.status);
    }
    setBookings((current) => current.map((booking) => booking.id === id ? { ...booking, status: "Cancelled" } : booking));
  }

  return <BookingContext.Provider value={{
    rooms: state === "authenticated" ? rooms : [],
    bookings: state === "authenticated" ? bookings : [],
    loading: state === "authenticated" ? loading : true,
    error: state === "authenticated" ? error : null,
    refresh, loadRoomBookings, addBooking, cancelBooking,
  }}>{children}</BookingContext.Provider>;
}

export function useBookings() {
  const context = useContext(BookingContext);
  if (!context) throw new Error("useBookings must be used within BookingProvider");
  return context;
}
