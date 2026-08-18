import { useGoogleLogin } from '@react-oauth/google';
import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { Mail, Lock, Eye, EyeOff, X, ShieldCheck } from "lucide-react";
import logo from '../assets/Screenshot_2026-05-08_184522-removebg-preview.png';

const baseURL = import.meta.env.VITE_BACKEND_URL;

/* ── Spinner ────────────────────────────────────────────────── */
function Spinner() {
  return (
    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
    </svg>
  );
}

/* ── SVG brand icons ─────────────────────────────────────── */
function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 814 1000" fill="currentColor">
      <path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76 0-103.7 40.8-165.9 40.8s-105-57.8-155.5-127.4C46 790.7 0 663 0 541.8c0-207.5 135.4-317.3 269-317.3 70.1 0 128.4 46.4 172.5 46.4 42.8 0 109.6-49 192.5-49 30.8 0 108.2 2.6 168.6 71.9zm-174.5-89.3c-27.6-32.5-67.4-56.4-111.9-56.4-5.8 0-11.6.6-17.4 1.3 1.3-6.5 1.9-13 1.9-19.5 0-57.8-24.6-119.4-70.1-159.5C373.6 4.5 320.4 0 282.2 0c-5.8 0-11.6.6-17.4 1.3 1.3 6.5 1.9 13 1.9 19.5 0 57.8 24.6 119.4 70.1 159.5 44.2 38.7 97.4 56.4 135.6 56.4 5.8 0 11.6-.6 17.4-1.3z" />
    </svg >
  );
}

/* ── Login Page ─────────────────────────────────────────── */
export default function LoginPage({ open, onClose, dark, onSwitchToSignup, onSubmit }) {
  const [showPw, setShowPw] = useState(false);
  const [remember, setRemember] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [loadingApple, setLoadingApple] = useState(false);
  const [visible, setVisible] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [step, setStep] = useState(1);
  const [otpArray, setOtpArray] = useState(["", "", "", "", "", ""]);
  const inputRefs = useRef([]);
  const [loginEmail, setLoginEmail] = useState("");


  const loginWithGoogle = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        setLoadingGoogle(true);

        // Send the Google token to your new Django endpoint
        const response = await axios.post(`${baseURL}/api/auth/google/`, {
          token: tokenResponse.access_token
        });

        // Save the token just like your regular login does
        localStorage.setItem("access_token", response.data.access_token);

        // Close the modal / trigger the redirect
        onSubmit("login");
      } catch (error) {
        setErrorMsg("Google authentication failed");
        setLoadingGoogle(false);
      }
    },
    onError: () => {
      setErrorMsg("Google login popup closed or failed");
    }
  });

  function handleSocial(setLoading) {
    setLoading(true);
    setTimeout(() => setLoading(false), 800);
  }

  const handleSubmit = async () => {
    setErrorMsg("");
    if (!email || !password) {
      setErrorMsg("Please fill all the fields");
      return;
    }
    setSubmitting(true);

    try {
      const response = await axios.post(`${baseURL}/api/login/`, {
        username: email,
        password,
      });
      localStorage.setItem("access_token", response.data.access_token);
      onSubmit("login");
    } catch (error) {
      setErrorMsg("Invalid credentials");
    }
    setSubmitting(false);
  }

  useEffect(() => {
    if (!open) setSubmitting(false);
    setErrorMsg("");
  }, [open]);

  useEffect(() => {
    let raf1, raf2, timer1, timer2;
    if (open) {
      timer1 = setTimeout(() => {
        setMounted(true);
        raf1 = requestAnimationFrame(() => {
          raf2 = requestAnimationFrame(() => setVisible(true));
        });
      }, 0);
    } else {
      timer1 = setTimeout(() => setVisible(false), 0);
      timer2 = setTimeout(() => setMounted(false), 350);
    }
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
    };
  }, [open]);

  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  if (!mounted) return null;

  const card = dark
    ? "bg-gray-900 border border-gray-700/60 text-white"
    : "bg-white border border-gray-100 text-gray-900";

  const input = dark
    ? "bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:border-emerald-500"
    : "bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-emerald-500";

  const social = dark
    ? "bg-gray-800 border-gray-700 text-gray-200 hover:bg-gray-700"
    : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50";

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[100] flex items-center justify-center px-4"
      style={{
        backgroundColor: visible ? "rgba(0,0,0,0.55)" : "rgba(0,0,0,0)",
        backdropFilter: visible ? "blur(6px)" : "blur(0px)",
        transition: "background-color 350ms ease, backdrop-filter 350ms ease",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`relative w-full max-w-md rounded-3xl shadow-2xl p-8 ${card}`}
        style={{
          opacity: visible ? 1 : 0,
          transform: visible
            ? "scale(1) rotate(0deg) translateY(0px)"
            : "scale(0.92) rotate(-4deg) translateY(24px)",
          transition: "opacity 350ms cubic-bezier(0.34,1.56,0.64,1), transform 350ms cubic-bezier(0.34,1.56,0.64,1)",
        }}
      >
        <button
          onClick={onClose}
          className={`absolute top-5 right-5 w-8 h-8 rounded-full flex items-center justify-center transition-colors
            ${dark ? "text-gray-400 hover:bg-gray-700 hover:text-white" : "text-gray-400 hover:bg-gray-100 hover:text-gray-700"}`}
        >
          <X size={16} />
        </button>

        <div className="flex items-center justify-center gap-2 mb-6">
          <img
            src={logo}
            alt="NutriAI"
            style={{ height: 52, width: 'auto', objectFit: 'contain', filter: dark ? 'brightness(0) invert(1)' : 'none' }}
          />
        </div>

        {/* ================= LOGIN FORM ================= */}
        {true && (
          <>
            <h2 className="text-2xl font-black mb-1">
              Welcome Back <span className="not-italic">👋</span>
            </h2>
            <p className={`text-sm mb-7 ${dark ? "text-gray-400" : "text-gray-500"}`}>
              Log in to continue your personalized nutrition journey
            </p>

            <div className="space-y-4">
              <div>
                <label className={`block text-xs font-semibold mb-1.5 ${dark ? "text-gray-300" : "text-gray-600"}`}>
                  Email / Phone Number
                </label>
                <div className="relative">
                  <Mail size={15} className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${dark ? "text-gray-500" : "text-gray-400"}`} />
                  <input
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`w-full pl-10 pr-4 py-3 rounded-xl border text-sm outline-none transition-colors duration-200 ${input}`}
                  />
                </div>
              </div>

              <div>
                <label className={`block text-xs font-semibold mb-1.5 ${dark ? "text-gray-300" : "text-gray-600"}`}>
                  Password
                </label>
                <div className="relative">
                  <Lock size={15} className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${dark ? "text-gray-500" : "text-gray-400"}`} />
                  <input
                    type={showPw ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`w-full pl-10 pr-11 py-3 rounded-xl border text-sm outline-none transition-colors duration-200 ${input}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(!showPw)}
                    className={`absolute right-3.5 top-1/2 -translate-y-1/2 transition-colors ${dark ? "text-gray-500 hover:text-gray-300" : "text-gray-400 hover:text-gray-600"}`}
                  >
                    {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <div
                    onClick={() => setRemember(!remember)}
                    className={`w-4 h-4 rounded flex items-center justify-center border transition-colors duration-200 cursor-pointer
                      ${remember ? "bg-emerald-500 border-emerald-500" : dark ? "border-gray-600 bg-gray-800" : "border-gray-300 bg-white"}`}
                  >
                    {remember && (
                      <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
                        <path d="M1 3.5L3.5 6L8 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </div>
                  <span className={`text-xs font-medium ${dark ? "text-gray-300" : "text-gray-600"}`}>Remember me</span>
                </label>
                <button className="text-xs font-semibold text-emerald-500 hover:text-emerald-400 transition-colors">
                  Forgot Password?
                </button>
              </div>

              {errorMsg && (
                <p className="text-xs text-red-500 font-medium">{errorMsg}</p>
              )}

              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="w-full flex items-center justify-center py-3.5 rounded-xl text-white font-bold text-sm shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:-translate-y-0.5 transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-90"
                style={{ background: "linear-gradient(135deg, #10b981 0%, #059669 50%, #047857 100%)" }}
              >
                <span
                  className="flex items-center justify-center gap-2 transition-all duration-200"
                  style={{ opacity: submitting ? 0 : 1, position: submitting ? "absolute" : "relative" }}
                >
                  Log In
                </span>
                {submitting && (
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                    <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                )}
              </button>

              <div className={`flex items-center justify-center gap-1.5 ${dark ? "text-gray-500" : "text-gray-400"}`}>
                <ShieldCheck size={12} />
                <span className="text-[11px]">Secure login powered by encryption</span>
              </div>
            </div>

            <div className="flex items-center gap-3 my-5">
              <div className={`flex-1 h-px ${dark ? "bg-gray-700" : "bg-gray-200"}`} />
              <span className={`text-xs font-medium ${dark ? "text-gray-500" : "text-gray-400"}`}>Or continue with</span>
              <div className={`flex-1 h-px ${dark ? "bg-gray-700" : "bg-gray-200"}`} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => loginWithGoogle()}
                disabled={loadingGoogle}
                className={`flex items-center justify-center gap-2.5 py-3 rounded-xl border text-sm font-semibold transition-all duration-200 hover:-translate-y-0.5 disabled:opacity-80 disabled:cursor-not-allowed ${social}`}
              >
                {loadingGoogle ? <Spinner /> : <GoogleIcon />}
                Google
              </button>
              <button
                onClick={() => handleSocial(setLoadingApple)}
                disabled={loadingApple}
                className={`flex items-center justify-center gap-2.5 py-3 rounded-xl border text-sm font-semibold transition-all duration-200 hover:-translate-y-0.5 disabled:opacity-80 disabled:cursor-not-allowed ${social}`}
              >
                {loadingApple ? <Spinner /> : <AppleIcon />}
                Apple
              </button>
            </div>

            <p className={`text-center text-sm mt-6 ${dark ? "text-gray-400" : "text-gray-500"}`}>
              Don't have an account?{" "}
              <button
                onClick={onSwitchToSignup}
                className="font-bold text-emerald-500 hover:text-emerald-400 transition-colors"
              >
                Sign Up
              </button>
            </p>
          </>
        )}


      )
      </div>
    </div>
  );
}