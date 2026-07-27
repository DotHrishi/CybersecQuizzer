'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { ShieldAlert, Trophy, BarChart3, Lock, User, Sun, Moon } from 'lucide-react';
import { useTheme } from '@/components/ThemeProvider';

export default function Navbar() {
  const pathname = usePathname();
  const [userName, setUserName] = useState<string | null>(null);
  const { theme, toggle } = useTheme();

  useEffect(() => {
    const savedName = localStorage.getItem('cyber_quiz_username');
    if (savedName) {
      setUserName(savedName);
    }
  }, []);

  const navLinks = [
    { href: '/', label: 'Daily Quiz', icon: ShieldAlert },
    { href: '/leaderboard', label: 'Leaderboard', icon: Trophy },
    { href: '/report', label: 'My Report', icon: BarChart3 },
    { href: '/admin', label: 'Admin', icon: Lock },
  ];

  return (
    <header className="sticky top-0 z-40 glass-panel border-b border-slate-800/80">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between max-w-6xl">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center space-x-3 group">
          <Image 
            src="/logo.png" 
            alt="CyberShield Logo" 
            width={40} 
            height={40} 
            className="rounded-xl shadow-cyber-glow group-hover:scale-105 transition-transform object-cover" 
          />
          <div>
            <span className="text-lg font-extrabold tracking-wide bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-cyber-accent brand-logo-text">
              CYBERSHIELD
            </span>
            <span className="block text-[10px] uppercase font-semibold text-cyber-accent tracking-widest -mt-1">
              Daily Quiz
            </span>
          </div>
        </Link>

        {/* Navigation Tabs */}
        <nav className="hidden md:flex items-center space-x-1 bg-cyber-900/90 p-1 rounded-xl border border-slate-800">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-cyber-accent/15 text-cyber-accent border border-cyber-accent/30 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Right Side: User + Theme Toggle */}
        <div className="flex items-center space-x-3">
          {userName && (
            <div className="flex items-center space-x-2 px-3 py-1 rounded-full bg-cyber-800/80 border border-cyber-accent/30 text-xs font-semibold text-cyber-accent shadow-sm">
              <User className="w-3.5 h-3.5" />
              <span className="max-w-[100px] truncate">{userName}</span>
            </div>
          )}

          {/* Theme Toggle Button */}
          <button
            onClick={toggle}
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            className="w-9 h-9 rounded-xl flex items-center justify-center border border-slate-700 bg-cyber-800/80 hover:bg-cyber-700 transition-all hover:border-cyber-accent/40"
          >
            {theme === 'dark'
              ? <Sun className="w-4 h-4 text-amber-400" />
              : <Moon className="w-4 h-4 text-indigo-400" />
            }
          </button>
        </div>
      </div>

      {/* Mobile Bar */}
      <div className="md:hidden flex items-center justify-around border-t border-slate-800/60 py-2 bg-cyber-900/90">
        {navLinks.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex flex-col items-center text-[10px] font-medium transition-all ${
                isActive ? 'text-cyber-accent font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className="w-4 h-4 mb-0.5" />
              <span>{link.label}</span>
            </Link>
          );
        })}
        {/* Mobile theme toggle */}
        <button onClick={toggle} className="flex flex-col items-center text-[10px] font-medium text-slate-400">
          {theme === 'dark'
            ? <Sun className="w-4 h-4 mb-0.5 text-amber-400" />
            : <Moon className="w-4 h-4 mb-0.5 text-indigo-400" />
          }
          <span>{theme === 'dark' ? 'Light' : 'Dark'}</span>
        </button>
      </div>
    </header>
  );
}
