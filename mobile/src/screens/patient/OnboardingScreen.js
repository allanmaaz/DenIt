import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from "react-native";
import { colors } from "../../theme/colors";

export default function OnboardingScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Top Graphic Container */}
        <View style={styles.graphicContainer}>
          <View style={styles.illustrationCircle}>
            <View style={styles.doctorBadge}>
              <Text style={styles.badgeText}>👨‍⚕️ Verified Doctors</Text>
            </View>
            <View style={styles.consultBadge}>
              <Text style={styles.badgeText}>📹 Video Care 24/7</Text>
            </View>
          </View>
        </View>

        {/* Content Box */}
        <View style={styles.contentBox}>
          <Text style={styles.title}>Better Healthcare{"\n"}For A Healthier You</Text>
          <Text style={styles.subtitle}>
            Book appointments, consult online and manage your health — all in one place.
          </Text>

          {/* Pagination Indicators */}
          <View style={styles.paginationRow}>
            <View style={[styles.dot, styles.activeDot]} />
            <View style={styles.dot} />
            <View style={styles.dot} />
          </View>

          {/* Action Buttons */}
          <TouchableOpacity
            style={styles.primaryButton}
            activeOpacity={0.85}
            onPress={() => navigation.navigate("RoleSelect")}
          >
            <Text style={styles.buttonText}>Get Started</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.textLink}
            onPress={() => navigation.navigate("RoleSelect")}
          >
            <Text style={styles.linkText}>I already have an account</Text>
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
    paddingHorizontal: 24,
    justifyContent: "space-between",
    paddingBottom: 24,
  },
  graphicContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  illustrationCircle: {
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  doctorBadge: {
    position: "absolute",
    top: 24,
    right: -10,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  consultBadge: {
    position: "absolute",
    bottom: 24,
    left: -10,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.text,
  },
  contentBox: {
    alignItems: "center",
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    color: colors.text,
    textAlign: "center",
    lineHeight: 34,
  },
  subtitle: {
    fontSize: 14,
    color: colors.muted,
    textAlign: "center",
    marginTop: 12,
    lineHeight: 20,
    paddingHorizontal: 12,
  },
  paginationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 24,
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#CBD5E1",
  },
  activeDot: {
    width: 24,
    backgroundColor: colors.primary,
  },
  primaryButton: {
    width: "100%",
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 4,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
  textLink: {
    marginTop: 16,
    paddingVertical: 6,
  },
  linkText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: "600",
  },
});
