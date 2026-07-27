import { QuizStatusState } from '../types/quiz';

export interface QuizGuardResult {
  isOpen: boolean;
  state: QuizStatusState;
  message: string;
  quizDate: string;
  currentTimeString: string;
}

export function getQuizGuardStatus(overrideDate?: Date): QuizGuardResult {
  const now = overrideDate || new Date();

  // Format YYYY-MM-DD
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const quizDate = `${year}-${month}-${day}`;

  const currentTimeString = now.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  const dayOfWeek = now.getDay(); // 0 = Sunday, 6 = Saturday
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const currentTotalMinutes = currentHour * 60 + currentMinute;

  // 1. Weekend check
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    return {
      isOpen: false,
      state: 'WEEKEND',
      message: 'Quiz is not conducted on weekends.',
      quizDate,
      currentTimeString,
    };
  }

  // 2. Before 11:00 AM check (11:00 = 660 minutes)
  const OPEN_MINUTES  = 11 * 60;       // 11:00 AM
  const CLOSE_MINUTES = 14 * 60;       // 2:00 PM

  if (currentTotalMinutes < OPEN_MINUTES) {
    return {
      isOpen: false,
      state: 'BEFORE_WINDOW',
      message: "Today's quiz will be available from 11:00 AM.",
      quizDate,
      currentTimeString,
    };
  }

  // 3. After 7:12 PM check
  if (currentTotalMinutes >= CLOSE_MINUTES) {
    return {
      isOpen: false,
      state: 'AFTER_WINDOW',
      message: "Today's quiz has ended. Come back tomorrow at 11:00 AM!",
      quizDate,
      currentTimeString,
    };
  }

  // 4. Open Window (11:00 AM to 7:12 PM, Mon-Fri)
  return {
    isOpen: true,
    state: 'OPEN',
    message: "Today's quiz is now LIVE! Good luck!",
    quizDate,
    currentTimeString,
  };
}
