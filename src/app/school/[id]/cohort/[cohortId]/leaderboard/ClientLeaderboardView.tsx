"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { Header } from "@/components/layout/header";
import { Performer } from "@/components/TopPerformers";

export default function ClientLeaderboardView({
    schoolId,
    cohortId,
    cohortName: initialCohortName,
}: {
    schoolId: string;
    cohortId: string;
    cohortName?: string;
}) {
    const router = useRouter();
    const { user } = useAuth();
    const [cohortName, setCohortName] = useState<string>(initialCohortName || "Introduction to Programming");
    const [performers, setPerformers] = useState<Performer[]>([
        { name: "Ronak Shah", streakDays: 45, tasksSolved: 20, position: 1 },
        { name: "Anshum Shailey", streakDays: 45, tasksSolved: 20, position: 2 },
        { name: "Rishab Burman", streakDays: 45, tasksSolved: 20, position: 3 },
        { name: "Priya Patel", streakDays: 42, tasksSolved: 18, position: 4 },
        { name: "Aarav Kumar", streakDays: 40, tasksSolved: 18, position: 5 },
        { name: "Neha Sharma", streakDays: 38, tasksSolved: 17, position: 6 },
        { name: "Jane Cooper", streakDays: 35, tasksSolved: 15, position: 7 },
        { name: "Alex Johnson", streakDays: 32, tasksSolved: 14, position: 8 },
        { name: "Sam Taylor", streakDays: 30, tasksSolved: 13, position: 9 },
        { name: "Morgan Lee", streakDays: 28, tasksSolved: 12, position: 10 },
        { name: "Casey Kim", streakDays: 25, tasksSolved: 11, position: 11 },
        { name: "Jordan Smith", streakDays: 22, tasksSolved: 10, position: 12 }
    ]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    // Simulate loading state for a brief moment
    useEffect(() => {
        const timer = setTimeout(() => {
            setLoading(false);
        }, 1000);

        return () => clearTimeout(timer);
    }, []);

    // Function to get the appropriate badge SVG based on position
    const getPositionBadge = (position: number) => {
        if (position === 1) {
            return "/images/leaderboard_1.svg";
        } else if (position === 2) {
            return "/images/leaderboard_2.svg";
        } else if (position === 3) {
            return "/images/leaderboard_3.svg";
        }
        return null;
    };

    // Check if a performer is the current user
    const isCurrentUser = (performer: Performer) => {
        // In a real implementation, this would check the user's ID
        // For demo purposes, we'll mark Jane Cooper as the current user
        return performer.name === "Jane Cooper";
    };

    return (
        <div className="min-h-screen bg-black text-white">
            <Header showCreateCourseButton={false} />

            <main className="container mx-auto px-4 py-8">
                {/* Back button and page title */}
                <div className="flex mb-8">

                    <div className="flex-1 text-center">
                        <h1 className="flex">
                            <span
                                className="text-gray-400 mt-3 text-lg font-light cursor-pointer hover:text-gray-300"
                                onClick={() => router.back()}
                            >
                                {cohortName}
                            </span>
                            <span className="mx-2 text-lg mt-3 font-light text-gray-400">/</span>
                            <span className="text-4xl font-light">Leaderboard</span>
                        </h1>
                    </div>

                    {/* Empty div for flex balance */}
                    <div className="w-24"></div>
                </div>

                {loading ? (
                    <div className="flex justify-center my-12">
                        <div className="w-12 h-12 border-t-2 border-b-2 border-white rounded-full animate-spin"></div>
                    </div>
                ) : error ? (
                    <div className="text-center my-12">
                        <p className="text-red-400 mb-4">{error}</p>
                        <button
                            onClick={() => location.reload()}
                            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-md transition-colors"
                        >
                            Try Again
                        </button>
                    </div>
                ) : (
                    <div className="bg-[#121212] rounded-lg border border-gray-800 overflow-hidden">
                        {/* Column Headers */}
                        <div className="grid grid-cols-12 gap-2 px-4 py-4 border-b border-gray-800 bg-[#2A2000] text-sm font-light">
                            <div className="col-span-1 text-center">Rank</div>
                            <div className="col-span-5 lg:col-span-6">Learner</div>
                            <div className="col-span-3 lg:col-span-2 text-center">Streak</div>
                            <div className="col-span-3 lg:col-span-3 text-right pr-2">Tasks Completed</div>
                        </div>

                        {/* Performers List */}
                        <div className="divide-y divide-gray-800">
                            {performers.map((performer, index) => (
                                <div
                                    key={index}
                                    className={`grid grid-cols-12 gap-2 px-4 py-4 items-center ${isCurrentUser(performer) ? 'bg-gray-900/20' : ''}`}
                                >
                                    {/* Position Column */}
                                    <div className="col-span-1 flex justify-center">
                                        {performer.position <= 3 ? (
                                            <div className="w-10 h-10 flex items-center justify-center">
                                                <Image
                                                    src={getPositionBadge(performer.position)!}
                                                    alt={`Position ${performer.position}`}
                                                    width={36}
                                                    height={36}
                                                />
                                            </div>
                                        ) : (
                                            <div className="w-9 h-9 rounded-full flex items-center justify-center bg-gray-800/30">
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-light text-base border-2 
                                                    ${isCurrentUser(performer)
                                                        ? 'text-blue-500 border-blue-500'
                                                        : 'text-gray-400 border-gray-700'}`}>
                                                    {performer.position}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Name Column */}
                                    <div className="col-span-5 lg:col-span-6 flex items-center">
                                        <div className="font-medium text-white flex items-center">
                                            {performer.name}
                                            {isCurrentUser(performer) && (
                                                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-900/30 text-blue-400">
                                                    You
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Completion Column */}
                                    <div className="col-span-3 lg:col-span-2 text-center text-gray-400">
                                        {performer.streakDays} Days
                                    </div>

                                    {/* Tasks Solved Column */}
                                    <div className="col-span-3 lg:col-span-3 text-right pr-2 text-gray-400">
                                        {performer.tasksSolved}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
} 