import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { colors } from "../../theme/colors";
import { useAppStore } from "../../store/useAppStore";
import { supabase } from "../../services/supabase";

export default function DoctorSearchScreen({ navigation, route }) {
  const setSelectedDoctor = useAppStore((state) => state.setSelectedDoctor);
  const initialSpec = route?.params?.spec || "All";
  const [selectedFilter, setSelectedFilter] = useState(initialSpec);
  const [searchQuery, setSearchQuery] = useState("");
  const [doctors, setDoctors] = useState([]);
  const [filterChips, setFilterChips] = useState(["All", "Dentistry", "Orthodontics", "Endodontics", "Periodontics"]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSpecializations();
    fetchDoctors();
  }, []);

  const fetchSpecializations = async () => {
    try {
      const { data } = await supabase
        .from("specializations")
        .select("name")
        .order("name", { ascending: true });
      if (data && data.length > 0) {
        setFilterChips(["All", ...data.map((s) => s.name)]);
      }
    } catch (err) {
      console.warn("Could not load specializations:", err.message);
    }
  };

  const fetchDoctors = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("doctors")
        .select(`
          id,
          qualification,
          experience_years,
          consultation_fee,
          clinic_name,
          clinic_address,
          about,
          verification_status,
          profiles ( id, full_name, email, phone ),
          specializations ( id, name )
        `)
        .eq("verification_status", "VERIFIED");

      if (error) throw error;
      setDoctors(data || []);
    } catch (err) {
      console.warn("Error fetching doctors:", err.message);
      setDoctors([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredDoctors = doctors.filter((doc) => {
    const docName = doc.profiles?.full_name || "Doctor";
    const specName = doc.specializations?.name || "Dentistry";

    const matchesFilter =
      selectedFilter === "All" ||
      specName.toLowerCase().includes(selectedFilter.toLowerCase());
    const matchesQuery =
      docName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      specName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (doc.clinic_name || "").toLowerCase().includes(searchQuery.toLowerCase());

    return matchesFilter && matchesQuery;
  });

  const handleSelectDoctor = (doctor) => {
    setSelectedDoctor({
      id: doctor.id,
      name: doctor.profiles?.full_name || "Dentist",
      specialization: doctor.specializations?.name || "General Dentistry",
      qualification: doctor.qualification || "BDS",
      experience: `${doctor.experience_years || 5}+ years`,
      fee: doctor.consultation_fee || 500,
      clinic: doctor.clinic_name || "Dental Clinic",
      clinicAddress: doctor.clinic_address || "Clinic Address",
      about: doctor.about || "Experienced dental practitioner providing oral healthcare services.",
      rating: 4.9,
      reviewsCount: 0,
      nextSlot: "Available Today",
      raw: doctor,
    });
    navigation.navigate("DoctorProfile");
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Top Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            accessibilityLabel="Go Back"
          >
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Find Dentists</Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={fetchDoctors}
            accessibilityLabel="Refresh Directory"
          >
            <Text style={styles.backText}>↻</Text>
          </TouchableOpacity>
        </View>

        {/* Search Input */}
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            placeholder="Search dentists, procedures, clinics..."
            placeholderTextColor={colors.muted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={styles.input}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Text style={{ color: colors.muted, fontSize: 16 }}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Filter Chips Horizontal Strip */}
        <View style={{ height: 48 }}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterScroll}
          >
            {filterChips.map((chip) => (
              <TouchableOpacity
                key={chip}
                onPress={() => setSelectedFilter(chip)}
                style={[
                  styles.filterChip,
                  selectedFilter === chip && styles.filterChipActive,
                ]}
              >
                <Text
                  style={[
                    styles.filterText,
                    selectedFilter === chip && styles.filterTextActive,
                  ]}
                >
                  {chip}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Doctor Cards List / Zero-State */}
        <ScrollView
          style={styles.listScroll}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        >
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.loadingText}>Fetching verified dentists from database...</Text>
            </View>
          ) : filteredDoctors.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyEmoji}>🦷</Text>
              <Text style={styles.emptyTitle}>No Practitioners Found</Text>
              <Text style={styles.emptyDesc}>
                {searchQuery || selectedFilter !== "All"
                  ? "No verified dentists match your current filter. Try adjusting or clearing search criteria."
                  : "No verified dental practitioners are registered in the live database yet. Once doctors register and get verified by the admin, they will appear here."}
              </Text>
              <TouchableOpacity
                style={styles.refreshBtn}
                onPress={fetchDoctors}
              >
                <Text style={styles.refreshBtnText}>Refresh Directory</Text>
              </TouchableOpacity>
            </View>
          ) : (
            filteredDoctors.map((doc) => {
              const name = doc.profiles?.full_name || "Dentist";
              const spec = doc.specializations?.name || "General Dentistry";
              const initial = name.replace("Dr. ", "").trim().slice(0, 1) || "D";
              const fee = doc.consultation_fee || 500;

              return (
                <TouchableOpacity
                  key={doc.id}
                  style={styles.doctorCard}
                  activeOpacity={0.85}
                  onPress={() => handleSelectDoctor(doc)}
                >
                  <View style={styles.cardTopRow}>
                    <View style={styles.docAvatar}>
                      <Text style={styles.docAvatarText}>{initial}</Text>
                    </View>
                    <View style={styles.docMainInfo}>
                      <Text style={styles.docName}>{name}</Text>
                      <Text style={styles.docSpec}>{spec}</Text>
                      <View style={styles.ratingRow}>
                        <Text style={styles.clinicBadge}>🏥 {doc.clinic_name || "Dental Clinic"}</Text>
                        <Text style={styles.dotSeparator}>•</Text>
                        <Text style={styles.expText}>{doc.experience_years || 5}+ yrs exp</Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.cardDivider} />

                  <View style={styles.cardBottomRow}>
                    <View>
                      <Text style={styles.feeLabel}>Consultation Fee</Text>
                      <Text style={styles.feeText}>₹{fee}</Text>
                    </View>
                    <View style={styles.nextSlotPill}>
                      <Text style={styles.nextSlotText}>Book Appointment →</Text>
                    </View>
                  </View>
                </TouchableOpacity>
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
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.card,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  backText: {
    fontSize: 18,
    color: colors.text,
    fontWeight: "700",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
    marginHorizontal: 20,
    marginTop: 8,
    marginBottom: 8,
    borderRadius: 16,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchIcon: {
    fontSize: 15,
    marginRight: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 13,
    color: colors.text,
  },
  filterScroll: {
    paddingHorizontal: 20,
    gap: 8,
    alignItems: "center",
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.muted,
  },
  filterTextActive: {
    color: "#FFFFFF",
  },
  listScroll: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 14,
  },
  doctorCard: {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 12,
  },
  cardTopRow: {
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
    marginRight: 12,
  },
  docAvatarText: {
    fontSize: 20,
    fontWeight: "800",
    color: colors.primary,
  },
  docMainInfo: {
    flex: 1,
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
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
    gap: 4,
  },
  clinicBadge: {
    fontSize: 11,
    color: colors.muted,
  },
  dotSeparator: {
    fontSize: 11,
    color: colors.muted,
  },
  expText: {
    fontSize: 11,
    color: colors.muted,
    fontWeight: "500",
  },
  cardDivider: {
    height: 1,
    backgroundColor: "#F1F5F9",
    marginVertical: 12,
  },
  cardBottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  feeLabel: {
    fontSize: 10,
    color: colors.muted,
  },
  feeText: {
    fontSize: 15,
    fontWeight: "800",
    color: colors.text,
  },
  nextSlotPill: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
  },
  nextSlotText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.primary,
  },
  loadingContainer: {
    paddingVertical: 60,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 13,
    color: colors.muted,
  },
  emptyContainer: {
    paddingVertical: 50,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.card,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    marginVertical: 20,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 6,
  },
  emptyDesc: {
    fontSize: 13,
    color: colors.muted,
    textAlign: "center",
    lineHeight: 19,
    marginBottom: 16,
  },
  refreshBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 14,
  },
  refreshBtnText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "600",
  },
});
