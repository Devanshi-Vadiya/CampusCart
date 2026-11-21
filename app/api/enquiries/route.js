import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Enquiry from "@/models/Enquiry";
import Product from "@/models/Product";
import { auth } from "@/lib/auth";

export async function GET(request) {
  try {
    await connectDB();
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Please log in" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("productId");

    const filter = {};
    if (session.user.role === "ADMIN") {
      const requestedEmail = searchParams.get("sellerEmail");
      if (requestedEmail) filter.sellerEmail = requestedEmail.toLowerCase();
    } else {
      filter.sellerEmail = session.user.email.toLowerCase();
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
    const session = await auth();
    const body = await request.json();
    const { productId, message, offerPrice } = body;

    let buyerName = body.buyerName;
    let buyerEmail = body.buyerEmail;

    if (session?.user) {
      buyerName = buyerName || session.user.name;
      buyerEmail = buyerEmail || session.user.email;
    }

    if (!productId || !message || !buyerName || !buyerEmail) {
      return NextResponse.json(
        { success: false, error: "Please fill all required fields" },
        { status: 400 }
      );
    }

    const product = await Product.findById(productId);
    if (!product) {
      return NextResponse.json(
        { success: false, error: "Product not found" },
        { status: 404 }
      );
    }

    const enquiry = await Enquiry.create({
      productId,
      productName: product.name,
      sellerEmail: product.sellerEmail.toLowerCase(),
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
