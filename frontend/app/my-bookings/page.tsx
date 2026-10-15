"use client";

import Link from "next/link";
import { useState } from "react";
import { AppShell } from "../components/app-shell";
import { displayDate, durationLabel, localDate, timeLabel, useBookings, type Booking } from "../components/booking-context";
import { Icon } from "../components/icons";

export default function MyBookingsPage() {
  const { bookings, cancelBooking, loading, error, refresh } = useBookings();
  const [toCancel, setToCancel] = useState<Booking | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"All bookings" | "Upcoming" | "Cancelled">("All bookings");
  const mine = bookings.filter((booking) => booking.mine).sort((a, b) => a.date.localeCompare(b.date) || a.start - b.start);
  const today = localDate();
  const now = new Date();
  const currentMinute = now.getHours() * 60 + now.getMinutes();
  const isUpcoming = (booking: Booking) => booking.status === "Confirmed" && (booking.date > today || (booking.date === today && booking.end > currentMinute));
  const visible = mine.filter((booking) => filter === "All bookings" || (filter === "Cancelled" ? booking.status === "Cancelled" : isUpcoming(booking)));
  const upcomingCount = mine.filter(isUpcoming).length;
  const bookedMinutes = mine.filter((booking) => booking.status === "Confirmed").reduce((sum, booking) => sum + booking.end - booking.start, 0);

  async function confirmCancellation() {
    if (!toCancel || cancelling) return;
    setCancelling(true);
    setCancelError(null);
    try {
      await cancelBooking(toCancel.id);
      setToCancel(null);
    } catch (cause) {
      setCancelError(cause instanceof Error ? cause.message : "Could not cancel this booking.");
    } finally {
      setCancelling(false);
    }
  }

  return <AppShell><div className="page-head bookings-head"><div><span className="eyebrow">YOUR MEETINGS AT A GLANCE</span><h1>My bookings<span className="heading-period">.</span></h1><p>Everything you need to stay on top of your schedule.</p></div><Link href="/dashboard" className="primary-button head-action"><Icon name="plus" size={18} /> Book a room</Link></div>
    {error && <div className="booking-api-error" role="alert">{error} <button type="button" onClick={() => void refresh()}>Retry</button></div>}
    {loading && <p className="booking-api-note">Loading your bookings…</p>}
    <div className="stats-row"><div className="stat-card"><span className="stat-icon purple"><Icon name="calendar" size={21} /></span><span><small>Upcoming bookings</small><strong>{upcomingCount}</strong></span></div><div className="stat-card"><span className="stat-icon blue"><Icon name="clock" size={21} /></span><span><small>Total time booked</small><strong>{durationLabel(bookedMinutes)}</strong></span></div><div className="stat-card"><span className="stat-icon green"><Icon name="check" size={21} /></span><span><small>Total bookings</small><strong>{mine.length}</strong></span></div></div>
    <section className="card bookings-list"><div className="list-top"><div><h2>Your reservations</h2><p>A home for all your upcoming and past meetings.</p></div><div className="filter-tabs" role="group" aria-label="Filter bookings">{(["All bookings", "Upcoming", "Cancelled"] as const).map((item) => <button key={item} className={filter === item ? "active" : ""} onClick={() => setFilter(item)} aria-pressed={filter === item}>{item}</button>)}</div></div>
      {visible.length ? <div className="booking-list-items">{visible.map((booking) => <article className={`booking-item ${booking.status === "Cancelled" ? "is-cancelled" : ""}`} key={booking.id}><span className={`booking-room-icon ${booking.room === "Room A" ? "violet" : "blue"}`}><Icon name={booking.room === "Room A" ? "users" : "video"} size={22} /></span><div className="booking-item-main"><div className="booking-item-title"><h3>{booking.title}</h3><span className={`status-badge ${booking.status.toLowerCase()}`}><span />{booking.status}</span></div><div className="booking-meta"><span><Icon name="users" size={15} />{booking.room}</span><span><Icon name="calendar" size={15} />{displayDate(booking.date, { weekday: "short", month: "short", day: "numeric", year: "numeric" })}</span><span><Icon name="clock" size={15} />{timeLabel(booking.start)} – {timeLabel(booking.end)}</span></div></div>{booking.status === "Confirmed" && <button className="cancel-button" onClick={() => setToCancel(booking)}><Icon name="trash" size={16} />Cancel booking</button>}</article>)}</div> : <div className="empty-state"><span className="empty-icon"><Icon name="calendar" size={28} /></span><h3>{filter === "Cancelled" ? "No cancelled bookings" : "No bookings here yet"}</h3><p>{filter === "Cancelled" ? "Your cancelled reservations will appear here." : "Find an open room and make your first reservation."}</p>{filter !== "Cancelled" && <Link href="/dashboard" className="primary-button"><Icon name="plus" size={17} /> Book a room</Link>}</div>}
    </section>
    {toCancel && <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget && !cancelling) setToCancel(null); }}><div className="modal cancel-modal" role="dialog" aria-modal="true" aria-labelledby="cancel-title"><button className="icon-button modal-close" onClick={() => setToCancel(null)} disabled={cancelling} aria-label="Close dialog"><Icon name="close" /></button><span className="modal-icon danger"><Icon name="trash" size={23} /></span><h2 id="cancel-title">Cancel this booking?</h2><p>This will free up {toCancel.room} on {displayDate(toCancel.date, { month: "long", day: "numeric" })} from {timeLabel(toCancel.start)} to {timeLabel(toCancel.end)}.</p>{cancelError && <p className="booking-api-error" role="alert">{cancelError}</p>}<div className="modal-actions"><button className="secondary-button" onClick={() => setToCancel(null)} disabled={cancelling}>Keep booking</button><button className="danger-button" onClick={() => void confirmCancellation()} disabled={cancelling}>{cancelling ? "Cancelling…" : "Cancel Booking"}</button></div></div></div>}
  </AppShell>;
}
