'use client';

import React, { useState, useEffect } from 'react';
import NameEntryModal from '@/components/NameEntryModal';
import TimingGuardCard from '@/components/TimingGuardCard';
import QuizCard from '@/components/QuizCard';
import ResultCelebration from '@/components/ResultCelebration';
import { QuizStatusState, QuestionClientDTO } from '@/types/quiz';
import { ShieldCheck, RefreshCw, UserCheck } from 'lucide-react';
import toast from 'react-hot-toast';

export default function HomePage() {
  const [userName, setUserName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [guardState, setGuardState] = useState<QuizStatusState | null>(null);
  const [guardMessage, setGuardMessage] = useState<string>('');
  const [previousAttempt, setPreviousAttempt] = useState<any>(null);
  const [questionData, setQuestionData] = useState<QuestionClientDTO | null>(null);
  const [submissionResult, setSubmissionResult] = useState<any>(null);

  useEffect(() => {
    const savedName = localStorage.getItem('cyber_quiz_username');
    if (savedName) {
      setUserName(savedName);
      checkUserSession(savedName);
    } else {
      setIsLoading(false);
    }
  }, []);

  const checkUserSession = async (name: string) => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/user/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userName: name }),
      });

      const data = await res.json();

      if (res.status === 429) {
        toast.error(data.message || 'Too many requests sent! Please wait a moment before trying again.');
        setIsLoading(false);
        return;
      }

      if (data.success) {
        setGuardState(data.guardState);
        setGuardMessage(data.message);
        if (data.attempt) {
          setPreviousAttempt(data.attempt);
        }

        if (data.isOpen) {
          fetchRandomQuestion(name);
        } else {
          setIsLoading(false);
        }
      } else {
        toast.error(data.message || 'Session verification failed.');
        setIsLoading(false);
      }
    } catch (err) {
      toast.error('Network error during session check.');
      setIsLoading(false);
    }
  };

  const fetchRandomQuestion = async (name: string) => {
    try {
      const res = await fetch(`/api/quiz/question?userName=${encodeURIComponent(name)}`);
      const data = await res.json();

      if (res.status === 429) {
        toast.error(data.message || 'Too many requests sent! Please wait a moment before trying again.');
        setIsLoading(false);
        return;
      }

      if (data.success) {
        setQuestionData({
          sessionId: data.sessionId,
          sessionToken: data.sessionToken,
          questionText: data.question.questionText,
          options: data.question.options,
          category: data.question.category,
          difficulty: data.question.difficulty,
          startTime: data.startTime,
        });
      } else {
        if (data.state) {
          setGuardState(data.state);
          setGuardMessage(data.message);
        } else {
          toast.error(data.message || 'Failed to fetch question.');
        }
      }
    } catch (err) {
      toast.error('Network error fetching quiz question.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveIdentity = (name: string) => {
    setUserName(name);
    checkUserSession(name);
  };

  const handleChangeName = () => {
    setUserName(null);
    setGuardState(null);
    setQuestionData(null);
    setSubmissionResult(null);
  };

  // 1. No active session username set
  if (!userName) {
    const lastSavedName = typeof window !== 'undefined' ? (localStorage.getItem('cyber_quiz_username') || '') : '';
    return <NameEntryModal initialName={lastSavedName} onSave={handleSaveIdentity} />;
  }

  // 2. Loading state
  if (isLoading) {
    return (
      <div className="py-24 text-center text-slate-400 space-y-4">
        <RefreshCw className="w-10 h-10 mx-auto animate-spin text-cyber-accent" />
        <p className="text-base font-semibold">Verifying quiz session & time window...</p>
      </div>
    );
  }

  // 3. Quiz Result Displayed
  if (submissionResult) {
    return (
      <ResultCelebration
        isCorrect={submissionResult.isCorrect}
        score={submissionResult.score}
        bonusPoints={submissionResult.bonusPoints}
        totalPoints={submissionResult.totalPoints}
        responseTimeMs={submissionResult.responseTimeMs}
        message={submissionResult.message}
        userName={userName}
      />
    );
  }

  // 4. Non-open timing guard (Before 11 AM, After 2 PM, Weekend, or Already Attempted)
  if (guardState && guardState !== 'OPEN') {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between max-w-xl mx-auto px-2 text-xs text-slate-400">
          <span className="flex items-center space-x-1.5">
            <UserCheck className="w-4 h-4 text-cyber-accent" />
            <span>Identity: <strong className="text-white">{userName}</strong></span>
          </span>
          <button
            onClick={handleChangeName}
            className="text-cyber-accent hover:underline text-[11px] font-semibold"
          >
            Change Nickname
          </button>
        </div>
        <TimingGuardCard
          state={guardState}
          message={guardMessage}
          userName={userName}
          attempt={previousAttempt}
        />
      </div>
    );
  }

  // 5. Live Quiz Screen
  if (questionData) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between max-w-2xl mx-auto px-2 text-xs text-slate-400">
          <span className="flex items-center space-x-1.5">
            <ShieldCheck className="w-4 h-4 text-cyber-accent" />
            <span>Logged in as: <strong className="text-white">{userName}</strong></span>
          </span>
          <button
            onClick={handleChangeName}
            className="text-slate-400 hover:text-white text-[11px]"
          >
            Switch identity
          </button>
        </div>
        <QuizCard
          questionData={questionData}
          userName={userName}
          onSubmitted={(result) => setSubmissionResult(result)}
        />
      </div>
    );
  }

  return null;
}
