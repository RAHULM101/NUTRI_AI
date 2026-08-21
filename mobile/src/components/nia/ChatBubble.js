// FILE: mobile/src/components/nia/ChatBubble.js
// Production-Grade Executive Chat Bubble — Fluid Borderless AI Response, Crisp User Pill,
// Interactive 7-Day Meal Plan Table, 1-Tap PDF Export, Haptics & Clipboard Copy

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert, Clipboard, Share } from 'react-native';
import { Sparkles, Utensils, Flame, Download, Copy, Plus, Check, Share2, ChevronLeft, ChevronRight } from 'lucide-react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { COLORS, FONT_SIZES, SPACING, RADIUS, SHADOWS } from '../../constants/theme';
import { triggerHaptic } from '../../utils/haptics';

// ── Foods database copied exactly from Web App (niaEngine.js) ───────────
const FOODS = {
  breakfast: [
    { food: "Oats + Banana + Boiled Eggs", note: "High fiber, sustained energy" },
    { food: "Poha with Peanuts + Green Tea", note: "Light, iron-rich, low calorie" },
    { food: "Whole Wheat Toast + Boiled Eggs / Curd", note: "Balanced protein and healthy fats" },
    { food: "Sprouted Moong Salad + Brown Bread", note: "Excellent plant-based protein" },
    { food: "Dalia Bowl + Boiled Egg", note: "High fiber, easy to digest" },
    { food: "Yellow Lentils (Dal) + 2 Whole Wheat Rotis", note: "High protein, low GI, very filling" },
    { food: "Idli (3) + Sambar + Coconut Chutney", note: "Fermented, gut-friendly, light" },
    { food: "Besan Cheela + Mint Chutney", note: "High protein vegetarian breakfast" },
  ],
  lunch: [
    { food: "Brown Rice + Grilled Chicken / Paneer + Mixed Veg", note: "High-quality lean protein" },
    { food: "Whole Wheat Roti + Dal Tadka + Paneer Bhurji", note: "High protein vegetarian powerhouse" },
    { food: "Grilled Chicken Breast + Steamed Rice + Salad", note: "Lean protein, easy to digest" },
    { food: "Steamed Rice + Yellow Lentil Dal + Green Salad", note: "Balanced amino acids and fiber" },
    { food: "Quinoa Pulao + Soy Chunks Curry", note: "Complete protein for muscle repair" },
    { food: "Roti + Sautéed Vegetables + Greek Yogurt", note: "Fiber-rich, probiotic support" },
  ],
  snack: [
    { food: "Roasted Makhana (Fox Nuts)", note: "Low-GI, perfect for weight control" },
    { food: "Boiled Chickpea Salad (Chana Chaat)", note: "High fiber, satiating protein" },
    { food: "Greek Yogurt + Honey", note: "Probiotic support, gut health" },
    { food: "Soaked Almonds + Green Tea", note: "Antioxidants, brain-healthy fats" },
    { food: "Roasted Chickpeas & Mixed Nuts", note: "Low calorie, healthy fats" },
    { food: "Fresh Seasonal Fruit Salad", note: "Natural vitamins, quick hydration" },
  ],
  dinner: [
    { food: "Whole Wheat Roti + Mixed Vegetable Curry", note: "Hydrating, extremely low calorie" },
    { food: "Grilled Fish / Tofu + Steamed Broccoli", note: "Perfect lean dinner for fat loss" },
    { food: "Clear Vegetable + Lentil Soup", note: "Warm, filling, nutrient-dense" },
    { food: "Light Chicken Curry + 1 Whole Wheat Roti", note: "Balanced macros for recovery" },
    { food: "Paneer / Tofu Tikka (Low Oil) + Green Salad", note: "Slow-digesting protein, no hunger" },
    { food: "Light Lentil Khichdi with Curd", note: "Best choice for restful sleep" },
  ],
};

const pick = (arr, idx) => arr[idx % arr.length];

export const generateMealPlan = (calories = 2000, numDays = 7) => {
  const cal = parseInt(calories, 10) || 2000;
  const p = Math.round((cal * 0.30) / 4);
  const f = Math.round((cal * 0.30) / 9);
  const c = Math.round((cal * 0.40) / 4);
  const daysCount = Math.max(1, Math.min(parseInt(numDays, 10) || 7, 7));

  const TIME_MAP = {
    Breakfast: '07:30 AM',
    Lunch: '01:00 PM',
    'Evening Snack': '04:30 PM',
    Dinner: '08:00 PM',
  };

  return Array.from({ length: daysCount }, (_, idx) => {
    const b = pick(FOODS.breakfast, idx);
    const l = pick(FOODS.lunch, idx + 1);
    const s = pick(FOODS.snack, idx + 2);
    const d = pick(FOODS.dinner, idx + 3);

    return {
      day: `Day ${idx + 1}`,
      meals: [
        { type: "Breakfast", time: TIME_MAP.Breakfast, food: b.food, cal: Math.round(cal * 0.25), p: Math.round(p * 0.25), f: Math.round(f * 0.25), c: Math.round(c * 0.25) },
        { type: "Lunch", time: TIME_MAP.Lunch, food: l.food, cal: Math.round(cal * 0.35), p: Math.round(p * 0.35), f: Math.round(f * 0.35), c: Math.round(c * 0.35) },
        { type: "Evening Snack", time: TIME_MAP['Evening Snack'], food: s.food, cal: Math.round(cal * 0.15), p: Math.round(p * 0.15), f: Math.round(f * 0.15), c: Math.round(c * 0.15) },
        { type: "Dinner", time: TIME_MAP.Dinner, food: d.food, cal: Math.round(cal * 0.25), p: Math.round(p * 0.25), f: Math.round(f * 0.25), c: Math.round(c * 0.25) },
      ],
      totals: { cal, p, f, c },
    };
  });
};

const MEAL_TAG_COLORS = {
  Breakfast: { bg: 'rgba(20,184,166,0.12)', text: '#0D9488', border: 'rgba(20,184,166,0.25)' },
  Lunch: { bg: 'rgba(59,130,246,0.12)', text: '#2563EB', border: 'rgba(59,130,246,0.25)' },
  Dinner: { bg: 'rgba(139,92,246,0.12)', text: '#7C3AED', border: 'rgba(139,92,246,0.25)' },
  'Evening Snack': { bg: 'rgba(245,158,11,0.12)', text: '#D97706', border: 'rgba(245,158,11,0.25)' },
  Snack: { bg: 'rgba(245,158,11,0.12)', text: '#D97706', border: 'rgba(245,158,11,0.25)' },
};

function MealPlanTable({ numDays = 7, isDark, colors }) {
  const { addMealLog, userMetrics, userData } = useAuth();
  const calGoal = userMetrics?.daily_calorie_goal || userData?.calorieTarget || 2000;
  const [weeklyPlan] = useState(() => generateMealPlan(calGoal, numDays));
  const [activeDayIdx, setActiveDayIdx] = useState(0);
  const [downloading, setDownloading] = useState(false);

  const currentDayData = weeklyPlan[activeDayIdx] || weeklyPlan[0];

  const handleDownloadPDF = async () => {
    triggerHaptic('light');
    setDownloading(true);
    try {
      const todayDate = new Date().toLocaleDateString('en-IN', { dateStyle: 'long' });
      const goal = userData?.mainGoal || 'General Fitness';

      const htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8" />
            <title>NutriAI — ${numDays}-Day Meal Plan</title>
            <style>
              * { box-sizing: border-box; margin: 0; padding: 0; }
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; padding: 24px; color: #0F172A; background: #FFFFFF; font-size: 12px; }
              .header { border-bottom: 2px solid #0D9488; padding-bottom: 12px; margin-bottom: 16px; }
              .title { font-size: 20px; font-weight: 800; color: #0D9488; letter-spacing: -0.5px; }
              .meta { font-size: 11px; color: #64748B; margin-top: 4px; }
              .day-card { border: 1px solid #E2E8F0; border-radius: 8px; margin-bottom: 16px; overflow: hidden; page-break-inside: avoid; }
              .day-head { background: #F0FDF4; border-bottom: 1px solid #D1FAE5; padding: 8px 12px; display: flex; justify-content: space-between; align-items: center; }
              .day-title { font-size: 12px; font-weight: 800; color: #0D9488; text-transform: uppercase; }
              .day-totals { font-size: 10px; font-weight: 700; color: #475569; }
              table { width: 100%; border-collapse: collapse; text-align: left; }
              th { background: #F8FAFC; color: #64748B; font-size: 9px; text-transform: uppercase; letter-spacing: 0.5px; padding: 7px 10px; border-bottom: 1px solid #E2E8F0; }
              td { padding: 9px 10px; border-bottom: 1px solid #F1F5F9; font-size: 11px; }
              tr:nth-child(even) { background: #FAFAFA; }
              .badge { display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 9px; font-weight: 800; text-transform: uppercase; }
              .badge-breakfast { background: rgba(20,184,166,0.15); color: #0D9488; }
              .badge-lunch { background: rgba(59,130,246,0.15); color: #2563EB; }
              .badge-snack { background: rgba(245,158,11,0.15); color: #D97706; }
              .badge-dinner { background: rgba(139,92,246,0.15); color: #7C3AED; }
              .cal-num { font-weight: 800; color: #EA580C; }
              .footer { text-align: center; margin-top: 24px; font-size: 10px; color: #94A3B8; text-transform: uppercase; }
            </style>
          </head>
          <body>
            <div class="header">
              <div class="title">NutriAI ✦ ${numDays}-Day Nutrition & Meal Plan</div>
              <div class="meta">Generated: ${todayDate} | Target: ${calGoal} kcal/day | Goal: ${goal}</div>
            </div>

            ${weeklyPlan.map((d) => `
              <div class="day-card">
                <div class="day-head">
                  <span class="day-title">${d.day}</span>
                  <span class="day-totals">Total: ${d.totals.cal} kcal | Protein: ${d.totals.p}g | Carbs: ${d.totals.c}g | Fat: ${d.totals.f}g</span>
                </div>
                <table>
                  <thead>
                    <tr>
                      <th style="width: 14%">Time</th>
                      <th style="width: 18%">Meal</th>
                      <th style="width: 44%">Food</th>
                      <th style="width: 12%">Cal</th>
                      <th style="width: 12%">Protein</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${d.meals.map(m => `
                      <tr>
                        <td><b>${m.time}</b></td>
                        <td><span class="badge ${m.type === 'Breakfast' ? 'badge-breakfast' : m.type === 'Lunch' ? 'badge-lunch' : m.type === 'Dinner' ? 'badge-dinner' : 'badge-snack'}">${m.type}</span></td>
                        <td><b>${m.food}</b></td>
                        <td class="cal-num">${m.cal} kcal</td>
                        <td style="color: #2563EB; font-weight: 700">${m.p}g</td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
            `).join('')}

            <div class="footer">
              NutriAI Personalized Nutrition Plan • Generated by Nia AI Coach
            </div>
          </body>
        </html>
      `;

      const { uri } = await Print.printToFileAsync({
        html: htmlContent,
        fileName: `NutriAI_${numDays}Day_MealPlan_${new Date().toISOString().slice(0, 10)}`,
      });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Download Meal Plan PDF',
          UTI: 'com.adobe.pdf',
        });
      } else {
        Alert.alert('PDF Exported 📄', `PDF created at: ${uri}`);
      }
      triggerHaptic('success');
    } catch (e) {
      triggerHaptic('error');
      Alert.alert('PDF Export Error', e?.message || 'Could not export PDF.');
    } finally {
      setDownloading(false);
    }
  };

  const handleLogMealToToday = (mealItem) => {
    triggerHaptic('selection');
    const calVal = mealItem.cal || 350;
    const protVal = mealItem.p || 20;
    const carbVal = mealItem.c || 40;
    const fatVal = mealItem.f || 10;

    addMealLog({
      calories: calVal,
      protein: protVal,
      carbs: carbVal,
      fat: fatVal,
      junkScore: 10,
    });

    Alert.alert('Meal Logged 🎯', `"${mealItem.food}" added to today's tracker!`);
  };

  return (
    <View style={[tableStyles.container, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
      {/* Top Bar */}
      <View style={[tableStyles.topBar, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#F8FAFC', borderBottomColor: colors.border }]}>
        <View style={tableStyles.topBarLeft}>
          <Pressable
            style={[tableStyles.navChevron, activeDayIdx === 0 && { opacity: 0.3 }]}
            onPress={() => {
              triggerHaptic('light');
              setActiveDayIdx((p) => Math.max(0, p - 1));
            }}
            disabled={activeDayIdx === 0}
            hitSlop={8}
          >
            <ChevronLeft size={16} color={colors.text} />
          </Pressable>

          <Text style={[tableStyles.dayLabel, { color: colors.text }]}>{currentDayData.day}</Text>
          
          <Pressable
            style={[tableStyles.navChevron, activeDayIdx === weeklyPlan.length - 1 && { opacity: 0.3 }]}
            onPress={() => {
              triggerHaptic('light');
              setActiveDayIdx((p) => Math.min(weeklyPlan.length - 1, p + 1));
            }}
            disabled={activeDayIdx === weeklyPlan.length - 1}
            hitSlop={8}
          >
            <ChevronRight size={16} color={colors.text} />
          </Pressable>

          <Text style={tableStyles.flameEmoji}>🔥</Text>
          <View style={[tableStyles.vDivider, { backgroundColor: colors.border }]} />
          <Text style={tableStyles.calValue}>{currentDayData.totals.cal}</Text>
          <Text style={[tableStyles.calUnit, { color: colors.textMuted }]}>kcal</Text>
        </View>

        <Pressable
          style={({ pressed }) => [tableStyles.pdfBtn, pressed && { opacity: 0.85, transform: [{ scale: 0.96 }] }]}
          onPress={handleDownloadPDF}
          disabled={downloading}
          hitSlop={6}
        >
          <Download size={12} color={COLORS.primary} />
          <Text style={tableStyles.pdfBtnText}>{downloading ? 'Exporting...' : 'PDF'}</Text>
        </Pressable>
      </View>

      {/* Macro Summary Strip */}
      <View style={[tableStyles.macroStrip, { borderBottomColor: colors.border }]}>
        <View style={[tableStyles.macroCol, { borderRightColor: colors.border }]}>
          <Text style={[tableStyles.macroNum, { color: '#F97316' }]}>{currentDayData.totals.cal} kcal</Text>
          <Text style={[tableStyles.macroLabel, { color: colors.textMuted }]}>ENERGY</Text>
        </View>
        <View style={[tableStyles.macroCol, { borderRightColor: colors.border }]}>
          <Text style={[tableStyles.macroNum, { color: '#3B82F6' }]}>{currentDayData.totals.p}g</Text>
          <Text style={[tableStyles.macroLabel, { color: colors.textMuted }]}>PROTEIN</Text>
        </View>
        <View style={tableStyles.macroCol}>
          <Text style={[tableStyles.macroNum, { color: '#F59E0B' }]}>{currentDayData.totals.c}g</Text>
          <Text style={[tableStyles.macroLabel, { color: colors.textMuted }]}>CARBS</Text>
        </View>
      </View>

      {/* 7-Day Switcher Tabs */}
      <ScrollView
        horizontal
        nestedScrollEnabled={true}
        keyboardShouldPersistTaps="handled"
        showsHorizontalScrollIndicator={false}
        style={tableStyles.dayTabScroll}
        contentContainerStyle={{ paddingHorizontal: 10, gap: 6 }}
      >
        {weeklyPlan.map((d, idx) => (
          <Pressable
            key={d.day}
            style={[
              tableStyles.dayTab,
              { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#F1F5F9', borderColor: colors.border },
              activeDayIdx === idx && { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
            ]}
            onPress={() => {
              triggerHaptic('selection');
              setActiveDayIdx(idx);
            }}
          >
            <Text style={[tableStyles.dayTabText, { color: isDark ? '#94A3B8' : '#64748B' }, activeDayIdx === idx && { color: '#FFFFFF', fontWeight: '900' }]}>
              {d.day}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Meals Table */}
      <ScrollView
        horizontal
        nestedScrollEnabled={true}
        keyboardShouldPersistTaps="handled"
        showsHorizontalScrollIndicator={true}
        contentContainerStyle={tableStyles.tableScroll}
      >
        <View>
          {/* Table Header */}
          <View style={[tableStyles.row, tableStyles.headerRow, { backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#F1F5F9' }]}>
            <Text style={[tableStyles.cell, tableStyles.cellHeader, { width: 70, color: colors.textMuted }]}>TIME</Text>
            <Text style={[tableStyles.cell, tableStyles.cellHeader, { width: 85, color: colors.textMuted }]}>MEAL</Text>
            <Text style={[tableStyles.cell, tableStyles.cellHeader, { width: 160, color: colors.textMuted }]}>FOOD</Text>
            <Text style={[tableStyles.cell, tableStyles.cellHeader, { width: 60, color: colors.textMuted }]}>CAL</Text>
            <Text style={[tableStyles.cell, tableStyles.cellHeader, { width: 60, color: colors.textMuted }]}>PROTEIN</Text>
            <Text style={[tableStyles.cell, tableStyles.cellHeader, { width: 40, color: colors.textMuted }]}>LOG</Text>
          </View>

          {/* Table Rows */}
          {currentDayData.meals.map((row, idx) => {
            const tagStyle = MEAL_TAG_COLORS[row.type] || MEAL_TAG_COLORS.Snack;
            return (
              <View
                key={idx}
                style={[
                  tableStyles.row,
                  { borderBottomColor: isDark ? 'rgba(255,255,255,0.04)' : '#F1F5F9' },
                  idx % 2 === 1 && { backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : '#F8FAFC' },
                ]}
              >
                <Text style={[tableStyles.cell, { width: 70, color: colors.textMuted, fontSize: 11, fontWeight: '600' }]}>{row.time}</Text>
                <View style={{ width: 85, paddingHorizontal: 4 }}>
                  <View style={[tableStyles.tagBadge, { backgroundColor: tagStyle.bg, borderColor: tagStyle.border }]}>
                    <Text style={[tableStyles.tagBadgeText, { color: tagStyle.text }]}>{row.type}</Text>
                  </View>
                </View>
                <Text style={[tableStyles.cell, { width: 160, color: colors.text, fontWeight: '600', fontSize: 12 }]} numberOfLines={2}>{row.food}</Text>
                <Text style={[tableStyles.cell, { width: 60, color: '#F97316', fontWeight: '900', fontSize: 12 }]}>{row.cal}</Text>
                <Text style={[tableStyles.cell, { width: 60, color: '#3B82F6', fontWeight: '800', fontSize: 12 }]}>{row.p}g</Text>
                <Pressable
                  style={tableStyles.quickAddBtn}
                  onPress={() => handleLogMealToToday(row)}
                  hitSlop={6}
                >
                  <Plus size={12} color="#FFFFFF" />
                </Pressable>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const tableStyles = StyleSheet.create({
  container: {
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    marginVertical: 8,
    overflow: 'hidden',
    maxWidth: '100%',
    ...SHADOWS.sm,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderBottomWidth: 1,
  },
  topBarLeft: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  navChevron: {
    padding: 2,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayLabel: { fontSize: 13, fontWeight: '900' },
  flameEmoji: { fontSize: 12 },
  vDivider: { width: 1, height: 12, marginHorizontal: 2 },
  calValue: { fontSize: 13, fontWeight: '900', color: COLORS.primary },
  calUnit: { fontSize: 10, fontWeight: '600' },

  pdfBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    backgroundColor: 'rgba(20,184,166,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(20,184,166,0.25)',
  },
  pdfBtnText: { color: COLORS.primary, fontSize: 11, fontWeight: '800' },

  macroStrip: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  macroCol: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 7,
    borderRightWidth: 1,
  },
  macroNum: { fontSize: 12, fontWeight: '900' },
  macroLabel: { fontSize: 8, fontWeight: '800', letterSpacing: 0.6, marginTop: 1 },

  dayTabScroll: { paddingVertical: 6 },
  dayTab: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    borderWidth: 1,
  },
  dayTabText: { fontSize: 11, fontWeight: '700' },

  tableScroll: { paddingBottom: 4 },
  row: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, paddingVertical: 8, paddingHorizontal: 6 },
  headerRow: { paddingVertical: 5, borderBottomWidth: 1 },
  cell: { fontSize: 11, paddingHorizontal: 4 },
  cellHeader: { fontWeight: '800', fontSize: 9, letterSpacing: 0.5 },

  tagBadge: {
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  tagBadgeText: { fontSize: 8.5, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.2 },

  quickAddBtn: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

/**
 * Clean Formatted Text with Callout Card support
 */
function FormattedText({ content, isUser, textColor }) {
  if (!content) return null;

  const lines = content.split('\n');

  return (
    <View>
      {lines.map((line, lIdx) => {
        const isBullet = line.trim().startsWith('- ') || line.trim().startsWith('* ');
        const isCallout = line.includes('💡') || line.includes('Key strategies:') || line.includes('Focus on:');
        const cleanLine = isBullet ? line.trim().substring(2) : line;
        const parts = cleanLine.split(/(\*\*.*?\*\*)/g);

        if (isCallout && !isUser) {
          return (
            <View key={lIdx} style={styles.calloutCard}>
              <Text style={[styles.messageText, { color: textColor, fontWeight: '700' }]}>
                {cleanLine}
              </Text>
            </View>
          );
        }

        return (
          <View key={lIdx} style={[styles.lineWrap, isBullet && styles.bulletWrap]}>
            {isBullet && <Text style={[styles.bulletDot, { color: isUser ? '#FFFFFF' : COLORS.primary }]}>• </Text>}
            <Text style={[styles.messageText, { color: textColor }]}>
              {parts.map((part, pIdx) => {
                if (part.startsWith('**') && part.endsWith('**')) {
                  return (
                    <Text key={pIdx} style={styles.boldText}>
                      {part.slice(2, -2)}
                    </Text>
                  );
                }
                return <Text key={pIdx}>{part}</Text>;
              })}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

function ChatBubble({ message, isUser }) {
  const { isDark, colors } = useTheme();
  const [copied, setCopied] = useState(false);
  const rawText = message.text || message.user_message || message.ai_response || '';

  const lowerText = rawText.toLowerCase();
  let detectedDays = 7;
  if (lowerText.includes('1 day') || lowerText.includes('one day') || lowerText.includes('1-day')) {
    detectedDays = 1;
  } else if (lowerText.includes('2 day') || lowerText.includes('2 days') || lowerText.includes('two day') || lowerText.includes('2-day')) {
    detectedDays = 2;
  } else if (lowerText.includes('3 day') || lowerText.includes('3 days') || lowerText.includes('three day') || lowerText.includes('3-day')) {
    detectedDays = 3;
  } else if (lowerText.includes('4 day') || lowerText.includes('4 days') || lowerText.includes('4-day')) {
    detectedDays = 4;
  } else if (lowerText.includes('5 day') || lowerText.includes('5 days') || lowerText.includes('5-day')) {
    detectedDays = 5;
  }

  const isMealPlan = !isUser && message.id !== 'init_0' && (
    message.hasMealPlan === true ||
    (lowerText.includes('day 1') && (lowerText.includes('breakfast') || lowerText.includes('lunch') || lowerText.includes('dinner'))) ||
    (lowerText.includes('meal plan') && (lowerText.includes('breakfast') || lowerText.includes('day 1') || lowerText.includes('lunch'))) ||
    (lowerText.includes('diet chart') && (lowerText.includes('breakfast') || lowerText.includes('day 1') || lowerText.includes('lunch')))
  );

  const handleCopyText = () => {
    triggerHaptic('light');
    Clipboard.setString(rawText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareAdvice = () => {
    triggerHaptic('light');
    Share.share({
      message: `NutriAI Health Advice:\n\n${rawText}`,
      title: 'NutriAI Advice',
    }).catch((e) => console.warn('Share error:', e));
  };

  return (
    <View style={[styles.container, isUser ? styles.containerUser : styles.containerAi]}>
      {isUser ? (
        /* User Message Pill (Right Aligned, Crisp Dark/Primary Pill) */
        <View style={[styles.userBubble, { backgroundColor: isDark ? '#1E293B' : '#0F172A' }]}>
          <Text style={styles.userMessageText}>{rawText}</Text>
          {message.timestamp ? (
            <Text style={styles.userTimestamp}>{message.timestamp}</Text>
          ) : null}
        </View>
      ) : (
        /* AI Response Block (Fluid, Borderless, ChatGPT/Perplexity Style) */
        <View style={styles.aiMessageBlock}>
          {/* Subtle Coach Header */}
          <View style={styles.aiHeaderRow}>
            <View style={[styles.aiSparkleWrap, { backgroundColor: isDark ? 'rgba(20,184,166,0.18)' : 'rgba(20,184,166,0.10)' }]}>
              <Sparkles size={11} color={COLORS.primary} />
            </View>
            <Text style={[styles.aiHeaderName, { color: COLORS.primary }]}>Nia AI</Text>
            {message.timestamp ? (
              <Text style={[styles.aiTimestamp, { color: colors.textMuted }]}>• {message.timestamp}</Text>
            ) : null}
          </View>

          {/* Body Content */}
          {isMealPlan ? (
            <View>
              <FormattedText
                content={
                  rawText.split(/\n(?=\||\*\*Day|Day \d|Breakfast)/)[0].trim() ||
                  "Here is your customized nutrition plan:"
                }
                isUser={false}
                textColor={colors.text}
              />
              <MealPlanTable numDays={detectedDays} isDark={isDark} colors={colors} />
            </View>
          ) : (
            <FormattedText
              content={rawText}
              isUser={false}
              textColor={colors.text}
            />
          )}

          {/* Bottom Minimalist Utility Toolbar */}
          {message.id !== 'init_0' && (
            <View style={[styles.utilityBar, { borderTopColor: colors.border }]}>
              <Pressable
                style={({ pressed }) => [styles.utilityBtn, pressed && { opacity: 0.6 }]}
                onPress={handleCopyText}
                hitSlop={6}
              >
                {copied ? <Check size={12} color={COLORS.primary} /> : <Copy size={12} color={colors.textMuted} />}
                <Text style={[styles.utilityBtnText, { color: copied ? COLORS.primary : colors.textMuted }]}>
                  {copied ? 'Copied' : 'Copy'}
                </Text>
              </Pressable>

              <Pressable
                style={({ pressed }) => [styles.utilityBtn, pressed && { opacity: 0.6 }]}
                onPress={handleShareAdvice}
                hitSlop={6}
              >
                <Share2 size={12} color={colors.textMuted} />
                <Text style={[styles.utilityBtnText, { color: colors.textMuted }]}>Share</Text>
              </Pressable>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 6,
    paddingHorizontal: SPACING.base,
  },
  containerUser: {
    alignItems: 'flex-end',
  },
  containerAi: {
    alignItems: 'flex-start',
    width: '100%',
  },

  // User Message Pill
  userBubble: {
    maxWidth: '82%',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderBottomRightRadius: 4,
    ...SHADOWS.sm,
  },
  userMessageText: {
    color: '#FFFFFF',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
  },
  userTimestamp: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 9.5,
    marginTop: 4,
    alignSelf: 'flex-end',
  },

  // AI Response Block (Borderless & Fluid)
  aiMessageBlock: {
    width: '100%',
    paddingVertical: 4,
  },
  aiHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  aiSparkleWrap: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiHeaderName: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  aiTimestamp: {
    fontSize: 10,
    fontWeight: '500',
  },

  calloutCard: {
    backgroundColor: 'rgba(20,184,166,0.08)',
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primary,
    borderRadius: RADIUS.md,
    padding: 10,
    marginVertical: 6,
  },

  lineWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginVertical: 2.5,
  },
  bulletWrap: {
    paddingLeft: 4,
  },
  bulletDot: {
    fontSize: 14,
    fontWeight: '900',
  },
  messageText: {
    fontSize: 14.5,
    lineHeight: 22,
    fontWeight: '400',
  },
  boldText: {
    fontWeight: '800',
  },

  utilityBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginTop: 8,
    paddingTop: 6,
    borderTopWidth: 1,
  },
  utilityBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 2,
  },
  utilityBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
});

export default React.memo(ChatBubble);
