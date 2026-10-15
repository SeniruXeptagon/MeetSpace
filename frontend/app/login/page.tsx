"use client";

import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { Logo } from "../components/app-shell";
import { Icon } from "../components/icons";

export default function LoginPage() {
  const router = useRouter();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    router.push("/dashboard");
  }

  return <div className="auth-page">
    <div className="auth-side">
      <div className="auth-side-top"><Logo /></div>
      <div className="auth-side-content">
        <div className="auth-graphic">
          <div className="graphic-head"><span><i /><i /><i /></span><span>Your schedule</span><Icon name="calendar" size={16} /></div>
          <div className="graphic-days"><span>MON</span><span>TUE</span><span>WED</span><span>THU</span><span>FRI</span></div>
          <div className="graphic-bars"><span /><span /><span /><span /><span /></div>
          <div className="graphic-booking"><span className="graphic-booking-icon"><Icon name="check" size={18} /></span><span><strong>Room booked!</strong><small>Wednesday · 10:00 AM</small></span></div>
        </div>
        <span className="auth-tag"><Icon name="sparkle" size={16} /> A better way to meet</span>
        <h1>Make room for<br /><em>what matters.</em></h1>
        <p>Find the right space, at the right time. Your next great idea is one booking away.</p>
      </div>
      <div className="auth-side-footer">© 2026 MeetSpace. Thoughtful spaces, better work.</div>
    </div>
    <div className="auth-main">
      <div className="auth-mobile-logo"><Logo /></div>
      <div className="auth-form-wrap">
        <div className="auth-kicker">WELCOME TO MEETSPACE</div>
        <h2>Good to have you back.</h2>
        <p className="auth-subtitle">Sign in to find your next meeting space.</p>
        <form onSubmit={handleSubmit}>
          <label className="field-label">Work email<input type="email" placeholder="you@company.com" autoComplete="email" required /></label>
          <label className="field-label">Password<input type="password" placeholder="Enter your password" autoComplete="current-password" required /></label>
          <button className="primary-button auth-submit" type="submit">Log in<Icon name="arrow" size={18} /></button>
        </form>
        <div className="auth-footnote"><Icon name="shield" size={16} /> Sign-in</div>
      </div>
    </div>
  </div>;
}
