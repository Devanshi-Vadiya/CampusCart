"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const CATEGORIES = [
  "Textbooks",
  "Electronics",
  "Stationery",
  "Hostel & Room",
  "Cycles & Mobility",
  "Clothing",
  "Other",
];

const CONDITIONS = ["Brand New", "Like New", "Good", "Fair"];

export default function NewProductPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    category: "Textbooks",
    condition: "Good",
    image: "",
    sellerName: "",
    sellerEmail: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  function handleChange(e) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!formData.name || !formData.description || !formData.price || !formData.sellerName || !formData.sellerEmail) {
      setError("Please fill in all required fields.");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to create product");
      }

      setSuccess(true);
      setTimeout(() => {
        router.push(`/products/${data.product._id}`);
      }, 1200);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: "680px", margin: "0 auto" }}>
      <div style={{ marginBottom: "20px" }}>
        <Link href="/" style={{ fontSize: "14px", color: "#2563eb", fontWeight: 600 }}>
          ← Back to Marketplace
        </Link>
      </div>

      <div className="filter-card">
        <h1 className="page-title" style={{ marginBottom: "6px" }}>List an Item for Sale</h1>
        <p className="page-subtitle" style={{ marginBottom: "20px" }}>
          Post your used book, calculator, cycle, or room item for college peers.
        </p>

        {error && <div className="alert-box alert-error">{error}</div>}
        {success && (
          <div className="alert-box alert-success">
            Listing posted successfully! Redirecting to item page...
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div className="form-group">
            <label className="form-label">Item Title *</label>
            <input
              type="text"
              name="name"
              className="form-input"
              placeholder="e.g. Higher Engineering Mathematics by B.S. Grewal"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <div className="form-group">
              <label className="form-label">Category *</label>
              <select
                name="category"
                className="form-select"
                value={formData.category}
                onChange={handleChange}
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Condition *</label>
              <select
                name="condition"
                className="form-select"
                value={formData.condition}
                onChange={handleChange}
              >
                {CONDITIONS.map((cond) => (
                  <option key={cond} value={cond}>
                    {cond}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <div className="form-group">
              <label className="form-label">Price (in ₹) *</label>
              <input
                type="number"
                name="price"
                min="0"
                className="form-input"
                placeholder="e.g. 350"
                value={formData.price}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Image URL (Optional)</label>
              <input
                type="url"
                name="image"
                className="form-input"
                placeholder="https://images.unsplash.com/..."
                value={formData.image}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Description *</label>
            <textarea
              name="description"
              className="form-textarea"
              placeholder="Describe condition, edition, usage, any missing parts, or pickup point on campus..."
              value={formData.description}
              onChange={handleChange}
              rows={4}
              required
            />
          </div>

          <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: "16px", marginTop: "4px" }}>
            <h3 style={{ fontSize: "15px", fontWeight: 700, color: "#1e293b", marginBottom: "12px" }}>
              Seller Contact Details
            </h3>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <div className="form-group">
                <label className="form-label">Your Full Name *</label>
                <input
                  type="text"
                  name="sellerName"
                  className="form-input"
                  placeholder="e.g. Devanshi"
                  value={formData.sellerName}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">College Email *</label>
                <input
                  type="email"
                  name="sellerEmail"
                  className="form-input"
                  placeholder="e.g. devanshi@college.edu"
                  value={formData.sellerEmail}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: "12px", marginTop: "12px" }}>
            <button type="submit" className="btn btn-primary" disabled={loading} style={{ flex: 1 }}>
              {loading ? "Publishing Listing..." : "Post Item to Marketplace"}
            </button>
            <Link href="/" className="btn btn-secondary">
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
