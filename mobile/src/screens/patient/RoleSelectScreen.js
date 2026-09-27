import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from "react-native";
import { colors } from "../../theme/colors";
import { useAppStore } from "../../store/useAppStore";

export default function RoleSelectScreen({ navigation }) {
  const setUserRole = useAppStore((state) => state.setUserRole);

  const handleSelectPatient = () => {
    setUserRole("PATIENT");
    navigation.replace("PatientHome");
  };

  const handleSelectDoctor = () => {
    setUserRole("DOCTOR");
    navigation.replace("DoctorDashboard");
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Choose Your Role</Text>
          <Text style={styles.subtitle}>Select how you want to use LeDoctor</Text>
        </View>

        <View style={styles.cardsContainer}>
          {/* Patient Card */}
          <TouchableOpacity
            style={styles.roleCard}
            activeOpacity={0.8}
            onPress={handleSelectPatient}
          >
            <View style={styles.cardHeader}>
              <View style={[styles.avatarCircle, { backgroundColor: "#DBEAFE" }]}>
                <Text style={styles.avatarEmoji}>👤</Text>
              </View>
              <Text style={styles.arrowIcon}>→</Text>
            </View>
            <Text style={styles.roleTitle}>I am a Patient</Text>
            <Text style={styles.roleDesc}>
              Find doctors, book appointments and manage your health records.
            </Text>
          </TouchableOpacity>

          {/* Doctor Card */}
          <TouchableOpacity
            style={styles.roleCard}
            activeOpacity={0.8}
            onPress={handleSelectDoctor}
          >
            <View style={styles.cardHeader}>
              <View style={[styles.avatarCircle, { backgroundColor: "#DCFCE7" }]}>
                <Text style={styles.avatarEmoji}>👨‍⚕️</Text>
              </View>
              <Text style={styles.arrowIcon}>→</Text>
            </View>
            <Text style={styles.roleTitle}>I am a Doctor</Text>
            <Text style={styles.roleDesc}>
              Consult with patients, issue digital prescriptions and manage your practice.
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerNote}>
            Verified practitioners undergo medical credential verification by LeDoctor Admins.
          </Text>
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
    paddingHorizontal: 20,
    justifyContent: "space-between",
    paddingVertical: 24,
  },
  header: {
    marginTop: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    color: colors.text,
  },
  subtitle: {
    fontSize: 14,
    color: colors.muted,
    marginTop: 6,
  },
  cardsContainer: {
    gap: 16,
  },
  roleCard: {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  avatarCircle: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarEmoji: {
    fontSize: 24,
  },
  arrowIcon: {
    fontSize: 20,
    color: colors.primary,
    fontWeight: "700",
  },
  roleTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 6,
  },
  roleDesc: {
    fontSize: 13,
    color: colors.muted,
    lineHeight: 18,
  },
  footer: {
    alignItems: "center",
  },
  footerNote: {
    fontSize: 11,
    color: colors.muted,
    textAlign: "center",
    lineHeight: 16,
    paddingHorizontal: 16,
  },
});
