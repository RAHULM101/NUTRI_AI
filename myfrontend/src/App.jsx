import { useState, useEffect, lazy, Suspense } from "react";
import axios from 'axios';
import LandingPage from "./components/LandingPage";
import LoginPage from "./components/LoginPage";
import SignupPage from "./components/SignupPage";
import LoadingScreen from "./components/LoadingScreen";
import Onboarding from "./components/Onboarding";
import Profile from "./components/Profile";
import Dashboard from "./components/Dashboard";
import MealLogs from "./components/MealLogs";
import Nia from "./components/Nia";
import NutriStore from "./components/store/NutriStore";
import MainLayout from "./components/MainLayout";
import SuccessScreen from "./components/SuccessScreen";
import { useUser } from "./context/UserContext";
const WeeklyReportModal = lazy(() => import('./components/WeeklyReportModal'));
import { getProfileCompletion } from "./lib/profileCompletion";

export default function App() {
  const { saveOnboardingData, loadUserProfile } = useUser();
  const [dark, setDark] = useState(false);
  const [loginOpen, setLogin] = useState(false);
  const [signupOpen, setSignup] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingType, setLoadingType] = useState("login");
  const [showOnboarding, setOnboarding] = useState(false);
  const [backTo, setBackTo] = useState("signup");
  const [profileData, setProfileData] = useState(() => {
    const saved = localStorage.getItem("nutriai_profile_data");
    return saved ? JSON.parse(saved) : {};
  });

  const [onboardingDone, setOnboardingDone] = useState(false);
  const [showSuccessScreen, setShowSuccessScreen] = useState(false);
  const [currentView, setCurrentView] = useState("dashboard");
  const [showReport, setShowReport] = useState(false);
  const [niaMsgs, setNiaMsgs] = useState([]);
  const [cartCount, setCartCount] = useState(0);


  async function fetchAndHydrateProfile(token) {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/profile/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const dbData = response.data.data;

      const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
      const monthName = dbData.month_of_birth ? monthNames[dbData.month_of_birth - 1] : '';


      const mappedData = {
        firstName: dbData.first_name || '',
        lastName: dbData.last_name || '',
        dobDay: dbData.day_of_birth ? String(dbData.day_of_birth).padStart(2, '0') : '',
        dobMonth: monthName,
        dobYear: dbData.year_of_birth ? String(dbData.year_of_birth) : '',
        photo: dbData.profile_photo_url || null,
        gender: dbData.gender || '',
        phone: dbData.phone_number || '',
        height: dbData.height_cm ? String(dbData.height_cm) : '',
        weight: dbData.current_weight_kg ? String(dbData.current_weight_kg) : '',
        targetWeight: dbData.targeted_weight_kg ? String(dbData.targeted_weight_kg) : '',
        waterGoal: dbData.water_intake_litres ? String(dbData.water_intake_litres) : '3',
        mainGoal: dbData.primary_goal || '',
        activityLevel: dbData.activity_level || '',
        occupation: dbData.occupation || '',
        sleepSchedule: dbData.sleep_schedule || '',
        dietaryPreference: dbData.dietary_preference || '',
        cookingOil: dbData.preferred_cooking_oil || '',
        regionalCulture: dbData.regional_culture || '',
        allergies: dbData.allergies ? dbData.allergies.split(', ') : [],
        healthIssues: dbData.health_issues ? dbData.health_issues.split(', ') : [],
        likedFoods: dbData.liked_foods || '',
        dislikedFoods: dbData.disliked_foods || '',
        mealsPerDay: dbData.meal_intake_per_day ? String(dbData.meal_intake_per_day) : '',
        cookingTime: dbData.available_cooking_time || '',
        groceryBudget: dbData.grocery_budget || '',
        mealLocation: dbData.preferred_meal_location || '',
        mainCarbs: dbData.main_carbs_source || '',
        calorieTarget: dbData.daily_calorie_target || 0,
        bmi: dbData.bmi || 0
      };

      localStorage.setItem("nutriai_profile_data", JSON.stringify(mappedData));
      setProfileData(mappedData);
      saveOnboardingData(mappedData);
    } catch (error) {
      console.error("Failed to fetch user profile", error);
    }
  }



  useEffect(() => {
    async function initSession() {
      const profile = await loadUserProfile();
      if (profile) {
        // Fallback to checking local storage if API field is missing/falsy but we know they onboarded
        if (profile.is_Onboarded || profile.is_onboarded || localStorage.getItem("nutriai_onboarded") === "true") {
          setOnboardingDone(true);
          localStorage.setItem("nutriai_onboarded", "true");
        } else {
          setOnboardingDone(false);
          // Only show onboarding if they have a profile but haven't onboarded
          // Assuming we don't auto-open it on refresh unless they try to log in
        }
      }
    }
    initSession();

    if (onboardingDone && Object.keys(profileData).length > 0) {
      saveOnboardingData(profileData);
    }
  }, []);

  const openLogin = () => { setSignup(false); setLogin(true); };
  const openSignup = () => { setLogin(false); setSignup(true); };

  function startLoading(type, isOnboarded) {
  setLoadingType(type);
  setLoading(true);
  setTimeout(async () => {
    setLoading(false);
    setBackTo(type);
    
    // Always fetch profile from backend
    const token = localStorage.getItem("access_token")?.replace(/['"]+/g, '');
    if (token) {
      await fetchAndHydrateProfile(token);
    }
    loadUserProfile();
    
    // If from LOGIN, always go to dashboard
    if (type === "login") {
      localStorage.setItem("nutriai_onboarded", "true");
      setOnboardingDone(true);
      setOnboarding(false);
      setCurrentView("dashboard");
    } 
    // If from SIGNUP, show onboarding
    else if (type === "signup") {
      setOnboardingDone(false);
      setOnboarding(true);
    }
  }, 2200);
}


  /* Onboarding complete with full data → mark done */
  function handleOnboardingComplete(data) {
    localStorage.setItem("nutriai_profile_data", JSON.stringify(data));
    setProfileData(prev => ({ ...prev, ...data }));
    saveOnboardingData(data);
    setOnboarding(false);
    if (backTo === 'profile') {
      // Editing existing profile — go straight back, no success screen
      setCurrentView('profile');
    } else {
      // First-time onboarding — show success screen
      setShowSuccessScreen(true);
    }
    window.scrollTo(0, 0);
  }

  function handleSuccessComplete() {
    localStorage.setItem("nutriai_onboarded", "true");
    setShowSuccessScreen(false);
    setOnboardingDone(true);
    setCurrentView("dashboard");
  }

  /* "Complete Profile" / "Edit Profile" on Profile page → reopen Onboarding pre-filled */
  function handleCompleteProfile() {
    setBackTo("profile");
    setOnboarding(true);
  }

  function handleOnboardingBack(target) {
    setOnboarding(false);
    if (backTo === 'profile') {
      // Cancel from edit mode — just return to profile
      setCurrentView('profile');
    } else if (target === "signup") openSignup();
    else if (target === "login") openLogin();
  }

  function handleLogout() {
    localStorage.removeItem("nutriai_onboarded");
    localStorage.removeItem("nutriai_profile_data");
    setOnboardingDone(false);
    setProfileData({});
    setCurrentView("dashboard");
  }

  return (
    <div className={dark ? "dark" : ""}>
      <div className="font-sans antialiased text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-950 transition-colors duration-300">

        {/* Landing page always rendered underneath */}
        {!onboardingDone && !showOnboarding && (
          <LandingPage
            dark={dark}
            setDark={setDark}
            onLoginClick={openLogin}
            onSignupClick={openSignup}
          />
        )}

        <LoginPage
          open={loginOpen}
          onClose={() => setLogin(false)}
          dark={dark}
          onSwitchToSignup={openSignup}
           onSubmit={() => { setLogin(false); startLoading("login"); }}
        />

        <SignupPage
          open={signupOpen}
          onClose={() => setSignup(false)}
          dark={dark}
          onSwitchToLogin={openLogin}
          onSubmit={() => { setSignup(false); startLoading("signup"); }}
        />

        <LoadingScreen visible={loading} type={loadingType} dark={dark} />

        {showOnboarding && (
          <Onboarding
            dark={dark}
            setDark={setDark}
            onComplete={handleOnboardingComplete}
            onBack={handleOnboardingBack}
            backTo={backTo}
            initialData={backTo === 'profile' && Object.keys(profileData).length > 0 ? profileData : null}
          />
        )}

        {onboardingDone && !showOnboarding && (
          <MainLayout
            dark={dark}
            setDark={setDark}
            profileData={profileData}
            activeNav={currentView}
            onNavigate={setCurrentView}
            onLogout={handleLogout}
            onUpgrade={() => setCurrentView('plans')}
            onOpenReport={() => setShowReport(true)}
            cartCount={cartCount}
          >
            {currentView === 'dashboard' && <Dashboard dark={dark} onOpenReport={() => setShowReport(true)} profileComplete={getProfileCompletion(profileData) === 100} />}
            {currentView === 'meal-logs' && <MealLogs dark={dark} />}
            {currentView === 'nia' && <Nia dark={dark} profileData={profileData} niaMsgs={niaMsgs} setNiaMsgs={setNiaMsgs} />}
            {currentView === 'store' && <NutriStore dark={dark} onCartChange={setCartCount} />}
            {(currentView === 'profile' || currentView === 'plans' || currentView === 'settings') && (
              <Profile
                dark={dark}
                profileData={profileData}
                onboardingDone={onboardingDone}
                onCompleteProfile={handleCompleteProfile}
                activeTab={currentView}
              />
            )}
          </MainLayout>
        )}

        {/* Success Transition Screen */}
        {showSuccessScreen && <SuccessScreen dark={dark} onGetStarted={handleSuccessComplete} />}

        {/* Weekly Report Modal */}
        {showReport && (
          <Suspense fallback={null}>
            <WeeklyReportModal onClose={() => setShowReport(false)} />
          </Suspense>
        )}
      </div>
    </div>
  );
}
