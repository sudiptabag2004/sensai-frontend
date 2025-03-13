"use client";

import "@blocknote/core/fonts/inter.css";
import { BlockNoteView } from "@blocknote/mantine";
import "@blocknote/mantine/style.css";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
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
    showPublishConfirmation?: boolean;
    onPublishConfirm?: () => void;
    onPublishCancel?: () => void;
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
    showPublishConfirmation = false,
    onPublishConfirm,
    onPublishCancel,
}: QuizEditorProps) {
    // Initialize questions state
    const [questions, setQuestions] = useState<QuizQuestion[]>(initialQuestions);

    // Current question index
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

    // State to track if a new question was just added (for animation)
    const [newQuestionAdded, setNewQuestionAdded] = useState(false);

    // State for delete confirmation
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    // Reference to the current BlockNote editor instance
    const editorRef = useRef<any>(null);

    // Use ref to track the last edit to prevent unnecessary updates
    const lastContentUpdateRef = useRef<string>("");

    // Function to set the editor reference
    const setEditorInstance = useCallback((editor: any) => {
        editorRef.current = editor;
    }, []);

    // Function to open the slash menu
    const openSlashMenu = useCallback(() => {
        // Function intentionally left empty - we're not programmatically opening the slash menu
    }, []);

    // Memoize the current question content and config to prevent unnecessary re-renders
    const currentQuestion = useMemo(() =>
        questions[currentQuestionIndex] || { content: [], config: defaultQuestionConfig },
        [questions, currentQuestionIndex]);

    const currentQuestionContent = useMemo(() =>
        currentQuestion.content || [],
        [currentQuestion]);

    const currentQuestionConfig = useMemo(() =>
        currentQuestion.config || defaultQuestionConfig,
        [currentQuestion]);

    // Handle content change for the current question - use useCallback to memoize
    const handleQuestionContentChange = useCallback((content: any[]) => {
        if (questions.length === 0) return;

        // Simply update the content without all the complexity
        const updatedQuestions = [...questions];
        updatedQuestions[currentQuestionIndex] = {
            ...updatedQuestions[currentQuestionIndex],
            content
        };

        // Update state
        setQuestions(updatedQuestions);

        // Call onChange callback if provided
        if (onChange) {
            onChange(updatedQuestions);
        }
    }, [questions, currentQuestionIndex, onChange]);

    // Handle configuration change for the current question
    const handleConfigChange = useCallback((configUpdate: Partial<QuizQuestionConfig>) => {
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
    }, [questions, currentQuestionIndex, onChange]);

    // Add a new question
    const addQuestion = useCallback(() => {
        const newQuestion = {
            id: `question-${Date.now()}`,
            content: [],
            config: { ...defaultQuestionConfig }
        };

        const updatedQuestions = [...questions, newQuestion];
        setQuestions(updatedQuestions);
        setCurrentQuestionIndex(updatedQuestions.length - 1);

        // Reset last content update ref
        lastContentUpdateRef.current = "";

        // Trigger animation
        setNewQuestionAdded(true);

        // Reset animation flag after animation completes
        setTimeout(() => {
            setNewQuestionAdded(false);
        }, 800); // slightly longer than animation duration to ensure it completes

        if (onChange) {
            onChange(updatedQuestions);
        }

        // Removed slash menu opening after adding a new question
    }, [questions, onChange]);

    // Navigate to previous question
    const goToPreviousQuestion = useCallback(() => {
        if (currentQuestionIndex > 0) {
            // Reset last content update ref when navigating to a different question
            lastContentUpdateRef.current = "";
            setCurrentQuestionIndex(currentQuestionIndex - 1);
        }
    }, [currentQuestionIndex]);

    // Navigate to next question
    const goToNextQuestion = useCallback(() => {
        if (currentQuestionIndex < questions.length - 1) {
            // Reset last content update ref when navigating to a different question
            lastContentUpdateRef.current = "";
            setCurrentQuestionIndex(currentQuestionIndex + 1);
        }
    }, [currentQuestionIndex, questions.length]);

    // Delete current question
    const deleteQuestion = useCallback(() => {
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

        // Reset last content update ref when deleting a question
        lastContentUpdateRef.current = "";
    }, [questions, currentQuestionIndex, onChange]);

    // Effect to initialize lastContentUpdateRef when changing questions
    useEffect(() => {
        if (questions.length > 0) {
            lastContentUpdateRef.current = JSON.stringify(currentQuestionContent);
        }
    }, [currentQuestionIndex, questions.length, currentQuestionContent]);

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

            {/* Publish Confirmation Dialog */}
            {showPublishConfirmation && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                    onClick={(e) => {
                        e.stopPropagation(); // Prevent closing the parent dialog
                        onPublishCancel?.(); // Only cancel the publish confirmation
                    }}
                >
                    <div
                        className="w-full max-w-md bg-[#1A1A1A] rounded-lg shadow-2xl border border-gray-800"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="p-6">
                            <h2 className="text-xl font-light text-white mb-4">Ready to publish?</h2>
                            <p className="text-gray-300">After publishing, you won't be able to add or remove questions, but you can still edit existing ones</p>
                        </div>
                        <div className="flex justify-end gap-4 p-6 border-t border-gray-800">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation(); // Prevent event bubbling
                                    onPublishCancel?.();
                                }}
                                className="px-4 py-2 text-gray-400 hover:text-white transition-colors focus:outline-none cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation(); // Prevent event bubbling
                                    onPublishConfirm?.();
                                }}
                                className="px-6 py-2 bg-green-600 text-white text-sm font-medium rounded-full hover:bg-green-700 transition-colors focus:outline-none cursor-pointer"
                            >
                                Publish Now
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
                        {!readOnly && <button
                            onClick={addQuestion}
                            className="flex items-center px-4 py-2 text-sm text-black bg-white hover:bg-gray-100 rounded-md transition-colors cursor-pointer"
                            disabled={readOnly}
                            style={{ opacity: readOnly ? 0.5 : 1 }}
                        >
                            <div className="w-5 h-5 rounded-full border border-black flex items-center justify-center mr-2">
                                <Plus size={12} className="text-black" />
                            </div>
                            Add Question
                        </button>}
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

                    {/* Right: Delete Button - Hide for published quizzes (readOnly mode) */}
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
                    <div className="w-full h-full">
                        <div className="flex h-full bg-[#111111] rounded-md overflow-hidden">
                            {/* Left side - Question */}
                            <div className="w-1/2 p-8 border-r border-[#222222] flex flex-col bg-[#1A1A1A]">
                                {/* Navigation controls at the top of left side - only show if more than one question */}
                                {questions.length > 1 && (
                                    <div className="flex items-center justify-between w-full mb-6">
                                        <div className="w-10 h-10">
                                            {currentQuestionIndex > 0 && (
                                                <button
                                                    className="w-10 h-10 rounded-full flex items-center justify-center bg-[#222222] text-white hover:bg-[#333333] cursor-pointer"
                                                    onClick={goToPreviousQuestion}
                                                >
                                                    <ChevronLeft size={18} />
                                                </button>
                                            )}
                                        </div>

                                        <div className="bg-[#222222] px-3 py-1 rounded-full text-white text-sm">
                                            {currentQuestionIndex + 1}/{questions.length}
                                        </div>

                                        <div className="w-10 h-10">
                                            {currentQuestionIndex < questions.length - 1 && (
                                                <button
                                                    className="w-10 h-10 rounded-full flex items-center justify-center bg-[#222222] text-white hover:bg-[#333333] cursor-pointer"
                                                    onClick={goToNextQuestion}
                                                >
                                                    <ChevronRight size={18} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                )}

                                <div className={`flex-1 ${questions.length > 1 ? 'mt-4' : 'mt-6'}`}>
                                    {/* Use editor with negative margin to offset unwanted space */}
                                    <div className="ml-[-60px]"> {/* Increased negative margin to align with navigation arrow */}
                                        <BlockNoteEditor
                                            key={`question-preview-${currentQuestionIndex}`}
                                            initialContent={currentQuestionContent}
                                            onChange={() => { }} // Read-only in preview mode
                                            isDarkMode={true}
                                            readOnly={true}
                                            className="!bg-transparent"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Right side - Answer */}
                            <div className="w-1/2 p-8 flex flex-col">
                                <div className="flex-1 flex flex-col justify-center items-center text-center mb-8">
                                    <div className="w-16 h-16 mb-4 text-gray-400">
                                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                                            <path d="M21 15C21 15.5304 20.7893 16.0391 20.4142 16.4142C20.0391 16.7893 19.5304 17 19 17H7L3 21V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    </div>
                                    <p className="text-gray-400 text-lg">Type your answer to begin the conversation</p>
                                </div>

                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder="Type your answer here..."
                                        className="w-full bg-[#1A1A1A] border border-[#333333] rounded-md p-4 pr-12 text-white focus:outline-none focus:border-blue-500"
                                    />
                                    <button className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white">
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M22 2L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                            <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
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
                                    {/* Critical change: Use a stable key that never changes
                                        to ensure the editor instance remains stable */}
                                    <BlockNoteEditor
                                        key="quiz-editor-stable"
                                        initialContent={currentQuestionContent}
                                        onChange={handleQuestionContentChange}
                                        isDarkMode={isDarkMode}
                                        readOnly={readOnly}
                                        onEditorReady={setEditorInstance}
                                        className="quiz-editor"
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