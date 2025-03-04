import Link from "next/link";

interface CourseCardProps {
    course: {
        id: number;
        title: string;
        moduleCount: number;
        description?: string;
        role?: 'teacher' | 'learner';
    };
}

export default function CourseCard({ course }: CourseCardProps) {
    // Generate a unique border color based on the course id
    const getBorderColor = () => {
        const colors = [
            'border-purple-500',
            'border-green-500',
            'border-pink-500',
            'border-yellow-500',
            'border-blue-500',
            'border-red-500',
            'border-indigo-500',
            'border-orange-500'
        ];
        return colors[course.id % colors.length];
    };

    return (
        <Link href={`/courses/${course.id}`} className="block h-full">
            <div className={`bg-[#1A1A1A] text-gray-300 rounded-lg p-6 h-full transition-all hover:opacity-90 cursor-pointer border-b-2 ${getBorderColor()} border-opacity-70`}>
                <h2 className="text-xl font-light mb-2">{course.title}</h2>
                {course.description && (
                    <p className="text-gray-400 text-sm mb-4">
                        {course.description}
                    </p>
                )}
                <div className="text-sm text-gray-400">
                    {course.moduleCount} modules
                </div>
            </div>
        </Link>
    );
} 