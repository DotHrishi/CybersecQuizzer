const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

function escapeSql(str) {
  if (str === null || str === undefined) return 'NULL';
  return `'${String(str).replace(/'/g, "''")}'`;
}

async function main() {
  console.log('Extracting all SQLite data...');
  const questions = await prisma.question.findMany({ orderBy: { id: 'asc' } });
  const attempts = await prisma.userAttempt.findMany({ orderBy: { id: 'asc' } });

  console.log(`Found ${questions.length} questions and ${attempts.length} user attempts in SQLite.`);

  let sqlContent = `-- ==============================================================================\n`;
  sqlContent += `-- COMPLETE SQLITE TO SUPABASE DATA EXPORT SCRIPT\n`;
  sqlContent += `-- Generated: ${new Date().toISOString()}\n`;
  sqlContent += `-- ==============================================================================\n\n`;

  // 1. QUESTIONS INSERT STATEMENTS
  sqlContent += `-- 1. INSERT ALL ${questions.length} QUESTIONS INTO SUPABASE\n`;
  if (questions.length > 0) {
    sqlContent += `INSERT INTO public.questions ("questionText", "optionA", "optionB", "optionC", "optionD", "correctOption", category, difficulty, active)\nVALUES\n`;

    const questionValues = questions.map((q) => {
      const qText = escapeSql(q.questionText);
      const optA = escapeSql(q.optionA);
      const optB = escapeSql(q.optionB);
      const optC = escapeSql(q.optionC);
      const optD = escapeSql(q.optionD);
      const correct = escapeSql(q.correctOption);
      const cat = escapeSql(q.category);
      const diff = escapeSql(q.difficulty);
      const act = q.active ? 'true' : 'false';

      return `(${qText}, ${optA}, ${optB}, ${optC}, ${optD}, ${correct}, ${cat}, ${diff}, ${act})`;
    });

    sqlContent += questionValues.join(',\n') + ';\n\n';
  }

  // 2. USER ATTEMPTS INSERT STATEMENTS
  if (attempts.length > 0) {
    sqlContent += `-- 2. INSERT ALL ${attempts.length} USER ATTEMPTS INTO SUPABASE\n`;
    sqlContent += `INSERT INTO public.user_attempts ("userName", "quizDate", "isCorrect", score, "bonusPoints", "totalPoints", "responseTimeMs", "createdAt")\nVALUES\n`;

    const attemptValues = attempts.map((a) => {
      const uName = escapeSql(a.userName);
      const qDate = escapeSql(a.quizDate);
      const isCorr = a.isCorrect ? 'true' : 'false';
      const sc = Number(a.score || 0);
      const bPts = Number(a.bonusPoints || 0);
      const tPts = Number(a.totalPoints || 0);
      const rTime = Number(a.responseTimeMs || 0);
      const cAt = escapeSql(new Date(a.createdAt).toISOString());

      return `(${uName}, ${qDate}, ${isCorr}, ${sc}, ${bPts}, ${tPts}, ${rTime}, ${cAt})`;
    });

    sqlContent += attemptValues.join(',\n') + ';\n\n';
  }

  const outputPath = path.join(__dirname, '..', 'seed_all_sqlite_data_to_supabase.sql');
  fs.writeFileSync(outputPath, sqlContent, 'utf8');

  console.log(`✅ Export complete! Generated file: ${outputPath}`);
}

main()
  .catch((err) => console.error('Export error:', err))
  .finally(() => prisma.$disconnect());
