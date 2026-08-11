'use client';

import React from 'react';
import Link from 'next/link';
import { Clock, Calendar, CheckCircle2, Trophy, BarChart2, ShieldAlert } from 'lucide-react';
import { QuizStatusState } from '@/types/quiz';

interface TimingGuardCardProps {
  state: QuizStatusState;
  message: string;
  userName?: string;
  attempt?: {
    isCorrect: boolean;
    score: number;
    bonusPoints: number;
    totalPoints: number;
    responseTimeMs: number;
  };
}

export default function TimingGuardCard({ state, message, userName, attempt }: TimingGuardCardProps) {
  return (
    <div className="max-w-xl mx-auto my-8 glass-panel p-8 rounded-2xl border border-slate-800 text-center shadow-2xl relative overflow-hidden">
      {/* Background Accent Glow */}
      <div className="absolute -top-24 -left-24 w-48 h-48 bg-cyber-accent/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      {state === 'BEFORE_WINDOW' && (
        <div className="space-y-4 relative z-10">
          <div className="w-16 h-16 mx-auto rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Clock className="w-8 h-8 animate-pulse" />
          </div>
          <h2 className="text-2xl font-bold text-white">Quiz Window Closed</h2>
          <p className="text-lg sm:text-xl font-semibold text-amber-400 leading-relaxed px-2">
            &quot;{message}&quot;
          </p>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            The Cybersecurity Quiz is live Monday to Friday strictly between <strong>11:00 AM</strong> and <strong>9:00 PM IST</strong> (Indian Standard Time).
          </p>
        </div>
      )}

      {state === 'AFTER_WINDOW' && (
        <div className="space-y-4 relative z-10">
          <div className="w-16 h-16 mx-auto rounded-full bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-white">Daily Quiz Concluded</h2>
          <p className="text-lg sm:text-xl font-semibold text-indigo-300 leading-relaxed px-2">
            &quot;{message}&quot;
          </p>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Today&apos;s quiz window (11:00 AM – 9:00 PM IST) has ended. Return tomorrow at 11:00 AM IST for the next challenge!
          </p>
        </div>
      )}

      {state === 'WEEKEND' && (
        <div className="space-y-4 relative z-10">
          <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Calendar className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-white">Weekend Blackout</h2>
          <p className="text-lg sm:text-xl font-semibold text-emerald-300 leading-relaxed px-2">
            &quot;{message}&quot;
          </p>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Quiz sessions run Monday through Friday. Leaderboards and personal progress reports remain accessible 24/7!
          </p>
        </div>
      )}

      {state === 'ALREADY_ATTEMPTED' && (
        <div className="space-y-5 relative z-10">
          <div className="w-16 h-16 mx-auto rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-white">Attempt Recorded!</h2>
          <p className="text-base text-slate-300 font-medium">{message}</p>

          {attempt && (
            <div className="p-4 rounded-xl bg-cyber-900/80 border border-slate-700 text-left space-y-2">
              <div className="flex justify-between items-center text-sm border-b border-slate-800 pb-2">
                <span className="text-slate-400">Participant:</span>
                <span className="font-bold text-white">{userName}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-400">Outcome:</span>
                <span className={`font-bold ${attempt.isCorrect ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {attempt.isCorrect ? 'Correct ✓' : 'Incorrect'}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-400">Bonus Points:</span>
                <span className="font-bold text-white">+{attempt.bonusPoints.toFixed(2)} pts</span>
              </div>
              <div className="flex justify-between items-center text-sm border-t border-slate-800 pt-2">
                <span className="text-slate-300 font-semibold">Total Points Earned:</span>
                <span className="text-lg font-extrabold text-white">{attempt.totalPoints.toFixed(2)} pts</span>
              </div>
              <div className="flex justify-between items-center text-xs text-slate-500 pt-1">
                <span>Response Time:</span>
                <span>{(attempt.responseTimeMs / 1000).toFixed(2)} seconds</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Navigation Quick Links */}
      <div className="pt-6 border-t border-slate-800/80 mt-6 flex flex-wrap gap-3 justify-center relative z-10">
        <Link
          href="/leaderboard"
          className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-white text-black hover:bg-slate-200 text-sm font-semibold transition-all shadow-md"
        >
          <Trophy className="w-4 h-4 text-black" />
          <span>View Leaderboard</span>
        </Link>
        <Link
          href="/report"
          className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-cyber-800 hover:bg-cyber-700 text-white text-sm font-semibold transition-all border border-slate-700"
        >
          <BarChart2 className="w-4 h-4 text-slate-300" />
          <span>View My Report</span>
        </Link>
      </div>
    </div>
  );
}
