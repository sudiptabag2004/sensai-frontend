"use client";

import "@blocknote/core/fonts/inter.css";
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import "@blocknote/mantine/style.css";
import { useEffect, useRef, useState } from "react";
import { BlockNoteSchema, defaultBlockSpecs } from "@blocknote/core";

// Add custom styles for dark mode
import "./editor-styles.css";

// Import the BlockNoteEditor component
import BlockNoteEditor from "./BlockNoteEditor";

interface LearningMaterialEditorProps {
    onChange?: (content: any[]) => void;
    isDarkMode?: boolean;
    className?: string;
    readOnly?: boolean;
    showPublishConfirmation?: boolean;
    onPublishConfirm?: () => void;
    onPublishCancel?: () => void;
    taskId?: string;
    onPublishSuccess?: (updatedData?: TaskData) => void;
    onSaveSuccess?: (updatedData?: TaskData) => void;
    isEditMode?: boolean;
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
    onChange,
    isDarkMode = true, // Default to dark mode
    className = "",
    readOnly = false,
    showPublishConfirmation = false,
    onPublishConfirm,
    onPublishCancel,
    taskId,
    onPublishSuccess,
    onSaveSuccess,
    isEditMode = false,
}: LearningMaterialEditorProps) {
    const editorContainerRef = useRef<HTMLDivElement>(null);
    const [isPublishing, setIsPublishing] = useState(false);
    const [publishError, setPublishError] = useState<string | null>(null);
    const [taskData, setTaskData] = useState<TaskData | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [editorContent, setEditorContent] = useState<any[]>([]);

    // Reference to the editor instance
    const editorRef = useRef<any>(null);

    // Add a ref to store the original data for reverting on cancel
    const originalDataRef = useRef<TaskData | null>(null);

    // Function to set the editor reference
    const setEditorInstance = (editor: any) => {
        editorRef.current = editor;
    };

    // Function to open the slash menu
    const openSlashMenu = () => {
        if (editorRef.current && !readOnly) {
            // Use setTimeout to ensure the editor is fully initialized
            setTimeout(() => {
                try {
                    editorRef.current.openSuggestionMenu("/");
                } catch (error) {
                    console.error("Failed to open suggestion menu:", error);
                }
            }, 100);
        }
    };

    // Remove the advanced blocks from the schema
    // Extract only the blocks we don't want
    const { image, table, video, audio, file, ...basicBlockSpecs } = defaultBlockSpecs;

    // Create a schema with only the basic blocks
    const schema = BlockNoteSchema.create({
        blockSpecs: basicBlockSpecs,
    });

    // Creates a new editor instance with the custom schema
    const editor = useCreateBlockNote({
        initialContent: taskData?.blocks && taskData.blocks.length > 0 ? taskData.blocks : undefined,
        uploadFile,
        schema, // Use our custom schema with limited blocks
    });

    // Handle content changes from the editor
    const handleEditorChange = (content: any[]) => {
        // Avoid unnecessary state updates if content hasn't changed
        if (JSON.stringify(content) !== JSON.stringify(editorContent)) {
            setEditorContent(content);
            if (onChange && !isPublishing) {
                onChange(content);
            }
        }
    };

    // Fetch task data when taskId changes
    useEffect(() => {
        if (taskId) {
            setIsLoading(true);

            // Use AbortController to cancel any in-flight requests
            const controller = new AbortController();

            console.log("Fetching task data for taskId:", taskId);
            fetch(`http://localhost:8001/tasks/${taskId}`, {
                signal: controller.signal
            })
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`Failed to fetch task: ${response.status}`);
                    }
                    return response.json();
                })
                .then(data => {
                    // We only use the data fetched from our own API call
                    // Title updates only happen after publishing, not during editing
                    setTaskData(data);

                    // Store the original data for reverting on cancel
                    originalDataRef.current = { ...data };

                    setIsLoading(false);
                })
                .catch(error => {
                    // Ignore AbortError as it's expected when navigating away
                    if (error.name !== 'AbortError') {
                        console.error("Error fetching task data:", error);
                    }
                    setIsLoading(false);
                });

            // Clean up function will abort the fetch if the component unmounts
            // or if the effect runs again (i.e., taskId changes)
            return () => {
                controller.abort();
            };
        }
    }, [taskId]);

    useEffect(() => {
        if (editor && taskData && taskData.blocks && taskData.blocks.length > 0) {
            // Optionally use setTimeout to delay update until editor is fully ready
            setTimeout(() => {
                try {
                    editor.replaceBlocks(editor.document, taskData.blocks);
                } catch (error) {
                    console.error("Error updating editor content:", error);
                }
            }, 0);
        }
    }, [editor, taskData]);

    // Handle cancel in edit mode - revert to original data
    const handleCancel = () => {
        if (!originalDataRef.current) return;

        // Restore the original data
        setTaskData(originalDataRef.current);

        // Return the original title to the dialog header
        const dialogTitleElement = document.querySelector('.dialog-content-editor')?.parentElement?.querySelector('h2');
        if (dialogTitleElement && originalDataRef.current.title) {
            dialogTitleElement.textContent = originalDataRef.current.title;
        }
    };

    const handleConfirmPublish = async () => {
        if (!taskId) {
            console.error("Cannot publish: taskId is not provided");
            setPublishError("Cannot publish: Task ID is missing");
            return;
        }

        setIsPublishing(true);
        setPublishError(null);

        try {
            // Get the current title from the dialog - it may have been edited
            // We'll use the dialog title element ref which is passed from CourseItemDialog
            // This allows us to capture any title changes made in the dialog
            const dialogTitleElement = document.querySelector('.dialog-content-editor')?.parentElement?.querySelector('h2');
            const currentTitle = dialogTitleElement?.textContent || taskData?.title || "";

            // First, update the title if it has changed
            if (currentTitle !== taskData?.title) {
                const titleResponse = await fetch(`http://localhost:8001/tasks/${taskId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        title: currentTitle
                    }),
                });

                if (!titleResponse.ok) {
                    console.warn(`Warning: Failed to update title: ${titleResponse.status}`);
                    // Continue with publishing even if title update fails
                }
            }

            // Use the current editor content
            const currentContent = editorContent.length > 0 ? editorContent : (taskData?.blocks || []);

            // Make POST request to publish the learning material content
            const response = await fetch(`http://localhost:8001/tasks/${taskId}/learning_material`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    title: currentTitle,
                    blocks: currentContent
                }),
            });

            if (!response.ok) {
                throw new Error(`Failed to publish learning material: ${response.status}`);
            }

            // Get the updated task data from the response
            const updatedTaskData = await response.json();

            // Ensure the status is set to 'published' and use the title we just set
            const publishedTaskData = {
                ...updatedTaskData,
                status: 'published',  // Force status to 'published' to ensure UI update
                title: currentTitle   // Use the current title from the dialog
            };

            // Update our local state with the data from the API
            setTaskData(publishedTaskData);

            console.log("Learning material published successfully");

            // First set publishing to false to avoid state updates during callbacks
            setIsPublishing(false);

            // Call the original onPublishConfirm callback if provided
            if (onPublishConfirm) {
                onPublishConfirm();
            }

            // Call the onPublishSuccess callback if provided
            // This is where we emit the updated title and content to parent components
            // This should be the last operation as it might trigger UI changes
            if (onPublishSuccess) {
                // Use setTimeout to break the current render cycle
                setTimeout(() => {
                    onPublishSuccess(publishedTaskData);
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

    // Handle saving changes when in edit mode
    const handleSave = async () => {
        if (!taskId) {
            console.error("Cannot save: taskId is not provided");
            return;
        }

        try {
            // Get the current title from the dialog - it may have been edited
            const dialogTitleElement = document.querySelector('.dialog-content-editor')?.parentElement?.querySelector('h2');
            const currentTitle = dialogTitleElement?.textContent || taskData?.title || "";

            // First, update the title if it has changed
            if (currentTitle !== taskData?.title) {
                const titleResponse = await fetch(`http://localhost:8001/tasks/${taskId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        title: currentTitle
                    }),
                });

                if (!titleResponse.ok) {
                    console.warn(`Warning: Failed to update title: ${titleResponse.status}`);
                }
            }

            // Use the current editor content
            const currentContent = editorContent.length > 0 ? editorContent : (taskData?.blocks || []);

            // Make POST request to update the learning material content, keeping the same status
            const response = await fetch(`http://localhost:8001/tasks/${taskId}/learning_material`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    title: currentTitle,
                    blocks: currentContent
                }),
            });

            if (!response.ok) {
                throw new Error(`Failed to save learning material: ${response.status}`);
            }

            // Get the updated task data from the response
            const updatedTaskData = await response.json();

            // Create updated data with the current title
            const updatedData = {
                ...updatedTaskData,
                title: currentTitle // Use the current title from the dialog
            };

            // Update our local state with the data from the API
            setTaskData(updatedData);

            console.log("Learning material saved successfully");

            // Call the onSaveSuccess callback if provided
            // This is where we emit the updated title and content to parent components
            if (onSaveSuccess) {
                // Use setTimeout to break the current render cycle
                setTimeout(() => {
                    onSaveSuccess(updatedData);
                }, 0);
            }
        } catch (error) {
            console.error("Error saving learning material:", error);
        }
    };

    // Update the content when it changes
    useEffect(() => {
        if (onChange && taskData?.blocks) {
            onChange(taskData.blocks);
        }
    }, [taskData?.blocks, onChange]);

    // Effect to open slash menu on initial load if content is empty
    useEffect(() => {
        if (
            (!taskData?.blocks || taskData.blocks.length === 0 ||
                (taskData.blocks.length === 1 && (!taskData.blocks[0].content || taskData.blocks[0].content.length === 0))) &&
            !readOnly &&
            !isLoading &&
            editorRef.current
        ) {
            // Use a timeout to ensure the editor is fully initialized
            const timer = setTimeout(openSlashMenu, 300);
            return () => clearTimeout(timer);
        }
    }, [taskData, readOnly, isLoading]);

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
            <BlockNoteEditor
                initialContent={taskData?.blocks || []}
                onChange={handleEditorChange}
                isDarkMode={isDarkMode}
                readOnly={readOnly}
                className="dark-editor"
                onEditorReady={setEditorInstance}
            />

            {/* Add refs for the save and cancel functions to be called externally */}
            {isEditMode && (
                <>
                    <div style={{ display: 'none' }} id="save-learning-material" onClick={handleSave} />
                    <div style={{ display: 'none' }} id="cancel-learning-material" onClick={handleCancel} />
                </>
            )}

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