import { NextRequest, NextResponse } from 'next/server';
import { dataService } from '@/lib/dataService';
import { checkRateLimit, rateLimitResponse } from '@/lib/rateLimit';

export async function GET(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
  const rl = checkRateLimit(ip, 30);
  if (!rl.isAllowed) return rateLimitResponse();

  const { searchParams } = new URL(req.url);
  const userName = searchParams.get('userName');

  if (!userName || userName.trim().length < 2) {
    return NextResponse.json(
      { success: false, message: 'Valid user name is required.' },
      { status: 400 }
    );
  }

  const cleanName = userName.trim();

  try {
    const attempts = await dataService.getUserAttempts(cleanName);

    if (attempts.length === 0) {
      return NextResponse.json({
        success: true,
        stats: {
          userName: cleanName,
          totalAttempts: 0,
          correctAnswers: 0,
          wrongAnswers: 0,
          accuracyPercentage: 0,
          avgResponseTimeMs: 0,
          totalPoints: 0,
          bestRank: 'N/A',
          history: [],
        },
      });
    }

    const totalAttempts = attempts.length;
    const correctAnswers = attempts.filter((a: any) => a.isCorrect).length;
    const wrongAnswers = totalAttempts - correctAnswers;
    const accuracyPercentage = Math.round((correctAnswers / totalAttempts) * 100);
    const totalPoints = attempts.reduce((acc: number, curr: any) => acc + Number(curr.totalPoints || 0), 0);
    const totalTime = attempts.reduce((acc: number, curr: any) => acc + Number(curr.responseTimeMs || 0), 0);
    const avgResponseTimeMs = Math.round(totalTime / totalAttempts);

    // Calculate best rank across all users
    const allAttempts = await dataService.getAllAttempts();
    const userTotalsMap = new Map<string, { totalPoints: number; totalTime: number; count: number }>();

    for (const att of allAttempts) {
      const existing = userTotalsMap.get(att.userName) || { totalPoints: 0, totalTime: 0, count: 0 };
      existing.totalPoints += Number(att.totalPoints || 0);
      existing.totalTime += Number(att.responseTimeMs || 0);
      existing.count += 1;
      userTotalsMap.set(att.userName, existing);
    }

    const aggregatedUsers = Array.from(userTotalsMap.entries()).map(([name, data]) => ({
      userName: name,
      pts: data.totalPoints,
      avgTime: Math.round(data.totalTime / data.count),
    }));

    aggregatedUsers.sort((a, b) => {
      if (b.pts !== a.pts) return b.pts - a.pts;
      return a.avgTime - b.avgTime;
    });

    const userRankIndex = aggregatedUsers.findIndex(
      (u) => u.userName.toLowerCase() === cleanName.toLowerCase()
    );
    const bestRank = userRankIndex !== -1 ? userRankIndex + 1 : 'N/A';

    return NextResponse.json({
      success: true,
      stats: {
        userName: cleanName,
        totalAttempts,
        correctAnswers,
        wrongAnswers,
        accuracyPercentage,
        avgResponseTimeMs,
        totalPoints,
        bestRank,
        history: attempts.map((a: any) => ({
          quizDate: a.quizDate,
          isCorrect: a.isCorrect,
          score: a.score,
          bonusPoints: a.bonusPoints,
          totalPoints: a.totalPoints,
          responseTimeMs: a.responseTimeMs,
          createdAt: new Date(a.createdAt).toISOString(),
        })),
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
