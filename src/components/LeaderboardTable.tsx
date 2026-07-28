'use client';

import React, { useState, useEffect } from 'react';
import { Trophy, Award, RefreshCw, Search, Clock, CheckCircle2 } from 'lucide-react';
import { LeaderboardEntry } from '@/types/quiz';
import toast from 'react-hot-toast';

export default function LeaderboardTable() {
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly' | 'all-time'>('daily');
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const fetchLeaderboard = async (selectedPeriod: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/leaderboard?period=${selectedPeriod}`);
      const data = await res.json();

      if (res.status === 429) {
        toast.error(data.message || 'Too many requests sent! Please wait a moment before trying again.');
        setIsLoading(false);
        return;
      }

      if (data.success) {
        setEntries(data.leaderboard || []);
      } else {
        toast.error(data.message || 'Failed to load leaderboard');
      }
    } catch (err: any) {
      toast.error('Network error loading leaderboard.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard(period);
  }, [period]);

  const filteredEntries = entries.filter((entry) => 
    entry.userName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-4xl mx-auto my-6 glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-6 shadow-2xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 p-0.5 shadow-md flex items-center justify-center">
            <Trophy className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-white">Global Leaderboard</h1>
            <p className="text-xs text-slate-400">Sorted by Points → Correct Answers → Fastest Avg Time</p>
          </div>
        </div>

        {/* Period Selector Tabs (Daily, Weekly, Monthly, All-Time) */}
        <div className="flex flex-wrap items-center bg-cyber-900 p-1 rounded-xl border border-slate-800">
          {(['daily', 'weekly', 'monthly', 'all-time'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${
                period === p
                  ? 'bg-white text-black shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {p === 'all-time' ? 'All-Time' : p}
            </button>
          ))}
          <button
            onClick={() => fetchLeaderboard(period)}
            className="p-1.5 ml-1 text-slate-400 hover:text-white transition-colors"
            title="Refresh Leaderboard"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-slate-500" />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by username..."
          className="w-full pl-10 pr-4 py-2.5 bg-cyber-900 border border-slate-800 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:border-white transition-colors"
        />
      </div>

      {/* Leaderboard Data Table */}
      {isLoading ? (
        <div className="py-16 text-center text-slate-400 space-y-3">
          <RefreshCw className="w-8 h-8 mx-auto animate-spin text-white" />
          <p className="text-sm font-medium">Loading rankings...</p>
        </div>
      ) : entries.length === 0 ? (
        <div className="py-16 text-center text-slate-400 space-y-2">
          <Award className="w-12 h-12 mx-auto text-slate-600" />
          <p className="text-base font-semibold text-slate-300">No attempts recorded for this period yet.</p>
          <p className="text-xs text-slate-500">Be the first to complete the quiz and claim #1 rank!</p>
        </div>
      ) : filteredEntries.length === 0 ? (
        <div className="py-16 text-center text-slate-400 space-y-2">
          <Search className="w-12 h-12 mx-auto text-slate-600" />
          <p className="text-base font-semibold text-slate-300">No matching users found.</p>
        </div>
      ) : (
        <div className="overflow-x-auto overflow-y-auto max-h-[60vh]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-[11px] uppercase font-bold text-slate-400 tracking-wider sticky top-0 z-10 bg-cyber-950">
                <th className="py-3.5 px-4">Rank</th>
                <th className="py-3.5 px-4">User Name</th>
                <th className="py-3.5 px-4 text-center">Attempts</th>
                <th className="py-3.5 px-4 text-center">Correct Answers</th>
                <th className="py-3.5 px-4 text-center">Total Points</th>
                <th className="py-3.5 px-4 text-right">Avg Response</th>
                <th className="py-3.5 px-4 text-right">Last Attempt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-sm">
              {filteredEntries.map((entry) => {
                const isTop1 = entry.rank === 1;
                const isTop2 = entry.rank === 2;
                const isTop3 = entry.rank === 3;

                return (
                  <tr
                    key={entry.userName}
                    className={`hover:bg-slate-800/40 transition-colors ${
                      isTop1 ? 'bg-white/[0.04]' : isTop2 ? 'bg-slate-400/[0.03]' : isTop3 ? 'bg-slate-500/[0.02]' : ''
                    }`}
                  >
                    {/* Rank Badge */}
                    <td className="py-4 px-4 font-bold">
                      {isTop1 && (
                        <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full bg-amber-400 text-black font-extrabold text-xs shadow-md">
                          🥇 #1
                        </span>
                      )}
                      {isTop2 && (
                        <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full bg-slate-200 text-black font-extrabold text-xs shadow-md">
                          🥈 #2
                        </span>
                      )}
                      {isTop3 && (
                        <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full bg-amber-700 text-white font-extrabold text-xs shadow-md">
                          🥉 #3
                        </span>
                      )}
                      {!isTop1 && !isTop2 && !isTop3 && (
                        <span className="text-slate-400 pl-2">#{entry.rank}</span>
                      )}
                    </td>

                    {/* User Name */}
                    <td className="py-4 px-4 font-bold text-white">
                      {entry.userName}
                    </td>

                    {/* Attempts */}
                    <td className="py-4 px-4 text-center font-medium text-slate-300">
                      {entry.attempts}
                    </td>

                    {/* Correct */}
                    <td className="py-4 px-4 text-center font-bold text-slate-200">
                      {entry.correctAnswers}
                    </td>

                    {/* Points */}
                    <td className="py-4 px-4 text-center font-extrabold text-white">
                      {entry.totalPoints.toFixed(2)} pts
                    </td>

                    {/* Avg Response Time */}
                    <td className="py-4 px-4 text-right font-mono text-xs text-slate-400">
                      {(entry.avgResponseTimeMs / 1000).toFixed(2)}s
                    </td>

                    {/* Last Attempt */}
                    <td className="py-4 px-4 text-right text-xs text-slate-500 whitespace-nowrap">
                      {new Date(entry.lastAttemptDate).toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                        hour12: true,
                      })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
