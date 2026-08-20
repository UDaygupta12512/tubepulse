"use client";

import Link from "next/link";
import { Zap, Eye, EyeOff, Mail, ArrowLeft, RefreshCw } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { signIn, useSession } from "next-auth/react";

// Inner component that uses useSearchParams — must be inside <Suspense>
function LoginForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { status } = useSession();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [authError, setAuthError] = useState<string | null>(null);
    const [showForgotPassword, setShowForgotPassword] = useState(false);
    const [resetEmail, setResetEmail] = useState("");
    const [resetSent, setResetSent] = useState(false);
    const [resetLoading, setResetLoading] = useState(false);

    const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";

    useEffect(() => {
        if (status === "authenticated") {
            router.replace("/dashboard");
        }
    }, [router, status]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setAuthError(null);
        setLoading(true);

        const result = await signIn("credentials", {
            email,
            password,
            redirect: false,
            callbackUrl,
        });

        if (result?.error) {
            setAuthError("Invalid email or password.");
            setLoading(false);
            return;
        }

        router.push(result?.url ?? callbackUrl);
        router.refresh();
    };

    const handleForgotPassword = (e: React.FormEvent) => {
        e.preventDefault();
        if (!resetEmail) return;
        setResetLoading(true);
        setTimeout(() => {
            setResetLoading(false);
            setResetSent(true);
        }, 1500);
    };

    if (showForgotPassword) {
        return (
            <div className="min-h-screen flex items-center justify-center px-6 bg-background">
                <div className="w-full max-w-md">
                    <Link href="/" className="flex items-center justify-center gap-3 mb-10">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-white shadow-lg">
                            <Zap size={24} fill="currentColor" />
                        </div>
                        <span className="text-3xl font-black text-white">TubePulse</span>
                    </Link>

                    <div className="glass-panel p-8 rounded-3xl">
                        <button
                            onClick={() => {
                                setShowForgotPassword(false);
                                setResetSent(false);
                                setResetEmail("");
                            }}
                            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-6"
                        >
                            <ArrowLeft size={16} />
                            Back to login
                        </button>

                        {resetSent ? (
                            <div className="text-center py-8">
                                <div className="w-20 h-20 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center mx-auto mb-6">
                                    <Mail size={40} className="text-green-500" />
                                </div>
                                <h2 className="text-2xl font-bold text-white mb-3">Check Your Email</h2>
                                <p className="text-gray-400 mb-6">
                                    We&apos;ve sent a password reset link to <span className="text-white font-semibold">{resetEmail}</span>
                                </p>
                                <p className="text-gray-500 text-sm">
                                    Didn&apos;t receive it? Check your spam folder or{" "}
                                    <button
                                        onClick={() => setResetSent(false)}
                                        className="text-red-500 hover:text-red-400 font-semibold"
                                    >
                                        try again
                                    </button>
                                </p>
                            </div>
                        ) : (
                            <>
                                <h1 className="text-3xl font-bold text-white mb-2">Forgot Password?</h1>
                                <p className="text-gray-400 mb-8">No worries! Enter your email and we&apos;ll send you a reset link.</p>

                                <form onSubmit={handleForgotPassword} className="space-y-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">Email Address</label>
                                        <input
                                            type="email"
                                            value={resetEmail}
                                            onChange={(e) => setResetEmail(e.target.value)}
                                            className="w-full px-4 py-3 bg-background-card border border-white/10 rounded-xl text-white focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all"
                                            placeholder="you@example.com"
                                            required
                                        />
                                    </div>

                                    <button type="submit" disabled={resetLoading} className="w-full btn-premium text-lg disabled:opacity-50">
                                        {resetLoading ? (
                                            <span className="flex items-center justify-center gap-2">
                                                <RefreshCw className="animate-spin" size={20} />
                                                Sending...
                                            </span>
                                        ) : (
                                            "Send Reset Link"
                                        )}
                                    </button>
                                </form>
                            </>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center px-6 bg-background">
            <div className="w-full max-w-md">
                <Link href="/" className="flex items-center justify-center gap-3 mb-10">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-white shadow-lg">
                        <Zap size={24} fill="currentColor" />
                    </div>
                    <span className="text-3xl font-black text-white">TubePulse</span>
                </Link>

                <div className="glass-panel p-8 rounded-3xl">
                    <h1 className="text-3xl font-bold text-white mb-2">Welcome Back</h1>
                    <p className="text-gray-400 mb-8">Sign in to access your dashboard</p>

                    <div className="space-y-3 mb-6">
                        <button
                            type="button"
                            onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
                            className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white hover:bg-gray-100 text-gray-800 rounded-xl font-semibold transition-colors"
                        >
                            <svg className="w-5 h-5" viewBox="0 0 24 24">
                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                            </svg>
                            Continue with Google
                        </button>

                        <button
                            type="button"
                            onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
                            className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold transition-colors"
                        >
                            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                            </svg>
                            Continue with YouTube
                        </button>
                    </div>

                    <div className="relative flex items-center gap-4 mb-6">
                        <div className="flex-1 h-px bg-white/10" />
                        <span className="text-gray-500 text-sm font-medium">or</span>
                        <div className="flex-1 h-px bg-white/10" />
                    </div>

                    <form onSubmit={handleLogin} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Email Address</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-4 py-3 bg-background-card border border-white/10 rounded-xl text-white focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all"
                                placeholder="you@example.com"
                                required
                            />
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="block text-sm font-medium text-gray-300">Password</label>
                                <button
                                    type="button"
                                    onClick={() => setShowForgotPassword(true)}
                                    className="text-sm text-red-500 hover:text-red-400 font-semibold"
                                >
                                    Forgot password?
                                </button>
                            </div>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full px-4 py-3 bg-background-card border border-white/10 rounded-xl text-white focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all pr-12"
                                    placeholder="********"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
                                >
                                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                        </div>

                        {authError && (
                            <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                                {authError}
                            </p>
                        )}

                        <button
                            type="submit"
                            disabled={loading || status === "loading"}
                            className="w-full btn-premium text-lg disabled:opacity-50"
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <RefreshCw className="animate-spin" size={20} />
                                    Signing in...
                                </span>
                            ) : (
                                "Sign In"
                            )}
                        </button>
                    </form>

                    <div className="mt-6 text-center text-sm text-gray-400">
                        Don&apos;t have an account?{" "}
                        <Link href="/signup" className="text-red-500 hover:text-red-400 font-semibold">
                            Sign up
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Fallback shown while Suspense is resolving searchParams
function LoginFallback() {
    return (
        <div className="min-h-screen flex items-center justify-center px-6 bg-background">
            <div className="w-full max-w-md">
                <div className="flex items-center justify-center gap-3 mb-10">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-white shadow-lg">
                        <Zap size={24} fill="currentColor" />
                    </div>
                    <span className="text-3xl font-black text-white">TubePulse</span>
                </div>
                <div className="glass-panel p-8 rounded-3xl animate-pulse">
                    <div className="h-8 bg-white/5 rounded-xl mb-4 w-3/4" />
                    <div className="h-4 bg-white/5 rounded-lg mb-8 w-1/2" />
                    <div className="h-12 bg-white/5 rounded-xl mb-3" />
                    <div className="h-12 bg-white/5 rounded-xl mb-6" />
                    <div className="h-12 bg-white/5 rounded-xl" />
                </div>
            </div>
        </div>
    );
}

// Root export wraps the form in Suspense — required by Next.js when using useSearchParams()
export default function LoginPage() {
    return (
        <Suspense fallback={<LoginFallback />}>
            <LoginForm />
        </Suspense>
    );
}
