"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/header";
import { useAuth } from "@/lib/auth";

export default function CreateSchool() {
    const router = useRouter();
    const { user } = useAuth();

    // State for form fields
    const [firstName, setFirstName] = useState("");
    const [middleName, setMiddleName] = useState("");
    const [lastName, setLastName] = useState("");
    const [schoolName, setSchoolName] = useState("");
    const [slug, setSlug] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Base URL for the school (would come from environment variables in a real app)
    const baseUrl = "sensai.hyperverge.org/school";

    // Function to handle form submission
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!user?.id) {
            console.error("User not authenticated");
            return;
        }

        setIsSubmitting(true);

        try {
            // In a real app, you would send this data to your API
            console.log("Creating school with: ", {
                schoolName,
                slug: `${slug}`
            });

            // Create the school via API
            const response = await fetch('http://localhost:8001/organizations', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: schoolName,
                    slug: slug,
                    user_id: user.id
                }),
            });

            if (!response.ok) {
                throw new Error(`API error: ${response.status}`);
            }

            const data = await response.json();

            // Redirect to the new school page
            router.push(`/school/${data.id}`);
        } catch (error) {
            console.error("Error creating school:", error);
            // Handle error state here
        } finally {
            setIsSubmitting(false);
        }
    };

    // Effect to pre-fill name fields from user data if available
    useEffect(() => {
        if (user?.name) {
            const nameParts = user.name.split(" ");
            if (nameParts.length >= 1) setFirstName(nameParts[0]);
            if (nameParts.length >= 3) {
                setMiddleName(nameParts.slice(1, -1).join(" "));
                setLastName(nameParts[nameParts.length - 1]);
            } else if (nameParts.length === 2) {
                setLastName(nameParts[1]);
            }
        }
    }, [user]);

    return (
        <>
            <Header showCreateCourseButton={false} />
            <div className="flex min-h-screen flex-col bg-black text-white">
                <main className="container mx-auto px-4 py-8 max-w-3xl">
                    <h1 className="text-3xl font-light mb-8 text-center">Create Your School</h1>

                    <form onSubmit={handleSubmit} className="space-y-8">

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
                                    id="slug"
                                    type="text"
                                    value={slug}
                                    onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                                    className="flex-1 px-4 py-3 rounded-r-md bg-[#161925] border border-gray-800 border-l-0 text-white focus:outline-none focus:ring-1 focus:ring-white"
                                    required
                                    pattern="[a-z0-9-]+"
                                    title="Only lowercase letters, numbers, and hyphens are allowed"
                                    maxLength={121}
                                />
                            </div>
                            <div className="text-right text-sm text-gray-400 mt-1">
                                {slug.length}/121
                            </div>
                        </div>

                        {/* Submit Button */}
                        <div className="pt-6 flex justify-center">
                            <button
                                type="submit"
                                className="px-8 py-3 bg-white text-black text-sm font-medium rounded-full hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? 'Creating...' : 'Create School'}
                            </button>
                        </div>
                    </form>
                </main>
            </div>
        </>
    );
} 