import { NextRequest, NextResponse } from 'next/server';
import { dataService } from '@/lib/dataService';
import { checkRateLimit, rateLimitResponse } from '@/lib/rateLimit';
import { getQuizGuardStatus } from '@/lib/quizGuard';

export async function GET(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
  const rl = checkRateLimit(ip, 30);
  if (!rl.isAllowed) return rateLimitResponse();

  const { searchParams } = new URL(req.url);
  const period = (searchParams.get('period') || 'daily').toLowerCase().replace('-', '');

  // Use IST date from quizGuard — the same source used when storing quizDate on every attempt.
  // Using server-local (UTC) date caused a mismatch: attempts stored with IST quizDate
  // would not match the UTC-derived todayStr, making the Daily tab appear empty.
  const { quizDate: todayStr } = getQuizGuardStatus();

  // Compute weekly/monthly boundaries in IST by parsing todayStr (YYYY-MM-DD in IST)
  const [todayYear, todayMonth, todayDay] = todayStr.split('-').map(Number);

  let minDateStr = '';
  if (period === 'daily') {
    minDateStr = todayStr;
  } else if (period === 'weekly') {
    // Find the Monday of the current IST week
    const istNow = new Date(Date.UTC(todayYear, todayMonth - 1, todayDay));
    const dayIndex = istNow.getUTCDay(); // 0=Sun, 1=Mon ... 6=Sat
    const diffToMon = dayIndex === 0 ? -6 : 1 - dayIndex;
    istNow.setUTCDate(istNow.getUTCDate() + diffToMon);
    minDateStr = `${istNow.getUTCFullYear()}-${String(istNow.getUTCMonth() + 1).padStart(2, '0')}-${String(istNow.getUTCDate()).padStart(2, '0')}`;
  } else if (period === 'monthly') {
    minDateStr = `${todayYear}-${String(todayMonth).padStart(2, '0')}-01`;
  } else {
    // alltime
    minDateStr = '1970-01-01';
  }

  try {
    const allAttempts = await dataService.getAllAttempts();

    const filtered = allAttempts.filter((a: any) => {
      if (period === 'daily') {
        return a.quizDate === todayStr;
      }
      if (period === 'alltime') {
        return true;
      }
      return a.quizDate >= minDateStr;
    });

    const userStatsMap = new Map<string, {
      userName: string;
      attempts: number;
      correctAnswers: number;
      totalPoints: number;
      totalResponseTime: number;
      lastAttemptDate: string | Date;
    }>();

    for (const attempt of filtered) {
      const existing = userStatsMap.get(attempt.userName) || {
        userName: attempt.userName,
        attempts: 0,
        correctAnswers: 0,
        totalPoints: 0,
        totalResponseTime: 0,
        lastAttemptDate: attempt.createdAt,
      };

      existing.attempts += 1;
      if (attempt.isCorrect) existing.correctAnswers += 1;
      existing.totalPoints += Number(attempt.totalPoints || 0);
      existing.totalResponseTime += Number(attempt.responseTimeMs || 0);
      
      const attemptDate = new Date(attempt.createdAt);
      if (attemptDate > new Date(existing.lastAttemptDate)) {
        existing.lastAttemptDate = attempt.createdAt;
      }

      userStatsMap.set(attempt.userName, existing);
    }

    const aggregated = Array.from(userStatsMap.values()).map((user) => ({
      userName: user.userName,
      attempts: user.attempts,
      correctAnswers: user.correctAnswers,
      totalPoints: Number(user.totalPoints.toFixed(2)),
      avgResponseTimeMs: Math.round(user.totalResponseTime / user.attempts),
      lastAttemptDate: new Date(user.lastAttemptDate).toISOString(),
    }));

    // Sorting: 
    // 1. Total Points DESC
    // 2. Number of Correct Answers DESC
    // 3. Fastest Average Response Time ASC (tie-breaker)
    aggregated.sort((a, b) => {
      if (Math.abs(b.totalPoints - a.totalPoints) > 0.001) {
        return b.totalPoints - a.totalPoints;
      }
      if (b.correctAnswers !== a.correctAnswers) {
        return b.correctAnswers - a.correctAnswers;
      }
      return a.avgResponseTimeMs - b.avgResponseTimeMs;
    });

    const leaderboard = aggregated.slice(0, 100).map((item, index) => ({
      rank: index + 1,
      ...item,
    }));

    return NextResponse.json({
      success: true,
      period,
      quizDate: todayStr,
      leaderboard,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
