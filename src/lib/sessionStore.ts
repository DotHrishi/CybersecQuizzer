// In-memory active session store for question verification
// Key: sessionId -> { questionId, startTime, userName, quizDate }
export const activeSessions = new Map<
  string,
  { questionId: number; startTime: number; userName: string; quizDate: string }
>();
