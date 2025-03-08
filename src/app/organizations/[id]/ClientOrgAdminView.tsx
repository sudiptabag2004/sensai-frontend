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

interface Workspace {
    id: number;
    name: string;
    type: 'personal' | 'organization';
    role?: 'admin' | 'member';
}

interface Organization {
    id: number;
    name: string;
    courses: Course[];
    cohorts: Cohort[];
    members: Member[];
    defaultSchoolId?: number;
}

type TabType = 'courses' | 'cohorts' | 'members';

export default function ClientOrgAdminView({ id }: { id: string }) {
    const [organization, setOrganization] = useState<Organization | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<TabType>('courses');
    const [isEditingName, setIsEditingName] = useState(false);
    const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
    const [isWorkspaceSelectorOpen, setIsWorkspaceSelectorOpen] = useState(false);
    const orgNameRef = useRef<HTMLHeadingElement>(null);
    const workspaceSelectorRef = useRef<HTMLDivElement>(null);

    // Fetch organization data
    useEffect(() => {
        const fetchOrganization = async () => {
            setLoading(true);
            try {
                // Mock data for now
                const mockOrg: Organization = {
                    id: parseInt(id),
                    name: `Organization ${id}`,
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
                        },
                        {
                            id: 3,
                            title: "Data Science Basics",
                            moduleCount: 6,
                            description: "Explore data analysis techniques"
                        }
                    ],
                    cohorts: [
                        {
                            id: 1,
                            name: "Spring 2023",
                            courseCount: 2,
                            memberCount: 15,
                            description: "Spring semester cohort"
                        },
                        {
                            id: 2,
                            name: "Summer Bootcamp",
                            courseCount: 1,
                            memberCount: 8,
                            description: "Intensive summer program"
                        },
                        {
                            id: 3,
                            name: "Fall 2023",
                            courseCount: 3,
                            memberCount: 20,
                            description: "Fall semester cohort"
                        }
                    ],
                    members: [
                        {
                            id: 1,
                            name: "John Doe",
                            email: "john@example.com",
                            role: 'admin',
                            joinedAt: "2023-01-15"
                        },
                        {
                            id: 2,
                            name: "Jane Smith",
                            email: "jane@example.com",
                            role: 'member',
                            joinedAt: "2023-02-20"
                        },
                        {
                            id: 3,
                            name: "Bob Johnson",
                            email: "bob@example.com",
                            role: 'member',
                            joinedAt: "2023-03-10"
                        }
                    ]
                };

                // Mock workspaces
                const mockWorkspaces: Workspace[] = [
                    {
                        id: 0,
                        name: "Personal Workspace",
                        type: 'personal'
                    },
                    {
                        id: parseInt(id),
                        name: mockOrg.name,
                        type: 'organization',
                        role: 'admin'
                    },
                    {
                        id: 2,
                        name: "Another Organization",
                        type: 'organization',
                        role: 'member'
                    }
                ];

                setOrganization(mockOrg);
                setWorkspaces(mockWorkspaces);
                setLoading(false);
            } catch (error) {
                console.error("Error fetching organization:", error);
                setLoading(false);
            }
        };

        fetchOrganization();

        // Close workspace selector when clicking outside
        const handleClickOutside = (event: MouseEvent) => {
            if (workspaceSelectorRef.current && !workspaceSelectorRef.current.contains(event.target as Node)) {
                setIsWorkspaceSelectorOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [id]);

    // Handle organization name edit
    const toggleNameEdit = () => {
        if (isEditingName && orgNameRef.current) {
            // Save the name
            const newName = orgNameRef.current.textContent || "";
            if (organization && newName !== organization.name) {
                setOrganization({
                    ...organization,
                    name: newName
                });

                // Update the workspace name as well
                setWorkspaces(workspaces.map(workspace =>
                    workspace.id === parseInt(id) ? { ...workspace, name: newName } : workspace
                ));

                // In a real app, this would call an API to update the name
                console.log("Saving organization name:", newName);
            }
        } else if (orgNameRef.current) {
            // Focus the name for editing
            orgNameRef.current.contentEditable = "true";
            orgNameRef.current.focus();

            // Select all text
            const range = document.createRange();
            range.selectNodeContents(orgNameRef.current);
            const selection = window.getSelection();
            if (selection) {
                selection.removeAllRanges();
                selection.addRange(range);
            }
        }

        setIsEditingName(!isEditingName);
    };

    // Handle name edit blur
    const handleNameBlur = () => {
        if (orgNameRef.current) {
            orgNameRef.current.contentEditable = "false";
        }
        toggleNameEdit();
    };

    // Handle name edit key press
    const handleNameKeyDown = (e: React.KeyboardEvent<HTMLHeadingElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (orgNameRef.current) {
                orgNameRef.current.blur();
            }
        }
    };

    // Switch workspace
    const switchWorkspace = (workspaceId: number) => {
        // In a real app, this would navigate to the selected workspace
        console.log("Switching to workspace:", workspaceId);
        setIsWorkspaceSelectorOpen(false);

        // For demo purposes, if switching to personal workspace
        if (workspaceId === 0) {
            window.location.href = "/";
        }
    };

    return (
        <div className="min-h-screen bg-black text-white">
            {/* Use the reusable Header component */}
            <Header />

            {/* Main content */}
            <div className="px-8 py-12">
                <div className="max-w-6xl mx-auto">
                    {loading ? (
                        <div className="flex justify-center items-center h-64">
                            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
                        </div>
                    ) : organization ? (
                        <>
                            {/* Workspace selector */}
                            <div className="mb-8 relative" ref={workspaceSelectorRef}>
                                <button
                                    className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors"
                                    onClick={() => setIsWorkspaceSelectorOpen(!isWorkspaceSelectorOpen)}
                                >
                                    <Building size={16} />
                                    <span>
                                        {workspaces.find(w => w.id === parseInt(id))?.name || "Select Workspace"}
                                    </span>
                                    <ChevronDown size={16} />
                                </button>

                                {isWorkspaceSelectorOpen && (
                                    <div className="absolute left-0 mt-2 w-64 bg-[#111111] rounded-md shadow-lg py-1 z-10 border border-gray-800">
                                        {workspaces.map(workspace => (
                                            <button
                                                key={workspace.id}
                                                className={`w-full text-left px-4 py-2 text-sm ${workspace.id === parseInt(id) ? 'bg-gray-800 text-white' : 'text-gray-300 hover:bg-gray-800'}`}
                                                onClick={() => switchWorkspace(workspace.id)}
                                            >
                                                <div className="flex items-center">
                                                    {workspace.type === 'personal' ? (
                                                        <Users size={16} className="mr-2" />
                                                    ) : (
                                                        <Building size={16} className="mr-2" />
                                                    )}
                                                    <div>
                                                        <div>{workspace.name}</div>
                                                        {workspace.type === 'organization' && workspace.role && (
                                                            <div className="text-xs text-gray-400">
                                                                {workspace.role === 'admin' ? 'Admin' : 'Member'}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </button>
                                        ))}
                                        <div className="border-t border-gray-800 mt-1 pt-1">
                                            <button
                                                className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-800"
                                                onClick={() => {
                                                    // In a real app, this would open a dialog to create a new organization
                                                    console.log("Create new organization");
                                                    setIsWorkspaceSelectorOpen(false);
                                                }}
                                            >
                                                <div className="flex items-center">
                                                    <span className="mr-2">+</span>
                                                    <span>Create New Organization</span>
                                                </div>
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Organization header with title and actions */}
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center">
                                    <h1
                                        ref={orgNameRef}
                                        contentEditable={isEditingName}
                                        suppressContentEditableWarning
                                        className={`text-3xl font-light outline-none ${isEditingName ? 'border-b border-white' : ''}`}
                                        onBlur={handleNameBlur}
                                        onKeyDown={handleNameKeyDown}
                                    >
                                        {organization.name}
                                    </h1>
                                </div>
                            </div>

                            {/* Tabs */}
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
                                        <div className="flex justify-between items-center mb-6">
                                            <div className="w-1"></div> {/* Empty div to maintain spacing */}
                                            <Link
                                                href={`/schools/${organization.defaultSchoolId || 1}/courses/create`}
                                                className="px-6 py-2 bg-white text-black text-sm font-medium rounded-full hover:opacity-90 transition-opacity focus:outline-none cursor-pointer"
                                            >
                                                Create Course
                                            </Link>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {organization.courses.map(course => (
                                                <CourseCard key={course.id} course={course} />
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Cohorts Tab */}
                                {activeTab === 'cohorts' && (
                                    <div>
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
                                            {organization.cohorts.map(cohort => (
                                                <CohortCard
                                                    key={cohort.id}
                                                    cohort={cohort}
                                                    schoolId={organization.defaultSchoolId || 1}
                                                />
                                            ))}
                                        </div>
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
                                                    {organization.members.map(member => (
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
                        </>
                    ) : (
                        <div className="text-center py-12">
                            <h2 className="text-2xl font-medium mb-2">Organization not found</h2>
                            <p className="text-gray-400 mb-6">The organization you're looking for doesn't exist or you don't have access</p>
                            <Link
                                href="/"
                                className="px-6 py-3 bg-white text-black text-sm font-medium rounded-full hover:opacity-90 transition-opacity inline-block"
                            >
                                Back to Home
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
} 