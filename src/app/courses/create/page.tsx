"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronUp, ChevronDown, X } from "lucide-react";

// Define Module interface
interface Module {
    id: string;
    title: string;
    position: number;
}

export default function CreateCourse() {
    const [courseTitle, setCourseTitle] = useState("New Course");
    const [modules, setModules] = useState<Module[]>([]);
    const titleRef = useRef<HTMLHeadingElement>(null);
    const newModuleRef = useRef<HTMLHeadingElement | null>(null);

    // Focus the title and position cursor at the end when the page loads
    useEffect(() => {
        if (titleRef.current) {
            // Set initial content
            titleRef.current.textContent = courseTitle;

            titleRef.current.focus();

            // Create a range and set cursor position at the end of the text
            const range = document.createRange();
            const selection = window.getSelection();

            // Get the text node (first child of the h1 element)
            const textNode = titleRef.current.firstChild;

            if (textNode && selection) {
                // Set range to end of text content
                range.setStart(textNode, textNode.textContent?.length || 0);
                range.setEnd(textNode, textNode.textContent?.length || 0);

                // Apply the range to the selection
                selection.removeAllRanges();
                selection.addRange(range);
            }
        }
    }, []);

    // Set initial content and focus on newly added modules
    useEffect(() => {
        // Initialize all module elements with their titles
        modules.forEach(module => {
            const moduleElement = document.querySelector(`[data-module-id="${module.id}"]`) as HTMLHeadingElement;
            if (moduleElement && !moduleElement.textContent) {
                moduleElement.textContent = module.title;
            }
        });

        // Focus the newly added module
        if (newModuleRef.current) {
            // Set the initial content
            const lastModule = modules[modules.length - 1];
            if (lastModule) {
                newModuleRef.current.textContent = lastModule.title;
            }

            newModuleRef.current.focus();

            // Position cursor at the end of the text
            const range = document.createRange();
            const selection = window.getSelection();
            const textNode = newModuleRef.current.firstChild;

            if (textNode && selection) {
                range.setStart(textNode, textNode.textContent?.length || 0);
                range.setEnd(textNode, textNode.textContent?.length || 0);

                selection.removeAllRanges();
                selection.addRange(range);
            }

            // Clear the ref after focusing
            newModuleRef.current = null;
        }
    }, [modules]);

    const handleTitleChange = (e: React.FormEvent<HTMLHeadingElement>) => {
        setCourseTitle(e.currentTarget.textContent || "New Course");
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
            title: "New Module",
            position: modules.length
        };

        setModules([...modules, newModule]);
    };

    const updateModuleTitle = (id: string, title: string) => {
        setModules(modules.map(module =>
            module.id === id ? { ...module, title: title || "New Module" } : module
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

    return (
        <div className="min-h-screen bg-white dark:bg-black px-8 py-12">
            <div className="max-w-2xl mx-auto">
                <h1
                    ref={titleRef}
                    contentEditable
                    suppressContentEditableWarning
                    onInput={handleTitleChange}
                    onKeyDown={handleKeyDown}
                    className="text-4xl font-light text-black dark:text-white outline-none mb-12"
                    data-placeholder="New Course"
                />

                <div className="space-y-4">
                    {modules.map((module, index) => (
                        <div
                            key={module.id}
                            className="flex items-center group border border-gray-200 dark:border-gray-800 rounded-lg p-4 hover:border-gray-300 dark:hover:border-gray-700 transition-colors"
                        >
                            <div className="flex-1">
                                <h2
                                    contentEditable
                                    suppressContentEditableWarning
                                    onInput={(e) => updateModuleTitle(module.id, e.currentTarget.textContent || "")}
                                    onKeyDown={handleKeyDown}
                                    className="text-xl font-light text-black dark:text-white outline-none"
                                    ref={index === modules.length - 1 && newModuleRef.current === null ? (el) => { newModuleRef.current = el; } : undefined}
                                    data-module-id={module.id}
                                />
                            </div>
                            <div className="flex items-center space-x-2">
                                <button
                                    onClick={() => moveModuleUp(module.id)}
                                    disabled={index === 0}
                                    className="p-1 text-gray-400 hover:text-black dark:hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                    aria-label="Move module up"
                                >
                                    <ChevronUp size={18} />
                                </button>
                                <button
                                    onClick={() => moveModuleDown(module.id)}
                                    disabled={index === modules.length - 1}
                                    className="p-1 text-gray-400 hover:text-black dark:hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                    aria-label="Move module down"
                                >
                                    <ChevronDown size={18} />
                                </button>
                                <button
                                    onClick={() => deleteModule(module.id)}
                                    className="p-1 text-gray-400 hover:text-black dark:hover:text-white transition-colors"
                                    aria-label="Delete module"
                                >
                                    <X size={18} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                <button
                    onClick={addModule}
                    className="mt-6 px-4 py-2 bg-black dark:bg-white text-white dark:text-black text-sm font-medium rounded-full hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 dark:focus:ring-gray-100"
                >
                    Add Module
                </button>
            </div>
        </div>
    );
} 