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

export default function DoctorEarningsScreen({ navigation }) {
  const [payments, setPayments] = useState([]);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEarnings();
  }, []);

  const fetchEarnings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("payments")
        .select(`
          id,
          amount,
          currency,
          status,
          created_at,
          razorpay_payment_id,
          patients (
            id,
            profiles ( full_name )
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      const list = data || [];
      setPayments(list);
      const total = list
        .filter((p) => p.status === "PAID")
        .reduce((sum, p) => sum + Number(p.amount || 0), 0);
      setTotalEarnings(total);
    } catch (err) {
      console.warn("Could not fetch earnings:", err.message);
      setPayments([]);
      setTotalEarnings(0);
    } finally {
      setLoading(false);
    }
  };

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
          <Text style={styles.title}>Practice Earnings</Text>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={fetchEarnings}
            accessibilityLabel="Refresh Earnings"
          >
            <Text style={styles.backIcon}>↻</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Earnings Summary Card */}
          <View style={styles.summaryCard}>
            <View style={styles.summaryTopRow}>
              <View>
                <Text style={styles.summaryLabel}>Total Collected Fees</Text>
                <Text style={styles.summaryAmount}>₹{totalEarnings.toLocaleString()}</Text>
              </View>
              <View style={styles.periodPill}>
                <Text style={styles.periodText}>Direct Settlements</Text>
              </View>
            </View>

            <View style={styles.summaryBreakdown}>
              <View style={styles.breakdownItem}>
                <Text style={styles.breakdownLabel}>Transactions</Text>
                <Text style={styles.breakdownValue}>{payments.length}</Text>
              </View>
              <View style={styles.breakdownDivider} />
              <View style={styles.breakdownItem}>
                <Text style={styles.breakdownLabel}>Currency</Text>
                <Text style={styles.breakdownValue}>INR (₹)</Text>
              </View>
              <View style={styles.breakdownDivider} />
              <View style={styles.breakdownItem}>
                <Text style={styles.breakdownLabel}>Gateway</Text>
                <Text style={styles.breakdownValue}>Razorpay</Text>
              </View>
            </View>
          </View>

          {/* Recent Payments Section */}
          <View style={styles.recentSection}>
            <Text style={styles.sectionHeading}>Transaction Ledger</Text>

            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={styles.loadingText}>Loading payment records...</Text>
              </View>
            ) : payments.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyEmoji}>💰</Text>
                <Text style={styles.emptyTitle}>No Transactions Yet</Text>
                <Text style={styles.emptyDesc}>
                  Consultation payments from patients will appear here in real time once appointments are booked and settled.
                </Text>
              </View>
            ) : (
              <View style={styles.paymentsList}>
                {payments.map((p) => {
                  const patientName = p.patients?.profiles?.full_name || "Patient";
                  const initial = patientName.slice(0, 1).toUpperCase();
                  const dateDisplay = new Date(p.created_at).toLocaleDateString();

                  return (
                    <View key={p.id} style={styles.paymentCard}>
                      <View style={styles.patientAvatar}>
                        <Text style={styles.patientAvatarText}>{initial}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.patientName}>{patientName}</Text>
                        <Text style={styles.paymentDate}>
                          {dateDisplay} • {p.razorpay_payment_id || "Direct"}
                        </Text>
                      </View>
                      <View style={styles.amountCol}>
                        <Text style={styles.amountText}>₹{p.amount}</Text>
                        <Text
                          style={[
                            styles.paidBadge,
                            p.status === "PAID"
                              ? styles.paidBadgeSuccess
                              : styles.paidBadgePending,
                          ]}
                        >
                          {p.status}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.card,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
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
    paddingTop: 16,
    paddingBottom: 24,
  },
  summaryCard: {
    backgroundColor: colors.primary,
    borderRadius: 24,
    padding: 22,
    marginBottom: 24,
    shadowColor: colors.primary,
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  summaryTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  summaryLabel: {
    fontSize: 12,
    color: "#E0E7FF",
    fontWeight: "600",
  },
  summaryAmount: {
    fontSize: 32,
    fontWeight: "800",
    color: "#FFFFFF",
    marginTop: 4,
  },
  periodPill: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  periodText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "700",
  },
  summaryBreakdown: {
    flexDirection: "row",
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    borderRadius: 16,
    padding: 14,
    justifyContent: "space-around",
    alignItems: "center",
  },
  breakdownItem: {
    alignItems: "center",
  },
  breakdownLabel: {
    fontSize: 10,
    color: "#E0E7FF",
  },
  breakdownValue: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
    marginTop: 2,
  },
  breakdownDivider: {
    width: 1,
    height: 24,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
  recentSection: {
    gap: 12,
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: "center",
  },
  loadingText: {
    marginTop: 8,
    fontSize: 12,
    color: colors.muted,
  },
  emptyContainer: {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 28,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyEmoji: {
    fontSize: 40,
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
  paymentsList: {
    gap: 10,
  },
  paymentCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 12,
  },
  patientAvatar: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  patientAvatarText: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.primary,
  },
  patientName: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.text,
  },
  paymentDate: {
    fontSize: 11,
    color: colors.muted,
    marginTop: 2,
  },
  amountCol: {
    alignItems: "flex-end",
  },
  amountText: {
    fontSize: 15,
    fontWeight: "800",
    color: colors.text,
  },
  paidBadge: {
    fontSize: 10,
    fontWeight: "700",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 4,
  },
  paidBadgeSuccess: {
    backgroundColor: "#F0FDF4",
    color: "#16A34A",
  },
  paidBadgePending: {
    backgroundColor: "#FFF7ED",
    color: "#EA580C",
  },
});
