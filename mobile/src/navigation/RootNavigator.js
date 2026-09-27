import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

// Patient Screens
import SplashScreen from "../screens/patient/SplashScreen";
import OnboardingScreen from "../screens/patient/OnboardingScreen";
import RoleSelectScreen from "../screens/patient/RoleSelectScreen";
import PatientHomeScreen from "../screens/patient/PatientHomeScreen";
import DoctorSearchScreen from "../screens/patient/DoctorSearchScreen";
import DoctorProfileScreen from "../screens/patient/DoctorProfileScreen";
import BookAppointmentScreen from "../screens/patient/BookAppointmentScreen";
import PaymentScreen from "../screens/patient/PaymentScreen";
import AppointmentConfirmedScreen from "../screens/patient/AppointmentConfirmedScreen";
import VideoConsultationScreen from "../screens/patient/VideoConsultationScreen";
import PrescriptionViewScreen from "../screens/patient/PrescriptionViewScreen";

// Doctor Screens
import DoctorDashboardScreen from "../screens/doctor/DoctorDashboardScreen";
import DoctorAppointmentsScreen from "../screens/doctor/DoctorAppointmentsScreen";
import PatientDetailsScreen from "../screens/doctor/PatientDetailsScreen";
import DoctorVideoConsultationScreen from "../screens/doctor/DoctorVideoConsultationScreen";
import CreatePrescriptionScreen from "../screens/doctor/CreatePrescriptionScreen";
import DoctorEarningsScreen from "../screens/doctor/DoctorEarningsScreen";
import DoctorMessagesScreen from "../screens/doctor/DoctorMessagesScreen";

const Stack = createNativeStackNavigator();

export default function RootNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Splash"
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right",
      }}
    >
      {/* Onboarding & Common */}
      <Stack.Screen name="Splash" component={SplashScreen} />
      <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      <Stack.Screen name="RoleSelect" component={RoleSelectScreen} />

      {/* Patient Flow */}
      <Stack.Screen name="PatientHome" component={PatientHomeScreen} />
      <Stack.Screen name="DoctorSearch" component={DoctorSearchScreen} />
      <Stack.Screen name="DoctorProfile" component={DoctorProfileScreen} />
      <Stack.Screen name="BookAppointment" component={BookAppointmentScreen} />
      <Stack.Screen name="Payment" component={PaymentScreen} />
      <Stack.Screen name="AppointmentConfirmed" component={AppointmentConfirmedScreen} />
      <Stack.Screen name="VideoConsultation" component={VideoConsultationScreen} />
      <Stack.Screen name="PrescriptionView" component={PrescriptionViewScreen} />

      {/* Doctor Flow */}
      <Stack.Screen name="DoctorDashboard" component={DoctorDashboardScreen} />
      <Stack.Screen name="DoctorAppointments" component={DoctorAppointmentsScreen} />
      <Stack.Screen name="PatientDetails" component={PatientDetailsScreen} />
      <Stack.Screen name="DoctorVideoConsultation" component={DoctorVideoConsultationScreen} />
      <Stack.Screen name="CreatePrescription" component={CreatePrescriptionScreen} />
      <Stack.Screen name="DoctorEarnings" component={DoctorEarningsScreen} />
      <Stack.Screen name="DoctorMessages" component={DoctorMessagesScreen} />
    </Stack.Navigator>
  );
}
