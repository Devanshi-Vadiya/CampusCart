import "./globals.css";
import Link from "next/link";

export const metadata = {
  title: "CampusCart - Student Second-Hand Marketplace",
  description: "Buy and sell second-hand textbooks, electronics, and essentials within campus.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
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
              <Link href="/dashboard" className="nav-link">
                Seller Dashboard
              </Link>
              <Link href="/products/new" className="nav-btn-primary">
                + Sell Item
              </Link>
            </nav>
          </div>
        </header>

        <main className="main-content">{children}</main>

        <footer className="footer">
          <p>© 2026 CampusCart — Campus Second-Hand Marketplace. Built for college students.</p>
        </footer>
      </body>
    </html>
  );
}
