/* eslint-disable @next/next/no-img-element */
"use client";

import { useState, useRef, useEffect } from "react";
import { User, Key, Bell, Shield, Check, Camera, Youtube, Globe, X } from "lucide-react";
import { BackButton } from "@/components/BackButton";
import { useToast } from "@/components/Toast";
import { useSession } from "next-auth/react";

type NotificationSettings = {
    email: boolean;
    trending: boolean;
    weekly: boolean;
    marketing: boolean;
};

type SavedProfile = {
    displayName: string;
    channelUrl: string;
    bio: string;
    website: string;
    avatarInitials: string;
    avatarImg: string | null;
    notifications: NotificationSettings;
};

const DEFAULT_PROFILE: SavedProfile = {
    displayName: "John Doe",
    channelUrl: "@johndoechannel",
    bio: "Content creator focused on tech and AI",
    website: "",
    avatarInitials: "JD",
    avatarImg: null,
    notifications: {
        email: true,
        trending: true,
        weekly: false,
        marketing: false,
    },
};

const STORAGE_KEY = "tubepulse_profile";

function loadProfileFromStorage(): SavedProfile {
    if (typeof window === "undefined") return DEFAULT_PROFILE;
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            const parsed = JSON.parse(stored);
            return { ...DEFAULT_PROFILE, ...parsed };
        }
        
        // If no profile exists, try to sync the channel handle from the dashboard
        const dashboardChannel = localStorage.getItem("tubepulse_channel_id");
        if (dashboardChannel) {
            return { ...DEFAULT_PROFILE, channelUrl: dashboardChannel, displayName: dashboardChannel.replace('@', '') };
        }
    } catch {
        // Ignore parse errors
    }
    return { ...DEFAULT_PROFILE, channelUrl: "@MrBeast", displayName: "MrBeast" };
}

function saveProfileToStorage(profile: SavedProfile): void {
    if (typeof window === "undefined") return;
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
    } catch {
        // Ignore storage errors
    }
}

export default function Profile() {
    const [savedProfile, setSavedProfile] = useState<SavedProfile>(DEFAULT_PROFILE);
    const [displayName, setDisplayName] = useState(DEFAULT_PROFILE.displayName);
    const [channelUrl, setChannelUrl] = useState(DEFAULT_PROFILE.channelUrl);
    const [bio, setBio] = useState(DEFAULT_PROFILE.bio);
    const [saving, setSaving] = useState(false);
    const [avatarInitials, setAvatarInitials] = useState(DEFAULT_PROFILE.avatarInitials);
    const [avatarImg, setAvatarImg] = useState<string | null>(DEFAULT_PROFILE.avatarImg);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [showTwoFAModal, setShowTwoFAModal] = useState(false);
    const [passwordForm, setPasswordForm] = useState({ current: "", new: "", confirm: "" });
    const [website, setWebsite] = useState(DEFAULT_PROFILE.website);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [notifications, setNotifications] = useState<NotificationSettings>(DEFAULT_PROFILE.notifications);
    const { showToast } = useToast();
    const { data: session } = useSession();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [isLoaded, setIsLoaded] = useState(false);

    // Load profile from localStorage on mount
    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        const stored = loadProfileFromStorage();
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setSavedProfile(stored);
        
        let newDisplayName = stored.displayName;
        if (session?.user?.name) {
            newDisplayName = session.user.name;
        }

        // Batch the updates to avoid cascading renders
        setDisplayName(newDisplayName);
        setChannelUrl(stored.channelUrl);
        setBio(stored.bio);
        setWebsite(stored.website);
        setAvatarInitials(stored.avatarInitials);
        setAvatarImg(stored.avatarImg);
        setNotifications(stored.notifications);
        setIsLoaded(true);
    }, [session?.user?.name]);

    const handleCancelChanges = () => {
        setDisplayName(savedProfile.displayName);
        setChannelUrl(savedProfile.channelUrl);
        setBio(savedProfile.bio);
        setWebsite(savedProfile.website);
        setNotifications(savedProfile.notifications);
        setAvatarImg(savedProfile.avatarImg);
        setAvatarInitials(savedProfile.avatarInitials);
        if (fileInputRef.current) fileInputRef.current.value = "";
        showToast("Unsaved changes were reset.", "info");
    };

    const handleReconnectChannel = () => {
        showToast("Reconnecting YouTube channel...", "info");
        setTimeout(() => {
            showToast("YouTube channel reconnected successfully!", "success");
        }, 1000);
    };

    const handleSaveChanges = () => {
        setSaving(true);
        setTimeout(() => {
            setSaving(false);
            const initials = displayName
                .split(" ")
                .map((word) => word[0])
                .join("")
                .toUpperCase()
                .slice(0, 2);

            const nextProfile: SavedProfile = {
                displayName,
                channelUrl,
                bio,
                website,
                avatarImg,
                avatarInitials: initials || "JD",
                notifications,
            };

            setAvatarInitials(nextProfile.avatarInitials);
            setSavedProfile(nextProfile);
            saveProfileToStorage(nextProfile);
            showToast("Profile updated successfully!");
        }, 1500);
    };

    const handleChangePassword = () => {
        if (passwordForm.new.length < 8) {
            showToast("Password must be at least 8 characters!", "error");
            return;
        }
        if (passwordForm.new !== passwordForm.confirm) {
            showToast("New passwords don't match!", "error");
            return;
        }
        if (!passwordForm.current) {
            showToast("Please enter your current password!", "error");
            return;
        }
        setSaving(true);
        setTimeout(() => {
            setSaving(false);
            setShowPasswordModal(false);
            setPasswordForm({ current: "", new: "", confirm: "" });
            showToast("Password changed successfully!");
        }, 1500);
    };

    const handleEnable2FA = () => {
        setSaving(true);
        setTimeout(() => {
            setSaving(false);
            setShowTwoFAModal(false);
            showToast("Two-Factor Authentication enabled!", "success");
        }, 1500);
    };

    const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) {
            showToast("File too large. Max 5MB.", "error");
            return;
        }
        const reader = new FileReader();
        reader.onload = () => {
            setAvatarImg(reader.result as string);
            showToast("Avatar updated!");
        };
        reader.readAsDataURL(file);
    };

    const stats = [
        { label: "Content Generated", value: "148", icon: "✨", color: "purple" },
        { label: "Thumbnails Created", value: "32", icon: "🎨", color: "red" },
        { label: "Keywords Found", value: "89", icon: "🔑", color: "green" },
        { label: "Days Active", value: "47", icon: "📅", color: "blue" },
    ];

    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <BackButton />
                </div>
            </div>

            <div className="relative">
                <div className="absolute -top-10 right-0 hidden lg:block">
                    <div className="text-8xl animate-float">👤</div>
                </div>
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 mb-4">
                    <User size={14} className="text-blue-500" />
                    <span className="text-xs font-bold uppercase tracking-wider text-blue-400">My Profile</span>
                </div>
                <h1 className="text-5xl font-black text-white mb-3 relative z-10">Account Settings</h1>
                <p className="text-gray-400 text-xl">Manage your profile and preferences</p>
            </div>

            {/* Profile Header Card */}
            <div className="glass-card p-8 rounded-3xl border border-white/10 bg-gradient-to-r from-blue-500/5 to-purple-500/5">
                <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                    <div className="relative group">
                        <div className="w-32 h-32 rounded-3xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center text-white text-5xl font-black shadow-2xl shadow-red-500/30 overflow-hidden">
                            {avatarImg ? <img src={avatarImg} alt="Avatar" className="w-full h-full object-cover" /> : avatarInitials}
                        </div>
                        <input
                            type="file"
                            ref={fileInputRef}
                            accept="image/*"
                            className="hidden"
                            onChange={handleAvatarUpload}
                            aria-label="Upload avatar image"
                            title="Upload avatar image"
                        />
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            aria-label="Upload avatar image"
                            title="Upload avatar"
                            className="absolute bottom-0 right-0 w-10 h-10 rounded-xl bg-white text-black flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
                        >
                            <Camera size={18} />
                        </button>
                    </div>
                    <div className="flex-1 text-center md:text-left">
                        <h2 className="text-3xl font-black text-white mb-2">{displayName}</h2>
                        <p className="text-gray-400 mb-3">{session?.user?.email || "john.doe@example.com"}</p>
                        <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                            <span className="px-4 py-2 rounded-full bg-red-500/10 text-red-500 text-sm font-bold border border-red-500/20 flex items-center gap-2">
                                👑 Growth Plan
                            </span>
                            <span className="px-4 py-2 rounded-full bg-green-500/10 text-green-500 text-sm font-bold border border-green-500/20 flex items-center gap-2">
                                ✓ Verified Creator
                            </span>
                        </div>
                    </div>
                    <div className="text-center">
                        <div className="text-4xl font-black text-white mb-1">92%</div>
                        <div className="text-sm text-gray-400 font-semibold">Profile Complete</div>
                        <div className="mt-2 w-24 h-2 bg-background-card rounded-full overflow-hidden">
                            <div className="h-full w-[92%] bg-gradient-to-r from-green-500 to-blue-500" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {stats.map((stat, i) => (
                    <div key={i} className="glass-card p-6 rounded-2xl text-center border border-white/5 hover:-translate-y-1 transition-transform">
                        <div className="text-5xl mb-3">{stat.icon}</div>
                        <div className="text-3xl font-black text-white mb-1">{stat.value}</div>
                        <div className="text-sm text-gray-400 font-semibold">{stat.label}</div>
                    </div>
                ))}
            </div>

            <div className="grid md:grid-cols-2 gap-8">
                {/* Personal Information */}
                <div className="glass-panel p-8 rounded-3xl border border-white/10">
                    <h3 className="text-2xl font-black text-white mb-6 flex items-center gap-3">
                        <User size={28} className="text-blue-500" />
                        Personal Information
                    </h3>
                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-semibold text-gray-300 mb-2">Display Name</label>
                            <input
                                type="text"
                                value={displayName}
                                onChange={(e) => setDisplayName(e.target.value)}
                                title="Display Name"
                                className="w-full bg-background-card border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-300 mb-2">Email</label>
                            <input
                                type="email"
                                value={session?.user?.email || "john.doe@example.com"}
                                disabled
                                title="Email"
                                className="w-full bg-background-card border border-white/10 rounded-xl px-4 py-3 text-gray-500 cursor-not-allowed"
                            />
                            <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-300 mb-2">Bio</label>
                            <textarea
                                value={bio}
                                onChange={(e) => setBio(e.target.value)}
                                className="w-full bg-background-card border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all h-24 resize-none"
                                placeholder="Tell us about your channel..."
                            />
                        </div>
                    </div>
                </div>

                {/* YouTube Connection */}
                <div className="glass-panel p-8 rounded-3xl border border-white/10">
                    <h3 className="text-2xl font-black text-white mb-6 flex items-center gap-3">
                        <Youtube size={28} className="text-red-500" />
                        YouTube Channel
                    </h3>
                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-semibold text-gray-300 mb-2">Channel Handle</label>
                            <input
                                type="text"
                                value={channelUrl}
                                onChange={(e) => setChannelUrl(e.target.value)}
                                title="Channel Handle"
                                className="w-full bg-background-card border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all"
                                placeholder="@yourchannel"
                            />
                        </div>
                        <div className="bg-gradient-to-r from-red-500/10 to-orange-500/10 p-4 rounded-xl border border-red-500/20">
                            <div className="flex items-start gap-3">
                                <div className="text-3xl">🔗</div>
                                <div>
                                    <div className="text-white font-bold mb-1">Connection Status</div>
                                    <div className="text-sm text-gray-400 mb-3">Your YouTube channel is connected and syncing</div>
                                    <button
                                        onClick={handleReconnectChannel}
                                        className="px-4 py-2 rounded-xl bg-red-500/20 text-red-400 font-semibold text-sm hover:bg-red-500/30 transition-all"
                                    >
                                        Reconnect Channel
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-300 mb-2">Website/Portfolio</label>
                            <div className="relative">
                                <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                                <input
                                    type="url"
                                    value={website}
                                    onChange={(e) => setWebsite(e.target.value)}
                                    placeholder="https://yourwebsite.com"
                                    className="w-full bg-background-card border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Notification Preferences */}
            <div className="glass-panel p-8 rounded-3xl border border-white/10">
                <h3 className="text-2xl font-black text-white mb-6 flex items-center gap-3">
                    <Bell size={28} className="text-yellow-500" />
                    Notification Preferences
                </h3>
                <div className="grid md:grid-cols-2 gap-6">
                    {[
                        { id: "email", label: "Email Notifications", desc: "Receive important updates via email" },
                        { id: "trending", label: "Trending Alerts", desc: "Get notified about viral opportunities" },
                        { id: "weekly", label: "Weekly Reports", desc: "Weekly performance summaries" },
                        { id: "marketing", label: "Marketing Updates", desc: "News about features and tips" },
                    ].map((notif) => (
                        <div key={notif.id} className="flex items-center justify-between p-4 bg-background-card rounded-xl border border-white/5">
                            <div className="flex-1">
                                <div className="font-bold text-white mb-1">{notif.label}</div>
                                <div className="text-sm text-gray-400">{notif.desc}</div>
                            </div>
                            <button
                                onClick={() => setNotifications(prev => ({ ...prev, [notif.id]: !prev[notif.id as keyof typeof prev] }))}
                                aria-label={`Toggle ${notif.label}`}
                                title={`Toggle ${notif.label}`}
                                className={`relative w-14 h-8 rounded-full transition-colors ${notifications[notif.id as keyof typeof notifications] ? "bg-green-500" : "bg-gray-700"
                                    }`}
                            >
                                <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-transform ${notifications[notif.id as keyof typeof notifications] ? "translate-x-7" : "translate-x-1"
                                    }`} />
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {/* Security */}
            <div className="glass-panel p-8 rounded-3xl border border-white/10">
                <h3 className="text-2xl font-black text-white mb-6 flex items-center gap-3">
                    <Shield size={28} className="text-purple-500" />
                    Security & Privacy
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                    <button onClick={() => setShowPasswordModal(true)} className="p-4 bg-background-card rounded-xl border border-white/5 hover:border-white/10 transition-all text-left group">
                        <div className="flex items-center gap-3 mb-2">
                            <Key size={20} className="text-purple-500" />
                            <div className="font-bold text-white group-hover:text-purple-500 transition-colors">Change Password</div>
                        </div>
                        <div className="text-sm text-gray-400">Update your account password</div>
                    </button>
                    <button onClick={() => setShowTwoFAModal(true)} className="p-4 bg-background-card rounded-xl border border-white/5 hover:border-white/10 transition-all text-left group">
                        <div className="flex items-center gap-3 mb-2">
                            <Shield size={20} className="text-green-500" />
                            <div className="font-bold text-white group-hover:text-green-500 transition-colors">Two-Factor Auth</div>
                        </div>
                        <div className="text-sm text-gray-400">Add an extra layer of security</div>
                    </button>
                </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end gap-4">
                <button
                    onClick={handleCancelChanges}
                    className="px-6 py-3 rounded-xl border border-white/10 text-white font-semibold hover:bg-white/5 transition-all"
                >
                    Cancel
                </button>
                <button
                    onClick={handleSaveChanges}
                    disabled={saving}
                    className="btn-premium px-8 py-3 disabled:opacity-50"
                >
                    {saving ? (
                        <span className="flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Saving...
                        </span>
                    ) : (
                        <span className="flex items-center gap-2">
                            <Check size={18} />
                            Save Changes
                        </span>
                    )}
                </button>
            </div>

            {/* Password Change Modal */}
            {showPasswordModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                    <div className="glass-panel p-8 rounded-3xl border border-white/10 w-full max-w-md mx-4 animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-black text-white flex items-center gap-2">
                                <Key size={22} className="text-purple-500" />
                                Change Password
                            </h3>
                            <button
                                onClick={() => { setShowPasswordModal(false); setPasswordForm({ current: "", new: "", confirm: "" }); }}
                                type="button"
                                aria-label="Close password dialog"
                                title="Close"
                                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                            >
                                <X size={20} className="text-gray-400" />
                            </button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="text-sm text-gray-400 block mb-1">Current Password</label>
                                <input type="password" value={passwordForm.current} onChange={(e) => setPasswordForm(prev => ({ ...prev, current: e.target.value }))} className="w-full bg-background-card border border-white/10 rounded-xl px-4 py-3 text-white focus:border-purple-500 outline-none transition-colors" placeholder="Enter current password" />
                            </div>
                            <div>
                                <label className="text-sm text-gray-400 block mb-1">New Password</label>
                                <input type="password" value={passwordForm.new} onChange={(e) => setPasswordForm(prev => ({ ...prev, new: e.target.value }))} className="w-full bg-background-card border border-white/10 rounded-xl px-4 py-3 text-white focus:border-purple-500 outline-none transition-colors" placeholder="At least 8 characters" />
                            </div>
                            <div>
                                <label className="text-sm text-gray-400 block mb-1">Confirm New Password</label>
                                <input type="password" value={passwordForm.confirm} onChange={(e) => setPasswordForm(prev => ({ ...prev, confirm: e.target.value }))} className="w-full bg-background-card border border-white/10 rounded-xl px-4 py-3 text-white focus:border-purple-500 outline-none transition-colors" placeholder="Re-enter new password" />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button onClick={() => { setShowPasswordModal(false); setPasswordForm({ current: "", new: "", confirm: "" }); }} className="flex-1 px-4 py-3 rounded-xl border border-white/10 text-white font-semibold hover:bg-white/5 transition-all">Cancel</button>
                                <button onClick={handleChangePassword} disabled={saving} className="flex-1 btn-premium px-4 py-3 disabled:opacity-50">
                                    {saving ? "Updating..." : "Update Password"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Two-Factor Auth Modal */}
            {showTwoFAModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                    <div className="glass-panel p-8 rounded-3xl border border-white/10 w-full max-w-md mx-4 animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-black text-white flex items-center gap-2">
                                <Shield size={22} className="text-green-500" />
                                Enable Two-Factor Auth
                            </h3>
                            <button
                                onClick={() => setShowTwoFAModal(false)}
                                type="button"
                                aria-label="Close two-factor dialog"
                                title="Close"
                                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                            >
                                <X size={20} className="text-gray-400" />
                            </button>
                        </div>
                        <div className="space-y-4">
                            <div className="bg-background-card border border-white/10 rounded-xl p-4 text-center">
                                <div className="w-32 h-32 mx-auto bg-white rounded-xl flex items-center justify-center mb-3">
                                    <div className="text-black text-xs font-mono">QR Code</div>
                                </div>
                                <p className="text-sm text-gray-400">Scan this QR code with your authenticator app</p>
                            </div>
                            <div>
                                <label className="text-sm text-gray-400 block mb-1">Manual Entry Key</label>
                                <div className="bg-background-card border border-white/10 rounded-xl px-4 py-3 text-purple-400 font-mono text-sm tracking-wider">JBSW Y3DP EHPK 3PXP</div>
                            </div>
                            <div>
                                <label className="text-sm text-gray-400 block mb-1">Verification Code</label>
                                <input type="text" maxLength={6} className="w-full bg-background-card border border-white/10 rounded-xl px-4 py-3 text-white focus:border-green-500 outline-none transition-colors text-center tracking-[0.5em] font-mono text-lg" placeholder="000000" />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button onClick={() => setShowTwoFAModal(false)} className="flex-1 px-4 py-3 rounded-xl border border-white/10 text-white font-semibold hover:bg-white/5 transition-all">Cancel</button>
                                <button onClick={handleEnable2FA} disabled={saving} className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold px-4 py-3 rounded-xl transition-all disabled:opacity-50">
                                    {saving ? "Verifying..." : "Enable 2FA"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
