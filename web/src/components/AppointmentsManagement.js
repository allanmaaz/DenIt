"use client";

import React, { useState, useEffect } from "react";
import { Search, Calendar, Video, Phone, User, CheckCircle, Clock, XCircle, AlertCircle, RefreshCw } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

export default function AppointmentsManagement() {
  const [filter, setFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAppointments();
  }, [filter]);

  async function fetchAppointments() {
    setLoading(true);
    try {
      let query = supabase
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
            profiles ( full_name, email, phone )
          ),
          doctors (
            id,
            profiles ( full_name, email ),
            specializations ( name )
          )
        `)
        .order("appointment_date", { ascending: false });

      if (filter !== "ALL") {
        query = query.eq("status", filter);
      }

      const { data, error } = await query;
      if (error) throw error;
      setAppointments(data || []);
    } catch (err) {
      console.warn("Live appointments query:", err.message);
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdateStatus(appointmentId, newStatus) {
    try {
      const { error } = await supabase
        .from("appointments")
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq("id", appointmentId);

      if (error) throw error;

      setAppointments((prev) =>
        prev.map((app) => (app.id === appointmentId ? { ...app, status: newStatus } : app))
      );
    } catch (err) {
      console.error("Status update error:", err);
      alert("Database error: Could not update appointment status.");
    }
  }

  const filteredAppointments = appointments.filter((app) => {
    const pName = (app.patients?.profiles?.full_name || "").toLowerCase();
    const dName = (app.doctors?.profiles?.full_name || "").toLowerCase();
    const q = searchQuery.toLowerCase();
    return pName.includes(q) || dName.includes(q);
  });

  return (
    <div className="space-y-6 max-w-full overflow-hidden">
      {/* Filter Tabs and Search Bar */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl w-fit overflow-x-auto max-w-full">
          {["ALL", "PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"].map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold capitalize whitespace-nowrap transition-all ${
                filter === tab
                  ? "bg-white text-slate-900 shadow-sm shadow-slate-200"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              {tab.toLowerCase()}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search patient or doctor..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 text-xs sm:text-sm rounded-xl pl-9 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-800 placeholder:text-slate-400"
          />
        </div>
      </div>

      {/* Responsive Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto min-w-full">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3.5 px-6">Patient</th>
                <th className="py-3.5 px-6">Doctor</th>
                <th className="py-3.5 px-6">Date & Time</th>
                <th className="py-3.5 px-6">Type</th>
                <th className="py-3.5 px-6">Status</th>
                <th className="py-3.5 px-6">Payment</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-400">
                    <span className="inline-block w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-2" />
                    Fetching appointments from database...
                  </td>
                </tr>
              ) : filteredAppointments.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-14 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
                        <Calendar className="w-6 h-6" />
                      </div>
                      <p className="font-semibold text-slate-700 text-sm">No appointments found</p>
                      <p className="text-xs text-slate-400 mt-1 max-w-sm">
                        No appointments currently match this filter. As patients book consultations, they will appear here in real time.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredAppointments.map((app) => {
                  const patientName = app.patients?.profiles?.full_name || "Patient";
                  const doctorName = app.doctors?.profiles?.full_name || "Doctor";
                  const dateStr = `${app.appointment_date} • ${app.start_time?.slice(0, 5)}`;
                  const type = app.appointment_type || "IN_PERSON";
                  const status = app.status || "PENDING";
                  const payment = app.payment_status || "PENDING";

                  return (
                    <tr key={app.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-4 px-6 font-semibold text-slate-900">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs">
                            {patientName.slice(0, 1)}
                          </div>
                          <span>{patientName}</span>
                        </div>
                      </td>

                      <td className="py-4 px-6 text-slate-700 font-medium">
                        {doctorName}
                      </td>

                      <td className="py-4 px-6 text-slate-500 whitespace-nowrap">
                        {dateStr}
                      </td>

                      <td className="py-4 px-6">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700">
                          {type.toLowerCase() === "video" ? (
                            <Video className="w-3.5 h-3.5 text-blue-600" />
                          ) : type.toLowerCase() === "audio" ? (
                            <Phone className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <User className="w-3.5 h-3.5 text-purple-600" />
                          )}
                          <span>{type}</span>
                        </span>
                      </td>

                      <td className="py-4 px-6">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                            status === "CONFIRMED"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : status === "PENDING"
                              ? "bg-amber-50 text-amber-700 border border-amber-200"
                              : status === "COMPLETED"
                              ? "bg-blue-50 text-blue-700 border border-blue-200"
                              : "bg-rose-50 text-rose-700 border border-rose-200"
                          }`}
                        >
                          {status}
                        </span>
                      </td>

                      <td className="py-4 px-6">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider ${
                            payment === "PAID"
                              ? "bg-emerald-100/70 text-emerald-800"
                              : payment === "REFUNDED"
                              ? "bg-rose-100/70 text-rose-800"
                              : "bg-amber-100/70 text-amber-800"
                          }`}
                        >
                          {payment}
                        </span>
                      </td>

                      <td className="py-4 px-6 text-right">
                        {status === "PENDING" && (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleUpdateStatus(app.id, "CONFIRMED")}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition-colors"
                            >
                              Confirm
                            </button>
                            <button
                              onClick={() => handleUpdateStatus(app.id, "CANCELLED")}
                              className="px-2.5 py-1 bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-600 text-xs font-semibold rounded-lg transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        )}
                        {status === "CONFIRMED" && (
                          <button
                            onClick={() => handleUpdateStatus(app.id, "COMPLETED")}
                            className="px-2.5 py-1 bg-blue-50 text-blue-600 hover:bg-blue-100 text-xs font-semibold rounded-lg transition-colors"
                          >
                            Mark Completed
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
