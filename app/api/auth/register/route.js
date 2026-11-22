import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import connectDB from "@/lib/db";
import User from "@/models/User";

export async function POST(request) {
  try {
    await connectDB();
    const body = await request.json();
    const { name, email, password, confirmPassword, role, adminSecret } = body;

    if (!name || !email || !password || !confirmPassword) {
      return NextResponse.json(
        { success: false, error: "Please fill in all fields" },
        { status: 400 }
      );
    }

    if (password !== confirmPassword) {
      return NextResponse.json(
        { success: false, error: "Passwords do not match" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { success: false, error: "Password must be at least 6 characters long" },
        { status: 400 }
      );
    }

    const cleanEmail = email.toLowerCase().trim();
    const existingUser = await User.findOne({ email: cleanEmail });

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    let assignedRole = "USER";

    if (role === "ADMIN") {
      const validAdminSecret =
        process.env.ADMIN_SETUP_SECRET || process.env.AUTH_SECRET || "admin123";

      if (!adminSecret || adminSecret !== validAdminSecret) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Admin account creation is restricted. You must provide a valid administrative security key.",
          },
          { status: 403 }
        );
      }

      assignedRole = "ADMIN";
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      name: name.trim(),
      email: cleanEmail,
      passwordHash,
      role: assignedRole,
    });

    return NextResponse.json(
      {
        success: true,
        message: `Account created successfully as ${assignedRole}`,
        user: {
          id: newUser._id.toString(),
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
