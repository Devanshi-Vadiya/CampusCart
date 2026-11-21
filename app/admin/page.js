"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";

const CATEGORIES = [
  "All",
  "Textbooks",
  "Electronics",
  "Stationery",
  "Hostel & Room",
  "Cycles & Mobility",
  "Clothing",
  "Other",
];

const STATUSES = ["All", "Available", "Reserved", "Sold"];

export default function AdminDashboardPage() {
  const router = useRouter();
  const { data: session, status: authStatus } = useSession();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  useEffect(() => {
    if (authStatus === "unauthenticated") {
      router.push("/login");
    } else if (authStatus === "authenticated") {
      if (session?.user?.role !== "ADMIN") {
        return;
      }
      loadAllProducts();
    }
  }, [authStatus, session, router, category, statusFilter]);

  async function loadAllProducts() {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams();
      if (search.trim()) params.append("search", search.trim());
      if (category !== "All") params.append("category", category);
      if (statusFilter !== "All") params.append("status", statusFilter);

      const res = await fetch(`/api/products?${params.toString()}`);
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Failed to load listings");
      setProducts(data.products || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleSearchSubmit(e) {
    e.preventDefault();
    loadAllProducts();
  }

  async function handleStatusChange(productId, newStatus) {
    try {
      const res = await fetch(`/api/products/${productId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update status");

      setProducts((prev) =>
        prev.map((item) => (item._id === productId ? data.product : item))
      );
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleDeleteProduct(productId) {
    const confirmDelete = window.confirm(
      "Admin Action: Are you sure you want to permanently delete this listing?"
    );
    if (!confirmDelete) return;

    try {
      const res = await fetch(`/api/products/${productId}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete product");

      setProducts((prev) => prev.filter((item) => item._id !== productId));
    } catch (err) {
      alert(err.message);
    }
  }

  if (authStatus === "loading") {
    return (
      <div className="empty-state">
        <p className="empty-state-title">Checking administrator credentials...</p>
      </div>
    );
  }

  if (authStatus === "unauthenticated") {
    return null;
  }

  if (session?.user?.role !== "ADMIN") {
    return (
      <div className="empty-state" style={{ maxWidth: "540px", margin: "40px auto" }}>
        <h3 className="empty-state-title">403 Access Denied</h3>
        <p className="empty-state-text">
          You are logged in as a student (USER). The Admin Dashboard is restricted to administrators only.
        </p>
        <Link href="/dashboard" className="btn btn-primary">
          Go to Student Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <h1 className="page-title">Marketplace Administration</h1>
          <span
            style={{
              padding: "4px 10px",
              borderRadius: "12px",
              backgroundColor: "#ede9fe",
              color: "#6d28d9",
              fontSize: "12px",
              fontWeight: 700,
              textTransform: "uppercase",
            }}
          >
            Admin Access
          </span>
        </div>
        <p className="page-subtitle">
          Manage all student listings, moderate marketplace content, and update item statuses.
        </p>
      </div>

      <div className="filter-card">
        <form onSubmit={handleSearchSubmit}>
          <div className="filter-grid" style={{ gridTemplateColumns: "2fr 1fr 1fr" }}>
            <div className="form-group">
              <label className="form-label">Search All Listings</label>
              <input
                type="text"
                className="form-input"
                placeholder="Search across all student items..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Category</label>
              <select
                className="form-select"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Status</label>
              <select
                className="form-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                {STATUSES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ marginTop: "14px", display: "flex", justifyContent: "flex-end", gap: "10px" }}>
            <button type="submit" className="btn btn-primary btn-sm">
              Filter Listings
            </button>
          </div>
        </form>
      </div>

      {error && <div className="alert-box alert-error">{error}</div>}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginBottom: "24px" }}>
        <div style={{ backgroundColor: "#ffffff", padding: "18px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
          <div style={{ fontSize: "12px", fontWeight: 600, color: "#64748b", textTransform: "uppercase" }}>
            Total Marketplace Items
          </div>
          <div style={{ fontSize: "28px", fontWeight: 700, color: "#0f172a", marginTop: "4px" }}>
            {products.length}
          </div>
        </div>

        <div style={{ backgroundColor: "#ffffff", padding: "18px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
          <div style={{ fontSize: "12px", fontWeight: 600, color: "#64748b", textTransform: "uppercase" }}>
            Available
          </div>
          <div style={{ fontSize: "28px", fontWeight: 700, color: "#16a34a", marginTop: "4px" }}>
            {products.filter((p) => p.status === "Available").length}
          </div>
        </div>

        <div style={{ backgroundColor: "#ffffff", padding: "18px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
          <div style={{ fontSize: "12px", fontWeight: 600, color: "#64748b", textTransform: "uppercase" }}>
            Reserved
          </div>
          <div style={{ fontSize: "28px", fontWeight: 700, color: "#d97706", marginTop: "4px" }}>
            {products.filter((p) => p.status === "Reserved").length}
          </div>
        </div>

        <div style={{ backgroundColor: "#ffffff", padding: "18px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
          <div style={{ fontSize: "12px", fontWeight: 600, color: "#64748b", textTransform: "uppercase" }}>
            Sold
          </div>
          <div style={{ fontSize: "28px", fontWeight: 700, color: "#64748b", marginTop: "4px" }}>
            {products.filter((p) => p.status === "Sold").length}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="empty-state">
          <p className="empty-state-title">Loading marketplace items...</p>
        </div>
      ) : products.length === 0 ? (
        <div className="empty-state">
          <h3 className="empty-state-title">No items found</h3>
          <p className="empty-state-text">No listings match the current filter criteria.</p>
        </div>
      ) : (
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Seller / Owner</th>
                <th>Category</th>
                <th>Price</th>
                <th>Status</th>
                <th>Admin Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((item) => (
                <tr key={item._id}>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.name}
                          style={{ width: "40px", height: "40px", objectFit: "cover", borderRadius: "6px" }}
                        />
                      ) : (
                        <div style={{ width: "40px", height: "40px", backgroundColor: "#f1f5f9", borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          📦
                        </div>
                      )}
                      <div>
                        <Link href={`/products/${item._id}`} style={{ fontWeight: 600, color: "#0f172a" }}>
                          {item.name}
                        </Link>
                        <div style={{ fontSize: "12px", color: "#64748b" }}>
                          {item.condition}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{item.sellerName}</div>
                    <div style={{ fontSize: "12px", color: "#64748b" }}>{item.sellerEmail}</div>
                  </td>
                  <td>{item.category}</td>
                  <td style={{ fontWeight: 700, color: "#2563eb" }}>₹{item.price}</td>
                  <td>
                    <select
                      className="form-select"
                      style={{ padding: "4px 8px", fontSize: "13px", width: "auto" }}
                      value={item.status}
                      onChange={(e) => handleStatusChange(item._id, e.target.value)}
                    >
                      <option value="Available">Available</option>
                      <option value="Reserved">Reserved</option>
                      <option value="Sold">Sold</option>
                    </select>
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: "6px" }}>
                      <Link href={`/products/${item._id}`} className="btn btn-secondary btn-sm">
                        View
                      </Link>
                      <Link href={`/products/${item._id}/edit`} className="btn btn-secondary btn-sm">
                        Edit
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleDeleteProduct(item._id)}
                        className="btn btn-danger btn-sm"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
