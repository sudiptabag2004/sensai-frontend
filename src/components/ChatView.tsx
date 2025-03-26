import React, { useRef, useEffect } from 'react';
import { ChatMessage, ScorecardItem, QuizQuestion } from '../types/quiz';
import ChatPlaceholderView from './ChatPlaceholderView';
import ChatHistoryView from './ChatHistoryView';
import AudioInputComponent from './AudioInputComponent';

interface ChatViewProps {
    currentChatHistory: ChatMessage[];
    isAiResponding: boolean;
    showPreparingReport: boolean;
    isChatHistoryLoaded: boolean;
    isTestMode: boolean;
    taskType: 'quiz' | 'exam';
    currentQuestionConfig?: any;
    isSubmitting: boolean;
    currentAnswer: string;
    handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
    handleKeyPress: (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
    handleSubmitAnswer: () => void;
    handleAudioSubmit: (audioBlob: Blob) => void;
    handleViewScorecard: (scorecard: ScorecardItem[]) => void;
    readOnly: boolean;
    completedQuestionIds: Record<string, boolean>;
    currentQuestionId?: string;
    handleRetry?: () => void;
}

const ChatView: React.FC<ChatViewProps> = ({
    currentChatHistory,
    isAiResponding,
    showPreparingReport,
    isChatHistoryLoaded,
    isTestMode,
    taskType,
    currentQuestionConfig,
    isSubmitting,
    currentAnswer,
    handleInputChange,
    handleKeyPress,
    handleSubmitAnswer,
    handleAudioSubmit,
    handleViewScorecard,
    readOnly,
    completedQuestionIds,
    currentQuestionId = '',
    handleRetry
}) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Determine if this question is completed
    const isQuestionCompleted = currentQuestionId ? completedQuestionIds[currentQuestionId] : false;

    // Function to adjust textarea height based on content
    const adjustTextareaHeight = () => {
        const textarea = textareaRef.current;
        if (!textarea) return;

        // Reset height to auto to get the correct scrollHeight
        textarea.style.height = 'auto';

        // Calculate new height (capped at approximately 6 lines)
        const lineHeight = 24; // Approximate line height in pixels
        const maxHeight = lineHeight * 6; // Max height for 6 lines
        const newHeight = Math.min(textarea.scrollHeight, maxHeight);

        // Set the new height
        textarea.style.height = `${newHeight}px`;

        // Add scrolling if content exceeds maxHeight - ensure this isn't overridden by CSS
        if (textarea.scrollHeight > maxHeight) {
            textarea.style.overflowY = 'scroll';
        } else {
            textarea.style.overflowY = 'hidden';
        }
    };

    // Adjust height when content changes
    useEffect(() => {
        adjustTextareaHeight();
    }, [currentAnswer]);

    // Reset textarea height when messages are sent
    useEffect(() => {
        if (currentAnswer === '' && textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.overflowY = 'hidden';
        }
    }, [currentAnswer]);

    // Focus the textarea when the component mounts
    useEffect(() => {
        if (textareaRef.current && !readOnly) {
            textareaRef.current.focus();
        }
    }, [readOnly]);

    // Modified handleKeyPress for textarea
    const handleTextareaKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        // Submit on Enter key without shift key
        if (e.key === 'Enter' && !e.shiftKey && currentAnswer.trim() && !readOnly) {
            e.preventDefault(); // Prevent new line
            handleSubmitAnswer();
        }
    };

    return (
        <div className="flex-1 flex flex-col px-6 py-6 overflow-hidden">
            {/* Global style for maximum specificity - this will apply regardless of Next.js styling restrictions */}
            <style global jsx>{`
                /* Target the specific textarea with an important ID */
                #no-border-textarea {
                    border: none !important;
                    outline: none !important;
                    box-shadow: none !important;
                    -webkit-appearance: none !important;
                }
                
                /* Target all focus states */
                #no-border-textarea:focus,
                #no-border-textarea:focus-visible,
                #no-border-textarea:focus-within,
                #no-border-textarea:active {
                    border: none !important;
                    outline: none !important;
                    box-shadow: none !important;
                    -webkit-box-shadow: none !important;
                    -moz-box-shadow: none !important;
                }
                
                /* Auto-expanding styles */
                .auto-expanding-textarea {
                    min-height: 48px;
                    max-height: 144px;
                    resize: none !important;
                    line-height: 24px !important;
                    /* Allow scrolling when needed */
                    overflow-y: auto !important; 
                }
                
                /* Hide scrollbar */
                .hide-scrollbar::-webkit-scrollbar {
                    display: none;
                }
                
                .hide-scrollbar {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
            `}</style>

            {currentChatHistory.length === 0 ? (
                <ChatPlaceholderView
                    taskType={taskType}
                    isChatHistoryLoaded={isChatHistoryLoaded}
                    isTestMode={isTestMode}
                    inputType={currentQuestionConfig?.inputType}
                />
            ) : (
                <ChatHistoryView
                    chatHistory={currentChatHistory}
                    onViewScorecard={handleViewScorecard}
                    isAiResponding={isAiResponding}
                    showPreparingReport={showPreparingReport}
                    currentQuestionConfig={currentQuestionConfig}
                    onRetry={handleRetry}
                />
            )}

            {/* Input area with fixed position at bottom */}
            <div className="fpt-2 bg-[#111111]">
                {!(taskType === 'exam' && isQuestionCompleted) && (
                    /* Input area - conditional render based on input type */
                    <>
                        {currentQuestionConfig?.inputType === 'audio' ? (
                            <AudioInputComponent
                                onAudioSubmit={handleAudioSubmit}
                                isSubmitting={isSubmitting || isAiResponding}
                                maxDuration={currentQuestionConfig?.audioMaxDuration || 120}
                            />
                        ) : (
                            /* Completely restructured textarea container */
                            <div className="relative flex items-center bg-[#111111] rounded-3xl py-1 overflow-hidden border border-[#222222]">
                                <div className="flex-1 flex items-center">
                                    <textarea
                                        id="no-border-textarea"
                                        ref={textareaRef}
                                        placeholder="Type your answer here"
                                        className="ml-2 w-full bg-transparent text-white auto-expanding-textarea"
                                        value={currentAnswer}
                                        onChange={handleInputChange as any}
                                        onKeyPress={handleTextareaKeyPress}
                                        autoFocus={!readOnly}
                                        disabled={false}
                                        rows={1}
                                        style={{
                                            border: "none",
                                            outline: "none",
                                            boxShadow: "none",
                                            padding: "12px 24px",
                                            resize: "none"
                                        }}
                                    />
                                </div>
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
                    </>
                )}
            </div>
        </div>
    );
};

export default ChatView; 