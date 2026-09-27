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

export default function PrescriptionViewScreen({ navigation }) {
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPrescriptions();
  }, []);

  const fetchPrescriptions = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("prescriptions")
        .select(`
          id,
          diagnosis,
          instructions,
          follow_up_date,
          created_at,
          prescription_medicines (
            id,
            medicine_name,
            dosage,
            frequency,
            duration,
            instructions
          ),
          doctors (
            id,
            qualification,
            clinic_name,
            profiles ( full_name ),
            specializations ( name )
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPrescriptions(data || []);
    } catch (err) {
      console.warn("Could not fetch prescriptions:", err.message);
      setPrescriptions([]);
    } finally {
      setLoading(false);
    }
  };

  const activePrescription = prescriptions.length > 0 ? prescriptions[0] : null;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.navigate("PatientHome")}
            accessibilityLabel="Back"
          >
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Dental Prescription</Text>
          <TouchableOpacity
            style={styles.homeBtn}
            onPress={fetchPrescriptions}
            accessibilityLabel="Refresh Prescriptions"
          >
            <Text style={styles.homeIcon}>↻</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.loadingText}>Fetching digital prescriptions...</Text>
            </View>
          ) : !activePrescription ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyEmoji}>📋</Text>
              <Text style={styles.emptyTitle}>No Prescriptions Found</Text>
              <Text style={styles.emptyDesc}>
                No digital prescriptions have been issued to your account yet. When your dentist creates an e-prescription during a dental consultation, your medications, dosage timings, and post-procedure instructions will be securely displayed here.
              </Text>
              <TouchableOpacity
                style={styles.bookBtn}
                onPress={() => navigation.navigate("DoctorSearch")}
              >
                <Text style={styles.bookBtnText}>Find a Dentist</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {/* Doctor Header Banner */}
              <View style={styles.doctorCard}>
                <View style={styles.docAvatar}>
                  <Text style={styles.docAvatarText}>
                    {activePrescription.doctors?.profiles?.full_name?.replace("Dr. ", "").trim().slice(0, 1) || "D"}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.docName}>
                    {activePrescription.doctors?.profiles?.full_name || "Dentist"}
                  </Text>
                  <Text style={styles.docSpec}>
                    {activePrescription.doctors?.qualification || "BDS"} • {activePrescription.doctors?.specializations?.name || "Dentistry"}
                  </Text>
                  <Text style={styles.dateStamp}>
                    Issued on {new Date(activePrescription.created_at).toLocaleDateString()} • {activePrescription.doctors?.clinic_name || "Dental Clinic"}
                  </Text>
                </View>
              </View>

              {/* Clinical Diagnosis Block */}
              <View style={styles.infoBlock}>
                <Text style={styles.blockHeading}>Clinical Dental Diagnosis</Text>
                <View style={styles.cardBox}>
                  <Text style={styles.diagnosisText}>
                    {activePrescription.diagnosis || "Dental Examination & Treatment"}
                  </Text>
                </View>
              </View>

              {/* Dental Post-Op Instructions */}
              {activePrescription.instructions ? (
                <View style={styles.infoBlock}>
                  <Text style={styles.blockHeading}>Post-Procedure Dental Instructions</Text>
                  <View style={styles.cardBox}>
                    <Text style={styles.instructionsText}>
                      {activePrescription.instructions}
                    </Text>
                  </View>
                </View>
              ) : null}

              {/* Prescribed Dental Medications */}
              <View style={styles.infoBlock}>
                <Text style={styles.blockHeading}>Prescribed Medications</Text>
                {activePrescription.prescription_medicines &&
                activePrescription.prescription_medicines.length > 0 ? (
                  <View style={styles.medicinesList}>
                    {activePrescription.prescription_medicines.map((med, idx) => (
                      <View key={med.id || idx} style={styles.medCard}>
                        <View style={styles.medIconCircle}>
                          <Text style={styles.medIcon}>💊</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.medName}>{med.medicine_name}</Text>
                          <Text style={styles.medSchedule}>
                            {med.dosage} • {med.frequency} • {med.duration}
                          </Text>
                          {med.instructions ? (
                            <Text style={styles.medTiming}>{med.instructions}</Text>
                          ) : null}
                        </View>
                      </View>
                    ))}
                  </View>
                ) : (
                  <View style={styles.cardBox}>
                    <Text style={styles.emptyMedsText}>No specific medications attached to this record.</Text>
                  </View>
                )}
              </View>

              {/* Follow-up Date */}
              {activePrescription.follow_up_date ? (
                <View style={styles.followUpCard}>
                  <Text style={styles.followUpIcon}>🗓️</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.followUpLabel}>Recommended Follow-up</Text>
                    <Text style={styles.followUpValue}>
                      {new Date(activePrescription.follow_up_date).toLocaleDateString()}
                    </Text>
                  </View>
                </View>
              ) : null}
            </>
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
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.card,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  backIcon: {
    fontSize: 18,
    color: colors.text,
  },
  title: {
    fontSize: 17,
    fontWeight: "700",
    color: colors.text,
  },
  homeBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  homeIcon: {
    fontSize: 18,
    color: colors.text,
    fontWeight: "700",
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 18,
    gap: 16,
  },
  loadingContainer: {
    paddingVertical: 60,
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 13,
    color: colors.muted,
  },
  emptyContainer: {
    backgroundColor: colors.card,
    borderRadius: 24,
    padding: 28,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: 20,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 8,
  },
  emptyDesc: {
    fontSize: 13,
    color: colors.muted,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 20,
  },
  bookBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 14,
  },
  bookBtnText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
  doctorCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 14,
  },
  docAvatar: {
    width: 52,
    height: 52,
    borderRadius: 18,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  docAvatarText: {
    fontSize: 22,
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
  dateStamp: {
    fontSize: 11,
    color: colors.muted,
    marginTop: 4,
  },
  infoBlock: {
    gap: 8,
  },
  blockHeading: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.text,
  },
  cardBox: {
    backgroundColor: colors.card,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  diagnosisText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
    lineHeight: 20,
  },
  instructionsText: {
    fontSize: 13,
    color: colors.text,
    lineHeight: 20,
  },
  medicinesList: {
    gap: 10,
  },
  medCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 12,
  },
  medIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  medIcon: {
    fontSize: 18,
  },
  medName: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.text,
  },
  medSchedule: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: "600",
    marginTop: 2,
  },
  medTiming: {
    fontSize: 11,
    color: colors.muted,
    marginTop: 2,
  },
  emptyMedsText: {
    fontSize: 12,
    color: colors.muted,
  },
  followUpCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0FDF4",
    borderWidth: 1,
    borderColor: "#BBF7D0",
    padding: 14,
    borderRadius: 16,
    gap: 12,
  },
  followUpIcon: {
    fontSize: 20,
  },
  followUpLabel: {
    fontSize: 11,
    color: "#16A34A",
    fontWeight: "600",
  },
  followUpValue: {
    fontSize: 14,
    fontWeight: "700",
    color: "#15803D",
    marginTop: 2,
  },
});
