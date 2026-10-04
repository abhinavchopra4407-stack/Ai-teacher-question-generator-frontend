import React, { useState, useEffect, useRef } from 'react';
import { chatService } from '../services/api';
import type { Conversation, ChatMessage } from '../types';
import { 
  Bot, 
  Send, 
  Plus, 
  Trash2, 
  Edit2, 
  Copy, 
  RotateCcw, 
  Sparkles, 
  MessageSquare, 
  ChevronLeft, 
  FileText,
  BookOpen,
  HelpCircle,
  Lightbulb,
  Code
} from 'lucide-react';

interface AIAssistantPageProps {
  setActivePage: (page: string) => void;
  setChapterText?: (text: string) => void;
  showToast: (title: string, message?: string, type?: 'success' | 'error' | 'info') => void;
}

export const AIAssistantPage: React.FC<AIAssistantPageProps> = ({
  setActivePage,
  setChapterText,
  showToast
}) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingHistory, setIsFetchingHistory] = useState(true);
  const [editingTitleId, setEditingTitleId] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [showSidebarMobile, setShowSidebarMobile] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Load user conversation history on initial mount
  useEffect(() => {
    loadConversations();
  }, []);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const loadConversations = async () => {
    try {
      setIsFetchingHistory(true);
      const data = await chatService.getConversations();
      setConversations(data);
      if (data.length > 0 && !activeConversationId) {
        // Load the most recent conversation by default
        loadConversationDetails(data[0].id);
      }
    } catch (err: any) {
      showToast('Error', 'Failed to load conversation history', 'error');
    } finally {
      setIsFetchingHistory(false);
    }
  };

  const loadConversationDetails = async (id: string) => {
    try {
      setActiveConversationId(id);
      const conv = await chatService.getConversationById(id);
      setMessages(conv.messages || []);
      if (window.innerWidth < 768) {
        setShowSidebarMobile(false);
      }
    } catch (err: any) {
      showToast('Error', 'Failed to load messages for this conversation', 'error');
    }
  };

  const handleNewChat = () => {
    setActiveConversationId(null);
    setMessages([]);
    setInputMessage('');
    if (window.innerWidth < 768) {
      setShowSidebarMobile(false);
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputMessage).trim();
    if (!query || isLoading) return;

    setInputMessage('');
    setIsLoading(true);

    // Optimistically update UI with user message
    const tempUserMsg: ChatMessage = {
      id: `temp-${Date.now()}`,
      conversation_id: activeConversationId || '',
      role: 'user',
      content: query,
      created_at: new Date().toISOString()
    };

    setMessages((prev) => [...prev, tempUserMsg]);

    try {
      const updatedConv = await chatService.sendMessage({
        conversation_id: activeConversationId || undefined,
        message: query
      });

      setActiveConversationId(updatedConv.id);
      setMessages(updatedConv.messages || []);

      // Refresh sidebar conversation list
      setConversations((prev) => {
        const exists = prev.some((c) => c.id === updatedConv.id);
        if (exists) {
          return prev.map((c) => (c.id === updatedConv.id ? updatedConv : c));
        } else {
          return [updatedConv, ...prev];
        }
      });
    } catch (err: any) {
      showToast('AI Response Error', err?.response?.data?.detail || 'Failed to get answer from AI Assistant.', 'error');
      // Remove temp user message or mark failed
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleRename = async (id: string) => {
    if (!newTitle.trim()) {
      setEditingTitleId(null);
      return;
    }
    try {
      const updated = await chatService.renameConversation(id, newTitle.trim());
      setConversations((prev) => prev.map((c) => (c.id === id ? { ...c, title: updated.title } : c)));
      setEditingTitleId(null);
      showToast('Success', 'Conversation renamed', 'success');
    } catch (err: any) {
      showToast('Error', 'Failed to rename conversation', 'error');
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this conversation?')) return;
    try {
      await chatService.deleteConversation(id);
      setConversations((prev) => prev.filter((c) => c.id !== id));
      if (activeConversationId === id) {
        handleNewChat();
      }
      showToast('Deleted', 'Conversation deleted', 'info');
    } catch (err: any) {
      showToast('Error', 'Failed to delete conversation', 'error');
    }
  };

  const handleCopyText = (content: string) => {
    navigator.clipboard.writeText(content);
    showToast('Copied', 'Response copied to clipboard!', 'success');
  };

  const handleUseAsChapterContent = (content: string) => {
    if (setChapterText) {
      setChapterText(content);
      showToast('Content Transferred', 'AI response loaded into Question Paper Generator!', 'success');
      setActivePage('upload');
    }
  };

  const promptSuggestions = [
    {
      title: 'Explain Photosynthesis',
      description: 'Step-by-step breakdown for Class 8 Science students.',
      prompt: 'Explain photosynthesis to a Class 8 student with clear points, diagrams description, and key takeaways.',
      icon: BookOpen,
      color: 'from-blue-500 to-indigo-600'
    },
    {
      title: 'Mathematics Lesson Plan',
      description: '5-step lesson plan for Class 9 Quadratic Equations.',
      prompt: 'Create a structured 45-minute lesson plan for Class 9 Mathematics on Quadratic Equations with learning objectives and classroom activities.',
      icon: Lightbulb,
      color: 'from-amber-500 to-orange-600'
    },
    {
      title: 'Machine Learning Basics',
      description: 'Practical concepts with real-world examples & code.',
      prompt: 'Explain Machine Learning with practical examples, supervised vs unsupervised learning, and a simple Python snippet.',
      icon: Code,
      color: 'from-purple-500 to-indigo-600'
    },
    {
      title: 'Quiz & Worksheet Creation',
      description: '5 questions with detailed answers for Class 10 Physics.',
      prompt: 'Create a 5-question practice worksheet with complete solutions for Class 10 Physics on Electricity and Ohm\'s Law.',
      icon: HelpCircle,
      color: 'from-cyan-500 to-blue-600'
    }
  ];

  // Helper to render simple markdown formatting
  const renderFormattedContent = (content: string) => {
    const lines = content.split('\n');
    return lines.map((line, idx) => {
      if (line.startsWith('### ')) {
        return <h3 key={idx} className="text-lg font-bold text-slate-900 mt-3 mb-1">{line.replace('### ', '')}</h3>;
      }
      if (line.startsWith('#### ')) {
        return <h4 key={idx} className="text-base font-semibold text-slate-800 mt-2 mb-1">{line.replace('#### ', '')}</h4>;
      }
      if (line.startsWith('## ')) {
        return <h2 key={idx} className="text-xl font-extrabold text-blue-900 mt-4 mb-2 border-b pb-1 border-slate-200">{line.replace('## ', '')}</h2>;
      }
      if (line.startsWith('# ')) {
        return <h1 key={idx} className="text-2xl font-black text-blue-950 mt-4 mb-2">{line.replace('# ', '')}</h1>;
      }
      if (line.startsWith('- ') || line.startsWith('* ')) {
        const itemText = line.substring(2);
        return (
          <li key={idx} className="ml-4 list-disc text-slate-700 my-0.5 leading-relaxed">
            {renderInlineFormat(itemText)}
          </li>
        );
      }
      if (/^\d+\.\s/.test(line)) {
        return (
          <li key={idx} className="ml-4 list-decimal text-slate-700 my-0.5 leading-relaxed">
            {renderInlineFormat(line.replace(/^\d+\.\s/, ''))}
          </li>
        );
      }
      if (line.startsWith('```')) {
        return <div key={idx} className="my-2 p-3 bg-slate-900 text-slate-100 rounded-lg font-mono text-xs overflow-x-auto">{line.replace(/```[a-z]*/g, '')}</div>;
      }
      if (line.trim() === '') {
        return <div key={idx} className="h-2" />;
      }
      return (
        <p key={idx} className="text-slate-800 leading-relaxed my-1">
          {renderInlineFormat(line)}
        </p>
      );
    });
  };

  const renderInlineFormat = (text: string) => {
    // Bold replacement **text**
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="font-semibold text-slate-900">{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  return (
    <div className="flex h-[calc(100vh-6rem)] bg-slate-100 rounded-2xl overflow-hidden shadow-lg border border-slate-200">
      {/* Mobile Drawer Overlay */}
      {showSidebarMobile && (
        <div 
          onClick={() => setShowSidebarMobile(false)} 
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 md:hidden"
        />
      )}

      {/* SIDEBAR: Conversation History */}
      <aside className={`
        fixed md:relative z-50 inset-y-0 left-0 w-72 bg-slate-900 text-white flex flex-col transition-transform duration-200 ease-in-out
        ${showSidebarMobile ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        {/* Sidebar Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <button
            onClick={handleNewChat}
            className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold py-2.5 px-4 rounded-xl shadow-md transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Chat</span>
          </button>
        </div>

        {/* History List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          <div className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Recent Conversations
          </div>

          {isFetchingHistory ? (
            <div className="p-4 text-center text-xs text-slate-400 animate-pulse">
              Loading chat history...
            </div>
          ) : conversations.length === 0 ? (
            <div className="p-4 text-center text-xs text-slate-500">
              No previous conversations yet. Start a new chat!
            </div>
          ) : (
            conversations.map((conv) => {
              const isActive = activeConversationId === conv.id;
              const isEditing = editingTitleId === conv.id;

              return (
                <div
                  key={conv.id}
                  onClick={() => loadConversationDetails(conv.id)}
                  className={`
                    group flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium cursor-pointer transition-colors
                    ${isActive ? 'bg-blue-600/90 text-white shadow-xs' : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'}
                  `}
                >
                  <div className="flex items-center space-x-2.5 truncate flex-1 mr-2">
                    <MessageSquare className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    {isEditing ? (
                      <input
                        type="text"
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        onBlur={() => handleRename(conv.id)}
                        onKeyDown={(e) => e.key === 'Enter' && handleRename(conv.id)}
                        className="bg-slate-800 text-white px-2 py-0.5 rounded border border-blue-400 text-xs w-full focus:outline-none"
                        autoFocus
                        onClick={(e) => e.stopPropagation()}
                      />
                    ) : (
                      <span className="truncate">{conv.title}</span>
                    )}
                  </div>

                  {!isEditing && (
                    <div className="hidden group-hover:flex items-center space-x-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingTitleId(conv.id);
                          setNewTitle(conv.title);
                        }}
                        className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-700"
                        title="Rename conversation"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => handleDelete(conv.id, e)}
                        className="p-1 text-slate-400 hover:text-rose-400 rounded hover:bg-slate-700"
                        title="Delete conversation"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-slate-800 text-center text-[11px] text-slate-400">
          TeachGenie AI Teacher Co-Pilot
        </div>
      </aside>

      {/* MAIN CHAT CONTENT AREA */}
      <main className="flex-1 flex flex-col bg-white overflow-hidden">
        {/* Chat Topbar Header */}
        <header className="h-14 border-b border-slate-200 bg-white px-4 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowSidebarMobile(!showSidebarMobile)}
              className="md:hidden p-1.5 rounded-lg text-slate-600 hover:bg-slate-100"
            >
              <ChevronLeft className={`w-5 h-5 transition-transform ${showSidebarMobile ? 'rotate-180' : ''}`} />
            </button>

            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-700 to-indigo-600 flex items-center justify-center text-white shadow-xs">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 leading-tight">TeachGenie AI Assistant</h2>
              <span className="inline-flex items-center text-[10px] font-semibold text-emerald-600">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse" /> Online · Multi-Subject Teacher AI
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleNewChat}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors flex items-center space-x-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Chat</span>
            </button>
          </div>
        </header>

        {/* Messages Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {messages.length === 0 ? (
            /* Welcome Hero View */
            <div className="max-w-3xl mx-auto py-8 text-center space-y-8 animate-in fade-in duration-300">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-500 text-white mx-auto flex items-center justify-center shadow-xl">
                <Sparkles className="w-9 h-9" />
              </div>

              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold bg-gradient-to-r from-blue-900 via-indigo-800 to-cyan-600 bg-clip-text text-transparent">
                  Hello, Teacher! How can I help you today?
                </h1>
                <p className="text-sm text-slate-600 mt-2 max-w-xl mx-auto">
                  Ask any question across Science, Math, History, Languages, or Programming. Generate lesson plans, quizzes, and worksheets instantly.
                </p>
              </div>

              {/* Suggestions Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
                {promptSuggestions.map((item, idx) => {
                  const IconComp = item.icon;
                  return (
                    <button
                      key={idx}
                      onClick={() => handleSendMessage(item.prompt)}
                      className="p-4 rounded-xl border border-slate-200 bg-white hover:border-blue-400 hover:shadow-md transition-all cursor-pointer text-left group"
                    >
                      <div className="flex items-center space-x-3 mb-2">
                        <div className={`w-8 h-8 rounded-lg bg-gradient-to-r ${item.color} text-white flex items-center justify-center group-hover:scale-105 transition-transform`}>
                          <IconComp className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-bold text-slate-900 group-hover:text-blue-700">{item.title}</span>
                      </div>
                      <p className="text-xs text-slate-500 leading-snug">{item.description}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            /* Active Message List */
            <div className="max-w-4xl mx-auto space-y-6">
              {messages.map((msg, index) => {
                const isUser = msg.role === 'user';
                return (
                  <div
                    key={msg.id || index}
                    className={`flex items-start space-x-3 ${isUser ? 'flex-row-reverse space-x-reverse' : ''}`}
                  >
                    {/* Avatar */}
                    <div className={`
                      w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 shadow-xs
                      ${isUser ? 'bg-gradient-to-tr from-blue-700 to-indigo-600 text-white' : 'bg-slate-900 text-white'}
                    `}>
                      {isUser ? 'T' : <Bot className="w-4 h-4" />}
                    </div>

                    {/* Message Bubble */}
                    <div className={`
                      max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 text-sm shadow-xs
                      ${isUser 
                        ? 'bg-blue-600 text-white rounded-tr-xs' 
                        : 'bg-white border border-slate-200 text-slate-900 rounded-tl-xs shadow-sm'}
                    `}>
                      {isUser ? (
                        <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                      ) : (
                        <div>
                          <div className="prose prose-slate max-w-none text-slate-800 text-sm">
                            {renderFormattedContent(msg.content)}
                          </div>

                          {/* Assistant Action Buttons */}
                          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center space-x-2 text-xs text-slate-500">
                            <button
                              onClick={() => handleCopyText(msg.content)}
                              className="px-2.5 py-1 rounded-md hover:bg-slate-100 hover:text-slate-800 flex items-center space-x-1 transition-colors cursor-pointer"
                              title="Copy AI answer"
                            >
                              <Copy className="w-3.5 h-3.5" />
                              <span>Copy</span>
                            </button>

                            <button
                              onClick={() => handleSendMessage(messages[index - 1]?.content || 'Explain further')}
                              className="px-2.5 py-1 rounded-md hover:bg-slate-100 hover:text-slate-800 flex items-center space-x-1 transition-colors cursor-pointer"
                              title="Regenerate response"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              <span>Regenerate</span>
                            </button>

                            {setChapterText && (
                              <button
                                onClick={() => handleUseAsChapterContent(msg.content)}
                                className="px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 hover:bg-blue-100 flex items-center space-x-1 font-semibold transition-colors cursor-pointer ml-auto"
                                title="Transfer to Question Paper Generator"
                              >
                                <FileText className="w-3.5 h-3.5" />
                                <span>Use in Question Paper</span>
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Loading Indicator */}
              {isLoading && (
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0">
                    <Bot className="w-4 h-4 animate-spin" />
                  </div>
                  <div className="bg-white border border-slate-200 p-4 rounded-2xl rounded-tl-xs shadow-xs text-xs text-slate-500 flex items-center space-x-2">
                    <div className="w-2 h-2 rounded-full bg-blue-600 animate-ping" />
                    <span>TeachGenie AI is thinking and preparing your detailed answer...</span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Bar Footer */}
        <footer className="p-4 border-t border-slate-200 bg-white">
          <div className="max-w-4xl mx-auto relative">
            <textarea
              ref={textareaRef}
              rows={2}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything: Explain a concept, create a lesson plan, or generate quiz questions... (Press Enter to send, Shift+Enter for new line)"
              className="w-full pl-4 pr-14 py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white resize-none shadow-xs"
            />

            <button
              onClick={() => handleSendMessage()}
              disabled={!inputMessage.trim() || isLoading}
              className={`
                absolute right-3 bottom-3 p-2 rounded-lg text-white shadow-xs transition-all cursor-pointer
                ${inputMessage.trim() && !isLoading 
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700' 
                  : 'bg-slate-300 cursor-not-allowed'}
              `}
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
          <p className="text-[11px] text-center text-slate-400 mt-2">
            TeachGenie AI Assistant helps educators build quality lessons. Always verify answers prior to classroom distribution.
          </p>
        </footer>
      </main>
    </div>
  );
};
