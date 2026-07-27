import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

function verifyAdminAuth(req: NextRequest): boolean {
  const adminHeader = req.headers.get('x-admin-password');
  const expectedPassword = process.env.ADMIN_PASSWORD || 'cyberadmin123';
  return adminHeader === expectedPassword;
}

export async function GET(req: NextRequest) {
  if (!verifyAdminAuth(req)) {
    return NextResponse.json({ success: false, message: 'Unauthorized admin request.' }, { status: 401 });
  }

  try {
    const totalQuestions = await db.question.count();
    const activeQuestions = await db.question.count({ where: { active: true } });
    const totalAttempts = await db.userAttempt.count();

    const uniqueUsersResult: any[] = await db.$queryRaw`
      SELECT COUNT(DISTINCT userName) as count FROM user_attempts;
    `;
    const totalUsers = Number(uniqueUsersResult[0]?.count || 0);

    const todayStr = new Date().toISOString().split('T')[0];
    const todayAttempts = await db.userAttempt.count({ where: { quizDate: todayStr } });

    return NextResponse.json({
      success: true,
      stats: {
        totalQuestions,
        activeQuestions,
        totalAttempts,
        totalUsers,
        todayAttempts,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
