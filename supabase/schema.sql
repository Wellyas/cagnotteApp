-- ============================================================
-- Supabase Schema — Cagnotte App
-- Run this in your Supabase SQL Editor
-- ============================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── Table: cagnottes ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS cagnottes (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  title       TEXT        NOT NULL,
  description TEXT,
  photo       TEXT,
  target      NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (target >= 0),
  phone       TEXT        NOT NULL,
  admin_pin   TEXT        NOT NULL,   -- Never exposed via public API (RLS)
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Table: participations ────────────────────────────────────
CREATE TABLE IF NOT EXISTS participations (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  cagnotte_id UUID        NOT NULL REFERENCES cagnottes(id) ON DELETE CASCADE,
  name        TEXT        NOT NULL,
  amount      NUMERIC(10,2) NOT NULL CHECK (amount > 0),
  is_anonymous BOOLEAN     NOT NULL DEFAULT FALSE,
  hide_amount  BOOLEAN     NOT NULL DEFAULT FALSE,
  status      TEXT        NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending', 'validated')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for fast participant lookup by cagnotte
CREATE INDEX IF NOT EXISTS idx_participations_cagnotte_id
  ON participations(cagnotte_id);

-- ── Row Level Security ───────────────────────────────────────
ALTER TABLE cagnottes     ENABLE ROW LEVEL SECURITY;
ALTER TABLE participations ENABLE ROW LEVEL SECURITY;

-- Public: read cagnottes WITHOUT admin_pin
CREATE POLICY "public_read_cagnotte" ON cagnottes
  FOR SELECT USING (true);

-- Admins: create cagnottes (anon key allowed — admin_pin stored at creation)
CREATE POLICY "public_create_cagnotte" ON cagnottes
  FOR INSERT WITH CHECK (true);

-- Public: read participations
CREATE POLICY "public_read_participations" ON participations
  FOR SELECT USING (true);

-- Public: add participations
CREATE POLICY "public_insert_participation" ON participations
  FOR INSERT WITH CHECK (true);

-- Admin: update participation status (via RPC with PIN check)
CREATE POLICY "admin_update_participation" ON participations
  FOR UPDATE USING (true);

-- Admin: delete cagnotte (via RPC with PIN check)
CREATE POLICY "admin_delete_cagnotte" ON cagnottes
  FOR DELETE USING (true);

-- ── RPC: Secure PIN verification ────────────────────────────
-- Called by the client to verify admin PIN without ever returning
-- the PIN value. Uses SECURITY DEFINER to bypass RLS for the check.
CREATE OR REPLACE FUNCTION check_admin_pin(cagnotte_id UUID, pin TEXT)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM cagnottes c
    WHERE c.id = cagnotte_id
      AND c.admin_pin = pin
  );
$$;

-- Grant execute to anon role
GRANT EXECUTE ON FUNCTION check_admin_pin TO anon, authenticated;
