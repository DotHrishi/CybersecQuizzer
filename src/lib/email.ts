import { Resend } from 'resend';
import nodemailer from 'nodemailer';
import { dataService } from './dataService';
import { DEFAULT_MONTHLY_RECIPIENTS } from './recipients';

export { DEFAULT_MONTHLY_RECIPIENTS };

export interface LeaderboardUser {
  rank: number;
  userName: string;
  attempts: number;
  correctAnswers: number;
  totalPoints: number;
  avgResponseTimeMs: number;
  accuracy: number;
}

export interface MonthlyLeaderboardData {
  monthKey: string; // e.g. "2026-09"
  monthTitle: string; // e.g. "September 2026"
  startDate: string; // "2026-09-01"
  endDate: string; // "2026-09-30"
  leaderboard: LeaderboardUser[];
  totalParticipants: number;
  totalAttempts: number;
  totalCorrect: number;
  topScore: number;
}

/**
 * Returns recipients list from env if configured, or default array
 */
export function getMonthlyRecipients(): string[] {
  if (process.env.MONTHLY_EMAIL_RECIPIENTS) {
    return process.env.MONTHLY_EMAIL_RECIPIENTS.split(',')
      .map(e => e.trim().toLowerCase())
      .filter(Boolean);
  }
  return DEFAULT_MONTHLY_RECIPIENTS;
}

/**
 * Computes monthly leaderboard data for a given month or the previous completed month
 */
export async function getMonthlyLeaderboard(targetMonth?: string): Promise<MonthlyLeaderboardData> {
  const now = new Date();
  let targetYear: number;
  let targetMonthNum: number; // 1-12

  if (targetMonth && /^\d{4}-\d{2}$/.test(targetMonth)) {
    const [y, m] = targetMonth.split('-').map(Number);
    targetYear = y;
    targetMonthNum = m;
  } else {
    // Default to previous month
    const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    targetYear = prev.getFullYear();
    targetMonthNum = prev.getMonth() + 1;
  }

  const monthPad = String(targetMonthNum).padStart(2, '0');
  const monthKey = `${targetYear}-${monthPad}`;
  const startDate = `${monthKey}-01`;
  const lastDay = new Date(targetYear, targetMonthNum, 0).getDate();
  const endDate = `${monthKey}-${String(lastDay).padStart(2, '0')}`;

  const monthDateObj = new Date(targetYear, targetMonthNum - 1, 1);
  const monthTitle = monthDateObj.toLocaleString('en-US', { month: 'long', year: 'numeric' });

  // Fetch all attempts
  const allAttempts = await dataService.getAllAttempts();

  // Filter attempts in date range
  const filtered = allAttempts.filter((a: any) => {
    if (!a.quizDate) return false;
    return a.quizDate >= startDate && a.quizDate <= endDate;
  });

  const userStatsMap = new Map<string, {
    userName: string;
    attempts: number;
    correctAnswers: number;
    totalPoints: number;
    totalResponseTime: number;
    lastAttemptDate: string | Date;
  }>();

  let totalAttempts = 0;
  let totalCorrect = 0;

  for (const attempt of filtered) {
    totalAttempts += 1;
    if (attempt.isCorrect) totalCorrect += 1;

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

  const aggregated: LeaderboardUser[] = Array.from(userStatsMap.values()).map((user) => ({
    rank: 0,
    userName: user.userName,
    attempts: user.attempts,
    correctAnswers: user.correctAnswers,
    totalPoints: Number(user.totalPoints.toFixed(2)),
    avgResponseTimeMs: Math.round(user.totalResponseTime / user.attempts),
    accuracy: user.attempts > 0 ? Math.round((user.correctAnswers / user.attempts) * 100) : 0,
  }));

  // Sorting: Total Points DESC -> Correct Answers DESC -> Avg Response Time ASC
  aggregated.sort((a, b) => {
    if (Math.abs(b.totalPoints - a.totalPoints) > 0.001) {
      return b.totalPoints - a.totalPoints;
    }
    if (b.correctAnswers !== a.correctAnswers) {
      return b.correctAnswers - a.correctAnswers;
    }
    return a.avgResponseTimeMs - b.avgResponseTimeMs;
  });

  const leaderboard = aggregated.map((item, index) => ({
    ...item,
    rank: index + 1,
  }));

  const topScore = leaderboard.length > 0 ? leaderboard[0].totalPoints : 0;

  return {
    monthKey,
    monthTitle,
    startDate,
    endDate,
    leaderboard,
    totalParticipants: leaderboard.length,
    totalAttempts,
    totalCorrect,
    topScore,
  };
}

/**
 * Generates an email HTML template displaying the monthly leaderboard
 */
export function generateLeaderboardEmailHtml(
  data: MonthlyLeaderboardData,
  appUrl: string = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
): string {
  const { monthTitle, leaderboard, totalParticipants, totalAttempts, totalCorrect } = data;

  const top3 = leaderboard.slice(0, 3);
  const remaining = leaderboard.slice(3, 20);

  const overallAccuracy = totalAttempts > 0 ? Math.round((totalCorrect / totalAttempts) * 100) : 0;

  const podiumMedals = ['🥇', '🥈', '🥉'];
  const podiumColors = ['#f59e0b', '#94a3b8', '#b45309'];
  const podiumBg = [
    'linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(217, 119, 6, 0.05) 100%)',
    'linear-gradient(135deg, rgba(148, 163, 184, 0.15) 0%, rgba(100, 116, 139, 0.05) 100%)',
    'linear-gradient(135deg, rgba(180, 83, 9, 0.15) 0%, rgba(146, 64, 14, 0.05) 100%)'
  ];

  const top3Html = top3.length > 0 ? `
    <table width="100%" cellpadding="0" cellspacing="0" style="margin: 24px 0 12px 0;">
      <tr>
        ${top3.map((winner, idx) => `
          <td width="33.33%" valign="top" style="padding: 6px;">
            <div style="background: ${podiumBg[idx]}; border: 1px solid ${podiumColors[idx]}; border-radius: 12px; padding: 16px 12px; text-align: center;">
              <div style="font-size: 28px; line-height: 1; margin-bottom: 6px;">${podiumMedals[idx]}</div>
              <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: ${podiumColors[idx]}; font-weight: 700; margin-bottom: 4px;">Rank #${winner.rank}</div>
              <div style="font-size: 15px; font-weight: 700; color: #ffffff; word-break: break-word; margin-bottom: 8px;">${winner.userName}</div>
              <div style="background: rgba(0,0,0,0.3); border-radius: 8px; padding: 6px 4px;">
                <div style="font-size: 18px; font-weight: 800; color: #38bdf8;">${winner.totalPoints} <span style="font-size: 11px; font-weight: normal; color: #94a3b8;">pts</span></div>
                <div style="font-size: 11px; color: #cbd5e1; margin-top: 2px;">${winner.accuracy}% acc · ${(winner.avgResponseTimeMs / 1000).toFixed(1)}s</div>
              </div>
            </div>
          </td>
        `).join('')}
      </tr>
    </table>
  ` : `
    <div style="padding: 24px; text-align: center; color: #94a3b8; background: #1e293b; border-radius: 8px; margin: 20px 0;">
      No quiz attempts recorded for ${monthTitle}.
    </div>
  `;

  const rowsHtml = remaining.map((u) => `
    <tr style="border-bottom: 1px solid #334155;">
      <td style="padding: 12px 10px; font-weight: 600; color: #94a3b8; font-size: 13px;">#${u.rank}</td>
      <td style="padding: 12px 10px; font-weight: 600; color: #ffffff; font-size: 14px;">${u.userName}</td>
      <td style="padding: 12px 10px; text-align: right; font-weight: 700; color: #38bdf8; font-size: 14px;">${u.totalPoints}</td>
      <td style="padding: 12px 10px; text-align: right; color: #a7f3d0; font-size: 13px;">${u.correctAnswers}/${u.attempts} (${u.accuracy}%)</td>
      <td style="padding: 12px 10px; text-align: right; color: #cbd5e1; font-size: 13px;">${(u.avgResponseTimeMs / 1000).toFixed(1)}s</td>
    </tr>
  `).join('');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${monthTitle} Monthly Leaderboard</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0b0f19; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #e2e8f0;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0b0f19; padding: 32px 12px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%; background: #131b2e; border: 1px solid #1e293b; border-radius: 16px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.5);">
          
          <!-- Header Banner -->
          <tr>
            <td style="background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0369a1 100%); padding: 32px 24px; text-align: center; border-bottom: 1px solid #334155;">
              <div style="display: inline-block; padding: 6px 14px; background: rgba(56, 189, 248, 0.15); border: 1px solid rgba(56, 189, 248, 0.4); border-radius: 9999px; font-size: 12px; font-weight: 700; color: #38bdf8; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 12px;">
                🛡️ Unique Schools · Cybersec Quizzer
              </div>
              <h1 style="margin: 0 0 8px 0; font-size: 26px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px;">
                Monthly Leaderboard
              </h1>
              <p style="margin: 0; font-size: 16px; color: #93c5fd; font-weight: 500;">
                Official Results for <strong style="color: #ffffff;">${monthTitle}</strong>
              </p>
            </td>
          </tr>

          <!-- Summary Metric Cards -->
          <tr>
            <td style="padding: 24px 24px 0 24px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td width="33.33%" style="padding: 4px;">
                    <div style="background: #1e293b; border-radius: 10px; padding: 14px 10px; text-align: center;">
                      <div style="font-size: 11px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">Participants</div>
                      <div style="font-size: 20px; font-weight: 800; color: #ffffff;">${totalParticipants}</div>
                    </div>
                  </td>
                  <td width="33.33%" style="padding: 4px;">
                    <div style="background: #1e293b; border-radius: 10px; padding: 14px 10px; text-align: center;">
                      <div style="font-size: 11px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">Total Attempts</div>
                      <div style="font-size: 20px; font-weight: 800; color: #38bdf8;">${totalAttempts}</div>
                    </div>
                  </td>
                  <td width="33.33%" style="padding: 4px;">
                    <div style="background: #1e293b; border-radius: 10px; padding: 14px 10px; text-align: center;">
                      <div style="font-size: 11px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">Avg Accuracy</div>
                      <div style="font-size: 20px; font-weight: 800; color: #4ade80;">${overallAccuracy}%</div>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Top 3 Podium -->
          <tr>
            <td style="padding: 12px 24px;">
              <h2 style="margin: 16px 0 0 0; font-size: 16px; font-weight: 700; color: #f8fafc; display: flex; align-items: center;">
                🏆 Podium Winners
              </h2>
              ${top3Html}
            </td>
          </tr>

          <!-- Full Table -->
          ${remaining.length > 0 ? `
          <tr>
            <td style="padding: 12px 24px 24px 24px;">
              <h2 style="margin: 12px 0 12px 0; font-size: 16px; font-weight: 700; color: #f8fafc;">
                📊 Full Standings
              </h2>
              <table width="100%" cellpadding="0" cellspacing="0" style="background: #0f172a; border: 1px solid #1e293b; border-radius: 10px; border-collapse: collapse; overflow: hidden;">
                <thead>
                  <tr style="background: #1e293b; border-bottom: 2px solid #334155; text-align: left;">
                    <th style="padding: 10px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #94a3b8;">Rank</th>
                    <th style="padding: 10px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #94a3b8;">Participant</th>
                    <th style="padding: 10px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #94a3b8; text-align: right;">Points</th>
                    <th style="padding: 10px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #94a3b8; text-align: right;">Accuracy</th>
                    <th style="padding: 10px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #94a3b8; text-align: right;">Avg Speed</th>
                  </tr>
                </thead>
                <tbody>
                  ${rowsHtml}
                </tbody>
              </table>
            </td>
          </tr>
          ` : ''}

          <!-- Call to Action -->
          <tr>
            <td style="padding: 16px 24px 32px 24px; text-align: center;">
              <a href="${appUrl}/leaderboard?period=monthly" target="_blank" style="display: inline-block; background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 700; font-size: 14px; box-shadow: 0 4px 12px rgba(2, 132, 199, 0.4);">
                View Live Leaderboard on Portal →
              </a>
              <p style="margin: 16px 0 0 0; font-size: 12px; color: #64748b;">
                Keep quizzing daily to climb next month's leaderboard!
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background: #0a0f1d; padding: 20px 24px; text-align: center; border-top: 1px solid #1e293b; font-size: 11px; color: #64748b; line-height: 1.6;">
              This automated email is delivered on the 1st of every month to the Unique Schools team.<br>
              © ${new Date().getFullYear()} Unique Schools Cybersec Quizzer. All rights reserved.
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * Creates a Nodemailer transporter if SMTP credentials are configured
 */
export function getSmtpTransporter() {
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!user || !pass) return null;

  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = Number(process.env.SMTP_PORT) || 465;
  const secure = port === 465;

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
  });
}

/**
 * Sends the monthly leaderboard email via Nodemailer (SMTP) or Resend
 */
export async function sendMonthlyLeaderboardEmail(params?: {
  targetMonth?: string;
  recipients?: string[];
  appUrl?: string;
}) {
  const data = await getMonthlyLeaderboard(params?.targetMonth);
  const appUrl = params?.appUrl || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const recipients = params?.recipients && params.recipients.length > 0 
    ? params.recipients 
    : getMonthlyRecipients();

  const subject = `🏆 ${data.monthTitle} Monthly Cybersecurity Leaderboard`;
  const html = generateLeaderboardEmailHtml(data, appUrl);

  const textVersion = `
${subject}

Top Winners for ${data.monthTitle}:
${data.leaderboard.slice(0, 5).map(u => `#${u.rank} ${u.userName} - ${u.totalPoints} pts (${u.accuracy}% acc, ${(u.avgResponseTimeMs / 1000).toFixed(1)}s)`).join('\n')}

Total Participants: ${data.totalParticipants}
Total Attempts: ${data.totalAttempts}

View live leaderboard: ${appUrl}/leaderboard
  `.trim();

  // 1. Try Nodemailer (Gmail / Outlook / Custom SMTP)
  const smtpTransporter = getSmtpTransporter();
  if (smtpTransporter) {
    const fromAddress = process.env.SMTP_FROM || `"Cybersec Quizzer" <${process.env.SMTP_USER}>`;

    const info = await smtpTransporter.sendMail({
      from: fromAddress,
      to: recipients,
      subject,
      html,
      text: textVersion,
    });

    return {
      success: true,
      provider: 'nodemailer',
      data,
      response: {
        messageId: info.messageId,
        accepted: info.accepted,
        rejected: info.rejected,
      },
      recipientsCount: recipients.length,
      recipients,
    };
  }

  // 2. Fallback to Resend if configured
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error(
      'Email credentials missing. Please set SMTP_USER and SMTP_PASS (Gmail App Password) or RESEND_API_KEY in .env'
    );
  }

  const resend = new Resend(apiKey);
  const fromEmail = process.env.RESEND_FROM_EMAIL || 'Cybersec Quizzer <onboarding@resend.dev>';

  const response = await resend.emails.send({
    from: fromEmail,
    to: recipients,
    subject,
    html,
    text: textVersion,
  });

  if (response.error) {
    throw new Error(`Resend Error (${response.error.name}): ${response.error.message}`);
  }

  return {
    success: true,
    provider: 'resend',
    data,
    response,
    recipientsCount: recipients.length,
    recipients,
  };
}
