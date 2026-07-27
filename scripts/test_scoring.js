const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function runApiTests() {
  const baseUrl = 'http://localhost:3000/api';
  
  // Helper to run a single test flow
  async function testFlow(userName, delayMs, forceWrong = false) {
    console.log(`\n--- Running test for ${userName} (delay ${delayMs}ms) ---`);
    
    // 1. Init session
    const sessionRes = await fetch(`${baseUrl}/user/session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userName })
    });
    const sessionData = await sessionRes.json();
    if (!sessionData.success && sessionData.state === 'ALREADY_ATTEMPTED') {
      console.log(`${userName} already attempted. Delete from DB and retry if needed.`);
      return;
    }
    
    // 2. Fetch question
    const qRes = await fetch(`${baseUrl}/quiz/question?userName=${userName}`);
    const qData = await qRes.json();
    const sessionId = qData.sessionId;
    
    // Find correct answer in DB
    const sessionRecord = await prisma.userAttempt.findFirst({ where: { userName } }); // just to check db connection
    
    // We can't easily get the question ID from the response, but we can query the active session from memory? No.
    // Let's just guess. If we guess A, B, C, D one of them will be right.
    // Actually, to guarantee a correct answer, we can look at the latest question created in the DB? No, it's random.
    // Let's query the DB for the question text to find the correct option.
    const questionText = qData.question.questionText;
    const dbQuestion = await prisma.question.findFirst({ where: { questionText } });
    
    let selectedOption = dbQuestion.correctOption;
    if (forceWrong) {
      selectedOption = selectedOption === 'A' ? 'B' : 'A';
    }
    
    // Wait for delay
    if (delayMs > 0) {
      await new Promise(r => setTimeout(r, delayMs));
    }
    
    // 3. Submit answer
    const submitRes = await fetch(`${baseUrl}/quiz/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, userName, selectedOption })
    });
    const submitData = await submitRes.json();
    
    console.log(`Result for ${userName}: Correct? ${submitData.isCorrect}, Total Points: ${submitData.totalPoints}, Bonus: ${submitData.bonusPoints}, Msg: ${submitData.message}`);
    return submitData;
  }

  // Clear previous attempts
  await prisma.userAttempt.deleteMany();

  await testFlow('User_Wrong', 2000, true);
  await testFlow('User_3s', 3000, false);
  await testFlow('User_7s', 7000, false);
  await testFlow('User_15s', 15000, false);
  await testFlow('User_25s', 25000, false);
  
  // For longer delays, we can manipulate the DB after the fact, but let's just test one long one
  await testFlow('User_35s', 35000, false);

  console.log('\n--- Leaderboard ---');
  const lbRes = await fetch(`${baseUrl}/leaderboard?period=daily`);
  const lbData = await lbRes.json();
  lbData.leaderboard.forEach(l => {
    console.log(`Rank ${l.rank}: ${l.userName} | Pts: ${l.totalPoints} | Avg Time: ${l.avgResponseTimeMs}ms`);
  });
}

runApiTests()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
