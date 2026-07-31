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

  // Target timezone: Strictly Indian Standard Time (Asia/Kolkata)
  const timeZone = 'Asia/Kolkata';

  // Extract year, month, day, hour, minute, and weekday in target local timezone
  let partsMap: Record<string, string> = {};
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: 'numeric',
      minute: '2-digit',
      hour12: false,
      weekday: 'short',
    });

    formatter.formatToParts(now).forEach(({ type, value }) => {
      partsMap[type] = value;
    });
  } catch (err) {
    // Fallback to UTC if invalid timezone passed
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: 'numeric',
      minute: '2-digit',
      hour12: false,
      weekday: 'short',
    });

    formatter.formatToParts(now).forEach(({ type, value }) => {
      partsMap[type] = value;
    });
  }

  const year = partsMap.year;
  const month = partsMap.month;
  const day = partsMap.day;
  const quizDate = `${year}-${month}-${day}`;

  let currentHour = parseInt(partsMap.hour, 10);
  if (currentHour === 24) currentHour = 0;
  const currentMinute = parseInt(partsMap.minute, 10);
  const currentTotalMinutes = currentHour * 60 + currentMinute;

  const weekdayStr = partsMap.weekday; // 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'
  const isWeekend = weekdayStr === 'Sat' || weekdayStr === 'Sun';

  let currentTimeString = '';
  try {
    const displayTimeFormatter = new Intl.DateTimeFormat('en-US', {
      timeZone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
    currentTimeString = displayTimeFormatter.format(now);
  } catch (e) {
    currentTimeString = `${currentHour}:${String(currentMinute).padStart(2, '0')}`;
  }

  // 1. Weekend check
  if (isWeekend) {
    return {
      isOpen: false,
      state: 'WEEKEND',
      message: 'Quiz is not conducted on weekends.',
      quizDate,
      currentTimeString,
    };
  }

  // 2. Timing Window: 11:00 AM (660 mins) to 2:00 PM (840 mins) ONLY IST
  const OPEN_MINUTES = 11 * 60;  // 11:00 AM
  const CLOSE_MINUTES = 14 * 60; // 2:00 PM

  if (currentTotalMinutes < OPEN_MINUTES) {
    return {
      isOpen: false,
      state: 'BEFORE_WINDOW',
      message: "Today's quiz will be available from 11:00 AM IST.",
      quizDate,
      currentTimeString,
    };
  }

  if (currentTotalMinutes >= CLOSE_MINUTES) {
    return {
      isOpen: false,
      state: 'AFTER_WINDOW',
      message: "Today's quiz has ended.",
      quizDate,
      currentTimeString,
    };
  }

  // 3. Open Window (Strictly 11:00 AM to 2:00 PM, Mon-Fri)
  return {
    isOpen: true,
    state: 'OPEN',
    message: "Today's quiz is now LIVE! Good luck!",
    quizDate,
    currentTimeString,
  };
}
