import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Product from "@/models/Product";
import { auth } from "@/lib/auth";

export async function GET(request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const category = searchParams.get("category") || "";
    const condition = searchParams.get("condition") || "";
    const status = searchParams.get("status") || "";
    const sellerEmail = searchParams.get("sellerEmail") || "";
    const ownerId = searchParams.get("ownerId") || "";
    const sort = searchParams.get("sort") || "newest";

    const filter = {};

    if (search) {
      filter.name = { $regex: search, $options: "i" };
    }
    if (category && category !== "All") {
      filter.category = category;
    }
    if (condition && condition !== "All") {
      filter.condition = condition;
    }
    if (status && status !== "All") {
      filter.status = status;
    }
    if (ownerId) {
      filter.ownerId = ownerId;
    } else if (sellerEmail) {
      filter.sellerEmail = sellerEmail.toLowerCase();
    }

    let sortOptions = { createdAt: -1 };
    if (sort === "price-asc") {
      sortOptions = { price: 1 };
    } else if (sort === "price-desc") {
      sortOptions = { price: -1 };
    } else if (sort === "oldest") {
      sortOptions = { createdAt: 1 };
    }

    const products = await Product.find(filter).sort(sortOptions);
    return NextResponse.json({ success: true, count: products.length, products });
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

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Please log in to post an item" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, description, price, category, condition, image } = body;

    if (!name || !description || price === undefined || !category || !condition) {
      return NextResponse.json(
        { success: false, error: "Please fill all required fields" },
        { status: 400 }
      );
    }

    const product = await Product.create({
      name,
      description,
      price: Number(price),
      category,
      condition,
      image: image || "",
      ownerId: session.user.id,
      sellerName: session.user.name || "Student",
      sellerEmail: session.user.email.toLowerCase(),
      status: "Available",
    });

    return NextResponse.json({ success: true, product }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
