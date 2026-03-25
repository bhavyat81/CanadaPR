-- Migration v1.04: Change step_date column from DATE to TEXT
-- This allows PVO (Inland) and SVO (Inland) steps to store visa office city names
-- (e.g. "Montreal", "Vancouver") instead of date values.

ALTER TABLE journey_steps ALTER COLUMN step_date TYPE TEXT;
