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

export default function DoctorProfileScreen({ navigation }) {
  const selectedDoctor = useAppStore((state) => state.selectedDoctor);
  const [activeTab, setActiveTab] = useState("About");
  const [reviews, setReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(false);

  useEffect(() => {
    if (selectedDoctor?.id) {
      fetchReviews(selectedDoctor.id);
    }
  }, [selectedDoctor]);

  const fetchReviews = async (docId) => {
    setLoadingReviews(true);
    try {
      const { data, error } = await supabase
        .from("reviews")
        .select(`
          id,
          rating,
          review_text,
          created_at,
          patients ( profiles ( full_name ) )
        `)
        .eq("doctor_id", docId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setReviews(data || []);
    } catch (err) {
      console.warn("Could not fetch reviews:", err.message);
      setReviews([]);
    } finally {
      setLoadingReviews(false);
    }
  };

  if (!selectedDoctor) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>👨‍⚕️</Text>
          <Text style={styles.emptyTitle}>No Doctor Selected</Text>
          <Text style={styles.emptyDesc}>
            Please select a verified dentist from the directory to view their credentials, clinic address, and schedule.
          </Text>
          <TouchableOpacity
            style={styles.findBtn}
            onPress={() => navigation.navigate("DoctorSearch")}
          >
            <Text style={styles.findBtnText}>Browse Dentists</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const initial = selectedDoctor.name?.replace("Dr. ", "").trim().slice(0, 1) || "D";

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header Navigation */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.circleBtn}
            onPress={() => navigation.goBack()}
            accessibilityLabel="Back"
          >
            <Text style={styles.btnIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Dentist Profile</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Doctor Hero Avatar */}
          <View style={styles.avatarSection}>
            <View style={styles.heroAvatar}>
              <Text style={styles.heroAvatarText}>{initial}</Text>
              <View style={styles.verifiedBadge}>
                <Text style={styles.verifiedText}>✓ Verified</Text>
              </View>
            </View>
          </View>

          {/* Doctor Info Block */}
          <View style={styles.doctorInfoCenter}>
            <Text style={styles.docName}>{selectedDoctor.name}</Text>
            <Text style={styles.docSpec}>{selectedDoctor.specialization}</Text>
            <Text style={styles.docQual}>{selectedDoctor.qualification}</Text>
            <Text style={styles.docExp}>Experience: {selectedDoctor.experience}</Text>

            <View style={styles.ratingBadge}>
              <Text style={styles.starText}>★</Text>
              <Text style={styles.ratingScore}>
                {reviews.length > 0
                  ? (reviews.reduce((acc, r) => acc + (r.rating || 5), 0) / reviews.length).toFixed(1)
                  : "New"}
              </Text>
              <Text style={styles.ratingCount}>
                ({reviews.length} {reviews.length === 1 ? "review" : "reviews"})
              </Text>
            </View>
          </View>

          {/* Navigation Tabs */}
          <View style={styles.tabsRow}>
            {["About", "Reviews", "Clinic & Hours"].map((tab) => (
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
                    styles.tabText,
                    activeTab === tab && styles.tabTextActive,
                  ]}
                >
                  {tab}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Tab Content: About */}
          {activeTab === "About" && (
            <View style={styles.tabContent}>
              <Text style={styles.aboutText}>{selectedDoctor.about}</Text>

              {/* Consultation Fee Card */}
              <View style={styles.infoCard}>
                <View style={styles.iconCircle}>
                  <Text style={styles.cardEmoji}>💳</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>Consultation Fee</Text>
                  <Text style={styles.cardValue}>₹{selectedDoctor.fee}</Text>
                </View>
              </View>

              {/* Clinic Affiliation Card */}
              <View style={styles.infoCard}>
                <View style={styles.iconCircle}>
                  <Text style={styles.cardEmoji}>🏥</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>Dental Clinic</Text>
                  <Text style={styles.cardValue}>{selectedDoctor.clinic}</Text>
                  {selectedDoctor.clinicAddress ? (
                    <Text style={styles.cardSub}>{selectedDoctor.clinicAddress}</Text>
                  ) : null}
                </View>
              </View>
            </View>
          )}

          {/* Tab Content: Reviews */}
          {activeTab === "Reviews" && (
            <View style={styles.tabContent}>
              {loadingReviews ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : reviews.length === 0 ? (
                <View style={styles.emptyReviewsCard}>
                  <Text style={styles.emptyReviewsEmoji}>💬</Text>
                  <Text style={styles.emptyReviewsTitle}>No Patient Reviews Yet</Text>
                  <Text style={styles.emptyReviewsDesc}>
                    Verified patient reviews will appear here once consultations and procedures are completed.
                  </Text>
                </View>
              ) : (
                reviews.map((rev) => (
                  <View key={rev.id} style={styles.reviewItem}>
                    <View style={styles.reviewHeader}>
                      <Text style={styles.reviewAuthor}>
                        {rev.patients?.profiles?.full_name || "Patient"}
                      </Text>
                      <Text style={styles.reviewStars}>★ {rev.rating || 5}.0</Text>
                    </View>
                    <Text style={styles.reviewBody}>{rev.review_text}</Text>
                    <Text style={styles.reviewDate}>
                      {new Date(rev.created_at).toLocaleDateString()}
                    </Text>
                  </View>
                ))
              )}
            </View>
          )}

          {/* Tab Content: Clinic & Hours */}
          {activeTab === "Clinic & Hours" && (
            <View style={styles.tabContent}>
              <View style={styles.infoCard}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>Practice Location</Text>
                  <Text style={styles.cardValue}>{selectedDoctor.clinic}</Text>
                  <Text style={styles.cardSub}>{selectedDoctor.clinicAddress || "In-person & Digital Tele-Dentistry"}</Text>
                </View>
              </View>
              <View style={styles.infoCard}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>Standard Chair Hours</Text>
                  <Text style={styles.cardValue}>Monday to Saturday</Text>
                  <Text style={styles.cardSub}>09:30 AM — 07:00 PM</Text>
                </View>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Bottom Booking Action Bar */}
        <View style={styles.bottomBar}>
          <View>
            <Text style={styles.totalFeeLabel}>Fee</Text>
            <Text style={styles.totalFeeAmount}>₹{selectedDoctor.fee}</Text>
          </View>
          <TouchableOpacity
            style={styles.bookButton}
            activeOpacity={0.85}
            onPress={() => navigation.navigate("BookAppointment")}
          >
            <Text style={styles.bookButtonText}>Book Appointment</Text>
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
  circleBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.card,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  btnIcon: {
    fontSize: 18,
    color: colors.text,
    fontWeight: "700",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  avatarSection: {
    alignItems: "center",
    marginVertical: 16,
  },
  heroAvatar: {
    width: 96,
    height: 96,
    borderRadius: 36,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  heroAvatarText: {
    fontSize: 38,
    fontWeight: "800",
    color: colors.primary,
  },
  verifiedBadge: {
    position: "absolute",
    bottom: -6,
    backgroundColor: "#10B981",
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  verifiedText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "700",
  },
  doctorInfoCenter: {
    alignItems: "center",
    paddingHorizontal: 24,
  },
  docName: {
    fontSize: 22,
    fontWeight: "800",
    color: colors.text,
  },
  docSpec: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: "600",
    marginTop: 4,
  },
  docQual: {
    fontSize: 13,
    color: colors.muted,
    marginTop: 4,
  },
  docExp: {
    fontSize: 12,
    color: colors.muted,
    marginTop: 2,
  },
  ratingBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginTop: 10,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 4,
  },
  starText: {
    color: "#F59E0B",
    fontSize: 13,
  },
  ratingScore: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.text,
  },
  ratingCount: {
    fontSize: 12,
    color: colors.muted,
  },
  tabsRow: {
    flexDirection: "row",
    marginHorizontal: 20,
    marginTop: 24,
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 12,
  },
  tabButtonActive: {
    backgroundColor: colors.primary,
  },
  tabText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.muted,
  },
  tabTextActive: {
    color: "#FFFFFF",
  },
  tabContent: {
    paddingHorizontal: 20,
    marginTop: 18,
    gap: 12,
  },
  aboutText: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 22,
  },
  infoCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 12,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  cardEmoji: {
    fontSize: 20,
  },
  cardTitle: {
    fontSize: 12,
    color: colors.muted,
  },
  cardValue: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.text,
    marginTop: 2,
  },
  cardSub: {
    fontSize: 12,
    color: colors.muted,
    marginTop: 2,
  },
  emptyReviewsCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyReviewsEmoji: {
    fontSize: 36,
    marginBottom: 8,
  },
  emptyReviewsTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 4,
  },
  emptyReviewsDesc: {
    fontSize: 13,
    color: colors.muted,
    textAlign: "center",
    lineHeight: 18,
  },
  reviewItem: {
    backgroundColor: colors.card,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 6,
  },
  reviewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  reviewAuthor: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.text,
  },
  reviewStars: {
    fontSize: 12,
    fontWeight: "700",
    color: "#F59E0B",
  },
  reviewBody: {
    fontSize: 13,
    color: colors.text,
    lineHeight: 18,
  },
  reviewDate: {
    fontSize: 11,
    color: colors.muted,
  },
  bottomBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  totalFeeLabel: {
    fontSize: 11,
    color: colors.muted,
  },
  totalFeeAmount: {
    fontSize: 20,
    fontWeight: "800",
    color: colors.text,
  },
  bookButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 16,
  },
  bookButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 30,
  },
  emptyEmoji: {
    fontSize: 60,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 8,
  },
  emptyDesc: {
    fontSize: 14,
    color: colors.muted,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 20,
  },
  findBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 14,
  },
  findBtnText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 14,
  },
});
