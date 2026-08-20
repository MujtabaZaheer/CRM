import React, { useEffect, useState } from "react";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus, X, Trash2, Clock, MapPin } from "lucide-react";
import { addDoc, collection, onSnapshot, orderBy, query, doc, deleteDoc } from "firebase/firestore";
import { db } from "../firebase/config";
import { useAuth } from "../contexts/AuthContext";
import { useGlobalData } from "../contexts/GlobalDataContext";
import { logAuditEvent } from "../utils/auditLogger";

export interface Appointment {
  id: string;
  title: string;
  studentName: string;
  date: string; // YYYY-MM-DD
  time: string;
  type: "Consultation" | "Visa Interview Prep" | "Document Review" | "University Briefing" | "Other";
  location?: string;
  recurrence?: "none" | "daily" | "weekly" | "monthly";
  reminderMinutes?: number;
  notes?: string;
  createdAt: number;
  createdBy: string;
}

export const CalendarPage: React.FC = () => {
  const { appUser } = useAuth();
  const { tasks } = useGlobalData();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showModal, setShowModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Appointment | null>(null);
  const [form, setForm] = useState({
    title: "",
    studentName: "",
    date: new Date().toISOString().slice(0, 10),
    time: "10:00",
    type: "Consultation" as Appointment["type"],
    location: "Online Zoom Call",
    recurrence: "none" as Appointment["recurrence"],
    reminderMinutes: 30,
    notes: "",
  });

  useEffect(() => {
    const unsub = onSnapshot(
      query(collection(db, "appointments"), orderBy("createdAt", "desc")),
      (snap) => {
        setAppointments(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Appointment));
      },
      () => {}
    );
    return () => unsub();
  }, []);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const today = () => setCurrentDate(new Date());

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload: Omit<Appointment, "id"> = {
        title: form.title.trim(),
        studentName: form.studentName.trim(),
        date: form.date,
        time: form.time,
        type: form.type,
        location: form.location.trim(),
        recurrence: form.recurrence,
        reminderMinutes: form.reminderMinutes,
        notes: form.notes.trim(),
        createdAt: Date.now(),
        createdBy: appUser?.email || "Staff",
      };

      const docRef = await addDoc(collection(db, "appointments"), payload);
      await logAuditEvent(
        "APPOINTMENT_SCHEDULED",
        appUser?.email || "Staff",
        "Calendar",
        `Scheduled ${form.type} with ${form.studentName} on ${form.date}`,
        docRef.id,
        appUser?.role
      );

      setShowModal(false);
      setForm({
        title: "",
        studentName: "",
        date: new Date().toISOString().slice(0, 10),
        time: "10:00",
        type: "Consultation",
        location: "Online Zoom Call",
        recurrence: "none",
        reminderMinutes: 30,
        notes: "",
      });
    } catch (err) {
      console.error("Failed to schedule appointment:", err);
    }
  };

  const handleDeleteAppointment = async (id: string) => {
    try {
      await deleteDoc(doc(db, "appointments", id));
      setSelectedEvent(null);
    } catch (err) {
      console.error("Failed to delete appointment:", err);
    }
  };

  const getEventsForDate = (dateStr: string) => {
    const dayAppointments = appointments.filter((a) => a.date === dateStr);
    const dayTasks = tasks.filter((t) => t.dueDate === dateStr);
    return { dayAppointments, dayTasks };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <CalendarIcon className="w-6 h-6 text-emerald-400" />
            <h1 className="font-heading text-2xl font-bold text-[var(--text-primary)]">Appointments & Calendar</h1>
          </div>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            Schedule student consultations, visa interview preps, and track task deadlines.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={today}
            className="px-3 py-1.5 bg-[var(--bg-card)] border border-[var(--border-default)] sq-btn text-xs font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-hover)]"
          >
            Today
          </button>
          <div className="flex items-center bg-[var(--bg-card)] border border-[var(--border-default)] sq-card p-1">
            <button onClick={prevMonth} className="p-1 hover:text-emerald-400">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 text-xs font-bold text-[var(--text-primary)] font-heading min-w-[120px] text-center">
              {monthNames[month]} {year}
            </span>
            <button onClick={nextMonth} className="p-1 hover:text-emerald-400">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={() => setShowModal(true)}
            className="flex items-center space-x-1.5 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs sq-btn shadow-lg shadow-emerald-500/20"
          >
            <Plus className="w-4 h-4" />
            <span>New Appointment</span>
          </button>
        </div>
      </div>

      {/* Month Calendar Grid */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-default)] sq-card shadow-xl overflow-hidden">
        {/* Days Header */}
        <div className="grid grid-cols-7 border-b border-[var(--border-default)] bg-[var(--bg-elevated)] text-center text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider py-2.5">
          <div>Sun</div>
          <div>Mon</div>
          <div>Tue</div>
          <div>Wed</div>
          <div>Thu</div>
          <div>Fri</div>
          <div>Sat</div>
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-[var(--border-default)] text-xs">
          {/* Blank padding for previous month */}
          {Array.from({ length: firstDayOfMonth }, (_, i) => (
            <div key={`blank-${i}`} className="min-h-[100px] p-2 bg-[var(--bg-main)]/30 opacity-40" />
          ))}

          {/* Days of current month */}
          {Array.from({ length: daysInMonth }, (_, i) => {
            const dayNum = i + 1;
            const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
            const isToday = new Date().toISOString().slice(0, 10) === dateStr;
            const { dayAppointments, dayTasks } = getEventsForDate(dateStr);

            return (
              <div
                key={dateStr}
                className={`min-h-[100px] p-2 space-y-1.5 hover:bg-[var(--bg-hover)]/50 transition-colors ${
                  isToday ? "bg-emerald-500/5 border-t-2 border-t-emerald-500" : ""
                }`}
              >
                <div className="flex justify-between items-center">
                  <span
                    className={`font-bold font-mono text-xs ${
                      isToday
                        ? "w-6 h-6 rounded-full bg-emerald-500 text-zinc-950 flex items-center justify-center font-bold"
                        : "text-[var(--text-primary)]"
                    }`}
                  >
                    {dayNum}
                  </span>
                  {(dayAppointments.length > 0 || dayTasks.length > 0) && (
                    <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                      {dayAppointments.length + dayTasks.length} events
                    </span>
                  )}
                </div>

                {/* Appointment Tags */}
                <div className="space-y-1">
                  {dayAppointments.map((apt) => (
                    <div
                      key={apt.id}
                      onClick={() => setSelectedEvent(apt)}
                      className="p-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 cursor-pointer border border-emerald-500/30 text-emerald-300 rounded text-[10px] space-y-0.5 font-medium transition-colors"
                    >
                      <div className="font-semibold truncate">{apt.title}</div>
                      <div className="text-[9px] text-[var(--text-muted)] truncate flex items-center justify-between">
                        <span>{apt.studentName}</span>
                        <span>{apt.time}</span>
                      </div>
                    </div>
                  ))}

                  {/* Task Deadline Tags */}
                  {dayTasks.map((t) => (
                    <div
                      key={t.id}
                      className="p-1 bg-amber-500/10 border border-amber-500/30 text-amber-300 rounded text-[10px] truncate"
                    >
                      Task: {t.title}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg bg-[var(--bg-card)] border border-[var(--border-default)] sq-modal p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[var(--border-default)] pb-3">
              <h2 className="font-heading font-bold text-base text-[var(--text-primary)] flex items-center space-x-2">
                <CalendarIcon className="w-4 h-4 text-emerald-400" />
                <span>Schedule New Appointment</span>
              </h2>
              <button onClick={() => setShowModal(false)} className="text-[var(--text-muted)] hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3 text-xs">
              <label className="block text-[var(--text-secondary)] font-medium">
                Appointment Title
                <input
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Visa GTE Interview Preparation"
                  className="w-full mt-1 p-2 bg-[var(--bg-input)] border border-[var(--border-default)] sq-input"
                />
              </label>

              <label className="block text-[var(--text-secondary)] font-medium">
                Student Name
                <input
                  required
                  value={form.studentName}
                  onChange={(e) => setForm({ ...form, studentName: e.target.value })}
                  placeholder="e.g. John Doe"
                  className="w-full mt-1 p-2 bg-[var(--bg-input)] border border-[var(--border-default)] sq-input"
                />
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label className="block text-[var(--text-secondary)] font-medium">
                  Date
                  <input
                    required
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    className="w-full mt-1 p-2 bg-[var(--bg-input)] border border-[var(--border-default)] sq-input"
                  />
                </label>

                <label className="block text-[var(--text-secondary)] font-medium">
                  Time
                  <input
                    required
                    type="time"
                    value={form.time}
                    onChange={(e) => setForm({ ...form, time: e.target.value })}
                    className="w-full mt-1 p-2 bg-[var(--bg-input)] border border-[var(--border-default)] sq-input"
                  />
                </label>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <label className="block text-[var(--text-secondary)] font-medium">
                  Type
                  <select
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value as Appointment["type"] })}
                    className="w-full mt-1 p-2 bg-[var(--bg-input)] border border-[var(--border-default)] sq-input"
                  >
                    <option value="Consultation">Consultation</option>
                    <option value="Visa Interview Prep">Visa Interview Prep</option>
                    <option value="Document Review">Document Review</option>
                    <option value="University Briefing">University Briefing</option>
                    <option value="Other">Other</option>
                  </select>
                </label>

                <label className="block text-[var(--text-secondary)] font-medium">
                  Location / Link
                  <input
                    value={form.location}
                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                    placeholder="Zoom Link / Office Room"
                    className="w-full mt-1 p-2 bg-[var(--bg-input)] border border-[var(--border-default)] sq-input"
                  />
                </label>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <label className="block text-[var(--text-secondary)] font-medium">
                  Recurrence
                  <select
                    value={form.recurrence}
                    onChange={(e) => setForm({ ...form, recurrence: e.target.value as any })}
                    className="w-full mt-1 p-2 bg-[var(--bg-input)] border border-[var(--border-default)] sq-input"
                  >
                    <option value="none">One-off (No recurrence)</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </label>

                <label className="block text-[var(--text-secondary)] font-medium">
                  Reminder SLA
                  <select
                    value={form.reminderMinutes}
                    onChange={(e) => setForm({ ...form, reminderMinutes: Number(e.target.value) })}
                    className="w-full mt-1 p-2 bg-[var(--bg-input)] border border-[var(--border-default)] sq-input"
                  >
                    <option value={15}>15 minutes before</option>
                    <option value={30}>30 minutes before</option>
                    <option value={60}>1 hour before</option>
                    <option value={1440}>1 day before</option>
                  </select>
                </label>
              </div>

              <label className="block text-[var(--text-secondary)] font-medium">
                Notes
                <textarea
                  rows={3}
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="Pre-meeting agenda or required documents..."
                  className="w-full mt-1 p-2 bg-[var(--bg-input)] border border-[var(--border-default)] sq-input"
                />
              </label>

              <div className="flex justify-end space-x-2 pt-3 border-t border-[var(--border-default)]">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-[var(--bg-hover)] text-[var(--text-secondary)] sq-btn font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-500 text-zinc-950 font-bold sq-btn hover:bg-emerald-400"
                >
                  Save Appointment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Event Details View Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-[var(--bg-card)] border border-[var(--border-default)] sq-modal p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[var(--border-default)] pb-3">
              <div className="flex items-center space-x-2">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
                  <CalendarIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-sm text-[var(--text-primary)]">{selectedEvent.title}</h3>
                  <span className="text-[10px] text-emerald-400 font-semibold">{selectedEvent.type}</span>
                </div>
              </div>
              <button onClick={() => setSelectedEvent(null)} className="text-[var(--text-muted)] hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="p-3 bg-[var(--bg-elevated)] rounded-xl space-y-1">
                <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider block">Student / Attendee</span>
                <span className="text-[var(--text-primary)] font-bold">{selectedEvent.studentName}</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="p-3 bg-[var(--bg-elevated)] rounded-xl space-y-0.5">
                  <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider block flex items-center space-x-1">
                    <Clock className="w-3 h-3" />
                    <span>Time & Date</span>
                  </span>
                  <span className="text-[var(--text-primary)] font-medium">{selectedEvent.date} @ {selectedEvent.time}</span>
                </div>

                <div className="p-3 bg-[var(--bg-elevated)] rounded-xl space-y-0.5">
                  <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider block flex items-center space-x-1">
                    <MapPin className="w-3 h-3" />
                    <span>Location</span>
                  </span>
                  <span className="text-[var(--text-primary)] font-medium truncate block">{selectedEvent.location || "Online"}</span>
                </div>
              </div>

              {selectedEvent.notes && (
                <div className="p-3 bg-[var(--bg-elevated)] rounded-xl space-y-1">
                  <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider block">Agenda Notes</span>
                  <p className="text-[var(--text-secondary)] italic">{selectedEvent.notes}</p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-[var(--border-default)]">
              <button
                type="button"
                onClick={() => handleDeleteAppointment(selectedEvent.id)}
                className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-bold text-xs rounded-xl flex items-center space-x-1 border border-rose-500/20 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedEvent(null)}
                className="px-4 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
