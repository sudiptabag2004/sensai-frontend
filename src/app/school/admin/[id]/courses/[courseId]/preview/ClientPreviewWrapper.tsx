"use client";

import { useState, useEffect } from "react";
import LearnerCohortView from "@/components/LearnerCohortView";
import { Module } from "@/types/course";

interface ClientPreviewWrapperProps {
    courseTitle: string;
    modules: Module[];
    isPreview: boolean;
    schoolId: string;
    cohortId?: string;
}

export default function ClientPreviewWrapper({
    courseTitle,
    modules,
    schoolId,
    cohortId
}: ClientPreviewWrapperProps) {
    // Client-side state and effects can be used here
    // For example:
    // const [activeModuleId, setActiveModuleId] = useState<string | null>(null);

    // useEffect(() => {
    //   // Any client-side effects that were in the original component
    // }, []);

    return (
        <LearnerCohortView
            courseTitle={courseTitle}
            modules={modules}
            schoolId={schoolId}
            cohortId={cohortId}
        />
    );
} 