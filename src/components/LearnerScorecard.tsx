import React from 'react';
import { ScorecardItem } from '../types/quiz';

export interface LearnerScorecardProps {
    scorecard: ScorecardItem[];
    className?: string;
}

const LearnerScorecard: React.FC<LearnerScorecardProps> = ({
    scorecard,
    className = ""
}) => {
    if (!scorecard || scorecard.length === 0) {
        return null;
    }

    return (
        <div className={`pt-4 ${className}`}>
            <div className="space-y-4">
                {scorecard.map((item, index) => (
                    <div key={index} className="bg-[#222222] rounded-lg p-3">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-medium text-white">{item.category}</span>
                            <div className="bg-[#333333] rounded-full px-2 py-1 text-xs">
                                Score: {item.score}/5
                            </div>
                        </div>
                        <div className="space-y-2 text-xs">
                            {item.feedback.correct && (
                                <div className="text-green-400">
                                    <span className="font-medium">Strengths: </span>
                                    {item.feedback.correct}
                                </div>
                            )}
                            {item.feedback.wrong && (
                                <div className="text-amber-400">
                                    <span className="font-medium">Areas for improvement: </span>
                                    {item.feedback.wrong}
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default LearnerScorecard; 