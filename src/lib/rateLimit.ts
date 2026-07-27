import { NextResponse } from 'next/server';

interface RateLimitTracker {
  count: number;
  resetTime: number;
}

const rateLimitMap = new Map<string, RateLimitTracker>();

/**
 * Basic in-memory sliding window rate limiter for API routes.
 * @param ip Identifier (IP or User Identifier)
 * @param limit Maximum allowed requests per window
 * @param windowMs Window duration in milliseconds (default: 1 minute)
 */
export function checkRateLimit(ip: string, limit: number = 20, windowMs: number = 60000): { isAllowed: boolean; remaining: number } {
  const now = Date.now();
  const tracker = rateLimitMap.get(ip) || { count: 0, resetTime: now + windowMs };

  if (now > tracker.resetTime) {
    tracker.count = 1;
    tracker.resetTime = now + windowMs;
  } else {
    tracker.count += 1;
  }

  rateLimitMap.set(ip, tracker);

  const isAllowed = tracker.count <= limit;
  const remaining = Math.max(0, limit - tracker.count);

  return { isAllowed, remaining };
}

export function rateLimitResponse() {
  return NextResponse.json(
    {
      success: false,
      error: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests sent! Please wait a moment before trying again.',
    },
    { status: 429 }
  );
}
