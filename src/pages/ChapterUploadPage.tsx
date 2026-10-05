import React, { useState } from 'react';
import { documentService, questionService } from '../services/api';
import type { GenerateQuestionsRequest, SectionConfig, Chapter } from '../types';
import { 
  UploadCloud, 
  FileCheck, 
  Sparkles, 
  BookOpen, 
  Sliders, 
  AlertCircle,
  CheckCircle2,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Layers,
  HelpCircle
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

  // Chapter Detection & Manual Fallback State
  const [detectedChapters, setDetectedChapters] = useState<Chapter[]>([]);
  const [overallConfidence, setOverallConfidence] = useState<string>('high');
  const [selectedChapterId, setSelectedChapterId] = useState<string>('');
  const [isManualRangeMode, setIsManualRangeMode] = useState<boolean>(false);
  const [startPage, setStartPage] = useState<number>(1);
  const [endPage, setEndPage] = useState<number>(10);
  const [generationStage, setGenerationStage] = useState<string>('');

  // Metadata Fields
  const [chapterTitle, setChapterTitle] = useState('');
  const [subject, setSubject] = useState('Science');
  const [grade, setGrade] = useState('Grade 10');
  const [board, setBoard] = useState('CBSE / General');
  const [language, setLanguage] = useState('English');
  const [difficulty, setDifficulty] = useState('Medium');
  
  const [sections, setSections] = useState<SectionConfig[]>([
    {
      id: 'sec-1',
      name: 'Very Short Answer',
      type: 'Very Short Answer',
      enabled: true,
      question_count: 3,
      marks_per_question: 2,
      expected_length: '1-10 words',
      difficulty: 'Easy'
    },
    {
      id: 'sec-2',
      name: 'Short Answer',
      type: 'Short Answer',
      enabled: true,
      question_count: 3,
      marks_per_question: 4,
      expected_length: '40-60 words',
      difficulty: 'Medium'
    },
    {
      id: 'sec-3',
      name: 'Long Answer',
      type: 'Long Answer',
      enabled: true,
      question_count: 3,
      marks_per_question: 8,
      expected_length: '150-250 words',
      difficulty: 'Hard'
    }
  ]);

  const [specialInstructions, setSpecialInstructions] = useState('');

  const handleAddSection = () => {
    const newId = `sec-${Date.now()}`;
    const newSec: SectionConfig = {
      id: newId,
      name: `Custom Section ${sections.length + 1}`,
      type: 'Custom Section',
      enabled: true,
      question_count: 3,
      marks_per_question: 2,
      expected_length: '40-60 words',
      difficulty: 'Medium'
    };
    setSections([...sections, newSec]);
  };

  const handleRemoveSection = (index: number) => {
    if (sections.length <= 1) {
      showToast('Action Invalid', 'At least one section must remain.', 'info');
      return;
    }
    setSections(sections.filter((_, i) => i !== index));
  };

  const handleMoveSection = (index: number, direction: 'up' | 'down') => {
    if ((direction === 'up' && index === 0) || (direction === 'down' && index === sections.length - 1)) {
      return;
    }
    const next = [...sections];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const temp = next[index];
    next[index] = next[targetIndex];
    next[targetIndex] = temp;
    setSections(next);
  };

  const enabledSections = sections.filter(s => s.enabled);
  const totalQuestionsCount = enabledSections.reduce((sum, s) => sum + Number(s.question_count || 0), 0);
  const totalMarksCount = enabledSections.reduce((sum, s) => sum + (Number(s.question_count || 0) * Number(s.marks_per_question || 0)), 0);

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

  const formatErrorDetail = (err: any, fallbackMessage: string): string => {
    const detail = err.response?.data?.detail;
    if (typeof detail === 'string') return detail;
    if (Array.isArray(detail)) {
      return detail.map((d: any) => (typeof d === 'string' ? d : d.msg || JSON.stringify(d))).join('; ');
    }
    if (typeof detail === 'object' && detail !== null) {
      return JSON.stringify(detail);
    }
    if (err.response?.data?.message && typeof err.response.data.message === 'string') {
      return err.response.data.message;
    }
    if (err.message && typeof err.message === 'string') {
      return err.message;
    }
    return fallbackMessage;
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
      setDetectedChapters(res.chapters || []);
      setOverallConfidence(res.overall_confidence || 'high');

      if (res.chapters && res.chapters.length > 1) {
        setSelectedChapterId(''); // Default to All Chapters
        showToast('Document Processed', `✓ ${res.chapters.length} chapters detected automatically!`, 'success');
      } else {
        showToast('Document Processed', `Extracted ${res.word_count} words successfully.`, 'success');
      }
    } catch (err: any) {
      setError(formatErrorDetail(err, 'Failed to extract text from document.'));
    } finally {
      setExtracting(false);
    }
  };

  const handleGenerate = async () => {
    if (!chapterTitle.trim() && !selectedChapterId) {
      setError('Please provide a Chapter Title or select a chapter.');
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
        setDetectedChapters(res.chapters || []);
        setOverallConfidence(res.overall_confidence || 'high');
      } catch (err: any) {
        setError(formatErrorDetail(err, 'Failed to extract text from document.'));
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
      let chapId: string | undefined = undefined;
      let startP: number | undefined = undefined;
      let endP: number | undefined = undefined;

      if (isManualRangeMode) {
        startP = startPage;
        endP = endPage;
        setGenerationStage(`Extracting pages ${startPage} to ${endPage}...`);
      } else if (selectedChapterId) {
        chapId = selectedChapterId;
        const selectedChapObj = detectedChapters.find(c => c.id === selectedChapterId);
        setGenerationStage(`Retrieving ONLY ${selectedChapObj ? selectedChapObj.title : 'Selected Chapter'} content...`);
      } else {
        setGenerationStage("Preparing entire document content...");
      }

      await new Promise(r => setTimeout(r, 400));
      setGenerationStage("Generating questions with strict chapter safeguards...");

      const req: GenerateQuestionsRequest = {
        document_id: currentDocId,
        chapter_id: chapId,
        start_page: startP,
        end_page: endP,
        chapter_title: chapterTitle || 'Chapter Questions',
        subject,
        grade,
        board,
        language,
        difficulty,
        sections: enabledSections,
        marks_distribution: {
          very_short: 2,
          short: 4,
          long: 8
        },
        special_instructions: specialInstructions,
        raw_content: contentToUse
      };

      const result = await questionService.generate(req);
      setGenerationStage("Validating question sources & anti-hallucination safeguards...");
      await new Promise(r => setTimeout(r, 300));

      setGeneratedPaperData({
        ...result,
        document_id: currentDocId,
        chapter_text: contentToUse,
        school_name: "TeachGenie Model School",
        teacher_name: "",
        instructions: "Attempt all questions. Read instructions carefully."
      });

      const selectedName = selectedChapterId 
        ? (detectedChapters.find(c => c.id === selectedChapterId)?.title || 'Selected Chapter')
        : (isManualRangeMode ? `Pages ${startPage}-${endPage}` : 'Selected Chapter');

      showToast('Questions Generated', `Generated ${totalQuestionsCount} questions (${totalMarksCount} Marks) from ${selectedName}!`, 'success');
      setActivePage('editor');
    } catch (err: any) {
      setError(formatErrorDetail(err, 'AI question generation failed. Please try again.'));
    } finally {
      setGenerating(false);
      setGenerationStage('');
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
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                <span className="flex items-center space-x-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Document Extracted Successfully</span>
                </span>
                <span className="px-2 py-0.5 bg-slate-200 rounded text-[11px] text-slate-700 font-mono">
                  {wordCount} Words
                </span>
              </div>

              {detectedChapters.length > 0 && (
                <div className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50/60 rounded-xl border border-blue-200/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Layers className="w-4 h-4 text-blue-600" />
                      <span className="font-extrabold text-xs text-slate-800">
                        {detectedChapters.length} Chapters Auto-Detected
                      </span>
                    </div>
                    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                      overallConfidence === 'high' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-amber-100 text-amber-800 border border-amber-300'
                    }`}>
                      Confidence: {overallConfidence.toUpperCase()}
                    </span>
                  </div>

                  {overallConfidence === 'low' && (
                    <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 flex items-start space-x-2">
                      <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <span>Chapter boundaries could not be determined confidently. Please verify boundaries or select manual page range.</span>
                    </div>
                  )}

                  {!isManualRangeMode ? (
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-700">Select Target Chapter *</label>
                      <select
                        value={selectedChapterId}
                        onChange={(e) => {
                          const id = e.target.value;
                          setSelectedChapterId(id);
                          if (id) {
                            const chap = detectedChapters.find(c => c.id === id);
                            if (chap) setChapterTitle(chap.title);
                          } else {
                            setChapterTitle(file ? file.name.replace(/\.[^/.]+$/, "") : 'All Chapters');
                          }
                        }}
                        className="w-full p-2.5 rounded-xl border border-blue-300 bg-white text-xs font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 shadow-xs"
                      >
                        <option value="">[All Chapters] — Generate questions from entire document</option>
                        {detectedChapters.map((ch) => (
                          <option key={ch.id} value={ch.id}>
                            Chapter {ch.chapter_number}: {ch.title} (Pages {ch.start_page}–{ch.end_page})
                          </option>
                        ))}
                      </select>

                      <div className="flex justify-end pt-0.5">
                        <button
                          type="button"
                          onClick={() => setIsManualRangeMode(true)}
                          className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 underline flex items-center space-x-1 cursor-pointer"
                        >
                          <HelpCircle className="w-3 h-3 mr-0.5" />
                          <span>Can't find your chapter? Select page range manually</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 bg-white rounded-xl border border-indigo-200 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-extrabold text-indigo-900">Manual Chapter Page Range Selection</span>
                        <button
                          type="button"
                          onClick={() => setIsManualRangeMode(false)}
                          className="text-[11px] text-slate-500 hover:text-slate-800 underline font-semibold cursor-pointer"
                        >
                          Switch to Auto-Detected Chapters
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <label className="block font-bold text-slate-700 mb-1">Start Page</label>
                          <input
                            type="number"
                            min="1"
                            value={startPage}
                            onChange={(e) => setStartPage(Math.max(1, parseInt(e.target.value) || 1))}
                            className="w-full p-2 rounded-lg border border-slate-300 font-bold bg-slate-50 text-center"
                          />
                        </div>
                        <div>
                          <label className="block font-bold text-slate-700 mb-1">End Page</label>
                          <input
                            type="number"
                            min={startPage}
                            value={endPage}
                            onChange={(e) => setEndPage(Math.max(startPage, parseInt(e.target.value) || startPage))}
                            className="w-full p-2 rounded-lg border border-slate-300 font-bold bg-slate-50 text-center"
                          />
                        </div>
                      </div>
                      <p className="text-[11px] text-slate-500 italic">
                        Questions will be generated ONLY from pages {startPage} to {endPage}.
                      </p>
                    </div>
                  )}
                </div>
              )}

              <div className="max-h-28 overflow-y-auto text-xs text-slate-600 font-mono p-2.5 bg-white rounded-xl border border-slate-200 leading-relaxed">
                {extractedText.substring(0, 400)}...
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
              <div className="flex items-center justify-between mb-2">
                <label className="block font-bold text-slate-700">Question Sections & Total Marks</label>
                <div className="flex items-center space-x-2 text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-200">
                  <span>Total: {totalQuestionsCount} Qs</span>
                  <span>•</span>
                  <span>{totalMarksCount} Marks</span>
                </div>
              </div>

              <div className="space-y-3">
                {sections.map((sec, idx) => (
                  <div key={sec.id || idx} className={`p-3.5 rounded-2xl border transition-all ${sec.enabled ? 'bg-slate-50/80 border-slate-200 shadow-2xs' : 'bg-slate-100/50 border-slate-200 opacity-60'}`}>
                    <div className="flex items-center justify-between mb-2 gap-2">
                      <div className="flex items-center space-x-2 flex-1 min-w-0">
                        <input
                          type="checkbox"
                          checked={sec.enabled}
                          onChange={(e) => {
                            const next = [...sections];
                            next[idx].enabled = e.target.checked;
                            setSections(next);
                          }}
                          className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer shrink-0"
                        />
                        <input
                          type="text"
                          value={sec.name}
                          onChange={(e) => {
                            const next = [...sections];
                            next[idx].name = e.target.value;
                            setSections(next);
                          }}
                          className="text-xs font-bold text-slate-800 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-indigo-500 px-1 py-0.5 focus:outline-hidden w-full"
                        />
                      </div>

                      <div className="flex items-center space-x-1 shrink-0">
                        <span className="text-[10px] font-bold px-2 py-0.5 bg-indigo-100 text-indigo-800 rounded-md">
                          Subtotal: {Number(sec.question_count || 0) * Number(sec.marks_per_question || 0)} Marks
                        </span>

                        <button
                          type="button"
                          onClick={() => handleMoveSection(idx, 'up')}
                          disabled={idx === 0}
                          title="Move Up"
                          className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30 cursor-pointer"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveSection(idx, 'down')}
                          disabled={idx === sections.length - 1}
                          title="Move Down"
                          className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30 cursor-pointer"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveSection(idx)}
                          title="Delete Section"
                          className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {sec.enabled && (
                      <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                        <div>
                          <span className="text-slate-500 block mb-0.5 font-semibold">Questions Count</span>
                          <input
                            type="number"
                            min="1"
                            max="50"
                            value={sec.question_count}
                            onChange={(e) => {
                              const next = [...sections];
                              next[idx].question_count = Math.max(1, Math.min(50, Number(e.target.value)));
                              setSections(next);
                            }}
                            className="w-full p-1.5 rounded-lg border border-slate-300 font-bold bg-white text-center"
                          />
                        </div>
                        <div>
                          <span className="text-slate-500 block mb-0.5 font-semibold">Marks Per Question</span>
                          <input
                            type="number"
                            min="1"
                            max="100"
                            value={sec.marks_per_question}
                            onChange={(e) => {
                              const next = [...sections];
                              next[idx].marks_per_question = Math.max(1, Math.min(100, Number(e.target.value)));
                              setSections(next);
                            }}
                            className="w-full p-1.5 rounded-lg border border-slate-300 font-bold bg-white text-center"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                <button
                  type="button"
                  onClick={handleAddSection}
                  className="w-full py-2 bg-indigo-50 border border-dashed border-indigo-300 text-indigo-700 hover:bg-indigo-100 rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Custom Question Section</span>
                </button>
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

          <div className="pt-2 space-y-2">
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="btn-primary w-full py-4 rounded-2xl text-sm font-extrabold flex items-center justify-center space-x-2 cursor-pointer shadow-xl disabled:opacity-50"
            >
              {generating ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>{generationStage || `Generating ${totalQuestionsCount} AI Questions (${totalMarksCount} Marks)...`}</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 animate-pulse" />
                  <span>Generate {totalQuestionsCount} AI Questions ({totalMarksCount} Marks)</span>
                </>
              )}
            </button>
            {generating && generationStage && (
              <p className="text-[11px] text-center font-bold text-indigo-600 animate-pulse">
                {generationStage}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
