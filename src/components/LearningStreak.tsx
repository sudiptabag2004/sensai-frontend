import React, { useMemo } from "react";

interface LearningStreakProps {
    streakDays: number;
    activeDays: string[]; // Days that are active in the streak (e.g., ['M', 'T', 'S_0', 'S_6'])
}

export default function LearningStreak({ streakDays, activeDays }: LearningStreakProps) {
    // Reordered days of week to start with Sunday, end with Saturday, with Wednesday in the middle
    const daysOfWeek = ["S", "M", "T", "W", "T", "F", "S"];

    // Map display days to their internal identifiers
    const dayToIdentifierMap = ["S_0", "M", "T", "W", "T", "F", "S_6"];

    // List of energizing emojis
    const energizing_emojis = [
        "🚀", "💪", "🔥", "⚡", "🌟", "🏆", "💯", "🎉", "👏", "🌈", "💥", "🎯", "🏅", "✨"
    ];

    // Generate a random emoji from the list if streak is at least 1 day
    const randomEmoji = useMemo(() => {
        if (streakDays >= 1) {
            const randomIndex = Math.floor(Math.random() * energizing_emojis.length);
            return energizing_emojis[randomIndex];
        }
        return null;
    }, [streakDays]);

    // Function to check if a day is active based on index
    const isDayActive = (index: number): boolean => {
        // Get the identifier for this position
        const identifier = dayToIdentifierMap[index];
        return activeDays.includes(identifier);
    };

    return (
        <div className="bg-[#121212] rounded-lg border border-gray-800 overflow-hidden">
            <div className="bg-[#2A2000] px-4 py-3 border-b border-gray-800">
                <h3 className="text-lg font-light text-white">Learning Streak</h3>
            </div>

            <div className="p-4">
                <div className="text-3xl font-light mb-4 text-white flex items-center">
                    {streakDays} Days
                    {randomEmoji && <span className="ml-2" role="img" aria-label="Energizing emoji">{randomEmoji}</span>}
                </div>

                <div className="flex justify-between w-full">
                    {daysOfWeek.map((day, index) => (
                        <div
                            key={index}
                            className={`
                                flex-1 h-8 flex items-center justify-center rounded mx-1.5
                                ${isDayActive(index)
                                    ? "bg-[#F9B84E] text-black font-light"
                                    : "bg-gray-800 text-gray-400 font-light"}
                            `}
                        >
                            {day}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
} 