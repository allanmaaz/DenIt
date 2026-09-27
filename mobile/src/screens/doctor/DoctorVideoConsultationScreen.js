import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
} from "react-native";
import { colors } from "../../theme/colors";

export default function DoctorVideoConsultationScreen({ navigation, route }) {
  const [seconds, setSeconds] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);

  const patientName = route?.params?.patientName || "Dental Patient";

  useEffect(() => {
    const timer = setInterval(() => {
      setSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTimer = (totalSeconds) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleEndCall = () => {
    navigation.replace("CreatePrescription", {
      patientId: route?.params?.patientId,
      appointmentId: route?.params?.appointmentId,
    });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Patient Video Stream View */}
      <View style={styles.patientVideoFrame}>
        <View style={styles.patientFramePlaceholder}>
          <Text style={styles.patientEmoji}>👤</Text>
          <Text style={styles.patientStreamName}>{patientName}</Text>
          <Text style={styles.streamLabel}>Live Agora Patient Video Stream</Text>
        </View>
      </View>

      {/* Top Floating Bar */}
      <SafeAreaView style={styles.topSafeArea}>
        <View style={styles.topBar}>
          <View>
            <Text style={styles.patientTitle}>{patientName}</Text>
            <View style={styles.liveIndicatorRow}>
              <View style={styles.liveDot} />
              <Text style={styles.timerText}>{formatTimer(seconds)}</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.prescriptionShortcut}
            onPress={() => navigation.navigate("CreatePrescription")}
          >
            <Text style={styles.shortcutText}>✍️ Issue Rx</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {/* Doctor Self Preview PiP */}
      <View style={styles.pipContainer}>
        <View style={styles.pipFrame}>
          <Text style={styles.pipEmoji}>🦷</Text>
          <Text style={styles.pipLabel}>Practitioner</Text>
        </View>
      </View>

      {/* Bottom Floating Control Pill */}
      <SafeAreaView style={styles.bottomSafeArea}>
        <View style={styles.controlsPill}>
          <TouchableOpacity
            style={[styles.controlBtn, isMuted && styles.controlBtnActive]}
            onPress={() => setIsMuted(!isMuted)}
          >
            <Text style={styles.controlIcon}>{isMuted ? "🔇" : "🎙️"}</Text>
            <Text style={styles.controlLabel}>{isMuted ? "Unmute" : "Mic"}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.controlBtn, isVideoOff && styles.controlBtnActive]}
            onPress={() => setIsVideoOff(!isVideoOff)}
          >
            <Text style={styles.controlIcon}>{isVideoOff ? "🚫" : "📹"}</Text>
            <Text style={styles.controlLabel}>{isVideoOff ? "Start" : "Camera"}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.controlBtn}
            onPress={() => navigation.navigate("DoctorMessages")}
          >
            <Text style={styles.controlIcon}>💬</Text>
            <Text style={styles.controlLabel}>Chat</Text>
          </TouchableOpacity>

          {/* End Call Button */}
          <TouchableOpacity
            style={styles.endCallBtn}
            activeOpacity={0.8}
            onPress={handleEndCall}
          >
            <Text style={styles.endCallIcon}>📞</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0F172A",
    position: "relative",
  },
  patientVideoFrame: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1E293B",
  },
  patientFramePlaceholder: {
    alignItems: "center",
  },
  patientEmoji: {
    fontSize: 70,
    marginBottom: 8,
  },
  patientStreamName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  streamLabel: {
    fontSize: 12,
    color: "#94A3B8",
    fontWeight: "600",
  },
  topSafeArea: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: "rgba(15, 23, 42, 0.6)",
  },
  patientTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  liveIndicatorRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
    gap: 6,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#EF4444",
  },
  timerText: {
    fontSize: 12,
    color: "#E2E8F0",
    fontWeight: "600",
  },
  prescriptionShortcut: {
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  shortcutText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  pipContainer: {
    position: "absolute",
    top: 100,
    right: 20,
    zIndex: 10,
  },
  pipFrame: {
    width: 90,
    height: 120,
    borderRadius: 16,
    backgroundColor: "#334155",
    borderWidth: 2,
    borderColor: "#475569",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  pipEmoji: {
    fontSize: 28,
    marginBottom: 4,
  },
  pipLabel: {
    fontSize: 10,
    color: "#94A3B8",
    fontWeight: "600",
  },
  bottomSafeArea: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  controlsPill: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    backgroundColor: "rgba(30, 41, 59, 0.95)",
    marginHorizontal: 20,
    marginBottom: 20,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  controlBtn: {
    alignItems: "center",
    justifyContent: "center",
    width: 50,
  },
  controlBtnActive: {
    opacity: 0.5,
  },
  controlIcon: {
    fontSize: 22,
    marginBottom: 4,
  },
  controlLabel: {
    fontSize: 10,
    color: "#94A3B8",
    fontWeight: "600",
  },
  endCallBtn: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#EF4444",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#EF4444",
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  endCallIcon: {
    fontSize: 22,
    transform: [{ rotate: "135deg" }],
  },
});
