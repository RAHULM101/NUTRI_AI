// FILE: mobile/src/components/dashboard/WeeklyReportModal.js
// Purpose: Clinical Weekly Nutrition Report matching Web App Design & PDF Export

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  Pressable,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { X, Flame, TrendingDown, Trophy, Sparkles, Download, Calendar, Check, Target, Droplets } from 'lucide-react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { useTheme } from '../../context/ThemeContext';
import { COLORS, FONT_SIZES, SPACING, RADIUS, SHADOWS } from '../../constants/theme';

export default function WeeklyReportModal({ visible, onClose, dashData, userData }) {
  const { isDark, colors } = useTheme();
  const [exporting, setExporting] = useState(false);

  if (!visible) return null;

  const name = userData?.firstName || userData?.name || 'Member';
  const mainGoal = userData?.mainGoal || 'Balanced Nutrition & Healthy Living';
  const calGoal = userData?.calorieTarget || 1920;
  const currentWater = userData?.waterGoal || 3.0;

  const calTrend = dashData?.cal_trend || [
    { name: 'Mon', val: 1800, status: 'On Target' },
    { name: 'Tue', val: 1750, status: 'On Target' },
    { name: 'Wed', val: 1900, status: 'On Target' },
    { name: 'Thu', val: 1650, status: 'Under' },
    { name: 'Fri', val: 2100, status: 'Over' },
    { name: 'Sat', val: 2050, status: 'Over' },
    { name: 'Sun', val: 1780, status: 'On Target' },
  ];

  const handleExportPDF = async () => {
    setExporting(true);
    try {
      const sanitizedName = (name || 'Member').replace(/[^a-zA-Z0-9_-]/g, '_');
      const todayDate = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      const cleanFileName = `NutriAI_Weekly_Report_${sanitizedName}.pdf`;

      const waterGoal = parseFloat(userData?.waterGoal) || 3.0;
      const currentWaterVal = parseFloat(currentWater) || 1.8;

      const htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <title>${cleanFileName}</title>
            <style>
              * { box-sizing: border-box; margin: 0; padding: 0; }
              body {
                font-family: 'Plus Jakarta Sans', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                padding: 30px;
                color: #1E293B;
                background-color: #ffffff;
                line-height: 1.5;
                font-size: 13px;
              }
              .header { border-bottom: 2px solid #E2E8F0; padding-bottom: 18px; margin-bottom: 22px; display: flex; justify-content: space-between; align-items: flex-end; }
              .logo { font-size: 28px; font-weight: 800; color: #0D9488; letter-spacing: -1px; }
              .logo span { color: #3B82F6; }
              .doc-info { text-align: right; font-size: 11px; color: #64748B; text-transform: uppercase; letter-spacing: 0.5px; }
              .doc-title { font-size: 18px; font-weight: 800; color: #3B82F6; margin-bottom: 4px; letter-spacing: 1px; }
              
              .goal-block { border: 1px solid #CBD5E1; background: #F8FAFC; padding: 14px 18px; margin-bottom: 22px; display: flex; justify-content: space-between; align-items: center; border-radius: 8px; }
              .goal-label { font-size: 10px; color: #64748B; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 3px; font-weight: 600; }
              .goal-value { font-size: 14px; font-weight: 700; color: #0F172A; }
              .goal-status { font-size: 12px; font-weight: 700; color: #EF4444; display: flex; align-items: center; gap: 6px; padding: 4px 8px; background: #FEF2F2; border: 1px solid #FECACA; border-radius: 4px; }
              
              .hero-section { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 22px; }
              .hero-box { padding: 14px; border: 1px solid #CBD5E1; background: white; border-radius: 6px; display: flex; flex-direction: column; justify-content: space-between; }
              .hero-label { font-size: 10px; font-weight: 600; color: #64748B; text-transform: uppercase; margin-bottom: 6px; letter-spacing: 0.5px; }
              .hero-value { font-size: 20px; font-weight: 800; color: #0F172A; margin-bottom: 2px; }
              .hero-sub { font-size: 11px; font-weight: 600; margin-bottom: 6px; }
              .trend-pill { font-size: 9px; font-weight: 700; padding: 3px 6px; border-radius: 4px; display: inline-block; text-transform: uppercase; letter-spacing: 0.5px; }
              .trend-good { background: #D1FAE5; color: #065F46; }
              .trend-bad  { background: #FEE2E2; color: #991B1B; }

              .section-title { font-size: 12px; font-weight: 800; color: #0D9488; margin-bottom: 14px; text-transform: uppercase; letter-spacing: 1px; border-bottom: 1px solid #E2E8F0; padding-bottom: 4px; }
              
              .behavior-section { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; margin-bottom: 22px; }
              .b-card { padding: 14px; border: 1px solid #CBD5E1; background: #F8FAFC; border-radius: 6px; border-top: 3px solid #8B5CF6; }
              .b-label { font-size: 10px; font-weight: 700; color: #64748B; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 3px; }
              .b-def { font-size: 10px; color: #94A3B8; margin-bottom: 6px; font-style: italic; line-height: 1.3; }
              .b-value { font-size: 20px; font-weight: 800; color: #0F172A; margin-bottom: 3px; }
              .b-sub { font-size: 11px; font-weight: 600; }
              
              .ai-alert { background: #F8FAFC; border: 1px solid #CBD5E1; border-left: 4px solid #3B82F6; padding: 18px; margin-bottom: 22px; font-size: 12px; line-height: 1.7; color: #334155; border-radius: 0 8px 8px 0; }
              .ai-alert strong { font-size: 12px; color: #1E3A8A; display: block; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 0.5px; }
              .bullet-list { list-style: none; padding: 0; margin: 0; }
              .bullet-list li { display: flex; align-items: flex-start; gap: 8px; margin-bottom: 6px; font-size: 12px; }
              .pill-plus { background: #D1FAE5; color: #065F46; font-weight: 800; font-size: 10px; padding: 2px 6px; border-radius: 4px; white-space: nowrap; }
              .pill-minus { background: #FEE2E2; color: #991B1B; font-weight: 800; font-size: 10px; padding: 2px 6px; border-radius: 4px; white-space: nowrap; }
              .highlight-blue { font-weight: 700; color: #2563EB; }

              .chart-wrapper { border: 1px solid #CBD5E1; border-radius: 8px; padding: 18px; margin-bottom: 22px; background: white; }
              .chart-legend { display: flex; gap: 18px; margin-bottom: 14px; padding-bottom: 10px; border-bottom: 1px solid #F1F5F9; }
              .legend-item { display: flex; align-items: center; gap: 6px; font-size: 10px; color: #64748B; font-weight: 600; }
              .legend-dot { width: 10px; height: 10px; border-radius: 2px; }
              
              .chart-row { display: flex; align-items: center; margin-bottom: 12px; gap: 10px; }
              .chart-row:last-child { margin-bottom: 0; }
              .chart-label { font-size: 11px; font-weight: 600; color: #475569; width: 80px; flex-shrink: 0; text-align: right; }
              .bar-track { flex: 1; background: #F1F5F9; border-radius: 6px; height: 18px; position: relative; overflow: visible; }
              .bar-actual { height: 100%; border-radius: 6px; position: relative; }
              .target-marker { position: absolute; top: -3px; bottom: -3px; width: 2px; background: #1E293B; border-radius: 2px; }
              .target-label-top { position: absolute; top: -16px; font-size: 8px; font-weight: 700; color: #1E293B; transform: translateX(-50%); white-space: nowrap; }
              .bar-gap { font-size: 10px; font-weight: 700; width: 80px; flex-shrink: 0; }
              .gap-good { color: #059669; }
              .gap-bad  { color: #DC2626; }

              .footer { border-top: 1px solid #E2E8F0; padding-top: 12px; display: flex; justify-content: space-between; font-size: 9px; color: #94A3B8; text-transform: uppercase; letter-spacing: 0.5px; }
            </style>
          </head>
          <body>
            <div class="header">
              <div class="logo">Nutri<span>AI</span></div>
              <div class="doc-info">
                <div class="doc-title">Weekly Report</div>
                <div>Reporting Period: ${todayDate}</div>
                <div>Patient: ${name}</div>
              </div>
            </div>

            <div class="goal-block">
              <div>
                <div class="goal-label">Stated Primary Goal</div>
                <div class="goal-value">${mainGoal}</div>
              </div>
              <div class="goal-status">⚠ Action Required</div>
            </div>

            <div class="hero-section">
              <div class="hero-box" style="border-top: 3px solid #0D9488;">
                <div>
                  <div class="hero-label">Avg Calories</div>
                  <div class="hero-value">${calGoal - 50}</div>
                  <div class="hero-sub" style="color: #0D9488;">Target: ${calGoal} kcal</div>
                </div>
                <span class="trend-pill trend-good">↓ 50 kcal vs Last Week</span>
              </div>
              <div class="hero-box" style="border-top: 3px solid #3B82F6;">
                <div>
                  <div class="hero-label">Avg Protein</div>
                  <div class="hero-value">75g</div>
                  <div class="hero-sub" style="color: #EF4444;">Target: 130g</div>
                </div>
                <span class="trend-pill trend-good">↑ 10g vs Last Week</span>
              </div>
              <div class="hero-box" style="border-top: 3px solid #F59E0B;">
                <div>
                  <div class="hero-label">Avg Carbs</div>
                  <div class="hero-value">250g</div>
                  <div class="hero-sub" style="color: #64748B;">Target: 200g</div>
                </div>
                <span class="trend-pill trend-bad">↑ 45g vs Last Week</span>
              </div>
              <div class="hero-box" style="border-top: 3px solid #8B5CF6;">
                <div>
                  <div class="hero-label">Avg Fat</div>
                  <div class="hero-value">60g</div>
                  <div class="hero-sub" style="color: #0D9488;">Target: 65g</div>
                </div>
                <span class="trend-pill trend-good">↓ 5g vs Last Week</span>
              </div>
            </div>

            <div class="section-title">Behavioral Metrics</div>
            <div class="behavior-section">
              <div class="b-card" style="border-top-color: #EC4899;">
                <div class="b-label">RISE Score</div>
                <div class="b-def">How well your body & habits bounce back after a bad day.</div>
                <div class="b-value">48 <span style="font-size: 12px; color: #64748B;">/ 100</span></div>
                <div class="b-sub" style="color: #DC2626;">Low Metabolic Resilience</div>
              </div>
              <div class="b-card" style="border-top-color: #0D9488;">
                <div class="b-label">HEI (Diet Quality)</div>
                <div class="b-def">Rates how balanced & diverse your food choices are overall.</div>
                <div class="b-value">62 <span style="font-size: 12px; color: #64748B;">/ 100</span></div>
                <div class="b-sub" style="color: #D97706;">Moderate – Needs Diversity</div>
              </div>
              <div class="b-card" style="border-top-color: #3B82F6;">
                <div class="b-label">Avg Hydration</div>
                <div class="b-def">Daily water intake compared to your recommended daily goal.</div>
                <div class="b-value">${currentWaterVal}L <span style="font-size: 12px; color: #64748B;">/ ${waterGoal}L</span></div>
                <div class="b-sub" style="color: ${currentWaterVal < waterGoal ? '#DC2626' : '#059669'};">
                  ${currentWaterVal < waterGoal ? 'Under-Hydrated' : 'Well Hydrated'}
                </div>
              </div>
            </div>

            <div class="section-title">Comparative Analysis by Nia</div>
            <div class="ai-alert">
              <strong>Week-over-Week Breakdown</strong>
              <ul class="bullet-list">
                <li><span class="pill-plus">+ PLUS</span> Overall calorie average dropped by 150 kcal — you are trending towards your target.</li>
                <li><span class="pill-plus">+ PLUS</span> Protein intake improved by 10g compared to last week — keep pushing.</li>
                <li><span class="pill-plus">+ PLUS</span> Fat intake is nearly on target at 60g vs 65g goal — excellent control.</li>
                <li><span class="pill-minus">– MINUS</span> Carbohydrate intake is 50g over target, driven entirely by weekend meals.</li>
                <li><span class="pill-minus">– MINUS</span> HEI score of 62 indicates low food diversity — you are eating the same meals on repeat.</li>
                <li><span class="pill-minus">– MINUS</span> Hydration at ${currentWaterVal}L — this is likely fuelling your weekend carb cravings.</li>
              </ul>
              <br />
              <span class="highlight-blue">Nia's Directive for Next Week:</span> Drink ${waterGoal}L of water daily before 6 PM and introduce at least 2 new food types to push your HEI score above 70.
            </div>

            <div class="section-title">Progress Report – Gap to Target</div>
            <div class="chart-wrapper">
              <div class="chart-legend">
                <div class="legend-item"><div class="legend-dot" style="background: #0D9488;"></div> Actual (This Week)</div>
                <div class="legend-item"><div class="legend-dot" style="background: #1E293B; width: 3px; border-radius: 2px;"></div> Target</div>
                <div class="legend-item"><div class="legend-dot" style="background: #DC2626; opacity: 0.4;"></div> Over Target</div>
              </div>

              <div class="chart-row">
                <div class="chart-label">Calories</div>
                <div class="bar-track">
                  <div class="bar-actual" style="width: 97.5%; background: #0D9488;"></div>
                  <div class="target-marker" style="left: 100%;">
                    <div class="target-label-top">${calGoal}</div>
                  </div>
                </div>
                <div class="bar-gap gap-good">– 50 kcal ✓</div>
              </div>

              <div class="chart-row">
                <div class="chart-label">Protein</div>
                <div class="bar-track">
                  <div class="bar-actual" style="width: 57.7%; background: #3B82F6;"></div>
                  <div class="target-marker" style="left: 100%;">
                    <div class="target-label-top">130g</div>
                  </div>
                </div>
                <div class="bar-gap gap-bad">– 55g ✗</div>
              </div>

              <div class="chart-row">
                <div class="chart-label">Carbs</div>
                <div class="bar-track">
                  <div style="position: absolute; left: 0; top: 0; width: 100%; height: 100%; border-radius: 6px; background: #F59E0B; opacity: 0.5;"></div>
                  <div style="position: absolute; left: 100%; top: 0; width: 20%; height: 100%; border-radius: 0 6px 6px 0; background: #DC2626; opacity: 0.7;"></div>
                  <div class="target-marker" style="left: 100%;">
                    <div class="target-label-top">200g</div>
                  </div>
                </div>
                <div class="bar-gap gap-bad">+ 50g ✗</div>
              </div>

              <div class="chart-row">
                <div class="chart-label">Fat</div>
                <div class="bar-track">
                  <div class="bar-actual" style="width: 92.3%; background: #8B5CF6;"></div>
                  <div class="target-marker" style="left: 100%;">
                    <div class="target-label-top">65g</div>
                  </div>
                </div>
                <div class="bar-gap gap-good">– 5g ✓</div>
              </div>

              <div class="chart-row">
                <div class="chart-label">Hydration</div>
                <div class="bar-track">
                  <div class="bar-actual" style="width: ${Math.min(100, (currentWaterVal / waterGoal) * 100)}%; background: #3B82F6;"></div>
                  <div class="target-marker" style="left: 100%;">
                    <div class="target-label-top">${waterGoal} L</div>
                  </div>
                </div>
                <div class="bar-gap ${currentWaterVal < waterGoal ? 'gap-bad' : 'gap-good'}">
                  ${currentWaterVal < waterGoal ? `– ${(waterGoal - currentWaterVal).toFixed(1)} L ✗` : '+ Goal ✓'}
                </div>
              </div>
            </div>

            <div class="footer">
              <div>NutriAI – V3 Research Build (RISE & HEI)</div>
              <div>Page 1 of 1</div>
            </div>
          </body>
        </html>
      `;

      const { uri } = await Print.printToFileAsync({ html: htmlContent });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          UTI: '.pdf',
          mimeType: 'application/pdf',
          dialogTitle: `Download ${cleanFileName}`,
        });
      } else {
        Alert.alert('Report Ready', `PDF report generated successfully: ${cleanFileName}`);
      }
    } catch (err) {
      console.warn('PDF export error:', err);
      Alert.alert('Export Notice', 'Could not export PDF. Please check file permissions.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.frostedBackdrop}>
        <View style={[styles.modalCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
          {/* Header */}
          <View style={[styles.header, { borderColor: colors.border }]}>
            <View style={styles.headerLeft}>
              <View style={styles.iconCircle}>
                <Trophy size={20} color="#ffffff" />
              </View>
              <View>
                <Text style={[styles.title, { color: colors.text }]}>Weekly Health Report 📄</Text>
                <Text style={[styles.subtitle, { color: colors.textMuted }]}>
                  Generated for {name} • {new Date().toLocaleDateString()}
                </Text>
              </View>
            </View>
            <Pressable style={styles.closeBtn} onPress={onClose} hitSlop={8}>
              <X size={20} color={colors.textMuted} />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            {/* Goal Block */}
            <View style={[styles.goalBlock, { backgroundColor: isDark ? '#1e293b' : '#F8FAFC', borderColor: colors.border }]}>
              <View>
                <Text style={styles.goalLabel}>PRIMARY GOAL</Text>
                <Text style={[styles.goalValue, { color: colors.text }]}>{mainGoal}</Text>
              </View>
              <View style={styles.complianceBadge}>
                <Check size={11} color="#059669" strokeWidth={3} />
                <Text style={styles.complianceText}>92% Compliance</Text>
              </View>
            </View>

            {/* Hero 3 Key Metrics */}
            <View style={styles.heroGrid}>
              <View style={[styles.heroCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
                <Flame size={18} color={COLORS.teal} />
                <Text style={[styles.heroNum, { color: colors.text }]}>1,860</Text>
                <Text style={[styles.heroLbl, { color: colors.textMuted }]}>Avg kcal/day</Text>
              </View>
              <View style={[styles.heroCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
                <TrendingDown size={18} color="#10B981" />
                <Text style={[styles.heroNum, { color: '#10B981' }]}>24</Text>
                <Text style={[styles.heroLbl, { color: colors.textMuted }]}>Junk Score</Text>
              </View>
              <View style={[styles.heroCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
                <Droplets size={18} color="#0EA5E9" />
                <Text style={[styles.heroNum, { color: '#0EA5E9' }]}>{currentWater}L</Text>
                <Text style={[styles.heroLbl, { color: colors.textMuted }]}>Hydration</Text>
              </View>
            </View>

            {/* AI Clinical Insights */}
            <View style={[styles.aiBox, { backgroundColor: isDark ? '#064e3b' : '#ECFDF5', borderColor: isDark ? '#047857' : '#A7F3D0' }]}>
              <View style={styles.aiHeader}>
                <Sparkles size={15} color={COLORS.primary} />
                <Text style={styles.aiTitle}>NIA AI WEEKLY HIGHLIGHTS</Text>
              </View>
              <Text style={[styles.aiText, { color: isDark ? '#D1FAE5' : '#065F46' }]}>
                • Caloric intake stayed within optimal range on 5 of 7 tracked days.{'\n'}
                • Ultra-processed food remained low with a clean 24/100 score.{'\n'}
                • Excellent hydration discipline supporting metabolic recovery.
              </Text>
            </View>

            {/* Export PDF Button */}
            <Pressable
              style={({ pressed }) => [
                styles.downloadBtn,
                pressed && { opacity: 0.88, transform: [{ scale: 0.98 }] },
              ]}
              onPress={handleExportPDF}
              disabled={exporting}
            >
              {exporting ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <>
                  <Download size={18} color="#ffffff" />
                  <Text style={styles.downloadBtnText}>Download PDF Report</Text>
                </>
              )}
            </Pressable>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  frostedBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(3, 7, 18, 0.78)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    borderTopLeftRadius: RADIUS['2xl'],
    borderTopRightRadius: RADIUS['2xl'],
    maxHeight: '92%',
    padding: SPACING.lg,
    borderWidth: 1,
    ...SHADOWS.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    marginBottom: SPACING.md,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 18, fontWeight: '900', letterSpacing: -0.3 },
  subtitle: { fontSize: 12, marginTop: 1 },
  closeBtn: { padding: 6 },

  scrollContent: { paddingBottom: SPACING['2xl'] },

  goalBlock: {
    borderRadius: RADIUS.xl,
    padding: SPACING.base,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  goalLabel: { fontSize: 10, fontWeight: '700', color: '#64748B', letterSpacing: 0.8 },
  goalValue: { fontSize: 14, fontWeight: '800', marginTop: 2 },
  complianceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  complianceText: { fontSize: 11, fontWeight: '800', color: '#059669' },

  heroGrid: { flexDirection: 'row', gap: 8, marginBottom: SPACING.md },
  heroCard: {
    flex: 1,
    borderRadius: RADIUS.xl,
    padding: SPACING.md,
    alignItems: 'center',
    borderWidth: 1,
    ...SHADOWS.sm,
  },
  heroNum: { fontSize: 18, fontWeight: '900', marginVertical: 3, letterSpacing: -0.5 },
  heroLbl: { fontSize: 10, fontWeight: '700' },

  aiBox: {
    borderRadius: RADIUS['2xl'],
    padding: SPACING.base,
    borderWidth: 1,
    marginBottom: SPACING.lg,
  },
  aiHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  aiTitle: { fontSize: 11, fontWeight: '900', color: COLORS.primary, letterSpacing: 0.5 },
  aiText: { fontSize: 12, lineHeight: 18, fontWeight: '600' },

  downloadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.teal,
    borderRadius: RADIUS.xl,
    paddingVertical: 15,
    ...SHADOWS.emerald,
  },
  downloadBtnText: { fontSize: 15, fontWeight: '800', color: '#ffffff' },
});
