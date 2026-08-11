import { NextRequest, NextResponse } from 'next/server';
import { generateDynamicGuardMessage, generateResultQuote } from '@/lib/groqMessageService';
import { QuizStatusState } from '@/types/quiz';
import { checkRateLimit, rateLimitResponse } from '@/lib/rateLimit';

export async function GET(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
  const rl = checkRateLimit(ip, 30);
  if (!rl.isAllowed) return rateLimitResponse();

  const { searchParams } = new URL(req.url);
  const state = searchParams.get('state') as QuizStatusState | null;
  const isCorrectParam = searchParams.get('isCorrect');
  const userName = searchParams.get('userName') || undefined;

  try {
    if (isCorrectParam !== null && isCorrectParam !== undefined) {
      const isCorrect = isCorrectParam === 'true';
      const quote = await generateResultQuote(isCorrect);
      return NextResponse.json({ success: true, message: quote });
    }

    if (state && (state === 'BEFORE_WINDOW' || state === 'AFTER_WINDOW' || state === 'WEEKEND')) {
      const message = await generateDynamicGuardMessage(state, userName);
      return NextResponse.json({ success: true, message });
    }

    return NextResponse.json(
      { success: false, message: 'Invalid request parameters.' },
      { status: 400 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message || 'Failed to generate AI message.' },
      { status: 500 }
    );
  }
}
