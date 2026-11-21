"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";

export default function Navbar() {
  const { data: session, status } = useSession();

  return (
    <header className="navbar">
      <div className="nav-container">
        <Link href="/" className="logo-brand">
          <span>🎓 CampusCart</span>
          <span className="logo-badge">Marketplace</span>
        </Link>

        <nav className="nav-links">
          <Link href="/" className="nav-link">
            Browse Items
          </Link>

          {status === "authenticated" && session?.user ? (
            <>
              {session.user.role === "ADMIN" ? (
                <Link
                  href="/admin"
                  className="nav-link"
                  style={{ color: "#7c3aed", fontWeight: 700 }}
                >
                  🛡️ Admin Dashboard
                </Link>
              ) : (
                <Link href="/dashboard" className="nav-link">
                  My Dashboard
                </Link>
              )}

              <Link href="/products/new" className="nav-btn-primary">
                + Sell Item
              </Link>

              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginLeft: "6px" }}>
                <span
                  style={{
                    fontSize: "13px",
                    fontWeight: 600,
                    color: "#334155",
                    padding: "4px 10px",
                    backgroundColor: "#f1f5f9",
                    borderRadius: "16px",
                  }}
                >
                  {session.user.name?.split(" ")[0] || "User"}{" "}
                  <span
                    style={{
                      fontSize: "10px",
                      padding: "2px 6px",
                      borderRadius: "10px",
                      backgroundColor: session.user.role === "ADMIN" ? "#ede9fe" : "#dbeafe",
                      color: session.user.role === "ADMIN" ? "#6d28d9" : "#1d4ed8",
                      fontWeight: 700,
                      textTransform: "uppercase",
                    }}
                  >
                    {session.user.role}
                  </span>
                </span>

                <button
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="btn btn-secondary btn-sm"
                  style={{ padding: "6px 12px", fontSize: "12px" }}
                >
                  Log Out
                </button>
              </div>
            </>
          ) : (
            <>
              <Link href="/login" className="nav-link">
                Log In
              </Link>
              <Link href="/register" className="nav-btn-primary">
                Sign Up
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
