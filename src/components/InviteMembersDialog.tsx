"use client";

import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';

interface InviteMembersDialogProps {
    open: boolean;
    onClose: () => void;
    onInvite: (emails: string[]) => void;
}

export default function InviteMembersDialog({ open, onClose, onInvite }: InviteMembersDialogProps) {
    const [emailRows, setEmailRows] = useState<string[]>(['']);
    const [errors, setErrors] = useState<string[]>(['']);
    const [showErrors, setShowErrors] = useState(false);

    // Reset state when dialog is opened
    useEffect(() => {
        if (open) {
            setEmailRows(['']);
            setErrors(['']);
            setShowErrors(false);
        }
    }, [open]);

    // Email validation regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    const validateEmail = (email: string): boolean => {
        return emailRegex.test(email);
    };

    const validateAllEmails = () => {
        return emailRows.map(email => {
            if (!email.trim()) return 'Email is required';
            if (!validateEmail(email)) return 'Please enter a valid email';
            return '';
        });
    };

    const handleEmailChange = (index: number, value: string) => {
        const newEmails = [...emailRows];
        newEmails[index] = value;
        setEmailRows(newEmails);

        // Clear errors when user starts typing again
        if (showErrors) {
            const newErrors = validateAllEmails();
            setErrors(newErrors);
        }
    };

    const addEmailRow = () => {
        setEmailRows([...emailRows, '']);
        setErrors([...errors, '']);
    };

    const removeEmailRow = (index: number) => {
        const newEmails = emailRows.filter((_, i) => i !== index);
        const newErrors = errors.filter((_, i) => i !== index);
        setEmailRows(newEmails);
        setErrors(newErrors);
    };

    const handleSubmit = () => {
        // Validate all emails
        const newErrors = validateAllEmails();
        setErrors(newErrors);
        setShowErrors(true);

        // If there are any errors, don't proceed
        if (newErrors.some(error => error)) {
            return;
        }

        // Filter out any empty emails and submit
        const validEmails = emailRows.filter(email => email.trim() && validateEmail(email));
        onInvite(validEmails);
        onClose();
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div
                className="w-full max-w-2xl bg-[#1A1A1A] rounded-lg shadow-2xl border border-gray-800"
                onClick={e => e.stopPropagation()}
            >
                {/* Dialog Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-800">
                    <h2 className="text-xl font-light text-white">Invite Members</h2>
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
                        {emailRows.map((email, index) => (
                            <div key={index} className="flex items-start gap-2">
                                <div className="flex-1">
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => handleEmailChange(index, e.target.value)}
                                        placeholder="Enter email address"
                                        className={`w-full px-4 py-2 bg-[#111] border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-gray-700 cursor-text ${showErrors && errors[index] ? 'border-red-500' : 'border-gray-800'
                                            }`}
                                    />
                                    {showErrors && errors[index] && (
                                        <p className="mt-1 text-sm text-red-500">{errors[index]}</p>
                                    )}
                                </div>
                                {emailRows.length > 1 && (
                                    <button
                                        onClick={() => removeEmailRow(index)}
                                        className="p-2 text-gray-400 hover:text-white transition-colors focus:outline-none cursor-pointer"
                                    >
                                        <Trash2 size={20} />
                                    </button>
                                )}
                            </div>
                        ))}
                        <button
                            onClick={addEmailRow}
                            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors focus:outline-none cursor-pointer"
                        >
                            <Plus size={20} />
                            <span>Add another email</span>
                        </button>
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
                        Send Invites
                    </button>
                </div>
            </div>
        </div>
    );
} 