"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Logo } from "../components/app-shell";
import { useAuth } from "../components/auth-context";
import { Icon } from "../components/icons";

export default function LoginPage() {
  const router = useRouter();
  const params = useSearchParams();
  const { state, error, login } = useAuth();
  const [loginError, setLoginError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const requested = params.get("next");
  const destination = requested === "/my-bookings" ? "/my-bookings" : "/dashboard";

  useEffect(() => {
    if (state === "authenticated") router.replace(destination);
  }, [state, destination, router]);

  async function handleLogin() {
    try {
      setLoginError(null);
      setSubmitting(true);
      await login(destination);
    } catch (cause) {
      setLoginError(cause instanceof Error ? cause.message : "Could not start sign-in.");
      setSubmitting(false);
    }
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
        {(loginError || (state === "error" && error)) && <p className="auth-error" role="alert">{loginError ?? error}</p>}
        {state === "error" ? <button className="primary-button auth-submit" type="button" onClick={() => window.location.reload()}>Try again<Icon name="arrow" size={18} /></button> : <button className="primary-button auth-submit" type="button" onClick={() => void handleLogin()} disabled={submitting || state === "authenticated"}>{submitting ? "Opening Keycloak…" : "Continue with Keycloak"}<Icon name="arrow" size={18} /></button>}
        <div className="auth-footnote"><Icon name="shield" size={16} /> Secure sign-in through Keycloak</div>
      </div>
    </div>
  </div>;
}
