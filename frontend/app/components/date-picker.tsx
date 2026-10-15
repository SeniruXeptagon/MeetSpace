"use client";

import { useEffect, useRef, useState } from "react";
import { displayDate, localDate } from "./booking-context";
import { Icon } from "./icons";

function dateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function DatePicker({ value, onChange }: { value: string; onChange: (date: string) => void }) {
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState(() => {
    const selected = new Date(`${value}T12:00:00`);
    return new Date(selected.getFullYear(), selected.getMonth(), 1);
  });
  const stripRef = useRef<HTMLDivElement>(null);
  const pickerRef = useRef<HTMLDivElement>(null);
  const selected = new Date(`${value}T12:00:00`);
  const today = localDate();

  useEffect(() => {
    if (!open) return;
    function closeOnOutsideClick(event: PointerEvent) {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) setOpen(false);
    }
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  useEffect(() => {
    const strip = stripRef.current;
    if (!strip) return;

    function scrollDates(event: WheelEvent) {
      if (!strip) return;
      const maxScroll = strip.scrollWidth - strip.clientWidth;
      if (maxScroll <= 0) return;
      const wheelDelta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
      const distance = wheelDelta * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? strip.clientWidth : 1);
      const next = Math.max(0, Math.min(maxScroll, strip.scrollLeft + distance));
      if (next !== strip.scrollLeft) {
        event.preventDefault();
        strip.scrollLeft = next;
      }
    }

    strip.addEventListener("wheel", scrollDates, { passive: false });
    return () => strip.removeEventListener("wheel", scrollDates);
  }, []);

  const stripDays = Array.from({ length: 35 }, (_, index) => {
    const day = new Date(selected);
    day.setDate(day.getDate() + index - 2);
    return { key: dateKey(day), day };
  });
  const firstWeekday = (month.getDay() + 6) % 7;
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const cells = Array.from({ length: Math.ceil((firstWeekday + daysInMonth) / 7) * 7 }, (_, index) => {
    const day = new Date(month.getFullYear(), month.getMonth(), index - firstWeekday + 1);
    return { key: dateKey(day), day, currentMonth: day.getMonth() === month.getMonth() };
  });
  const thisMonth = new Date();
  const canGoBack = month.getFullYear() > thisMonth.getFullYear() || (month.getFullYear() === thisMonth.getFullYear() && month.getMonth() > thisMonth.getMonth());

  function changeMonth(offset: number) {
    setMonth(new Date(month.getFullYear(), month.getMonth() + offset, 1));
  }

  function selectDate(next: string) {
    onChange(next);
    setOpen(false);
  }

  return <section className="card date-card" aria-labelledby="date-heading">
    <div className="card-heading">
      <div className="step-mark">01</div>
      <div><h2 id="date-heading">Choose a date</h2><p>When do you need a room?</p></div>
      <div className="date-picker-anchor" ref={pickerRef}>
        <button type="button" className="date-input-wrap" aria-expanded={open} aria-haspopup="dialog" onClick={() => { setMonth(new Date(selected.getFullYear(), selected.getMonth(), 1)); setOpen((current) => !current); }}>
          <Icon name="calendar" size={17} />
          <span>{displayDate(value)}</span>
          <Icon name="chevronRight" size={14} className={`date-picker-chevron ${open ? "open" : ""}`} />
        </button>
        {open && <div className="month-popover" role="dialog" aria-label="Choose a booking date">
          <div className="month-header">
            <strong>{new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(month)}</strong>
            <div className="month-controls">
              <button type="button" aria-label="Previous month" disabled={!canGoBack} onClick={() => changeMonth(-1)}><Icon name="chevronLeft" size={18} /></button>
              <button type="button" aria-label="Next month" onClick={() => changeMonth(1)}><Icon name="chevronRight" size={18} /></button>
            </div>
          </div>
          <div className="month-grid month-weekdays">{["M", "T", "W", "T", "F", "S", "S"].map((day, index) => <span key={index}>{day}</span>)}</div>
          <div className="month-grid month-dates">{cells.map((cell) => <button key={cell.key} type="button" disabled={cell.key < today} className={`${cell.currentMonth ? "" : "outside-month"} ${cell.key === value ? "selected" : ""} ${cell.key === today ? "today" : ""}`} aria-label={displayDate(cell.key)} aria-pressed={cell.key === value} onClick={() => selectDate(cell.key)}>{cell.day.getDate()}</button>)}</div>
          <button type="button" className="month-today" onClick={() => selectDate(today)}>Go to today</button>
        </div>}
      </div>
    </div>
    <div className="date-strip">
      <button type="button" className="date-arrow" aria-label="Scroll dates left" onClick={() => stripRef.current?.scrollBy({ left: -300, behavior: "smooth" })}><Icon name="chevronLeft" size={19} /></button>
      <div className="date-days" ref={stripRef} aria-label="Scrollable dates">{stripDays.map(({ key, day }) => <button type="button" key={key} disabled={key < today} onClick={() => selectDate(key)} className={`date-day ${key === value ? "selected" : ""}`} aria-pressed={key === value} aria-label={displayDate(key)}><span>{new Intl.DateTimeFormat("en-US", { weekday: "short" }).format(day)}</span><strong>{day.getDate()}</strong></button>)}</div>
      <button type="button" className="date-arrow" aria-label="Scroll dates right" onClick={() => stripRef.current?.scrollBy({ left: 300, behavior: "smooth" })}><Icon name="chevronRight" size={19} /></button>
    </div>
  </section>;
}
