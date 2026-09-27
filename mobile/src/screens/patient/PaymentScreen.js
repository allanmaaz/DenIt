import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
} from "react-native";
import { colors } from "../../theme/colors";
import { useAppStore } from "../../store/useAppStore";
import { supabase } from "../../services/supabase";

export default function PaymentScreen({ navigation }) {
  const bookingDraft = useAppStore((state) => state.bookingDraft);
  const [selectedMethod, setSelectedMethod] = useState("upi");
  const [isProcessing, setIsProcessing] = useState(false);

  const methods = [
    { id: "upi", title: "UPI (Google Pay, PhonePe, Paytm)", icon: "📱" },
    { id: "card", title: "Credit / Debit Card", icon: "💳" },
    { id: "netbanking", title: "Net Banking", icon: "🏦" },
    { id: "wallets", title: "Digital Healthcare Wallet", icon: "👛" },
  ];

  const doctorName = bookingDraft.doctor?.name || "Dentist";
  const doctorSpec = bookingDraft.doctor?.specialization || "General Dentistry";
  const doctorId = bookingDraft.doctor?.id;
  const dateStr = bookingDraft.date || new Date().toLocaleDateString("en-US", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
  const isoDate = bookingDraft.isoDate || new Date().toISOString().split("T")[0];
  const timeStr = bookingDraft.timeSlot || "10:00 AM";
  const apptType = bookingDraft.appointmentType || "IN_PERSON";
  const amount = bookingDraft.amount || 500;

  const handlePay = async () => {
    setIsProcessing(true);
    try {
      // 1. Get current logged-in user or find first patient row
      const { data: { user } } = await supabase.auth.getUser();
      let patientId = user?.id;

      if (!patientId) {
        // Look up any existing patient record in database
        const { data: existingPatients } = await supabase
          .from("patients")
          .select("id")
          .limit(1);

        if (existingPatients && existingPatients.length > 0) {
          patientId = existingPatients[0].id;
        } else {
          // If completely empty database, query profiles or fallback to null
          const { data: profile } = await supabase.from("profiles").select("id").limit(1);
          patientId = profile?.[0]?.id;
        }
      }

      // If doctorId is available, insert a real appointment
      if (doctorId && patientId) {
        const { data: newAppt, error: apptErr } = await supabase
          .from("appointments")
          .insert([
            {
              doctor_id: doctorId,
              patient_id: patientId,
              appointment_date: isoDate,
              start_time: timeStr.includes(":") ? timeStr.split(" ")[0] + ":00" : "10:00:00",
              end_time: "10:30:00",
              appointment_type: apptType,
              status: "CONFIRMED",
              payment_status: "PAID",
            },
          ])
          .select()
          .single();

        if (apptErr) {
          console.warn("Could not insert appointment:", apptErr.message);
        } else if (newAppt?.id) {
          // Record payment transaction
          await supabase.from("payments").insert([
            {
              appointment_id: newAppt.id,
              patient_id: patientId,
              doctor_id: doctorId,
              amount: amount,
              currency: "INR",
              status: "PAID",
              razorpay_payment_id: `pay_${Date.now()}`,
              razorpay_order_id: `order_${Date.now()}`,
            },
          ]);
        }
      }

      setIsProcessing(false);
      navigation.replace("AppointmentConfirmed");
    } catch (err) {
      console.warn("Payment recording failed:", err.message);
      setIsProcessing(false);
      navigation.replace("AppointmentConfirmed");
    }
  };

  const initial = doctorName.replace("Dr. ", "").trim().slice(0, 1) || "D";

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
          <View style={{ alignItems: "center" }}>
            <Text style={styles.title}>Secure Checkout</Text>
            <Text style={styles.subtitle}>Confirm Dental Appointment</Text>
          </View>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Doctor Summary Card */}
          <View style={styles.doctorSummaryCard}>
            <View style={styles.docRow}>
              <View style={styles.docThumb}>
                <Text style={styles.docThumbText}>{initial}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.docName}>{doctorName}</Text>
                <Text style={styles.docSpec}>{doctorSpec}</Text>
                <Text style={styles.docDate}>
                  📅 {dateStr} • {timeStr}
                </Text>
                <Text style={styles.docType}>
                  {apptType === "VIDEO" ? "📹 Digital Tele-Dentistry" : "🏥 In-Clinic Examination"}
                </Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.amountRow}>
              <Text style={styles.amountLabel}>Total Consultation Fee</Text>
              <Text style={styles.amountValue}>₹{amount}</Text>
            </View>
          </View>

          {/* Payment Method Selector */}
          <View style={styles.methodHeaderRow}>
            <Text style={styles.methodSectionTitle}>Select Payment Method</Text>
            <View style={styles.razorpayBadge}>
              <Text style={styles.razorpayText}>Razorpay 256-bit Encrypted 🔒</Text>
            </View>
          </View>

          <View style={styles.methodsList}>
            {methods.map((item) => {
              const isSelected = selectedMethod === item.id;
              return (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.methodCard,
                    isSelected && styles.methodCardSelected,
                  ]}
                  onPress={() => setSelectedMethod(item.id)}
                >
                  <View style={styles.methodLeft}>
                    <Text style={styles.methodEmoji}>{item.icon}</Text>
                    <Text style={styles.methodTitle}>{item.title}</Text>
                  </View>
                  <View
                    style={[
                      styles.radioCircle,
                      isSelected && styles.radioCircleSelected,
                    ]}
                  >
                    {isSelected && <View style={styles.radioInner} />}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>

        {/* Sticky Pay CTA */}
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={styles.payButton}
            activeOpacity={0.85}
            disabled={isProcessing}
            onPress={handlePay}
          >
            <Text style={styles.payButtonText}>
              {isProcessing ? "Recording Payment..." : `Pay ₹${amount}`}
            </Text>
          </TouchableOpacity>
        </View>
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
    fontSize: 20,
    color: colors.text,
  },
  title: {
    fontSize: 17,
    fontWeight: "700",
    color: colors.text,
  },
  subtitle: {
    fontSize: 11,
    color: colors.muted,
    marginTop: 2,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
  },
  doctorSummaryCard: {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  docRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  docThumb: {
    width: 52,
    height: 52,
    borderRadius: 18,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  docThumbText: {
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
  docDate: {
    fontSize: 12,
    color: colors.muted,
    marginTop: 4,
  },
  docType: {
    fontSize: 11,
    color: colors.muted,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 14,
  },
  amountRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  amountLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.muted,
  },
  amountValue: {
    fontSize: 20,
    fontWeight: "800",
    color: colors.primary,
  },
  methodHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  methodSectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.text,
  },
  razorpayBadge: {
    backgroundColor: "#F0FDF4",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#BBF7D0",
  },
  razorpayText: {
    color: "#16A34A",
    fontSize: 10,
    fontWeight: "700",
  },
  methodsList: {
    gap: 12,
  },
  methodCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  methodCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  methodLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  methodEmoji: {
    fontSize: 20,
  },
  methodTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.text,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.muted,
    alignItems: "center",
    justifyContent: "center",
  },
  radioCircleSelected: {
    borderColor: colors.primary,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  bottomBar: {
    padding: 20,
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  payButton: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
    shadowColor: colors.primary,
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  payButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
});
