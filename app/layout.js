import "./globals.css";
import AuthProvider from "@/components/AuthProvider";
import Navbar from "@/components/Navbar";

export const metadata = {
  title: "CampusCart - Student Second-Hand Marketplace",
  description: "Buy and sell second-hand textbooks, electronics, and essentials within campus.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <Navbar />
          <main className="main-content">{children}</main>
          <footer className="footer">
            <p>© 2026 CampusCart — Campus Second-Hand Marketplace. Built for college students.</p>
          </footer>
        </AuthProvider>
      </body>
    </html>
  );
}
