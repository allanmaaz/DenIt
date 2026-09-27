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
import { useAppStore } from "../../store/useAppStore";
import { supabase } from "../../services/supabase";

export default function PatientHomeScreen({ navigation }) {
  const setActiveCall = useAppStore((state) => state.setActiveCall);
  const [userName, setUserName] = useState("Patient");
  const [upcomingAppointment, setUpcomingAppointment] = useState(null);
  const [loadingAppt, setLoadingAppt] = useState(true);

  // Dental Specialty Categories
  const dentalCategories = [
    { id: "1", name: "Dentistry", emoji: "🦷", color: "#EFF6FF" },
    { id: "2", name: "Whitening", emoji: "✨", color: "#FEF3C7" },
    { id: "3", name: "Root Canal", emoji: "⚡", color: "#FEE2E2" },
    { id: "4", name: "Aligners", emoji: "😬", color: "#F3E8FF" },
  ];

  useEffect(() => {
    checkCurrentUser();
    fetchUpcomingAppointment();
  }, []);

  const checkCurrentUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", user.id)
          .single();
        if (profile?.full_name) {
          setUserName(profile.full_name.split(" ")[0]);
        } else if (user.email) {
          setUserName(user.email.split("@")[0]);
        }
      }
    } catch (err) {
      console.warn("Could not fetch user profile:", err.message);
    }
  };

  const fetchUpcomingAppointment = async () => {
    setLoadingAppt(true);
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
          doctors (
            id,
            qualification,
            clinic_name,
            profiles ( full_name ),
            specializations ( name )
          )
        `)
        .eq("status", "CONFIRMED")
        .order("appointment_date", { ascending: true })
        .limit(1);

      if (error) throw error;
      if (data && data.length > 0) {
        setUpcomingAppointment(data[0]);
      } else {
        setUpcomingAppointment(null);
      }
    } catch (err) {
      console.warn("Could not fetch upcoming appointment:", err.message);
      setUpcomingAppointment(null);
    } finally {
      setLoadingAppt(false);
    }
  };

  const handleJoinCall = (appt) => {
    const doctorName = appt.doctors?.profiles?.full_name || "Dentist";
    setActiveCall({
      channelName: `appt_${appt.id}`,
      doctorName: doctorName,
      appointmentTime: `${appt.appointment_date} • ${appt.start_time}`,
    });
    navigation.navigate("VideoConsultation");
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Profile Greeting */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Good day, {userName} 👋</Text>
            <Text style={styles.subtitle}>Ready for your dental checkup?</Text>
          </View>
          <TouchableOpacity
            style={styles.avatarButton}
            onPress={() => navigation.navigate("RoleSelect")}
          >
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{userName.slice(0, 1).toUpperCase()}</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Search Bar Input */}
        <TouchableOpacity
          style={styles.searchBar}
          activeOpacity={0.8}
          onPress={() => navigation.navigate("DoctorSearch")}
        >
          <Text style={styles.searchIcon}>🔍</Text>
          <Text style={styles.searchPlaceholder}>Search dentists, cleaning, root canals...</Text>
        </TouchableOpacity>

        {/* Dental Specialties Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Dental Treatments</Text>
          <TouchableOpacity onPress={() => navigation.navigate("DoctorSearch")}>
            <Text style={styles.seeAllText}>View all</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.specGrid}>
          {dentalCategories.map((spec) => (
            <TouchableOpacity
              key={spec.id}
              style={[styles.specCard, { backgroundColor: spec.color }]}
              onPress={() => navigation.navigate("DoctorSearch", { spec: spec.name })}
            >
              <Text style={styles.specEmoji}>{spec.emoji}</Text>
              <Text style={styles.specName}>{spec.name}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Dental Care Clinic Banner */}
        <View style={styles.bannerCard}>
          <View style={styles.bannerTextCol}>
            <Text style={styles.bannerTitle}>Brighten Your Smile ✨</Text>
            <Text style={styles.bannerDesc}>Consult expert dentists for pain-free treatments & smile design</Text>
            <TouchableOpacity
              style={styles.bannerButton}
              onPress={() => navigation.navigate("DoctorSearch")}
            >
              <Text style={styles.bannerButtonText}>Book Dental Slot</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.bannerIllustration}>🦷</Text>
        </View>

        {/* Upcoming Dental Appointment Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Upcoming Dental Appointment</Text>
          <TouchableOpacity onPress={fetchUpcomingAppointment}>
            <Text style={styles.seeAllText}>Refresh</Text>
          </TouchableOpacity>
        </View>

        {loadingAppt ? (
          <View style={styles.loadingCard}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={styles.loadingCardText}>Checking scheduled visits...</Text>
          </View>
        ) : upcomingAppointment ? (
          <View style={styles.appointmentCard}>
            <View style={styles.apptDoctorRow}>
              <View style={styles.doctorThumb}>
                <Text style={styles.doctorThumbText}>
                  {upcomingAppointment.doctors?.profiles?.full_name?.replace("Dr. ", "").trim().slice(0, 1) || "D"}
                </Text>
              </View>
              <View style={styles.doctorInfo}>
                <Text style={styles.doctorName}>
                  {upcomingAppointment.doctors?.profiles?.full_name || "Dentist"}
                </Text>
                <Text style={styles.doctorSpecialty}>
                  {upcomingAppointment.doctors?.specializations?.name || "General Dentistry"}
                </Text>
                <Text style={styles.doctorTime}>
                  {upcomingAppointment.appointment_date} • {upcomingAppointment.start_time} • {upcomingAppointment.appointment_type}
                </Text>
              </View>
              {upcomingAppointment.appointment_type === "VIDEO" || upcomingAppointment.appointment_type === "ONLINE" ? (
                <TouchableOpacity
                  style={styles.joinButton}
                  activeOpacity={0.85}
                  onPress={() => handleJoinCall(upcomingAppointment)}
                >
                  <Text style={styles.joinButtonText}>Join</Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.inPersonBadge}>
                  <Text style={styles.inPersonBadgeText}>In-Clinic</Text>
                </View>
              )}
            </View>
          </View>
        ) : (
          <View style={styles.emptyApptCard}>
            <Text style={styles.emptyApptEmoji}>🗓️</Text>
            <Text style={styles.emptyApptTitle}>No Upcoming Appointments</Text>
            <Text style={styles.emptyApptDesc}>
              You have no active dental visits booked. Search verified dentists to schedule your checkup.
            </Text>
            <TouchableOpacity
              style={styles.bookEmptyBtn}
              onPress={() => navigation.navigate("DoctorSearch")}
            >
              <Text style={styles.bookEmptyBtnText}>Find a Dentist</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Responsive Bottom Navigation Bar */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem}>
          <Text style={styles.navActiveIcon}>🏠</Text>
          <Text style={[styles.navLabel, styles.navLabelActive]}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigation.navigate("DoctorSearch")}
        >
          <Text style={styles.navIcon}>🦷</Text>
          <Text style={styles.navLabel}>Dentists</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigation.navigate("PrescriptionView")}
        >
          <Text style={styles.navIcon}>📋</Text>
          <Text style={styles.navLabel}>Dental Rx</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigation.navigate("RoleSelect")}
        >
          <Text style={styles.navIcon}>👤</Text>
          <Text style={styles.navLabel}>Role</Text>
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
  scrollView: {
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
  greeting: {
    fontSize: 22,
    fontWeight: "800",
    color: colors.text,
  },
  subtitle: {
    fontSize: 13,
    color: colors.muted,
    marginTop: 4,
  },
  avatarButton: {
    padding: 2,
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
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 10,
  },
  searchPlaceholder: {
    fontSize: 13,
    color: colors.muted,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: colors.text,
  },
  seeAllText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.primary,
  },
  specGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  specCard: {
    width: "23%",
    paddingVertical: 16,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  specEmoji: {
    fontSize: 24,
    marginBottom: 6,
  },
  specName: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.text,
  },
  bannerCard: {
    backgroundColor: colors.primary,
    borderRadius: 24,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 24,
    shadowColor: colors.primary,
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  bannerTextCol: {
    flex: 1,
    marginRight: 10,
  },
  bannerTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#FFFFFF",
    marginBottom: 6,
  },
  bannerDesc: {
    fontSize: 12,
    color: "#E0E7FF",
    lineHeight: 17,
    marginBottom: 14,
  },
  bannerButton: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  bannerButtonText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: "700",
  },
  bannerIllustration: {
    fontSize: 48,
  },
  appointmentCard: {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
    marginBottom: 24,
  },
  apptDoctorRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  doctorThumb: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  doctorThumbText: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.primary,
  },
  doctorInfo: {
    flex: 1,
  },
  doctorName: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.text,
  },
  doctorSpecialty: {
    fontSize: 11,
    color: colors.primary,
    fontWeight: "600",
    marginTop: 2,
  },
  doctorTime: {
    fontSize: 11,
    color: colors.muted,
    marginTop: 4,
  },
  joinButton: {
    backgroundColor: "#10B981",
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
    shadowColor: "#10B981",
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  joinButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  inPersonBadge: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  inPersonBadgeText: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: "700",
  },
  loadingCard: {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 24,
  },
  loadingCardText: {
    marginTop: 8,
    fontSize: 12,
    color: colors.muted,
  },
  emptyApptCard: {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 24,
  },
  emptyApptEmoji: {
    fontSize: 36,
    marginBottom: 8,
  },
  emptyApptTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 4,
  },
  emptyApptDesc: {
    fontSize: 12,
    color: colors.muted,
    textAlign: "center",
    lineHeight: 18,
    marginBottom: 14,
  },
  bookEmptyBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 12,
  },
  bookEmptyBtnText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
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
