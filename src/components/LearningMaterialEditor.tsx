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
}: LearningMaterialEditorProps) {
    const editorContainerRef = useRef<HTMLDivElement>(null);

    // Remove the advanced blocks from the schema
    // Extract only the blocks we don't want
    const { image, table, video, audio, file, ...basicBlockSpecs } = defaultBlockSpecs;

    // Create a schema with only the basic blocks
    const schema = BlockNoteSchema.create({
        blockSpecs: basicBlockSpecs,
    });

    // Creates a new editor instance with the custom schema
    const editor = useCreateBlockNote({
        initialContent: initialContent.length > 0 ? initialContent : undefined,
        uploadFile,
        schema, // Use our custom schema with limited blocks
    });

    // Reinitialize the editor content when initialContent changes
    useEffect(() => {
        if (initialContent && initialContent.length > 0 && editor) {
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
    }, [editor, initialContent]);

    // Handle content changes
    useEffect(() => {
        if (onChange) {
            const handleChange = () => {
                onChange(editor.document);
            };

            // Add change listener
            editor.onEditorContentChange(handleChange);
        }
    }, [editor, onChange]);

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

    const handleConfirmPublish = () => {
        if (onPublishConfirm) {
            onPublishConfirm();
        }
    };

    const handleCancelPublish = () => {
        if (onPublishCancel) {
            onPublishCancel();
        }
    };

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
                            <p className="text-gray-300">This will make your learning material available to all users. Please ensure all content is complete and reviewed.</p>
                        </div>
                        <div className="flex justify-end gap-4 p-6 border-t border-gray-800">
                            <button
                                onClick={handleCancelPublish}
                                className="px-4 py-2 text-gray-400 hover:text-white transition-colors focus:outline-none cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirmPublish}
                                className="px-6 py-2 bg-green-600 text-white text-sm font-medium rounded-full hover:bg-green-700 transition-colors focus:outline-none cursor-pointer"
                            >
                                Publish Now
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}