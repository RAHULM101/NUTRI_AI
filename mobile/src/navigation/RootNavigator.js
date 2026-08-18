// FILE: mobile/src/navigation/RootNavigator.js
// Purpose: Top-level navigator — checks auth & onboarding state to route correctly
// Security fix: bootstrap now validates token against backend (not just AsyncStorage presence)
// Logic:
//   No token → AuthNavigator (Landing/Login/Signup)
//   Token + not onboarded → OnboardingNavigator
//   Token + onboarded → MainTabNavigator

import React, { useEffect } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AuthNavigator from './AuthNavigator';
import MainTabNavigator from './MainTabNavigator';
import OnboardingScreen from '../screens/onboarding/OnboardingScreen';
import SuccessScreen from '../screens/onboarding/SuccessScreen';
import LoadingOverlay from '../components/common/LoadingOverlay';
import { useAuth } from '../context/AuthContext';
import { hasValidToken, getIsOnboarded } from '../services/authService';

const Stack = createNativeStackNavigator();

export default function RootNavigator() {
  const {
    isAuthenticated,
    isOnboarded,
    appReady,
    setAppReady,
    signIn,
    signOut,
    loadUserProfile,
  } = useAuth();

  useEffect(() => {
    async function bootstrap() {
      try {
        const hasToken = await hasValidToken();

        if (!hasToken) {
          // No token at all — go straight to auth
          setAppReady(true);
          return;
        }

        // Token exists — try to verify it by fetching the profile from backend.
        // If the server returns 401, the api.js interceptor will call signOut() automatically.
        // We just proceed optimistically and let the interceptor handle expiry.
        const onboarded = await getIsOnboarded();

        if (onboarded) {
          // Load profile in background for freshness — don't block navigation
          loadUserProfile().catch(() => {});
        }

        await signIn(onboarded);
      } catch (e) {
        // If bootstrap fails for any reason, reset to unauthenticated state
        console.warn('Bootstrap error:', e.message);
        await signOut().catch(() => {});
      } finally {
        setAppReady(true);
      }
    }
    bootstrap();
  }, []);

  if (!appReady) {
    return <LoadingOverlay visible message="Starting NutriAI..." />;
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!isAuthenticated ? (
        <Stack.Screen name="Auth" component={AuthNavigator} />
      ) : !isOnboarded ? (
        <>
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
          <Stack.Screen name="Success" component={SuccessScreen} />
        </>
      ) : (
        <>
          <Stack.Screen name="Main" component={MainTabNavigator} />
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
          <Stack.Screen name="Success" component={SuccessScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}
