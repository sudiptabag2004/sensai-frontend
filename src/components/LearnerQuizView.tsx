"use client";

import "@blocknote/core/fonts/inter.css";
import { useState, useCallback, useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
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

interface LearnerQuizViewProps {
    questions: QuizQuestion[];
    onSubmitAnswer?: (questionId: string, answer: string) => void;
    isDarkMode?: boolean;
    className?: string;
    readOnly?: boolean;
    showCorrectAnswers?: boolean;
}

export default function LearnerQuizView({
    questions = [],
    onSubmitAnswer,
    isDarkMode = true,
    className = "",
    readOnly = false,
    showCorrectAnswers = false,
}: LearnerQuizViewProps) {
    // Current question index
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

    // Current answer input
    const [currentAnswer, setCurrentAnswer] = useState("");

    // Reference to the input element to maintain focus
    const inputRef = useRef<HTMLInputElement>(null);

    // Effect to focus the input when the component mounts or question changes
    useEffect(() => {
        if (inputRef.current && !readOnly) {
            inputRef.current.focus();
        }
    }, [currentQuestionIndex, readOnly]);

    // Navigate to previous question
    const goToPreviousQuestion = useCallback(() => {
        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex(currentQuestionIndex - 1);
            setCurrentAnswer(""); // Reset answer when changing questions
        }
    }, [currentQuestionIndex]);

    // Navigate to next question
    const goToNextQuestion = useCallback(() => {
        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(currentQuestionIndex + 1);
            setCurrentAnswer(""); // Reset answer when changing questions
        }
    }, [currentQuestionIndex, questions.length]);

    // Handle answer submission
    const handleSubmitAnswer = useCallback(() => {
        if (onSubmitAnswer && questions[currentQuestionIndex]) {
            onSubmitAnswer(questions[currentQuestionIndex].id, currentAnswer);
        }
    }, [onSubmitAnswer, questions, currentQuestionIndex, currentAnswer]);

    // Handle input change with focus preservation
    const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setCurrentAnswer(e.target.value);
        // No need to manually focus here as we're not losing focus anymore
    }, []);

    // Get current question content
    const currentQuestionContent = questions[currentQuestionIndex]?.content || [];

    // Get current question config
    const currentQuestionConfig = questions[currentQuestionIndex]?.config || {
        inputType: 'text',
        responseStyle: 'coach',
        evaluationCriteria: []
    };

    return (
        <div className={`w-full h-full ${className}`}>
            <div className="flex h-full bg-[#111111] rounded-md overflow-hidden">
                {/* Left side - Question (80%) */}
                <div className="w-1/2 p-8 border-r border-[#222222] flex flex-col bg-[#1A1A1A]">
                    {/* Navigation controls at the top of left side - only show if more than one question */}
                    {questions.length > 1 && (
                        <div className="flex items-center justify-between w-full mb-6">
                            <div className="w-10 h-10">
                                <button
                                    className={`w-10 h-10 rounded-full flex items-center justify-center bg-[#222222] text-white ${currentQuestionIndex > 0 ? 'hover:bg-[#333333] cursor-pointer' : 'opacity-50 cursor-not-allowed'}`}
                                    onClick={goToPreviousQuestion}
                                    disabled={currentQuestionIndex <= 0}
                                >
                                    <ChevronLeft size={18} />
                                </button>
                            </div>

                            <div className="bg-[#222222] px-3 py-1 rounded-full text-white text-sm">
                                {currentQuestionIndex + 1}/{questions.length}
                            </div>

                            <div className="w-10 h-10">
                                <button
                                    className={`w-10 h-10 rounded-full flex items-center justify-center bg-[#222222] text-white ${currentQuestionIndex < questions.length - 1 ? 'hover:bg-[#333333] cursor-pointer' : 'opacity-50 cursor-not-allowed'}`}
                                    onClick={goToNextQuestion}
                                    disabled={currentQuestionIndex >= questions.length - 1}
                                >
                                    <ChevronRight size={18} />
                                </button>
                            </div>
                        </div>
                    )}

                    <div className={`flex-1 ${questions.length > 1 ? 'mt-4' : 'mt-6'}`}>
                        {/* Use editor with negative margin to offset unwanted space */}
                        <div className="ml-[-60px]"> {/* Increased negative margin to align with navigation arrow */}
                            <BlockNoteEditor
                                key={`question-view-${currentQuestionIndex}`}
                                initialContent={currentQuestionContent}
                                onChange={() => { }} // Read-only in view mode
                                isDarkMode={true}
                                readOnly={true}
                                className="!bg-transparent"
                            />
                        </div>
                    </div>
                </div>

                <div className="w-1/2 p-6 flex flex-col">
                    <div className="flex-1 flex flex-col justify-end">
                        <div className="relative flex items-center bg-[#111111] rounded-full overflow-hidden border border-[#222222]">
                            <input
                                ref={inputRef}
                                type="text"
                                placeholder="Type your answer here"
                                className="flex-1 bg-transparent border-none px-6 py-4 text-white focus:outline-none"
                                value={currentAnswer}
                                onChange={handleInputChange}
                                disabled={readOnly}
                            />
                            <button
                                className="bg-white rounded-full w-10 h-10 mr-2 cursor-pointer flex items-center justify-center"
                                onClick={handleSubmitAnswer}
                                disabled={readOnly || !currentAnswer.trim()}
                            >
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
} 