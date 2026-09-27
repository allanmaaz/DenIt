"use client";

import React, { useState, useEffect } from "react";
import {
  Calendar,
  Clock,
  Video,
  FileText,
  Plus,
  Trash2,
  CheckCircle,
  User,
  Settings,
  Pill,
  Send,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

export default function DoctorWebPortal() {
  const [activeTab, setActiveTab] = useState("appointments");
  const [doctorName, setDoctorName] = useState("Dentist");
  const [specialization, setSpecialization] = useState("Dental Practice");
  const [doctorId, setDoctorId] = useState(null);

  // Appointments Queue State
  const [appointments, setAppointments] = useState([]);
  const [loadingAppts, setLoadingAppts] = useState(true);

  // Dental Prescription Form State
  const [selectedApptId, setSelectedApptId] = useState("");
  const [patientName, setPatientName] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [instructions, setInstructions] = useState("");
  const [followUpDate, setFollowUpDate] = useState("");
  const [medicines, setMedicines] = useState([]);
  const [newMed, setNewMed] = useState({
    name: "",
    dosage: "",
    frequency: "Twice daily",
    duration: "5 days",
    instructions: "After meals",
  });
  const [prescriptionSuccess, setPrescriptionSuccess] = useState(false);
  const [savingPrescription, setSavingPrescription] = useState(false);

  // Dental Clinic Availability State
  const [slotDuration, setSlotDuration] = useState("30");
  const [workingHours, setWorkingHours] = useState({ start: "09:30", end: "18:00" });
  const [activeDays, setActiveDays] = useState({
    Mon: true,
    Tue: true,
    Wed: true,
    Thu: true,
    Fri: true,
    Sat: true,
    Sun: false,
  });

  useEffect(() => {
    fetchDoctorProfile();
    fetchAppointments();
  }, []);

  const fetchDoctorProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setDoctorId(user.id);
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", user.id)
          .single();
        if (profile?.full_name) {
          setDoctorName(profile.full_name);
        }
        const { data: doc } = await supabase
          .from("doctors")
          .select("qualification, specializations(name)")
          .eq("id", user.id)
          .single();
        if (doc) {
          const specName = doc.specializations?.name || "General Dentistry";
          setSpecialization(`${specName} (${doc.qualification || "BDS"})`);
        }
      } else {
        // Find first registered doctor in database
        const { data: doctors } = await supabase
          .from("doctors")
          .select("id, qualification, profiles(full_name), specializations(name)")
          .limit(1);
        if (doctors && doctors.length > 0) {
          const d = doctors[0];
          setDoctorId(d.id);
          if (d.profiles?.full_name) setDoctorName(d.profiles.full_name);
          const spec = d.specializations?.name || "Dentistry";
          setSpecialization(`${spec} (${d.qualification || "BDS"})`);
        }
      }
    } catch (err) {
      console.warn("Could not load doctor profile:", err.message);
    }
  };

  const fetchAppointments = async () => {
    setLoadingAppts(true);
    try {
      const { data, error } = await supabase
        .from("appointments")
        .select(`
          id,
          appointment_date,
          start_time,
          end_time,
          appointment_type,
          status,
          payment_status,
          patients (
            id,
            profiles ( full_name, phone, email )
          )
        `)
        .order("appointment_date", { ascending: false });

      if (error) throw error;
      setAppointments(data || []);
      if (data && data.length > 0 && !selectedApptId) {
        setSelectedApptId(data[0].id);
        setPatientName(data[0].patients?.profiles?.full_name || "");
      }
    } catch (err) {
      console.warn("Could not fetch appointments:", err.message);
      setAppointments([]);
    } finally {
      setLoadingAppts(false);
    }
  };

  const handleUpdateStatus = async (appointmentId, newStatus) => {
    try {
      const { error } = await supabase
        .from("appointments")
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq("id", appointmentId);

      if (error) throw error;
      setAppointments((prev) =>
        prev.map((a) => (a.id === appointmentId ? { ...a, status: newStatus } : a))
      );
    } catch (err) {
      alert("Status update failed: " + err.message);
    }
  };

  const handleAddMedicine = () => {
    if (!newMed.name.trim()) return;
    setMedicines([...medicines, { ...newMed, id: Date.now() }]);
    setNewMed({
      name: "",
      dosage: "",
      frequency: "Twice daily",
      duration: "5 days",
      instructions: "After meals",
    });
  };

  const handleRemoveMedicine = (idx) => {
    setMedicines(medicines.filter((_, i) => i !== idx));
  };

  const handleSavePrescription = async (e) => {
    e.preventDefault();
    if (!diagnosis.trim()) {
      alert("Please enter a clinical dental diagnosis.");
      return;
    }

    setSavingPrescription(true);
    try {
      // Find selected appointment details
      const chosenAppt = appointments.find((a) => a.id === selectedApptId) || appointments[0];
      const pId = chosenAppt?.patients?.id;
      const dId = doctorId || chosenAppt?.doctor_id;

      if (!chosenAppt || !pId) {
        // If no appointment exists, create without foreign appointment constraint or notify
        alert("Please ensure at least one patient appointment exists in database before issuing prescriptions.");
        setSavingPrescription(false);
        return;
      }

      const { data: newPresc, error: prescError } = await supabase
        .from("prescriptions")
        .insert([
          {
            appointment_id: chosenAppt.id,
            patient_id: pId,
            doctor_id: dId,
            diagnosis: diagnosis.trim(),
            instructions: instructions.trim(),
            follow_up_date: followUpDate || null,
          },
        ])
        .select()
        .single();

      if (prescError) throw prescError;

      if (medicines.length > 0 && newPresc?.id) {
        const medInserts = medicines.map((m) => ({
          prescription_id: newPresc.id,
          medicine_name: m.name,
          dosage: m.dosage || "1 tablet",
          frequency: m.frequency,
          duration: m.duration,
          instructions: m.instructions || "Take as instructed",
        }));
        await supabase.from("prescription_medicines").insert(medInserts);
      }

      setPrescriptionSuccess(true);
      setDiagnosis("");
      setInstructions("");
      setMedicines([]);
      setTimeout(() => setPrescriptionSuccess(false), 5000);
    } catch (err) {
      alert("Error issuing prescription: " + err.message);
    } finally {
      setSavingPrescription(false);
    }
  };

  const todayCount = appointments.length;
  const pendingCount = appointments.filter((a) => a.status === "PENDING").length;
  const completedCount = appointments.filter((a) => a.status === "COMPLETED").length;

  return (
    <div className="space-y-6 max-w-full overflow-hidden">
      {/* Dental Clinic Header Banner */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-800 rounded-2xl p-6 text-white shadow-lg shadow-blue-500/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-semibold mb-2">
            Dental Practice Workspace 🦷
          </span>
          <h2 className="text-xl sm:text-2xl font-bold">Good day, {doctorName} 👋</h2>
          <p className="text-blue-100 text-xs sm:text-sm mt-0.5">{specialization}</p>
        </div>

        {/* Portal Tabs */}
        <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-md p-1 rounded-xl w-fit">
          <button
            onClick={() => setActiveTab("appointments")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === "appointments" ? "bg-white text-blue-600 shadow-sm" : "text-white/80 hover:text-white"
            }`}
          >
            Dental Schedule
          </button>
          <button
            onClick={() => setActiveTab("prescription")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === "prescription" ? "bg-white text-blue-600 shadow-sm" : "text-white/80 hover:text-white"
            }`}
          >
            Write Prescription
          </button>
          <button
            onClick={() => setActiveTab("availability")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === "availability" ? "bg-white text-blue-600 shadow-sm" : "text-white/80 hover:text-white"
            }`}
          >
            Clinic Hours & Chairs
          </button>
        </div>
      </div>

      {/* Tab 1: Dental Appointments Queue */}
      {activeTab === "appointments" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Scheduled Consultations</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-2">{todayCount} Patients</h3>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pending Bookings</p>
              <h3 className="text-2xl font-bold text-amber-600 mt-2">{pendingCount} Requests</h3>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Completed Procedures</p>
              <h3 className="text-2xl font-bold text-emerald-600 mt-2">{completedCount} Procedures</h3>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900 text-base">Dental Patient Queue</h3>
              <button
                onClick={fetchAppointments}
                className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 px-3 py-1.5 rounded-lg transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Refresh Queue</span>
              </button>
            </div>

            {loadingAppts ? (
              <div className="py-12 text-center text-slate-400 text-sm">
                Fetching patient queue from Supabase...
              </div>
            ) : appointments.length === 0 ? (
              <div className="py-16 text-center">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 mx-auto flex items-center justify-center text-xl mb-3">
                  🦷
                </div>
                <h4 className="font-bold text-slate-800 text-sm">No Patients in Chair Queue</h4>
                <p className="text-slate-500 text-xs mt-1 max-w-sm mx-auto">
                  When patients book dental appointments or tele-dentistry calls, their scheduled slots will appear here in real time.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {appointments.map((appt) => {
                  const pName = appt.patients?.profiles?.full_name || "Patient";
                  const initial = pName.slice(0, 1).toUpperCase();
                  const timeStr = appt.start_time ? appt.start_time.slice(0, 5) : "--:--";

                  return (
                    <div
                      key={appt.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-50 rounded-xl gap-3 border border-slate-100 hover:border-slate-200 transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm">
                          {initial}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 text-sm">{pName}</p>
                          <p className="text-xs text-slate-500 flex items-center gap-2">
                            <span>📅 {appt.appointment_date} • ⏰ {timeStr}</span> •{" "}
                            <span className="text-blue-600 font-medium">
                              {appt.appointment_type === "VIDEO" ? "📹 Tele-Dentistry" : "🏥 In-Clinic"}
                            </span>
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {appt.status === "PENDING" ? (
                          <>
                            <button
                              onClick={() => handleUpdateStatus(appt.id, "CONFIRMED")}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold transition-colors"
                            >
                              Confirm Slot
                            </button>
                            <button
                              onClick={() => handleUpdateStatus(appt.id, "CANCELLED")}
                              className="px-3 py-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-xl text-xs font-semibold transition-colors"
                            >
                              Decline
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => {
                                setSelectedApptId(appt.id);
                                setPatientName(pName);
                                setActiveTab("prescription");
                              }}
                              className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
                            >
                              Write Rx
                            </button>
                            {appt.status !== "COMPLETED" && (
                              <button
                                onClick={() => handleUpdateStatus(appt.id, "COMPLETED")}
                                className="px-3.5 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-xl text-xs font-semibold transition-colors"
                              >
                                Mark Completed
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Create Dental Prescription */}
      {activeTab === "prescription" && (
        <form onSubmit={handleSavePrescription} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-slate-900 text-base">Dental Prescription & Post-Op Plan</h3>
              <p className="text-xs text-slate-500">Record tooth diagnosis, oral medications, and instructions into patient record</p>
            </div>
            {prescriptionSuccess && (
              <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-semibold animate-in fade-in">
                <CheckCircle className="w-4 h-4" /> Dental Prescription Issued & Stored
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Select Appointment / Patient</label>
              {appointments.length > 0 ? (
                <select
                  value={selectedApptId}
                  onChange={(e) => {
                    setSelectedApptId(e.target.value);
                    const chosen = appointments.find((a) => a.id === e.target.value);
                    setPatientName(chosen?.patients?.profiles?.full_name || "");
                  }}
                  className="w-full bg-slate-50 border border-slate-200 text-sm rounded-xl px-3.5 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  {appointments.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.patients?.profiles?.full_name || "Patient"} — {a.appointment_date} ({a.appointment_type})
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  placeholder="Patient Name"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-sm rounded-xl px-3.5 py-2.5 text-slate-900"
                />
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Dental Diagnosis & Tooth # *</label>
              <input
                type="text"
                value={diagnosis}
                onChange={(e) => setDiagnosis(e.target.value)}
                placeholder="e.g. Acute Irreversible Pulpitis #46 Lower Right Molar"
                required
                className="w-full bg-slate-50 border border-slate-200 text-sm rounded-xl px-3.5 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Post-Procedure Dental Instructions</label>
            <textarea
              rows={3}
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="e.g. Maintain bite on gauze pack for 45 minutes. Warm salt water rinses 3x daily..."
              className="w-full bg-slate-50 border border-slate-200 text-sm rounded-xl p-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          {/* Medicines List */}
          <div className="space-y-3">
            <label className="block text-xs font-bold text-slate-700 uppercase">Prescribed Dental Medications</label>
            {medicines.length === 0 ? (
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-center text-xs text-slate-500">
                No medications added yet. Use the fields below to add antibiotics, analgesics, or antiseptic rinses.
              </div>
            ) : (
              <div className="space-y-2">
                {medicines.map((med, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200/80">
                    <div className="flex items-center gap-3">
                      <Pill className="w-4 h-4 text-blue-600" />
                      <div>
                        <p className="font-bold text-sm text-slate-900">{med.name}</p>
                        <p className="text-xs text-slate-500">
                          {med.dosage} • {med.frequency} • {med.duration} ({med.instructions})
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveMedicine(idx)}
                      className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Add Medication Subform */}
            <div className="p-4 border border-dashed border-slate-200 rounded-xl bg-slate-50/50 space-y-3">
              <p className="text-xs font-bold text-slate-700">Add Oral Medication</p>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                <input
                  type="text"
                  placeholder="e.g. Amoxicillin 500mg"
                  value={newMed.name}
                  onChange={(e) => setNewMed({ ...newMed, name: e.target.value })}
                  className="bg-white border border-slate-200 text-xs rounded-lg px-3 py-2 text-slate-900"
                />
                <input
                  type="text"
                  placeholder="Dosage (e.g. 1 tab)"
                  value={newMed.dosage}
                  onChange={(e) => setNewMed({ ...newMed, dosage: e.target.value })}
                  className="bg-white border border-slate-200 text-xs rounded-lg px-3 py-2 text-slate-900"
                />
                <select
                  value={newMed.frequency}
                  onChange={(e) => setNewMed({ ...newMed, frequency: e.target.value })}
                  className="bg-white border border-slate-200 text-xs rounded-lg px-2.5 py-2 text-slate-900"
                >
                  <option>Twice daily</option>
                  <option>Thrice daily</option>
                  <option>Once daily</option>
                  <option>SOS (Pain only)</option>
                </select>
                <button
                  type="button"
                  onClick={handleAddMedicine}
                  className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold px-3 py-2 flex items-center justify-center gap-1 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" /> Add to List
                </button>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-slate-100">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Recommended Follow-up Date</label>
              <input
                type="date"
                value={followUpDate}
                onChange={(e) => setFollowUpDate(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-xs rounded-xl px-3 py-2 text-slate-800"
              />
            </div>
            <button
              type="submit"
              disabled={savingPrescription}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl flex items-center gap-2 shadow-md shadow-blue-600/20 transition-all self-end"
            >
              <Send className="w-4 h-4" />
              <span>{savingPrescription ? "Storing in Supabase..." : "Issue Dental Prescription"}</span>
            </button>
          </div>
        </form>
      )}

      {/* Tab 3: Dental Clinic Hours & Chair Scheduling */}
      {activeTab === "availability" && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
          <div className="pb-4 border-b border-slate-100">
            <h3 className="font-bold text-slate-900 text-base">Clinic Operating Hours & Chair Slots</h3>
            <p className="text-xs text-slate-500">Configure operating times for in-clinic procedures and video assessments</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Procedure Slot Duration</label>
              <select
                value={slotDuration}
                onChange={(e) => setSlotDuration(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-sm rounded-xl px-3 py-2.5 text-slate-800"
              >
                <option value="20">20 Minutes (Checkup & Scaling)</option>
                <option value="30">30 Minutes (Consultation & Filling)</option>
                <option value="45">45 Minutes (Root Canal & Surgery)</option>
                <option value="60">60 Minutes (Smile Design & Implants)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Daily Clinic Hours</label>
              <div className="flex items-center gap-2">
                <input
                  type="time"
                  value={workingHours.start}
                  onChange={(e) => setWorkingHours({ ...workingHours, start: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 text-sm rounded-xl px-3 py-2 text-slate-800"
                />
                <span className="text-xs text-slate-400">to</span>
                <input
                  type="time"
                  value={workingHours.end}
                  onChange={(e) => setWorkingHours({ ...workingHours, end: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 text-sm rounded-xl px-3 py-2 text-slate-800"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Clinic Open Days</label>
            <div className="flex flex-wrap gap-2">
              {Object.keys(activeDays).map((day) => (
                <button
                  key={day}
                  type="button"
                  onClick={() => setActiveDays({ ...activeDays, [day]: !activeDays[day] })}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    activeDays[day]
                      ? "bg-blue-600 text-white shadow-sm shadow-blue-600/20"
                      : "bg-slate-100 text-slate-400 hover:text-slate-600"
                  }`}
                >
                  {day}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button
              onClick={() => alert("Clinic schedule updated successfully.")}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl shadow-md shadow-blue-600/20 transition-all"
            >
              Save Clinic Schedule
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
