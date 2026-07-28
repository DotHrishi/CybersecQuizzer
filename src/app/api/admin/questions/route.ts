import { NextRequest, NextResponse } from 'next/server';
import { dataService } from '@/lib/dataService';
import { QuestionSchema } from '@/lib/validation';
import { checkRateLimit, rateLimitResponse } from '@/lib/rateLimit';

function verifyAdminAuth(req: NextRequest): boolean {
  const adminHeader = req.headers.get('x-admin-password')?.trim();
  const expectedPassword = (process.env.ADMIN_PASSWORD || 'cyberadmin123').trim();
  return Boolean(adminHeader && adminHeader === expectedPassword);
}

// GET: Fetch questions
export async function GET(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
  const rl = checkRateLimit(ip, 30);
  if (!rl.isAllowed) return rateLimitResponse();

  if (!verifyAdminAuth(req)) {
    return NextResponse.json({ success: false, message: 'Unauthorized admin request.' }, { status: 401 });
  }

  try {
    const questions = await dataService.getAllQuestions();
    return NextResponse.json({ success: true, questions });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

// POST: Add single question or bulk import
export async function POST(req: NextRequest) {
  if (!verifyAdminAuth(req)) {
    return NextResponse.json({ success: false, message: 'Unauthorized admin request.' }, { status: 401 });
  }

  try {
    const body = await req.json();

    // Check if bulk import array
    if (Array.isArray(body)) {
      const created = [];
      for (const item of body) {
        const validation = QuestionSchema.safeParse(item);
        if (validation.success) {
          const q = await dataService.createQuestion(validation.data);
          created.push(q);
        }
      }
      return NextResponse.json({ success: true, count: created.length, message: `Imported ${created.length} questions.` });
    }

    // Single question add
    const validation = QuestionSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'VALIDATION_ERROR', message: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const question = await dataService.createQuestion(validation.data);
    return NextResponse.json({ success: true, question, message: 'Question added successfully.' });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

// PUT: Edit / Update question or toggle active status
export async function PUT(req: NextRequest) {
  if (!verifyAdminAuth(req)) {
    return NextResponse.json({ success: false, message: 'Unauthorized admin request.' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { id, ...data } = body;

    if (!id || typeof id !== 'number') {
      return NextResponse.json({ success: false, message: 'Valid question ID is required.' }, { status: 400 });
    }

    const updated = await dataService.updateQuestion(id, data);
    return NextResponse.json({ success: true, question: updated, message: 'Question updated successfully.' });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

// DELETE: Delete single question
export async function DELETE(req: NextRequest) {
  if (!verifyAdminAuth(req)) {
    return NextResponse.json({ success: false, message: 'Unauthorized admin request.' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = Number(searchParams.get('id'));

    if (!id || isNaN(id)) {
      return NextResponse.json({ success: false, message: 'Valid question ID is required.' }, { status: 400 });
    }

    await dataService.deleteQuestion(id);
    return NextResponse.json({ success: true, message: `Question #${id} deleted.` });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
