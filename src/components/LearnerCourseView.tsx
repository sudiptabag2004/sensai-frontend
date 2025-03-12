import { useState, useRef } from "react";
import { Header } from "@/components/layout/header";
import Link from "next/link";
import { ModuleItem, Module } from "@/types/course";
import CourseModuleList, { LocalModule } from "./CourseModuleList";
import dynamic from "next/dynamic";
import { X, CheckCircle, BookOpen, HelpCircle, Clipboard } from "lucide-react";

// Dynamically import editor components to avoid SSR issues
const DynamicLearningMaterialEditor = dynamic(
    () => import("./LearningMaterialEditor"),
    { ssr: false }
);

const DynamicQuizEditor = dynamic(
    () => import("./QuizEditor"),
    { ssr: false }
);

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
    const [activeItem, setActiveItem] = useState<any>(null);
    const [activeModuleId, setActiveModuleId] = useState<string | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    // Track completed tasks
    const [completedTasks, setCompletedTasks] = useState<Record<string, boolean>>({});
    const dialogTitleRef = useRef<HTMLHeadingElement>(null);
    const dialogContentRef = useRef<HTMLDivElement>(null);

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

    // Function to open a task item and fetch its details
    const openTaskItem = async (moduleId: string, itemId: string) => {
        setIsLoading(true);
        try {
            // Find the item in the modules
            const module = filteredModules.find(m => m.id === moduleId);
            if (!module) return;

            const item = module.items.find(i => i.id === itemId);
            if (!item) return;

            // Fetch item details from API
            console.log("Fetching task data for taskId for learner view:", itemId);
            const response = await fetch(`http://localhost:8001/tasks/${itemId}`);
            if (!response.ok) {
                throw new Error(`Failed to fetch task: ${response.status}`);
            }

            const data = await response.json();
            console.log("Fetched task data:", data);

            // Create an updated item with the fetched data
            let updatedItem;
            if (item.type === 'material') {
                updatedItem = {
                    ...item,
                    content: data.blocks || []
                };
            } else if (item.type === 'quiz' || item.type === 'exam') {
                updatedItem = {
                    ...item,
                    questions: data.questions || []
                };
            } else {
                updatedItem = item;
            }

            setActiveItem(updatedItem);
            setActiveModuleId(moduleId);
            setIsDialogOpen(true);
        } catch (error) {
            console.error("Error fetching task:", error);
            // Still open dialog with existing item data if fetch fails
            const module = filteredModules.find(m => m.id === moduleId);
            if (!module) return;

            const item = module.items.find(i => i.id === itemId);
            if (item) {
                setActiveItem(item);
                setActiveModuleId(moduleId);
                setIsDialogOpen(true);
            }
        } finally {
            setIsLoading(false);
        }
    };

    // Function to close the dialog
    const closeDialog = () => {
        setIsDialogOpen(false);
        setActiveItem(null);
        setActiveModuleId(null);
    };

    // Function to mark task as completed (placeholder for now)
    const markTaskComplete = async () => {
        if (!activeItem || !activeModuleId) return;

        try {
            // API call to mark the task as completed would go here
            console.log("Marking task as complete:", activeItem.id);

            // Placeholder for actual API call
            // const response = await fetch(`http://localhost:8001/task-completions`, {
            //     method: 'POST',
            //     headers: {
            //         'Content-Type': 'application/json',
            //     },
            //     body: JSON.stringify({
            //         task_id: activeItem.id,
            //     }),
            // });

            // Mark the task as completed in our local state
            setCompletedTasks(prev => ({
                ...prev,
                [activeItem.id]: true
            }));

            // Find the current module
            const currentModule = filteredModules.find(m => m.id === activeModuleId);
            if (!currentModule) return;

            // Find the index of the current task in the module
            const currentTaskIndex = currentModule.items.findIndex(item => item.id === activeItem.id);
            if (currentTaskIndex === -1) return;

            // Check if there's a next task in this module
            if (currentTaskIndex < currentModule.items.length - 1) {
                // Navigate to the next task in the same module
                const nextTask = currentModule.items[currentTaskIndex + 1];
                openTaskItem(activeModuleId, nextTask.id);
            } else {
                // This was the last task in the module, close the dialog
                closeDialog();
            }
        } catch (error) {
            console.error("Error marking task as complete:", error);
        }
    };

    // Handle Escape key to close dialog
    const handleKeyDown = (e: React.KeyboardEvent<HTMLHeadingElement>) => {
        if (e.key === 'Escape') {
            closeDialog();
        }
    };

    // Handle click outside dialog to close it
    const handleDialogBackdropClick = (e: React.MouseEvent) => {
        // Only close if clicking directly on the backdrop, not on the dialog content
        if (dialogContentRef.current && !dialogContentRef.current.contains(e.target as Node)) {
            closeDialog();
        }
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
                            onOpenItem={openTaskItem}
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

            {/* Task Viewer Dialog - Using the same pattern as the editor view */}
            {isDialogOpen && activeItem && (
                <div
                    className="fixed inset-0 bg-black z-50 overflow-hidden"
                >
                    <div
                        ref={dialogContentRef}
                        className="w-full h-full flex flex-row"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Sidebar with module tasks */}
                        <div className="w-64 h-full bg-[#121212] border-r border-gray-800 flex flex-col overflow-hidden">
                            {/* Sidebar Header */}
                            <div className="p-4 border-b border-gray-800 bg-[#0A0A0A]">
                                <h3 className="text-lg font-light text-white truncate">
                                    {filteredModules.find(m => m.id === activeModuleId)?.title || "Module"}
                                </h3>
                            </div>

                            {/* Task List */}
                            <div className="flex-1 overflow-y-auto pt-0 pb-2">
                                {activeModuleId && filteredModules.find(m => m.id === activeModuleId)?.items.map((item) => (
                                    <div
                                        key={item.id}
                                        className={`px-4 py-2 cursor-pointer flex items-center ${item.id === activeItem.id
                                            ? "bg-[#222222] border-l-2 border-green-500"
                                            : completedTasks[item.id]
                                                ? "border-l-2 border-green-500 text-green-500"
                                                : "hover:bg-[#1A1A1A] border-l-2 border-transparent"
                                            }`}
                                        onClick={() => openTaskItem(activeModuleId, item.id)}
                                    >
                                        <div className={`flex items-center mr-2 ${completedTasks[item.id] ? "text-green-500" : "text-gray-400"}`}>
                                            {completedTasks[item.id]
                                                ? <CheckCircle size={14} />
                                                : item.type === 'material'
                                                    ? <BookOpen size={14} />
                                                    : item.type === 'quiz'
                                                        ? <HelpCircle size={14} />
                                                        : <Clipboard size={14} />
                                            }
                                        </div>
                                        <div className={`flex-1 text-sm ${completedTasks[item.id] ? "text-green-500" : "text-gray-200"} truncate`}>
                                            {item.title}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Back to Course Button */}
                            <div className="p-3 border-t border-gray-800">
                                <button
                                    onClick={closeDialog}
                                    className="w-full flex items-center justify-center px-3 py-2 text-sm text-gray-300 hover:text-white bg-[#1A1A1A] hover:bg-[#222222] rounded transition-colors cursor-pointer"
                                >
                                    Back to Course
                                </button>
                            </div>
                        </div>

                        {/* Main Content */}
                        <div className="flex-1 h-full flex flex-col bg-[#1A1A1A]">
                            {/* Dialog Header */}
                            <div
                                className="flex items-center justify-between p-4 border-b border-gray-800"
                                style={{ backgroundColor: '#111111' }}
                            >
                                <div className="flex-1 flex items-center">
                                    <h2
                                        ref={dialogTitleRef}
                                        contentEditable={false}
                                        suppressContentEditableWarning
                                        onKeyDown={handleKeyDown}
                                        className="text-2xl font-light text-white outline-none"
                                    >
                                        {activeItem?.title}
                                    </h2>
                                </div>
                                <div className="flex items-center space-x-3">
                                    {completedTasks[activeItem?.id] ? (
                                        <button
                                            className="flex items-center px-4 py-2 text-sm text-white bg-green-600 hover:bg-green-700 rounded-full transition-colors cursor-default"
                                            disabled
                                        >
                                            <CheckCircle size={16} className="mr-2" />
                                            Completed
                                        </button>
                                    ) : (
                                        <button
                                            onClick={markTaskComplete}
                                            className="flex items-center px-4 py-2 text-sm text-white bg-transparent border !border-green-500 hover:bg-[#222222] focus:border-green-500 active:border-green-500 rounded-full transition-colors cursor-pointer"
                                            aria-label="Mark complete"
                                        >
                                            <CheckCircle size={16} className="mr-2" />
                                            Mark Complete
                                        </button>
                                    )}
                                    <button
                                        onClick={closeDialog}
                                        className="text-gray-400 hover:text-white transition-colors focus:outline-none cursor-pointer p-1 md:hidden"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>
                            </div>

                            {/* Dialog Content */}
                            <div
                                className="flex-1 overflow-y-auto p-6 dialog-content-editor"
                            >
                                {isLoading ? (
                                    <div className="flex items-center justify-center h-full">
                                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
                                    </div>
                                ) : (
                                    <>
                                        {activeItem?.type === 'material' && (
                                            <DynamicLearningMaterialEditor
                                                taskId={activeItem.id}
                                                readOnly={true}
                                            />
                                        )}
                                        {(activeItem?.type === 'quiz' || activeItem?.type === 'exam') && (
                                            <DynamicQuizEditor
                                                initialQuestions={activeItem.questions || []}
                                                readOnly={true}
                                                isPreviewMode={true}
                                            />
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
} 