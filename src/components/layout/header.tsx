"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

interface HeaderProps {
    showCreateCourseButton?: boolean;
}

export function Header({ showCreateCourseButton = true }: HeaderProps) {
    const router = useRouter();
    const [profileMenuOpen, setProfileMenuOpen] = useState(false);
    const profileMenuRef = useRef<HTMLDivElement>(null);
    const [hasSchool, setHasSchool] = useState<boolean | null>(null);
    const [schoolId, setSchoolId] = useState<string>("1"); // Mock school ID

    // Mock user data - in a real app, this would come from authentication
    const user = {
        name: "shadcn",
        email: "m@example.com"
    };

    // Check if user has a school
    useEffect(() => {
        const userHasSchool = localStorage.getItem("hasSchool") === "true";
        setHasSchool(userHasSchool);
    }, []);

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
        // In a real app, this would call your logout function
        console.log("Logging out...");
        setProfileMenuOpen(false);
    };

    // Toggle profile menu
    const toggleProfileMenu = () => {
        setProfileMenuOpen(!profileMenuOpen);
    };

    // Handle button click
    const handleButtonClick = (e: React.MouseEvent) => {
        e.preventDefault();

        // If user has a school, go to school admin page, otherwise go to school creation page
        if (hasSchool) {
            router.push(`/schools/${schoolId}`);
        } else {
            router.push("/schools/create");
        }
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
                            <span className="text-white font-medium">S</span>
                        </button>

                        {/* Profile dropdown menu */}
                        {profileMenuOpen && (
                            <div className="absolute right-0 mt-2 w-64 bg-[#111111] rounded-md shadow-lg py-1 z-10 border border-gray-800">
                                <div className="px-4 py-3 border-b border-gray-800">
                                    <div className="flex items-center">
                                        <div className="w-10 h-10 rounded-full bg-purple-700 flex items-center justify-center mr-3">
                                            <span className="text-white font-medium">S</span>
                                        </div>
                                        <div>
                                            <div className="text-sm font-medium">{user.name}</div>
                                            <div className="text-xs text-gray-400">{user.email}</div>
                                        </div>
                                    </div>
                                </div>

                                <div className="py-1">
                                    <a href="#" className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 flex items-center">
                                        <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                        </svg>
                                        Profile
                                    </a>
                                </div>

                                <div className="border-t border-gray-800 py-1">
                                    <button
                                        onClick={handleLogout}
                                        className="block w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 flex items-center"
                                    >
                                        <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                        </svg>
                                        Log out
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
} 