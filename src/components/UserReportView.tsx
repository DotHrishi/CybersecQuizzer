'use client';

import React, { useState, useEffect } from 'react';
import { UserReportStats } from '@/types/quiz';
import { BarChart3, Target, Clock, Trophy, CheckCircle2, XCircle, User, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function UserReportView() {
  const [userName, setUserName] = useState<string>('');
  const [stats, setStats] = useState<UserReportStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const savedName = localStorage.getItem('cyber_quiz_username');
    if (savedName) {
      setUserName(savedName);
      fetchReport(savedName);
    }
  }, []);

  const fetchReport = async (nameToFetch: string) => {
    if (!nameToFetch.trim()) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/report?userName=${encodeURIComponent(nameToFetch.trim())}`);
      const data = await res.json();

      if (res.status === 429) {
        toast.error(data.message || 'Too many requests sent! Please wait a moment before trying again.');
        setIsLoading(false);
        return;
      }

      if (data.success) {
        setStats(data.stats);
      } else {
        toast.error(data.message || 'Failed to load report.');
      }
    } catch (err: any) {
      toast.error('Network error loading report.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (userName.trim()) {
      fetchReport(userName.trim());
    }
  };

  return (
    <div className="max-w-4xl mx-auto my-6 glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-6 shadow-2xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 p-0.5 shadow-md flex items-center justify-center">
            <BarChart3 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-white">Performance Report</h1>
            <p className="text-xs text-slate-400">24/7 personal quiz analytics & timeline history</p>
          </div>
        </div>

        {/* User Lookup Bar */}
        <form onSubmit={handleSearchSubmit} className="flex items-center space-x-2 w-full sm:w-auto">
          <div className="relative flex-grow">
            <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="Enter first name..."
              className="pl-9 pr-3 py-1.5 bg-cyber-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-white"
            />
          </div>
          <button
            type="submit"
            className="px-3.5 py-1.5 rounded-xl bg-white text-black text-xs font-bold shadow-md hover:bg-slate-200 transition-colors"
          >
            Fetch
          </button>
        </form>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="py-16 text-center text-slate-400">Loading performance report...</div>
      ) : !stats || stats.totalAttempts === 0 ? (
        <div className="py-12 text-center text-slate-400 space-y-3">
          <AlertCircle className="w-10 h-10 mx-auto text-slate-600" />
          <p className="text-base font-semibold text-slate-300">No attempts found for &quot;{userName || 'this user'}&quot;.</p>
          <p className="text-xs text-slate-500">Complete today&apos;s daily quiz to generate your first report!</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Stat Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-cyber-900/80 border border-slate-800 space-y-1">
              <div className="flex items-center space-x-1.5 text-xs text-slate-400">
                <Target className="w-3.5 h-3.5 text-white" />
                <span>Accuracy</span>
              </div>
              <p className="text-2xl font-extrabold text-white">{stats.accuracyPercentage}%</p>
              <p className="text-[10px] text-slate-500">{stats.correctAnswers} / {stats.totalAttempts} correct</p>
            </div>

            <div className="p-4 rounded-2xl bg-cyber-900/80 border border-slate-800 space-y-1">
              <div className="flex items-center space-x-1.5 text-xs text-slate-400">
                <Trophy className="w-3.5 h-3.5 text-amber-400" />
                <span>Total Points</span>
              </div>
              <p className="text-2xl font-extrabold text-white">{Number(stats.totalPoints).toFixed(2)}</p>
              <p className="text-[10px] text-slate-500">Rank #{stats.bestRank}</p>
            </div>

            <div className="p-4 rounded-2xl bg-cyber-900/80 border border-slate-800 space-y-1">
              <div className="flex items-center space-x-1.5 text-xs text-slate-400">
                <Clock className="w-3.5 h-3.5 text-slate-200" />
                <span>Avg Response</span>
              </div>
              <p className="text-2xl font-extrabold text-white">{(stats.avgResponseTimeMs / 1000).toFixed(2)}s</p>
              <p className="text-[10px] text-slate-500">Speed multiplier applied</p>
            </div>

            <div className="p-4 rounded-2xl bg-cyber-900/80 border border-slate-800 space-y-1">
              <div className="flex items-center space-x-1.5 text-xs text-slate-400">
                <CheckCircle2 className="w-3.5 h-3.5 text-slate-300" />
                <span>Attempts</span>
              </div>
              <p className="text-2xl font-extrabold text-white">{stats.totalAttempts}</p>
              <p className="text-[10px] text-slate-500">{stats.wrongAnswers} incorrect</p>
            </div>
          </div>

          {/* Attempt History Timeline */}
          <div className="space-y-3 pt-2">
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <span>Attempt History Timeline</span>
            </h3>
            <div className="space-y-2">
              {stats.history.map((h, i) => (
                <div
                  key={i}
                  className="p-3.5 rounded-xl bg-cyber-900/50 border border-slate-800 flex items-center justify-between text-sm"
                >
                  <div className="flex items-center space-x-3">
                    {h.isCorrect ? (
                      <CheckCircle2 className="w-5 h-5 text-slate-200 flex-shrink-0" />
                    ) : (
                      <XCircle className="w-5 h-5 text-rose-400 flex-shrink-0" />
                    )}
                    <div>
                      <p className="font-bold text-white">{h.quizDate}</p>
                      <p className="text-[11px] text-slate-400">
                        {h.isCorrect ? `Base 2.00 + ${Number(h.bonusPoints).toFixed(2)} Bonus` : 'Score: 0.00'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-extrabold text-white block">{Number(h.totalPoints).toFixed(2)} pts</span>
                    <span className="text-xs font-mono text-slate-500">{(h.responseTimeMs / 1000).toFixed(2)}s</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
