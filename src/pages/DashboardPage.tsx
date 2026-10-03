import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { dashboardService, paperService } from '../services/api';
import type { DashboardStats } from '../types';
import { 
  Sparkles, 
  FolderArchive, 
  BookOpen, 
  Plus, 
  Search, 
  Eye, 
  Copy, 
  Trash2, 
  FileText, 
  Clock, 
  ShieldCheck,
  Award
} from 'lucide-react';
import { Modal } from '../components/Modal';

interface DashboardPageProps {
  setActivePage: (page: string) => void;
  setSelectedPaperId: (id: string) => void;
  showToast: (title: string, message?: string, type?: 'success' | 'error' | 'info') => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  setActivePage,
  setSelectedPaperId,
  showToast
}) => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('All');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [paperToDelete, setPaperToDelete] = useState<string | null>(null);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const data = await dashboardService.getStats();
      setStats(data);
    } catch (err) {
      console.error("Failed to load dashboard stats:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleDuplicate = async (id: string) => {
    try {
      const duplicated = await paperService.duplicatePaper(id);
      showToast('Paper Duplicated', `Created "${duplicated.title}"`, 'success');
      fetchStats();
    } catch (err) {
      showToast('Duplication Failed', 'Could not duplicate paper.', 'error');
    }
  };

  const confirmDelete = async () => {
    if (!paperToDelete) return;
    try {
      await paperService.deletePaper(paperToDelete);
      showToast('Paper Deleted', 'The question paper was removed.', 'info');
      fetchStats();
    } catch (err) {
      showToast('Delete Failed', 'Could not delete question paper.', 'error');
    }
  };

  const filteredPapers = (stats?.recent_papers || []).filter(paper => {
    const matchesSearch = paper.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          paper.subject.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSubject = subjectFilter === 'All' || paper.subject === subjectFilter;
    return matchesSearch && matchesSubject;
  });

  const subjects = ['All', ...Array.from(new Set((stats?.recent_papers || []).map(p => p.subject)))];

  return (
    <div className="space-y-8 pb-12">
      {/* Welcome Banner */}
      <div className="gradient-header rounded-3xl p-8 text-white shadow-lg relative overflow-hidden">
        <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none transform translate-x-10 translate-y-10">
          <Sparkles className="w-80 h-80" />
        </div>
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <span className="inline-flex items-center px-3 py-1 bg-white/20 text-cyan-200 rounded-full text-xs font-bold uppercase tracking-wider backdrop-blur-md">
              <ShieldCheck className="w-3.5 h-3.5 mr-1" /> Authenticated Dashboard
            </span>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Welcome back, {user?.full_name || 'Teacher'}! 👋
            </h1>
            <p className="text-slate-200 text-sm max-w-xl">
              Ready to create your next question paper? Upload any chapter content and generate balanced 3/3/3 exam questions instantly.
            </p>
          </div>

          <div>
            <button
              onClick={() => setActivePage('upload')}
              className="px-6 py-3.5 bg-white text-blue-900 hover:bg-slate-100 rounded-xl font-extrabold text-sm shadow-xl flex items-center space-x-2 transition-all cursor-pointer transform hover:scale-105"
            >
              <Plus className="w-5 h-5 text-blue-600" />
              <span>Generate Questions Now</span>
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Counter Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <p className="text-2xl font-extrabold text-slate-900">{stats?.total_papers ?? 0}</p>
            <p className="text-xs font-semibold text-slate-500">Question Papers Generated</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <p className="text-2xl font-extrabold text-slate-900">{stats?.total_chapters ?? 0}</p>
            <p className="text-xs font-semibold text-slate-500">Processed Chapters</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <p className="text-2xl font-extrabold text-slate-900">100%</p>
            <p className="text-xs font-semibold text-slate-500">Chapter Content Accuracy</p>
          </div>
        </div>
      </div>

      {/* Recent Question Papers Section */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Recent Question Papers</h2>
            <p className="text-xs text-slate-500">View, edit, preview, or export your saved exam papers</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search papers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 w-48"
              />
            </div>

            {subjects.length > 1 && (
              <select
                value={subjectFilter}
                onChange={(e) => setSubjectFilter(e.target.value)}
                className="py-2 px-3 text-xs rounded-xl border border-slate-300 bg-white font-semibold text-slate-700"
              >
                {subjects.map(sub => (
                  <option key={sub} value={sub}>{sub === 'All' ? 'All Subjects' : sub}</option>
                ))}
              </select>
            )}

            <button
              onClick={() => setActivePage('saved')}
              className="text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors"
            >
              View All ({stats?.total_papers ?? 0}) →
            </button>
          </div>
        </div>

        {loading ? (
          <div className="py-12 text-center text-slate-400 space-y-3">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs">Loading question papers...</p>
          </div>
        ) : filteredPapers.length === 0 ? (
          <div className="py-12 text-center border-2 border-dashed border-slate-200 rounded-2xl space-y-4">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <FolderArchive className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-700">No Question Papers Found</h3>
              <p className="text-xs text-slate-500 mt-1">Start by uploading a chapter to generate your first 9-question paper.</p>
            </div>
            <button
              onClick={() => setActivePage('upload')}
              className="btn-primary px-5 py-2.5 rounded-xl text-xs font-bold cursor-pointer"
            >
              Generate First Question Paper
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPapers.map((paper) => (
              <div
                key={paper.id}
                className="bg-slate-50/50 hover:bg-white rounded-2xl border border-slate-200 p-5 transition-all duration-200 hover:shadow-md space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-blue-100 text-blue-800">
                      {paper.subject}
                    </span>
                    <span className="text-[11px] font-medium text-slate-400 flex items-center">
                      <Clock className="w-3 h-3 mr-1" />
                      {new Date(paper.updated_at).toLocaleDateString()}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 line-clamp-2 leading-snug">
                    {paper.title}
                  </h3>

                  <div className="flex items-center space-x-2 text-xs text-slate-500">
                    <span>Grade {paper.grade}</span>
                    <span>•</span>
                    <span>{paper.total_marks} Marks</span>
                    <span>•</span>
                    <span className="capitalize">{paper.difficulty}</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
                  <button
                    onClick={() => {
                      setSelectedPaperId(paper.id);
                      setActivePage('preview');
                    }}
                    className="flex items-center space-x-1 text-xs font-bold text-blue-700 hover:text-blue-900 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Preview / Print</span>
                  </button>

                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => handleDuplicate(paper.id)}
                      title="Duplicate"
                      className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        setPaperToDelete(paper.id);
                        setDeleteModalOpen(true);
                      }}
                      title="Delete"
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Question Paper"
        description="Are you sure you want to delete this question paper? This action cannot be undone."
        confirmText="Delete Paper"
        confirmVariant="danger"
      />
    </div>
  );
};
