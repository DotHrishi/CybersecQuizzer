export interface ScoreCalculationResult {
  isCorrect: boolean;
  score: number;
  bonusPoints: number;
  earlyBirdBonus: number;
  totalPoints: number;
  responseTimeMs: number;
}

export function calculateScore(
  isCorrect: boolean,
  responseTimeMs: number,
  submissionTime?: Date,
  timeZone: string = 'Asia/Kolkata'
): ScoreCalculationResult {
  if (!isCorrect) {
    return {
      isCorrect: false,
      score: 0,
      bonusPoints: 0,
      earlyBirdBonus: 0,
      totalPoints: 0,
      responseTimeMs,
    };
  }

  const baseScore = 2.0;
  const seconds = responseTimeMs / 1000;
  let bonusPoints = 0;

  if (seconds <= 5) {
    bonusPoints = 2.0;
  } else if (seconds <= 10) {
    bonusPoints = 1.75;
  } else if (seconds <= 15) {
    bonusPoints = 1.5;
  } else if (seconds <= 20) {
    bonusPoints = 1.25;
  } else if (seconds <= 30) {
    bonusPoints = 1.0;
  } else if (seconds <= 45) {
    bonusPoints = 0.75;
  } else if (seconds <= 60) {
    bonusPoints = 0.5;
  } else {
    bonusPoints = 0.0;
  }

  // Early Bird Bonus (+1.00 pt if completed before 11:00 AM in target timezone)
  let earlyBirdBonus = 0;
  if (submissionTime) {
    try {
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone,
        hour: 'numeric',
        hour12: false,
      });
      const hour = parseInt(formatter.format(submissionTime), 10);
      if (hour < 11) {
        earlyBirdBonus = 1.0;
      }
    } catch (e) {
      // Default fallback check
      if (submissionTime.getHours() < 11) {
        earlyBirdBonus = 1.0;
      }
    }
  }

  const totalPoints = Number((baseScore + bonusPoints + earlyBirdBonus).toFixed(2));

  return {
    isCorrect: true,
    score: baseScore,
    bonusPoints: Number((bonusPoints + earlyBirdBonus).toFixed(2)),
    earlyBirdBonus,
    totalPoints,
    responseTimeMs,
  };
}
