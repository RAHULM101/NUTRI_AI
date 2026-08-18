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

/* ── Brand icons ───────────────────────────────────────────── */
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
    </svg>
  );
}

function FieldLabel({ children, dark }) {
  return (
    <label className={`block text-xs font-semibold mb-1.5 ${dark ? "text-gray-300" : "text-gray-600"}`}>
      {children}
    </label>
  );
}

function StrengthBar({ password }) {
  const score = (() => {
    if (!password) return 0;
    let s = 0;
    if (password.length >= 8) s++;
    if (/[A-Z]/.test(password)) s++;
    if (/[0-9]/.test(password)) s++;
    if (/[^A-Za-z0-9]/.test(password)) s++;
    return s;
  })();

  const labels = ["", "Weak", "Fair", "Good", "Strong"];
  const colors = ["", "bg-red-400", "bg-orange-400", "bg-yellow-400", "bg-emerald-500"];
  const textColors = ["", "text-red-400", "text-orange-400", "text-yellow-500", "text-emerald-500"];

  if (!password) return null;

  return (
    <div className="mt-2">
      <div className="flex gap-1 mb-1">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-all duration-300 ${i <= score ? colors[score] : "bg-gray-200"
              }`}
          />
        ))}
      </div>
      <p className={`text-[10px] font-medium ${textColors[score]}`}>{labels[score]}</p>
    </div>
  );
}

/* ── Signup Page ──────────────────────────────────────────── */
export default function SignupPage({ open, onClose, dark, onSwitchToLogin, onSubmit }) {
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [email, setEmail] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [loadingApple, setLoadingApple] = useState(false);
  const [visible, setVisible] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [step, setStep] = useState(1);
  const [otpArray, setOtpArray] = useState(["", "", "", "", "", ""]);
  const [signupEmail, setSignupEmail] = useState("");
  const inputRefs = useRef([]);


  const loginWithGoogle = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        setLoadingGoogle(true);

        // Send the Google token to your Django endpoint
        const response = await axios.post(`${baseURL}/api/auth/google/`, {
          token: tokenResponse.access_token
        });

        // Save the token returned by your backend
        localStorage.setItem("access_token", response.data.access_token);

        // Close the modal / trigger the redirect
        onSubmit(response.data.user?.is_onboarded || false);
      } catch (error) {
        setErrorMsg("Google authentication failed");
        setLoadingGoogle(false);
      }
    },
    onError: () => {
      setErrorMsg("Google signup popup closed or failed");
    }
  });


  function handleSocial(setLoading) {
    setLoading(true);
    setTimeout(() => setLoading(false), 800);
  }

  const handleSubmit = async () => {
    setErrorMsg("");
    if (password !== confirmPassword) {
      setErrorMsg("Passwords do not match");
      return;
    }

    setSubmitting(true);
    try {
      const response = await axios.post(`${baseURL}/api/register/`, {
        email: email,
        password: password,
        confirm_password: confirmPassword,
      });

      localStorage.setItem("access_token", response.data.access_token);
      onSubmit(response.data.user?.is_onboarded || false);
    } catch (error) {
      console.error("Error:", error.response?.data || error.message);
      // Try to extract a readable error message from the backend
      const data = error.response?.data;
      if (data && typeof data === 'object') {
        const firstKey = Object.keys(data)[0];
        if (firstKey) {
          setErrorMsg(`${firstKey}: ${data[firstKey][0]}`);
        } else {
          setErrorMsg("Registration failed. Please try again.");
        }
      } else {
        setErrorMsg("Network error. Please make sure the server is running.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    if (!open) setSubmitting(false);
    setErrorMsg("");
  }, [open]);


  const raf1 = useRef();
  const raf2 = useRef();

  useEffect(() => {
    let timer;
    if (open) {
      timer = setTimeout(() => {
        setMounted(true);
        raf1.current = requestAnimationFrame(() => {
          raf2.current = requestAnimationFrame(() => setVisible(true));
        });
      }, 0);
    } else {
      timer = setTimeout(() => {
        setVisible(false);
        setTimeout(() => {
          setMounted(false);
          setSubmitting(false);
          setPassword("");
          setConfirmPassword("");
          setEmail("");
          setErrorMsg("");
          setShowPw(false);
          setShowConfirm(false);
          setAgreed(false);
        }, 350);
      }, 0);
    }
    return () => {
      clearTimeout(timer);
      cancelAnimationFrame(raf1.current);
      cancelAnimationFrame(raf2.current);
    };
  }, [open]);

  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  if (!mounted) return null;

  const card = dark
    ? "bg-gray-900 border border-gray-700/30 text-white"
    : "bg-white border border-gray-100/80 text-gray-900";

  const input = dark
    ? "bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:border-emerald-500"
    : "bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-emerald-500";

  const social = dark
    ? "bg-gray-800 border-gray-700 text-gray-200 hover:bg-gray-700"
    : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50";

  const iconCls = dark ? "text-gray-500" : "text-gray-400";
  const eyeCls = dark ? "text-gray-500 hover:text-gray-300" : "text-gray-400 hover:text-gray-600";

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[100] flex items-center justify-center px-4 py-6"
      style={{
        backgroundColor: visible ? "rgba(0,0,0,0.55)" : "rgba(0,0,0,0)",
        backdropFilter: visible ? "blur(6px)" : "blur(0px)",
        transition: "background-color 350ms ease, backdrop-filter 350ms ease",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`relative w-full max-w-lg rounded-3xl shadow-2xl p-8 overflow-y-auto max-h-[calc(100vh-3rem)] ${card}`}
        style={{
          opacity: visible ? 1 : 0,
          transform: visible
            ? "scale(1) rotate(0deg) translateY(0px)"
            : "scale(0.92) rotate(4deg) translateY(28px)",
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

        {/* ================= REGISTRATION FORM ================= */}
        {true && (
          <>
            <h2 className="text-2xl font-black mb-1">Create Your Account</h2>
            <p className={`text-sm mb-7 ${dark ? "text-gray-400" : "text-gray-500"}`}>
              Join thousands building healthier habits with AI
            </p>

            <div className="space-y-4">
              <div>
                <FieldLabel dark={dark}>Email / Phone Number</FieldLabel>
                <div className="relative">
                  <Mail size={15} className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${iconCls}`} />
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
                <FieldLabel dark={dark}>Password</FieldLabel>
                <div className="relative">
                  <Lock size={15} className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${iconCls}`} />
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
                    className={`absolute right-3.5 top-1/2 -translate-y-1/2 transition-colors ${eyeCls}`}
                  >
                    {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                <StrengthBar password={password} />
              </div>

              <div>
                <FieldLabel dark={dark}>Confirm Password</FieldLabel>
                <div className="relative">
                  <Lock size={15} className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${iconCls}`} />
                  <input
                    type={showConfirm ? "text" : "password"}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={`w-full pl-10 pr-11 py-3 rounded-xl border text-sm outline-none transition-colors duration-200 ${input}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className={`absolute right-3.5 top-1/2 -translate-y-1/2 transition-colors ${eyeCls}`}
                  >
                    {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <div className="flex items-start gap-2.5 pt-1">
                <div
                  onClick={() => setAgreed(!agreed)}
                  className={`mt-0.5 w-4 h-4 rounded shrink-0 flex items-center justify-center border transition-colors duration-200 cursor-pointer
                    ${agreed
                      ? "bg-emerald-500 border-emerald-500"
                      : dark ? "border-gray-600 bg-gray-800" : "border-gray-300 bg-white"
                    }`}
                >
                  {agreed && (
                    <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
                      <path d="M1 3.5L3.5 6L8 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
                <p className={`text-xs leading-relaxed ${dark ? "text-gray-400" : "text-gray-500"}`}>
                  I agree to the{" "}
                  <button className="font-semibold text-emerald-500 hover:text-emerald-400 transition-colors">
                    Terms of Service
                  </button>
                  {" "}and{" "}
                  <button className="font-semibold text-emerald-500 hover:text-emerald-400 transition-colors">
                    Privacy Policy
                  </button>
                </p>
              </div>

              {errorMsg && (
                <p className="text-xs text-red-500 font-medium">{errorMsg}</p>
              )}

              <button
                onClick={handleSubmit}
                disabled={!agreed || submitting}
                className="w-full flex items-center justify-center py-3.5 rounded-xl text-white font-bold text-sm shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                style={{ background: "linear-gradient(135deg, #10b981 0%, #059669 50%, #047857 100%)" }}
              >
                <span
                  className="transition-all duration-200"
                  style={{ opacity: submitting ? 0 : 1, position: submitting ? "absolute" : "relative" }}
                >
                  Create Account
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
                <span className="text-[11px]">Your data is protected with end-to-end encryption</span>
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
              Already have an account?{" "}
              <button
                onClick={onSwitchToLogin}
                className="font-bold text-emerald-500 hover:text-emerald-400 transition-colors"
              >
                Log In
              </button>
            </p>
          </>
        )}

      </div>
    </div>
  );
}