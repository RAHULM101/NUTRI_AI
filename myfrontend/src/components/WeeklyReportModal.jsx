// eslint-disable-next-line no-unused-vars
import React from 'react';
import { X, Download } from 'lucide-react';
import { useUser } from '../context/UserContext';
import html2pdf from 'html2pdf.js';

export default function WeeklyReportModal({ onClose }) {
  const { userMetrics, userData, dailyLogs } = useUser();
  const name = userData?.name || 'Rahul Sharma';
  const mainGoal = userData?.mainGoal || 'Gym Physique & Muscle Gain';
  const calTarget = userMetrics?.daily_calorie_goal || 2000;
  const currentWater = dailyLogs?.current_water || 1.8;
  const waterGoal = userMetrics?.water_goal || 3.0;

  const handleDownload = () => {
    const element = document.getElementById('report-content');
    const opt = {
      margin:       0,
      filename:     `NutriAI_Weekly_Report_${name.replace(/\s+/g, '_')}.pdf`,
      image:        { type: 'jpeg', quality: 1.0 },
      html2canvas:  { scale: 2, useCORS: true },
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    html2pdf().set(opt).from(element).save();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center bg-slate-900/60 backdrop-blur-sm overflow-y-auto py-10 print:py-0 print:bg-transparent print:backdrop-blur-none">
      
      {/* Scoped CSS for the report from your HTML file */}
      <style>{`
        .report-page {
          width: 210mm;
          min-height: 297mm;
          background: white;
          padding: 20mm;
          box-shadow: 0 10px 25px rgba(0,0,0,0.1);
          position: relative;
          color: #1E293B;
          font-family: 'Plus Jakarta Sans', 'Inter', sans-serif;
          margin: 0 auto;
        }
        
        .report-page .header { border-bottom: 2px solid #E2E8F0; padding-bottom: 20px; margin-bottom: 25px; display: flex; justify-content: space-between; align-items: flex-end; }
        .report-page .doc-info { text-align: right; font-size: 11px; color: #64748B; text-transform: uppercase; letter-spacing: 0.5px; }
        .report-page .doc-title { font-size: 18px; font-weight: 800; color: #3B82F6; margin-bottom: 5px; letter-spacing: 1px; }
        
        .report-page .goal-block { border: 1px solid #CBD5E1; background: #F8FAFC; padding: 15px 20px; margin-bottom: 25px; display: flex; justify-content: space-between; align-items: center; border-radius: 8px; }
        .report-page .goal-label { font-size: 10px; color: #64748B; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px; font-weight: 600; }
        .report-page .goal-value { font-size: 14px; font-weight: 700; color: #0F172A; }
        .report-page .goal-status { font-size: 12px; font-weight: 700; color: #EF4444; display: flex; align-items: center; gap: 6px; padding: 4px 8px; background: #FEF2F2; border: 1px solid #FECACA; border-radius: 4px; }
        
        .report-page .hero-section { display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 15px; margin-bottom: 25px; }
        .report-page .hero-box { padding: 15px; border: 1px solid #CBD5E1; background: white; border-radius: 6px; display: flex; flex-direction: column; justify-content: space-between; }
        .report-page .hero-label { font-size: 10px; font-weight: 600; color: #64748B; text-transform: uppercase; margin-bottom: 8px; letter-spacing: 0.5px; }
        .report-page .hero-value { font-size: 22px; font-weight: 800; color: #0F172A; margin-bottom: 3px; }
        .report-page .hero-sub { font-size: 11px; font-weight: 600; margin-bottom: 8px; }
        .report-page .trend-pill { font-size: 9px; font-weight: 700; padding: 4px 6px; border-radius: 4px; display: inline-block; text-transform: uppercase; letter-spacing: 0.5px; }
        .report-page .trend-good { background: #D1FAE5; color: #065F46; }
        .report-page .trend-bad  { background: #FEE2E2; color: #991B1B; }
      
        .report-page .behavior-section { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px; margin-bottom: 25px; }
        .report-page .b-card { padding: 15px; border: 1px solid #CBD5E1; background: #F8FAFC; border-radius: 6px; border-top: 3px solid #8B5CF6; }
        .report-page .b-label { font-size: 10px; font-weight: 700; color: #64748B; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
        .report-page .b-def { font-size: 10px; color: #94A3B8; margin-bottom: 8px; font-style: italic; line-height: 1.4; }
        .report-page .b-value { font-size: 22px; font-weight: 800; color: #0F172A; margin-bottom: 4px; }
        .report-page .b-sub { font-size: 11px; font-weight: 600; }
      
        .report-page .section-title { font-size: 12px; font-weight: 800; color: #0D9488; margin-bottom: 15px; text-transform: uppercase; letter-spacing: 1px; border-bottom: 1px solid #E2E8F0; padding-bottom: 5px; }
        
        .report-page .ai-alert { background: #F8FAFC; border: 1px solid #CBD5E1; border-left: 4px solid #3B82F6; padding: 20px; margin-bottom: 25px; font-size: 13px; line-height: 1.7; color: #334155; border-radius: 0 8px 8px 0; }
        .report-page .ai-alert strong { font-size: 13px; color: #1E3A8A; display: block; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 0.5px; }
        .report-page .bullet-list { list-style: none; padding: 0; margin: 0; }
        .report-page .bullet-list li { display: flex; align-items: flex-start; gap: 8px; margin-bottom: 8px; font-size: 13px; }
        .report-page .pill-plus { background: #D1FAE5; color: #065F46; font-weight: 800; font-size: 11px; padding: 2px 7px; border-radius: 4px; white-space: nowrap; margin-top: 2px; }
        .report-page .pill-minus { background: #FEE2E2; color: #991B1B; font-weight: 800; font-size: 11px; padding: 2px 7px; border-radius: 4px; white-space: nowrap; margin-top: 2px; }
        .report-page .highlight-blue { font-weight: 700; color: #2563EB; }
      
        .report-page .chart-wrapper { border: 1px solid #CBD5E1; border-radius: 8px; padding: 20px; margin-bottom: 25px; background: white; }
        .report-page .chart-row { display: flex; align-items: center; margin-bottom: 14px; gap: 10px; }
        .report-page .chart-row:last-child { margin-bottom: 0; }
        .report-page .chart-label { font-size: 11px; font-weight: 600; color: #475569; width: 90px; flex-shrink: 0; text-align: right; }
        .report-page .bar-track { flex: 1; background: #F1F5F9; border-radius: 6px; height: 20px; position: relative; overflow: visible; }
        .report-page .bar-actual { height: 100%; border-radius: 6px; position: relative; }
        .report-page .target-marker { position: absolute; top: -4px; bottom: -4px; width: 2px; background: #1E293B; border-radius: 2px; }
        .report-page .target-label-top { position: absolute; top: -18px; font-size: 9px; font-weight: 700; color: #1E293B; transform: translateX(-50%); white-space: nowrap; }
        .report-page .bar-gap { font-size: 10px; font-weight: 700; width: 80px; flex-shrink: 0; }
        .report-page .gap-good { color: #059669; }
        .report-page .gap-bad  { color: #DC2626; }
        .report-page .gap-ok   { color: #64748B; }
      
        .report-page .chart-legend { display: flex; gap: 20px; margin-bottom: 16px; padding-bottom: 12px; border-bottom: 1px solid #F1F5F9; }
        .report-page .legend-item { display: flex; align-items: center; gap: 6px; font-size: 11px; color: #64748B; }
        .report-page .legend-dot { width: 12px; height: 12px; border-radius: 3px; }
      
        .report-page .footer { position: absolute; bottom: 15mm; left: 20mm; right: 20mm; border-top: 1px solid #E2E8F0; padding-top: 15px; display: flex; justify-content: space-between; font-size: 10px; color: #94A3B8; text-transform: uppercase; letter-spacing: 0.5px; }

        @media print {
          body * { visibility: hidden; }
          .fixed { position: absolute; background: transparent !important; backdrop-filter: none !important; }
          .print\\:hidden { display: none !important; }
          .report-page, .report-page * { visibility: visible; }
          .report-page { position: absolute; left: 0; top: 0; box-shadow: none; margin: 0; }
        }
      `}</style>

      <div className="relative w-full max-w-[210mm] mx-auto z-10 px-4 md:px-0">
        
        {/* Action bar (Hidden on print) */}
        <div className="sticky top-4 flex items-center justify-end gap-3 mb-6 print:hidden">
          <button 
            onClick={handleDownload}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#14B8A6] text-white font-bold rounded-[14px] shadow-lg hover:bg-[#0D9488] transition-all duration-200"
          >
            <Download size={18} /> Download PDF
          </button>
          <button 
            onClick={onClose}
            className="flex items-center justify-center w-[44px] h-[44px] bg-white text-slate-800 rounded-[14px] shadow-lg hover:bg-slate-50 transition-all duration-200"
          >
            <X size={20} strokeWidth={2.5} />
          </button>
        </div>

        {/* The Printable Report Page */}
        <div id="report-content" className="report-page">
          <div className="header">
            <div className="logo" style={{ fontSize: '28px', fontWeight: 800, color: '#0D9488', letterSpacing: '-1px' }}>
              Nutri<span style={{ color: '#3B82F6' }}>AI</span>
            </div>
            <div className="doc-info">
              <div className="doc-title">Weekly Report</div>
              <div>Reporting Period: {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
              <div>Patient: {name}</div>
            </div>
          </div>
          
          <div className="goal-block">
            <div>
              <div className="goal-label">Stated Primary Goal</div>
              <div className="goal-value">{mainGoal}</div>
            </div>
            <div className="goal-status">⚠ Action Required</div>
          </div>
          
          <div className="hero-section">
            <div className="hero-box" style={{ borderTop: '3px solid #0D9488' }}>
              <div>
                <div className="hero-label">Avg Calories</div>
                <div className="hero-value">{calTarget - 50}</div>
                <div className="hero-sub" style={{ color: '#0D9488' }}>Target: {calTarget} kcal</div>
              </div>
              <span className="trend-pill trend-good">↓ 50 kcal vs Last Week</span>
            </div>
            <div className="hero-box" style={{ borderTop: '3px solid #3B82F6' }}>
              <div>
                <div className="hero-label">Avg Protein</div>
                <div className="hero-value">75g</div>
                <div className="hero-sub" style={{ color: '#EF4444' }}>Target: 130g</div>
              </div>
              <span className="trend-pill trend-good">↑ 10g vs Last Week</span>
            </div>
            <div className="hero-box" style={{ borderTop: '3px solid #F59E0B' }}>
              <div>
                <div className="hero-label">Avg Carbs</div>
                <div className="hero-value">250g</div>
                <div className="hero-sub" style={{ color: '#64748B' }}>Target: 200g</div>
              </div>
              <span className="trend-pill trend-bad">↑ 45g vs Last Week</span>
            </div>
            <div className="hero-box" style={{ borderTop: '3px solid #8B5CF6' }}>
              <div>
                <div className="hero-label">Avg Fat</div>
                <div className="hero-value">60g</div>
                <div className="hero-sub" style={{ color: '#0D9488' }}>Target: 65g</div>
              </div>
              <span className="trend-pill trend-good">↓ 5g vs Last Week</span>
            </div>
          </div>

          <div className="section-title">Behavioral Metrics</div>
          <div className="behavior-section">
            <div className="b-card" style={{ borderTopColor: '#EC4899' }}>
              <div className="b-label">RISE Score</div>
              <div className="b-def">How well your body & habits bounce back after a bad day.</div>
              <div className="b-value">48 <span style={{ fontSize: '14px', color: '#64748B' }}>/ 100</span></div>
              <div className="b-sub" style={{ color: '#DC2626' }}>Low Metabolic Resilience</div>
            </div>
            <div className="b-card" style={{ borderTopColor: '#0D9488' }}>
              <div className="b-label">HEI (Diet Quality)</div>
              <div className="b-def">Rates how balanced & diverse your food choices are overall.</div>
              <div className="b-value">62 <span style={{ fontSize: '14px', color: '#64748B' }}>/ 100</span></div>
              <div className="b-sub" style={{ color: '#D97706' }}>Moderate – Needs Diversity</div>
            </div>
            <div className="b-card" style={{ borderTopColor: '#3B82F6' }}>
              <div className="b-label">Avg Hydration</div>
              <div className="b-def">Daily water intake compared to your recommended daily goal.</div>
              <div className="b-value">{currentWater}L <span style={{ fontSize: '14px', color: '#64748B' }}>/ {waterGoal}L</span></div>
              <div className="b-sub" style={{ color: currentWater < waterGoal ? '#DC2626' : '#059669' }}>
                {currentWater < waterGoal ? 'Under-Hydrated' : 'Well Hydrated'}
              </div>
            </div>
          </div>

          <div className="section-title">Comparative Analysis by Nia</div>
          <div className="ai-alert">
            <strong>Week-over-Week Breakdown</strong>
            <ul className="bullet-list">
              <li><span className="pill-plus">+ PLUS</span> Overall calorie average dropped by 150 kcal — you are trending towards your target.</li>
              <li><span className="pill-plus">+ PLUS</span> Protein intake improved by 10g compared to last week — keep pushing.</li>
              <li><span className="pill-plus">+ PLUS</span> Fat intake is nearly on target at 60g vs 65g goal — excellent control.</li>
              <li><span className="pill-minus">– MINUS</span> Carbohydrate intake is 50g over target, driven entirely by weekend meals.</li>
              <li><span className="pill-minus">– MINUS</span> HEI score of 62 indicates low food diversity — you are eating the same meals on repeat.</li>
              <li><span className="pill-minus">– MINUS</span> Hydration at {currentWater}L — this is likely fuelling your weekend carb cravings.</li>
            </ul>
            <br />
            <span className="highlight-blue">Nia's Directive for Next Week:</span> Drink {waterGoal}L of water daily before 6 PM and introduce at least 2 new food types to push your HEI score above 70.
          </div>

          <div className="section-title">Progress Report – Gap to Target</div>
          <div className="chart-wrapper">
            <div className="chart-legend">
              <div className="legend-item"><div className="legend-dot" style={{ background: '#0D9488' }}></div> Actual (This Week)</div>
              <div className="legend-item"><div className="legend-dot" style={{ background: '#1E293B', width: '3px', borderRadius: '2px' }}></div> Target</div>
              <div className="legend-item"><div className="legend-dot" style={{ background: '#DC2626', opacity: 0.4 }}></div> Over Target</div>
            </div>

            <div className="chart-row">
              <div className="chart-label">Calories</div>
              <div className="bar-track">
                <div className="bar-actual" style={{ width: '97.5%', background: '#0D9488' }}></div>
                <div className="target-marker" style={{ left: '100%' }}>
                  <div className="target-label-top">{calTarget}</div>
                </div>
              </div>
              <div className="bar-gap gap-good">– 50 kcal ✓</div>
            </div>

            <div className="chart-row">
              <div className="chart-label">Protein</div>
              <div className="bar-track">
                <div className="bar-actual" style={{ width: '57.7%', background: '#3B82F6' }}></div>
                <div className="target-marker" style={{ left: '100%' }}>
                  <div className="target-label-top">130g</div>
                </div>
              </div>
              <div className="bar-gap gap-bad">– 55g ✗</div>
            </div>

            <div className="chart-row">
              <div className="chart-label">Carbs</div>
              <div className="bar-track">
                <div style={{ position: 'absolute', left: 0, top: 0, width: '100%', height: '100%', borderRadius: '6px', background: '#F59E0B', opacity: 0.5 }}></div>
                <div style={{ position: 'absolute', left: '100%', top: 0, width: '20%', height: '100%', borderRadius: '0 6px 6px 0', background: '#DC2626', opacity: 0.7 }}></div>
                <div className="target-marker" style={{ left: '100%' }}>
                  <div className="target-label-top">200g</div>
                </div>
              </div>
              <div className="bar-gap gap-bad">+ 50g ✗</div>
            </div>

            <div className="chart-row">
              <div className="chart-label">Fat</div>
              <div className="bar-track">
                <div className="bar-actual" style={{ width: '92.3%', background: '#8B5CF6' }}></div>
                <div className="target-marker" style={{ left: '100%' }}>
                  <div className="target-label-top">65g</div>
                </div>
              </div>
              <div className="bar-gap gap-good">– 5g ✓</div>
            </div>

            <div className="chart-row">
              <div className="chart-label">Hydration</div>
              <div className="bar-track">
                <div className="bar-actual" style={{ width: `${(currentWater/waterGoal)*100}%`, background: '#3B82F6' }}></div>
                <div className="target-marker" style={{ left: '100%' }}>
                  <div className="target-label-top">{waterGoal} L</div>
                </div>
              </div>
              <div className="bar-gap gap-bad">
                {currentWater < waterGoal ? `– ${(waterGoal - currentWater).toFixed(1)} L ✗` : '+ Goal ✓'}
              </div>
            </div>
          </div>

          <div className="footer">
            <div>NutriAI – V3 Research Build (RISE & HEI)</div>
            <div>Page 1 of 1</div>
          </div>
        </div>
      </div>
    </div>
  );
}
