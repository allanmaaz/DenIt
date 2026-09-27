import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from "react-native";
import { colors } from "../../theme/colors";

export default function PatientDetailsScreen({ navigation, route }) {
  const [activeTab, setActiveTab] = useState("About");

  const appointment = route?.params?.appointment;
  const patientProfile = appointment?.patients?.profiles;

  const patientName = patientProfile?.full_name || route?.params?.patientName || "Dental Patient";
  const initial = patientName.slice(0, 1).toUpperCase();
  const phone = patientProfile?.phone || "Not provided";
  const email = patientProfile?.email || "Not provided";

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
          <Text style={styles.title}>Patient Record</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Patient Profile Card */}
          <View style={styles.profileCard}>
            <View style={styles.patientAvatar}>
              <Text style={styles.patientAvatarText}>{initial}</Text>
            </View>
            <Text style={styles.patientName}>{patientName}</Text>
            <Text style={styles.patientSub}>Registered Clinical Patient</Text>
          </View>

          {/* Navigation Tabs */}
          <View style={styles.tabsRow}>
            {["About", "Medical Records", "Appointments"].map((tab) => (
              <TouchableOpacity
                key={tab}
                style={[
                  styles.tabButton,
                  activeTab === tab && styles.tabButtonActive,
                ]}
                onPress={() => setActiveTab(tab)}
              >
                <Text
                  style={[
                    styles.tabLabel,
                    activeTab === tab && styles.tabLabelActive,
                  ]}
                >
                  {tab}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Tab 1: Personal Information */}
          {activeTab === "About" && (
            <View style={styles.infoSection}>
              <Text style={styles.sectionHeading}>Contact & Profile Details</Text>

              <View style={styles.infoItem}>
                <Text style={styles.itemLabel}>Full Name</Text>
                <Text style={styles.itemValue}>{patientName}</Text>
              </View>

              <View style={styles.infoItem}>
                <Text style={styles.itemLabel}>Email Address</Text>
                <Text style={styles.itemValue}>{email}</Text>
              </View>

              <View style={styles.infoItem}>
                <Text style={styles.itemLabel}>Contact Phone</Text>
                <Text style={styles.itemValue}>{phone}</Text>
              </View>

              <View style={styles.infoItem}>
                <Text style={styles.itemLabel}>Primary Clinic</Text>
                <Text style={styles.itemValue}>LeDoctor Dental Care</Text>
              </View>
            </View>
          )}

          {/* Tab 2: Medical Records */}
          {activeTab === "Medical Records" && (
            <View style={styles.emptyRecordsCard}>
              <Text style={styles.emptyRecordsEmoji}>📑</Text>
              <Text style={styles.emptyRecordsTitle}>No Medical Documents Uploaded</Text>
              <Text style={styles.emptyRecordsDesc}>
                Digital X-rays, intra-oral scans, and laboratory reports uploaded by this patient will appear here.
              </Text>
            </View>
          )}

          {/* Tab 3: Appointments */}
          {activeTab === "Appointments" && (
            <View style={styles.recordsList}>
              {appointment ? (
                <View style={styles.recordCard}>
                  <Text style={styles.recordIcon}>📅</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.recordTitle}>
                      {appointment.appointment_type || "Chair Visit"}
                    </Text>
                    <Text style={styles.recordDate}>
                      {appointment.appointment_date} • {appointment.start_time ? appointment.start_time.slice(0, 5) : "Scheduled"}
                    </Text>
                  </View>
                  <Text style={[styles.recordAction, { color: "#16A34A" }]}>
                    {appointment.status || "CONFIRMED"}
                  </Text>
                </View>
              ) : (
                <View style={styles.emptyRecordsCard}>
                  <Text style={styles.emptyRecordsEmoji}>🗓️</Text>
                  <Text style={styles.emptyRecordsTitle}>No Prior Appointments</Text>
                  <Text style={styles.emptyRecordsDesc}>
                    Historical consultations with this patient will be catalogued here.
                  </Text>
                </View>
              )}
            </View>
          )}
        </ScrollView>

        {/* Action Buttons */}
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={styles.messageBtn}
            onPress={() => navigation.navigate("DoctorMessages")}
          >
            <Text style={styles.messageBtnText}>Message Patient</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.prescribeBtn}
            onPress={() =>
              navigation.navigate("CreatePrescription", {
                patientId: appointment?.patients?.id,
                appointmentId: appointment?.id,
              })
            }
          >
            <Text style={styles.prescribeBtnText}>Write Dental Rx</Text>
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
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  profileCard: {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: 10,
  },
  patientAvatar: {
    width: 64,
    height: 64,
    borderRadius: 24,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  patientAvatarText: {
    fontSize: 26,
    fontWeight: "800",
    color: colors.primary,
  },
  patientName: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.text,
  },
  patientSub: {
    fontSize: 12,
    color: colors.muted,
    marginTop: 2,
  },
  tabsRow: {
    flexDirection: "row",
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 4,
    borderWidth: 1,
    borderColor: colors.border,
    marginVertical: 18,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    borderRadius: 10,
  },
  tabButtonActive: {
    backgroundColor: colors.primary,
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.muted,
  },
  tabLabelActive: {
    color: "#FFFFFF",
  },
  infoSection: {
    backgroundColor: colors.card,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 12,
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 4,
  },
  infoItem: {
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
    paddingBottom: 8,
  },
  itemLabel: {
    fontSize: 11,
    color: colors.muted,
  },
  itemValue: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.text,
    marginTop: 2,
  },
  recordsList: {
    gap: 10,
  },
  recordCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 12,
  },
  recordIcon: {
    fontSize: 22,
  },
  recordTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.text,
  },
  recordDate: {
    fontSize: 11,
    color: colors.muted,
    marginTop: 2,
  },
  recordAction: {
    fontSize: 12,
    fontWeight: "700",
  },
  emptyRecordsCard: {
    backgroundColor: colors.card,
    borderRadius: 18,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyRecordsEmoji: {
    fontSize: 36,
    marginBottom: 8,
  },
  emptyRecordsTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 4,
  },
  emptyRecordsDesc: {
    fontSize: 12,
    color: colors.muted,
    textAlign: "center",
    lineHeight: 18,
  },
  bottomBar: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 12,
  },
  messageBtn: {
    flex: 1,
    backgroundColor: colors.background,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  messageBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.text,
  },
  prescribeBtn: {
    flex: 1,
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
  },
  prescribeBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
