import { NextResponse } from 'next/server';
import { dataService } from '@/lib/dataService';
import { getQuizGuardStatus } from '@/lib/quizGuard';

export async function GET() {
  const guard = getQuizGuardStatus();
  const now = new Date();

  // Raw UTC date parts (old broken logic)
  const utcTodayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  // IST date from guard (new logic)
  const istTodayStr = guard.quizDate;

  // Fetch the 10 most recent quizDate values from the DB
  const allAttempts = await dataService.getAllAttempts();
  const recentDates = [...new Set((allAttempts as any[]).map((a) => a.quizDate))]
    .sort()
    .reverse()
    .slice(0, 10);

  const totalAttempts = allAttempts.length;

  // Weekly boundary from new IST logic
  const [y, m, d] = istTodayStr.split('-').map(Number);
  const istNow = new Date(Date.UTC(y, m - 1, d));
  const dayIndex = istNow.getUTCDay();
  const diffToMon = dayIndex === 0 ? -6 : 1 - dayIndex;
  istNow.setUTCDate(istNow.getUTCDate() + diffToMon);
  const weeklyMinStr = `${istNow.getUTCFullYear()}-${String(istNow.getUTCMonth() + 1).padStart(2, '0')}-${String(istNow.getUTCDate()).padStart(2, '0')}`;

  const dailyCount = (allAttempts as any[]).filter((a) => a.quizDate === istTodayStr).length;
  const weeklyCount = (allAttempts as any[]).filter((a) => a.quizDate >= weeklyMinStr).length;

  return NextResponse.json({
    serverUtcNow: now.toISOString(),
    utcTodayStr,
    istTodayStr,
    weeklyMinStr,
    dailyCount,
    weeklyCount,
    totalAttempts,
    recentQuizDates: recentDates,
  });
}
