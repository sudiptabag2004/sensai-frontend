"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import CourseCard from "@/components/CourseCard";
import { useState, useRef, useEffect } from "react";
import { Header } from "@/components/layout/header";
import { Users } from "lucide-react";
import { useRouter } from "next/navigation";

interface Course {
  id: number;
  title: string;
  moduleCount: number;
  description?: string;
  role?: 'teacher' | 'learner';
}

export default function Home() {
  const router = useRouter();
  // Hardcoded dummy courses for visualization
  const courses: Course[] = [
    {
      id: 1,
      title: "Introduction to AI",
      moduleCount: 5,
      description: "Learn the fundamentals of artificial intelligence and machine learning",
      role: 'teacher'
    },
    {
      id: 2,
      title: "Web Development Fundamentals",
      moduleCount: 8,
      description: "Master HTML, CSS, and JavaScript to build modern websites",
      role: 'teacher'
    },
    // {
    //   id: 3,
    //   title: "Data Science Basics",
    //   moduleCount: 6,
    //   description: "Explore data analysis techniques and visualization tools",
    //   role: 'learner'
    // },
    // {
    //   id: 4,
    //   title: "UX Design Principles",
    //   moduleCount: 4,
    //   description: "Understand user experience design and create intuitive interfaces",
    //   role: 'learner'
    // }
  ];

  // Filter courses by role
  const teachingCourses = courses.filter(course => course.role === 'teacher');
  const learningCourses = courses.filter(course => course.role === 'learner');

  // Determine course availability
  const hasTeachingCourses = teachingCourses.length > 0;
  const hasLearningCourses = learningCourses.length > 0;
  const showSegmentedTabs = hasTeachingCourses && hasLearningCourses;

  // Automatically determine the initial active tab based on available courses
  const initialActiveTab = hasLearningCourses && !hasTeachingCourses ? 'learning' : 'teaching';
  const [activeTab, setActiveTab] = useState<'teaching' | 'learning'>(initialActiveTab);

  // Check if there are any courses at all
  const hasAnyCourses = hasTeachingCourses || hasLearningCourses;

  // State to track if user has a school
  const [hasSchool, setHasSchool] = useState<boolean | null>(null);
  const [schoolId, setSchoolId] = useState<string>("1"); // Mock school ID

  // Auto-adjust active tab if the selected tab has no courses
  useEffect(() => {
    if (activeTab === 'teaching' && !hasTeachingCourses && hasLearningCourses) {
      setActiveTab('learning');
    } else if (activeTab === 'learning' && !hasLearningCourses && hasTeachingCourses) {
      setActiveTab('teaching');
    }

    // Check if user has a school
    const userHasSchool = localStorage.getItem("hasSchool") === "true";
    setHasSchool(userHasSchool);
  }, [hasTeachingCourses, hasLearningCourses, activeTab]);

  // Determine the heading to display
  const getHeading = () => {
    // For the special case of only having learner courses
    if (hasLearningCourses && !hasTeachingCourses) {
      return 'Enrolled Courses';
    }

    // For the special case of only having teacher courses
    if (hasTeachingCourses && !hasLearningCourses) {
      return 'Your Courses';
    }

    // If both types exist, display heading based on active tab
    return activeTab === 'teaching' ? 'Your Courses' : 'Enrolled Courses';
  };

  // Handle Create Course / Your School button click
  const handleCreateCourseButtonClick = (e: React.MouseEvent) => {
    e.preventDefault();

    // If user has a school, go to school admin page, otherwise go to school creation page
    if (hasSchool) {
      router.push(`/schools/${schoolId}/courses/create`);
    } else {
      router.push("/schools/create");
    }
  };

  return (
    <>
      {/* Global styles to remove focus outlines */}
      <style jsx global>{`
        button:focus {
          outline: none !important;
          box-shadow: none !important;
          border: none !important;
        }
      `}</style>

      <div className="min-h-screen bg-black text-white">
        {/* Use the reusable Header component */}
        <Header showCreateCourseButton={hasAnyCourses || (hasSchool ?? false)} />

        {/* Main content */}
        <main className="max-w-5xl mx-auto pt-6 px-8">
          {/* Segmented control for tabs */}
          {showSegmentedTabs && (
            <div className="flex justify-center mb-8">
              <div className="inline-flex bg-[#222222] rounded-lg p-1">
                <button
                  className={`flex items-center px-4 py-2 rounded-md text-sm font-medium cursor-pointer ${activeTab === 'teaching'
                    ? 'bg-[#333333] text-white'
                    : 'text-gray-400 hover:text-white'
                    }`}
                  onClick={() => setActiveTab('teaching')}
                >
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 6.25278V19.2528M12 6.25278C10.8321 5.47686 9.24649 5 7.5 5C5.75351 5 4.16789 5.47686 3 6.25278V19.2528C4.16789 18.4769 5.75351 18 7.5 18C9.24649 18 10.8321 18.4769 12 19.2528M12 6.25278C13.1679 5.47686 14.7535 5 16.5 5C18.2465 5 19.8321 5.47686 21 6.25278V19.2528C19.8321 18.4769 18.2465 18 16.5 18C14.7535 18 13.1679 18.4769 12 19.2528" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Your Courses
                </button>
                <button
                  className={`flex items-center px-4 py-2 rounded-md text-sm font-medium cursor-pointer ${activeTab === 'learning'
                    ? 'bg-[#333333] text-white'
                    : 'text-gray-400 hover:text-white'
                    }`}
                  onClick={() => setActiveTab('learning')}
                >
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Enrolled Courses
                </button>
              </div>
            </div>
          )}

          {/* Display content based on courses availability */}
          <div className="mb-8">
            {!hasTeachingCourses && !hasLearningCourses ? (
              // No courses at all - show universal placeholder
              <div className="text-center py-12">
                <h2 className="text-2xl font-medium mb-2">What if your next big idea became a course?</h2>
                <p className="text-gray-400 mb-6">It might be easier than you think</p>
                <div className="flex justify-center gap-4">
                  <button
                    onClick={handleCreateCourseButtonClick}
                    className="px-6 py-3 bg-white text-black text-sm font-medium rounded-full hover:opacity-90 transition-opacity inline-block cursor-pointer"
                  >
                    Create Course
                  </button>
                </div>
              </div>
            ) : (
              // User has some courses, show appropriate heading
              <h2 className="text-2xl font-medium">
                {getHeading()}
              </h2>
            )}
          </div>

          {/* Course grid */}
          {hasAnyCourses && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {(activeTab === 'teaching' ? teachingCourses : learningCourses).map((course) => (
                <CourseCard
                  key={course.id}
                  course={course}
                />
              ))}
            </div>
          )}
        </main>
      </div>
    </>
  );
}
