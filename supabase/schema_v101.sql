-- Migration: v1.01 – Category-based groups + PR Journey Tracker
-- Run this in Supabase SQL Editor after the initial schema.sql

-- 1. Add pr_category column to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS pr_category TEXT;

-- 2. Create journey_steps table
CREATE TABLE IF NOT EXISTS journey_steps (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  step_name TEXT NOT NULL,
  step_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, step_name)
);

ALTER TABLE journey_steps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all journey steps"
  ON journey_steps FOR SELECT USING (true);

CREATE POLICY "Users can insert own journey steps"
  ON journey_steps FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own journey steps"
  ON journey_steps FOR UPDATE USING (auth.uid() = user_id);
