export interface QuizQuestion {
  id: string;
  question: string;
  type: string;
  options?: string[];
  answer?: string;
  explanation?: string;
}

export interface LearningMaterial {
  id: string;
  title: string;
  position: number;
  type: 'material';
  content?: any[]; // Using any[] for content blocks
}

export interface Quiz {
  id: string;
  title: string;
  position: number;
  type: 'quiz';
  questions: QuizQuestion[];
}

export interface Exam {
  id: string;
  title: string;
  position: number;
  type: 'exam';
  questions: QuizQuestion[];
}

export type ModuleItem = LearningMaterial | Quiz | Exam;

export interface Module {
  id: string;
  title: string;
  position: number;
  items: ModuleItem[];
  isExpanded?: boolean;
  backgroundColor?: string;
  isEditing?: boolean;
}

export interface CourseDetails {
  id: number | string;
  name: string;
  description?: string;
  modules?: Module[];
} 