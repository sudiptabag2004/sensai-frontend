"use client";

import { useState, useEffect } from "react";
import { Header } from "@/components/layout/header";
import { Users, BookOpen, Layers, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Learner {
    id: number;
    email: string;
}

interface Mentor {
    id: number;
    email: string;
}

interface Cohort {
    id: number;
    name: string;
    learners: Learner[];
    mentors: Mentor[];
}

type TabType = 'learners' | 'mentors';

interface ClientCohortPageProps {
    schoolId: string;
    cohortId: string;
}

export default function ClientCohortPage({ schoolId, cohortId }: ClientCohortPageProps) {
    const router = useRouter();

    console.log("Props received - schoolId:", schoolId, "cohortId:", cohortId); // Debug log

    const [cohort, setCohort] = useState<Cohort | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<TabType>('learners');

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

                // Fetch learners and mentors (assuming these endpoints exist)
                // In a real app, you would fetch these from appropriate endpoints
                // For now, we'll use empty arrays
                const transformedCohort: Cohort = {
                    id: cohortData.id || parseInt(cohortId),
                    name: cohortData.name || "Unnamed Cohort",
                    learners: cohortData.learners || [],
                    mentors: cohortData.mentors || []
                };

                console.log("Transformed cohort:", transformedCohort);

                setCohort(transformedCohort);
                setLoading(false);
            } catch (error) {
                console.error("Error fetching cohort:", error);
                // Create a fallback cohort with the ID we have
                setCohort({
                    id: parseInt(cohortId),
                    name: "Cohort (Data Unavailable)",
                    learners: [],
                    mentors: []
                });
                setLoading(false);
            }
        };

        fetchCohort();
    }, [cohortId]);

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

                        {/* Tabs for navigation */}
                        <div className="mb-8">
                            <div className="flex border-b border-gray-800">
                                <button
                                    className={`px-4 py-2 font-light cursor-pointer ${activeTab === 'learners' ? 'text-white border-b-2 border-white' : 'text-gray-400 hover:text-white'}`}
                                    onClick={() => setActiveTab('learners')}
                                >
                                    <div className="flex items-center">
                                        <Users size={16} className="mr-2" />
                                        Learners
                                    </div>
                                </button>
                                <button
                                    className={`px-4 py-2 font-light cursor-pointer ${activeTab === 'mentors' ? 'text-white border-b-2 border-white' : 'text-gray-400 hover:text-white'}`}
                                    onClick={() => setActiveTab('mentors')}
                                >
                                    <div className="flex items-center">
                                        <BookOpen size={16} className="mr-2" />
                                        Mentors
                                    </div>
                                </button>
                            </div>
                        </div>

                        {/* Tab content */}
                        <div>
                            {/* Learners Tab */}
                            {activeTab === 'learners' && (
                                <div>
                                    <div className="flex justify-between items-center mb-6">
                                        <div className="w-1"></div> {/* Empty div to maintain spacing */}
                                        <button
                                            className="px-6 py-2 bg-white text-black text-sm font-medium rounded-full hover:opacity-90 transition-opacity focus:outline-none cursor-pointer"
                                            onClick={() => {
                                                // In a real app, this would open a dialog to add learners
                                                console.log("Add learners");
                                            }}
                                        >
                                            Add Learners
                                        </button>
                                    </div>

                                    {cohort.learners.length > 0 ? (
                                        <div className="overflow-hidden rounded-lg border border-gray-800">
                                            <table className="min-w-full divide-y divide-gray-800">
                                                <thead className="bg-gray-900">
                                                    <tr>
                                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Email</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="bg-[#111] divide-y divide-gray-800">
                                                    {cohort.learners.map(learner => (
                                                        <tr key={learner.id}>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{learner.email}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center py-20">
                                            <h2 className="text-4xl font-light mb-4">No learners yet</h2>
                                            <p className="text-gray-400 mb-8">Add learners to this cohort to get started</p>
                                            <button
                                                className="px-6 py-2 bg-white text-black text-sm font-medium rounded-full hover:opacity-90 transition-opacity focus:outline-none cursor-pointer"
                                                onClick={() => {
                                                    // In a real app, this would open a dialog to add learners
                                                    console.log("Add learners");
                                                }}
                                            >
                                                Add Learners
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Mentors Tab */}
                            {activeTab === 'mentors' && (
                                <div>
                                    <div className="flex justify-between items-center mb-6">
                                        <div className="w-1"></div> {/* Empty div to maintain spacing */}
                                        <button
                                            className="px-6 py-2 bg-white text-black text-sm font-medium rounded-full hover:opacity-90 transition-opacity focus:outline-none cursor-pointer"
                                            onClick={() => {
                                                // In a real app, this would open a dialog to add mentors
                                                console.log("Add mentors");
                                            }}
                                        >
                                            Add Mentors
                                        </button>
                                    </div>

                                    {cohort.mentors.length > 0 ? (
                                        <div className="overflow-hidden rounded-lg border border-gray-800">
                                            <table className="min-w-full divide-y divide-gray-800">
                                                <thead className="bg-gray-900">
                                                    <tr>
                                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Email</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="bg-[#111] divide-y divide-gray-800">
                                                    {cohort.mentors.map(mentor => (
                                                        <tr key={mentor.id}>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{mentor.email}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center py-20">
                                            <h2 className="text-4xl font-light mb-4">No mentors yet</h2>
                                            <p className="text-gray-400 mb-8">Add mentors to this cohort to get started</p>
                                            <button
                                                className="px-6 py-2 bg-white text-black text-sm font-medium rounded-full hover:opacity-90 transition-opacity focus:outline-none cursor-pointer"
                                                onClick={() => {
                                                    // In a real app, this would open a dialog to add mentors
                                                    console.log("Add mentors");
                                                }}
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
        </>
    );
} 