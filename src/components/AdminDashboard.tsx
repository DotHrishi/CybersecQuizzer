'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Lock, Plus, Edit2, Trash2, Download, Upload, AlertTriangle,
  X, Check, Eye, EyeOff, RefreshCw, ShieldCheck, BarChart2,
  Users, BookOpen, Activity, Save
} from 'lucide-react';
import toast from 'react-hot-toast';

interface Question {
  id: number;
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctOption: string;
  category: string;
  difficulty: string;
  active: boolean;
  createdAt: string;
  updatedAt?: string;
}

interface Stats {
  totalQuestions: number;
  activeQuestions: number;
  totalAttempts: number;
  totalUsers: number;
  todayAttempts: number;
}

const defaultForm = {
  questionText: '',
  optionA: '',
  optionB: '',
  optionC: '',
  optionD: '',
  correctOption: 'A' as 'A' | 'B' | 'C' | 'D',
  category: 'General Security',
  difficulty: 'Medium' as 'Easy' | 'Medium' | 'Hard',
  active: true,
};

export default function AdminDashboard() {
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({ ...defaultForm });
  const [formSaving, setFormSaving] = useState(false);
  const [deleteToConfirm, setDeleteToConfirm] = useState<{ id: number; questionText: string } | null>(null);

  const categories = ['All', ...Array.from(new Set(questions.map(q => q.category)))];

  const filteredQuestions = questions.filter(q => {
    const matchSearch = q.questionText.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCategory = filterCategory === 'All' || q.category === filterCategory;
    return matchSearch && matchCategory;
  });

  const fetchAdminData = useCallback(async (pwd: string) => {
    setIsLoading(true);
    try {
      const [qRes, sRes] = await Promise.all([
        fetch('/api/admin/questions', { headers: { 'x-admin-password': pwd } }),
        fetch('/api/admin/stats', { headers: { 'x-admin-password': pwd } }),
      ]);

      if (qRes.status === 401) {
        toast.error('Invalid admin password.');
        setIsAuthenticated(false);
        return;
      }

      const qData = await qRes.json();
      const sData = await sRes.json();

      if (qData.success && sData.success) {
        setQuestions(qData.questions || []);
        setStats(sData.stats);
        setIsAuthenticated(true);
      } else {
        toast.error(qData.message || 'Error loading admin data.');
      }
    } catch {
      toast.error('Network error during admin authentication.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) { toast.error('Please enter admin password.'); return; }
    fetchAdminData(password);
  };

  const openAddModal = () => {
    setEditingId(null);
    setFormData({ ...defaultForm });
    setModalOpen(true);
  };

  const openEditModal = (q: Question) => {
    setEditingId(q.id);
    setFormData({
      questionText: q.questionText,
      optionA: q.optionA,
      optionB: q.optionB,
      optionC: q.optionC,
      optionD: q.optionD,
      correctOption: q.correctOption as 'A' | 'B' | 'C' | 'D',
      category: q.category,
      difficulty: q.difficulty as 'Easy' | 'Medium' | 'Hard',
      active: q.active,
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingId(null);
    setFormData({ ...defaultForm });
  };

  const handleSaveQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.questionText.trim() || formData.questionText.length < 10) {
      toast.error('Question text must be at least 10 characters.'); return;
    }
    if (!formData.optionA || !formData.optionB || !formData.optionC || !formData.optionD) {
      toast.error('All four options are required.'); return;
    }

    setFormSaving(true);
    try {
      const method = editingId ? 'PUT' : 'POST';
      const body = editingId ? { id: editingId, ...formData } : formData;

      const res = await fetch('/api/admin/questions', {
        method,
        headers: { 'Content-Type': 'application/json', 'x-admin-password': password },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(editingId ? 'Question updated!' : 'Question added!');
        closeModal();
        fetchAdminData(password);
      } else {
        toast.error(data.message || 'Save failed.');
      }
    } catch {
      toast.error('Failed to save question.');
    } finally {
      setFormSaving(false);
    }
  };

  const handleDelete = (id: number, questionText: string) => {
    setDeleteToConfirm({ id, questionText });
  };

  const confirmDelete = async () => {
    if (!deleteToConfirm) return;
    const { id } = deleteToConfirm;
    setDeleteToConfirm(null);
    try {
      const res = await fetch(`/api/admin/questions?id=${id}`, {
        method: 'DELETE',
        headers: { 'x-admin-password': password },
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Question #${id} deleted.`);
        fetchAdminData(password);
      } else {
        toast.error(data.message);
      }
    } catch {
      toast.error('Delete failed.');
    }
  };

  const handleToggleActive = async (q: Question) => {
    try {
      const res = await fetch('/api/admin/questions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-admin-password': password },
        body: JSON.stringify({ id: q.id, active: !q.active }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Question ${!q.active ? 'enabled' : 'disabled'} successfully.`);
        // Optimistic update
        setQuestions(prev => prev.map(item => item.id === q.id ? { ...item, active: !q.active } : item));
      } else {
        toast.error(data.message);
      }
    } catch {
      toast.error('Toggle failed.');
    }
  };

  const handleResetLeaderboard = async () => {
    const confirmed = window.confirm('CAUTION: This will delete ALL user attempt history and reset leaderboards. This cannot be undone. Continue?');
    if (!confirmed) return;
    try {
      const res = await fetch('/api/admin/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-password': password },
        body: JSON.stringify({ target: 'leaderboard' }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
        fetchAdminData(password);
      } else {
        toast.error(data.message);
      }
    } catch {
      toast.error('Reset failed.');
    }
  };

  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(questions, null, 2));
    const a = document.createElement('a');
    a.setAttribute('href', dataStr);
    a.setAttribute('download', `question_bank_${Date.now()}.json`);
    document.body.appendChild(a);
    a.click();
    a.remove();
    toast.success('Question bank exported.');
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (!Array.isArray(parsed)) { toast.error('JSON must be an array of questions.'); return; }
        const res = await fetch('/api/admin/questions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-admin-password': password },
          body: JSON.stringify(parsed),
        });
        const data = await res.json();
        if (data.success) { toast.success(data.message); fetchAdminData(password); }
        else toast.error(data.message);
      } catch { toast.error('Invalid JSON file format.'); }
    };
    reader.readAsText(e.target.files[0], 'UTF-8');
    e.target.value = '';
  };

  // --- LOGIN SCREEN ---
  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto my-16 glass-panel p-8 rounded-3xl border border-slate-800 text-center shadow-2xl space-y-6">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center">
          <Lock className="w-8 h-8 text-indigo-400" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white">Admin Panel</h2>
          <p className="text-xs text-slate-400 mt-1">Enter your admin password to manage the Question Bank</p>
        </div>
        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Enter admin password..."
            autoFocus
            className="w-full px-4 py-3 bg-cyber-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyber-accent text-sm"
          />
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-6 rounded-xl cyber-button font-bold text-sm disabled:opacity-60"
          >
            {isLoading ? 'Authenticating...' : 'Unlock Admin Panel'}
          </button>
        </form>
      </div>
    );
  }

  // --- MAIN DASHBOARD ---
  return (
    <>
      <div className="max-w-7xl mx-auto my-6 space-y-6">

        {/* Header */}
        <div className="glass-panel px-6 py-5 rounded-3xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6 text-indigo-400" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-white">Question Bank Admin</h1>
              <p className="text-xs text-slate-400">Manage questions, enable/disable, and monitor metrics</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={openAddModal} className="flex items-center space-x-1.5 px-4 py-2 rounded-xl cyber-button text-xs font-bold">
              <Plus className="w-4 h-4" /><span>Add Question</span>
            </button>
            <button onClick={handleExportJSON} className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-cyber-800 hover:bg-cyber-700 text-white text-xs font-semibold border border-slate-700">
              <Download className="w-4 h-4 text-cyber-accent" /><span>Export JSON</span>
            </button>
            <label className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-cyber-800 hover:bg-cyber-700 text-white text-xs font-semibold border border-slate-700 cursor-pointer">
              <Upload className="w-4 h-4 text-emerald-400" /><span>Import JSON</span>
              <input type="file" accept=".json" onChange={handleImportJSON} className="hidden" />
            </label>
            <button onClick={handleResetLeaderboard} className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-xs font-semibold border border-rose-500/30">
              <AlertTriangle className="w-4 h-4" /><span>Reset Leaderboards</span>
            </button>
          </div>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {[
              { label: 'Total Questions', value: stats.totalQuestions, icon: BookOpen, color: 'text-white' },
              { label: 'Active Questions', value: stats.activeQuestions, icon: Activity, color: 'text-emerald-400' },
              { label: 'Total Attempts', value: stats.totalAttempts, icon: BarChart2, color: 'text-cyber-accent' },
              { label: 'Unique Users', value: stats.totalUsers, icon: Users, color: 'text-indigo-400' },
              { label: "Today's Attempts", value: stats.todayAttempts, icon: Activity, color: 'text-amber-400' },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="glass-panel p-4 rounded-2xl border border-slate-800">
                <div className="flex items-center space-x-2 mb-1">
                  <Icon className={`w-3.5 h-3.5 ${color}`} />
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">{label}</span>
                </div>
                <span className={`text-2xl font-bold ${color}`}>{value}</span>
              </div>
            ))}
          </div>
        )}

        {/* Filter Bar */}
        <div className="glass-panel px-4 py-3 rounded-2xl border border-slate-800 flex flex-col sm:flex-row gap-3 items-center">
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search questions..."
            className="flex-1 px-3 py-2 bg-cyber-900 border border-slate-700 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:border-cyber-accent"
          />
          <select
            value={filterCategory}
            onChange={e => setFilterCategory(e.target.value)}
            className="px-3 py-2 bg-cyber-900 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-cyber-accent"
          >
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <span className="text-xs text-slate-400 whitespace-nowrap flex items-center gap-3">
            <span>Showing {filteredQuestions.length} / {questions.length} questions</span>
            <span className="flex items-center gap-1.5 text-[11px] text-slate-400 border-l border-slate-700 pl-3">
              <span className="w-2 h-2 rounded-full bg-rose-500 inline-block shadow-[0_0_6px_rgba(244,63,94,0.8)]" />
              <span>Edited</span>
            </span>
          </span>
        </div>

        {/* Questions Table */}
        <div className="glass-panel rounded-3xl border border-slate-800 overflow-hidden">
          <div className="overflow-x-auto overflow-y-auto" style={{ maxHeight: '60vh' }}>
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase font-bold tracking-wider text-[10px] sticky top-0 z-10 bg-cyber-950">
                  <th className="py-3.5 px-4">ID</th>
                  <th className="py-3.5 px-4">Question</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Difficulty</th>
                  <th className="py-3.5 px-4 text-center">Answer</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredQuestions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-500">
                      {isLoading ? 'Loading...' : 'No questions found.'}
                    </td>
                  </tr>
                ) : filteredQuestions.map(q => {
                  const isEdited = Boolean(
                    q.updatedAt &&
                    q.createdAt &&
                    new Date(q.updatedAt).getTime() - new Date(q.createdAt).getTime() > 1000
                  );
                  return (
                  <tr key={q.id} className={`hover:bg-cyber-900/40 transition-colors ${!q.active ? 'opacity-50' : ''}`}>
                    <td className="py-3 px-4 font-mono text-slate-500">
                      <div className="flex items-center space-x-1.5">
                        <span>#{q.id}</span>
                        {isEdited && (
                          <span
                            className="w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.9)] animate-pulse inline-block"
                            title={`Edited question (Updated: ${new Date(q.updatedAt!).toLocaleDateString()})`}
                          />
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 font-medium text-white max-w-xs">
                      <span className="line-clamp-2">{q.questionText}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 text-[10px] font-semibold">
                        {q.category}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        q.difficulty === 'Easy' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                        q.difficulty === 'Hard' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                        'bg-amber-500/10 text-amber-400 border-amber-500/20'
                      }`}>
                        {q.difficulty}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center font-extrabold text-emerald-400">{q.correctOption}</td>
                    <td className="py-3 px-4 text-center">
                      {/* Enable / Disable Toggle */}
                      <button
                        onClick={() => handleToggleActive(q)}
                        title={q.active ? 'Click to Disable' : 'Click to Enable'}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold border transition-all ${
                          q.active
                            ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 hover:bg-rose-500/15 hover:text-rose-400 hover:border-rose-500/30'
                            : 'bg-slate-800 text-slate-500 border-slate-700 hover:bg-emerald-500/15 hover:text-emerald-400 hover:border-emerald-500/30'
                        }`}
                      >
                        {q.active
                          ? <><Eye className="w-3 h-3" /> ACTIVE</>
                          : <><EyeOff className="w-3 h-3" /> DISABLED</>
                        }
                      </button>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEditModal(q)}
                          title="Edit Question"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-cyber-accent hover:bg-cyber-900 transition-all"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(q.id, q.questionText)}
                          title="Delete Question"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ===== MODAL (rendered at root level to avoid z-index issues) ===== */}
      {modalOpen && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', backgroundColor: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}
          onClick={e => { if (e.target === e.currentTarget) closeModal(); }}
        >
          <div
            className="glass-panel rounded-[1.5rem] w-full max-w-[560px] max-h-[90vh] overflow-y-auto border border-cyber-accent/20 shadow-[0_0_60px_-10px_rgba(0,255,102,0.2)]"
          >
            <div className="p-6 space-y-4">
              {/* Modal Header */}
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-white">
                  {editingId ? `Edit Question #${editingId}` : 'Add New Question'}
                </h3>
                <button onClick={closeModal} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveQuestion} className="space-y-4">
                {/* Question Text */}
                <div>
                  <label className="block text-xs text-slate-300 font-bold mb-1.5">Question Text <span className="text-rose-400">*</span></label>
                  <textarea
                    rows={3}
                    value={formData.questionText}
                    onChange={e => setFormData({ ...formData, questionText: e.target.value })}
                    placeholder="Enter the full question text..."
                    className="w-full p-3 bg-cyber-900 border border-slate-700 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:border-cyber-accent resize-none"
                    required
                  />
                </div>

                {/* Options */}
                <div className="grid grid-cols-2 gap-3">
                  {(['A', 'B', 'C', 'D'] as const).map(opt => (
                    <div key={opt}>
                      <label className="block text-xs font-bold mb-1.5">
                        <span className={`inline-flex w-5 h-5 rounded items-center justify-center text-[10px] mr-1 ${
                          formData.correctOption === opt ? 'bg-emerald-500 text-white' : 'bg-cyber-800 text-slate-400'
                        }`}>{opt}</span>
                        Option {opt} {formData.correctOption === opt && <Check className="w-3 h-3 inline text-emerald-400 ml-1" />}
                      </label>
                      <input
                        type="text"
                        value={formData[`option${opt}` as 'optionA' | 'optionB' | 'optionC' | 'optionD']}
                        onChange={e => setFormData({ ...formData, [`option${opt}`]: e.target.value })}
                        placeholder={`Option ${opt}...`}
                        className="w-full p-2 bg-cyber-900 border border-slate-700 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:border-cyber-accent"
                        required
                      />
                    </div>
                  ))}
                </div>

                {/* Correct Option, Category, Difficulty */}
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs text-slate-300 font-bold mb-1.5">Correct Answer</label>
                    <select
                      value={formData.correctOption}
                      onChange={e => setFormData({ ...formData, correctOption: e.target.value as 'A'|'B'|'C'|'D' })}
                      className="w-full p-2 bg-cyber-900 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500"
                    >
                      <option value="A">Option A</option>
                      <option value="B">Option B</option>
                      <option value="C">Option C</option>
                      <option value="D">Option D</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-300 font-bold mb-1.5">Category</label>
                    <input
                      type="text"
                      value={formData.category}
                      onChange={e => setFormData({ ...formData, category: e.target.value })}
                      className="w-full p-2 bg-cyber-900 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-cyber-accent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-300 font-bold mb-1.5">Difficulty</label>
                    <select
                      value={formData.difficulty}
                      onChange={e => setFormData({ ...formData, difficulty: e.target.value as 'Easy'|'Medium'|'Hard' })}
                      className="w-full p-2 bg-cyber-900 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-cyber-accent"
                    >
                      <option value="Easy">Easy</option>
                      <option value="Medium">Medium</option>
                      <option value="Hard">Hard</option>
                    </select>
                  </div>
                </div>

                {/* Active Toggle */}
                <div className="flex items-center gap-3 p-3 rounded-xl bg-cyber-900/60 border border-slate-800">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, active: !formData.active })}
                    className={`relative w-11 h-6 rounded-full transition-colors ${formData.active ? 'bg-emerald-500' : 'bg-slate-400'}`}
                  >
                    <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${formData.active ? 'translate-x-5' : 'translate-x-0'}`} />
                  </button>
                  <div>
                    <p className="text-sm font-semibold text-white">{formData.active ? 'Active' : 'Disabled'}</p>
                    <p className="text-[10px] text-slate-400">{formData.active ? 'Included in the random quiz pool' : 'Hidden from quiz pool'}</p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-sm transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={formSaving}
                    className="flex-1 py-2.5 rounded-xl cyber-button font-bold text-sm disabled:opacity-60 flex items-center justify-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    {formSaving ? 'Saving...' : (editingId ? 'Update Question' : 'Save Question')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      {/* ===== DELETE CONFIRMATION MODAL ===== */}
      {deleteToConfirm && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', backgroundColor: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(6px)' }}
        >
          <div
            className="glass-panel rounded-[1.5rem] w-full max-w-[440px] p-8 border border-rose-500/30 shadow-[0_0_60px_-10px_rgba(239,68,68,0.25)]"
          >
            <div className="flex items-center justify-center mb-5">
              <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center">
                <Trash2 className="w-8 h-8 text-rose-400" />
              </div>
            </div>

            <h3 className="text-xl font-extrabold text-white text-center mb-2">Delete Question?</h3>
            <p className="text-xs text-slate-400 text-center mb-4">This action is permanent and cannot be undone.</p>

            <div className="p-3 rounded-xl bg-rose-500/5 border border-rose-500/20 mb-6">
              <p className="text-sm text-slate-300 line-clamp-3 italic">"{deleteToConfirm.questionText}"</p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setDeleteToConfirm(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-sm transition-all"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-lg"
              >
                <Trash2 className="w-4 h-4" />
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
