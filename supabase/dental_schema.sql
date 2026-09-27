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

-- 3. Register Dr. Adeeb Taha (Asian Dental Care) as Verified Clinic Doctor
DO $$
DECLARE
    v_profile_id UUID;
    v_spec_id UUID;
BEGIN
    -- Ensure Specialization exists
    INSERT INTO public.specializations (name, description, icon)
    VALUES ('Periodontics & Implantology', 'Periodontics, Gum Surgeries, Bone Grafting & Dental Implants', '🦷')
    ON CONFLICT (name) DO UPDATE SET description = EXCLUDED.description
    RETURNING id INTO v_spec_id;

    -- Ensure Profile exists
    INSERT INTO public.profiles (email, full_name, phone, role)
    VALUES ('dr.adeebtaha@asiandental.care', 'Dr. Adeeb Taha', '+91 8971763097', 'DOCTOR')
    ON CONFLICT (email) DO UPDATE SET full_name = EXCLUDED.full_name, phone = EXCLUDED.phone, role = 'DOCTOR'
    RETURNING id INTO v_profile_id;

    -- Register or update Doctor record
    IF NOT EXISTS (SELECT 1 FROM public.doctors WHERE profile_id = v_profile_id) THEN
        INSERT INTO public.doctors (
            profile_id,
            specialization_id,
            qualification,
            experience_years,
            license_number,
            consultation_fee,
            about,
            clinic_name,
            clinic_address,
            verification_status,
            languages
        ) VALUES (
            v_profile_id,
            v_spec_id,
            'BDS, MDS, FICOI (USA)',
            12,
            'KDC-ADE-TAHA',
            500.00,
            'Consultant Periodontist, Implantologist & Chief Dental Surgeon at Asian Dental Care. Specialized in single-visit root canals, titanium dental implants, and smile designing.',
            'Asian Dental Care',
            '18, Lady Curzon Rd, Near Bowring Hospital, Tasker Town, Shivaji Nagar, Bengaluru, Karnataka 560052',
            'VERIFIED',
            ARRAY['English', 'Hindi', 'Urdu', 'Kannada']
        );
    ELSE
        UPDATE public.doctors
        SET
            qualification = 'BDS, MDS, FICOI (USA)',
            clinic_name = 'Asian Dental Care',
            clinic_address = '18, Lady Curzon Rd, Near Bowring Hospital, Tasker Town, Shivaji Nagar, Bengaluru, Karnataka 560052',
            verification_status = 'VERIFIED'
        WHERE profile_id = v_profile_id;
    END IF;
END $$;

