import { NextRequest, NextResponse } from 'next/server';
import { dataService } from '@/lib/dataService';
import { getQuizGuardStatus } from '@/lib/quizGuard';
import { checkRateLimit, rateLimitResponse } from '@/lib/rateLimit';
import { activeSessions } from '@/lib/sessionStore';
import { shuffleOptions } from '@/lib/antiCheat';

export async function GET(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
  const rl = checkRateLimit(ip, 20);
  if (!rl.isAllowed) return rateLimitResponse();

  const { searchParams } = new URL(req.url);
  const userName = searchParams.get('userName');
  const clientTimeZone = searchParams.get('timeZone') || req.headers.get('x-timezone') || undefined;

  if (!userName || userName.trim().length < 2) {
    return NextResponse.json(
      { success: false, message: 'Valid first name or nickname is required.' },
      { status: 400 }
    );
  }

  const guard = getQuizGuardStatus(undefined, clientTimeZone);

  if (!guard.isOpen) {
    return NextResponse.json(
      { success: false, state: guard.state, message: guard.message },
      { status: 403 }
    );
  }

  // Double-check if user already attempted today
  const existingAttempt = await dataService.getUserAttemptToday(userName.trim(), guard.quizDate);

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
    const targetQuestion = await dataService.getRandomActiveQuestion();

    if (!targetQuestion) {
      return NextResponse.json(
        { success: false, message: 'No active questions available in the question bank.' },
        { status: 404 }
      );
    }

    // Randomize option order (Anti-Cheat option shuffling)
    const rawOptions = {
      A: targetQuestion.optionA,
      B: targetQuestion.optionB,
      C: targetQuestion.optionC,
      D: targetQuestion.optionD,
    };

    const { shuffledOptions, newCorrectOptionKey } = shuffleOptions(
      rawOptions,
      targetQuestion.correctOption
    );

    // Create session token & store server-side start timestamp
    const sessionId = `qs_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const startTime = Date.now();

    activeSessions.set(sessionId, {
      questionId: targetQuestion.id,
      startTime,
      userName: userName.trim(),
      quizDate: guard.quizDate,
      expectedOptionKey: newCorrectOptionKey,
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
        options: shuffledOptions,
        category: targetQuestion.category,
        difficulty: targetQuestion.difficulty,
      },
      startTime: new Date(startTime).toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
