"use client";

import { useState, useEffect } from "react";
import { Header } from "@/components/layout/header";
import { Building } from "lucide-react";
import { useRouter } from "next/navigation";
import CohortCard from "@/components/CohortCard";
import { useAuth } from "@/lib/auth";

interface School {
    id: number;
    name: string;
    slug: string;
}

interface Cohort {
    id: number;
    name: string;
    courseCount: number;
    memberCount: number;
    description?: string;
}

export default function ClientSchoolLearnerView({ slug }: { slug: string }) {
    const router = useRouter();
    const { user, isAuthenticated, isLoading: authLoading } = useAuth();
    const [school, setSchool] = useState<School | null>(null);
    const [cohorts, setCohorts] = useState<Cohort[]>([]);
    const [loading, setLoading] = useState(true);

    // Fetch school data
    useEffect(() => {
        const fetchSchool = async () => {
            // Don't fetch if auth is still loading or user is not authenticated
            if (authLoading || !isAuthenticated || !user?.id) {
                return;
            }

            setLoading(true);
            try {
                // Fetch basic school info using slug
                const schoolResponse = await fetch(`http://localhost:8001/organizations/slug/${slug}`);
                if (!schoolResponse.ok) {
                    throw new Error(`API error: ${schoolResponse.status}`);
                }
                const schoolData = await schoolResponse.json();

                // Transform the API response to match the School interface
                const transformedSchool: School = {
                    id: parseInt(schoolData.id),
                    name: schoolData.name,
                    slug: schoolData.slug
                };

                setSchool(transformedSchool);

                // After getting school data, fetch user's cohorts for this school
                const cohortsResponse = await fetch(`http://localhost:8001/users/${user.id}/org/${transformedSchool.id}/cohorts`);
                if (!cohortsResponse.ok) {
                    throw new Error(`API error: ${cohortsResponse.status}`);
                }
                const cohortsData = await cohortsResponse.json();

                // Transform cohorts data
                const transformedCohorts: Cohort[] = cohortsData.map((cohort: any) => ({
                    id: cohort.id,
                    name: cohort.name,
                    courseCount: cohort.courseCount || 0,
                    memberCount: cohort.memberCount || 0,
                    description: cohort.description || ''
                }));

                setCohorts(transformedCohorts);
                setLoading(false);
            } catch (error) {
                console.error("Error fetching data:", error);
                setLoading(false);
            }
        };

        fetchSchool();
    }, [slug, router, user?.id, isAuthenticated, authLoading]);

    // Show loading state while auth is loading
    if (authLoading) {
        return (
            <div className="min-h-screen bg-black text-white">
                <Header showCreateCourseButton={false} />
                <div className="flex justify-center items-center py-12">
                    <div className="w-12 h-12 border-t-2 border-b-2 border-white rounded-full animate-spin"></div>
                </div>
            </div>
        );
    }

    // Redirect to login if not authenticated
    if (!isAuthenticated && !authLoading) {
        // Use client-side redirect
        router.push('/login');
        return null;
    }

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
                            <div className="flex items-center">
                                <div className="w-12 h-12 bg-purple-700 rounded-lg flex items-center justify-center mr-4">
                                    <Building size={24} className="text-white" />
                                </div>
                                <div>
                                    <h1 className="text-3xl font-light">{school.name}</h1>
                                </div>
                            </div>
                        </div>

                        {cohorts.length > 0 ? (
                            <div className="mt-12">
                                <h2 className="text-2xl font-light mb-6">Your Cohorts</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {cohorts.map(cohort => (
                                        <CohortCard
                                            key={cohort.id}
                                            cohort={cohort}
                                            schoolId={school.id}
                                        />
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="mt-24">
                                <div className="flex flex-col items-center justify-center py-12 rounded-lg">
                                    <h3 className="text-xl font-light mb-2">No cohorts available</h3>
                                    <p className="text-gray-400">You are not enrolled in any cohorts for this school</p>
                                </div>
                            </div>
                        )}
                    </main>
                </div>
            </div>
        </>
    );
} 