import { useRef, useEffect } from "react";
import { Sparkles, Check, X, Pencil } from "lucide-react";
import dynamic from "next/dynamic";
import { QuizQuestion } from "./QuizEditor";

// Import TaskData from types
interface TaskData {
    id: string;
    title: string;
    blocks: any[];
    status: string;
}

// Dynamically import the editor components
const DynamicLearningMaterialEditor = dynamic(
    () => import("./LearningMaterialEditor"),
    { ssr: false }
);

// Dynamically import the QuizEditor component
const DynamicQuizEditor = dynamic(
    () => import("./QuizEditor"),
    { ssr: false }
);

// Define props interface for the component
interface CourseItemDialogProps {
    isOpen: boolean;
    activeItem: any; // Using any for now, should be properly typed
    activeModuleId: string | null;
    isEditMode: boolean;
    isPreviewMode: boolean;
    showPublishConfirmation: boolean;
    dialogTitleRef: React.RefObject<HTMLHeadingElement | null>;
    dialogContentRef: React.RefObject<HTMLDivElement | null>;
    onClose: () => void;
    onPublishConfirm: () => void;
    onPublishCancel: () => void;
    onSetShowPublishConfirmation: (show: boolean) => void;
    onSaveItem: () => void;
    onCancelEditMode: () => void;
    onEnableEditMode: () => void;
    onDialogTitleChange: (e: React.FormEvent<HTMLHeadingElement>) => void;
    onQuizContentChange: (questions: QuizQuestion[]) => void;
    focusEditor: () => void;
}

const CourseItemDialog: React.FC<CourseItemDialogProps> = ({
    isOpen,
    activeItem,
    activeModuleId,
    isEditMode,
    isPreviewMode,
    showPublishConfirmation,
    dialogTitleRef,
    dialogContentRef,
    onClose,
    onPublishConfirm,
    onPublishCancel,
    onSetShowPublishConfirmation,
    onSaveItem,
    onCancelEditMode,
    onEnableEditMode,
    onDialogTitleChange,
    onQuizContentChange,
    focusEditor,
}) => {
    // Bail early if dialog isn't open or there's no active item
    if (!isOpen || !activeItem) return null;

    // Handle backdrop click to close dialog
    const handleDialogBackdropClick = (e: React.MouseEvent) => {
        // Only close if clicking directly on the backdrop, not on the dialog content
        if (dialogContentRef.current && !dialogContentRef.current.contains(e.target as Node)) {
            onClose();
        }
    };

    return (
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
                            contentEditable={(activeItem?.status !== 'published' || isEditMode)}
                            suppressContentEditableWarning
                            onInput={(e) => {
                                // For learning materials in draft mode, allow editing title 
                                // but don't propagate changes upward yet (will be handled during publish)
                                if (activeItem?.type === 'material') {
                                    // Title change is allowed but not propagated upward immediately
                                    // The current title will be stored in the DOM element
                                    // and will be sent to the API during publish
                                } else {
                                    // For quizzes/exams, handle as before
                                    onDialogTitleChange(e);
                                }
                            }}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    // Blur the element to trigger save
                                    (e.target as HTMLElement).blur();
                                }
                            }}
                            onClick={(e) => {
                                // Prevent click from bubbling up
                                e.stopPropagation();

                                // If not editable, don't continue
                                if ((activeItem?.status === 'published' && !isEditMode)) {
                                    return;
                                }

                                // Set a flag to indicate the title is being edited
                                const titleElement = e.currentTarget as HTMLElement;
                                titleElement.dataset.editing = "true";

                                // Set cursor position at the end of text
                                const range = document.createRange();
                                const selection = window.getSelection();
                                const textNode = titleElement.firstChild || titleElement;

                                if (textNode) {
                                    const textLength = textNode.textContent?.length || 0;
                                    range.setStart(textNode, textLength);
                                    range.setEnd(textNode, textLength);
                                    selection?.removeAllRanges();
                                    selection?.addRange(range);
                                }
                            }}
                            className="text-2xl font-light text-white outline-none empty:before:content-[attr(data-placeholder)] empty:before:text-gray-400 empty:before:pointer-events-none cursor-text"
                            data-placeholder={activeItem?.type === 'material' ? 'New Learning Material' : activeItem?.type === 'quiz' ? 'New Quiz' : 'New Exam'}
                        >
                            {activeItem?.title}
                        </h2>
                    </div>
                    <div className="flex items-center space-x-3">
                        {activeItem?.status === 'draft' && (
                            <button
                                onClick={() => onSetShowPublishConfirmation(true)}
                                className="flex items-center px-4 py-2 text-sm text-white bg-transparent border !border-green-500 hover:bg-[#222222] focus:border-green-500 active:border-green-500 rounded-full transition-colors cursor-pointer"
                                aria-label="Publish item"
                            >
                                <Sparkles size={16} className="mr-2" />
                                Publish
                            </button>
                        )}
                        {activeItem?.status === 'published' && isEditMode ? (
                            <>
                                <button
                                    onClick={() => {
                                        if (activeItem?.type === 'material') {
                                            // For learning materials, trigger the handleSave function 
                                            // in the LearningMaterialEditor component
                                            const saveButton = document.getElementById('save-learning-material');
                                            if (saveButton) {
                                                saveButton.click();
                                            }
                                        } else {
                                            // For other item types, use the original save function
                                            onSaveItem();
                                        }
                                    }}
                                    className="flex items-center px-4 py-2 text-sm text-white bg-transparent border !border-green-500 hover:bg-[#222222] focus:border-green-500 active:border-green-500 rounded-full transition-colors cursor-pointer"
                                    aria-label="Save changes"
                                >
                                    <Check size={16} className="mr-2" />
                                    Save
                                </button>
                                <button
                                    onClick={() => {
                                        if (activeItem?.type === 'material') {
                                            // For learning materials, trigger the handleCancel function 
                                            // in the LearningMaterialEditor component
                                            const cancelButton = document.getElementById('cancel-learning-material');
                                            if (cancelButton) {
                                                cancelButton.click();
                                            }
                                        }
                                        // Always call the parent's cancel function
                                        onCancelEditMode();
                                    }}
                                    className="flex items-center px-4 py-2 text-sm text-white bg-transparent border !border-gray-500 hover:bg-[#222222] focus:border-gray-500 active:border-gray-500 rounded-full transition-colors cursor-pointer"
                                    aria-label="Cancel editing"
                                >
                                    <X size={16} className="mr-2" />
                                    Cancel
                                </button>
                            </>
                        ) : activeItem?.status === 'published' && !isEditMode && (
                            <button
                                onClick={onEnableEditMode}
                                className="flex items-center px-4 py-2 text-sm text-white bg-transparent border !border-blue-500 hover:bg-[#222222] focus:border-blue-500 active:border-blue-500 rounded-full transition-colors cursor-pointer"
                                aria-label="Edit item"
                            >
                                <Pencil size={16} className="mr-2" />
                                Edit
                            </button>
                        )}
                    </div>
                </div>

                {/* Dialog Content */}
                <div
                    className="flex-1 overflow-y-auto p-6 dialog-content-editor"
                    onClick={(e) => {
                        // Ensure the click event doesn't bubble up
                        e.stopPropagation();

                        // Only focus the editor if in editable mode
                        if (activeItem?.status !== 'published' || isEditMode) {
                            // Focus the editor
                            focusEditor();
                        }
                    }}
                >
                    {activeItem?.type === 'material' ? (
                        <DynamicLearningMaterialEditor
                            readOnly={activeItem.status === 'published' && !isEditMode}
                            showPublishConfirmation={showPublishConfirmation}
                            onPublishConfirm={onPublishConfirm}
                            onPublishCancel={onPublishCancel}
                            taskId={activeItem.id}
                            isEditMode={isEditMode}
                            onPublishSuccess={(updatedData?: TaskData) => {
                                // Handle publish success
                                if (updatedData) {
                                    // Properly update the UI state first
                                    // This will transform the publish button to edit button
                                    if (activeItem && updatedData.status === 'published') {
                                        activeItem.status = 'published';
                                        activeItem.title = updatedData.title;

                                        if (updatedData.blocks) {
                                            // @ts-ignore - types may not perfectly match
                                            activeItem.content = updatedData.blocks;
                                        }
                                    }

                                    // Update will be handled by the parent component
                                    onPublishConfirm();
                                }
                                // Hide the publish confirmation dialog
                                onSetShowPublishConfirmation(false);
                            }}
                            onSaveSuccess={(updatedData?: TaskData) => {
                                // Handle save success - similar to publish success but without status change
                                if (updatedData) {
                                    // Update the activeItem with new title and content
                                    if (activeItem) {
                                        activeItem.title = updatedData.title;

                                        if (updatedData.blocks) {
                                            // @ts-ignore - types may not perfectly match
                                            activeItem.content = updatedData.blocks;
                                        }
                                    }

                                    // Call the parent's save function
                                    onSaveItem();
                                }
                            }}
                        />
                    ) : activeItem?.type === 'quiz' || activeItem?.type === 'exam' ? (
                        <DynamicQuizEditor
                            initialQuestions={(activeItem)?.questions || []}
                            onChange={onQuizContentChange}
                            isPreviewMode={isPreviewMode}
                        />
                    ) : null}
                </div>
            </div>
        </div>
    );
};

export default CourseItemDialog; 