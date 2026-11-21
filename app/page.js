"use client";

import { useState, useEffect } from "react";
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

const CONDITIONS = ["All", "Brand New", "Like New", "Good", "Fair"];

export default function HomePage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [condition, setCondition] = useState("All");
  const [sort, setSort] = useState("newest");
  const [status, setStatus] = useState("All");

  async function fetchProducts() {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams();
      if (search.trim()) params.append("search", search.trim());
      if (category !== "All") params.append("category", category);
      if (condition !== "All") params.append("condition", condition);
      if (status !== "All") params.append("status", status);
      params.append("sort", sort);

      const response = await fetch(`/api/products?${params.toString()}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to load products");
      }

      setProducts(data.products || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchProducts();
  }, [category, condition, sort, status]);

  function handleSearchSubmit(e) {
    e.preventDefault();
    fetchProducts();
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Campus Marketplace</h1>
        <p className="page-subtitle">
          Find affordable second-hand textbooks, electronics, and college essentials from fellow students.
        </p>
      </div>

      <div className="filter-card">
        <form onSubmit={handleSearchSubmit}>
          <div className="filter-grid">
            <div className="form-group">
              <label className="form-label">Search Item</label>
              <input
                type="text"
                className="form-input"
                placeholder="Search by name (e.g. Calculus book, Casio calc)..."
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
              <label className="form-label">Condition</label>
              <select
                className="form-select"
                value={condition}
                onChange={(e) => setCondition(e.target.value)}
              >
                {CONDITIONS.map((cond) => (
                  <option key={cond} value={cond}>
                    {cond}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Sort By</label>
              <select
                className="form-select"
                value={sort}
                onChange={(e) => setSort(e.target.value)}
              >
                <option value="newest">Newest First</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="oldest">Oldest First</option>
              </select>
            </div>
          </div>

          <div style={{ marginTop: "14px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px" }}>
              <span style={{ fontWeight: 600, color: "#475569" }}>Status:</span>
              {["All", "Available", "Reserved", "Sold"].map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatus(st)}
                  className={`btn btn-sm ${status === st ? "btn-primary" : "btn-secondary"}`}
                >
                  {st}
                </button>
              ))}
            </div>

            <button type="submit" className="btn btn-primary btn-sm">
              Apply Search
            </button>
          </div>
        </form>
      </div>

      {error && <div className="alert-box alert-error">{error}</div>}

      {loading ? (
        <div className="empty-state">
          <p className="empty-state-title">Loading items...</p>
        </div>
      ) : products.length === 0 ? (
        <div className="empty-state">
          <h3 className="empty-state-title">No products available yet</h3>
          <p className="empty-state-text">
            Be the first to list a second-hand item for fellow college students!
          </p>
          <Link href="/products/new" className="btn btn-primary">
            + Post the First Item
          </Link>
        </div>
      ) : (
        <div className="products-grid">
          {products.map((item) => (
            <Link key={item._id} href={`/products/${item._id}`} className="product-card">
              <div className="product-img-wrapper">
                {item.image ? (
                  <img src={item.image} alt={item.name} className="product-img" />
                ) : (
                  <div className="product-img-placeholder">
                    <span>📦</span>
                    <span>No image provided</span>
                  </div>
                )}
                <span
                  className={`badge-status ${
                    item.status === "Available"
                      ? "badge-available"
                      : item.status === "Reserved"
                      ? "badge-reserved"
                      : "badge-sold"
                  }`}
                >
                  {item.status}
                </span>
              </div>

              <div className="product-body">
                <div className="product-tags">
                  <span className="tag">{item.category}</span>
                  <span className="tag">{item.condition}</span>
                </div>

                <h3 className="product-title">{item.name}</h3>
                <div className="product-price">₹{item.price}</div>

                <div className="product-meta">
                  <span>Seller: {item.sellerName}</span>
                  <span style={{ color: "#2563eb", fontWeight: 600 }}>View →</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
