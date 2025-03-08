"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function CourseCreateRedirect() {
    const router = useRouter();

    useEffect(() => {
        // Get the school ID from localStorage or use a default
        const schoolId = localStorage.getItem("schoolId") || "1";
        // Redirect to the new course creation page
        router.push(`/schools/${schoolId}/courses/create`);
    }, [router]);

    return (
        <div className="min-h-screen bg-black text-white flex items-center justify-center">
            <p>Redirecting to course creation page...</p>
        </div>
    );
} 