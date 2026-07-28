// In-memory active session store for question verification & anti-cheat timing
// Key: sessionId -> { questionId, startTime, userName, quizDate, expectedOptionKey }
export const activeSessions = new Map<
  string,
  { 
    questionId: number; 
    startTime: number; 
    userName: string; 
    quizDate: string;
    expectedOptionKey?: string;
  }
>();
