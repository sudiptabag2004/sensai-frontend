import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

export function Header() {
    return (
        <header className="border-b">
            <div className="container flex h-16 items-center justify-between px-4 md:px-6">
                <Link href="/" className="flex items-center gap-2">
                    <span className="text-2xl font-bold">LearnSense</span>
                    <span className="rounded-md bg-primary px-2 py-1 text-xs text-primary-foreground">
                        AI-Powered LMS
                    </span>
                </Link>
                <nav className="hidden md:flex gap-6">
                    <Link
                        href="/dashboard"
                        className="text-sm font-medium hover:underline underline-offset-4"
                    >
                        Dashboard
                    </Link>
                    <Link
                        href="/courses"
                        className="text-sm font-medium hover:underline underline-offset-4"
                    >
                        Courses
                    </Link>
                    <Link
                        href="/cohorts"
                        className="text-sm font-medium hover:underline underline-offset-4"
                    >
                        Cohorts
                    </Link>
                    <Link
                        href="/analytics"
                        className="text-sm font-medium hover:underline underline-offset-4"
                    >
                        Analytics
                    </Link>
                </nav>
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" className="md:hidden">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="h-6 w-6"
                        >
                            <line x1="4" x2="20" y1="12" y2="12" />
                            <line x1="4" x2="20" y1="6" y2="6" />
                            <line x1="4" x2="20" y1="18" y2="18" />
                        </svg>
                        <span className="sr-only">Toggle Menu</span>
                    </Button>
                    <Avatar>
                        <AvatarImage src="/placeholder-user.jpg" alt="User" />
                        <AvatarFallback>U</AvatarFallback>
                    </Avatar>
                </div>
            </div>
        </header>
    );
} 