"use client";

import { useState, useEffect } from "react";
import LearnerCourseView from "@/components/LearnerCourseView";
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
    isPreview,
    schoolId,
    cohortId
}: ClientPreviewWrapperProps) {
    // For preview mode, we use LearnerCourseView directly to ensure full-width display
    // without the sidebar that LearnerCohortView would add
    return (
        <LearnerCourseView
            courseTitle={courseTitle}
            modules={modules}
            completedTaskIds={{}}
            completedQuestionIds={{}}
        />
    );
} 