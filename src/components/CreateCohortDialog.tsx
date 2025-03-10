"use client";

import React, { useState } from 'react';
import { X } from 'lucide-react';

interface CreateCohortDialogProps {
    open: boolean;
    onClose: () => void;
    onCreateCohort: (name: string) => void;
}

export default function CreateCohortDialog({ open, onClose, onCreateCohort }: CreateCohortDialogProps) {
    const [cohortName, setCohortName] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = () => {
        // Validate cohort name
        if (!cohortName.trim()) {
            setError('Cohort name is required');
            return;
        }

        onCreateCohort(cohortName);
        setCohortName('');
        setError('');
        onClose();
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
                    <h2 className="text-xl font-light text-white">Create Cohort</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white transition-colors focus:outline-none cursor-pointer"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Dialog Content */}
                <div className="p-6">
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="cohortName" className="block text-sm text-gray-400 mb-1">
                                Cohort Name
                            </label>
                            <input
                                id="cohortName"
                                type="text"
                                value={cohortName}
                                onChange={(e) => {
                                    setCohortName(e.target.value);
                                    if (error) setError('');
                                }}
                                placeholder="Enter cohort name"
                                className={`w-full px-4 py-2 bg-[#111] border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-gray-700 cursor-text ${error ? 'border-red-500' : 'border-gray-800'}`}
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
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        className="px-6 py-2 bg-white text-black text-sm font-medium rounded-full hover:opacity-90 transition-opacity focus:outline-none cursor-pointer"
                    >
                        Create
                    </button>
                </div>
            </div>
        </div>
    );
} 