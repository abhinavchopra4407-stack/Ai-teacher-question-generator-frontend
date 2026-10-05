import axios from 'axios';
import type { User, QuestionPaper, SingleQuestion, DashboardStats, GenerateQuestionsRequest, Conversation, Chapter, TextExtractResponse } from '../types';

// Compute backend API base URL dynamically
const getApiBase = (): string => {
  const envUrl = import.meta.env.VITE_API_URL || import.meta.env.VITE_BACKEND_URL;
  if (envUrl && envUrl.trim() !== '') {
    const cleanUrl = envUrl.trim().replace(/\/+$/, '');
    return cleanUrl.endsWith('/api') ? cleanUrl : `${cleanUrl}/api`;
  }
  return '/api';
};

const API_BASE = getApiBase();

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to inject Bearer Token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('teachgenie_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => Promise.reject(error));

export const authService = {
  async register(data: { email: string; password: string; full_name: string }) {
    const res = await api.post('/auth/register', data);
    return res.data;
  },
  async login(data: { email: string; password: string }) {
    const res = await api.post('/auth/login', data);
    return res.data;
  },
  async getMe(): Promise<User> {
    const res = await api.get('/auth/me');
    return res.data;
  },
  async forgotPassword(email: string) {
    const res = await api.post('/auth/forgot-password', { email });
    return res.data;
  },
  async resetPassword(token: string, new_password: string) {
    const res = await api.post('/auth/reset-password', { token, new_password });
    return res.data;
  },
  async updateProfile(data: { full_name?: string; custom_gemini_api_key?: string; current_password?: string; new_password?: string }): Promise<User> {
    const res = await api.put('/auth/profile', data);
    return res.data;
  }
};

export const documentService = {
  async upload(formData: FormData): Promise<TextExtractResponse> {
    const res = await api.post('/documents/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return res.data;
  },
  async getDocumentChapters(documentId: string): Promise<Chapter[]> {
    const res = await api.get(`/documents/${documentId}/chapters`);
    return res.data;
  }
};

export const questionService = {
  async generate(data: GenerateQuestionsRequest) {
    const res = await api.post('/questions/generate', data);
    return res.data;
  },
  async regenerateSingle(data: {
    chapter_title: string;
    subject: string;
    grade: string;
    language: string;
    difficulty: string;
    question_type: string;
    existing_question: string;
    topic?: string;
    chapter_text: string;
    special_instructions?: string;
  }): Promise<SingleQuestion> {
    const res = await api.post('/questions/regenerate-single', data);
    return res.data;
  },
  async generateAnswerKey(data: {
    chapter_title: string;
    chapter_text: string;
    questions: SingleQuestion[];
    language?: string;
  }): Promise<SingleQuestion[]> {
    const res = await api.post('/questions/generate-answer-key', data);
    return res.data;
  }
};

export const paperService = {
  async getPapers(params?: { search?: string; subject?: string; grade?: string }): Promise<QuestionPaper[]> {
    const res = await api.get('/papers', { params });
    return res.data;
  },
  async getPaperById(id: string): Promise<QuestionPaper> {
    const res = await api.get(`/papers/${id}`);
    return res.data;
  },
  async savePaper(paper: Partial<QuestionPaper>): Promise<QuestionPaper> {
    const res = await api.post('/papers', paper);
    return res.data;
  },
  async deletePaper(id: string) {
    const res = await api.delete(`/papers/${id}`);
    return res.data;
  },
  async duplicatePaper(id: string): Promise<QuestionPaper> {
    const res = await api.post(`/papers/${id}/duplicate`);
    return res.data;
  },
  getExportDocxUrl(id: string, includeAnswers: boolean = false) {
    const token = localStorage.getItem('teachgenie_token');
    return `${API_BASE}/papers/${id}/export/docx?include_answers=${includeAnswers}&token=${token}`;
  },
  getExportPdfUrl(id: string, includeAnswers: boolean = false) {
    const token = localStorage.getItem('teachgenie_token');
    return `${API_BASE}/papers/${id}/export/pdf?include_answers=${includeAnswers}&token=${token}`;
  }
};

export const dashboardService = {
  async getStats(): Promise<DashboardStats> {
    const res = await api.get('/dashboard/stats');
    return res.data;
  }
};

export const chatService = {
  async getConversations(): Promise<Conversation[]> {
    const res = await api.get('/chat/conversations');
    return res.data;
  },
  async getConversationById(id: string): Promise<Conversation> {
    const res = await api.get(`/chat/conversations/${id}`);
    return res.data;
  },
  async sendMessage(data: { conversation_id?: string; message: string }): Promise<Conversation> {
    const res = await api.post('/chat/send', data);
    return res.data;
  },
  async renameConversation(id: string, title: string): Promise<Conversation> {
    const res = await api.put(`/chat/conversations/${id}`, { title });
    return res.data;
  },
  async deleteConversation(id: string) {
    const res = await api.delete(`/chat/conversations/${id}`);
    return res.data;
  },
  async transcribeAudio(formData: FormData): Promise<{ transcript: string }> {
    const res = await api.post('/ai/voice/transcribe', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return res.data;
  }
};

export default api;
