"use client";

import "@blocknote/core/fonts/inter.css";
import { BlockNoteView } from "@blocknote/mantine";
import "@blocknote/mantine/style.css";
import { useState } from "react";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";

// Add custom styles for dark mode
import "./editor-styles.css";

// Import the LearningMaterialEditor for each question
import LearningMaterialEditor from "./LearningMaterialEditor";

export interface QuizQuestion {
    id: string;
    content: any[];
}

interface QuizEditorProps {
    initialQuestions?: QuizQuestion[];
    onChange?: (questions: QuizQuestion[]) => void;
    isDarkMode?: boolean;
    className?: string;
}

export default function QuizEditor({
    initialQuestions = [],
    onChange,
    isDarkMode = true,
    className = "",
}: QuizEditorProps) {
    // Initialize questions state
    const [questions, setQuestions] = useState<QuizQuestion[]>(() => {
        if (initialQuestions && initialQuestions.length > 0) {
            return initialQuestions;
        }
        return [{ id: `question-${Date.now()}`, content: [] }];
    });

    // Current question index
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

    // Handle content change for the current question
    const handleQuestionContentChange = (content: any[]) => {
        const updatedQuestions = [...questions];
        updatedQuestions[currentQuestionIndex] = {
            ...updatedQuestions[currentQuestionIndex],
            content
        };

        setQuestions(updatedQuestions);

        if (onChange) {
            onChange(updatedQuestions);
        }
    };

    // Add a new question
    const addQuestion = () => {
        const newQuestion = {
            id: `question-${Date.now()}`,
            content: []
        };

        setQuestions(prev => [...prev, newQuestion]);
        setCurrentQuestionIndex(questions.length);
    };

    // Navigate to previous question
    const goToPreviousQuestion = () => {
        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex(currentQuestionIndex - 1);
        }
    };

    // Navigate to next question
    const goToNextQuestion = () => {
        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(currentQuestionIndex + 1);
        }
    };

    // Get the current question's content
    const currentQuestionContent = questions[currentQuestionIndex]?.content || [];

    return (
        <div className="flex flex-col h-full">
            {/* Quiz Controls */}
            <div className="flex items-center justify-between mb-4 px-2 py-3">
                <button
                    onClick={addQuestion}
                    className="flex items-center px-3 py-1.5 text-sm text-gray-300 hover:text-white bg-[#3A3A3A] hover:bg-[#4A4A4A] rounded-md transition-colors"
                >
                    <Plus size={16} className="mr-1" />
                    Add Question
                </button>

                <div className="flex items-center space-x-4">
                    <button
                        onClick={goToPreviousQuestion}
                        disabled={currentQuestionIndex === 0}
                        className={`p-1 rounded-full ${currentQuestionIndex === 0 ? 'text-gray-600' : 'text-gray-300 hover:text-white hover:bg-[#3A3A3A]'} transition-colors`}
                        aria-label="Previous question"
                    >
                        <ChevronLeft size={20} />
                    </button>

                    <span className="text-sm text-gray-300">
                        Question {currentQuestionIndex + 1} of {questions.length}
                    </span>

                    <button
                        onClick={goToNextQuestion}
                        disabled={currentQuestionIndex === questions.length - 1}
                        className={`p-1 rounded-full ${currentQuestionIndex === questions.length - 1 ? 'text-gray-600' : 'text-gray-300 hover:text-white hover:bg-[#3A3A3A]'} transition-colors`}
                        aria-label="Next question"
                    >
                        <ChevronRight size={20} />
                    </button>
                </div>
            </div>

            {/* Split screen layout */}
            <div className="flex flex-1 gap-4">
                {/* Editor Container - Left side */}
                <div className={`w-1/2 dark-editor-container dark-dialog ${className}`}>
                    <LearningMaterialEditor
                        key={`question-editor-${currentQuestionIndex}`}
                        initialContent={currentQuestionContent}
                        onChange={handleQuestionContentChange}
                        isDarkMode={isDarkMode}
                    />
                </div>

                {/* Preview Container - Right side */}
                <div className="w-1/2 bg-[#1E1E1E] rounded-md">
                    {/* Preview content will go here */}
                </div>
            </div>
        </div>
    );
} 