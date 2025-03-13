"use client";

import "@blocknote/core/fonts/inter.css";
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import "@blocknote/mantine/style.css";
import { useEffect, useRef, useState } from "react";
import { BlockNoteSchema, defaultBlockSpecs } from "@blocknote/core";

// Add custom styles for dark mode
import "./editor-styles.css";

interface BlockNoteEditorProps {
    initialContent?: any[];
    onChange?: (content: any[]) => void;
    isDarkMode?: boolean;
    className?: string;
    readOnly?: boolean;
    onEditorReady?: (editor: any) => void;
}

// Uploads a file and returns the URL to the uploaded file
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

export default function BlockNoteEditor({
    initialContent = [],
    onChange,
    isDarkMode = true, // Default to dark mode
    className = "",
    readOnly = false,
    onEditorReady,
}: BlockNoteEditorProps) {
    const editorContainerRef = useRef<HTMLDivElement>(null);
    // Track if we're currently updating the editor content
    const isUpdatingContent = useRef(false);
    // Store the last content to avoid unnecessary updates
    const lastContent = useRef<any[]>([]);
    // Store the editor instance in a ref
    const editorRef = useRef<any>(null);

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

    // Store the editor instance in a ref for later use
    useEffect(() => {
        if (editor) {
            editorRef.current = editor;
        }
    }, [editor]);

    // Provide the editor instance to the parent component if onEditorReady is provided
    useEffect(() => {
        if (onEditorReady && editor) {
            onEditorReady(editor);
        }
    }, [editor, onEditorReady]);

    // Update editor content when initialContent changes
    useEffect(() => {
        if (editor && initialContent && initialContent.length > 0) {
            // Set flag to prevent triggering onChange during programmatic update
            isUpdatingContent.current = true;

            try {
                // Only replace blocks if the content has actually changed
                const currentContentStr = JSON.stringify(editor.document);
                const newContentStr = JSON.stringify(initialContent);

                if (currentContentStr !== newContentStr) {
                    editor.replaceBlocks(editor.document, initialContent);
                    lastContent.current = initialContent;
                }
            } catch (error) {
                console.error("Error updating editor content:", error);
            } finally {
                // Reset flag after update
                isUpdatingContent.current = false;
            }
        }
    }, [editor, initialContent]);

    // Handle content changes with debouncing to avoid rapid state updates
    useEffect(() => {
        if (onChange && editor) {
            const handleChange = () => {
                // Prevent handling changes if we're currently updating content
                if (isUpdatingContent.current) return;

                const currentContent = editor.document;
                onChange(currentContent);
            };

            // Add change listener
            editor.onEditorContentChange(handleChange);
        }
    }, [editor, onChange]);

    // This effect prevents the editor from losing focus
    useEffect(() => {
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

    return (
        <div
            ref={editorContainerRef}
            className={`h-full dark-editor-container ${className}`}
        >
            <BlockNoteView
                editor={editor}
                theme={isDarkMode ? "dark" : "light"}
                className={isDarkMode ? "dark-editor" : ""}
                editable={!readOnly}
            />
        </div>
    );
} 