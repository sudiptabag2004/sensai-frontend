import { CriterionData, ScorecardTemplate } from "../components/ScorecardPickerDialog";

export interface QuizEditorHandle {
    save: () => Promise<void>;
    cancel: () => void;
    hasContent: () => boolean;
}

export interface QuizQuestionConfig {
    inputType: 'text' | 'code' | 'audio';
    responseStyle: 'coach' | 'examiner' | 'evaluator';
    evaluationCriteria: string[];
    correctAnswer?: string;
    correctAnswerBlocks?: any[];
    codeLanguage?: string; // For code input type
    audioMaxDuration?: number; // For audio input type in seconds
    questionType?: 'default' | 'open-ended' | 'coding';
    scorecardData?: ScorecardTemplate;
}

export interface QuizQuestion {
    id: string;
    content: any[];
    config: QuizQuestionConfig;
}

export interface QuizEditorProps {
    initialQuestions?: QuizQuestion[]; // Kept for backward compatibility but not used anymore
    onChange?: (questions: QuizQuestion[]) => void;
    isDarkMode?: boolean;
    className?: string;
    isPreviewMode?: boolean;
    readOnly?: boolean;
    onPublish?: () => void;
    taskId?: string;
    status?: string;
    onPublishSuccess?: (updatedData?: any) => void;
    showPublishConfirmation?: boolean;
    onPublishCancel?: () => void;
    isEditMode?: boolean;
    onSaveSuccess?: (updatedData?: any) => void;
    taskType?: 'quiz' | 'exam';
    currentQuestionId?: string;
    onQuestionChange?: (questionId: string) => void;
    onSubmitAnswer?: (questionId: string, answer: string) => void;
    userId?: string;
    schoolId?: string; // ID of the school for fetching school-specific scorecards
}

export interface ScorecardCriterion {
    name: string;
    description: string;
    min_score: number;
    max_score: number;
}

// Define the API response question interface
export interface APIQuestionResponse {
    id: number;
    blocks: any[];
    answer?: string;
    type: string;
    input_type: string;
    response_type: string;
    scorecard_id?: number;
    scorecard?: {
        id: number;
        title: string;
        criteria: {
            id: number;
            name: string;
            description: string;
            min_score: number;
            max_score: number;
        }[];
    };
} 