"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { SignInButton } from "@clerk/nextjs";

export default function PricingPage() {
    const router = useRouter();
    const { isSignedIn } = useAuth();
    const [loading, setLoading] = useState<"monthly" | "yearly" | null>(null);

  const handleSubscribe = async (plan: "monthly" | "yearly") => {
        if (!isSignedIn) return;
        setLoading(plan);
        try {
                const res = await fetch("/api/stripe/checkout", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ plan }),
                });
                const data = await res.json();
                if (data.url) {
                          window.location.href = data.url;
                }
        } catch (err) {
                console.error("Checkout error:", err);
        } finally {
                setLoading(null);
        }
  };

  return (
        <div className="min-h-screen bg-[#f8f9fa] flex flex-col items-center justify-center px-4 py-16">
          {/* Header */}
              <div className="text-center mb-12">
                      <button
                                  onClick={() => router.push("/")}
                                  className="text-sm text-gray-500 hover:text-gray-800 mb-6 inline-flex items-center gap-1"
                                >
                                ← Back to App
                      </button>button>
                      <h1 className="text-4xl font-bold text-gray-900 mb-4">
                                Unlock Unlimited AI Analysis
                      </h1>h1>
                      <p className="text-xl text-gray-600 max-w-xl mx-auto">
                                You&apos;ve used your 1 free analysis. Subscribe to get unlimited
                                AI-powered equity research.
                      </p>p>
              </div>div>
        
          {/* Pricing Cards */}
              <div className="flex flex-col md:flex-row gap-6 w-full max-w-3xl">
                {/* Monthly Plan */}
                      <div className="flex-1 bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
                                <h2 className="text-lg font-semibold text-gray-700 mb-1">Monthly</h2>h2>
                                <div className="flex items-end gap-1 mb-6">
                                            <span className="text-5xl font-bold text-gray-900">$49</span>span>
                                            <span className="text-gray-500 mb-2">/month</span>span>
                                </div>div>
                                <ul className="space-y-3 text-gray-600 mb-8">
                                            <li className="flex items-center gap-2">
                                                          <span className="text-green-500">✓</span>span> Unlimited stock analyses
                                            </li>li>
                                            <li className="flex items-center gap-2">
                                                          <span className="text-green-500">✓</span>span> AI market reports
                                            </li>li>
                                            <li className="flex items-center gap-2">
                                                          <span className="text-green-500">✓</span>span> News &amp; sentiment analysis
                                            </li>li>
                                            <li className="flex items-center gap-2">
                                                          <span className="text-green-500">✓</span>span> PDF export
                                            </li>li>
                                            <li className="flex items-center gap-2">
                                                          <span className="text-green-500">✓</span>span> Cancel anytime
                                            </li>li>
                                </ul>ul>
                        {isSignedIn ? (
                      <button
                                      onClick={() => handleSubscribe("monthly")}
                                      disabled={loading === "monthly"}
                                      className="w-full bg-gray-900 text-white py-3 px-6 rounded-xl font-semibold hover:bg-gray-700 transition-colors disabled:opacity-50"
                                    >
                        {loading === "monthly" ? "Loading..." : "Subscribe Monthly"}
                      </button>button>
                    ) : (
                      <SignInButton mode="modal">
                                    <button className="w-full bg-gray-900 text-white py-3 px-6 rounded-xl font-semibold hover:bg-gray-700 transition-colors">
                                                    Sign in to Subscribe
                                    </button>button>
                      </SignInButton>SignInButton>
                                )}
                      </div>div>
              
                {/* Yearly Plan */}
                      <div className="flex-1 bg-gray-900 rounded-2xl border border-gray-900 p-8 shadow-lg relative">
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                                            BEST VALUE · SAVE 17%
                                </div>div>
                                <h2 className="text-lg font-semibold text-gray-300 mb-1">Yearly</h2>h2>
                                <div className="flex items-end gap-1 mb-6">
                                            <span className="text-5xl font-bold text-white">$490</span>span>
                                            <span className="text-gray-400 mb-2">/year</span>span>
                                </div>div>
                                <p className="text-gray-400 text-sm mb-4">
                                            Equivalent to $40.83/month
                                </p>p>
                                <ul className="space-y-3 text-gray-300 mb-8">
                                            <li className="flex items-center gap-2">
                                                          <span className="text-green-400">✓</span>span> Everything in Monthly
                                            </li>li>
                                            <li className="flex items-center gap-2">
                                                          <span className="text-green-400">✓</span>span> 2 months free
                                            </li>li>
                                            <li className="flex items-center gap-2">
                                                          <span className="text-green-400">✓</span>span> Priority support
                                            </li>li>
                                            <li className="flex items-center gap-2">
                                                          <span className="text-green-400">✓</span>span> Early access to new features
                                            </li>li>
                                </ul>ul>
                        {isSignedIn ? (
                      <button
                                      onClick={() => handleSubscribe("yearly")}
                                      disabled={loading === "yearly"}
                                      className="w-full bg-white text-gray-900 py-3 px-6 rounded-xl font-semibold hover:bg-gray-100 transition-colors disabled:opacity-50"
                                    >
                        {loading === "yearly" ? "Loading..." : "Subscribe Yearly"}
                      </button>button>
                    ) : (
                      <SignInButton mode="modal">
                                    <button className="w-full bg-white text-gray-900 py-3 px-6 rounded-xl font-semibold hover:bg-gray-100 transition-colors">
                                                    Sign in to Subscribe
                                    </button>button>
                      </SignInButton>SignInButton>
                                )}
                      </div>div>
              </div>div>
        
          {/* Footer note */}
              <p className="text-center text-gray-500 text-sm mt-10">
                      Secure payment via Stripe. Cancel anytime.
                      <br />
                      This platform is for research purposes only and is not financial advice.
              </p>p>
        </div>div>
      );
}</div>
