const { PrismaClient } = require('@prisma/client');
const { createClient } = require('@supabase/supabase-js');

const prisma = new PrismaClient();
const supabaseUrl = 'https://fzyozyaajamaesxycjzm.supabase.co';
const supabaseKey = 'sb_publishable_J1q-4f8yXMOyCXQZjCToow_18U-qV2J';

const supabase = createClient(supabaseUrl, supabaseKey);

async function pushToSupabase() {
  console.log('Pushing all SQLite data directly to Supabase...');

  // 1. Fetch questions from SQLite
  const questions = await prisma.question.findMany();
  console.log(`Found ${questions.length} questions in SQLite.`);

  if (questions.length > 0) {
    const formattedQuestions = questions.map((q) => ({
      questionText: q.questionText,
      optionA: q.optionA,
      optionB: q.optionB,
      optionC: q.optionC,
      optionD: q.optionD,
      correctOption: q.correctOption,
      category: q.category,
      difficulty: q.difficulty,
      active: q.active,
    }));

    // Clear existing questions to prevent duplicates
    await supabase.from('questions').delete().neq('id', 0);

    const { data: insertedQuestions, error: qErr } = await supabase
      .from('questions')
      .insert(formattedQuestions)
      .select();

    if (qErr) {
      console.error('Error inserting questions to Supabase:', qErr);
    } else {
      console.log(`✅ Successfully inserted ${insertedQuestions.length} questions into Supabase!`);
    }
  }

  // 2. Fetch user attempts from SQLite
  const attempts = await prisma.userAttempt.findMany();
  console.log(`Found ${attempts.length} user attempts in SQLite.`);

  if (attempts.length > 0) {
    const formattedAttempts = attempts.map((a) => ({
      userName: a.userName,
      quizDate: a.quizDate,
      isCorrect: a.isCorrect,
      score: a.score,
      bonusPoints: a.bonusPoints,
      totalPoints: a.totalPoints,
      responseTimeMs: a.responseTimeMs,
      createdAt: a.createdAt.toISOString(),
    }));

    // Clear existing attempts
    await supabase.from('user_attempts').delete().neq('id', 0);

    const { data: insertedAttempts, error: aErr } = await supabase
      .from('user_attempts')
      .insert(formattedAttempts)
      .select();

    if (aErr) {
      console.error('Error inserting user attempts to Supabase:', aErr);
    } else {
      console.log(`✅ Successfully inserted ${insertedAttempts.length} user attempts into Supabase!`);
    }
  }

  console.log('🎉 Direct sync to Supabase completed successfully!');
}

pushToSupabase()
  .catch((err) => console.error('Push error:', err))
  .finally(() => prisma.$disconnect());
