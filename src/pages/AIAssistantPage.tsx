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
  Code,
  Mic,
  Volume2,
  VolumeX,
  Square,
  Radio,
  Globe,
  Loader2,
  X,
  Check
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

  // --- Voice AI Teacher & Speech API States ---
  const [selectedLanguage, setSelectedLanguage] = useState<'en' | 'hi'>('en');
  const [autoPlayAudio, setAutoPlayAudio] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);
  const recordingTimerRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const cancelRecordingRef = useRef<boolean>(false);

  // Detect Web Speech API support & load available TTS voices on mount
  useEffect(() => {
    loadConversations();

    // Load Speech Synthesis Voices
    if ('speechSynthesis' in window) {
      const updateVoices = () => {
        setAvailableVoices(window.speechSynthesis.getVoices());
      };
      updateVoices();
      window.speechSynthesis.onvoiceschanged = updateVoices;
    }

    return () => {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (e) {}
      }
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading, interimTranscript]);

  const loadConversations = async () => {
    try {
      setIsFetchingHistory(true);
      const data = await chatService.getConversations();
      setConversations(data);
      if (data.length > 0 && !activeConversationId) {
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
      stopSpeaking();
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
    stopSpeaking();
    stopListening();
    setActiveConversationId(null);
    setMessages([]);
    setInputMessage('');
    if (window.innerWidth < 768) {
      setShowSidebarMobile(false);
    }
  };

  // --- Voice AI Teacher MediaRecorder & Fallback Flow ---

  const formatTime = (secs: number): string => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const stopAudioTracks = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
  };

  const startMediaRecorder = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      showToast('Microphone Unsupported', 'Audio recording is not supported in this browser.', 'error');
      return;
    }

    stopSpeaking();
    stopListening();

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      audioChunksRef.current = [];
      cancelRecordingRef.current = false;

      let options: MediaRecorderOptions = {};
      if (typeof MediaRecorder !== 'undefined') {
        if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
          options = { mimeType: 'audio/webm;codecs=opus' };
        } else if (MediaRecorder.isTypeSupported('audio/webm')) {
          options = { mimeType: 'audio/webm' };
        } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
          options = { mimeType: 'audio/mp4' };
        } else if (MediaRecorder.isTypeSupported('audio/ogg')) {
          options = { mimeType: 'audio/ogg' };
        }
      }

      const recorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = async () => {
        stopAudioTracks();
        if (recordingTimerRef.current) {
          clearInterval(recordingTimerRef.current);
          recordingTimerRef.current = null;
        }

        setIsRecording(false);

        if (cancelRecordingRef.current) {
          cancelRecordingRef.current = false;
          setRecordingSeconds(0);
          return;
        }

        const audioBlob = new Blob(audioChunksRef.current, { type: recorder.mimeType || 'audio/webm' });
        audioChunksRef.current = [];
        setRecordingSeconds(0);

        if (audioBlob.size < 100) {
          showToast('Empty Audio', 'No speech captured in recording. Please try speaking again.', 'error');
          return;
        }

        await processAndTranscribeAudio(audioBlob);
      };

      recorder.start(200);
      setIsRecording(true);
      setRecordingSeconds(0);

      recordingTimerRef.current = window.setInterval(() => {
        setRecordingSeconds((prev) => {
          if (prev >= 60) {
            stopMediaRecorder();
            return 60;
          }
          return prev + 1;
        });
      }, 1000);

      showToast('Recording Started', selectedLanguage === 'hi' ? 'बोलना शुरू करें (Speak in Hindi)' : 'Speak your question into microphone...', 'info');

    } catch (err: any) {
      stopAudioTracks();
      setIsRecording(false);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        showToast('Microphone Permission Denied', 'Please grant microphone access in your browser location settings.', 'error');
      } else {
        showToast('Microphone Error', `Could not access microphone: ${err.message || 'Device unavailable'}`, 'error');
      }
    }
  };

  const stopMediaRecorder = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    } else {
      setIsRecording(false);
      stopAudioTracks();
    }
  };

  const cancelMediaRecorder = () => {
    cancelRecordingRef.current = true;
    stopMediaRecorder();
    showToast('Cancelled', 'Audio recording cancelled.', 'info');
  };

  const processAndTranscribeAudio = async (audioBlob: Blob) => {
    setIsTranscribing(true);
    try {
      const formData = new FormData();
      const ext = audioBlob.type.includes('mp4') ? 'm4a' : (audioBlob.type.includes('ogg') ? 'ogg' : 'webm');
      formData.append('file', audioBlob, `recording.${ext}`);
      formData.append('language', selectedLanguage);

      const data = await chatService.transcribeAudio(formData);
      if (data.transcript && data.transcript.trim()) {
        const text = data.transcript.trim();
        setInputMessage((prev) => (prev ? `${prev} ${text}` : text));
        showToast('Speech Recognized', 'Transcript added! You can review or edit before sending.', 'success');
      } else {
        showToast('No Speech Recognized', 'Could not detect clear speech. Please try speaking again.', 'info');
      }
    } catch (err: any) {
      const detail = err?.response?.data?.detail || err.message || 'Voice transcription failed.';
      showToast('Transcription Error', detail, 'error');
    } finally {
      setIsTranscribing(false);
    }
  };

  const toggleMicrophone = () => {
    if (isRecording) {
      stopMediaRecorder();
      return;
    }
    if (isListening) {
      stopListening();
      return;
    }

    stopSpeaking();

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      startMediaRecorder();
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = selectedLanguage === 'hi' ? 'hi-IN' : 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
        setInterimTranscript('');
      };

      recognition.onresult = (event: any) => {
        let currentInterim = '';
        let finalTranscriptStr = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const transcriptPiece = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscriptStr += transcriptPiece;
          } else {
            currentInterim += transcriptPiece;
          }
        }

        if (currentInterim) {
          setInterimTranscript(currentInterim);
        }

        if (finalTranscriptStr) {
          setInputMessage((prev) => (prev ? `${prev} ${finalTranscriptStr}` : finalTranscriptStr));
          setInterimTranscript('');
        }
      };

      recognition.onerror = (event: any) => {
        logger_warn(`Web Speech API error (${event.error}). Switching to MediaRecorder fallback.`);
        setIsListening(false);
        setInterimTranscript('');
        if (event.error === 'not-allowed') {
          showToast('Microphone Permission Denied', 'Please allow microphone access in your browser location settings.', 'error');
        } else {
          // Seamless fallback on network or other error!
          startMediaRecorder();
        }
      };

      recognition.onend = () => {
        setIsListening(false);
        setInterimTranscript('');
      };

      recognition.start();
    } catch (e) {
      logger_warn('Web Speech API exception. Falling back to MediaRecorder.');
      startMediaRecorder();
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // Ignore
      }
    }
    if (isRecording) {
      stopMediaRecorder();
    }
    setIsListening(false);
    setInterimTranscript('');
  };

  // --- Voice AI Teacher Text-to-Speech (Web Speech API) ---
  const cleanMarkdownForSpeech = (text: string): string => {
    let cleaned = text;
    cleaned = cleaned.replace(/```[\s\S]*?```/g, 'Code snippet.');
    cleaned = cleaned.replace(/`([^`]+)`/g, '$1');
    cleaned = cleaned.replace(/#{1,6}\s+/g, '');
    cleaned = cleaned.replace(/\*\*([^*]+)\*\*/g, '$1');
    cleaned = cleaned.replace(/\*([^*]+)\*/g, '$1');
    cleaned = cleaned.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
    cleaned = cleaned.replace(/[-*+]\s+/g, '');
    cleaned = cleaned.replace(/\n+/g, '. ');
    return cleaned.trim();
  };

  const speakMessage = (messageId: string, text: string) => {
    if (!('speechSynthesis' in window)) {
      showToast('Unsupported', 'Text-to-speech is not supported in your browser.', 'error');
      return;
    }

    if (speakingMessageId === messageId) {
      if (isPaused) {
        window.speechSynthesis.resume();
        setIsPaused(false);
      } else {
        window.speechSynthesis.pause();
        setIsPaused(true);
      }
      return;
    }

    stopSpeaking();

    const speechText = cleanMarkdownForSpeech(text);
    if (!speechText) return;

    const utterance = new SpeechSynthesisUtterance(speechText);
    
    // Detect Hindi characters in text or check selectedLanguage
    const containsHindi = /[\u0900-\u097F]/.test(speechText);
    const targetLang = containsHindi || selectedLanguage === 'hi' ? 'hi-IN' : 'en-US';
    utterance.lang = targetLang;

    // Pick matching voice if available
    const matchingVoice = availableVoices.find((v) => v.lang.toLowerCase().replace('_', '-').startsWith(targetLang.toLowerCase().slice(0, 2)));
    if (matchingVoice) {
      utterance.voice = matchingVoice;
    }

    utterance.onstart = () => {
      setSpeakingMessageId(messageId);
      setIsPaused(false);
    };

    utterance.onend = () => {
      setSpeakingMessageId(null);
      setIsPaused(false);
    };

    utterance.onerror = () => {
      setSpeakingMessageId(null);
      setIsPaused(false);
    };

    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setSpeakingMessageId(null);
    setIsPaused(false);
  };

  // Helper logger for non-critical warnings
  const logger_warn = (msg: string) => {
    console.warn(`[TeachGenie Voice AI] ${msg}`);
  };

  const handleSendMessage = async (textToSend?: string) => {
    stopListening();
    const query = (textToSend || inputMessage).trim();
    if (!query || isLoading) return;

    setInputMessage('');
    setIsLoading(true);

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
      const newMsgList = updatedConv.messages || [];
      setMessages(newMsgList);

      setConversations((prev) => {
        const exists = prev.some((c) => c.id === updatedConv.id);
        if (exists) {
          return prev.map((c) => (c.id === updatedConv.id ? updatedConv : c));
        } else {
          return [updatedConv, ...prev];
        }
      });

      // Auto-play audio if enabled
      if (autoPlayAudio && newMsgList.length > 0) {
        const lastMsg = newMsgList[newMsgList.length - 1];
        if (lastMsg.role === 'assistant') {
          setTimeout(() => speakMessage(lastMsg.id, lastMsg.content), 300);
        }
      }
    } catch (err: any) {
      showToast('AI Response Error', err?.response?.data?.detail || 'Failed to get answer from AI Assistant.', 'error');
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
      hindiTitle: 'प्रकाश संश्लेषण समझाएं',
      description: 'Step-by-step breakdown for Class 8 Science students.',
      prompt: selectedLanguage === 'hi' 
        ? 'प्रकाश संश्लेषण (Photosynthesis) की प्रक्रिया को कक्षा 8 के छात्र के लिए आसान शब्दों में समझाएं।' 
        : 'Explain photosynthesis to a Class 8 student with clear points and key takeaways.',
      icon: BookOpen,
      color: 'from-blue-500 to-indigo-600'
    },
    {
      title: 'Mathematics Lesson Plan',
      hindiTitle: 'गणित पाठ योजना (Lesson Plan)',
      description: 'Structured 45-minute lesson plan for Class 9 Algebra.',
      prompt: selectedLanguage === 'hi' 
        ? 'कक्षा 9 गणित के लिए बीजगणित (Algebra) पर 45 मिनट का पाठ योजना तैयार करें।' 
        : 'Create a structured 45-minute lesson plan for Class 9 Mathematics on Algebraic Identities with learning objectives and activities.',
      icon: Lightbulb,
      color: 'from-amber-500 to-orange-600'
    },
    {
      title: 'Physics Worksheet',
      hindiTitle: 'भौतिकी (Physics) कार्यपत्रक',
      description: '5 questions with detailed solutions for Class 10 Physics.',
      prompt: selectedLanguage === 'hi' 
        ? 'कक्षा 10 भौतिकी के अध्याय ओम के नियम (Ohm\'s Law) पर 5 प्रश्नों का कार्यपत्रक उत्तर सहित बनाएं।' 
        : 'Create a 5-question practice worksheet with complete solutions for Class 10 Physics on Electricity and Ohm\'s Law.',
      icon: HelpCircle,
      color: 'from-cyan-500 to-blue-600'
    },
    {
      title: 'Computer Science & AI',
      hindiTitle: 'कंप्यूटर साइंस और मशीन लर्निंग',
      description: 'Practical concepts with real-world examples & code.',
      prompt: selectedLanguage === 'hi' 
        ? 'मशीन लर्निंग (Machine Learning) क्या है? व्यावहारिक उदाहरणों के साथ समझाएं।' 
        : 'Explain Machine Learning with practical examples, supervised vs unsupervised learning, and a simple Python snippet.',
      icon: Code,
      color: 'from-purple-500 to-indigo-600'
    }
  ];

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
              <div className="flex items-center space-x-2">
                <h2 className="text-sm font-bold text-slate-900 leading-tight">Voice AI Teacher</h2>
                <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-bold uppercase tracking-wider flex items-center">
                  <Mic className="w-3 h-3 mr-1 text-blue-600" /> Speech Enabled
                </span>
              </div>
              <span className="inline-flex items-center text-[10px] font-semibold text-emerald-600">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse" /> Online · Multi-Subject Voice Co-Pilot
              </span>
            </div>
          </div>

          {/* Controls: Language Selector & Auto-Play Audio Toggle */}
          <div className="flex items-center space-x-3">
            {/* Language Selector */}
            <div className="flex items-center space-x-1.5 bg-slate-100 p-1 rounded-lg border border-slate-200">
              <Globe className="w-3.5 h-3.5 text-slate-500 ml-1" />
              <button
                onClick={() => setSelectedLanguage('en')}
                className={`px-2 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
                  selectedLanguage === 'en' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                English
              </button>
              <button
                onClick={() => setSelectedLanguage('hi')}
                className={`px-2 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
                  selectedLanguage === 'hi' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                हिंदी (Hindi)
              </button>
            </div>

            {/* Auto-Play Audio Toggle */}
            <button
              onClick={() => setAutoPlayAudio(!autoPlayAudio)}
              className={`hidden sm:flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                autoPlayAudio 
                  ? 'bg-blue-50 border-blue-300 text-blue-700' 
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
              title="Automatically speak AI answers out loud"
            >
              <Volume2 className={`w-3.5 h-3.5 ${autoPlayAudio ? 'text-blue-600 animate-pulse' : 'text-slate-400'}`} />
              <span>Auto-Speak</span>
            </button>

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
                <Sparkles className="w-9 h-9 animate-pulse" />
              </div>

              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold bg-gradient-to-r from-blue-900 via-indigo-800 to-cyan-600 bg-clip-text text-transparent">
                  {selectedLanguage === 'hi' ? 'नमस्ते शिक्षक! आज मैं आपकी क्या सहायता कर सकता हूँ?' : 'Hello, Teacher! How can I help you today?'}
                </h1>
                <p className="text-sm text-slate-600 mt-2 max-w-xl mx-auto">
                  Click the microphone to speak your question in {selectedLanguage === 'hi' ? 'Hindi' : 'English'}, or type below. Listen to AI answers out loud anytime!
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
                        <span className="text-xs font-bold text-slate-900 group-hover:text-blue-700">
                          {selectedLanguage === 'hi' ? item.hindiTitle : item.title}
                        </span>
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
                const isSpeakingThis = speakingMessageId === msg.id;

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

                          {/* Assistant Action Buttons & Speech Player */}
                          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center space-x-2 text-xs text-slate-500 flex-wrap gap-y-2">
                            {/* LISTEN / STOP AUDIO BUTTON */}
                            <button
                              onClick={() => speakMessage(msg.id, msg.content)}
                              className={`px-3 py-1 rounded-lg flex items-center space-x-1.5 font-bold transition-all cursor-pointer ${
                                isSpeakingThis 
                                  ? 'bg-rose-500 text-white shadow-xs animate-pulse' 
                                  : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                              }`}
                              title={isSpeakingThis ? (isPaused ? 'Resume Audio' : 'Pause Audio') : 'Listen to AI answer'}
                            >
                              {isSpeakingThis ? (
                                isPaused ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />
                              ) : (
                                <Volume2 className="w-3.5 h-3.5" />
                              )}
                              <span>{isSpeakingThis ? (isPaused ? 'Resume' : 'Pause / Stop Audio') : 'Listen'}</span>
                            </button>

                            {isSpeakingThis && (
                              <button
                                onClick={stopSpeaking}
                                className="px-2 py-1 rounded-lg bg-slate-200 text-slate-700 hover:bg-slate-300 flex items-center space-x-1 font-semibold cursor-pointer"
                                title="Stop playback"
                              >
                                <Square className="w-3 h-3 fill-slate-700" />
                                <span>Stop</span>
                              </button>
                            )}

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

        {/* Live Speech & Recording Status Banner */}
        {isRecording && (
          <div className="px-4 py-2.5 bg-rose-500 text-white flex items-center justify-between text-xs font-semibold animate-in fade-in duration-150 shadow-md">
            <div className="flex items-center space-x-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping shrink-0" />
              <Radio className="w-4 h-4 animate-pulse shrink-0" />
              <span>Recording audio ({selectedLanguage === 'hi' ? 'Hindi' : 'English'}):</span>
              <span className="font-mono bg-rose-700/80 px-2 py-0.5 rounded text-white font-bold">{formatTime(recordingSeconds)} / 01:00</span>
            </div>
            <div className="flex items-center space-x-2 shrink-0">
              <button
                onClick={stopMediaRecorder}
                className="px-3 py-1 rounded bg-white text-rose-700 font-bold hover:bg-rose-50 transition-colors flex items-center space-x-1 cursor-pointer shadow-xs"
                title="Stop recording and convert to text"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Done</span>
              </button>
              <button
                onClick={cancelMediaRecorder}
                className="px-2.5 py-1 rounded bg-rose-700 text-white hover:bg-rose-800 transition-colors flex items-center space-x-1 font-medium cursor-pointer"
                title="Cancel recording"
              >
                <X className="w-3.5 h-3.5" />
                <span>Cancel</span>
              </button>
            </div>
          </div>
        )}

        {isTranscribing && (
          <div className="px-4 py-2.5 bg-gradient-to-r from-blue-700 to-indigo-700 text-white flex items-center justify-between text-xs font-semibold animate-in fade-in duration-150 shadow-md">
            <div className="flex items-center space-x-2.5">
              <Loader2 className="w-4 h-4 animate-spin shrink-0 text-cyan-300" />
              <span>Transcribing audio using Whisper AI... Please wait...</span>
            </div>
          </div>
        )}

        {(isListening || interimTranscript) && !isRecording && !isTranscribing && (
          <div className="px-4 py-2 bg-rose-50 border-t border-rose-200 flex items-center justify-between text-xs text-rose-900 animate-in fade-in duration-150">
            <div className="flex items-center space-x-2 truncate">
              <Radio className="w-4 h-4 text-rose-600 animate-pulse shrink-0" />
              <span className="font-bold">Listening ({selectedLanguage === 'hi' ? 'Hindi' : 'English'}):</span>
              <span className="italic truncate">{interimTranscript || 'Speak your question into microphone...'}</span>
            </div>
            <button
              onClick={stopListening}
              className="px-2.5 py-1 rounded bg-rose-600 text-white font-bold hover:bg-rose-700 transition-colors shrink-0 ml-2 cursor-pointer"
            >
              Stop Recording
            </button>
          </div>
        )}

        {/* Input Bar Footer */}
        <footer className="p-4 border-t border-slate-200 bg-white">
          <div className="max-w-4xl mx-auto relative">
            <textarea
              ref={textareaRef}
              rows={2}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Ask anything by typing or clicking the microphone... (${selectedLanguage === 'hi' ? 'हिंदी' : 'English'}, Enter to send)`}
              className="w-full pl-4 pr-24 py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white resize-none shadow-xs"
              disabled={isTranscribing || isRecording}
            />

            <div className="absolute right-3 bottom-3 flex items-center space-x-1.5">
              {/* MICROPHONE BUTTON */}
              <button
                onClick={toggleMicrophone}
                disabled={isTranscribing || isLoading}
                className={`
                  p-2 rounded-lg text-white shadow-xs transition-all cursor-pointer
                  ${isRecording || isListening
                    ? 'bg-rose-600 hover:bg-rose-700 animate-pulse ring-2 ring-rose-400' 
                    : (isTranscribing ? 'bg-indigo-600 cursor-wait' : 'bg-slate-700 hover:bg-slate-800')}
                `}
                title={
                  isTranscribing 
                    ? 'Transcribing audio...' 
                    : (isRecording || isListening ? 'Stop Recording' : `Click to speak question in ${selectedLanguage === 'hi' ? 'Hindi' : 'English'}`)
                }
              >
                {isTranscribing ? (
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                ) : isRecording || isListening ? (
                  <Square className="w-4 h-4 fill-white" />
                ) : (
                  <Mic className="w-4 h-4" />
                )}
              </button>

              {/* SEND BUTTON */}
              <button
                onClick={() => handleSendMessage()}
                disabled={!inputMessage.trim() || isLoading || isTranscribing || isRecording}
                className={`
                  p-2 rounded-lg text-white shadow-xs transition-all cursor-pointer
                  ${inputMessage.trim() && !isLoading && !isTranscribing && !isRecording
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700' 
                    : 'bg-slate-300 cursor-not-allowed'}
                `}
                title="Send message"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>

          <p className="text-[11px] text-center text-slate-400 mt-2">
            TeachGenie Voice AI Teacher uses Groq Whisper & Web Speech APIs. Always verify educational answers prior to classroom distribution.
          </p>
        </footer>
      </main>
    </div>
  );
};
