import { NextResponse } from "next/server";
import { requireAdmin, prisma } from "@/lib/auth";

export async function POST(request, { params }) {
  try {
    const authResult = await requireAdmin(request);

    if (authResult.error) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }

    const { id } = await params;

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        isApproved: true,
        isAdmin: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user.isApproved) {
      return NextResponse.json(
        { error: "User is already approved" },
        { status: 400 }
      );
    }

    // Approve the user
    const updatedUser = await prisma.user.update({
      where: { id },
      data: { isApproved: true },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        isApproved: true,
        isAdmin: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      message: "User approved successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Approve user error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
