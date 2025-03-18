import React, { useState, useEffect, useCallback } from "react";
import LearnerCourseView from "./LearnerCourseView";
import LearningStreak from "./LearningStreak";
import TopPerformers from "./TopPerformers";
import { Module } from "@/types/course";
import { useAuth } from "@/lib/auth";

// Constants for localStorage keys
const LAST_INCREMENT_DATE_KEY = 'streak_last_increment_date';
const LAST_STREAK_COUNT_KEY = 'streak_last_count';

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

    // Get user from auth context
    const { user } = useAuth();
    const userId = user?.id || '';

    // Create user-specific localStorage keys
    const getUserStorageKey = useCallback((key: string): string => {
        return `${key}_${userId}_${cohortId}`;
    }, [userId, cohortId]);

    // Add state for streak data
    const [streakCount, setStreakCount] = useState<number>(streakDays);
    const [activeWeekDays, setActiveWeekDays] = useState<string[]>(activeDays);
    const [isLoadingStreak, setIsLoadingStreak] = useState<boolean>(false);

    // Initialize state from localStorage or default values
    const [lastIncrementDate, setLastIncrementDate] = useState<string | null>(() => {
        if (typeof window !== 'undefined' && userId && cohortId) {
            return localStorage.getItem(getUserStorageKey(LAST_INCREMENT_DATE_KEY));
        }
        return null;
    });

    const [lastStreakCount, setLastStreakCount] = useState<number>(() => {
        if (typeof window !== 'undefined' && userId && cohortId) {
            const stored = localStorage.getItem(getUserStorageKey(LAST_STREAK_COUNT_KEY));
            return stored ? parseInt(stored, 10) : streakDays;
        }
        return streakDays;
    });

    // Re-initialize state from localStorage when userId or cohortId changes
    useEffect(() => {
        if (typeof window !== 'undefined' && userId && cohortId) {
            const storedDate = localStorage.getItem(getUserStorageKey(LAST_INCREMENT_DATE_KEY));
            if (storedDate) {
                setLastIncrementDate(storedDate);
            }

            const storedCount = localStorage.getItem(getUserStorageKey(LAST_STREAK_COUNT_KEY));
            if (storedCount) {
                setLastStreakCount(parseInt(storedCount, 10));
            }
        }
    }, [userId, cohortId, getUserStorageKey]);

    // Update localStorage when lastIncrementDate changes
    useEffect(() => {
        if (typeof window !== 'undefined' && userId && cohortId && lastIncrementDate !== null) {
            localStorage.setItem(getUserStorageKey(LAST_INCREMENT_DATE_KEY), lastIncrementDate);
        }
    }, [lastIncrementDate, userId, cohortId, getUserStorageKey]);

    // Update localStorage when lastStreakCount changes
    useEffect(() => {
        if (typeof window !== 'undefined' && userId && cohortId) {
            localStorage.setItem(getUserStorageKey(LAST_STREAK_COUNT_KEY), lastStreakCount.toString());
        }
    }, [lastStreakCount, userId, cohortId, getUserStorageKey]);

    // Function to convert date to day of week abbreviation (M, T, W, T, F, S, S)
    const convertDateToDayOfWeek = (dateString: string): string => {
        const date = new Date(dateString);
        const dayIndex = date.getDay(); // 0 is Sunday, 1 is Monday, etc.

        // Convert day index to our format (M, T, W, T, F, S, S) with Monday as first day
        const daysOfWeek = ["S", "M", "T", "W", "T", "F", "S"];
        return daysOfWeek[dayIndex];
    };

    // Get today's date in YYYY-MM-DD format
    const getTodayDateString = (): string => {
        const today = new Date();
        return today.toISOString().split('T')[0];
    };

    // Check if we already incremented streak today
    const isStreakIncrementedToday = useCallback((): boolean => {
        return lastIncrementDate === getTodayDateString();
    }, [lastIncrementDate]);

    // Extract the fetchStreakData function so it can be reused
    const fetchStreakData = useCallback(async () => {
        // Only fetch if we have both user ID and cohort ID
        if (!userId || !cohortId) return;

        // If streak was already incremented today, don't fetch again
        if (isStreakIncrementedToday()) {
            console.log("Streak already incremented today, skipping fetch");
            return;
        }

        setIsLoadingStreak(true);

        try {
            const response = await fetch(`http://localhost:8001/users/${userId}/streak?cohort_id=${cohortId}`);

            if (!response.ok) {
                throw new Error(`Failed to fetch streak data: ${response.status}`);
            }

            const data: StreakData = await response.json();

            // Check if streak count has increased since last fetch
            const hasStreakIncremented = data.streak_count > lastStreakCount;

            // Update last streak count
            setLastStreakCount(data.streak_count);

            // If streak has increased, mark today as the last increment date
            if (hasStreakIncremented) {
                setLastIncrementDate(getTodayDateString());
                console.log("Streak incremented! New streak:", data.streak_count);
            }

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
    }, [userId, cohortId, lastStreakCount, isStreakIncrementedToday]);

    // Fetch streak data when component mounts
    useEffect(() => {
        if (userId && cohortId) {
            fetchStreakData();
        }
    }, [fetchStreakData, userId, cohortId]);

    // Handler for when the LearnerCourseView dialog closes
    const handleDialogClose = useCallback(() => {
        // Only refresh streak data if it wasn't already incremented today
        if (!isStreakIncrementedToday()) {
            fetchStreakData();
        }
    }, [fetchStreakData, isStreakIncrementedToday]);

    // Handler for task completion updates
    const handleTaskComplete = useCallback((taskId: string, isComplete: boolean) => {
        setLocalCompletedTaskIds(prev => ({
            ...prev,
            [taskId]: isComplete
        }));

        // If a task was completed, check for streak update
        if (isComplete && !isStreakIncrementedToday()) {
            // Small delay to allow the backend to process the completion
            setTimeout(() => {
                fetchStreakData();
            }, 500);
        }
    }, [fetchStreakData, isStreakIncrementedToday]);

    // Handler for question completion updates
    const handleQuestionComplete = useCallback((taskId: string, questionId: string, isComplete: boolean) => {
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

        // If a question was completed, check for streak update
        if (isComplete && !isStreakIncrementedToday()) {
            // Small delay to allow the backend to process the completion
            setTimeout(() => {
                fetchStreakData();
            }, 500);
        }
    }, [fetchStreakData, isStreakIncrementedToday]);

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
                        onDialogClose={handleDialogClose}
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