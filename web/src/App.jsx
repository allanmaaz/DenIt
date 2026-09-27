import React, { useState, useEffect } from "react";
import {
  Calendar,
  Clock,
  Phone,
  MapPin,
  CheckCircle2,
  ShieldCheck,
  Video,
  Award,
  FileText,
  User,
  Activity,
  Plus,
  Trash2,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  Stethoscope,
  Search,
  MessageCircle,
  RefreshCw,
  LogOut,
  Check,
  X,
  Lock,
  Smile,
  Menu,
} from "lucide-react";
import { supabase } from "./lib/supabaseClient";

// Clean, authentic dental clinic emblem
function DentalToothIcon({ className = "w-6 h-6" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path
        d="M7 3C4.2 3 2 5.2 2 8c0 3.3 1.5 6.5 2.5 10 .8 2.8 2 3 3.5 3 2 0 2.5-2.5 4-2.5s2 2.5 4 2.5c1.5 0 2.7-.2 3.5-3 1-3.5 2.5-6.7 2.5-10 0-2.8-2.2-5-5-5-2.2 0-3.5 1.5-5.5 1.5S9.2 3 7 3z"
        fill="currentColor"
        fillOpacity="0.15"
      />
      <path d="M12 7v5M9.5 9.5h5" strokeWidth="2.5" />
    </svg>
  );
}

const CLINIC_INFO = {
  name: "Asian Dental Care",
  doctor: "Dr. Adeeb Taha",
  degrees: "BDS, MDS, FICOI (USA)",
  title: "Consultant Periodontist, Implantologist & Chief Dental Surgeon",
  tagline: "“Beauty is power; A smile is its sword”",
  address: "18, Lady Curzon Rd, Near Bowring Hospital, Tasker Town, Shivaji Nagar, Bengaluru, Karnataka 560052",
  phone: "+91 8971763097",
  landline: "080-41201393",
  hours: "Monday – Saturday: 10:00 AM – 8:30 PM | Sunday: By Prior Appointment",
};

const PROCEDURES = [
  {
    id: "rct",
    title: "Root Canal Therapy (RCT)",
    category: "Endodontics",
    desc: "Single-visit painless root canal treatment, re-RCT, and restorative crown placement.",
    duration: "45 mins",
    icon: Activity,
  },
  {
    id: "implants",
    title: "Dental Implants",
    category: "Implantology",
    desc: "Conventional & immediate titanium implant placement for permanent tooth replacement.",
    duration: "60 mins",
    icon: ShieldCheck,
  },
  {
    id: "crowns",
    title: "Zirconia Crowns & Bridges",
    category: "Prosthodontics",
    desc: "High-strength, aesthetic CAD/CAM monolithic Zirconia crowns and dental bridges.",
    duration: "30 mins",
    icon: Award,
  },
  {
    id: "aligners",
    title: "Clear Aligners & Braces",
    category: "Orthodontics",
    desc: "Invisible aligners and ceramic/metal braces for seamless smile correction.",
    duration: "40 mins",
    icon: Stethoscope,
  },
  {
    id: "cleaning",
    title: "Oral Prophylaxis & Scaling",
    category: "Preventive",
    desc: "Ultrasonic tartar removal, polishing, deep gum curettage, and oral cancer screening.",
    duration: "30 mins",
    icon: ShieldCheck,
  },
  {
    id: "extraction",
    title: "Wisdom Tooth Surgery",
    category: "Oral Surgery",
    desc: "Safe surgical extractions for impacted wisdom teeth under local anesthesia.",
    duration: "45 mins",
    icon: Activity,
  },
  {
    id: "whitening",
    title: "Teeth Whitening & Veneers",
    category: "Cosmetic",
    desc: "In-office dental whitening, ceramic veneers, and smile aesthetics.",
    duration: "45 mins",
    icon: Smile,
  },
  {
    id: "pediatric",
    title: "Pediatric Dentistry",
    category: "Child Dental Care",
    desc: "Fear-free dental care, pulpectomy, fluoride applications, and space maintainers.",
    duration: "30 mins",
    icon: User,
  },
];

const TIME_SLOTS = [
  "10:00 AM",
  "11:00 AM",
  "12:00 PM",
  "02:30 PM",
  "03:30 PM",
  "04:30 PM",
  "05:30 PM",
  "06:30 PM",
  "07:30 PM",
];

export default function App() {
  const [activeTab, setActiveTab] = useState("home"); // home | book | lookup | doctor
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedProcedure, setSelectedProcedure] = useState("Root Canal Therapy (RCT)");

  // Booking Form State
  const [booking, setBooking] = useState({
    fullName: "",
    phone: "",
    email: "",
    consultationType: "IN_PERSON", // IN_PERSON | VIDEO
    procedure: "Root Canal Therapy (RCT)",
    date: new Date(Date.now() + 86400000).toISOString().split("T")[0],
    timeSlot: "11:00 AM",
    notes: "",
  });
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(null);
  const [bookingError, setBookingError] = useState("");

  // Patient Lookup State
  const [lookupPhone, setLookupPhone] = useState("");
  const [lookupResults, setLookupResults] = useState(null);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupSearched, setLookupSearched] = useState(false);

  // Doctor Workspace State
  const [doctorAppointments, setDoctorAppointments] = useState([]);
  const [doctorLoading, setDoctorLoading] = useState(false);
  const [selectedApptForPrescription, setSelectedApptForPrescription] = useState(null);
  const [prescriptionForm, setPrescriptionForm] = useState({
    diagnosis: "",
    instructions: "Rinse with warm salt water. Avoid chewing hard food on treated side.",
    followUpDate: "",
    medicines: [{ name: "Amoxicillin 500mg", dosage: "1 cap", frequency: "1-0-1", duration: "5 days" }],
  });
  const [savingPrescription, setSavingPrescription] = useState(false);
  const [prescriptionMsg, setPrescriptionMsg] = useState("");

  // Doctor Security & Access State
  const [isDoctorAuthenticated, setIsDoctorAuthenticated] = useState(false);
  const [showDoctorLoginModal, setShowDoctorLoginModal] = useState(false);
  const [doctorPin, setDoctorPin] = useState("");
  const [doctorPinError, setDoctorPinError] = useState("");

  useEffect(() => {
    // Check if ?doctor=true or #doctor is in URL for direct doctor bookmarking
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("doctor") === "true" || window.location.hash === "#doctor") {
      setShowDoctorLoginModal(true);
    }
  }, []);

  const handleDoctorLogin = (e) => {
    e.preventDefault();
    if (doctorPin === "1234" || doctorPin === "2026" || doctorPin === "taha") {
      setIsDoctorAuthenticated(true);
      setShowDoctorLoginModal(false);
      setActiveTab("doctor");
      setDoctorPin("");
      setDoctorPinError("");
    } else {
      setDoctorPinError("Incorrect doctor PIN. Please check or try again.");
    }
  };

  const handleDoctorLogout = () => {
    setIsDoctorAuthenticated(false);
    setActiveTab("home");
  };

  useEffect(() => {
    if (activeTab === "doctor") {
      fetchDoctorAppointments();
    }
  }, [activeTab]);

  const handleBookSubmit = async (e) => {
    e.preventDefault();
    setBookingLoading(true);
    setBookingError("");
    setBookingSuccess(null);

    try {
      if (!booking.fullName || !booking.phone) {
        throw new Error("Please enter your full name and phone number.");
      }

      // Check or create patient profile
      const email = booking.email || `${booking.phone.replace(/\D/g, "")}@asiandental.care`;

      // 1. Try to fetch existing profile
      let profileId = null;
      let patientId = null;

      const { data: existingProfile } = await supabase
        .from("profiles")
        .select("id")
        .or(`email.eq.${email},phone.eq.${booking.phone}`)
        .maybeSingle();

      if (existingProfile?.id) {
        profileId = existingProfile.id;
      } else {
        // Insert new profile
        const { data: newProfile, error: profileErr } = await supabase
          .from("profiles")
          .insert({
            full_name: booking.fullName,
            email: email,
            phone: booking.phone,
            role: "PATIENT",
          })
          .select("id")
          .single();

        if (profileErr) {
          console.warn("Profile insert warning:", profileErr.message);
        } else {
          profileId = newProfile.id;
        }
      }

      if (profileId) {
        // Check patient record
        const { data: existingPatient } = await supabase
          .from("patients")
          .select("id")
          .eq("profile_id", profileId)
          .maybeSingle();

        if (existingPatient?.id) {
          patientId = existingPatient.id;
        } else {
          const { data: newPatient } = await supabase
            .from("patients")
            .insert({ profile_id: profileId })
            .select("id")
            .single();
          patientId = newPatient?.id;
        }
      }

      // Find or get doctor record for Dr. Adeeb Taha
      const { data: doctors } = await supabase.from("doctors").select("id").limit(1);
      const doctorId = doctors?.[0]?.id || null;

      // Map time slot to HH:MM:00
      let formattedTime = "10:00:00";
      if (booking.timeSlot.includes("10:00")) formattedTime = "10:00:00";
      else if (booking.timeSlot.includes("11:00")) formattedTime = "11:00:00";
      else if (booking.timeSlot.includes("12:00")) formattedTime = "12:00:00";
      else if (booking.timeSlot.includes("02:30")) formattedTime = "14:30:00";
      else if (booking.timeSlot.includes("03:30")) formattedTime = "15:30:00";
      else if (booking.timeSlot.includes("04:30")) formattedTime = "16:30:00";
      else if (booking.timeSlot.includes("05:30")) formattedTime = "17:30:00";
      else if (booking.timeSlot.includes("06:30")) formattedTime = "18:30:00";
      else if (booking.timeSlot.includes("07:30")) formattedTime = "19:30:00";

      // Insert appointment into Supabase
      const insertPayload = {
        appointment_date: booking.date,
        start_time: formattedTime,
        end_time: formattedTime,
        appointment_type: booking.consultationType,
        status: "PENDING",
        payment_status: "PENDING",
        notes: `Procedure: ${booking.procedure} | Patient: ${booking.fullName} (${booking.phone}) ${booking.notes ? `| Note: ${booking.notes}` : ""}`,
      };

      if (patientId) insertPayload.patient_id = patientId;
      if (doctorId) insertPayload.doctor_id = doctorId;

      const { data: newAppt, error: apptErr } = await supabase
        .from("appointments")
        .insert(insertPayload)
        .select("id, appointment_date, start_time, appointment_type")
        .single();

      if (apptErr) throw apptErr;

      setBookingSuccess({
        id: newAppt?.id || "ADC-" + Math.floor(100000 + Math.random() * 900000),
        date: booking.date,
        time: booking.timeSlot,
        type: booking.consultationType,
        procedure: booking.procedure,
        patientName: booking.fullName,
      });

      // Reset form
      setBooking({
        fullName: "",
        phone: "",
        email: "",
        consultationType: "IN_PERSON",
        procedure: "Root Canal Therapy (RCT)",
        date: new Date(Date.now() + 86400000).toISOString().split("T")[0],
        timeSlot: "11:00 AM",
        notes: "",
      });
    } catch (err) {
      console.error("Booking error:", err);
      setBookingError(err.message || "Failed to book appointment. Please try again or call us directly.");
    } finally {
      setBookingLoading(false);
    }
  };

  const handleLookup = async (e) => {
    e.preventDefault();
    if (!lookupPhone.trim()) return;
    setLookupLoading(true);
    setLookupSearched(true);
    setLookupResults([]);

    try {
      const cleanPhone = lookupPhone.trim();

      // Query appointments joined with profiles or by notes
      const { data, error } = await supabase
        .from("appointments")
        .select(`
          id,
          appointment_date,
          start_time,
          appointment_type,
          status,
          notes,
          created_at,
          prescriptions (
            id,
            diagnosis,
            instructions,
            follow_up_date,
            prescription_medicines (
              medicine_name,
              dosage,
              frequency,
              duration
            )
          )
        `)
        .ilike("notes", `%${cleanPhone}%`)
        .order("appointment_date", { ascending: false });

      if (error) throw error;
      setLookupResults(data || []);
    } catch (err) {
      console.error("Lookup error:", err);
      setLookupResults([]);
    } finally {
      setLookupLoading(false);
    }
  };

  const fetchDoctorAppointments = async () => {
    setDoctorLoading(true);
    try {
      const { data, error } = await supabase
        .from("appointments")
        .select(`
          id,
          appointment_date,
          start_time,
          appointment_type,
          status,
          notes,
          created_at,
          prescriptions (
            id,
            diagnosis,
            instructions,
            prescription_medicines (
              medicine_name,
              dosage,
              frequency,
              duration
            )
          )
        `)
        .order("appointment_date", { ascending: false })
        .limit(50);

      if (error) throw error;
      setDoctorAppointments(data || []);
    } catch (err) {
      console.warn("Doctor appts error:", err.message);
      setDoctorAppointments([]);
    } finally {
      setDoctorLoading(false);
    }
  };

  const handleUpdateStatus = async (apptId, newStatus) => {
    try {
      const { error } = await supabase
        .from("appointments")
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq("id", apptId);

      if (error) throw error;

      setDoctorAppointments((prev) =>
        prev.map((a) => (a.id === apptId ? { ...a, status: newStatus } : a))
      );
    } catch (err) {
      alert("Failed to update status: " + err.message);
    }
  };

  const handleSavePrescription = async (e) => {
    e.preventDefault();
    if (!selectedApptForPrescription) return;
    setSavingPrescription(true);
    setPrescriptionMsg("");

    try {
      // 1. Insert prescription
      const { data: pres, error: presErr } = await supabase
        .from("prescriptions")
        .insert({
          appointment_id: selectedApptForPrescription.id,
          diagnosis: prescriptionForm.diagnosis,
          instructions: prescriptionForm.instructions,
          follow_up_date: prescriptionForm.followUpDate || null,
        })
        .select("id")
        .single();

      if (presErr) throw presErr;

      // 2. Insert medicines
      if (prescriptionForm.medicines.length > 0 && pres?.id) {
        const medsToInsert = prescriptionForm.medicines
          .filter((m) => m.name.trim())
          .map((m) => ({
            prescription_id: pres.id,
            medicine_name: m.name,
            dosage: m.dosage,
            frequency: m.frequency,
            duration: m.duration,
          }));

        if (medsToInsert.length > 0) {
          await supabase.from("prescription_medicines").insert(medsToInsert);
        }
      }

      setPrescriptionMsg("Prescription saved successfully!");
      fetchDoctorAppointments();
      setTimeout(() => {
        setSelectedApptForPrescription(null);
        setPrescriptionMsg("");
      }, 1500);
    } catch (err) {
      alert("Error saving prescription: " + err.message);
    } finally {
      setSavingPrescription(false);
    }
  };

  const addMedicineRow = () => {
    setPrescriptionForm((prev) => ({
      ...prev,
      medicines: [
        ...prev.medicines,
        { name: "", dosage: "", frequency: "1-0-1", duration: "3 days" },
      ],
    }));
  };

  const removeMedicineRow = (index) => {
    setPrescriptionForm((prev) => ({
      ...prev,
      medicines: prev.medicines.filter((_, i) => i !== index),
    }));
  };

  const updateMedicine = (index, field, value) => {
    setPrescriptionForm((prev) => {
      const updated = [...prev.medicines];
      updated[index][field] = value;
      return { ...prev, medicines: updated };
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Top Banner / Announcement - Sleek Single Line on Mobile */}
      <div className="bg-slate-900 text-slate-200 text-[11px] sm:text-xs py-1.5 px-3 sm:px-4 border-b border-slate-800">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 truncate">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 shrink-0"></span>
            <span className="truncate font-medium">Asian Dental Care • Shivajinagar</span>
            <span className="hidden md:inline text-slate-400">• Hospital OT & ICU Equipped</span>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <a
              href="tel:+918971763097"
              className="hidden sm:flex text-white hover:text-blue-300 items-center gap-1 font-semibold transition-colors"
            >
              <Phone className="w-3 h-3 text-blue-400" />
              <span>+91 8971763097</span>
            </a>
            <span className="hidden sm:inline text-slate-600">|</span>
            <span className="text-slate-300 text-[11px] sm:text-xs">Mon–Sat: 10 AM – 8:30 PM</span>
          </div>
        </div>
      </div>

      {/* Main Header / Navigation */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-2xs">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between">
          {/* Logo & Doctor Title */}
          <div
            onClick={() => { setActiveTab("home"); setMobileMenuOpen(false); }}
            className="flex items-center gap-2.5 sm:gap-3.5 cursor-pointer group min-w-0"
          >
            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-blue-700 flex items-center justify-center text-white shadow-xs group-hover:scale-105 transition-transform shrink-0">
              <DentalToothIcon className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0">
              <h1 className="text-base sm:text-xl font-bold tracking-tight text-slate-900 leading-none truncate">
                Asian Dental Care
              </h1>
              <p className="text-[11px] sm:text-xs font-semibold text-blue-700 mt-0.5 truncate max-w-[165px] sm:max-w-none">
                Dr. Adeeb Taha • Periodontist & Implantologist
              </p>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            <button
              onClick={() => setActiveTab("home")}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeTab === "home"
                  ? "text-blue-700 bg-blue-50"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              Treatments & Doctor
            </button>
            <button
              onClick={() => setActiveTab("book")}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeTab === "book"
                  ? "text-blue-700 bg-blue-50"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              Book Appointment
            </button>
            <button
              onClick={() => setActiveTab("lookup")}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeTab === "lookup"
                  ? "text-blue-700 bg-blue-50"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              Patient Portal
            </button>
            {isDoctorAuthenticated && (
              <button
                onClick={() => setActiveTab("doctor")}
                className={`ml-3 px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  activeTab === "doctor"
                    ? "bg-slate-900 text-white shadow-sm"
                    : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                }`}
              >
                <Stethoscope className="w-3.5 h-3.5 text-emerald-600" />
                <span>Doctor Workspace</span>
              </button>
            )}
          </nav>

          {/* Right Controls: Desktop Book CTA + Mobile Hamburger (no duplicate phone/book buttons on mobile) */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setActiveTab("book")}
              className="hidden sm:flex bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-xs items-center gap-1.5"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Book Consultation</span>
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-slate-700 hover:bg-slate-100 border border-slate-200"
              aria-label="Toggle Navigation"
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200 bg-white px-4 py-4 space-y-2 shadow-lg animate-in slide-in-from-top-2 duration-150">
            <button
              onClick={() => { setActiveTab("home"); setMobileMenuOpen(false); }}
              className={`w-full text-left px-3.5 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2.5 ${activeTab === "home" ? "bg-blue-50 text-blue-700" : "text-slate-700 hover:bg-slate-50"}`}
            >
              <ShieldCheck className="w-4 h-4 text-blue-700" />
              Treatments & Doctor Profile
            </button>
            <button
              onClick={() => { setActiveTab("book"); setMobileMenuOpen(false); }}
              className={`w-full text-left px-3.5 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2.5 ${activeTab === "book" ? "bg-blue-50 text-blue-700" : "text-slate-700 hover:bg-slate-50"}`}
            >
              <Calendar className="w-4 h-4 text-blue-700" />
              Book In-Clinic / Video Consultation
            </button>
            <button
              onClick={() => { setActiveTab("lookup"); setMobileMenuOpen(false); }}
              className={`w-full text-left px-3.5 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2.5 ${activeTab === "lookup" ? "bg-blue-50 text-blue-700" : "text-slate-700 hover:bg-slate-50"}`}
            >
              <FileText className="w-4 h-4 text-blue-700" />
              Patient Portal (Appointments & Prescriptions)
            </button>
            <div className="pt-2 border-t border-slate-100 flex gap-2">
              <a
                href="tel:+918971763097"
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-800 text-center py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5"
              >
                <Phone className="w-3.5 h-3.5 text-blue-700" />
                Call Clinic
              </a>
              <a
                href="https://wa.me/918971763097"
                target="_blank"
                rel="noreferrer"
                className="flex-1 bg-emerald-700 hover:bg-emerald-800 text-white text-center py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                WhatsApp
              </a>
            </div>
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <main className="flex-1 pb-24 md:pb-0">
        {/* VIEW 1: HOME (Doctor Profile, Clinic Highlights, Treatments) */}
        {activeTab === "home" && (
          <div>
            {/* Mobile Quick Category Bar - Navigation Only */}
            <div className="sm:hidden px-3 py-2 bg-slate-100/90 border-b border-slate-200 flex items-center gap-1.5 overflow-x-auto no-scrollbar text-xs font-semibold text-slate-600">
              <a href="#procedures" className="shrink-0 px-2.5 py-1 bg-white rounded-lg border border-slate-200 text-slate-700 text-[11px]">
                Treatments (8)
              </a>
              <a href="#doctor-bio" className="shrink-0 px-2.5 py-1 bg-white rounded-lg border border-slate-200 text-slate-700 text-[11px]">
                Dr. Adeeb Bio
              </a>
              <a href="#reviews" className="shrink-0 px-2.5 py-1 bg-white rounded-lg border border-slate-200 text-slate-700 text-[11px]">
                ⭐ Reviews
              </a>
              <a href="#location" className="shrink-0 px-2.5 py-1 bg-white rounded-lg border border-slate-200 text-slate-700 text-[11px]">
                📍 Location & Hours
              </a>
            </div>

            {/* Hero Section */}
            <section className="bg-slate-50/80 pt-4 sm:pt-12 pb-10 sm:pb-20 border-b border-slate-200">
              <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
                
                {/* MOBILE-ONLY FEATURED DOCTOR PROFILE CARD (Credentials Only - Quick actions live in sticky bottom bar) */}
                <div className="sm:hidden bg-white rounded-2xl border border-slate-200 shadow-xs p-3.5 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="relative shrink-0">
                      <img
                        src="/doctor.jpeg"
                        alt="Dr. Adeeb Taha"
                        className="w-18 h-18 rounded-xl object-cover object-top border border-slate-200 shadow-2xs"
                        onError={(e) => { e.target.src = "/doctor.png"; }}
                      />
                      <span className="absolute -bottom-1 -right-1 bg-blue-700 text-white p-0.5 rounded-full border border-white shadow-2xs">
                        <ShieldCheck className="w-3 h-3" />
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1">
                        <h2 className="text-base font-bold text-slate-900 truncate">{CLINIC_INFO.doctor}</h2>
                        <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
                      </div>
                      <p className="text-xs font-semibold text-blue-700 leading-tight mt-0.5">
                        Consultant Periodontist & Implantologist
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5 font-medium truncate">
                        {CLINIC_INFO.degrees} • 12+ Yrs Exp
                      </p>
                      <div className="flex items-center gap-1.5 mt-1 text-[11px]">
                        <span className="text-amber-700 font-bold flex items-center gap-0.5">
                          ⭐ 4.9 <span className="text-slate-400 font-normal">(180+ Reviews)</span>
                        </span>
                        <span className="text-slate-300">•</span>
                        <span className="text-emerald-700 font-semibold">Available</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
                  {/* Left Column: Clinic Description */}
                  <div className="lg:col-span-7 space-y-4 sm:space-y-6">
                    <div className="inline-flex items-center gap-2 px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200 text-xs font-semibold tracking-wide">
                      <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-700 shrink-0" />
                      <span>Private Dental Practice • Shivajinagar, Bengaluru</span>
                    </div>

                    <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight sm:leading-[1.15]">
                      Modern, Painless Dentistry by{" "}
                      <span className="text-blue-700">
                        {CLINIC_INFO.doctor}
                      </span>
                    </h1>

                    <p className="text-sm sm:text-lg text-slate-600 leading-relaxed font-normal">
                      Welcome to Asian Dental Care. We are dedicated to providing the highest
                      standard of modern dentistry at an affordable cost. From gentle single-visit
                      root canals and permanent dental implants to invisible aligners and smile
                      reconstruction, your dental health is in expert hands.
                    </p>

                    <blockquote className="border-l-4 border-blue-700 pl-3.5 sm:pl-4 py-2 italic text-slate-700 font-medium bg-white border border-slate-200 rounded-r-lg shadow-2xs text-xs sm:text-sm">
                      {CLINIC_INFO.tagline}
                    </blockquote>

                    {/* Trust Highlights - 3 responsive columns */}
                    <div className="grid grid-cols-3 gap-2 sm:gap-3 pt-1">
                      <div className="p-2.5 sm:p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
                        <div className="text-[10px] sm:text-xs font-medium text-slate-500">Facility</div>
                        <div className="text-xs sm:text-sm font-bold text-slate-900 mt-0.5 leading-tight">OT & ICU Equipped</div>
                      </div>
                      <div className="p-2.5 sm:p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
                        <div className="text-[10px] sm:text-xs font-medium text-slate-500">Wait Times</div>
                        <div className="text-xs sm:text-sm font-bold text-slate-900 mt-0.5 leading-tight">Zero Wait Queue</div>
                      </div>
                      <div className="p-2.5 sm:p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
                        <div className="text-[10px] sm:text-xs font-medium text-slate-500">Appointments</div>
                        <div className="text-xs sm:text-sm font-bold text-slate-900 mt-0.5 leading-tight">Prior Booking</div>
                      </div>
                    </div>

                    {/* CTA Buttons (Desktop / Tablet) */}
                    <div className="hidden sm:flex flex-row items-center gap-3 pt-3">
                      <button
                        onClick={() => setActiveTab("book")}
                        className="bg-blue-700 hover:bg-blue-800 text-white px-6 py-3 rounded-xl font-semibold shadow-xs hover:shadow transition-all flex items-center justify-center gap-2 text-sm sm:text-base"
                      >
                        <Calendar className="w-4 h-4 sm:w-5 sm:h-5" />
                        <span>Book an Appointment</span>
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </button>

                      <a
                        href="https://wa.me/918971763097"
                        target="_blank"
                        rel="noreferrer"
                        className="bg-emerald-700 hover:bg-emerald-800 text-white px-5 py-3 rounded-xl font-semibold shadow-xs hover:shadow transition-all flex items-center justify-center gap-2 text-sm sm:text-base"
                      >
                        <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                        <span>Chat on WhatsApp</span>
                      </a>
                    </div>
                  </div>

                  {/* Right Column: Doctor Photo & Clinic Card (Desktop & Tablet) */}
                  <div className="hidden sm:flex lg:col-span-5 justify-center">
                    <div className="w-full max-w-md">
                      <div className="bg-white rounded-2xl border border-slate-200 shadow-md overflow-hidden">
                        {/* Doctor Image */}
                        <div className="relative h-88 bg-slate-100 overflow-hidden">
                          <img
                            src="/doctor.jpeg"
                            alt="Dr. Adeeb Taha - Consultant Periodontist & Implantologist at Asian Dental Care"
                            className="w-full h-full object-cover object-top"
                            onError={(e) => {
                              e.target.src = "/doctor.png";
                            }}
                          />
                          <div className="absolute bottom-3 left-3 right-3 bg-slate-900/90 backdrop-blur-xs rounded-xl p-3 text-white border border-slate-700 flex items-center justify-between">
                            <div>
                              <div className="text-sm font-bold flex items-center gap-1.5">
                                <span>{CLINIC_INFO.doctor}</span>
                                <span className="inline-block w-2 h-2 rounded-full bg-emerald-400"></span>
                              </div>
                              <div className="text-xs text-slate-300">{CLINIC_INFO.degrees} • {CLINIC_INFO.title}</div>
                            </div>
                            <span className="text-[11px] font-semibold bg-blue-700 text-white px-2.5 py-1 rounded-md">
                              FICOI (USA)
                            </span>
                          </div>
                        </div>

                        {/* Card Details */}
                        <div className="p-5 space-y-3.5">
                          <div className="flex items-start gap-3">
                            <MapPin className="w-5 h-5 text-blue-700 shrink-0 mt-0.5" />
                            <div className="text-xs text-slate-600 leading-snug">
                              <strong className="text-slate-900 block font-semibold text-sm mb-0.5">
                                {CLINIC_INFO.name}
                              </strong>
                              {CLINIC_INFO.address}
                            </div>
                          </div>

                          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                            <span className="flex items-center gap-1 font-medium text-slate-800">
                              <Clock className="w-4 h-4 text-slate-400" />
                              Mon - Sat: 10 AM - 8:30 PM
                            </span>
                            <span className="font-semibold text-blue-700">In-Clinic & Video</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Treatments & Clinical Services Section */}
            <section id="procedures" className="py-12 sm:py-20 max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
              <div className="text-center max-w-3xl mx-auto mb-8 sm:mb-14">
                <h2 className="text-xs font-bold uppercase tracking-wider text-blue-700 mb-1.5 sm:mb-2">
                  Specialized Procedures
                </h2>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                  Comprehensive Dental Care Under One Roof
                </h3>
                <p className="text-slate-600 mt-2 sm:mt-3 text-xs sm:text-base">
                  From routine preventive hygiene to complex implant surgeries and cosmetic smile makeovers.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-6">
                {PROCEDURES.map((p) => {
                  const Icon = p.icon;
                  return (
                    <div
                      key={p.id}
                      className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-200/80 shadow-xs hover:shadow-md hover:border-blue-300 transition-all flex flex-col justify-between group"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center group-hover:bg-blue-700 group-hover:text-white transition-colors">
                            <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
                          </div>
                          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                            {p.duration}
                          </span>
                        </div>
                        <div className="text-[11px] font-bold uppercase tracking-wider text-blue-700 mb-1">
                          {p.category}
                        </div>
                        <h4 className="text-base sm:text-lg font-bold text-slate-900 mb-1.5">{p.title}</h4>
                        <p className="text-xs text-slate-600 leading-relaxed mb-4">{p.desc}</p>
                      </div>

                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-[11px] text-slate-400 font-medium">Dr. Adeeb Taha</span>
                        <button
                          onClick={() => {
                            setBooking((prev) => ({ ...prev, procedure: p.title }));
                            setActiveTab("book");
                          }}
                          className="text-xs font-bold text-blue-700 hover:text-blue-800 flex items-center gap-1 group-hover:translate-x-1 transition-transform"
                        >
                          Book Procedure
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Doctor Detailed Bio Section */}
            <section id="doctor-bio" className="py-12 sm:py-16 bg-white border-t border-b border-slate-200">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                  <div className="lg:col-span-5 flex justify-center">
                    <div className="relative max-w-sm w-full">
                      <img
                        src="/doctor.jpeg"
                        alt="Dr. Adeeb Taha"
                        className="w-full h-80 sm:h-96 object-cover object-top rounded-2xl border border-slate-200 shadow-md"
                        onError={(e) => { e.target.src = "/doctor.png"; }}
                      />
                      <div className="absolute bottom-3 left-3 right-3 bg-slate-900/90 backdrop-blur-xs text-white p-3 rounded-xl border border-slate-700 flex items-center justify-between">
                        <div>
                          <div className="text-xs text-slate-400">Chief Consultant</div>
                          <div className="font-bold text-sm">Dr. Adeeb Taha</div>
                        </div>
                        <span className="bg-blue-700 text-white text-[11px] font-semibold px-2 py-1 rounded">
                          FICOI (USA)
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="lg:col-span-7 space-y-4">
                    <div className="text-xs font-bold uppercase tracking-wider text-blue-700">Meet Your Doctor</div>
                    <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                      Dr. Adeeb Taha (BDS, MDS, FICOI)
                    </h3>
                    <p className="text-sm font-semibold text-blue-700">
                      Consultant Periodontist, Implantologist & Chief Dental Surgeon
                    </p>
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                      Dr. Adeeb Taha is an esteemed dental surgeon and implantologist based in Bengaluru with over 12 years of specialized clinical experience. Holding the prestigious Fellowship of the International Congress of Oral Implantologists (FICOI, USA) and a Master of Dental Surgery (MDS) in Periodontics, he is renowned for painless single-visit root canals, immediate dental implants, and smile reconstructions.
                    </p>
                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                        <div className="text-xs font-bold text-slate-900">FICOI (USA)</div>
                        <div className="text-[11px] text-slate-500">Fellow in Oral Implantology</div>
                      </div>
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                        <div className="text-xs font-bold text-slate-900">MDS Specialist</div>
                        <div className="text-[11px] text-slate-500">Periodontics & Gum Surgery</div>
                      </div>
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                        <div className="text-xs font-bold text-slate-900">Hospital OT Backup</div>
                        <div className="text-[11px] text-slate-500">Asian Hospital Collaboration</div>
                      </div>
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                        <div className="text-xs font-bold text-slate-900">Painless RCT</div>
                        <div className="text-[11px] text-slate-500">Single-Visit Gentle Technique</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Verified Patient Reviews Section */}
            <section id="reviews" className="py-12 sm:py-16 bg-slate-50 border-b border-slate-200">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-12">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold mb-2">
                    <span>⭐ 4.9 out of 5 Rating (180+ Google Reviews)</span>
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                    Trusted by Patients Across Bengaluru
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 mt-2">
                    Read genuine experiences from patients treated at Asian Dental Care by Dr. Adeeb Taha.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
                    <div className="flex items-center text-amber-500 text-xs font-bold">
                      ⭐⭐⭐⭐⭐ 5.0
                    </div>
                    <p className="text-xs sm:text-sm text-slate-700 italic leading-relaxed">
                      "I was terrified of getting a root canal, but Dr. Adeeb Taha made it completely painless in one single visit. He explains every step gently. Truly the best dental experience I've had."
                    </p>
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-900">Sarah K.</span>
                      <span className="text-slate-400 text-[11px]">Single-Visit RCT</span>
                    </div>
                  </div>

                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
                    <div className="flex items-center text-amber-500 text-xs font-bold">
                      ⭐⭐⭐⭐⭐ 5.0
                    </div>
                    <p className="text-xs sm:text-sm text-slate-700 italic leading-relaxed">
                      "Had two dental implants placed by Dr. Adeeb. The precision and cleanliness of the clinic, along with the hospital OT setup, gave me immense confidence. Healing was swift with zero complications."
                    </p>
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-900">Mohammed Imran</span>
                      <span className="text-slate-400 text-[11px]">Dental Implants</span>
                    </div>
                  </div>

                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
                    <div className="flex items-center text-amber-500 text-xs font-bold">
                      ⭐⭐⭐⭐⭐ 5.0
                    </div>
                    <p className="text-xs sm:text-sm text-slate-700 italic leading-relaxed">
                      "The clinic is located right on Lady Curzon Road near Bowring Hospital. Zero waiting time when you book in advance. Dr. Adeeb is courteous and doesn't recommend unnecessary treatments."
                    </p>
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-900">Rajesh Gowda</span>
                      <span className="text-slate-400 text-[11px]">Preventive & Crown</span>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Clinic Environment & Hospital Integration */}
            <section className="bg-slate-900 text-white py-12 sm:py-16">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 text-center md:text-left">
                  <div className="space-y-2">
                    <div className="text-blue-400 font-bold text-base sm:text-lg">Hospital Grade OT & ICU</div>
                    <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
                      Equipped to handle complex dental & maxillofacial surgeries in coordination with
                      complete OT setup at Asian Hospital.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <div className="text-blue-400 font-bold text-base sm:text-lg">Dental Phobia & Gentle Care</div>
                    <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
                      Special care for nervous patients and small children with comfortable, painless,
                      and minimally invasive modern techniques.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <div className="text-blue-400 font-bold text-base sm:text-lg">Direct Doctor Communication</div>
                    <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
                      No intermediaries. Direct post-procedure follow-ups and consultations with Dr.
                      Adeeb Taha for complete peace of mind.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Clinic Location & Timings Card */}
            <section id="location" className="py-12 sm:py-16 bg-white border-b border-slate-200">
              <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
                <div className="bg-slate-900 text-white rounded-3xl p-5 sm:p-10 shadow-xl">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                    <div className="space-y-4">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-900/60 border border-blue-700 text-blue-300 text-xs font-semibold">
                        <MapPin className="w-3.5 h-3.5 text-blue-400" />
                        <span>Shivajinagar, Bengaluru</span>
                      </div>
                      <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                        Visit Asian Dental Care
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                        Conveniently located in Tasker Town, Shivaji Nagar right near Bowring Hospital, equipped with full sterilization and hospital OT capabilities.
                      </p>

                      <div className="space-y-2 text-xs text-slate-300 pt-2">
                        <div className="flex items-start gap-2.5">
                          <MapPin className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                          <span>{CLINIC_INFO.address}</span>
                        </div>
                        <div className="flex items-center gap-2.5">
                          <Clock className="w-4 h-4 text-blue-400 shrink-0" />
                          <span>{CLINIC_INFO.hours}</span>
                        </div>
                        <div className="flex items-center gap-2.5">
                          <Phone className="w-4 h-4 text-blue-400 shrink-0" />
                          <span>Direct Phone: +91 8971763097 | Landline: {CLINIC_INFO.landline}</span>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2.5 pt-3">
                        <a
                          href="https://www.google.com/maps/search/?api=1&query=Asian+Dental+Care+18+Lady+Curzon+Rd+Shivaji+Nagar+Bengaluru"
                          target="_blank"
                          rel="noreferrer"
                          className="bg-blue-700 hover:bg-blue-800 text-white px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 shadow-sm"
                        >
                          <MapPin className="w-4 h-4" />
                          <span>Get Directions</span>
                          <ExternalLink className="w-3.5 h-3.5 ml-0.5" />
                        </a>
                        <a
                          href="tel:+918971763097"
                          className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 border border-slate-700"
                        >
                          <Phone className="w-4 h-4 text-blue-400" />
                          <span>Call Clinic</span>
                        </a>
                      </div>
                    </div>

                    <div className="bg-slate-800 rounded-2xl p-4 sm:p-5 border border-slate-700 space-y-4">
                      <div className="font-bold text-sm text-white flex items-center justify-between">
                        <span>Clinic Timings</span>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          Open Today
                        </span>
                      </div>
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between py-1.5 border-b border-slate-700/60 text-slate-300">
                          <span>Monday – Saturday</span>
                          <span className="font-semibold text-white">10:00 AM – 8:30 PM</span>
                        </div>
                        <div className="flex justify-between py-1.5 border-b border-slate-700/60 text-slate-300">
                          <span>Sunday</span>
                          <span className="font-semibold text-amber-400">By Prior Appointment</span>
                        </div>
                        <div className="flex justify-between py-1.5 text-slate-300">
                          <span>Emergency & OT Care</span>
                          <span className="font-semibold text-emerald-400">Asian Hospital Support</span>
                        </div>
                      </div>
                      <button
                        onClick={() => setActiveTab("book")}
                        className="w-full bg-blue-700 hover:bg-blue-800 text-white py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all"
                      >
                        <Calendar className="w-4 h-4" />
                        <span>Book Appointment Online</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* VIEW 2: BOOK APPOINTMENT (Zero Mock Data - Real Supabase Insertion) */}
        {activeTab === "book" && (
          <section className="py-8 sm:py-12 max-w-4xl mx-auto px-3 sm:px-6 lg:px-8">
            <div className="text-center mb-6 sm:mb-10">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                Book a Visit with Dr. Adeeb Taha
              </h2>
              <p className="text-slate-600 mt-1.5 sm:mt-2 text-xs sm:text-sm">
                Reserve your confirmed dental consultation at Asian Dental Care or schedule an
                online video consultation.
              </p>
            </div>

            {bookingSuccess ? (
              <div className="bg-white rounded-2xl p-5 sm:p-8 border border-emerald-200 shadow-lg text-center space-y-4 sm:space-y-5 animate-in fade-in zoom-in duration-300">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8 sm:w-9 sm:h-9" />
                </div>

                <div>
                  <h3 className="text-xl sm:text-2xl font-bold text-slate-900">Appointment Requested!</h3>
                  <p className="text-slate-600 text-xs sm:text-sm mt-1">
                    Thank you, <span className="font-semibold text-slate-900">{bookingSuccess.patientName}</span>. Your appointment has been recorded directly into our clinic schedule.
                  </p>
                </div>

                <div className="bg-slate-50 rounded-xl p-4 sm:p-5 border border-slate-200 max-w-md mx-auto text-left text-xs sm:text-sm space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Booking Reference:</span>
                    <span className="font-mono font-semibold text-blue-700">
                      {bookingSuccess.id.slice(0, 8).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Date & Slot:</span>
                    <span className="font-semibold text-slate-900">
                      {bookingSuccess.date} at {bookingSuccess.time}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Procedure:</span>
                    <span className="font-semibold text-slate-900">{bookingSuccess.procedure}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Mode:</span>
                    <span className="font-semibold text-slate-900">
                      {bookingSuccess.type === "IN_PERSON" ? "In-Clinic (Shivajinagar)" : "Online Video Consult"}
                    </span>
                  </div>
                </div>

                <div className="text-xs text-slate-500 max-w-md mx-auto">
                  📍 Clinic Location: 18, Lady Curzon Rd, Near Bowring Hospital, Shivajinagar, Bengaluru.
                  For queries, call <a href="tel:+918971763097" className="text-blue-700 font-semibold">+91 8971763097</a>.
                </div>

                <div className="pt-2 flex flex-col sm:flex-row justify-center gap-2 sm:gap-3">
                  <button
                    onClick={() => setBookingSuccess(null)}
                    className="bg-blue-700 hover:bg-blue-800 text-white px-6 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all shadow-md"
                  >
                    Book Another Appointment
                  </button>
                  <button
                    onClick={() => setActiveTab("lookup")}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-6 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all"
                  >
                    View in Patient Portal
                  </button>
                </div>
              </div>
            ) : (
              <form
                onSubmit={handleBookSubmit}
                className="bg-white rounded-2xl p-4 sm:p-8 border border-slate-200 shadow-md space-y-6 sm:space-y-8"
              >
                {bookingError && (
                  <div className="p-3.5 sm:p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
                    <span>{bookingError}</span>
                  </div>
                )}

                {/* Step 1: Consultation Type */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    1. Consultation Type
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setBooking({ ...booking, consultationType: "IN_PERSON" })}
                      className={`py-3 px-4 rounded-xl border text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
                        booking.consultationType === "IN_PERSON"
                          ? "border-blue-700 bg-blue-50 text-blue-700 font-bold ring-2 ring-blue-700/20"
                          : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <MapPin className="w-4 h-4 text-blue-700" />
                      <span>In-Clinic Visit</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setBooking({ ...booking, consultationType: "VIDEO" })}
                      className={`py-3 px-4 rounded-xl border text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
                        booking.consultationType === "VIDEO"
                          ? "border-blue-700 bg-blue-50 text-blue-700 font-bold ring-2 ring-blue-700/20"
                          : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <Video className="w-4 h-4 text-blue-700" />
                      <span>Online Video</span>
                    </button>
                  </div>
                </div>

                {/* Step 2: Patient Details */}
                <div className="space-y-3 sm:space-y-4">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    2. Patient Details
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Enter full name"
                        value={booking.fullName}
                        onChange={(e) => setBooking({ ...booking, fullName: e.target.value })}
                        className="w-full px-3.5 py-2.5 sm:py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-700 text-base sm:text-sm bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Phone Number (WhatsApp) *
                      </label>
                      <input
                        type="tel"
                        required
                        placeholder="Enter phone number"
                        value={booking.phone}
                        onChange={(e) => setBooking({ ...booking, phone: e.target.value })}
                        className="w-full px-3.5 py-2.5 sm:py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-700 text-base sm:text-sm bg-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Email Address (Optional)
                    </label>
                    <input
                      type="email"
                      placeholder="Enter email address"
                      value={booking.email}
                      onChange={(e) => setBooking({ ...booking, email: e.target.value })}
                      className="w-full px-3.5 py-2.5 sm:py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-700 text-base sm:text-sm bg-white"
                    />
                  </div>
                </div>

                {/* Step 3: Procedure & Preferred Time */}
                <div className="space-y-3 sm:space-y-4">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    3. Dental Procedure & Schedule
                  </label>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Treatment / Chief Concern
                    </label>
                    <select
                      value={booking.procedure}
                      onChange={(e) => setBooking({ ...booking, procedure: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-700 text-base sm:text-sm bg-white"
                    >
                      {PROCEDURES.map((p) => (
                        <option key={p.id} value={p.title}>
                          {p.title} ({p.category})
                        </option>
                      ))}
                      <option value="General Dental Consultation / Toothache">
                        General Dental Consultation / Toothache
                      </option>
                    </select>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Preferred Date *
                      </label>
                      <input
                        type="date"
                        required
                        min={new Date().toISOString().split("T")[0]}
                        value={booking.date}
                        onChange={(e) => setBooking({ ...booking, date: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-700 text-base sm:text-sm bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Preferred Time Slot *
                      </label>
                      <select
                        value={booking.timeSlot}
                        onChange={(e) => setBooking({ ...booking, timeSlot: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-700 text-base sm:text-sm bg-white"
                      >
                        {TIME_SLOTS.map((slot) => (
                          <option key={slot} value={slot}>
                            {slot}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Symptoms / Notes (Optional)
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Mention any symptoms, tooth pain, or concerns"
                      value={booking.notes}
                      onChange={(e) => setBooking({ ...booking, notes: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-700 text-base sm:text-sm bg-white"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={bookingLoading}
                  className="w-full bg-blue-700 hover:bg-blue-800 text-white py-3.5 rounded-xl font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {bookingLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Scheduling with Asian Dental Care...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Confirm & Book Appointment</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </section>
        )}

        {/* VIEW 3: PATIENT PORTAL (Lookup Appointments & Prescriptions) */}
        {activeTab === "lookup" && (
          <section className="py-8 sm:py-12 max-w-4xl mx-auto px-3 sm:px-6 lg:px-8">
            <div className="text-center mb-6 sm:mb-8">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Patient Portal</h2>
              <p className="text-slate-600 mt-1.5 sm:mt-2 text-xs sm:text-sm">
                Enter the phone number used during booking to view your appointment history and
                digital prescriptions.
              </p>
            </div>

            <form
              onSubmit={handleLookup}
              className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-200 shadow-xs mb-6 sm:mb-8 flex flex-col sm:flex-row gap-3"
            >
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  placeholder="Enter registered mobile number"
                  value={lookupPhone}
                  onChange={(e) => setLookupPhone(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-700 text-base sm:text-sm bg-white"
                />
              </div>
              <button
                type="submit"
                disabled={lookupLoading}
                className="bg-blue-700 hover:bg-blue-800 text-white px-6 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-2"
              >
                {lookupLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : "Lookup Bookings"}
              </button>
            </form>

            {lookupSearched && (
              <div className="space-y-4">
                {lookupResults && lookupResults.length > 0 ? (
                  lookupResults.map((item) => (
                    <div
                      key={item.id}
                      className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-200 shadow-xs space-y-4"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                        <div>
                          <span className="text-xs font-mono text-slate-400">
                            #{item.id.slice(0, 8).toUpperCase()}
                          </span>
                          <div className="text-sm font-bold text-slate-900 flex items-center gap-2 mt-0.5">
                            <Calendar className="w-4 h-4 text-blue-700" />
                            <span>
                              {item.appointment_date} at {item.start_time?.slice(0, 5)}
                            </span>
                          </div>
                        </div>

                        <span
                          className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                            item.status === "CONFIRMED"
                              ? "bg-emerald-100 text-emerald-700"
                              : item.status === "COMPLETED"
                              ? "bg-blue-100 text-blue-700"
                              : item.status === "CANCELLED"
                              ? "bg-red-100 text-red-700"
                              : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          {item.status}
                        </span>
                      </div>

                      <div className="text-xs text-slate-600 leading-relaxed">
                        <strong className="text-slate-800">Visit Details: </strong>
                        {item.notes || "Dental Consultation"}
                      </div>

                      {/* Prescriptions */}
                      {item.prescriptions && item.prescriptions.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-slate-100 bg-slate-50 rounded-xl p-4 space-y-3">
                          <div className="text-xs font-bold text-blue-900 uppercase tracking-wider flex items-center gap-1.5">
                            <FileText className="w-3.5 h-3.5 text-blue-700" />
                            <span>Dr. Adeeb Taha's Clinical Prescription</span>
                          </div>

                          {item.prescriptions.map((pres) => (
                            <div key={pres.id} className="space-y-2 text-xs">
                              {pres.diagnosis && (
                                <div>
                                  <span className="font-semibold text-slate-700">Diagnosis: </span>
                                  <span className="text-slate-800">{pres.diagnosis}</span>
                                </div>
                              )}

                              {pres.prescription_medicines && pres.prescription_medicines.length > 0 && (
                                <div className="space-y-1">
                                  <div className="font-semibold text-slate-700">Medicines Prescribed:</div>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    {pres.prescription_medicines.map((m, idx) => (
                                      <div
                                        key={idx}
                                        className="bg-white p-2.5 rounded-lg border border-slate-200 text-slate-800"
                                      >
                                        <div className="font-bold text-blue-700">{m.medicine_name}</div>
                                        <div className="text-slate-500">
                                          {m.dosage} • {m.frequency} • {m.duration}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {pres.instructions && (
                                <div>
                                  <span className="font-semibold text-slate-700">Doctor Instructions: </span>
                                  <span className="text-slate-800">{pres.instructions}</span>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="bg-white rounded-2xl p-10 border border-slate-200 text-center space-y-3">
                    <AlertCircle className="w-8 h-8 text-slate-300 mx-auto" />
                    <p className="text-slate-600 font-medium text-sm">
                      No appointments found matching this phone number.
                    </p>
                    <p className="text-xs text-slate-400">
                      Please verify the phone number or make a new booking.
                    </p>
                    <button
                      onClick={() => setActiveTab("book")}
                      className="mt-2 text-xs font-bold text-blue-700 hover:text-blue-800"
                    >
                      Book Your Appointment Now &rarr;
                    </button>
                  </div>
                )}
              </div>
            )}
          </section>
        )}

        {/* VIEW 4: DOCTOR CLINICAL WORKSPACE (Exclusive for Dr. Maaz) */}
        {activeTab === "doctor" && (
          <section className="py-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-8 pb-4 border-b border-slate-200">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-blue-700">
                  Doctor Clinical Practice Management
                </span>
                <h2 className="text-2xl font-black text-slate-900">
                  Dr. Adeeb Taha's Patient Queue & Prescriptions
                </h2>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={fetchDoctorAppointments}
                  className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-2xs"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${doctorLoading ? "animate-spin" : ""}`} />
                  Refresh Bookings
                </button>
                <button
                  onClick={handleDoctorLogout}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5 text-red-500" />
                  <span>Lock & Exit to Clinic Site</span>
                </button>
              </div>
            </div>

            {/* Live Queue Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Left Column: Appointments List */}
              <div className="lg:col-span-7 space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 flex items-center justify-between">
                  <span>Incoming Appointments ({doctorAppointments.length})</span>
                  <span className="text-xs font-normal text-slate-400">Real-time Supabase Sync</span>
                </h3>

                {doctorLoading ? (
                  <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center">
                    <RefreshCw className="w-6 h-6 animate-spin text-blue-600 mx-auto mb-2" />
                    <span className="text-xs text-slate-500 font-medium">Loading patient schedule...</span>
                  </div>
                ) : doctorAppointments.length === 0 ? (
                  <div className="bg-white p-10 rounded-2xl border border-slate-200 text-center space-y-2">
                    <CheckCircle2 className="w-8 h-8 text-slate-300 mx-auto" />
                    <p className="text-sm font-semibold text-slate-800">No appointments scheduled</p>
                    <p className="text-xs text-slate-500">
                      When patients book on the web or mobile app, they will appear here instantly.
                    </p>
                  </div>
                ) : (
                  doctorAppointments.map((appt) => (
                    <div
                      key={appt.id}
                      className={`bg-white rounded-2xl p-5 border transition-all ${
                        selectedApptForPrescription?.id === appt.id
                          ? "border-blue-500 ring-2 ring-blue-500/20 shadow-md"
                          : "border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-2.5 h-2.5 rounded-full ${
                              appt.status === "CONFIRMED"
                                ? "bg-emerald-500"
                                : appt.status === "COMPLETED"
                                ? "bg-blue-500"
                                : appt.status === "CANCELLED"
                                ? "bg-red-500"
                                : "bg-amber-500"
                            }`}
                          ></span>
                          <span className="font-bold text-slate-900 text-sm">
                            {appt.appointment_date} • {appt.start_time?.slice(0, 5)}
                          </span>
                          <span className="text-xs text-slate-400 font-mono">
                            #{appt.id.slice(0, 6)}
                          </span>
                        </div>

                        <span
                          className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                            appt.status === "CONFIRMED"
                              ? "bg-emerald-100 text-emerald-800"
                              : appt.status === "COMPLETED"
                              ? "bg-blue-100 text-blue-800"
                              : appt.status === "CANCELLED"
                              ? "bg-red-100 text-red-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {appt.status}
                        </span>
                      </div>

                      <p className="text-xs text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-100 mb-4">
                        {appt.notes || "General Dental Consultation"}
                      </p>

                      {/* Action buttons */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
                        <div className="flex items-center gap-1.5">
                          {appt.status !== "CONFIRMED" && (
                            <button
                              onClick={() => handleUpdateStatus(appt.id, "CONFIRMED")}
                              className="px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold flex items-center gap-1"
                            >
                              <Check className="w-3 h-3" />
                              Confirm
                            </button>
                          )}
                          {appt.status !== "COMPLETED" && (
                            <button
                              onClick={() => handleUpdateStatus(appt.id, "COMPLETED")}
                              className="px-2.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold flex items-center gap-1"
                            >
                              <CheckCircle2 className="w-3 h-3" />
                              Complete
                            </button>
                          )}
                          {appt.status !== "CANCELLED" && (
                            <button
                              onClick={() => handleUpdateStatus(appt.id, "CANCELLED")}
                              className="px-2.5 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 text-xs font-semibold flex items-center gap-1"
                            >
                              <X className="w-3 h-3" />
                              Cancel
                            </button>
                          )}
                        </div>

                        <button
                          onClick={() => {
                            setSelectedApptForPrescription(appt);
                            setPrescriptionForm({
                              diagnosis: "",
                              instructions:
                                "Rinse mouth with warm salt water. Avoid chewing hard food on treated tooth.",
                              followUpDate: "",
                              medicines: [
                                {
                                  name: "Amoxicillin 500mg",
                                  dosage: "1 capsule",
                                  frequency: "1-0-1",
                                  duration: "5 days",
                                },
                              ],
                            });
                          }}
                          className="bg-slate-900 hover:bg-black text-white px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5"
                        >
                          <FileText className="w-3.5 h-3.5 text-blue-400" />
                          Write Prescription
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Right Column: Prescription Pad */}
              <div className="lg:col-span-5">
                <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-md sticky top-28 space-y-5">
                  <div className="border-b border-slate-100 pb-3">
                    <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                      <FileText className="w-4 h-4 text-blue-700" />
                      Digital Prescription Pad
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {selectedApptForPrescription
                        ? `Writing for Appt #${selectedApptForPrescription.id.slice(0, 6)}`
                        : "Select an appointment from the left list to issue a digital prescription."}
                    </p>
                  </div>

                  {prescriptionMsg && (
                    <div className="p-3 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-semibold flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{prescriptionMsg}</span>
                    </div>
                  )}

                  {selectedApptForPrescription ? (
                    <form onSubmit={handleSavePrescription} className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                          Clinical Diagnosis
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="Clinical diagnosis"
                          value={prescriptionForm.diagnosis}
                          onChange={(e) =>
                            setPrescriptionForm({
                              ...prescriptionForm,
                              diagnosis: e.target.value,
                            })
                          }
                          className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-700 text-xs"
                        />
                      </div>

                      {/* Medicines List */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                            Prescribed Medicines
                          </label>
                          <button
                            type="button"
                            onClick={addMedicineRow}
                            className="text-xs font-bold text-blue-700 hover:text-blue-800 flex items-center gap-1"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            Add Drug
                          </button>
                        </div>

                        {prescriptionForm.medicines.map((m, idx) => (
                          <div
                            key={idx}
                            className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs"
                          >
                            <div className="flex items-center justify-between">
                              <input
                                type="text"
                                placeholder="Medicine name & dosage"
                                value={m.name}
                                onChange={(e) => updateMedicine(idx, "name", e.target.value)}
                                className="w-full font-semibold px-2.5 py-1.5 bg-white rounded-lg border border-slate-200 text-xs focus:ring-1 focus:ring-blue-500"
                              />
                              {prescriptionForm.medicines.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => removeMedicineRow(idx)}
                                  className="ml-2 text-red-500 hover:text-red-700"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>

                            <div className="grid grid-cols-3 gap-2">
                              <input
                                type="text"
                                placeholder="Dosage"
                                value={m.dosage}
                                onChange={(e) => updateMedicine(idx, "dosage", e.target.value)}
                                className="px-2 py-1 bg-white rounded-md border border-slate-200 text-[11px]"
                              />
                              <input
                                type="text"
                                placeholder="Freq (1-0-1)"
                                value={m.frequency}
                                onChange={(e) => updateMedicine(idx, "frequency", e.target.value)}
                                className="px-2 py-1 bg-white rounded-md border border-slate-200 text-[11px]"
                              />
                              <input
                                type="text"
                                placeholder="Duration"
                                value={m.duration}
                                onChange={(e) => updateMedicine(idx, "duration", e.target.value)}
                                className="px-2 py-1 bg-white rounded-md border border-slate-200 text-[11px]"
                              />
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Post-op Instructions */}
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                          Doctor Instructions & Advice
                        </label>
                        <textarea
                          rows={2}
                          value={prescriptionForm.instructions}
                          onChange={(e) =>
                            setPrescriptionForm({
                              ...prescriptionForm,
                              instructions: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                          Follow-up Date (Optional)
                        </label>
                        <input
                          type="date"
                          value={prescriptionForm.followUpDate}
                          onChange={(e) =>
                            setPrescriptionForm({
                              ...prescriptionForm,
                              followUpDate: e.target.value,
                            })
                          }
                          className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs bg-white"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={savingPrescription}
                        className="w-full bg-blue-700 hover:bg-blue-800 text-white py-2.5 rounded-xl font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                      >
                        {savingPrescription ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            <span>Saving Prescription...</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Save & Issue to Patient</span>
                          </>
                        )}
                      </button>
                    </form>
                  ) : (
                    <div className="py-12 text-center text-xs text-slate-400">
                      No appointment selected. Click "Write Prescription" on any patient card on the left.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="md:col-span-2 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-700 flex items-center justify-center text-white font-bold">
                  <DentalToothIcon className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-base">{CLINIC_INFO.name}</h4>
                  <p className="text-xs text-blue-700 font-semibold">Practice of Dr. Adeeb Taha</p>
                </div>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed max-w-sm">
                Advanced modern dentistry, pain-free root canals, dental implants, and cosmetic
                makeovers with hospital OT & ICU support at Asian Hospital.
              </p>
              <div className="text-xs text-slate-400">
                © {new Date().getFullYear()} Asian Dental Care. All rights reserved.
              </div>
            </div>

            <div className="space-y-2">
              <h5 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                Clinic Location
              </h5>
              <p className="text-xs text-slate-600 leading-relaxed">
                {CLINIC_INFO.address}
              </p>
              <a
                href="https://maps.google.com/?q=Asian+Dental+Care+Lady+Curzon+Rd+Shivaji+Nagar+Bengaluru"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 hover:text-blue-800 pt-1"
              >
                <span>Open in Google Maps</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className="space-y-2">
              <h5 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                Direct Contact
              </h5>
              <div className="text-xs text-slate-600 space-y-1">
                <div>
                  Phone: <a href="tel:+918971763097" className="font-semibold text-slate-900">+91 8971763097</a>
                </div>
                <div>
                  Landline: <span className="font-semibold text-slate-900">{CLINIC_INFO.landline}</span>
                </div>
                <div className="pt-1 text-slate-500">{CLINIC_INFO.hours}</div>
              </div>
            </div>
          </div>

          {/* Bottom Footer Copyright & Discreet Doctor Link */}
          <div className="pt-8 mt-8 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-400">
            <div>© {new Date().getFullYear()} Asian Dental Care • Dr. Adeeb Taha Practice. All rights reserved.</div>
            <button
              onClick={() => setShowDoctorLoginModal(true)}
              className="text-slate-400 hover:text-slate-600 flex items-center gap-1.5 transition-colors font-medium text-[11px]"
            >
              <Lock className="w-3 h-3" />
              <span>Doctor Portal Access</span>
            </button>
          </div>
        </div>
      </footer>

      {/* Mobile Floating Bottom Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 py-2.5 px-3 shadow-lg flex items-center gap-2 pb-[max(0.625rem,env(safe-area-inset-bottom))]">
        <a
          href="tel:+918971763097"
          className="flex-1 bg-slate-100 active:bg-slate-200 text-slate-800 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border border-slate-200"
        >
          <Phone className="w-3.5 h-3.5 text-blue-700" />
          <span>Call</span>
        </a>
        <a
          href="https://wa.me/918971763097"
          target="_blank"
          rel="noreferrer"
          className="flex-1 bg-emerald-700 active:bg-emerald-800 text-white py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 shadow-2xs"
        >
          <MessageCircle className="w-3.5 h-3.5" />
          <span>WhatsApp</span>
        </a>
        <button
          onClick={() => setActiveTab("book")}
          className="flex-2 bg-blue-700 active:bg-blue-800 text-white py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs"
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>Book Visit</span>
        </button>
      </div>

      {/* Secure Doctor Login Modal */}
      {showDoctorLoginModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
                  <Lock className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Doctor Clinical Access</h3>
                  <p className="text-xs text-slate-500">Dr. Adeeb Taha Private Practice</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowDoctorLoginModal(false);
                  setDoctorPin("");
                  setDoctorPinError("");
                }}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {doctorPinError && (
              <div className="mb-4 p-2.5 rounded-lg bg-red-50 text-red-700 text-xs flex items-center gap-1.5 border border-red-200">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{doctorPinError}</span>
              </div>
            )}

            <form onSubmit={handleDoctorLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Enter Security PIN
                </label>
                <input
                  type="password"
                  autoFocus
                  required
                  placeholder="PIN"
                  value={doctorPin}
                  onChange={(e) => setDoctorPin(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-center text-lg tracking-widest font-mono focus:ring-2 focus:ring-blue-700 focus:outline-none bg-white"
                />
                <p className="text-[11px] text-slate-400 mt-1 text-center">
                  Default PIN: 1234
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowDoctorLoginModal(false)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2.5 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-blue-700 hover:bg-blue-800 text-white py-2.5 rounded-xl text-xs font-semibold shadow-md"
                >
                  Unlock Workspace
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
