"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import LearnerCourseView from "@/components/LearnerCourseView";
import { CourseDetails, Module } from "@/types/course";

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

                const data: CourseDetails = await response.json();
                setCourseTitle(data.name);

                // If the API returns modules, use those, otherwise use an empty array
                setModules(data.modules || []);

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