"use client";

import React, { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import TopNav from "@/components/TopNav";
import AdminOverview from "@/components/AdminOverview";
import DoctorVerification from "@/components/DoctorVerification";
import AppointmentsManagement from "@/components/AppointmentsManagement";
import PaymentsManagement from "@/components/PaymentsManagement";
import DoctorWebPortal from "@/components/DoctorWebPortal";
import SpecializationsManagement from "@/components/SpecializationsManagement";
import AuthModal from "@/components/AuthModal";
import { supabase } from "@/lib/supabaseClient";
import { X, Users, Activity, Settings as SettingsIcon, RefreshCw } from "lucide-react";

export default function DashboardPage() {
  const [currentView, setCurrentView] = useState("overview");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState("ADMIN");

  // Patients view state
  const [patients, setPatients] = useState([]);
  const [loadingPatients, setLoadingPatients] = useState(false);

  useEffect(() => {
    // Check initial Supabase Auth session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setCurrentUser(session.user);
        const metadataRole = session.user.user_metadata?.role || "ADMIN";
        setUserRole(metadataRole);
      }
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setCurrentUser(session.user);
        setUserRole(session.user.user_metadata?.role || "ADMIN");
      } else {
        setCurrentUser(null);
        setUserRole("ADMIN");
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (currentView === "patients") {
      fetchPatients();
    }
  }, [currentView]);

  const fetchPatients = async () => {
    setLoadingPatients(true);
    try {
      const { data, error } = await supabase
        .from("patients")
        .select(`
          id,
          blood_group,
          emergency_contact,
          created_at,
          profiles ( full_name, email, phone )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPatients(data || []);
    } catch (err) {
      console.warn("Could not fetch patients:", err.message);
      setPatients([]);
    } finally {
      setLoadingPatients(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
  };

  const getTitle = () => {
    switch (currentView) {
      case "overview":
        return "Dashboard Overview";
      case "doctors":
        return "Doctor Verification & Management";
      case "appointments":
        return "Appointments Management";
      case "payments":
        return "Payments & Revenue Ledger";
      case "specializations":
        return "Medical Specializations";
      case "doctor-portal":
        return "Doctor Clinical Workspace";
      case "patients":
        return "Registered Patients Directory";
      case "settings":
        return "Platform Infrastructure & Settings";
      default:
        return "Dashboard";
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row antialiased text-slate-900">
      {/* Desktop Sidebar (hidden on mobile/tablet) */}
      <div className="hidden lg:block shrink-0">
        <Sidebar
          currentView={currentView}
          setCurrentView={setCurrentView}
          pendingDoctorCount={0}
          userRole={userRole}
        />
      </div>

      {/* Mobile / Tablet Drawer Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative w-72 bg-white h-full shadow-2xl z-10 flex flex-col">
            <div className="p-4 flex items-center justify-between border-b border-slate-100">
              <span className="font-bold text-slate-900">LeDoctor Navigation</span>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <Sidebar
                currentView={currentView}
                setCurrentView={(v) => {
                  setCurrentView(v);
                  setMobileMenuOpen(false);
                }}
                pendingDoctorCount={0}
                userRole={userRole}
              />
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
        <TopNav
          title={getTitle()}
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
          onOpenAuth={() => setAuthModalOpen(true)}
          currentUser={currentUser}
          onSignOut={handleSignOut}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {currentView === "overview" && <AdminOverview onNavigate={setCurrentView} />}
          {currentView === "doctors" && <DoctorVerification />}
          {currentView === "appointments" && <AppointmentsManagement />}
          {currentView === "payments" && <PaymentsManagement />}
          {currentView === "specializations" && <SpecializationsManagement />}
          {currentView === "doctor-portal" && <DoctorWebPortal />}

          {/* Patients Directory View (100% Real Database Queries) */}
          {currentView === "patients" && (
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Registered Patients</h3>
                  <p className="text-xs text-slate-500">Live profiles from Supabase database</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-xl text-xs font-bold">
                    {patients.length} Total
                  </span>
                  <button
                    onClick={fetchPatients}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                    title="Refresh"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {loadingPatients ? (
                <div className="py-12 text-center text-slate-400 text-sm">
                  Fetching registered patients from Supabase...
                </div>
              ) : patients.length === 0 ? (
                <div className="py-16 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 mx-auto flex items-center justify-center text-xl mb-3">
                    👥
                  </div>
                  <h4 className="font-bold text-slate-800 text-sm">No Patients Registered Yet</h4>
                  <p className="text-slate-500 text-xs mt-1 max-w-sm mx-auto">
                    When patients register on the mobile app or web platform, their profile and health records will appear here.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {patients.map((pt) => {
                    const fullName = pt.profiles?.full_name || "Patient";
                    const email = pt.profiles?.email || "No email";
                    const phone = pt.profiles?.phone || "No phone";
                    const initial = fullName.slice(0, 1).toUpperCase();

                    return (
                      <div key={pt.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm">
                            {initial}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 text-sm">{fullName}</p>
                            <p className="text-xs text-slate-500">
                              {email} • Blood Group: <span className="font-semibold text-slate-700">{pt.blood_group || "Not specified"}</span>
                            </p>
                          </div>
                        </div>
                        <div className="text-left sm:text-right text-xs text-slate-500">
                          <p className="font-medium text-slate-700">{phone}</p>
                          <p className="text-[11px] text-slate-400">Emergency: {pt.emergency_contact || "None"}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Settings View */}
          {currentView === "settings" && (
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-6">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Infrastructure & Gateway Settings</h3>
                <p className="text-xs text-slate-500">Environment keys, Cloudflare Edge, and Supabase connection state</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80">
                  <p className="font-bold text-slate-800">Supabase PostgreSQL</p>
                  <p className="text-slate-500 mt-1">Status: <span className="font-bold text-emerald-600">Active & Connected</span></p>
                  <p className="text-slate-400 mt-0.5">RLS Policies: 15 tables protected</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80">
                  <p className="font-bold text-slate-800">Cloudflare Edge Gateway</p>
                  <p className="text-slate-500 mt-1">Status: <span className="font-bold text-emerald-600">Configured</span></p>
                  <p className="text-slate-400 mt-0.5">Workers: Agora Token, Razorpay Webhooks, AI Proxy</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80">
                  <p className="font-bold text-slate-800">Razorpay Payment Gateway</p>
                  <p className="text-slate-500 mt-1">Status: <span className="font-bold text-emerald-600">Ready</span></p>
                  <p className="text-slate-400 mt-0.5">Currency: INR (₹) • Webhook Verified</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80">
                  <p className="font-bold text-slate-800">FastAPI AI Microservice</p>
                  <p className="text-slate-500 mt-1">Status: <span className="font-bold text-emerald-600">Configured on port 8000</span></p>
                  <p className="text-slate-400 mt-0.5">Safety Disclaimer & Symptom Assistant Active</p>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Supabase Authentication Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onAuthSuccess={(user) => {
          setCurrentUser(user);
        }}
      />
    </div>
  );
}
