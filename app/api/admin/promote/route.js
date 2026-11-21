import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import User from "@/models/User";
import { auth } from "@/lib/auth";

export async function POST(request) {
  try {
    await connectDB();
    const session = await auth();
    const body = await request.json();
    const { email, adminSecret } = body;

    const setupSecret = process.env.ADMIN_SETUP_SECRET || process.env.AUTH_SECRET;
    const isAuthorizedBySecret = adminSecret && adminSecret === setupSecret;
    const isAuthorizedBySession = session?.user?.role === "ADMIN";

    if (!isAuthorizedBySecret && !isAuthorizedBySession) {
      return NextResponse.json(
        { success: false, error: "Unauthorized to assign administrator privileges" },
        { status: 403 }
      );
    }

    if (!email) {
      return NextResponse.json(
        { success: false, error: "Email is required" },
        { status: 400 }
      );
    }

    const user = await User.findOneAndUpdate(
      { email: email.toLowerCase().trim() },
      { role: "ADMIN" },
      { returnDocument: "after" }
    );

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `User ${user.email} successfully assigned role ADMIN`,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
