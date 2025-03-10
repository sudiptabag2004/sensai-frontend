"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronUp, ChevronDown, X, ChevronRight, ChevronDown as ChevronDownExpand, Plus, BookOpen, HelpCircle, ArrowLeft, Edit, Save, Eye, FileEdit, Zap } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Header } from "@/components/layout/header";

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
    questions: any[]; // Simplified for now
}

type ModuleItem = LearningMaterial | Quiz;

interface Module {
    id: string;
    title: string;
    position: number;
    items: ModuleItem[];
    isExpanded: boolean;
}

interface Course {
    id: number;
    title: string;
    description?: string;
    modules: Module[];
}

export default function ClientCourseView({ id }: { id: string }) {
    const [course, setCourse] = useState<Course | null>(null);
    const [modules, setModules] = useState<Module[]>([]);
    const [loading, setLoading] = useState(true);
    const [isEditMode] = useState(true); // Always in edit mode, not toggleable
    const [schoolId, setSchoolId] = useState<string>("1"); // Default to 1 if not found

    // Dialog state
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [activeItem, setActiveItem] = useState<ModuleItem | null>(null);
    const [activeModuleId, setActiveModuleId] = useState<string | null>(null);
    const [isPreviewMode, setIsPreviewMode] = useState(false);
    const dialogTitleRef = useRef<HTMLHeadingElement>(null);
    const dialogContentRef = useRef<HTMLDivElement>(null);

    // Save course changes
    const saveCourse = () => {
        // In a real app, this would call an API to save the course
        console.log("Saving course...", { course, modules });
        // Update the course with the current modules
        if (course) {
            setCourse({
                ...course,
                modules: modules
            });
        }
    };

    // Fetch course data and init other state
    useEffect(() => {
        // Get school ID from localStorage if available
        const storedSchoolId = localStorage.getItem("schoolId");
        if (storedSchoolId) {
            setSchoolId(storedSchoolId);
        }

        // Simulate API call to fetch course data
        const fetchCourse = async () => {
            setLoading(true);
            try {
                // In a real app, this would be an API call
                // For now, we'll use mock data based on the course ID
                const mockCourse: Course = {
                    id: parseInt(id),
                    title: id === "1" ? "Introduction to AI" :
                        id === "2" ? "Web Development Fundamentals" :
                            `Course ${id}`,

                    modules: [
                        {
                            id: `module-1-${id}`,
                            title: "Getting Started",
                            position: 0,
                            isExpanded: true,
                            items: [
                                {
                                    id: `material-1-${id}`,
                                    title: "Introduction",
                                    position: 0,
                                    type: 'material',
                                    content: []
                                },
                                {
                                    id: `quiz-1-${id}`,
                                    title: "Knowledge Check",
                                    position: 1,
                                    type: 'quiz',
                                    questions: []
                                }
                            ]
                        },
                        {
                            id: `module-2-${id}`,
                            title: "Core Concepts",
                            position: 1,
                            isExpanded: false,
                            items: [
                                {
                                    id: `material-2-${id}`,
                                    title: "Key Principles",
                                    position: 0,
                                    type: 'material',
                                    content: []
                                },
                                {
                                    id: `material-3-${id}`,
                                    title: "Practical Examples",
                                    position: 1,
                                    type: 'material',
                                    content: []
                                }
                            ]
                        },
                        {
                            id: `module-3-${id}`,
                            title: "Advanced Topics",
                            position: 2,
                            isExpanded: false,
                            items: [
                                {
                                    id: `material-4-${id}`,
                                    title: "Advanced Techniques",
                                    position: 0,
                                    type: 'material',
                                    content: []
                                },
                                {
                                    id: `quiz-2-${id}`,
                                    title: "Final Assessment",
                                    position: 1,
                                    type: 'quiz',
                                    questions: []
                                }
                            ]
                        }
                    ]
                };

                setCourse(mockCourse);
                setModules(mockCourse.modules);
                setLoading(false);
            } catch (error) {
                console.error("Error fetching course:", error);
                setLoading(false);
            }
        };

        fetchCourse();
    }, [id]);

    // Open the dialog for viewing or editing a learning material or quiz
    const openItemDialog = (moduleId: string, itemId: string) => {
        const module = modules.find(m => m.id === moduleId);
        if (!module) return;

        const item = module.items.find(i => i.id === itemId);
        if (!item) return;

        // Ensure quiz items have questions property initialized
        if (item.type === 'quiz' && (!item.questions || item.questions.length === 0)) {
            const updatedItem = {
                ...item,
                questions: [] // Initialize with empty array
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
                )
            );

            setActiveItem(updatedItem);
        } else {
            setActiveItem(item);
        }

        setActiveModuleId(moduleId);
        setIsPreviewMode(!isEditMode); // Default to preview mode if not in edit mode
        setIsDialogOpen(true);
    };

    // Close the dialog
    const closeDialog = () => {
        setIsDialogOpen(false);
        setActiveItem(null);
        setActiveModuleId(null);
    };

    // Handle dialog backdrop click
    const handleDialogBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            closeDialog();
        }
    };

    // Update the title of the active item in the dialog
    const handleDialogTitleChange = (e: React.FormEvent<HTMLHeadingElement>) => {
        if (!activeItem || !activeModuleId) return;

        const newTitle = e.currentTarget.textContent || "";

        // Update the modules state with the new title
        setModules(prevModules =>
            prevModules.map(module =>
                module.id === activeModuleId
                    ? {
                        ...module,
                        items: module.items.map(item =>
                            item.id === activeItem.id
                                ? { ...item, title: newTitle }
                                : item
                        )
                    }
                    : module
            )
        );

        // Also update the active item
        setActiveItem({ ...activeItem, title: newTitle });
    };

    const toggleModule = (id: string) => {
        setModules(modules.map(module =>
            module.id === id ? { ...module, isExpanded: !module.isExpanded } : module
        ));
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

    // Add a new module
    const addModule = () => {
        const newModule: Module = {
            id: `module-${Date.now()}`,
            title: "New Module",
            position: modules.length,
            isExpanded: true,
            items: []
        };

        setModules([...modules, newModule]);
    };

    return (
        <div className="min-h-screen bg-black text-white">
            {/* Use the reusable Header component */}
            <Header />

            {/* Main content */}
            <div className="px-8 pt-6 pb-12">
                <div className="max-w-5xl mx-auto">
                    {/* Back button */}
                    <Link href={`/schools/${schoolId}`} className="inline-flex items-center text-gray-400 hover:text-white mb-6">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back To Courses
                    </Link>

                    {/* Course content */}
                    {loading ? (
                        <div className="flex justify-center items-center h-64">
                            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
                        </div>
                    ) : course ? (
                        <>
                            {/* Course header with title and actions */}
                            <div className="flex items-center justify-between mb-4">
                                <h1 className="text-4xl font-light">{course.title}</h1>

                                <div className="flex items-center space-x-3">
                                    <button
                                        className="flex items-center px-4 py-2 text-sm font-medium text-white bg-transparent border border-[#EF4444] hover:bg-gray-800 rounded-md transition-all cursor-pointer"
                                        onClick={() => {
                                            // Preview action
                                            console.log('Preview course');
                                        }}
                                    >
                                        <Eye className="w-4 h-4 mr-2" />
                                        Preview
                                    </button>
                                </div>
                            </div>

                            {/* Modules section */}
                            <div className="mt-8">
                                {modules.map((module, index) => (
                                    <div
                                        key={module.id}
                                        className="border border-gray-800 rounded-lg hover:border-gray-700 transition-colors"
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
                                                className="mr-2 text-gray-400 hover:text-white transition-colors"
                                                aria-label={module.isExpanded ? "Collapse module" : "Expand module"}
                                            >
                                                {module.isExpanded ? <ChevronDownExpand size={18} /> : <ChevronRight size={18} />}
                                            </button>
                                            <div className="flex-1">
                                                <h2 className="text-xl font-light text-white">
                                                    {module.title}
                                                </h2>
                                            </div>
                                            {isEditMode && (
                                                <div className="flex items-center space-x-2">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            // Move module up logic would go here
                                                        }}
                                                        disabled={index === 0}
                                                        className="p-1 text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                                        aria-label="Move module up"
                                                    >
                                                        <ChevronUp size={18} />
                                                    </button>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            // Move module down logic would go here
                                                        }}
                                                        disabled={index === modules.length - 1}
                                                        className="p-1 text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                                        aria-label="Move module down"
                                                    >
                                                        <ChevronDown size={18} />
                                                    </button>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            // Delete module logic would go here
                                                        }}
                                                        className="p-1 text-gray-400 hover:text-white transition-colors"
                                                        aria-label="Delete module"
                                                    >
                                                        <X size={18} />
                                                    </button>
                                                </div>
                                            )}
                                        </div>

                                        {module.isExpanded && (
                                            <div className="px-4 pb-4 pt-0">
                                                <div className="pl-6 border-l border-gray-800 ml-2 space-y-3">
                                                    {module.items.map((item, itemIndex) => (
                                                        <div
                                                            key={item.id}
                                                            className="flex items-center group hover:bg-[#2A2A2A] p-2 rounded-md cursor-pointer transition-colors"
                                                            onClick={() => openItemDialog(module.id, item.id)}
                                                        >
                                                            <div className="mr-2 text-gray-400">
                                                                {item.type === 'material' ? <BookOpen size={16} /> : <HelpCircle size={16} />}
                                                            </div>
                                                            <div className="flex-1">
                                                                <div className="text-base font-light text-white">
                                                                    {item.title}
                                                                </div>
                                                            </div>
                                                            {isEditMode && (
                                                                <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            // Move item up logic would go here
                                                                        }}
                                                                        disabled={itemIndex === 0}
                                                                        className="p-1 text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                                                        aria-label="Move item up"
                                                                    >
                                                                        <ChevronUp size={16} />
                                                                    </button>
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            // Move item down logic would go here
                                                                        }}
                                                                        disabled={itemIndex === module.items.length - 1}
                                                                        className="p-1 text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                                                        aria-label="Move item down"
                                                                    >
                                                                        <ChevronDown size={16} />
                                                                    </button>
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            // Delete item logic would go here
                                                                        }}
                                                                        className="p-1 text-gray-400 hover:text-white transition-colors"
                                                                        aria-label="Delete item"
                                                                    >
                                                                        <X size={16} />
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>

                                                {isEditMode && (
                                                    <div className="flex space-x-2 mt-4">
                                                        <button
                                                            onClick={() => {
                                                                // Add learning material logic would go here
                                                                console.log(`Adding learning material to module: ${module.title}`);
                                                            }}
                                                            className="flex items-center px-3 py-1.5 text-sm text-gray-300 hover:text-white border border-gray-800 rounded-full transition-colors cursor-pointer"
                                                        >
                                                            <Plus size={14} className="mr-1" />
                                                            Learning Material
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                // Add quiz logic would go here
                                                                console.log(`Adding quiz to module: ${module.title}`);
                                                            }}
                                                            className="flex items-center px-3 py-1.5 text-sm text-gray-300 hover:text-white border border-gray-800 rounded-full transition-colors cursor-pointer"
                                                        >
                                                            <Plus size={14} className="mr-1" />
                                                            Quiz
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {/* Add module button - always shown */}
                            <button
                                onClick={addModule}
                                className="mt-6 px-6 py-2 bg-white text-black text-sm font-medium rounded-full hover:opacity-90 transition-opacity focus:outline-none cursor-pointer flex items-center"
                            >
                                <Plus size={16} className="mr-2" />
                                Add Module
                            </button>
                        </>
                    ) : (
                        <div className="text-center py-12">
                            <h2 className="text-2xl font-medium mb-2">Course not found</h2>
                            <p className="text-gray-400 mb-6">The course you're looking for doesn't exist or has been removed</p>
                            <Link
                                href="/"
                                className="px-6 py-3 bg-white text-black text-sm font-medium rounded-full hover:opacity-90 transition-opacity inline-block"
                            >
                                Back to Home
                            </Link>
                        </div>
                    )}
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
                        className="w-full max-w-6xl h-[90vh] rounded-lg shadow-2xl flex flex-col transform transition-all duration-300 ease-in-out scale-100 translate-y-0"
                        style={{
                            backgroundColor: '#1A1A1A',
                            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                            borderColor: '#1A1A1A',
                            border: '1px solid #1A1A1A'
                        }}
                    >
                        {/* Dialog Header */}
                        <div
                            className="flex items-center justify-end p-4 cursor-pointer"
                            style={{ backgroundColor: '#111111' }}
                            onClick={(e) => {
                                // Focus the title element when header is clicked
                                if (dialogTitleRef.current && isEditMode && !isPreviewMode) {
                                    dialogTitleRef.current.contentEditable = "true";
                                    dialogTitleRef.current.focus();
                                }
                            }}
                        >
                            <h2
                                ref={dialogTitleRef}
                                contentEditable={isEditMode && !isPreviewMode}
                                suppressContentEditableWarning
                                className={`text-2xl font-light text-white outline-none empty:before:content-[attr(data-placeholder)] empty:before:text-gray-400 empty:before:pointer-events-none ${isEditMode && !isPreviewMode ? 'cursor-text' : ''} flex-1`}
                                data-placeholder={activeItem.type === 'material' ? "New Learning Material" : "New Quiz"}
                                onBlur={(e) => {
                                    if (isEditMode && !isPreviewMode) {
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
                                {isEditMode && (
                                    <button
                                        onClick={() => {
                                            setIsPreviewMode(!isPreviewMode);
                                        }}
                                        className={`flex items-center px-4 py-2 text-sm text-white bg-transparent border border-blue-500 hover:bg-[#222222] rounded-full transition-colors cursor-pointer`}
                                        aria-label={isPreviewMode ? "Edit item" : "Preview item"}
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
                        <div className="flex-1 overflow-y-auto p-6">
                            {activeItem.type === 'material' ? (
                                <div className="prose prose-invert max-w-none">
                                    {/* This would be replaced with a proper content editor or viewer */}
                                    <p className="text-gray-300">
                                        {isEditMode && !isPreviewMode ? (
                                            "Here you would have a content editor for learning materials."
                                        ) : (
                                            activeItem.content && activeItem.content.length > 0
                                                ? "Content would be displayed here."
                                                : "This learning material has no content yet."
                                        )}
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {/* This would be replaced with a proper quiz editor or viewer */}
                                    <p className="text-gray-300">
                                        {isEditMode && !isPreviewMode ? (
                                            "Here you would have a quiz editor."
                                        ) : (
                                            activeItem.questions && activeItem.questions.length > 0
                                                ? "Quiz questions would be displayed here."
                                                : "This quiz has no questions yet."
                                        )}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
} 