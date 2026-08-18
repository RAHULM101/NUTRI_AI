import { useEffect, useState } from "react";
import logo from '../assets/Screenshot_2026-05-08_184522-removebg-preview.png';

/* ── Messages cycling below the spinner ─────────────────── */
const MESSAGES = {
  login: ["Verifying credentials...", "Logging you in...", "Almost there..."],
  signup: ["Setting up your profile...", "Creating your account...", "Almost ready..."],
};

export default function LoadingScreen({ visible, type = "login", dark = false }) {
  const [opacity, setOpacity] = useState(0);
  const [msgIdx, setMsgIdx] = useState(0);

  /* Fade in/out + reset message index */
  useEffect(() => {
    let raf1, raf2, t1, t2;
    if (visible) {
      raf1 = requestAnimationFrame(() => {
        raf2 = requestAnimationFrame(() => setOpacity(1));
      });
      t1 = setTimeout(() => setMsgIdx(0), 0);
    } else {
      t2 = setTimeout(() => setOpacity(0), 0);
    }
    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [visible]);

  /* Cycle through messages every 900 ms while visible */
  useEffect(() => {
    if (!visible) return;
    const id = setInterval(() => {
      setMsgIdx((i) => (i + 1) % MESSAGES[type].length);
    }, 900);
    return () => clearInterval(id);
  }, [visible, type]);

  if (!visible && opacity === 0) return null;

  const messages = MESSAGES[type];

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center"
      style={{
        opacity,
        transition: "opacity 400ms ease",
        /* Layered background: blurred backdrop + soft gradient */
        backdropFilter: "blur(18px) saturate(1.4)",
        WebkitBackdropFilter: "blur(18px) saturate(1.4)",
        background:
          dark
            ? "radial-gradient(ellipse at 50% 40%, rgba(16,185,129,0.10) 0%, transparent 65%), rgba(10,15,26,0.92)"
            : "radial-gradient(ellipse at 50% 40%, rgba(16,185,129,0.12) 0%, transparent 65%), rgba(255,255,255,0.82)",
      }}
    >
      {/* Card */}
      <div
        className="flex flex-col items-center gap-7 px-12 py-10 rounded-3xl"
        style={{
          background: dark ? "rgba(15,23,42,0.75)" : "rgba(255,255,255,0.7)",
          boxShadow: dark
            ? "0 8px 48px rgba(16,185,129,0.08), 0 2px 16px rgba(0,0,0,0.4)"
            : "0 8px 48px rgba(16,185,129,0.10), 0 2px 16px rgba(0,0,0,0.06)",
          border: dark ? "1px solid rgba(16,185,129,0.18)" : "1px solid rgba(16,185,129,0.12)",
          transform: `scale(${opacity === 1 ? 1 : 0.94})`,
          transition: "transform 400ms cubic-bezier(0.34,1.56,0.64,1)",
        }}
      >
        {/* Logo */}
        <div className="flex items-center gap-2">
          <img
            src={logo}
            alt="NutriAI"
            className="h-9 w-auto object-contain"
            style={{ filter: dark ? 'brightness(0) invert(1)' : 'none' }}
          />
        </div>

        {/* Spinner stack */}
        <div className="relative flex items-center justify-center" style={{ width: 80, height: 80 }}>
          {/* Outer slow ring */}
          <div
            className="absolute inset-0 rounded-full"
            style={{
              border: "2px solid rgba(16,185,129,0.15)",
              animation: "spinSlow 3s linear infinite",
            }}
          />
          {/* Middle dashed ring */}
          <div
            className="absolute rounded-full"
            style={{
              inset: 8,
              border: "2px dashed rgba(16,185,129,0.25)",
              animation: "spinSlow 5s linear infinite reverse",
            }}
          />
          {/* Main spinner arc */}
          <div
            className="absolute rounded-full"
            style={{
              inset: 14,
              border: "3px solid transparent",
              borderTopColor: "#10b981",
              borderRightColor: "#10b981",
              animation: "spinFast 0.75s linear infinite",
              filter: "drop-shadow(0 0 6px rgba(16,185,129,0.5))",
            }}
          />
          {/* Center dot */}
          <div
            className="w-3 h-3 rounded-full bg-emerald-500"
            style={{
              boxShadow: "0 0 10px rgba(16,185,129,0.6)",
              animation: "dotPulse 1.5s ease-in-out infinite",
            }}
          />
        </div>

        {/* Cycling message */}
        <div className="flex flex-col items-center gap-2">
          <p
            key={msgIdx}
            className={`text-sm font-semibold text-center ${dark ? 'text-gray-300' : 'text-gray-700'}`}
            style={{ animation: "fadeSlideUp 0.4s ease forwards" }}
          >
            {messages[msgIdx]}
          </p>

          {/* Animated dots */}
          <div className="flex items-center gap-1.5">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-1.5 h-1.5 rounded-full bg-emerald-400"
                style={{
                  animation: `dotBounce 1.2s ease-in-out ${i * 0.2}s infinite`,
                }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Keyframes injected inline so no extra CSS file is needed */}
      <style>{`
        @keyframes spinFast {
          to { transform: rotate(360deg); }
        }
        @keyframes spinSlow {
          to { transform: rotate(360deg); }
        }
        @keyframes dotPulse {
          0%, 100% { transform: scale(1);   opacity: 1;   }
          50%       { transform: scale(1.5); opacity: 0.6; }
        }
        @keyframes logoPulse {
          0%, 100% { transform: scale(1);    box-shadow: 0 0 0 0 rgba(16,185,129,0.4); }
          50%       { transform: scale(1.06); box-shadow: 0 0 0 8px rgba(16,185,129,0);  }
        }
        @keyframes dotBounce {
          0%, 80%, 100% { transform: translateY(0);    opacity: 0.4; }
          40%            { transform: translateY(-5px); opacity: 1;   }
        }
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0);   }
        }
      `}</style>
    </div>
  );
}
