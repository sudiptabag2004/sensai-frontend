"use client";

import "@blocknote/core/fonts/inter.css";
import { BlockNoteView } from "@blocknote/mantine";
import "@blocknote/mantine/style.css";
import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Plus, FileText, Settings, Trash2, FileCode, AudioLines, GraduationCap, MessageSquare, ClipboardList, Zap } from "lucide-react";

// Add custom styles for dark mode
import "./editor-styles.css";

// Import the LearningMaterialEditor for each question
import LearningMaterialEditor from "./LearningMaterialEditor";

export interface QuizQuestionConfig {
    inputType: 'text' | 'code' | 'audio';
    responseStyle: 'coach' | 'examiner' | 'evaluator';
    evaluationCriteria: string[];
    correctAnswer?: string;
    codeLanguage?: string; // For code input type
    audioMaxDuration?: number; // For audio input type in seconds
}

export interface QuizQuestion {
    id: string;
    content: any[];
    config: QuizQuestionConfig;
}

interface QuizEditorProps {
    initialQuestions?: QuizQuestion[];
    onChange?: (questions: QuizQuestion[]) => void;
    isDarkMode?: boolean;
    className?: string;
    isPreviewMode?: boolean;
}

// Default configuration for new questions
const defaultQuestionConfig: QuizQuestionConfig = {
    inputType: 'text',
    responseStyle: 'coach',
    evaluationCriteria: []
};

export default function QuizEditor({
    initialQuestions = [],
    onChange,
    isDarkMode = true,
    className = "",
    isPreviewMode = false,
}: QuizEditorProps) {
    // Initialize questions state
    const [questions, setQuestions] = useState<QuizQuestion[]>(() => {
        if (initialQuestions && initialQuestions.length > 0) {
            return initialQuestions;
        }
        return [{
            id: `question-${Date.now()}`,
            content: [],
            config: { ...defaultQuestionConfig }
        }];
    });

    // Current question index
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

    // Active tab state (description, setting)
    const [activeTab, setActiveTab] = useState<'description' | 'setting'>('description');

    // State to track if a new question was just added (for animation)
    const [newQuestionAdded, setNewQuestionAdded] = useState(false);

    // State for delete confirmation
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    // State for input type dropdown
    const [inputTypeDropdownOpen, setInputTypeDropdownOpen] = useState(false);

    // State for response style dropdown
    const [responseStyleDropdownOpen, setResponseStyleDropdownOpen] = useState(false);

    // Close dropdowns when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            const target = event.target as Node;

            // Only handle clicks that are not on any form input elements
            if (target instanceof Element) {
                const isFormElement =
                    target.tagName === 'INPUT' ||
                    target.tagName === 'TEXTAREA' ||
                    target.tagName === 'SELECT' ||
                    target.hasAttribute('contenteditable');

                if (isFormElement) {
                    return;
                }
            }

            // Close input type dropdown if clicking outside
            if (inputTypeDropdownOpen) {
                const inputTypeDropdown = document.getElementById('input-type-dropdown');
                if (inputTypeDropdown && !inputTypeDropdown.contains(target)) {
                    setInputTypeDropdownOpen(false);
                }
            }

            // Close response style dropdown if clicking outside
            if (responseStyleDropdownOpen) {
                const responseStyleDropdown = document.getElementById('response-style-dropdown');
                if (responseStyleDropdown && !responseStyleDropdown.contains(target)) {
                    setResponseStyleDropdownOpen(false);
                }
            }
        }

        // Add event listener
        document.addEventListener('mousedown', handleClickOutside);

        // Clean up
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [inputTypeDropdownOpen, responseStyleDropdownOpen]);

    // Handle content change for the current question
    const handleQuestionContentChange = (content: any[]) => {
        const updatedQuestions = [...questions];
        updatedQuestions[currentQuestionIndex] = {
            ...updatedQuestions[currentQuestionIndex],
            content
        };

        setQuestions(updatedQuestions);

        if (onChange) {
            onChange(updatedQuestions);
        }
    };

    // Handle configuration change for the current question
    const handleConfigChange = (configUpdate: Partial<QuizQuestionConfig>) => {
        const updatedQuestions = [...questions];
        updatedQuestions[currentQuestionIndex] = {
            ...updatedQuestions[currentQuestionIndex],
            config: {
                ...updatedQuestions[currentQuestionIndex].config,
                ...configUpdate
            }
        };

        setQuestions(updatedQuestions);

        if (onChange) {
            onChange(updatedQuestions);
        }
    };

    // Add a new question
    const addQuestion = () => {
        const newQuestion = {
            id: `question-${Date.now()}`,
            content: [],
            config: { ...defaultQuestionConfig }
        };

        setQuestions(prev => [...prev, newQuestion]);
        setCurrentQuestionIndex(questions.length);

        // Trigger animation
        setNewQuestionAdded(true);

        // Reset animation flag after animation completes
        setTimeout(() => {
            setNewQuestionAdded(false);
        }, 800); // slightly longer than animation duration to ensure it completes
    };

    // Navigate to previous question
    const goToPreviousQuestion = () => {
        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex(currentQuestionIndex - 1);
        }
    };

    // Navigate to next question
    const goToNextQuestion = () => {
        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(currentQuestionIndex + 1);
        }
    };

    // Delete current question
    const deleteQuestion = () => {
        if (questions.length <= 1) {
            // Don't allow deleting the last question
            return;
        }

        const updatedQuestions = [...questions];
        updatedQuestions.splice(currentQuestionIndex, 1);

        setQuestions(updatedQuestions);

        // Adjust current index if necessary
        if (currentQuestionIndex >= updatedQuestions.length) {
            setCurrentQuestionIndex(updatedQuestions.length - 1);
        }

        if (onChange) {
            onChange(updatedQuestions);
        }

        // Hide confirmation dialog
        setShowDeleteConfirm(false);
    };

    // Get the current question's content and config
    const currentQuestionContent = questions[currentQuestionIndex]?.content || [];
    const currentQuestionConfig = questions[currentQuestionIndex]?.config || defaultQuestionConfig;

    return (
        <div className="flex flex-col h-full relative">
            {/* Delete confirmation modal */}
            {showDeleteConfirm && !isPreviewMode && (
                <div
                    className="absolute inset-0 backdrop-blur-sm z-10 flex items-center justify-center"
                    onClick={() => setShowDeleteConfirm(false)}
                >
                    <div
                        className="bg-[#333333] p-6 rounded-lg shadow-lg max-w-md w-full"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3 className="text-white text-lg font-normal mb-4">Delete Question</h3>
                        <p className="text-gray-300 mb-6">Are you sure you want to delete this question? This action cannot be undone.</p>
                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={() => setShowDeleteConfirm(false)}
                                className="px-6 py-2 bg-[#474747] text-white hover:bg-[#525252] rounded-md cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={deleteQuestion}
                                className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md flex items-center cursor-pointer"
                            >
                                <Trash2 size={16} className="mr-2" />
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Quiz Controls - Hide in preview mode */}
            {!isPreviewMode && (
                <div className="grid grid-cols-3 mb-4 px-2 py-3">
                    {/* Left: Question Management Buttons */}
                    <div className="flex items-center space-x-2 justify-start">
                        <button
                            onClick={addQuestion}
                            className="flex items-center px-4 py-2 text-sm text-black bg-white hover:bg-gray-100 rounded-md transition-colors cursor-pointer"
                        >
                            <div className="w-5 h-5 rounded-full border border-black flex items-center justify-center mr-2">
                                <Plus size={12} className="text-black" />
                            </div>
                            Add Question
                        </button>

                        {/* Always render the delete button container to maintain layout, but conditionally show the button */}
                        <div className="w-[88px]"> {/* Approximate width of the delete button */}
                            {questions.length > 1 && (
                                <button
                                    onClick={() => setShowDeleteConfirm(true)}
                                    className="flex items-center px-3 py-1.5 text-sm text-red-400 hover:text-white bg-[#3A3A3A] hover:bg-red-600 rounded-md transition-colors cursor-pointer"
                                    aria-label="Delete current question"
                                >
                                    <Trash2 size={16} className="mr-1" />
                                    Delete
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Center: Segmented Control */}
                    <div className="flex justify-center">
                        <div className="bg-[#2A2A2A] inline-flex rounded-md p-1">
                            <button
                                className={`px-4 py-2 text-sm rounded-md transition-colors cursor-pointer flex items-center gap-1.5 outline-none ${activeTab === 'description'
                                    ? 'bg-[#444444] text-white'
                                    : 'text-gray-400 hover:text-gray-300'
                                    }`}
                                onClick={() => setActiveTab('description')}
                            >
                                <FileText size={16} />
                                Description
                            </button>
                            <button
                                className={`px-4 py-2 text-sm rounded-md transition-colors cursor-pointer flex items-center gap-1.5 outline-none ${activeTab === 'setting'
                                    ? 'bg-[#444444] text-white'
                                    : 'text-gray-400 hover:text-gray-300'
                                    }`}
                                onClick={() => setActiveTab('setting')}
                            >
                                <Settings size={16} />
                                Settings
                            </button>
                        </div>
                    </div>

                    {/* Right: Navigation Controls */}
                    <div className="flex items-center justify-end">
                        <button
                            onClick={goToPreviousQuestion}
                            disabled={currentQuestionIndex === 0}
                            className={`w-10 h-10 flex items-center justify-center rounded-full ${currentQuestionIndex === 0 ? 'text-gray-600 cursor-not-allowed' : 'text-gray-300 hover:text-white hover:bg-[#3A3A3A] cursor-pointer'} transition-colors border border-[#3A3A3A]`}
                            aria-label="Previous question"
                        >
                            <ChevronLeft size={20} />
                        </button>

                        <div className="mx-2 px-4 py-1 rounded-full border border-[#3A3A3A] bg-[#2A2A2A] text-gray-300 text-sm">
                            {currentQuestionIndex + 1} / {questions.length}
                        </div>

                        <button
                            onClick={goToNextQuestion}
                            disabled={currentQuestionIndex === questions.length - 1}
                            className={`w-10 h-10 flex items-center justify-center rounded-full ${currentQuestionIndex === questions.length - 1 ? 'text-gray-600 cursor-not-allowed' : 'text-gray-300 hover:text-white hover:bg-[#3A3A3A] cursor-pointer'} transition-colors border border-[#3A3A3A]`}
                            aria-label="Next question"
                        >
                            <ChevronRight size={20} />
                        </button>
                    </div>
                </div>
            )}

            {/* Content area with animation when a new question is added */}
            <div className={`flex flex-1 gap-4 ${newQuestionAdded ? 'animate-new-question' : ''}`}>
                {isPreviewMode ? (
                    <div className="w-full h-full">
                        <div className="flex h-full bg-[#111111] rounded-md overflow-hidden">
                            {/* Left side - Question */}
                            <div className="w-1/2 p-8 border-r border-[#222222] flex flex-col bg-[#1A1A1A]">
                                {/* Navigation controls at the top of left side - only show if more than one question */}
                                {questions.length > 1 && (
                                    <div className="flex items-center justify-between w-full mb-6">
                                        <div className="w-10 h-10">
                                            {currentQuestionIndex > 0 && (
                                                <button
                                                    className="w-10 h-10 rounded-full flex items-center justify-center bg-[#222222] text-white hover:bg-[#333333] cursor-pointer"
                                                    onClick={goToPreviousQuestion}
                                                >
                                                    <ChevronLeft size={18} />
                                                </button>
                                            )}
                                        </div>

                                        <div className="bg-[#222222] px-3 py-1 rounded-full text-white text-sm">
                                            {currentQuestionIndex + 1}/{questions.length}
                                        </div>

                                        <div className="w-10 h-10">
                                            {currentQuestionIndex < questions.length - 1 && (
                                                <button
                                                    className="w-10 h-10 rounded-full flex items-center justify-center bg-[#222222] text-white hover:bg-[#333333] cursor-pointer"
                                                    onClick={goToNextQuestion}
                                                >
                                                    <ChevronRight size={18} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                )}

                                <div className={`flex-1 ${questions.length > 1 ? 'mt-4' : 'mt-6'}`}>
                                    {/* Use editor with negative margin to offset unwanted space */}
                                    <div className="ml-[-60px]"> {/* Increased negative margin to align with navigation arrow */}
                                        <LearningMaterialEditor
                                            key={`question-preview-${currentQuestionIndex}`}
                                            initialContent={currentQuestionContent}
                                            onChange={() => { }} // Read-only in preview mode
                                            isDarkMode={true}
                                            readOnly={true}
                                            className="!bg-transparent"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Right side - Answer */}
                            <div className="w-1/2 p-8 flex flex-col">
                                <div className="flex-1 flex flex-col justify-center items-center text-center mb-8">
                                    <div className="w-16 h-16 mb-4 text-gray-400">
                                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                                            <path d="M21 15C21 15.5304 20.7893 16.0391 20.4142 16.4142C20.0391 16.7893 19.5304 17 19 17H7L3 21V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    </div>
                                    <p className="text-gray-400 text-lg">Type your answer to begin the conversation</p>
                                </div>

                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder="Type your answer here..."
                                        className="w-full bg-[#1A1A1A] border border-[#333333] rounded-md p-4 pr-12 text-white focus:outline-none focus:border-blue-500"
                                    />
                                    <button className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white">
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M22 2L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                            <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <>
                        {activeTab === 'description' && (
                            <div className="w-full">
                                <div className="editor-container h-full">
                                    <LearningMaterialEditor
                                        key={`question-editor-${currentQuestionIndex}`}
                                        initialContent={currentQuestionContent}
                                        onChange={handleQuestionContentChange}
                                        isDarkMode={isDarkMode}
                                    />
                                </div>
                            </div>
                        )}

                        {activeTab === 'setting' && (
                            <div className="w-full">
                                <div className="config-panel h-full">
                                    <div className="config-grid">
                                        {/* Input Type */}
                                        <div className="config-item">
                                            <label
                                                className="text-gray-400 uppercase text-xs font-semibold tracking-wider mb-2"
                                                id="input-type-label"
                                            >
                                                Input Type
                                            </label>
                                            <div className="relative">
                                                <div
                                                    className="flex items-center justify-between p-3 bg-[#2A2A2A] rounded-md cursor-pointer"
                                                    onClick={() => setInputTypeDropdownOpen(!inputTypeDropdownOpen)}
                                                    aria-haspopup="listbox"
                                                    aria-expanded={inputTypeDropdownOpen}
                                                    aria-labelledby="input-type-label"
                                                >
                                                    <div className="flex items-center">
                                                        {currentQuestionConfig.inputType === 'text' && <FileText size={18} className="mr-2 text-gray-300" />}
                                                        {currentQuestionConfig.inputType === 'code' && <FileCode size={18} className="mr-2 text-gray-300" />}
                                                        {currentQuestionConfig.inputType === 'audio' && <AudioLines size={18} className="mr-2 text-gray-300" />}
                                                        <span className="text-white">
                                                            {currentQuestionConfig.inputType === 'text' && 'Text'}
                                                            {currentQuestionConfig.inputType === 'code' && 'Code'}
                                                            {currentQuestionConfig.inputType === 'audio' && 'Audio'}
                                                        </span>
                                                    </div>
                                                    <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                                    </svg>
                                                </div>

                                                {/* Dropdown menu */}
                                                {inputTypeDropdownOpen && (
                                                    <div
                                                        className="absolute mt-1 w-full bg-[#1A1A1A] border border-[#333333] rounded-md shadow-lg z-10"
                                                        role="listbox"
                                                        aria-labelledby="input-type-label"
                                                    >
                                                        <div
                                                            className={`flex items-center p-3 ${currentQuestionConfig.inputType === 'text' ? 'bg-[#2A2A2A]' : ''} hover:bg-[#2A2A2A] cursor-pointer`}
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                e.stopPropagation();
                                                                handleConfigChange({ inputType: 'text' });
                                                                setInputTypeDropdownOpen(false);
                                                            }}
                                                            role="option"
                                                            aria-selected={currentQuestionConfig.inputType === 'text'}
                                                        >
                                                            <FileText size={18} className="mr-3 text-gray-300" />
                                                            <div className="flex-1">
                                                                <div className="font-medium text-white">Text (Paragraph)</div>
                                                                <div className="text-xs text-gray-400">Free-form text response</div>
                                                            </div>
                                                            {currentQuestionConfig.inputType === 'text' && (
                                                                <svg className="h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                                </svg>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Response Style */}
                                        <div className="config-item">
                                            <label
                                                className="text-gray-400 uppercase text-xs font-semibold tracking-wider mb-2"
                                                id="response-style-label"
                                            >
                                                AI Response Style
                                            </label>
                                            <div className="relative" id="response-style-dropdown">
                                                <div
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        setResponseStyleDropdownOpen(!responseStyleDropdownOpen);
                                                    }}
                                                    className="w-full bg-[#1A1A1A] border border-gray-700 rounded-md p-3 text-white cursor-pointer flex items-center justify-between"
                                                    aria-haspopup="listbox"
                                                    aria-expanded={responseStyleDropdownOpen}
                                                >
                                                    <div className="flex items-center">
                                                        {currentQuestionConfig.responseStyle === 'coach' && <MessageSquare size={18} className="mr-2 text-gray-300" />}
                                                        {currentQuestionConfig.responseStyle === 'examiner' && <GraduationCap size={18} className="mr-2 text-gray-300" />}
                                                        {currentQuestionConfig.responseStyle === 'evaluator' && <ClipboardList size={18} className="mr-2 text-gray-300" />}
                                                        <span className="text-white">
                                                            {currentQuestionConfig.responseStyle === 'coach' && 'Coach'}
                                                            {currentQuestionConfig.responseStyle === 'examiner' && 'Exam'}
                                                            {currentQuestionConfig.responseStyle === 'evaluator' && 'Report'}
                                                        </span>
                                                    </div>
                                                    <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                                    </svg>
                                                </div>

                                                {responseStyleDropdownOpen && (
                                                    <div
                                                        className="absolute z-10 mt-1 w-full bg-[#1A1A1A] border border-gray-700 rounded-md overflow-hidden shadow-lg"
                                                        role="listbox"
                                                        aria-labelledby="response-style-label"
                                                    >
                                                        <div
                                                            className={`flex items-center p-3 ${currentQuestionConfig.responseStyle === 'coach' ? 'bg-[#2A2A2A]' : ''} hover:bg-[#2A2A2A] cursor-pointer`}
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                e.stopPropagation();
                                                                handleConfigChange({ responseStyle: 'coach' });
                                                                setResponseStyleDropdownOpen(false);
                                                            }}
                                                            role="option"
                                                            aria-selected={currentQuestionConfig.responseStyle === 'coach'}
                                                        >
                                                            <MessageSquare size={18} className="mr-3 text-gray-300" />
                                                            <div className="flex-1">
                                                                <div className="font-medium text-white">Coach (Supportive & Guiding)</div>
                                                                <div className="text-xs text-gray-400">Provides encouragement and guidance</div>
                                                            </div>
                                                            {currentQuestionConfig.responseStyle === 'coach' && (
                                                                <svg className="h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                                </svg>
                                                            )}
                                                        </div>
                                                        <div
                                                            className={`flex items-center p-3 ${currentQuestionConfig.responseStyle === 'examiner' ? 'bg-[#2A2A2A]' : ''} hover:bg-[#2A2A2A] cursor-pointer`}
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                e.stopPropagation();
                                                                handleConfigChange({ responseStyle: 'examiner' });
                                                                setResponseStyleDropdownOpen(false);
                                                            }}
                                                            role="option"
                                                            aria-selected={currentQuestionConfig.responseStyle === 'examiner'}
                                                        >
                                                            <GraduationCap size={18} className="mr-3 text-gray-300" />
                                                            <div className="flex-1">
                                                                <div className="font-medium text-white">Exam (Objective & Formal)</div>
                                                                <div className="text-xs text-gray-400">Formal assessment with clear scoring</div>
                                                            </div>
                                                            {currentQuestionConfig.responseStyle === 'examiner' && (
                                                                <svg className="h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                                </svg>
                                                            )}
                                                        </div>
                                                        <div
                                                            className={`flex items-center p-3 ${currentQuestionConfig.responseStyle === 'evaluator' ? 'bg-[#2A2A2A]' : ''} hover:bg-[#2A2A2A] cursor-pointer`}
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                e.stopPropagation();
                                                                handleConfigChange({ responseStyle: 'evaluator' });
                                                                setResponseStyleDropdownOpen(false);
                                                            }}
                                                            role="option"
                                                            aria-selected={currentQuestionConfig.responseStyle === 'evaluator'}
                                                        >
                                                            <ClipboardList size={18} className="mr-3 text-gray-300" />
                                                            <div className="flex-1">
                                                                <div className="font-medium text-white">Report (Detailed Assessment)</div>
                                                                <div className="text-xs text-gray-400">Comprehensive analysis with suggestions</div>
                                                            </div>
                                                            {currentQuestionConfig.responseStyle === 'evaluator' && (
                                                                <svg className="h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                                </svg>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Navigation controls for edit mode - only show if more than one question */}
            {!isPreviewMode && questions.length > 1 && (
                <div className="flex items-center justify-end mt-4 px-2">
                    <div className="flex items-center space-x-2">
                        {currentQuestionIndex > 0 && (
                            <button
                                onClick={goToPreviousQuestion}
                                className="w-10 h-10 flex items-center justify-center rounded-full text-gray-300 hover:text-white hover:bg-[#3A3A3A] cursor-pointer transition-colors border border-[#3A3A3A]"
                                aria-label="Previous question"
                            >
                                <ChevronLeft size={20} />
                            </button>
                        )}

                        <div className="mx-2 px-4 py-1 rounded-full border border-[#3A3A3A] bg-[#2A2A2A] text-gray-300 text-sm">
                            {currentQuestionIndex + 1} / {questions.length}
                        </div>

                        {currentQuestionIndex < questions.length - 1 && (
                            <button
                                onClick={goToNextQuestion}
                                className="w-10 h-10 flex items-center justify-center rounded-full text-gray-300 hover:text-white hover:bg-[#3A3A3A] cursor-pointer transition-colors border border-[#3A3A3A]"
                                aria-label="Next question"
                            >
                                <ChevronRight size={20} />
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* Add CSS animation for new question */}
            <style jsx global>{`
                @keyframes newQuestionPulse {
                    0% {
                        transform: scale(1);
                        opacity: 1;
                    }
                    25% {
                        transform: scale(1.02);
                        opacity: 1;
                    }
                    100% {
                        transform: scale(1);
                        opacity: 1;
                    }
                }
                
                .animate-new-question {
                    animation: newQuestionPulse 0.7s ease-in-out;
                }
            `}</style>
        </div>
    );
} 