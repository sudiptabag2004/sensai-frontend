"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { ChevronUp, ChevronDown, X, ChevronRight, ChevronDown as ChevronDownExpand, Plus, BookOpen, HelpCircle, Trash, Zap, Sparkles, Eye, Check, FileEdit, Clipboard, ArrowLeft } from "lucide-react";
import dynamic from "next/dynamic";
import { Block } from "@blocknote/core";
import Link from "next/link";
import Image from "next/image";
import { Header } from "@/components/layout/header";
import { useRouter, useParams } from "next/navigation";

// Dynamically import the editor components
const DynamicLearningMaterialEditor = dynamic(
    () => import("../../../../../components/LearningMaterialEditor"),
    { ssr: false }
);

// Dynamically import the QuizEditor component
const DynamicQuizEditor = dynamic(
    () => import("../../../../../components/QuizEditor"),
    { ssr: false }
);

// Import the QuizQuestion type
import { QuizQuestion, QuizQuestionConfig } from "../../../../../components/QuizEditor";

// Define interfaces
interface Milestone {
    id: number;
    name: string;
    color: string;
    ordering: number;
}

interface CourseDetails {
    id: number;
    name: string;
    milestones?: Milestone[];
}

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

interface Exam {
    id: string;
    title: string;
    position: number;
    type: 'exam';
    questions: QuizQuestion[];
}

type ModuleItem = LearningMaterial | Quiz | Exam;

interface Module {
    id: string;
    title: string;
    position: number;
    items: ModuleItem[];
    isExpanded: boolean;
    backgroundColor: string;
    isEditing: boolean;
}

// Default configuration for new questions
const defaultQuestionConfig: QuizQuestionConfig = {
    inputType: 'text',
    responseStyle: 'coach',
    evaluationCriteria: []
};

export default function CreateCourse() {
    const router = useRouter();
    const params = useParams();
    const schoolId = params.id as string;
    const courseId = params.courseId as string;

    const [courseTitle, setCourseTitle] = useState("Loading course...");
    const [courseDetails, setCourseDetails] = useState<CourseDetails | null>(null);
    const [modules, setModules] = useState<Module[]>([]);
    const [activeItem, setActiveItem] = useState<ModuleItem | null>(null);
    const [activeModuleId, setActiveModuleId] = useState<string | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [isPreviewMode, setIsPreviewMode] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const titleRef = useRef<HTMLHeadingElement>(null);
    const dialogTitleRef = useRef<HTMLHeadingElement>(null);
    const dialogContentRef = useRef<HTMLDivElement>(null);
    const [lastUsedColorIndex, setLastUsedColorIndex] = useState<number>(-1);
    const [isCourseTitleEditing, setIsCourseTitleEditing] = useState(false);

    // Fetch course details from the backend
    useEffect(() => {
        const fetchCourseDetails = async () => {
            try {
                setIsLoading(true);
                const response = await fetch(`http://localhost:8001/courses/${courseId}`);

                if (!response.ok) {
                    throw new Error(`Failed to fetch course details: ${response.status}`);
                }

                const data = await response.json();
                setCourseDetails(data);
                setCourseTitle(data.name);

                // Check if milestones are available in the response
                if (data.milestones && Array.isArray(data.milestones)) {
                    // Transform milestones to match our Module interface
                    const transformedModules = data.milestones.map((milestone: Milestone) => ({
                        id: milestone.id.toString(),
                        title: milestone.name,
                        position: milestone.ordering,
                        items: [],
                        isExpanded: false,
                        backgroundColor: `${milestone.color}80`, // Add 50% opacity for UI display
                        isEditing: false
                    }));

                    // Sort modules by position/ordering if needed
                    transformedModules.sort((a: Module, b: Module) => a.position - b.position);

                    // Set the modules state
                    setModules(transformedModules);
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

    // Check if user has a school
    useEffect(() => {
        // No need to check localStorage - we're already on a school page
        // If they don't have a school, they couldn't have navigated here
    }, [router]);

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

    // Set initial content and focus on newly added modules and items
    useEffect(() => {
        // Focus the newly added module
        if (activeModuleId) {
            const moduleElement = document.querySelector(`[data-module-id="${activeModuleId}"]`) as HTMLHeadingElement;

            if (moduleElement) {
                moduleElement.focus();
            }
        }

        // Focus the newly added item
        if (activeItem && activeItem.id) {
            const itemElement = document.querySelector(`[data-item-id="${activeItem.id}"]`) as HTMLHeadingElement;

            if (itemElement) {
                itemElement.focus();
            }
        }
    }, [modules, activeModuleId, activeItem]);

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

    const addModule = async () => {
        // Generate a diverse set of theme-compatible colors for dark mode
        const getRandomPastelColor = () => {
            // Predefined set of diverse dark mode friendly colors in hex format
            const themeColors = [
                '#2d3748',    // Slate blue
                '#433c4c',    // Deep purple
                '#4a5568',    // Cool gray
                '#312e51',    // Indigo
                '#364135',    // Forest green
                '#4c393a',    // Burgundy
                '#334155',    // Navy blue
                '#553c2d',    // Rust brown
                '#37303f',    // Plum
                '#3c4b64',    // Steel blue
                '#463c46',    // Mauve
                '#3c322d',    // Coffee
            ];

            // Ensure we don't pick a color similar to the last one
            let newColorIndex;
            do {
                newColorIndex = Math.floor(Math.random() * themeColors.length);
                // If we have more than 6 colors, make sure the new color is at least 3 positions away
                // from the last one to ensure greater visual distinction
            } while (
                lastUsedColorIndex !== -1 &&
                (Math.abs(newColorIndex - lastUsedColorIndex) < 3 ||
                    newColorIndex === lastUsedColorIndex)
            );

            // Update the last used color index
            setLastUsedColorIndex(newColorIndex);

            return themeColors[newColorIndex];
        };

        // Select a random color for the module
        const backgroundColor = getRandomPastelColor();

        try {
            // Make POST request to create a new milestone (module)
            const response = await fetch(`http://localhost:8001/courses/${courseId}/milestones`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: "New Module",
                    color: backgroundColor, // Now sending color as hex with # symbol
                    org_id: parseInt(schoolId)
                }),
            });

            if (!response.ok) {
                throw new Error(`Failed to create module: ${response.status}`);
            }

            // Get the module ID from the response
            const data = await response.json();
            console.log("Module created successfully:", data);

            // Create the new module with the ID from the API
            const newModule: Module = {
                id: data.id.toString(), // Convert to string to match our Module interface
                title: "New Module",
                position: modules.length,
                items: [],
                isExpanded: true,
                backgroundColor: `${backgroundColor}80`, // Add 50% opacity for UI display
                isEditing: false
            };

            setModules([...modules, newModule]);
            setActiveModuleId(newModule.id);
        } catch (error) {
            console.error("Error creating module:", error);

            // Fallback to client-side ID generation if the API call fails
            const newModule: Module = {
                id: `module-${Date.now()}`,
                title: "New Module",
                position: modules.length,
                items: [],
                isExpanded: true,
                backgroundColor: `${backgroundColor}80`, // Add 50% opacity for UI display
                isEditing: false
            };

            setModules([...modules, newModule]);
            setActiveModuleId(newModule.id);
        }
    };

    // Add back the handleKeyDown function for module titles
    const handleKeyDown = (e: React.KeyboardEvent<HTMLHeadingElement>) => {
        // Prevent creating a new line when pressing Enter
        if (e.key === "Enter") {
            e.preventDefault();
            (e.currentTarget as HTMLHeadingElement).blur();
        }
    };

    const updateModuleTitle = (id: string, title: string) => {
        setModules(modules.map(module =>
            module.id === id ? { ...module, title } : module
        ));
    };

    const toggleModuleEditing = (id: string, isEditing: boolean) => {
        setModules(modules.map(module =>
            module.id === id ? { ...module, isEditing } : module
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

                setActiveItem(newItem);
                setActiveModuleId(moduleId);

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

                setActiveItem(newItem);
                setActiveModuleId(moduleId);

                return {
                    ...module,
                    items: [...module.items, newItem]
                };
            }
            return module;
        }));
    };

    const addExam = (moduleId: string) => {
        setModules(modules.map(module => {
            if (module.id === moduleId) {
                const newExamId = Math.random().toString();
                return {
                    ...module,
                    items: [
                        ...module.items,
                        {
                            id: newExamId,
                            title: 'New Exam',
                            position: module.items.length + 1,
                            type: 'exam',
                            questions: []
                        } as Exam
                    ]
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
                    items: module.items.map(item => {
                        if (item.id === itemId) {
                            if (item.type === 'material') {
                                return { ...item, content } as LearningMaterial;
                            } else if (item.type === 'quiz') {
                                return { ...item } as Quiz;
                            } else if (item.type === 'exam') {
                                return { ...item } as Exam;
                            }
                        }
                        return item;
                    })
                };
            }
            return module;
        }));

        // Also update active item content if it's currently being edited
        if (activeItem && activeItem.id === itemId && activeItem.type === 'material') {
            setActiveItem({
                ...activeItem,
                content
            });
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
        // Find the module
        const module = modules.find(m => m.id === moduleId);
        if (!module) return;

        // If module is in editing mode, don't toggle expansion
        if (module.isEditing) {
            return;
        }

        // Prevent toggling if clicking on buttons
        if (
            (e.target as HTMLElement).tagName === 'BUTTON' ||
            (e.target as HTMLElement).closest('button')
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

    const handleModuleTitleInput = (e: React.FormEvent<HTMLHeadingElement>, moduleId: string) => {
        // Just store the current text content, but don't update the state yet
        // This prevents React from re-rendering and resetting the cursor
        const newTitle = e.currentTarget.textContent || "";

        // We'll update the state when the user finishes editing (on blur or when save is clicked)
    };

    const saveModuleTitle = async (moduleId: string) => {
        // Find the heading element by data attribute
        const headingElement = document.querySelector(`[data-module-id="${moduleId}"]`) as HTMLHeadingElement;
        if (headingElement) {
            // Get the current content
            const newTitle = headingElement.textContent || "";

            try {
                // Make API call to update the milestone on the server
                const response = await fetch(`http://localhost:8001/milestones/${moduleId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        name: newTitle
                    }),
                });

                if (!response.ok) {
                    throw new Error(`Failed to update module title: ${response.status}`);
                }

                // If successful, update the state
                updateModuleTitle(moduleId, newTitle);
                console.log("Module title updated successfully");
            } catch (error) {
                console.error("Error updating module title:", error);

                // Still update the local state even if the API call fails
                // This provides a better user experience while allowing for retry later
                updateModuleTitle(moduleId, newTitle);
            }
        }

        // Turn off editing mode
        toggleModuleEditing(moduleId, false);
    };

    const cancelModuleEditing = (moduleId: string) => {
        // Find the heading element
        const headingElement = document.querySelector(`[data-module-id="${moduleId}"]`) as HTMLHeadingElement;
        if (headingElement) {
            // Reset the content to the original title from state
            const module = modules.find(m => m.id === moduleId);
            if (module) {
                headingElement.textContent = module.title;
            }
        }
        // Turn off editing mode
        toggleModuleEditing(moduleId, false);
    };

    // Add this helper function before the return statement
    const hasAnyItems = () => {
        return modules.some(module => module.items.length > 0);
    };

    // Add these functions for course title editing
    const handleCourseTitleInput = (e: React.FormEvent<HTMLHeadingElement>) => {
        // Just store the current text content, but don't update the state yet
        // This prevents React from re-rendering and resetting the cursor
        const newTitle = e.currentTarget.textContent || "";

        // We'll update the state when the user finishes editing
    };

    const saveCourseTitle = () => {
        if (titleRef.current) {
            const newTitle = titleRef.current.textContent || "";

            // Make a PUT request to update the course name
            fetch(`http://localhost:8001/courses/${courseId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: newTitle
                })
            })
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`Failed to update course: ${response.status}`);
                    }
                    return response.json();
                })
                .then(data => {
                    // Update the course title in the UI
                    setCourseTitle(newTitle);
                    console.log("Course updated successfully:", data);
                })
                .catch(err => {
                    console.error("Error updating course:", err);
                    // Revert to the original title in case of error
                    if (titleRef.current) {
                        titleRef.current.textContent = courseTitle;
                    }
                });

            setIsCourseTitleEditing(false);
        }
    };

    const cancelCourseTitleEditing = () => {
        if (titleRef.current) {
            titleRef.current.textContent = courseTitle;
        }
        setIsCourseTitleEditing(false);
    };

    // Helper function to set cursor at the end of a contentEditable element
    const setCursorToEnd = (element: HTMLElement) => {
        if (!element) return;

        const range = document.createRange();
        const selection = window.getSelection();

        // Clear any existing selection first
        selection?.removeAllRanges();

        // Set range to end of content
        range.selectNodeContents(element);
        range.collapse(false); // false means collapse to end

        // Apply the selection
        selection?.addRange(range);
        element.focus();
    };

    // For course title editing
    const enableCourseTitleEditing = () => {
        setIsCourseTitleEditing(true);

        // Need to use setTimeout to ensure the element is editable before focusing
        setTimeout(() => {
            if (titleRef.current) {
                setCursorToEnd(titleRef.current);
            }
        }, 0);
    };

    // For module title editing
    const enableModuleEditing = (moduleId: string) => {
        toggleModuleEditing(moduleId, true);

        // More reliable method to set cursor at end with a sufficient delay
        setTimeout(() => {
            const moduleElement = document.querySelector(`h2[contenteditable="true"]`) as HTMLElement;
            if (moduleElement && moduleElement.textContent) {
                // Create a text node at the end for more reliable cursor placement
                const textNode = moduleElement.firstChild;
                if (textNode) {
                    const selection = window.getSelection();
                    const range = document.createRange();

                    // Place cursor at the end of the text
                    range.setStart(textNode, textNode.textContent?.length || 0);
                    range.setEnd(textNode, textNode.textContent?.length || 0);

                    selection?.removeAllRanges();
                    selection?.addRange(range);
                }
                moduleElement.focus();
            }
        }, 100); // Increased delay for better reliability
    };

    return (
        <div className="min-h-screen bg-white dark:bg-black">
            {/* Use the reusable Header component with showCreateCourseButton set to false */}
            <Header showCreateCourseButton={false} />

            {/* Show spinner when loading */}
            {isLoading ? (
                <div className="flex justify-center items-center h-[calc(100vh-80px)]">
                    <div className="w-16 h-16 border-t-2 border-b-2 border-black dark:border-white rounded-full animate-spin"></div>
                </div>
            ) : (
                /* Main content area - only shown after loading */
                <div className="px-8 py-12">
                    <div className="max-w-5xl mx-auto">
                        {/* Back to Courses button */}
                        <Link
                            href={`/schools/${schoolId}#courses`}
                            className="flex items-center text-gray-400 hover:text-white transition-colors mb-4"
                        >
                            <ArrowLeft size={16} className="mr-2" />
                            Back To Courses
                        </Link>

                        <div className="flex items-center justify-between mb-8">
                            {error ? (
                                <h1 className="text-4xl font-light text-red-500 dark:text-red-400 w-3/4 mr-8">
                                    {error}
                                </h1>
                            ) : (
                                <div className="flex items-center w-3/4 mr-8">
                                    <h1
                                        ref={titleRef}
                                        contentEditable={isCourseTitleEditing}
                                        suppressContentEditableWarning
                                        onInput={handleCourseTitleInput}
                                        onKeyDown={handleKeyDown}
                                        className={`text-4xl font-light text-black dark:text-white outline-none ${isCourseTitleEditing ? 'border-b border-gray-300 dark:border-gray-700 pb-1' : ''}`}
                                        autoFocus={isCourseTitleEditing}
                                    >
                                        {courseTitle}
                                    </h1>
                                </div>
                            )}

                            <div className="flex items-center space-x-3 ml-auto">
                                {isCourseTitleEditing ? (
                                    <>
                                        <button
                                            className="flex items-center px-6 py-2 text-sm font-medium text-white bg-transparent border-2 !border-[#4F46E5] hover:bg-[#222222] outline-none rounded-full transition-all cursor-pointer shadow-md"
                                            onClick={saveCourseTitle}
                                        >
                                            <span className="mr-2 text-base">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                                                    <polyline points="17 21 17 13 7 13 7 21"></polyline>
                                                    <polyline points="7 3 7 8 15 8"></polyline>
                                                </svg>
                                            </span>
                                            <span className="drop-shadow-[0_1px_1px_rgba(0,0,0,0.5)]">Save</span>
                                        </button>
                                        <button
                                            className="flex items-center px-6 py-2 text-sm font-medium text-white bg-transparent border-2 !border-[#6B7280] hover:bg-[#222222] outline-none rounded-full transition-all cursor-pointer shadow-md"
                                            onClick={cancelCourseTitleEditing}
                                        >
                                            <span className="mr-2 text-base">
                                                <X size={16} />
                                            </span>
                                            <span className="drop-shadow-[0_1px_1px_rgba(0,0,0,0.5)]">Cancel</span>
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <button
                                            className="flex items-center px-6 py-2 text-sm font-medium text-white bg-transparent border-2 !border-[#4F46E5] hover:bg-[#222222] outline-none rounded-full transition-all cursor-pointer shadow-md"
                                            onClick={enableCourseTitleEditing}
                                        >
                                            <span className="mr-2 text-base">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                                </svg>
                                            </span>
                                            <span className="drop-shadow-[0_1px_1px_rgba(0,0,0,0.5)]">Edit</span>
                                        </button>
                                        <button
                                            className="flex items-center px-6 py-2 text-sm font-medium text-white bg-transparent border-2 !border-[#EF4444] hover:bg-[#222222] outline-none rounded-full transition-all cursor-pointer shadow-md"
                                            onClick={() => {
                                                // Open preview in a new tab
                                                window.open(`/schools/${schoolId}/courses/${courseId}/preview`, '_blank');
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
                                        {hasAnyItems() && (
                                            <button
                                                className="flex items-center px-6 py-2 text-sm font-medium text-white bg-transparent border-2 !border-[#016037] hover:bg-[#222222] outline-none rounded-full transition-all cursor-pointer shadow-md"
                                                onClick={() => {
                                                    // Publish action
                                                    console.log('Publish course');
                                                }}
                                            >
                                                <span className="mr-2 text-base">🚀</span>
                                                <span className="drop-shadow-[0_1px_1px_rgba(0,0,0,0.5)]">Publish</span>
                                            </button>
                                        )}
                                    </>
                                )}
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
                                    style={{ backgroundColor: module.backgroundColor }}
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
                                            className="mr-2 text-gray-400 hover:text-black dark:hover:text-white transition-colors cursor-pointer"
                                            aria-label={module.isExpanded ? "Collapse module" : "Expand module"}
                                        >
                                            {module.isExpanded ? <ChevronDownExpand size={18} /> : <ChevronRight size={18} />}
                                        </button>
                                        <div className="flex-1 mr-4">
                                            {module.isEditing ? (
                                                <h2
                                                    contentEditable
                                                    suppressContentEditableWarning
                                                    onInput={(e) => handleModuleTitleInput(e, module.id)}
                                                    onKeyDown={handleKeyDown}
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
                                        <div className="flex items-center space-x-2">
                                            {module.isEditing ? (
                                                <>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            saveModuleTitle(module.id);
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
                                                            cancelModuleEditing(module.id);
                                                        }}
                                                        className="px-3 py-1 text-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md transition-colors cursor-pointer flex items-center"
                                                        aria-label="Cancel editing"
                                                    >
                                                        <X size={16} className="mr-1" />
                                                        Cancel
                                                    </button>
                                                </>
                                            ) : (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        enableModuleEditing(module.id);
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
                                            )}
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    moveModuleUp(module.id);
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
                                                    moveModuleDown(module.id);
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
                                                    deleteModule(module.id);
                                                }}
                                                className="p-1 text-gray-400 hover:text-black dark:hover:text-white transition-colors cursor-pointer"
                                                aria-label="Delete module"
                                            >
                                                <Trash size={18} />
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
                                                    >
                                                        <div className="mr-2 text-gray-400">
                                                            {item.type === 'material' ? <BookOpen size={16} /> :
                                                                item.type === 'quiz' ? <HelpCircle size={16} /> :
                                                                    <Clipboard size={16} />}
                                                        </div>
                                                        <div className="flex-1">
                                                            <div className="text-base font-light text-black dark:text-white outline-none empty:before:content-[attr(data-placeholder)] empty:before:text-gray-400 empty:before:pointer-events-none">
                                                                {item.title || (item.type === 'material' ? "New Learning Material" : item.type === 'quiz' ? "New Quiz" : "New Exam")}
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
                                                    <button
                                                        onClick={() => addExam(module.id)}
                                                        className="flex items-center px-3 py-1.5 text-sm text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white border border-gray-200 dark:border-gray-800 rounded-full transition-colors cursor-pointer"
                                                    >
                                                        <Plus size={14} className="mr-1" />
                                                        Exam
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

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
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Dialog Header */}
                        <div
                            className="flex items-center justify-between p-4 border-b border-gray-800"
                            style={{ backgroundColor: '#111111' }}
                        >
                            <div className="flex-1 flex items-center">
                                <h2
                                    ref={dialogTitleRef}
                                    contentEditable
                                    suppressContentEditableWarning
                                    onInput={handleDialogTitleChange}
                                    onKeyDown={handleKeyDown}
                                    className="text-2xl font-light text-white outline-none empty:before:content-[attr(data-placeholder)] empty:before:text-gray-400 empty:before:pointer-events-none cursor-text"
                                    data-placeholder={activeItem?.type === 'material' ? 'New Learning Material' : activeItem?.type === 'quiz' ? 'New Quiz' : 'New Exam'}
                                >
                                    {activeItem?.title}
                                </h2>
                            </div>
                            <div className="flex items-center space-x-3">
                                {activeItem?.type === 'quiz' && (
                                    <button
                                        onClick={() => setIsPreviewMode(!isPreviewMode)}
                                        className="flex items-center px-4 py-2 text-sm text-white bg-transparent border !border-blue-500 hover:bg-[#222222] focus:border-blue-500 active:border-blue-500 rounded-full transition-colors cursor-pointer"
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
                                    className="text-gray-400 hover:text-white transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                        </div>

                        {/* Dialog Content */}
                        <div className="flex-1 overflow-y-auto p-6">
                            {activeItem?.type === 'material' ? (
                                <DynamicLearningMaterialEditor
                                    initialContent={activeItem.content}
                                    onChange={handleEditorContentChange}
                                />
                            ) : activeItem?.type === 'quiz' || activeItem?.type === 'exam' ? (
                                <DynamicQuizEditor
                                    initialQuestions={(activeItem as Quiz | Exam)?.questions || []}
                                    onChange={handleQuizContentChange}
                                    isPreviewMode={isPreviewMode}
                                />
                            ) : null}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}