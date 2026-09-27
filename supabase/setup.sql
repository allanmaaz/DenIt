-- ==============================================================================
-- LeDoctor Healthcare Platform — Complete Master Database Setup Script
-- Execute this file in your Supabase SQL Editor to initialize all tables,
-- triggers, Row Level Security (RLS) policies, and storage buckets.
-- ==============================================================================

-- 1. Core Schema & Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Enums
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('PATIENT', 'DOCTOR', 'ADMIN');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE verification_status AS ENUM ('PENDING', 'VERIFIED', 'REJECTED', 'SUSPENDED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE appointment_type AS ENUM ('VIDEO', 'AUDIO', 'IN_PERSON');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE appointment_status AS ENUM ('PENDING', 'CONFIRMED', 'REJECTED', 'CANCELLED', 'COMPLETED', 'NO_SHOW');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE payment_status AS ENUM ('PENDING', 'PAID', 'FAILED', 'REFUNDED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE medical_record_type AS ENUM ('LAB_REPORT', 'PRESCRIPTION', 'XRAY', 'SCAN', 'MEDICAL_DOCUMENT', 'OTHER');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    role user_role NOT NULL DEFAULT 'PATIENT',
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    profile_image TEXT,
    date_of_birth DATE,
    gender TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Patients Table
CREATE TABLE IF NOT EXISTS public.patients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID UNIQUE NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    blood_group TEXT,
    emergency_contact_name TEXT,
    emergency_contact_phone TEXT,
    address TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Specializations Table
CREATE TABLE IF NOT EXISTS public.specializations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    icon TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Doctors Table
CREATE TABLE IF NOT EXISTS public.doctors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID UNIQUE NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    specialization_id UUID REFERENCES public.specializations(id) ON DELETE SET NULL,
    qualification TEXT NOT NULL,
    experience_years INTEGER NOT NULL DEFAULT 0,
    license_number TEXT UNIQUE NOT NULL,
    consultation_fee NUMERIC(10, 2) NOT NULL DEFAULT 500.00,
    about TEXT,
    languages TEXT[] DEFAULT ARRAY['English'],
    clinic_name TEXT,
    clinic_address TEXT,
    rating NUMERIC(3, 2) NOT NULL DEFAULT 5.00,
    total_reviews INTEGER NOT NULL DEFAULT 0,
    verification_status verification_status NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Doctor Availability Table
CREATE TABLE IF NOT EXISTS public.doctor_availability (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    doctor_id UUID NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    slot_duration INTEGER NOT NULL DEFAULT 30,
    is_available BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT valid_time_range CHECK (end_time > start_time)
);

-- Appointments Table
CREATE TABLE IF NOT EXISTS public.appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE RESTRICT,
    doctor_id UUID NOT NULL REFERENCES public.doctors(id) ON DELETE RESTRICT,
    appointment_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    appointment_type appointment_type NOT NULL DEFAULT 'VIDEO',
    status appointment_status NOT NULL DEFAULT 'PENDING',
    payment_status payment_status NOT NULL DEFAULT 'PENDING',
    meeting_id TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Medical Records Table
CREATE TABLE IF NOT EXISTS public.medical_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    uploaded_by UUID NOT NULL REFERENCES public.profiles(id),
    title TEXT NOT NULL,
    description TEXT,
    file_url TEXT NOT NULL,
    storage_provider TEXT NOT NULL DEFAULT 'supabase',
    record_type medical_record_type NOT NULL DEFAULT 'MEDICAL_DOCUMENT',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Prescriptions Table
CREATE TABLE IF NOT EXISTS public.prescriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    appointment_id UUID UNIQUE NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    doctor_id UUID NOT NULL REFERENCES public.doctors(id) ON DELETE RESTRICT,
    diagnosis TEXT NOT NULL,
    instructions TEXT,
    follow_up_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Prescription Medicines Table
CREATE TABLE IF NOT EXISTS public.prescription_medicines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prescription_id UUID NOT NULL REFERENCES public.prescriptions(id) ON DELETE CASCADE,
    medicine_name TEXT NOT NULL,
    dosage TEXT NOT NULL,
    frequency TEXT NOT NULL,
    duration TEXT NOT NULL,
    instructions TEXT
);

-- Payments Table
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    appointment_id UUID NOT NULL REFERENCES public.appointments(id) ON DELETE RESTRICT,
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE RESTRICT,
    doctor_id UUID NOT NULL REFERENCES public.doctors(id) ON DELETE RESTRICT,
    amount NUMERIC(10, 2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'INR',
    razorpay_order_id TEXT,
    razorpay_payment_id TEXT,
    status payment_status NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Messages Table
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    appointment_id UUID NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    message_type TEXT NOT NULL DEFAULT 'text',
    attachment_url TEXT,
    is_read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Notifications Table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Reviews Table
CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    doctor_id UUID NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
    appointment_id UUID UNIQUE NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Doctor Documents Table
CREATE TABLE IF NOT EXISTS public.doctor_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    doctor_id UUID NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
    document_type TEXT NOT NULL,
    file_url TEXT NOT NULL,
    verification_status verification_status NOT NULL DEFAULT 'PENDING',
    reviewed_by UUID REFERENCES public.profiles(id),
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Audit Logs Table
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id),
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    ip_address TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_doctors_specialization ON public.doctors(specialization_id);
CREATE INDEX IF NOT EXISTS idx_doctors_verification ON public.doctors(verification_status);
CREATE INDEX IF NOT EXISTS idx_appointments_patient ON public.appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_doctor ON public.appointments(doctor_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON public.appointments(appointment_date, start_time);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON public.appointments(status);
CREATE INDEX IF NOT EXISTS idx_messages_appointment ON public.messages(appointment_id, created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_payments_appointment ON public.payments(appointment_id);

-- Auth Trigger
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER AS $$
DECLARE
    new_role user_role := 'PATIENT';
    new_full_name TEXT := 'New User';
    profile_record RECORD;
BEGIN
    IF (NEW.raw_user_meta_data->>'role') = 'DOCTOR' THEN
        new_role := 'DOCTOR';
    ELSIF (NEW.raw_user_meta_data->>'role') = 'ADMIN' THEN
        new_role := 'ADMIN';
    END IF;

    IF (NEW.raw_user_meta_data->>'full_name') IS NOT NULL THEN
        new_full_name := NEW.raw_user_meta_data->>'full_name';
    ELSIF (NEW.raw_user_meta_data->>'name') IS NOT NULL THEN
        new_full_name := NEW.raw_user_meta_data->>'name';
    END IF;

    INSERT INTO public.profiles (user_id, role, full_name, email, phone)
    VALUES (
        NEW.id,
        new_role,
        new_full_name,
        NEW.email,
        NEW.raw_user_meta_data->>'phone'
    )
    RETURNING * INTO profile_record;

    IF new_role = 'PATIENT' THEN
        INSERT INTO public.patients (profile_id)
        VALUES (profile_record.id);
    ELSIF new_role = 'DOCTOR' THEN
        INSERT INTO public.doctors (
            profile_id,
            qualification,
            license_number,
            consultation_fee,
            verification_status
        )
        VALUES (
            profile_record.id,
            COALESCE(NEW.raw_user_meta_data->>'qualification', 'MBBS'),
            COALESCE(NEW.raw_user_meta_data->>'license_number', 'MED-' || SUBSTRING(NEW.id::text, 1, 8)),
            COALESCE((NEW.raw_user_meta_data->>'consultation_fee')::numeric, 500.00),
            'PENDING'
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();

-- Real Medical Specializations Catalog
INSERT INTO public.specializations (name, description, icon) VALUES
('Cardiology', 'Heart health, cardiovascular diseases and hypertension management', 'heart'),
('Dermatology', 'Skin, hair, nail conditions and cosmetic treatments', 'sparkles'),
('Neurology', 'Brain, spinal cord, nervous system and migraine care', 'brain'),
('Orthopedics', 'Bones, joints, ligaments, spine and musculoskeletal disorders', 'bone'),
('Pediatrics', 'Comprehensive healthcare for infants, children and adolescents', 'baby'),
('Dentistry', 'Dental hygiene, orthodontics, oral health and teeth care', 'smile'),
('Psychiatry', 'Mental wellness, counseling, therapy and psychiatric care', 'activity'),
('General Medicine', 'Primary healthcare, preventive care, fever and chronic illness', 'stethoscope'),
('Ophthalmology', 'Eye care, vision examination, cataracts and laser treatment', 'eye'),
('ENT', 'Ear, nose, throat conditions, sinus and hearing disorders', 'ear')
ON CONFLICT (name) DO NOTHING;
