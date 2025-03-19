"use client";

import { useState, useEffect } from "react";
import { Header } from "@/components/layout/header";
import { Building, ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";
import CohortCard from "@/components/CohortCard";
import { useAuth } from "@/lib/auth";
import LearnerCohortView from "@/components/LearnerCohortView";
import { Module, ModuleItem } from "@/types/course";
import { Performer } from "@/components/TopPerformers";

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

interface Task {
    id: number;
    title: string;
    type: string;
    status: string;
    ordering: number;
}

interface Milestone {
    id: number;
    name: string;
    color: string;
    ordering: number;
    tasks?: Task[];
}

interface Course {
    id: number;
    name: string;
    milestones?: Milestone[];
}

export default function ClientSchoolLearnerView({ slug }: { slug: string }) {
    const router = useRouter();
    const { user, isAuthenticated, isLoading: authLoading } = useAuth();
    const [school, setSchool] = useState<School | null>(null);
    const [cohorts, setCohorts] = useState<Cohort[]>([]);
    const [activeCohort, setActiveCohort] = useState<Cohort | null>(null);
    const [loading, setLoading] = useState(true);
    const [courses, setCourses] = useState<Course[]>([]);
    const [activeCourseIndex, setActiveCourseIndex] = useState(0);
    const [loadingCourses, setLoadingCourses] = useState(false);
    const [courseError, setCourseError] = useState<string | null>(null);
    const [courseModules, setCourseModules] = useState<Module[]>([]);
    const [leaderboardData, setLeaderboardData] = useState<{ performers: Performer[], currentUser?: Performer }>({ performers: [] });
    const [loadingLeaderboard, setLoadingLeaderboard] = useState(false);

    // Add state for completion data
    const [completedTaskIds, setCompletedTaskIds] = useState<Record<string, boolean>>({});
    const [completedQuestionIds, setCompletedQuestionIds] = useState<Record<string, Record<string, boolean>>>({});

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

                // Set the active cohort
                if (transformedCohorts.length > 0) {
                    setActiveCohort(transformedCohorts[0]);
                }

                setLoading(false);
            } catch (error) {
                console.error("Error fetching data:", error);
                setLoading(false);
            }
        };

        fetchSchool();
    }, [slug, router, user?.id, isAuthenticated, authLoading]);

    // Function to fetch cohort courses
    const fetchCohortCourses = async (cohortId: number) => {
        if (!cohortId) return;

        setLoadingCourses(true);
        setCourseError(null);

        try {
            const response = await fetch(`http://localhost:8001/cohorts/${cohortId}/courses?include_tree=true`);

            if (!response.ok) {
                throw new Error(`Failed to fetch courses: ${response.status}`);
            }

            const coursesData = await response.json();
            setCourses(coursesData);

            // Reset active course index when cohort changes
            setActiveCourseIndex(0);

            // Transform the first course's milestones to modules if available
            if (coursesData.length > 0) {
                transformCourseToModules(coursesData[0]);
            } else {
                setCourseModules([]);
            }

            setLoadingCourses(false);
        } catch (error) {
            console.error("Error fetching cohort courses:", error);
            setCourseError("Failed to load courses. Please try again.");
            setLoadingCourses(false);
        }
    };

    // Function to fetch completion data
    const fetchCompletionData = async (cohortId: number, userId: string) => {
        if (!cohortId || !userId) return;

        try {
            const response = await fetch(`http://localhost:8001/cohorts/${cohortId}/completion?user_id=${userId}`);

            if (!response.ok) {
                throw new Error(`Failed to fetch completion data: ${response.status}`);
            }

            const completionData = await response.json();

            // Process completion data for tasks
            const taskCompletions: Record<string, boolean> = {};
            // Process completion data for questions
            const questionCompletions: Record<string, Record<string, boolean>> = {};

            // Iterate through each task in the completion data
            Object.entries(completionData).forEach(([taskId, taskData]: [string, any]) => {
                // Store task completion status
                taskCompletions[taskId] = taskData.is_complete;

                // Store question completion status if questions exist
                if (taskData.questions && taskData.questions.length > 0) {
                    const questionsMap: Record<string, boolean> = {};

                    taskData.questions.forEach((question: any) => {
                        questionsMap[question.question_id.toString()] = question.is_complete;
                    });

                    questionCompletions[taskId] = questionsMap;
                }
            });

            // Update state with processed completion data
            setCompletedTaskIds(taskCompletions);
            setCompletedQuestionIds(questionCompletions);

        } catch (error) {
            console.error("Error fetching completion data:", error);
            // We don't set an error state as this is not critical functionality
            // Just log the error and continue
        }
    };

    // Function to fetch leaderboard data
    const fetchLeaderboardData = async (cohortId: number) => {
        if (!cohortId || !user?.id) return;

        setLoadingLeaderboard(true);

        try {
            const response = await fetch(`http://localhost:8001/cohorts/${cohortId}/leaderboard`);

            if (!response.ok) {
                throw new Error(`Failed to fetch leaderboard data: ${response.status}`);
            }

            const data = await response.json();

            // Transform API response to match Performer interface
            const performersData: Performer[] = data.stats.map((stat: any, index: number) => {
                const userName = [stat.user.first_name, stat.user.last_name].filter(Boolean).join(' ');
                return {
                    name: userName,
                    streakDays: stat.streak_count,
                    tasksSolved: stat.tasks_completed,
                    position: index + 1, // Position based on array order
                    userId: stat.user.id // Keep track of user ID for identifying current user
                };
            });

            // Get top performers but filter out those with 0 streak days
            let topPerformers = performersData
                .filter(performer => performer.streakDays > 0) // Only include performers with streak > 0
                .slice(0, 3); // Take top 3 of those

            // Find current user in the FULL performers list (which will always include them)
            const currentUserData = performersData.find(performer => performer.userId === parseInt(user.id));

            // Check if current user is in top 3 performers
            const isCurrentUserInTop3 = currentUserData && topPerformers.some(performer => performer.userId === user.id);

            setLeaderboardData({
                performers: topPerformers,
                // Only set currentUser if they're not already in top 3
                currentUser: isCurrentUserInTop3 ? undefined : currentUserData
            });

            setLoadingLeaderboard(false);
        } catch (error) {
            console.error("Error fetching leaderboard data:", error);
            setLoadingLeaderboard(false);
            // Use empty data on error
            setLeaderboardData({ performers: [], currentUser: undefined });
        }
    };

    // Fetch courses when active cohort changes
    useEffect(() => {
        if (activeCohort) {
            fetchCohortCourses(activeCohort.id);

            // Also fetch completion data when cohort changes
            if (user?.id) {
                fetchCompletionData(activeCohort.id, user.id.toString());
                fetchLeaderboardData(activeCohort.id); // Fetch leaderboard data
            }
        }
    }, [activeCohort, user?.id]);

    // Transform course data to modules format for LearnerCohortView
    const transformCourseToModules = (course: Course) => {
        if (!course.milestones || !Array.isArray(course.milestones)) {
            setCourseModules([]);
            return;
        }

        const transformedModules = course.milestones.map((milestone: Milestone) => {
            // Map tasks to module items if they exist
            const moduleItems: ModuleItem[] = [];

            if (milestone.tasks && Array.isArray(milestone.tasks)) {
                milestone.tasks.forEach((task: Task) => {
                    if (task.type === 'learning_material') {
                        moduleItems.push({
                            id: task.id.toString(),
                            title: task.title,
                            position: task.ordering,
                            type: 'material',
                            content: [], // Empty content initially
                            status: task.status
                        });
                    } else if (task.type === 'quiz') {
                        moduleItems.push({
                            id: task.id.toString(),
                            title: task.title,
                            position: task.ordering,
                            type: 'quiz',
                            questions: [], // Empty questions initially
                            status: task.status
                        });
                    } else if (task.type === 'exam') {
                        moduleItems.push({
                            id: task.id.toString(),
                            title: task.title,
                            position: task.ordering,
                            type: 'exam',
                            questions: [], // Empty questions initially
                            status: task.status
                        });
                    }
                });

                // Sort items by position/ordering
                moduleItems.sort((a, b) => a.position - b.position);
            }

            return {
                id: milestone.id.toString(),
                title: milestone.name,
                position: milestone.ordering,
                items: moduleItems,
                isExpanded: false,
                backgroundColor: `${milestone.color}80`, // Add 50% opacity for UI display
            };
        });

        // Sort modules by position/ordering
        transformedModules.sort((a, b) => a.position - b.position);
        setCourseModules(transformedModules);
    };

    // Handle course tab selection
    const handleCourseSelect = (index: number) => {
        setActiveCourseIndex(index);
        transformCourseToModules(courses[index]);
    };

    // Handle cohort selection
    const handleCohortSelect = (cohort: Cohort) => {
        setActiveCohort(cohort);
    };

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
            <Header
                showCreateCourseButton={false}
                cohorts={cohorts}
                activeCohort={activeCohort}
                onCohortSelect={handleCohortSelect}
            />
            <div className="min-h-screen bg-black text-white">
                <div className="container mx-auto px-4 py-8">
                    <main>
                        {cohorts.length === 0 && (
                            <div className="mt-24">
                                <div className="flex flex-col items-center justify-center py-12 rounded-lg">
                                    <h3 className="text-xl font-light mb-2">No cohorts available</h3>
                                    <p className="text-gray-400">You are not enrolled in any cohorts for this school</p>
                                </div>
                            </div>
                        )}

                        {cohorts.length > 0 && activeCohort && (
                            <>
                                {loadingCourses ? (
                                    <div className="flex justify-center items-center py-12">
                                        <div className="w-12 h-12 border-t-2 border-b-2 border-white rounded-full animate-spin"></div>
                                    </div>
                                ) : courseError ? (
                                    <div className="mt-12 text-center">
                                        <p className="text-red-400 mb-4">{courseError}</p>
                                        <button
                                            onClick={() => {
                                                if (activeCohort) {
                                                    fetchCohortCourses(activeCohort.id);
                                                }
                                            }}
                                            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-md transition-colors"
                                        >
                                            Try Again
                                        </button>
                                    </div>
                                ) : courses.length === 0 ? (
                                    <div className="mt-12 text-center">
                                        <h3 className="text-xl font-light mb-2">No courses available</h3>
                                        <p className="text-gray-400">There are no courses in this cohort yet</p>
                                    </div>
                                ) : (
                                    <div className="w-full">
                                        {/* Course Tabs - Only show if there are multiple courses */}
                                        {courses.length > 1 && (
                                            <div className="mb-8 border-b border-gray-800">
                                                <div className="flex space-x-1 overflow-x-auto pb-2">
                                                    {courses.map((course, index) => (
                                                        <button
                                                            key={course.id}
                                                            className={`px-4 py-2 rounded-t-lg text-sm font-light whitespace-nowrap transition-colors cursor-pointer ${index === activeCourseIndex
                                                                ? 'bg-gray-800 text-white'
                                                                : 'text-gray-400 hover:text-white hover:bg-gray-900'
                                                                }`}
                                                            onClick={() => handleCourseSelect(index)}
                                                        >
                                                            {course.name}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Course Content using LearnerCohortView */}
                                        <div className="w-full">
                                            {courses.length > 0 && (
                                                <div className="w-full">
                                                    <LearnerCohortView
                                                        courseTitle={courses.length > 1 ? "" : courses[activeCourseIndex].name}
                                                        modules={courseModules}
                                                        schoolId={school.id.toString()}
                                                        cohortId={activeCohort?.id.toString()}
                                                        streakDays={2}
                                                        activeDays={["M", "T"]}
                                                        performers={leaderboardData.performers}
                                                        currentUser={leaderboardData.currentUser}
                                                        completedTaskIds={completedTaskIds}
                                                        completedQuestionIds={completedQuestionIds}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </main>
                </div>
            </div>
        </>
    );
} 