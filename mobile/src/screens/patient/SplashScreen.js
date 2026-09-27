import React, { useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { colors } from "../../theme/colors";

export default function SplashScreen({ navigation }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      navigation.replace("Onboarding");
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.logoBadge}>
        <View style={styles.crossH} />
        <View style={styles.crossV} />
      </View>
      <Text style={styles.brandTitle}>LeDoctor</Text>
      <Text style={styles.tagline}>Healthcare, connected.</Text>

      <TouchableOpacity
        style={styles.skipButton}
        onPress={() => navigation.replace("Onboarding")}
      >
        <Text style={styles.skipText}>Tap to enter</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.card,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  logoBadge: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
    marginBottom: 20,
  },
  crossH: {
    width: 38,
    height: 12,
    backgroundColor: "#FFFFFF",
    borderRadius: 4,
    position: "absolute",
  },
  crossV: {
    width: 12,
    height: 38,
    backgroundColor: "#FFFFFF",
    borderRadius: 4,
    position: "absolute",
  },
  brandTitle: {
    fontSize: 32,
    fontWeight: "800",
    color: colors.text,
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 14,
    color: colors.muted,
    marginTop: 6,
    fontWeight: "500",
  },
  skipButton: {
    position: "absolute",
    bottom: 40,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  skipText: {
    fontSize: 12,
    color: colors.muted,
    fontWeight: "600",
  },
});
