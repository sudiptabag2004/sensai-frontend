import React from "react";
import Image from "next/image";
import { User, ChevronRight, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";

interface Performer {
    name: string;
    completionPercentage: number;
    tasksSolved: number;
    position: number;
}

interface TopPerformersProps {
    performers: Performer[];
    timeFrame?: "Weekly" | "Monthly" | "All Time";
    currentUser?: Performer; // Current logged-in user data
    schoolId?: string; // School ID for navigation
    cohortId?: string; // Cohort ID for navigation
}

export default function TopPerformers({
    performers,
    timeFrame = "Weekly",
    currentUser,
    schoolId,
    cohortId
}: TopPerformersProps) {
    const router = useRouter();

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

    // Check if current user is already in top performers
    const isCurrentUserInTopPerformers = currentUser
        ? performers.some(performer => performer.name === currentUser.name)
        : false;

    // Function to navigate to the full leaderboard
    const navigateToLeaderboard = () => {
        if (schoolId && cohortId) {
            router.push(`/school/${schoolId}/cohort/${cohortId}/leaderboard`);
        } else {
            console.warn("Cannot navigate to leaderboard: missing schoolId or cohortId");
        }
    };

    return (
        <div className="bg-white dark:bg-[#121212] rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800 bg-[#FFF3D8] dark:bg-[#2A2000] flex justify-between items-center">
                <h3 className="text-lg font-light text-black dark:text-white">Top Performers</h3>
                <button
                    onClick={navigateToLeaderboard}
                    className="group px-2.5 py-1 text-sm font-light rounded-md transition-all duration-200 flex items-center 
                    bg-black/5 hover:bg-black/10 dark:bg-white/10 dark:hover:bg-white/15 text-gray-700 dark:text-gray-200 cursor-pointer"
                    aria-label="See all performers"
                >
                    <span>See All</span>
                    <ChevronRight size={16} className="ml-1 transition-transform duration-200 group-hover:translate-x-0.5" />
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

                {/* Show current user if they're not in top performers */}
                {currentUser && !isCurrentUserInTopPerformers && (
                    <>
                        <div className="px-4 bg-gray-50 dark:bg-gray-900 text-center text-xs text-gray-500 dark:text-gray-400">
                        </div>
                        <div className="p-4 flex items-center bg-gray-50/50 dark:bg-gray-900/20">
                            <div className="w-12 h-12 rounded-full flex items-center justify-center mr-4 bg-blue-50 dark:bg-blue-900/20">
                                <div className="w-10 h-10 rounded-full flex items-center justify-center font-light text-base border-2 text-blue-500 border-blue-500">
                                    {currentUser.position}
                                </div>
                            </div>
                            <div className="flex-1">
                                <div className="text-base font-medium text-black dark:text-white flex items-center">
                                    {currentUser.name}
                                    <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                                        You
                                    </span>
                                </div>
                                <div className="text-sm text-gray-600 dark:text-gray-400">
                                    Course Completion: {currentUser.completionPercentage}%
                                </div>
                                <div className="text-sm text-gray-600 dark:text-gray-400">
                                    Solved: {currentUser.tasksSolved} Tasks
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
} 