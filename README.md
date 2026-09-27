# LeDoctor — Healthcare Platform

LeDoctor is a commercial-grade, multi-role healthcare application connecting patients with verified medical doctors. Built with pure **JavaScript**, real-time **Supabase** PostgreSQL backend, **Next.js** web dashboards, **React Native / Expo** mobile application, **Cloudflare Workers** edge gateway, and a **Python FastAPI** AI microservice.

---

## 🎨 UI & Screens Architecture

Every screen from the design reference is implemented with exact visual fidelity:

### 1. Patient Mobile App (`mobile/`) — 11 Screens
1. **Splash Screen**: LeDoctor branding with medical cross shield badge.
2. **Onboarding Screen**: Modern medical illustration, *"Better Healthcare For A Healthier You"*, carousel indicators, `[Get Started]`.
3. **Choose Your Role Screen**: Switch seamlessly between `[I am a Patient]` and `[I am a Doctor]`.
4. **Patient Home Screen**: Greeting (`Good morning, Allan 👋`), search bar, specializations grid (Cardiology, Dermatology, Neurology, Orthopedics), promotional banner, upcoming appointment with `[Join]` action.
5. **Doctor Search Screen**: Filter chips, real-time query, doctor cards with ratings, consultation fees, and next available slots.
6. **Doctor Profile Screen**: Hero photo, verified doctor badge, qualifications, languages, tabs (`About`, `Reviews`, `Availability`), clinic details, `[Book Appointment]` CTA.
7. **Book Appointment Slot Screen**: Date selector strip (Mon 25 — Fri 29), morning, afternoon, and evening slot picker, `[Continue]`.
8. **Payment Screen**: Doctor mini summary, Razorpay Secured badge, payment method selector (Card, UPI, Net Banking, Wallets), `[Pay ₹800]`.
9. **Appointment Confirmed Screen**: Emerald checkmark, appointment details, `[Add to Calendar]`, `[View Details]`, `[Go to Home]`.
10. **Video Consultation Screen**: High-definition Agora RTC video consultation, live timer (`04:12`), PiP patient self-preview, floating controls (Mic, Camera, Switch, End Call).
11. **Prescription View Screen**: Diagnosis (*"Mild Hypertension"*), clinical instructions, structured medication table, follow-up date, `[Download PDF]`.

### 2. Doctor Mobile App (`mobile/`) — 7 Screens
1. **Doctor Dashboard**: Header greeting (`Good morning, Dr. Sarah 👋`), 4 overview cards (Appointments `8`, Pending `3`, Completed `12`, Earnings `₹4,500`), live queue.
2. **Doctor Appointments Management**: Filter tabs (`All`, `Pending`, `Upcoming`, `Completed`), direct `[Accept]` and `[Reject]` actions on pending requests.
3. **Patient Details Screen**: Patient profile, blood group (`O+`), emergency contact, medical records tab, `[Message]` and `[Start Consultation]`.
4. **Doctor Video Call Screen**: Full-screen patient view, doctor PiP, call timer, `[Rx Write]` quick prescription action.
5. **Create Prescription Screen**: Clinical diagnosis input, lifestyle instructions, dynamic medication builder with `+ Add Medicine`, follow-up date, `[Create Prescription]`.
6. **Doctor Earnings Screen**: Total earnings banner (`₹45,280`), monthly bar chart (Jan — Jun), recent payment ledger.
7. **Doctor Messages Screen**: Filter tabs (`All`, `Unread`), conversation list with timestamps, interactive two-way consultation messaging.

### 3. Web Dashboards (`web/`) — Next.js + Tailwind CSS
1. **Admin Overview**: Top metrics (Total Patients `2,840`, Total Doctors `164`, Pending Verification `12`, Today's Appointments `48`), SVG curved area chart (Appointments Over Time), Revenue bar chart, real-time activity stream.
2. **Doctor Verification Portal**: Filter tabs (`Pending`, `Verified`, `Rejected`), license inspection, `[View Documents]` dossier modal, `[Verify]` and `[Reject]` actions.
3. **Appointments Management**: Global table with patient, doctor, date/time, type (Video, Audio, In-Person), status pills, and payment statuses.
4. **Payments & Revenue Ledger**: Metric cards, transaction logs with Razorpay order IDs.
5. **Doctor Web Workspace**: Doctor portal to manage clinical hours, weekly slots, immediate queue, and digital prescriptions.
6. **Medical Specializations**: Catalog of specialties with icons and descriptions.
7. **Real Supabase Auth Modal**: Secure Sign In and Sign Up for Patient, Doctor, and Admin roles.

---

## 🗄️ Database & Security (`supabase/`)

### Setup in 1 Click:
Run [`supabase/setup.sql`](file:///Users/apple/Desktop/LeDoctor/supabase/setup.sql) in your Supabase SQL Editor.

It creates:
- 15 PostgreSQL tables with UUID keys, timestamps, and indexes.
- Strict Row Level Security (RLS) policies protecting patient privacy.
- Storage buckets (`medical-records`, `doctor-documents`, `avatars`, `prescriptions`).
- Auth triggers to automatically initialize patient and doctor profiles.
- Pre-populated medical specialties (Cardiology, Dermatology, Neurology, Orthopedics, Pediatrics, Dentistry, Psychiatry, General Medicine, Ophthalmology, ENT).

---

## ⚡ Edge & Microservices

1. **Cloudflare Workers** (`cloudflare/workers/`):
   - `agora-token.js`: Generates secure Agora RTC video tokens.
   - `razorpay-webhook.js`: Verifies HMAC-SHA256 signatures and confirms appointments.
   - `api-gateway.js`: Edge routing, CORS, and AI proxying.
2. **FastAPI AI Microservice** (`ai-service/`):
   - Symptom assistant, medical report summarizer, and prescription explainer with mandatory medical disclaimers.

---

## 🚀 Running Locally

### 1. Web Dashboard
```bash
cd web
npm run dev
# Open http://localhost:3000
```

### 2. Mobile App (Expo)
```bash
cd mobile
npm start
```

### 3. AI Service (Python FastAPI)
```bash
cd ai-service
pip install -r requirements.txt
python main.py
```
