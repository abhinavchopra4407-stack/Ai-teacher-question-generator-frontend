import React from 'react';
import { 
  Sparkles, 
  Zap, 
  Download, 
  ShieldCheck, 
  ArrowRight, 
  BookOpen, 
  Layers,
  Award
} from 'lucide-react';

interface LandingPageProps {
  setActivePage: (page: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ setActivePage }) => {
  return (
    <div className="space-y-20 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-16 lg:pt-20 lg:pb-24">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/10 via-indigo-900/5 to-transparent -z-10 pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
          
          <div className="inline-flex items-center space-x-2 bg-blue-50 border border-blue-200 text-blue-800 px-4 py-1.5 rounded-full text-xs font-bold tracking-wide shadow-xs animate-bounce">
            <Sparkles className="w-4 h-4 text-blue-600" />
            <span>AI-Powered Chapter Question Generator for Educators</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight max-w-4xl mx-auto">
            Create Exam-Ready Question Papers in <span className="bg-gradient-to-r from-blue-700 via-indigo-600 to-cyan-600 bg-clip-text text-transparent">Minutes</span>
          </h1>

          <p className="text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto font-normal leading-relaxed">
            Upload any chapter PDF or Word document. TeachGenie AI reads the content, understands key concepts, and generates balanced, high-quality question papers automatically.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <button
              onClick={() => setActivePage('register')}
              className="btn-primary w-full sm:w-auto px-8 py-4 rounded-xl text-base font-bold flex items-center justify-center space-x-2 cursor-pointer shadow-lg"
            >
              <span>Get Started Free</span>
              <ArrowRight className="w-5 h-5 ml-1" />
            </button>
            <button
              onClick={() => setActivePage('login')}
              className="w-full sm:w-auto px-8 py-4 rounded-xl text-base font-bold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 transition-colors cursor-pointer shadow-xs"
            >
              Teacher Login
            </button>
          </div>

          {/* Quick Metrics */}
          <div className="pt-10 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto text-center border-t border-slate-200/80">
            <div>
              <p className="text-3xl font-extrabold text-blue-900">9 Questions</p>
              <p className="text-xs font-semibold text-slate-500 mt-1">Exact 3/3/3 Category Balance</p>
            </div>
            <div>
              <p className="text-3xl font-extrabold text-indigo-900">100% Grounded</p>
              <p className="text-xs font-semibold text-slate-500 mt-1">Strict Chapter Accuracy</p>
            </div>
            <div>
              <p className="text-3xl font-extrabold text-cyan-900">PDF & Word</p>
              <p className="text-xs font-semibold text-slate-500 mt-1">Instant Document OCR</p>
            </div>
            <div>
              <p className="text-3xl font-extrabold text-emerald-900">Answer Key</p>
              <p className="text-xs font-semibold text-slate-500 mt-1">Auto Marking Schemes</p>
            </div>
          </div>
        </div>
      </section>

      {/* 3-Step Workflow Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-widest text-blue-600">Simple 3-Step Process</h2>
          <p className="text-3xl font-extrabold text-slate-900">How TeachGenie AI Works</p>
          <p className="text-slate-600 text-sm">Save hours of manual question drafting with our intuitive workflow.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm relative group hover:-translate-y-1 transition-all duration-200">
            <div className="w-14 h-14 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center font-extrabold text-xl mb-6 group-hover:scale-110 transition-transform">
              1
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Upload Chapter Content</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Upload a textbook chapter in PDF, Word DOCX, or paste raw text. Choose subject, grade level, and language (English/Hindi).
            </p>
          </div>

          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm relative group hover:-translate-y-1 transition-all duration-200">
            <div className="w-14 h-14 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-extrabold text-xl mb-6 group-hover:scale-110 transition-transform">
              2
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">AI Question Generation</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              TeachGenie AI analyzes the text and creates 3 Very Short, 3 Short, and 3 Long answer questions with answer keys.
            </p>
          </div>

          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm relative group hover:-translate-y-1 transition-all duration-200">
            <div className="w-14 h-14 rounded-2xl bg-cyan-100 text-cyan-700 flex items-center justify-center font-extrabold text-xl mb-6 group-hover:scale-110 transition-transform">
              3
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Edit & Export</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Review, edit or regenerate questions, generate answer keys, and export professionally formatted PDF or Word DOCX exam papers.
            </p>
          </div>
        </div>
      </section>

      {/* Feature Highlights Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 rounded-3xl p-8 sm:p-12 text-white shadow-2xl">
          <div className="max-w-3xl mb-12 space-y-4">
            <span className="px-3 py-1 bg-blue-500/20 text-cyan-400 border border-blue-400/30 rounded-full text-xs font-bold uppercase tracking-wider">
              Designed For Educators
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold">Everything Teachers Need for Quality Assessments</h2>
            <p className="text-slate-300 text-sm">
              Built with pedagogical rigor to test definitions, conceptual understanding, and deep analytical reasoning.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/10 space-y-3">
              <Layers className="w-8 h-8 text-cyan-400" />
              <h4 className="text-lg font-bold">Strict 3-Tier Distribution</h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                Guarantees 3 Very Short, 3 Short, and 3 Long answer questions every single time for balanced tests.
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/10 space-y-3">
              <Award className="w-8 h-8 text-indigo-400" />
              <h4 className="text-lg font-bold">Official Answer Keys</h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                Generates model answers, bulleted marking points, and expected answer length for easy grading.
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/10 space-y-3">
              <Zap className="w-8 h-8 text-amber-400" />
              <h4 className="text-lg font-bold">Single-Question Regeneration</h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                Don't like a specific question? Click one button to regenerate just that single question instantly.
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/10 space-y-3">
              <Download className="w-8 h-8 text-emerald-400" />
              <h4 className="text-lg font-bold">PDF & Word DOCX Export</h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                Download ready-to-print PDFs or fully editable Word documents formatted with your school name & header.
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/10 space-y-3">
              <BookOpen className="w-8 h-8 text-rose-400" />
              <h4 className="text-lg font-bold">Multilingual & Boards</h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                Full support for English and Hindi questions across CBSE, ICSE, and State curricula.
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/10 space-y-3">
              <ShieldCheck className="w-8 h-8 text-teal-400" />
              <h4 className="text-lg font-bold">Row-Level Security</h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                Database-enforced isolation guarantees your saved chapters and question papers remain 100% private.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Final Call to Action */}
      <section className="max-w-4xl mx-auto text-center px-4 space-y-6">
        <h2 className="text-3xl font-extrabold text-slate-900">Ready to Transform Question Paper Creation?</h2>
        <p className="text-slate-600 text-sm">Join thousands of teachers saving time and elevating classroom assessments.</p>
        <button
          onClick={() => setActivePage('register')}
          className="btn-primary px-8 py-4 rounded-xl text-base font-bold shadow-xl cursor-pointer"
        >
          Create Your First Question Paper Now
        </button>
      </section>
    </div>
  );
};
