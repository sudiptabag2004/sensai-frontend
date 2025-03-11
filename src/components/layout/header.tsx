"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useSchools } from "@/lib/api";
import CreateCourseDialog from "@/components/CreateCourseDialog";

interface HeaderProps {
    showCreateCourseButton?: boolean;
}

export function Header({ showCreateCourseButton = true }: HeaderProps) {
    const router = useRouter();
    const { data: session } = useSession();
    const [profileMenuOpen, setProfileMenuOpen] = useState(false);
    const [isCreateCourseDialogOpen, setIsCreateCourseDialogOpen] = useState(false);
    const profileMenuRef = useRef<HTMLDivElement>(null);
    const { schools, isLoading } = useSchools();
    const schoolId = schools && schools.length > 0 ? schools[0].id : null;
    const hasSchool = Boolean(schools && schools.length > 0);

    // Close the profile menu when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
                setProfileMenuOpen(false);
            }
        }

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [profileMenuRef]);

    // Handle logout
    const handleLogout = () => {
        signOut({ callbackUrl: "/login" });
        setProfileMenuOpen(false);
    };

    // Toggle profile menu
    const toggleProfileMenu = () => {
        setProfileMenuOpen(!profileMenuOpen);
    };

    // Handle button click to open school admin page or create page
    const handleButtonClick = (e: React.MouseEvent) => {
        // If user has a school, go to school admin page, otherwise go to school creation page
        if (hasSchool && schoolId) {
            router.push(`/schools/${schoolId}`);
        } else {
            router.push("/schools/create");
        }
    };

    // Handle creating a new course with the provided name
    const handleCreateCourse = async (courseName: string) => {
        if (hasSchool && schoolId) {
            try {
                // Make API request to create course
                const response = await fetch('http://localhost:8001/courses', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        name: courseName,
                        org_id: Number(schoolId)
                    }),
                });

                if (!response.ok) {
                    throw new Error('Failed to create course');
                }

                const data = await response.json();
                // Redirect to the new course page - no need to close dialog since navigation will unmount components
                router.push(`/schools/${schoolId}/courses/${data.id}`);
            } catch (error) {
                console.error("Error creating course:", error);
                // Only close dialog on error
                setIsCreateCourseDialogOpen(false);
                throw error; // Re-throw to let the dialog handle the error
            }
        } else {
            router.push("/schools/create");
        }
    };

    // Get user initials for avatar
    const getInitials = () => {
        if (session?.user?.name) {
            return session.user.name.charAt(0).toUpperCase();
        }
        return "U";
    };

    return (
        <header className="w-full px-3 py-4 bg-black text-white">
            <div className="max-w-full mx-auto flex justify-between items-center">
                {/* Logo */}
                <Link href="/">
                    <div className="cursor-pointer">
                        <Image
                            src="/images/sensai-logo.svg"
                            alt="SensAI Logo"
                            width={120}
                            height={40}
                            priority
                        />
                    </div>
                </Link>

                {/* Right side actions */}
                <div className="flex items-center space-x-4 pr-1">
                    {showCreateCourseButton && (
                        <button
                            onClick={handleButtonClick}
                            className="px-6 py-3 bg-white text-black text-sm font-medium rounded-full hover:opacity-90 transition-opacity focus:outline-none focus:ring-0 focus:border-0 cursor-pointer"
                        >
                            Go To School
                        </button>
                    )}

                    {/* Profile dropdown */}
                    <div className="relative" ref={profileMenuRef}>
                        <button
                            className="w-10 h-10 rounded-full bg-purple-700 flex items-center justify-center hover:bg-purple-600 transition-colors focus:outline-none focus:ring-0 focus:border-0 cursor-pointer"
                            onClick={toggleProfileMenu}
                        >
                            <span className="text-white font-medium">{getInitials()}</span>
                        </button>

                        {/* Profile dropdown menu */}
                        {profileMenuOpen && (
                            <div className="absolute right-0 mt-2 w-64 bg-[#111111] rounded-md shadow-lg py-1 z-10 border border-gray-800">
                                <div className="px-4 py-3 border-b border-gray-800">
                                    <div className="flex items-center">
                                        <div className="w-10 h-10 rounded-full bg-purple-700 flex items-center justify-center mr-3">
                                            <span className="text-white font-medium">{getInitials()}</span>
                                        </div>
                                        <div>
                                            <div className="text-sm font-medium">{session?.user?.name || "User"}</div>
                                            <div className="text-xs text-gray-400">{session?.user?.email || "user@example.com"}</div>
                                        </div>
                                    </div>
                                </div>

                                <div className="border-t border-gray-800 py-1">
                                    <button
                                        onClick={handleLogout}
                                        className="flex w-full items-center text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 cursor-pointer"
                                    >
                                        <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                        </svg>
                                        Logout
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Create Course Dialog */}
            <CreateCourseDialog
                open={isCreateCourseDialogOpen}
                onClose={() => setIsCreateCourseDialogOpen(false)}
                onCreateCourse={handleCreateCourse}
            />
        </header>
    );
} 