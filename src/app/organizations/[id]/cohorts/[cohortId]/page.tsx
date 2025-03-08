"use client";

import { useState, useEffect } from "react";
import { Header } from "@/components/layout/header";
import { ArrowLeft, Users, BookOpen, Plus, X } from "lucide-react";
import Link from "next/link";

// Define interfaces
interface Course {
    id: number;
    title: string;
    moduleCount: number;
    description?: string;
}

interface Member {
    id: number;
    name: string;
    email: string;
    role: 'teacher' | 'student';
    joinedAt: string;
}

interface Cohort {
    id: number;
    name: string;
    description?: string;
    courses: Course[];
    members: Member[];
}

type TabType = 'courses' | 'members';

export default function CohortPage({ params }: { params: { id: string; cohortId: string } }) {
    const [cohort, setCohort] = useState<Cohort | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<TabType>('courses');
    const [availableCourses, setAvailableCourses] = useState<Course[]>([]);

    // Fetch cohort data
    useEffect(() => {
        const fetchCohort = async () => {
            setLoading(true);
            try {
                // Mock data for now
                const mockCohort: Cohort = {
                    id: parseInt(params.cohortId),
                    name: `Cohort ${params.cohortId}`,
                    description: "This is a sample cohort for demonstration purposes",
                    courses: [
                        {
                            id: 1,
                            title: "Introduction to AI",
                            moduleCount: 5,
                            description: "Learn the fundamentals of artificial intelligence"
                        },
                        {
                            id: 2,
                            title: "Web Development Fundamentals",
                            moduleCount: 8,
                            description: "Master HTML, CSS, and JavaScript"
                        }
                    ],
                    members: [
                        {
                            id: 1,
                            name: "John Doe",
                            email: "john@example.com",
                            role: 'teacher',
                            joinedAt: "2023-01-15"
                        },
                        {
                            id: 2,
                            name: "Jane Smith",
                            email: "jane@example.com",
                            role: 'student',
                            joinedAt: "2023-02-20"
                        },
                        {
                            id: 3,
                            name: "Bob Johnson",
                            email: "bob@example.com",
                            role: 'student',
                            joinedAt: "2023-03-10"
                        }
                    ]
                };

                // Mock available courses that can be added to the cohort
                const mockAvailableCourses: Course[] = [
                    {
                        id: 3,
                        title: "Data Science Basics",
                        moduleCount: 6,
                        description: "Explore data analysis techniques"
                    },
                    {
                        id: 4,
                        title: "UX Design Principles",
                        moduleCount: 4,
                        description: "Understand user experience design"
                    }
                ];

                setCohort(mockCohort);
                setAvailableCourses(mockAvailableCourses);
                setLoading(false);
            } catch (error) {
                console.error("Error fetching cohort:", error);
                setLoading(false);
            }
        };

        fetchCohort();
    }, [params.cohortId, params.id]);

    // Add a course to the cohort
    const addCourse = (course: Course) => {
        if (!cohort) return;

        // Check if course is already in the cohort
        if (cohort.courses.some(c => c.id === course.id)) return;

        // Add the course to the cohort
        setCohort({
            ...cohort,
            courses: [...cohort.courses, course]
        });

        // Remove the course from available courses
        setAvailableCourses(availableCourses.filter(c => c.id !== course.id));
    };

    // Remove a course from the cohort
    const removeCourse = (courseId: number) => {
        if (!cohort) return;

        // Find the course to remove
        const courseToRemove = cohort.courses.find(c => c.id === courseId);
        if (!courseToRemove) return;

        // Remove the course from the cohort
        setCohort({
            ...cohort,
            courses: cohort.courses.filter(c => c.id !== courseId)
        });

        // Add the course back to available courses
        setAvailableCourses([...availableCourses, courseToRemove]);
    };

    // Add a member to the cohort
    const inviteMember = () => {
        if (!cohort) return;

        // In a real app, this would open a dialog to invite a new member
        console.log("Invite new member");

        // For demo purposes, add a mock member
        const newMember: Member = {
            id: Date.now(),
            name: "New Student",
            email: "student@example.com",
            role: 'student',
            joinedAt: new Date().toISOString()
        };

        setCohort({
            ...cohort,
            members: [...cohort.members, newMember]
        });
    };

    // Remove a member from the cohort
    const removeMember = (memberId: number) => {
        if (!cohort) return;

        setCohort({
            ...cohort,
            members: cohort.members.filter(m => m.id !== memberId)
        });
    };

    return (
        <div className="min-h-screen bg-black text-white">
            {/* Use the reusable Header component */}
            <Header />

            {/* Main content */}
            <div className="px-8 py-12">
                <div className="max-w-6xl mx-auto">
                    {/* Back button */}
                    <Link
                        href={`/organizations/${params.id}`}
                        className="inline-flex items-center text-gray-400 hover:text-white mb-6"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Organization
                    </Link>

                    {loading ? (
                        <div className="flex justify-center items-center h-64">
                            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
                        </div>
                    ) : cohort ? (
                        <>
                            {/* Cohort header */}
                            <div className="mb-8">
                                <h1 className="text-4xl font-light mb-2">{cohort.name}</h1>
                                {cohort.description && (
                                    <p className="text-gray-400">{cohort.description}</p>
                                )}
                            </div>

                            {/* Tabs */}
                            <div className="mb-8">
                                <div className="flex border-b border-gray-800">
                                    <button
                                        className={`px-4 py-2 font-light ${activeTab === 'courses' ? 'text-white border-b-2 border-white' : 'text-gray-400 hover:text-white'}`}
                                        onClick={() => setActiveTab('courses')}
                                    >
                                        <div className="flex items-center">
                                            <BookOpen size={16} className="mr-2" />
                                            Courses
                                        </div>
                                    </button>
                                    <button
                                        className={`px-4 py-2 font-light ${activeTab === 'members' ? 'text-white border-b-2 border-white' : 'text-gray-400 hover:text-white'}`}
                                        onClick={() => setActiveTab('members')}
                                    >
                                        <div className="flex items-center">
                                            <Users size={16} className="mr-2" />
                                            Members
                                        </div>
                                    </button>
                                </div>
                            </div>

                            {/* Tab content */}
                            <div>
                                {/* Courses Tab */}
                                {activeTab === 'courses' && (
                                    <div>
                                        <div className="flex justify-between items-center mb-6">
                                            <h2 className="text-2xl font-light">Courses in this Cohort</h2>
                                        </div>

                                        {cohort.courses.length > 0 ? (
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                                                {cohort.courses.map(course => (
                                                    <div
                                                        key={course.id}
                                                        className="border border-gray-800 rounded-lg p-6 hover:border-gray-700 transition-colors relative group"
                                                    >
                                                        <button
                                                            className="absolute top-2 right-2 p-1 text-gray-500 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
                                                            onClick={() => removeCourse(course.id)}
                                                            aria-label="Remove course from cohort"
                                                        >
                                                            <X size={16} />
                                                        </button>
                                                        <h3 className="text-xl font-light mb-2">{course.title}</h3>
                                                        <p className="text-gray-400 text-sm mb-4">{course.description}</p>
                                                        <div className="flex justify-between items-center">
                                                            <span className="text-sm text-gray-400">{course.moduleCount} modules</span>
                                                            <Link
                                                                href={`/courses/${course.id}`}
                                                                className="text-sm text-white hover:underline"
                                                            >
                                                                View Course
                                                            </Link>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-center py-8 mb-8 border border-gray-800 rounded-lg">
                                                <p className="text-gray-400 mb-4">No courses in this cohort yet</p>
                                            </div>
                                        )}

                                        {/* Available courses to add */}
                                        <div className="mt-8">
                                            <h3 className="text-xl font-light mb-4">Add Courses to Cohort</h3>

                                            {availableCourses.length > 0 ? (
                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                                    {availableCourses.map(course => (
                                                        <div
                                                            key={course.id}
                                                            className="border border-gray-800 rounded-lg p-6 hover:border-gray-700 transition-colors"
                                                        >
                                                            <h3 className="text-xl font-light mb-2">{course.title}</h3>
                                                            <p className="text-gray-400 text-sm mb-4">{course.description}</p>
                                                            <div className="flex justify-between items-center">
                                                                <span className="text-sm text-gray-400">{course.moduleCount} modules</span>
                                                                <button
                                                                    className="flex items-center text-sm text-white hover:underline"
                                                                    onClick={() => addCourse(course)}
                                                                >
                                                                    <Plus size={14} className="mr-1" />
                                                                    Add to Cohort
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="text-center py-8 border border-gray-800 rounded-lg">
                                                    <p className="text-gray-400">No more courses available to add</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Members Tab */}
                                {activeTab === 'members' && (
                                    <div>
                                        <div className="flex justify-between items-center mb-6">
                                            <h2 className="text-2xl font-light">Members in this Cohort</h2>
                                            <button
                                                className="px-6 py-2 bg-white text-black text-sm font-medium rounded-full hover:opacity-90 transition-opacity focus:outline-none cursor-pointer"
                                                onClick={inviteMember}
                                            >
                                                Invite Members
                                            </button>
                                        </div>

                                        {cohort.members.length > 0 ? (
                                            <div className="overflow-x-auto">
                                                <table className="w-full">
                                                    <thead>
                                                        <tr className="border-b border-gray-800">
                                                            <th className="text-left py-3 px-4 font-light">Name</th>
                                                            <th className="text-left py-3 px-4 font-light">Email</th>
                                                            <th className="text-left py-3 px-4 font-light">Role</th>
                                                            <th className="text-left py-3 px-4 font-light">Joined</th>
                                                            <th className="text-right py-3 px-4 font-light">Actions</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {cohort.members.map(member => (
                                                            <tr key={member.id} className="border-b border-gray-800 hover:bg-[#111111]">
                                                                <td className="py-3 px-4">{member.name}</td>
                                                                <td className="py-3 px-4">{member.email}</td>
                                                                <td className="py-3 px-4">
                                                                    <span className={`px-2 py-1 rounded-full text-xs ${member.role === 'teacher' ? 'bg-purple-900 text-purple-100' : 'bg-gray-800 text-gray-300'}`}>
                                                                        {member.role === 'teacher' ? 'Teacher' : 'Student'}
                                                                    </span>
                                                                </td>
                                                                <td className="py-3 px-4">{new Date(member.joinedAt).toLocaleDateString()}</td>
                                                                <td className="py-3 px-4 text-right">
                                                                    <button
                                                                        className="text-sm text-gray-400 hover:text-white"
                                                                        onClick={() => removeMember(member.id)}
                                                                    >
                                                                        Remove
                                                                    </button>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        ) : (
                                            <div className="text-center py-8 border border-gray-800 rounded-lg">
                                                <p className="text-gray-400 mb-4">No members in this cohort yet</p>
                                                <button
                                                    className="px-6 py-2 bg-white text-black text-sm font-medium rounded-full hover:opacity-90 transition-opacity focus:outline-none cursor-pointer"
                                                    onClick={inviteMember}
                                                >
                                                    Invite Members
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="text-center py-12">
                            <h2 className="text-2xl font-medium mb-2">Cohort not found</h2>
                            <p className="text-gray-400 mb-6">The cohort you're looking for doesn't exist or you don't have access</p>
                            <Link
                                href={`/organizations/${params.id}`}
                                className="px-6 py-3 bg-white text-black text-sm font-medium rounded-full hover:opacity-90 transition-opacity inline-block"
                            >
                                Back to Organization
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
} 