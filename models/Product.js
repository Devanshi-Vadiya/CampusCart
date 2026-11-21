import mongoose from "mongoose";

const ProductSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    category: {
      type: String,
      required: true,
      enum: ["Textbooks", "Electronics", "Stationery", "Hostel & Room", "Cycles & Mobility", "Clothing", "Other"],
    },
    condition: {
      type: String,
      required: true,
      enum: ["Brand New", "Like New", "Good", "Fair"],
    },
    image: {
      type: String,
      default: "",
    },
    sellerName: {
      type: String,
      required: true,
      trim: true,
    },
    sellerEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    status: {
      type: String,
      enum: ["Available", "Reserved", "Sold"],
      default: "Available",
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Product || mongoose.model("Product", ProductSchema);
