import React, { useState, useEffect } from 'react';
import { paperService } from '../services/api';
import type { QuestionPaper } from '../types';
import { 
  FolderArchive, 
  Search, 
  Filter, 
  Eye, 
  Copy, 
  Trash2, 
  Clock, 
  Plus
} from 'lucide-react';
import { Modal } from '../components/Modal';

interface SavedPapersPageProps {
  setActivePage: (page: string) => void;
  setSelectedPaperId: (id: string) => void;
  setPaperData: (data: any) => void;
  showToast: (title: string, message?: string, type?: 'success' | 'error' | 'info') => void;
}

export const SavedPapersPage: React.FC<SavedPapersPageProps> = ({
  setActivePage,
  setSelectedPaperId,
  setPaperData,
  showToast
}) => {
  const [papers, setPapers] = useState<QuestionPaper[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('All');
  const [gradeFilter, setGradeFilter] = useState('All');

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [paperToDelete, setPaperToDelete] = useState<string | null>(null);

  const fetchPapers = async () => {
    setLoading(true);
    try {
      const data = await paperService.getPapers({
        search: searchTerm,
        subject: subjectFilter !== 'All' ? subjectFilter : undefined,
        grade: gradeFilter !== 'All' ? gradeFilter : undefined
      });
      setPapers(data);
    } catch (err) {
      console.error("Failed to load saved papers:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPapers();
  }, [searchTerm, subjectFilter, gradeFilter]);

  const handleDuplicate = async (id: string) => {
    try {
      const duplicated = await paperService.duplicatePaper(id);
      showToast('Paper Duplicated', `Created "${duplicated.title}"`, 'success');
      fetchPapers();
    } catch (err) {
      showToast('Duplication Failed', 'Could not duplicate paper.', 'error');
    }
  };

  const confirmDelete = async () => {
    if (!paperToDelete) return;
    try {
      await paperService.deletePaper(paperToDelete);
      showToast('Paper Deleted', 'The question paper was removed.', 'info');
      fetchPapers();
    } catch (err) {
      showToast('Delete Failed', 'Could not delete question paper.', 'error');
    }
  };

  const handleEditPaper = async (paper: QuestionPaper) => {
    setSelectedPaperId(paper.id);
    setPaperData({
      id: paper.id,
      document_id: paper.document_id,
      chapter_title: paper.title,
      subject: paper.subject,
      grade: paper.grade,
      board: paper.board,
      language: paper.language,
      difficulty: paper.difficulty,
      total_marks: paper.total_marks,
      school_name: paper.school_name,
      teacher_name: paper.teacher_name,
      instructions: paper.instructions,
      very_short_questions: paper.questions.filter(q => q.question_type.includes("Very Short")),
      short_questions: paper.questions.filter(q => q.question_type.includes("Short") && !q.question_type.includes("Very")),
      long_questions: paper.questions.filter(q => q.question_type.includes("Long")),
      answer_key: paper.answer_key
    });
    setActivePage('editor');
  };

  const subjects = ['All', ...Array.from(new Set(papers.map(p => p.subject)))];
  const grades = ['All', ...Array.from(new Set(papers.map(p => p.grade)))];

  return (
    <div className="space-y-8 pb-16">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-3xl border border-slate-200 p-6 shadow-xs">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center space-x-2">
            <FolderArchive className="w-6 h-6 text-blue-600" />
            <span>Saved Question Papers</span>
          </h1>
          <p className="text-xs text-slate-500">Access, edit, duplicate, or export all your saved exam papers</p>
        </div>

        <button
          onClick={() => setActivePage('upload')}
          className="btn-primary px-5 py-2.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-md cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Question Paper</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search by chapter title or subject..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-bold text-slate-700">Filter:</span>
          </div>

          <select
            value={subjectFilter}
            onChange={(e) => setSubjectFilter(e.target.value)}
            className="py-2 px-3 rounded-xl border border-slate-300 bg-white font-medium"
          >
            {subjects.map(sub => (
              <option key={sub} value={sub}>{sub === 'All' ? 'All Subjects' : sub}</option>
            ))}
          </select>

          <select
            value={gradeFilter}
            onChange={(e) => setGradeFilter(e.target.value)}
            className="py-2 px-3 rounded-xl border border-slate-300 bg-white font-medium"
          >
            {grades.map(g => (
              <option key={g} value={g}>{g === 'All' ? 'All Grades' : g}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="py-16 text-center text-slate-400 space-y-3">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-semibold">Loading saved question papers...</p>
        </div>
      ) : papers.length === 0 ? (
        <div className="py-16 text-center border-2 border-dashed border-slate-200 rounded-3xl bg-white space-y-4">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <FolderArchive className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-700">No Saved Question Papers Found</h3>
            <p className="text-xs text-slate-500 mt-1">Generate and save your first paper to manage it here.</p>
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
          {papers.map((paper) => (
            <div
              key={paper.id}
              className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-blue-100 text-blue-800">
                    {paper.subject}
                  </span>
                  <span className="text-[11px] text-slate-400 flex items-center font-medium">
                    <Clock className="w-3 h-3 mr-1" />
                    {new Date(paper.updated_at).toLocaleDateString()}
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-900 leading-snug line-clamp-2">
                  {paper.title}
                </h3>

                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                  <span className="bg-slate-100 px-2 py-0.5 rounded font-semibold text-slate-700">{paper.grade}</span>
                  <span className="bg-slate-100 px-2 py-0.5 rounded font-semibold text-slate-700">{paper.total_marks} Marks</span>
                  <span className="bg-slate-100 px-2 py-0.5 rounded font-semibold text-slate-700 capitalize">{paper.difficulty}</span>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleEditPaper(paper)}
                    className="px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                  >
                    Edit / Reopen
                  </button>

                  <button
                    onClick={() => {
                      setSelectedPaperId(paper.id);
                      setActivePage('preview');
                    }}
                    className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg"
                    title="Preview"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </div>

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

      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Saved Paper"
        description="Are you sure you want to delete this question paper? This action is permanent."
        confirmText="Delete Paper"
        confirmVariant="danger"
      />
    </div>
  );
};
