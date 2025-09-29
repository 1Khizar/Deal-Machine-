import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';

export async function POST(request) {
  try {
    const authResult = await requireAuth(request);
    
    if (authResult.error) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }

    return NextResponse.json({
      user: authResult.user,
    });

  } catch (error) {
    console.error('Token verification error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

