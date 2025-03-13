"use client";

import "@blocknote/core/fonts/inter.css";
import { BlockNoteView } from "@blocknote/mantine";
import "@blocknote/mantine/style.css";
import { useState, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, Plus, FileText, Trash2, FileCode, AudioLines, Zap } from "lucide-react";

// Add custom styles for dark mode
import "./editor-styles.css";

// Import the BlockNoteEditor component
import BlockNoteEditor from "./BlockNoteEditor";

export interface QuizQuestionConfig {
    inputType: 'text' | 'code' | 'audio';
    responseStyle: 'coach' | 'examiner' | 'evaluator';
    evaluationCriteria: string[];
    correctAnswer?: string;
    codeLanguage?: string; // For code input type
    audioMaxDuration?: number; // For audio input type in seconds
}

export interface QuizQuestion {
    id: string;
    content: any[];
    config: QuizQuestionConfig;
}

interface QuizEditorProps {
    initialQuestions?: QuizQuestion[];
    onChange?: (questions: QuizQuestion[]) => void;
    isDarkMode?: boolean;
    className?: string;
    isPreviewMode?: boolean;
    readOnly?: boolean;
}

// Default configuration for new questions
const defaultQuestionConfig: QuizQuestionConfig = {
    inputType: 'text',
    responseStyle: 'coach',
    evaluationCriteria: []
};

export default function QuizEditor({
    initialQuestions = [],
    onChange,
    isDarkMode = true,
    className = "",
    isPreviewMode = false,
    readOnly = false,
}: QuizEditorProps) {
    // Initialize questions state
    const [questions, setQuestions] = useState<QuizQuestion[]>(initialQuestions);

    // Current question index
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

    // State to track if a new question was just added (for animation)
    const [newQuestionAdded, setNewQuestionAdded] = useState(false);

    // State for delete confirmation
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    // Handle content change for the current question
    const handleQuestionContentChange = (content: any[]) => {
        if (questions.length === 0) return;

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

    // Handle configuration change for the current question
    const handleConfigChange = (configUpdate: Partial<QuizQuestionConfig>) => {
        if (questions.length === 0) return;

        const updatedQuestions = [...questions];
        updatedQuestions[currentQuestionIndex] = {
            ...updatedQuestions[currentQuestionIndex],
            config: {
                ...updatedQuestions[currentQuestionIndex].config,
                ...configUpdate
            }
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
            content: [],
            config: { ...defaultQuestionConfig }
        };

        const updatedQuestions = [...questions, newQuestion];
        setQuestions(updatedQuestions);
        setCurrentQuestionIndex(updatedQuestions.length - 1);

        // Trigger animation
        setNewQuestionAdded(true);

        // Reset animation flag after animation completes
        setTimeout(() => {
            setNewQuestionAdded(false);
        }, 800); // slightly longer than animation duration to ensure it completes

        if (onChange) {
            onChange(updatedQuestions);
        }
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

    // Delete current question
    const deleteQuestion = () => {
        if (questions.length <= 1) {
            // If only one question, just clear the questions array
            setQuestions([]);
            setShowDeleteConfirm(false);

            if (onChange) {
                onChange([]);
            }
            return;
        }

        const updatedQuestions = [...questions];
        updatedQuestions.splice(currentQuestionIndex, 1);

        setQuestions(updatedQuestions);

        // Adjust current index if necessary
        if (currentQuestionIndex >= updatedQuestions.length) {
            setCurrentQuestionIndex(updatedQuestions.length - 1);
        }

        if (onChange) {
            onChange(updatedQuestions);
        }

        // Hide confirmation dialog
        setShowDeleteConfirm(false);
    };

    // Get the current question's content and config
    const currentQuestionContent = questions[currentQuestionIndex]?.content || [];
    const currentQuestionConfig = questions[currentQuestionIndex]?.config || defaultQuestionConfig;

    // Placeholder component for empty quiz
    const EmptyQuizPlaceholder = () => (
        <div className="flex flex-col items-center justify-center h-full w-full text-center p-8">
            <h3 className="text-xl font-light text-white mb-3">Questions are the gateway to learning</h3>
            <p className="text-gray-400 max-w-md mb-8">
                Add questions to create an interactive quiz for your learners
            </p>
            <button
                onClick={addQuestion}
                className="flex items-center px-5 py-2.5 text-sm text-black bg-white hover:bg-gray-100 rounded-md transition-colors cursor-pointer"
                disabled={readOnly}
            >
                <div className="w-5 h-5 rounded-full border border-black flex items-center justify-center mr-2">
                    <Plus size={12} className="text-black" />
                </div>
                Add Your First Question
            </button>
        </div>
    );

    return (
        <div className="flex flex-col h-full relative">
            {/* Delete confirmation modal */}
            {showDeleteConfirm && !isPreviewMode && (
                <div
                    className="absolute inset-0 backdrop-blur-sm z-10 flex items-center justify-center"
                    onClick={() => setShowDeleteConfirm(false)}
                >
                    <div
                        className="bg-[#333333] p-6 rounded-lg shadow-lg max-w-md w-full"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3 className="text-white text-lg font-normal mb-4">Delete Question</h3>
                        <p className="text-gray-300 mb-6">Are you sure you want to delete this question? This action cannot be undone.</p>
                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={() => setShowDeleteConfirm(false)}
                                className="px-6 py-2 bg-[#474747] text-white hover:bg-[#525252] rounded-md cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={deleteQuestion}
                                className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md flex items-center cursor-pointer"
                            >
                                <Trash2 size={16} className="mr-2" />
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Quiz Controls - Hide in preview mode and when there are no questions */}
            {!isPreviewMode && questions.length > 0 && (
                <div className="flex justify-between items-center mb-4 px-2 py-3">
                    {/* Left: Add Question Button */}
                    <div className="flex-1">
                        <button
                            onClick={addQuestion}
                            className="flex items-center px-4 py-2 text-sm text-black bg-white hover:bg-gray-100 rounded-md transition-colors cursor-pointer"
                            disabled={readOnly}
                            style={{ opacity: readOnly ? 0.5 : 1 }}
                        >
                            <div className="w-5 h-5 rounded-full border border-black flex items-center justify-center mr-2">
                                <Plus size={12} className="text-black" />
                            </div>
                            Add Question
                        </button>
                    </div>

                    {/* Middle: Navigation Controls */}
                    <div className="flex-1 flex items-center justify-center">
                        <button
                            onClick={goToPreviousQuestion}
                            disabled={currentQuestionIndex === 0}
                            className={`w-10 h-10 flex items-center justify-center rounded-full ${currentQuestionIndex === 0 ? 'text-gray-600 cursor-not-allowed' : 'text-gray-300 hover:text-white hover:bg-[#3A3A3A] cursor-pointer'} transition-colors border border-[#3A3A3A]`}
                            aria-label="Previous question"
                        >
                            <ChevronLeft size={20} />
                        </button>

                        <div className="mx-3 px-4 py-1.5 rounded-full border border-[#3A3A3A] bg-[#2A2A2A] text-gray-300 text-sm font-medium">
                            Question {currentQuestionIndex + 1} / {questions.length}
                        </div>

                        <button
                            onClick={goToNextQuestion}
                            disabled={currentQuestionIndex === questions.length - 1}
                            className={`w-10 h-10 flex items-center justify-center rounded-full ${currentQuestionIndex === questions.length - 1 ? 'text-gray-600 cursor-not-allowed' : 'text-gray-300 hover:text-white hover:bg-[#3A3A3A] cursor-pointer'} transition-colors border border-[#3A3A3A]`}
                            aria-label="Next question"
                        >
                            <ChevronRight size={20} />
                        </button>
                    </div>

                    {/* Right: Delete Button */}
                    <div className="flex-1 flex justify-end">
                        {!readOnly && (
                            <button
                                onClick={() => setShowDeleteConfirm(true)}
                                className="flex items-center px-3 py-1.5 text-sm text-red-400 hover:text-white bg-[#3A3A3A] hover:bg-red-600 rounded-md transition-colors cursor-pointer"
                                aria-label="Delete current question"
                            >
                                <Trash2 size={16} className="mr-1" />
                                Delete
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* Content area with animation when a new question is added */}
            <div className={`flex flex-1 gap-4 ${newQuestionAdded ? 'animate-new-question' : ''}`}>
                {isPreviewMode ? (
                    <div className="preview-mode flex-grow overflow-auto p-6">
                        <div className="max-w-3xl mx-auto bg-[#2A2A2A] p-6 rounded-lg shadow-lg">
                            <div className="mb-6 flex items-center justify-start">
                                <div className="question-number-circle bg-[#3A3A3A] text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center">
                                    {currentQuestionIndex + 1}
                                </div>
                                <h2 className="text-xl font-medium text-white ml-3">Question {currentQuestionIndex + 1}</h2>
                            </div>
                            <div className="question-content mb-6">
                                {/* Custom content display for preview mode */}
                                <div className="preview-content">
                                    {/* Simple content display for now */}
                                    {currentQuestionContent.length > 0 ? (
                                        <div className="text-white">
                                            {/* Placeholder for content display */}
                                            <p>Question content would be displayed here</p>
                                        </div>
                                    ) : (
                                        <div className="text-gray-400 italic">
                                            <p>No content added to this question yet.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="response-area">
                                <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-400 mb-2">Your Response</h3>
                                {/* Placeholder for response input field */}
                                {currentQuestionConfig.inputType === 'text' && (
                                    <div className="bg-[#1E1E1E] border border-[#3A3A3A] p-4 rounded-md min-h-[150px] text-white">
                                        <p className="text-gray-500 italic">Enter your answer here...</p>
                                    </div>
                                )}
                                {currentQuestionConfig.inputType === 'code' && (
                                    <div className="bg-[#1E1E1E] border border-[#3A3A3A] p-4 rounded-md min-h-[150px] font-mono text-white">
                                        <p className="text-gray-500 italic">// Write your code here...</p>
                                    </div>
                                )}
                                {currentQuestionConfig.inputType === 'audio' && (
                                    <div className="bg-[#1E1E1E] border border-[#3A3A3A] p-4 rounded-md flex items-center justify-center h-[100px] text-white">
                                        <div className="flex flex-col items-center">
                                            <AudioLines size={24} className="text-gray-400 mb-2" />
                                            <p className="text-gray-500 italic">Click to record audio response</p>
                                        </div>
                                    </div>
                                )}

                                <div className="flex justify-end mt-4">
                                    <button className="bg-[#016037] text-white font-medium py-2 px-4 rounded-md flex items-center">
                                        <Zap size={16} className="mr-2" />
                                        Submit Answer
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <>
                        {questions.length === 0 ? (
                            <div className="w-full flex justify-center items-center">
                                <EmptyQuizPlaceholder />
                            </div>
                        ) : (
                            <div className="w-full">
                                <div className="editor-container h-full">
                                    <BlockNoteEditor
                                        key={`question-editor-${currentQuestionIndex}`}
                                        initialContent={currentQuestionContent}
                                        onChange={handleQuestionContentChange}
                                        isDarkMode={isDarkMode}
                                        readOnly={readOnly}
                                    />
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
} 