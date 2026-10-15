"use client";

import { useState, type FormEvent } from "react";
import { END_MINUTE, START_MINUTE, type Booking } from "./booking-context";

function inputTime(minutes: number) {
  return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
}

function parseTime(value: string) {
  if (!/^\d{2}:\d{2}$/.test(value)) return null;
  const [hours, minutes] = value.split(":").map(Number);
  if (hours > 23 || minutes > 59) return null;
  return hours * 60 + minutes;
}

export function TimeEditor({ range, bookings, onSave, onCancel }: {
  range: [number, number];
  bookings: Booking[];
  onSave: (range: [number, number]) => void;
  onCancel: () => void;
}) {
  const [start, setStart] = useState(inputTime(range[0]));
  const [end, setEnd] = useState(inputTime(range[1]));
  const [error, setError] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const startMinute = parseTime(start);
    const endMinute = parseTime(end);

    if (startMinute === null || endMinute === null) {
      setError("Enter a valid start and end time.");
      return;
    }
    if (startMinute < START_MINUTE || endMinute > END_MINUTE) {
      setError("Choose a time between 8:00 AM and 6:00 PM.");
      return;
    }
    if (startMinute >= endMinute) {
      setError("End time must be after start time.");
      return;
    }
    if (bookings.some((booking) => startMinute < booking.end && endMinute > booking.start)) {
      setError("That time overlaps an existing booking.");
      return;
    }
    onSave([startMinute, endMinute]);
  }

  return <form className="time-editor" onSubmit={handleSubmit} noValidate aria-label="Edit selected time">
    <div className="time-editor-fields">
      <label>Start<input type="time" value={start} step="60" onChange={(event) => { setStart(event.target.value); setError(""); }} aria-invalid={!!error} /></label>
      <label>End<input type="time" value={end} step="60" onChange={(event) => { setEnd(event.target.value); setError(""); }} aria-invalid={!!error} /></label>
    </div>
    {error && <p className="time-editor-error" role="alert">{error}</p>}
    <div className="time-editor-actions"><button type="button" className="time-editor-cancel" onClick={onCancel}>Cancel</button><button type="submit" className="time-editor-save">Save time</button></div>
  </form>;
}
