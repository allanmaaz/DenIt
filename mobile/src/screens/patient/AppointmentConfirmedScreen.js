import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Alert,
} from "react-native";
import { colors } from "../../theme/colors";
import { useAppStore } from "../../store/useAppStore";

export default function AppointmentConfirmedScreen({ navigation }) {
  const bookingDraft = useAppStore((state) => state.bookingDraft);

  const doctorName = bookingDraft.doctor?.name || "Dental Specialist";
  const doctorSpec = bookingDraft.doctor?.specialization || "General Dentistry";
  const dateStr =
    bookingDraft.date ||
    new Date().toLocaleDateString("en-US", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  const timeStr = bookingDraft.timeSlot || "Scheduled Slot";
  const apptType =
    bookingDraft.appointmentType === "VIDEO"
      ? "Digital Tele-Dentistry"
      : "In-Clinic Dental Visit";
  const amount = bookingDraft.amount || 500;

  const initial = doctorName.replace("Dr. ", "").trim().slice(0, 1) || "D";

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Success Icon & Badge */}
        <View style={styles.successSection}>
          <View style={styles.checkCircle}>
            <Text style={styles.checkIcon}>✓</Text>
          </View>
          <Text style={styles.title}>Dental Appointment Confirmed</Text>
          <Text style={styles.subtitle}>
            Your appointment has been registered in the clinic database.
          </Text>
        </View>

        {/* Appointment Card */}
        <View style={styles.summaryCard}>
          <View style={styles.docRow}>
            <View style={styles.docAvatar}>
              <Text style={styles.docAvatarText}>{initial}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.docName}>{doctorName}</Text>
              <Text style={styles.docSpec}>{doctorSpec}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <Text style={styles.detailIcon}>📅</Text>
            <Text style={styles.detailText}>{dateStr}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailIcon}>⏰</Text>
            <Text style={styles.detailText}>{timeStr}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailIcon}>{bookingDraft.appointmentType === "VIDEO" ? "📹" : "🏥"}</Text>
            <Text style={styles.detailText}>{apptType}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.amountRow}>
            <Text style={styles.amountLabel}>Consultation Fee Paid</Text>
            <View style={styles.paidBadge}>
              <Text style={styles.amountText}>₹{amount}</Text>
              <Text style={styles.paidText}>PAID</Text>
            </View>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actionsBox}>
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => navigation.replace("PatientHome")}
          >
            <Text style={styles.primaryBtnText}>Return to Home</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.outlineBtn}
            onPress={() => navigation.navigate("PrescriptionView")}
          >
            <Text style={styles.outlineBtnText}>View Prescriptions & History</Text>
          </TouchableOpacity>
        </View>
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
    paddingHorizontal: 24,
    justifyContent: "space-between",
    paddingVertical: 24,
  },
  successSection: {
    alignItems: "center",
    marginTop: 20,
  },
  checkCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#10B981",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#10B981",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
    marginBottom: 16,
  },
  checkIcon: {
    color: "#FFFFFF",
    fontSize: 32,
    fontWeight: "800",
  },
  title: {
    fontSize: 20,
    fontWeight: "800",
    color: colors.text,
    textAlign: "center",
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    color: colors.muted,
    textAlign: "center",
    lineHeight: 18,
    paddingHorizontal: 12,
  },
  summaryCard: {
    backgroundColor: colors.card,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 3,
  },
  docRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  docAvatar: {
    width: 52,
    height: 52,
    borderRadius: 18,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  docAvatarText: {
    fontSize: 20,
    fontWeight: "800",
    color: colors.primary,
  },
  docName: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
  },
  docSpec: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: "600",
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 14,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    gap: 10,
  },
  detailIcon: {
    fontSize: 16,
  },
  detailText: {
    fontSize: 13,
    color: colors.text,
    fontWeight: "500",
  },
  amountRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  amountLabel: {
    fontSize: 13,
    color: colors.muted,
    fontWeight: "600",
  },
  paidBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  amountText: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.text,
  },
  paidText: {
    backgroundColor: "#F0FDF4",
    color: "#16A34A",
    fontSize: 10,
    fontWeight: "800",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#BBF7D0",
  },
  actionsBox: {
    gap: 12,
    marginBottom: 10,
  },
  primaryBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
  },
  primaryBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  outlineBtn: {
    backgroundColor: colors.card,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  outlineBtnText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "600",
  },
});
