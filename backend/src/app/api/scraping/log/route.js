import { NextResponse } from 'next/server';
import { requireAuth, prisma } from '@/lib/auth';

export async function POST(request) {
  try {
    const authResult = await requireAuth(request);
    
    if (authResult.error) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }

    const user = authResult.user;

    // Check if user is approved
    if (!user.isApproved) {
      return NextResponse.json(
        { error: 'User not approved for scraping' },
        { status: 403 }
      );
    }

    const { dataCount, status } = await request.json();

    if (typeof dataCount !== 'number' || !status) {
      return NextResponse.json(
        { error: 'Invalid data format' },
        { status: 400 }
      );
    }

    // Log the scraping session
    const scrapingSession = await prisma.scrapingSession.create({
      data: {
        userId: user.id,
        dataCount,
        status,
      },
    });

    return NextResponse.json({
      message: 'Scraping session logged successfully',
      session: scrapingSession,
    });

  } catch (error) {
    console.error('Log scraping session error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

