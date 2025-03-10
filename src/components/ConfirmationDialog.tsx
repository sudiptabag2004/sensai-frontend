"use client";

import React from 'react';
import { X } from 'lucide-react';

interface ConfirmationDialogProps {
    open: boolean;
    title: string;
    message: string;
    confirmButtonText: string;
    cancelButtonText?: string;
    onConfirm: () => void;
    onCancel: () => void;
}

export default function ConfirmationDialog({
    open,
    title,
    message,
    confirmButtonText,
    cancelButtonText = "Cancel",
    onConfirm,
    onCancel
}: ConfirmationDialogProps) {
    if (!open) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div
                className="w-full max-w-md bg-[#1A1A1A] rounded-lg shadow-2xl border border-gray-800"
                onClick={e => e.stopPropagation()}
            >
                {/* Dialog Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-800">
                    <h2 className="text-xl font-light text-white">{title}</h2>
                    <button
                        onClick={onCancel}
                        className="text-gray-400 hover:text-white transition-colors focus:outline-none cursor-pointer"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Dialog Content */}
                <div className="p-6">
                    <p className="text-gray-300">{message}</p>
                </div>

                {/* Dialog Footer */}
                <div className="flex justify-end gap-4 p-6 border-t border-gray-800">
                    <button
                        onClick={onCancel}
                        className="px-4 py-2 text-gray-400 hover:text-white transition-colors focus:outline-none cursor-pointer"
                    >
                        {cancelButtonText}
                    </button>
                    <button
                        onClick={onConfirm}
                        className="px-6 py-2 bg-red-600 text-white text-sm font-medium rounded-full hover:bg-red-700 transition-colors focus:outline-none cursor-pointer"
                    >
                        {confirmButtonText}
                    </button>
                </div>
            </div>
        </div>
    );
} 