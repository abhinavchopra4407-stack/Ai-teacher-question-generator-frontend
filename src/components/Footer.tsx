import React from 'react';
import { Sparkles, ShieldCheck, Heart } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 text-slate-300 border-t border-slate-800 pt-12 pb-8 mt-20 no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold">
                <Sparkles className="w-5 h-5" />
              </div>
              <span className="text-xl font-bold text-white tracking-tight">TeachGenie<span className="text-cyan-400">.AI</span></span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Empowering teachers worldwide with AI-driven, chapter-grounded question paper creation in seconds.
            </p>
            <div className="flex items-center space-x-2 text-xs text-emerald-400 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700 w-fit">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Row-Level Data Security</span>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-3">Core Features</h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li className="hover:text-white cursor-pointer">Exact 3-Section Distribution (3/3/3)</li>
              <li className="hover:text-white cursor-pointer">PDF & Word DOCX Document OCR</li>
              <li className="hover:text-white cursor-pointer">Single Question Regeneration</li>
              <li className="hover:text-white cursor-pointer">AI Answer Key & Marking Schemes</li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-3">Curriculum Support</h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li className="hover:text-white cursor-pointer">CBSE / ICSE / State Boards</li>
              <li className="hover:text-white cursor-pointer">Classes Grade 1 to 12 & Higher Ed</li>
              <li className="hover:text-white cursor-pointer">English & Hindi Language Support</li>
              <li className="hover:text-white cursor-pointer">Custom Difficulty Scaling</li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-3">Security & Compliance</h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li className="hover:text-white cursor-pointer">End-to-End JWT Session Security</li>
              <li className="hover:text-white cursor-pointer">Private Teacher Data Isolation</li>
              <li className="hover:text-white cursor-pointer">Zero Content Hallucination Engine</li>
              <li className="hover:text-white cursor-pointer">Teacher Custom API Key Option</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-800 pt-6 flex flex-col sm:flex-row justify-between items-center text-xs text-slate-500">
          <p>© {new Date().getFullYear()} TeachGenie AI Inc. All rights reserved.</p>
          <p className="flex items-center space-x-1 mt-2 sm:mt-0">
            <span>Built with precision for Teachers worldwide</span>
            <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500 ml-1" />
          </p>
        </div>
      </div>
    </footer>
  );
};
