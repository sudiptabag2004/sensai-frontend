"use client";

import "@blocknote/core/fonts/inter.css";
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import "@blocknote/mantine/style.css";
import { useEffect, useRef, useState } from "react";
import { BlockNoteSchema, defaultBlockSpecs } from "@blocknote/core";

// Add custom styles for dark mode
import "./editor-styles.css";

interface LearningMaterialEditorProps {
    initialContent?: any[];
    onChange?: (content: any[]) => void;
    isDarkMode?: boolean;
    className?: string;
    readOnly?: boolean;
    showPublishConfirmation?: boolean;
    onPublishConfirm?: () => void;
    onPublishCancel?: () => void;
    taskId?: string;
    onPublishSuccess?: () => void;
}

interface TaskData {
    id: string;
    title: string;
    blocks: any[];
    status: string;
}

// Uploads a file and returns the URL to the uploaded file
// You can replace this with your own implementation that uploads to your server or cloud storage
async function uploadFile(file: File) {
    // This is a simple example using a temporary file hosting service
    // For production, you should use your own server or a service like AWS S3
    const body = new FormData();
    body.append("file", file);

    try {
        const response = await fetch("https://tmpfiles.org/api/v1/upload", {
            method: "POST",
            body: body,
        });

        const data = await response.json();
        // Transform the URL to directly access the file
        return data.data.url.replace("tmpfiles.org/", "tmpfiles.org/dl/");
    } catch (error) {
        console.error("Error uploading file:", error);
        throw error;
    }
}

export default function LearningMaterialEditor({
    initialContent = [],
    onChange,
    isDarkMode = true, // Default to dark mode
    className = "",
    readOnly = false,
    showPublishConfirmation = false,
    onPublishConfirm,
    onPublishCancel,
    taskId,
    onPublishSuccess,
}: LearningMaterialEditorProps) {
    const editorContainerRef = useRef<HTMLDivElement>(null);
    const [isPublishing, setIsPublishing] = useState(false);
    const [publishError, setPublishError] = useState<string | null>(null);
    const [taskData, setTaskData] = useState<TaskData | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // Remove the advanced blocks from the schema
    // Extract only the blocks we don't want
    const { image, table, video, audio, file, ...basicBlockSpecs } = defaultBlockSpecs;

    // Create a schema with only the basic blocks
    const schema = BlockNoteSchema.create({
        blockSpecs: basicBlockSpecs,
    });

    // Creates a new editor instance with the custom schema
    const editor = useCreateBlockNote({
        initialContent: taskData?.blocks && taskData.blocks.length > 0 ? taskData.blocks :
            initialContent.length > 0 ? initialContent : undefined,
        uploadFile,
        schema, // Use our custom schema with limited blocks
    });

    // Fetch task data when taskId changes
    useEffect(() => {
        if (taskId) {
            const fetchTaskData = async () => {
                setIsLoading(true);
                try {
                    const response = await fetch(`http://localhost:8001/tasks/${taskId}`);
                    if (!response.ok) {
                        throw new Error(`Failed to fetch task: ${response.status}`);
                    }

                    const data = await response.json();
                    setTaskData(data);

                    // If we have blocks from the API, use them
                    if (data.blocks && data.blocks.length > 0 && editor) {
                        try {
                            editor.replaceBlocks(editor.document, data.blocks);
                        } catch (error) {
                            console.error("Error updating editor content:", error);
                        }
                    }
                } catch (error) {
                    console.error("Error fetching task data:", error);
                } finally {
                    setIsLoading(false);
                }
            };

            fetchTaskData();
        }
    }, [taskId]);

    // Reinitialize the editor content when initialContent changes
    useEffect(() => {
        if (initialContent && initialContent.length > 0 && editor && !taskData) {
            // Only replace content if it's different to avoid unnecessary rerenders
            const currentContent = editor.document;
            const contentChanged = JSON.stringify(currentContent) !== JSON.stringify(initialContent);

            if (contentChanged) {
                try {
                    // Replace the editor content with the new content
                    editor.replaceBlocks(editor.document, initialContent);
                    console.log("Editor content updated with new initialContent");
                } catch (error) {
                    console.error("Error updating editor content:", error);
                }
            }
        }
    }, [editor, initialContent, taskData]);

    // Handle content changes
    useEffect(() => {
        if (onChange && !isPublishing) {
            const handleChange = () => {
                // Don't trigger onChange during publishing to prevent update loops
                if (!isPublishing) {
                    onChange(editor.document);
                }
            };

            // Add change listener
            editor.onEditorContentChange(handleChange);

            // Return cleanup function
            return () => {
                // We can't remove the listener directly, but we can use the isPublishing flag
                // to prevent updates when needed
            };
        }
    }, [editor, onChange, isPublishing]);

    // This effect prevents the editor from losing focus
    useEffect(() => {
        // We don't need to disable other contentEditable elements
        // This was causing the issue where users couldn't edit titles/names

        // Just ensure our editor doesn't lose focus unexpectedly
        const handleClickOutside = (event: MouseEvent) => {
            // Only handle if editor has focus and click is outside editor
            const target = event.target as Node;
            if (document.activeElement &&
                editorContainerRef.current &&
                editorContainerRef.current.contains(document.activeElement) &&
                !editorContainerRef.current.contains(target)) {

                // Check if it's an intentional click on an input element
                if (target instanceof Element) {
                    const isFormElement =
                        target.tagName === 'INPUT' ||
                        target.tagName === 'TEXTAREA' ||
                        target.tagName === 'SELECT' ||
                        target.hasAttribute('contenteditable');

                    // If clicking on a form element, don't prevent focus change
                    if (isFormElement) {
                        return;
                    }
                }
            }
        };

        document.addEventListener('mousedown', handleClickOutside);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleConfirmPublish = async () => {
        if (!taskId) {
            console.error("Cannot publish: taskId is not provided");
            setPublishError("Cannot publish: Task ID is missing");
            return;
        }

        setIsPublishing(true);
        setPublishError(null);

        try {
            // Make POST request to publish the learning material
            const response = await fetch(`http://localhost:8001/tasks/${taskId}/learning_material`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    blocks: editor.document
                }),
            });

            if (!response.ok) {
                throw new Error(`Failed to publish learning material: ${response.status}`);
            }

            // Get the updated task data from the response
            const updatedTaskData = await response.json();

            // Update our local state with the new data
            setTaskData(updatedTaskData);

            console.log("Learning material published successfully");

            // First set publishing to false to avoid state updates during callbacks
            setIsPublishing(false);

            // Call the original onPublishConfirm callback if provided
            if (onPublishConfirm) {
                onPublishConfirm();
            }

            // Call the onPublishSuccess callback if provided
            // This should be the last operation as it might trigger UI changes
            if (onPublishSuccess) {
                // Use setTimeout to break the current render cycle
                setTimeout(() => {
                    onPublishSuccess();
                }, 0);
            }
        } catch (error) {
            console.error("Error publishing learning material:", error);
            setPublishError(error instanceof Error ? error.message : "Failed to publish learning material");
            setIsPublishing(false);
        }
    };

    const handleCancelPublish = () => {
        setPublishError(null);
        if (onPublishCancel) {
            onPublishCancel();
        }
    };

    if (isLoading) {
        return (
            <div className="h-full flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
            </div>
        );
    }

    return (
        <div
            ref={editorContainerRef}
            className={`h-full dark-editor-container dark-dialog no-bottom-border ${className}`}
        >
            <BlockNoteView
                editor={editor}
                theme="dark" // Force dark theme
                className="dark-editor" // Add a class for additional styling
                editable={!readOnly}
            />

            {/* Publish Confirmation Dialog */}
            {showPublishConfirmation && (
                <div className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="w-full max-w-md bg-[#1A1A1A] rounded-lg shadow-2xl border border-gray-800">
                        <div className="p-6">
                            <h2 className="text-xl font-light text-white mb-4">Ready to publish?</h2>
                            <p className="text-gray-300">Make sure your content is complete and reviewed for errors before publishing</p>
                            {publishError && (
                                <p className="mt-4 text-red-400 text-sm">{publishError}</p>
                            )}
                        </div>
                        <div className="flex justify-end gap-4 p-6 border-t border-gray-800">
                            <button
                                onClick={handleCancelPublish}
                                className="px-4 py-2 text-gray-400 hover:text-white transition-colors focus:outline-none cursor-pointer"
                                disabled={isPublishing}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirmPublish}
                                className={`px-6 py-2 bg-green-600 text-white text-sm font-medium rounded-full hover:bg-green-700 transition-colors focus:outline-none cursor-pointer ${isPublishing ? 'opacity-70' : ''}`}
                                disabled={isPublishing}
                            >
                                {isPublishing ? (
                                    <div className="flex items-center justify-center">
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                        <span>Publish Now</span>
                                    </div>
                                ) : 'Publish Now'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}