"use client";

import "@blocknote/core/fonts/inter.css";
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import "@blocknote/mantine/style.css";
import { useEffect, useRef } from "react";

// Add custom styles for dark mode
import "./editor-styles.css";

interface LearningMaterialEditorProps {
    initialContent?: any[];
    onChange?: (content: any[]) => void;
    isDarkMode?: boolean;
    className?: string;
}

export default function LearningMaterialEditor({
    initialContent = [],
    onChange,
    isDarkMode = true, // Default to dark mode
    className = "",
}: LearningMaterialEditorProps) {
    const editorContainerRef = useRef<HTMLDivElement>(null);

    // Creates a new editor instance
    const editor = useCreateBlockNote({
        initialContent: initialContent.length > 0 ? initialContent : undefined,
    });

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
        // Get all elements with contentEditable=true outside the editor
        const makeElementsNonStealingFocus = () => {
            // Find all contentEditable elements in the document
            const editableElements = document.querySelectorAll('[contenteditable="true"]');

            // For each editable element outside our editor
            editableElements.forEach(element => {
                if (!editorContainerRef.current?.contains(element)) {
                    // Add a data attribute to mark it
                    element.setAttribute('data-original-contenteditable', 'true');
                    // Make it non-editable
                    element.setAttribute('contenteditable', 'false');
                }
            });
        };

        // Call immediately and then set up an interval to keep checking
        makeElementsNonStealingFocus();
        const intervalId = setInterval(makeElementsNonStealingFocus, 500);

        return () => {
            clearInterval(intervalId);
            // Restore original contentEditable values
            document.querySelectorAll('[data-original-contenteditable="true"]').forEach(element => {
                element.setAttribute('contenteditable', 'true');
            });
        };
    }, []);

    return (
        <div
            ref={editorContainerRef}
            className={`h-full dark-editor-container dark-dialog ${className}`}
        >
            <BlockNoteView
                editor={editor}
                theme="dark" // Force dark theme
                className="dark-editor" // Add a class for additional styling
            />
        </div>
    );
}