export function getProfileCompletion(profileData) {
  const d = profileData || {};
  const fields = [
    d.firstName || d.name,
    d.lastName,
    d.dobYear,
    d.gender,
    d.height,
    d.weight,
    d.targetWeight,
    d.mainGoal,
    d.activityLevel,
    d.dietaryPreference,
    d.regionalCulture,
    d.waterGoal,
    d.photo,
  ];
  const filled = fields.filter(f =>
    f !== undefined && f !== null && f !== '' &&
    !(Array.isArray(f) && f.length === 0)
  ).length;
  return Math.round((filled / fields.length) * 100);
}
