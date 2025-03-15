"use client";

import { useState, useEffect } from "react";
import LearnerCourseView from "@/components/LearnerCourseView";
import { Module } from "@/types/course";

interface ClientPreviewWrapperProps {
    courseTitle: string;
    modules: Module[];
    isPreview: boolean;
    schoolId: string;
}

export default function ClientPreviewWrapper({
    courseTitle,
    modules,
    schoolId
}: ClientPreviewWrapperProps) {
    // Client-side state and effects can be used here
    // For example:
    // const [activeModuleId, setActiveModuleId] = useState<string | null>(null);

    // useEffect(() => {
    //   // Any client-side effects that were in the original component
    // }, []);

    return (
        <LearnerCourseView
            courseTitle={courseTitle}
            modules={modules}
            schoolId={schoolId}
        />
    );
} 