import React, { useState, useEffect } from 'react';
import { paperService } from '../services/api';
import { 
  Printer, 
  Download, 
  Copy, 
  Check, 
  ArrowLeft, 
  Edit3
} from 'lucide-react';

interface PaperPreviewPageProps {
  paperId: string;
  paperData?: any;
  setActivePage: (page: string) => void;
  showToast: (title: string, message?: string, type?: 'success' | 'error' | 'info') => void;
}

export const PaperPreviewPage: React.FC<PaperPreviewPageProps> = ({
  paperId,
  paperData: initialData,
  setActivePage,
  showToast
}) => {
  const [paper, setPaper] = useState<any>(initialData || null);
  const [loading, setLoading] = useState(!initialData && !!paperId);
  const [includeAnswers, setIncludeAnswers] = useState(false);
  const [copied, setCopied] = useState(false);

  // Editable Header Fields
  const [schoolName, setSchoolName] = useState(initialData?.school_name || "TeachGenie Model School");
  const [teacherName, setTeacherName] = useState(initialData?.teacher_name || "");
  const [instructions, setInstructions] = useState(initialData?.instructions || "Attempt all questions. Read instructions carefully.");
  const [isEditingHeader, setIsEditingHeader] = useState(false);

  useEffect(() => {
    if (paperId && !initialData) {
      const fetchPaper = async () => {
        setLoading(true);
        try {
          const data = await paperService.getPaperById(paperId);
          setPaper(data);
          setSchoolName(data.school_name || "TeachGenie Model School");
          setTeacherName(data.teacher_name || "");
          setInstructions(data.instructions || "Attempt all questions. Read instructions carefully.");
        } catch (err) {
          showToast('Error', 'Failed to load question paper preview.', 'error');
        } finally {
          setLoading(false);
        }
      };
      fetchPaper();
    }
  }, [paperId]);

  if (loading) {
    return (
      <div className="py-20 text-center text-slate-400 space-y-3">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs font-semibold">Preparing print preview...</p>
      </div>
    );
  }

  if (!paper) {
    return (
      <div className="py-20 text-center space-y-4">
        <p className="text-sm font-bold text-slate-700">No question paper selected for preview.</p>
        <button onClick={() => setActivePage('dashboard')} className="btn-primary px-4 py-2 rounded-xl text-xs font-bold">
          Return to Dashboard
        </button>
      </div>
    );
  }

  const allQuestions = paper.questions || [
    ...(paper.very_short_questions || []),
    ...(paper.short_questions || []),
    ...(paper.long_questions || [])
  ];

  const vsQuestions = allQuestions.filter((q: any) => q.question_type.includes("Very Short"));
  const sQuestions = allQuestions.filter((q: any) => q.question_type.includes("Short") && !q.question_type.includes("Very"));
  const lQuestions = allQuestions.filter((q: any) => q.question_type.includes("Long"));

  const handlePrint = () => {
    window.print();
  };

  const handleCopyAll = () => {
    let text = `${schoolName}\nEXAMINATION QUESTION PAPER: ${paper.chapter_title || paper.title}\nSubject: ${paper.subject} | Grade: ${paper.grade} | Total Marks: ${paper.total_marks}\n\n`;
    text += `Instructions: ${instructions}\n\n`;

    let cnt = 1;
    allQuestions.forEach((q: any) => {
      text += `Q${cnt}. ${q.question_text} [${q.marks} Marks]\n`;
      cnt++;
    });

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    showToast('Copied to Clipboard', 'Full question paper text copied.', 'success');
  };

  const handleDownloadDocx = () => {
    if (paper.id) {
      window.open(paperService.getExportDocxUrl(paper.id, includeAnswers), '_blank');
    } else {
      showToast('Save Required', 'Please save the paper first to export DOCX.', 'info');
    }
  };

  const handleDownloadPdf = () => {
    if (paper.id) {
      window.open(paperService.getExportPdfUrl(paper.id, includeAnswers), '_blank');
    } else {
      showToast('Save Required', 'Please save the paper first to export PDF.', 'info');
    }
  };

  let globalCounter = 1;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
        <button
          onClick={() => setActivePage('editor')}
          className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Question Editor</span>
        </button>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <label className="flex items-center space-x-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 cursor-pointer">
            <input
              type="checkbox"
              checked={includeAnswers}
              onChange={(e) => setIncludeAnswers(e.target.checked)}
              className="rounded text-blue-600"
            />
            <span className="font-semibold text-slate-700">Include Answer Key</span>
          </label>

          <button
            onClick={handleCopyAll}
            className="px-3.5 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-xl font-bold flex items-center space-x-1.5 transition-colors cursor-pointer"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            <span>Copy All</span>
          </button>

          <button
            onClick={handleDownloadDocx}
            className="px-3.5 py-2 bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 rounded-xl font-bold flex items-center space-x-1.5 transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4 text-blue-600" />
            <span>Word DOCX</span>
          </button>

          <button
            onClick={handleDownloadPdf}
            className="px-3.5 py-2 bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 rounded-xl font-bold flex items-center space-x-1.5 transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4 text-indigo-600" />
            <span>PDF File</span>
          </button>

          <button
            onClick={handlePrint}
            className="btn-primary px-4 py-2 rounded-xl font-bold flex items-center space-x-1.5 shadow-md cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print Paper</span>
          </button>
        </div>
      </div>

      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs space-y-3 no-print">
        <div className="flex items-center justify-between">
          <span className="font-bold text-slate-800 flex items-center space-x-1.5">
            <Edit3 className="w-4 h-4 text-blue-600" />
            <span>Customize Exam Paper Header (For School Branding)</span>
          </span>
          <button
            onClick={() => setIsEditingHeader(!isEditingHeader)}
            className="text-blue-600 font-bold hover:underline"
          >
            {isEditingHeader ? 'Done Editing' : 'Edit Header Details'}
          </button>
        </div>

        {isEditingHeader && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">School / Institution Name:</label>
              <input
                type="text"
                value={schoolName}
                onChange={(e) => setSchoolName(e.target.value)}
                className="w-full p-2 bg-white rounded-lg border border-slate-300"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Teacher Name:</label>
              <input
                type="text"
                value={teacherName}
                onChange={(e) => setTeacherName(e.target.value)}
                placeholder="e.g. Prof. R. Sharma"
                className="w-full p-2 bg-white rounded-lg border border-slate-300"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">General Instructions:</label>
              <input
                type="text"
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                className="w-full p-2 bg-white rounded-lg border border-slate-300"
              />
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-3xl border border-slate-300 p-8 sm:p-12 shadow-xl print-area space-y-8 font-sans">
        <div className="text-center space-y-2 border-b border-slate-900 pb-6">
          <h2 className="text-2xl font-extrabold uppercase tracking-wide text-slate-900">
            {schoolName}
          </h2>
          <h3 className="text-lg font-bold text-slate-800 uppercase tracking-tight">
            EXAMINATION QUESTION PAPER: {paper.chapter_title || paper.title}
          </h3>

          <div className="grid grid-cols-3 gap-2 border border-slate-400 p-3 rounded-lg text-xs font-bold text-slate-800 mt-4 bg-slate-50/50">
            <div>Subject: {paper.subject}</div>
            <div>Class/Grade: {paper.grade}</div>
            <div>Total Marks: {paper.total_marks}</div>
            <div>Board: {paper.board || 'General'}</div>
            <div>Teacher: {teacherName || 'N/A'}</div>
            <div>Time Allowed: 2 Hours</div>
          </div>

          <div className="flex justify-between items-center text-xs font-bold text-slate-800 pt-3 px-2">
            <div>Student Name: ___________________________</div>
            <div>Roll No / ID: _____________________</div>
          </div>

          {instructions && (
            <p className="text-xs text-slate-600 italic pt-2">
              <b>General Instructions:</b> {instructions}
            </p>
          )}
        </div>

        {vsQuestions.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-blue-900 uppercase border-b border-blue-200 pb-1">
              SECTION A: VERY SHORT ANSWER QUESTIONS ({vsQuestions.length} x {vsQuestions[0]?.marks || 2} = {vsQuestions.length * (vsQuestions[0]?.marks || 2)} Marks)
            </h3>
            <div className="space-y-3 text-sm text-slate-900">
              {vsQuestions.map((q: any) => {
                const currentNum = globalCounter++;
                return (
                  <div key={q.id} className="flex justify-between items-start leading-relaxed">
                    <div>
                      <span className="font-bold mr-2">Q{currentNum}.</span>
                      <span>{q.question_text}</span>
                    </div>
                    <span className="font-bold text-xs text-slate-500 whitespace-nowrap ml-4">
                      [{q.marks} {q.marks === 1 ? 'Mark' : 'Marks'}]
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {sQuestions.length > 0 && (
          <div className="space-y-4 pt-2">
            <h3 className="text-sm font-bold text-blue-900 uppercase border-b border-blue-200 pb-1">
              SECTION B: SHORT ANSWER QUESTIONS ({sQuestions.length} x {sQuestions[0]?.marks || 4} = {sQuestions.length * (sQuestions[0]?.marks || 4)} Marks)
            </h3>
            <div className="space-y-3 text-sm text-slate-900">
              {sQuestions.map((q: any) => {
                const currentNum = globalCounter++;
                return (
                  <div key={q.id} className="flex justify-between items-start leading-relaxed">
                    <div>
                      <span className="font-bold mr-2">Q{currentNum}.</span>
                      <span>{q.question_text}</span>
                    </div>
                    <span className="font-bold text-xs text-slate-500 whitespace-nowrap ml-4">
                      [{q.marks} Marks]
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {lQuestions.length > 0 && (
          <div className="space-y-4 pt-2">
            <h3 className="text-sm font-bold text-blue-900 uppercase border-b border-blue-200 pb-1">
              SECTION C: LONG ANSWER QUESTIONS ({lQuestions.length} x {lQuestions[0]?.marks || 8} = {lQuestions.length * (lQuestions[0]?.marks || 8)} Marks)
            </h3>
            <div className="space-y-4 text-sm text-slate-900">
              {lQuestions.map((q: any) => {
                const currentNum = globalCounter++;
                return (
                  <div key={q.id} className="flex justify-between items-start leading-relaxed">
                    <div>
                      <span className="font-bold mr-2">Q{currentNum}.</span>
                      <span>{q.question_text}</span>
                    </div>
                    <span className="font-bold text-xs text-slate-500 whitespace-nowrap ml-4">
                      [{q.marks} Marks]
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {includeAnswers && (
          <div className="pt-12 border-t-2 border-dashed border-rose-300 space-y-6 page-break">
            <div className="text-center space-y-1">
              <h3 className="text-base font-extrabold text-rose-800 uppercase tracking-wider">
                OFFICIAL TEACHER ANSWER KEY & MARKING SCHEME
              </h3>
              <p className="text-xs text-rose-600 font-semibold">Strictly Confidential - For Evaluator Use Only</p>
            </div>

            <div className="space-y-4 text-xs text-slate-800">
              {allQuestions.map((q: any, i: number) => (
                <div key={q.id} className="bg-rose-50/50 p-4 rounded-xl border border-rose-200 space-y-1.5">
                  <div className="font-bold text-rose-900 flex justify-between">
                    <span>Q{i + 1}. ({q.question_type} - {q.marks} Marks)</span>
                    {q.expected_length && <span className="font-normal italic">Expected Length: {q.expected_length}</span>}
                  </div>
                  {q.answer && (
                    <p className="text-slate-700 italic"><b>Suggested Answer:</b> {q.answer}</p>
                  )}
                  {q.marking_points && q.marking_points.length > 0 && (
                    <div>
                      <b className="text-slate-800">Marking Scheme:</b>
                      <ul className="list-disc list-inside space-y-0.5 text-slate-600 pl-1">
                        {q.marking_points.map((pt: string, idx: number) => (
                          <li key={idx}>{pt}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
