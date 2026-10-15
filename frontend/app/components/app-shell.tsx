"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { useAuth } from "./auth-context";
import { Icon } from "./icons";

export function Logo() {
  return <span className="brand"><span className="brand-mark"><span /><span /><span /><span /></span><span>MeetSpace<span className="brand-dot">.</span></span></span>;
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { state, profile, error, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  useEffect(() => {
    if (state === "unauthenticated") window.location.replace(`/login?next=${encodeURIComponent(pathname)}`);
  }, [state, pathname]);

  if (state === "loading" || state === "unauthenticated") return <div className="app-loading">Checking your sign-in…</div>;
  if (state === "error") return <div className="app-loading" role="alert"><div><p>Sign-in could not be verified.</p><p>{error}</p><button className="primary-button" onClick={() => window.location.reload()}>Try again</button></div></div>;
  const links = [
    { href: "/dashboard", label: "Dashboard", icon: "grid" as const },
    { href: "/my-bookings", label: "My bookings", icon: "calendar" as const },
  ];

  return <div className="app-frame">
    <aside className={`sidebar ${menuOpen ? "sidebar-open" : ""}`}>
      <div className="sidebar-top"><Link href="/dashboard" onClick={() => setMenuOpen(false)} aria-label="MeetSpace dashboard"><Logo /></Link><button className="icon-button mobile-close" onClick={() => setMenuOpen(false)} aria-label="Close menu"><Icon name="close" /></button></div>
      <nav className="side-nav" aria-label="Main navigation">{links.map((link) => <Link key={link.href} href={link.href} className={`nav-link ${pathname === link.href ? "active" : ""}`} onClick={() => setMenuOpen(false)}><Icon name={link.icon} size={19} />{link.label}{pathname === link.href && <span className="nav-active-dot" />}</Link>)}</nav>
      <div className="sidebar-bottom">
        <button type="button" className="nav-link logout-link" onClick={() => { setMenuOpen(false); void logout(); }}>
          <Icon name="logout" size={19} />
          Logout
        </button>
      </div>
    </aside>
    {menuOpen && <button className="menu-scrim" aria-label="Close menu" onClick={() => setMenuOpen(false)} />}
    <div className="main-area">
      <header className="topbar">
        <button className="icon-button menu-button" onClick={() => setMenuOpen(true)} aria-label="Open menu">
          <Icon name="menu" />
        </button>
        <span className="topbar-breadcrumb">Workspace <Icon name="chevronRight" size={15} /> 
        <strong>{pathname === "/my-bookings" ? "My bookings" : "Dashboard"}</strong></span>
          <div className="topbar-right">
            <span className="avatar top-avatar" title={profile?.name ?? profile?.email ?? "Signed in"}>{(profile?.name ?? profile?.email ?? "U").slice(0, 2).toUpperCase()}</span>
          </div>
      </header>
      <main className="content">{children}</main>
          </div>
  </div>;
}
