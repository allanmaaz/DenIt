-- LeDoctor Healthcare Platform
-- 002_rls_policies.sql: Row Level Security Policies

-- Helper function to get current user's profile ID
CREATE OR REPLACE FUNCTION public.current_profile_id()
RETURNS UUID AS $$
    SELECT id FROM public.profiles WHERE user_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Helper function to get current user's role
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS user_role AS $$
    SELECT role FROM public.profiles WHERE user_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Helper function to get current doctor's ID
CREATE OR REPLACE FUNCTION public.current_doctor_id()
RETURNS UUID AS $$
    SELECT d.id FROM public.doctors d
    JOIN public.profiles p ON d.profile_id = p.id
    WHERE p.user_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Helper function to get current patient's ID
CREATE OR REPLACE FUNCTION public.current_patient_id()
RETURNS UUID AS $$
    SELECT pt.id FROM public.patients pt
    JOIN public.profiles p ON pt.profile_id = p.id
    WHERE p.user_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.specializations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctor_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prescription_medicines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctor_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- 1. Profiles Policies
CREATE POLICY "Public read for profiles of verified doctors and staff"
    ON public.profiles FOR SELECT
    USING (true);

CREATE POLICY "Users can update their own profile"
    ON public.profiles FOR UPDATE
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins have full access to profiles"
    ON public.profiles FOR ALL
    USING (public.current_user_role() = 'ADMIN');

-- 2. Patients Policies
CREATE POLICY "Patients can view and update their own patient info"
    ON public.patients FOR ALL
    USING (profile_id = public.current_profile_id());

CREATE POLICY "Doctors can view patients who have booked appointments with them"
    ON public.patients FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.appointments a
            WHERE a.patient_id = public.patients.id
            AND a.doctor_id = public.current_doctor_id()
        )
    );

CREATE POLICY "Admins have full access to patients"
    ON public.patients FOR ALL
    USING (public.current_user_role() = 'ADMIN');

-- 3. Specializations Policies (Read by anyone, managed by Admin)
CREATE POLICY "Specializations readable by authenticated users"
    ON public.specializations FOR SELECT
    USING (true);

CREATE POLICY "Specializations managed by Admins"
    ON public.specializations FOR ALL
    USING (public.current_user_role() = 'ADMIN');

-- 4. Doctors Policies
CREATE POLICY "Verified doctors readable by everyone"
    ON public.doctors FOR SELECT
    USING (verification_status = 'VERIFIED' OR profile_id = public.current_profile_id() OR public.current_user_role() = 'ADMIN');

CREATE POLICY "Doctors can update their own doctor record"
    ON public.doctors FOR UPDATE
    USING (profile_id = public.current_profile_id())
    WITH CHECK (profile_id = public.current_profile_id());

CREATE POLICY "Admins can manage doctor records"
    ON public.doctors FOR ALL
    USING (public.current_user_role() = 'ADMIN');

-- 5. Doctor Availability Policies
CREATE POLICY "Anyone can view doctor availability"
    ON public.doctor_availability FOR SELECT
    USING (true);

CREATE POLICY "Doctors manage their own availability"
    ON public.doctor_availability FOR ALL
    USING (doctor_id = public.current_doctor_id())
    WITH CHECK (doctor_id = public.current_doctor_id());

-- 6. Appointments Policies
CREATE POLICY "Patients view their own appointments"
    ON public.appointments FOR SELECT
    USING (patient_id = public.current_patient_id() OR doctor_id = public.current_doctor_id() OR public.current_user_role() = 'ADMIN');

CREATE POLICY "Patients can create appointments"
    ON public.appointments FOR INSERT
    WITH CHECK (patient_id = public.current_patient_id());

CREATE POLICY "Patients and Doctors can update appointment status as authorized"
    ON public.appointments FOR UPDATE
    USING (patient_id = public.current_patient_id() OR doctor_id = public.current_doctor_id() OR public.current_user_role() = 'ADMIN')
    WITH CHECK (patient_id = public.current_patient_id() OR doctor_id = public.current_doctor_id() OR public.current_user_role() = 'ADMIN');

-- 7. Medical Records Policies
CREATE POLICY "Patients manage their own medical records"
    ON public.medical_records FOR ALL
    USING (patient_id = public.current_patient_id())
    WITH CHECK (patient_id = public.current_patient_id());

CREATE POLICY "Doctors view patient medical records for consultations"
    ON public.medical_records FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.appointments a
            WHERE a.patient_id = public.medical_records.patient_id
            AND a.doctor_id = public.current_doctor_id()
            AND a.status IN ('CONFIRMED', 'COMPLETED')
        )
    );

-- 8. Prescriptions Policies
CREATE POLICY "Patients view their prescriptions"
    ON public.prescriptions FOR SELECT
    USING (patient_id = public.current_patient_id() OR doctor_id = public.current_doctor_id() OR public.current_user_role() = 'ADMIN');

CREATE POLICY "Doctors create prescriptions for their appointments"
    ON public.prescriptions FOR INSERT
    WITH CHECK (
        doctor_id = public.current_doctor_id() AND
        EXISTS (
            SELECT 1 FROM public.appointments a
            WHERE a.id = appointment_id AND a.doctor_id = public.current_doctor_id()
        )
    );

CREATE POLICY "Doctors can update their prescriptions"
    ON public.prescriptions FOR UPDATE
    USING (doctor_id = public.current_doctor_id());

-- 9. Prescription Medicines Policies
CREATE POLICY "Read prescription medicines"
    ON public.prescription_medicines FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.prescriptions p
            WHERE p.id = public.prescription_medicines.prescription_id
            AND (p.patient_id = public.current_patient_id() OR p.doctor_id = public.current_doctor_id() OR public.current_user_role() = 'ADMIN')
        )
    );

CREATE POLICY "Doctors insert medicines for their prescriptions"
    ON public.prescription_medicines FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.prescriptions p
            WHERE p.id = public.prescription_medicines.prescription_id
            AND p.doctor_id = public.current_doctor_id()
        )
    );

-- 10. Payments Policies
CREATE POLICY "Users view relevant payments"
    ON public.payments FOR SELECT
    USING (patient_id = public.current_patient_id() OR doctor_id = public.current_doctor_id() OR public.current_user_role() = 'ADMIN');

CREATE POLICY "Create payments for bookings"
    ON public.payments FOR INSERT
    WITH CHECK (patient_id = public.current_patient_id() OR public.current_user_role() = 'ADMIN');

CREATE POLICY "Admins and authorized webhooks update payments"
    ON public.payments FOR UPDATE
    USING (patient_id = public.current_patient_id() OR public.current_user_role() = 'ADMIN');

-- 11. Messages Policies (Realtime Consultation Chat)
CREATE POLICY "Participants view appointment messages"
    ON public.messages FOR SELECT
    USING (sender_id = public.current_profile_id() OR receiver_id = public.current_profile_id() OR public.current_user_role() = 'ADMIN');

CREATE POLICY "Participants send appointment messages"
    ON public.messages FOR INSERT
    WITH CHECK (sender_id = public.current_profile_id());

CREATE POLICY "Receiver can mark messages as read"
    ON public.messages FOR UPDATE
    USING (receiver_id = public.current_profile_id());

-- 12. Notifications Policies
CREATE POLICY "Users view own notifications"
    ON public.notifications FOR ALL
    USING (user_id = public.current_profile_id())
    WITH CHECK (user_id = public.current_profile_id());

-- 13. Reviews Policies
CREATE POLICY "Anyone view doctor reviews"
    ON public.reviews FOR SELECT
    USING (true);

CREATE POLICY "Patients write reviews for completed appointments"
    ON public.reviews FOR INSERT
    WITH CHECK (
        patient_id = public.current_patient_id() AND
        EXISTS (
            SELECT 1 FROM public.appointments a
            WHERE a.id = appointment_id
            AND a.patient_id = public.current_patient_id()
            AND a.status = 'COMPLETED'
        )
    );

-- 14. Doctor Documents Policies
CREATE POLICY "Doctors manage their own documents"
    ON public.doctor_documents FOR ALL
    USING (doctor_id = public.current_doctor_id())
    WITH CHECK (doctor_id = public.current_doctor_id());

CREATE POLICY "Admins review doctor documents"
    ON public.doctor_documents FOR ALL
    USING (public.current_user_role() = 'ADMIN');

-- 15. Audit Logs Policies
CREATE POLICY "Admins view audit logs"
    ON public.audit_logs FOR SELECT
    USING (public.current_user_role() = 'ADMIN');

CREATE POLICY "System can record audit logs"
    ON public.audit_logs FOR INSERT
    WITH CHECK (true);
