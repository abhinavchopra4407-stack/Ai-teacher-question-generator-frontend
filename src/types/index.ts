export interface User {
  id: string;
  email: string;
  full_name: string;
  is_verified: boolean;
  has_custom_key?: boolean;
  created_at: string;
}

export interface SectionConfig {
  id?: string;
  name: string;
  type: string;
  enabled: boolean;
  question_count: number;
  marks_per_question: number;
  expected_length?: string;
  difficulty?: string;
}

export interface SingleQuestion {
  id: string;
  question_number: number;
  question_text: string;
  question_type: 'Very Short Answer' | 'Short Answer' | 'Long Answer' | string;
  difficulty: 'Easy' | 'Medium' | 'Hard' | string;
  marks: number;
  related_topic: string;
  section_name?: string;
  source_pages?: number[];
  answer?: string;
  marking_points?: string[];
  expected_length?: string;
}

export interface QuestionPaper {
  id: string;
  user_id: string;
  document_id?: string;
  title: string;
  subject: string;
  grade: string;
  board?: string;
  language: string;
  difficulty: string;
  total_marks: number;
  school_name?: string;
  teacher_name?: string;
  instructions?: string;
  sections?: SectionConfig[];
  questions: SingleQuestion[];
  answer_key?: SingleQuestion[];
  created_at: string;
  updated_at: string;
}

export interface DashboardStats {
  total_papers: number;
  total_chapters: number;
  recent_papers: QuestionPaper[];
}

export interface GenerateQuestionsRequest {
  document_id?: string;
  chapter_title: string;
  subject: string;
  grade: string;
  board?: string;
  language?: string;
  difficulty?: string;
  sections?: SectionConfig[];
  marks_distribution?: {
    very_short: number;
    short: number;
    long: number;
  };
  special_instructions?: string;
  raw_content?: string;
}
