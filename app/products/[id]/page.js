"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";

export default function ProductDetailPage({ params }) {
  const router = useRouter();
  const unwrappedParams = use(params);
  const id = unwrappedParams.id;
  const { data: session } = useSession();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [enquiryForm, setEnquiryForm] = useState({
    buyerName: "",
    buyerEmail: "",
    message: "",
    offerPrice: "",
  });
  const [enquiryLoading, setEnquiryLoading] = useState(false);
  const [enquirySuccess, setEnquirySuccess] = useState("");
  const [enquiryError, setEnquiryError] = useState("");

  const [statusLoading, setStatusLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  async function fetchProduct() {
    try {
      setLoading(true);
      setError("");
      const res = await fetch(`/api/products/${id}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to load product");
      }

      setProduct(data.product);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchProduct();
  }, [id]);

  useEffect(() => {
    if (session?.user) {
      setEnquiryForm((prev) => ({
        ...prev,
        buyerName: prev.buyerName || session.user.name || "",
        buyerEmail: prev.buyerEmail || session.user.email || "",
      }));
    }
  }, [session]);

  const isOwner =
    session?.user &&
    ((product?.ownerId && product.ownerId.toString() === session.user.id) ||
      product?.sellerEmail === session.user.email);
  const isAdmin = session?.user?.role === "ADMIN";
  const canManage = isOwner || isAdmin;

  async function handleStatusChange(newStatus) {
    try {
      setStatusLoading(true);
      const res = await fetch(`/api/products/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not update status");
      setProduct(data.product);
    } catch (err) {
      alert(err.message);
    } finally {
      setStatusLoading(false);
    }
  }

  async function handleDeleteProduct() {
    const confirmDelete = window.confirm("Are you sure you want to delete this listing?");
    if (!confirmDelete) return;

    try {
      setDeleteLoading(true);
      const res = await fetch(`/api/products/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not delete product");
      router.push("/");
    } catch (err) {
      alert(err.message);
      setDeleteLoading(false);
    }
  }

  async function handleEnquirySubmit(e) {
    e.preventDefault();
    setEnquiryError("");
    setEnquirySuccess("");

    if (!enquiryForm.buyerName || !enquiryForm.buyerEmail || !enquiryForm.message) {
      setEnquiryError("Please enter your name, email, and message.");
      return;
    }

    try {
      setEnquiryLoading(true);
      const res = await fetch("/api/enquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: id,
          buyerName: enquiryForm.buyerName,
          buyerEmail: enquiryForm.buyerEmail,
          message: enquiryForm.message,
          offerPrice: enquiryForm.offerPrice ? Number(enquiryForm.offerPrice) : undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to send enquiry");
      }

      setEnquirySuccess("Your enquiry has been sent to the seller!");
      setEnquiryForm({
        buyerName: session?.user?.name || "",
        buyerEmail: session?.user?.email || "",
        message: "",
        offerPrice: "",
      });
    } catch (err) {
      setEnquiryError(err.message);
    } finally {
      setEnquiryLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="empty-state">
        <p className="empty-state-title">Loading item details...</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="empty-state">
        <h3 className="empty-state-title">Item not found</h3>
        <p className="empty-state-text">{error || "This listing does not exist."}</p>
        <Link href="/" className="btn btn-primary">
          Back to Marketplace
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: "20px" }}>
        <Link href="/" style={{ fontSize: "14px", color: "#2563eb", fontWeight: 600 }}>
          ← Back to Marketplace
        </Link>
      </div>

      <div className="details-grid">
        <div>
          <div className="details-image-box">
            {product.image ? (
              <img
                src={product.image}
                alt={product.name}
                style={{ width: "100%", height: "100%", objectFit: "contain" }}
              />
            ) : (
              <div className="product-img-placeholder" style={{ fontSize: "16px" }}>
                <span style={{ fontSize: "48px" }}>📦</span>
                <span>No image uploaded</span>
              </div>
            )}
          </div>

          {canManage && (
            <div className="filter-card" style={{ marginTop: "20px" }}>
              <h4 style={{ fontSize: "14px", fontWeight: 700, marginBottom: "6px", color: "#334155" }}>
                {isAdmin ? "🛡️ Administrator Controls" : "Listing Management Controls"}
              </h4>
              <p style={{ fontSize: "13px", color: "#64748b", marginBottom: "12px" }}>
                {isAdmin
                  ? "As an administrator, you have permission to manage this listing."
                  : "You are the owner of this listing. You can update availability, edit, or delete it:"}
              </p>

              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "12px" }}>
                <button
                  type="button"
                  onClick={() => handleStatusChange("Available")}
                  disabled={statusLoading || product.status === "Available"}
                  className={`btn btn-sm ${product.status === "Available" ? "btn-success" : "btn-secondary"}`}
                >
                  Available
                </button>
                <button
                  type="button"
                  onClick={() => handleStatusChange("Reserved")}
                  disabled={statusLoading || product.status === "Reserved"}
                  className={`btn btn-sm ${product.status === "Reserved" ? "btn-primary" : "btn-secondary"}`}
                >
                  Reserved
                </button>
                <button
                  type="button"
                  onClick={() => handleStatusChange("Sold")}
                  disabled={statusLoading || product.status === "Sold"}
                  className={`btn btn-sm ${product.status === "Sold" ? "btn-danger" : "btn-secondary"}`}
                >
                  Sold
                </button>
              </div>

              <div style={{ display: "flex", gap: "10px", borderTop: "1px solid #f1f5f9", paddingTop: "12px" }}>
                <Link href={`/products/${product._id}/edit`} className="btn btn-secondary btn-sm">
                  ✏️ Edit Listing
                </Link>
                <button
                  type="button"
                  onClick={handleDeleteProduct}
                  disabled={deleteLoading}
                  className="btn btn-danger btn-sm"
                >
                  {deleteLoading ? "Deleting..." : "🗑️ Delete Listing"}
                </button>
              </div>
            </div>
          )}
        </div>

        <div>
          <div className="details-info-box">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "10px" }}>
              <div className="product-tags">
                <span className="tag">{product.category}</span>
                <span className="tag">{product.condition}</span>
              </div>
              <span
                className={`badge-pill ${
                  product.status === "Available"
                    ? "badge-available"
                    : product.status === "Reserved"
                    ? "badge-reserved"
                    : "badge-sold"
                }`}
              >
                {product.status}
              </span>
            </div>

            <h1 className="page-title" style={{ marginTop: "8px" }}>
              {product.name}
            </h1>

            <div className="details-price">₹{product.price}</div>

            <div className="details-desc-box">
              <h4 style={{ fontSize: "13px", fontWeight: 700, color: "#475569", marginBottom: "6px" }}>
                Description
              </h4>
              <p style={{ fontSize: "14px", color: "#1e293b", whiteSpace: "pre-line" }}>
                {product.description}
              </p>
            </div>

            <div className="details-seller-box">
              <h4 style={{ fontSize: "13px", fontWeight: 700, color: "#475569", marginBottom: "6px" }}>
                Listed by
              </h4>
              <p style={{ fontSize: "15px", fontWeight: 600, color: "#0f172a" }}>
                👤 {product.sellerName}
              </p>
              <p style={{ fontSize: "13px", color: "#64748b", marginTop: "2px" }}>
                ✉️ {product.sellerEmail}
              </p>
            </div>
          </div>

          <div className="enquiry-card">
            <h3 style={{ fontSize: "17px", fontWeight: 700, color: "#0f172a", marginBottom: "4px" }}>
              Interested in this item?
            </h3>
            <p style={{ fontSize: "13px", color: "#64748b", marginBottom: "16px" }}>
              Send a direct enquiry to {product.sellerName} to discuss pickup or negotiate price.
            </p>

            {enquirySuccess && <div className="alert-box alert-success">{enquirySuccess}</div>}
            {enquiryError && <div className="alert-box alert-error">{enquiryError}</div>}

            <form onSubmit={handleEnquirySubmit} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div className="form-group">
                  <label className="form-label">Your Name *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Rahul Sharma"
                    value={enquiryForm.buyerName}
                    onChange={(e) =>
                      setEnquiryForm((prev) => ({ ...prev, buyerName: e.target.value }))
                    }
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Your Email *</label>
                  <input
                    type="email"
                    className="form-input"
                    placeholder="e.g. rahul@college.edu"
                    value={enquiryForm.buyerEmail}
                    onChange={(e) =>
                      setEnquiryForm((prev) => ({ ...prev, buyerEmail: e.target.value }))
                    }
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Offer Price in ₹ (Optional)</label>
                <input
                  type="number"
                  min="0"
                  className="form-input"
                  placeholder={`Current price: ₹${product.price} (leave blank if paying full)`}
                  value={enquiryForm.offerPrice}
                  onChange={(e) =>
                    setEnquiryForm((prev) => ({ ...prev, offerPrice: e.target.value }))
                  }
                />
              </div>

              <div className="form-group">
                <label className="form-label">Message *</label>
                <textarea
                  className="form-textarea"
                  placeholder="Hi, is this still available? Can we meet at the campus library?"
                  value={enquiryForm.message}
                  onChange={(e) =>
                    setEnquiryForm((prev) => ({ ...prev, message: e.target.value }))
                  }
                  rows={3}
                  required
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={enquiryLoading || product.status === "Sold"}
              >
                {enquiryLoading
                  ? "Sending..."
                  : product.status === "Sold"
                  ? "Item Sold (Enquiries Closed)"
                  : "Send Enquiry to Seller"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
