"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Header } from "@/components/layout/header";
import { Users, BookOpen, Layers, ArrowLeft, UsersRound, X, Plus, Trash2, Upload, Mail, ChevronDown, Check, FileText } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ConfirmationDialog from "@/components/ConfirmationDialog";

interface Course {
    id: number;
    name: string;
    description?: string;
    moduleCount?: number;
}

interface Member {
    id: number;
    email: string;
    role: 'learner' | 'mentor';
}

interface Cohort {
    id: number;
    org_id: number;
    name: string;
    members: Member[];
    groups: any[];
    courses?: Course[];
}

interface EmailInput {
    id: string;
    email: string;
    error?: string;
}

type TabType = 'learners' | 'mentors';

interface ClientCohortPageProps {
    schoolId: string;
    cohortId: string;
}

export default function ClientCohortPage({ schoolId, cohortId }: ClientCohortPageProps) {
    const router = useRouter();
    const [tab, setTab] = useState<TabType>('learners');
    const [cohort, setCohort] = useState<Cohort | null>(null);
    const [isAddLearnersOpen, setIsAddLearnersOpen] = useState(false);
    const [isAddMentorsOpen, setIsAddMentorsOpen] = useState(false);
    const [emailInputs, setEmailInputs] = useState<EmailInput[]>([{ id: '1', email: '' }]);
    const [focusedInputId, setFocusedInputId] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
    const [memberToDelete, setMemberToDelete] = useState<{ id: number, email: string, role: 'learner' | 'mentor' } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const inputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});
    const [loading, setLoading] = useState(true);

    const [availableCourses, setAvailableCourses] = useState<Course[]>([]);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isLoadingCourses, setIsLoadingCourses] = useState(false);
    const [courseError, setCourseError] = useState<string | null>(null);
    const [selectedCourseIds, setSelectedCourseIds] = useState<number[]>([]);
    const [courseSearchQuery, setCourseSearchQuery] = useState('');
    const [filteredCourses, setFilteredCourses] = useState<Course[]>([]);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Add a new state for temporarily selected courses
    const [tempSelectedCourses, setTempSelectedCourses] = useState<Course[]>([]);

    // Add state to track total courses in the school
    const [totalSchoolCourses, setTotalSchoolCourses] = useState<number>(0);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            const target = event.target as Node;

            if (dropdownRef.current &&
                !dropdownRef.current.contains(target) &&
                !(target as Element).closest('[data-dropdown-toggle="true"]')) {
                setIsDropdownOpen(false);
            }
        }

        if (isDropdownOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isDropdownOpen]);

    const fetchAvailableCourses = async () => {
        setIsLoadingCourses(true);
        setCourseError(null);
        try {
            const coursesResponse = await fetch(`http://localhost:8001/courses?org_id=${schoolId}`);
            if (!coursesResponse.ok) {
                throw new Error(`Failed to fetch courses: ${coursesResponse.status}`);
            }
            const coursesData: Course[] = await coursesResponse.json();

            // Store the total number of courses in the school
            setTotalSchoolCourses(coursesData.length);

            const cohortCoursesResponse = await fetch(`http://localhost:8001/cohorts/${cohortId}/courses`);
            if (!cohortCoursesResponse.ok) {
                setAvailableCourses(coursesData);
                setFilteredCourses(coursesData);
                setIsLoadingCourses(false);
                return;
            }

            const cohortCoursesData: Course[] = await cohortCoursesResponse.json();
            const cohortCourseIds = cohortCoursesData.map(course => course.id);

            const availableCoursesData = coursesData.filter(course => !cohortCourseIds.includes(course.id));

            setAvailableCourses(availableCoursesData);
            setFilteredCourses(availableCoursesData);

            if (cohort) {
                setCohort(prev => {
                    if (!prev) return prev;
                    return {
                        ...prev,
                        courses: cohortCoursesData
                    };
                });
                setSelectedCourseIds(cohortCoursesData.map(course => course.id));
            }
        } catch (error) {
            console.error("Error fetching courses:", error);
            setCourseError("Failed to load courses. Please try again.");
        } finally {
            setIsLoadingCourses(false);
        }
    };

    const handleCourseSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        const query = e.target.value;
        setCourseSearchQuery(query);

        if (availableCourses.length > 0) {
            if (query.trim() === '') {
                // Show all available courses that aren't temporarily selected
                setFilteredCourses(availableCourses.filter(course =>
                    !tempSelectedCourses.some(tc => tc.id === course.id)
                ));
            } else {
                // Filter by name AND exclude temp selected courses
                const filtered = availableCourses.filter(course =>
                    course.name.toLowerCase().includes(query.toLowerCase()) &&
                    !tempSelectedCourses.some(tc => tc.id === course.id)
                );
                setFilteredCourses(filtered);
            }
        }
    };

    // Update the selectCourse function to immediately filter out selected courses
    const selectCourse = (course: Course) => {
        // Check if already selected
        if (tempSelectedCourses.some(c => c.id === course.id)) {
            return; // Already selected, do nothing
        }

        // Add to temporary selection
        setTempSelectedCourses([...tempSelectedCourses, course]);

        // Remove from filtered courses immediately for better UX
        setFilteredCourses(prev => prev.filter(c => c.id !== course.id));
    };

    // Function to remove course from temporary selection and add it back to filtered list
    const removeTempCourse = (courseId: number) => {
        // Find the course to remove
        const courseToRemove = tempSelectedCourses.find(course => course.id === courseId);

        // Remove from temp selection
        setTempSelectedCourses(tempSelectedCourses.filter(course => course.id !== courseId));

        // Add back to filtered courses if it matches the current search
        if (courseToRemove &&
            (courseSearchQuery.trim() === '' ||
                courseToRemove.name.toLowerCase().includes(courseSearchQuery.toLowerCase()))) {
            setFilteredCourses(prev => [...prev, courseToRemove]);
        }
    };

    // Function to handle removing a course from the cohort
    const removeCourseFromCohort = async (courseId: number) => {
        try {
            const response = await fetch(`http://localhost:8001/cohorts/${cohortId}/courses/${courseId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            if (!response.ok) {
                throw new Error(`Failed to remove course from cohort: ${response.status}`);
            }

            setSelectedCourseIds(prev => prev.filter(id => id !== courseId));

            if (cohort?.courses) {
                const removedCourse = cohort.courses.find(course => course.id === courseId);

                setCohort(prev => {
                    if (!prev) return prev;
                    return {
                        ...prev,
                        courses: prev.courses?.filter(course => course.id !== courseId) || []
                    };
                });

                if (removedCourse) {
                    setAvailableCourses(prev => [...prev, removedCourse]);
                    // Add to filtered courses if it matches the current search
                    if (courseSearchQuery.trim() === '' || removedCourse.name.toLowerCase().includes(courseSearchQuery.toLowerCase())) {
                        setFilteredCourses(prev => [...prev, removedCourse]);
                    }
                }
            }
        } catch (error) {
            console.error("Error removing course from cohort:", error);
        }
    };

    // Function to handle the Add button click - this will make the API calls
    const handleAddSelectedCourses = async () => {
        // If no courses selected, just close the dropdown
        if (tempSelectedCourses.length === 0) {
            setIsDropdownOpen(false);
            return;
        }

        // Show loading state
        setIsLoadingCourses(true);

        try {
            // Extract all course IDs from the selected courses
            const courseIds = tempSelectedCourses.map(course => course.id);

            // Make a single API call with all selected course IDs
            const response = await fetch(`http://localhost:8001/cohorts/${cohortId}/courses`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    course_ids: courseIds
                }),
            });

            if (!response.ok) {
                throw new Error(`Failed to add courses to cohort: ${response.status}`);
            }

            // Update the cohort with added courses
            setCohort(prev => {
                if (!prev) return prev;

                // Get existing course IDs to avoid duplicates
                const existingCourseIds = prev.courses?.map(c => c.id) || [];

                // Filter out any courses that are already in the cohort
                const newCourses = tempSelectedCourses.filter(c => !existingCourseIds.includes(c.id));

                return {
                    ...prev,
                    courses: [...(prev.courses || []), ...newCourses]
                };
            });

            // Update selected course IDs
            setSelectedCourseIds(prev => {
                return [...prev, ...courseIds];
            });

            // Remove added courses from available courses
            setAvailableCourses(prev =>
                prev.filter(c => !tempSelectedCourses.some(tc => tc.id === c.id))
            );

            setFilteredCourses(prev =>
                prev.filter(c => !tempSelectedCourses.some(tc => tc.id === c.id))
            );

            // Clear temporary selection
            setTempSelectedCourses([]);

            // Close dropdown
            setIsDropdownOpen(false);

        } catch (error) {
            console.error("Error adding courses to cohort:", error);
            setCourseError("Failed to add courses. Please try again.");
        } finally {
            setIsLoadingCourses(false);
        }
    };

    useEffect(() => {
        console.log("useEffect running with cohortId:", cohortId);

        const fetchCohort = async () => {
            if (!cohortId || cohortId === 'undefined') {
                console.error("Invalid cohortId:", cohortId);
                setLoading(false);
                return;
            }

            setLoading(true);
            try {
                console.log("Fetching cohort with ID:", cohortId);
                const url = `http://localhost:8001/cohorts/${cohortId}`;
                console.log("Fetch URL:", url);

                const cohortResponse = await fetch(url);
                console.log("Response status:", cohortResponse.status);

                if (!cohortResponse.ok) {
                    throw new Error(`API error: ${cohortResponse.status}`);
                }

                const cohortData = await cohortResponse.json();
                console.log("Cohort data received:", cohortData);

                setCohort(cohortData);
                setLoading(false);

                // Fetch courses in cohort
                try {
                    const cohortCoursesResponse = await fetch(`http://localhost:8001/cohorts/${cohortId}/courses`);
                    if (cohortCoursesResponse.ok) {
                        const cohortCoursesData = await cohortCoursesResponse.json();
                        setCohort(prev => {
                            if (!prev) return prev;
                            return {
                                ...prev,
                                courses: cohortCoursesData
                            };
                        });
                        setSelectedCourseIds(cohortCoursesData.map((course: Course) => course.id));
                    }

                    // Fetch available courses
                    fetchAvailableCourses();
                } catch (error) {
                    console.error("Error fetching cohort courses:", error);
                }
            } catch (error) {
                console.error("Error fetching cohort:", error);
                setCohort({
                    id: parseInt(cohortId),
                    name: "Cohort (Data Unavailable)",
                    org_id: 0,
                    members: [],
                    groups: []
                });
                setLoading(false);
            }
        };

        fetchCohort();
    }, [cohortId, schoolId]);

    const handleDeleteMember = (member: Member) => {
        setMemberToDelete(member);
        setIsDeleteConfirmOpen(true);
    };

    const confirmDeleteMember = async () => {
        if (!memberToDelete || !cohortId) return;

        try {
            const response = await fetch(`http://localhost:8001/cohorts/${cohortId}/members`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    member_ids: [memberToDelete.id]
                }),
            });

            if (!response.ok) {
                throw new Error(`Failed to delete member: ${response.status}`);
            }

            setCohort(prev => prev ? {
                ...prev,
                members: prev.members.filter(member => member.id !== memberToDelete.id)
            } : null);

        } catch (error) {
            console.error('Error deleting member:', error);
            throw error;
        } finally {
            setIsDeleteConfirmOpen(false);
            setMemberToDelete(null);
        }
    };

    const addMembers = async (emails: string[], roles: string[]) => {
        if (!cohortId) return;

        try {
            const response = await fetch(`http://localhost:8001/cohorts/${cohortId}/members`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    emails,
                    roles,
                }),
            });

            if (!response.ok) {
                throw new Error(`Failed to add members: ${response.status}`);
            }

            const cohortResponse = await fetch(`http://localhost:8001/cohorts/${cohortId}`);
            const cohortData = await cohortResponse.json();
            setCohort({
                ...cohort!,
                members: cohortData.members || [],
            });

        } catch (error) {
            console.error('Error adding members:', error);
            throw error;
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

    if (!cohort) {
        return (
            <div className="min-h-screen bg-black text-white flex items-center justify-center">
                <p>Cohort not found</p>
            </div>
        );
    }

    return (
        <>
            <style jsx global>{`
                button:focus, 
                input:focus, 
                a:focus,
                div:focus,
                *:focus {
                    outline: none !important;
                    box-shadow: none !important;
                }
                
                input::placeholder {
                    color: #666666 !important;
                }
            `}</style>
            <Header showCreateCourseButton={false} />
            <div className="min-h-screen bg-black text-white">
                <div className="container mx-auto px-4 py-8">
                    <main>
                        <div className="mb-10">
                            <div className="flex flex-col">
                                <Link
                                    href={`/schools/${schoolId}#cohorts`}
                                    className="flex items-center text-gray-400 hover:text-white transition-colors mb-4"
                                >
                                    <ArrowLeft size={16} className="mr-2" />
                                    Back To Cohorts
                                </Link>

                                <div className="flex items-center">
                                    <div className="w-12 h-12 bg-purple-700 rounded-lg flex items-center justify-center mr-4">
                                        <Layers size={24} className="text-white" />
                                    </div>
                                    <div>
                                        <h1 className="text-3xl font-light outline-none">
                                            {cohort.name}
                                        </h1>
                                    </div>
                                </div>

                                <div className="mt-6 relative">
                                    <button
                                        data-dropdown-toggle="true"
                                        className="flex items-center space-x-2 px-6 py-2 bg-transparent border text-white border-gray-700 rounded-full hover:bg-gray-900 transition-colors cursor-pointer"
                                        onClick={() => {
                                            setIsDropdownOpen(!isDropdownOpen);
                                            if (!isDropdownOpen) {
                                                // Reset the temporary selected courses when opening the dropdown
                                                setTempSelectedCourses([]);
                                                fetchAvailableCourses();
                                            }
                                        }}
                                    >
                                        <Plus size={16} />
                                        <span>Add Course</span>
                                    </button>

                                    {isDropdownOpen && (
                                        <div
                                            ref={dropdownRef}
                                            onClick={(e) => e.stopPropagation()}
                                            className="absolute top-full left-0 mt-2 w-[400px] bg-[#1A1A1A] border border-gray-800 rounded-lg shadow-xl z-50">
                                            <div className="p-4 pb-2">
                                                {/* Only show search when there are available courses */}
                                                {!(totalSchoolCourses === 0 || availableCourses.length === 0) && (
                                                    <div className="relative">
                                                        <input
                                                            type="text"
                                                            placeholder="Search courses"
                                                            className="w-full bg-[#111] border border-gray-800 rounded-md px-3 py-2 text-white"
                                                            value={courseSearchQuery}
                                                            onChange={handleCourseSearch}
                                                        />
                                                    </div>
                                                )}

                                                {/* Show temporarily selected courses right below the search bar */}
                                                {tempSelectedCourses.length > 0 && (
                                                    <div className="mt-3 flex flex-wrap gap-2">
                                                        {tempSelectedCourses.map(course => (
                                                            <div
                                                                key={course.id}
                                                                className="flex items-center bg-[#222] px-3 py-1 rounded-full"
                                                            >
                                                                <span className="text-white text-sm font-light mr-2">{course.name}</span>
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        removeTempCourse(course.id);
                                                                    }}
                                                                    className="text-gray-400 hover:text-white cursor-pointer"
                                                                >
                                                                    <X size={14} />
                                                                </button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>

                                            <div className="max-h-72 overflow-y-auto py-2 px-2">
                                                {isLoadingCourses ? (
                                                    <div className="flex justify-center items-center py-6">
                                                        <div className="w-8 h-8 border-2 border-t-purple-500 border-r-purple-500 border-b-transparent border-l-transparent rounded-full animate-spin"></div>
                                                    </div>
                                                ) : courseError ? (
                                                    <div className="p-4 text-center">
                                                        <p className="text-red-400 mb-2">{courseError}</p>
                                                        <button
                                                            className="text-purple-400 hover:text-purple-300 cursor-pointer"
                                                            onClick={fetchAvailableCourses}
                                                        >
                                                            Try again
                                                        </button>
                                                    </div>
                                                ) : filteredCourses.length === 0 ? (
                                                    <div className="p-4 text-center">
                                                        {totalSchoolCourses === 0 ? (
                                                            // School has no courses at all
                                                            <>
                                                                <h3 className="text-lg font-light mb-1">No courses available</h3>
                                                                <p className="text-gray-400 text-sm">Create courses in your school first that you can publish to your cohort</p>
                                                                <Link
                                                                    href={`/schools/${schoolId}#courses`}
                                                                    className="mt-4 inline-block px-4 py-2 text-sm bg-white text-black rounded-full hover:opacity-90 transition-opacity"
                                                                >
                                                                    Go to School
                                                                </Link>
                                                            </>
                                                        ) : availableCourses.length === 0 ? (
                                                            // All school courses are already in the cohort
                                                            <>
                                                                <h3 className="text-lg font-light mb-1">No courses left</h3>
                                                                <p className="text-gray-400 text-sm">All courses from your school have been added to this cohort</p>
                                                                <Link
                                                                    href={`/schools/${schoolId}#courses`}
                                                                    className="mt-4 inline-block px-4 py-2 text-sm bg-white text-black rounded-full hover:opacity-90 transition-opacity cursor-pointer"
                                                                >
                                                                    Create more courses
                                                                </Link>
                                                            </>
                                                        ) : tempSelectedCourses.length > 0 ? (
                                                            // All available courses have been temporarily selected
                                                            <>
                                                                <h3 className="text-lg font-light mb-1">All courses selected</h3>
                                                                <p className="text-gray-400 text-sm">You have selected all available courses</p>
                                                            </>
                                                        ) : (
                                                            // Search returned no results
                                                            <>
                                                                <h3 className="text-lg font-light mb-1">No matching courses</h3>
                                                                <p className="text-gray-400 text-sm">Try a different search term</p>
                                                            </>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <div className="space-y-0.5">
                                                        {filteredCourses.map(course => (
                                                            <div
                                                                key={course.id}
                                                                className="flex items-center px-3 py-1.5 hover:bg-[#222] rounded-md cursor-pointer"
                                                                onClick={() => selectCourse(course)}
                                                            >
                                                                <div className="w-6 h-6 bg-purple-900 rounded-md flex items-center justify-center mr-2">
                                                                    <BookOpen size={14} className="text-white" />
                                                                </div>
                                                                <p className="text-white text-sm font-light">{course.name}</p>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}

                                                {/* Add button at the end of the list */}
                                                {(filteredCourses.length > 0 || tempSelectedCourses.length > 0) && (
                                                    <div className="px-2 pt-4 pb-1">
                                                        <button
                                                            className="w-full bg-white text-black py-3 rounded-md text-sm hover:bg-gray-200 transition-colors cursor-pointer"
                                                            onClick={handleAddSelectedCourses}
                                                            disabled={isLoadingCourses}
                                                        >
                                                            {isLoadingCourses ? "Adding..." : "Add courses to cohort"}
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Display selected courses */}
                                {cohort?.courses && cohort.courses.length > 0 && (
                                    <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {cohort.courses.map(course => (
                                            <div
                                                key={course.id}
                                                className="p-4 border border-gray-800 rounded-lg relative group hover:border-gray-700 transition-colors"
                                            >
                                                <button
                                                    className="absolute top-2 right-2 p-1 text-gray-500 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                                                    onClick={() => removeCourseFromCohort(course.id)}
                                                    aria-label="Remove course from cohort"
                                                >
                                                    <X size={16} />
                                                </button>
                                                <div className="flex items-start space-x-3">
                                                    <div className="w-10 h-10 bg-purple-900 rounded-md flex items-center justify-center flex-shrink-0">
                                                        <BookOpen size={18} className="text-white" />
                                                    </div>
                                                    <div>
                                                        <h3 className="text-lg font-light">{course.name}</h3>
                                                        <p className="text-gray-400 text-sm mt-1">
                                                            {course.moduleCount || 0} modules
                                                        </p>
                                                        <Link
                                                            href={`/schools/${schoolId}/courses/${course.id}`}
                                                            className="text-xs text-purple-400 hover:text-purple-300 inline-flex items-center mt-2"
                                                        >
                                                            <span>View course</span>
                                                            <ChevronDown size={14} className="ml-1 transform -rotate-90" />
                                                        </Link>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="mb-8">
                            <div className="flex border-b border-gray-800">
                                <button
                                    className={`px-4 py-2 font-light cursor-pointer ${tab === 'learners' ? 'text-white border-b-2 border-white' : 'text-gray-400 hover:text-white'}`}
                                    onClick={() => setTab('learners')}
                                >
                                    <div className="flex items-center">
                                        <Users size={16} className="mr-2" />
                                        Learners
                                    </div>
                                </button>
                                <button
                                    className={`px-4 py-2 font-light cursor-pointer ${tab === 'mentors' ? 'text-white border-b-2 border-white' : 'text-gray-400 hover:text-white'}`}
                                    onClick={() => setTab('mentors')}
                                >
                                    <div className="flex items-center">
                                        <BookOpen size={16} className="mr-2" />
                                        Mentors
                                    </div>
                                </button>
                            </div>
                        </div>

                        {tab === 'learners' && (
                            <div>
                                {cohort?.members?.filter(m => m.role === 'learner').length > 0 && (
                                    <div className="flex justify-between items-center mb-6">
                                        <div className="w-1"></div>
                                        <button
                                            className="px-6 py-2 bg-white text-black text-sm font-medium rounded-full hover:opacity-90 transition-opacity focus:outline-none cursor-pointer"
                                            onClick={() => setIsAddLearnersOpen(true)}
                                        >
                                            Add Learners
                                        </button>
                                    </div>
                                )}

                                {cohort?.members?.filter(m => m.role === 'learner').length > 0 ? (
                                    <div className="overflow-hidden rounded-lg border border-gray-800">
                                        <table className="min-w-full divide-y divide-gray-800">
                                            <thead className="bg-gray-900">
                                                <tr>
                                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Email</th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-[#111] divide-y divide-gray-800">
                                                {cohort?.members?.filter(member => member.role === 'learner').map(learner => (
                                                    <tr key={learner.id}>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300 flex justify-between items-center">
                                                            {learner.email}
                                                            <button
                                                                onClick={() => handleDeleteMember(learner)}
                                                                className="text-gray-400 hover:text-white transition-colors focus:outline-none cursor-pointer"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-20">
                                        <h2 className="text-4xl font-light mb-4">Start building your cohort</h2>
                                        <p className="text-gray-400 mb-8">Add learners to create an engaging learning community</p>
                                        <button
                                            className="px-6 py-2 bg-white text-black text-sm font-medium rounded-full hover:opacity-90 transition-opacity focus:outline-none cursor-pointer"
                                            onClick={() => setIsAddLearnersOpen(true)}
                                        >
                                            Add Learners
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        {tab === 'mentors' && (
                            <div>
                                {cohort?.members?.filter(m => m.role === 'mentor').length > 0 && (
                                    <div className="flex justify-between items-center mb-6">
                                        <div className="w-1"></div>
                                        <button
                                            className="px-6 py-2 bg-white text-black text-sm font-medium rounded-full hover:opacity-90 transition-opacity focus:outline-none cursor-pointer"
                                            onClick={() => setIsAddMentorsOpen(true)}
                                        >
                                            Add Mentors
                                        </button>
                                    </div>
                                )}

                                {cohort?.members?.filter(m => m.role === 'mentor').length > 0 ? (
                                    <div className="overflow-hidden rounded-lg border border-gray-800">
                                        <table className="min-w-full divide-y divide-gray-800">
                                            <thead className="bg-gray-900">
                                                <tr>
                                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Email</th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-[#111] divide-y divide-gray-800">
                                                {cohort?.members?.filter(member => member.role === 'mentor').map(mentor => (
                                                    <tr key={mentor.id}>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300 flex justify-between items-center">
                                                            {mentor.email}
                                                            <button
                                                                onClick={() => handleDeleteMember(mentor)}
                                                                className="text-gray-400 hover:text-white transition-colors focus:outline-none cursor-pointer"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-20">
                                        <h2 className="text-4xl font-light mb-4">Guide your learners</h2>
                                        <p className="text-gray-400 mb-8">Add mentors to support and inspire your learners</p>
                                        <button
                                            className="px-6 py-2 bg-white text-black text-sm font-medium rounded-full hover:opacity-90 transition-opacity focus:outline-none cursor-pointer"
                                            onClick={() => setIsAddMentorsOpen(true)}
                                        >
                                            Add Mentors
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </main>
                </div>
            </div>

            {isAddLearnersOpen && (
                <div
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
                    onClick={() => setIsAddLearnersOpen(false)}
                >
                    <div
                        className="w-full max-w-2xl bg-[#1A1A1A] rounded-lg shadow-2xl border border-gray-800"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="flex flex-col p-6 border-b border-gray-800">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-light text-white">Add Learners</h2>
                                <button
                                    onClick={() => setIsAddLearnersOpen(false)}
                                    className="text-gray-400 hover:text-white transition-colors focus:outline-none cursor-pointer"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                            <p className="text-gray-400 mt-2 text-sm">Invite learners to join your cohort by adding their email address</p>
                        </div>

                        <div className="px-6 py-4">
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="flex items-center gap-3 text-gray-400 hover:text-white transition-colors cursor-pointer w-full mb-4 bg-[#0A0A0A] rounded-lg p-4 border border-dashed border-gray-800 hover:border-white hover:bg-[#111] focus:outline-none"
                            >
                                <Upload size={20} className="text-gray-400" />
                                <div className="flex flex-col items-start">
                                    <span className="text-white text-base">Import CSV</span>
                                    <span className="text-gray-400 text-sm">Upload a CSV file with one email per row</span>
                                </div>
                            </button>
                            <input
                                type="file"
                                ref={fileInputRef}
                                accept=".csv"
                                className="hidden"
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                        const reader = new FileReader();
                                        reader.onload = (event) => {
                                            const text = event.target?.result as string;
                                            const emails = text.split(/\r?\n/).filter(email => email.trim());
                                            const newInputs = emails.map((email, index) => ({
                                                id: Math.random().toString(),
                                                email: email.trim(),
                                                error: validateEmail(email.trim()) ? undefined : 'Invalid email'
                                            }));
                                            setEmailInputs(newInputs);
                                        };
                                        reader.readAsText(file);
                                    }
                                }}
                            />

                            <div
                                ref={scrollContainerRef}
                                className="max-h-[300px] overflow-y-auto pr-2 space-y-2 scrollbar-thin scrollbar-thumb-gray-800 scrollbar-track-transparent"
                            >
                                {emailInputs.map((input, index) => (
                                    <div key={input.id} className="flex items-center gap-2">
                                        <div className="flex-1">
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                                                    <Mail
                                                        size={18}
                                                        className={`transition-colors ${focusedInputId === input.id ? 'text-white' : 'text-gray-500'}`}
                                                    />
                                                </div>
                                                <input
                                                    ref={el => {
                                                        inputRefs.current[input.id] = el;
                                                    }}
                                                    type="email"
                                                    value={input.email}
                                                    onChange={(e) => {
                                                        const newInputs = [...emailInputs];
                                                        newInputs[index].email = e.target.value;
                                                        newInputs[index].error = validateEmail(e.target.value) ? undefined : 'Invalid email';
                                                        setEmailInputs(newInputs);
                                                    }}
                                                    onFocus={() => setFocusedInputId(input.id)}
                                                    onBlur={() => setFocusedInputId(null)}
                                                    placeholder="Enter email address"
                                                    className={`w-full bg-[#0A0A0A] pl-10 pr-4 py-3 rounded-lg text-white placeholder-gray-500 focus:outline-none ${input.error && focusedInputId !== input.id
                                                        ? 'border-2 border-red-500'
                                                        : focusedInputId === input.id
                                                            ? 'border border-white'
                                                            : 'border-0'
                                                        } focus:border focus:!border-white focus:ring-0 transition-all duration-0`}
                                                />
                                            </div>
                                            {input.error && focusedInputId !== input.id && (
                                                <p className="text-red-500 text-sm mt-1">{input.error}</p>
                                            )}
                                        </div>
                                        {emailInputs.length > 1 && (
                                            <button
                                                onClick={() => {
                                                    setEmailInputs(emailInputs.filter(e => e.id !== input.id));
                                                }}
                                                className="text-gray-400 hover:text-white transition-colors p-2 cursor-pointer focus:outline-none self-start mt-1.5"
                                            >
                                                <Trash2 size={20} />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>

                            <button
                                onClick={() => {
                                    const newId = Math.random().toString();
                                    setEmailInputs([...emailInputs, { id: newId, email: '' }]);
                                    setFocusedInputId(newId);
                                }}
                                className="flex items-center gap-2 text-gray-400 hover:text-white w-full py-3 px-4 rounded-lg transition-colors mt-4 cursor-pointer focus:outline-none hover:bg-[#111]"
                            >
                                <Plus size={20} />
                                <span>Add another email</span>
                            </button>
                        </div>

                        <div className="flex justify-end gap-4 px-6 py-4 border-t border-gray-800">
                            <button
                                onClick={() => {
                                    setIsAddLearnersOpen(false);
                                    setEmailInputs([{ id: '1', email: '' }]);
                                }}
                                className="px-4 py-2 text-gray-400 hover:text-white transition-colors font-light cursor-pointer focus:outline-none"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={async () => {
                                    const newInputs = emailInputs.map(input => ({
                                        ...input,
                                        error: !input.email.trim() ? 'Email is required' :
                                            !validateEmail(input.email.trim()) ? 'Invalid email' :
                                                undefined
                                    }));
                                    setEmailInputs(newInputs);

                                    if (!newInputs.some(input => input.error)) {
                                        const validEmails = newInputs
                                            .filter(input => input.email.trim())
                                            .map(input => input.email.trim());

                                        setIsSubmitting(true);
                                        try {
                                            await addMembers(validEmails, validEmails.map(() => 'learner'));
                                            setIsAddLearnersOpen(false);
                                            setEmailInputs([{ id: '1', email: '' }]);
                                        } catch (error) {
                                            console.error('Failed to add learners:', error);
                                        } finally {
                                            setIsSubmitting(false);
                                        }
                                    }
                                }}
                                disabled={!emailInputs.some(input => input.email.trim() && !input.error) || isSubmitting}
                                className="px-6 py-2 bg-white text-black text-sm font-medium rounded-full hover:opacity-90 transition-opacity focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                            >
                                {isSubmitting ? 'Adding...' : 'Add courses to cohort'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {isAddMentorsOpen && (
                <div
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
                    onClick={() => setIsAddMentorsOpen(false)}
                >
                    <div
                        className="w-full max-w-2xl bg-[#1A1A1A] rounded-lg shadow-2xl border border-gray-800"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="flex flex-col p-6 border-b border-gray-800">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-light text-white">Add Mentors</h2>
                                <button
                                    onClick={() => setIsAddMentorsOpen(false)}
                                    className="text-gray-400 hover:text-white transition-colors focus:outline-none cursor-pointer"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                            <p className="text-gray-400 mt-2 text-sm">Invite mentors to join your cohort by adding their email address</p>
                        </div>

                        <div className="px-6 py-4">
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="flex items-center gap-3 text-gray-400 hover:text-white transition-colors cursor-pointer w-full mb-4 bg-[#0A0A0A] rounded-lg p-4 border border-dashed border-gray-800 hover:border-white hover:bg-[#111] focus:outline-none"
                            >
                                <Upload size={20} className="text-gray-400" />
                                <div className="flex flex-col items-start">
                                    <span className="text-white text-base">Import CSV</span>
                                    <span className="text-gray-400 text-sm">Upload a CSV file with one email per row</span>
                                </div>
                            </button>

                            <div
                                ref={scrollContainerRef}
                                className="max-h-[300px] overflow-y-auto pr-2 space-y-2 scrollbar-thin scrollbar-thumb-gray-800 scrollbar-track-transparent"
                            >
                                {emailInputs.map((input, index) => (
                                    <div key={input.id} className="flex items-center gap-2">
                                        <div className="flex-1">
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                                                    <Mail
                                                        size={18}
                                                        className={`transition-colors ${focusedInputId === input.id ? 'text-white' : 'text-gray-500'}`}
                                                    />
                                                </div>
                                                <input
                                                    ref={el => {
                                                        inputRefs.current[input.id] = el;
                                                    }}
                                                    type="email"
                                                    value={input.email}
                                                    onChange={(e) => {
                                                        const newInputs = [...emailInputs];
                                                        newInputs[index].email = e.target.value;
                                                        newInputs[index].error = validateEmail(e.target.value) ? undefined : 'Invalid email';
                                                        setEmailInputs(newInputs);
                                                    }}
                                                    onFocus={() => setFocusedInputId(input.id)}
                                                    onBlur={() => setFocusedInputId(null)}
                                                    placeholder="Enter email address"
                                                    className={`w-full bg-[#0A0A0A] pl-10 pr-4 py-3 rounded-lg text-white placeholder-gray-500 focus:outline-none ${input.error && focusedInputId !== input.id
                                                        ? 'border-2 border-red-500'
                                                        : focusedInputId === input.id
                                                            ? 'border border-white'
                                                            : 'border-0'
                                                        } focus:border focus:!border-white focus:ring-0 transition-all duration-0`}
                                                />
                                            </div>
                                            {input.error && focusedInputId !== input.id && (
                                                <p className="text-red-500 text-sm mt-1">{input.error}</p>
                                            )}
                                        </div>
                                        {emailInputs.length > 1 && (
                                            <button
                                                onClick={() => {
                                                    setEmailInputs(emailInputs.filter(e => e.id !== input.id));
                                                }}
                                                className="text-gray-400 hover:text-white transition-colors p-2 cursor-pointer focus:outline-none self-start mt-1.5"
                                            >
                                                <Trash2 size={20} />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>

                            <button
                                onClick={() => {
                                    const newId = Math.random().toString();
                                    setEmailInputs([...emailInputs, { id: newId, email: '' }]);
                                    setFocusedInputId(newId);
                                }}
                                className="flex items-center gap-2 text-gray-400 hover:text-white w-full py-3 px-4 rounded-lg transition-colors mt-4 cursor-pointer focus:outline-none hover:bg-[#111]"
                            >
                                <Plus size={20} />
                                <span>Add another email</span>
                            </button>
                        </div>

                        <div className="flex justify-end gap-4 px-6 py-4 border-t border-gray-800">
                            <button
                                onClick={() => {
                                    setIsAddMentorsOpen(false);
                                    setEmailInputs([{ id: '1', email: '' }]);
                                }}
                                className="px-4 py-2 text-gray-400 hover:text-white transition-colors font-light cursor-pointer focus:outline-none"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={async () => {
                                    const newInputs = emailInputs.map(input => ({
                                        ...input,
                                        error: !input.email.trim() ? 'Email is required' :
                                            !validateEmail(input.email.trim()) ? 'Invalid email' :
                                                undefined
                                    }));
                                    setEmailInputs(newInputs);

                                    if (!newInputs.some(input => input.error)) {
                                        const validEmails = newInputs
                                            .filter(input => input.email.trim())
                                            .map(input => input.email.trim());

                                        setIsSubmitting(true);
                                        try {
                                            await addMembers(validEmails, validEmails.map(() => 'mentor'));
                                            setIsAddMentorsOpen(false);
                                            setEmailInputs([{ id: '1', email: '' }]);
                                        } catch (error) {
                                            console.error('Failed to add mentors:', error);
                                        } finally {
                                            setIsSubmitting(false);
                                        }
                                    }
                                }}
                                disabled={!emailInputs.some(input => input.email.trim() && !input.error) || isSubmitting}
                                className="px-6 py-2 bg-white text-black text-sm font-medium rounded-full hover:opacity-90 transition-opacity focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                            >
                                {isSubmitting ? 'Adding...' : 'Add'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <ConfirmationDialog
                open={isDeleteConfirmOpen}
                title={`Remove ${memberToDelete?.role === 'learner' ? 'Learner' : 'Mentor'}`}
                message={`Are you sure you want to remove ${memberToDelete?.email} from this cohort?`}
                confirmButtonText="Remove"
                onConfirm={confirmDeleteMember}
                onCancel={() => setIsDeleteConfirmOpen(false)}
            />
        </>
    );
}

function validateEmail(email: string): boolean {
    if (!email) return true;
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
} 