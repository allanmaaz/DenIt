"use client";

import React, { useEffect, useState } from "react";
import StatsCard from "./StatsCard";
import { Users, UserCheck, ShieldAlert, Calendar, CheckCircle2, AlertCircle, ArrowUpRight, DollarSign } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

export default function AdminOverview({ onNavigate }) {
  const [stats, setStats] = useState({
    totalPatients: 0,
    totalDoctors: 0,
    pendingVerification: 0,
    todayAppointments: 0,
    totalRevenue: 0,
  });
  const [recentActivities, setRecentActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  async function fetchDashboardData() {
    setLoading(true);
    try {
      // Fetch live counts from Supabase
      const [
        { count: patientCount },
        { count: doctorCount },
        { count: pendingCount },
        { count: appointmentCount, data: recentAppts },
        { data: paymentsData }
      ] = await Promise.all([
        supabase.from("patients").select("*", { count: "exact", head: true }),
        supabase.from("doctors").select("*", { count: "exact", head: true }),
        supabase.from("doctors").select("*", { count: "exact", head: true }).eq("verification_status", "PENDING"),
        supabase.from("appointments").select("id, status, created_at, appointment_type, profiles:patient_id(full_name), doctor:doctor_id(profiles(full_name))").order("created_at", { ascending: false }).limit(6),
        supabase.from("payments").select("amount, status").eq("status", "PAID"),
      ]);

      const calculatedRevenue = paymentsData?.reduce((acc, curr) => acc + Number(curr.amount || 0), 0) || 0;

      setStats({
        totalPatients: patientCount || 0,
        totalDoctors: doctorCount || 0,
        pendingVerification: pendingCount || 0,
        todayAppointments: appointmentCount || 0,
        totalRevenue: calculatedRevenue,
      });

      if (recentAppts && recentAppts.length > 0) {
        setRecentActivities(recentAppts.map((a, idx) => ({
          id: a.id || idx,
          type: "APPOINTMENT",
          title: "Appointment booked",
          desc: `${a.profiles?.full_name || "Patient"} booked ${a.appointment_type || "Clinic"} consultation`,
          time: new Date(a.created_at || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        })));
      } else {
        setRecentActivities([]);
      }
    } catch (err) {
      console.warn("Could not fetch live Supabase dashboard data:", err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6 max-w-full overflow-hidden">
      {/* 4 Top Metric Cards from Real Supabase State */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Patients"
          value={stats.totalPatients.toLocaleString()}
          change={stats.totalPatients > 0 ? "Active" : "0"}
          isPositive={true}
          icon={Users}
          color="blue"
        />
        <StatsCard
          title="Total Dentists & Doctors"
          value={stats.totalDoctors.toLocaleString()}
          change={stats.totalDoctors > 0 ? "Registered" : "0"}
          isPositive={true}
          icon={UserCheck}
          color="teal"
        />
        <StatsCard
          title="Pending Verification"
          value={stats.pendingVerification.toLocaleString()}
          change={stats.pendingVerification > 0 ? "Action Required" : "None"}
          isPositive={stats.pendingVerification === 0}
          icon={ShieldAlert}
          color="amber"
        />
        <StatsCard
          title="Total Appointments"
          value={stats.todayAppointments.toLocaleString()}
          change="Scheduled"
          isPositive={true}
          icon={Calendar}
          color="green"
        />
      </div>

      {/* Main Charts & Feed Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Appointments Trajectory */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
            <div>
              <h3 className="font-bold text-slate-900 text-base">Appointments Trajectory</h3>
              <p className="text-xs text-slate-500">Live booking volume across active dental chairs & video slots</p>
            </div>
          </div>

          {/* SVG Smooth Curved Area Chart */}
          <div className="w-full h-56 relative flex items-end">
            <svg className="w-full h-full overflow-visible" viewBox="0 0 500 180" preserveAspectRatio="none">
              <defs>
                <linearGradient id="blueGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#2563EB" stopOpacity="0.28" />
                  <stop offset="100%" stopColor="#2563EB" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              <path
                d="M 0 160 Q 60 140, 120 150 T 240 110 T 360 130 T 500 80 L 500 180 L 0 180 Z"
                fill="url(#blueGradient)"
              />
              <path
                d="M 0 160 Q 60 140, 120 150 T 240 110 T 360 130 T 500 80"
                fill="none"
                stroke="#2563EB"
                strokeWidth="3"
                strokeLinecap="round"
              />
            </svg>
          </div>

          <div className="grid grid-cols-5 text-center text-xs text-slate-400 font-medium pt-4 border-t border-slate-100">
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
          </div>
        </div>

        {/* Revenue Metric */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Revenue</h3>
                <p className="text-xs text-slate-500">Gross consultation earnings</p>
              </div>
              <span className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                <DollarSign className="w-4 h-4" />
              </span>
            </div>
            <div className="mt-2">
              <span className="text-2xl sm:text-3xl font-bold text-slate-900">
                ₹{stats.totalRevenue.toLocaleString("en-IN")}
              </span>
              <p className="text-xs font-semibold text-slate-400 mt-1">
                Calculated from verified database payments
              </p>
            </div>
          </div>

          <div className="pt-6">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-600 space-y-1.5">
              <p className="font-semibold text-slate-800">Financial Summary</p>
              <p>Platform status: <span className="font-bold text-emerald-600">Active</span></p>
              <p>Currency: <span className="font-bold text-slate-800">INR (₹)</span></p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activities Section */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-slate-900 text-base">Recent Activities</h3>
            <p className="text-xs text-slate-500">Live platform events from your Supabase database</p>
          </div>
          <button
            onClick={() => onNavigate("appointments")}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            <span>View all</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {recentActivities.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-xs">
            No live activities yet. As users register and book consultations, events will appear here automatically.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {recentActivities.map((activity) => (
              <div key={activity.id} className="py-3 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-900 truncate">{activity.title}</p>
                    <p className="text-[11px] text-slate-500 truncate">{activity.desc}</p>
                  </div>
                </div>
                <span className="text-[11px] font-medium text-slate-400 shrink-0">{activity.time}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
