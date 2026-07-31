export type OptionKey = 'A' | 'B' | 'C' | 'D';

export interface QuestionClientDTO {
  sessionId: string;
  sessionToken?: string; // Signed stateless token for serverless fallback
  questionText: string;
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  category: string;
  difficulty: string;
  startTime: string;
}

export interface QuizResultDTO {
  success: boolean;
  isCorrect: boolean;
  score: number;
  bonusPoints: number;
  totalPoints: number;
  responseTimeMs: number;
  quizDate: string;
  message: string;
}

export type QuizStatusState = 'OPEN' | 'BEFORE_WINDOW' | 'AFTER_WINDOW' | 'WEEKEND' | 'ALREADY_ATTEMPTED';

export interface QuizStatusResponse {
  state: QuizStatusState;
  isOpen: boolean;
  message: string;
  userName?: string;
  currentLocalTime?: string;
  quizDate?: string;
  attempt?: {
    isCorrect: boolean;
    score: number;
    bonusPoints: number;
    totalPoints: number;
    responseTimeMs: number;
  };
}

export interface LeaderboardEntry {
  rank: number;
  userName: string;
  attempts: number;
  correctAnswers: number;
  totalPoints: number;
  avgResponseTimeMs: number;
  lastAttemptDate: string;
}

export interface UserReportStats {
  userName: string;
  totalAttempts: number;
  correctAnswers: number;
  wrongAnswers: number;
  accuracyPercentage: number;
  avgResponseTimeMs: number;
  totalPoints: number;
  bestRank: number | string;
  history: {
    quizDate: string;
    isCorrect: boolean;
    score: number;
    bonusPoints: number;
    totalPoints: number;
    responseTimeMs: number;
    createdAt: string;
  }[];
}
