import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Enquiry from "@/models/Enquiry";
import { auth } from "@/lib/auth";

export async function PATCH(request, { params }) {
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
    const body = await request.json();
    const { status } = body;

    if (!["Pending", "Accepted", "Rejected"].includes(status)) {
      return NextResponse.json(
        { success: false, error: "Invalid status value" },
        { status: 400 }
      );
    }

    const enquiry = await Enquiry.findById(id);
    if (!enquiry) {
      return NextResponse.json(
        { success: false, error: "Enquiry not found" },
        { status: 404 }
      );
    }

    const isAuthorized =
      session.user.role === "ADMIN" ||
      enquiry.sellerEmail === session.user.email;

    if (!isAuthorized) {
      return NextResponse.json(
        { success: false, error: "Forbidden: Not authorized to update this enquiry" },
        { status: 403 }
      );
    }

    enquiry.status = status;
    await enquiry.save();

    return NextResponse.json({ success: true, enquiry });
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
    const enquiry = await Enquiry.findById(id);

    if (!enquiry) {
      return NextResponse.json(
        { success: false, error: "Enquiry not found" },
        { status: 404 }
      );
    }

    const isAuthorized =
      session.user.role === "ADMIN" ||
      enquiry.sellerEmail === session.user.email;

    if (!isAuthorized) {
      return NextResponse.json(
        { success: false, error: "Forbidden: Not authorized to delete this enquiry" },
        { status: 403 }
      );
    }

    await Enquiry.findByIdAndDelete(id);

    return NextResponse.json({ success: true, message: "Enquiry deleted successfully" });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
