"use client";
import { useState, useEffect, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import { useAuth, UserButton, SignInButton } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";

type AnalysisResult = {
    decision: string;
    structured_report: string;
    market_report: string;
    news_report: string;
    fundamentals_report: string;
    sentiment_report: string;
};

type TaskStatus = {
    status: "pending" | "running" | "done" | "error";
    result?: AnalysisResult;
    error?: string;
};

type UserUsage = {
    usageCount: number;
    freeLimit: number;
    isSubscribed: boolean;
    canAnalyze: boolean;
};

const TABS = [
  { key: "structured_report", label: "Full Report" },
  { key: "market_report", label: "Market" },
  { key: "news_report", label: "News" },
  { key: "fundamentals_report", label: "Fundamentals" },
  { key: "sentiment_report", label: "Sentiment" },
  ];

export default function Home() {
    const { isSignedIn, userId } = useAuth();
    const router = useRouter();

  const [ticker, setTicker] = useState("");
    const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
    const [taskId, setTaskId] = useState<string | null>(null);
    const [status, setStatus] = useState<TaskStatus | null>(null);
    const [activeTab, setActiveTab] = useState("structured_report");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [userUsage, setUserUsage] = useState<UserUsage | null>(null);
    const [usageLoading, setUsageLoading] = useState(false);

  // Fetch user usage when signed in
  const fetchUsage = useCallback(async () => {
        if (!isSignedIn) return;
        setUsageLoading(true);
        try {
                const res = await fetch("/api/user/usage");
                if (res.ok) {
                          const data = await res.json();
                          setUserUsage(data);
                }
        } catch (err) {
                console.error("Failed to fetch usage:", err);
        } finally {
                setUsageLoading(false);
        }
  }, [isSignedIn]);

  useEffect(() => {
        fetchUsage();
  }, [fetchUsage]);

  const poll = useCallback(
        async (id: string) => {
                try {
                          const res = await fetch(`${API_BASE}/status/${id}`);
                          const data: TaskStatus = await res.json();
                          setStatus(data);
                          if (data.status === "done" || data.status === "error") {
                                      setLoading(false);
                                      if (data.status === "done") {
                                                    // Increment usage count after successful analysis
                                        await fetch("/api/user/usage", {
                                                        method: "POST",
                                                        headers: { "Content-Type": "application/json" },
                                                        body: JSON.stringify({ action: "increment" }),
                                        });
                                                    fetchUsage();
                                      }
                          } else {
                                      setTimeout(() => poll(id), 3000);
                          }
                } catch {
                          setLoading(false);
                          setError("Failed to poll analysis status.");
                }
        },
        [fetchUsage]
      );

  const handleSubmit = async () => {
        if (!ticker) return;

        // Check if user is signed in
        if (!isSignedIn) {
                setError("Please sign in to run analysis.");
                return;
        }

        // Check usage limits
        if (userUsage && !userUsage.canAnalyze) {
                router.push("/pricing");
                return;
        }

        setLoading(true);
        setError(null);
        setStatus(null);
        setTaskId(null);

        try {
                const res = await fetch(`${API_BASE}/analyze`, {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ ticker, date }),
                });
                const data = await res.json();
                if (data.task_id) {
                          setTaskId(data.task_id);
                          poll(data.task_id);
                } else {
                          setError("Failed to start analysis.");
                          setLoading(false);
                }
        } catch {
                setError("Failed to connect to analysis server.");
                setLoading(false);
        }
  };

  const getDecisionColor = (decision: string) => {
        const d = decision?.toLowerCase();
        if (d?.includes("buy") || d?.includes("strong buy")) return "text-green-600";
        if (d?.includes("sell") || d?.includes("strong sell")) return "text-red-600";
        return "text-yellow-600";
  };

  const remainingFree =
        userUsage
        ? Math.max(0, userUsage.freeLimit - userUsage.usageCount)
          : null;

  return (
        <div className="min-h-screen bg-[#f8f9fa]">
          {/* Header */}
              <header className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white">
                      <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-black rounded flex items-center justify-center text-white font-bold text-sm">
                                            TA
                                </div>div>
                                <span className="font-semibold text-gray-900">TradingAgents Research</span>span>
                                <span className="text-gray-400 hidden md:inline">|</span>span>
                                <span className="text-gray-500 text-sm hidden md:inline">AI-Powered Equity Analysis</span>span>
                      </div>div>
              
                      <div className="flex items-center gap-3">
                        {isSignedIn ? (
                      <>
                        {/* Usage Badge */}
                        {userUsage && !userUsage.isSubscribed && (
                                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                                          {remainingFree === 0 ? (
                                                              <span className="text-red-600 font-medium">Free trial used</span>span>
                                                            ) : (
                                                              <span>{remainingFree} free analysis left</span>span>
                                                          )}
                                        </span>span>
                                    )}
                        {userUsage?.isSubscribed && (
                                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">
                                                          ✓ Subscribed
                                        </span>span>
                                    )}
                        {/* Upgrade button if free trial used up */}
                        {userUsage && !userUsage.isSubscribed && !userUsage.canAnalyze && (
                                        <button
                                                            onClick={() => router.push("/pricing")}
                                                            className="text-sm bg-black text-white px-3 py-1.5 rounded-lg hover:bg-gray-800 transition-colors"
                                                          >
                                                          Upgrade
                                        </button>button>
                                    )}
                                    <UserButton afterSignOutUrl="/" />
                      </>>
                    ) : (
                      <SignInButton mode="modal">
                                    <button className="text-sm bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors">
                                                    Sign In
                                    </button>button>
                      </SignInButton>SignInButton>
                                )}
                                <span className="text-xs text-gray-400 hidden md:inline">
                                            For research purposes only · Not financial advice
                                </span>span>
                      </div>div>
              </header>header>
        
          {/* Main Content */}
              <main className="max-w-5xl mx-auto px-4 py-8">
                {/* Free Trial Banner (for signed-in non-subscribers) */}
                {isSignedIn && userUsage && !userUsage.isSubscribed && (
                    <div className={`mb-6 rounded-xl px-5 py-4 flex items-center justify-between ${
                                  userUsage.canAnalyze
                                    ? "bg-blue-50 border border-blue-200"
                                    : "bg-amber-50 border border-amber-200"
                    }`}>
                                <div>
                                  {userUsage.canAnalyze ? (
                                      <p className="text-blue-800 text-sm font-medium">
                                                        🎉 Free Trial: You have <strong>{remainingFree} free stock analysis</strong>strong> remaining.
                                      </p>p>
                                    ) : (
                                      <p className="text-amber-800 text-sm font-medium">
                                                        ⚡ You&apos;ve used your free analysis. Subscribe to continue using TradingAgents.
                                      </p>p>
                                              )}
                                </div>div>
                      {!userUsage.canAnalyze && (
                                    <button
                                                      onClick={() => router.push("/pricing")}
                                                      className="ml-4 text-sm bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700 transition-colors whitespace-nowrap"
                                                    >
                                                    View Plans
                                    </button>button>
                                )}
                    </div>div>
                      )}
              
                {/* Sign-in prompt for unauthenticated users */}
                {!isSignedIn && (
                    <div className="mb-6 rounded-xl px-5 py-4 bg-blue-50 border border-blue-200 flex items-center justify-between">
                                <p className="text-blue-800 text-sm font-medium">
                                              👋 Sign in to get <strong>1 free stock analysis</strong>strong> — no credit card required.
                                </p>p>
                                <SignInButton mode="modal">
                                              <button className="ml-4 text-sm bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap">
                                                              Sign In Free
                                              </button>button>
                                </SignInButton>SignInButton>
                    </div>div>
                      )}
              
                {/* Analysis Form */}
                      <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6 shadow-sm">
                                <div className="flex flex-col md:flex-row gap-4 items-end">
                                            <div className="flex-1">
                                                          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                                                                          Ticker Symbol
                                                          </label>label>
                                                          <input
                                                                            type="text"
                                                                            value={ticker}
                                                                            onChange={(e) => setTicker(e.target.value.toUpperCase())}
                                                                            placeholder="E.G. AAPL, NVDA, TSLA"
                                                                            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent text-lg"
                                                                            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                                                                          />
                                            </div>div>
                                            <div>
                                                          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                                                                          Analysis Date
                                                          </label>label>
                                                          <input
                                                                            type="date"
                                                                            value={date}
                                                                            onChange={(e) => setDate(e.target.value)}
                                                                            className="px-4 py-3 border border-gray-200 rounded-xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                                                                          />
                                            </div>div>
                                            <button
                                                            onClick={handleSubmit}
                                                            disabled={loading || !ticker || (!!userUsage && !userUsage.canAnalyze)}
                                                            className="px-8 py-3 bg-gray-800 text-white rounded-xl font-semibold hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                                                          >
                                              {loading ? "Analyzing..." : "Run Analysis"}
                                            </button>button>
                                </div>div>
                      
                        {error && (
                      <p className="mt-3 text-red-600 text-sm">{error}</p>p>
                                )}
                      </div>div>
              
                {/* Status / Loading */}
                {loading && (
                    <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center shadow-sm mb-6">
                                <div className="inline-block w-8 h-8 border-4 border-gray-900 border-t-transparent rounded-full animate-spin mb-4"></div>div>
                                <p className="text-gray-600 font-medium">
                                              Analyzing {ticker}... This may take 1-2 minutes.
                                </p>p>
                                <p className="text-gray-400 text-sm mt-1">
                                              Our AI agents are gathering market data, news, and fundamentals.
                                </p>p>
                    </div>div>
                      )}
              
                {/* Results */}
                {status?.status === "done" && status.result && (
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                      {/* Decision Banner */}
                                <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
                                              <div>
                                                              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">AI Decision</p>p>
                                                              <p className={`text-2xl font-bold ${getDecisionColor(status.result.decision)}`}>
                                                                {status.result.decision}
                                                              </p>p>
                                              </div>div>
                                              <div className="text-right">
                                                              <p className="text-xs text-gray-500">Ticker</p>p>
                                                              <p className="text-xl font-bold text-gray-900">{ticker}</p>p>
                                              </div>div>
                                </div>div>
                    
                      {/* Tabs */}
                                <div className="flex border-b border-gray-100 overflow-x-auto">
                                  {TABS.map((tab) => (
                                      <button
                                                          key={tab.key}
                                                          onClick={() => setActiveTab(tab.key)}
                                                          className={`px-5 py-3 text-sm font-medium whitespace-nowrap transition-colors ${
                                                                                activeTab === tab.key
                                                                                  ? "border-b-2 border-gray-900 text-gray-900"
                                                                                  : "text-gray-500 hover:text-gray-700"
                                                          }`}
                                                        >
                                        {tab.label}
                                      </button>button>
                                    ))}
                                </div>div>
                    
                      {/* Tab Content */}
                                <div className="p-6">
                                              <div className="prose prose-sm max-w-none text-gray-700">
                                                              <ReactMarkdown>
                                                                {status.result[activeTab as keyof AnalysisResult] || "No data available."}
                                                              </ReactMarkdown>ReactMarkdown>
                                              </div>div>
                                </div>div>
                    </div>div>
                      )}
              
                {status?.status === "error" && (
                    <div className="bg-red-50 rounded-2xl border border-red-200 p-6 text-red-700">
                                <p className="font-semibold">Analysis failed</p>p>
                                <p className="text-sm mt-1">{status.error || "Unknown error"}</p>p>
                    </div>div>
                      )}
              </main>main>
        </div>div>
      );
}</></div>
