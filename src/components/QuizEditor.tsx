"use client";

import "@blocknote/core/fonts/inter.css";
import { BlockNoteView } from "@blocknote/mantine";
import "@blocknote/mantine/style.css";
import { useState, useEffect, useRef, useCallback, useMemo, forwardRef, useImperativeHandle } from "react";
import { ChevronLeft, ChevronRight, Plus, FileText, Trash2, FileCode, AudioLines, Zap, Sparkles, Check, HelpCircle } from "lucide-react";
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteSchema } from "@blocknote/core";

// Add custom styles for dark mode
import "./editor-styles.css";

// Import the BlockNoteEditor component
import BlockNoteEditor from "./BlockNoteEditor";
// Import the LearnerQuizView component
import LearnerQuizView from "./LearnerQuizView";

// Define the editor handle with methods that can be called by parent components
export interface QuizEditorHandle {
    save: () => Promise<void>;
    cancel: () => void;
}

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

export interface QuizEditorProps {
    initialQuestions?: QuizQuestion[];
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
}

// Default configuration for new questions
const defaultQuestionConfig: QuizQuestionConfig = {
    inputType: 'text',
    responseStyle: 'coach',
    evaluationCriteria: []
};

// Helper function to extract text from all blocks in a BlockNote document
const extractTextFromBlocks = (blocks: any[]): string => {
    if (!blocks || blocks.length === 0) return "";

    return blocks.map(block => {
        // Handle different block types
        if (block.type === "paragraph") {
            // For paragraph blocks, extract text content
            return block.content ? block.content.map((item: any) =>
                typeof item === 'string' ? item : (item.text || "")
            ).join("") : "";
        } else if (block.type === "heading") {
            // For heading blocks, extract text content
            return block.content ? block.content.map((item: any) =>
                typeof item === 'string' ? item : (item.text || "")
            ).join("") : "";
        } else if (block.type === "bulletListItem" || block.type === "numberedListItem") {
            // For list items, extract text content
            return block.content ? block.content.map((item: any) =>
                typeof item === 'string' ? item : (item.text || "")
            ).join("") : "";
        } else if (block.text) {
            // Fallback for blocks with direct text property
            return block.text;
        }
        return "";
    }).join("\n").trim();
};

const QuizEditor = forwardRef<QuizEditorHandle, QuizEditorProps>(({
    initialQuestions = [],
    onChange,
    isDarkMode = true,
    className = "",
    isPreviewMode = false,
    readOnly = false,
    onPublish,
    taskId,
    status = 'draft',
    onPublishSuccess,
    showPublishConfirmation = false,
    onPublishCancel,
    isEditMode = false,
    onSaveSuccess,
    taskType = 'quiz',
    currentQuestionId,
    onQuestionChange,
    onSubmitAnswer,
    userId,
}, ref) => {
    // Initialize questions state
    const [questions, setQuestions] = useState<QuizQuestion[]>(initialQuestions);
    // Store the original data for cancel functionality
    const originalQuestionsRef = useRef<QuizQuestion[]>([]);

    // Update questions when initialQuestions prop changes
    useEffect(() => {
        if (!initialQuestions || initialQuestions.length === 0) {
            setQuestions([]);
            return;
        }

        // Ensure each question has the required properties
        const formattedQuestions = initialQuestions.map(q => {
            // Handle potential different formats from API
            const questionContent = Array.isArray(q.content) ? q.content :
                (q as any).blocks ? (q as any).blocks : [];

            // Handle potential different config formats
            const correctAnswer = q.config?.correctAnswer ||
                (q as any).answer || '';

            return {
                id: q.id || `question-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                content: questionContent,
                config: {
                    inputType: q.config?.inputType || 'text',
                    responseStyle: q.config?.responseStyle || 'coach',
                    evaluationCriteria: q.config?.evaluationCriteria || [],
                    correctAnswer: correctAnswer,
                    codeLanguage: q.config?.codeLanguage || '',
                    audioMaxDuration: q.config?.audioMaxDuration || 60
                }
            };
        });

        setQuestions(formattedQuestions);
        // Store the original questions for cancel operation
        originalQuestionsRef.current = JSON.parse(JSON.stringify(formattedQuestions));
    }, [initialQuestions]);

    // Current question index
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

    // Internal state to track the current question ID for preview mode
    const [activeQuestionId, setActiveQuestionId] = useState<string | undefined>(
        currentQuestionId || (questions.length > 0 ? questions[0]?.id : undefined)
    );

    // Update current question index when currentQuestionId changes
    useEffect(() => {
        if (currentQuestionId && questions.length > 0) {
            const index = questions.findIndex(q => q.id === currentQuestionId);
            if (index !== -1) {
                setCurrentQuestionIndex(index);
                setActiveQuestionId(currentQuestionId);
            }
        }
    }, [currentQuestionId, questions]);

    // Update activeQuestionId when currentQuestionIndex changes
    useEffect(() => {
        if (questions.length > 0 && currentQuestionIndex >= 0 && currentQuestionIndex < questions.length) {
            setActiveQuestionId(questions[currentQuestionIndex].id);
        }
    }, [currentQuestionIndex, questions]);

    // State to track if a new question was just added (for animation)
    const [newQuestionAdded, setNewQuestionAdded] = useState(false);

    // State for delete confirmation
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    // State for tracking publishing status
    const [isPublishing, setIsPublishing] = useState(false);

    // State for tracking publishing errors
    const [publishError, setPublishError] = useState<string | null>(null);

    // Reference to the current BlockNote editor instance
    const editorRef = useRef<any>(null);

    // Use ref to track the last edit to prevent unnecessary updates
    const lastContentUpdateRef = useRef<string>("");

    // Reference to the correct answer editor
    const correctAnswerEditorRef = useRef<any>(null);

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

    // Function to set the correct answer editor reference
    const setCorrectAnswerEditorInstance = useCallback((editor: any) => {
        correctAnswerEditorRef.current = editor;
    }, []);

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

    // Handle correct answer change
    const handleCorrectAnswerChange = useCallback((correctAnswer: string) => {
        if (questions.length === 0) return;

        const updatedQuestions = [...questions];
        updatedQuestions[currentQuestionIndex] = {
            ...updatedQuestions[currentQuestionIndex],
            config: {
                ...updatedQuestions[currentQuestionIndex].config,
                correctAnswer
            }
        };

        setQuestions(updatedQuestions);

        if (onChange) {
            onChange(updatedQuestions);
        }
    }, [questions, currentQuestionIndex, onChange]);

    // Handle correct answer content change
    const handleCorrectAnswerContentChange = useCallback((content: any[]) => {
        // Simply store the content in the editor without processing
        // The actual text extraction will happen during save/publish

        // Instead of processing on every keystroke, we do nothing here
        // This allows normal typing behavior without state updates interrupting input

        // Note: We intentionally don't call handleCorrectAnswerChange here
        // The correctAnswer will be extracted when saving or publishing
    }, []);

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
            const newIndex = currentQuestionIndex - 1;
            setCurrentQuestionIndex(newIndex);

            // Call the onQuestionChange callback if provided
            if (onQuestionChange && questions[newIndex]) {
                onQuestionChange(questions[newIndex].id);
            }
        }
    }, [currentQuestionIndex, onQuestionChange, questions]);

    // Navigate to next question
    const goToNextQuestion = useCallback(() => {
        if (currentQuestionIndex < questions.length - 1) {
            // Reset last content update ref when navigating to a different question
            lastContentUpdateRef.current = "";
            const newIndex = currentQuestionIndex + 1;
            setCurrentQuestionIndex(newIndex);

            // Call the onQuestionChange callback if provided
            if (onQuestionChange && questions[newIndex]) {
                onQuestionChange(questions[newIndex].id);
            }
        }
    }, [currentQuestionIndex, questions.length, onQuestionChange, questions]);

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
            {status === 'draft' && (
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
            )}
        </div>
    );

    // Handle publish confirmation
    const handleShowPublishConfirmation = () => {
        if (onPublish) {
            onPublish();
        }
    };

    const handleCancelPublish = () => {
        if (onPublishCancel) {
            onPublishCancel();
        }
    };

    const handleConfirmPublish = async () => {
        if (!taskId) {
            console.error("Cannot publish: taskId is not provided");
            setPublishError("Cannot publish: Task ID is missing");
            return;
        }

        setIsPublishing(true);
        setPublishError(null);

        try {
            // Get the current title from the dialog - it may have been edited
            const dialogTitleElement = document.querySelector('.dialog-content-editor')?.parentElement?.querySelector('h2');
            const currentTitle = dialogTitleElement?.textContent || '';

            // Format questions for the API
            const formattedQuestions = questions.map((question, index) => {
                // Extract correct answer text directly from the editor if we're on the current question
                let correctAnswerText = question.config.correctAnswer || "";

                // If this is the current question, extract the text from the editor
                if (index === currentQuestionIndex && correctAnswerEditorRef.current) {
                    try {
                        const blocks = correctAnswerEditorRef.current.document;
                        if (blocks && blocks.length > 0) {
                            // Use the helper function to extract text from all blocks
                            correctAnswerText = extractTextFromBlocks(blocks);

                            // Update the question in state so it has the correct value
                            const updatedQuestions = [...questions];
                            updatedQuestions[currentQuestionIndex] = {
                                ...updatedQuestions[currentQuestionIndex],
                                config: {
                                    ...updatedQuestions[currentQuestionIndex].config,
                                    correctAnswer: correctAnswerText
                                }
                            };

                            // Update the questions state
                            setQuestions(updatedQuestions);
                        }
                    } catch (e) {
                        console.error("Error extracting text from correct answer editor:", e);
                    }
                }

                console.log(`Question ${question.id} - Correct answer: "${correctAnswerText}"`);

                return {
                    blocks: question.content,
                    answer: correctAnswerText,
                    input_type: "text",
                    response_type: "chat",
                    coding_languages: null,
                    generation_model: null,
                    type: "objective",
                    max_attempts: taskType === 'exam' ? 1 : null,
                    is_feedback_shown: taskType === 'exam' ? false : true
                };
            });

            console.log("Publishing quiz with title:", currentTitle);
            console.log("Formatted questions:", formattedQuestions);

            // Make POST request to publish the quiz
            const response = await fetch(`http://localhost:8001/tasks/${taskId}/quiz`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    title: currentTitle,
                    questions: formattedQuestions
                }),
            });

            if (!response.ok) {
                throw new Error(`Failed to publish quiz: ${response.status}`);
            }

            // Get the updated task data from the response
            const updatedTaskData = await response.json();
            console.log("API response:", updatedTaskData);

            // Ensure the status is set to 'published'
            const publishedTaskData = {
                ...updatedTaskData,
                status: 'published',
                title: currentTitle,
                id: taskId // Ensure the ID is included for proper updating in the module list
            };

            console.log("Quiz published successfully", publishedTaskData);

            // Set publishing to false to avoid state updates during callbacks
            setIsPublishing(false);

            // Call the original onPublish callback if provided
            if (onPublish) {
                onPublish();
            }

            // Call the onPublishSuccess callback if provided
            if (onPublishSuccess) {
                // Use setTimeout to break the current render cycle
                setTimeout(() => {
                    onPublishSuccess(publishedTaskData);
                }, 0);
            }
        } catch (error) {
            console.error("Error publishing quiz:", error);
            setPublishError(error instanceof Error ? error.message : "Failed to publish quiz");
            setIsPublishing(false);
        }
    };

    // Handle save for edit mode
    const handleSave = async () => {
        if (!taskId) {
            console.error("Cannot save: taskId is not provided");
            return;
        }

        try {
            // Get the current title from the dialog - it may have been edited
            const dialogTitleElement = document.querySelector('.dialog-content-editor')?.parentElement?.querySelector('h2');
            const currentTitle = dialogTitleElement?.textContent || '';

            // Format questions for the API
            const formattedQuestions = questions.map((question, index) => {
                // Extract correct answer text directly from the editor if we're on the current question
                let correctAnswerText = question.config.correctAnswer || "";

                // If this is the current question, extract the text from the editor
                if (index === currentQuestionIndex && correctAnswerEditorRef.current) {
                    try {
                        const blocks = correctAnswerEditorRef.current.document;
                        if (blocks && blocks.length > 0) {
                            // Use the helper function to extract text from all blocks
                            correctAnswerText = extractTextFromBlocks(blocks);

                            // Update the question in state so it has the correct value
                            const updatedQuestions = [...questions];
                            updatedQuestions[currentQuestionIndex] = {
                                ...updatedQuestions[currentQuestionIndex],
                                config: {
                                    ...updatedQuestions[currentQuestionIndex].config,
                                    correctAnswer: correctAnswerText
                                }
                            };

                            // Update the questions state
                            setQuestions(updatedQuestions);
                        }
                    } catch (e) {
                        console.error("Error extracting text from correct answer editor:", e);
                    }
                }

                return {
                    id: question.id,
                    blocks: question.content,
                    answer: correctAnswerText,
                };
            });

            // Make PUT request to update the quiz content, keeping the same status
            const response = await fetch(`http://localhost:8001/tasks/${taskId}/quiz`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    title: currentTitle,
                    questions: formattedQuestions
                }),
            });

            if (!response.ok) {
                throw new Error(`Failed to save quiz: ${response.status}`);
            }

            // Get the updated task data from the response
            const updatedTaskData = await response.json();

            // Create updated data with the current title
            const updatedData = {
                ...updatedTaskData,
                title: currentTitle,
                id: taskId
            };

            console.log("Quiz saved successfully", updatedData);

            // Call the onSaveSuccess callback if provided
            if (onSaveSuccess) {
                setTimeout(() => {
                    onSaveSuccess(updatedData);
                }, 0);
            }
        } catch (error) {
            console.error("Error saving quiz:", error);
        }
    };

    // Handle cancel in edit mode - revert to original data
    const handleCancel = () => {
        if (originalQuestionsRef.current.length === 0) return;

        // Restore the original questions
        setQuestions(JSON.parse(JSON.stringify(originalQuestionsRef.current)));

        // Return the original title to the dialog header if needed
        const dialogTitleElement = document.querySelector('.dialog-content-editor')?.parentElement?.querySelector('h2');
        if (dialogTitleElement) {
            // Here you would set the original title if you were storing it
            // For now, this is a placeholder
        }
    };

    // Expose methods via the forwarded ref
    useImperativeHandle(ref, () => ({
        save: handleSave,
        cancel: handleCancel
    }));

    // Update current question index when the question changes in preview mode
    useEffect(() => {
        if (isPreviewMode && activeQuestionId && questions.length > 0) {
            const index = questions.findIndex(q => q.id === activeQuestionId);
            if (index !== -1 && index !== currentQuestionIndex) {
                setCurrentQuestionIndex(index);

                // Also ensure the parent component is notified of the change
                // Only necessary when the change originated from within this component
                if (onQuestionChange && !currentQuestionId) {
                    onQuestionChange(activeQuestionId);
                }
            }
        }
    }, [activeQuestionId, isPreviewMode, questions, currentQuestionIndex, onQuestionChange, currentQuestionId]);

    // Memoize the LearnerQuizView component to prevent unnecessary re-renders
    const MemoizedLearnerQuizView = useMemo(() => {
        return (
            <LearnerQuizView
                questions={questions}
                isDarkMode={isDarkMode}
                readOnly={readOnly}
                className="w-full h-full"
                onSubmitAnswer={onSubmitAnswer}
                taskType={taskType}
                currentQuestionId={activeQuestionId}
                onQuestionChange={(questionId) => {
                    // Update our internal state
                    setActiveQuestionId(questionId);
                    // Also pass the change up to the parent component
                    if (onQuestionChange) {
                        onQuestionChange(questionId);
                    }
                }}
                userId={userId}
                isTeacherTesting={true}
            />
        );
    }, [questions, isDarkMode, readOnly, onSubmitAnswer, taskType, activeQuestionId, onQuestionChange, userId]);

    return (
        <div className="flex flex-col h-full relative" key={`quiz-${taskId}-${isEditMode ? 'edit' : 'view'}`}>
            {/* Delete confirmation modal */}
            {showDeleteConfirm && !isPreviewMode && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                    onClick={() => setShowDeleteConfirm(false)}
                >
                    <div
                        className="w-full max-w-md bg-[#1A1A1A] rounded-lg shadow-2xl border border-gray-800"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="p-6">
                            <h2 className="text-xl font-light text-white mb-4">Delete Question</h2>
                            <p className="text-gray-300">Are you sure you want to delete this question? This action cannot be undone.</p>
                        </div>
                        <div className="flex justify-end gap-4 p-6 border-t border-gray-800">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation(); // Prevent event bubbling
                                    setShowDeleteConfirm(false);
                                }}
                                className="px-4 py-2 text-gray-400 hover:text-white transition-colors focus:outline-none cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation(); // Prevent event bubbling
                                    deleteQuestion();
                                }}
                                className="px-6 py-2 bg-red-600 text-white text-sm font-medium rounded-full hover:bg-red-700 transition-colors focus:outline-none cursor-pointer flex items-center"
                            >
                                <Trash2 size={16} className="mr-2" />
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Publish Confirmation Dialog - Now controlled by parent */}
            {showPublishConfirmation && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                    onClick={(e) => {
                        e.stopPropagation(); // Prevent closing the parent dialog
                        handleCancelPublish(); // Only cancel the publish confirmation
                    }}
                >
                    <div
                        className="w-full max-w-md bg-[#1A1A1A] rounded-lg shadow-2xl border border-gray-800"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="p-6">
                            <h2 className="text-xl font-light text-white mb-4">Ready to publish?</h2>
                            <p className="text-gray-300">After publishing, you won't be able to add or remove questions, but you can still edit existing ones</p>
                            {publishError && (
                                <p className="mt-4 text-red-400 text-sm">{publishError}</p>
                            )}
                        </div>
                        <div className="flex justify-end gap-4 p-6 border-t border-gray-800">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation(); // Prevent event bubbling
                                    handleCancelPublish();
                                }}
                                className="px-4 py-2 text-gray-400 hover:text-white transition-colors focus:outline-none cursor-pointer"
                                disabled={isPublishing}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation(); // Prevent event bubbling
                                    handleConfirmPublish();
                                }}
                                className={`px-6 py-2 bg-green-700 text-white text-sm font-medium rounded-full hover:bg-green-800 transition-colors focus:outline-none cursor-pointer ${isPublishing ? 'opacity-70' : ''}`}
                                disabled={isPublishing}
                            >
                                {isPublishing ? (
                                    <div className="flex items-center justify-center">
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                        <span>Publish Now</span>
                                    </div>
                                ) : 'Publish Now'}
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
                        {!readOnly && status === 'draft' && <button
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

                    {/* Right: Delete Button and Publish Button */}
                    <div className="flex-1 flex justify-end items-center space-x-3">
                        {!readOnly && status === 'draft' && (
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
                    <>
                        <div
                            className="w-full h-full"
                            onClick={(e) => e.stopPropagation()} // Stop events from bubbling up
                            onMouseDown={(e) => e.stopPropagation()} // Stop mousedown events too
                        >
                            {MemoizedLearnerQuizView}
                        </div>
                    </>
                ) : (
                    <>
                        {questions.length === 0 ? (
                            <div className="w-full flex justify-center items-center">
                                <EmptyQuizPlaceholder />
                            </div>
                        ) : (
                            <div className="w-full flex">
                                {/* Question Editor - 80% width */}
                                <div className="w-3/5 pr-4">
                                    <div className="flex flex-col ml-12 mb-2">
                                        <div className="mb-2 flex items-center">
                                            <HelpCircle size={16} className="text-blue-500 mr-2" />
                                            <h3 className="text-white text-sm font-light">Question</h3>
                                        </div>
                                        {status !== 'published' && (
                                            <p className="text-gray-400 text-xs">
                                                The content of the question with all the details that a learner needs to answer it
                                            </p>
                                        )}
                                    </div>
                                    <div className="editor-container h-full">
                                        <BlockNoteEditor
                                            key={`quiz-editor-question-${currentQuestionIndex}`}
                                            initialContent={currentQuestionContent}
                                            onChange={handleQuestionContentChange}
                                            isDarkMode={isDarkMode}
                                            readOnly={readOnly}
                                            onEditorReady={setEditorInstance}
                                            className="quiz-editor"
                                        />
                                    </div>
                                </div>

                                {/* Correct Answer Section - 20% width */}
                                <div className="w-2/5 pl-4 border-l border-[#3A3A3A]">
                                    <div className="h-full flex flex-col">
                                        <div className="mb-2 flex items-center">
                                            <Check size={16} className="text-green-500 mr-2" />
                                            <h3 className="text-white text-sm font-light">Correct Answer</h3>
                                        </div>
                                        {status !== 'published' && (
                                            <p className="text-gray-400 text-xs">
                                                This will be used for automatic grading and feedback
                                            </p>
                                        )}
                                        <div
                                            className="flex-1 bg-[#1A1A1A] rounded-md overflow-hidden"
                                            // Add click handler to prevent event propagation
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                // Ensure the correct answer editor keeps focus
                                                if (correctAnswerEditorRef.current) {
                                                    try {
                                                        // Try to focus the editor
                                                        correctAnswerEditorRef.current.focusEditor();
                                                    } catch (err) {
                                                        console.error("Error focusing correct answer editor:", err);
                                                    }
                                                }
                                            }}
                                            // Prevent mousedown from bubbling up which can cause focus issues
                                            onMouseDown={(e) => {
                                                e.stopPropagation();
                                            }}
                                        >
                                            <BlockNoteEditor
                                                key={`correct-answer-editor-${currentQuestionIndex}`}
                                                initialContent={currentQuestionConfig.correctAnswer ? [
                                                    {
                                                        type: "paragraph",
                                                        content: currentQuestionConfig.correctAnswer
                                                    }
                                                ] : []}
                                                onChange={handleCorrectAnswerContentChange}
                                                isDarkMode={isDarkMode}
                                                readOnly={readOnly}
                                                onEditorReady={setCorrectAnswerEditorInstance}
                                                className="correct-answer-editor"
                                                placeholder="Enter the correct answer here"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
});

// Add display name for better debugging
QuizEditor.displayName = 'QuizEditor';

export default QuizEditor; 