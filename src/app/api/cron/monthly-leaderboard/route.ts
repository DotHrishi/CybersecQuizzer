import { NextRequest, NextResponse } from 'next/server';
import { 
  getMonthlyLeaderboard, 
  generateLeaderboardEmailHtml, 
  sendMonthlyLeaderboardEmail, 
  getMonthlyRecipients 
} from '@/lib/email';

export const dynamic = 'force-dynamic';

function isAuthorized(req: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET;
  
  // If CRON_SECRET is configured, enforce it
  if (cronSecret) {
    const authHeader = req.headers.get('authorization');
    if (authHeader === `Bearer ${cronSecret}`) return true;

    const urlSecret = req.nextUrl.searchParams.get('secret');
    if (urlSecret === cronSecret) return true;

    return false;
  }

  // If in local development and CRON_SECRET is not set, allow for testing
  if (process.env.NODE_ENV !== 'production') {
    return true;
  }

  return false;
}

export async function GET(req: NextRequest) {
  return handleMonthlyLeaderboardTrigger(req);
}

export async function POST(req: NextRequest) {
  return handleMonthlyLeaderboardTrigger(req);
}

async function handleMonthlyLeaderboardTrigger(req: NextRequest) {
  // 1. Authorization check
  if (!isAuthorized(req)) {
    return NextResponse.json(
      { 
        success: false, 
        message: 'Unauthorized. Provide valid Bearer token or ?secret= query parameter.' 
      },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(req.url);
  const targetMonth = searchParams.get('month') || undefined; // e.g. "2026-09"
  const isDryRun = searchParams.get('dryRun') === 'true' || searchParams.get('preview') === 'true';
  const testRecipient = searchParams.get('testRecipient');

  try {
    // 2. Fetch Leaderboard Data
    const data = await getMonthlyLeaderboard(targetMonth);

    // 3. Dry run / Preview mode: returns HTML directly or JSON
    if (isDryRun) {
      const format = searchParams.get('format');
      const html = generateLeaderboardEmailHtml(data);

      if (format === 'html') {
        return new NextResponse(html, {
          headers: { 'Content-Type': 'text/html; charset=utf-8' },
        });
      }

      return NextResponse.json({
        success: true,
        mode: 'dryRun',
        month: data.monthTitle,
        period: `${data.startDate} to ${data.endDate}`,
        totalParticipants: data.totalParticipants,
        totalAttempts: data.totalAttempts,
        recipients: testRecipient ? [testRecipient] : getMonthlyRecipients(),
        topWinners: data.leaderboard.slice(0, 5),
        info: 'Dry run completed. To send real email, remove dryRun parameter.'
      });
    }

    // 4. Send Email
    const recipients = testRecipient 
      ? [testRecipient.trim().toLowerCase()] 
      : getMonthlyRecipients();

    const result = await sendMonthlyLeaderboardEmail({
      targetMonth,
      recipients,
    });

    return NextResponse.json({
      success: true,
      message: `Monthly leaderboard for ${data.monthTitle} sent successfully.`,
      month: data.monthTitle,
      period: `${data.startDate} to ${data.endDate}`,
      recipientsCount: recipients.length,
      recipients,
      top3Winners: data.leaderboard.slice(0, 3).map(u => ({
        rank: u.rank,
        userName: u.userName,
        points: u.totalPoints,
        accuracy: `${u.accuracy}%`,
      })),
      resendResponse: result.response,
    });
  } catch (error: any) {
    console.error('Error in monthly leaderboard cron route:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: error.message || 'Failed to process monthly leaderboard email trigger.',
      },
      { status: 500 }
    );
  }
}
