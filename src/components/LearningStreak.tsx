import React, { useMemo } from "react";

interface LearningStreakProps {
    streakDays: number;
    activeDays: string[]; // Days that are active in the streak (e.g., ['M', 'T'])
}

export default function LearningStreak({ streakDays, activeDays }: LearningStreakProps) {
    const daysOfWeek = ["M", "T", "W", "T", "F", "S", "S"];

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

    return (
        <div className="bg-white dark:bg-[#121212] rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
            <div className="bg-[#FFF3D8] dark:bg-[#2A2000] px-4 py-3 border-b border-gray-200 dark:border-gray-800">
                <h3 className="text-lg font-light text-black dark:text-white">Learning Streak</h3>
            </div>

            <div className="p-4">
                <div className="text-3xl font-light mb-4 text-black dark:text-white flex items-center">
                    {streakDays} Days
                    {randomEmoji && <span className="ml-2" role="img" aria-label="Energizing emoji">{randomEmoji}</span>}
                </div>

                <div className="flex space-x-2">
                    {daysOfWeek.map((day, index) => (
                        <div
                            key={index}
                            className={`
                w-8 h-8 flex items-center justify-center rounded
                ${activeDays.includes(day)
                                    ? "bg-[#F9B84E] text-black font-light"
                                    : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 font-light"}
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