"use client";

import Link from "next/link";
import { Zap, Eye, EyeOff, RefreshCw, Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { signIn } from "next-auth/react";

export default function SignupPage() {
    const router = useRouter();
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [agreeTerms, setAgreeTerms] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const passwordStrength = password.length === 0 ? null : password.length < 6 ? "weak" : password.length < 10 ? "medium" : "strong";

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!agreeTerms) return;

        setErrorMessage(null);
        setLoading(true);

        const response = await fetch("/api/auth/register", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ name, email, password }),
        });

        if (!response.ok) {
            const data = (await response.json()) as { message?: string };
            setErrorMessage(data.message ?? "Could not create your account.");
            setLoading(false);
            return;
        }

        const result = await signIn("credentials", {
            email,
            password,
            redirect: false,
            callbackUrl: "/dashboard",
        });

        if (result?.error) {
            setErrorMessage("Account created, but sign-in failed. Please log in manually.");
            setLoading(false);
            router.push("/login");
            return;
        }

        router.push(result?.url ?? "/dashboard");
        router.refresh();
    };

    return (
        <div className="min-h-screen flex items-center justify-center px-6 bg-background py-12">
            <div className="w-full max-w-md">
                {/* Logo */}
                <Link href="/" className="flex items-center justify-center gap-3 mb-10">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-white shadow-lg">
                        <Zap size={24} fill="currentColor" />
                    </div>
                    <span className="text-3xl font-black text-white">TubePulse</span>
                </Link>

                {/* Signup Card */}
                <div className="glass-panel p-8 rounded-3xl">
                    <h1 className="text-3xl font-bold text-white mb-2">Create Account</h1>
                    <p className="text-gray-400 mb-8">Start your journey to YouTube success</p>

                    {/* Social Signup Buttons */}
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
                            Sign up with Google
                        </button>

                        <button
                            type="button"
                            onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
                            className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold transition-colors"
                        >
                            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                            </svg>
                            Sign up with YouTube
                        </button>
                    </div>

                    <form onSubmit={handleSignup} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Full Name
                            </label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full px-4 py-3 bg-background-card border border-white/10 rounded-xl text-white focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all"
                                placeholder="John Doe"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Email Address
                            </label>
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
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Password
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full px-4 py-3 bg-background-card border border-white/10 rounded-xl text-white focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all pr-12"
                                    placeholder="••••••••"
                                    required
                                    minLength={8}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
                                >
                                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                            {passwordStrength && (
                                <div className="mt-2">
                                    <div className="flex gap-1">
                                        <div className={`h-1 flex-1 rounded-full ${passwordStrength === "weak" ? "bg-red-500" : passwordStrength === "medium" ? "bg-yellow-500" : "bg-green-500"}`} />
                                        <div className={`h-1 flex-1 rounded-full ${passwordStrength === "medium" || passwordStrength === "strong" ? (passwordStrength === "medium" ? "bg-yellow-500" : "bg-green-500") : "bg-white/10"}`} />
                                        <div className={`h-1 flex-1 rounded-full ${passwordStrength === "strong" ? "bg-green-500" : "bg-white/10"}`} />
                                    </div>
                                    <p className={`text-xs mt-1 ${passwordStrength === "weak" ? "text-red-500" : passwordStrength === "medium" ? "text-yellow-500" : "text-green-500"}`}>
                                        {passwordStrength === "weak" ? "Weak password" : passwordStrength === "medium" ? "Medium strength" : "Strong password"}
                                    </p>


                                </div>
                            )}
                            <p className="text-xs text-gray-500 mt-1">Minimum 8 characters</p>
                        </div>

                        <div className="flex items-start gap-3">
                            <button
                                type="button"
                                onClick={() => setAgreeTerms(!agreeTerms)}
                                className={`w-5 h-5 rounded flex-shrink-0 flex items-center justify-center border transition-all mt-0.5 ${agreeTerms ? "bg-red-500 border-red-500" : "border-white/20 bg-transparent"}`}
                            >
                                {agreeTerms && <Check size={14} className="text-white" />}
                            </button>
                            <p className="text-sm text-gray-400">
                                I agree to the{" "}
                                <Link href="/terms" className="text-red-500 hover:text-red-400">Terms of Service</Link>
                                {" "}and{" "}
                                <Link href="/privacy" className="text-red-500 hover:text-red-400">Privacy Policy</Link>
                            </p>
                        </div>

                        {errorMessage && (
                            <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                                {errorMessage}
                            </p>
                        )}

                        <button
                            type="submit"
                            disabled={loading || !agreeTerms}
                            className="w-full btn-premium text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <RefreshCw className="animate-spin" size={20} />
                                    Creating account...
                                </span>
                            ) : (
                                "Create Account"
                            )}
                        </button>
                    </form>

                    <div className="mt-6 text-center text-sm text-gray-400">
                        Already have an account?{" "}
                        <Link href="/login" className="text-red-500 hover:text-red-400 font-semibold">
                            Sign in
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
