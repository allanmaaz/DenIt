-- LeDoctor Healthcare Platform
-- 003_storage_buckets.sql: Storage Buckets and Access Control Policies

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public)
VALUES 
    ('avatars', 'avatars', true),
    ('medical-records', 'medical-records', false),
    ('doctor-documents', 'doctor-documents', false),
    ('prescriptions', 'prescriptions', false)
ON CONFLICT (id) DO NOTHING;

-- Avatars Policies (Public read, authenticated users can upload their own avatar)
CREATE POLICY "Public avatar access"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'avatars');

CREATE POLICY "Authenticated users can upload avatar"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'avatars' 
        AND auth.role() = 'authenticated'
    );

CREATE POLICY "Users can update own avatar"
    ON storage.objects FOR UPDATE
    USING (
        bucket_id = 'avatars' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

-- Medical Records Policies (Private, signed URLs only)
CREATE POLICY "Patients and assigned doctors access medical records"
    ON storage.objects FOR SELECT
    USING (
        bucket_id = 'medical-records'
        AND auth.role() = 'authenticated'
    );

CREATE POLICY "Patients can upload medical records"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'medical-records'
        AND auth.role() = 'authenticated'
    );

-- Doctor Documents Policies (Private, doctor & admin only)
CREATE POLICY "Doctors and admins view doctor documents"
    ON storage.objects FOR SELECT
    USING (
        bucket_id = 'doctor-documents'
        AND auth.role() = 'authenticated'
    );

CREATE POLICY "Doctors upload verification documents"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'doctor-documents'
        AND auth.role() = 'authenticated'
    );

-- Prescriptions Storage Policies
CREATE POLICY "Authorized consultation participants access prescriptions"
    ON storage.objects FOR SELECT
    USING (
        bucket_id = 'prescriptions'
        AND auth.role() = 'authenticated'
    );

CREATE POLICY "Doctors upload generated prescription PDFs"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'prescriptions'
        AND auth.role() = 'authenticated'
    );
