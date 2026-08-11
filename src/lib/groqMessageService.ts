import { QuizStatusState } from '@/types/quiz';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = 'llama-3.3-70b-versatile';

const FALLBACK_MESSAGES: Record<string, string[]> = {
  BEFORE_WINDOW: [
    "Today's security clearance begins at 11:00 AM IST. Sharpen your cyber defense skills!",
    "Firewalls are initializing! Today's cybersecurity quiz opens strictly at 11:00 AM IST.",
    "System diagnostics in progress. Get ready to test your security instincts at 11:00 AM IST!",
    "Early bird! The daily threat intelligence challenge unlocks at 11:00 AM IST.",
    "Warm up your threat-hunting radar — today's quiz window starts at 11:00 AM IST!"
  ],
  AFTER_WINDOW: [
    "Today's quiz window has concluded. Inspect your logs and return tomorrow at 11:00 AM IST!",
    "Mission complete for today! Today's security challenge closed at 9:00 PM IST.",
    "The daily threat window is closed. Recharge your defenses and join us tomorrow at 11:00 AM IST!",
    "All security tokens for today have been claimed. Next quiz window opens tomorrow at 11:00 AM IST.",
    "Shift ended! Rest up and return tomorrow at 11:00 AM IST for the next cybersecurity briefing."
  ],
  WEEKEND: [
    "Systems are on weekend maintenance! Cyber quizzes resume Monday morning.",
    "Weekend blackout active! Keep your personal devices safe and enjoy the break.",
    "No active breaches today! Quizzes are offline on weekends — check out the leaderboard in the meantime.",
    "Cyber defenders deserve rest too! Enjoy your weekend and gear up for Monday's challenge.",
    "Threat monitoring is on passive mode. Live quizzes return Monday at 11:00 AM IST!"
  ]
};

const FALLBACK_RESULT_MESSAGES = {
  CORRECT: [
    "Success is not final, failure is not fatal: it is the courage to continue that counts. — Winston Churchill",
    "The only way to do great work is to love what you do. — Steve Jobs",
    "Security is not a product, but a process. — Bruce Schneier",
    "Simplicity is prerequisite for reliability. — Edsger W. Dijkstra",
    "Victory belongs to the most persevering. — Napoleon Bonaparte",
    "Excellence is not an act, but a habit. — Aristotle",
    "Talk is cheap. Show me the code. — Linus Torvalds",
    "Technology is best when it brings people together. — Matt Mullenweg",
    "Knowledge is power. — Francis Bacon",
    "Victory is not a function of the code, but a bug in the status quo that we've learned to exploit. — Quantum Sysadmin"
  ],
  WRONG: [
    "Failure is simply the opportunity to begin again, this time more intelligently. — Henry Ford",
    "It's fine to celebrate success, but it is more important to heed the lessons of failure. — Bill Gates",
    "I have not failed. I've just found 10,000 ways that won't work. — Thomas Edison",
    "Success consists of going from failure to failure without loss of enthusiasm. — Winston Churchill",
    "Mistakes are the portals of discovery. — James Joyce",
    "Only those who dare to fail greatly can ever achieve greatly. — Robert F. Kennedy",
    "There are no secrets to success. It is the result of preparation, hard work, and learning from failure. — Colin Powell",
    "Experience is simply the name we give our mistakes. — Oscar Wilde",
    "Each mistake is a respawn, not a game over. — Gamer Proverb",
    "To err is human, but to really foul things up requires a computer. — Paul R. Ehrlich"
  ]
};

const QUOTE_THEMES = [
  'stoic wisdom',
  'hacker humor',
  'computing pioneers & coding legends',
  'military strategy & Sun Tzu',
  'sci-fi AI & futuristic tech',
  'scientific breakthroughs & physics legends',
  'humorous tech proverbs',
  'resilience and philosophy'
];

function getRandomFallback(state: QuizStatusState): string {
  const list = FALLBACK_MESSAGES[state] || [
    "The quiz is currently unavailable. Please check back during operational hours (11 AM - 9 PM IST, Mon-Fri)."
  ];
  return list[Math.floor(Math.random() * list.length)];
}

function getRandomResultFallback(isCorrect: boolean): string {
  const list = isCorrect ? FALLBACK_RESULT_MESSAGES.CORRECT : FALLBACK_RESULT_MESSAGES.WRONG;
  return list[Math.floor(Math.random() * list.length)];
}

export async function generateDynamicGuardMessage(
  state: QuizStatusState,
  userName?: string
): Promise<string> {
  if (state === 'OPEN' || state === 'ALREADY_ATTEMPTED') {
    if (state === 'ALREADY_ATTEMPTED') {
      return "You have already attempted today's quiz. Come back tomorrow!";
    }
    return "Today's quiz is now LIVE! Good luck!";
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return getRandomFallback(state);
  }

  const nameTag = userName && userName.trim() ? userName.trim() : 'Defender';

  let promptContext = '';
  if (state === 'BEFORE_WINDOW') {
    promptContext = `Today's daily cybersecurity quiz opens at 11:00 AM IST (Indian Standard Time). Generate a short (1 sentence), creative, witty pre-quiz hype/security message for user "${nameTag}". Remind them to return at 11:00 AM IST.`;
  } else if (state === 'AFTER_WINDOW') {
    promptContext = `Today's daily cybersecurity quiz window (11:00 AM to 9:00 PM IST) has closed. Generate a short (1 sentence), engaging cybersecurity-themed sign-off message for user "${nameTag}". Encourage them to return tomorrow at 11:00 AM IST.`;
  } else if (state === 'WEEKEND') {
    promptContext = `It is the weekend, so the daily cybersecurity quiz is offline until Monday. Generate a short (1 sentence), fun, security-themed weekend greeting message for user "${nameTag}". Encourage them to stay secure and return on Monday.`;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: MODEL,
        temperature: 0.95,
        max_tokens: 80,
        messages: [
          {
            role: 'system',
            content: 'You are an AI Cybersecurity Quiz Guard. Return ONLY a single engaging 1-sentence message without surrounding quote marks or conversational chatter.'
          },
          {
            role: 'user',
            content: promptContext
          }
        ]
      })
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return getRandomFallback(state);
    }

    const data = await response.json();
    const message = data.choices?.[0]?.message?.content?.trim();

    if (message && message.length > 5) {
      return message.replace(/^["'\s]+|["'\s]+$/g, '');
    }

    return getRandomFallback(state);
  } catch (error) {
    return getRandomFallback(state);
  }
}

export async function generateResultQuote(
  isCorrect: boolean
): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return getRandomResultFallback(isCorrect);
  }

  // Randomly pick a category to guarantee non-repetitive quotes on every single request
  const randomTheme = QUOTE_THEMES[Math.floor(Math.random() * QUOTE_THEMES.length)];
  const randomSeed = Math.floor(Math.random() * 10000);

  let promptContext = '';
  if (isCorrect) {
    promptContext = `Generate 1 unique, highly memorable, unexpected quote about VICTORY, SUCCESS, EXCELLENCE, or MASTERY inspired by "${randomTheme}" (seed ${randomSeed}). You can use a real famous historical quote OR a witty/humorous tech quote. MUST include author attribution (e.g. — Steve Jobs, — Grace Hopper, — Sun Tzu, — Byte Bandit, etc.). Do NOT include any user or participant names. Do NOT use clichés like Henry Ford or Churchill's failure quotes.`;
  } else {
    promptContext = `Generate 1 unique, highly memorable, unexpected quote about LEARNING FROM FAILURE, RESILIENCE, PERSEVERANCE, or GROWTH inspired by "${randomTheme}" (seed ${randomSeed}). You can use a real famous quote OR a witty/humorous tech/programming quote. MUST include author attribution (e.g. — Thomas Edison, — Bill Gates, — Quantum Sysadmin, — Gamer Proverb, etc.). Do NOT include any user or participant names. Do NOT use standard repetitive clichés.`;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: MODEL,
        temperature: 1.05,
        max_tokens: 95,
        messages: [
          {
            role: 'system',
            content: 'You generate unique, highly varied, funny or inspirational quotes with author attribution. NEVER mention user or participant names. Return ONLY the single quote text with author attribution (e.g. "Quote text." — Author Name).'
          },
          {
            role: 'user',
            content: promptContext
          }
        ]
      })
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return getRandomResultFallback(isCorrect);
    }

    const data = await response.json();
    const quote = data.choices?.[0]?.message?.content?.trim();

    if (quote && quote.length > 5) {
      return quote.replace(/^["'\s]+|["'\s]+$/g, '');
    }

    return getRandomResultFallback(isCorrect);
  } catch (error) {
    return getRandomResultFallback(isCorrect);
  }
}
