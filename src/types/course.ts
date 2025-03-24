
import { QuizQuestion } from "./quiz";
export interface LearningMaterial {
  id: string;
  title: string;
  position: number;
  type: 'material';
  content?: any[]; // Using any[] for content blocks
  status?: string; // Add status field to track draft/published state
}

export interface Quiz {
  id: string;
  title: string;
  position: number;
  type: 'quiz';
  questions: QuizQuestion[];
  status?: string; // Add status field to track draft/published state
}

export interface Exam {
  id: string;
  title: string;
  position: number;
  type: 'exam';
  questions: QuizQuestion[];
  status?: string; // Add status field to track draft/published state
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