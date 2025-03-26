"use client";

import { signIn, useSession } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";

// Create a separate component that uses useSearchParams
function LoginContent() {
    const router = useRouter();
    const { data: session, status } = useSession();
    const searchParams = useSearchParams();
    const callbackUrl = searchParams.get("callbackUrl") || "/";

    // Redirect if already authenticated
    useEffect(() => {
        if (session) {
            router.push(callbackUrl);
        }
    }, [session, callbackUrl, router]);

    const handleGoogleLogin = () => {
        signIn("google", { callbackUrl });
    };

    // Show loading state while checking session
    if (status === "loading") {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-black px-4">
                <div className="w-12 h-12 border-t-2 border-b-2 border-white rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-purple-900/20 via-black to-black flex flex-col justify-center items-center px-4 py-12">
            <div className="w-full max-w-5xl mx-auto relative">
                {/* Logo */}
                <div className="absolute -top-16 left-1/2 transform -translate-x-1/2 md:left-0 md:translate-x-0">
                    <Image
                        src="/images/sensai-logo.svg"
                        alt="SensAI Logo"
                        width={160}
                        height={53}
                        priority
                    />
                </div>

                {/* Content */}
                <div className="md:grid md:grid-cols-12 gap-8 items-center mt-8">
                    {/* Main copy - spans 7 columns on desktop */}
                    <div className="md:col-span-7 mb-8 md:mb-0 text-center md:text-left">
                        <h1 className="text-4xl md:text-5xl font-light text-white leading-tight">
                            <span className="text-white">Teach </span>
                            <span className="text-purple-400">smarter</span>
                        </h1>
                        <h1 className="text-4xl md:text-5xl font-light text-white leading-tight">
                            <span className="text-white">Reach </span>
                            <span className="text-purple-400">further</span>
                        </h1>

                        <p className="text-xl text-gray-300 mt-6 mb-6 max-w-2xl">
                            SensAI coaches your students through questions that develop deeper thinking—just like you would, but for every student and all the time
                        </p>
                    </div>

                    {/* Login card - spans 5 columns on desktop */}
                    <div className="md:col-span-5">
                        <div className="bg-gray-900/70 backdrop-blur-md shadow-2xl rounded-2xl overflow-hidden border border-gray-800">
                            <div className="p-8">

                                <button
                                    onClick={handleGoogleLogin}
                                    className="flex items-center justify-center w-full py-3 px-4 bg-white border border-gray-300 rounded-full text-black hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer mb-8"
                                >
                                    <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                                        <path
                                            fill="#4285F4"
                                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                        />
                                        <path
                                            fill="#34A853"
                                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                        />
                                        <path
                                            fill="#FBBC05"
                                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                                        />
                                        <path
                                            fill="#EA4335"
                                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                        />
                                    </svg>
                                    Sign Up With Google
                                </button>

                                <div className="relative">
                                    <div className="absolute inset-0 flex items-center">
                                        <div className="w-full border-t border-gray-700"></div>
                                    </div>
                                    <div className="relative flex justify-center text-sm">
                                        <span className="px-2 bg-gray-900/70 text-gray-400">Why SensAI?</span>
                                    </div>
                                </div>

                                <div className="mt-6 space-y-4">
                                    <div className="flex items-start">
                                        <div className="flex-shrink-0 h-6 w-6 flex items-center justify-center rounded-full bg-purple-900/50 mr-3 mt-0.5">
                                            <svg className="h-3.5 w-3.5 text-purple-400" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                                            </svg>
                                        </div>
                                        <p className="text-sm text-gray-300">Socratic teaching using AI that asks deeper questions to help students learn to think on their own</p>
                                    </div>
                                    <div className="flex items-start">
                                        <div className="flex-shrink-0 h-6 w-6 flex items-center justify-center rounded-full bg-purple-900/50 mr-3 mt-0.5">
                                            <svg className="h-3.5 w-3.5 text-purple-400" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                                            </svg>
                                        </div>
                                        <p className="text-sm text-gray-300">Available 24x7 to support every student so that you can choose where you are needed the most</p>
                                    </div>
                                    <div className="flex items-start">
                                        <div className="flex-shrink-0 h-6 w-6 flex items-center justify-center rounded-full bg-purple-900/50 mr-3 mt-0.5">
                                            <svg className="h-3.5 w-3.5 text-purple-400" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                                            </svg>
                                        </div>
                                        <p className="text-sm text-gray-300">Maintain your quality of teaching while increasing your reach and impact</p>
                                    </div>
                                </div>
                            </div>

                            <div className="px-8 py-4 bg-gray-900/90 border-t border-gray-800">
                                <p className="text-xs text-gray-500">
                                    By continuing, you acknowledge that you understand and agree to the{" "}
                                    <Link href="https://hyperverge.notion.site/SensAI-Terms-of-Use-1627e7c237cb80dc9bd2dac685d42f31?pvs=73" className="text-purple-400 hover:underline">
                                        Terms & Conditions
                                    </Link>{" "}
                                    and{" "}
                                    <Link href="https://hyperverge.notion.site/SensAI-Privacy-Policy-1627e7c237cb80e5babae67e64642f27" className="text-purple-400 hover:underline">
                                        Privacy Policy
                                    </Link>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile testimonial */}
            <div className="md:hidden mt-12 bg-gradient-to-r from-purple-900/20 to-transparent p-6 border-l border-purple-500/30 rounded-r-lg max-w-lg">
                <p className="text-gray-300 italic text-center">
                    "SensAI doesn't just tell students if they're right or wrong. It asks the right questions to help them think deeper and reach understanding on their own."
                </p>
                <div className="flex items-center justify-center mt-4">
                    <div className="h-px w-8 bg-purple-500/50 mr-3"></div>
                    <p className="text-sm text-gray-400">Jamie Peterson, Science Teacher</p>
                </div>
            </div>
        </div>
    );
}

// Main component with Suspense boundary
export default function LoginPage() {
    return (
        <Suspense fallback={
            <div className="flex flex-col items-center justify-center min-h-screen bg-black px-4">
                <div className="w-12 h-12 border-t-2 border-b-2 border-white rounded-full animate-spin"></div>
            </div>
        }>
            <LoginContent />
        </Suspense>
    );
} 