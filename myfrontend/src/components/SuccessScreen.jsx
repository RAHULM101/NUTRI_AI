import { useEffect, useState } from "react";
import { Sparkles, CheckCircle2 } from "lucide-react";
import logo from '../assets/Screenshot_2026-05-08_184522-removebg-preview.png';

export default function SuccessScreen({ onGetStarted, dark }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 60);
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center"
      style={{
        background: dark
          ? "linear-gradient(135deg, #0a0f1a 0%, #0f1f1a 50%, #0a1510 100%)"
          : "linear-gradient(135deg, #fdfaf5 0%, #f0fdf8 50%, #f1f8f5 100%)"
      }}
    >
      {/* Ambient blobs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-20 blur-3xl pointer-events-none"
        style={{ background: "radial-gradient(circle, #14b8a6, transparent)" }} />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full opacity-15 blur-3xl pointer-events-none"
        style={{ background: "radial-gradient(circle, #0f766e, transparent)" }} />

      <div
        className="flex flex-col items-center text-center px-8 max-w-lg"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0) scale(1)" : "translateY(24px) scale(0.96)",
          transition: "opacity 600ms cubic-bezier(0.34,1.56,0.64,1), transform 600ms cubic-bezier(0.34,1.56,0.64,1)",
        }}
      >
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-4">
          <img
            src={logo}
            alt="NutriAI"
            style={{ height: 36, width: 'auto', objectFit: 'contain', filter: dark ? 'brightness(0) invert(1)' : 'none' }}
          />
        </div>

        {/* Success icon */}
        <div className="relative mb-8">
          <div className="w-24 h-24 rounded-full flex items-center justify-center shadow-2xl"
            style={{ background: "linear-gradient(135deg, #0f766e, #14b8a6)", boxShadow: "0 20px 60px rgba(20,184,166,0.35)" }}>
            <CheckCircle2 size={44} className="text-white" strokeWidth={1.5} />
          </div>
          {/* Ripple rings */}
          {[1, 2].map((i) => (
            <div key={i} className="absolute inset-0 rounded-full border-2 border-teal-400/30"
              style={{ animation: `ripple 2s ease-out ${i * 0.6}s infinite`, transform: "scale(1)" }} />
          ))}
        </div>

        {/* Heading */}
        <h1 className={`text-4xl font-black mb-4 tracking-tight ${dark ? 'text-white' : 'text-gray-900'}`}>
          Welcome onboard! 🎉
        </h1>

        <p className={`text-lg leading-relaxed mb-10 max-w-md ${dark ? 'text-slate-400' : 'text-gray-500'}`}>
          Your personalized nutrition journey starts now. We're preparing custom meal plans
          and insights based on your profile.
        </p>

        {/* Feature chips */}
        <div className="flex flex-wrap justify-center gap-3 mb-10">
          {[
            { icon: "🥗", text: "Custom Meal Plans" },
            { icon: "📊", text: "Nutrition Tracking" },
            { icon: "🤖", text: "AI Insights" },
          ].map((f) => (
            <div key={f.text} className={`flex items-center gap-2 px-4 py-2 rounded-full border shadow-sm ${dark ? 'bg-slate-800 border-teal-900/50' : 'bg-white border-teal-100'}`}>
              <span className="text-sm">{f.icon}</span>
              <span className={`text-sm font-semibold ${dark ? 'text-slate-300' : 'text-gray-700'}`}>{f.text}</span>
            </div>
          ))}
        </div>

        {/* CTA */}
        <button
          onClick={onGetStarted}
          className="px-12 py-4 rounded-2xl text-white font-bold text-base tracking-wide shadow-xl hover:-translate-y-1 hover:shadow-2xl transition-all duration-300"
          style={{
            background: "linear-gradient(135deg, #0f766e 0%, #14b8a6 100%)",
            boxShadow: "0 12px 40px rgba(20,184,166,0.35)",
          }}
        >
          Get Started →
        </button>

        <div className={`flex items-center gap-1.5 mt-5 ${dark ? 'text-slate-500' : 'text-gray-400'}`}>
          <Sparkles size={13} className="text-teal-400" />
          <span className="text-xs">Powered by AI nutrition science</span>
        </div>
      </div>

      <style>{`
        @keyframes ripple {
          0%   { transform: scale(1);   opacity: 0.6; }
          100% { transform: scale(2.2); opacity: 0;   }
        }
      `}</style>
    </div>
  );
}
