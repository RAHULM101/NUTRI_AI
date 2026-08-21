// FILE: mobile/src/utils/calorieCalculator.js
// Purpose: Scientifically calculate personalized daily calorie and macro goals (Mifflin-St Jeor)

export function calculateDailyCalorieTarget(userData, userMetrics) {
  // If explicitly set and valid, use user's custom target
  const explicit = userData?.calorieTarget || userMetrics?.daily_calorie_goal;
  if (explicit && Number(explicit) >= 500 && Number(explicit) !== 1920) {
    return Number(explicit);
  }

  // Extract biometric factors
  const weight = parseFloat(userData?.weight || userMetrics?.current_weight);
  const height = parseFloat(userData?.height);
  const age = parseInt(userData?.age);

  if (!weight || !height || !age) {
    return 2000; // Standard baseline target so progress ring and macros are always vibrant
  }

  const isMale = (userData?.gender || 'male').toLowerCase() === 'male';

  // Mifflin-St Jeor Equation:
  // BMR = 10*weight(kg) + 6.25*height(cm) - 5*age + (male ? 5 : -161)
  const bmr = 10 * weight + 6.25 * height - 5 * age + (isMale ? 5 : -161);

  // Activity multiplier
  const activity = (userData?.activityLevel || userData?.activity_level || 'moderate').toLowerCase();
  let activityMultiplier = 1.375; // lightly active default
  if (activity.includes('sedentary')) {
    activityMultiplier = 1.2;
  } else if (activity.includes('moderate')) {
    activityMultiplier = 1.45;
  } else if (activity.includes('active') || activity.includes('heavy') || activity.includes('very')) {
    activityMultiplier = 1.65;
  }

  let tdee = bmr * activityMultiplier;

  // Goal adjustment
  const goal = (userData?.mainGoal || userData?.goal_type || userMetrics?.goal_type || 'maintenance').toLowerCase();
  if (goal.includes('loss') || goal.includes('cut') || goal.includes('weight loss')) {
    tdee -= 400; // Sustainable deficit
  } else if (goal.includes('gain') || goal.includes('bulk') || goal.includes('muscle')) {
    tdee += 350; // Lean surplus
  }

  // Safe boundary clamp (1200 - 3800 kcal)
  return Math.round(Math.max(1200, Math.min(3800, tdee)));
}

export function calculateMacros(dailyCalories) {
  return {
    proteinGoal: Math.round((dailyCalories * 0.30) / 4), // 30% Protein (4 kcal/g)
    carbsGoal: Math.round((dailyCalories * 0.45) / 4),   // 45% Carbs (4 kcal/g)
    fatGoal: Math.round((dailyCalories * 0.25) / 9),     // 25% Healthy Fats (9 kcal/g)
  };
}
