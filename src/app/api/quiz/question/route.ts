import { NextRequest, NextResponse } from 'next/server';
import { dataService } from '@/lib/dataService';
import { getQuizGuardStatus } from '@/lib/quizGuard';
import { generateDynamicGuardMessage } from '@/lib/groqMessageService';
import { checkRateLimit, rateLimitResponse } from '@/lib/rateLimit';
import { activeSessions } from '@/lib/sessionStore';
import { shuffleOptions } from '@/lib/antiCheat';
import { signSessionToken } from '@/lib/sessionToken';

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
    const message = await generateDynamicGuardMessage(guard.state, userName.trim());
    return NextResponse.json(
      { success: false, state: guard.state, message },
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

    // Randomize option order per user (anti-cheat)
    const rawOptions = {
      A: targetQuestion.optionA,
      B: targetQuestion.optionB,
      C: targetQuestion.optionC,
      D: targetQuestion.optionD,
    };
    const { shuffledOptions } = shuffleOptions(rawOptions, targetQuestion.correctOption);
    const correctOptionKey = String(targetQuestion.correctOption).trim().toUpperCase();

    // Create session & store server-side start timestamp
    const sessionId = `qs_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const startTime = Date.now();
    const exp = startTime + 10 * 60 * 1000; // 10-minute expiry

    // Best-effort in-memory cache (works on single instance / local dev)
    activeSessions.set(sessionId, {
      questionId: targetQuestion.id,
      startTime,
      userName: userName.trim(),
      quizDate: guard.quizDate,
      expectedOptionKey: correctOptionKey,
    });

    // Auto cleanup expired sessions after 10 minutes
    setTimeout(() => {
      activeSessions.delete(sessionId);
    }, 10 * 60 * 1000);

    // Signed stateless token — survives serverless instance hops
    const sessionToken = signSessionToken({
      sessionId,
      questionId: targetQuestion.id,
      userName: userName.trim(),
      quizDate: guard.quizDate,
      expectedOptionKey: correctOptionKey,
      startTime,
      exp,
    });

    return NextResponse.json({
      success: true,
      sessionId,
      sessionToken,
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
