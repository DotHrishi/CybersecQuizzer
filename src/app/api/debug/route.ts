import { NextResponse } from 'next/server';
import { dataService } from '@/lib/dataService';
import { getQuizGuardStatus } from '@/lib/quizGuard';

export async function GET() {
  const guard = getQuizGuardStatus();
  const now = new Date();

  const allAttempts = await dataService.getAllAttempts() as any[];

  // Show the 10 most recent attempts in full detail (raw quizDate value + type)
  const recent10 = allAttempts
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 10)
    .map((a) => ({
      userName: a.userName,
      quizDate: a.quizDate,
      quizDateType: typeof a.quizDate,
      quizDateJSON: JSON.stringify(a.quizDate),
      createdAt: a.createdAt,
    }));

  return NextResponse.json({
    serverUtcNow: now.toISOString(),
    istTodayStr: guard.quizDate,
    totalAttempts: allAttempts.length,
    recent10,
  });
}
