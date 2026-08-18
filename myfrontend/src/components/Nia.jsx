import { useEffect, useRef, useState, useCallback } from "react";
import {
  Plus, History, Mic, MicOff, Camera, Paperclip,
  Download, FileText, AlertTriangle, Trash2, X,
  Copy, Check, ChevronRight, User, Sparkles, Image as ImageIcon,
  ArrowUp, MessageSquare, Info, Eye, Search, Clock, Utensils,
  Flame, Dumbbell, Wheat
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getNiaResponse, generateWeeklyMealPlan } from "../lib/niaEngine";
import { jsPDF } from "jspdf";
import { useUser } from "../context/UserContext";

const HISTORY_KEY = "nutriai_nia_history";

/* ── Meal tag colours (shared) ─────────────────────────────── */
const MEAL_TAG_COLORS = {
  Breakfast: { bg: 'rgba(20,184,166,0.15)', text: '#14B8A6', border: 'rgba(20,184,166,0.25)' },
  Lunch: { bg: 'rgba(59,130,246,0.15)', text: '#60A5FA', border: 'rgba(59,130,246,0.25)' },
  Dinner: { bg: 'rgba(139,92,246,0.15)', text: '#A78BFA', border: 'rgba(139,92,246,0.25)' },
  Snack: { bg: 'rgba(245,158,11,0.15)', text: '#FCD34D', border: 'rgba(245,158,11,0.25)' },
  'Pre-WO': { bg: 'rgba(239,68,68,0.15)', text: '#FCA5A5', border: 'rgba(239,68,68,0.25)' },
  'Post-WO': { bg: 'rgba(16,185,129,0.15)', text: '#6EE7B7', border: 'rgba(16,185,129,0.25)' },
};

function DayPlanTable({ dayLabel, rows, onDownload, dark }) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');

  const filtered = rows.filter(r =>
    !query ||
    r.food.toLowerCase().includes(query.toLowerCase()) ||
    r.meal.toLowerCase().includes(query.toLowerCase())
  );
  const totalCal = rows.reduce((s, r) => s + r.cal, 0);
  const totalProtein = rows.reduce((s, r) => s + r.protein, 0);
  const totalCarbs = rows.reduce((s, r) => s + r.carbs, 0);

  // Theme tokens
  const border = dark ? '1px solid rgba(255,255,255,0.08)' : '1px solid #E2E8F0';
  const borderFaint = dark ? '1px solid rgba(255,255,255,0.04)' : '1px solid #F1F5F9';
  const headerBg = dark ? 'rgba(255,255,255,0.04)' : '#F8FAFC';
  const headerBorder = dark ? '1px solid rgba(255,255,255,0.06)' : '1px solid #E2E8F0';
  const stripBorder = dark ? '1px solid rgba(255,255,255,0.05)' : '1px solid #F1F5F9';
  const theadBg = dark ? 'rgba(255,255,255,0.02)' : '#F1F5F9';
  const theadColor = dark ? 'rgba(255,255,255,0.25)' : '#94A3B8';
  const theadIcon = dark ? 'rgba(255,255,255,0.18)' : '#CBD5E1';
  const tfootBg = dark ? 'rgba(255,255,255,0.02)' : '#F8FAFC';
  const tfootBorder = dark ? '1px solid rgba(255,255,255,0.07)' : '1px solid #E2E8F0';
  const totalLabel = dark ? 'rgba(255,255,255,0.2)' : '#94A3B8';
  const dayLabelCol = dark ? '#FFFFFF' : '#0F172A';
  const kcalCol = dark ? 'rgba(255,255,255,0.3)' : '#64748B';
  const dividerCol = dark ? 'rgba(255,255,255,0.12)' : '#E2E8F0';
  const iconBtnBg = dark ? 'rgba(255,255,255,0.05)' : '#F1F5F9';
  const iconBtnCol = dark ? 'rgba(255,255,255,0.4)' : '#64748B';
  const searchBg = dark ? 'rgba(255,255,255,0.07)' : '#F8FAFC';
  const searchBorder = dark ? '1px solid rgba(255,255,255,0.12)' : '1px solid #E2E8F0';
  const searchColor = dark ? '#fff' : '#0F172A';
  const timeColor = dark ? 'rgba(255,255,255,0.38)' : '#64748B';
  const timeIcon = dark ? 'rgba(255,255,255,0.15)' : '#CBD5E1';
  const foodColor = dark ? 'rgba(255,255,255,0.78)' : '#0F172A';
  const barTrack = dark ? 'rgba(255,255,255,0.08)' : '#E2E8F0';
  const evenRowBg = dark ? 'transparent' : '#FFFFFF';
  const oddRowBg = dark ? 'rgba(255,255,255,0.02)' : '#F8FAFC';
  const hoverRowBg = dark ? 'rgba(20,184,166,0.04)' : 'rgba(20,184,166,0.04)';

  return (
    <div className="w-full rounded-2xl overflow-hidden" style={{ border }}>

      {/* ── Top bar ── */}
      <div className="flex items-center justify-between px-4 py-3 gap-3"
        style={{ background: headerBg, borderBottom: headerBorder }}>

        {/* Left: day label + total */}
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-[15px] font-black tracking-tight" style={{ color: dayLabelCol }}>{dayLabel}</span>
          <span className="text-[15px]">🔥</span>
          <div style={{ width: 1, height: 16, background: dividerCol, flexShrink: 0 }} />
          <span className="text-[15px] font-black" style={{ color: '#14B8A6' }}>{totalCal}</span>
          <span className="text-[12px] font-medium" style={{ color: kcalCol }}>kcal</span>
        </div>

        {/* Right: search input + icon buttons + Download PDF */}
        <div className="flex items-center gap-1.5 shrink-0">
          {searchOpen && (
            <input
              autoFocus
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search..."
              className="h-7 px-2.5 rounded-lg text-[12px] font-medium outline-none"
              style={{ background: searchBg, border: searchBorder, color: searchColor, width: 130 }}
            />
          )}
          {[
            { Icon: Eye, tip: 'Preview' },
            { Icon: Search, tip: 'Search', action: () => { setSearchOpen(s => !s); setQuery(''); } },
          ].map(({ Icon, tip, action }) => (
            <button key={tip} title={tip} onClick={action}
              className="w-7 h-7 rounded-lg flex items-center justify-center transition-all"
              style={{ background: iconBtnBg, border: 'none', cursor: 'pointer', color: iconBtnCol }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(20,184,166,0.18)'; e.currentTarget.style.color = '#14B8A6'; }}
              onMouseLeave={e => { e.currentTarget.style.background = iconBtnBg; e.currentTarget.style.color = iconBtnCol; }}
            >
              <Icon size={13} />
            </button>
          ))}
          <button onClick={onDownload}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all"
            style={{ background: 'rgba(20,184,166,0.12)', border: '1px solid rgba(20,184,166,0.25)', color: '#14B8A6', cursor: 'pointer' }}
            onMouseEnter={e => { e.currentTarget.style.background = '#14B8A6'; e.currentTarget.style.color = '#fff'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(20,184,166,0.12)'; e.currentTarget.style.color = '#14B8A6'; }}
          >
            <Download size={11} /> Download PDF
          </button>
        </div>
      </div>

      {/* ── Macro strip ── */}
      <div className="grid grid-cols-3" style={{ borderBottom: stripBorder }}>
        {[
          { label: 'Calories', val: `${totalCal} kcal`, color: '#F97316' },
          { label: 'Protein', val: `${totalProtein}g`, color: '#3B82F6' },
          { label: 'Carbs', val: `${totalCarbs}g`, color: dark ? '#FCD34D' : '#D97706' },
        ].map(({ label, val, color }, idx) => (
          <div key={label} className="flex flex-col items-center py-2.5 gap-0.5"
            style={{ borderRight: idx < 2 ? stripBorder : 'none' }}>
            <span className="text-[14px] font-black" style={{ color }}>{val}</span>
            <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: totalLabel }}>{label}</span>
          </div>
        ))}
      </div>

      {/* ── Table ── */}
      <div className="overflow-x-auto">
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 520 }}>
          <thead>
            <tr style={{ borderBottom: headerBorder, background: theadBg }}>
              {[
                { label: 'Time', Icon: Clock, w: '10%' },
                { label: 'Meal', Icon: Utensils, w: '14%' },
                { label: 'Food', Icon: null, w: '38%' },
                { label: 'Cal', Icon: Flame, w: '10%' },
                { label: 'Protein (g)', Icon: Dumbbell, w: '14%' },
                { label: 'Carbs (g)', Icon: Wheat, w: '14%' },
              ].map(({ label, Icon, w }, ci) => (
                <th key={label} style={{
                  width: w, padding: '9px 12px', textAlign: 'left',
                  fontSize: 10, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase',
                  color: theadColor,
                  borderRight: ci < 5 ? borderFaint : 'none',
                }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    {Icon && <Icon size={10} style={{ color: theadIcon, flexShrink: 0 }} />}
                    {label}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((row, i) => {
              const tag = MEAL_TAG_COLORS[row.meal] || { bg: 'rgba(148,163,184,0.12)', text: '#94A3B8', border: 'rgba(148,163,184,0.18)' };
              const isEven = i % 2 === 0;
              const rowBg = row.flag ? 'rgba(239,68,68,0.06)' : isEven ? evenRowBg : oddRowBg;
              return (
                <tr key={i} style={{
                  background: rowBg,
                  borderBottom: borderFaint,
                  borderLeft: row.flag ? '2px solid rgba(239,68,68,0.5)' : '2px solid transparent',
                  transition: 'background 0.1s',
                }}
                  onMouseEnter={e => { if (!row.flag) e.currentTarget.style.background = hoverRowBg; }}
                  onMouseLeave={e => { e.currentTarget.style.background = rowBg; }}
                >
                  <td style={{ padding: '11px 12px', borderRight: borderFaint }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 600, color: timeColor, fontVariantNumeric: 'tabular-nums' }}>
                      <Clock size={10} style={{ color: timeIcon, flexShrink: 0 }} />{row.time}
                    </span>
                  </td>
                  <td style={{ padding: '11px 12px', borderRight: borderFaint }}>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', padding: '2px 8px',
                      borderRadius: 5, fontSize: 10, fontWeight: 800, letterSpacing: '0.04em', textTransform: 'uppercase',
                      background: tag.bg, color: tag.text, border: `1px solid ${tag.border}`,
                    }}>{row.meal}</span>
                  </td>
                  <td style={{ padding: '11px 12px', borderRight: borderFaint }}>
                    <span style={{ fontSize: 13, fontWeight: 500, color: row.flag ? '#EF4444' : foodColor, lineHeight: 1.4 }}>{row.food}</span>
                    {row.flag && (
                      <span style={{ marginLeft: 7, fontSize: 9, fontWeight: 800, padding: '1px 5px', borderRadius: 3, background: 'rgba(239,68,68,0.12)', color: '#EF4444', textTransform: 'uppercase', letterSpacing: '0.05em' }}>⚠ High carb</span>
                    )}
                  </td>
                  <td style={{ padding: '11px 12px', borderRight: borderFaint }}>
                    <span style={{ fontSize: 14, fontWeight: 900, color: '#F97316', fontVariantNumeric: 'tabular-nums' }}>{row.cal}</span>
                  </td>
                  <td style={{ padding: '11px 12px', borderRight: borderFaint }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: 28, height: 3, borderRadius: 99, background: barTrack, overflow: 'hidden', flexShrink: 0 }}>
                        <div style={{ height: '100%', borderRadius: 99, background: '#3B82F6', width: `${Math.min(100, (row.protein / 50) * 100)}%` }} />
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#3B82F6', fontVariantNumeric: 'tabular-nums' }}>{row.protein}g</span>
                    </div>
                  </td>
                  <td style={{ padding: '11px 12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: 28, height: 3, borderRadius: 99, background: barTrack, overflow: 'hidden', flexShrink: 0 }}>
                        <div style={{ height: '100%', borderRadius: 99, background: '#F59E0B', width: `${Math.min(100, (row.carbs / 80) * 100)}%` }} />
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 700, color: dark ? '#FCD34D' : '#D97706', fontVariantNumeric: 'tabular-nums' }}>{row.carbs}g</span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr style={{ borderTop: tfootBorder, background: tfootBg }}>
              <td colSpan={3} style={{ padding: '10px 12px' }}>
                <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: totalLabel }}>Daily Total</span>
              </td>
              <td style={{ padding: '10px 12px', borderRight: borderFaint }}>
                <span style={{ fontSize: 14, fontWeight: 900, color: '#F97316' }}>{totalCal}</span>
              </td>
              <td style={{ padding: '10px 12px', borderRight: borderFaint }}>
                <span style={{ fontSize: 12, fontWeight: 800, color: '#3B82F6' }}>{totalProtein}g</span>
              </td>
              <td style={{ padding: '10px 12px' }}>
                <span style={{ fontSize: 12, fontWeight: 800, color: dark ? '#FCD34D' : '#D97706' }}>{totalCarbs}g</span>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

const quickPrompts = [
  { text: "Analyse my habits", icon: "📊" },
  { text: "7-day meal plan", icon: "📅" },
  { text: "High protein veg", icon: "🥦" },
  { text: "Weight loss tips", icon: "🔥" }
];

export default function Nia({ dark, profileData, niaMsgs, setNiaMsgs }) {
  const { dailyLogs, userMetrics } = useUser();
  const [messages, setMessages] = useState(niaMsgs ?? []);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState(() => {
    try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]"); }
    catch { return []; }
  });
  const [showCamera, setShowCamera] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [toast, setToast] = useState(null);

  const messagesEndRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const fileRef = useRef(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const firstName = profileData?.firstName || profileData?.name?.split(" ")[0] || "there";

  // Real-time context from Dashboard
  const todayJunk = (dailyLogs?.junk_count > 0) ? (dailyLogs?.junk_score || 0) : 0;
  const calGoal = userMetrics?.daily_calorie_goal || 2000;

  // Sync messages up to App so they persist across view switches
  useEffect(() => {
    if (setNiaMsgs) setNiaMsgs(messages);
  }, [messages, setNiaMsgs]);

  // Track whether user is near the bottom so we don't hijack manual scrolling
  const isNearBottom = useCallback(() => {
    if (!scrollContainerRef.current) return true;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    return scrollHeight - scrollTop - clientHeight < 120;
  }, []);

  const scrollToBottom = useCallback((behavior = "smooth") => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: scrollContainerRef.current.scrollHeight,
        behavior
      });
    }
  }, []);

  useEffect(() => {
    if (isNearBottom()) scrollToBottom();
  }, [messages, isTyping, scrollToBottom, isNearBottom]);

  // Toast helper
  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  // History persistence
  useEffect(() => {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  }, [history]);

  // Streaming text animation - Character by character for ChatGPT feel
  const streamMessage = useCallback(async (fullMsg) => {
    setIsTyping(true);
    let currentText = "";

    // Initial delay for "thinking"
    await new Promise(r => setTimeout(r, 600));

    setMessages(prev => [...prev, { ...fullMsg, text: "" }]);

    const characters = fullMsg.text.split("");
    for (let i = 0; i < characters.length; i++) {
      currentText += characters[i];
      setMessages(prev => {
        const next = [...prev];
        next[next.length - 1] = { ...fullMsg, text: currentText };
        return next;
      });
      await new Promise(r => setTimeout(r, 15 + Math.random() * 10));
    }
    setIsTyping(false);
  }, []);

  const saveCurrentToHistory = () => {
    if (messages.length === 0) return;
    const newSession = {
      id: Date.now(),
      messages: [...messages],
      date: new Date().toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }),
      preview: messages.find(m => m.type === "user")?.text || "New conversation"
    };
    setHistory(prev => [newSession, ...prev].slice(0, 20));
  };

  const startNewChat = () => {
    saveCurrentToHistory();
    setMessages([]);
    setCapturedImage(null);
    setInput("");
    showToast("New chat started");
  };

  const deleteHistorySession = (id, e) => {
    e.stopPropagation();
    setHistory(prev => prev.filter(s => s.id !== id));
    showToast("Chat deleted");
  };

  const loadHistorySession = (session) => {
    setMessages(session.messages);
    setShowHistory(false);
    showToast("Conversation restored");
  };

  const sendMessage = async (text = input) => {
    if (!text.trim() && !capturedImage) return;

    const userMsg = {
      type: "user",
      text: text || "Image Analysis Request",
      image: capturedImage,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setCapturedImage(null);

    try {
      // Show typing indicator during fetch
      setIsTyping(true);

      const token = localStorage.getItem("access_token");
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/nia/chat/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` })
        },
        body: JSON.stringify({ message: text || "image" })
      });

      const data = await response.json();

      // Stop typing indicator early before stream starts
      setIsTyping(false);

      const aiResponse = {
        type: "ai",
        text: data.ai_response || "Sorry, I couldn't generate a response.",
        hasMealPlan: text.toLowerCase().includes("meal plan"),
        hasCourses: text.toLowerCase().includes("course") || text.toLowerCase().includes("learn")
      };

      if (aiResponse.hasMealPlan) {
        aiResponse.mealPlanData = generateWeeklyMealPlan(profileData?.mainGoal, calGoal);
      }
      if (aiResponse.hasCourses) {
        aiResponse.coursesData = [
          { title: 'How to Read Nutrition Labels', channel: 'Healthline', url: 'https://www.youtube.com/watch?v=wI_SZapXCgk', tag: 'YouTube' },
          { title: 'Nutrition for Beginners — Full Guide', channel: 'Doctor Mike', url: 'https://www.youtube.com/watch?v=fqhYBTg73fw', tag: 'YouTube' },
          { title: 'Indian Diet Plan for Weight Loss', channel: 'Fit Tuber', url: 'https://www.youtube.com/watch?v=3JZ_D3ELwOQ', tag: 'YouTube' },
          { title: 'Protein, Carbs & Fat — Macros Explained', channel: 'Jeff Nippard', url: 'https://www.youtube.com/watch?v=2oFsGMHFMo4', tag: 'YouTube' },
          { title: 'The Science of Healthy Eating', channel: 'Kurzgesagt', url: 'https://www.youtube.com/watch?v=TLpbfOJ4bJU', tag: 'YouTube' }
        ];
      }

      await streamMessage(aiResponse);
    } catch (error) {
      console.error("Nia API Error:", error);
      setIsTyping(false);
      showToast("Error connecting to backend");
    }
  };

  // Clipboard
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    showToast("Copied to clipboard!");
  };

  // Camera Logic
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      videoRef.current.srcObject = stream;
      streamRef.current = stream;
      setShowCamera(true);
    } catch {
      alert("Camera access denied or not available.");
    }
  };

  const captureImage = () => {
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext("2d").drawImage(videoRef.current, 0, 0);
    setCapturedImage(canvas.toDataURL("image/jpeg"));
    stopCamera();
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    setShowCamera(false);
  };

  const bgClass = dark ? "bg-[#0B0F1A] text-white" : "bg-[#F8FAFC] text-slate-900";

  // Helper to render markdown-like text
  const renderText = (text) => {
    const lines = text.split("\n");
    return lines.map((line, lidx) => {
      // Alert/Callout handling
      if (line.startsWith("> [!CAUTION]")) return null;
      if (line.startsWith("> [!NOTE]")) return null;
      if (line.startsWith("> **")) {
        const isCaution = text.includes("[!CAUTION]");
        return (
          <div key={lidx} className={`p-4 rounded-2xl my-4 border flex gap-3 ${isCaution ? 'bg-red-500/10 border-red-500/20 text-red-500' : 'bg-blue-500/10 border-blue-500/20 text-blue-500'}`}>
            <Info size={18} className="shrink-0 mt-0.5" />
            <div className="text-sm leading-relaxed">{line.replace("> ", "")}</div>
          </div>
        );
      }

      return (
        <p key={lidx} className={line.trim() === "" ? "h-4" : "mb-2"}>
          {line.split("**").map((part, index) =>
            index % 2 === 1 ? <b key={index} className="text-teal-500 font-bold">{part}</b> : part
          )}
        </p>
      );
    });
  };

  return (
    <div className={`h-screen w-full flex flex-col overflow-hidden relative ${bgClass}`}>

      {/* ── Nia Dedicated Header ── */}
      <header className={`h-16 px-6 flex items-center justify-between border-b shrink-0 z-40 ${dark ? 'bg-[#0B0F1A]/80 border-slate-800' : 'bg-white/80 border-slate-200'} backdrop-blur-xl sticky top-0`}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-teal-500/20">
            <Sparkles className="text-white" size={18} />
          </div>
          <div>
            <h1 className="text-[16px] font-bold tracking-tight">Nia</h1>
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-medium text-slate-500 tracking-wide">Your personal nutritionist</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* User Context Preview */}
          <div className="hidden md:flex items-center gap-3 px-4 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <div className="flex flex-col items-end">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider leading-none">Junk Score</span>
              <span className={`text-[12px] font-black ${todayJunk >= 7 ? 'text-red-500' : todayJunk >= 5 ? 'text-amber-500' : 'text-emerald-500'}`}>{todayJunk}/10</span>
            </div>
            <div className="w-[1px] h-6 bg-slate-300 dark:bg-slate-700"></div>
            <div className="flex flex-col items-end">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider leading-none">Daily Goal</span>
              <span className="text-[12px] font-black text-teal-500">{calGoal} kcal</span>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={startNewChat}
              title="New Chat"
              className={`p-2 rounded-lg transition-all ${dark ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-600'}`}
            >
              <Plus size={20} />
            </button>
            <button
              onClick={() => setShowHistory(true)}
              title="History"
              className={`p-2 rounded-lg transition-all ${dark ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-600'}`}
            >
              <History size={20} />
            </button>
          </div>
        </div>
      </header>

      {/* ── Chat Container ── */}
      <main
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto overflow-x-hidden scroll-smooth bg-transparent"
      >
        <div className="max-w-4xl mx-auto px-6 py-10 space-y-10 pb-40">

          {/* Welcome screen */}
          <AnimatePresence>
            {messages.length === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                className="text-center space-y-10 pt-16"
              >
                <div className="space-y-4">
                  <h2 className="text-[40px] font-black tracking-tight leading-tight">
                    Hey <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-emerald-500">{firstName}</span>,<br />What's on the menu today?
                  </h2>
                  <p className={`text-lg font-medium max-w-xl mx-auto ${dark ? 'text-slate-400' : 'text-slate-500'}`}>
                    Ask me for personalized meal plans, analyze your junk intake, or get scientific nutritional insights.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl mx-auto">
                  {quickPrompts.map((p, i) => (
                    <button
                      key={i}
                      onClick={() => sendMessage(p.text)}
                      className={`p-6 rounded-[24px] border text-left flex items-center justify-between group transition-all duration-300 ${dark ? 'bg-slate-900/40 border-slate-800 hover:border-teal-500/50 hover:bg-slate-900' : 'bg-white border-slate-200 hover:border-teal-500/50 hover:shadow-xl hover:shadow-teal-500/10'
                        }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                          {p.icon}
                        </div>
                        <span className="font-bold text-[16px]">{p.text}</span>
                      </div>
                      <ChevronRight size={20} className="text-slate-400 group-hover:text-teal-500 group-hover:translate-x-1 transition-all" />
                    </button>
                  ))}
                </div>

                <div className={`p-4 rounded-2xl inline-flex items-center gap-3 border ${dark ? 'bg-amber-500/5 border-amber-500/20 text-amber-500' : 'bg-amber-50 border-amber-200 text-amber-700'}`}>
                  <AlertTriangle size={18} className="shrink-0" />
                  <span className="text-[13px] font-bold">Disclaimer: AI nutritional guidance is not a substitute for professional medical advice.</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Messages List */}
          {messages.map((msg, i) => (
            <motion.div
              key={i} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.type === "user" ? "justify-end" : "justify-start"}`}
            >
              <div className={`flex gap-6 w-full ${msg.type === "user" ? "flex-row-reverse" : "flex-row"}`}>
                {/* Avatar */}
                <div className={`w-9 h-9 rounded-xl shrink-0 flex items-center justify-center shadow-md ${msg.type === "user" ? "bg-teal-500 text-white" : (dark ? "bg-slate-800 text-teal-500 border border-slate-700" : "bg-white text-teal-600 border border-slate-200")
                  }`}>
                  {msg.type === "user" ? <User size={18} /> : <Sparkles size={18} />}
                </div>

                <div className={`flex flex-col gap-3 min-w-0 ${msg.type === "user" ? "items-end" : "items-start"}`}>
                  {msg.type === "user" ? (
                    <div className="bg-teal-500 text-white px-5 py-3 rounded-[20px] rounded-tr-none max-w-2xl text-[15px] leading-relaxed font-medium">
                      {msg.image && (
                        <img src={msg.image} alt="Upload" className="rounded-xl mb-3 max-h-64 w-auto object-cover" />
                      )}
                      {msg.text}
                    </div>
                  ) : (
                    <div className={`w-full text-[15px] leading-[1.75] ${dark ? 'text-slate-200' : 'text-[#0F172A]'}`}>
                      {msg.image && (
                        <img src={msg.image} alt="Upload" className="rounded-2xl mb-4 max-h-80 w-auto object-cover shadow-lg" />
                      )}
                      <div className="space-y-1">
                        {renderText(msg.text)}
                        {msg.type === "ai" && isTyping && i === messages.length - 1 && (
                          <span className="nia-cursor ml-1" />
                        )}
                      </div>
                    </div>
                  )}

                  {msg.coursesData && (
                    <div className={`w-full mt-4 rounded-2xl border overflow-hidden ${dark ? 'border-slate-700' : 'border-slate-200'
                      }`}>
                      <div className={`px-5 py-3 border-b flex items-center gap-2 ${dark ? 'bg-slate-800/60 border-slate-700' : 'bg-slate-50 border-slate-200'
                        }`}>
                        <span className="text-base">🎓</span>
                        <span className={`text-[13px] font-black uppercase tracking-widest ${dark ? 'text-slate-300' : 'text-slate-700'
                          }`}>Recommended Nutrition Courses</span>
                      </div>
                      <div className={`divide-y ${dark ? 'divide-slate-800' : 'divide-slate-100'}`}>
                        {msg.coursesData.map((c, ci) => (
                          <a
                            key={ci}
                            href={c.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`flex items-center justify-between px-5 py-3.5 group transition-colors ${dark ? 'hover:bg-slate-800/40' : 'hover:bg-slate-50'
                              }`}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-sm ${dark ? 'bg-slate-800' : 'bg-slate-100'
                                }`}>▶</div>
                              <div className="min-w-0">
                                <div className={`text-[13px] font-semibold truncate ${dark ? 'text-slate-200 group-hover:text-teal-400' : 'text-slate-800 group-hover:text-teal-600'
                                  }`}>{c.title}</div>
                                <div className={`text-[11px] ${dark ? 'text-slate-500' : 'text-slate-400'}`}>{c.channel}</div>
                              </div>
                            </div>
                            <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full shrink-0 ml-3 ${c.tag === 'Free'
                                ? (dark ? 'bg-teal-500/10 text-teal-400' : 'bg-teal-50 text-teal-600')
                                : (dark ? 'bg-red-500/10 text-red-400' : 'bg-red-50 text-red-500')
                              }`}>{c.tag}</span>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Day 1 Plan Table — removed */}

                  {msg.mealPlanData && (
                    <div className="w-full mt-4 space-y-3">

                      {/* Header row */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-lg bg-teal-500 flex items-center justify-center">
                            <FileText size={12} className="text-white" />
                          </div>
                          <span className={`text-[14px] font-bold ${dark ? 'text-white' : 'text-slate-900'}`}>7-Day Nutrition Plan</span>
                          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${dark ? 'bg-teal-500/10 text-teal-400' : 'bg-teal-50 text-teal-700'
                            }`}>{calGoal} kcal/day</span>
                        </div>
                        <button
                          onClick={() => copyToClipboard(
                            msg.mealPlanData.map(d =>
                              `${d.day}\n` + d.meals.map(m => `  ${m.type}: ${m.food} (${m.cal} kcal, P:${m.p}g)`).join('\n')
                            ).join('\n\n')
                          )}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold border transition-all ${dark ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                            }`}
                        >
                          <Copy size={11} /> Copy All
                        </button>
                      </div>

                      {/* Build full-7-day PDF once, pass to every table */}
                      {(() => {
                        const TIME_MAP = { Breakfast: '07:30', Lunch: '13:00', 'Evening Snack': '16:30', Dinner: '20:00', Snack: '16:30', 'Pre-WO': '17:00', 'Post-WO': '20:30' };

                        const allDayRows = msg.mealPlanData.map(d => ({
                          day: d.day,
                          totals: d.totals,
                          rows: d.meals.map(m => ({
                            time: TIME_MAP[m.type] || '--:--',
                            meal: m.type, food: m.food,
                            cal: m.cal, protein: m.p, carbs: m.c, flag: false,
                          }))
                        }));

                        const handleFullPDF = () => {
                          const pdf = new jsPDF({ unit: 'mm', format: 'a4' });
                          const pw = pdf.internal.pageSize.getWidth();
                          const ph = pdf.internal.pageSize.getHeight();
                          const ml = 14, cw = pw - 28;
                          const date = new Date().toLocaleDateString('en-IN', { dateStyle: 'long' });
                          const goal = profileData?.mainGoal || 'General Fitness';
                          const cols = [
                            { x: ml, w: 16 }, { x: ml + 16, w: 22 },
                            { x: ml + 38, w: 80 }, { x: ml + 118, w: 16 },
                            { x: ml + 134, w: 22 }, { x: ml + 156, w: cw - 156 },
                          ];
                          let y = 18;
                          const checkPage = (need = 10) => { if (y + need > ph - 12) { pdf.addPage(); y = 18; } };

                          // Cover header
                          pdf.setFont('helvetica', 'bold'); pdf.setFontSize(16); pdf.setTextColor(15, 23, 42);
                          pdf.text('NutriAI — 7-Day Meal Plan', ml, y); y += 7;
                          pdf.setFont('helvetica', 'normal'); pdf.setFontSize(8); pdf.setTextColor(100, 116, 139);
                          pdf.text(`Generated: ${date}  |  Goal: ${goal}  |  Target: ${calGoal} kcal/day`, ml, y); y += 4;
                          pdf.setDrawColor(226, 232, 240); pdf.line(ml, y, ml + cw, y); y += 7;

                          allDayRows.forEach(({ day, totals, rows }) => {
                            checkPage(30);
                            // Day header bar
                            pdf.setFillColor(240, 253, 250); pdf.roundedRect(ml, y, cw, 8, 1, 1, 'F');
                            pdf.setDrawColor(209, 250, 229); pdf.roundedRect(ml, y, cw, 8, 1, 1, 'S');
                            pdf.setFont('helvetica', 'bold'); pdf.setFontSize(8); pdf.setTextColor(13, 148, 136);
                            pdf.text(day.toUpperCase(), ml + 3, y + 5.2);
                            pdf.setFont('helvetica', 'normal'); pdf.setFontSize(7.5); pdf.setTextColor(148, 163, 184);
                            pdf.text(
                              `Total: ${totals.cal} kcal  |  P ${totals.p}g  |  C ${totals.c}g  |  F ${totals.f}g`,
                              ml + cw - 3, y + 5.2, { align: 'right' }
                            );
                            y += 10;
                            // Column headers
                            pdf.setFillColor(248, 250, 252); pdf.rect(ml, y, cw, 6, 'F');
                            pdf.setFont('helvetica', 'bold'); pdf.setFontSize(7); pdf.setTextColor(148, 163, 184);
                            ['TIME', 'MEAL', 'FOOD', 'CAL', 'PROTEIN', 'CARBS'].forEach((h, ci) => pdf.text(h, cols[ci].x + 2, y + 4.2));
                            y += 6; pdf.setDrawColor(226, 232, 240); pdf.line(ml, y, ml + cw, y);
                            // Rows
                            rows.forEach((row, ri) => {
                              checkPage(13);
                              if (ri % 2 === 1) { pdf.setFillColor(250, 250, 250); pdf.rect(ml, y, cw, 12, 'F'); }
                              pdf.setFont('helvetica', 'normal'); pdf.setFontSize(7.5); pdf.setTextColor(100, 116, 139);
                              pdf.text(row.time, cols[0].x + 2, y + 7.5);
                              pdf.setFont('helvetica', 'bold'); pdf.setTextColor(51, 65, 85);
                              pdf.text(row.meal, cols[1].x + 2, y + 7.5);
                              pdf.setFont('helvetica', 'normal'); pdf.setFontSize(8);
                              pdf.text(pdf.splitTextToSize(row.food, cols[2].w - 3)[0], cols[2].x + 2, y + 7.5);
                              pdf.setFont('helvetica', 'bold'); pdf.setTextColor(13, 148, 136);
                              pdf.text(String(row.cal), cols[3].x + 2, y + 7.5);
                              pdf.setTextColor(51, 65, 85);
                              pdf.text(`${row.protein}g`, cols[4].x + 2, y + 7.5);
                              pdf.text(`${row.carbs}g`, cols[5].x + 2, y + 7.5);
                              y += 12; pdf.setDrawColor(241, 245, 249); pdf.line(ml, y, ml + cw, y);
                            });
                            y += 6;
                          });

                          pdf.save(`NutriAI_7Day_MealPlan_${new Date().toLocaleDateString('en-IN').replace(/\//g, '-')}.pdf`);
                          showToast('7-Day PDF downloaded!');
                        };

                        return allDayRows.map(({ day, rows }, idx) => (
                          <DayPlanTable
                            key={idx}
                            dayLabel={day}
                            rows={rows}
                            dark={dark}
                            onDownload={handleFullPDF}
                            onCopy={() => copyToClipboard(
                              `${day}\n` + rows.map(r => `  ${r.meal}: ${r.food} (${r.cal} kcal, P:${r.protein}g, C:${r.carbs}g)`).join('\n')
                            )}
                          />
                        ));
                      })()}
                    </div>
                  )}

                  {msg.followUps && !isTyping && i === messages.length - 1 && (
                    <div className="flex flex-wrap gap-2.5 pt-4">
                      {msg.followUps.map((f, fi) => (
                        <button
                          key={fi} onClick={() => sendMessage(f)}
                          className={`px-5 py-2.5 rounded-full text-[13px] font-bold border transition-all duration-300 ${dark ? 'bg-slate-900 border-slate-800 hover:border-teal-500/50 hover:bg-slate-800 text-slate-400 hover:text-teal-500' : 'bg-white border-slate-200 hover:border-teal-500/50 hover:shadow-lg text-slate-600 hover:text-teal-600'
                            }`}
                        >
                          {f}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}

          {/* Typing Skeleton */}
          {isTyping && (
            <div className="flex gap-6">
              <div className={`w-9 h-9 rounded-xl bg-slate-800 text-teal-500 flex items-center justify-center border border-slate-700 shadow-md`}>
                <Sparkles size={18} />
              </div>
              <div className={`px-6 py-4 rounded-[24px] bg-slate-900 border border-slate-800 text-slate-400 flex items-center gap-2`}>
                <span className="nia-dot"></span>
                <span className="nia-dot"></span>
                <span className="nia-dot"></span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} className="h-10" />
        </div>
      </main>

      {/* ── Fixed Chat Input Area ── */}
      <footer className="absolute bottom-0 left-0 w-full p-6 pb-10 z-30 bg-gradient-to-t from-inherit to-transparent pointer-events-none">
        <div className="max-w-3xl mx-auto pointer-events-auto">

          {capturedImage && (
            <motion.div
              initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
              className="mb-4 relative w-28 h-28 rounded-[24px] overflow-hidden border-2 border-teal-500 shadow-2xl shadow-teal-500/20"
            >
              <img src={capturedImage} className="w-full h-full object-cover" />
              <button onClick={() => setCapturedImage(null)} className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1.5 shadow-lg"><X size={14} /></button>
            </motion.div>
          )}

          <div className={`nia-glass rounded-[32px] border p-3 flex flex-col gap-2 shadow-[0_20px_50px_rgba(0,0,0,0.15)] transition-all duration-500 group focus-within:shadow-[0_20px_50px_rgba(20,184,166,0.15)] focus-within:border-teal-500/50 ${dark ? 'border-slate-800/80' : 'border-slate-200/80'
            }`}>
            <div className="flex items-center gap-2 px-2 py-1">
              <button onClick={startCamera} className={`p-2 rounded-lg transition-all shrink-0 ${dark ? 'text-slate-500 hover:bg-slate-800 hover:text-slate-300' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600'}`}>
                <Camera size={17} strokeWidth={2} />
              </button>
              <button onClick={() => fileRef.current.click()} className={`p-2 rounded-lg transition-all shrink-0 ${dark ? 'text-slate-500 hover:bg-slate-800 hover:text-slate-300' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600'}`}>
                <Paperclip size={17} strokeWidth={2} />
              </button>

              <textarea
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  e.target.style.height = 'auto';
                  e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                placeholder="Message Nia..."
                className={`nia-textarea flex-1 bg-transparent border-none outline-none ring-0 focus:ring-0 focus:outline-none text-[14px] py-2 px-1 placeholder-slate-400 resize-none overflow-hidden leading-relaxed ${dark ? 'text-white' : 'text-slate-900'}`}
                rows={1}
                style={{ minHeight: '34px', maxHeight: '120px' }}
              />

              <button
                onClick={() => setIsListening(!isListening)}
                className={`p-2 rounded-lg transition-all shrink-0 ${isListening ? 'bg-red-500 text-white nia-pulse' : (dark ? 'text-slate-500 hover:bg-slate-800 hover:text-slate-300' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600')
                  }`}
              >
                {isListening ? <MicOff size={17} /> : <Mic size={17} />}
              </button>
              <button
                disabled={!input.trim() && !capturedImage}
                onClick={() => sendMessage()}
                className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-200 shrink-0 ${input.trim() || capturedImage ? 'bg-teal-500 text-white shadow-md shadow-teal-500/30' : (dark ? 'bg-slate-800 text-slate-600' : 'bg-slate-100 text-slate-300')
                  }`}
              >
                <ArrowUp size={15} strokeWidth={2.5} />
              </button>
            </div>
          </div>
        </div>
      </footer>

      {/* ── Camera Modal ── */}
      <AnimatePresence>
        {showCamera && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center p-6">
            <div className="relative w-full max-w-4xl aspect-video rounded-[32px] overflow-hidden border border-white/10 shadow-2xl">
              <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
              <div className="absolute inset-0 border-[24px] border-black/20 pointer-events-none"></div>
            </div>
            <div className="mt-10 flex items-center gap-12">
              <button onClick={stopCamera} className="w-16 h-16 rounded-full bg-slate-900 border border-slate-800 text-white flex items-center justify-center hover:bg-slate-800 transition-colors shadow-xl"><X size={28} /></button>
              <button onClick={captureImage} className="w-24 h-24 rounded-full bg-white border-[10px] border-slate-300 flex items-center justify-center shadow-2xl hover:scale-105 active:scale-95 transition-all"></button>
              <button onClick={() => fileRef.current.click()} className="w-16 h-16 rounded-full bg-slate-900 border border-slate-800 text-white flex items-center justify-center hover:bg-slate-800 transition-colors shadow-xl"><ImageIcon size={28} /></button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── History Sidebar ── */}
      <AnimatePresence>
        {showHistory && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowHistory(false)} className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-md" />
            <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 200 }} className={`fixed right-0 top-0 h-full w-[400px] z-[70] border-l shadow-2xl flex flex-col ${dark ? 'bg-[#0B0F1A] border-slate-800' : 'bg-white border-slate-200'}`}>
              <div className="p-8 border-b border-slate-800/30 flex items-center justify-between bg-gradient-to-br from-teal-500/5 to-transparent">
                <div>
                  <h3 className="font-black text-2xl tracking-tight">Archives</h3>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">Previous Conversations</p>
                </div>
                <button onClick={() => setShowHistory(false)} className="p-3 hover:bg-slate-800 rounded-2xl transition-colors"><X size={24} /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {history.length === 0 ? (
                  <div className="text-center py-24 text-slate-500 flex flex-col items-center gap-4 opacity-40">
                    <MessageSquare size={48} strokeWidth={1} />
                    <p className="font-bold uppercase tracking-widest text-[10px]">Your history is empty</p>
                  </div>
                ) : (
                  history.map(s => (
                    <div key={s.id} onClick={() => loadHistorySession(s)} className={`group p-5 rounded-[24px] cursor-pointer border border-transparent transition-all flex items-start justify-between gap-4 ${dark ? 'bg-slate-900/50 hover:border-teal-500/40' : 'bg-slate-50 hover:border-teal-500/40'}`}>
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-[15px] truncate text-slate-200">{s.preview}</div>
                        <div className="text-[11px] font-bold text-slate-500 mt-1 uppercase tracking-wider">{s.date}</div>
                      </div>
                      <button onClick={(e) => deleteHistorySession(s.id, e)} className="opacity-0 group-hover:opacity-100 p-2.5 rounded-xl hover:bg-red-500/10 text-red-500 transition-all"><Trash2 size={16} /></button>
                    </div>
                  ))
                )}
              </div>
              <div className="p-6 border-t border-slate-800/30">
                <button onClick={startNewChat} className="w-full py-4 rounded-2xl bg-teal-500 text-white font-black text-sm tracking-widest uppercase shadow-lg shadow-teal-500/20 hover:bg-teal-600 transition-all">Start New Session</button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Toast ── */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: -20, x: "-50%" }} animate={{ opacity: 1, y: 0, x: "-50%" }} exit={{ opacity: 0, y: -20, x: "-50%" }} className="fixed top-24 left-1/2 z-[200] px-6 py-3 rounded-full bg-teal-500 text-white text-[13px] font-black shadow-[0_10px_40px_rgba(20,184,166,0.4)] flex items-center gap-3 border border-white/20">
            <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center"><Check size={12} strokeWidth={4} /></div> {toast}
          </motion.div>
        )}
      </AnimatePresence>

      <input ref={fileRef} type="file" hidden accept="image/*" onChange={(e) => {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (ev) => setCapturedImage(ev.target.result);
          reader.readAsDataURL(file);
        }
      }} />

    </div>
  );
}
