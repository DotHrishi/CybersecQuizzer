'use client';

import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, Sparkles, Frown, ArrowRight, Award, Zap } from 'lucide-react';
import Link from 'next/link';

interface ResultCelebrationProps {
  isCorrect: boolean;
  score: number;
  bonusPoints: number;
  totalPoints: number;
  responseTimeMs: number;
  message: string;
  userName: string;
}

export default function ResultCelebration({
  isCorrect,
  score,
  bonusPoints,
  totalPoints,
  responseTimeMs,
  message,
  userName,
}: ResultCelebrationProps) {
  useEffect(() => {
    if (isCorrect) {
      // Trigger canvas confetti cannon burst
      const count = 200;
      const defaults = {
        origin: { y: 0.6 },
        zIndex: 999,
      };

      function fire(particleRatio: number, opts: confetti.Options) {
        confetti({
          ...defaults,
          ...opts,
          particleCount: Math.floor(count * particleRatio),
        });
      }

      fire(0.25, { spread: 26, startVelocity: 55 });
      fire(0.2, { spread: 60 });
      fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
      fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
      fire(0.1, { spread: 120, startVelocity: 45 });
    }
  }, [isCorrect]);

  return (
    <div className="max-w-xl mx-auto my-8 glass-panel-glow p-8 rounded-3xl border border-white/20 text-center shadow-white-glow animate-float">
      {isCorrect ? (
        <div className="space-y-6">
          {/* Trophy & Celebration Visual */}
          <div className="relative inline-block">
            <div className="w-24 h-24 mx-auto rounded-3xl bg-gradient-to-tr from-amber-400 via-yellow-500 to-amber-600 p-1 shadow-lg animate-bounce">
              <div className="w-full h-full bg-cyber-950 rounded-[22px] flex items-center justify-center">
                <Trophy className="w-12 h-12 text-amber-400" />
              </div>
            </div>
            <Sparkles className="w-8 h-8 text-white absolute -top-2 -right-2 animate-spin" />
            <Sparkles className="w-6 h-6 text-slate-300 absolute -bottom-1 -left-2 animate-pulse" />
          </div>

          <div>
            <span className="inline-block px-3 py-1 rounded-full bg-white/10 text-white border border-white/20 text-xs font-bold uppercase tracking-widest mb-2">
              Success Verified
            </span>
            <h2 className="text-3xl font-extrabold text-white">{message}</h2>
            <p className="text-sm text-slate-300 mt-1">Outstanding cyber situational awareness, {userName}!</p>
          </div>

          {/* Breakdown Card */}
          <div className="grid grid-cols-3 gap-3 p-4 rounded-2xl bg-cyber-900/90 border border-slate-800">
            <div className="p-3 rounded-xl bg-cyber-950/60 border border-slate-800">
              <span className="block text-[10px] text-slate-400 uppercase font-semibold">Base Score</span>
              <span className="text-xl font-extrabold text-white">+{score.toFixed(2)}</span>
            </div>
            <div className="p-3 rounded-xl bg-cyber-950/60 border border-slate-800">
              <span className="block text-[10px] text-slate-400 uppercase font-semibold">Bonus Points</span>
              <span className="text-xl font-extrabold text-slate-200">+{bonusPoints.toFixed(2)}</span>
            </div>
            <div className="p-3 rounded-xl bg-cyber-950/60 border border-slate-800">
              <span className="block text-[10px] text-slate-400 uppercase font-semibold">Total Score</span>
              <span className="text-xl font-extrabold text-white">{totalPoints.toFixed(2)}</span>
            </div>
          </div>

          <p className="text-xs text-slate-400 flex items-center justify-center space-x-1">
            <Zap className="w-3.5 h-3.5 text-white" />
            <span>Response Time: <strong>{(responseTimeMs / 1000).toFixed(2)} seconds</strong></span>
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Wrong Answer Visual */}
          <div className="w-20 h-20 mx-auto rounded-3xl bg-slate-800/80 border border-slate-700 p-1 flex items-center justify-center">
            <Frown className="w-10 h-10 text-amber-400" />
          </div>

          <div>
            <span className="inline-block px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-bold uppercase tracking-widest mb-2">
              Attempt Completed
            </span>
            <h2 className="text-2xl font-bold text-white">{message}</h2>
            <p className="text-xs text-slate-400 mt-2 max-w-sm mx-auto">
              Your response was recorded. Keep building your security skills and try again tomorrow!
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-cyber-900/80 border border-slate-800 text-sm">
            <div className="flex justify-between items-center text-slate-300">
              <span>Points Earned Today:</span>
              <span className="font-bold text-slate-400">0.00 pts</span>
            </div>
            <div className="flex justify-between items-center text-slate-400 text-xs mt-1">
              <span>Time Elapsed:</span>
              <span>{(responseTimeMs / 1000).toFixed(2)} seconds</span>
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="pt-6 border-t border-slate-800 mt-6 flex flex-wrap gap-3 justify-center">
        <Link
          href="/leaderboard"
          className="flex items-center space-x-2 px-6 py-3 rounded-xl bg-white text-black hover:bg-slate-200 text-sm font-bold shadow-lg transition-all"
        >
          <Award className="w-4 h-4" />
          <span>Check Leaderboard</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
        <Link
          href="/report"
          className="flex items-center space-x-2 px-6 py-3 rounded-xl bg-cyber-800 hover:bg-cyber-700 text-white text-sm font-semibold transition-all border border-slate-700"
        >
          <span>View My Stats</span>
        </Link>
      </div>
    </div>
  );
}
