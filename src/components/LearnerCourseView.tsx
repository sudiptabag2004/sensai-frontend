import { useState } from "react";
import { Header } from "@/components/layout/header";
import { ChevronDown, ChevronRight, BookOpen } from "lucide-react";
import Link from "next/link";
import { ModuleItem, Module } from "@/types/course";

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

                    {modules.length > 0 ? (
                        <div className="space-y-4">
                            {modules.map((module) => (
                                <div
                                    key={module.id}
                                    className="border border-gray-200 dark:border-gray-800 rounded-lg"
                                    style={{ backgroundColor: module.backgroundColor }}
                                >
                                    <div
                                        className="flex items-center p-4 cursor-pointer"
                                        onClick={() => toggleModule(module.id)}
                                    >
                                        <div className="mr-2">
                                            {expandedModules[module.id] ?
                                                <ChevronDown className="h-5 w-5 text-gray-500 dark:text-gray-400" /> :
                                                <ChevronRight className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                                            }
                                        </div>
                                        <h2 className="text-xl font-light text-black dark:text-white">
                                            {module.title || "Untitled Module"}
                                        </h2>
                                    </div>

                                    {expandedModules[module.id] && (
                                        <div className="p-4 pt-0 pl-12">
                                            {module.items.length > 0 ? (
                                                <div className="space-y-3">
                                                    {module.items.map((item) => (
                                                        <div
                                                            key={item.id}
                                                            className="flex items-center p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md cursor-pointer"
                                                        >
                                                            <BookOpen className="h-4 w-4 mr-2 text-gray-500 dark:text-gray-400" />
                                                            <span className="text-gray-700 dark:text-gray-300">{item.title}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="text-gray-500 dark:text-gray-400 italic">
                                                    Nothing added in this module yet
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
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