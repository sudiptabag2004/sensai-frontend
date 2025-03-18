"use client";

import "@blocknote/core/fonts/inter.css";
import { useState, useCallback, useRef, useEffect, useMemo } from "react";
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

export interface LearnerQuizViewProps {
    questions: QuizQuestion[];
    onSubmitAnswer?: (questionId: string, answer: string) => void;
    isDarkMode?: boolean;
    className?: string;
    readOnly?: boolean;
    showCorrectAnswers?: boolean;
    taskType?: 'quiz' | 'exam';
    currentQuestionId?: string;
    onQuestionChange?: (questionId: string) => void;
    userId?: string;
    isTestMode?: boolean;
    taskId?: string;
}

export default function LearnerQuizView({
    questions = [],
    onSubmitAnswer,
    isDarkMode = true,
    className = "",
    readOnly = false,
    showCorrectAnswers = false,
    taskType = 'quiz',
    currentQuestionId,
    onQuestionChange,
    userId = '',
    isTestMode = false,
    taskId = ''
}: LearnerQuizViewProps) {
    // Current question index
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

    // Update current question index when currentQuestionId changes
    useEffect(() => {
        if (currentQuestionId && questions.length > 0) {
            const index = questions.findIndex(q => q.id === currentQuestionId);
            if (index !== -1) {
                setCurrentQuestionIndex(index);
            }
        }
    }, [currentQuestionId, questions]);

    // Ensure we have valid questions
    const validQuestions = useMemo(() => {
        return (questions || []).map(q => {
            // If the question already has the right format, use it as is
            if (q && q.content && Array.isArray(q.content) && q.content.length > 0) {
                return q;
            }

            // Handle API format where content might be in 'blocks' property
            if (q && (q as any).blocks && Array.isArray((q as any).blocks) && (q as any).blocks.length > 0) {
                return {
                    id: q.id || `question-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    content: (q as any).blocks,
                    config: q.config || {
                        inputType: 'text',
                        responseStyle: 'coach',
                        evaluationCriteria: []
                    }
                };
            }

            return null;
        }).filter(Boolean) as QuizQuestion[];
    }, [questions]);

    // Current answer input
    const [currentAnswer, setCurrentAnswer] = useState("");

    // State to track if an answer is being submitted
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Modify the state to track chat history per question
    const [chatHistories, setChatHistories] = useState<Record<string, ChatMessage[]>>({});

    // State to track if AI is responding
    const [isAiResponding, setIsAiResponding] = useState(false);

    // State to track if chat history has been loaded
    const [isChatHistoryLoaded, setIsChatHistoryLoaded] = useState(false);

    // Reference to the input element to maintain focus
    const inputRef = useRef<HTMLInputElement>(null);

    // Reference to the chat container for scrolling
    const chatContainerRef = useRef<HTMLDivElement>(null);

    // Store the current answer in a ref to avoid re-renders
    const currentAnswerRef = useRef(currentAnswer);

    // Store the handleSubmitAnswer function in a ref to avoid circular dependencies
    const handleSubmitAnswerRef = useRef<() => void>(() => { });

    // State to track which exam questions have had responses submitted
    const [submittedQuestionIds, setSubmittedQuestionIds] = useState<Record<string, boolean>>({});

    // Add state to track completed questions
    const [completedQuestionIds, setCompletedQuestionIds] = useState<Record<string, boolean>>({});

    // State to track which questions are currently being submitted (waiting for API response)
    const [pendingSubmissionQuestionIds, setPendingSubmissionQuestionIds] = useState<Record<string, boolean>>({});

    // Update the ref when the state changes
    useEffect(() => {
        currentAnswerRef.current = currentAnswer;
    }, [currentAnswer]);

    // Effect to focus the input when the component mounts
    useEffect(() => {
        // Focus the input field when the component mounts
        if (inputRef.current) {
            inputRef.current.focus();
        }
    }, []); // Empty dependency array means this runs once on mount

    // Reset chat history loaded state when taskId changes
    useEffect(() => {
        if (taskId) {
            setIsChatHistoryLoaded(false);
        }
    }, [taskId]);

    // Get the current question's chat history
    const currentChatHistory = useMemo(() => {
        const currentQuestionId = validQuestions[currentQuestionIndex]?.id || '';
        const history = chatHistories[currentQuestionId] || [];

        // For exam questions with existing chat history, we need to filter what's shown
        if (taskType === 'exam') {
            // Find any user messages in the history
            const userMessages = history.filter(msg => msg.sender === 'user');

            // Check if this question has a user message and is properly submitted (not currently in the submission process)
            const isSubmitted = submittedQuestionIds[currentQuestionId] && !pendingSubmissionQuestionIds[currentQuestionId];

            // If we have user messages and the question is already submitted (not pending)
            if (userMessages.length > 0 && isSubmitted) {
                // Get the last user message
                const lastUserMessage = userMessages[userMessages.length - 1];

                // Only return the last user message and a confirmation message
                return [
                    lastUserMessage,
                    {
                        id: `ai-confirmation-${currentQuestionId}`,
                        content: "Thank you for your submission. We will review it shortly",
                        sender: 'ai',
                        timestamp: new Date()
                    }
                ];
            }
        }

        return history;
    }, [chatHistories, currentQuestionIndex, validQuestions, taskType, submittedQuestionIds, pendingSubmissionQuestionIds]);

    // Fetch chat history from backend when component mounts or task changes
    useEffect(() => {
        // Skip if we're in test mode or if userId is not available or if we've already loaded chat history
        // Also skip if taskId is not provided
        if (isTestMode || !userId || isChatHistoryLoaded || !taskId) {
            return;
        }

        const fetchChatHistory = async () => {
            if (!validQuestions || validQuestions.length === 0) {
                return;
            }

            try {
                // Make API call to fetch chat history using the provided taskId
                const response = await fetch(`http://localhost:8001/chat/user/${userId}/task/${taskId}`);

                if (!response.ok) {
                    throw new Error(`Failed to fetch chat history: ${response.status}`);
                }

                const chatData = await response.json();

                // Organize chat messages by question ID
                const chatHistoryByQuestion: Record<string, ChatMessage[]> = {};
                // Track which questions had user messages
                const questionsWithResponses: Record<string, boolean> = {};

                chatData.forEach((message: any) => {
                    const questionId = message.question_id.toString();
                    if (!chatHistoryByQuestion[questionId]) {
                        chatHistoryByQuestion[questionId] = [];
                    }

                    // Convert API message to ChatMessage format
                    const chatMessage: ChatMessage = {
                        id: `${message.role}-${message.id}`,
                        content: message.content,
                        sender: message.role === 'user' ? 'user' : 'ai',
                        timestamp: new Date(message.created_at)
                    };

                    // Track questions with user responses for exam questions
                    if (message.role === 'user') {
                        questionsWithResponses[questionId] = true;
                    }

                    chatHistoryByQuestion[questionId].push(chatMessage);
                });

                // Update chat histories state
                setChatHistories(chatHistoryByQuestion);

                // For exam questions with responses, mark them as submitted
                if (taskType === 'exam') {
                    setSubmittedQuestionIds(prev => ({
                        ...prev,
                        ...questionsWithResponses
                    }));

                    // Clear any pending submissions for these questions since they're loaded from history
                    setPendingSubmissionQuestionIds(prev => {
                        const newState = { ...prev };
                        Object.keys(questionsWithResponses).forEach(id => {
                            delete newState[id];
                        });
                        return newState;
                    });
                }

                setIsChatHistoryLoaded(true);

            } catch (error) {
                console.error("Error fetching chat history:", error);
            }
        };

        fetchChatHistory();
    }, [isTestMode, userId, validQuestions, isChatHistoryLoaded, taskId, taskType]);

    // Effect to focus the input when the question changes
    useEffect(() => {
        // Ensure the input is focused after a short delay to allow the DOM to fully render
        const timer = setTimeout(() => {
            if (inputRef.current && !readOnly) {
                inputRef.current.focus();
            }
        }, 100);

        return () => clearTimeout(timer);
    }, [currentQuestionIndex, readOnly]);

    // Effect to log and validate questions when they change
    useEffect(() => {
        if (validQuestions.length > 0 && currentQuestionIndex >= validQuestions.length) {
            setCurrentQuestionIndex(0);
        }
    }, [questions, validQuestions, currentQuestionIndex]);

    // Effect to scroll to the bottom of the chat when new messages are added
    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [chatHistories]);

    // Navigate to previous question
    const goToPreviousQuestion = useCallback(() => {
        if (currentQuestionIndex > 0) {
            const newIndex = currentQuestionIndex - 1;
            setCurrentQuestionIndex(newIndex);
            setCurrentAnswer(""); // Reset answer when changing questions
            // No need to reset submission status as we're tracking per question

            // Notify parent component about question change
            if (onQuestionChange && validQuestions[newIndex]) {
                onQuestionChange(validQuestions[newIndex].id);
            }
        }
    }, [currentQuestionIndex, onQuestionChange, validQuestions]);

    // Navigate to next question
    const goToNextQuestion = useCallback(() => {
        if (currentQuestionIndex < validQuestions.length - 1) {
            const newIndex = currentQuestionIndex + 1;
            setCurrentQuestionIndex(newIndex);
            setCurrentAnswer(""); // Reset answer when changing questions
            // No need to reset submission status as we're tracking per question

            // Notify parent component about question change
            if (onQuestionChange && validQuestions[newIndex]) {
                onQuestionChange(validQuestions[newIndex].id);
            }
        }
    }, [currentQuestionIndex, validQuestions.length, onQuestionChange, validQuestions]);

    // Handle input change with focus preservation
    const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;
        setCurrentAnswer(newValue);
        currentAnswerRef.current = newValue;
    }, []); // No dependencies to ensure stability

    // Handle key press in the input field
    const handleKeyPress = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && currentAnswerRef.current.trim() && !readOnly) {
            handleSubmitAnswerRef.current();
        }
    }, [readOnly]); // Only depend on readOnly

    // Function to store chat history in backend
    const storeChatHistory = useCallback(async (questionId: string, userMessage: ChatMessage, aiMessage: ChatMessage) => {
        if (!userId || isTestMode) return;

        // For exam questions, always mark user message as solved
        // For quiz questions, use the completedQuestionIds state
        const userIsSolved = taskType === 'exam' ? true : (completedQuestionIds[questionId] || false);

        // For AI messages, check if it contains feedback about correctness
        // We'll extract the is_correct value from the message if it exists
        let aiIsSolved = false;
        try {
            // Try to parse the AI message as JSON to see if it contains is_correct
            const aiResponseData = JSON.parse(aiMessage.content);
            if (aiResponseData && typeof aiResponseData.is_correct === 'boolean') {
                aiIsSolved = aiResponseData.is_correct;
            }
        } catch (e) {
            // If it's not JSON, check if it contains certain keywords
            aiIsSolved = aiMessage.content.includes('correct') &&
                !aiMessage.content.includes('incorrect') &&
                !aiMessage.content.includes('not correct');
        }

        const messages = [
            {
                user_id: parseInt(userId),
                question_id: parseInt(questionId),
                role: "user",
                content: userMessage.content,
                is_solved: userIsSolved,
                response_type: "text"
            },
            {
                user_id: parseInt(userId),
                question_id: parseInt(questionId),
                role: "assistant",
                content: aiMessage.content,
                is_solved: aiIsSolved,
                response_type: null
            }
        ];

        try {
            const response = await fetch('http://localhost:8001/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ messages })
            });

            if (!response.ok) {
                throw new Error('Failed to store chat history');
            }
        } catch (error) {
            console.error('Error storing chat history:', error);
        }
    }, [userId, isTestMode, completedQuestionIds, taskType]);

    // Modify the handleSubmitAnswer function to store chat history
    const handleSubmitAnswer = useCallback(() => {
        // Add a check to ensure we have valid questions and a valid index
        if (!validQuestions || validQuestions.length === 0 || currentQuestionIndex >= validQuestions.length) {
            return;
        }

        const currentQuestionId = validQuestions[currentQuestionIndex].id;

        // Set submitting state to true
        setIsSubmitting(true);

        // For exam questions, mark as pending submission
        if (taskType === 'exam') {
            setPendingSubmissionQuestionIds(prev => ({
                ...prev,
                [currentQuestionId]: true
            }));
        }

        // Get the current answer from the ref
        const answer = currentAnswerRef.current;

        // Add user message to chat history for current question
        const userMessage: ChatMessage = {
            id: `user-${Date.now()}`,
            content: answer,
            sender: 'user',
            timestamp: new Date()
        };

        // Immediately add only the user's message to the chat history
        setChatHistories(prev => ({
            ...prev,
            [currentQuestionId]: [...(prev[currentQuestionId] || []), userMessage]
        }));

        // Clear the input field after submission
        setCurrentAnswer("");
        currentAnswerRef.current = "";

        // Focus the input field again
        if (inputRef.current) {
            inputRef.current.focus();
        }

        // Show the AI typing animation
        setIsAiResponding(true);

        // Prepare the request body based on whether this is a teacher testing or a real learner
        let requestBody;

        if (isTestMode) {
            // In teacher testing mode, send chat_history and question data
            // Format the chat history for the current question
            const formattedChatHistory = (chatHistories[currentQuestionId] || []).map(msg => ({
                role: msg.sender === 'user' ? 'user' : 'assistant',
                content: msg.content
            }));

            // Create the request body for teacher testing mode
            requestBody = {
                user_response: answer,
                chat_history: formattedChatHistory,
                question: {
                    "blocks": validQuestions[currentQuestionIndex].content,
                    "response_type": "chat",
                    "answer": validQuestions[currentQuestionIndex].config.correctAnswer,
                    "type": "objective",
                    "input_type": "text"
                }
            };
        } else {
            // In normal mode, send question_id and user_id
            requestBody = {
                user_response: answer,
                question_id: currentQuestionId,
                user_id: userId
            };
        }

        // Call the API with the appropriate request body
        fetch(`http://localhost:8001/ai/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody)
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(data => {
                // Store the actual AI response for backend purposes
                const actualAiResponse: ChatMessage = {
                    id: `ai-actual-${Date.now()}`,
                    content: data.feedback,
                    sender: 'ai',
                    timestamp: new Date()
                };

                // Create a UI response message (either confirmation for exam or actual feedback for quiz)
                const uiResponse: ChatMessage = {
                    id: `ai-${Date.now()}`,
                    content: taskType === 'exam'
                        ? "Thank you for your submission. We will review it shortly"
                        : data.feedback,
                    sender: 'ai',
                    timestamp: new Date()
                };

                // Now that the API call is complete, handle exam submissions
                if (taskType === 'exam') {
                    // Mark this specific question as submitted
                    setSubmittedQuestionIds(prev => ({
                        ...prev,
                        [currentQuestionId]: true
                    }));

                    // Call the onSubmitAnswer callback to mark completion
                    if (onSubmitAnswer) {
                        onSubmitAnswer(currentQuestionId, answer);
                    }

                    // Clear the pending submission status
                    setPendingSubmissionQuestionIds(prev => {
                        const newState = { ...prev };
                        delete newState[currentQuestionId];
                        return newState;
                    });
                }
                // For quizzes, check if the answer is correct and mark completed if so
                else if (taskType === 'quiz' && data.is_correct && onSubmitAnswer) {
                    onSubmitAnswer(currentQuestionId, answer);
                    setCompletedQuestionIds(prev => ({
                        ...prev,
                        [currentQuestionId]: true
                    }));
                }

                // Now that we have the AI response, update the chat history with the UI response
                // This happens only after the API call is complete
                setChatHistories(prev => ({
                    ...prev,
                    [currentQuestionId]: [...(prev[currentQuestionId] || []), uiResponse]
                }));

                // Store chat history in backend for both quiz and exam
                if (!isTestMode) {
                    storeChatHistory(currentQuestionId, userMessage, actualAiResponse);
                }
            })
            .catch(error => {
                console.error('Error fetching AI response:', error);

                // Show error message to the user
                const errorResponse: ChatMessage = {
                    id: `ai-error-${Date.now()}`,
                    content: "There was an error processing your answer. Please try again.",
                    sender: 'ai',
                    timestamp: new Date()
                };

                // For exam questions, clear the pending status so the user can try again
                if (taskType === 'exam') {
                    setPendingSubmissionQuestionIds(prev => {
                        const newState = { ...prev };
                        delete newState[currentQuestionId];
                        return newState;
                    });
                }

                // Add the error message to the chat history
                // This is only for UI display and won't be saved to the database
                setChatHistories(prev => ({
                    ...prev,
                    [currentQuestionId]: [...(prev[currentQuestionId] || []), errorResponse]
                }));
            })
            .finally(() => {
                // Always reset submitting and AI responding states when API call is done
                setIsSubmitting(false);
                setIsAiResponding(false);
            });
    }, [validQuestions, currentQuestionIndex, onSubmitAnswer, taskType, userId, isTestMode, chatHistories, storeChatHistory]);

    // Update the handleSubmitAnswerRef when handleSubmitAnswer changes
    useEffect(() => {
        handleSubmitAnswerRef.current = handleSubmitAnswer;
    }, [handleSubmitAnswer]);

    // Get current question content
    const currentQuestionContent = validQuestions[currentQuestionIndex]?.content || [];

    // Get current question config
    const currentQuestionConfig = validQuestions[currentQuestionIndex]?.config || {
        inputType: 'text',
        responseStyle: 'coach',
        evaluationCriteria: []
    };

    // Focus the input field directly
    useEffect(() => {
        // Use requestAnimationFrame to ensure the DOM is fully rendered
        requestAnimationFrame(() => {
            if (inputRef.current) {
                inputRef.current.focus();
            }
        });
    }, [currentQuestionIndex]); // Only re-focus when changing questions

    return (
        <div className={`w-full h-full ${className}`}>
            {/* Add the styles */}
            <style jsx>{styles}</style>

            <div className="flex h-full bg-[#111111] rounded-md overflow-hidden">
                {/* Left side - Question (50%) */}
                <div className="w-1/2 p-8 border-r border-[#222222] flex flex-col bg-[#1A1A1A]">
                    {/* Navigation controls at the top of left side - only show if more than one question */}
                    {validQuestions.length > 1 && (
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
                                Question {currentQuestionIndex + 1} / {validQuestions.length}
                            </div>

                            <div className="w-10 h-10">
                                <button
                                    className={`w-10 h-10 rounded-full flex items-center justify-center bg-[#222222] text-white ${currentQuestionIndex < validQuestions.length - 1 ? 'hover:bg-[#333333] cursor-pointer' : 'opacity-50 cursor-not-allowed'}`}
                                    onClick={goToNextQuestion}
                                    disabled={currentQuestionIndex >= validQuestions.length - 1}
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
                                placeholder="Question content will appear here"
                            />
                        </div>
                    </div>
                </div>

                {/* Right side - Chat (50%) */}
                <div className="w-1/2 p-6 flex flex-col bg-[#111111] relative">
                    {/* Chat history or empty state message */}
                    <div className="flex-1 mb-4 relative">
                        {currentChatHistory.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full w-full absolute inset-0 px-4">
                                <h2 className="text-4xl font-light text-white mb-6 text-center">
                                    {taskType === 'exam' ? 'Ready for a challenge?' : 'Ready to test your knowledge?'}
                                </h2>
                                <p className="text-gray-400 text-center max-w-md mx-auto mb-8">
                                    {taskType === 'exam'
                                        ? 'Think through your answer, then type it here. You can attempt the question only once. Be careful and confident.'
                                        : 'Think through your answer, then type it here. You will receive instant feedback and support throughout your journey'
                                    }
                                </p>
                            </div>
                        ) : (
                            <div
                                ref={chatContainerRef}
                                className="h-full overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent"
                            >
                                <div className="flex flex-col space-y-4">
                                    {currentChatHistory.map((message) => (
                                        <div
                                            key={message.id}
                                            className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                                        >
                                            <div
                                                className={`max-w-[80%] rounded-2xl px-4 py-2 ${message.sender === 'user' ? 'bg-[#333333] text-white' : 'bg-[#1A1A1A] text-white'
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

                    {/* Input area or message for exam */}
                    {!(taskType === 'exam' && submittedQuestionIds[validQuestions[currentQuestionIndex]?.id]) && (
                        /* Input area - same for both states */
                        <div className="relative flex items-center bg-[#111111] rounded-full overflow-hidden border border-[#222222]">
                            <input
                                ref={inputRef}
                                type="text"
                                placeholder="Type your answer here"
                                className="flex-1 bg-transparent border-none px-6 py-4 text-white focus:outline-none"
                                value={currentAnswer}
                                onChange={handleInputChange}
                                onKeyPress={handleKeyPress}
                                autoFocus={!readOnly}
                                disabled={false} // Never disable the input field
                            />
                            <button
                                className={`bg-white rounded-full w-10 h-10 mr-2 cursor-pointer flex items-center justify-center ${isSubmitting || isAiResponding ? 'opacity-50' : ''}`}
                                onClick={handleSubmitAnswer}
                                disabled={!currentAnswer.trim() || isSubmitting || isAiResponding}
                                aria-label="Submit answer"
                                type="button"
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
                    )}
                </div>
            </div>
        </div>
    );
} 