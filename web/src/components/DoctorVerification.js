"use client";

import React, { useState, useEffect } from "react";
import { Search, FileText, Check, X, ShieldAlert, Award, ExternalLink, AlertTriangle, Users } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

export default function DoctorVerification() {
  const [filter, setFilter] = useState("PENDING");
  const [searchQuery, setSearchQuery] = useState("");
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDoctorDocs, setSelectedDoctorDocs] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    fetchDoctors();
  }, [filter]);

  async function fetchDoctors() {
    setLoading(true);
    try {
      let query = supabase
        .from("doctors")
        .select(`
          id,
          qualification,
          experience_years,
          license_number,
          consultation_fee,
          verification_status,
          clinic_name,
          clinic_address,
          specializations ( id, name ),
          profiles ( id, full_name, email, phone, profile_image )
        `);

      if (filter !== "ALL") {
        query = query.eq("verification_status", filter);
      }

      const { data, error } = await query;
      if (error) throw error;
      setDoctors(data || []);
    } catch (err) {
      console.warn("Live doctor verification query:", err.message);
      setDoctors([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdateStatus(doctorId, newStatus) {
    setActionLoading(doctorId);
    try {
      const { error } = await supabase
        .from("doctors")
        .update({ verification_status: newStatus, updated_at: new Date().toISOString() })
        .eq("id", doctorId);

      if (error) throw error;

      // Optimistically update state
      setDoctors((prev) =>
        prev.map((doc) => (doc.id === doctorId ? { ...doc, verification_status: newStatus } : doc))
      );
    } catch (err) {
      console.error("Failed to update doctor verification status:", err);
      alert("Database error: Could not update status. Please check your Supabase connection.");
    } finally {
      setActionLoading(null);
    }
  }

  const filteredDoctors = doctors.filter((doc) => {
    const name = doc.profiles?.full_name?.toLowerCase() || "";
    const spec = doc.specializations?.name?.toLowerCase() || "";
    const license = doc.license_number?.toLowerCase() || "";
    const q = searchQuery.toLowerCase();
    return name.includes(q) || spec.includes(q) || license.includes(q);
  });

  return (
    <div className="space-y-6 max-w-full overflow-hidden">
      {/* Header & Controls */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl w-fit">
          {["PENDING", "VERIFIED", "REJECTED", "ALL"].map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                filter === tab
                  ? "bg-white text-slate-900 shadow-sm shadow-slate-200"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              {tab.toLowerCase()}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search doctor or license..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 text-xs sm:text-sm rounded-xl pl-9 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-800 placeholder:text-slate-400"
          />
        </div>
      </div>

      {/* Responsive Data Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto min-w-full">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3.5 px-6">Doctor</th>
                <th className="py-3.5 px-6">Specialization</th>
                <th className="py-3.5 px-6">License Number</th>
                <th className="py-3.5 px-6">Status</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
              {loading ? (
                <tr>
                  <td colSpan="5" className="py-12 text-center text-slate-400">
                    <span className="inline-block w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-2" />
                    Loading practitioners from Supabase...
                  </td>
                </tr>
              ) : filteredDoctors.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-14 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
                        <Users className="w-6 h-6" />
                      </div>
                      <p className="font-semibold text-slate-700 text-sm">No doctors found</p>
                      <p className="text-xs text-slate-400 mt-1 max-w-sm">
                        There are currently no doctor records matching "{filter}" in your database.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredDoctors.map((doc) => (
                  <tr key={doc.id} className="hover:bg-slate-50/50 transition-colors">
                    {/* Doctor Info */}
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm shrink-0">
                          {doc.profiles?.full_name?.replace("Dr. ", "").slice(0, 1) || "D"}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{doc.profiles?.full_name || "Doctor"}</p>
                          <p className="text-[11px] text-slate-400">{doc.qualification}</p>
                        </div>
                      </div>
                    </td>

                    {/* Specialization */}
                    <td className="py-4 px-6">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700">
                        {doc.specializations?.name || "General"}
                      </span>
                    </td>

                    {/* License Number */}
                    <td className="py-4 px-6 font-mono text-xs text-slate-600">
                      {doc.license_number}
                    </td>

                    {/* Status Badge */}
                    <td className="py-4 px-6">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                          doc.verification_status === "VERIFIED"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : doc.verification_status === "REJECTED"
                            ? "bg-rose-50 text-rose-700 border border-rose-200"
                            : "bg-amber-50 text-amber-700 border border-amber-200"
                        }`}
                      >
                        {doc.verification_status}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setSelectedDoctorDocs(doc)}
                          className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-colors flex items-center gap-1.5"
                        >
                          <FileText className="w-3.5 h-3.5 text-slate-500" />
                          <span>View Documents</span>
                        </button>

                        {doc.verification_status === "PENDING" && (
                          <>
                            <button
                              disabled={actionLoading === doc.id}
                              onClick={() => handleUpdateStatus(doc.id, "VERIFIED")}
                              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors flex items-center gap-1 shadow-sm shadow-emerald-600/20"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Verify</span>
                            </button>
                            <button
                              disabled={actionLoading === doc.id}
                              onClick={() => handleUpdateStatus(doc.id, "REJECTED")}
                              className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold transition-colors flex items-center gap-1 shadow-sm shadow-rose-600/20"
                            >
                              <X className="w-3.5 h-3.5" />
                              <span>Reject</span>
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: View Doctor Verification Documents */}
      {selectedDoctorDocs && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 relative">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">{selectedDoctorDocs.profiles?.full_name}</h3>
                  <p className="text-xs text-slate-500">License Verification Dossier</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedDoctorDocs(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-3.5 text-xs text-slate-600">
              <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                <p className="font-semibold text-slate-800">Clinic Affiliation</p>
                <p className="text-slate-600">{selectedDoctorDocs.clinic_name || "Dental Practice"}</p>
                <p className="text-slate-400 text-[11px]">{selectedDoctorDocs.clinic_address || "Address pending submission"}</p>
              </div>

              <div className="space-y-2">
                <p className="font-semibold text-slate-800">Submitted Verification Details</p>
                <div className="p-3 border border-slate-200 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-600" />
                    <div>
                      <p className="font-medium text-slate-900">Medical/Dental Registration Number</p>
                      <p className="text-[10px] text-slate-400 font-mono">{selectedDoctorDocs.license_number}</p>
                    </div>
                  </div>
                </div>

                <div className="p-3 border border-slate-200 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-600" />
                    <div>
                      <p className="font-medium text-slate-900">Degree & Qualifications</p>
                      <p className="text-[10px] text-slate-400">{selectedDoctorDocs.qualification}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                onClick={() => setSelectedDoctorDocs(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => {
                  handleUpdateStatus(selectedDoctorDocs.id, "VERIFIED");
                  setSelectedDoctorDocs(null);
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
              >
                Approve & Verify Doctor
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
