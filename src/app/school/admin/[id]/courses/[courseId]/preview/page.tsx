import { Metadata } from 'next';
import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { Header } from "@/components/layout/header";
import LearnerCourseView from "@/components/LearnerCourseView";
import { Module, ModuleItem } from "@/types/course";
import ClientPreviewWrapper from './ClientPreviewWrapper';

// Define Milestone interface for the API response
interface Milestone {
    id: number;
    name: string;
    color: string;
    ordering: number;
    tasks?: Task[];
}

interface Task {
    id: number;
    title: string;
    type: string;
    status: string;
    ordering: number;
    content?: any[]; // Content for learning materials
    questions?: any[]; // Questions for quizzes and exams
}

export async function generateMetadata(
    { params }: { params: { id: string, courseId: string } }
): Promise<Metadata> {
    try {
        const courseResponse = await fetch(`${process.env.BACKEND_URL}/courses/${params.courseId}`, {
            cache: 'no-store'
        });

        if (!courseResponse.ok) {
            return {
                title: 'Course Preview - Not Found',
                description: 'The requested course could not be found.'
            };
        }

        const course = await courseResponse.json();

        return {
            title: `${course.name} - Course Preview`,
            description: `Preview of the course "${course.name}"`
        };
    } catch (error) {
        return {
            title: 'Course Preview',
            description: 'Preview of a course'
        };
    }
}

export default async function PreviewPage({ params }: { params: { id: string, courseId: string } }) {
    const orgId = params.id;
    const courseId = params.courseId;

    try {
        // Make a single API call to get all course data
        const response = await fetch(`${process.env.BACKEND_URL}/courses/${courseId}`, {
            cache: 'no-store'
        });

        if (!response.ok) {
            notFound();
        }

        const data = await response.json();
        const courseTitle = data.name;

        // Initialize modules array
        let modules: Module[] = [];

        // Check if milestones are available in the response
        if (data.milestones && Array.isArray(data.milestones)) {
            // Transform milestones to match our Module interface
            modules = data.milestones.map((milestone: Milestone) => {
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
                                content: task.content || [],
                                status: task.status
                            });
                        } else if (task.type === 'quiz') {
                            moduleItems.push({
                                id: task.id.toString(),
                                title: task.title,
                                position: task.ordering,
                                type: 'quiz',
                                questions: task.questions || [],
                                status: task.status
                            });
                        } else if (task.type === 'exam') {
                            moduleItems.push({
                                id: task.id.toString(),
                                title: task.title,
                                position: task.ordering,
                                type: 'exam',
                                questions: task.questions || [],
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
            modules.sort((a, b) => a.position - b.position);
        }

        return (
            <div className="min-h-screen bg-white dark:bg-black">
                {/* Preview announcement banner */}
                <div className="bg-[#111111] border-b border-gray-800 text-white py-3 px-4 text-center shadow-sm">
                    <p className="font-light text-sm">You are viewing a preview of this course. This is how it will appear to learners.</p>
                </div>

                <div className="px-8 py-12 flex-1 flex flex-col h-[calc(100vh-48px)]">
                    <div className="max-w-5xl mx-auto w-full flex flex-col flex-1">
                        <Suspense fallback={<div>Loading...</div>}>
                            {modules.length > 0 ? (
                                <>
                                    <h1 className="text-4xl font-light text-black dark:text-white mb-16">{data.name}</h1>
                                    <ClientPreviewWrapper
                                        courseTitle=""
                                        modules={modules}
                                        isPreview={true}
                                        schoolId={orgId}
                                    />
                                </>
                            ) : (
                                <div className="flex items-center justify-center flex-1">
                                    <div className="flex flex-col items-center justify-center text-center max-w-md">
                                        <h1 className="text-4xl font-light text-black dark:text-white mb-6">Your learning adventure awaits!</h1>
                                        <p className="text-gray-600 dark:text-gray-400 text-lg">This course is still being crafted with care. Check back soon to begin your journey.</p>
                                    </div>
                                </div>
                            )}
                        </Suspense>
                    </div>
                </div>
            </div>
        );
    } catch (error) {
        console.error('Error fetching course data:', error);
        notFound();
    }
} 