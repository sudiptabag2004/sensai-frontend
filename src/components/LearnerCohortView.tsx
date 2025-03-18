import React, { useState, useEffect } from "react";
import LearnerCourseView from "./LearnerCourseView";
import LearningStreak from "./LearningStreak";
import TopPerformers from "./TopPerformers";
import { Module } from "@/types/course";
import { useAuth } from "@/lib/auth";

interface Performer {
    name: string;
    completionPercentage: number;
    tasksSolved: number;
    position: number;
}

interface LearnerCohortViewProps {
    courseTitle: string;
    modules: Module[];
    schoolId?: string;
    cohortId?: string;
    streakDays?: number;
    activeDays?: string[];
    performers?: Performer[];
    currentUser?: Performer;
    completedTaskIds?: Record<string, boolean>;
    completedQuestionIds?: Record<string, Record<string, boolean>>;
}

interface StreakData {
    streak_count: number;
    active_days: string[]; // Format: YYYY-MM-DD
}

export default function LearnerCohortView({
    courseTitle,
    modules,
    schoolId,
    cohortId,
    streakDays = 0,
    activeDays = [],
    performers = [],
    currentUser,
    completedTaskIds = {},
    completedQuestionIds = {}
}: LearnerCohortViewProps) {
    // Add state to manage completed tasks and questions
    const [localCompletedTaskIds, setLocalCompletedTaskIds] = useState<Record<string, boolean>>(completedTaskIds);
    const [localCompletedQuestionIds, setLocalCompletedQuestionIds] = useState<Record<string, Record<string, boolean>>>(completedQuestionIds);

    // Add state for streak data
    const [streakCount, setStreakCount] = useState<number>(streakDays);
    const [activeWeekDays, setActiveWeekDays] = useState<string[]>(activeDays);
    const [isLoadingStreak, setIsLoadingStreak] = useState<boolean>(false);

    // Get user from auth context
    const { user } = useAuth();
    const userId = user?.id || '';

    // Function to convert date to day of week abbreviation (M, T, W, T, F, S, S)
    const convertDateToDayOfWeek = (dateString: string): string => {
        const date = new Date(dateString);
        const dayIndex = date.getDay(); // 0 is Sunday, 1 is Monday, etc.

        // Convert day index to our format (M, T, W, T, F, S, S) with Monday as first day
        const daysOfWeek = ["S", "M", "T", "W", "T", "F", "S"];
        return daysOfWeek[dayIndex];
    };

    // Fetch streak data when component mounts
    useEffect(() => {
        const fetchStreakData = async () => {
            // Only fetch if we have both user ID and cohort ID
            if (!userId || !cohortId) return;

            setIsLoadingStreak(true);

            try {
                const response = await fetch(`http://localhost:8001/users/${userId}/streak?cohort_id=${cohortId}`);

                if (!response.ok) {
                    throw new Error(`Failed to fetch streak data: ${response.status}`);
                }

                const data: StreakData = await response.json();

                // Set streak count
                setStreakCount(data.streak_count);

                // Convert active days from dates to day abbreviations
                const dayAbbreviations = data.active_days.map(convertDateToDayOfWeek);
                setActiveWeekDays(dayAbbreviations);

            } catch (error) {
                console.error("Error fetching streak data:", error);
                // Keep existing values on error
            } finally {
                setIsLoadingStreak(false);
            }
        };

        fetchStreakData();
    }, [userId, cohortId]);

    // Handler for task completion updates
    const handleTaskComplete = (taskId: string, isComplete: boolean) => {
        setLocalCompletedTaskIds(prev => ({
            ...prev,
            [taskId]: isComplete
        }));
    };

    // Handler for question completion updates
    const handleQuestionComplete = (taskId: string, questionId: string, isComplete: boolean) => {
        setLocalCompletedQuestionIds(prev => {
            const updatedQuestionIds = { ...prev };

            // Initialize the object for this task if it doesn't exist
            if (!updatedQuestionIds[taskId]) {
                updatedQuestionIds[taskId] = {};
            }

            // Mark this question as complete
            updatedQuestionIds[taskId] = {
                ...updatedQuestionIds[taskId],
                [questionId]: isComplete
            };

            return updatedQuestionIds;
        });
    };

    // Determine if sidebar should be shown
    const showSidebar = cohortId || performers.length > 0;

    return (
        <div className="bg-white dark:bg-black">
            <div className="flex flex-col lg:flex-row gap-10">
                {/* Main Content Column - LearnerCourseView */}
                <div className={`${showSidebar ? 'w-full lg:w-2/3' : 'w-full'}`}>
                    {courseTitle && (
                        <h1 className="text-4xl font-light text-black dark:text-white mb-8">
                            {courseTitle}
                        </h1>
                    )}

                    <LearnerCourseView
                        courseTitle=""
                        modules={modules}
                        completedTaskIds={localCompletedTaskIds}
                        completedQuestionIds={localCompletedQuestionIds}
                        onTaskComplete={handleTaskComplete}
                        onQuestionComplete={handleQuestionComplete}
                    />
                </div>

                {/* Sidebar Column */}
                {showSidebar && (
                    <div className="w-full lg:w-1/3 space-y-6">
                        {/* Always show streak component when not loading and cohort ID exists */}
                        {!isLoadingStreak && cohortId && (
                            <LearningStreak
                                streakDays={streakCount}
                                activeDays={activeWeekDays}
                            />
                        )}

                        {performers.length > 0 && (
                            <TopPerformers
                                performers={performers}
                                currentUser={currentUser}
                                schoolId={schoolId}
                                cohortId={cohortId}
                            />
                        )}
                    </div>
                )}
            </div>
        </div>
    );
} 