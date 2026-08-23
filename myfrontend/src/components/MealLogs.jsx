import { useState, useRef, useEffect } from 'react';
import { Camera, Upload, Mic, MicOff, X, Clock, Utensils, MapPin, Plus, Check, Trash2, ChevronDown, ChevronLeft, Zap, Flame, Droplets, Beef, ScanLine, ShieldAlert } from 'lucide-react';
import { useUser } from '../context/UserContext';
import axios from 'axios';

const MEAL_TYPES = ['Breakfast', 'Lunch', 'Dinner', 'Snack', 'Pre-workout', 'Post-workout'];
const MEAL_LOCATIONS = ['Home-cooked', 'Office / Canteen', 'Restaurant', 'Street Food', 'Café', 'Ordered In'];
const DAILY_SCAN_LIMIT = 5;

const baseURL = import.meta.env.VITE_BACKEND_URL;

const MOCK_FOODS = [
  { name: 'Dal Tadka with Rice', calories: 420, protein: 18, fat: 8, carbs: 65, junkScore: 2 },
  { name: 'Chicken Biryani', calories: 580, protein: 32, fat: 18, carbs: 62, junkScore: 4 },
  { name: 'Paneer Butter Masala', calories: 380, protein: 16, fat: 22, carbs: 28, junkScore: 5 },
  { name: 'Masala Dosa with Chutney', calories: 290, protein: 7, fat: 10, carbs: 44, junkScore: 3 },
  { name: 'Aloo Paratha with Curd', calories: 350, protein: 9, fat: 14, carbs: 48, junkScore: 4 },
  { name: 'Grilled Chicken Salad', calories: 310, protein: 38, fat: 12, carbs: 14, junkScore: 1 },
  { name: 'Poha with Peanuts', calories: 250, protein: 6, fat: 7, carbs: 40, junkScore: 2 },
  { name: 'Rajma Chawal', calories: 460, protein: 20, fat: 6, carbs: 78, junkScore: 2 },
];

const simulateAnalysis = () => new Promise(r => setTimeout(() => r(MOCK_FOODS[Math.floor(Math.random() * MOCK_FOODS.length)]), 2200));

function MiniSelect({ value, onChange, options, placeholder, icon: Icon }) {
  const [open, setOpen] = useState(false);
  const ref = useRef();
  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);
  return (
    <div ref={ref} className="relative flex-1">
      <button type="button" onClick={() => setOpen(o => !o)}
        className="w-full h-14 pl-4 pr-10 border border-slate-200 dark:border-slate-700 rounded-2xl text-[15px] font-semibold flex items-center gap-2.5 bg-white dark:bg-slate-800 hover:border-[#14B8A6]/60 transition-all shadow-sm">
        {Icon && <Icon size={15} className="text-[#14B8A6] shrink-0" />}
        <span className={value ? 'text-slate-900 dark:text-slate-100' : 'text-slate-400 dark:text-slate-500'}>{value || placeholder}</span>
        <ChevronDown size={14} className={`absolute right-3.5 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute top-[calc(100%+6px)] left-0 right-0 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl z-50 py-2 max-h-52 overflow-y-auto">
          {options.map(opt => (
            <div key={opt} onClick={() => { onChange(opt); setOpen(false); }}
              className={`px-4 py-3 text-[14px] cursor-pointer flex items-center gap-2.5 transition-colors ${value === opt ? 'bg-[#14B8A6]/10 text-[#14B8A6] font-bold' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 font-medium'}`}>
              {value === opt && <Check size={13} strokeWidth={3} />}{opt}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function NutriBadge({ icon: Icon, label, value, color, dark }) {
  return (
    <div className={`flex-1 flex flex-col items-center gap-1.5 py-5 rounded-2xl border ${dark ? 'bg-slate-800/60 border-slate-700/50' : 'bg-slate-50 border-slate-100'}`}>
      <Icon size={20} className={color} />
      <span className={`text-xl font-black ${dark ? 'text-white' : 'text-slate-900'}`}>{value}</span>
      <span className={`text-[10px] font-bold uppercase tracking-widest ${dark ? 'text-slate-500' : 'text-slate-400'}`}>{label}</span>
    </div>
  );
}

function JunkMeter({ score, dark }) {
  const color = score <= 30 ? '#14B8A6' : score <= 60 ? '#F59E0B' : '#EF4444';
  const label = score <= 30 ? 'Clean' : score <= 60 ? 'Moderate' : 'Junky';
  return (
    <div className={`flex items-center gap-4 px-5 py-4 rounded-2xl border ${dark ? 'bg-slate-800/60 border-slate-700/50' : 'bg-slate-50 border-slate-100'}`}>
      <ShieldAlert size={22} style={{ color }} />
      <div className="flex-1">
        <div className="flex items-center justify-between mb-2">
          <span className={`text-[12px] font-bold uppercase tracking-widest ${dark ? 'text-slate-500' : 'text-slate-400'}`}>Junk Score</span>
          <span className="text-[15px] font-black" style={{ color }}>{score}/100 — {label}</span>
        </div>
        <div className={`h-2 rounded-full ${dark ? 'bg-slate-700' : 'bg-slate-200'}`}>
          <div className="h-full rounded-full transition-all duration-700" style={{ width: `${score}%`, background: color }} />
        </div>
      </div>
    </div>
  );
}

function MealRow({ meal, onDelete, dark }) {
  const time = new Date(meal.time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  return (
    <div className="flex items-center gap-5 py-4 group">
      <div className="w-2.5 h-2.5 rounded-full bg-[#14B8A6] ring-4 ring-[#14B8A6]/10 shrink-0 mt-1" />
      <div className="w-16 h-16 rounded-2xl overflow-hidden shrink-0 bg-slate-100 dark:bg-slate-800">
        {meal.photo
          ? <img src={meal.photo} alt={meal.name} className="w-full h-full object-cover" />
          : <div className="w-full h-full flex items-center justify-center"><Utensils size={20} className="text-slate-400" /></div>}
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-[16px] font-bold leading-tight truncate ${dark ? 'text-white' : 'text-slate-900'}`}>{meal.name}</p>
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          <span className="text-[12px] font-bold text-[#14B8A6]">{time}</span>
          <span className={`text-[12px] ${dark ? 'text-slate-500' : 'text-slate-400'}`}>·</span>
          <span className={`text-[12px] font-semibold ${dark ? 'text-slate-400' : 'text-slate-500'}`}>{meal.type}</span>
          {meal.location && <><span className={`text-[12px] ${dark ? 'text-slate-500' : 'text-slate-400'}`}>·</span><span className={`text-[12px] font-semibold ${dark ? 'text-slate-400' : 'text-slate-500'}`}>{meal.location}</span></>}
        </div>
        {meal.calories && (
          <div className="flex items-center gap-3 mt-1.5">
            <span className="text-[12px] font-bold text-orange-500">{meal.calories} kcal</span>
            <span className={`text-[11px] ${dark ? 'text-slate-600' : 'text-slate-400'}`}>P {meal.protein}g · C {meal.carbs}g · F {meal.fat}g</span>
          </div>
        )}
      </div>
      <button onClick={() => onDelete(meal.id)} className="opacity-0 group-hover:opacity-100 w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all shrink-0">
        <Trash2 size={15} />
      </button>
    </div>
  );
}

export default function MealLogs({ dark }) {
  const { addMealLog, userData } = useUser();
  const fileRef = useRef();
  const videoRef = useRef();
  const canvasRef = useRef();
  const recognitionRef = useRef(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraStream, setCameraStream] = useState(null);

  const planTier = userData?.plan_tier || 'free';
  const dailyScanLimit = planTier === 'premium' ? 20 : planTier === 'pro' ? 10 : 3;

  // Session-only scan count
  const [scansUsed, setScansUsed] = useState(0);
  const scansLeft = Math.max(0, dailyScanLimit - scansUsed);
  const limitReached = scansLeft <= 0;


  const [photo, setPhoto] = useState(null);
  const [mealName, setMealName] = useState('');
  const [mealType, setMealType] = useState('');
  const [mealLocation, setMealLocation] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [analysisState, setAnalysisState] = useState('idle');
  const [analysisResult, setAnalysisResult] = useState(null);

  const [todaysMeals, setTodaysMeals] = useState(() => {
    try {
      const all = JSON.parse(localStorage.getItem('nutriai_meal_logs') || '[]');
      const today = new Date().toDateString();
      return all.filter(m => new Date(m.time).toDateString() === today);
    } catch { return []; }
  });

  const saveToStorage = (meals) => {
    try {
      const all = JSON.parse(localStorage.getItem('nutriai_meal_logs') || '[]');
      const today = new Date().toDateString();
      const others = all.filter(m => new Date(m.time).toDateString() !== today);
      localStorage.setItem('nutriai_meal_logs', JSON.stringify([...others, ...meals]));
    } catch { /* empty */ }
  };

  const openCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      setCameraStream(stream);
      setCameraOpen(true);
    } catch {
      alert('Camera access denied or not available.');
    }
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL('image/jpeg');
    cameraStream.getTracks().forEach(t => t.stop());
    setCameraStream(null);
    setCameraOpen(false);
    setPhoto(dataUrl);
    setAnalysisState('idle');
    setAnalysisResult(null);
  };

  const closeCamera = () => {
    if (cameraStream) cameraStream.getTracks().forEach(t => t.stop());
    setCameraStream(null);
    setCameraOpen(false);
  };

  // Attach stream to video element when camera opens
  useEffect(() => {
    if (cameraOpen && videoRef.current && cameraStream) {
      videoRef.current.srcObject = cameraStream;
    }
  }, [cameraOpen, cameraStream]);

  const processFile = (file) => {
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onloadend = () => { setPhoto(reader.result); setAnalysisState('idle'); setAnalysisResult(null); };
    reader.readAsDataURL(file);
  };

  const startVoice = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { alert('Voice not supported'); return; }
    if (recognitionRef.current) { recognitionRef.current.abort(); recognitionRef.current = null; }
    if (isListening) { setIsListening(false); return; }
    const r = new SR(); r.lang = 'en-IN'; r.interimResults = false;
    recognitionRef.current = r;
    r.onstart = () => { setIsListening(true); setMealName(''); };
    r.onend = () => { setIsListening(false); recognitionRef.current = null; };
    r.onresult = (e) => setMealName(e.results[0][0].transcript);
    r.onerror = () => { setIsListening(false); recognitionRef.current = null; };
    r.start();
  };

  const handleAnalyze = async () => {
    if (!photo || limitReached) return;
    setAnalysisState('analyzing');

    try {
      const rawToken = localStorage.getItem('access_token');
      const token = rawToken ? rawToken.replace(/['"]+/g, '') : "";

      // Convert base64/dataURL to a Blob
      const responseBlob = await fetch(photo);
      const blob = await responseBlob.blob();

      const formData = new FormData();
      formData.append('image', blob, 'meal.jpg');

      const apiResponse = await axios.post(`${baseURL}/api/meal-logs/analyze/`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        }
      });

      const data = apiResponse.data;

      // Map backend response to frontend expected structure
      const result = {
        name: data.detected_items || 'Unknown Food',
        calories: data.calories || 0,
        protein: data.protein_gm || 0,
        fat: data.fat_gm || 0,
        carbs: data.carbs_gm || 0,
        junkScore: data.junk_score || 0
      };

      setScansUsed(s => s + 1);
      setAnalysisResult(result);
      setAnalysisState('done');
    } catch (error) {
      console.error("Error analyzing meal:", error);
      alert("Failed to analyze image. Please check your connection or backend server.");
      setAnalysisState('idle');
    }
  };

  const handleSaveMeal = () => {
    const newMeal = {
      id: Date.now().toString(),
      photo,
      name: mealName.trim() || analysisResult?.name || 'Unnamed Meal',
      type: mealType || 'Snack',
      location: mealLocation,
      time: new Date().toISOString(),
      calories: analysisResult?.calories,
      protein: analysisResult?.protein,
      fat: analysisResult?.fat,
      carbs: analysisResult?.carbs,
      junkScore: analysisResult?.junkScore,
    };
    const updated = [newMeal, ...todaysMeals];
    setTodaysMeals(updated);
    saveToStorage(updated);
    addMealLog(newMeal);

    // Persist to Django backend database
    const rawToken = localStorage.getItem('access_token');
    const token = rawToken ? rawToken.replace(/['\"]+/g, '') : "";
    if (token) {
      const postBody = {
        meal_type: newMeal.type,
        meal_location: newMeal.location || "",
        detected_items: (newMeal.name || 'Unnamed Meal').substring(0, 95),
        calories: newMeal.calories || 0,
        protein_gm: newMeal.protein || 0,
        carbs_gm: newMeal.carbs || 0,
        fat_gm: newMeal.fat || 0,
        junk_score: newMeal.junkScore || 0,
        meal_photo_url: ""
      };

      axios.post(`${baseURL}/api/meal-logs/`, postBody, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      .then(res => {
        console.log("Meal log successfully persisted in Django DB:", res.data);
      })
      .catch(err => {
        console.warn("Failed to persist meal log in Django DB:", err.response?.data || err.message);
      });
    }

    setPhoto(null); setMealName(''); setMealType(''); setMealLocation('');
    setAnalysisState('idle'); setAnalysisResult(null);
  };

  const handleDelete = (id) => {
    const mealToDelete = todaysMeals.find(m => m.id === id);
    const backendId = mealToDelete?.backend_id || mealToDelete?.meal_id || (typeof id === 'string' && id.includes('-') ? id : null);

    if (backendId) {
      const rawToken = localStorage.getItem('access_token');
      const token = rawToken ? rawToken.replace(/['"]+/g, '') : "";
      if (token) {
        axios.delete(`${baseURL}/api/meal-logs/${backendId}/`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }).catch(err => console.warn('Could not delete from backend:', err));
      }
    }
    const u = todaysMeals.filter(m => m.id !== id);
    setTodaysMeals(u);
    saveToStorage(u);
  };

  return (
    <div className="w-full px-6 md:px-12 py-10">
      <div className="max-w-2xl mx-auto space-y-10">

        {/* ── Native Camera Modal ── */}
        {cameraOpen && (
          <div className="fixed inset-0 z-[100] bg-black flex flex-col">
            {/* Back button at top-left */}
            <div className="absolute top-6 left-6 z-10">
              <button
                onClick={closeCamera}
                className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm text-white flex items-center justify-center hover:bg-white/30 transition-all">
                <ChevronLeft size={24} />
              </button>
            </div>
            <video ref={videoRef} autoPlay playsInline className="w-full object-cover" style={{ flex: 1, maxHeight: 'calc(100dvh - 160px)' }} />
            <canvas ref={canvasRef} className="hidden" />
            <div className="flex items-center justify-center pb-8 pt-6 bg-black" style={{ paddingBottom: 'max(2rem, env(safe-area-inset-bottom, 2rem))' }}>
              <button
                onClick={capturePhoto}
                className="w-20 h-20 rounded-full bg-white border-[5px] border-[#14B8A6] flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-[#14B8A6]/40">
                <Camera size={30} className="text-[#14B8A6]" />
              </button>
            </div>
          </div>
        )}

        {/* ── Hero Section ── */}
        <div className="flex items-end justify-between">
          <div>
            <h1 className={`text-[36px] font-extrabold tracking-tight leading-none ${dark ? 'text-white' : 'text-slate-900'}`}>
              Today's Meal Logs
            </h1>
            <p className={`text-[16px] mt-2 font-medium ${dark ? 'text-slate-400' : 'text-slate-500'}`}>
              {todaysMeals.length === 0
                ? 'No meals logged yet — snap your first meal!'
                : `${todaysMeals.length} meal${todaysMeals.length > 1 ? 's' : ''} logged today`}
            </p>
          </div>
          <div className={`flex items-center gap-2.5 px-5 py-3 rounded-2xl border text-[15px] font-bold shrink-0 ${limitReached
              ? 'border-red-200 bg-red-50 text-red-600 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400'
              : scansLeft <= 2
                ? 'border-amber-200 bg-amber-50 text-amber-600 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-400'
                : `border-slate-200 dark:border-slate-700 ${dark ? 'bg-slate-800 text-slate-300' : 'bg-white text-slate-600'}`
            }`}>
            <ScanLine size={17} />
            <span>{limitReached ? 'Limit reached' : `${scansLeft}/${dailyScanLimit} scans remaining today`}</span>

          </div>
        </div>

        {/* ── Image Preview + Food Name (appears above buttons after upload) ── */}
        {photo && (
          <div className="space-y-0">
            <div className="relative rounded-3xl overflow-hidden shadow-xl">
              <img src={photo} alt="Meal" className="w-full max-h-80 object-cover" />
              {analysisState !== 'analyzing' && (
                <button
                  onClick={() => { setPhoto(null); setAnalysisState('idle'); setAnalysisResult(null); }}
                  className="absolute top-4 right-4 w-10 h-10 rounded-xl bg-black/50 backdrop-blur-sm text-white flex items-center justify-center hover:bg-black/70 transition-colors">
                  <X size={18} strokeWidth={2.5} />
                </button>
              )}
              {analysisState === 'analyzing' && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center gap-5">
                  <div className="relative w-40 h-40 flex items-center justify-center">
                    <div className="absolute inset-0 border-2 border-[#14B8A6]/40 rounded-2xl" />
                    <div className="absolute top-0 left-0 right-0 h-0.5 bg-[#14B8A6] rounded-full" style={{ animation: 'scanY 1.5s ease-in-out infinite' }} />
                    <ScanLine size={40} className="text-[#14B8A6]" />
                  </div>
                  <p className="text-white font-bold text-[17px]">Analyzing your meal...</p>
                  <p className="text-white/50 text-[13px]">Nia is identifying nutrients</p>
                  <style>{`@keyframes scanY{0%,100%{top:0;opacity:1}50%{top:calc(100% - 2px);opacity:.6}}`}</style>
                </div>
              )}
            </div>
            {/* Food name shown as big text below photo after analysis */}
            {analysisState === 'done' && analysisResult && (
              <div className="pt-5" style={{ animation: 'fadeUp .35s ease both' }}>
                <p className={`text-[28px] font-extrabold tracking-tight leading-tight ${dark ? 'text-white' : 'text-slate-900'}`}>
                  {analysisResult.name}
                </p>
                <p className={`text-[15px] font-medium mt-1 ${dark ? 'text-slate-400' : 'text-slate-500'}`}>Detected food item</p>
              </div>
            )}
          </div>
        )}

        {/* ── Camera + Upload Buttons ── */}
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={openCamera}
            className={`flex items-center justify-center gap-3 h-16 rounded-2xl border-2 text-[15px] font-bold transition-all hover:-translate-y-0.5 active:translate-y-0 ${dark
                ? 'border-slate-700 bg-slate-800 text-slate-200 hover:border-[#14B8A6] hover:text-[#14B8A6]'
                : 'border-slate-200 bg-white text-slate-700 hover:border-[#14B8A6] hover:text-[#14B8A6] shadow-sm'
              }`}>
            <Camera size={20} />
            Open Camera
          </button>
          <button
            onClick={() => fileRef.current.click()}
            className="flex items-center justify-center gap-3 h-16 rounded-2xl border-2 border-[#14B8A6] bg-[#14B8A6] text-white text-[15px] font-bold transition-all hover:bg-[#0D9488] hover:border-[#0D9488] hover:-translate-y-0.5 active:translate-y-0 shadow-lg shadow-[#14B8A6]/25">
            <Upload size={20} />
            Upload File
          </button>
        </div>

        {/* ── Meal Name + Voice ── */}
        <div className={`flex items-center gap-3 h-16 px-5 rounded-2xl border-2 transition-all ${dark ? 'bg-slate-800/50 border-slate-700 focus-within:border-[#14B8A6]' : 'bg-white border-slate-200 focus-within:border-[#14B8A6] focus-within:shadow-md'
          }`}>
          <Utensils size={18} className="text-[#14B8A6] shrink-0" />
          <input
            type="text" value={mealName} onChange={e => setMealName(e.target.value)}
            placeholder="Meal name (type or use voice)"
            className={`flex-1 bg-transparent text-[16px] font-medium outline-none ${dark ? 'text-slate-100 placeholder-slate-500' : 'text-slate-900 placeholder-slate-400'}`} />
          {isListening && <span className="text-[14px] font-semibold text-red-500 animate-pulse shrink-0">Listening...</span>}
          <button onClick={startVoice}
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all shrink-0 ${isListening ? 'bg-red-500 text-white animate-pulse'
                : dark ? 'bg-slate-700 text-slate-300 hover:bg-[#14B8A6]/20 hover:text-[#14B8A6]'
                  : 'bg-slate-100 text-slate-500 hover:bg-[#14B8A6]/10 hover:text-[#14B8A6]'
              }`}>
            {isListening ? <MicOff size={16} /> : <Mic size={16} />}
          </button>
        </div>

        {/* ── Meal Type + Location ── */}
        <div className="flex gap-4">
          <MiniSelect value={mealType} onChange={setMealType} options={MEAL_TYPES} placeholder="Meal Type" icon={Utensils} />
          <MiniSelect value={mealLocation} onChange={setMealLocation} options={MEAL_LOCATIONS} placeholder="Meal Location" icon={MapPin} />
        </div>

        {/* ── Analyze + Results (below dropdowns) ── */}
        {photo && analysisState === 'idle' && (
          <button onClick={handleAnalyze} disabled={limitReached}
            className={`w-full h-16 rounded-2xl text-[17px] font-black flex items-center justify-center gap-3 transition-all ${limitReached
                ? 'bg-slate-200 dark:bg-slate-700 text-slate-400 cursor-not-allowed'
                : 'bg-[#14B8A6] text-white shadow-xl shadow-[#14B8A6]/25 hover:bg-[#0D9488] hover:-translate-y-0.5 active:translate-y-0'
              }`}>
            <ScanLine size={22} />{limitReached ? 'Daily limit reached' : 'Analyze with Nia'}
          </button>
        )}

        {photo && analysisState === 'done' && analysisResult && (
          <div className="space-y-5" style={{ animation: 'fadeUp .4s ease both' }}>
            <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}`}</style>
            <div className="flex gap-3">
              <NutriBadge icon={Flame} label="Calories" value={analysisResult.calories} color="text-orange-500" dark={dark} />
              <NutriBadge icon={Beef} label="Protein" value={`${analysisResult.protein}g`} color="text-blue-500" dark={dark} />
              <NutriBadge icon={Zap} label="Carbs" value={`${analysisResult.carbs}g`} color="text-amber-500" dark={dark} />
              <NutriBadge icon={Droplets} label="Fat" value={`${analysisResult.fat}g`} color="text-purple-500" dark={dark} />
            </div>
            <JunkMeter score={analysisResult.junkScore} dark={dark} />
            <button onClick={handleSaveMeal}
              className="w-full h-16 rounded-2xl bg-[#14B8A6] text-white text-[17px] font-black shadow-xl shadow-[#14B8A6]/25 hover:bg-[#0D9488] hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-3">
              <Plus size={22} strokeWidth={3} /> Save Meal
            </button>
          </div>
        )}

        <input ref={fileRef} type="file" accept="image/*" hidden onChange={e => processFile(e.target.files[0])} />

        {/* ── Today's Meals List ── */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2.5">
              <Clock size={18} className="text-[#14B8A6]" />
              <span className={`text-[18px] font-extrabold ${dark ? 'text-white' : 'text-slate-900'}`}>Logged Meals</span>
            </div>
            <span className={`text-[13px] font-bold px-3.5 py-1.5 rounded-full ${dark ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-500'}`}>
              {todaysMeals.length} {todaysMeals.length === 1 ? 'meal' : 'meals'}
            </span>
          </div>
          {todaysMeals.length === 0 ? (
            <div className="flex flex-col items-center py-16 gap-4">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${dark ? 'bg-slate-800' : 'bg-slate-100'}`}>
                <Utensils size={26} className="text-slate-400" />
              </div>
              <p className={`text-[15px] font-semibold ${dark ? 'text-slate-500' : 'text-slate-400'}`}>No meals logged today</p>
            </div>
          ) : (
            <div className={`divide-y ${dark ? 'divide-slate-800' : 'divide-slate-100'}`}>
              {todaysMeals.map(m => <MealRow key={m.id} meal={m} onDelete={handleDelete} dark={dark} />)}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
