import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { checkRateLimit, rateLimitResponse } from '@/lib/rateLimit';

export async function GET(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
  const rl = checkRateLimit(ip, 30);
  if (!rl.isAllowed) return rateLimitResponse();

  const { searchParams } = new URL(req.url);
  const period = (searchParams.get('period') || 'daily').toLowerCase();

  const now = new Date();
  let dateFilter = '';

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const todayStr = `${year}-${month}-${day}`;

  if (period === 'daily') {
    dateFilter = `WHERE quizDate = '${todayStr}'`;
  } else if (period === 'weekly') {
    // Current week starting Monday
    const d = new Date(now);
    const dayIndex = d.getDay();
    const diffToMon = d.getDate() - dayIndex + (dayIndex === 0 ? -6 : 1);
    const mon = new Date(d.setDate(diffToMon));
    const monStr = `${mon.getFullYear()}-${String(mon.getMonth() + 1).padStart(2, '0')}-${String(mon.getDate()).padStart(2, '0')}`;
    dateFilter = `WHERE quizDate >= '${monStr}'`;
  } else if (period === 'monthly') {
    const monthStart = `${year}-${month}-01`;
    dateFilter = `WHERE quizDate >= '${monthStart}'`;
  }

  try {
    const rawLeaderboard: any[] = await db.$queryRawUnsafe(`
      SELECT 
        userName,
        COUNT(id) as attempts,
        SUM(CASE WHEN isCorrect = 1 THEN 1 ELSE 0 END) as correctAnswers,
        SUM(totalPoints) as totalPoints,
        ROUND(AVG(responseTimeMs), 0) as avgResponseTimeMs,
        MAX(createdAt) as lastAttemptDate
      FROM user_attempts
      ${dateFilter}
      GROUP BY userName
      ORDER BY totalPoints DESC, avgResponseTimeMs ASC, lastAttemptDate ASC
      LIMIT 100;
    `);

    const leaderboard = rawLeaderboard.map((item, index) => {
      const dateVal = typeof item.lastAttemptDate === 'bigint' 
        ? Number(item.lastAttemptDate) 
        : item.lastAttemptDate;
        
      return {
        rank: index + 1,
        userName: item.userName,
        attempts: Number(item.attempts || 0),
        correctAnswers: Number(item.correctAnswers || 0),
        totalPoints: Number(item.totalPoints || 0),
        avgResponseTimeMs: Number(item.avgResponseTimeMs || 0),
        lastAttemptDate: dateVal ? new Date(dateVal).toISOString() : todayStr,
      };
    });

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
