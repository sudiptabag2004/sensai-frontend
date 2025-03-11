"use client";

import React, { useState } from 'react';
import { X } from 'lucide-react';

interface CreateCourseDialogProps {
    open: boolean;
    onClose: () => void;
    onCreateCourse: (name: string) => Promise<void>;
}

export default function CreateCourseDialog({ open, onClose, onCreateCourse }: CreateCourseDialogProps) {
    const [courseName, setCourseName] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async () => {
        // Validate course name
        if (!courseName.trim()) {
            setError('Course name is required');
            return;
        }

        try {
            setIsLoading(true);
            await onCreateCourse(courseName);
            setCourseName('');
            setError('');
            // Dialog will be closed by parent component after successful API call
        } catch (err) {
            setError('Failed to create course. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div
                className="w-full max-w-md bg-[#1A1A1A] rounded-lg shadow-2xl border border-gray-800"
                onClick={e => e.stopPropagation()}
            >
                {/* Dialog Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-800">
                    <h2 className="text-xl font-light text-white">Create Course</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white transition-colors focus:outline-none cursor-pointer"
                        disabled={isLoading}
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Dialog Content */}
                <div className="p-6">
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="courseName" className="block text-sm text-gray-400 mb-1">
                                Course Name
                            </label>
                            <input
                                id="courseName"
                                type="text"
                                value={courseName}
                                onChange={(e) => {
                                    setCourseName(e.target.value);
                                    if (error) setError('');
                                }}
                                placeholder="Enter course name"
                                className={`w-full px-4 py-2 bg-[#111] border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-gray-700 cursor-text ${error ? 'border-red-500' : 'border-gray-800'}`}
                                disabled={isLoading}
                            />
                            {error && (
                                <p className="mt-1 text-sm text-red-500">{error}</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Dialog Footer */}
                <div className="flex justify-end gap-4 p-6 border-t border-gray-800">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-gray-400 hover:text-white transition-colors focus:outline-none cursor-pointer"
                        disabled={isLoading}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        className={`px-6 py-2 bg-white text-black text-sm font-medium rounded-full hover:opacity-90 transition-opacity focus:outline-none cursor-pointer ${isLoading ? 'opacity-70' : ''}`}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <span className="flex items-center justify-center">
                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Creating...
                            </span>
                        ) : 'Create'}
                    </button>
                </div>
            </div>
        </div>
    );
} 