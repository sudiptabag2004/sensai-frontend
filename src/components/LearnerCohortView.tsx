import React, { useState } from "react";
import LearnerCourseView from "./LearnerCourseView";
import LearningStreak from "./LearningStreak";
import TopPerformers from "./TopPerformers";
import { Module } from "@/types/course";

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

    return (
        <div className="bg-white dark:bg-black">
            <div className="flex flex-col lg:flex-row gap-10">
                {/* Main Content Column - LearnerCourseView */}
                <div className={`${(streakDays > 0 || performers.length > 0) ? 'w-full lg:w-2/3' : 'w-full'}`}>
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
                {(streakDays > 0 || performers.length > 0) && (
                    <div className="w-full lg:w-1/3 space-y-6">
                        {streakDays > 0 && (
                            <LearningStreak
                                streakDays={streakDays}
                                activeDays={activeDays}
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