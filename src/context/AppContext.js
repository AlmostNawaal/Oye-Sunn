import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { registerAllGeofences } from '../services/GeofenceService';
import {
  supabase,
  signIn,
  signUp,
  signOut,
  getSession,
  fetchProfile,
  updateProfileNickname,
  fetchRemindersDB,
  addReminderDB,
  updateReminderDB,
  deleteReminderDB,
  fetchSettingsDB,
  updateSettingsDB,
} from '../services/SupabaseService';

const AppContext = createContext();

// AsyncStorage key for geofence background task.
// The background task cannot use Supabase/network — we keep a local cache in sync.
const GEOFENCE_CACHE_KEY = '@oyeesun_reminders';

const defaultSettings = {
  locationPings: true,
  timeConstraints: true,
  pushNotifications: true,
};

export function AppProvider({ children }) {
  const [user, setUser] = useState(null);
  const [nickname, setNickname] = useState('');
  const [reminders, setReminders] = useState([]);
  const [settings, setSettings] = useState(defaultSettings);
  // `loading` is TRUE only during the INITIAL session restoration check.
  // Login/register screens manage their own loading spinners locally.
  const [loading, setLoading] = useState(true);

  // ─── LOAD USER DATA FROM SUPABASE ──────────────────────────────────────────
  const loadUserData = async (userId) => {
    try {
      const [profile, remindersData, settingsData] = await Promise.all([
        fetchProfile(userId),
        fetchRemindersDB(userId),
        fetchSettingsDB(userId),
      ]);
      setNickname(profile.nickname || profile.username);
      setReminders(remindersData);
      setSettings(settingsData);
      // Sync geofence cache so background task stays current
      await AsyncStorage.setItem(GEOFENCE_CACHE_KEY, JSON.stringify(remindersData));
    } catch (error) {
      console.log('AppContext: Error loading user data:', error.message);
      // Even on error we still have the user set — they're logged in but
      // data may be empty (e.g. tables not created yet). That's OK.
    }
  };

  // ─── AUTH STATE ────────────────────────────────────────────────────────────
  useEffect(() => {
    // Check for existing session on first mount
    getSession().then(async (session) => {
      if (session?.user) {
        setUser(session.user);
        await loadUserData(session.user.id);
      }
      // Always mark initial load done
      setLoading(false);
    });

    // Only react to SIGNED_OUT — login/register handle SIGNED_IN explicitly.
    // This avoids the bug where email-confirmation flows fire with no session
    // and accidentally clear the user state mid-login.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (_event === 'SIGNED_OUT') {
          setUser(null);
          setNickname('');
          setReminders([]);
          setSettings(defaultSettings);
        }
        // TOKEN_REFRESHED: Supabase handles internally; no action needed here.
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // ─── AUTH ACTIONS ──────────────────────────────────────────────────────────
  // Note: login() and register() do NOT touch the global `loading` state.
  // The App.js auth pattern switches screens automatically when `user` is set.

  const login = async (username, password) => {
    const authUser = await signIn(username, password);
    setUser(authUser);
    // Load data in the background — Home screen will update once ready
    loadUserData(authUser.id);
    return authUser;
  };

  const register = async (username, password, nicknameInput) => {
    const authUser = await signUp(username, password, nicknameInput);
    setUser(authUser);
    setNickname((nicknameInput || username).trim());
    setReminders([]);
    setSettings(defaultSettings);
    return authUser;
  };

  const logout = async () => {
    await signOut();
    // SIGNED_OUT listener handles the state clear
    await AsyncStorage.removeItem(GEOFENCE_CACHE_KEY);
  };

  // ─── PROFILE ───────────────────────────────────────────────────────────────
  const updateNickname = async (name) => {
    if (!user) return;
    await updateProfileNickname(user.id, name);
    setNickname(name.trim());
  };

  // ─── REMINDER CRUD ─────────────────────────────────────────────────────────
  const addReminder = async (reminder) => {
    if (!user) return;
    const newReminder = await addReminderDB(user.id, reminder);
    const updated = [...reminders, newReminder];
    setReminders(updated);
    await AsyncStorage.setItem(GEOFENCE_CACHE_KEY, JSON.stringify(updated));
    await registerAllGeofences(updated);
    return newReminder;
  };

  const updateReminder = async (id, updates) => {
    await updateReminderDB(id, updates);
    const updated = reminders.map((r) =>
      r.id === id ? { ...r, ...updates } : r
    );
    setReminders(updated);
    await AsyncStorage.setItem(GEOFENCE_CACHE_KEY, JSON.stringify(updated));
    await registerAllGeofences(updated);
  };

  const deleteReminder = async (id) => {
    await deleteReminderDB(id);
    const updated = reminders.filter((r) => r.id !== id);
    setReminders(updated);
    await AsyncStorage.setItem(GEOFENCE_CACHE_KEY, JSON.stringify(updated));
    await registerAllGeofences(updated);
  };

  const markReminderDone = async (id) => {
    await updateReminder(id, { isDone: true, isActive: false });
  };

  // ─── SETTINGS ──────────────────────────────────────────────────────────────
  const updateSettings = async (newSettings) => {
    if (!user) return;
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    await updateSettingsDB(user.id, newSettings);
  };

  const activeReminders = reminders.filter((r) => r.isActive && !r.isDone);

  return (
    <AppContext.Provider
      value={{
        user,
        nickname,
        isLoggedIn: !!user,
        isRegistered: !!user, // backward compat alias
        reminders,
        activeReminders,
        settings,
        loading,
        login,
        register,
        updateNickname,
        addReminder,
        updateReminder,
        deleteReminder,
        markReminderDone,
        updateSettings,
        logout,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}

export default AppContext;
