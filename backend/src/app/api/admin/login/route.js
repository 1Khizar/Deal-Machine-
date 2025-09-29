import { NextResponse } from 'next/server';
import { prisma, verifyPassword, generateToken } from '@/lib/auth';

export async function POST(request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Find admin user by email
    const user = await prisma.user.findUnique({
      where: { 
        email: email.toLowerCase(),
      },
    });

    if (!user || !user.isAdmin) {
      return NextResponse.json(
        { error: 'Invalid admin credentials' },
        { status: 401 }
      );
    }

    // Verify password
    const isValidPassword = await verifyPassword(password, user.password);
    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Invalid admin credentials' },
        { status: 401 }
      );
    }

    // Generate JWT token
    const token = generateToken({ userId: user.id });

    // Return admin data (excluding password)
    const { password: _, ...adminWithoutPassword } = user;

    return NextResponse.json({
      token,
      admin: adminWithoutPassword,
    });

  } catch (error) {
    console.error('Admin login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

