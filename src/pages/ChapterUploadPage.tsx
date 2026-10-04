import React, { useState } from 'react';
import { documentService, questionService } from '../services/api';
import type { GenerateQuestionsRequest } from '../types';
import { 
  UploadCloud, 
  FileCheck, 
  Sparkles, 
  BookOpen, 
  Sliders, 
  AlertCircle,
  CheckCircle2
} from 'lucide-react';

interface ChapterUploadPageProps {
  setActivePage: (page: string) => void;
  setGeneratedPaperData: (data: any) => void;
  setChapterText: (text: string) => void;
  showToast: (title: string, message?: string, type?: 'success' | 'error' | 'info') => void;
}

export const ChapterUploadPage: React.FC<ChapterUploadPageProps> = ({
  setActivePage,
  setGeneratedPaperData,
  setChapterText,
  showToast
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'paste'>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [rawText, setRawText] = useState('');
  const [extractedText, setExtractedText] = useState('');
  const [wordCount, setWordCount] = useState(0);
  const [documentId, setDocumentId] = useState<string | undefined>(undefined);

  // Metadata Fields
  const [chapterTitle, setChapterTitle] = useState('');
  const [subject, setSubject] = useState('Science');
  const [grade, setGrade] = useState('Grade 10');
  const [board, setBoard] = useState('CBSE / General');
  const [language, setLanguage] = useState('English');
  const [difficulty, setDifficulty] = useState('Medium');
  const [veryShortMarks, setVeryShortMarks] = useState(2);
  const [shortMarks, setShortMarks] = useState(4);
  const [longMarks, setLongMarks] = useState(8);
  const [specialInstructions, setSpecialInstructions] = useState('');

  const [extracting, setExtracting] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      if (selected.size > 15 * 1024 * 1024) {
        setError('File exceeds maximum size of 15MB.');
        return;
      }
      setFile(selected);
      setError('');
      if (!chapterTitle) {
        const cleanName = selected.name.replace(/\.[^/.]+$/, "").replace(/_/g, " ");
        setChapterTitle(cleanName);
      }
    }
  };

  const handleProcessDocument = async () => {
    setError('');
    setExtracting(true);

    try {
      const formData = new FormData();
      if (activeTab === 'upload' && file) {
        formData.append('file', file);
        formData.append('title', chapterTitle || file.name);
      } else if (activeTab === 'paste' && rawText.trim()) {
        formData.append('raw_text', rawText);
        formData.append('title', chapterTitle || 'Pasted Chapter Content');
      } else {
        setError('Please select a file or enter text to process.');
        setExtracting(false);
        return;
      }

      const res = await documentService.upload(formData);
      setExtractedText(res.extracted_text);
      setWordCount(res.word_count);
      setDocumentId(res.document_id);
      setChapterText(res.extracted_text);
      showToast('Document Processed', `Extracted ${res.word_count} words successfully.`, 'success');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to extract text from document.');
    } finally {
      setExtracting(false);
    }
  };

  const handleGenerate = async () => {
    if (!chapterTitle.trim()) {
      setError('Please provide a Chapter Title.');
      return;
    }

    let contentToUse = extractedText || rawText;
    let currentDocId = documentId;

    if (activeTab === 'upload' && file && !extractedText) {
      setExtracting(true);
      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('title', chapterTitle || file.name);
        const res = await documentService.upload(formData);
        contentToUse = res.extracted_text;
        currentDocId = res.document_id;
        setExtractedText(res.extracted_text);
        setWordCount(res.word_count);
        setDocumentId(res.document_id);
        setChapterText(res.extracted_text);
      } catch (err: any) {
        setError(err.response?.data?.detail || 'Failed to extract text from document.');
        setExtracting(false);
        return;
      } finally {
        setExtracting(false);
      }
    }

    if (!contentToUse || contentToUse.trim().length < 20) {
      setError('Please extract or paste chapter content before generating questions.');
      return;
    }

    setError('');
    setGenerating(true);

    try {
      const req: GenerateQuestionsRequest = {
        document_id: currentDocId,
        chapter_title: chapterTitle,
        subject,
        grade,
        board,
        language,
        difficulty,
        marks_distribution: {
          very_short: Number(veryShortMarks),
          short: Number(shortMarks),
          long: Number(longMarks)
        },
        special_instructions: specialInstructions,
        raw_content: contentToUse
      };

      const result = await questionService.generate(req);
      setGeneratedPaperData({
        ...result,
        document_id: currentDocId,
        chapter_text: contentToUse,
        school_name: "TeachGenie Model School",
        teacher_name: "",
        instructions: "Attempt all questions. Read instructions carefully."
      });

      showToast('Questions Generated', 'Generated 3 Very Short, 3 Short, and 3 Long answer questions!', 'success');
      setActivePage('editor');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'AI question generation failed. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-16">
      <div className="text-center space-y-2">
        <span className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-bold uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5 mr-1 text-blue-600" /> AI Question Paper Generator
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Upload Chapter & Generate Questions
        </h1>
        <p className="text-slate-600 text-sm max-w-2xl mx-auto">
          Provide your chapter PDF, Word document, or paste text. TeachGenie AI will extract chapter concepts and generate exactly 9 balanced questions.
        </p>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-2xl text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-slate-200 pb-4">
            <h2 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
              <BookOpen className="w-5 h-5 text-blue-600" />
              <span>1. Chapter Content Source</span>
            </h2>

            <div className="flex bg-slate-100 p-1 rounded-xl">
              <button
                onClick={() => setActiveTab('upload')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'upload' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Upload File (PDF/DOCX)
              </button>
              <button
                onClick={() => setActiveTab('paste')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'paste' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Paste Chapter Text
              </button>
            </div>
          </div>

          {activeTab === 'upload' ? (
            <div className="space-y-4">
              <div className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-2xl p-8 text-center transition-colors bg-slate-50/50 relative">
                <input
                  type="file"
                  accept=".pdf,.docx,.txt"
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <UploadCloud className="w-12 h-12 text-blue-600 mx-auto mb-3" />
                <p className="text-sm font-bold text-slate-800">
                  {file ? file.name : 'Drag and drop your PDF or Word DOCX file here'}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Supports PDF, DOCX Word documents, and TXT files up to 15MB
                </p>
              </div>

              {file && (
                <div className="flex items-center justify-between p-3 bg-blue-50/80 rounded-xl text-xs text-blue-900 border border-blue-200">
                  <div className="flex items-center space-x-2">
                    <FileCheck className="w-4 h-4 text-blue-600" />
                    <span className="font-semibold">{file.name}</span>
                    <span className="text-[10px] text-slate-500">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                  </div>
                  <button
                    onClick={handleProcessDocument}
                    disabled={extracting}
                    className="px-3 py-1.5 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {extracting ? 'Extracting...' : 'Extract Text'}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-700">Paste Chapter Content:</label>
              <textarea
                value={rawText}
                onChange={(e) => {
                  setRawText(e.target.value);
                  setWordCount(e.target.value.split(/\s+/).filter(Boolean).length);
                  setChapterText(e.target.value);
                }}
                rows={10}
                placeholder="Paste the chapter text, lecture notes, or textbook content here..."
                className="w-full text-sm p-3.5 rounded-2xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-slate-50/30"
              />
            </div>
          )}

          {extractedText && (
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                <span className="flex items-center space-x-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Text Ready for AI Question Generation</span>
                </span>
                <span className="px-2 py-0.5 bg-slate-200 rounded text-[11px] text-slate-700">
                  {wordCount} Words
                </span>
              </div>
              <div className="max-h-36 overflow-y-auto text-xs text-slate-600 font-mono p-2.5 bg-white rounded-xl border border-slate-200 leading-relaxed">
                {extractedText.substring(0, 500)}...
              </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-5">
          <h2 className="text-lg font-bold text-slate-900 border-b border-slate-200 pb-4 flex items-center space-x-2">
            <Sliders className="w-5 h-5 text-indigo-600" />
            <span>2. Question Paper Metadata</span>
          </h2>

          <div className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Chapter Title *</label>
              <input
                type="text"
                required
                value={chapterTitle}
                onChange={(e) => setChapterTitle(e.target.value)}
                placeholder="e.g. Chapter 4: Light Reflection and Refraction"
                className="w-full p-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Subject</label>
                <select
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 bg-white font-medium"
                >
                  <option value="Science">Science / Physics</option>
                  <option value="Chemistry">Chemistry</option>
                  <option value="Biology">Biology</option>
                  <option value="Mathematics">Mathematics</option>
                  <option value="Social Science">Social Science / History</option>
                  <option value="Geography">Geography</option>
                  <option value="English">English Literature</option>
                  <option value="Computer Science">Computer Science / IT</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Class / Grade</label>
                <select
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 bg-white font-medium"
                >
                  <option value="Grade 6">Grade 6</option>
                  <option value="Grade 7">Grade 7</option>
                  <option value="Grade 8">Grade 8</option>
                  <option value="Grade 9">Grade 9</option>
                  <option value="Grade 10">Grade 10</option>
                  <option value="Grade 11">Grade 11</option>
                  <option value="Grade 12">Grade 12</option>
                  <option value="Higher Ed">Undergraduate / College</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Education Board</label>
                <select
                  value={board}
                  onChange={(e) => setBoard(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 bg-white font-medium"
                >
                  <option value="CBSE / General">CBSE / General</option>
                  <option value="ICSE">ICSE</option>
                  <option value="State Board">State Board</option>
                  <option value="Cambridge / IB">Cambridge / IB</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Language</label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 bg-white font-medium"
                >
                  <option value="English">English</option>
                  <option value="Hindi">Hindi (हिंदी)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Difficulty Level</label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-300 bg-white font-medium"
              >
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Marks per Question Category</label>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <span className="text-[10px] text-slate-500 block">Very Short (3)</span>
                  <input
                    type="number"
                    value={veryShortMarks}
                    onChange={(e) => setVeryShortMarks(Number(e.target.value))}
                    className="w-full p-2 rounded-lg border border-slate-300 text-center font-bold"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">Short (3)</span>
                  <input
                    type="number"
                    value={shortMarks}
                    onChange={(e) => setShortMarks(Number(e.target.value))}
                    className="w-full p-2 rounded-lg border border-slate-300 text-center font-bold"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">Long (3)</span>
                  <input
                    type="number"
                    value={longMarks}
                    onChange={(e) => setLongMarks(Number(e.target.value))}
                    className="w-full p-2 rounded-lg border border-slate-300 text-center font-bold"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Optional Special Instructions</label>
              <input
                type="text"
                value={specialInstructions}
                onChange={(e) => setSpecialInstructions(e.target.value)}
                placeholder="e.g. Focus on definitions and diagram-based questions"
                className="w-full p-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="btn-primary w-full py-4 rounded-2xl text-sm font-extrabold flex items-center justify-center space-x-2 cursor-pointer shadow-xl disabled:opacity-50"
            >
              {generating ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Generating 9 AI Questions...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 animate-pulse" />
                  <span>Generate 9 AI Questions</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
