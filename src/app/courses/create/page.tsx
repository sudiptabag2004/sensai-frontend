"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronUp, ChevronDown, X, ChevronRight, ChevronDown as ChevronDownExpand, Plus, BookOpen, HelpCircle, Trash, Zap, Sparkles, Eye, Check, FileEdit } from "lucide-react";
import dynamic from "next/dynamic";
import { Block } from "@blocknote/core";

// Dynamically import the editor components
const DynamicLearningMaterialEditor = dynamic(
    () => import("../../../components/LearningMaterialEditor"),
    { ssr: false }
);

// Dynamically import the QuizEditor component
const DynamicQuizEditor = dynamic(
    () => import("../../../components/QuizEditor"),
    { ssr: false }
);

// Import the QuizQuestion type
import { QuizQuestion, QuizQuestionConfig } from "../../../components/QuizEditor";

// Define interfaces
interface LearningMaterial {
    id: string;
    title: string;
    position: number;
    type: 'material';
    content?: any[]; // Using any[] instead of Block[] to avoid type issues
}

interface Quiz {
    id: string;
    title: string;
    position: number;
    type: 'quiz';
    questions: QuizQuestion[];
}

type ModuleItem = LearningMaterial | Quiz;

interface Module {
    id: string;
    title: string;
    position: number;
    items: ModuleItem[];
    isExpanded: boolean;
}

// Default configuration for new questions
const defaultQuestionConfig: QuizQuestionConfig = {
    inputType: 'text',
    responseStyle: 'coach',
    evaluationCriteria: []
};

export default function CreateCourse() {
    const [courseTitle, setCourseTitle] = useState("");
    const [modules, setModules] = useState<Module[]>([]);
    const [activeItem, setActiveItem] = useState<ModuleItem | null>(null);
    const [activeModuleId, setActiveModuleId] = useState<string | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [isPreviewMode, setIsPreviewMode] = useState(false);
    const titleRef = useRef<HTMLHeadingElement>(null);
    const newModuleRef = useRef<string | null>(null);
    const newItemRef = useRef<string | null>(null);
    const dialogTitleRef = useRef<HTMLHeadingElement>(null);
    const dialogContentRef = useRef<HTMLDivElement>(null);

    // Check for dark mode
    useEffect(() => {
        setIsDarkMode(document.documentElement.classList.contains('dark'));

        // Optional: Listen for changes to the dark mode
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.attributeName === 'class') {
                    setIsDarkMode(document.documentElement.classList.contains('dark'));
                }
            });
        });

        observer.observe(document.documentElement, { attributes: true });

        return () => {
            observer.disconnect();
        };
    }, []);

    // Focus the title when the page loads
    useEffect(() => {
        if (titleRef.current) {
            titleRef.current.focus();
        }
    }, []);

    // Set initial content and focus on newly added modules and items
    useEffect(() => {
        // Focus the newly added module
        if (newModuleRef.current) {
            const moduleId = newModuleRef.current;
            const moduleElement = document.querySelector(`[data-module-id="${moduleId}"]`) as HTMLHeadingElement;

            if (moduleElement) {
                moduleElement.focus();
            }

            // Clear the ref after focusing
            newModuleRef.current = null;
        }

        // Focus the newly added item
        if (newItemRef.current) {
            const itemId = newItemRef.current;
            const itemElement = document.querySelector(`[data-item-id="${itemId}"]`) as HTMLHeadingElement;

            if (itemElement) {
                itemElement.focus();
            }

            // Clear the ref after focusing
            newItemRef.current = null;
        }
    }, [modules]);

    // Focus the dialog title when dialog opens and set initial content
    useEffect(() => {
        if (isDialogOpen && dialogTitleRef.current && activeItem) {
            // Set the initial content
            dialogTitleRef.current.textContent = activeItem.title;
            dialogTitleRef.current.focus();
        }
    }, [isDialogOpen, activeItem]);

    // Handle Escape key to close dialog
    useEffect(() => {
        const handleEscKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isDialogOpen) {
                closeDialog();
            }
        };

        window.addEventListener('keydown', handleEscKey);
        return () => {
            window.removeEventListener('keydown', handleEscKey);
        };
    }, [isDialogOpen]);

    const handleTitleChange = (e: React.FormEvent<HTMLHeadingElement>) => {
        setCourseTitle(e.currentTarget.textContent || "");
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLHeadingElement>) => {
        // Prevent creating a new line when pressing Enter
        if (e.key === "Enter") {
            e.preventDefault();
            (e.currentTarget as HTMLHeadingElement).blur();
        }
    };

    const addModule = () => {
        const newModule: Module = {
            id: `module-${Date.now()}`,
            title: "",
            position: modules.length,
            items: [],
            isExpanded: true
        };

        setModules([...modules, newModule]);
        newModuleRef.current = newModule.id;
    };

    const updateModuleTitle = (id: string, title: string) => {
        setModules(modules.map(module =>
            module.id === id ? { ...module, title } : module
        ));
    };

    const deleteModule = (id: string) => {
        setModules(prevModules => {
            const filteredModules = prevModules.filter(module => module.id !== id);
            // Update positions after deletion
            return filteredModules.map((module, index) => ({
                ...module,
                position: index
            }));
        });
    };

    const moveModuleUp = (id: string) => {
        setModules(prevModules => {
            const index = prevModules.findIndex(module => module.id === id);
            if (index <= 0) return prevModules;

            const newModules = [...prevModules];
            // Swap with previous module
            [newModules[index - 1], newModules[index]] = [newModules[index], newModules[index - 1]];

            // Update positions
            return newModules.map((module, idx) => ({
                ...module,
                position: idx
            }));
        });
    };

    const moveModuleDown = (id: string) => {
        setModules(prevModules => {
            const index = prevModules.findIndex(module => module.id === id);
            if (index === -1 || index === prevModules.length - 1) return prevModules;

            const newModules = [...prevModules];
            // Swap with next module
            [newModules[index], newModules[index + 1]] = [newModules[index + 1], newModules[index]];

            // Update positions
            return newModules.map((module, idx) => ({
                ...module,
                position: idx
            }));
        });
    };

    const toggleModule = (id: string) => {
        setModules(modules.map(module =>
            module.id === id ? { ...module, isExpanded: !module.isExpanded } : module
        ));
    };

    const addLearningMaterial = (moduleId: string) => {
        setModules(modules.map(module => {
            if (module.id === moduleId) {
                const newItem: LearningMaterial = {
                    id: `material-${Date.now()}`,
                    title: "",
                    position: module.items.length,
                    type: 'material',
                    content: [] // Empty content, the editor will initialize with default content
                };

                newItemRef.current = newItem.id;

                return {
                    ...module,
                    items: [...module.items, newItem]
                };
            }
            return module;
        }));
    };

    const addQuiz = (moduleId: string) => {
        setModules(modules.map(module => {
            if (module.id === moduleId) {
                const newItem: Quiz = {
                    id: `quiz-${Date.now()}`,
                    title: "",
                    position: module.items.length,
                    type: 'quiz',
                    questions: [{
                        id: `question-${Date.now()}`,
                        content: [],
                        config: { ...defaultQuestionConfig }
                    }]
                };

                newItemRef.current = newItem.id;

                return {
                    ...module,
                    items: [...module.items, newItem]
                };
            }
            return module;
        }));
    };

    const updateItemTitle = (moduleId: string, itemId: string, title: string) => {
        setModules(modules.map(module => {
            if (module.id === moduleId) {
                return {
                    ...module,
                    items: module.items.map(item =>
                        item.id === itemId ? { ...item, title } : item
                    )
                };
            }
            return module;
        }));

        // Also update active item title if it's currently being edited
        if (activeItem && activeItem.id === itemId) {
            setActiveItem({
                ...activeItem,
                title
            });
        }
    };

    const updateItemContent = (moduleId: string, itemId: string, content: any[]) => {
        setModules(modules.map(module => {
            if (module.id === moduleId) {
                return {
                    ...module,
                    items: module.items.map(item =>
                        item.id === itemId ? {
                            ...item,
                            content: item.type === 'material' ? content : undefined,
                            questions: item.type === 'quiz' ? (item as Quiz).questions : undefined
                        } : item
                    )
                };
            }
            return module;
        }));

        // Also update active item content if it's currently being edited
        if (activeItem && activeItem.id === itemId && activeItem.type === 'material') {
            setActiveItem({
                ...activeItem,
                content
            } as LearningMaterial);
        }
    };

    const deleteItem = (moduleId: string, itemId: string) => {
        setModules(modules.map(module => {
            if (module.id === moduleId) {
                const filteredItems = module.items.filter(item => item.id !== itemId);
                return {
                    ...module,
                    items: filteredItems.map((item, index) => ({
                        ...item,
                        position: index
                    }))
                };
            }
            return module;
        }));
    };

    const moveItemUp = (moduleId: string, itemId: string) => {
        setModules(modules.map(module => {
            if (module.id === moduleId) {
                const index = module.items.findIndex(item => item.id === itemId);
                if (index <= 0) return module;

                const newItems = [...module.items];
                [newItems[index - 1], newItems[index]] = [newItems[index], newItems[index - 1]];

                return {
                    ...module,
                    items: newItems.map((item, idx) => ({
                        ...item,
                        position: idx
                    }))
                };
            }
            return module;
        }));
    };

    const moveItemDown = (moduleId: string, itemId: string) => {
        setModules(modules.map(module => {
            if (module.id === moduleId) {
                const index = module.items.findIndex(item => item.id === itemId);
                if (index === -1 || index === module.items.length - 1) return module;

                const newItems = [...module.items];
                [newItems[index], newItems[index + 1]] = [newItems[index + 1], newItems[index]];

                return {
                    ...module,
                    items: newItems.map((item, idx) => ({
                        ...item,
                        position: idx
                    }))
                };
            }
            return module;
        }));
    };

    // Handle click on module header area to toggle expansion
    const handleModuleClick = (e: React.MouseEvent, moduleId: string) => {
        // Prevent toggling if clicking on buttons or editable title
        if (
            (e.target as HTMLElement).tagName === 'BUTTON' ||
            (e.target as HTMLElement).closest('button') ||
            (e.target as HTMLElement).getAttribute('contenteditable') === 'true'
        ) {
            return;
        }

        toggleModule(moduleId);
    };

    // Open the dialog for editing a learning material or quiz
    const openItemDialog = (moduleId: string, itemId: string) => {
        const module = modules.find(m => m.id === moduleId);
        if (!module) return;

        const item = module.items.find(i => i.id === itemId);
        if (!item) return;

        // Ensure quiz items have questions property initialized
        if (item.type === 'quiz' && !item.questions) {
            const updatedItem = {
                ...item,
                questions: [{ id: `question-${Date.now()}`, content: [], config: { ...defaultQuestionConfig } }]
            } as Quiz;

            // Update the module with the fixed item
            setModules(prevModules =>
                prevModules.map(m =>
                    m.id === moduleId
                        ? {
                            ...m,
                            items: m.items.map(i => i.id === itemId ? updatedItem : i)
                        }
                        : m
                ) as Module[]
            );

            setActiveItem(updatedItem);
        } else {
            setActiveItem(item);
        }

        setActiveModuleId(moduleId);
        setIsPreviewMode(false);
        setIsDialogOpen(true);
    };

    // Close the dialog
    const closeDialog = () => {
        setIsDialogOpen(false);
        setActiveItem(null);
        setActiveModuleId(null);
    };

    // Update the title of the active item in the dialog
    const handleDialogTitleChange = (e: React.FormEvent<HTMLHeadingElement>) => {
        if (!activeItem || !activeModuleId) return;

        const newTitle = e.currentTarget.textContent || "";
        updateItemTitle(activeModuleId, activeItem.id, newTitle);
    };

    // Handle click outside dialog to close it
    const handleDialogBackdropClick = (e: React.MouseEvent) => {
        // Only close if clicking directly on the backdrop, not on the dialog content
        if (dialogContentRef.current && !dialogContentRef.current.contains(e.target as Node)) {
            closeDialog();
        }
    };

    // Handle content change from the editor
    const handleEditorContentChange = (content: any[]) => {
        if (activeItem && activeModuleId && activeItem.type === 'material') {
            updateItemContent(activeModuleId, activeItem.id, content);
        }
    };

    // Handle quiz content changes
    const handleQuizContentChange = (questions: QuizQuestion[]) => {
        if (activeItem && activeModuleId && activeItem.type === 'quiz') {
            updateQuizQuestions(activeModuleId, activeItem.id, questions);
        }
    };

    // Add a function to update quiz questions
    const updateQuizQuestions = (moduleId: string, itemId: string, questions: QuizQuestion[]) => {
        setModules(prevModules =>
            prevModules.map(module => {
                if (module.id === moduleId) {
                    return {
                        ...module,
                        items: module.items.map(item => {
                            if (item.id === itemId && item.type === 'quiz') {
                                return {
                                    ...item,
                                    questions
                                } as Quiz;
                            }
                            return item;
                        })
                    };
                }
                return module;
            })
        );
    };

    const openDialog = (item: ModuleItem) => {
        // Ensure we're in edit mode when opening any item
        setIsPreviewMode(false);
        setActiveItem(item);
        setIsDialogOpen(true);
    }

    return (
        <div className="min-h-screen bg-white dark:bg-black px-8 py-12">
            <div className="max-w-5xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <h1
                        ref={titleRef}
                        contentEditable
                        suppressContentEditableWarning
                        onInput={handleTitleChange}
                        onKeyDown={handleKeyDown}
                        className="text-4xl font-light text-black dark:text-white outline-none empty:before:content-[attr(data-placeholder)] empty:before:text-gray-400 empty:before:pointer-events-none w-2/3"
                        data-placeholder="New Course"
                    />

                    <div className="flex items-center space-x-3 ml-auto">
                        <button
                            className="flex items-center px-6 py-2 text-sm font-medium text-white bg-transparent border border-[#1C68E4] hover:bg-[#222222] rounded-md transition-all cursor-pointer w-32 shadow-md"
                            onClick={() => {
                                // Generate with AI action
                                console.log('Generate with AI');
                            }}
                        >
                            <span className="mr-2 text-base">✨</span>
                            <span className="drop-shadow-[0_1px_1px_rgba(0,0,0,0.5)]">Generate</span>
                        </button>

                        <button
                            className="flex items-center px-4 py-2 text-sm font-medium text-white bg-transparent border border-[#EF4444] hover:bg-[#222222] rounded-md transition-all cursor-pointer shadow-md"
                            onClick={() => {
                                // Preview action
                                console.log('Preview course');
                            }}
                        >
                            <span className="mr-2 text-base">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                    <circle cx="12" cy="12" r="3"></circle>
                                </svg>
                            </span>
                            <span className="drop-shadow-[0_1px_1px_rgba(0,0,0,0.5)]">Preview</span>
                        </button>

                        <button
                            className="flex items-center px-4 py-2 text-sm font-medium text-white bg-transparent border border-[#016037] hover:bg-[#222222] rounded-md transition-all cursor-pointer shadow-md"
                            onClick={() => {
                                // Publish action
                                console.log('Publish course');
                            }}
                        >
                            <span className="mr-2 text-base">🚀</span>
                            <span className="drop-shadow-[0_1px_1px_rgba(0,0,0,0.5)]">Publish</span>
                        </button>
                    </div>
                </div>

                <button
                    onClick={addModule}
                    className="mb-6 px-6 py-2 bg-black dark:bg-white text-white dark:text-black text-sm font-medium rounded-full hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 dark:focus:ring-gray-100 cursor-pointer"
                >
                    Add Module
                </button>

                <div className="space-y-4">
                    {modules.map((module, index) => (
                        <div
                            key={module.id}
                            className="border border-gray-200 dark:border-gray-800 rounded-lg hover:border-gray-300 dark:hover:border-gray-700 transition-colors"
                        >
                            <div
                                className="flex items-center group p-4 cursor-pointer"
                                onClick={(e) => handleModuleClick(e, module.id)}
                            >
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        toggleModule(module.id);
                                    }}
                                    className="mr-2 text-gray-400 hover:text-black dark:hover:text-white transition-colors"
                                    aria-label={module.isExpanded ? "Collapse module" : "Expand module"}
                                >
                                    {module.isExpanded ? <ChevronDownExpand size={18} /> : <ChevronRight size={18} />}
                                </button>
                                <div className="flex-1">
                                    <h2
                                        contentEditable
                                        suppressContentEditableWarning
                                        onInput={(e) => updateModuleTitle(module.id, e.currentTarget.textContent || "")}
                                        onKeyDown={handleKeyDown}
                                        className="text-xl font-light text-black dark:text-white outline-none empty:before:content-[attr(data-placeholder)] empty:before:text-gray-400 empty:before:pointer-events-none"
                                        data-module-id={module.id}
                                        data-placeholder="New Module"
                                        onClick={(e) => e.stopPropagation()}
                                    />
                                </div>
                                <div className="flex items-center space-x-2">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            moveModuleUp(module.id);
                                        }}
                                        disabled={index === 0}
                                        className="p-1 text-gray-400 hover:text-black dark:hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                        aria-label="Move module up"
                                    >
                                        <ChevronUp size={18} />
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            moveModuleDown(module.id);
                                        }}
                                        disabled={index === modules.length - 1}
                                        className="p-1 text-gray-400 hover:text-black dark:hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                        aria-label="Move module down"
                                    >
                                        <ChevronDown size={18} />
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            deleteModule(module.id);
                                        }}
                                        className="p-1 text-gray-400 hover:text-black dark:hover:text-white transition-colors"
                                        aria-label="Delete module"
                                    >
                                        <X size={18} />
                                    </button>
                                </div>
                            </div>

                            {module.isExpanded && (
                                <div className="px-4 pb-4 pt-0">
                                    <div className="pl-6 border-l border-gray-200 dark:border-gray-800 ml-2 space-y-3">
                                        {module.items.map((item, itemIndex) => (
                                            <div
                                                key={item.id}
                                                className="flex items-center group hover:bg-gray-50 dark:hover:bg-gray-900 p-2 rounded-md cursor-pointer transition-colors"
                                                onClick={() => openItemDialog(module.id, item.id)}
                                                style={{
                                                    "--hover-bg-color": "#2A2A2A"
                                                } as React.CSSProperties}
                                                onMouseOver={(e) => {
                                                    (e.currentTarget as HTMLElement).style.backgroundColor = "#2A2A2A";
                                                }}
                                                onMouseOut={(e) => {
                                                    (e.currentTarget as HTMLElement).style.backgroundColor = "";
                                                }}
                                            >
                                                <div className="mr-2 text-gray-400">
                                                    {item.type === 'material' ? <BookOpen size={16} /> : <HelpCircle size={16} />}
                                                </div>
                                                <div className="flex-1">
                                                    <div className="text-base font-light text-black dark:text-white outline-none empty:before:content-[attr(data-placeholder)] empty:before:text-gray-400 empty:before:pointer-events-none">
                                                        {item.title || (item.type === 'material' ? "New Learning Material" : "New Quiz")}
                                                    </div>
                                                </div>
                                                <div className="flex items-center space-x-2" onClick={(e) => e.stopPropagation()}>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            moveItemUp(module.id, item.id);
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
                                                            moveItemDown(module.id, item.id);
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
                                                            deleteItem(module.id, item.id);
                                                        }}
                                                        className="p-1 text-gray-400 hover:text-white transition-colors cursor-pointer"
                                                        aria-label="Delete item"
                                                    >
                                                        <Trash size={16} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}

                                        <div className="flex space-x-2 mt-4">
                                            <button
                                                onClick={() => addLearningMaterial(module.id)}
                                                className="flex items-center px-3 py-1.5 text-sm text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white border border-gray-200 dark:border-gray-800 rounded-full transition-colors cursor-pointer"
                                            >
                                                <Plus size={14} className="mr-1" />
                                                Learning Material
                                            </button>
                                            <button
                                                onClick={() => addQuiz(module.id)}
                                                className="flex items-center px-3 py-1.5 text-sm text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white border border-gray-200 dark:border-gray-800 rounded-full transition-colors cursor-pointer"
                                            >
                                                <Plus size={14} className="mr-1" />
                                                Quiz
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Learning Material/Quiz Dialog */}
            {isDialogOpen && activeItem && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                    onClick={handleDialogBackdropClick}
                >
                    <div
                        ref={dialogContentRef}
                        style={{
                            backgroundColor: '#1A1A1A',
                            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                            borderColor: '#1A1A1A',
                            border: '1px solid #1A1A1A'
                        }}
                        className="w-full max-w-6xl h-[90vh] rounded-lg shadow-2xl flex flex-col transform transition-all duration-300 ease-in-out scale-100 translate-y-0"
                    >
                        {/* Dialog Header */}
                        <div
                            className="flex items-center justify-end p-4 cursor-pointer"
                            style={{ backgroundColor: '#111111' }}
                            onClick={() => {
                                // Focus the title element when header is clicked
                                if (dialogTitleRef.current && !isPreviewMode) {
                                    dialogTitleRef.current.contentEditable = "true";
                                    dialogTitleRef.current.focus();
                                }
                            }}
                        >
                            <h2
                                ref={dialogTitleRef}
                                contentEditable={false}
                                suppressContentEditableWarning
                                className={`text-2xl font-light text-white outline-none empty:before:content-[attr(data-placeholder)] empty:before:text-gray-400 empty:before:pointer-events-none ${!isPreviewMode ? 'cursor-text' : ''} flex-1`}
                                data-placeholder={activeItem.type === 'material' ? "New Learning Material" : "New Quiz"}
                                onBlur={(e) => {
                                    if (!isPreviewMode) {
                                        e.currentTarget.contentEditable = "false";
                                        handleDialogTitleChange(e);
                                    }
                                }}
                            >
                                {activeItem.title || (activeItem.type === 'material' ? "New Learning Material" : "New Quiz")}
                            </h2>
                            <div
                                className="flex items-center space-x-2"
                                onClick={(e) => e.stopPropagation()}
                            >
                                {activeItem.type === 'quiz' && (
                                    <button
                                        onClick={() => {
                                            setIsPreviewMode(!isPreviewMode);
                                        }}
                                        className={`flex items-center px-4 py-2 text-sm text-white bg-transparent border border-blue-500 hover:bg-[#222222] rounded-full transition-colors cursor-pointer`}
                                        aria-label={isPreviewMode ? "Edit quiz" : "Preview quiz"}
                                    >
                                        {isPreviewMode ? (
                                            <>
                                                <FileEdit size={16} className="mr-2" />
                                                Edit Mode
                                            </>
                                        ) : (
                                            <>
                                                <Zap size={16} className="mr-2" />
                                                Preview Mode
                                            </>
                                        )}
                                    </button>
                                )}
                                <button
                                    onClick={closeDialog}
                                    className="p-1 text-gray-400 hover:text-white transition-colors cursor-pointer"
                                    aria-label="Close dialog"
                                >
                                    <X size={24} />
                                </button>
                            </div>
                        </div>

                        {/* Dialog Content */}
                        <div className={`flex flex-1 overflow-hidden p-6 ${isPreviewMode ? 'pt-6' : 'pt-4'}`} style={{ backgroundColor: '#1A1A1A' }}>
                            {activeItem?.type === 'material' ? (
                                /* Full width editor for learning material */
                                <div className="w-full overflow-auto mt-4" style={{ backgroundColor: '#1A1A1A' }}>
                                    <DynamicLearningMaterialEditor
                                        initialContent={activeItem.content}
                                        onChange={handleEditorContentChange}
                                        isDarkMode={true}
                                    />
                                </div>
                            ) : activeItem?.type === 'quiz' ? (
                                /* Quiz editor with split screen layout */
                                <div className="w-full overflow-auto" style={{ backgroundColor: '#1A1A1A' }}>
                                    <DynamicQuizEditor
                                        initialQuestions={activeItem.questions || []}
                                        onChange={handleQuizContentChange}
                                        isDarkMode={true}
                                        isPreviewMode={isPreviewMode}
                                    />
                                </div>
                            ) : null}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
} 