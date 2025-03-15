import React from "react";
import { ChevronDown } from "lucide-react";
import Image from "next/image";

interface Performer {
    name: string;
    completionPercentage: number;
    tasksSolved: number;
    position: number;
}

interface TopPerformersProps {
    performers: Performer[];
    timeFrame?: "Weekly" | "Monthly" | "All Time";
}

export default function TopPerformers({
    performers,
    timeFrame = "Weekly"
}: TopPerformersProps) {
    // Function to get the appropriate badge SVG based on position
    const getPositionBadge = (position: number) => {
        if (position === 1) {
            return "/images/leaderboard_1.svg";
        } else if (position === 2) {
            return "/images/leaderboard_2.svg";
        } else if (position === 3) {
            return "/images/leaderboard_3.svg";
        }
        return null;
    };

    return (
        <div className="bg-white dark:bg-[#121212] rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
            <div className="bg-[#FFF3D8] dark:bg-[#2A2000] px-4 py-3 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center">
                <h3 className="text-lg font-light text-black dark:text-white">Top Performers</h3>
                <button className="flex items-center text-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 rounded-md px-3 py-1">
                    {timeFrame}
                    <ChevronDown size={16} className="ml-1" />
                </button>
            </div>

            <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {performers.map((performer) => (
                    <div key={performer.position} className="p-4 flex items-center">
                        {performer.position <= 3 ? (
                            <div className="w-12 h-12 mr-4 flex items-center justify-center">
                                <Image
                                    src={getPositionBadge(performer.position)!}
                                    alt={`Position ${performer.position}`}
                                    width={40}
                                    height={40}
                                />
                            </div>
                        ) : (
                            <div className="w-12 h-12 rounded-full flex items-center justify-center mr-4 bg-gray-100">
                                <div className="w-10 h-10 rounded-full flex items-center justify-center font-light text-xl border-2 text-gray-400 border-gray-400">
                                    {performer.position}
                                </div>
                            </div>
                        )}
                        <div className="flex-1">
                            <div className="text-base font-medium text-black dark:text-white">{performer.name}</div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                                Course Completion: {performer.completionPercentage}%
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                                Solved: {performer.tasksSolved} Tasks
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
} 