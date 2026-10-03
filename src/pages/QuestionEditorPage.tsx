import React, { useState } from 'react';
import type { SingleQuestion } from '../types';
import { QuestionCard } from '../components/QuestionCard';
import { questionService, paperService } from '../services/api';
import { 
  Save, 
  Sparkles, 
  Eye, 
  Plus, 
  ArrowLeft
} from 'lucide-react';

interface QuestionEditorPageProps {
  paperData: any;
  chapterText: string;
  setActivePage: (page: string) => void;
  setSelectedPaperId: (id: string) => void;
  showToast: (title: string, message?: string, type?: 'success' | 'error' | 'info') => void;
}

export const QuestionEditorPage: React.FC<QuestionEditorPageProps> = ({
  paperData,
  chapterText,
  setActivePage,
  setSelectedPaperId,
  showToast
}) => {
  const [veryShort, setVeryShort] = useState<SingleQuestion[]>(paperData?.very_short_questions || []);
  const [short, setShort] = useState<SingleQuestion[]>(paperData?.short_questions || []);
  const [long, setLong] = useState<SingleQuestion[]>(paperData?.long_questions || []);

  const [saving, setSaving] = useState(false);
  const [generatingAnswerKey, setGeneratingAnswerKey] = useState(false);
  const [hasAnswerKey, setHasAnswerKey] = useState(!!paperData?.answer_key);
  const [regeneratingId, setRegeneratingId] = useState<string | null>(null);

  // Manual Question Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newQText, setNewQText] = useState('');
  const [newQType, setNewQType] = useState('Very Short Answer');
  const [newQMarks, setNewQMarks] = useState(2);
  const [newQTopic, setNewQTopic] = useState('');

  const calculateTotalMarks = () => {
    const vsMarks = veryShort.reduce((acc, q) => acc + q.marks, 0);
    const sMarks = short.reduce((acc, q) => acc + q.marks, 0);
    const lMarks = long.reduce((acc, q) => acc + q.marks, 0);
    return vsMarks + sMarks + lMarks;
  };

  const handleUpdateQuestion = (updated: SingleQuestion) => {
    if (updated.question_type.includes("Very Short")) {
      setVeryShort(veryShort.map(q => q.id === updated.id ? updated : q));
    } else if (updated.question_type.includes("Short") && !updated.question_type.includes("Very")) {
      setShort(short.map(q => q.id === updated.id ? updated : q));
    } else {
      setLong(long.map(q => q.id === updated.id ? updated : q));
    }
  };

  const handleDeleteQuestion = (id: string) => {
    setVeryShort(veryShort.filter(q => q.id !== id));
    setShort(short.filter(q => q.id !== id));
    setLong(long.filter(q => q.id !== id));
    showToast('Question Deleted', 'Question removed. You can add a custom replacement or regenerate.', 'info');
  };

  const handleRegenerateSingle = async (targetQ: SingleQuestion) => {
    setRegeneratingId(targetQ.id);
    try {
      const newQ = await questionService.regenerateSingle({
        chapter_title: paperData.chapter_title,
        subject: paperData.subject,
        grade: paperData.grade,
        language: paperData.language || 'English',
        difficulty: paperData.difficulty || 'Medium',
        question_type: targetQ.question_type,
        existing_question: targetQ.question_text,
        topic: targetQ.related_topic,
        chapter_text: chapterText || paperData.chapter_title
      });

      handleUpdateQuestion({ ...newQ, id: targetQ.id, question_number: targetQ.question_number });
      showToast('Question Regenerated', 'AI created a fresh replacement question.', 'success');
    } catch (err) {
      showToast('Regeneration Error', 'Failed to regenerate question.', 'error');
    } finally {
      setRegeneratingId(null);
    }
  };

  const handleAddCustomQuestion = () => {
    if (!newQText.trim()) return;

    const newQuestion: SingleQuestion = {
      id: String(Date.now()),
      question_number: (veryShort.length + short.length + long.length) + 1,
      question_text: newQText,
      question_type: newQType,
      difficulty: paperData.difficulty || 'Medium',
      marks: Number(newQMarks),
      related_topic: newQTopic || paperData.chapter_title
    };

    if (newQType.includes("Very Short")) {
      setVeryShort([...veryShort, newQuestion]);
    } else if (newQType.includes("Short") && !newQType.includes("Very")) {
      setShort([...short, newQuestion]);
    } else {
      setLong([...long, newQuestion]);
    }

    setShowAddModal(false);
    setNewQText('');
    showToast('Question Added', 'Custom question added to section.', 'success');
  };

  const handleGenerateAnswerKey = async () => {
    setGeneratingAnswerKey(true);
    const allQuestions = [...veryShort, ...short, ...long];

    try {
      const updatedWithAnswers = await questionService.generateAnswerKey({
        chapter_title: paperData.chapter_title,
        chapter_text: chapterText || paperData.chapter_title,
        questions: allQuestions,
        language: paperData.language || 'English'
      });

      const vsAns = updatedWithAnswers.filter(q => q.question_type.includes("Very Short"));
      const sAns = updatedWithAnswers.filter(q => q.question_type.includes("Short") && !q.question_type.includes("Very"));
      const lAns = updatedWithAnswers.filter(q => q.question_type.includes("Long"));

      setVeryShort(vsAns);
      setShort(sAns);
      setLong(lAns);
      setHasAnswerKey(true);
      showToast('Answer Key Generated', 'Added model answers and marking schemes for all questions.', 'success');
    } catch (err) {
      showToast('Error', 'Failed to generate answer key.', 'error');
    } finally {
      setGeneratingAnswerKey(false);
    }
  };

  const handleSavePaper = async () => {
    setSaving(true);
    const allQuestions = [...veryShort, ...short, ...long];

    try {
      const payload = {
        id: paperData.id,
        document_id: paperData.document_id,
        title: paperData.chapter_title,
        subject: paperData.subject,
        grade: paperData.grade,
        board: paperData.board || 'General',
        language: paperData.language || 'English',
        difficulty: paperData.difficulty || 'Medium',
        total_marks: calculateTotalMarks(),
        school_name: paperData.school_name || "TeachGenie Model School",
        teacher_name: paperData.teacher_name || "",
        instructions: paperData.instructions || "Attempt all questions. Read instructions carefully.",
        questions: allQuestions,
        answer_key: hasAnswerKey ? allQuestions : undefined
      };

      const saved = await paperService.savePaper(payload);
      setSelectedPaperId(saved.id);
      showToast('Paper Saved', `Question paper "${saved.title}" saved to your database!`, 'success');
    } catch (err) {
      showToast('Save Failed', 'Failed to save question paper to database.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8 pb-16">
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <button
            onClick={() => setActivePage('upload')}
            className="inline-flex items-center space-x-1 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors mb-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Upload New Chapter</span>
          </button>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            {paperData.chapter_title}
          </h1>
          <div className="flex items-center space-x-3 text-xs text-slate-500">
            <span className="font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded border border-blue-200">{paperData.subject}</span>
            <span>•</span>
            <span>{paperData.grade}</span>
            <span>•</span>
            <span className="font-bold text-slate-800">Total: {calculateTotalMarks()} Marks</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setShowAddModal(true)}
            className="px-3.5 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4 text-slate-600" />
            <span>Add Custom Question</span>
          </button>

          <button
            onClick={handleGenerateAnswerKey}
            disabled={generatingAnswerKey}
            className="px-3.5 py-2 bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-colors cursor-pointer disabled:opacity-50"
          >
            <Sparkles className={`w-4 h-4 text-indigo-600 ${generatingAnswerKey ? 'animate-spin' : ''}`} />
            <span>{generatingAnswerKey ? 'Generating Answers...' : (hasAnswerKey ? 'Regenerate Answer Key' : 'Generate Answer Key')}</span>
          </button>

          <button
            onClick={handleSavePaper}
            disabled={saving}
            className="btn-primary px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 cursor-pointer shadow-md disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save Paper'}</span>
          </button>

          <button
            onClick={() => {
              handleSavePaper();
              setActivePage('preview');
            }}
            className="px-4 py-2 bg-slate-900 text-white hover:bg-slate-800 rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-md cursor-pointer"
          >
            <Eye className="w-4 h-4" />
            <span>Preview & Print</span>
          </button>
        </div>
      </div>

      <div className="space-y-8">
        {/* SECTION 1: VERY SHORT ANSWER QUESTIONS */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 rounded-full bg-blue-600" />
              <h2 className="text-lg font-extrabold text-slate-900">
                Section 1: Very Short Answer Questions ({veryShort.length})
              </h2>
            </div>
            <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
              1 Word / 1 Sentence / Definitions ({veryShort.reduce((a, b) => a + b.marks, 0)} Marks)
            </span>
          </div>

          {veryShort.length === 0 ? (
            <p className="text-xs text-slate-400 italic py-4">No Very Short Answer questions. Click "Add Custom Question" to add one.</p>
          ) : (
            <div className="space-y-4">
              {veryShort.map((q, idx) => (
                <QuestionCard
                  key={q.id}
                  question={q}
                  index={idx}
                  totalInGroup={veryShort.length}
                  onUpdate={handleUpdateQuestion}
                  onDelete={handleDeleteQuestion}
                  onRegenerate={handleRegenerateSingle}
                  isRegenerating={regeneratingId === q.id}
                />
              ))}
            </div>
          )}
        </div>

        {/* SECTION 2: SHORT ANSWER QUESTIONS */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 rounded-full bg-emerald-600" />
              <h2 className="text-lg font-extrabold text-slate-900">
                Section 2: Short Answer Questions ({short.length})
              </h2>
            </div>
            <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
              Brief Explanation & Key Points ({short.reduce((a, b) => a + b.marks, 0)} Marks)
            </span>
          </div>

          {short.length === 0 ? (
            <p className="text-xs text-slate-400 italic py-4">No Short Answer questions in this section.</p>
          ) : (
            <div className="space-y-4">
              {short.map((q, idx) => (
                <QuestionCard
                  key={q.id}
                  question={q}
                  index={idx + veryShort.length}
                  totalInGroup={short.length}
                  onUpdate={handleUpdateQuestion}
                  onDelete={handleDeleteQuestion}
                  onRegenerate={handleRegenerateSingle}
                  isRegenerating={regeneratingId === q.id}
                />
              ))}
            </div>
          )}
        </div>

        {/* SECTION 3: LONG ANSWER QUESTIONS */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 rounded-full bg-purple-600" />
              <h2 className="text-lg font-extrabold text-slate-900">
                Section 3: Long Answer Questions ({long.length})
              </h2>
            </div>
            <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
              Detailed Reasoning & Analysis ({long.reduce((a, b) => a + b.marks, 0)} Marks)
            </span>
          </div>

          {long.length === 0 ? (
            <p className="text-xs text-slate-400 italic py-4">No Long Answer questions in this section.</p>
          ) : (
            <div className="space-y-4">
              {long.map((q, idx) => (
                <QuestionCard
                  key={q.id}
                  question={q}
                  index={idx + veryShort.length + short.length}
                  totalInGroup={long.length}
                  onUpdate={handleUpdateQuestion}
                  onDelete={handleDeleteQuestion}
                  onRegenerate={handleRegenerateSingle}
                  isRegenerating={regeneratingId === q.id}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Add Custom Question</h3>
            
            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Question Category</label>
                <select
                  value={newQType}
                  onChange={(e) => {
                    setNewQType(e.target.value);
                    if (e.target.value.includes("Very Short")) setNewQMarks(2);
                    else if (e.target.value.includes("Short")) setNewQMarks(4);
                    else setNewQMarks(8);
                  }}
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-medium"
                >
                  <option value="Very Short Answer">Very Short Answer Question</option>
                  <option value="Short Answer">Short Answer Question</option>
                  <option value="Long Answer">Long Answer Question</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Question Text *</label>
                <textarea
                  value={newQText}
                  onChange={(e) => setNewQText(e.target.value)}
                  rows={3}
                  placeholder="Enter the question wording..."
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Marks</label>
                  <input
                    type="number"
                    value={newQMarks}
                    onChange={(e) => setNewQMarks(Number(e.target.value))}
                    className="w-full p-2 rounded-xl border border-slate-300 font-bold text-center"
                    min={1}
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Related Topic</label>
                  <input
                    type="text"
                    value={newQTopic}
                    onChange={(e) => setNewQTopic(e.target.value)}
                    placeholder="e.g. Refraction Index"
                    className="w-full p-2 rounded-xl border border-slate-300"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-2">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200"
              >
                Cancel
              </button>
              <button
                onClick={handleAddCustomQuestion}
                className="btn-primary px-5 py-2 rounded-xl text-xs font-bold"
              >
                Add Question
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
