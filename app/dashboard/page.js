"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";

export default function StudentDashboardPage() {
  const router = useRouter();
  const { data: session, status: authStatus } = useSession();

  const [activeTab, setActiveTab] = useState("products");
  const [products, setProducts] = useState([]);
  const [enquiries, setEnquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (authStatus === "unauthenticated") {
      router.push("/login");
    } else if (authStatus === "authenticated") {
      loadDashboardData();
    }
  }, [authStatus, router]);

  async function loadDashboardData() {
    try {
      setLoading(true);
      setError("");

      const [prodRes, enqRes] = await Promise.all([
        fetch(`/api/products?ownerId=${session.user.id}`),
        fetch("/api/enquiries"),
      ]);

      const prodData = await prodRes.json();
      const enqData = await enqRes.json();

      if (!prodRes.ok) throw new Error(prodData.error || "Failed to load listings");
      if (!enqRes.ok) throw new Error(enqData.error || "Failed to load enquiries");

      setProducts(prodData.products || []);
      setEnquiries(enqData.enquiries || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleProductStatusChange(productId, newStatus) {
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
    const confirmDelete = window.confirm("Are you sure you want to delete this listing?");
    if (!confirmDelete) return;

    try {
      const res = await fetch(`/api/products/${productId}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete product");

      setProducts((prev) => prev.filter((item) => item._id !== productId));
      setEnquiries((prev) => prev.filter((enq) => enq.productId !== productId));
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleEnquiryStatusChange(enquiryId, newStatus) {
    try {
      const res = await fetch(`/api/enquiries/${enquiryId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update enquiry status");

      setEnquiries((prev) =>
        prev.map((item) => (item._id === enquiryId ? data.enquiry : item))
      );
    } catch (err) {
      alert(err.message);
    }
  }

  if (authStatus === "loading" || loading) {
    return (
      <div className="empty-state">
        <p className="empty-state-title">Loading your dashboard...</p>
      </div>
    );
  }

  if (!session?.user) {
    return null;
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Student Dashboard</h1>
        <p className="page-subtitle">
          Manage your campus listings and communicate with prospective student buyers.
        </p>
      </div>

      <div
        className="filter-card"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "16px",
          background: "linear-gradient(to right, #ffffff, #f8fafc)",
        }}
      >
        <div>
          <div style={{ fontSize: "18px", fontWeight: 700, color: "#0f172a" }}>
            👤 {session.user.name}
          </div>
          <div style={{ fontSize: "14px", color: "#64748b", marginTop: "2px" }}>
            ✉️ {session.user.email}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span
            style={{
              padding: "6px 14px",
              borderRadius: "20px",
              backgroundColor: "#dbeafe",
              color: "#1e40af",
              fontSize: "12px",
              fontWeight: 700,
              textTransform: "uppercase",
            }}
          >
            Role: {session.user.role || "USER"}
          </span>

          <Link href="/products/new" className="btn btn-primary btn-sm">
            + Post New Item
          </Link>
        </div>
      </div>

      {error && <div className="alert-box alert-error">{error}</div>}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "16px",
          marginBottom: "24px",
        }}
      >
        <div style={{ backgroundColor: "#ffffff", padding: "18px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
          <div style={{ fontSize: "12px", fontWeight: 600, color: "#64748b", textTransform: "uppercase" }}>
            My Active Listings
          </div>
          <div style={{ fontSize: "28px", fontWeight: 700, color: "#0f172a", marginTop: "4px" }}>
            {products.length}
          </div>
        </div>

        <div style={{ backgroundColor: "#ffffff", padding: "18px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
          <div style={{ fontSize: "12px", fontWeight: 600, color: "#64748b", textTransform: "uppercase" }}>
            Available Items
          </div>
          <div style={{ fontSize: "28px", fontWeight: 700, color: "#16a34a", marginTop: "4px" }}>
            {products.filter((p) => p.status === "Available").length}
          </div>
        </div>

        <div style={{ backgroundColor: "#ffffff", padding: "18px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
          <div style={{ fontSize: "12px", fontWeight: 600, color: "#64748b", textTransform: "uppercase" }}>
            Incoming Enquiries
          </div>
          <div style={{ fontSize: "28px", fontWeight: 700, color: "#2563eb", marginTop: "4px" }}>
            {enquiries.length}
          </div>
        </div>
      </div>

      <div className="dashboard-tabs">
        <button
          type="button"
          className={`tab-btn ${activeTab === "products" ? "active" : ""}`}
          onClick={() => setActiveTab("products")}
        >
          My Listings ({products.length})
        </button>
        <button
          type="button"
          className={`tab-btn ${activeTab === "enquiries" ? "active" : ""}`}
          onClick={() => setActiveTab("enquiries")}
        >
          Incoming Enquiries ({enquiries.length})
        </button>
      </div>

      {activeTab === "products" ? (
        products.length === 0 ? (
          <div className="empty-state">
            <h3 className="empty-state-title">You haven&apos;t listed any items yet</h3>
            <p className="empty-state-text">
              Have an old textbook, calculator, cycle, or lamp? Post it for other students!
            </p>
            <Link href="/products/new" className="btn btn-primary">
              + Post an Item
            </Link>
          </div>
        ) : (
          <div className="data-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Status</th>
                  <th>Actions</th>
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
                    <td>{item.category}</td>
                    <td style={{ fontWeight: 700, color: "#2563eb" }}>₹{item.price}</td>
                    <td>
                      <select
                        className="form-select"
                        style={{ padding: "4px 8px", fontSize: "13px", width: "auto" }}
                        value={item.status}
                        onChange={(e) => handleProductStatusChange(item._id, e.target.value)}
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
        )
      ) : enquiries.length === 0 ? (
        <div className="empty-state">
          <h3 className="empty-state-title">No enquiries received yet</h3>
          <p className="empty-state-text">
            When other students enquire about your listings, their messages will appear here.
          </p>
        </div>
      ) : (
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Student Buyer</th>
                <th>Message</th>
                <th>Offer Price</th>
                <th>Status</th>
                <th>Update Status</th>
              </tr>
            </thead>
            <tbody>
              {enquiries.map((enq) => (
                <tr key={enq._id}>
                  <td style={{ fontWeight: 600 }}>
                    <Link href={`/products/${enq.productId}`} style={{ color: "#2563eb" }}>
                      {enq.productName}
                    </Link>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{enq.buyerName}</div>
                    <a
                      href={`mailto:${enq.buyerEmail}`}
                      style={{ fontSize: "12px", color: "#64748b", textDecoration: "underline" }}
                    >
                      {enq.buyerEmail}
                    </a>
                  </td>
                  <td style={{ maxWidth: "260px", color: "#334155" }}>
                    &ldquo;{enq.message}&rdquo;
                  </td>
                  <td style={{ fontWeight: 700, color: enq.offerPrice ? "#16a34a" : "#64748b" }}>
                    {enq.offerPrice ? `₹${enq.offerPrice}` : "None"}
                  </td>
                  <td>
                    <span
                      className={`badge-pill ${
                        enq.status === "Accepted"
                          ? "badge-accepted"
                          : enq.status === "Rejected"
                          ? "badge-rejected"
                          : "badge-pending"
                      }`}
                    >
                      {enq.status}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: "6px" }}>
                      {enq.status !== "Accepted" && (
                        <button
                          type="button"
                          onClick={() => handleEnquiryStatusChange(enq._id, "Accepted")}
                          className="btn btn-success btn-sm"
                        >
                          Accept
                        </button>
                      )}
                      {enq.status !== "Rejected" && (
                        <button
                          type="button"
                          onClick={() => handleEnquiryStatusChange(enq._id, "Rejected")}
                          className="btn btn-danger btn-sm"
                        >
                          Reject
                        </button>
                      )}
                      {enq.status !== "Pending" && (
                        <button
                          type="button"
                          onClick={() => handleEnquiryStatusChange(enq._id, "Pending")}
                          className="btn btn-secondary btn-sm"
                        >
                          Reset
                        </button>
                      )}
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
