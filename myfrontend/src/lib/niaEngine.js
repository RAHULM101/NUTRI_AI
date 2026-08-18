export const FOODS = {
  breakfast: [
    { food: "Oats + Banana + Boiled Eggs",          note: "High fiber, sustained energy"         },
    { food: "Poha with Peanuts + Green Tea",         note: "Light, iron-rich, low calorie"        },
    { food: "Whole Wheat Paratha + Curd",            note: "Balanced protein and healthy fats"    },
    { food: "Sprouted Moong Salad + Brown Bread",    note: "Excellent plant-based protein"        },
    { food: "Dalia Khichdi + Boiled Egg",            note: "High fiber, easy to digest"           },
    { food: "Cholar Dal + 2 Rotis",                  note: "High protein, low GI, very filling"   },
    { food: "Idli (3) + Sambar + Coconut Chutney",   note: "Fermented, gut-friendly, light"       },
    { food: "Besan Cheela + Mint Chutney",           note: "High protein vegetarian breakfast"    },
  ],
  lunch: [
    { food: "Brown Rice + Macher Jhol + Mixed Veg",  note: "Omega-3 rich, high-quality protein"  },
    { food: "Roti + Dal Tadka + Paneer Bhurji",      note: "High protein vegetarian powerhouse"  },
    { food: "Chicken Stew + Steamed Rice + Salad",   note: "Lean protein, easy to digest"        },
    { food: "Rice + Masoor Dal + Begun Bhaja",       note: "Traditional comfort, amino acids"    },
    { food: "Quinoa Pulao + Soy Chunks Curry",       note: "Complete protein for muscle repair"  },
    { food: "Roti + Bhindi Masala + Greek Yogurt",   note: "Fiber-rich, probiotic support"       },
  ],
  snack: [
    { food: "Roasted Makhana (Fox Nuts)",            note: "Low-GI, perfect for weight control"  },
    { food: "Boiled Chana Chaat",                    note: "High fiber, satiating protein"       },
    { food: "Greek Yogurt + Honey",                  note: "Probiotic support, gut health"       },
    { food: "Soaked Almonds + Green Tea",            note: "Antioxidants, brain-healthy fats"    },
    { food: "Muri + Roasted Peanuts",                note: "Low calorie, healthy fats"           },
    { food: "Fresh Seasonal Fruit Salad",            note: "Natural vitamins, quick hydration"   },
  ],
  dinner: [
    { food: "Roti + Lauki Curry",                    note: "Hydrating, extremely low calorie"    },
    { food: "Grilled Fish + Steamed Broccoli",       note: "Perfect lean dinner for fat loss"    },
    { food: "Clear Vegetable + Lentil Soup",         note: "Warm, filling, nutrient-dense"       },
    { food: "Light Chicken Curry + 1 Wheat Roti",    note: "Balanced macros for recovery"        },
    { food: "Paneer Tikka (Low Oil) + Salad",        note: "Slow-digesting protein, no hunger"   },
    { food: "Moong Dal Khichdi (Light)",             note: "Best choice for restful sleep"       },
  ],
};

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

export const generateWeeklyMealPlan = ( calories = 2000) => {
  const cal = parseInt(calories) || 2000;
  const p = Math.round((cal * 0.30) / 4);
  const f = Math.round((cal * 0.30) / 9);
  const c = Math.round((cal * 0.40) / 4);

  return Array.from({ length: 7 }, (_, idx) => ({
    day: `Day ${idx + 1}`,
    meals: [
      { type: "Breakfast",     ...pick(FOODS.breakfast), cal: Math.round(cal * 0.25), p: Math.round(p * 0.25), f: Math.round(f * 0.25), c: Math.round(c * 0.25) },
      { type: "Lunch",         ...pick(FOODS.lunch),     cal: Math.round(cal * 0.35), p: Math.round(p * 0.35), f: Math.round(f * 0.35), c: Math.round(c * 0.35) },
      { type: "Evening Snack", ...pick(FOODS.snack),     cal: Math.round(cal * 0.15), p: Math.round(p * 0.15), f: Math.round(f * 0.15), c: Math.round(c * 0.15) },
      { type: "Dinner",        ...pick(FOODS.dinner),    cal: Math.round(cal * 0.25), p: Math.round(p * 0.25), f: Math.round(f * 0.25), c: Math.round(c * 0.25) },
    ],
    totals: { cal, p, f, c },
  }));
};

// ── Intent detection ──────────────────────────────────────────
const detect = (t) => {
  if (/\b(hi|hello|hey|good morning|good evening)\b/.test(t))                          return "greeting";
  if (/\b(meal plan|diet plan|week|7.?day|weekly)\b/.test(t))                          return "meal_plan";
  if (/\b(calorie|kcal|how many cal|caloric)\b/.test(t))                               return "calories";
  if (/\b(protein|how much protein|protein goal|protein intake)\b/.test(t))            return "protein";
  if (/\b(fat loss|weight loss|lose weight|reduce weight|slim)\b/.test(t))             return "weight_loss";
  if (/\b(muscle|bulk|gain weight|mass|hypertrophy)\b/.test(t))                        return "muscle_gain";
  if (/\b(junk|processed|chips|soda|pizza|burger|fast food|sugar)\b/.test(t))         return "junk_food";
  if (/\b(water|hydration|drink|fluid)\b/.test(t))                                     return "hydration";
  if (/\b(snack|snacks|between meals|evening snack)\b/.test(t))                        return "snacks";
  if (/\b(breakfast|morning meal|morning food)\b/.test(t))                             return "breakfast";
  if (/\b(sleep|rest|recovery|night)\b/.test(t))                                       return "sleep";
  if (/\b(pain|chest|hurt|dizziness|sick|nausea|vomit)\b/.test(t))                    return "medical";
  if (/\b(course|courses|learn|learning|class|classes|video|videos|recommend|resources|study|tutorial)\b/.test(t)) return "courses";
  return "generic";
};

// ── Response map — focused, concise, on-topic ─────────────────
const RESPONSES = {
  greeting: ({ name }) =>
    `Hi ${name}! I'm Nia, your AI nutritionist. What would you like help with today — a meal plan, calorie targets, or something specific?`,

  meal_plan: () =>
    `Here's your personalized 7-day meal plan based on your profile.`,

  calories: ({ calTarget, goal }) =>
    `Your daily calorie target is **${calTarget} kcal**, set for your goal of **${goal}**.\n\nDistribution:\n- Breakfast: ~${Math.round(calTarget * 0.25)} kcal\n- Lunch: ~${Math.round(calTarget * 0.35)} kcal\n- Snack: ~${Math.round(calTarget * 0.15)} kcal\n- Dinner: ~${Math.round(calTarget * 0.25)} kcal`,

  protein: ({ proteinTarget, calTarget }) =>
    `Your daily protein target is **${proteinTarget}g** (30% of ${calTarget} kcal).\n\nBest sources:\n- **Animal:** Chicken breast, Eggs, Fish, Greek Yogurt\n- **Plant-based:** Paneer, Soy chunks, Chana, Moong Dal\n\nAim for 25–30g per meal for optimal absorption.`,

  weight_loss: ({ calTarget }) =>
    `For fat loss, stay within **${calTarget} kcal/day** (a ~500 kcal deficit).\n\nKey strategies:\n- Prioritize **high-volume, low-calorie foods** — leafy greens, soups, Lauki\n- Replace white rice with **Brown Rice or Dalia**\n- Eat protein at every meal to preserve muscle\n- Avoid liquid calories (juice, soda, chai with sugar)`,

  muscle_gain: ({ proteinTarget, calTarget }) =>
    `For muscle gain, target **${calTarget + 300} kcal/day** with **${proteinTarget}g protein**.\n\nFocus on:\n- **Complex carbs** for energy: Sweet potato, Oats, Brown rice\n- **Lean protein** at every meal: Chicken, Eggs, Paneer, Soy\n- Post-workout: Protein shake or Curd + Banana within 30 mins\n- Sleep 7–8 hours — muscle repair happens at rest`,

  junk_food: () =>
    `Junk food is high in sodium, refined sugar, and trans fats — all of which spike insulin and cause energy crashes.\n\nSmarter swaps:\n- Chips → **Roasted Makhana or Chana**\n- Soda → **Coconut water or Nimbu Pani**\n- Biscuits → **Dates or Dark chocolate (70%+)**\n- Fried snacks → **Boiled Chana Chaat**`,

  hydration: ({ waterGoal }) =>
    `Your daily water target is **${waterGoal || 3}L**.\n\nTips:\n- Drink a glass of water first thing in the morning\n- Carry a 1L bottle and refill it ${waterGoal >= 3 ? "3" : "2"} times\n- Add lemon or mint for electrolytes\n- Reduce water 1 hour before bed to avoid disrupted sleep`,

  snacks: () =>
    `Best healthy snacks (under 200 kcal):\n\n- **Roasted Makhana** — 150 kcal, low GI\n- **Boiled Chana Chaat** — 180 kcal, high fiber\n- **Greek Yogurt + Honey** — 120 kcal, probiotic\n- **Soaked Almonds (10)** — 70 kcal, healthy fats\n- **Fruit Salad** — 100 kcal, vitamins`,

  breakfast: () =>
    `High-quality breakfast options:\n\n- **Oats + Banana + Eggs** — 450 kcal, 24g protein\n- **Besan Cheela + Chutney** — 320 kcal, 18g protein\n- **Idli + Sambar** — 280 kcal, gut-friendly\n- **Whole Wheat Paratha + Curd** — 380 kcal, balanced macros\n\nAlways include a protein source to stay full until lunch.`,

  sleep: () =>
    `Sleep directly impacts your metabolism and hunger hormones.\n\n- Poor sleep raises **ghrelin** (hunger hormone) by up to 24%\n- Aim for **7–8 hours** of uninterrupted sleep\n- Avoid heavy meals 2 hours before bed\n- A light dinner like **Moong Dal Khichdi** supports better sleep\n- Magnesium-rich foods (banana, almonds) help with sleep quality`,

  medical: () =>
    `I'm not able to provide medical advice for symptoms like pain, dizziness, or chest discomfort.\n\nPlease consult a licensed healthcare professional immediately. Nia is designed for nutritional guidance only.`,

  courses: () => `COURSE_CARDS`,

  generic: ({ goal }) =>
    `I can help with meal plans, calorie targets, protein goals, weight loss, muscle gain, healthy snacks, and more.\n\nYour current goal is **${goal}**. What specific aspect of your nutrition would you like to work on?`,
};

export const getNiaResponse = (input, profileData, contextData = {}) => {
  const text   = input.toLowerCase().trim();
  const name   = profileData?.firstName || profileData?.name?.split(" ")[0] || "there";
  const goal   = profileData?.mainGoal || "General Fitness";
  const calTarget     = parseInt(profileData?.calorieTarget) || contextData.calGoal || 2000;
  const proteinTarget = Math.round((calTarget * 0.30) / 4);
  const waterGoal     = parseFloat(profileData?.waterGoal) || 3.0;
  const allergies     = Array.isArray(profileData?.allergies) && profileData.allergies.length
    ? profileData.allergies : [];

  const intent = detect(text);
  const ctx    = { name, goal, calTarget, proteinTarget, waterGoal };

  let responseText = RESPONSES[intent]?.(ctx) ?? RESPONSES.generic(ctx);

  // Append allergy note only when relevant
  if (allergies.length > 0 && ["meal_plan","protein","breakfast","snacks","weight_loss","muscle_gain"].includes(intent)) {
    responseText += `\n\n*Allergy note: Avoiding ${allergies.join(", ")} in all suggestions.*`;
  }

  const isMealPlan  = intent === "meal_plan";
  const isCourses   = intent === "courses";

  return {
    type:        "ai",
    text:        isMealPlan ? "Here's your personalized 7-day meal plan:" : (isCourses ? "Here are some great nutrition courses and resources:" : responseText),
    timestamp:   new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    hasMealPlan: isMealPlan,
    hasCourses:  isCourses,
    isWarning:   intent === "medical",
    followUps:   getFollowUps(intent),
  };
};

const getFollowUps = (intent) => {
  const map = {
    greeting:     ["Show my meal plan", "What's my calorie target?", "High protein foods"],
    meal_plan:    ["Explain the macros", "Vegetarian version", "How many calories per day?"],
    calories:     ["How to hit my calorie goal?", "Low calorie Indian foods", "Calorie deficit explained"],
    protein:      ["Best protein sources", "Protein for vegetarians", "Post-workout protein"],
    weight_loss:  ["Low calorie meal plan", "Best fat loss foods", "How fast can I lose weight?"],
    muscle_gain:  ["High protein meal plan", "Pre-workout foods", "How much to eat for bulking?"],
    junk_food:    ["Healthy snack alternatives", "How to reduce cravings?", "Cheat meal tips"],
    hydration:    ["Best time to drink water", "Electrolyte foods", "Signs of dehydration"],
    snacks:       ["Pre-workout snacks", "Late night snacks", "Snacks under 100 kcal"],
    breakfast:    ["High protein breakfast", "Quick breakfast ideas", "Breakfast for weight loss"],
    sleep:        ["Foods that improve sleep", "Best dinner for sleep", "Sleep and weight loss"],
    courses:      ["Recommend a meal plan", "What's my calorie target?", "High protein foods"],
    generic:      ["Show my meal plan", "What's my calorie target?", "Weight loss tips"],
  };
  return map[intent] || map.generic;
};
