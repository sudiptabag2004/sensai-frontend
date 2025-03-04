import Link from "next/link";
import Image from "next/image";
import ClientCourseView from "./ClientCourseView";

export default function CourseView({ params }: { params: { id: string } }) {
    return <ClientCourseView id={params.id} />;
} 