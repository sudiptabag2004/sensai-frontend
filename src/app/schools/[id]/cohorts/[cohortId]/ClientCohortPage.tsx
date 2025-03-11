"use client";

import { useState, useEffect, useRef } from "react";
import { Header } from "@/components/layout/header";
import { Users, BookOpen, Layers, ArrowLeft, UsersRound, X, Plus, Trash2, Upload, Mail } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ConfirmationDialog from "@/components/ConfirmationDialog";

interface Member {
    id: number;
    email: string;
    role: 'learner' | 'mentor';
}

interface Cohort {
    id: number;
    org_id: number;
    name: string;
    members: Member[];
    groups: any[];
}

interface EmailInput {
    id: string;
    email: string;
    error?: string;
}

type TabType = 'learners' | 'mentors';

interface ClientCohortPageProps {
    schoolId: string;
    cohortId: string;
}

export default function ClientCohortPage({ schoolId, cohortId }: ClientCohortPageProps) {
    const router = useRouter();
    const [tab, setTab] = useState<TabType>('learners');
    const [cohort, setCohort] = useState<Cohort | null>(null);
    const [isAddLearnersOpen, setIsAddLearnersOpen] = useState(false);
    const [isAddMentorsOpen, setIsAddMentorsOpen] = useState(false);
    const [emailInputs, setEmailInputs] = useState<EmailInput[]>([{ id: '1', email: '' }]);
    const [focusedInputId, setFocusedInputId] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
    const [memberToDelete, setMemberToDelete] = useState<{ id: number, email: string, role: 'learner' | 'mentor' } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const inputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

    // Reset email inputs when dialog opens
    useEffect(() => {
        if (isAddLearnersOpen) {
            setEmailInputs([{ id: '1', email: '' }]);
            inputRefs.current = {};
        }
    }, [isAddLearnersOpen]);

    // Update input refs when inputs change
    useEffect(() => {
        const newRefs: { [key: string]: HTMLInputElement | null } = {};
        emailInputs.forEach(input => {
            if (inputRefs.current[input.id]) {
                newRefs[input.id] = inputRefs.current[input.id];
            }
        });
        inputRefs.current = newRefs;
    }, [emailInputs]);

    // Scroll to bottom and focus new input when new email is added
    useEffect(() => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
        }
        // Focus the last input if it exists
        const lastInput = emailInputs[emailInputs.length - 1];
        if (lastInput && focusedInputId === lastInput.id && inputRefs.current[lastInput.id]) {
            inputRefs.current[lastInput.id]?.focus();
        }
    }, [emailInputs.length, focusedInputId]);

    console.log("Props received - schoolId:", schoolId, "cohortId:", cohortId); // Debug log

    const [loading, setLoading] = useState(true);

    // Fetch cohort data
    useEffect(() => {
        console.log("useEffect running with cohortId:", cohortId); // Debug log

        const fetchCohort = async () => {
            if (!cohortId || cohortId === 'undefined') {
                console.error("Invalid cohortId:", cohortId);
                setLoading(false);
                return;
            }

            setLoading(true);
            try {
                // Fetch cohort details
                console.log("Fetching cohort with ID:", cohortId); // Debug log
                const url = `http://localhost:8001/cohorts/${cohortId}`;
                console.log("Fetch URL:", url);

                const cohortResponse = await fetch(url);
                console.log("Response status:", cohortResponse.status);

                if (!cohortResponse.ok) {
                    throw new Error(`API error: ${cohortResponse.status}`);
                }

                const cohortData = await cohortResponse.json();
                console.log("Cohort data received:", cohortData);

                setCohort(cohortData);
                setLoading(false);
            } catch (error) {
                console.error("Error fetching cohort:", error);
                // Create a fallback cohort with the ID we have
                setCohort({
                    id: parseInt(cohortId),
                    name: "Cohort (Data Unavailable)",
                    org_id: 0,
                    members: [],
                    groups: []
                });
                setLoading(false);
            }
        };

        fetchCohort();
    }, [cohortId]);

    // Add function to handle member deletion
    const handleDeleteMember = (member: Member) => {
        setMemberToDelete(member);
        setIsDeleteConfirmOpen(true);
    };

    const confirmDeleteMember = async () => {
        if (!memberToDelete || !cohortId) return;

        try {
            const response = await fetch(`http://localhost:8001/cohorts/${cohortId}/members`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    member_ids: [memberToDelete.id]
                }),
            });

            if (!response.ok) {
                throw new Error(`Failed to delete member: ${response.status}`);
            }

            // Update local state by filtering out the deleted member
            setCohort(prev => prev ? {
                ...prev,
                members: prev.members.filter(member => member.id !== memberToDelete.id)
            } : null);

        } catch (error) {
            console.error('Error deleting member:', error);
            throw error;
        } finally {
            setIsDeleteConfirmOpen(false);
            setMemberToDelete(null);
        }
    };

    // Add function to handle member addition
    const addMembers = async (emails: string[], roles: string[]) => {
        if (!cohortId) return;

        try {
            const response = await fetch(`http://localhost:8001/cohorts/${cohortId}/members`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    emails,
                    roles,
                }),
            });

            if (!response.ok) {
                throw new Error(`Failed to add members: ${response.status}`);
            }

            // Refresh cohort data to get updated members
            const cohortResponse = await fetch(`http://localhost:8001/cohorts/${cohortId}`);
            const cohortData = await cohortResponse.json();
            setCohort({
                ...cohort!,
                members: cohortData.members || [],
            });

        } catch (error) {
            console.error('Error adding members:', error);
            throw error;
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-black text-white">
                <Header showCreateCourseButton={false} />
                <div className="flex justify-center items-center py-12">
                    <div className="w-12 h-12 border-t-2 border-b-2 border-white rounded-full animate-spin"></div>
                </div>
            </div>
        );
    }

    if (!cohort) {
        return (
            <div className="min-h-screen bg-black text-white flex items-center justify-center">
                <p>Cohort not found</p>
            </div>
        );
    }

    return (
        <>
            {/* Global styles to fix blue borders */}
            <style jsx global>{`
                button:focus, 
                input:focus, 
                a:focus,
                div:focus,
                *:focus {
                    outline: none !important;
                    box-shadow: none !important;
                }
                
                input::placeholder {
                    color: #666666 !important;
                }
            `}</style>
            <Header showCreateCourseButton={false} />
            <div className="min-h-screen bg-black text-white">
                <div className="container mx-auto px-4 py-8">
                    <main>
                        {/* Cohort header with title */}
                        <div className="mb-10">
                            <div className="flex flex-col">
                                <Link
                                    href={`/schools/${schoolId}#cohorts`}
                                    className="flex items-center text-gray-400 hover:text-white transition-colors mb-4"
                                >
                                    <ArrowLeft size={16} className="mr-2" />
                                    Back To Cohorts
                                </Link>

                                <div className="flex items-center">
                                    <div className="w-12 h-12 bg-purple-700 rounded-lg flex items-center justify-center mr-4">
                                        <Layers size={24} className="text-white" />
                                    </div>
                                    <div>
                                        <h1 className="text-3xl font-light outline-none">
                                            {cohort.name}
                                        </h1>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Main content without sidebar */}
                        <div className="w-full">
                            {/* Tabs for Learners/Mentors */}
                            <div className="mb-8">
                                <div className="flex border-b border-gray-800">
                                    <button
                                        className={`px-4 py-2 font-light cursor-pointer ${tab === 'learners' ? 'text-white border-b-2 border-white' : 'text-gray-400 hover:text-white'}`}
                                        onClick={() => setTab('learners')}
                                    >
                                        <div className="flex items-center">
                                            <Users size={16} className="mr-2" />
                                            Learners
                                        </div>
                                    </button>
                                    <button
                                        className={`px-4 py-2 font-light cursor-pointer ${tab === 'mentors' ? 'text-white border-b-2 border-white' : 'text-gray-400 hover:text-white'}`}
                                        onClick={() => setTab('mentors')}
                                    >
                                        <div className="flex items-center">
                                            <BookOpen size={16} className="mr-2" />
                                            Mentors
                                        </div>
                                    </button>
                                </div>
                            </div>

                            {/* Learners/Mentors Content */}
                            {tab === 'learners' && (
                                <div>
                                    {cohort?.members?.filter(m => m.role === 'learner').length > 0 && (
                                        <div className="flex justify-between items-center mb-6">
                                            <div className="w-1"></div>
                                            <button
                                                className="px-6 py-2 bg-white text-black text-sm font-medium rounded-full hover:opacity-90 transition-opacity focus:outline-none cursor-pointer"
                                                onClick={() => setIsAddLearnersOpen(true)}
                                            >
                                                Add Learners
                                            </button>
                                        </div>
                                    )}

                                    {cohort?.members?.filter(m => m.role === 'learner').length > 0 ? (
                                        <div className="overflow-hidden rounded-lg border border-gray-800">
                                            <table className="min-w-full divide-y divide-gray-800">
                                                <thead className="bg-gray-900">
                                                    <tr>
                                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Email</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="bg-[#111] divide-y divide-gray-800">
                                                    {cohort?.members?.filter(member => member.role === 'learner').map(learner => (
                                                        <tr key={learner.id}>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300 flex justify-between items-center">
                                                                {learner.email}
                                                                <button
                                                                    onClick={() => handleDeleteMember(learner)}
                                                                    className="text-gray-400 hover:text-white transition-colors focus:outline-none cursor-pointer"
                                                                >
                                                                    <Trash2 size={16} />
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center py-20">
                                            <h2 className="text-4xl font-light mb-4">Start building your cohort</h2>
                                            <p className="text-gray-400 mb-8">Add learners to create an engaging learning community</p>
                                            <button
                                                className="px-6 py-2 bg-white text-black text-sm font-medium rounded-full hover:opacity-90 transition-opacity focus:outline-none cursor-pointer"
                                                onClick={() => setIsAddLearnersOpen(true)}
                                            >
                                                Add Learners
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}

                            {tab === 'mentors' && (
                                <div>
                                    {cohort?.members?.filter(m => m.role === 'mentor').length > 0 && (
                                        <div className="flex justify-between items-center mb-6">
                                            <div className="w-1"></div>
                                            <button
                                                className="px-6 py-2 bg-white text-black text-sm font-medium rounded-full hover:opacity-90 transition-opacity focus:outline-none cursor-pointer"
                                                onClick={() => setIsAddMentorsOpen(true)}
                                            >
                                                Add Mentors
                                            </button>
                                        </div>
                                    )}

                                    {cohort?.members?.filter(m => m.role === 'mentor').length > 0 ? (
                                        <div className="overflow-hidden rounded-lg border border-gray-800">
                                            <table className="min-w-full divide-y divide-gray-800">
                                                <thead className="bg-gray-900">
                                                    <tr>
                                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Email</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="bg-[#111] divide-y divide-gray-800">
                                                    {cohort?.members?.filter(member => member.role === 'mentor').map(mentor => (
                                                        <tr key={mentor.id}>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300 flex justify-between items-center">
                                                                {mentor.email}
                                                                <button
                                                                    onClick={() => handleDeleteMember(mentor)}
                                                                    className="text-gray-400 hover:text-white transition-colors focus:outline-none cursor-pointer"
                                                                >
                                                                    <Trash2 size={16} />
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center py-20">
                                            <h2 className="text-4xl font-light mb-4">Guide your learners</h2>
                                            <p className="text-gray-400 mb-8">Add mentors to support and inspire your learners</p>
                                            <button
                                                className="px-6 py-2 bg-white text-black text-sm font-medium rounded-full hover:opacity-90 transition-opacity focus:outline-none cursor-pointer"
                                                onClick={() => setIsAddMentorsOpen(true)}
                                            >
                                                Add Mentors
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </main>
                </div>
            </div>

            {/* Add Learners Dialog */}
            {isAddLearnersOpen && (
                <div
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
                    onClick={() => setIsAddLearnersOpen(false)}
                >
                    <div
                        className="w-full max-w-2xl bg-[#1A1A1A] rounded-lg shadow-2xl border border-gray-800"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Dialog Header */}
                        <div className="flex flex-col p-6 border-b border-gray-800">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-light text-white">Add Learners</h2>
                                <button
                                    onClick={() => setIsAddLearnersOpen(false)}
                                    className="text-gray-400 hover:text-white transition-colors focus:outline-none cursor-pointer"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                            <p className="text-gray-400 mt-2 text-sm">Invite learners to join your cohort by adding their email address</p>
                        </div>

                        {/* Dialog Content */}
                        <div className="px-6 py-4">
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="flex items-center gap-3 text-gray-400 hover:text-white transition-colors cursor-pointer w-full mb-4 bg-[#0A0A0A] rounded-lg p-4 border border-dashed border-gray-800 hover:border-white hover:bg-[#111] focus:outline-none"
                            >
                                <Upload size={20} className="text-gray-400" />
                                <div className="flex flex-col items-start">
                                    <span className="text-white text-base">Import CSV</span>
                                    <span className="text-gray-400 text-sm">Upload a CSV file with one email per row</span>
                                </div>
                            </button>
                            <input
                                type="file"
                                ref={fileInputRef}
                                accept=".csv"
                                className="hidden"
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                        const reader = new FileReader();
                                        reader.onload = (event) => {
                                            const text = event.target?.result as string;
                                            const emails = text.split(/\r?\n/).filter(email => email.trim());
                                            const newInputs = emails.map((email, index) => ({
                                                id: Math.random().toString(),
                                                email: email.trim(),
                                                error: validateEmail(email.trim()) ? undefined : 'Invalid email'
                                            }));
                                            setEmailInputs(newInputs);
                                        };
                                        reader.readAsText(file);
                                    }
                                }}
                            />

                            <div
                                ref={scrollContainerRef}
                                className="max-h-[300px] overflow-y-auto pr-2 space-y-2 scrollbar-thin scrollbar-thumb-gray-800 scrollbar-track-transparent"
                            >
                                {emailInputs.map((input, index) => (
                                    <div key={input.id} className="flex items-center gap-2">
                                        <div className="flex-1">
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                                                    <Mail
                                                        size={18}
                                                        className={`transition-colors ${focusedInputId === input.id ? 'text-white' : 'text-gray-500'}`}
                                                    />
                                                </div>
                                                <input
                                                    ref={el => {
                                                        inputRefs.current[input.id] = el;
                                                    }}
                                                    type="email"
                                                    value={input.email}
                                                    onChange={(e) => {
                                                        const newInputs = [...emailInputs];
                                                        newInputs[index].email = e.target.value;
                                                        newInputs[index].error = validateEmail(e.target.value) ? undefined : 'Invalid email';
                                                        setEmailInputs(newInputs);
                                                    }}
                                                    onFocus={() => setFocusedInputId(input.id)}
                                                    onBlur={() => setFocusedInputId(null)}
                                                    placeholder="Enter email address"
                                                    className={`w-full bg-[#0A0A0A] pl-10 pr-4 py-3 rounded-lg text-white placeholder-gray-500 focus:outline-none ${input.error && focusedInputId !== input.id
                                                        ? 'border-2 border-red-500'
                                                        : focusedInputId === input.id
                                                            ? 'border border-white'
                                                            : 'border-0'
                                                        } focus:border focus:!border-white focus:ring-0 transition-all duration-0`}
                                                />
                                            </div>
                                            {input.error && focusedInputId !== input.id && (
                                                <p className="text-red-500 text-sm mt-1">{input.error}</p>
                                            )}
                                        </div>
                                        {emailInputs.length > 1 && (
                                            <button
                                                onClick={() => {
                                                    setEmailInputs(emailInputs.filter(e => e.id !== input.id));
                                                }}
                                                className="text-gray-400 hover:text-white transition-colors p-2 cursor-pointer focus:outline-none self-start mt-1.5"
                                            >
                                                <Trash2 size={20} />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>

                            <button
                                onClick={() => {
                                    const newId = Math.random().toString();
                                    setEmailInputs([...emailInputs, { id: newId, email: '' }]);
                                    setFocusedInputId(newId); // Set focus to the new input
                                }}
                                className="flex items-center gap-2 text-gray-400 hover:text-white w-full py-3 px-4 rounded-lg transition-colors mt-4 cursor-pointer focus:outline-none hover:bg-[#111]"
                            >
                                <Plus size={20} />
                                <span>Add another email</span>
                            </button>
                        </div>

                        {/* Dialog Footer */}
                        <div className="flex justify-end gap-4 px-6 py-4 border-t border-gray-800">
                            <button
                                onClick={() => {
                                    setIsAddLearnersOpen(false);
                                    setEmailInputs([{ id: '1', email: '' }]);
                                }}
                                className="px-4 py-2 text-gray-400 hover:text-white transition-colors font-light cursor-pointer focus:outline-none"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={async () => {
                                    // Validate all emails and show errors
                                    const newInputs = emailInputs.map(input => ({
                                        ...input,
                                        error: !input.email.trim() ? 'Email is required' :
                                            !validateEmail(input.email.trim()) ? 'Invalid email' :
                                                undefined
                                    }));
                                    setEmailInputs(newInputs);

                                    // Only proceed if all emails are valid
                                    if (!newInputs.some(input => input.error)) {
                                        const validEmails = newInputs
                                            .filter(input => input.email.trim())
                                            .map(input => input.email.trim());

                                        setIsSubmitting(true);
                                        try {
                                            await addMembers(validEmails, validEmails.map(() => 'learner'));
                                            setIsAddLearnersOpen(false);
                                            setEmailInputs([{ id: '1', email: '' }]);
                                        } catch (error) {
                                            // Handle error (you might want to show an error message to the user)
                                            console.error('Failed to add learners:', error);
                                        } finally {
                                            setIsSubmitting(false);
                                        }
                                    }
                                }}
                                disabled={!emailInputs.some(input => input.email.trim() && !input.error) || isSubmitting}
                                className="px-6 py-2 bg-white text-black text-sm font-medium rounded-full hover:opacity-90 transition-opacity focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                            >
                                {isSubmitting ? 'Adding...' : 'Add'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Mentors Dialog */}
            {isAddMentorsOpen && (
                <div
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
                    onClick={() => setIsAddMentorsOpen(false)}
                >
                    <div
                        className="w-full max-w-2xl bg-[#1A1A1A] rounded-lg shadow-2xl border border-gray-800"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Dialog Header */}
                        <div className="flex flex-col p-6 border-b border-gray-800">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-light text-white">Add Mentors</h2>
                                <button
                                    onClick={() => setIsAddMentorsOpen(false)}
                                    className="text-gray-400 hover:text-white transition-colors focus:outline-none cursor-pointer"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                            <p className="text-gray-400 mt-2 text-sm">Invite mentors to join your cohort by adding their email address</p>
                        </div>

                        {/* Dialog Content */}
                        <div className="px-6 py-4">
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="flex items-center gap-3 text-gray-400 hover:text-white transition-colors cursor-pointer w-full mb-4 bg-[#0A0A0A] rounded-lg p-4 border border-dashed border-gray-800 hover:border-white hover:bg-[#111] focus:outline-none"
                            >
                                <Upload size={20} className="text-gray-400" />
                                <div className="flex flex-col items-start">
                                    <span className="text-white text-base">Import CSV</span>
                                    <span className="text-gray-400 text-sm">Upload a CSV file with one email per row</span>
                                </div>
                            </button>

                            <div
                                ref={scrollContainerRef}
                                className="max-h-[300px] overflow-y-auto pr-2 space-y-2 scrollbar-thin scrollbar-thumb-gray-800 scrollbar-track-transparent"
                            >
                                {emailInputs.map((input, index) => (
                                    <div key={input.id} className="flex items-center gap-2">
                                        <div className="flex-1">
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                                                    <Mail
                                                        size={18}
                                                        className={`transition-colors ${focusedInputId === input.id ? 'text-white' : 'text-gray-500'}`}
                                                    />
                                                </div>
                                                <input
                                                    ref={el => {
                                                        inputRefs.current[input.id] = el;
                                                    }}
                                                    type="email"
                                                    value={input.email}
                                                    onChange={(e) => {
                                                        const newInputs = [...emailInputs];
                                                        newInputs[index].email = e.target.value;
                                                        newInputs[index].error = validateEmail(e.target.value) ? undefined : 'Invalid email';
                                                        setEmailInputs(newInputs);
                                                    }}
                                                    onFocus={() => setFocusedInputId(input.id)}
                                                    onBlur={() => setFocusedInputId(null)}
                                                    placeholder="Enter email address"
                                                    className={`w-full bg-[#0A0A0A] pl-10 pr-4 py-3 rounded-lg text-white placeholder-gray-500 focus:outline-none ${input.error && focusedInputId !== input.id
                                                        ? 'border-2 border-red-500'
                                                        : focusedInputId === input.id
                                                            ? 'border border-white'
                                                            : 'border-0'
                                                        } focus:border focus:!border-white focus:ring-0 transition-all duration-0`}
                                                />
                                            </div>
                                            {input.error && focusedInputId !== input.id && (
                                                <p className="text-red-500 text-sm mt-1">{input.error}</p>
                                            )}
                                        </div>
                                        {emailInputs.length > 1 && (
                                            <button
                                                onClick={() => {
                                                    setEmailInputs(emailInputs.filter(e => e.id !== input.id));
                                                }}
                                                className="text-gray-400 hover:text-white transition-colors p-2 cursor-pointer focus:outline-none self-start mt-1.5"
                                            >
                                                <Trash2 size={20} />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>

                            <button
                                onClick={() => {
                                    const newId = Math.random().toString();
                                    setEmailInputs([...emailInputs, { id: newId, email: '' }]);
                                    setFocusedInputId(newId);
                                }}
                                className="flex items-center gap-2 text-gray-400 hover:text-white w-full py-3 px-4 rounded-lg transition-colors mt-4 cursor-pointer focus:outline-none hover:bg-[#111]"
                            >
                                <Plus size={20} />
                                <span>Add another email</span>
                            </button>
                        </div>

                        {/* Dialog Footer */}
                        <div className="flex justify-end gap-4 px-6 py-4 border-t border-gray-800">
                            <button
                                onClick={() => {
                                    setIsAddMentorsOpen(false);
                                    setEmailInputs([{ id: '1', email: '' }]);
                                }}
                                className="px-4 py-2 text-gray-400 hover:text-white transition-colors font-light cursor-pointer focus:outline-none"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={async () => {
                                    // Validate all emails and show errors
                                    const newInputs = emailInputs.map(input => ({
                                        ...input,
                                        error: !input.email.trim() ? 'Email is required' :
                                            !validateEmail(input.email.trim()) ? 'Invalid email' :
                                                undefined
                                    }));
                                    setEmailInputs(newInputs);

                                    // Only proceed if all emails are valid
                                    if (!newInputs.some(input => input.error)) {
                                        const validEmails = newInputs
                                            .filter(input => input.email.trim())
                                            .map(input => input.email.trim());

                                        setIsSubmitting(true);
                                        try {
                                            await addMembers(validEmails, validEmails.map(() => 'mentor'));
                                            setIsAddMentorsOpen(false);
                                            setEmailInputs([{ id: '1', email: '' }]);
                                        } catch (error) {
                                            // Handle error (you might want to show an error message to the user)
                                            console.error('Failed to add mentors:', error);
                                        } finally {
                                            setIsSubmitting(false);
                                        }
                                    }
                                }}
                                disabled={!emailInputs.some(input => input.email.trim() && !input.error) || isSubmitting}
                                className="px-6 py-2 bg-white text-black text-sm font-medium rounded-full hover:opacity-90 transition-opacity focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                            >
                                {isSubmitting ? 'Adding...' : 'Add'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Confirmation Dialog */}
            <ConfirmationDialog
                open={isDeleteConfirmOpen}
                title={`Remove ${memberToDelete?.role === 'learner' ? 'Learner' : 'Mentor'}`}
                message={`Are you sure you want to remove ${memberToDelete?.email} from this cohort?`}
                confirmButtonText="Remove"
                onConfirm={confirmDeleteMember}
                onCancel={() => setIsDeleteConfirmOpen(false)}
            />
        </>
    );
}

function validateEmail(email: string): boolean {
    if (!email) return true; // Empty email is valid (but will be filtered out)
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
} 