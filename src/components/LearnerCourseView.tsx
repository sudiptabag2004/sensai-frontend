import { useState } from "react";
import { Header } from "@/components/layout/header";
import Link from "next/link";
import { ModuleItem, Module } from "@/types/course";
import CourseModuleList, { LocalModule } from "./CourseModuleList";

interface LearnerCourseViewProps {
    courseTitle: string;
    modules: Module[];
    isPreview?: boolean;
    schoolId?: string;
}

export default function LearnerCourseView({
    courseTitle,
    modules,
    isPreview = false,
    schoolId
}: LearnerCourseViewProps) {
    const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({});

    // Filter out draft items from modules in both preview and learner view
    const modulesWithFilteredItems = modules.map(module => ({
        ...module,
        items: module.items.filter(item => item.status !== 'draft')
    })) as LocalModule[];

    // Filter out empty modules (those with no items after filtering)
    const filteredModules = modulesWithFilteredItems.filter(module => module.items.length > 0);

    const toggleModule = (moduleId: string) => {
        setExpandedModules(prev => ({
            ...prev,
            [moduleId]: !prev[moduleId]
        }));
    };

    return (
        <div className="min-h-screen bg-white dark:bg-black">
            {!isPreview && <Header showCreateCourseButton={false} />}

            {/* Preview announcement banner */}
            {isPreview && (
                <div className="bg-[#111111] border-b border-gray-800 text-white py-3 px-4 text-center shadow-sm">
                    <p className="font-light text-sm">You are viewing a preview of this course. This is how it will appear to learners.</p>
                </div>
            )}

            <div className="px-8 py-12">
                <div className="max-w-5xl mx-auto">
                    <h1 className="text-4xl font-light text-black dark:text-white mb-8">
                        {courseTitle}
                    </h1>

                    {filteredModules.length > 0 ? (
                        <CourseModuleList
                            modules={filteredModules}
                            mode="view"
                            expandedModules={expandedModules}
                            onToggleModule={toggleModule}
                        />
                    ) : (
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                            <div>
                                <h2 className="text-4xl font-light mb-4 text-white">
                                    Your learning adventure awaits!
                                </h2>
                                <p className="text-gray-400 mb-8">
                                    This course is still being crafted with care. Check back soon to begin your journey.
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
} 