import { useState, useEffect } from 'react';
import axios from 'axios';
import { BarChart, Bar, AreaChart, Area, Line,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, ReferenceLine, CartesianGrid
} from 'recharts';
import { 
  Flame, Target, TrendingUp, TrendingDown, Droplets, Download, Loader2, CheckCircle2
} from 'lucide-react';
import { useUser } from '../context/UserContext';

const baseURL = import.meta.env.VITE_BACKEND_URL;

/* ── PREMIUM PROFESSIONAL COLOR PALETTE ── */
const COLORS = {
  primary: '#14B8A6',
  teal: '#14B8A6',
  coral: '#F87171',
  mint: '#4ADE80',
  amber: '#FBBF24',
  danger: '#F87171',
  success: '#4ADE80',
  warning: '#FBBF24',
  accent: '#22D3EE',
  bgTeal: '#F0F9F6',
  bgRed: '#FEF2F2',
  bgGreen: '#F0FDF4',
  bgAmber: '#FFFBEB',
  bgCoral: '#FEF2F2',
  bgMint: '#F0FDF4',
  textPrimary: '#0F172A',
  textSecondary: '#475569',
  textMuted: '#94A3B8',
  border: '#E2E8F0',
  grid: '#F1F5F9'
};

/* ── MOCK DATA ── */
const DASHBOARD_DATA = {
  headerLabel: "Last 7 Days",
  streakSub: "7-day consistency strong",
  streak: 0,
  calGoal: 1920,
  calTrend: [ 
    { name: 'Mon', val: 1800 }, { name: 'Tue', val: 1750 }, { name: 'Wed', val: 1900 }, 
    { name: 'Thu', val: 1650 }, { name: 'Fri', val: 2100 }, { name: 'Sat', val: 2200 }, { name: 'Sun', val: 1780 } 
  ],
  junkScore: [ 
    { name: 'Mon', score: 8.5 }, { name: 'Tue', score: 9 }, { name: 'Wed', score: 7.5 }, 
    { name: 'Thu', score: 8 }, { name: 'Fri', score: 6.5 }, { name: 'Sat', score: 5 }, { name: 'Sun', score: 8 } 
  ],
  goalPrediction: [
    { name: 'Day 1', actual: 80.5 }, { name: 'Day 2', actual: 80.2 }, { name: 'Day 3', actual: 79.9 },
    { name: 'Day 4', actual: 80.0 }, { name: 'Day 5', actual: 79.6 }, { name: 'Day 6', actual: 79.4 },
    { name: 'Day 7', actual: 79.1, predicted: 79.1 }, 
    { name: '+7d', predicted: 78.4 }, { name: '+14d', predicted: 77.8 }, { name: 'Goal', predicted: 75.0 },
  ]
};

/* ── PREMIUM FROSTED GLASS TOOLTIP ── */
const CustomTooltip = ({ active, payload, label,  }) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    
    // Goal Prediction Tooltip
    if (data.dataKey === 'actual' || data.dataKey === 'predicted') {
       return (
         <div className={`bg-white/85 dark:bg-slate-800/85 backdrop-blur-xl border border-white/60 dark:border-slate-700/60 px-4 py-3 rounded-[16px] shadow-[0_8px_30px_rgba(0,0,0,0.06)]`}>
           <p className="text-[#94A3B8] dark:text-slate-400 font-semibold text-[11px] uppercase tracking-wider mb-1">{label}</p>
           <div className="text-[#0F172A] dark:text-white font-extrabold text-[15px] tracking-tight">{data.value} kg</div>
         </div>
       );
    }
    
    // Standard Trends Tooltip
    const isScore = data.name === 'score';
    let dotColor = COLORS.teal; 
    if (isScore) {
      dotColor = data.value >= 70 ? COLORS.coral : data.value >= 40 ? COLORS.amber : COLORS.mint;
    } else if (data.dataKey === 'val' && data.payload.val > 1920) {
      dotColor = COLORS.coral;
    }

    return (
      <div className={`bg-white/85 dark:bg-slate-800/85 backdrop-blur-xl border border-white/60 dark:border-slate-700/60 p-4 rounded-[16px] shadow-[0_8px_30px_rgba(0,0,0,0.06)] relative overflow-hidden min-w-[140px]`}>
        <div className="absolute top-0 left-0 w-1 h-full" style={{ backgroundColor: dotColor }}></div>
        <p className="text-[#94A3B8] dark:text-slate-400 font-semibold text-[11px] uppercase tracking-wider mb-2">{label}</p>
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: dotColor }}></div>
          <span className="text-[#0F172A] dark:text-white font-extrabold text-[16px] tracking-tight">
            {isScore ? `${data.value} / 100` : `${data.value} kcal`}
          </span>
        </div>
      </div>
    );
  }
  return null;
};

/* ── CUSTOM DOT FOR GOAL PREDICTION ── */
const renderCustomDot = (props) => {
  const { cx, cy, payload } = props;
  if (payload.name === 'Day 7') {
    return <circle cx={cx} cy={cy} r={4.5} fill={COLORS.teal} stroke="none" />;
  }
  if (payload.name === 'Goal') {
    return (
      <g>
        <circle cx={cx} cy={cy} r={12} fill={COLORS.teal} fillOpacity={0.15} className="animate-pulse" />
        <circle cx={cx} cy={cy} r={5} fill={COLORS.teal} stroke="#fff" strokeWidth={2.5} />
      </g>
    );
  }
  return null;
};

const generateGoalPredictionData = (currentWeight, targetWeight, goalType) => {
  const cw = parseFloat(currentWeight) || 75;
  const tw = parseFloat(targetWeight) || cw;
  
  let direction = 'maintain';
  if (cw > tw) direction = 'loss';
  if (cw < tw) direction = 'gain';
  
  const dailyDiff = direction === 'loss' ? -0.2 : direction === 'gain' ? 0.15 : 0;
  
  const gp = [];
  for (let i = 1; i <= 6; i++) {
    const diff = (7 - i) * dailyDiff;
    gp.push({
      name: `Day ${i}`,
      actual: parseFloat((cw - diff).toFixed(1))
    });
  }
  
  gp.push({
    name: 'Day 7',
    actual: cw,
    predicted: cw
  });
  
  gp.push({
    name: '+7d',
    predicted: parseFloat((cw + dailyDiff * 7).toFixed(1))
  });
  
  gp.push({
    name: '+14d',
    predicted: parseFloat((cw + dailyDiff * 14).toFixed(1))
  });
  
  gp.push({
    name: 'Goal',
    predicted: tw
  });
  
  return gp;
};

const AnalyticsDashboard = ({ dark, onOpenReport, profileComplete }) => {
  const [reportState, setReportState] = useState('idle');

  const handleReport = () => {
    if (reportState !== 'idle') return;
    setReportState('loading');
    setTimeout(() => {
      setReportState('done');
      if (onOpenReport) onOpenReport();
      setTimeout(() => setReportState('idle'), 2500);
    }, 1500);
  };
  const { userMetrics, dailyLogs, updateWaterIntake, setDailyLogs } = useUser();
  const [dashboardData, setDashboardData] = useState(DASHBOARD_DATA);

  useEffect(() => {
    const rawToken = localStorage.getItem('access_token');
    const token = rawToken ? rawToken.replace(/['\"]+/g, '') : "";
    if (!token) return;

    axios.get(`${baseURL}/api/dashboard/`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    .then(res => {
      setDashboardData(prev => ({
        ...prev,
        calTrend: res.data.cal_trend && res.data.cal_trend.length ? res.data.cal_trend : prev.calTrend,
        junkScore: res.data.junk_trend && res.data.junk_trend.length ? res.data.junk_trend : prev.junkScore,
        streak: res.data.streak ?? 0,
      }));

      // Hydrate today's tracking data from real backend database
      if (res.data.today) {
        setDailyLogs(prev => ({
          ...prev,
          daily_calories_consumed: res.data.today.calories || 0,
          daily_protein: res.data.today.protein || 0,
          daily_carbs: res.data.today.carbs || 0,
          daily_fat: res.data.today.fat || 0,
          junk_score: res.data.today.junk_score || 0,
          junk_count: res.data.today.junk_count || 0,
          current_water: res.data.today.water || 0,
        }));
      }
    })
    .catch(err => {
      console.warn('Could not fetch weekly dashboard trends:', err.message);
    });
  }, []);

  const water = dailyLogs?.current_water || 0;
  const waterGoal = userMetrics?.water_goal || 3.0;
  const addWater = updateWaterIntake;

  const calGoal = userMetrics?.daily_calorie_goal || 1920;
  const currentWeight = userMetrics?.current_weight || 75;
  const targetWeight = userMetrics?.target_weight || 70;
  const goalType = userMetrics?.goal_type || 'loss';

  const goalPrediction = generateGoalPredictionData(currentWeight, targetWeight, goalType);
  const data = { ...dashboardData, calGoal, goalPrediction };

  let direction = 'maintain';
  if (currentWeight > targetWeight) direction = 'loss';
  if (currentWeight < targetWeight) direction = 'gain';
  
  let timeEstimate = "Goal Reached!";
  let predictionMessage = "You have successfully reached your target weight. Keep up the great work maintaining it!";
  
  if (direction === 'loss') {
    const weeks = Math.max(1, Math.round((currentWeight - targetWeight) / 0.5));
    timeEstimate = `${weeks - 1 > 0 ? `${weeks - 1}–` : ''}${weeks + 1} weeks`;
    predictionMessage = "You're on a steady fat-loss path. Maintain your current intake to reach your goal consistently.";
  } else if (direction === 'gain') {
    const weeks = Math.max(1, Math.round((targetWeight - currentWeight) / 0.35));
    timeEstimate = `${weeks - 1 > 0 ? `${weeks - 1}–` : ''}${weeks + 1} weeks`;
    predictionMessage = "You're on a steady muscle-gain path. Maintain your current caloric surplus to reach your goal consistently.";
  }

  // Calculate averages based only on the days that actually have logged calories
  const activeDays = data.calTrend.filter(item => item.val > 0).length;

  const displayCal = activeDays > 0
    ? Math.round(data.calTrend.reduce((a, b) => a + b.val, 0) / activeDays)
    : 0;

  const avgJunk = activeDays > 0
    ? (data.junkScore.reduce((a, b) => a + b.score, 0) / activeDays).toFixed(1)
    : "0.0";

  // Live today stats from meal logs
  const todayCal = dailyLogs?.daily_calories_consumed || 0;
  const todayProtein = dailyLogs?.daily_protein || 0;
  const todayCarbs = dailyLogs?.daily_carbs || 0;
  const todayFat = dailyLogs?.daily_fat || 0;
  const todayJunk = (dailyLogs?.junk_count > 0) ? (dailyLogs?.junk_score || 0) : 0;
  const junkColor = todayJunk >= 75 ? COLORS.danger : todayJunk >= 50 ? COLORS.warning : COLORS.success;
  const junkLabel = todayJunk === 0 ? 'No meals yet' : todayJunk >= 75 ? 'High Junk Intake' : todayJunk >= 50 ? 'Moderate Control' : 'Excellent Control';
  const junkMessage = todayJunk === 0 ? 'Log your first meal to see your junk score.' : todayJunk >= 75 ? 'Your cravings were high today. Try focusing on whole foods for your next meal.' : 'Great job keeping junk food low today!';

  return (
    <div className="w-full relative px-6 md:px-10 py-8">
      <svg width="0" height="0" className="absolute">
        <defs>
          <linearGradient id="areaPrediction" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={COLORS.primary} stopOpacity={0.18}/>
            <stop offset="100%" stopColor={COLORS.primary} stopOpacity={0}/>
          </linearGradient>
          <linearGradient id="barGood" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#14B8A6"/>
            <stop offset="100%" stopColor="#0F766E"/>
          </linearGradient>
          <linearGradient id="barOver" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#F87171"/>
            <stop offset="100%" stopColor="#EF4444"/>
          </linearGradient>
          <linearGradient id="barExcellent" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#4ADE80"/>
            <stop offset="100%" stopColor="#22C55E"/>
          </linearGradient>
          <linearGradient id="barWarning" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FBBF24"/>
            <stop offset="100%" stopColor="#F59E0B"/>
          </linearGradient>
          <filter id="glowPredict" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="4" stdDeviation="8" floodColor={COLORS.primary} floodOpacity="0.2"/>
          </filter>
        </defs>
      </svg>

      <div className="max-w-[1280px] mx-auto">

        {/* ── 1. "TODAY" HERO SECTION (STATIC) ── */}
        <div className="flex items-end justify-between mb-6">
          <div className="flex items-center gap-4">
            <h1 className="text-[36px] font-extrabold tracking-[-0.02em] text-[#0F172A] dark:text-white leading-tight">Today</h1>
            <div className="text-[15px] font-bold text-[#475569] dark:text-slate-400 bg-[#E2E8F0]/50 dark:bg-slate-800 px-4 py-1.5 rounded-full mt-1">
              Tuesday, 5 May 2026
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-16">
          {/* Calorie Ring Card */}
          <div className="bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-800 rounded-[24px] p-8 shadow-[0_4px_20px_rgba(0,0,0,0.02)] flex flex-col items-center transition-colors">
            <div className="relative flex items-center justify-center w-[220px] h-[220px] mb-8">
              <svg height="220" width="220" className="rotate-[-90deg]">
                <circle stroke={dark ? "#1E293B" : "#F1F5F9"} fill="transparent" strokeWidth="18" r="91" cx="110" cy="110" />
                <circle 
                  stroke={COLORS.teal} fill="transparent" strokeWidth="18" strokeLinecap="round" 
                  strokeDasharray="571" strokeDashoffset={571 - Math.min(todayCal / data.calGoal, 1) * 571}
                  r="91" cx="110" cy="110" className="transition-all duration-1500 ease-out" 
                />
              </svg>
              <div className="absolute flex flex-col items-center justify-center text-center">
                <div className="text-[32px] font-extrabold text-[#0F172A] dark:text-white tracking-[-0.02em] leading-none mb-1">{todayCal.toLocaleString()}</div>
                <div className="text-[14px] font-bold text-[#94A3B8] dark:text-slate-400 uppercase tracking-wider">/ {data.calGoal} kcal</div>
              </div>
            </div>
            
            <div className="w-full flex flex-col gap-4">
              {[ 
                { label: 'Protein', val: todayProtein, max: 140, color: '#3182CE' }, 
                { label: 'Carbs', val: todayCarbs, max: 200, color: COLORS.amber }, 
                { label: 'Fat', val: todayFat, max: 65, color: '#805AD5' } 
              ].map(m => (
                <div key={m.label} className="w-full">
                  <div className="flex justify-between text-[13px] font-bold mb-2">
                    <span className="text-[#475569] dark:text-slate-400 uppercase tracking-wide">{m.label}</span>
                    <span className="text-[#0F172A] dark:text-white">{m.val}g <span className="text-[#94A3B8] dark:text-slate-500">/ {m.max}g</span></span>
                  </div>
                  <div className="h-2.5 bg-[#F1F5F9] dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${(m.val/m.max)*100}%`, backgroundColor: m.color }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Water Intake Card */}
          <div className="bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-800 rounded-[24px] p-8 shadow-[0_4px_20px_rgba(0,0,0,0.02)] flex flex-col transition-colors">
            <div className="flex items-center gap-2 mb-6">
              <Droplets className="text-[#3182CE]" size={24} strokeWidth={2.5} />
              <h3 className="text-[15px] font-bold text-[#475569] dark:text-slate-400 uppercase tracking-wide">Water Intake</h3>
            </div>
            <div className="flex items-end gap-2.5 mb-5 mt-2">
              <span className="text-[56px] font-extrabold text-[#0F172A] dark:text-white leading-none tracking-[-0.03em]">{water.toFixed(2)}</span>
              <span className="text-[20px] font-bold text-[#94A3B8] dark:text-slate-500 mb-1.5">/ {waterGoal.toFixed(1)} L</span>
            </div>
            <div className="h-5 bg-[#F1F5F9] dark:bg-slate-800 rounded-full overflow-hidden mb-8 shadow-inner">
              <div className="h-full rounded-full transition-all duration-500" style={{ width: `${(water / waterGoal) * 100}%`, background: 'linear-gradient(90deg, #63B3ED 0%, #3182CE 100%)' }} />
            </div>
            <div className="mt-auto grid grid-cols-3 gap-3">
              <button onClick={() => addWater(0.25)} className="h-12 rounded-[14px] bg-[#EBF8FF] dark:bg-slate-800/50 text-[#3182CE] dark:text-blue-400 font-bold text-[14px] hover:bg-[#BEE3F8] dark:hover:bg-slate-800 transition-colors shadow-sm">+0.25 L</button>
              <button onClick={() => addWater(0.50)} className="h-12 rounded-[14px] bg-[#EBF8FF] dark:bg-slate-800/50 text-[#3182CE] dark:text-blue-400 font-bold text-[14px] hover:bg-[#BEE3F8] dark:hover:bg-slate-800 transition-colors shadow-sm">+0.50 L</button>
              <button onClick={() => addWater(1.0)} className="h-12 rounded-[14px] bg-[#EBF8FF] dark:bg-slate-800/50 text-[#3182CE] dark:text-blue-400 font-bold text-[14px] hover:bg-[#BEE3F8] dark:hover:bg-slate-800 transition-colors shadow-sm">+1.0 L</button>
            </div>
          </div>

          {/* Junk Score Card */}
          <div className="bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-800 rounded-[24px] p-8 shadow-[0_4px_20px_rgba(0,0,0,0.02)] flex flex-col items-center transition-colors">
            <div className="flex items-center justify-center gap-2 mb-4 w-full">
              <Target color={junkColor} size={24} strokeWidth={2.5} />
              <h3 className="text-[15px] font-bold text-[#475569] dark:text-slate-400 uppercase tracking-wide">Today's Junk Score</h3>
            </div>
            <div className="relative flex items-center justify-center w-[180px] h-[180px] mb-6 mt-2">
              <svg height="180" width="180" className="rotate-[-90deg]">
                <circle stroke={dark ? "#1E293B" : "#F1F5F9"} fill="transparent" strokeWidth="16" r="74" cx="90" cy="90" />
                <circle 
                  stroke={junkColor} fill="transparent" strokeWidth="16" strokeLinecap="round" 
                  strokeDasharray="465" strokeDashoffset={465 - (todayJunk / 100) * 465}
                  r="74" cx="90" cy="90" className="transition-all duration-1500 ease-out" 
                />
              </svg>
              <div className="absolute flex flex-col items-center justify-center text-center">
                <div className="text-[42px] font-extrabold tracking-tight leading-none mb-1" style={{ color: junkColor }}>{todayJunk || '—'}</div>
                <div className="text-[13px] font-bold text-[#94A3B8] uppercase tracking-wider">/ 100</div>
              </div>
            </div>
            <div className="mt-auto flex flex-col items-center text-center">
              <div className="text-[16px] font-bold mb-2 px-4 py-1.5 rounded-[12px]" style={{ backgroundColor: `${junkColor}15`, color: junkColor }}>
                {junkLabel}
              </div>
              <p className="text-[14px] font-semibold text-[#475569] dark:text-slate-400 leading-relaxed px-2">{junkMessage}</p>
            </div>
          </div>
        </div>

        {/* ── 2. PROGRESS & TRENDS (STATIC 2x2 GRID) ── */}
        
        <div className="flex flex-col items-start gap-1 mb-8">
          <h2 className="text-[26px] font-extrabold text-[#0F172A] dark:text-white tracking-[-0.02em]">Progress & Trends</h2>
          <div className="text-[14px] font-bold text-[#64748B] dark:text-slate-500 uppercase tracking-wider">Weekly Overview</div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-16">
          
          {/* Trend 1: Consistency Streak */}
          <div className="bg-gradient-to-br from-white to-[#FAFBFC] dark:from-slate-900 dark:to-slate-800 border border-[#E2E8F0] dark:border-slate-800 rounded-[24px] p-8 flex flex-col items-center justify-center text-center shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:-translate-y-1 hover:shadow-[0_10px_35px_-10px_rgba(0,0,0,0.07)] transition-all duration-400 relative overflow-hidden">
            <div className="absolute -right-8 -top-8 opacity-[0.03] dark:opacity-10 pointer-events-none"><Flame size={200} /></div>
            <div className="w-20 h-20 rounded-[24px] bg-[#FFF5F5] dark:bg-red-900/20 border border-[#FED7D7] dark:border-red-900/50 flex items-center justify-center mb-6 shadow-sm">
              <Flame size={40} color={COLORS.coral} className="drop-shadow-sm" strokeWidth={2.5} />
            </div>
            <div className="text-[72px] font-extrabold text-[#0F172A] dark:text-white leading-none tracking-[-0.04em] mb-2">{data.streak ?? 0}</div>
            <div className="text-[18px] font-bold text-[#0F172A] dark:text-slate-300 uppercase tracking-[0.1em] mb-3">Day Streak</div>
            <div className="text-[15px] font-semibold text-[#475569] dark:text-slate-400 bg-white dark:bg-slate-800 px-4 py-1.5 rounded-full border border-[#E2E8F0] dark:border-slate-700 shadow-sm">{data.streakSub}</div>
          </div>

          {/* Trend 2: Goal Prediction Card */}
          <div className="bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-800 rounded-[24px] p-6 shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:-translate-y-1 hover:shadow-[0_10px_35px_-10px_rgba(0,0,0,0.07)] transition-all duration-400 flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-[18px] font-semibold text-[#0F172A] dark:text-white">Goal Prediction</h3>
              <div className="text-[12px] font-semibold text-[#475569] dark:text-slate-400 bg-[#F1F5F9] dark:bg-slate-800 px-3 py-1 rounded-full">Last 7 Days</div>
            </div>
            <div className="h-[220px] w-full mb-6">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.goalPrediction} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={dark ? "#1E293B" : "#F1F5F9"} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94A3B8', fontWeight: 500 }} tickMargin={12} />
                  <YAxis domain={['dataMin - 1', 'dataMax + 1']} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94A3B8' }} />
                  <Tooltip content={<CustomTooltip dark={dark} />} cursor={{ stroke: '#CBD5E1', strokeWidth: 1, strokeDasharray: '3 3' }} />
                  <Area 
                    type="monotone" dataKey="actual" stroke={COLORS.teal} strokeWidth={3} 
                    fillOpacity={1} fill="url(#areaPrediction)" 
                    activeDot={{ r: 6, fill: COLORS.teal, stroke: dark ? '#0F172A' : '#fff', strokeWidth: 2 }} 
                    style={{ filter: 'url(#glowPredict)' }}
                    animationDuration={1500} animationEasing="ease-out"
                  />
                  <Line 
                    type="monotone" dataKey="predicted" stroke={COLORS.teal} strokeWidth={3} strokeDasharray="6 6"
                    dot={renderCustomDot} activeDot={{ r: 6, fill: dark ? '#0F172A' : '#fff', stroke: COLORS.teal, strokeWidth: 2 }} 
                    animationDuration={1500} animationEasing="ease-out"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-start justify-between mt-auto pt-5 border-t border-[#E2E8F0] dark:border-slate-800">
              <div className="flex flex-col gap-1.5">
                <div className="text-[20px] font-semibold text-[#0F172A] dark:text-white tracking-tight">Estimated: {timeEstimate}</div>
                <div className="text-[13px] font-medium text-[#64748B] dark:text-slate-500">Based on your last 7 days trend</div>
              </div>
              <div className="max-w-[220px] text-[13px] text-[#475569] dark:text-slate-400 leading-relaxed">
                {predictionMessage}
              </div>
            </div>
          </div>

          {/* Trend 3: Calorie Trend */}
          <div className="bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-800 rounded-[24px] p-8 flex flex-col shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:-translate-y-1 hover:shadow-[0_10px_35px_-10px_rgba(0,0,0,0.07)] transition-all duration-400">
            <div className="flex justify-between items-end mb-6">
              <div>
                <h3 className="text-[14px] font-bold text-[#475569] dark:text-slate-400 uppercase tracking-[0.06em] mb-1">Calorie Trend</h3>
                <div className="text-[32px] font-extrabold text-[#0F172A] dark:text-white tracking-[-0.03em] leading-none">
                  <span className="text-[16px] font-bold text-[#94A3B8] mr-2">Avg:</span>
                  {displayCal} <span className="text-[16px] font-semibold text-[#94A3B8]">kcal</span>
                </div>
              </div>
              <div className="text-[13px] font-bold px-3 py-1.5 rounded-[10px]" style={{ backgroundColor: dark ? 'rgba(20, 184, 166, 0.1)' : COLORS.bgTeal, color: COLORS.teal }}>
                Goal: {data.calGoal}
              </div>
            </div>
            <div className="h-[220px] w-full mt-auto">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.calTrend} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={dark ? "#1E293B" : "#F1F5F9"} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 13, fill: '#94A3B8', fontWeight: 500 }} tickMargin={12} />
                  <Tooltip content={<CustomTooltip dark={dark} />} cursor={{ fill: dark ? '#1E293B' : '#F8FAFC' }} />
                  <ReferenceLine y={data.calGoal} stroke={COLORS.coral} strokeDasharray="4 4" opacity={0.4} strokeWidth={1} />
                  <Bar dataKey="val" radius={[8, 8, 8, 8]} animationDuration={1500}>
                    {data.calTrend.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={
                          entry.val > data.calGoal 
                            ? 'url(#barOver)' 
                            : entry.val < data.calGoal - 250 
                              ? 'url(#barExcellent)' 
                              : 'url(#barGood)'
                          } 
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Trend 4: Junk Score Trend (Histogram) */}
          <div className="bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-800 rounded-[24px] p-8 flex flex-col shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:-translate-y-1 hover:shadow-[0_10px_35px_-10px_rgba(0,0,0,0.07)] transition-all duration-400">
            <div className="flex justify-between items-end mb-6">
              <div>
                <h3 className="text-[14px] font-bold text-[#475569] dark:text-slate-400 uppercase tracking-[0.06em] mb-1">Junk Score Trend</h3>
                <div className="text-[32px] font-extrabold text-[#0F172A] dark:text-white tracking-[-0.03em] leading-none">
                  {avgJunk} <span className="text-[16px] font-semibold text-[#94A3B8]">/ 100</span>
                </div>
              </div>
              <div className={`p-2 rounded-[12px]`} style={{ backgroundColor: parseFloat(avgJunk) >= 75 ? (dark ? 'rgba(248, 113, 113, 0.1)' : COLORS.bgCoral) : parseFloat(avgJunk) >= 50 ? (dark ? 'rgba(251, 191, 36, 0.1)' : COLORS.bgAmber) : (dark ? 'rgba(74, 222, 128, 0.1)' : COLORS.bgMint), color: parseFloat(avgJunk) >= 75 ? COLORS.coral : parseFloat(avgJunk) >= 50 ? COLORS.amber : COLORS.mint }}>
                {parseFloat(avgJunk) >= 70 ? <TrendingUp size={24} strokeWidth={2.5} /> : <TrendingDown size={24} strokeWidth={2.5} />}
              </div>
            </div>
            <div className="h-[220px] w-full mt-auto">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.junkScore} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={dark ? "#1E293B" : "#F1F5F9"} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 13, fill: '#94A3B8', fontWeight: 500 }} tickMargin={12} />
                  <Tooltip content={<CustomTooltip dark={dark} />} cursor={{ fill: dark ? '#1E293B' : '#F8FAFC' }} />
                  <Bar dataKey="score" radius={[8, 8, 8, 8]} animationDuration={1500} animationEasing="ease-out" maxBarSize={32}>
                    {data.junkScore.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.score >= 75 ? 'url(#barOver)' : entry.score >= 50 ? 'url(#barWarning)' : 'url(#barExcellent)'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>
        {/* ── REPORT BUTTON ── */}
        <div className="flex justify-center pb-8">
          <button
            onClick={profileComplete ? handleReport : undefined}
            disabled={!profileComplete}
            title={!profileComplete ? 'Complete your profile to 100% to unlock reports' : undefined}
            className="h-11 px-8 text-white rounded-[14px] text-[15px] font-bold flex items-center gap-2 transition-all duration-200"
            style={{
              backgroundColor: profileComplete ? '#14B8A6' : '#94A3B8',
              cursor: profileComplete ? 'pointer' : 'not-allowed',
              opacity: profileComplete ? 1 : 0.6,
              boxShadow: profileComplete ? '0 4px 16px rgba(20,184,166,0.3)' : 'none',
            }}
          >
            {reportState === 'loading' ? <Loader2 size={16} className="animate-spin" /> : reportState === 'done' ? <CheckCircle2 size={16} /> : <Download size={16} />}
            {!profileComplete ? 'Complete Profile to Unlock' : reportState === 'loading' ? 'Generating...' : reportState === 'done' ? 'Report Ready!' : 'Generate Report'}
          </button>
        </div>

      </div>
    </div>
  );
};

export default AnalyticsDashboard;
