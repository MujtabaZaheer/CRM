import React, { useState } from "react";
import { Sliders, Bell, Globe, Save, CheckCircle2 } from "lucide-react";

export const StudentSettingsPage: React.FC = () => {
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [smsAlerts, setSmsAlerts] = useState(false);
  const [preferredCurrency, setPreferredCurrency] = useState("GBP");
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-7 pb-16 font-sans animate-fade-in">
      <div className="space-y-1">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-300 text-xs font-bold">
          <Sliders className="w-3.5 h-3.5 text-teal-400" />
          <span>Student Account Preferences</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-heading">
          Portal Settings
        </h1>
        <p className="text-xs sm:text-sm text-slate-400">
          Manage notification channels, preferred currency, and privacy preferences for your student account.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Notification Preferences */}
        <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold text-white font-heading">
            <Bell className="w-4 h-4 text-teal-400" />
            <span>Admissions & Offer Notifications</span>
          </div>

          <div className="space-y-3 pt-1">
            <label className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 cursor-pointer">
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-white block">Email Alerts</span>
                <span className="text-[11px] text-slate-400 block">Receive instant emails for CAS releases and unconditional offers</span>
              </div>
              <input
                type="checkbox"
                checked={emailAlerts}
                onChange={(e) => setEmailAlerts(e.target.checked)}
                className="w-4 h-4 accent-teal-400"
              />
            </label>

            <label className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 cursor-pointer">
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-white block">SMS & WhatsApp Alerts</span>
                <span className="text-[11px] text-slate-400 block">Receive urgent document request reminders directly on your mobile</span>
              </div>
              <input
                type="checkbox"
                checked={smsAlerts}
                onChange={(e) => setSmsAlerts(e.target.checked)}
                className="w-4 h-4 accent-teal-400"
              />
            </label>
          </div>
        </div>

        {/* Currency & Localization */}
        <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold text-white font-heading">
            <Globe className="w-4 h-4 text-teal-400" />
            <span>Tuition Currency Preference</span>
          </div>

          <div className="space-y-2">
            <label className="text-xs text-slate-400 block">Default tuition fee display currency:</label>
            <select
              value={preferredCurrency}
              onChange={(e) => setPreferredCurrency(e.target.value)}
              className="w-full sm:w-64 py-2 px-3 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-teal-500/50"
            >
              <option value="GBP">British Pound (£ GBP)</option>
              <option value="USD">US Dollar ($ USD)</option>
              <option value="AUD">Australian Dollar ($ AUD)</option>
              <option value="EUR">Euro (€ EUR)</option>
            </select>
          </div>
        </div>

        {/* Save Confirmation */}
        <div className="flex items-center justify-between pt-2">
          {saved ? (
            <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-bold">
              <CheckCircle2 className="w-4 h-4" />
              <span>Preferences saved successfully!</span>
            </div>
          ) : <div />}

          <button
            type="submit"
            className="px-6 py-2.5 bg-gradient-to-r from-teal-500 to-indigo-600 hover:from-teal-400 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-2 transition-all active:scale-95 cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Preferences</span>
          </button>
        </div>
      </form>
    </div>
  );
};
