import React from 'react';

export default function BackgroundGradients() {
  return (
    <div className="fixed inset-0 z-[-1] pointer-events-none overflow-hidden">
      {/* 1. Top Left Ambient Gradient Circle */}
      <div 
        className="absolute -top-32 -left-32 w-96 h-96 rounded-full filter blur-3xl opacity-30 dark:opacity-15 bg-white/20 dark:bg-white/10 animate-pulse-glow" 
      />
      
      {/* 2. Bottom Right Ambient Gradient Circle */}
      <div 
        className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full filter blur-3xl opacity-30 dark:opacity-15 bg-slate-400/20 dark:bg-slate-300/10 animate-pulse-glow" 
      />
    </div>
  );
}
