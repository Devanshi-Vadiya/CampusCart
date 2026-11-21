import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Enquiry from "@/models/Enquiry";

export async function GET(request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const sellerEmail = searchParams.get("sellerEmail");
    const productId = searchParams.get("productId");

    const filter = {};
    if (sellerEmail) {
      filter.sellerEmail = sellerEmail.toLowerCase();
    }
    if (productId) {
      filter.productId = productId;
    }

    const enquiries = await Enquiry.find(filter).sort({ createdAt: -1 });
    return NextResponse.json({ success: true, count: enquiries.length, enquiries });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    await connectDB();
    const body = await request.json();
    const { productId, productName, sellerEmail, buyerName, buyerEmail, message, offerPrice } = body;

    if (!productId || !productName || !sellerEmail || !buyerName || !buyerEmail || !message) {
      return NextResponse.json(
        { success: false, error: "Please fill all required fields" },
        { status: 400 }
      );
    }

    const enquiry = await Enquiry.create({
      productId,
      productName,
      sellerEmail: sellerEmail.toLowerCase(),
      buyerName,
      buyerEmail: buyerEmail.toLowerCase(),
      message,
      offerPrice: offerPrice ? Number(offerPrice) : undefined,
      status: "Pending",
    });

    return NextResponse.json({ success: true, enquiry }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
