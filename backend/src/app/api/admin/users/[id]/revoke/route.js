import { NextResponse } from 'next/server';
import { requireAdmin, prisma } from '@/lib/auth';

export async function POST(request, { params }) {
  try {
    const authResult = await requireAdmin(request);
    
    if (authResult.error) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }

    const { id } = params;

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
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    if (user.isAdmin) {
      return NextResponse.json(
        { error: 'Cannot revoke admin user' },
        { status: 400 }
      );
    }

    if (!user.isApproved) {
      return NextResponse.json(
        { error: 'User is already not approved' },
        { status: 400 }
      );
    }

    // Revoke the user's approval
    const updatedUser = await prisma.user.update({
      where: { id },
      data: { isApproved: false },
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
      message: 'User access revoked successfully',
      user: updatedUser,
    });

  } catch (error) {
    console.error('Revoke user error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

