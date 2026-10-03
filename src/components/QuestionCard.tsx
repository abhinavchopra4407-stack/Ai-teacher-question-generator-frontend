import React, { useState } from 'react';
import type { SingleQuestion } from '../types';
import { 
  Edit3, 
  Trash2, 
  RefreshCw, 
  Copy, 
  Check, 
  ChevronUp, 
  ChevronDown, 
  Sparkles,
  BookOpen
} from 'lucide-react';

interface QuestionCardProps {
  question: SingleQuestion;
  index: number;
  totalInGroup: number;
  onUpdate: (updatedQuestion: SingleQuestion) => void;
  onDelete: (id: string) => void;
  onRegenerate: (question: SingleQuestion) => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  isRegenerating?: boolean;
}

export const QuestionCard: React.FC<QuestionCardProps> = ({
  question,
  index,
  totalInGroup,
  onUpdate,
  onDelete,
  onRegenerate,
  onMoveUp,
  onMoveDown,
  isRegenerating = false
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(question.question_text);
  const [editMarks, setEditMarks] = useState(question.marks);
  const [copied, setCopied] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);

  const handleSaveEdit = () => {
    onUpdate({
      ...question,
      question_text: editText,
      marks: Number(editMarks)
    });
    setIsEditing(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(`Q${index + 1}. ${question.question_text} [${question.marks} Marks]`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getBadgeClass = (type: string) => {
    if (type.includes("Very Short")) return "badge-very-short";
    if (type.includes("Short")) return "badge-short";
    return "badge-long";
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:shadow-md transition-shadow duration-200 relative">
      {/* Header Info Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div className="flex items-center space-x-2">
          <span className="w-7 h-7 rounded-lg bg-blue-100 text-blue-800 font-bold text-xs flex items-center justify-center">
            Q{index + 1}
          </span>
          <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${getBadgeClass(question.question_type)}`}>
            {question.question_type}
          </span>
          <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-600">
            {question.marks} {question.marks === 1 ? 'Mark' : 'Marks'}
          </span>
          {question.related_topic && (
            <span className="hidden sm:inline-flex items-center text-[11px] text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
              <BookOpen className="w-3 h-3 mr-1 text-slate-400" />
              {question.related_topic}
            </span>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-1">
          {onMoveUp && index > 0 && (
            <button
              onClick={onMoveUp}
              title="Move Up"
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
            >
              <ChevronUp className="w-4 h-4" />
            </button>
          )}
          {onMoveDown && index < totalInGroup - 1 && (
            <button
              onClick={onMoveDown}
              title="Move Down"
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={handleCopy}
            title="Copy Question"
            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
          </button>
          <button
            onClick={() => onRegenerate(question)}
            disabled={isRegenerating}
            title="Regenerate single question using AI"
            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isRegenerating ? 'animate-spin text-indigo-600' : ''}`} />
          </button>
          <button
            onClick={() => setIsEditing(!isEditing)}
            title="Edit question text"
            className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-md transition-colors"
          >
            <Edit3 className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(question.id)}
            title="Delete question"
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Question Body */}
      {isEditing ? (
        <div className="space-y-3 bg-slate-50 p-3 rounded-lg border border-slate-200 mt-2">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Question Wording:</label>
            <textarea
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              rows={3}
              className="w-full text-sm p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
            />
          </div>
          <div className="flex items-center space-x-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Marks:</label>
              <input
                type="number"
                value={editMarks}
                onChange={(e) => setEditMarks(Number(e.target.value))}
                className="w-20 text-sm p-1.5 rounded-lg border border-slate-300 bg-white"
                min={1}
              />
            </div>
            <div className="flex space-x-2 pt-4">
              <button
                onClick={handleSaveEdit}
                className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700"
              >
                Save Changes
              </button>
              <button
                onClick={() => setIsEditing(false)}
                className="px-3 py-1.5 bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : (
        <p className="text-sm font-medium text-slate-800 leading-relaxed pr-2">
          {question.question_text}
        </p>
      )}

      {/* Answer Key Section Accordion */}
      {question.answer && (
        <div className="mt-4 pt-3 border-t border-slate-100">
          <button
            onClick={() => setShowAnswer(!showAnswer)}
            className="flex items-center space-x-1.5 text-xs font-bold text-indigo-700 hover:text-indigo-900 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>{showAnswer ? 'Hide Answer Key & Marking Scheme' : 'View Answer Key & Marking Scheme'}</span>
          </button>

          {showAnswer && (
            <div className="mt-2.5 p-3 rounded-lg bg-indigo-50/60 border border-indigo-100 space-y-2 text-xs text-slate-700 animate-in fade-in duration-150">
              <div>
                <span className="font-bold text-indigo-950 block mb-0.5">Suggested Model Answer:</span>
                <p className="text-slate-700 leading-relaxed italic">{question.answer}</p>
              </div>

              {question.marking_points && question.marking_points.length > 0 && (
                <div>
                  <span className="font-bold text-indigo-950 block mb-0.5">Marking Scheme:</span>
                  <ul className="list-disc list-inside space-y-0.5 pl-1 text-slate-600">
                    {question.marking_points.map((pt, i) => (
                      <li key={i}>{pt}</li>
                    ))}
                  </ul>
                </div>
              )}

              {question.expected_length && (
                <div className="text-[11px] text-indigo-800 font-medium pt-1">
                  Expected Length: <span className="font-semibold">{question.expected_length}</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
