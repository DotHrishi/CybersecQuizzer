import { NextRequest, NextResponse } from 'next/server';
import { dataService } from '@/lib/dataService';

function verifyAdminAuth(req: NextRequest): boolean {
  const adminHeader = req.headers.get('x-admin-password')?.trim();
  const expectedPassword = (process.env.ADMIN_PASSWORD || 'cyberadmin123').trim();
  return Boolean(adminHeader && adminHeader === expectedPassword);
}

export async function GET(req: NextRequest) {
  if (!verifyAdminAuth(req)) {
    return NextResponse.json({ success: false, message: 'Unauthorized admin request.' }, { status: 401 });
  }

  try {
    const questions = await dataService.getAllQuestions();
    const attempts = await dataService.getAllAttempts();

    const totalQuestions = questions.length;
    const activeQuestions = questions.filter((q: any) => q.active).length;
    const totalAttempts = attempts.length;

    const uniqueUsersSet = new Set(attempts.map((a: any) => a.userName));
    const totalUsers = uniqueUsersSet.size;

    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const todayAttempts = attempts.filter((a: any) => a.quizDate === todayStr).length;

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
