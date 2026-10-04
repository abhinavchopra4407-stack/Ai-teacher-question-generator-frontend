import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { ToastContainer } from './components/Toast';
import type { ToastMessage } from './components/Toast';

import { LandingPage } from './pages/LandingPage';
import { RegisterPage } from './pages/RegisterPage';
import { LoginPage } from './pages/LoginPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { DashboardPage } from './pages/DashboardPage';
import { ChapterUploadPage } from './pages/ChapterUploadPage';
import { QuestionEditorPage } from './pages/QuestionEditorPage';
import { SavedPapersPage } from './pages/SavedPapersPage';
import { PaperPreviewPage } from './pages/PaperPreviewPage';
import { SettingsPage } from './pages/SettingsPage';
import { AIAssistantPage } from './pages/AIAssistantPage';

const MainContent: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const [activePage, setActivePage] = useState<string>(() => {
    const path = window.location.pathname.replace(/^\//, '').toLowerCase();
    if (['ai-assistant', 'dashboard', 'upload', 'saved', 'settings', 'login', 'register'].includes(path)) {
      return path;
    }
    return 'landing';
  });
  const [selectedPaperId, setSelectedPaperId] = useState<string>('');
  const [paperData, setPaperData] = useState<any>(null);
  const [chapterText, setChapterText] = useState<string>('');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = (title: string, message?: string, type: 'success' | 'error' | 'info' = 'info') => {
    const newToast: ToastMessage = {
      id: String(Date.now()),
      title,
      message,
      type
    };
    setToasts((prev) => [...prev, newToast]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== newToast.id));
    }, 4000);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Protected Page Guard
  const renderPage = () => {
    if (isLoading) {
      return (
        <div className="min-h-[60vh] flex items-center justify-center space-x-3 text-slate-500">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-semibold">Loading TeachGenie AI...</span>
        </div>
      );
    }

    const protectedPages = ['dashboard', 'ai-assistant', 'upload', 'editor', 'saved', 'preview', 'settings'];
    if (!isAuthenticated && protectedPages.includes(activePage)) {
      return <LoginPage setActivePage={setActivePage} />;
    }

    switch (activePage) {
      case 'landing':
        return <LandingPage setActivePage={setActivePage} />;
      case 'register':
        return <RegisterPage setActivePage={setActivePage} />;
      case 'login':
        return <LoginPage setActivePage={setActivePage} />;
      case 'forgot-password':
        return <ForgotPasswordPage setActivePage={setActivePage} />;
      case 'dashboard':
        return (
          <DashboardPage
            setActivePage={setActivePage}
            setSelectedPaperId={setSelectedPaperId}
            showToast={showToast}
          />
        );
      case 'ai-assistant':
        return (
          <AIAssistantPage
            setActivePage={setActivePage}
            setChapterText={setChapterText}
            showToast={showToast}
          />
        );
      case 'upload':
        return (
          <ChapterUploadPage
            setActivePage={setActivePage}
            setGeneratedPaperData={setPaperData}
            setChapterText={setChapterText}
            showToast={showToast}
          />
        );
      case 'editor':
        return (
          <QuestionEditorPage
            paperData={paperData || { chapter_title: 'Sample Chapter', subject: 'Science', grade: 'Grade 10', very_short_questions: [], short_questions: [], long_questions: [] }}
            chapterText={chapterText}
            setActivePage={setActivePage}
            setSelectedPaperId={setSelectedPaperId}
            showToast={showToast}
          />
        );
      case 'saved':
        return (
          <SavedPapersPage
            setActivePage={setActivePage}
            setSelectedPaperId={setSelectedPaperId}
            setPaperData={setPaperData}
            showToast={showToast}
          />
        );
      case 'preview':
        return (
          <PaperPreviewPage
            paperId={selectedPaperId}
            paperData={paperData}
            setActivePage={setActivePage}
            showToast={showToast}
          />
        );
      case 'settings':
        return <SettingsPage showToast={showToast} />;
      default:
        return <LandingPage setActivePage={setActivePage} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans text-slate-900 selection:bg-blue-200">
      <Navbar activePage={activePage} setActivePage={setActivePage} />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8">
        {renderPage()}
      </main>
      <Footer />
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <MainContent />
    </AuthProvider>
  );
};

export default App;
