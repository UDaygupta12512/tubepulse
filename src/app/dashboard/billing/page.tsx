"use client";

import { useState, useEffect } from "react";
import { Check, Zap, Crown, Sparkles, CreditCard, Calendar, Download } from "lucide-react";
import { BackButton } from "@/components/BackButton";
import { useToast } from "@/components/Toast";
import { downloadAsFile } from "@/lib/generators";

const BILLING_STORAGE_KEY = "tubepulse_billing";

export default function Billing() {
    const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
    const [selectedPlan, setSelectedPlan] = useState("pro");
    const [planSectionPulse, setPlanSectionPulse] = useState(false);
    const [showCheckoutModal, setShowCheckoutModal] = useState(false);
    const [pendingPlan, setPendingPlan] = useState<string | null>(null);
    const [processingPayment, setProcessingPayment] = useState(false);
    const { showToast } = useToast();

    // Load billing preferences from localStorage
    useEffect(() => {
        try {
            const stored = localStorage.getItem(BILLING_STORAGE_KEY);
            if (stored) {
                const parsed = JSON.parse(stored);
                // eslint-disable-next-line react-hooks/set-state-in-effect
                if (parsed.selectedPlan) setSelectedPlan(parsed.selectedPlan);
                // eslint-disable-next-line react-hooks/set-state-in-effect
                if (parsed.billingCycle) setBillingCycle(parsed.billingCycle);
            }
        } catch {
            // Ignore parse errors
        }
    }, []);

    // Save billing preferences to localStorage
    const saveBillingPreferences = (plan: string, cycle: "monthly" | "yearly") => {
        try {
            localStorage.setItem(BILLING_STORAGE_KEY, JSON.stringify({ selectedPlan: plan, billingCycle: cycle }));
        } catch {
            // Ignore storage errors
        }
    };

    const handleManageSubscription = () => {
        const plansSection = document.getElementById("plans-section");
        if (!plansSection) {
            showToast("Plan controls are currently unavailable.", "warning");
            return;
        }

        plansSection.scrollIntoView({ behavior: "smooth", block: "start" });
        setPlanSectionPulse(true);
        setTimeout(() => setPlanSectionPulse(false), 1400);
        showToast("Jumped to your subscription controls.", "info");
    };

    const handleSelectPlan = (planId: string) => {
        if (planId === selectedPlan) return;
        
        // If downgrading to free, do it immediately
        if (planId === "free") {
            setSelectedPlan(planId);
            saveBillingPreferences(planId, billingCycle);
            showToast("Downgraded to Starter plan!", "success");
            return;
        }

        // If upgrading to paid, show checkout
        setPendingPlan(planId);
        setShowCheckoutModal(true);
    };

    const handleProcessPayment = () => {
        setProcessingPayment(true);
        setTimeout(() => {
            setProcessingPayment(false);
            setShowCheckoutModal(false);
            if (pendingPlan) {
                setSelectedPlan(pendingPlan);
                saveBillingPreferences(pendingPlan, billingCycle);
                showToast(`Upgraded to ${pendingPlan === "pro" ? "Growth" : "Scale"} plan!`, "success");
                setPendingPlan(null);
            }
        }, 2000);
    };

    const handleBillingCycleChange = (cycle: "monthly" | "yearly") => {
        setBillingCycle(cycle);
        saveBillingPreferences(selectedPlan, cycle);
    };

    const handleDownloadInvoice = (invoice: { id: string; date: string; amount: string; plan: string }) => {
        const content = `TUBEPULSE INVOICE\n==================\nInvoice: ${invoice.id}\nDate: ${invoice.date}\nPlan: ${invoice.plan}\nAmount: ${invoice.amount}\nStatus: Paid\n==================\nThank you for your subscription!`;
        downloadAsFile(content, `${invoice.id}.txt`, "text/plain");
        showToast(`Invoice ${invoice.id} downloaded!`, "success");
    };

    const plans = [
        {
            id: "free",
            name: "Starter",
            emoji: "🌱",
            price: { monthly: 0, yearly: 0 },
            popular: false,
            color: "gray",
            features: [
                "5 AI Thumbnails/month",
                "Basic Keyword Search",
                "3 Content Generations",
                "Standard Support",
                "Community Access"
            ]
        },
        {
            id: "pro",
            name: "Growth",
            emoji: "🚀",
            price: { monthly: 29, yearly: 290 },
            popular: true,
            color: "red",
            features: [
                "50 AI Thumbnails/month",
                "Advanced Keyword Trends",
                "Unlimited Content Generation",
                "Outlier Analysis",
                "Priority Support",
                "A/B Testing Tools",
                "Analytics Dashboard",
                "Export to All Formats"
            ]
        },
        {
            id: "scale",
            name: "Scale",
            emoji: "👑",
            price: { monthly: 99, yearly: 990 },
            popular: false,
            color: "purple",
            features: [
                "Unlimited Everything",
                "API Access (10K requests/day)",
                "Dedicated Account Manager",
                "Custom AI Models",
                "Team Collaboration (10 seats)",
                "White Label Options",
                "Priority Phone Support",
                "Custom Integrations"
            ]
        }
    ];

    const invoices = [
        { id: "INV-001", date: "2026-02-01", amount: "$29.00", status: "Paid", plan: "Growth" },
        { id: "INV-002", date: "2026-01-01", amount: "$29.00", status: "Paid", plan: "Growth" },
        { id: "INV-003", date: "2025-12-01", amount: "$29.00", status: "Paid", plan: "Growth" },
    ];

    const usageWidthClass: Record<number, string> = {
        24: "w-[24%]",
        64: "w-[64%]",
        85: "w-[85%]",
        100: "w-full",
    };

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header with Back Button */}
            <div className="flex items-center justify-between">
                <div>
                    <BackButton />
                </div>
            </div>

            <div className="relative">
                <div className="absolute -top-10 right-0 hidden lg:flex gap-4">
                    <div className="text-8xl animate-float">💎</div>
                    <div className="text-8xl animate-float-delayed">💳</div>
                </div>
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 border border-green-500/20 mb-4">
                    <CreditCard size={14} className="text-green-500" />
                    <span className="text-xs font-bold uppercase tracking-wider text-green-400">Billing Hub</span>
                </div>
                <h1 className="text-5xl font-black text-white mb-3 relative z-10">Upgrade Your Growth</h1>
                <p className="text-gray-400 text-xl">Choose the plan that accelerates your YouTube success</p>
            </div>

            {/* Current Plan Status */}
            {(() => {
                const currentPlan = plans.find(p => p.id === selectedPlan) || plans[0];
                const currentPrice = billingCycle === "monthly" ? currentPlan.price.monthly : currentPlan.price.yearly;
                return (
                    <div className="glass-card p-8 rounded-3xl border border-white/10 bg-gradient-to-r from-red-500/5 to-orange-500/5">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-6">
                                <div className="w-20 h-20 rounded-2xl bg-red-500/10 flex items-center justify-center border-2 border-red-500/20">
                                    <Crown size={40} className="text-red-500" />
                                </div>
                                <div>
                                    <div className="text-sm text-gray-400 font-semibold mb-1">CURRENT PLAN</div>
                                    <h2 className="text-3xl font-black text-white mb-1">{currentPlan.name} Plan</h2>
                                    <p className="text-gray-400">Renews on March 1, 2026</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-4xl font-black text-white mb-1">${currentPrice}</div>
                                <div className="text-sm text-gray-400">per {billingCycle === "monthly" ? "month" : "year"}</div>
                                <button
                                    onClick={handleManageSubscription}
                                    className="mt-3 px-4 py-2 rounded-xl bg-red-500/10 text-red-500 font-semibold hover:bg-red-500/20 transition-all text-sm"
                                >
                                    Manage Subscription
                                </button>
                            </div>
                        </div>
                    </div>
                );
            })()}

            {/* Billing Cycle Toggle */}
            <div className="flex justify-center">
                <div className="inline-flex items-center gap-4 bg-background-card p-2 rounded-xl border border-white/10">
                    <button
                        onClick={() => handleBillingCycleChange("monthly")}
                        className={`px-6 py-2 rounded-lg font-semibold transition-all ${billingCycle === "monthly"
                                ? "bg-red-500 text-white"
                                : "text-gray-400 hover:text-white"
                            }`}
                    >
                        Monthly
                    </button>
                    <button
                        onClick={() => handleBillingCycleChange("yearly")}
                        className={`px-6 py-2 rounded-lg font-semibold transition-all relative ${billingCycle === "yearly"
                                ? "bg-red-500 text-white"
                                : "text-gray-400 hover:text-white"
                            }`}
                    >
                        Yearly
                        <span className="absolute -top-2 -right-2 bg-green-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                            Save 17%
                        </span>
                    </button>
                </div>
            </div>

            {/* Pricing Plans */}
            <div
                id="plans-section"
                className={`grid md:grid-cols-3 gap-8 transition-all duration-300 ${planSectionPulse ? "ring-2 ring-red-500/60 rounded-3xl p-2" : ""}`}
            >
                {plans.map((plan) => {
                    const price = billingCycle === "monthly" ? plan.price.monthly : plan.price.yearly;
                    const isPopular = plan.popular;
                    const isCurrent = plan.id === selectedPlan;

                    return (
                        <div
                            key={plan.id}
                            className={`glass-card p-8 rounded-3xl flex flex-col relative ${isPopular
                                    ? "border-2 border-red-500 transform md:-translate-y-4 shadow-2xl shadow-red-500/20"
                                    : "border border-white/10"
                                }`}
                        >
                            {isPopular && (
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-red-500 to-orange-500 text-white text-xs font-black px-4 py-2 rounded-full uppercase tracking-wider flex items-center gap-1">
                                    <Sparkles size={12} />
                                    Most Popular
                                </div>
                            )}

                            <div className="text-6xl mb-4">{plan.emoji}</div>

                            <div className="mb-6">
                                <h3 className={`text-2xl font-black mb-2 ${isPopular ? "text-red-500" : "text-white"}`}>
                                    {plan.name}
                                </h3>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-5xl font-black text-white">${price}</span>
                                    <span className="text-gray-400">
                                        /{billingCycle === "monthly" ? "mo" : "yr"}
                                    </span>
                                </div>
                                {billingCycle === "yearly" && price > 0 && (
                                    <div className="text-sm text-green-500 mt-1">
                                        ${(price / 12).toFixed(2)}/month billed yearly
                                    </div>
                                )}
                            </div>

                            <ul className="space-y-3 mb-8 flex-1">
                                {plan.features.map((feature, i) => (
                                    <li key={i} className="flex items-start gap-3 text-sm text-gray-300">
                                        <Check size={16} className={`mt-0.5 ${isPopular ? "text-red-500" : "text-gray-500"}`} />
                                        <span>{feature}</span>
                                    </li>
                                ))}
                            </ul>

                            <button
                                className={`w-full py-4 rounded-xl font-bold transition-all ${isCurrent
                                        ? "bg-background-card border border-white/20 text-gray-400 cursor-default"
                                        : isPopular
                                            ? "btn-premium"
                                            : "border-2 border-white/20 text-white hover:bg-white/5"
                                    }`}
                                disabled={isCurrent}
                                onClick={() => handleSelectPlan(plan.id)}
                            >
                                {isCurrent ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <Check size={18} />
                                        Current Plan
                                    </span>
                                ) : (
                                    <span className="flex items-center justify-center gap-2">
                                        {isPopular && <Zap size={18} fill="currentColor" />}
                                        {plan.id === "free" ? "Downgrade" : "Upgrade Now"}
                                    </span>
                                )}
                            </button>
                        </div>
                    );
                })}
            </div>

            {/* Usage Stats */}
            <div className="grid md:grid-cols-4 gap-6">
                {[
                    { label: "Thumbnails Generated", value: "32/50", percent: 64, icon: "🎨" },
                    { label: "Content Pieces", value: "Unlimited", percent: 100, icon: "✨" },
                    { label: "Keywords Analyzed", value: "148", percent: 85, icon: "🔑" },
                    { label: "Storage Used", value: "2.4GB/10GB", percent: 24, icon: "💾" },
                ].map((stat, i) => (
                    <div key={i} className="glass-card p-6 rounded-2xl border border-white/10">
                        <div className="text-4xl mb-3">{stat.icon}</div>
                        <div className="text-sm text-gray-400 font-semibold mb-2">{stat.label}</div>
                        <div className="text-2xl font-black text-white mb-3">{stat.value}</div>
                        <div className="w-full bg-background-card rounded-full h-2 overflow-hidden">
                            <div
                                className={`h-full bg-gradient-to-r from-red-500 to-orange-500 transition-all duration-300 ${usageWidthClass[stat.percent] ?? "w-full"}`}
                            />
                        </div>
                    </div>
                ))}
            </div>

            {/* Invoice History */}
            <div className="glass-panel p-8 rounded-3xl border border-white/10">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-2xl font-black text-white mb-1">Invoice History</h2>
                        <p className="text-gray-400">Download and manage your past invoices</p>
                    </div>
                    <Calendar size={32} className="text-gray-600" />
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="text-left border-b border-white/10">
                                <th className="pb-4 text-sm font-bold text-gray-400">Invoice ID</th>
                                <th className="pb-4 text-sm font-bold text-gray-400">Date</th>
                                <th className="pb-4 text-sm font-bold text-gray-400">Plan</th>
                                <th className="pb-4 text-sm font-bold text-gray-400">Amount</th>
                                <th className="pb-4 text-sm font-bold text-gray-400">Status</th>
                                <th className="pb-4 text-sm font-bold text-gray-400">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {invoices.map((invoice) => (
                                <tr key={invoice.id} className="border-b border-white/5">
                                    <td className="py-4 text-white font-semibold">{invoice.id}</td>
                                    <td className="py-4 text-gray-400">{invoice.date}</td>
                                    <td className="py-4 text-white">{invoice.plan}</td>
                                    <td className="py-4 text-white font-bold">{invoice.amount}</td>
                                    <td className="py-4">
                                        <span className="px-3 py-1 rounded-full bg-green-500/10 text-green-500 text-xs font-bold">
                                            {invoice.status}
                                        </span>
                                    </td>
                                    <td className="py-4">
                                        <button
                                            onClick={() => handleDownloadInvoice(invoice)}
                                            className="flex items-center gap-2 text-red-500 hover:text-red-400 transition-colors text-sm font-semibold"
                                        >
                                            <Download size={14} />
                                            Download
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* FAQ Section */}
            <div className="glass-card p-8 rounded-3xl border border-white/10">
                <h2 className="text-2xl font-black text-white mb-6 flex items-center gap-3">
                    <span className="text-4xl">❓</span>
                    Frequently Asked Questions
                </h2>
                <div className="space-y-4">
                    {[
                        { q: "Can I cancel anytime?", a: "Yes! You can cancel your subscription at any time with no penalties." },
                        { q: "What happens when I upgrade?", a: "Your new plan takes effect immediately and you get prorated credit for your current plan." },
                        { q: "Do unused credits roll over?", a: "Monthly credits reset each billing cycle. Yearly plans get all credits upfront." },
                        { q: "Is there a refund policy?", a: "Yes, we offer a 14-day money-back guarantee on all paid plans." },
                    ].map((faq, i) => (
                        <div key={i} className="bg-background-card p-4 rounded-xl border border-white/5">
                            <div className="font-bold text-white mb-2">{faq.q}</div>
                            <div className="text-gray-400 text-sm">{faq.a}</div>
                        </div>
                    ))}
                </div>
            </div>
            {/* Checkout Modal */}
            {showCheckoutModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                    <div className="glass-panel p-8 rounded-3xl border border-white/10 w-full max-w-md mx-4 animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-black text-white flex items-center gap-2">
                                <CreditCard size={22} className="text-green-500" />
                                Secure Checkout
                            </h3>
                            <button
                                onClick={() => { setShowCheckoutModal(false); setPendingPlan(null); }}
                                type="button"
                                aria-label="Cancel checkout"
                                title="Cancel"
                                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                            >
                                <span className="text-gray-400 font-bold">✕</span>
                            </button>
                        </div>
                        <div className="space-y-4">
                            <div className="bg-background-card border border-white/10 rounded-xl p-4 text-center">
                                <div className="text-gray-400 text-sm mb-1">Total Due</div>
                                <div className="text-3xl font-black text-white">
                                    ${billingCycle === "monthly" ? plans.find(p => p.id === pendingPlan)?.price.monthly : plans.find(p => p.id === pendingPlan)?.price.yearly}
                                </div>
                            </div>
                            <div>
                                <label className="text-sm text-gray-400 block mb-1">Card Number (Mock)</label>
                                <input type="text" maxLength={19} className="w-full bg-background-card border border-white/10 rounded-xl px-4 py-3 text-white focus:border-green-500 outline-none transition-colors" placeholder="**** **** **** 4242" defaultValue="4242 4242 4242 4242" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm text-gray-400 block mb-1">Expiry</label>
                                    <input type="text" maxLength={5} className="w-full bg-background-card border border-white/10 rounded-xl px-4 py-3 text-white focus:border-green-500 outline-none transition-colors" placeholder="MM/YY" defaultValue="12/28" />
                                </div>
                                <div>
                                    <label className="text-sm text-gray-400 block mb-1">CVC</label>
                                    <input type="text" maxLength={3} className="w-full bg-background-card border border-white/10 rounded-xl px-4 py-3 text-white focus:border-green-500 outline-none transition-colors" placeholder="123" defaultValue="123" />
                                </div>
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button onClick={() => { setShowCheckoutModal(false); setPendingPlan(null); }} className="flex-1 px-4 py-3 rounded-xl border border-white/10 text-white font-semibold hover:bg-white/5 transition-all">Cancel</button>
                                <button onClick={handleProcessPayment} disabled={processingPayment} className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold px-4 py-3 rounded-xl transition-all disabled:opacity-50">
                                    {processingPayment ? "Processing..." : "Pay Now"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
