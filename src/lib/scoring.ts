export interface ScoreCalculationResult {
  isCorrect: boolean;
  score: number;
  bonusPoints: number;
  totalPoints: number;
  responseTimeMs: number;
}

export function calculateScore(isCorrect: boolean, responseTimeMs: number): ScoreCalculationResult {
  if (!isCorrect) {
    return {
      isCorrect: false,
      score: 0,
      bonusPoints: 0,
      totalPoints: 0,
      responseTimeMs,
    };
  }

  const baseScore = 1;
  const seconds = responseTimeMs / 1000;
  let bonusPoints = 0;

  if (seconds <= 5) {
    bonusPoints = 10;
  } else if (seconds <= 10) {
    bonusPoints = 8;
  } else if (seconds <= 20) {
    bonusPoints = 6;
  } else if (seconds <= 30) {
    bonusPoints = 4;
  } else if (seconds <= 60) {
    bonusPoints = 2;
  } else {
    bonusPoints = 1;
  }

  return {
    isCorrect: true,
    score: baseScore,
    bonusPoints,
    totalPoints: baseScore + bonusPoints,
    responseTimeMs,
  };
}
