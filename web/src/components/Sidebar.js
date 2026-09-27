"use client";

import React from "react";
import {
  LayoutDashboard,
  UserCheck,
  Users,
  Calendar,
  CreditCard,
  BarChart3,
  Stethoscope,
  Star,
  Settings,
  ShieldAlert,
  LogOut,
  Cross
} from "lucide-react";

export default function Sidebar({ currentView, setCurrentView, pendingDoctorCount = 0, userRole = "ADMIN" }) {
  const navItems = [
    { id: "overview", label: "Dashboard", icon: LayoutDashboard },
    { id: "doctors", label: "Doctors", icon: UserCheck, badge: pendingDoctorCount > 0 ? pendingDoctorCount : null },
    { id: "patients", label: "Patients", icon: Users },
    { id: "appointments", label: "Appointments", icon: Calendar },
    { id: "payments", label: "Payments", icon: CreditCard },
    { id: "analytics", label: "Analytics", icon: BarChart3 },
    { id: "specializations", label: "Specializations", icon: Stethoscope },
    { id: "reviews", label: "Reviews", icon: Star },
    { id: "doctor-portal", label: "Doctor Portal", icon: Stethoscope, highlight: true },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200 min-h-screen flex flex-col justify-between select-none">
      <div>
        {/* Brand Logo Header */}
        <div className="h-16 flex items-center px-6 gap-3 border-b border-slate-100">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
              <path d="M19 10.5h-5.5V5c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v5.5H5c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5h5.5V19c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5v-5.5H19c.83 0 1.5-.67 1.5-1.5s-.67-1.5-1.5-1.5z" />
            </svg>
          </div>
          <div>
            <h1 className="font-bold text-lg text-slate-900 tracking-tight flex items-center gap-1.5">
              LeDoctor
            </h1>
            <p className="text-[11px] text-slate-400 font-medium tracking-wide uppercase">Admin & Doctor Hub</p>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="p-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentView(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? "bg-blue-600 text-white shadow-sm shadow-blue-600/30"
                    : item.highlight
                    ? "text-blue-600 hover:bg-blue-50/80 font-semibold"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? "text-white" : item.highlight ? "text-blue-600" : "text-slate-400"}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${
                    isActive ? "bg-white text-blue-600" : "bg-amber-100 text-amber-700"
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer Info / Role Badge */}
      <div className="p-4 border-t border-slate-100">
        <div className="bg-slate-50 rounded-xl p-3 flex items-center gap-3 border border-slate-100">
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold text-xs">
            {userRole.slice(0, 2)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-slate-800 truncate">LeDoctor Platform</p>
            <p className="text-[11px] text-slate-400 truncate">{userRole} Session</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
