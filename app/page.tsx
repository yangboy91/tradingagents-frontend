"use client";
import { useState } from "react";
import ReactMarkdown from "react-markdown";

const API_BASE = "http://localhost:8000";

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
  result: AnalysisResult | string | null;
};

const DECISION_CONFIG = {
  BUY:  { color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200" },
  SELL: { color: "text-red-600",     bg: "bg-red-50",     border: "border-red-200" },
  HOLD: { color: "text-amber-600",   bg: "bg-amber-50",   border: "border-amber-200" },
};

const SECTIONS = [
  { key: "structured_report",   label: "Research Note",      icon: "📋" },
  { key: "market_report",       label: "Technical Analysis", icon: "📈" },
  { key: "fundamentals_report", label: "Fundamentals",       icon: "🏦" },
  { key: "news_report",         label: "News & Macro",       icon: "🌐" },
  { key: "sentiment_report",    label: "Sentiment",          icon: "💬" },
];

export default function Home() {
  const [ticker, setTicker] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [taskStatus, setTaskStatus] = useState<TaskStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("structured_report");
  const [analysisTime, setAnalysisTime] = useState<number | null>(null);
  const [exportingPdf, setExportingPdf] = useState(false);

  const startAnalysis = async () => {
    if (!ticker) return;
    setLoading(true);
    setTaskStatus(null);
    setAnalysisTime(null);
    const t0 = Date.now();

    const res = await fetch(`${API_BASE}/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ticker: ticker.toUpperCase(), date }),
    });
    const data = await res.json();
    pollResult(data.task_id, t0);
  };

  const pollResult = (id: string, t0: number) => {
    const interval = setInterval(async () => {
      const res = await fetch(`${API_BASE}/result/${id}`);
      const data: TaskStatus = await res.json();
      setTaskStatus(data);
      if (data.status === "done" || data.status === "error") {
        clearInterval(interval);
        setLoading(false);
        setAnalysisTime(Math.round((Date.now() - t0) / 1000));
        setActiveTab("structured_report");
      }
    }, 3000);
  };

  const exportPdf = async () => {
    if (!result) return;
    setExportingPdf(true);
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const pageWidth = 210;
    const margin = 20;
    const contentWidth = pageWidth - margin * 2;
    let y = 20;

    const addText = (text: string, fontSize: number, isBold = false, color = [30, 30, 30]) => {
      doc.setFontSize(fontSize);
      doc.setFont("helvetica", isBold ? "bold" : "normal");
      doc.setTextColor(color[0], color[1], color[2]);
      const lines = doc.splitTextToSize(text, contentWidth);
      lines.forEach((line: string) => {
        if (y > 270) { doc.addPage(); y = 20; }
        doc.text(line, margin, y);
        y += fontSize * 0.45;
      });
      y += 2;
    };

    const addDivider = () => {
      if (y > 270) { doc.addPage(); y = 20; }
      doc.setDrawColor(220, 220, 220);
      doc.line(margin, y, pageWidth - margin, y);
      y += 6;
    };

    const decisionColors: Record<string, number[]> = {
      BUY: [5, 150, 105], SELL: [220, 38, 38], HOLD: [217, 119, 6],
    };

    doc.setFillColor(15, 15, 15);
    doc.rect(0, 0, 210, 28, "F");
    doc.setFontSize(14); doc.setFont("helvetica", "bold"); doc.setTextColor(255, 255, 255);
    doc.text("TradingAgents Research", margin, 12);
    doc.setFontSize(8); doc.setFont("helvetica", "normal"); doc.setTextColor(180, 180, 180);
    doc.text("AI-Powered Equity Analysis  ·  For research purposes only · Not financial advice", margin, 20);
    y = 38;

    addText(`${ticker.toUpperCase()} — Equity Research Note`, 18, true);
    addText(`Analysis Date: ${date}  ·  Generated: ${new Date().toLocaleString()}  ·  Time: ${analysisTime}s`, 9, false, [120, 120, 120]);
    y += 4;
    addDivider();

    const dColor = decisionColors[result.decision] ?? [100, 100, 100];
    doc.setFillColor(dColor[0], dColor[1], dColor[2]);
    doc.roundedRect(margin, y, contentWidth, 18, 3, 3, "F");
    doc.setFontSize(13); doc.setFont("helvetica", "bold"); doc.setTextColor(255, 255, 255);
    doc.text(`RECOMMENDATION: ${result.decision}`, margin + 6, y + 11);
    y += 26;

    addDivider();
    addText("Research Note", 13, true, [15, 15, 15]);
    y += 2;
    const clean = result.structured_report
      .replace(/#{1,6}\s+/g, "").replace(/\*\*(.*?)\*\*/g, "$1")
      .replace(/\*(.*?)\*/g, "$1").replace(/\n{3,}/g, "\n\n").trim();
    addText(clean, 9, false, [60, 60, 60]);

    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8); doc.setTextColor(180, 180, 180);
      doc.text(`TradingAgents Research  ·  ${ticker.toUpperCase()}  ·  ${date}`, margin, 290);
      doc.text(`Page ${i} / ${pageCount}`, pageWidth - margin, 290, { align: "right" });
    }
    doc.save(`${ticker.toUpperCase()}_${date}_research.pdf`);
    setExportingPdf(false);
  };

  const result = taskStatus?.status === "done" ? (taskStatus.result as AnalysisResult) : null;
  const decisionCfg = result ? (DECISION_CONFIG[result.decision as keyof typeof DECISION_CONFIG] ?? DECISION_CONFIG.HOLD) : null;

  return (
    <div className="min-h-screen bg-[#f8f9fa] font-sans">
      <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 bg-black rounded flex items-center justify-center">
            <span className="text-white text-xs font-bold">TA</span>
          </div>
          <span className="font-semibold text-gray-900 text-sm">TradingAgents Research</span>
          <span className="text-gray-300 text-xs">|</span>
          <span className="text-gray-400 text-xs">AI-Powered Equity Analysis</span>
        </div>
        <span className="text-xs text-gray-400">For research purposes only · Not financial advice</span>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6 shadow-sm">
          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-500 mb-1.5">TICKER SYMBOL</label>
              <input
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-black"
                placeholder="e.g. AAPL, NVDA, TSLA"
                value={ticker}
                onChange={(e) => setTicker(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === "Enter" && startAnalysis()}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">ANALYSIS DATE</label>
              <input
                className="border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                type="date" value={date} onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <button
              onClick={startAnalysis} disabled={loading || !ticker}
              className="bg-black text-white rounded-lg px-6 py-2.5 text-sm font-medium hover:bg-gray-800 disabled:opacity-40 transition whitespace-nowrap"
            >
              {loading ? "Analyzing..." : "Run Analysis"}
            </button>
          </div>
        </div>

        {loading && (
          <div className="bg-white border border-gray-200 rounded-xl p-8 text-center shadow-sm">
            <div className="inline-flex items-center gap-3 text-gray-600">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
              </svg>
              <span className="text-sm">Multi-agent analysis in progress — typically 3–5 minutes</span>
            </div>
            <div className="mt-4 flex justify-center gap-4 text-xs text-gray-400 flex-wrap">
              {["Technical Analyst","Fundamentals Analyst","News Analyst","Bull/Bear Debate","Risk Assessment","Structuring Report"].map((s) => (
                <span key={s} className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-300 inline-block animate-pulse"/>
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}

        {taskStatus?.status === "error" && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-5 text-sm text-red-700">
            Analysis failed: {String(taskStatus.result)}
          </div>
        )}

        {result && decisionCfg && (
          <div className="space-y-5">
            <div className="grid grid-cols-4 gap-4">
              <div className={`col-span-1 ${decisionCfg.bg} border ${decisionCfg.border} rounded-xl p-5 flex flex-col items-center justify-center`}>
                <span className="text-xs font-medium text-gray-500 mb-1">RECOMMENDATION</span>
                <span className={`text-4xl font-bold ${decisionCfg.color}`}>{result.decision}</span>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl p-5 flex flex-col justify-center">
                <span className="text-xs font-medium text-gray-400 mb-1">TICKER</span>
                <span className="text-2xl font-bold font-mono text-gray-900">{ticker}</span>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl p-5 flex flex-col justify-center">
                <span className="text-xs font-medium text-gray-400 mb-1">ANALYSIS DATE</span>
                <span className="text-sm font-semibold text-gray-900">{date}</span>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl p-5 flex flex-col justify-center">
                <span className="text-xs font-medium text-gray-400 mb-1">ANALYSIS TIME</span>
                <span className="text-sm font-semibold text-gray-900">{analysisTime}s</span>
                <span className="text-xs text-gray-400 mt-0.5">5 agents · gpt-4o</span>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
              <div className="flex border-b border-gray-200 items-center">
                {SECTIONS.map((s) => (
                  <button key={s.key} onClick={() => setActiveTab(s.key)}
                    className={`flex-1 px-3 py-3 text-xs font-medium transition flex items-center justify-center gap-1.5 ${
                      activeTab === s.key ? "border-b-2 border-black text-gray-900 bg-gray-50" : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    <span>{s.icon}</span>{s.label}
                  </button>
                ))}
                <div className="px-4">
                  <button onClick={exportPdf} disabled={exportingPdf}
                    className="flex items-center gap-1.5 bg-black text-white px-4 py-1.5 rounded-lg text-xs font-medium hover:bg-gray-800 disabled:opacity-40 transition whitespace-nowrap"
                  >
                    {exportingPdf ? "Generating..." : "⬇ Export PDF"}
                  </button>
                </div>
              </div>
              <div className="p-6 prose prose-sm max-w-none text-gray-700 leading-relaxed">
                <ReactMarkdown>
                  {String(result[activeTab as keyof AnalysisResult] || "No data available.")}
                </ReactMarkdown>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}