import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { colors } from "../../theme/colors";
import { supabase } from "../../services/supabase";

export default function DoctorAppointmentsScreen({ navigation }) {
  const [activeFilter, setActiveFilter] = useState("All");
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    setLoading(true);
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
    } catch (err) {
      console.warn("Could not fetch doctor appointments:", err.message);
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      const { error } = await supabase
        .from("appointments")
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq("id", id);

      if (error) throw error;

      setAppointments((prev) =>
        prev.map((app) => (app.id === id ? { ...app, status: newStatus } : app))
      );
    } catch (err) {
      Alert.alert("Update Failed", err.message);
    }
  };

  const filtered = appointments.filter((a) => {
    if (activeFilter === "All") return true;
    if (activeFilter === "Pending") return a.status === "PENDING";
    if (activeFilter === "Confirmed") return a.status === "CONFIRMED";
    if (activeFilter === "Completed") return a.status === "COMPLETED";
    return true;
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
            accessibilityLabel="Back"
          >
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Chair Appointments</Text>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={fetchAppointments}
            accessibilityLabel="Refresh Appointments"
          >
            <Text style={styles.backIcon}>↻</Text>
          </TouchableOpacity>
        </View>

        {/* Segmented Filter Control */}
        <View style={styles.filterBar}>
          {["All", "Pending", "Confirmed", "Completed"].map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[
                styles.filterTab,
                activeFilter === tab && styles.filterTabActive,
              ]}
              onPress={() => setActiveFilter(tab)}
            >
              <Text
                style={[
                  styles.filterLabel,
                  activeFilter === tab && styles.filterLabelActive,
                ]}
              >
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Appointments List */}
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.loadingText}>Fetching scheduled appointments...</Text>
            </View>
          ) : filtered.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyEmoji}>📅</Text>
              <Text style={styles.emptyTitle}>No Appointments Found</Text>
              <Text style={styles.emptyDesc}>
                {activeFilter === "All"
                  ? "No dental visits or consultations have been registered in the database yet."
                  : `No appointments currently marked as ${activeFilter}.`}
              </Text>
              <TouchableOpacity
                style={styles.refreshBtn}
                onPress={fetchAppointments}
              >
                <Text style={styles.refreshBtnText}>Refresh</Text>
              </TouchableOpacity>
            </View>
          ) : (
            filtered.map((appt) => {
              const patientName = appt.patients?.profiles?.full_name || "Patient";
              const pInitial = patientName.slice(0, 1).toUpperCase();
              const timeDisplay = appt.start_time ? appt.start_time.slice(0, 5) : "--:--";

              return (
                <View key={appt.id} style={styles.appointmentCard}>
                  <View style={styles.cardTopRow}>
                    <View style={styles.patientAvatar}>
                      <Text style={styles.patientAvatarText}>{pInitial}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.patientName}>{patientName}</Text>
                      <Text style={styles.apptTime}>
                        📅 {appt.appointment_date} • ⏰ {timeDisplay}
                      </Text>
                      <Text style={styles.apptType}>
                        {appt.appointment_type === "VIDEO" ? "📹 Tele-Dentistry" : "🏥 Chair Procedure"}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.statusBadge,
                        appt.status === "CONFIRMED"
                          ? styles.statusConfirmed
                          : appt.status === "COMPLETED"
                          ? styles.statusCompleted
                          : styles.statusPending,
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusText,
                          appt.status === "CONFIRMED"
                            ? styles.statusTextConfirmed
                            : appt.status === "COMPLETED"
                            ? styles.statusTextCompleted
                            : styles.statusTextPending,
                        ]}
                      >
                        {appt.status}
                      </Text>
                    </View>
                  </View>

                  {/* Action Buttons for Managing Appointments */}
                  <View style={styles.actionsRow}>
                    {appt.status === "PENDING" && (
                      <>
                        <TouchableOpacity
                          style={styles.confirmBtn}
                          onPress={() => handleUpdateStatus(appt.id, "CONFIRMED")}
                        >
                          <Text style={styles.btnTextWhite}>Confirm Slot</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.cancelBtn}
                          onPress={() => handleUpdateStatus(appt.id, "CANCELLED")}
                        >
                          <Text style={styles.cancelBtnText}>Decline</Text>
                        </TouchableOpacity>
                      </>
                    )}

                    {appt.status === "CONFIRMED" && (
                      <>
                        <TouchableOpacity
                          style={styles.confirmBtn}
                          onPress={() => handleUpdateStatus(appt.id, "COMPLETED")}
                        >
                          <Text style={styles.btnTextWhite}>Mark Completed</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.outlineBtn}
                          onPress={() => navigation.navigate("CreatePrescription", { appointmentId: appt.id, patientId: appt.patients?.id })}
                        >
                          <Text style={styles.outlineBtnText}>Write Rx</Text>
                        </TouchableOpacity>
                      </>
                    )}
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.card,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  backIcon: {
    fontSize: 18,
    color: colors.text,
    fontWeight: "700",
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
  },
  filterBar: {
    flexDirection: "row",
    backgroundColor: colors.card,
    marginHorizontal: 20,
    marginVertical: 10,
    borderRadius: 14,
    padding: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    borderRadius: 10,
  },
  filterTabActive: {
    backgroundColor: colors.primary,
  },
  filterLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.muted,
  },
  filterLabelActive: {
    color: "#FFFFFF",
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 12,
  },
  loadingContainer: {
    paddingVertical: 60,
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 13,
    color: colors.muted,
  },
  emptyContainer: {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 28,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: 20,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 10,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 6,
  },
  emptyDesc: {
    fontSize: 13,
    color: colors.muted,
    textAlign: "center",
    lineHeight: 18,
    marginBottom: 16,
  },
  refreshBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },
  refreshBtnText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "600",
  },
  appointmentCard: {
    backgroundColor: colors.card,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 12,
  },
  cardTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  patientAvatar: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  patientAvatarText: {
    fontSize: 17,
    fontWeight: "800",
    color: colors.primary,
  },
  patientName: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.text,
  },
  apptTime: {
    fontSize: 11,
    color: colors.muted,
    marginTop: 3,
  },
  apptType: {
    fontSize: 11,
    color: colors.primary,
    fontWeight: "600",
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusConfirmed: {
    backgroundColor: "#EFF6FF",
  },
  statusCompleted: {
    backgroundColor: "#F0FDF4",
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
  statusTextCompleted: {
    color: "#16A34A",
  },
  statusTextPending: {
    color: "#EA580C",
  },
  actionsRow: {
    flexDirection: "row",
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    paddingTop: 10,
  },
  confirmBtn: {
    flex: 1,
    backgroundColor: colors.primary,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: "center",
  },
  btnTextWhite: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  cancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: "center",
    backgroundColor: "#FEE2E2",
  },
  cancelBtnText: {
    color: "#DC2626",
    fontSize: 12,
    fontWeight: "600",
  },
  outlineBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  outlineBtnText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: "600",
  },
});
