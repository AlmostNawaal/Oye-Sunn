-- ══════════════════════════════════════════════════════════════════
--  Oye Sunn! — Supabase Database Setup
--  Run this entire script in:
--  Supabase Dashboard → SQL Editor → New Query → Paste → Run
-- ══════════════════════════════════════════════════════════════════

-- ─── 1. PROFILES ─────────────────────────────────────────────────
CREATE TABLE public.profiles (
  id           UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username     TEXT UNIQUE NOT NULL,
  nickname     TEXT NOT NULL,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ─── 2. REMINDERS ────────────────────────────────────────────────
CREATE TABLE public.reminders (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  location      TEXT,
  latitude      FLOAT8,
  longitude     FLOAT8,
  proximity     TEXT,
  radius        INTEGER DEFAULT 200,
  notes         TEXT,
  all_day       BOOLEAN DEFAULT TRUE,
  start_time    TEXT,
  end_time      TEXT,
  active_days   TEXT[] DEFAULT '{}',
  always_active BOOLEAN DEFAULT TRUE,
  is_active     BOOLEAN DEFAULT TRUE,
  is_done       BOOLEAN DEFAULT FALSE,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own reminders"
  ON public.reminders FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ─── 3. SETTINGS ─────────────────────────────────────────────────
CREATE TABLE public.settings (
  user_id             UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  location_pings      BOOLEAN DEFAULT TRUE,
  time_constraints    BOOLEAN DEFAULT TRUE,
  push_notifications  BOOLEAN DEFAULT TRUE
);

ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own settings"
  ON public.settings FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ══════════════════════════════════════════════════════════════════
-- IMPORTANT: After running this SQL, go to:
--   Authentication → Settings → "Enable email confirmations" → OFF
-- This is required because the app uses internal emails, not real ones.
-- ══════════════════════════════════════════════════════════════════
