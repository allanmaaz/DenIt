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
import { useAppStore } from "../../store/useAppStore";

export default function BookAppointmentScreen({ navigation }) {
  const setBookingDraft = useAppStore((state) => state.setBookingDraft);
  const selectedDoctor = useAppStore((state) => state.selectedDoctor);

  // Generate dynamic upcoming 5 calendar dates starting from today
  const generateDates = () => {
    const list = [];
    for (let i = 0; i < 5; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      list.push({
        day: d.toLocaleDateString("en-US", { weekday: "short" }),
        date: d.getDate().toString(),
        full: d.toLocaleDateString("en-US", {
          weekday: "short",
          day: "numeric",
          month: "short",
          year: "numeric",
        }),
        iso: d.toISOString().split("T")[0],
      });
    }
    return list;
  };

  const dates = generateDates();
  const [selectedDateIndex, setSelectedDateIndex] = useState(0);
  const [selectedSlot, setSelectedSlot] = useState("10:00 AM");
  const [appointmentType, setAppointmentType] = useState("IN_PERSON"); // 'IN_PERSON' or 'VIDEO'

  const morningSlots = ["09:30 AM", "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM", "12:00 PM"];
  const afternoonSlots = ["02:00 PM", "02:30 PM", "03:00 PM", "03:30 PM", "04:00 PM", "04:30 PM"];
  const eveningSlots = ["05:00 PM", "05:30 PM", "06:00 PM", "06:30 PM", "07:00 PM"];

  const handleContinue = () => {
    const chosenDate = dates[selectedDateIndex];
    setBookingDraft({
      doctor: selectedDoctor,
      date: chosenDate.full,
      isoDate: chosenDate.iso,
      timeSlot: selectedSlot,
      appointmentType: appointmentType,
      amount: selectedDoctor?.fee || 500,
    });
    navigation.navigate("Payment");
  };

  const renderSlotGrid = (slots) => (
    <View style={styles.slotGrid}>
      {slots.map((slot) => {
        const isSelected = selectedSlot === slot;
        return (
          <TouchableOpacity
            key={slot}
            style={[styles.slotPill, isSelected && styles.slotPillSelected]}
            onPress={() => setSelectedSlot(slot)}
          >
            <Text
              style={[styles.slotText, isSelected && styles.slotTextSelected]}
            >
              {slot}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

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
            <Text style={styles.title}>Book Appointment</Text>
            <Text style={styles.subtitle}>Select visit type, date and chair slot</Text>
          </View>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Consultation Type Selector */}
          <View style={styles.typeSelectorRow}>
            <TouchableOpacity
              style={[
                styles.typeOption,
                appointmentType === "IN_PERSON" && styles.typeOptionSelected,
              ]}
              onPress={() => setAppointmentType("IN_PERSON")}
            >
              <Text style={styles.typeIcon}>🏥</Text>
              <Text
                style={[
                  styles.typeLabel,
                  appointmentType === "IN_PERSON" && styles.typeLabelSelected,
                ]}
              >
                In-Clinic Dental Visit
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.typeOption,
                appointmentType === "VIDEO" && styles.typeOptionSelected,
              ]}
              onPress={() => setAppointmentType("VIDEO")}
            >
              <Text style={styles.typeIcon}>📹</Text>
              <Text
                style={[
                  styles.typeLabel,
                  appointmentType === "VIDEO" && styles.typeLabelSelected,
                ]}
              >
                Digital Tele-Dentistry
              </Text>
            </TouchableOpacity>
          </View>

          {/* Horizontal Dynamic Date Picker Strip */}
          <View style={styles.dateStrip}>
            {dates.map((item, idx) => {
              const isSelected = selectedDateIndex === idx;
              return (
                <TouchableOpacity
                  key={idx}
                  style={[styles.dateCard, isSelected && styles.dateCardSelected]}
                  onPress={() => setSelectedDateIndex(idx)}
                >
                  <Text
                    style={[styles.dayText, isSelected && styles.dayTextSelected]}
                  >
                    {item.day}
                  </Text>
                  <Text
                    style={[styles.numText, isSelected && styles.numTextSelected]}
                  >
                    {item.date}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Morning Slots */}
          <View style={styles.slotSection}>
            <Text style={styles.sectionHeading}>Morning Slots</Text>
            {renderSlotGrid(morningSlots)}
          </View>

          {/* Afternoon Slots */}
          <View style={styles.slotSection}>
            <Text style={styles.sectionHeading}>Afternoon Slots</Text>
            {renderSlotGrid(afternoonSlots)}
          </View>

          {/* Evening Slots */}
          <View style={styles.slotSection}>
            <Text style={styles.sectionHeading}>Evening Slots</Text>
            {renderSlotGrid(eveningSlots)}
          </View>
        </ScrollView>

        {/* Sticky Continue CTA */}
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={styles.continueButton}
            activeOpacity={0.85}
            onPress={handleContinue}
          >
            <Text style={styles.continueText}>
              Continue to Payment • ₹{selectedDoctor?.fee || 500}
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
    textAlign: "center",
  },
  subtitle: {
    fontSize: 11,
    color: colors.muted,
    textAlign: "center",
    marginTop: 2,
  },
  typeSelectorRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
  },
  typeOption: {
    flex: 1,
    backgroundColor: colors.card,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 14,
    alignItems: "center",
  },
  typeOptionSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  typeIcon: {
    fontSize: 22,
    marginBottom: 6,
  },
  typeLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.muted,
    textAlign: "center",
  },
  typeLabelSelected: {
    color: colors.primary,
    fontWeight: "700",
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
  },
  dateStrip: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  dateCard: {
    width: 60,
    paddingVertical: 14,
    borderRadius: 18,
    backgroundColor: colors.card,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  dateCardSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  dayText: {
    fontSize: 12,
    color: colors.muted,
    fontWeight: "600",
  },
  dayTextSelected: {
    color: "#FFFFFF",
  },
  numText: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.text,
    marginTop: 4,
  },
  numTextSelected: {
    color: "#FFFFFF",
  },
  slotSection: {
    marginBottom: 20,
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 10,
  },
  slotGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  slotPill: {
    width: "31%",
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: colors.card,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  slotPillSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  slotText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.text,
  },
  slotTextSelected: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  bottomBar: {
    padding: 20,
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  continueButton: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
    shadowColor: colors.primary,
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  continueText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
});
