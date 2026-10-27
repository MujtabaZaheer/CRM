import React, { useState } from "react";
import { Calendar, Clock, Video, CheckCircle2, MapPin, ArrowRight } from "lucide-react";

export const StudentAppointmentsPage: React.FC = () => {
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [appointmentType, setAppointmentType] = useState<"video" | "in_person">("video");
  const [booked, setBooked] = useState(false);

  const availableSlots = [
    { id: "slot-1", day: "Tomorrow", date: "28 Oct 2026", time: "11:00 AM - 11:30 AM", counsellor: "Sarah Jenkins" },
    { id: "slot-2", day: "Tomorrow", date: "28 Oct 2026", time: "02:30 PM - 03:00 PM", counsellor: "Sarah Jenkins" },
    { id: "slot-3", day: "Thursday", date: "29 Oct 2026", time: "10:00 AM - 10:30 AM", counsellor: "Sarah Jenkins" },
    { id: "slot-4", day: "Thursday", date: "29 Oct 2026", time: "04:00 PM - 04:30 PM", counsellor: "Sarah Jenkins" },
    { id: "slot-5", day: "Friday", date: "30 Oct 2026", time: "01:00 PM - 01:30 PM", counsellor: "Sarah Jenkins" },
  ];

  const handleConfirmBooking = () => {
    if (!selectedSlot) return;
    setBooked(true);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-7 pb-16 font-sans animate-fade-in">
      <div className="space-y-1">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/30 text-sky-300 text-xs font-bold">
          <Calendar className="w-3.5 h-3.5 text-sky-400" />
          <span>Admissions & Visa Consultation Booking</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-heading">
          Schedule Counsellor Consultation
        </h1>
        <p className="text-xs sm:text-sm text-slate-400">
          Book a 1-on-1 virtual or in-person session with your assigned advisor Sarah Jenkins for application reviews and mock visa interviews.
        </p>
      </div>

      {booked ? (
        <div className="p-8 sm:p-12 rounded-3xl bg-slate-900/90 border border-emerald-500/40 text-center space-y-4 shadow-xl">
          <div className="w-14 h-14 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-white font-heading">Consultation Confirmed!</h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-md mx-auto">
            Your calendar invitation and secure video conference link have been sent to your student email. Sarah Jenkins has been notified.
          </p>
          <button
            onClick={() => setBooked(false)}
            className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-teal-300 border border-teal-500/30 rounded-xl text-xs font-bold transition-colors"
          >
            Book Another Session
          </button>
        </div>
      ) : (
        <div className="rounded-3xl bg-slate-900/90 border border-slate-800 p-6 sm:p-8 space-y-6 shadow-xl">
          {/* Counsellor Profile Strip */}
          <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-teal-400 to-indigo-600 flex items-center justify-center font-bold text-white shadow">
                SJ
              </div>
              <div>
                <div className="text-sm font-bold text-white font-heading">Sarah Jenkins</div>
                <div className="text-xs text-slate-400">Senior Admissions Counsellor &bull; London HQ</div>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">Duration</span>
              <span className="text-xs font-bold text-white">30 Minutes</span>
            </div>
          </div>

          {/* Consultation Type Selector */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Meeting Type</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setAppointmentType("video")}
                className={`p-3.5 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                  appointmentType === "video"
                    ? "bg-teal-500/15 text-teal-300 border-teal-500/40 shadow"
                    : "bg-slate-950/60 text-slate-400 border-slate-800 hover:text-white"
                }`}
              >
                <Video className="w-4 h-4 text-teal-400" />
                <span>Google Meet / Video Call</span>
              </button>
              <button
                type="button"
                onClick={() => setAppointmentType("in_person")}
                className={`p-3.5 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                  appointmentType === "in_person"
                    ? "bg-teal-500/15 text-teal-300 border-teal-500/40 shadow"
                    : "bg-slate-950/60 text-slate-400 border-slate-800 hover:text-white"
                }`}
              >
                <MapPin className="w-4 h-4 text-teal-400" />
                <span>In-Person Office Visit</span>
              </button>
            </div>
          </div>

          {/* Slots Grid */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Select Available Time Slot</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {availableSlots.map((slot) => {
                const isSelected = selectedSlot === slot.id;
                return (
                  <button
                    key={slot.id}
                    type="button"
                    onClick={() => setSelectedSlot(slot.id)}
                    className={`p-4 rounded-2xl border text-left transition-all flex items-center justify-between ${
                      isSelected
                        ? "bg-gradient-to-r from-teal-500/20 to-indigo-500/10 border-teal-500/50 text-white shadow-md shadow-teal-500/10"
                        : "bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-300"
                    }`}
                  >
                    <div className="space-y-0.5">
                      <div className="text-xs font-bold text-white">{slot.day}, {slot.date}</div>
                      <div className="text-[11px] text-teal-400 font-mono flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{slot.time}</span>
                      </div>
                    </div>
                    {isSelected && (
                      <CheckCircle2 className="w-4 h-4 text-teal-400 flex-shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Confirm Button */}
          <div className="pt-4 border-t border-slate-800">
            <button
              onClick={handleConfirmBooking}
              disabled={!selectedSlot}
              className={`w-full py-3 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                selectedSlot
                  ? "bg-gradient-to-r from-teal-500 to-indigo-600 hover:from-teal-400 hover:to-indigo-500 text-white shadow-lg shadow-teal-500/25 active:scale-95 cursor-pointer"
                  : "bg-slate-800 text-slate-500 cursor-not-allowed"
              }`}
            >
              <span>Confirm Appointment</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
