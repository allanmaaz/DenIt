import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
} from "react-native";
import { colors } from "../../theme/colors";
import { supabase } from "../../services/supabase";

export default function DoctorDashboardScreen({ navigation }) {
  const [doctorName, setDoctorName] = useState("Doctor");
  const [appointments, setAppointments] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    completed: 0,
    earnings: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDoctorData();
  }, []);

  const fetchDoctorData = async () => {
    setLoading(true);
    try {
      // 1. Get logged in doctor profile
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", user.id)
          .single();
        if (profile?.full_name) {
          setDoctorName(profile.full_name);
        }
      }

      // 2. Fetch appointments from Supabase
      const { data: apptsData, error: apptErr } = await supabase
        .from("appointments")
        .select(`
          id,
          appointment_date,
          start_time,
          end_time,
          appointment_type,
          status,
          patients (
            id,
            profiles ( full_name, phone )
          )
        `)
        .order("created_at", { ascending: false });

      if (apptErr) throw apptErr;

      // 3. Fetch earnings from payments
      const { data: paymentsData } = await supabase
        .from("payments")
        .select("amount, status")
        .eq("status", "PAID");

      const totalEarnings = paymentsData?.reduce((acc, p) => acc + Number(p.amount || 0), 0) || 0;

      const appts = apptsData || [];
      setAppointments(appts);
      setStats({
        total: appts.length,
        pending: appts.filter((a) => a.status === "PENDING").length,
        completed: appts.filter((a) => a.status === "COMPLETED").length,
        earnings: totalEarnings,
      });
    } catch (err) {
      console.warn("Could not fetch doctor dashboard data:", err.message);
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  const initial = doctorName.replace("Dr. ", "").trim().slice(0, 1) || "D";

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header with Avatar & Greeting */}
        <View style={styles.header}>
          <View style={styles.avatarGreetingRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initial}</Text>
            </View>
            <View>
              <Text style={styles.greetingSub}>Dental Practitioner Portal</Text>
              <Text style={styles.doctorName}>{doctorName} 👋</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.bellBtn}
            onPress={fetchDoctorData}
            accessibilityLabel="Refresh Dashboard"
          >
            <Text style={styles.bellIcon}>↻</Text>
          </TouchableOpacity>
        </View>

        {/* Real Overview Grid Calculated from Database */}
        <Text style={styles.sectionHeading}>Clinic Overview</Text>
        <View style={styles.overviewGrid}>
          {/* Appointments */}
          <View style={[styles.statBox, { borderColor: "#BFDBFE" }]}>
            <View style={[styles.statIconBadge, { backgroundColor: "#EFF6FF" }]}>
              <Text style={styles.statIcon}>📋</Text>
            </View>
            <Text style={styles.statValue}>{stats.total}</Text>
            <Text style={styles.statLabel}>Total Appts</Text>
          </View>

          {/* Pending */}
          <View style={[styles.statBox, { borderColor: "#FED7AA" }]}>
            <View style={[styles.statIconBadge, { backgroundColor: "#FFF7ED" }]}>
              <Text style={styles.statIcon}>⏳</Text>
            </View>
            <Text style={[styles.statValue, { color: "#EA580C" }]}>{stats.pending}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>

          {/* Completed */}
          <View style={[styles.statBox, { borderColor: "#BBF7D0" }]}>
            <View style={[styles.statIconBadge, { backgroundColor: "#F0FDF4" }]}>
              <Text style={styles.statIcon}>✅</Text>
            </View>
            <Text style={[styles.statValue, { color: "#16A34A" }]}>{stats.completed}</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>

          {/* Earnings */}
          <View style={[styles.statBox, { borderColor: "#99F6E4" }]}>
            <View style={[styles.statIconBadge, { backgroundColor: "#F0FDFA" }]}>
              <Text style={styles.statIcon}>💰</Text>
            </View>
            <Text style={[styles.statValue, { color: "#0D9488" }]}>₹{stats.earnings}</Text>
            <Text style={styles.statLabel}>Earnings</Text>
          </View>
        </View>

        {/* Live Appointments List */}
        <View style={styles.listHeaderRow}>
          <Text style={styles.sectionHeading}>Recent Appointments</Text>
          <TouchableOpacity onPress={() => navigation.navigate("DoctorAppointments")}>
            <Text style={styles.seeAllText}>View all</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={styles.loadingText}>Fetching patient appointments...</Text>
          </View>
        ) : appointments.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyEmoji}>🦷</Text>
            <Text style={styles.emptyTitle}>No Appointments Scheduled</Text>
            <Text style={styles.emptyDesc}>
              No patient visits have been booked yet. When patients book dental consultations or cleaning slots, they will appear here.
            </Text>
          </View>
        ) : (
          <View style={styles.appointmentsList}>
            {appointments.slice(0, 5).map((appt) => {
              const patientName = appt.patients?.profiles?.full_name || "Patient";
              const pInitial = patientName.slice(0, 1).toUpperCase();
              const timeDisplay = appt.start_time
                ? `${appt.start_time.slice(0, 5)} • ${appt.appointment_date}`
                : appt.appointment_date;

              return (
                <TouchableOpacity
                  key={appt.id}
                  style={styles.appointmentRowCard}
                  activeOpacity={0.8}
                  onPress={() => navigation.navigate("PatientDetails", { appointment: appt })}
                >
                  <Text style={styles.timeColumn}>{appt.start_time ? appt.start_time.slice(0, 5) : "--:--"}</Text>

                  <View style={styles.patientAvatar}>
                    <Text style={styles.patientAvatarText}>{pInitial}</Text>
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={styles.patientName}>{patientName}</Text>
                    <Text style={styles.patientType}>{appt.appointment_type || "Clinic Visit"}</Text>
                  </View>

                  <View
                    style={[
                      styles.statusBadge,
                      appt.status === "CONFIRMED"
                        ? styles.statusConfirmed
                        : styles.statusPending,
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusText,
                        appt.status === "CONFIRMED"
                          ? styles.statusTextConfirmed
                          : styles.statusTextPending,
                      ]}
                    >
                      {appt.status || "CONFIRMED"}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Doctor Bottom Navigation Bar */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem}>
          <Text style={styles.navActiveIcon}>🏠</Text>
          <Text style={[styles.navLabel, styles.navLabelActive]}>Overview</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigation.navigate("DoctorAppointments")}
        >
          <Text style={styles.navIcon}>📅</Text>
          <Text style={styles.navLabel}>Schedule</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigation.navigate("CreatePrescription")}
        >
          <Text style={styles.navIcon}>✍️</Text>
          <Text style={styles.navLabel}>Prescribe</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigation.navigate("DoctorEarnings")}
        >
          <Text style={styles.navIcon}>💰</Text>
          <Text style={styles.navLabel}>Earnings</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
    marginBottom: 20,
  },
  avatarGreetingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 18,
  },
  greetingSub: {
    fontSize: 11,
    color: colors.muted,
  },
  doctorName: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.text,
  },
  bellBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.card,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  bellIcon: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 12,
  },
  overviewGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 24,
  },
  statBox: {
    width: "48%",
    backgroundColor: colors.card,
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
  },
  statIconBadge: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  statIcon: {
    fontSize: 16,
  },
  statValue: {
    fontSize: 22,
    fontWeight: "800",
    color: colors.text,
  },
  statLabel: {
    fontSize: 11,
    color: colors.muted,
    marginTop: 2,
    fontWeight: "500",
  },
  listHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  seeAllText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.primary,
  },
  appointmentsList: {
    gap: 10,
  },
  appointmentRowCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 12,
  },
  timeColumn: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.muted,
    width: 48,
  },
  patientAvatar: {
    width: 38,
    height: 38,
    borderRadius: 14,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  patientAvatarText: {
    fontSize: 15,
    fontWeight: "800",
    color: colors.primary,
  },
  patientName: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.text,
  },
  patientType: {
    fontSize: 11,
    color: colors.muted,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  statusConfirmed: {
    backgroundColor: "#EFF6FF",
  },
  statusPending: {
    backgroundColor: "#FFF7ED",
  },
  statusText: {
    fontSize: 10,
    fontWeight: "700",
  },
  statusTextConfirmed: {
    color: colors.primary,
  },
  statusTextPending: {
    color: "#EA580C",
  },
  loadingBox: {
    paddingVertical: 40,
    alignItems: "center",
  },
  loadingText: {
    marginTop: 8,
    fontSize: 12,
    color: colors.muted,
  },
  emptyCard: {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyEmoji: {
    fontSize: 36,
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 4,
  },
  emptyDesc: {
    fontSize: 12,
    color: colors.muted,
    textAlign: "center",
    lineHeight: 18,
  },
  bottomNav: {
    flexDirection: "row",
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingVertical: 10,
    paddingHorizontal: 16,
    justifyContent: "space-around",
  },
  navItem: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 4,
    minWidth: 50,
  },
  navActiveIcon: {
    fontSize: 20,
    marginBottom: 2,
  },
  navIcon: {
    fontSize: 20,
    marginBottom: 2,
    opacity: 0.6,
  },
  navLabel: {
    fontSize: 10,
    color: colors.muted,
    fontWeight: "500",
  },
  navLabelActive: {
    color: colors.primary,
    fontWeight: "700",
  },
});
