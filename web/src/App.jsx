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
  Sparkles,
  Search,
  MessageCircle,
  RefreshCw,
  LogOut,
  Check,
  X,
  Lock,
} from "lucide-react";
import { supabase } from "./lib/supabaseClient";

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
    icon: Sparkles,
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
    desc: "In-office LED laser whitening, composite veneers, and smile designing.",
    duration: "45 mins",
    icon: Sparkles,
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
      {/* Top Banner / Announcement */}
      <div className="bg-slate-900 text-slate-300 text-xs py-2 px-4 border-b border-slate-800">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Asian Dental Care • Shivajinagar, Bengaluru | Hospital OT & ICU Equipped</span>
          </div>
          <div className="flex items-center gap-6">
            <a href="tel:+918971763097" className="hover:text-white flex items-center gap-1.5 transition-colors">
              <Phone className="w-3.5 h-3.5 text-blue-400" />
              <span>+91 8971763097</span>
            </a>
            <span className="hidden sm:inline text-slate-600">|</span>
            <span className="hidden sm:inline">Mon–Sat: 10:00 AM – 8:30 PM</span>
          </div>
        </div>
      </div>

      {/* Main Header / Navigation */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Logo & Doctor Title */}
          <div
            onClick={() => setActiveTab("home")}
            className="flex items-center gap-3.5 cursor-pointer group"
          >
            <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900 leading-none">
                Asian Dental Care
              </h1>
              <p className="text-xs font-medium text-blue-600 mt-1">
                {CLINIC_INFO.doctor} • Periodontist & Implantologist
              </p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            <button
              onClick={() => setActiveTab("home")}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeTab === "home"
                  ? "text-blue-600 bg-blue-50"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              Treatments & Doctor
            </button>
            <button
              onClick={() => setActiveTab("book")}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeTab === "book"
                  ? "text-blue-600 bg-blue-50"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              Book Appointment
            </button>
            <button
              onClick={() => setActiveTab("lookup")}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeTab === "lookup"
                  ? "text-blue-600 bg-blue-50"
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

          {/* Action CTAs */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveTab("book")}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold shadow-md shadow-blue-500/20 hover:shadow-lg transition-all flex items-center gap-2"
            >
              <Calendar className="w-4 h-4" />
              <span className="hidden sm:inline">Book Consultation</span>
              <span className="sm:hidden">Book</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1">
        {/* VIEW 1: HOME (Doctor Profile, Clinic Highlights, Treatments) */}
        {activeTab === "home" && (
          <div>
            {/* Hero Section */}
            <section className="relative overflow-hidden bg-gradient-to-b from-blue-50/60 via-white to-slate-50 pt-12 pb-20 border-b border-slate-200/80">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                  {/* Left Column: Clinic Description */}
                  <div className="lg:col-span-7 space-y-6">
                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-100/80 text-blue-700 text-xs font-semibold tracking-wide">
                      <ShieldCheck className="w-4 h-4 text-blue-600" />
                      <span>Private Practice • Asian Dental Care • Shivajinagar</span>
                    </div>

                    <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-[1.15]">
                      Modern, Painless Dentistry by{" "}
                      <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                        {CLINIC_INFO.doctor}
                      </span>
                    </h1>

                    <p className="text-lg text-slate-600 leading-relaxed font-normal">
                      Welcome to Asian Dental Care. We are dedicated to providing the highest
                      standard of modern dentistry at an affordable cost. From gentle single-visit
                      root canals and permanent dental implants to invisible aligners and smile
                      reconstruction, your dental health is in expert hands.
                    </p>

                    <blockquote className="border-l-4 border-blue-600 pl-4 py-1 italic text-slate-700 font-medium bg-blue-50/40 rounded-r-lg">
                      {CLINIC_INFO.tagline}
                    </blockquote>

                    {/* Trust Highlights */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
                      <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
                        <div className="text-xs font-medium text-slate-500">Facility</div>
                        <div className="text-sm font-bold text-slate-900 mt-0.5">OT & ICU Equipped</div>
                      </div>
                      <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
                        <div className="text-xs font-medium text-slate-500">Wait Times</div>
                        <div className="text-sm font-bold text-slate-900 mt-0.5">Zero Wait Queuing</div>
                      </div>
                      <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs col-span-2 sm:col-span-1">
                        <div className="text-xs font-medium text-slate-500">Consultation</div>
                        <div className="text-sm font-bold text-slate-900 mt-0.5">In-Clinic & Video</div>
                      </div>
                    </div>

                    {/* CTA Buttons */}
                    <div className="flex flex-wrap items-center gap-4 pt-4">
                      <button
                        onClick={() => setActiveTab("book")}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-7 py-3.5 rounded-xl font-semibold shadow-lg shadow-blue-500/25 hover:shadow-xl transition-all flex items-center gap-2.5 text-base"
                      >
                        <Calendar className="w-5 h-5" />
                        <span>Book an Appointment</span>
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </button>

                      <a
                        href="https://wa.me/918971763097"
                        target="_blank"
                        rel="noreferrer"
                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3.5 rounded-xl font-semibold shadow-md shadow-emerald-500/20 hover:shadow-lg transition-all flex items-center gap-2 text-base"
                      >
                        <MessageCircle className="w-5 h-5" />
                        <span>Chat on WhatsApp</span>
                      </a>
                    </div>
                  </div>

                  {/* Right Column: Doctor Photo & Clinic Card */}
                  <div className="lg:col-span-5 flex justify-center">
                    <div className="relative w-full max-w-md">
                      {/* Decorative backdrop */}
                      <div className="absolute -inset-2 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl blur-xl opacity-20 transform -rotate-1"></div>

                      <div className="relative bg-white rounded-2xl border border-slate-200/80 shadow-xl overflow-hidden">
                        {/* Doctor Image */}
                        <div className="relative h-88 bg-slate-100 overflow-hidden">
                          <img
                            src="/doctor.jpeg"
                            alt="Dr. Adeeb Taha - Consultant Periodontist & Implantologist at Asian Dental Care"
                            className="w-full h-full object-cover object-top hover:scale-102 transition-transform duration-500"
                            onError={(e) => {
                              // Fallback to doctor.png
                              e.target.src = "/doctor.png";
                            }}
                          />
                          <div className="absolute bottom-3 left-3 right-3 bg-slate-900/80 backdrop-blur-md rounded-xl p-3 text-white border border-white/10 flex items-center justify-between">
                            <div>
                              <div className="text-sm font-bold flex items-center gap-1.5">
                                <span>{CLINIC_INFO.doctor}</span>
                                <span className="inline-block w-2 h-2 rounded-full bg-emerald-400"></span>
                              </div>
                              <div className="text-xs text-slate-300">{CLINIC_INFO.degrees} • {CLINIC_INFO.title}</div>
                            </div>
                            <span className="text-[11px] font-semibold bg-blue-500 text-white px-2.5 py-1 rounded-md">
                              FICOI (USA)
                            </span>
                          </div>
                        </div>

                        {/* Card Details */}
                        <div className="p-5 space-y-3.5">
                          <div className="flex items-start gap-3">
                            <MapPin className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
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
                            <span className="font-semibold text-blue-600">Walk-ins & Bookings</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Treatments & Clinical Services Section */}
            <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center max-w-3xl mx-auto mb-14">
                <h2 className="text-xs font-bold uppercase tracking-wider text-blue-600 mb-2">
                  Specialized Procedures
                </h2>
                <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                  Comprehensive Dental Care Under One Roof
                </h3>
                <p className="text-slate-600 mt-3 text-base">
                  From routine preventive hygiene to complex implant surgeries and cosmetic smile
                  makeovers, explore our specialized clinical procedures.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {PROCEDURES.map((p) => {
                  const Icon = p.icon;
                  return (
                    <div
                      key={p.id}
                      className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs hover:shadow-md hover:border-blue-300 transition-all flex flex-col justify-between group"
                    >
                      <div>
                        <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-5 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                          <Icon className="w-6 h-6" />
                        </div>
                        <div className="text-xs font-semibold uppercase tracking-wider text-blue-600 mb-1">
                          {p.category}
                        </div>
                        <h4 className="text-lg font-bold text-slate-900 mb-2">{p.title}</h4>
                        <p className="text-xs text-slate-600 leading-relaxed mb-4">{p.desc}</p>
                      </div>

                      <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {p.duration}
                        </span>
                        <button
                          onClick={() => {
                            setBooking((prev) => ({ ...prev, procedure: p.title }));
                            setActiveTab("book");
                          }}
                          className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 group-hover:translate-x-1 transition-transform"
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

            {/* Clinic Environment & Hospital Integration */}
            <section className="bg-slate-900 text-white py-16">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center md:text-left">
                  <div className="space-y-2">
                    <div className="text-blue-400 font-bold text-lg">Hospital Grade OT & ICU</div>
                    <p className="text-slate-400 text-sm leading-relaxed">
                      Equipped to handle complex dental & maxillofacial surgeries in coordination with
                      complete OT setup at Asian Hospital.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <div className="text-blue-400 font-bold text-lg">Dental Phobia & Gentle Care</div>
                    <p className="text-slate-400 text-sm leading-relaxed">
                      Special care for nervous patients and small children with comfortable, painless,
                      and minimally invasive modern techniques.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <div className="text-blue-400 font-bold text-lg">Direct Doctor Communication</div>
                    <p className="text-slate-400 text-sm leading-relaxed">
                      No intermediaries. Direct post-procedure follow-ups and tele-dentistry with Dr.
                      Adeeb Taha for complete peace of mind.
                    </p>
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* VIEW 2: BOOK APPOINTMENT (Zero Mock Data - Real Supabase Insertion) */}
        {activeTab === "book" && (
          <section className="py-12 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-extrabold text-slate-900">
                Book a Visit with Dr. Adeeb Taha
              </h2>
              <p className="text-slate-600 mt-2 text-sm">
                Reserve your confirmed dental consultation at Asian Dental Care or schedule an
                online video consultation.
              </p>
            </div>

            {bookingSuccess ? (
              <div className="bg-white rounded-2xl p-8 border border-emerald-200 shadow-lg text-center space-y-5 animate-in fade-in zoom-in duration-300">
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-9 h-9" />
                </div>

                <div>
                  <h3 className="text-2xl font-bold text-slate-900">Appointment Requested!</h3>
                  <p className="text-slate-600 text-sm mt-1">
                    Thank you, <span className="font-semibold text-slate-900">{bookingSuccess.patientName}</span>. Your appointment has been recorded directly into our clinic schedule.
                  </p>
                </div>

                <div className="bg-slate-50 rounded-xl p-5 border border-slate-200 max-w-md mx-auto text-left text-sm space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Booking Reference:</span>
                    <span className="font-mono font-semibold text-blue-600">
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
                  For queries, call <a href="tel:+918971763097" className="text-blue-600 font-semibold">+91 8971763097</a>.
                </div>

                <div className="pt-2 flex justify-center gap-3">
                  <button
                    onClick={() => setBookingSuccess(null)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-md"
                  >
                    Book Another Appointment
                  </button>
                  <button
                    onClick={() => setActiveTab("lookup")}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all"
                  >
                    View in Patient Portal
                  </button>
                </div>
              </div>
            ) : (
              <form
                onSubmit={handleBookSubmit}
                className="bg-white rounded-2xl p-6 sm:p-10 border border-slate-200 shadow-md space-y-8"
              >
                {bookingError && (
                  <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <span>{bookingError}</span>
                  </div>
                )}

                {/* Step 1: Consultation Type */}
                <div className="space-y-3">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    1. Consultation Type
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <label
                      className={`cursor-pointer rounded-xl p-4 border flex items-center gap-3.5 transition-all ${
                        booking.consultationType === "IN_PERSON"
                          ? "border-blue-600 bg-blue-50/50 ring-2 ring-blue-500/20"
                          : "border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <input
                        type="radio"
                        name="consultationType"
                        value="IN_PERSON"
                        checked={booking.consultationType === "IN_PERSON"}
                        onChange={(e) =>
                          setBooking({ ...booking, consultationType: e.target.value })
                        }
                        className="sr-only"
                      />
                      <MapPin
                        className={`w-6 h-6 ${
                          booking.consultationType === "IN_PERSON"
                            ? "text-blue-600"
                            : "text-slate-400"
                        }`}
                      />
                      <div>
                        <div className="font-bold text-slate-900 text-sm">In-Clinic Visit</div>
                        <div className="text-xs text-slate-500">
                          Asian Dental Care, Shivaji Nagar, Bengaluru
                        </div>
                      </div>
                    </label>

                    <label
                      className={`cursor-pointer rounded-xl p-4 border flex items-center gap-3.5 transition-all ${
                        booking.consultationType === "VIDEO"
                          ? "border-blue-600 bg-blue-50/50 ring-2 ring-blue-500/20"
                          : "border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <input
                        type="radio"
                        name="consultationType"
                        value="VIDEO"
                        checked={booking.consultationType === "VIDEO"}
                        onChange={(e) =>
                          setBooking({ ...booking, consultationType: e.target.value })
                        }
                        className="sr-only"
                      />
                      <Video
                        className={`w-6 h-6 ${
                          booking.consultationType === "VIDEO" ? "text-blue-600" : "text-slate-400"
                        }`}
                      />
                      <div>
                        <div className="font-bold text-slate-900 text-sm">
                          Online Video Consultation
                        </div>
                        <div className="text-xs text-slate-500">
                          Tele-dentistry discussion & digital prescription
                        </div>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Step 2: Patient Details */}
                <div className="space-y-4">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    2. Patient Details
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Rahul Sharma"
                        value={booking.fullName}
                        onChange={(e) => setBooking({ ...booking, fullName: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Phone Number (WhatsApp) *
                      </label>
                      <input
                        type="tel"
                        required
                        placeholder="e.g. +91 9876543210"
                        value={booking.phone}
                        onChange={(e) => setBooking({ ...booking, phone: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Email Address (Optional)
                    </label>
                    <input
                      type="email"
                      placeholder="e.g. name@example.com"
                      value={booking.email}
                      onChange={(e) => setBooking({ ...booking, email: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                  </div>
                </div>

                {/* Step 3: Procedure & Preferred Time */}
                <div className="space-y-4">
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
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
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

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Preferred Time Slot *
                      </label>
                      <select
                        value={booking.timeSlot}
                        onChange={(e) => setBooking({ ...booking, timeSlot: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
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
                      placeholder="e.g. Pain in lower left molar when chewing, swelling, bleeding gums..."
                      value={booking.notes}
                      onChange={(e) => setBooking({ ...booking, notes: e.target.value })}
                      className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={bookingLoading}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3.5 rounded-xl font-bold text-sm shadow-md shadow-blue-500/20 hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
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
          <section className="py-12 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-extrabold text-slate-900">Patient Portal</h2>
              <p className="text-slate-600 mt-2 text-sm">
                Enter the phone number used during booking to view your appointment history and
                digital prescriptions.
              </p>
            </div>

            <form
              onSubmit={handleLookup}
              className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs mb-8 flex flex-col sm:flex-row gap-3"
            >
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  placeholder="Enter your phone number (e.g. 9876543210)"
                  value={lookupPhone}
                  onChange={(e) => setLookupPhone(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>
              <button
                type="submit"
                disabled={lookupLoading}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2"
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
                      className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                        <div>
                          <span className="text-xs font-mono text-slate-400">
                            #{item.id.slice(0, 8).toUpperCase()}
                          </span>
                          <div className="text-sm font-bold text-slate-900 flex items-center gap-2 mt-0.5">
                            <Calendar className="w-4 h-4 text-blue-600" />
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
                            <FileText className="w-3.5 h-3.5 text-blue-600" />
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
                      className="mt-2 text-xs font-bold text-blue-600 hover:text-blue-700"
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
                <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
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
                      <FileText className="w-4 h-4 text-blue-600" />
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
                          placeholder="e.g. Acute Irreversible Pulpitis #36"
                          value={prescriptionForm.diagnosis}
                          onChange={(e) =>
                            setPrescriptionForm({
                              ...prescriptionForm,
                              diagnosis: e.target.value,
                            })
                          }
                          className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
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
                            className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
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
                                placeholder="Medicine Name (e.g. Paracetamol 650mg)"
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
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
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
                <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-base">{CLINIC_INFO.name}</h4>
                  <p className="text-xs text-blue-600 font-medium">Practice of Dr. Adeeb Taha</p>
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
                className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800 pt-1"
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

      {/* Secure Doctor Login Modal */}
      {showDoctorLoginModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
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
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-center text-lg tracking-widest font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
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
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl text-xs font-semibold shadow-md"
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
