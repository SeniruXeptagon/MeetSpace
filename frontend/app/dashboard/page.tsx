"use client";

import Link from "next/link";
import { useState } from "react";
import { AppShell } from "../components/app-shell";
import { DatePicker } from "../components/date-picker";
import { DayTimeline } from "../components/day-timeline";
import { TimeEditor } from "../components/time-editor";
import { displayDate, durationLabel, END_MINUTE, localDate, START_MINUTE, timeLabel, useBookings, type Room } from "../components/booking-context";
import { Icon } from "../components/icons";

const rooms: { name: Room; icon: "users" | "video"; tint: string }[] = [
  { name: "Room A", icon: "users", tint: "violet" },
  { name: "Room B", icon: "video", tint: "blue" },
];

export default function DashboardPage() {
  const { bookings, addBooking } = useBookings();
  const [date, setDate] = useState(localDate);
  const [room, setRoom] = useState<Room>("Room A");
  const [anchor, setAnchor] = useState<number | null>(null);
  const [range, setRange] = useState<[number, number] | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [editingTime, setEditingTime] = useState(false);

  const dayBookings = bookings.filter((booking) => booking.date === date && booking.room === room && booking.status === "Confirmed");
  const availableMinutes = END_MINUTE - START_MINUTE - dayBookings.reduce((total, booking) => total + booking.end - booking.start, 0);

  function changeDate(next: string) {
    if (!next) return;
    setDate(next);
    setAnchor(null);
    setRange(null);
    setEditingTime(false);
  }

  function updateRange(next: [number, number] | null) {
    setRange(next);
    setEditingTime(false);
  }

  function confirmBooking() {
    if (!range || dayBookings.some((booking) => range[0] < booking.end && range[1] > booking.start)) return;
    addBooking({ room, date, start: range[0], end: range[1], title: "My meeting" });
    setModalOpen(false);
    setConfirmed(true);
    setAnchor(null);
    setRange(null);
    setEditingTime(false);
  }

  return <AppShell>
    <div className="page-head"><div><span className="eyebrow">YOUR WORKSPACE, SIMPLIFIED</span><h1>Book a room<span className="heading-period">.</span></h1><p>Find the perfect space for your next great conversation.</p></div><div className="head-date"><Icon name="calendar" size={18} />{displayDate(date, { weekday: "long", month: "long", day: "numeric", year: "numeric" })}</div></div>

    {confirmed && <div className="success-banner" role="status"><span className="success-icon"><Icon name="check" size={17} /></span><div><strong>Booking confirmed!</strong> Your meeting is ready to go. <Link href="/my-bookings">View my bookings <Icon name="arrow" size={15} /></Link></div><button className="icon-button" aria-label="Dismiss confirmation" onClick={() => setConfirmed(false)}><Icon name="close" size={17} /></button></div>}

    <div className="dashboard-grid"><div className="dashboard-main">
      <DatePicker value={date} onChange={changeDate} />

      <section className="card rooms-card" aria-labelledby="rooms-heading"><div className="card-heading"><div className="step-mark">02</div><div><h2 id="rooms-heading">Select a room</h2><p>Pick a space that fits your meeting.</p></div></div><div className="room-grid">{rooms.map((item) => <button key={item.name} className={`room-option ${room === item.name ? "selected" : ""}`} onClick={() => { setRoom(item.name); setAnchor(null); setRange(null); setEditingTime(false); }} aria-pressed={room === item.name}><span className={`room-icon ${item.tint}`}><Icon name={item.icon} size={23} /></span><span className="room-copy"><strong>{item.name}</strong></span><span className="room-radio"><Icon name="check" size={14} /></span></button>)}</div></section>

      <section className="card timeline-card" aria-labelledby="timeline-heading"><div className="timeline-header"><div className="card-heading"><div className="step-mark">03</div><div><h2 id="timeline-heading">Find your time</h2><p>Drag on a free area, or tap a start and end time.</p></div></div><span className="availability-pill"><span />{durationLabel(availableMinutes)} available</span></div><div className="timeline-legend"><span><i className="legend-free" />Available</span><span><i className="legend-booked" />Booked</span><span><i className="legend-selected" />Selected</span></div><DayTimeline bookings={dayBookings} room={room} date={date} range={range} anchor={anchor} onRangeChange={updateRange} onAnchorChange={setAnchor} /><div className="timeline-foot"><span><Icon name="clock" size={16} /> Minute precision · 8:00 AM – 6:00 PM</span><span>{range ? `${timeLabel(range[0])} – ${timeLabel(range[1])} selected` : anchor !== null ? `${timeLabel(anchor)} selected · choose an end time` : "Select any free time range"}</span></div></section>
    </div><aside className="booking-panel"><div className="booking-panel-top"><span className="panel-sparkle"><Icon name="sparkle" size={18} /></span><span>YOUR BOOKING</span></div><h2>Ready when<br />you are<span className="heading-period">.</span></h2><p>Great meetings start with a space that works for you.</p><div className="booking-summary"><div><span>Room</span><strong>{room}</strong></div><div><span>Date</span><strong>{displayDate(date, { month: "short", day: "numeric", year: "numeric" })}</strong></div><div className={`booking-summary-time ${editingTime ? "editing" : ""}`}><span>Time</span>{range ? editingTime ? <TimeEditor range={range} bookings={dayBookings} onSave={(next) => { setRange(next); setAnchor(null); setEditingTime(false); }} onCancel={() => setEditingTime(false)} /> : <button type="button" className="summary-time-button" onClick={() => setEditingTime(true)} aria-label={`Edit selected time, ${timeLabel(range[0])} to ${timeLabel(range[1])}`} title="Edit time"><strong>{timeLabel(range[0])} – {timeLabel(range[1])}</strong><Icon name="edit" size={14} /></button> : <strong>Select a time range</strong>}</div><div><span>Duration</span><strong>{range ? durationLabel(range[1] - range[0]) : "—"}</strong></div></div><button className="primary-button panel-button" disabled={!range || editingTime} onClick={() => setModalOpen(true)}>Continue to booking <Icon name="arrow" size={18} /></button><div className="panel-reassurance"><Icon name="shield" size={16} /> No payment required</div></aside></div>

    {modalOpen && range && <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setModalOpen(false); }}><div className="modal" role="dialog" aria-modal="true" aria-labelledby="booking-modal-title"><button className="icon-button modal-close" onClick={() => setModalOpen(false)} aria-label="Close dialog"><Icon name="close" /></button><span className="modal-icon"><Icon name="calendar" size={24} /></span><h2 id="booking-modal-title">Confirm your booking</h2><p>Take a moment to review the details of your meeting.</p><div className="modal-details"><div><span>Meeting room</span><strong>{room}</strong></div><div><span>Date</span><strong>{displayDate(date)}</strong></div><div><span>Start time</span><strong>{timeLabel(range[0])}</strong></div><div><span>End time</span><strong>{timeLabel(range[1])}</strong></div></div><button className="primary-button modal-confirm" onClick={confirmBooking}><Icon name="check" size={18} /> Confirm Booking</button><button className="text-button" onClick={() => setModalOpen(false)}>Go back and edit</button></div></div>}
  </AppShell>;
}
