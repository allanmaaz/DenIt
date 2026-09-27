import React, { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "../lib/supabaseClient";
import { X, Send, Bot, Loader2 } from "lucide-react";

const CLINIC = {
  name: "Asian Dental Care",
  doctor: "Dr. Adeeb Thaha C S",
  phone: "+91 8971763097",
  hours: "Mon–Sat: 10 AM – 8:30 PM",
};

const PROCEDURES = [
  "Root Canal Therapy (RCT)",
  "Dental Implants",
  "Zirconia Crowns & Bridges",
  "Clear Aligners & Braces",
  "Oral Prophylaxis & Scaling",
  "Wisdom Tooth Surgery",
  "Teeth Whitening & Veneers",
  "Pediatric Dentistry",
  "Consultation / General Checkup",
];

const TIME_SLOTS = [
  "10:00 AM","11:00 AM","12:00 PM",
  "02:30 PM","03:30 PM","04:30 PM",
  "05:30 PM","06:30 PM","07:30 PM",
];

const slotTo24h = (slot) => {
  const map = {
    "10:00 AM":"10:00:00","11:00 AM":"11:00:00","12:00 PM":"12:00:00",
    "02:30 PM":"14:30:00","03:30 PM":"15:30:00","04:30 PM":"16:30:00",
    "05:30 PM":"17:30:00","06:30 PM":"18:30:00","07:30 PM":"19:30:00",
  };
  return map[slot] || "10:00:00";
};

const tomorrow = () => new Date(Date.now() + 86400000).toISOString().split("T")[0];

const STEPS = {
  GREETING:"greeting", ASK_NAME:"askName", ASK_PHONE:"askPhone",
  ASK_PROCEDURE:"askProcedure", ASK_DATE:"askDate", ASK_TIME:"askTime",
  ASK_TYPE:"askType", CONFIRM:"confirm", BOOKING:"booking", DONE:"done", ERROR:"error",
};

function detectIntent(text) {
  const t = text.toLowerCase().trim();
  if (/\b(hi|hello|hey|hii|namaste)\b/.test(t)) return "greet";
  if (/\b(book|appoint|schedule|visit|consult)\b/.test(t)) return "book";
  if (/\b(hours?|timing|open|close|when)\b/.test(t)) return "hours";
  if (/\b(price|cost|fee|charge|how\s*much)\b/.test(t)) return "price";
  if (/\b(location|address|where|direction|map)\b/.test(t)) return "location";
  if (/\b(call|phone|number|contact|reach)\b/.test(t)) return "contact";
  if (/\b(thanks?|thank\s*you|ok|okay|sure|great|perfect|awesome)\b/.test(t)) return "thanks";
  return "unknown";
}

const PROCEDURE_CHIPS = PROCEDURES.map((p) => ({ label: p, value: p }));
const DATE_CHIPS = [
  { label: "Tomorrow", value: tomorrow() },
  { label: "Day After", value: new Date(Date.now()+172800000).toISOString().split("T")[0] },
  { label: "In 3 days", value: new Date(Date.now()+259200000).toISOString().split("T")[0] },
];
const TIME_CHIPS = TIME_SLOTS.map((s) => ({ label: s, value: s }));
const TYPE_CHIPS = [
  { label: "🏥 In-Clinic Visit", value: "IN_PERSON" },
  { label: "📱 Video Consultation", value: "VIDEO" },
];

function botMsg(text, chips, meta) {
  return { id: Date.now()+Math.random(), from:"bot", text, chips:chips||null, meta:meta||{}, ts:new Date() };
}
function userMsg(text) {
  return { id: Date.now()+Math.random(), from:"user", text, ts:new Date() };
}

export default function DentalChatbot({ onClose }) {
  const [messages, setMessages] = useState([]);
  const [step, setStep] = useState(STEPS.GREETING);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [booking, setBooking] = useState({
    fullName:"", phone:"", procedure:"", date:tomorrow(), timeSlot:"11:00 AM", type:"IN_PERSON",
  });
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior:"smooth" });
  }, []);

  useEffect(scrollBottom, [messages, isTyping]);

  const addBotMsg = useCallback((text, chips, meta) => {
    setIsTyping(true);
    const delay = Math.min(400 + text.length * 7, 1600);
    setTimeout(() => {
      setMessages(prev => [...prev, botMsg(text, chips, meta)]);
      setIsTyping(false);
    }, delay);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      addBotMsg(
        "👋 Hello! I'm DenIt — your AI booking assistant at **Asian Dental Care**.\n\nI can help you:\n• 📅 Book an appointment with Dr. Adeeb Thaha C S\n• 💬 Answer clinic questions\n\nHow can I help you today?",
        [
          { label:"📅 Book Appointment", value:"book" },
          { label:"⏰ Clinic Hours", value:"hours" },
          { label:"📍 Location", value:"location" },
          { label:"📞 Call Clinic", value:"call" },
        ]
      );
    }, 400);
    return () => clearTimeout(t);
  }, []);

  const startBooking = useCallback(() => {
    setStep(STEPS.ASK_NAME);
    addBotMsg("Let's get you booked in! 🦷\n\nFirst, what's your **full name**?");
  }, [addBotMsg]);

  const processBooking = useCallback(async (data) => {
    setStep(STEPS.BOOKING);
    setIsTyping(true);
    try {
      const email = data.phone.replace(/\D/g,"") + "@asiandental.care";
      let profileId = null;
      const { data: ep } = await supabase.from("profiles").select("id")
        .or("email.eq."+email+",phone.eq."+data.phone).maybeSingle();
      if (ep?.id) {
        profileId = ep.id;
      } else {
        const { data: np } = await supabase.from("profiles")
          .insert({ full_name:data.fullName, email, phone:data.phone, role:"PATIENT" })
          .select("id").single();
        profileId = np?.id;
      }
      let patientId = null;
      if (profileId) {
        const { data: epa } = await supabase.from("patients").select("id").eq("profile_id",profileId).maybeSingle();
        if (epa?.id) { patientId = epa.id; }
        else {
          const { data: np2 } = await supabase.from("patients").insert({ profile_id:profileId }).select("id").single();
          patientId = np2?.id;
        }
      }
      const { data: docs } = await supabase.from("doctors").select("id").limit(1);
      const doctorId = docs?.[0]?.id || null;
      const payload = {
        appointment_date: data.date,
        start_time: slotTo24h(data.timeSlot),
        end_time: slotTo24h(data.timeSlot),
        appointment_type: data.type,
        status: "PENDING",
        payment_status: "PENDING",
        notes: "Procedure: " + data.procedure + " | Patient: " + data.fullName + " (" + data.phone + ") | Booked via DenIt Chat",
      };
      if (patientId) payload.patient_id = patientId;
      if (doctorId) payload.doctor_id = doctorId;
      const { data: appt, error } = await supabase.from("appointments").insert(payload).select("id").single();
      if (error) throw error;
      const refId = (appt?.id || "").slice(0,8).toUpperCase() || ("ADC-" + Math.floor(100000 + Math.random()*900000));
      setIsTyping(false);
      setStep(STEPS.DONE);
      setMessages(prev => [...prev, botMsg(
        "✅ **Appointment Confirmed!**\n\n📋 **Ref:** " + refId + "\n👤 **Patient:** " + data.fullName +
        "\n🦷 **Procedure:** " + data.procedure + "\n📅 **Date:** " + data.date +
        "\n⏰ **Time:** " + data.timeSlot + "\n🏥 **Type:** " + (data.type === "IN_PERSON" ? "In-Clinic Visit" : "Video Consultation") +
        "\n\nWe'll confirm shortly. Questions? Call " + CLINIC.phone,
        [
          { label:"💬 Get WhatsApp Confirmation", value:"wa_" + refId },
          { label:"📅 Book Another", value:"book" },
          { label:"📞 Call Clinic", value:"call" },
        ],
        { type:"success" }
      )]);
    } catch (err) {
      setIsTyping(false);
      setStep(STEPS.ERROR);
      setMessages(prev => [...prev, botMsg(
        "❌ Oops! Something went wrong.\n\nPlease call us directly:\n📞 **" + CLINIC.phone + "**\n\nOr try again?",
        [{ label:"🔄 Try Again", value:"book" }, { label:"📞 Call", value:"call" }]
      )]);
    }
  }, []);

  const handleUserInput = useCallback((text) => {
    if (!text.trim()) return;
    setMessages(prev => [...prev, userMsg(text)]);
    setInput("");
    const intent = detectIntent(text);

    if (text.startsWith("wa_")) {
      const pPhone = booking.phone ? booking.phone.replace(/\D/g, "").slice(-10) : "";
      const cleanRef = text.replace("wa_", "");
      const msg =
        "🦷 *Asian Dental Care — Appointment Confirmed!*\n\n" +
        "Dear " + (booking.fullName || "Patient") + ",\n" +
        "Your appointment has been confirmed with *Dr. Adeeb Thaha C S* (BDS, MDS, FICOI USA).\n\n" +
        "📅 *Date:* " + booking.date + "\n" +
        "⏰ *Time:* " + booking.timeSlot + "\n" +
        "🩺 *Procedure:* " + (booking.procedure || "Dental Consultation") + "\n" +
        "🔖 *Booking Ref:* #" + cleanRef + "\n\n" +
        "📍 *Clinic:* 18, Lady Curzon Rd, Near Bowring Hospital, Tasker Town, Shivaji Nagar, Bengaluru\n" +
        "🗺️ *Maps:* https://www.google.com/maps/search/?api=1&query=Asian+Dental+Care+18+Lady+Curzon+Rd+Shivaji+Nagar+Bengaluru\n" +
        "📞 *Direct:* +91 8971763097 | 080-41201393";
      const url = pPhone
        ? "https://wa.me/91" + pPhone + "?text=" + encodeURIComponent(msg)
        : "https://wa.me/?text=" + encodeURIComponent(msg);
      window.open(url, "_blank");
      addBotMsg("Opening WhatsApp with your booking details! 📲 You can also reply directly on WhatsApp for any assistance.", [
        { label: "📅 Book Another", value: "book" },
        { label: "📞 Call Clinic", value: "call" }
      ]);
      return;
    }

    if (text === "call") {
      window.open("tel:" + CLINIC.phone, "_self");
      addBotMsg("Connecting you to " + CLINIC.phone + " 📞", [{ label:"📅 Book Appointment", value:"book" }]);
      return;
    }
    if (text === "hours" || (intent === "hours" && step === STEPS.GREETING)) {
      addBotMsg("🕐 **Clinic Hours**\n\n" + CLINIC.hours + "\n☀️ Sunday: By Prior Appointment Only\n\nWould you like to book?", [{ label:"📅 Book Now", value:"book" }]);
      return;
    }
    if (text === "location" || (intent === "location" && step === STEPS.GREETING)) {
      addBotMsg("📍 **Asian Dental Care**\n18, Lady Curzon Rd, Near Bowring Hospital,\nTasker Town, Shivaji Nagar,\nBengaluru – 560052\n\n[Open in Maps](https://maps.google.com/?q=Asian+Dental+Care+Shivaji+Nagar+Bengaluru)", [{ label:"📅 Book Appointment", value:"book" }]);
      return;
    }
    if (text === "book" || (intent === "book" && step === STEPS.GREETING)) {
      startBooking();
      return;
    }

    switch (step) {
      case STEPS.GREETING: {
        if (intent === "thanks") { addBotMsg("You're welcome! 😊 How else can I help?", [{ label:"📅 Book Appointment", value:"book" }]); }
        else if (intent === "contact") { addBotMsg("You can reach us at:\n📞 " + CLINIC.phone + "\n\nOr book an appointment right now!", [{ label:"📅 Book Now", value:"book" }, { label:"📞 Call", value:"call" }]); }
        else if (intent === "price") { addBotMsg("💰 **Treatment Costs**\n\nPrices vary by case. Book a consultation for an accurate estimate — quick and friendly!\n\n" + CLINIC.doctor + " will guide you.", [{ label:"📅 Book Consultation", value:"book" }]); }
        else { addBotMsg("I'm here to help! Would you like to book or know something about the clinic?", [{ label:"📅 Book Appointment", value:"book" }, { label:"⏰ Hours", value:"hours" }, { label:"📍 Location", value:"location" }]); }
        break;
      }
      case STEPS.ASK_NAME: {
        const name = text.trim();
        if (name.length < 2) { addBotMsg("Please enter your full name (at least 2 characters)."); return; }
        setBooking(b => ({ ...b, fullName: name }));
        setStep(STEPS.ASK_PHONE);
        addBotMsg("Nice to meet you, **" + name + "**! 👋\n\nWhat's your **phone number** so we can confirm your appointment?");
        break;
      }
      case STEPS.ASK_PHONE: {
        const phone = text.trim();
        if (phone.replace(/\D/g,"").length < 10) { addBotMsg("Please enter a valid 10-digit phone number."); return; }
        setBooking(b => ({ ...b, phone }));
        setStep(STEPS.ASK_PROCEDURE);
        addBotMsg("Got it! 📱 Now, which **treatment** are you visiting for?", PROCEDURE_CHIPS);
        break;
      }
      case STEPS.ASK_PROCEDURE: {
        const proc = PROCEDURES.find(p => p.toLowerCase() === text.toLowerCase() || p === text) || text;
        setBooking(b => ({ ...b, procedure: proc }));
        setStep(STEPS.ASK_DATE);
        addBotMsg("Great choice! 🦷 **" + proc + "**\n\nWhich **date** works for you?", DATE_CHIPS);
        break;
      }
      case STEPS.ASK_DATE: {
        let date = text;
        if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) { date = tomorrow(); }
        if (date < new Date().toISOString().split("T")[0]) { addBotMsg("Please choose a future date.", DATE_CHIPS); return; }
        setBooking(b => ({ ...b, date }));
        setStep(STEPS.ASK_TIME);
        addBotMsg("📅 **" + date + "** — perfect!\n\nNow pick a **time slot**:", TIME_CHIPS);
        break;
      }
      case STEPS.ASK_TIME: {
        const slot = TIME_SLOTS.find(s => s === text) || text;
        setBooking(b => ({ ...b, timeSlot: slot }));
        setStep(STEPS.ASK_TYPE);
        addBotMsg("Would you prefer an **in-clinic visit** or a **video consultation**?", TYPE_CHIPS);
        break;
      }
      case STEPS.ASK_TYPE: {
        const type = (text === "IN_PERSON" || text.toLowerCase().includes("clinic")) ? "IN_PERSON" : "VIDEO";
        const updated = { ...booking, type };
        setBooking(updated);
        setStep(STEPS.CONFIRM);
        addBotMsg(
          "📋 **Please confirm your booking:**\n\n👤 **Name:** " + updated.fullName +
          "\n📱 **Phone:** " + updated.phone + "\n🦷 **Procedure:** " + updated.procedure +
          "\n📅 **Date:** " + updated.date + "\n⏰ **Time:** " + updated.timeSlot +
          "\n🏥 **Type:** " + (type === "IN_PERSON" ? "In-Clinic Visit" : "Video Consultation") +
          "\n\nShall I confirm this appointment?",
          [{ label:"✅ Confirm Booking", value:"confirm_yes" }, { label:"✏️ Start Over", value:"book" }]
        );
        break;
      }
      case STEPS.CONFIRM: {
        if (text === "confirm_yes" || text.toLowerCase().includes("yes") || text.toLowerCase().includes("confirm")) {
          processBooking(booking);
        } else if (text === "book") {
          setStep(STEPS.GREETING); startBooking();
        } else {
          addBotMsg("Please confirm or start over.", [{ label:"✅ Confirm", value:"confirm_yes" }, { label:"✏️ Start Over", value:"book" }]);
        }
        break;
      }
      case STEPS.DONE:
      case STEPS.ERROR: {
        setStep(STEPS.GREETING);
        if (text === "book") { startBooking(); }
        else { addBotMsg("How else can I help you?", [{ label:"📅 Book Another", value:"book" }, { label:"⏰ Hours", value:"hours" }, { label:"📞 Call", value:"call" }]); }
        break;
      }
      default:
        addBotMsg("I'm not sure I understood that. Let me help you with:", [{ label:"📅 Book Appointment", value:"book" }, { label:"⏰ Hours", value:"hours" }, { label:"📍 Location", value:"location" }]);
    }
  }, [step, booking, addBotMsg, startBooking, processBooking]);

  const handleSubmit = (e) => { e.preventDefault(); if (input.trim()) handleUserInput(input.trim()); };

  const renderText = (text) =>
    text.split("\n").map((line, i) => {
      const parts = line.split(/(\*\*.*?\*\*)/g).map((part, j) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return <strong key={j} className="font-bold text-white">{part.slice(2, -2)}</strong>;
        }
        const lm = part.match(/\[([^\]]+)\]\(([^)]+)\)/);
        if (lm) return <a key={j} href={lm[2]} target="_blank" rel="noreferrer" className="text-cyan-400 underline hover:text-cyan-300">{lm[1]}</a>;
        return part;
      });
      return (
        <React.Fragment key={i}>
          {parts}
          {i < text.split("\n").length - 1 && <br />}
        </React.Fragment>
      );
    });

  return (
    <div className="flex flex-col h-full bg-[#0d1117] text-slate-200 overflow-hidden" style={{ fontFamily: "'ui-monospace', 'SFMono-Regular', 'Menlo', monospace" }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#161b22] border-b border-[#30363d] shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-[#161b22]" />
          </div>
          <div>
            <p className="text-[13px] font-bold text-white leading-none tracking-tight">DenIt</p>
            <p className="text-[10px] text-emerald-400 font-medium leading-none mt-0.5">● Online · AI Booking Assistant</p>
          </div>
        </div>
        <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-[#21262d] transition-colors" aria-label="Close chat">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3" style={{ scrollbarWidth:"thin", scrollbarColor:"#30363d transparent" }}>
        {messages.map((msg) => (
          <div key={msg.id} className={"flex items-end gap-2 " + (msg.from === "user" ? "justify-end" : "justify-start")}>
            {msg.from === "bot" && (
              <div className="w-6 h-6 rounded-md bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shrink-0 mb-0.5">
                <Bot className="w-3 h-3 text-white" />
              </div>
            )}
            <div className="max-w-[82%]">
              <div className={"px-3.5 py-2.5 rounded-2xl text-[12.5px] leading-relaxed " + (
                msg.from === "user"
                  ? "bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-br-sm shadow-lg"
                  : msg.meta?.type === "success"
                  ? "bg-[#0d2818] border border-emerald-700/60 text-emerald-100 rounded-bl-sm"
                  : "bg-[#161b22] border border-[#30363d] text-slate-300 rounded-bl-sm"
              )}>
                {renderText(msg.text)}
              </div>
              {msg.chips && msg.from === "bot" && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {msg.chips.map((chip) => (
                    <button key={chip.value} onClick={() => handleUserInput(chip.value)}
                      className="px-3 py-1.5 rounded-full bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] hover:border-cyan-700 text-[11px] text-slate-300 hover:text-cyan-300 transition-all font-medium">
                      {chip.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex items-end gap-2">
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shrink-0">
              <Bot className="w-3 h-3 text-white" />
            </div>
            <div className="bg-[#161b22] border border-[#30363d] rounded-2xl rounded-bl-sm px-4 py-3">
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay:"0ms" }} />
                <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay:"150ms" }} />
                <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay:"300ms" }} />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="shrink-0 bg-[#161b22] border-t border-[#30363d] px-3 py-3">
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              step === STEPS.ASK_NAME ? "Enter your full name…" :
              step === STEPS.ASK_PHONE ? "Enter phone number…" :
              step === STEPS.ASK_PROCEDURE ? "Type a treatment or pick above…" :
              step === STEPS.ASK_DATE ? "YYYY-MM-DD or pick a chip…" :
              "Type a message…"
            }
            className="flex-1 bg-[#0d1117] border border-[#30363d] rounded-xl px-3.5 py-2.5 text-[12.5px] text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-700 focus:ring-1 transition-all"
            disabled={isTyping || step === STEPS.BOOKING}
            autoComplete="off"
          />
          <button type="submit" disabled={!input.trim() || isTyping || step === STEPS.BOOKING}
            className="w-9 h-9 bg-gradient-to-br from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl flex items-center justify-center transition-all shadow-lg">
            {isTyping || step === STEPS.BOOKING
              ? <Loader2 className="w-4 h-4 text-white animate-spin" />
              : <Send className="w-3.5 h-3.5 text-white" />
            }
          </button>
        </form>
        <p className="text-center text-[10px] text-slate-600 mt-1.5">Powered by DenIt · {CLINIC.name}</p>
      </div>
    </div>
  );
}
