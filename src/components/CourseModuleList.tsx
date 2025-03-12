import { useState } from "react";
import { ChevronUp, ChevronDown, ChevronRight, ChevronDown as ChevronDownExpand, Plus, BookOpen, HelpCircle, Trash, Clipboard } from "lucide-react";
import { Module, ModuleItem } from "@/types/course";
import { QuizQuestion } from "@/components/QuizEditor"; // Import needed types directly

// Use the local Module and ModuleItem types to match the page component exactly
export interface Quiz {
    id: string;
    title: string;
    position: number;
    type: 'quiz';
    questions: QuizQuestion[];
    status?: string;
}

export interface Exam {
    id: string;
    title: string;
    position: number;
    type: 'exam';
    questions: QuizQuestion[];
    status?: string;
}

export interface LearningMaterial {
    id: string;
    title: string;
    position: number;
    type: 'material';
    content?: any[];
    status?: string;
}

export type LocalModuleItem = LearningMaterial | Quiz | Exam;

export interface LocalModule {
    id: string;
    title: string;
    position: number;
    items: LocalModuleItem[];
    isExpanded?: boolean;
    backgroundColor?: string;
    isEditing?: boolean;
}

interface CourseModuleListProps {
    modules: LocalModule[];
    mode: 'edit' | 'view'; // 'edit' for teacher editing, 'view' for learner viewing
    onToggleModule?: (moduleId: string) => void;
    onOpenItem?: (moduleId: string, itemId: string) => void;
    onMoveItemUp?: (moduleId: string, itemId: string) => void;
    onMoveItemDown?: (moduleId: string, itemId: string) => void;
    onDeleteItem?: (moduleId: string, itemId: string) => void;
    onAddLearningMaterial?: (moduleId: string) => Promise<void>;
    onAddQuiz?: (moduleId: string) => Promise<void>;
    onAddExam?: (moduleId: string) => Promise<void>;
    onMoveModuleUp?: (moduleId: string) => void;
    onMoveModuleDown?: (moduleId: string) => void;
    onDeleteModule?: (moduleId: string) => void;
    onEditModuleTitle?: (moduleId: string) => void;
    expandedModules?: Record<string, boolean>; // For learner view
}

export default function CourseModuleList({
    modules,
    mode,
    onToggleModule,
    onOpenItem,
    onMoveItemUp,
    onMoveItemDown,
    onDeleteItem,
    onAddLearningMaterial,
    onAddQuiz,
    onAddExam,
    onMoveModuleUp,
    onMoveModuleDown,
    onDeleteModule,
    onEditModuleTitle,
    expandedModules = {}
}: CourseModuleListProps) {
    // For editor mode where we need to keep track of expanded modules internally
    const [internalExpandedModules, setInternalExpandedModules] = useState<Record<string, boolean>>({});

    // Get the appropriate expanded state based on mode
    const getIsExpanded = (moduleId: string) => {
        if (mode === 'edit') {
            return modules.find(m => m.id === moduleId)?.isExpanded || false;
        } else {
            return expandedModules[moduleId] || false;
        }
    };

    // Handle module click based on mode
    const handleModuleClick = (e: React.MouseEvent, moduleId: string) => {
        // Find the module
        const module = modules.find(m => m.id === moduleId);
        if (!module) return;

        // If in edit mode and module is in editing mode, don't toggle expansion
        if (mode === 'edit' && module.isEditing) {
            return;
        }

        // Prevent toggling if clicking on buttons
        if (
            (e.target as HTMLElement).tagName === 'BUTTON' ||
            (e.target as HTMLElement).closest('button')
        ) {
            return;
        }

        if (onToggleModule) {
            onToggleModule(moduleId);
        } else {
            // If no handler provided, handle internally
            setInternalExpandedModules(prev => ({
                ...prev,
                [moduleId]: !prev[moduleId]
            }));
        }
    };

    return (
        <div className="space-y-2">
            {modules.map((module, index) => (
                <div
                    key={module.id}
                    className="border border-gray-200 dark:border-gray-800 rounded-lg hover:border-gray-300 dark:hover:border-gray-700 transition-colors"
                    style={{ backgroundColor: module.backgroundColor }}
                >
                    <div
                        className="flex items-center group p-4 cursor-pointer"
                        onClick={(e) => handleModuleClick(e, module.id)}
                    >
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                if (onToggleModule) {
                                    onToggleModule(module.id);
                                } else {
                                    setInternalExpandedModules(prev => ({
                                        ...prev,
                                        [module.id]: !prev[module.id]
                                    }));
                                }
                            }}
                            className="mr-2 text-gray-400 hover:text-black dark:hover:text-white transition-colors cursor-pointer"
                            aria-label={getIsExpanded(module.id) ? "Collapse module" : "Expand module"}
                        >
                            {getIsExpanded(module.id) ? <ChevronDownExpand size={18} /> : <ChevronRight size={18} />}
                        </button>
                        <div className="flex-1 mr-4">
                            {mode === 'edit' && module.isEditing ? (
                                <h2
                                    contentEditable
                                    suppressContentEditableWarning
                                    className="text-xl font-light text-black dark:text-white outline-none empty:before:content-[attr(data-placeholder)] empty:before:text-gray-400 empty:before:pointer-events-none"
                                    data-module-id={module.id}
                                    data-placeholder="New Module"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    {module.title}
                                </h2>
                            ) : (
                                <h2
                                    className="text-xl font-light text-black dark:text-white cursor-pointer"
                                >
                                    {module.title || "New Module"}
                                </h2>
                            )}
                        </div>

                        {/* Module action buttons - only in edit mode */}
                        {mode === 'edit' && (
                            <div className="flex items-center space-x-2">
                                {module.isEditing ? (
                                    <>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                // Handle save module title
                                            }}
                                            className="px-3 py-1 text-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md transition-colors cursor-pointer flex items-center"
                                            aria-label="Save module title"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                                                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                                                <polyline points="17 21 17 13 7 13 7 21"></polyline>
                                                <polyline points="7 3 7 8 15 8"></polyline>
                                            </svg>
                                            Save
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                // Handle cancel module title edit
                                            }}
                                            className="px-3 py-1 text-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md transition-colors cursor-pointer flex items-center"
                                            aria-label="Cancel editing"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                                <line x1="6" y1="6" x2="18" y2="18"></line>
                                            </svg>
                                            Cancel
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (onEditModuleTitle) {
                                                    onEditModuleTitle(module.id);
                                                }
                                            }}
                                            className="px-3 py-1 text-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md transition-colors cursor-pointer flex items-center"
                                            aria-label="Edit module title"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                            </svg>
                                            Edit
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (onMoveModuleUp) {
                                                    onMoveModuleUp(module.id);
                                                }
                                            }}
                                            disabled={index === 0}
                                            className="p-1 text-gray-400 hover:text-black dark:hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                                            aria-label="Move module up"
                                        >
                                            <ChevronUp size={18} />
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (onMoveModuleDown) {
                                                    onMoveModuleDown(module.id);
                                                }
                                            }}
                                            disabled={index === modules.length - 1}
                                            className="p-1 text-gray-400 hover:text-black dark:hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                                            aria-label="Move module down"
                                        >
                                            <ChevronDown size={18} />
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (onDeleteModule) {
                                                    onDeleteModule(module.id);
                                                }
                                            }}
                                            className="p-1 text-gray-400 hover:text-black dark:hover:text-white transition-colors cursor-pointer"
                                            aria-label="Delete module"
                                        >
                                            <Trash size={18} />
                                        </button>
                                    </>
                                )}
                            </div>
                        )}
                    </div>

                    {getIsExpanded(module.id) && (
                        <div className="px-4 pb-4 pt-0">
                            <div className="pl-6 border-l border-gray-200 dark:border-gray-800 ml-2 space-y-2">
                                {module.items.map((item, itemIndex) => (
                                    <div
                                        key={item.id}
                                        className="flex items-center group hover:bg-gray-50 dark:hover:bg-gray-900 p-2 rounded-md cursor-pointer transition-colors relative mt-2"
                                        onClick={() => onOpenItem && onOpenItem(module.id, item.id)}
                                        style={{
                                            "--hover-bg-color": "#2A2A2A"
                                        } as React.CSSProperties}
                                    >
                                        <div className="flex items-center mr-2 text-gray-400">
                                            {item.type === 'material' ? <BookOpen size={16} /> :
                                                item.type === 'quiz' ? <HelpCircle size={16} /> :
                                                    <Clipboard size={16} />}
                                        </div>
                                        <div className="flex-1">
                                            <div className="text-base font-light text-black dark:text-white outline-none empty:before:content-[attr(data-placeholder)] empty:before:text-gray-400 empty:before:pointer-events-none">
                                                {item.title || (item.type === 'material' ? "New Learning Material" : item.type === 'quiz' ? "New Quiz" : "New Exam")}
                                            </div>
                                        </div>

                                        {/* Item action buttons - only in edit mode */}
                                        {mode === 'edit' && (
                                            <div className="flex items-center space-x-2" onClick={(e) => e.stopPropagation()}>
                                                {item.status === 'draft' && (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-red-500 text-white mr-2">
                                                        DRAFT
                                                    </span>
                                                )}
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        if (onMoveItemUp) {
                                                            onMoveItemUp(module.id, item.id);
                                                        }
                                                    }}
                                                    disabled={itemIndex === 0}
                                                    className="p-1 text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                                                    aria-label="Move item up"
                                                >
                                                    <ChevronUp size={16} />
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        if (onMoveItemDown) {
                                                            onMoveItemDown(module.id, item.id);
                                                        }
                                                    }}
                                                    disabled={itemIndex === module.items.length - 1}
                                                    className="p-1 text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                                                    aria-label="Move item down"
                                                >
                                                    <ChevronDown size={16} />
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        if (onDeleteItem) {
                                                            onDeleteItem(module.id, item.id);
                                                        }
                                                    }}
                                                    className="p-1 text-gray-400 hover:text-white transition-colors cursor-pointer"
                                                    aria-label="Delete item"
                                                >
                                                    <Trash size={16} />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ))}

                                {/* Add item buttons - only in edit mode */}
                                {mode === 'edit' && (
                                    <div className="flex space-x-2 mt-4">
                                        <button
                                            onClick={async () => {
                                                if (onAddLearningMaterial) {
                                                    try {
                                                        await onAddLearningMaterial(module.id);
                                                    } catch (error) {
                                                        console.error("Failed to add learning material:", error);
                                                    }
                                                }
                                            }}
                                            className="flex items-center px-3 py-1.5 text-sm text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white border border-gray-200 dark:border-gray-800 rounded-full transition-colors cursor-pointer"
                                        >
                                            <Plus size={14} className="mr-1" />
                                            Learning Material
                                        </button>
                                        <button
                                            onClick={async () => {
                                                if (onAddQuiz) {
                                                    try {
                                                        await onAddQuiz(module.id);
                                                    } catch (error) {
                                                        console.error("Failed to add quiz:", error);
                                                    }
                                                }
                                            }}
                                            className="flex items-center px-3 py-1.5 text-sm text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white border border-gray-200 dark:border-gray-800 rounded-full transition-colors cursor-pointer"
                                        >
                                            <Plus size={14} className="mr-1" />
                                            Quiz
                                        </button>
                                        <button
                                            onClick={async () => {
                                                if (onAddExam) {
                                                    try {
                                                        await onAddExam(module.id);
                                                    } catch (error) {
                                                        console.error("Failed to add exam:", error);
                                                    }
                                                }
                                            }}
                                            className="flex items-center px-3 py-1.5 text-sm text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white border border-gray-200 dark:border-gray-800 rounded-full transition-colors cursor-pointer"
                                        >
                                            <Plus size={14} className="mr-1" />
                                            Exam
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
} 