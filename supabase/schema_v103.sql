-- Migration v1.03: Add remarks column to profiles and rename legacy journey step names

-- Add remarks text field to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS remarks TEXT;

-- Rename legacy journey step names to match updated CSV-based field names
UPDATE journey_steps SET step_name = 'Biometrics Completed' WHERE step_name = 'Biometrics';
UPDATE journey_steps SET step_name = 'Medical Completed' WHERE step_name = 'Medical';
UPDATE journey_steps SET step_name = 'Final Decision' WHERE step_name = 'Decision Made';
UPDATE journey_steps SET step_name = 'ECOPR' WHERE step_name = 'COPR';

-- Note: 'Additional Documents' maps to 'ADR (If Any) / Return Date'
UPDATE journey_steps SET step_name = 'ADR (If Any) / Return Date' WHERE step_name = 'Additional Documents';

-- Note: 'Background Check' does not have a direct 1:1 mapping in the new fields.
-- It is preserved as-is; operators may manually re-assign if needed.
