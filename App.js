import React, { useEffect } from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppProvider, useApp } from './src/context/AppContext';
import Colors from './src/theme/colors';

import GeofenceService from './src/services/GeofenceService';

import WelcomeScreen from './src/screens/WelcomeScreen';
import LoginScreen from './src/screens/LoginScreen';
import SignupScreen from './src/screens/SignupScreen';
import HomeScreen from './src/screens/HomeScreen';
import NewReminderScreen from './src/screens/NewReminderScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import AllRemindersScreen from './src/screens/AllRemindersScreen';

const Stack = createNativeStackNavigator();

// Simple inline loading screen — avoids unmounting NavigationContainer
function LoadingScreen() {
  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color={Colors.accentOrange} />
    </View>
  );
}

function AppNavigator() {
  const { isLoggedIn, loading } = useApp();

  useEffect(() => {
    if (!loading && isLoggedIn) {
      GeofenceService.requestAllPermissions().catch(() => {});
    }
  }, [loading, isLoggedIn]);

  // ─── IMPORTANT: NavigationContainer is NEVER unmounted ─────────────────────
  // We use the React Navigation auth-flow pattern: conditional screens inside
  // a single always-mounted Stack.Navigator. When isLoggedIn flips true,
  // React Navigation automatically shows Home. When it flips false, it shows
  // the auth screens. No navigation.replace() needed in Login/Signup screens.
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
          contentStyle: { backgroundColor: Colors.backgroundLight },
        }}
      >
        {loading ? (
          // ── Session check in progress ─────────────────────────────────────
          <Stack.Screen name="Loading" component={LoadingScreen} />
        ) : isLoggedIn ? (
          // ── Authenticated screens ─────────────────────────────────────────
          <>
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="NewReminder" component={NewReminderScreen} />
            <Stack.Screen name="Settings" component={SettingsScreen} />
            <Stack.Screen name="AllReminders" component={AllRemindersScreen} />
          </>
        ) : (
          // ── Auth screens ──────────────────────────────────────────────────
          <>
            <Stack.Screen name="Welcome" component={WelcomeScreen} />
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Signup" component={SignupScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AppProvider>
        <AppNavigator />
      </AppProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: Colors.backgroundDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
