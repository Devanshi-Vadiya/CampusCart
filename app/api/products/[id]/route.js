import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Product from "@/models/Product";
import Enquiry from "@/models/Enquiry";
import { auth } from "@/lib/auth";

export async function GET(request, { params }) {
  try {
    await connectDB();
    const { id } = await params;
    const product = await Product.findById(id);

    if (!product) {
      return NextResponse.json(
        { success: false, error: "Product not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, product });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
  try {
    await connectDB();
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Please log in" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const product = await Product.findById(id);

    if (!product) {
      return NextResponse.json(
        { success: false, error: "Product not found" },
        { status: 404 }
      );
    }

    const isOwner =
      (product.ownerId && product.ownerId.toString() === session.user.id) ||
      product.sellerEmail === session.user.email;
    const isAdmin = session.user.role === "ADMIN";

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { success: false, error: "Forbidden: You are not authorized to modify this listing" },
        { status: 403 }
      );
    }

    const body = await request.json();

    const allowedUpdates = {
      name: body.name !== undefined ? body.name : product.name,
      description: body.description !== undefined ? body.description : product.description,
      price: body.price !== undefined ? Number(body.price) : product.price,
      category: body.category !== undefined ? body.category : product.category,
      condition: body.condition !== undefined ? body.condition : product.condition,
      image: body.image !== undefined ? body.image : product.image,
      status: body.status !== undefined ? body.status : product.status,
    };

    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      allowedUpdates,
      { new: true, runValidators: true }
    );

    return NextResponse.json({ success: true, product: updatedProduct });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    await connectDB();
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Please log in" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const product = await Product.findById(id);

    if (!product) {
      return NextResponse.json(
        { success: false, error: "Product not found" },
        { status: 404 }
      );
    }

    const isOwner =
      (product.ownerId && product.ownerId.toString() === session.user.id) ||
      product.sellerEmail === session.user.email;
    const isAdmin = session.user.role === "ADMIN";

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { success: false, error: "Forbidden: You are not authorized to delete this listing" },
        { status: 403 }
      );
    }

    await Product.findByIdAndDelete(id);
    await Enquiry.deleteMany({ productId: id });

    return NextResponse.json({ success: true, message: "Product deleted successfully" });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
