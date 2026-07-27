import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

function verifyAdminAuth(req: NextRequest): boolean {
  const adminHeader = req.headers.get('x-admin-password');
  const expectedPassword = process.env.ADMIN_PASSWORD || 'cyberadmin123';
  return adminHeader === expectedPassword;
}

export async function POST(req: NextRequest) {
  if (!verifyAdminAuth(req)) {
    return NextResponse.json({ success: false, message: 'Unauthorized admin request.' }, { status: 401 });
  }

  try {
    const { target } = await req.json();

    if (target === 'leaderboard') {
      await db.userAttempt.deleteMany();
      return NextResponse.json({ success: true, message: 'All user attempt records cleared. Leaderboards reset.' });
    }

    return NextResponse.json({ success: false, message: 'Invalid reset target specified.' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
