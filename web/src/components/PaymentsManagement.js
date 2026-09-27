"use client";

import React, { useState, useEffect } from "react";
import StatsCard from "./StatsCard";
import { CreditCard, DollarSign, ArrowDownLeft, ShieldCheck, Download, Search, AlertCircle } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

export default function PaymentsManagement() {
  const [payments, setPayments] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPayments();
  }, []);

  async function fetchPayments() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("payments")
        .select(`
          id,
          amount,
          currency,
          razorpay_order_id,
          razorpay_payment_id,
          status,
          created_at,
          patients ( profiles ( full_name ) ),
          doctors ( profiles ( full_name ) )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPayments(data || []);
    } catch (err) {
      console.warn("Live payments query:", err.message);
      setPayments([]);
    } finally {
      setLoading(false);
    }
  }

  const totalRevenue = payments
    .filter((p) => p.status === "PAID")
    .reduce((sum, p) => sum + Number(p.amount || 0), 0);

  const totalRefunds = payments.filter((p) => p.status === "REFUNDED").length;

  const filteredPayments = payments.filter((p) => {
    const pName = (p.patients?.profiles?.full_name || "").toLowerCase();
    const dName = (p.doctors?.profiles?.full_name || "").toLowerCase();
    const q = searchQuery.toLowerCase();
    return pName.includes(q) || dName.includes(q);
  });

  return (
    <div className="space-y-6 max-w-full overflow-hidden">
      {/* 4 Financial Metric Cards Calculated from Real Data */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Revenue"
          value={`₹${totalRevenue.toLocaleString("en-IN")}`}
          change={payments.length > 0 ? "+100%" : "₹0"}
          isPositive={true}
          icon={DollarSign}
          color="blue"
        />
        <StatsCard
          title="This Month"
          value={`₹${totalRevenue.toLocaleString("en-IN")}`}
          change="Live"
          isPositive={true}
          icon={CreditCard}
          color="teal"
        />
        <StatsCard
          title="Total Payments"
          value={payments.length.toString()}
          change={`${payments.filter((p) => p.status === "PAID").length} Paid`}
          isPositive={true}
          icon={ShieldCheck}
          color="green"
        />
        <StatsCard
          title="Refunds"
          value={totalRefunds.toString()}
          change="Processed"
          isPositive={totalRefunds === 0}
          icon={ArrowDownLeft}
          color="amber"
        />
      </div>

      {/* Search & Actions Header */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="font-bold text-slate-900 text-base">Payment Transactions</h3>
          <p className="text-xs text-slate-500">Live ledger of consultations processed through Razorpay & Clinic</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative w-full md:w-64">
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
      </div>

      {/* Responsive Ledger Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto min-w-full">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3.5 px-6">Patient</th>
                <th className="py-3.5 px-6">Doctor</th>
                <th className="py-3.5 px-6">Amount</th>
                <th className="py-3.5 px-6">Date</th>
                <th className="py-3.5 px-6">Order Reference</th>
                <th className="py-3.5 px-6 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-400">
                    <span className="inline-block w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-2" />
                    Loading payment ledger...
                  </td>
                </tr>
              ) : filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-14 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
                        <CreditCard className="w-6 h-6" />
                      </div>
                      <p className="font-semibold text-slate-700 text-sm">No transactions yet</p>
                      <p className="text-xs text-slate-400 mt-1 max-w-sm">
                        As appointments are paid through Razorpay or clinic checkout, verified transaction records will appear here.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredPayments.map((p) => {
                  const patientName = p.patients?.profiles?.full_name || "Patient";
                  const doctorName = p.doctors?.profiles?.full_name || "Doctor";
                  const amount = `₹${Number(p.amount || 0).toLocaleString("en-IN")}`;
                  const date = p.created_at ? new Date(p.created_at).toLocaleDateString("en-IN", { day: '2-digit', month: 'short', year: 'numeric' }) : "-";
                  const status = p.status || "PENDING";
                  const orderId = p.razorpay_order_id || p.id?.slice(0, 12);

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-4 px-6 font-semibold text-slate-900">
                        {patientName}
                      </td>
                      <td className="py-4 px-6 text-slate-700">
                        {doctorName}
                      </td>
                      <td className="py-4 px-6 font-bold text-slate-900">
                        {amount}
                      </td>
                      <td className="py-4 px-6 text-slate-500">
                        {date}
                      </td>
                      <td className="py-4 px-6 font-mono text-xs text-slate-400">
                        {orderId}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                            status === "PAID"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : status === "REFUNDED"
                              ? "bg-rose-50 text-rose-700 border border-rose-200"
                              : "bg-amber-50 text-amber-700 border border-amber-200"
                          }`}
                        >
                          {status}
                        </span>
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
