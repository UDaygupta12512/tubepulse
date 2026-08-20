"use client";

import Link from "next/link";
import { Zap, Menu, X, ChevronRight } from "lucide-react";
import { useState, useEffect } from "react";
import { signOut, useSession } from "next-auth/react";

const landingLinks = [
    { label: "Features", href: "/#features" },
    { label: "How It Works", href: "/#how-it-works" },
    { label: "Pricing", href: "/#pricing" },
    { label: "Testimonials", href: "/#testimonials" },
];

export function Navbar() {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);
    const { data: session, status } = useSession();
    const isAuthenticated = status === "authenticated";

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    return (
        <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled
            ? "py-4 bg-background-secondary/80 backdrop-blur-xl border-b border-white/5"
            : "py-6 bg-transparent"
            }`}>
            <div className="container mx-auto px-6 max-w-7xl flex items-center justify-between">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-3 group">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-white shadow-lg shadow-red-500/20 group-hover:scale-105 transition-transform">
                        <Zap size={22} fill="currentColor" />
                    </div>
                    <span className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70 tracking-tighter">
                        TubePulse
                    </span>
                </Link>

                {/* Desktop Menu */}
                <div className="hidden lg:flex items-center gap-10">
                    <div className="flex items-center gap-8 text-sm font-semibold">
                        {landingLinks.map((link) => (
                            <Link key={link.href} href={link.href} className="link-hover text-foreground-muted hover:text-white transition-colors">
                                {link.label}
                            </Link>
                        ))}
                    </div>

                    <div className="h-4 w-px bg-white/10" />

                    {!isAuthenticated ? (
                        <div className="flex items-center gap-6">
                            <Link
                                href="/login"
                                className="text-sm font-bold text-white/80 hover:text-white transition-colors"
                            >
                                Log In
                            </Link>
                            <Link
                                href="/signup"
                                className="btn-premium px-6 py-2.5 rounded-xl text-sm group"
                            >
                                Join Now
                                <ChevronRight size={16} className="ml-1 group-hover:translate-x-0.5 transition-transform" />
                            </Link>
                        </div>
                    ) : (
                        <div className="flex items-center gap-3">
                            <span className="max-w-[220px] truncate rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-gray-300">
                                ID: {(session.user as { id?: string } | undefined)?.id ?? "unknown"}
                            </span>
                            <Link href="/dashboard" className="btn-premium px-5 py-2.5 rounded-xl text-sm">
                                Dashboard
                            </Link>
                            <button
                                type="button"
                                onClick={() => signOut({ callbackUrl: "/" })}
                                className="rounded-xl border border-white/15 px-4 py-2 text-sm font-bold text-gray-300 hover:border-red-400/60 hover:text-white transition-all"
                            >
                                Sign out
                            </button>
                        </div>
                    )}
                </div>

                {/* Mobile Menu Button */}
                <button
                    className="lg:hidden p-2 rounded-lg bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-colors"
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
                >
                    {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </div>

            {/* Mobile Menu Overlay */}
            {isMobileMenuOpen && (
                <div className="lg:hidden fixed inset-x-0 top-[73px] bg-background-secondary border-b border-white/5 p-6 flex flex-col gap-6 shadow-2xl animate-in slide-in-from-top-4 duration-300 z-40">
                    <div className="flex flex-col gap-4">
                        {landingLinks.map((link) => (
                            <Link
                                key={`mobile-${link.href}`}
                                href={link.href}
                                className="text-lg font-semibold text-foreground-muted hover:text-white py-2 transition-colors"
                                onClick={() => setIsMobileMenuOpen(false)}
                            >
                                {link.label}
                            </Link>
                        ))}
                    </div>
                    <div className="h-px bg-white/5" />
                    {!isAuthenticated ? (
                        <div className="flex flex-col gap-4">
                            <Link
                                href="/login"
                                className="text-center font-bold text-white/70 py-3 hover:text-white transition-colors"
                                onClick={() => setIsMobileMenuOpen(false)}
                            >
                                Log In
                            </Link>
                            <Link
                                href="/signup"
                                className="btn-premium py-4 text-center text-lg"
                                onClick={() => setIsMobileMenuOpen(false)}
                            >
                                Join Now
                            </Link>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-4">
                            <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-center text-sm text-gray-300">
                                User ID
                                <div className="truncate font-bold text-white">{(session.user as { id?: string } | undefined)?.id ?? "unknown"}</div>
                            </div>
                            <Link
                                href="/dashboard"
                                className="btn-premium py-4 text-center text-lg"
                                onClick={() => setIsMobileMenuOpen(false)}
                            >
                                Open Dashboard
                            </Link>
                            <button
                                type="button"
                                onClick={() => {
                                    setIsMobileMenuOpen(false);
                                    void signOut({ callbackUrl: "/" });
                                }}
                                className="text-center font-bold text-red-300 py-3 hover:text-red-200 transition-colors border border-red-500/30 rounded-xl"
                            >
                                Sign out
                            </button>
                        </div>
                    )}
                </div>
            )}
        </nav>
    );
}
