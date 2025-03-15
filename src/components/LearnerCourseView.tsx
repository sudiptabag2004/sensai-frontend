import { useState, useRef, useCallback, useEffect } from "react";
import Link from "next/link";
import { ModuleItem, Module } from "@/types/course";
import CourseModuleList, { LocalModule } from "./CourseModuleList";
import dynamic from "next/dynamic";
import { X, CheckCircle, BookOpen, HelpCircle, Clipboard, ChevronLeft, ChevronRight } from "lucide-react";

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
}

export default function LearnerCourseView({
    courseTitle,
    modules
}: LearnerCourseViewProps) {
    const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({});
    const [activeItem, setActiveItem] = useState<any>(null);
    const [activeModuleId, setActiveModuleId] = useState<string | null>(null);
    const [activeQuestionId, setActiveQuestionId] = useState<string | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    // Track completed tasks
    const [completedTasks, setCompletedTasks] = useState<Record<string, boolean>>({});
    // Track completed questions within quizzes/exams
    const [completedQuestions, setCompletedQuestions] = useState<Record<string, boolean>>({});
    const dialogTitleRef = useRef<HTMLHeadingElement>(null);
    const dialogContentRef = useRef<HTMLDivElement>(null);
    // Add a ref to track if we've added a history entry
    const hasAddedHistoryEntryRef = useRef(false);

    // Filter out draft items from modules in both preview and learner view
    const modulesWithFilteredItems = modules.map(module => ({
        ...module,
        items: module.items.filter(item => item.status !== 'draft')
    })) as LocalModule[];

    // Filter out empty modules (those with no items after filtering)
    const filteredModules = modulesWithFilteredItems.filter(module => module.items.length > 0);

    // Calculate progress for each module based on completed tasks
    const modulesWithProgress = filteredModules.map(module => {
        // Get the total number of items in the module
        const totalItems = module.items.length;

        // If there are no items, progress is 0
        if (totalItems === 0) {
            return { ...module, progress: 0 };
        }

        // Count completed items in this module
        const completedItemsCount = module.items.filter(item =>
            completedTasks[item.id] === true
        ).length;

        // Calculate progress percentage
        const progress = Math.round((completedItemsCount / totalItems) * 100);

        return { ...module, progress };
    });

    const toggleModule = (moduleId: string) => {
        setExpandedModules(prev => ({
            ...prev,
            [moduleId]: !prev[moduleId]
        }));
    };

    // Handle browser history for dialog
    useEffect(() => {
        // Handler for back button
        const handlePopState = (event: PopStateEvent) => {
            // If dialog is open, close it
            if (isDialogOpen) {
                event.preventDefault();
                closeDialog();
            }
        };

        // If dialog is opened, add history entry
        if (isDialogOpen && !hasAddedHistoryEntryRef.current) {
            window.history.pushState({ dialog: true }, "");
            hasAddedHistoryEntryRef.current = true;
            window.addEventListener("popstate", handlePopState);
        }

        // Cleanup
        return () => {
            window.removeEventListener("popstate", handlePopState);
        };
    }, [isDialogOpen]);

    // Function to open a task item and fetch its details
    const openTaskItem = async (moduleId: string, itemId: string, questionId?: string) => {
        setIsLoading(true);
        try {
            // Find the item in the modules
            const module = filteredModules.find(m => m.id === moduleId);
            if (!module) return;

            const item = module.items.find(i => i.id === itemId);
            if (!item) return;

            // Fetch item details from API
            const response = await fetch(`http://localhost:8001/tasks/${itemId}`);
            if (!response.ok) {
                throw new Error(`Failed to fetch task: ${response.status}`);
            }

            const data = await response.json();

            // Create an updated item with the fetched data
            let updatedItem;
            if (item.type === 'material') {
                updatedItem = {
                    ...item,
                    content: data.blocks || []
                };
            } else if (item.type === 'quiz' || item.type === 'exam') {
                // Ensure questions have the right format for the QuizEditor component
                const formattedQuestions = (data.questions || []).map((q: any) => {
                    // Create a properly formatted question object
                    return {
                        id: q.id || `question-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                        blocks: q.blocks || [], // Keep the original blocks property
                        content: q.blocks || [], // Also add as content for compatibility
                        config: {
                            inputType: 'text',
                            responseStyle: 'coach',
                            evaluationCriteria: [],
                            correctAnswer: q.answer || ''
                        }
                    };
                });

                updatedItem = {
                    ...item,
                    questions: formattedQuestions
                };

                // Set active question ID if provided, otherwise set to first question
                if (questionId) {
                    setActiveQuestionId(questionId);
                } else if (formattedQuestions.length > 0) {
                    setActiveQuestionId(formattedQuestions[0].id);
                }
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

                // Set first question as active if it's a quiz/exam
                if ((item.type === 'quiz' || item.type === 'exam') &&
                    item.questions && item.questions.length > 0) {
                    setActiveQuestionId(questionId || item.questions[0].id);
                }
            }
        } finally {
            setIsLoading(false);
        }
    };

    // Function to activate a specific question in a quiz or exam
    const activateQuestion = (questionId: string) => {
        setActiveQuestionId(questionId);
    };

    // Function to close the dialog
    const closeDialog = () => {
        setIsDialogOpen(false);
        setActiveItem(null);
        setActiveModuleId(null);
        setActiveQuestionId(null);

        // Reset history entry flag when dialog is closed
        hasAddedHistoryEntryRef.current = false;
    };

    // Function to handle quiz/exam answer submission
    const handleQuizAnswerSubmit = useCallback((questionId: string, answer: string) => {
        // Mark the question as completed
        setCompletedQuestions(prev => ({
            ...prev,
            [questionId]: true
        }));

        // Check if all questions in the current quiz/exam are now completed
        if (activeItem?.type === 'quiz' || activeItem?.type === 'exam') {
            const allQuestions = activeItem.questions || [];

            // If this is a single question quiz, mark the entire task as complete
            if (allQuestions.length <= 1) {
                setCompletedTasks(prev => ({
                    ...prev,
                    [activeItem.id]: true
                }));
            } else {
                // For multi-question quiz/exam, check if all questions are now completed
                const areAllQuestionsCompleted = allQuestions.every(
                    (q: any) => completedQuestions[q.id] || q.id === questionId
                );

                if (areAllQuestionsCompleted) {
                    setCompletedTasks(prev => ({
                        ...prev,
                        [activeItem.id]: true
                    }));
                }
            }
        }
    }, [activeItem, completedQuestions]);

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

    // Function to navigate to the next task
    const goToNextTask = () => {
        if (!activeItem || !activeModuleId) return;

        // If this is a quiz/exam with questions and not on the last question, go to next question
        if ((activeItem.type === 'quiz' || activeItem.type === 'exam') &&
            activeItem.questions &&
            activeItem.questions.length > 1 &&
            activeQuestionId) {

            const currentIndex = activeItem.questions.findIndex((q: any) => q.id === activeQuestionId);
            if (currentIndex < activeItem.questions.length - 1) {
                // Go to next question
                const nextQuestion = activeItem.questions[currentIndex + 1];
                activateQuestion(nextQuestion.id);
                return;
            }
        }

        // Otherwise, go to next task in module
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
        }
    };

    // Function to navigate to the previous task
    const goToPreviousTask = () => {
        if (!activeItem || !activeModuleId) return;

        // If this is a quiz/exam with questions and not on the first question, go to previous question
        if ((activeItem.type === 'quiz' || activeItem.type === 'exam') &&
            activeItem.questions &&
            activeItem.questions.length > 1 &&
            activeQuestionId) {

            const currentIndex = activeItem.questions.findIndex((q: any) => q.id === activeQuestionId);
            if (currentIndex > 0) {
                // Go to previous question
                const prevQuestion = activeItem.questions[currentIndex - 1];
                activateQuestion(prevQuestion.id);
                return;
            }
        }

        // Otherwise, go to previous task in module
        const currentModule = filteredModules.find(m => m.id === activeModuleId);
        if (!currentModule) return;

        // Find the index of the current task in the module
        const currentTaskIndex = currentModule.items.findIndex(item => item.id === activeItem.id);
        if (currentTaskIndex === -1) return;

        // Check if there's a previous task in this module
        if (currentTaskIndex > 0) {
            // Navigate to the previous task in the same module
            const previousTask = currentModule.items[currentTaskIndex - 1];
            openTaskItem(activeModuleId, previousTask.id);
        }
    };

    // Function to check if we're at the first task in the module
    const isFirstTask = () => {
        if (!activeItem || !activeModuleId) return false;

        // If this is a quiz/exam with questions, check if we're on the first question
        if ((activeItem.type === 'quiz' || activeItem.type === 'exam') &&
            activeItem.questions &&
            activeItem.questions.length > 1 &&
            activeQuestionId) {

            const currentIndex = activeItem.questions.findIndex((q: any) => q.id === activeQuestionId);
            if (currentIndex > 0) {
                // Not the first question, so return false
                return false;
            }
        }

        const currentModule = filteredModules.find(m => m.id === activeModuleId);
        if (!currentModule) return false;

        const currentTaskIndex = currentModule.items.findIndex(item => item.id === activeItem.id);
        return currentTaskIndex === 0;
    };

    // Function to check if we're at the last task in the module
    const isLastTask = () => {
        if (!activeItem || !activeModuleId) return false;

        // If this is a quiz/exam with questions, check if we're on the last question
        if ((activeItem.type === 'quiz' || activeItem.type === 'exam') &&
            activeItem.questions &&
            activeItem.questions.length > 1 &&
            activeQuestionId) {

            const currentIndex = activeItem.questions.findIndex((q: any) => q.id === activeQuestionId);
            if (currentIndex < activeItem.questions.length - 1) {
                // Not the last question, so return false
                return false;
            }
        }

        const currentModule = filteredModules.find(m => m.id === activeModuleId);
        if (!currentModule) return false;

        const currentTaskIndex = currentModule.items.findIndex(item => item.id === activeItem.id);
        return currentTaskIndex === currentModule.items.length - 1;
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

    // Function to get previous task info
    const getPreviousTaskInfo = () => {
        if (!activeItem || !activeModuleId) return null;

        // If this is a quiz/exam with questions and not on the first question, get previous question info
        if ((activeItem.type === 'quiz' || activeItem.type === 'exam') &&
            activeItem.questions &&
            activeItem.questions.length > 1 &&
            activeQuestionId) {

            const currentIndex = activeItem.questions.findIndex((q: any) => q.id === activeQuestionId);
            if (currentIndex > 0) {
                // Return previous question info
                return {
                    type: 'question',
                    title: `Question ${currentIndex}`
                };
            }
        }

        // Get previous task in module
        const currentModule = filteredModules.find(m => m.id === activeModuleId);
        if (!currentModule) return null;

        // Find the index of the current task in the module
        const currentTaskIndex = currentModule.items.findIndex(item => item.id === activeItem.id);
        if (currentTaskIndex <= 0) return null;

        // Return previous task info
        const previousTask = currentModule.items[currentTaskIndex - 1];
        return {
            type: 'task',
            title: previousTask.title
        };
    };

    // Function to get next task info
    const getNextTaskInfo = () => {
        if (!activeItem || !activeModuleId) return null;

        // If this is a quiz/exam with questions and not on the last question, get next question info
        if ((activeItem.type === 'quiz' || activeItem.type === 'exam') &&
            activeItem.questions &&
            activeItem.questions.length > 1 &&
            activeQuestionId) {

            const currentIndex = activeItem.questions.findIndex((q: any) => q.id === activeQuestionId);
            if (currentIndex < activeItem.questions.length - 1) {
                // Return next question info
                return {
                    type: 'question',
                    title: `Question ${currentIndex + 2}`
                };
            }
        }

        // Get next task in module
        const currentModule = filteredModules.find(m => m.id === activeModuleId);
        if (!currentModule) return null;

        // Find the index of the current task in the module
        const currentTaskIndex = currentModule.items.findIndex(item => item.id === activeItem.id);
        if (currentTaskIndex === -1 || currentTaskIndex >= currentModule.items.length - 1) return null;

        // Return next task info
        const nextTask = currentModule.items[currentTaskIndex + 1];
        return {
            type: 'task',
            title: nextTask.title
        };
    };

    return (
        <div className="bg-white dark:bg-black">
            {filteredModules.length > 0 ? (
                <CourseModuleList
                    modules={modulesWithProgress}
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
                                    <div key={item.id}>
                                        <div
                                            className={`px-4 py-2 cursor-pointer flex items-center ${item.id === activeItem.id &&
                                                (
                                                    (item.type !== 'quiz' && item.type !== 'exam') ||
                                                    !activeItem?.questions ||
                                                    activeItem.questions.length <= 1
                                                )
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

                                        {/* Show questions as expanded items for active quiz/exam */}
                                        {(item.type === 'quiz' || item.type === 'exam') &&
                                            item.id === activeItem?.id &&
                                            activeItem?.questions &&
                                            activeItem.questions.length > 1 && (
                                                <div className="pl-8 border-l border-gray-800">
                                                    {activeItem.questions.map((question: any, index: number) => (
                                                        <div
                                                            key={question.id}
                                                            className={`px-4 py-2 cursor-pointer flex items-center ${question.id === activeQuestionId
                                                                ? "bg-[#222222] border-l-2 border-green-500"
                                                                : completedQuestions[question.id]
                                                                    ? "border-l-2 border-green-500 text-green-500"
                                                                    : "hover:bg-[#1A1A1A] border-l-2 border-transparent"
                                                                }`}
                                                            onClick={() => activateQuestion(question.id)}
                                                        >
                                                            <div className={`flex items-center mr-2 ${completedQuestions[question.id] ? "text-green-500" : "text-gray-400"}`}>
                                                                {completedQuestions[question.id]
                                                                    && <CheckCircle size={14} />
                                                                }
                                                            </div>
                                                            <div className={`flex-1 text-sm ${completedQuestions[question.id] ? "text-green-500" : "text-gray-300"} truncate`}>
                                                                Question {index + 1}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
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
                                    {/* Show completed status for exams that have been answered */}
                                    {(activeItem?.type === 'exam' &&
                                        ((activeItem.questions?.length === 1 && completedTasks[activeItem.id]) ||
                                            (activeItem.questions?.length > 1 && activeQuestionId && completedQuestions[activeQuestionId]))) && (
                                            <button
                                                className="flex items-center px-4 py-2 text-sm text-white bg-green-700 hover:bg-green-800 rounded-full transition-colors cursor-default"
                                                disabled
                                            >
                                                <CheckCircle size={16} className="mr-2" />
                                                Completed
                                            </button>
                                        )}
                                    {activeItem?.type === 'material' && (
                                        completedTasks[activeItem?.id] ? (
                                            <button
                                                className="flex items-center px-4 py-2 text-sm text-white bg-green-700 hover:bg-green-800 rounded-full transition-colors cursor-default"
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
                                        )
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
                                className="flex-1 overflow-y-auto p-0 dialog-content-editor"
                            >
                                {isLoading ? (
                                    <div className="flex items-center justify-center h-full">
                                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
                                    </div>
                                ) : (
                                    <>
                                        {activeItem?.type === 'material' && (
                                            <div className="pt-6">
                                                <DynamicLearningMaterialEditor
                                                    taskId={activeItem.id}
                                                    readOnly={true}
                                                />
                                            </div>
                                        )}
                                        {(activeItem?.type === 'quiz' || activeItem?.type === 'exam') && (
                                            <>
                                                <DynamicQuizEditor
                                                    initialQuestions={activeItem.questions || []}
                                                    readOnly={true}
                                                    isPreviewMode={true}
                                                    taskId={activeItem.id}
                                                    taskType={activeItem.type as 'quiz' | 'exam'}
                                                    currentQuestionId={activeQuestionId || undefined}
                                                    onQuestionChange={activateQuestion}
                                                    onSubmitAnswer={handleQuizAnswerSubmit}
                                                />
                                            </>
                                        )}
                                    </>
                                )}
                            </div>

                            {/* Navigation Footer */}
                            <div className="flex items-center justify-between p-4 border-t border-gray-800 bg-[#111111]">
                                {!isFirstTask() && getPreviousTaskInfo() && (
                                    <button
                                        onClick={goToPreviousTask}
                                        className="flex items-center px-4 py-2 text-sm rounded-md transition-colors text-white hover:bg-gray-800 cursor-pointer"
                                    >
                                        <ChevronLeft size={16} className="mr-1" />
                                        {getPreviousTaskInfo()?.title}
                                    </button>
                                )}
                                {isFirstTask() && <div></div>}

                                {!isLastTask() && getNextTaskInfo() && (
                                    <button
                                        onClick={goToNextTask}
                                        className="flex items-center px-4 py-2 text-sm rounded-md transition-colors text-white hover:bg-gray-800 cursor-pointer"
                                    >
                                        {getNextTaskInfo()?.title}
                                        <ChevronRight size={16} className="ml-1" />
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
} 