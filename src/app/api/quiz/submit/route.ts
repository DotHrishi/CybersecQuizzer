import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { calculateScore } from '@/lib/scoring';
import { getQuizGuardStatus } from '@/lib/quizGuard';
import { QuizSubmissionSchema } from '@/lib/validation';
import { checkRateLimit, rateLimitResponse } from '@/lib/rateLimit';
import { activeSessions } from '@/lib/sessionStore';

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

    const { sessionId, userName, selectedOption } = validation.data;
    const session = activeSessions.get(sessionId);

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

    // Check if attempt already exists in DB for this date
    const existingAttempt = await db.userAttempt.findFirst({
      where: {
        userName: session.userName,
        quizDate: session.quizDate,
      },
    });

    if (existingAttempt) {
      activeSessions.delete(sessionId);
      return NextResponse.json(
        { success: false, message: "You have already attempted today's quiz." },
        { status: 409 }
      );
    }

    const endTime = Date.now();
    const responseTimeMs = Math.max(endTime - session.startTime, 300);

    // Transient check of correct option
    const question = await db.question.findUnique({
      where: { id: session.questionId },
      select: { correctOption: true },
    });

    if (!question) {
      activeSessions.delete(sessionId);
      return NextResponse.json({ success: false, message: 'Question not found.' }, { status: 404 });
    }

    const isCorrect = question.correctOption.toUpperCase() === selectedOption.toUpperCase();
    const scoreResult = calculateScore(isCorrect, responseTimeMs);

    // Privacy Mandate: Store ONLY User Name, Quiz Date, Correct or Wrong, Score, Bonus Points, Total Points, Response Time, Timestamp.
    // DO NOT store question ID or selected option.
    const attemptRecord = await db.userAttempt.create({
      data: {
        userName: session.userName,
        quizDate: session.quizDate,
        isCorrect: scoreResult.isCorrect,
        score: scoreResult.score,
        bonusPoints: scoreResult.bonusPoints,
        totalPoints: scoreResult.totalPoints,
        responseTimeMs: scoreResult.responseTimeMs,
      },
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
