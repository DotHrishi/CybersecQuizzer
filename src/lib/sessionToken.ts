import { createHmac, timingSafeEqual } from 'crypto';

const SESSION_SECRET = process.env.SESSION_SECRET || 'fallback-dev-secret-do-not-use-in-prod';

export interface SessionPayload {
  sessionId: string;
  questionId: number;
  userName: string;
  quizDate: string;
  expectedOptionKey: string;
  startTime: number; // Unix ms
  exp: number;       // Expiry Unix ms
}

/** Sign a session payload → opaque token string */
export function signSessionToken(payload: SessionPayload): string {
  const data = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = createHmac('sha256', SESSION_SECRET).update(data).digest('base64url');
  return `${data}.${sig}`;
}

/** Verify + decode a session token. Returns null if invalid/expired/tampered. */
export function verifySessionToken(token: string): SessionPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 2) return null;

    const [data, sig] = parts;
    const expectedSig = createHmac('sha256', SESSION_SECRET).update(data).digest('base64url');

    // Constant-time comparison to prevent timing attacks
    const sigBuf = Buffer.from(sig);
    const expectedBuf = Buffer.from(expectedSig);
    if (sigBuf.length !== expectedBuf.length) return null;
    if (!timingSafeEqual(sigBuf, expectedBuf)) return null;

    const payload: SessionPayload = JSON.parse(Buffer.from(data, 'base64url').toString('utf8'));

    // Check expiry
    if (Date.now() > payload.exp) return null;

    return payload;
  } catch {
    return null;
  }
}
