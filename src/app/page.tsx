import Link from "next/link";
import { Button } from "@/components/ui/button";
import Image from "next/image";

export default function Home() {
  return (
    <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center px-4">
      <a
        href="/courses/create"
        className="px-6 py-3 bg-black dark:bg-white text-white dark:text-black text-sm font-medium rounded-full hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 dark:focus:ring-gray-100"
      >
        Create a course
      </a>
    </div>
  );
}
