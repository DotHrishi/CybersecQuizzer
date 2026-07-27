import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getQuizGuardStatus } from '@/lib/quizGuard';
import { checkRateLimit, rateLimitResponse } from '@/lib/rateLimit';
import { activeSessions } from '@/lib/sessionStore';

export async function GET(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
  const rl = checkRateLimit(ip, 20);
  if (!rl.isAllowed) return rateLimitResponse();

  const { searchParams } = new URL(req.url);
  const userName = searchParams.get('userName');

  if (!userName || userName.trim().length < 2) {
    return NextResponse.json(
      { success: false, message: 'Valid first name or nickname is required.' },
      { status: 400 }
    );
  }

  const guard = getQuizGuardStatus();

  if (!guard.isOpen) {
    return NextResponse.json(
      { success: false, state: guard.state, message: guard.message },
      { status: 403 }
    );
  }

  // Double-check if user already attempted today
  const existingAttempt = await db.userAttempt.findFirst({
    where: {
      userName: userName.trim(),
      quizDate: guard.quizDate,
    },
  });

  if (existingAttempt) {
    return NextResponse.json(
      {
        success: false,
        state: 'ALREADY_ATTEMPTED',
        message: "You have already attempted today's quiz. Come back tomorrow!",
      },
      { status: 403 }
    );
  }

  try {
    // Verbatim SQL Query requirement:
    // SELECT * FROM questions WHERE active=1 ORDER BY RANDOM() LIMIT 1;
    const questions: any[] = await db.$queryRaw`
      SELECT id, questionText, optionA, optionB, optionC, optionD, category, difficulty
      FROM questions
      WHERE active = 1
      ORDER BY RANDOM()
      LIMIT 1;
    `;

    if (!questions || questions.length === 0) {
      return NextResponse.json(
        { success: false, message: 'No active questions available in the question bank.' },
        { status: 404 }
      );
    }

    const targetQuestion = questions[0];

    // Create session token
    const sessionId = `qs_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const startTime = Date.now();

    activeSessions.set(sessionId, {
      questionId: targetQuestion.id,
      startTime,
      userName: userName.trim(),
      quizDate: guard.quizDate,
    });

    // Auto cleanup expired sessions after 10 minutes
    setTimeout(() => {
      activeSessions.delete(sessionId);
    }, 10 * 60 * 1000);

    return NextResponse.json({
      success: true,
      sessionId,
      question: {
        questionText: targetQuestion.questionText,
        options: {
          A: targetQuestion.optionA,
          B: targetQuestion.optionB,
          C: targetQuestion.optionC,
          D: targetQuestion.optionD,
        },
        category: targetQuestion.category,
        difficulty: targetQuestion.difficulty,
      },
      startTime: new Date(startTime).toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
