const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cleanQuestionTitles() {
  const questions = await prisma.question.findMany({ select: { id: true, questionText: true } });

  // Match any prefix like "Cybersecurity Practice Question 49:" or "Question 12:" etc.
  const prefixPattern = /^(cybersecurity\s+)?practice\s+question\s+\d+\s*:\s*/i;

  let updated = 0;
  for (const q of questions) {
    const cleaned = q.questionText.replace(prefixPattern, '').trim();
    if (cleaned !== q.questionText) {
      await prisma.question.update({ where: { id: q.id }, data: { questionText: cleaned } });
      console.log(`✔ #${q.id}: "${q.questionText.slice(0, 60)}" → "${cleaned.slice(0, 60)}"`);
      updated++;
    }
  }

  if (updated === 0) {
    console.log('✅ No questions had prefixes — all clean already.');
  } else {
    console.log(`\n✅ Cleaned ${updated} questions.`);
  }
}

cleanQuestionTitles()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
