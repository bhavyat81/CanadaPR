-- Migration v1.05: Add pvo and svo text columns to profiles table
-- These store Primary Visa Office (PVO) and Secondary Visa Office (SVO)
-- selections as plain text (city names, e.g. "Montreal", "Vancouver").

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS pvo TEXT,
  ADD COLUMN IF NOT EXISTS svo TEXT;
