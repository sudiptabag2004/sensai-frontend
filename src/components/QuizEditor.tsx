"use client";

import "@blocknote/core/fonts/inter.css";
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import "@blocknote/mantine/style.css";
import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";

// Add custom styles for dark mode
import "./editor-styles.css";

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
    isDarkMode = true, // Default to dark mode
    className = "",
}: QuizEditorProps) {
    const editorContainerRef = useRef<HTMLDivElement>(null);

    // Initialize with at least one question if none provided
    const [questions, setQuestions] = useState<QuizQuestion[]>(() => {
        if (initialQuestions.length > 0) return initialQuestions;
        return [{ id: `question-${Date.now()}`, content: [] }];
    });

    // Track the current question index
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

    // Create a BlockNote editor instance for the current question
    const editor = useCreateBlockNote({
        initialContent: questions[currentQuestionIndex]?.content || [],
    });

    // Update the editor content when changing questions
    useEffect(() => {
        if (questions[currentQuestionIndex]?.content) {
            editor.replaceBlocks(editor.document, questions[currentQuestionIndex].content);
        } else {
            editor.replaceBlocks(editor.document, []);
        }
    }, [currentQuestionIndex, questions]);

    // Handle content changes
    useEffect(() => {
        const handleChange = () => {
            const updatedQuestions = [...questions];
            updatedQuestions[currentQuestionIndex] = {
                ...updatedQuestions[currentQuestionIndex],
                content: editor.document
            };

            setQuestions(updatedQuestions);

            if (onChange) {
                onChange(updatedQuestions);
            }
        };

        // Add change listener
        editor.onEditorContentChange(handleChange);

        return () => {
            // This is a cleanup function that would ideally remove the listener
            // but BlockNote doesn't provide a way to remove listeners currently
        };
    }, [editor, onChange, questions, currentQuestionIndex]);

    // Add a new question
    const addQuestion = () => {
        const newQuestion: QuizQuestion = {
            id: `question-${Date.now()}`,
            content: []
        };

        setQuestions([...questions, newQuestion]);
        // Navigate to the new question
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

    // This effect prevents the editor from losing focus
    useEffect(() => {
        // Get all elements with contentEditable=true outside the editor
        const makeElementsNonStealingFocus = () => {
            // Find all contentEditable elements in the document
            const editableElements = document.querySelectorAll('[contenteditable="true"]');

            // For each editable element outside our editor
            editableElements.forEach(element => {
                if (!editorContainerRef.current?.contains(element)) {
                    // Add a data attribute to mark it
                    element.setAttribute('data-original-contenteditable', 'true');
                    // Make it non-editable
                    element.setAttribute('contenteditable', 'false');
                }
            });
        };

        // Call immediately and then set up an interval to keep checking
        makeElementsNonStealingFocus();
        const intervalId = setInterval(makeElementsNonStealingFocus, 500);

        return () => {
            clearInterval(intervalId);
            // Restore original contentEditable values
            document.querySelectorAll('[data-original-contenteditable="true"]').forEach(element => {
                element.setAttribute('contenteditable', 'true');
            });
        };
    }, []);

    return (
        <div className="flex flex-col h-full">
            {/* Quiz Controls */}
            <div className="flex items-center justify-between mb-4 px-2 py-3 bg-[#2A2A2A] rounded-md">
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

            {/* Editor Container */}
            <div
                ref={editorContainerRef}
                className={`flex-1 dark-editor-container dark-dialog ${className}`}
            >
                <BlockNoteView
                    editor={editor}
                    theme="dark" // Force dark theme
                    className="dark-editor" // Add a class for additional styling
                />
            </div>
        </div>
    );
} 