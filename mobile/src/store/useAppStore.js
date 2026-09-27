import { create } from "zustand";

export const useAppStore = create((set) => ({
  userRole: "PATIENT", // 'PATIENT' or 'DOCTOR'
  user: null,
  selectedDoctor: null,
  bookingDraft: {
    doctor: null,
    date: "Wed 27 Nov",
    timeSlot: "04:00 PM",
    type: "VIDEO",
    amount: 800,
  },
  activeCall: null,

  setUserRole: (role) => set({ userRole: role }),
  setUser: (user) => set({ user }),
  setSelectedDoctor: (doctor) => set({ selectedDoctor: doctor }),
  setBookingDraft: (draft) =>
    set((state) => ({ bookingDraft: { ...state.bookingDraft, ...draft } })),
  setActiveCall: (call) => set({ activeCall: call }),
}));
