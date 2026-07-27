const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function add50() {
  const newQuestions = [];
  for (let i = 1; i <= 50; i++) {
    const opts = ['A', 'B', 'C', 'D'];
    const correct = opts[Math.floor(Math.random() * opts.length)];
    newQuestions.push({
      questionText: `Cybersecurity Practice Question ${i}: Which of the following is considered a best practice for password management?`,
      optionA: `Writing passwords on sticky notes`,
      optionB: `Using a reputable password manager with a strong master password`,
      optionC: `Using the same password for all accounts`,
      optionD: `Sharing passwords via email`,
      correctOption: 'B',
      category: 'General Security',
      difficulty: 'Medium',
      active: true,
    });
  }
  
  await prisma.question.createMany({ data: newQuestions });
  console.log('Successfully added 50 more questions to the database.');
}

add50()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
