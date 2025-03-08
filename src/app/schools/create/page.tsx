"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/header";

export default function CreateSchool() {
    const router = useRouter();

    // State for form fields
    const [firstName, setFirstName] = useState("");
    const [middleName, setMiddleName] = useState("");
    const [lastName, setLastName] = useState("");
    const [schoolName, setSchoolName] = useState("");
    const [customUrl, setCustomUrl] = useState("");

    // Base URL for the school (would come from environment variables in a real app)
    const baseUrl = "sensai.hyperverge.org/";

    // Function to handle form submission
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // In a real app, you would send this data to your API
        console.log("Creating school with: ", {
            firstName,
            middleName,
            lastName,
            schoolName,
            customUrl: `${baseUrl}${customUrl}`
        });

        // Mock creating a school - in a real app, this would be an API call
        // After successful creation, redirect to course creation
        localStorage.setItem("hasSchool", "true");
        localStorage.setItem("schoolName", schoolName);
        localStorage.setItem("schoolId", "1"); // Adding mock school ID

        // Redirect to course creation
        router.push("/schools/1/courses/create");
    };

    // Effect to pre-fill name fields from user data if available
    useEffect(() => {
        // Mock user data - in a real app, this would come from authentication
        const user = {
            name: "John Doe" // Mock name from Google login
        };

        if (user.name) {
            const nameParts = user.name.split(" ");
            if (nameParts.length >= 1) setFirstName(nameParts[0]);
            if (nameParts.length >= 3) {
                setMiddleName(nameParts.slice(1, -1).join(" "));
                setLastName(nameParts[nameParts.length - 1]);
            } else if (nameParts.length === 2) {
                setLastName(nameParts[1]);
            }
        }
    }, []);

    return (
        <>
            <Header showCreateCourseButton={false} />
            <div className="flex min-h-screen flex-col bg-black text-white">
                <main className="container mx-auto px-4 py-8 max-w-3xl">
                    <h1 className="text-3xl font-light mb-8 text-center">Create Your School</h1>

                    <form onSubmit={handleSubmit} className="space-y-8">
                        {/* Name fields */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label htmlFor="firstName" className="block text-sm text-gray-400 mb-2">
                                    First Name
                                </label>
                                <input
                                    id="firstName"
                                    type="text"
                                    value={firstName}
                                    onChange={(e) => setFirstName(e.target.value)}
                                    className="w-full px-4 py-3 rounded-md bg-[#161925] border border-gray-800 text-white focus:outline-none focus:ring-1 focus:ring-white"
                                    required
                                />
                            </div>
                            <div>
                                <label htmlFor="middleName" className="block text-sm text-gray-400 mb-2">
                                    Middle Name (Optional)
                                </label>
                                <input
                                    id="middleName"
                                    type="text"
                                    value={middleName}
                                    onChange={(e) => setMiddleName(e.target.value)}
                                    className="w-full px-4 py-3 rounded-md bg-[#161925] border border-gray-800 text-white focus:outline-none focus:ring-1 focus:ring-white"
                                />
                            </div>
                            <div>
                                <label htmlFor="lastName" className="block text-sm text-gray-400 mb-2">
                                    Last Name
                                </label>
                                <input
                                    id="lastName"
                                    type="text"
                                    value={lastName}
                                    onChange={(e) => setLastName(e.target.value)}
                                    className="w-full px-4 py-3 rounded-md bg-[#161925] border border-gray-800 text-white focus:outline-none focus:ring-1 focus:ring-white"
                                    required
                                />
                            </div>
                        </div>

                        {/* School Name */}
                        <div>
                            <h2 className="text-2xl font-light mb-2">School Name</h2>
                            <p className="text-gray-400 text-sm mb-2">This is usually your name or the name of your business.</p>
                            <input
                                id="schoolName"
                                type="text"
                                value={schoolName}
                                onChange={(e) => setSchoolName(e.target.value)}
                                className="w-full px-4 py-3 rounded-md bg-[#161925] border border-gray-800 text-white focus:outline-none focus:ring-1 focus:ring-white"
                                required
                                maxLength={40}
                            />
                            <div className="text-right text-sm text-gray-400 mt-1">
                                {schoolName.length}/40
                            </div>
                        </div>

                        {/* School URL */}
                        <div>
                            <h2 className="text-2xl font-light mb-2">School URL</h2>
                            <p className="text-gray-400 text-sm mb-2">This is how your school will be accessed online.</p>
                            <div className="flex">
                                <div className="bg-[#161925] px-4 py-3 rounded-l-md text-gray-300 border border-gray-800">
                                    {baseUrl}
                                </div>
                                <input
                                    id="customUrl"
                                    type="text"
                                    value={customUrl}
                                    onChange={(e) => setCustomUrl(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                                    className="flex-1 px-4 py-3 rounded-r-md bg-[#161925] border border-gray-800 border-l-0 text-white focus:outline-none focus:ring-1 focus:ring-white"
                                    required
                                    pattern="[a-z0-9-]+"
                                    title="Only lowercase letters, numbers, and hyphens are allowed"
                                    maxLength={121}
                                />
                            </div>
                            <div className="text-right text-sm text-gray-400 mt-1">
                                {customUrl.length}/121
                            </div>
                        </div>

                        {/* Submit Button */}
                        <div className="pt-6 flex justify-center">
                            <button
                                type="submit"
                                className="px-8 py-3 bg-white text-black text-sm font-medium rounded-full hover:opacity-90 transition-opacity cursor-pointer"
                            >
                                Create School
                            </button>
                        </div>
                    </form>
                </main>
            </div>
        </>
    );
} 