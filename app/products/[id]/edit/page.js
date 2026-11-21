"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
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
const STATUSES = ["Available", "Reserved", "Sold"];

export default function EditProductPage({ params }) {
  const router = useRouter();
  const unwrappedParams = use(params);
  const id = unwrappedParams.id;
  const { data: session, status: authStatus } = useSession();

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    category: "Textbooks",
    condition: "Good",
    image: "",
    status: "Available",
  });

  const [initialLoading, setInitialLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [authorized, setAuthorized] = useState(true);

  useEffect(() => {
    async function loadProduct() {
      try {
        const res = await fetch(`/api/products/${id}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to load product");
        const p = data.product;

        if (session?.user) {
          const isOwner =
            (p.ownerId && p.ownerId.toString() === session.user.id) ||
            p.sellerEmail === session.user.email;
          const isAdmin = session.user.role === "ADMIN";
          if (!isOwner && !isAdmin) {
            setAuthorized(false);
          }
        }

        setFormData({
          name: p.name || "",
          description: p.description || "",
          price: p.price !== undefined ? p.price : "",
          category: p.category || "Textbooks",
          condition: p.condition || "Good",
          image: p.image || "",
          status: p.status || "Available",
        });
      } catch (err) {
        setError(err.message);
      } finally {
        setInitialLoading(false);
      }
    }

    if (authStatus === "authenticated") {
      loadProduct();
    } else if (authStatus === "unauthenticated") {
      router.push("/login");
    }
  }, [id, session, authStatus, router]);

  function handleChange(e) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    try {
      setLoading(true);
      const res = await fetch(`/api/products/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update product");

      router.push(`/products/${id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (initialLoading || authStatus === "loading") {
    return (
      <div className="empty-state">
        <p className="empty-state-title">Loading listing...</p>
      </div>
    );
  }

  if (!authorized) {
    return (
      <div className="empty-state" style={{ maxWidth: "540px", margin: "40px auto" }}>
        <h3 className="empty-state-title">Access Denied</h3>
        <p className="empty-state-text">
          You are not authorized to edit this listing because you do not own it.
        </p>
        <Link href={`/products/${id}`} className="btn btn-primary">
          Back to Item
        </Link>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "680px", margin: "0 auto" }}>
      <div style={{ marginBottom: "20px" }}>
        <Link href={`/products/${id}`} style={{ fontSize: "14px", color: "#2563eb", fontWeight: 600 }}>
          ← Back to Item Details
        </Link>
      </div>

      <div className="filter-card">
        <h1 className="page-title" style={{ marginBottom: "6px" }}>Edit Listing</h1>
        <p className="page-subtitle" style={{ marginBottom: "20px" }}>
          Update information or status for this item.
        </p>

        {error && <div className="alert-box alert-error">{error}</div>}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div className="form-group">
            <label className="form-label">Item Title *</label>
            <input
              type="text"
              name="name"
              className="form-input"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px" }}>
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

            <div className="form-group">
              <label className="form-label">Status *</label>
              <select
                name="status"
                className="form-select"
                value={formData.status}
                onChange={handleChange}
              >
                {STATUSES.map((st) => (
                  <option key={st} value={st}>
                    {st}
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
                value={formData.price}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Image URL</label>
              <input
                type="url"
                name="image"
                className="form-input"
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
              value={formData.description}
              onChange={handleChange}
              rows={4}
              required
            />
          </div>

          <div style={{ display: "flex", gap: "12px", marginTop: "12px" }}>
            <button type="submit" className="btn btn-primary" disabled={loading} style={{ flex: 1 }}>
              {loading ? "Saving Changes..." : "Save Changes"}
            </button>
            <Link href={`/products/${id}`} className="btn btn-secondary">
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
