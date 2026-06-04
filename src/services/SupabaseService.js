import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../config/keys';

// ─── CLIENT ──────────────────────────────────────────────────────────────────
// AsyncStorage is used for session persistence so the user stays logged in
// across app restarts. This is the Supabase-recommended approach for React Native.
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// ─── HELPERS ─────────────────────────────────────────────────────────────────
// Map a username to an internal email so Supabase Auth is satisfied.
// Users never see or enter this email — they only see their username.
const toInternalEmail = (username) =>
  `${username.toLowerCase().trim()}@oyesunn.internal`;

// ─── REMINDER SHAPE TRANSFORMS ───────────────────────────────────────────────
// Converts camelCase app object → snake_case DB row
export function toDbReminder(reminder) {
  return {
    name: reminder.name,
    location: reminder.location,
    latitude: reminder.latitude,
    longitude: reminder.longitude,
    proximity: reminder.proximity,
    radius: reminder.radius,
    notes: reminder.notes || null,
    all_day: reminder.allDay,
    start_time: reminder.startTime || null,
    end_time: reminder.endTime || null,
    active_days: reminder.activeDays || [],
    always_active: reminder.alwaysActive,
    is_active: reminder.isActive !== undefined ? reminder.isActive : true,
    is_done: reminder.isDone !== undefined ? reminder.isDone : false,
  };
}

// Converts snake_case DB row → camelCase app object
export function fromDbReminder(row) {
  return {
    id: row.id,
    name: row.name,
    location: row.location,
    latitude: row.latitude,
    longitude: row.longitude,
    proximity: row.proximity,
    radius: row.radius,
    notes: row.notes || '',
    allDay: row.all_day,
    startTime: row.start_time,
    endTime: row.end_time,
    activeDays: row.active_days || [],
    alwaysActive: row.always_active,
    isActive: row.is_active,
    isDone: row.is_done,
    createdAt: row.created_at,
  };
}

// ─── AUTH ────────────────────────────────────────────────────────────────────
export async function signUp(username, password, nickname) {
  const email = toInternalEmail(username);
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;

  const userId = data.user.id;
  const displayName = (nickname || username).trim();

  // Create profile row — links to auth.users via id
  const { error: profileError } = await supabase.from('profiles').insert({
    id: userId,
    username: username.toLowerCase().trim(),
    nickname: displayName,
  });
  if (profileError) throw profileError;

  // Create default settings row
  const { error: settingsError } = await supabase.from('settings').insert({
    user_id: userId,
    location_pings: true,
    time_constraints: true,
    push_notifications: true,
  });
  if (settingsError) throw settingsError;

  return data.user;
}

export async function signIn(username, password) {
  const email = toInternalEmail(username);
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
  return data.user;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getSession() {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session;
}

// ─── PROFILE ─────────────────────────────────────────────────────────────────
export async function fetchProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  if (error) throw error;
  return data;
}

export async function updateProfileNickname(userId, nickname) {
  const { error } = await supabase
    .from('profiles')
    .update({ nickname: nickname.trim() })
    .eq('id', userId);
  if (error) throw error;
}

// ─── REMINDERS ───────────────────────────────────────────────────────────────
export async function fetchRemindersDB(userId) {
  const { data, error } = await supabase
    .from('reminders')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data || []).map(fromDbReminder);
}

export async function addReminderDB(userId, reminder) {
  const { data, error } = await supabase
    .from('reminders')
    .insert({ ...toDbReminder(reminder), user_id: userId })
    .select()
    .single();
  if (error) throw error;
  return fromDbReminder(data);
}

export async function updateReminderDB(id, updates) {
  // Translate only the fields that were provided
  const dbUpdates = {};
  if (updates.name !== undefined) dbUpdates.name = updates.name;
  if (updates.isActive !== undefined) dbUpdates.is_active = updates.isActive;
  if (updates.isDone !== undefined) dbUpdates.is_done = updates.isDone;
  if (updates.allDay !== undefined) dbUpdates.all_day = updates.allDay;
  if (updates.startTime !== undefined) dbUpdates.start_time = updates.startTime;
  if (updates.endTime !== undefined) dbUpdates.end_time = updates.endTime;
  if (updates.activeDays !== undefined) dbUpdates.active_days = updates.activeDays;
  if (updates.alwaysActive !== undefined) dbUpdates.always_active = updates.alwaysActive;
  if (updates.proximity !== undefined) dbUpdates.proximity = updates.proximity;
  if (updates.radius !== undefined) dbUpdates.radius = updates.radius;
  if (updates.notes !== undefined) dbUpdates.notes = updates.notes;
  if (updates.location !== undefined) dbUpdates.location = updates.location;
  if (updates.latitude !== undefined) dbUpdates.latitude = updates.latitude;
  if (updates.longitude !== undefined) dbUpdates.longitude = updates.longitude;

  const { error } = await supabase
    .from('reminders')
    .update(dbUpdates)
    .eq('id', id);
  if (error) throw error;
}

export async function deleteReminderDB(id) {
  const { error } = await supabase.from('reminders').delete().eq('id', id);
  if (error) throw error;
}

// ─── SETTINGS ────────────────────────────────────────────────────────────────
export async function fetchSettingsDB(userId) {
  const { data, error } = await supabase
    .from('settings')
    .select('*')
    .eq('user_id', userId)
    .single();
  if (error) throw error;
  return {
    locationPings: data.location_pings,
    timeConstraints: data.time_constraints,
    pushNotifications: data.push_notifications,
  };
}

export async function updateSettingsDB(userId, settings) {
  const dbSettings = {};
  if (settings.locationPings !== undefined)
    dbSettings.location_pings = settings.locationPings;
  if (settings.timeConstraints !== undefined)
    dbSettings.time_constraints = settings.timeConstraints;
  if (settings.pushNotifications !== undefined)
    dbSettings.push_notifications = settings.pushNotifications;

  const { error } = await supabase
    .from('settings')
    .update(dbSettings)
    .eq('user_id', userId);
  if (error) throw error;
}

export default supabase;
