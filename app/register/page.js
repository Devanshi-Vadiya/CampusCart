"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword) {
      setError("Please fill in all fields.");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Registration failed");
      }

      setSuccess("Account created successfully! Redirecting to login...");
      setTimeout(() => {
        router.push("/login");
      }, 1200);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: "440px", margin: "40px auto" }}>
      <div className="filter-card">
        <h1 className="page-title" style={{ fontSize: "22px", marginBottom: "6px", textAlign: "center" }}>
          Create an Account
        </h1>
        <p className="page-subtitle" style={{ textAlign: "center", marginBottom: "20px" }}>
          Join CampusCart to buy, sell, and enquire about campus items.
        </p>

        {error && <div className="alert-box alert-error">{error}</div>}
        {success && <div className="alert-box alert-success">{success}</div>}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <div className="form-group">
            <label className="form-label">Full Name *</label>
            <input
              type="text"
              name="name"
              className="form-input"
              placeholder="e.g. Devanshi Vadiya"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">College Email *</label>
            <input
              type="email"
              name="email"
              className="form-input"
              placeholder="e.g. devanshi@college.edu"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password (min 6 chars) *</label>
            <input
              type="password"
              name="password"
              className="form-input"
              placeholder="Create a password"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Confirm Password *</label>
            <input
              type="password"
              name="confirmPassword"
              className="form-input"
              placeholder="Re-enter password"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
            />
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading} style={{ marginTop: "6px" }}>
            {loading ? "Creating Account..." : "Register as Student"}
          </button>
        </form>

        <p style={{ textAlign: "center", fontSize: "13px", color: "#64748b", marginTop: "20px" }}>
          Already have an account?{" "}
          <Link href="/login" style={{ color: "#2563eb", fontWeight: 600 }}>
            Log In
          </Link>
        </p>
      </div>
    </div>
  );
}
