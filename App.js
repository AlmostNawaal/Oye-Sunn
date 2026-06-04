import React, { useEffect } from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppProvider, useApp } from './src/context/AppContext';
import Colors from './src/theme/colors';

import GeofenceService from './src/services/GeofenceService';


import WelcomeScreen from './src/screens/WelcomeScreen';
import HomeScreen from './src/screens/HomeScreen';
import NewReminderScreen from './src/screens/NewReminderScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import AllRemindersScreen from './src/screens/AllRemindersScreen';

const Stack = createNativeStackNavigator();

function AppNavigator() {
  const { isRegistered, loading } = useApp();

  useEffect(() => {
    if (!loading && isRegistered) {
      GeofenceService.requestAllPermissions().then((result) => {
        console.log('Permissions result:', result);
      });
    }
  }, [loading, isRegistered]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.accentOrange} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
          contentStyle: { backgroundColor: Colors.backgroundLight },
        }}
        initialRouteName={isRegistered ? 'Home' : 'Welcome'}
      >
        <Stack.Screen name="Welcome" component={WelcomeScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="NewReminder" component={NewReminderScreen} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
        <Stack.Screen name="AllReminders" component={AllRemindersScreen} />
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

