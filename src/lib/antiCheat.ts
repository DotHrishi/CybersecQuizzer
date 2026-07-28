export interface AntiCheatCheckResult {
  isValid: boolean;
  suspiciousReason?: string;
  verifiedResponseTimeMs: number;
}

export function verifySubmissionAntiCheat(
  serverStartTime: number,
  clientStartTime?: number,
  clientLoadedTime?: number
): AntiCheatCheckResult {
  const serverEndTime = Date.now();
  const serverElapsedTime = Math.max(serverEndTime - serverStartTime, 100);

  // 1. Check for impossibly fast responses (< 400ms) - likely bot/automated script
  if (serverElapsedTime < 400) {
    return {
      isValid: false,
      suspiciousReason: 'BOT_DETECTED_IMPOSSIBLE_SPEED',
      verifiedResponseTimeMs: serverElapsedTime,
    };
  }

  // 2. Cross-verify client load time if provided
  let verifiedResponseTimeMs = serverElapsedTime;
  if (clientLoadedTime && clientLoadedTime > 0 && clientLoadedTime <= serverEndTime) {
    const clientMeasuredDuration = serverEndTime - clientLoadedTime;
    // Allow slight network latency variance (+/- 1500ms)
    if (Math.abs(clientMeasuredDuration - serverElapsedTime) > 3000) {
      console.warn(`[AntiCheat Warning] Client/Server time drift detected. Server: ${serverElapsedTime}ms, Client: ${clientMeasuredDuration}ms`);
    }
    // Take the larger of server/client time to avoid cheat manipulation
    verifiedResponseTimeMs = Math.max(serverElapsedTime, clientMeasuredDuration);
  }

  return {
    isValid: true,
    verifiedResponseTimeMs,
  };
}

/**
 * Randomize option order (A, B, C, D) while maintaining a mapping to original correct option safely.
 */
export function shuffleOptions(options: { A: string; B: string; C: string; D: string }, correctOptionKey?: string) {
  const safeCorrectKey = String(correctOptionKey || 'A').trim().toUpperCase();
  const entries: [string, string][] = Object.entries(options || {});

  // Fisher-Yates shuffle
  for (let i = entries.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [entries[i], entries[j]] = [entries[j], entries[i]];
  }

  const shuffledKeys = ['A', 'B', 'C', 'D'];
  const shuffledOptions: Record<string, string> = {};
  let newCorrectOptionKey = 'A';

  entries.forEach(([origKey, text], index) => {
    const newKey = shuffledKeys[index] || 'A';
    shuffledOptions[newKey] = text || '';
    if (String(origKey || '').trim().toUpperCase() === safeCorrectKey) {
      newCorrectOptionKey = newKey;
    }
  });

  return {
    shuffledOptions,
    newCorrectOptionKey,
  };
}
