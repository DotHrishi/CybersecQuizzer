import React from 'react';

export default function BackgroundGradients() {
  return (
    <div className="fixed inset-0 z-[-1] pointer-events-none overflow-hidden">
      {/* Top Left Gradient */}
      <div 
        className="absolute -top-40 -left-40 w-96 h-96 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-3xl opacity-50 dark:opacity-20 bg-emerald-400 dark:bg-cyber-accent animate-blob" 
      />
      
      {/* Bottom Right Gradient */}
      <div 
        className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-3xl opacity-50 dark:opacity-20 bg-indigo-400 dark:bg-indigo-600 animate-blob animation-delay-2000" 
      />
      
      {/* Center Left Gradient */}
      <div 
        className="absolute top-1/3 -left-20 w-72 h-72 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-3xl opacity-40 dark:opacity-10 bg-cyan-400 dark:bg-cyan-600 animate-blob animation-delay-4000" 
      />

      {/* Center Right Gradient */}
      <div 
        className="absolute top-1/2 -right-20 w-80 h-80 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-3xl opacity-40 dark:opacity-10 bg-purple-400 dark:bg-purple-600 animate-blob animation-delay-3000" 
      />
    </div>
  );
}
