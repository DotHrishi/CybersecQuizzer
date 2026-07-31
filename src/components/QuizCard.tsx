'use client';

import React, { useState, useEffect } from 'react';
import { Clock, CheckCircle, ArrowRight, Loader2 } from 'lucide-react';
import { QuestionClientDTO, OptionKey } from '@/types/quiz';
import { QuizSubmissionSchema } from '@/lib/validation';
import toast from 'react-hot-toast';

interface QuizCardProps {
  questionData: QuestionClientDTO;
  userName: string;
  onSubmitted: (result: any) => void;
}

export default function QuizCard({ questionData, userName, onSubmitted }: QuizCardProps) {
  const [selectedOption, setSelectedOption] = useState<OptionKey | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);

  // Anti-Cheat: Start client timer once component mounts (question rendered)
  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      setElapsedMs(Date.now() - startTime);
    }, 50);

    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async () => {
    if (!selectedOption || isSubmitting) return;

    // Validate schema
    const validation = QuizSubmissionSchema.safeParse({
      sessionId: questionData.sessionId,
      userName,
      selectedOption,
      selectedOptionText: questionData.options[selectedOption],
    });

    if (!validation.success) {
      toast.error(validation.error.errors[0].message);
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/quiz/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: questionData.sessionId,
          userName,
          selectedOption,
          selectedOptionText: questionData.options[selectedOption], // actual text of chosen answer
          sessionToken: questionData.sessionToken,
        }),
      });

      const data = await response.json();

      if (response.status === 429) {
        toast.error(data.message || 'Too many requests sent! Please wait a moment before trying again.');
        setIsSubmitting(false);
        return;
      }

      if (!data.success) {
        toast.error(data.message || 'Failed to submit answer.');
        setIsSubmitting(false);
        return;
      }

      onSubmitted(data);
    } catch (error: any) {
      toast.error(error.message || 'An error occurred during submission.');
      setIsSubmitting(false);
    }
  };

  const seconds = (elapsedMs / 1000).toFixed(1);

  return (
    <div className="max-w-2xl mx-auto my-6 glass-panel-glow p-6 sm:p-8 rounded-3xl border border-white/20 shadow-2xl space-y-6">
      {/* Header Info */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center space-x-2">
          <span className="px-3 py-1 rounded-full bg-white/10 border border-white/20 text-white text-xs font-bold uppercase tracking-wider">
            {questionData.category}
          </span>
          <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 text-[11px] font-semibold">
            {questionData.difficulty}
          </span>
        </div>

        {/* Precision Response Timer */}
        <div className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-cyber-900 border border-slate-700 text-slate-200 text-xs font-mono font-bold shadow-inner">
          <Clock className="w-3.5 h-3.5 text-white animate-pulse" />
          <span>{seconds}s</span>
        </div>
      </div>

      {/* Question Text */}
      <div className="space-y-2">
        <h2 className="text-xl sm:text-2xl font-bold text-white leading-relaxed">
          {questionData.questionText}
        </h2>
      </div>

      {/* MCQ Options Grid */}
      <div className="space-y-3 pt-2">
        {(Object.keys(questionData?.options || {}) as OptionKey[]).map((key) => {
          const isSelected = selectedOption === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setSelectedOption(key)}
              className={`w-full text-left p-4 rounded-2xl border transition-all duration-200 flex items-center justify-between group ${
                isSelected
                  ? 'bg-white/15 border-white text-white shadow-white-glow scale-[1.01]'
                  : 'bg-cyber-900/60 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-cyber-900'
              }`}
            >
              <div className="flex items-center space-x-3.5">
                <span
                  className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm transition-colors ${
                    isSelected
                      ? 'bg-white text-black shadow-md'
                      : 'bg-cyber-800 text-slate-400 group-hover:text-white'
                  }`}
                >
                  {key}
                </span>
                <span className="font-medium text-sm sm:text-base leading-snug">
                  {questionData?.options?.[key]}
                </span>
              </div>
              {isSelected && <CheckCircle className="w-5 h-5 text-white flex-shrink-0 ml-2" />}
            </button>
          );
        })}
      </div>

      {/* Submit Button */}
      <div className="pt-4 border-t border-slate-800">
        <button
          type="button"
          disabled={!selectedOption || isSubmitting}
          onClick={handleSubmit}
          className="w-full py-4 px-6 rounded-2xl bg-white text-black hover:bg-slate-200 flex items-center justify-center space-x-2 text-base font-bold shadow-lg disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Verifying Submission...</span>
            </>
          ) : (
            <>
              <span>Confirm & Submit Answer</span>
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
