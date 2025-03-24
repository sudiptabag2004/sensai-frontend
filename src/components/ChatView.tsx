import React, { useRef } from 'react';
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
    handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    handleKeyPress: (e: React.KeyboardEvent<HTMLInputElement>) => void;
    handleSubmitAnswer: () => void;
    handleAudioSubmit: (audioBlob: Blob) => void;
    handleViewScorecard: (scorecard: ScorecardItem[]) => void;
    readOnly: boolean;
    completedQuestionIds: Record<string, boolean>;
    currentQuestionId?: string;
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
    currentQuestionId = ''
}) => {
    const inputRef = useRef<HTMLInputElement>(null);

    // Determine if this question is completed
    const isQuestionCompleted = currentQuestionId ? completedQuestionIds[currentQuestionId] : false;

    // Custom styles for the hidden scrollbar
    const customStyles = `
    /* Hide scrollbar for Chrome, Safari and Opera */
    .hide-scrollbar::-webkit-scrollbar {
      display: none;
      width: 0;
      height: 0;
    }
    
    /* Hide scrollbar for IE, Edge and Firefox */
    .hide-scrollbar {
      -ms-overflow-style: none;  /* IE and Edge */
      scrollbar-width: none;  /* Firefox */
    }
    `;

    return (
        <div className="flex-1 flex flex-col px-6 py-6 overflow-hidden">
            <style jsx>{customStyles}</style>

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
                />
            )}

            {/* Input area with fixed position at bottom */}
            <div className="pt-2 bg-[#111111]">
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
                            /* Original text input */
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
                    </>
                )}
            </div>
        </div>
    );
};

export default ChatView; 