import { NextRequest, NextResponse } from 'next/server';
import { dataService } from '@/lib/dataService';
import { calculateScore } from '@/lib/scoring';
import { getQuizGuardStatus } from '@/lib/quizGuard';
import { QuizSubmissionSchema } from '@/lib/validation';
import { checkRateLimit, rateLimitResponse } from '@/lib/rateLimit';
import { activeSessions } from '@/lib/sessionStore';
import { verifySubmissionAntiCheat } from '@/lib/antiCheat';
import { verifySessionToken } from '@/lib/sessionToken';

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
  const rl = checkRateLimit(ip, 20);
  if (!rl.isAllowed) return rateLimitResponse();

  try {
    const body = await req.json();
    const validation = QuizSubmissionSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'VALIDATION_ERROR', message: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const { sessionId, userName, selectedOption, selectedOptionText, sessionToken } = validation.data;
    let session = activeSessions.get(sessionId);

    // Serverless fallback: in-memory session may be missing on a different instance.
    // Recover session data from the cryptographically signed token instead.
    if (!session && sessionToken) {
      const tokenPayload = verifySessionToken(sessionToken);
      if (tokenPayload && tokenPayload.sessionId === sessionId && tokenPayload.userName.toLowerCase() === userName.toLowerCase()) {
        session = {
          questionId: tokenPayload.questionId,
          startTime: tokenPayload.startTime,
          userName: tokenPayload.userName,
          quizDate: tokenPayload.quizDate,
          expectedOptionKey: tokenPayload.expectedOptionKey,
        };
      }
    }

    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Invalid or expired quiz session. Please start a new attempt.' },
        { status: 400 }
      );
    }

    if (session.userName.toLowerCase() !== userName.toLowerCase()) {
      return NextResponse.json(
        { success: false, message: 'Session identity mismatch.' },
        { status: 403 }
      );
    }

    const guard = getQuizGuardStatus();
    if (!guard.isOpen) {
      return NextResponse.json(
        { success: false, state: guard.state, message: guard.message },
        { status: 403 }
      );
    }

    // Check if attempt already exists in DB for this date (prevent multiple submissions)
    const existingAttempt = await dataService.getUserAttemptToday(session.userName, session.quizDate);

    if (existingAttempt) {
      activeSessions.delete(sessionId);
      return NextResponse.json(
        { success: false, message: "You have already attempted today's quiz." },
        { status: 409 }
      );
    }

    // Server-side anti-cheat verification
    const antiCheat = verifySubmissionAntiCheat(session.startTime);
    if (!antiCheat.isValid) {
      activeSessions.delete(sessionId);
      return NextResponse.json(
        { success: false, message: 'Suspiciously fast automated submission detected. Please answer naturally.' },
        { status: 400 }
      );
    }

    const responseTimeMs = antiCheat.verifiedResponseTimeMs;

    // Compare by answer TEXT (not position key) — works correctly regardless of option shuffling.
    // Fetch the question to get all option texts and determine the correct answer text.
    const question = await dataService.getQuestionById(session.questionId);
    if (!question) {
      activeSessions.delete(sessionId);
      return NextResponse.json({ success: false, message: 'Question not found.' }, { status: 404 });
    }

    const correctKey = String(question.correctOption || 'A').trim().toUpperCase();
    const optionMap: Record<string, string> = {
      A: (question as any).optionA || '',
      B: (question as any).optionB || '',
      C: (question as any).optionC || '',
      D: (question as any).optionD || '',
    };
    const correctOptionText = optionMap[correctKey] || '';
    const isCorrect = correctOptionText.trim().toLowerCase() === selectedOptionText.trim().toLowerCase();


    const now = new Date();
    const scoreResult = calculateScore(isCorrect, responseTimeMs, now);

    // Privacy Mandate: Store ONLY User Name, Quiz Date, Correct or Wrong, Score, Bonus Points, Total Points, Response Time, Timestamp.
    // DO NOT store question ID or selected option.
    const attemptRecord = await dataService.createUserAttempt({
      userName: session.userName,
      quizDate: session.quizDate,
      isCorrect: scoreResult.isCorrect,
      score: scoreResult.score,
      bonusPoints: scoreResult.bonusPoints,
      totalPoints: scoreResult.totalPoints,
      responseTimeMs: Math.round(scoreResult.responseTimeMs),
    });

    // Invalidate active session to prevent double submission
    activeSessions.delete(sessionId);

    return NextResponse.json({
      success: true,
      isCorrect: attemptRecord.isCorrect,
      score: attemptRecord.score,
      bonusPoints: attemptRecord.bonusPoints,
      totalPoints: attemptRecord.totalPoints,
      responseTimeMs: attemptRecord.responseTimeMs,
      quizDate: attemptRecord.quizDate,
      message: isCorrect ? 'Correct! Well done!' : 'Better luck next time.',
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
