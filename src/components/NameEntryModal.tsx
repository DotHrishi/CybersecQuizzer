'use client';

import React, { useState, useEffect } from 'react';
import { ShieldCheck, User, Info, ArrowRight } from 'lucide-react';
import { UserNameSchema } from '@/lib/validation';
import toast from 'react-hot-toast';

interface NameEntryModalProps {
  initialName?: string;
  onSave: (name: string) => void;
}

export default function NameEntryModal({ initialName = '', onSave }: NameEntryModalProps) {
  const [inputName, setInputName] = useState(initialName);
  const [errorMsg, setErrorMsg] = useState('');

  // Auto-fill last used nickname from Local Storage on mount
  useEffect(() => {
    if (!initialName) {
      const saved = localStorage.getItem('cyber_quiz_username');
      if (saved) {
        setInputName(saved);
      }
    }
  }, [initialName]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const validation = UserNameSchema.safeParse({ userName: inputName });
    if (!validation.success) {
      const err = validation.error.errors[0].message;
      setErrorMsg(err);
      toast.error(err);
      return;
    }

    const cleanName = validation.data.userName;
    localStorage.setItem('cyber_quiz_username', cleanName);
    toast.success(`Welcome back, ${cleanName}!`);
    onSave(cleanName);
  };

  return (
    <div className="max-w-md mx-auto my-12 glass-panel-glow p-8 rounded-2xl border border-white/20 shadow-white-glow animate-float">
      <div className="text-center mb-6">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-white/10 border border-white/20 p-0.5 flex items-center justify-center shadow-lg">
          <div className="w-full h-full bg-cyber-950 rounded-[14px] flex items-center justify-center">
            <ShieldCheck className="w-8 h-8 text-white" />
          </div>
        </div>
        <h2 className="text-2xl font-extrabold text-white tracking-tight">Identity Access</h2>
        <p className="text-sm text-slate-300 mt-1 font-medium">Enter only your first name or nickname.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-xs uppercase font-bold tracking-wider text-slate-300 mb-2">
            First Name / Nickname
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <User className="w-5 h-5 text-white" />
            </div>
            <input
              type="text"
              value={inputName}
              onChange={(e) => setInputName(e.target.value)}
              placeholder="e.g. Alex, CyberKing"
              className="w-full pl-11 pr-4 py-3 bg-cyber-900/90 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-white focus:ring-1 focus:ring-white transition-all text-base"
              maxLength={30}
              autoFocus
            />
          </div>
          {errorMsg && <p className="text-xs text-rose-400 mt-1.5 font-medium">{errorMsg}</p>}
        </div>

        {/* Informative Guidance Note */}
        <div className="flex items-start space-x-3 p-3.5 rounded-xl bg-cyber-900/60 border border-slate-800 text-xs text-slate-300">
          <Info className="w-4 h-4 text-slate-300 flex-shrink-0 mt-0.5" />
          <p>
            <strong className="text-white">Important Note:</strong> Use the same name every day. Changing your name will create a separate identity on the leaderboard.
          </p>
        </div>

        <button
          type="submit"
          className="w-full py-3.5 px-6 rounded-xl bg-white text-black hover:bg-slate-200 flex items-center justify-center space-x-2 text-base font-bold shadow-lg transition-all"
        >
          <span>Continue to Quiz</span>
          <ArrowRight className="w-5 h-5" />
        </button>
      </form>
    </div>
  );
}
