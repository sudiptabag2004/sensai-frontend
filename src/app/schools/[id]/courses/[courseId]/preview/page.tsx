"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import LearnerCourseView from "@/components/LearnerCourseView";
import { Module, ModuleItem } from "@/types/course";

// Define Milestone interface for the API response
interface Milestone {
    id: number;
    name: string;
    color: string;
    ordering: number;
    tasks?: Task[];
}

interface Task {
    id: number;
    title: string;
    type: string;
    status: string;
    ordering: number;
}

export default function CoursePreviewPage() {
    const params = useParams();
    const schoolId = params.id as string;
    const courseId = params.courseId as string;

    const [isLoading, setIsLoading] = useState(true);
    const [courseTitle, setCourseTitle] = useState("Loading course...");
    const [modules, setModules] = useState<Module[]>([]);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchCourseDetails = async () => {
            try {
                setIsLoading(true);
                const response = await fetch(`http://localhost:8001/courses/${courseId}`);

                if (!response.ok) {
                    throw new Error(`Failed to fetch course details: ${response.status}`);
                }

                const data = await response.json();
                setCourseTitle(data.name);

                // Check if milestones are available in the response
                if (data.milestones && Array.isArray(data.milestones)) {
                    // Transform milestones to match our Module interface
                    const transformedModules = data.milestones.map((milestone: Milestone) => {
                        // Map tasks to module items if they exist
                        const moduleItems: ModuleItem[] = [];

                        if (milestone.tasks && Array.isArray(milestone.tasks)) {
                            milestone.tasks.forEach((task: Task) => {
                                if (task.type === 'learning_material') {
                                    moduleItems.push({
                                        id: task.id.toString(),
                                        title: task.title,
                                        position: task.ordering,
                                        type: 'material',
                                        content: [], // Empty content initially
                                        status: task.status // Add status from API response
                                    });
                                } else if (task.type === 'quiz') {
                                    moduleItems.push({
                                        id: task.id.toString(),
                                        title: task.title,
                                        position: task.ordering,
                                        type: 'quiz',
                                        questions: [], // Empty questions initially
                                        status: task.status // Add status from API response
                                    });
                                } else if (task.type === 'exam') {
                                    moduleItems.push({
                                        id: task.id.toString(),
                                        title: task.title,
                                        position: task.ordering,
                                        type: 'exam',
                                        questions: [], // Empty questions initially
                                        status: task.status // Add status from API response
                                    });
                                }
                            });

                            // Sort items by position/ordering
                            moduleItems.sort((a, b) => a.position - b.position);
                        }

                        return {
                            id: milestone.id.toString(),
                            title: milestone.name,
                            position: milestone.ordering,
                            items: moduleItems,
                            isExpanded: false,
                            backgroundColor: `${milestone.color}80`, // Add 50% opacity for UI display
                        };
                    });

                    // Sort modules by position/ordering if needed
                    transformedModules.sort((a: { position: number }, b: { position: number }) => a.position - b.position);

                    // Set the modules state
                    setModules(transformedModules);
                } else {
                    setModules([]);
                }

                setIsLoading(false);
            } catch (err) {
                console.error("Error fetching course details:", err);
                setError("Failed to load course details. Please try again later.");
                setIsLoading(false);
            }
        };

        fetchCourseDetails();
    }, [courseId]);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center">
                <div className="w-16 h-16 border-t-2 border-b-2 border-black dark:border-white rounded-full animate-spin"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-light text-red-500 dark:text-red-400 mb-4">{error}</h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        Please try again later or contact support if the problem persists.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <LearnerCourseView
            courseTitle={courseTitle}
            modules={modules}
            isPreview={true}
            schoolId={schoolId}
        />
    );
} 