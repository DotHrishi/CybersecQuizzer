const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

// Fake leaderboard users with varied performance
const fakeAttempts = [
  { userName: 'CyberHawk', isCorrect: true,  responseTimeMs: 3200,  score: 1, bonusPoints: 10, totalPoints: 11, quizDate: today },
  { userName: 'NightOwl',  isCorrect: true,  responseTimeMs: 4800,  score: 1, bonusPoints: 10, totalPoints: 11, quizDate: today },
  { userName: 'AlphaGhost',isCorrect: true,  responseTimeMs: 7500,  score: 1, bonusPoints: 8,  totalPoints: 9,  quizDate: today },
  { userName: 'QuantumX',  isCorrect: true,  responseTimeMs: 9100,  score: 1, bonusPoints: 8,  totalPoints: 9,  quizDate: today },
  { userName: 'ShadowByte',isCorrect: true,  responseTimeMs: 14200, score: 1, bonusPoints: 6,  totalPoints: 7,  quizDate: today },
  { userName: 'IronShield',isCorrect: true,  responseTimeMs: 18500, score: 1, bonusPoints: 6,  totalPoints: 7,  quizDate: today },
  { userName: 'NetRaider',  isCorrect: true,  responseTimeMs: 22000, score: 1, bonusPoints: 4,  totalPoints: 5,  quizDate: today },
  { userName: 'PixelVault', isCorrect: true,  responseTimeMs: 28900, score: 1, bonusPoints: 4,  totalPoints: 5,  quizDate: today },
  { userName: 'ZeroTrace',  isCorrect: true,  responseTimeMs: 45000, score: 1, bonusPoints: 2,  totalPoints: 3,  quizDate: today },
  { userName: 'CodeBreaker',isCorrect: true,  responseTimeMs: 58000, score: 1, bonusPoints: 2,  totalPoints: 3,  quizDate: today },
  { userName: 'StealthNode',isCorrect: true,  responseTimeMs: 72000, score: 1, bonusPoints: 1,  totalPoints: 2,  quizDate: today },
  { userName: 'PatchMaster',isCorrect: false, responseTimeMs: 12000, score: 0, bonusPoints: 0,  totalPoints: 0,  quizDate: today },
  { userName: 'FuzzTester', isCorrect: false, responseTimeMs: 31000, score: 0, bonusPoints: 0,  totalPoints: 0,  quizDate: today },
  { userName: 'VulnHunter', isCorrect: false, responseTimeMs: 8200,  score: 0, bonusPoints: 0,  totalPoints: 0,  quizDate: today },
  { userName: 'DarkProtocol',isCorrect: true, responseTimeMs: 4200,  score: 1, bonusPoints: 10, totalPoints: 11, quizDate: today },
];

async function main() {
  console.log('🗑️  Clearing existing leaderboard data...');
  await prisma.userAttempt.deleteMany({});
  console.log('✅ Cleared.');

  console.log(`\n📥 Inserting ${fakeAttempts.length} fake leaderboard entries for ${today}...`);
  for (const attempt of fakeAttempts) {
    await prisma.userAttempt.create({ data: attempt });
    console.log(`  ✔ ${attempt.userName} — ${attempt.totalPoints} pts (${(attempt.responseTimeMs/1000).toFixed(1)}s) — ${attempt.isCorrect ? '✅ Correct' : '❌ Wrong'}`);
  }

  // Deactivate ~20 random questions
  console.log('\n🔒 Deactivating 20 random questions...');
  const allQuestions = await prisma.question.findMany({ select: { id: true }, where: { active: true } });
  // Shuffle and take 20
  const shuffled = allQuestions.sort(() => Math.random() - 0.5).slice(0, 20);
  const ids = shuffled.map(q => q.id);

  await prisma.question.updateMany({
    where: { id: { in: ids } },
    data: { active: false },
  });
  console.log(`  ✔ Deactivated question IDs: ${ids.join(', ')}`);

  const active = await prisma.question.count({ where: { active: true } });
  const inactive = await prisma.question.count({ where: { active: false } });
  console.log(`\n📊 Questions — Active: ${active}, Disabled: ${inactive}`);

  // Print final leaderboard
  const lb = await prisma.$queryRaw`
    SELECT userName, SUM(totalPoints) as pts, ROUND(AVG(responseTimeMs),0) as avgMs
    FROM user_attempts
    GROUP BY userName
    ORDER BY pts DESC, avgMs ASC
    LIMIT 20
  `;
  console.log('\n🏆 Final Leaderboard:');
  lb.forEach((r, i) => {
    console.log(`  ${i + 1}. ${r.userName.padEnd(15)} | ${r.pts} pts | ${(r.avgMs / 1000).toFixed(2)}s avg`);
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
