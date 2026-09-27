-- ==============================================================================
-- LeDoctor — Pure Dental Database Schema (Zero Mock Data)
-- Tables, Constraints, and Row Level Security (RLS) Policies ONLY
-- ==============================================================================

-- 1. Enable RLS and Configure Access Policies on Core Tables
ALTER TABLE IF EXISTS public.specializations ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    DROP POLICY IF EXISTS "Allow public read specializations" ON public.specializations;
    CREATE POLICY "Allow public read specializations" 
    ON public.specializations FOR SELECT USING (true);
EXCEPTION WHEN undefined_table THEN null; END $$;

ALTER TABLE IF EXISTS public.doctors ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    DROP POLICY IF EXISTS "Allow public read verified doctors" ON public.doctors;
    CREATE POLICY "Allow public read verified doctors" 
    ON public.doctors FOR SELECT USING (true);
EXCEPTION WHEN undefined_table THEN null; END $$;

ALTER TABLE IF EXISTS public.profiles ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    DROP POLICY IF EXISTS "Allow public read profiles" ON public.profiles;
    CREATE POLICY "Allow public read profiles" 
    ON public.profiles FOR SELECT USING (true);
EXCEPTION WHEN undefined_table THEN null; END $$;

-- 2. Dental Treatments Table Structure (Pure DDL - Zero Mock Rows)
CREATE TABLE IF NOT EXISTS public.dental_treatments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category TEXT NOT NULL,
    procedure_name TEXT NOT NULL,
    estimated_duration_min INTEGER NOT NULL DEFAULT 30,
    price_estimate NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.dental_treatments ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    DROP POLICY IF EXISTS "Allow public read dental treatments" ON public.dental_treatments;
    CREATE POLICY "Allow public read dental treatments" 
    ON public.dental_treatments FOR SELECT USING (true);
EXCEPTION WHEN undefined_table THEN null; END $$;

DO $$ BEGIN
    DROP POLICY IF EXISTS "Allow authenticated doctors to manage dental treatments" ON public.dental_treatments;
    CREATE POLICY "Allow authenticated doctors to manage dental treatments" 
    ON public.dental_treatments FOR ALL 
    USING (auth.role() = 'authenticated');
EXCEPTION WHEN undefined_table THEN null; END $$;
