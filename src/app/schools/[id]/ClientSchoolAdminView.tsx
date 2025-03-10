"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Header } from "@/components/layout/header";
import { Edit, Save, Users, BookOpen, Layers, Building, ChevronDown } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import CourseCard from "@/components/CourseCard";
import CohortCard from "@/components/CohortCard";

// Define interfaces
interface Course {
    id: number;
    title: string;
    moduleCount: number;
    description?: string;
}

interface Cohort {
    id: number;
    name: string;
    courseCount: number;
    memberCount: number;
    description?: string;
}

interface Member {
    id: number;
    name: string;
    email: string;
    role: 'admin' | 'member';
    joinedAt: string;
}

interface School {
    id: number;
    name: string;
    url: string;
    courses: Course[];
    cohorts: Cohort[];
    members: Member[];
}

type TabType = 'courses' | 'cohorts' | 'members';

export default function ClientSchoolAdminView({ id }: { id: string }) {
    const router = useRouter();
    const [school, setSchool] = useState<School | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<TabType>('courses');
    const [isEditingName, setIsEditingName] = useState(false);
    const schoolNameRef = useRef<HTMLHeadingElement>(null);

    // Fetch school data
    useEffect(() => {
        const fetchSchool = async () => {
            setLoading(true);
            try {
                // Check if user has a school
                const hasSchool = localStorage.getItem("hasSchool") === "true";
                if (!hasSchool) {
                    router.push("/schools/create");
                    return;
                }

                const response = await fetch(`http://localhost:8001/organizations/${id}`);
                if (!response.ok) {
                    throw new Error(`API error: ${response.status}`);
                }

                const data = await response.json();

                // Transform the API response to match the School interface
                const transformedSchool: School = {
                    id: parseInt(data.id),
                    name: data.name,
                    url: `sensai.hyperverge.org/${data.slug}`,
                    courses: data.courses || [],
                    cohorts: data.cohorts || [],
                    members: data.members || []
                };

                setSchool(transformedSchool);
                setLoading(false);
            } catch (error) {
                console.error("Error fetching school:", error);
                setLoading(false);
            }
        };

        fetchSchool();
    }, [id, router]);

    // Handle clicking outside the name edit field
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (isEditingName && schoolNameRef.current && !schoolNameRef.current.contains(event.target as Node)) {
                setIsEditingName(false);
            }
        }

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isEditingName, schoolNameRef]);

    // Toggle name editing
    const toggleNameEdit = () => {
        setIsEditingName(!isEditingName);
        // Focus the name field when editing is enabled
        if (!isEditingName) {
            setTimeout(() => {
                if (schoolNameRef.current) {
                    schoolNameRef.current.focus();
                    // Place cursor at the end of the text
                    const range = document.createRange();
                    const selection = window.getSelection();
                    range.selectNodeContents(schoolNameRef.current);
                    range.collapse(false);
                    selection?.removeAllRanges();
                    selection?.addRange(range);
                }
            }, 0);
        }
    };

    // Handle name blur
    const handleNameBlur = () => {
        setIsEditingName(false);
        // In a real app, you would save the name change here
        console.log("School name updated:", schoolNameRef.current?.textContent);
    };

    // Handle keyboard events for name editing
    const handleNameKeyDown = (e: React.KeyboardEvent<HTMLHeadingElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            setIsEditingName(false);
            // In a real app, you would save the name change here
            console.log("School name updated:", schoolNameRef.current?.textContent);
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

    if (!school) {
        return (
            <div className="min-h-screen bg-black text-white flex items-center justify-center">
                <p>School not found</p>
            </div>
        );
    }

    return (
        <>
            <Header showCreateCourseButton={false} />
            <div className="min-h-screen bg-black text-white">
                <div className="container mx-auto px-4 py-8">
                    <main>
                        {/* School header with title */}
                        <div className="mb-10">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                    <div className="w-12 h-12 bg-purple-700 rounded-lg flex items-center justify-center mr-4">
                                        <Building size={24} className="text-white" />
                                    </div>
                                    <div>
                                        <div className="flex items-center">
                                            <h1
                                                ref={schoolNameRef}
                                                contentEditable={isEditingName}
                                                suppressContentEditableWarning
                                                className={`text-3xl font-light outline-none ${isEditingName ? 'border-b border-white' : ''}`}
                                                onBlur={handleNameBlur}
                                                onKeyDown={handleNameKeyDown}
                                            >
                                                {school.name}
                                            </h1>
                                            <button
                                                onClick={toggleNameEdit}
                                                className="ml-2 p-2 text-gray-400 hover:text-white"
                                                aria-label={isEditingName ? "Save school name" : "Edit school name"}
                                            >
                                                {isEditingName ? <Save size={16} /> : <Edit size={16} />}
                                            </button>
                                        </div>
                                        <p className="text-gray-400">{school.url}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Tabs for navigation */}
                        <div className="mb-8">
                            <div className="flex border-b border-gray-800">
                                <button
                                    className={`px-4 py-2 font-light cursor-pointer ${activeTab === 'courses' ? 'text-white border-b-2 border-white' : 'text-gray-400 hover:text-white'}`}
                                    onClick={() => setActiveTab('courses')}
                                >
                                    <div className="flex items-center">
                                        <BookOpen size={16} className="mr-2" />
                                        Courses
                                    </div>
                                </button>
                                <button
                                    className={`px-4 py-2 font-light cursor-pointer ${activeTab === 'cohorts' ? 'text-white border-b-2 border-white' : 'text-gray-400 hover:text-white'}`}
                                    onClick={() => setActiveTab('cohorts')}
                                >
                                    <div className="flex items-center">
                                        <Layers size={16} className="mr-2" />
                                        Cohorts
                                    </div>
                                </button>
                                <button
                                    className={`px-4 py-2 font-light cursor-pointer ${activeTab === 'members' ? 'text-white border-b-2 border-white' : 'text-gray-400 hover:text-white'}`}
                                    onClick={() => setActiveTab('members')}
                                >
                                    <div className="flex items-center">
                                        <Users size={16} className="mr-2" />
                                        Team
                                    </div>
                                </button>
                            </div>
                        </div>

                        {/* Tab content */}
                        <div>
                            {/* Courses Tab */}
                            {activeTab === 'courses' && (
                                <div>
                                    {school.courses.length > 0 ? (
                                        <>
                                            <div className="flex justify-between items-center mb-6">
                                                <div className="w-1"></div> {/* Empty div to maintain spacing */}
                                                <Link
                                                    href={`/schools/${id}/courses/create`}
                                                    className="px-6 py-2 bg-white text-black text-sm font-medium rounded-full hover:opacity-90 transition-opacity focus:outline-none cursor-pointer"
                                                >
                                                    Create Course
                                                </Link>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                {school.courses.map(course => (
                                                    <CourseCard key={course.id} course={course} />
                                                ))}
                                            </div>
                                        </>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center py-20">
                                            <h2 className="text-4xl font-light mb-4">What if your next big idea became a course?</h2>
                                            <p className="text-gray-400 mb-8">It might be easier than you think</p>
                                            <Link
                                                href={`/schools/${id}/courses/create`}
                                                className="px-6 py-2 bg-white text-black text-sm font-medium rounded-full hover:opacity-90 transition-opacity focus:outline-none cursor-pointer"
                                            >
                                                Create Course
                                            </Link>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Cohorts Tab */}
                            {activeTab === 'cohorts' && (
                                <div>
                                    {school.cohorts.length > 0 ? (
                                        <>
                                            <div className="flex justify-between items-center mb-6">
                                                <div className="w-1"></div> {/* Empty div to maintain spacing */}
                                                <button
                                                    className="px-6 py-2 bg-white text-black text-sm font-medium rounded-full hover:opacity-90 transition-opacity focus:outline-none cursor-pointer"
                                                    onClick={() => {
                                                        // In a real app, this would open a dialog to create a new cohort
                                                        console.log("Create new cohort");
                                                    }}
                                                >
                                                    Create Cohort
                                                </button>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                {school.cohorts.map(cohort => (
                                                    <CohortCard
                                                        key={cohort.id}
                                                        cohort={cohort}
                                                        schoolId={school.id}
                                                    />
                                                ))}
                                            </div>
                                        </>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center py-20">
                                            <h2 className="text-4xl font-light mb-4">Bring your courses to life with cohorts</h2>
                                            <p className="text-gray-400 mb-8">Create groups of learners and assign them courses to learn together</p>
                                            <button
                                                className="px-6 py-2 bg-white text-black text-sm font-medium rounded-full hover:opacity-90 transition-opacity focus:outline-none cursor-pointer"
                                                onClick={() => {
                                                    // In a real app, this would open a dialog to create a new cohort
                                                    console.log("Create new cohort");
                                                }}
                                            >
                                                Create Cohort
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Team Tab */}
                            {activeTab === 'members' && (
                                <div>
                                    <div className="flex justify-between items-center mb-6">
                                        <div className="w-1"></div> {/* Empty div to maintain spacing */}
                                        <button
                                            className="px-6 py-2 bg-white text-black text-sm font-medium rounded-full hover:opacity-90 transition-opacity focus:outline-none cursor-pointer"
                                            onClick={() => {
                                                // In a real app, this would open a dialog to invite members
                                                console.log("Invite members");
                                            }}
                                        >
                                            Invite Members
                                        </button>
                                    </div>

                                    <div className="overflow-hidden rounded-lg border border-gray-800">
                                        <table className="min-w-full divide-y divide-gray-800">
                                            <thead className="bg-gray-900">
                                                <tr>
                                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Name</th>
                                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Email</th>
                                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Role</th>
                                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Joined</th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-[#111] divide-y divide-gray-800">
                                                {school.members.map(member => (
                                                    <tr key={member.id}>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-white">{member.name}</td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{member.email}</td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                            <span className={`inline-flex items-center px-3 py-0.5 rounded-full text-xs font-medium ${member.role === 'admin' ? 'bg-purple-900 text-purple-200' : 'bg-gray-800 text-gray-300'}`}>
                                                                {member.role === 'admin' ? 'Owner' : 'Admin'}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{member.joinedAt}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>
                    </main>
                </div>
            </div>
        </>
    );
} 