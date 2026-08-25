// FILE: mobile/__tests__/auth_and_calculator.test.js
// Purpose: Automated regression test suite for core algorithms, validators & base64 decoder

const { calculateDailyCalorieTarget, calculateMacros } = require('../src/utils/calorieCalculator');
const { validateEmail, validatePassword, validateMetric } = require('../src/utils/validators');
const { decodeBase64, parseJwt } = require('../src/utils/base64');

function assert(condition, message) {
  if (!condition) {
    throw new Error(`❌ Test Failed: ${message}`);
  }
  console.log(`✅ Passed: ${message}`);
}

function runTests() {
  console.log('\n--- 🧪 RUNNING CRITICAL LOGIC REGRESSION TESTS ---\n');

  // Test 1: Base64 decoding & JWT parsing
  const testPayload = { user_id: 'usr_123', email: 'test@nutriai.com' };
  const mockJwt = `header.${Buffer.from(JSON.stringify(testPayload)).toString('base64')}.signature`;
  const parsed = parseJwt(mockJwt);
  assert(parsed.user_id === 'usr_123', 'parseJwt extracts user_id correctly without atob');
  assert(parsed.email === 'test@nutriai.com', 'parseJwt extracts email correctly');
  assert(Object.keys(parseJwt('invalid.jwt')).length === 0, 'parseJwt handles malformed token gracefully');

  // Test 2: Email validation
  assert(validateEmail('user@nutriai.com').valid === true, 'Valid email passes');
  assert(validateEmail('bad-email').valid === false, 'Invalid email fails');
  assert(validateEmail('').valid === false, 'Empty email fails');

  // Test 3: Password validation
  assert(validatePassword('secure123').valid === true, '6+ char password passes');
  assert(validatePassword('123').valid === false, 'Short password fails');

  // Test 4: Body metric range validator
  assert(validateMetric(72, { min: 20, max: 300, name: 'Weight' }).valid === true, 'Normal weight passes');
  assert(validateMetric(5, { min: 20, max: 300, name: 'Weight' }).valid === false, 'Below min weight fails');
  assert(validateMetric('abc').valid === false, 'Non-numeric metric fails');

  // Test 5: Calorie calculator (Mifflin-St Jeor)
  const maleUser = { weight: 75, height: 178, age: 28, gender: 'male', activityLevel: 'moderate', mainGoal: 'Fat Loss' };
  const calories = calculateDailyCalorieTarget(maleUser, {});
  assert(calories >= 1200 && calories <= 3800, `Calculated calories (${calories} kcal) is within safe physiological bounds`);

  const macros = calculateMacros(calories);
  assert(macros.proteinGoal > 0, `Protein goal calculated: ${macros.proteinGoal}g`);
  assert(macros.carbsGoal > 0, `Carbs goal calculated: ${macros.carbsGoal}g`);
  assert(macros.fatGoal > 0, `Fat goal calculated: ${macros.fatGoal}g`);

  console.log('\n--- 🎉 ALL 10 TESTS PASSED WITH ZERO FAILURES ---\n');
}

runTests();
