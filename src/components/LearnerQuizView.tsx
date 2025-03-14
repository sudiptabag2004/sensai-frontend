"use client";

import "@blocknote/core/fonts/inter.css";
import { useState, useCallback, useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import BlockNoteEditor from "./BlockNoteEditor";

// Custom styles for the pulsating animation
const styles = `
@keyframes pulsate {
  0% {
    transform: scale(0.9);
    opacity: 0.8;
  }
  50% {
    transform: scale(1.1);
    opacity: 0.6;
  }
  100% {
    transform: scale(0.9);
    opacity: 0.8;
  }
}

.pulsating-circle {
  animation: pulsate 1.5s ease-in-out infinite;
}
`;

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

// Define a message type for the chat history
interface ChatMessage {
    id: string;
    content: string;
    sender: 'user' | 'ai';
    timestamp: Date;
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

    // State to track if an answer is being submitted
    const [isSubmitting, setIsSubmitting] = useState(false);

    // State for chat history
    const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);

    // State to track if AI is responding
    const [isAiResponding, setIsAiResponding] = useState(false);

    // Reference to the input element to maintain focus
    const inputRef = useRef<HTMLInputElement>(null);

    // Reference to the chat container for scrolling
    const chatContainerRef = useRef<HTMLDivElement>(null);

    // Store the current answer in a ref to avoid re-renders
    const currentAnswerRef = useRef(currentAnswer);

    // Update the ref when the state changes
    useEffect(() => {
        currentAnswerRef.current = currentAnswer;
    }, [currentAnswer]);

    // Effect to focus the input when the component mounts or question changes
    useEffect(() => {
        if (inputRef.current && !readOnly) {
            inputRef.current.focus();
        }
    }, [currentQuestionIndex, readOnly]);

    // Effect to scroll to the bottom of the chat when new messages are added
    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [chatHistory]);

    // Navigate to previous question
    const goToPreviousQuestion = useCallback(() => {
        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex(currentQuestionIndex - 1);
            setCurrentAnswer(""); // Reset answer when changing questions
            // Clear chat history when changing questions
            setChatHistory([]);
        }
    }, [currentQuestionIndex]);

    // Navigate to next question
    const goToNextQuestion = useCallback(() => {
        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(currentQuestionIndex + 1);
            setCurrentAnswer(""); // Reset answer when changing questions
            // Clear chat history when changing questions
            setChatHistory([]);
        }
    }, [currentQuestionIndex, questions.length]);

    // Generate a mock AI response
    const generateMockAiResponse = useCallback((userMessage: string) => {
        // Sample responses based on common patterns
        const responses = [
            "That's a good start! Let's think about this more deeply...",
            "I see your approach. Have you considered looking at it from another angle?",
            "You're on the right track. Let me add some additional context to help you understand better.",
            "That's an interesting perspective. Let me elaborate on why this concept is important.",
            "Good effort! Here's a hint that might help you refine your answer further."
        ];

        // Select a random response
        return responses[Math.floor(Math.random() * responses.length)];
    }, []);

    // Handle input change with focus preservation
    // Use a stable callback that doesn't depend on currentAnswer
    const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;
        setCurrentAnswer(newValue);
        currentAnswerRef.current = newValue;

        // Ensure the input stays focused after state update
        // This is a direct DOM manipulation to guarantee focus
        setTimeout(() => {
            if (inputRef.current) {
                inputRef.current.focus();
            }
        }, 0);
    }, []); // No dependencies to ensure stability

    // Handle key press in the input field
    const handleKeyPress = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && currentAnswerRef.current.trim() && !readOnly) {
            handleSubmitAnswer();
        }
    }, [readOnly]); // Only depend on readOnly, not on currentAnswer

    // Handle answer submission
    const handleSubmitAnswer = useCallback(() => {
        if (questions[currentQuestionIndex]) {
            // Set submitting state to true
            setIsSubmitting(true);

            // Get the current answer from the ref
            const answer = currentAnswerRef.current;

            // Add user message to chat history
            const userMessage: ChatMessage = {
                id: `user-${Date.now()}`,
                content: answer,
                sender: 'user',
                timestamp: new Date()
            };

            setChatHistory(prev => [...prev, userMessage]);

            // Clear the input field after submission
            setCurrentAnswer("");
            currentAnswerRef.current = "";

            // Focus the input field again
            if (inputRef.current) {
                inputRef.current.focus();
            }

            // Reset submitting state
            setIsSubmitting(false);

            // Set AI responding state
            setIsAiResponding(true);

            // Call the onSubmitAnswer callback if provided
            if (onSubmitAnswer) {
                onSubmitAnswer(questions[currentQuestionIndex].id, userMessage.content);
            }

            // Simulate AI response after 2 seconds
            setTimeout(() => {
                const aiResponse: ChatMessage = {
                    id: `ai-${Date.now()}`,
                    content: generateMockAiResponse(userMessage.content),
                    sender: 'ai',
                    timestamp: new Date()
                };

                setChatHistory(prev => [...prev, aiResponse]);
                setIsAiResponding(false);
            }, 2000);
        }
    }, [questions, currentQuestionIndex, onSubmitAnswer, generateMockAiResponse]);

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
            {/* Add the styles */}
            <style jsx>{styles}</style>

            <div className="flex h-full bg-[#111111] rounded-md overflow-hidden">
                {/* Left side - Question (50%) */}
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
                                Question {currentQuestionIndex + 1} / {questions.length}
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

                {/* Right side - Chat (50%) */}
                <div className="w-1/2 p-6 flex flex-col bg-[#111111]">
                    {/* Chat history or empty state message */}
                    <div className="flex-1 mb-4">
                        {chatHistory.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full">
                                <h2 className="text-4xl font-light text-white mb-6">Ready to test your knowledge?</h2>
                                <p className="text-gray-400 text-center max-w-md mb-8">
                                    Think through your answer, then type it here. You will receive instant feedback and support throughout your learning journey
                                </p>
                            </div>
                        ) : (
                            <div
                                ref={chatContainerRef}
                                className="h-full overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent"
                            >
                                <div className="flex flex-col space-y-4">
                                    {chatHistory.map((message) => (
                                        <div
                                            key={message.id}
                                            className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                                        >
                                            <div
                                                className={`max-w-[80%] rounded-2xl px-4 py-2 ${message.sender === 'user'
                                                    ? 'bg-[#333333] text-white'
                                                    : 'bg-[#1A1A1A] text-white'
                                                    }`}
                                            >
                                                <p className="text-sm">{message.content}</p>
                                            </div>
                                        </div>
                                    ))}

                                    {/* AI typing animation - simplified to a single pulsating white circle */}
                                    {isAiResponding && (
                                        <div className="flex justify-start">
                                            <div className="flex items-center justify-center min-w-[40px] min-h-[40px]">
                                                <div
                                                    className="w-2.5 h-2.5 bg-white rounded-full pulsating-circle"
                                                ></div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Input area - same for both states */}
                    <div className="relative flex items-center bg-[#111111] rounded-full overflow-hidden border border-[#222222]">
                        <input
                            ref={inputRef}
                            type="text"
                            placeholder="Type your answer here"
                            className="flex-1 bg-transparent border-none px-6 py-4 text-white focus:outline-none"
                            value={currentAnswer}
                            onChange={handleInputChange}
                            onKeyPress={handleKeyPress}
                            onClick={(e) => {
                                // Prevent any default behavior that might cause focus loss
                                e.stopPropagation();
                                // Ensure input is focused
                                if (inputRef.current) {
                                    inputRef.current.focus();
                                }
                            }}
                            disabled={readOnly || isAiResponding}
                        />
                        <button
                            className={`bg-white rounded-full w-10 h-10 mr-2 cursor-pointer flex items-center justify-center ${isSubmitting || isAiResponding ? 'opacity-50' : ''}`}
                            onClick={handleSubmitAnswer}
                            disabled={readOnly || !currentAnswer.trim() || isSubmitting || isAiResponding}
                        >
                            {isSubmitting ? (
                                <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
} 