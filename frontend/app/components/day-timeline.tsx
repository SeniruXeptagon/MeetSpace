"use client";

import { useRef, useState, type PointerEvent } from "react";
import { displayDate, END_MINUTE, START_MINUTE, timeLabel, type Booking, type Room } from "./booking-context";

const PIXELS_PER_MINUTE = 2;
const DAY_HEIGHT = (END_MINUTE - START_MINUTE) * PIXELS_PER_MINUTE;

type Gesture = { pointerId: number; start: number; previousAnchor: number | null; moved: boolean };

function overlaps(bookings: Booking[], start: number, end: number) {
  return bookings.some((booking) => start < booking.end && end > booking.start);
}

export function DayTimeline({ bookings, room, date, range, anchor, onRangeChange, onAnchorChange }: {
  bookings: Booking[];
  room: Room;
  date: string;
  range: [number, number] | null;
  anchor: number | null;
  onRangeChange: (range: [number, number] | null) => void;
  onAnchorChange: (minute: number | null) => void;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const gestureRef = useRef<Gesture | null>(null);
  const [hoverMinute, setHoverMinute] = useState<number | null>(null);

  function minuteAt(clientY: number) {
    const track = trackRef.current;
    if (!track) return START_MINUTE;
    const y = clientY - track.getBoundingClientRect().top;
    return Math.max(START_MINUTE, Math.min(END_MINUTE, START_MINUTE + Math.round(y / PIXELS_PER_MINUTE)));
  }

  function limitedRange(start: number, target: number): [number, number] | null {
    if (target === start) return null;
    if (target > start) {
      const nextBooking = bookings.filter((booking) => booking.start >= start).reduce((nearest, booking) => Math.min(nearest, booking.start), END_MINUTE);
      const end = Math.min(target, nextBooking);
      return end > start ? [start, end] : null;
    }
    const previousBooking = bookings.filter((booking) => booking.end <= start).reduce((nearest, booking) => Math.max(nearest, booking.end), START_MINUTE);
    const beginning = Math.max(target, previousBooking);
    return beginning < start ? [beginning, start] : null;
  }

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    const minute = Math.min(END_MINUTE - 1, minuteAt(event.clientY));
    const bookedHere = bookings.some((booking) => minute >= booking.start && minute < booking.end);
    const finishingAtBoundary = anchor !== null && minute > anchor && bookings.some((booking) => booking.start === minute);
    if (bookedHere && !finishingAtBoundary) return;
    gestureRef.current = { pointerId: event.pointerId, start: minute, previousAnchor: anchor, moved: false };
    event.currentTarget.setPointerCapture(event.pointerId);
    if (event.pointerType === "mouse") event.preventDefault();
  }

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    if (event.pointerType !== "touch") setHoverMinute(minuteAt(event.clientY));
    const gesture = gestureRef.current;
    if (!gesture || gesture.pointerId !== event.pointerId) return;
    if (bookings.some((booking) => gesture.start >= booking.start && gesture.start < booking.end)) return;
    const target = minuteAt(event.clientY);
    if (target === gesture.start) return;
    gesture.moved = true;
    onAnchorChange(null);
    onRangeChange(limitedRange(gesture.start, target));
  }

  function handlePointerUp(event: PointerEvent<HTMLDivElement>) {
    const gesture = gestureRef.current;
    if (!gesture || gesture.pointerId !== event.pointerId) return;
    gestureRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    if (gesture.moved) {
      const selected = limitedRange(gesture.start, minuteAt(event.clientY));
      onRangeChange(selected);
      onAnchorChange(selected ? null : gesture.start);
      return;
    }
    const minute = gesture.start;
    const start = Math.min(gesture.previousAnchor ?? minute, minute);
    const end = Math.max(gesture.previousAnchor ?? minute, minute);
    if (gesture.previousAnchor !== null && start < end && !overlaps(bookings, start, end)) {
      onRangeChange([start, end]);
      onAnchorChange(null);
    } else {
      onRangeChange(null);
      onAnchorChange(minute);
    }
  }

  function handlePointerCancel(event: PointerEvent<HTMLDivElement>) {
    if (gestureRef.current?.pointerId !== event.pointerId) return;
    gestureRef.current = null;
    onRangeChange(null);
  }

  return <div className="day-view-scroll" aria-label={`Daily availability for ${room} on ${displayDate(date)}`}>
    <div className="day-view-canvas" style={{ height: DAY_HEIGHT }}>
      <div className="day-time-gutter" aria-hidden="true">
        {Array.from({ length: 11 }, (_, index) => <span key={index} style={{ top: index * 60 * PIXELS_PER_MINUTE }}>{timeLabel(START_MINUTE + index * 60)}</span>)}
      </div>
      <div className="day-track" ref={trackRef} onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={handlePointerUp} onPointerCancel={handlePointerCancel} onPointerLeave={() => setHoverMinute(null)} aria-label="Drag across free time to select a booking, or tap a start and end time">
        {Array.from({ length: 11 }, (_, index) => <div className="day-hour-line" key={index} style={{ top: index * 60 * PIXELS_PER_MINUTE }} />)}
        {Array.from({ length: 10 }, (_, index) => <div className="day-half-hour-line" key={index} style={{ top: (index * 60 + 30) * PIXELS_PER_MINUTE }} />)}
        {bookings.map((booking) => <div key={booking.id} className={`day-booking ${room === "Room B" ? "blue" : "violet"} ${booking.end - booking.start < 35 ? "compact" : ""}`} style={{ top: (booking.start - START_MINUTE) * PIXELS_PER_MINUTE, height: (booking.end - booking.start) * PIXELS_PER_MINUTE }}><strong>{booking.title}</strong><span>{timeLabel(booking.start)} – {timeLabel(booking.end)}</span></div>)}
        {range && <div className={`day-selection ${range[1] - range[0] < 18 ? "short" : ""} ${range[0] - START_MINUTE < 12 ? "at-start" : ""}`} style={{ top: (range[0] - START_MINUTE) * PIXELS_PER_MINUTE, height: (range[1] - range[0]) * PIXELS_PER_MINUTE }}><strong>{timeLabel(range[0])} – {timeLabel(range[1])}</strong><span>New booking</span></div>}
        {anchor !== null && !range && <div className="day-anchor" style={{ top: (anchor - START_MINUTE) * PIXELS_PER_MINUTE }}><span>{timeLabel(anchor)}</span></div>}
        {hoverMinute !== null && <div className={`day-hover ${hoverMinute - START_MINUTE < 12 ? "near-start" : ""}`} style={{ top: (hoverMinute - START_MINUTE) * PIXELS_PER_MINUTE }} aria-hidden="true"><span>{timeLabel(hoverMinute)}</span></div>}
      </div>
    </div>
  </div>;
}
