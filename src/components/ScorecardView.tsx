import React, { useRef } from 'react';
import { ChevronLeft } from 'lucide-react';
import { ChatMessage, ScorecardItem } from '../types/quiz';
import LearnerScorecard from './LearnerScorecard';

interface ScorecardViewProps {
    activeScorecard: ScorecardItem[];
    handleBackToChat: () => void;
    lastUserMessage: ChatMessage | null;
}

const ScorecardView: React.FC<ScorecardViewProps> = ({
    activeScorecard,
    handleBackToChat,
    lastUserMessage
}) => {
    const scorecardContainerRef = useRef<HTMLDivElement>(null);

    return (
        <div className="flex flex-col h-full px-6 py-6 overflow-hidden">
            <div className="flex flex-col mb-6 relative">
                <button
                    onClick={handleBackToChat}
                    className="absolute left-0 top-0 px-3 py-1.5 bg-[#222222] text-sm text-white rounded-full hover:bg-[#333333] transition-colors flex items-center cursor-pointer"
                >
                    <ChevronLeft size={14} className="mr-1" />
                    Back
                </button>
                <div className="text-center mt-8">
                    {lastUserMessage ? (
                        lastUserMessage.messageType === 'audio' && lastUserMessage.audioData ? (
                            <div className="flex flex-col items-center">
                                <h2 className="text-xl font-light text-white mb-2">Your Response</h2>
                                <audio
                                    controls
                                    className="w-3/4 mt-2"
                                    src={`data:audio/wav;base64,${lastUserMessage.audioData}`}
                                />
                            </div>
                        ) : (
                            <div>
                                <h2 className="text-xl font-light text-white mb-2">Your Response</h2>
                                <p className="text-gray-300 text-sm max-w-lg mx-auto">{lastUserMessage.content}</p>
                            </div>
                        )
                    ) : (
                        <h2 className="text-xl font-light text-white">Detailed Report</h2>
                    )}
                </div>
            </div>
            <div
                ref={scorecardContainerRef}
                className="flex-1 overflow-y-auto hide-scrollbar"
            >
                <LearnerScorecard scorecard={activeScorecard} className="mt-0" />
            </div>
        </div>
    );
};

export default ScorecardView; 