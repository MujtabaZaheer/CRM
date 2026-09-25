import React from "react";
import { User, Phone, Mail, MapPin, Shield, Users } from "lucide-react";
import { PersonalInfoData } from "../../../types/agentApplication";

interface StepPersonalInfoProps {
  data: PersonalInfoData;
  onChange: (updated: Partial<PersonalInfoData>) => void;
  errors?: Record<string, string>;
}

export const StepPersonalInfo: React.FC<StepPersonalInfoProps> = ({ data, onChange, errors = {} }) => {
  const updateAddress = (field: string, val: string) => {
    onChange({
      permanentAddress: {
        ...data.permanentAddress,
        [field]: val,
      },
    });
  };


  const updateEmergency = (field: string, val: string) => {
    onChange({
      emergencyContact: {
        ...data.emergencyContact,
        [field]: val,
      },
    });
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* SECTION 1: LEGAL IDENTITY */}
      <div className="p-5 bg-[var(--bg-card)] border border-[var(--border-default)] rounded-2xl space-y-4 shadow-sm">
        <h3 className="font-bold text-sm text-[var(--text-primary)] flex items-center gap-2">
          <User className="w-4 h-4 text-emerald-400" />
          Legal Identity (As Stated in Official Passport)
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold mb-1 text-[var(--text-secondary)]">First Name *</label>
            <input
              type="text"
              value={data.firstName}
              onChange={(e) => onChange({ firstName: e.target.value })}
              placeholder="e.g. Tariq"
              className={`w-full p-2.5 bg-[var(--bg-input)] border rounded-xl text-xs text-[var(--text-primary)] focus:outline-none focus:border-emerald-500 ${
                errors.firstName ? "border-rose-500/80" : "border-[var(--border-default)]"
              }`}
            />
            {errors.firstName && <p className="text-[11px] text-rose-400 mt-1">{errors.firstName}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1 text-[var(--text-secondary)]">Middle Name(s)</label>
            <input
              type="text"
              value={data.middleName || ""}
              onChange={(e) => onChange({ middleName: e.target.value })}
              placeholder="e.g. Ali"
              className="w-full p-2.5 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-xl text-xs text-[var(--text-primary)] focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1 text-[var(--text-secondary)]">Last Name / Family Name *</label>
            <input
              type="text"
              value={data.lastName}
              onChange={(e) => onChange({ lastName: e.target.value })}
              placeholder="e.g. Mansoor"
              className={`w-full p-2.5 bg-[var(--bg-input)] border rounded-xl text-xs text-[var(--text-primary)] focus:outline-none focus:border-emerald-500 ${
                errors.lastName ? "border-rose-500/80" : "border-[var(--border-default)]"
              }`}
            />
            {errors.lastName && <p className="text-[11px] text-rose-400 mt-1">{errors.lastName}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold mb-1 text-[var(--text-secondary)]">Date of Birth *</label>
            <input
              type="date"
              value={data.dateOfBirth}
              onChange={(e) => onChange({ dateOfBirth: e.target.value })}
              className={`w-full p-2.5 bg-[var(--bg-input)] border rounded-xl text-xs text-[var(--text-primary)] focus:outline-none focus:border-emerald-500 ${
                errors.dateOfBirth ? "border-rose-500/80" : "border-[var(--border-default)]"
              }`}
            />
            {errors.dateOfBirth && <p className="text-[11px] text-rose-400 mt-1">{errors.dateOfBirth}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1 text-[var(--text-secondary)]">Gender *</label>
            <select
              value={data.gender}
              onChange={(e) => onChange({ gender: e.target.value as any })}
              className="w-full p-2.5 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-xl text-xs text-[var(--text-primary)] focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other / Prefer not to say</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1 text-[var(--text-secondary)]">Primary Nationality *</label>
            <input
              type="text"
              value={data.nationality}
              onChange={(e) => onChange({ nationality: e.target.value })}
              placeholder="e.g. Pakistani, Nigerian, Indian"
              className={`w-full p-2.5 bg-[var(--bg-input)] border rounded-xl text-xs text-[var(--text-primary)] focus:outline-none focus:border-emerald-500 ${
                errors.nationality ? "border-rose-500/80" : "border-[var(--border-default)]"
              }`}
            />
            {errors.nationality && <p className="text-[11px] text-rose-400 mt-1">{errors.nationality}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold mb-1 text-[var(--text-secondary)]">Country of Birth *</label>
            <input
              type="text"
              value={data.countryOfBirth}
              onChange={(e) => onChange({ countryOfBirth: e.target.value })}
              placeholder="e.g. Pakistan"
              className="w-full p-2.5 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-xl text-xs text-[var(--text-primary)] focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="flex flex-col justify-center">
            <label className="flex items-center gap-2 cursor-pointer mt-3">
              <input
                type="checkbox"
                checked={data.hasDualNationality}
                onChange={(e) => onChange({ hasDualNationality: e.target.checked })}
                className="w-4 h-4 text-emerald-500 rounded border-[var(--border-default)] focus:ring-emerald-500"
              />
              <span className="text-xs text-[var(--text-primary)] font-medium">Holds Dual Citizenship or Second Nationality</span>
            </label>
            {data.hasDualNationality && (
              <input
                type="text"
                value={data.dualNationalityDetails || ""}
                onChange={(e) => onChange({ dualNationalityDetails: e.target.value })}
                placeholder="Specify second passport country..."
                className="mt-2 w-full p-2 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-xl text-xs text-[var(--text-primary)]"
              />
            )}
          </div>
        </div>
      </div>

      {/* SECTION 2: PASSPORT CREDENTIALS */}
      <div className="p-5 bg-[var(--bg-card)] border border-[var(--border-default)] rounded-2xl space-y-4 shadow-sm">
        <h3 className="font-bold text-sm text-[var(--text-primary)] flex items-center gap-2">
          <Shield className="w-4 h-4 text-emerald-400" />
          Passport Details & Authority
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs font-semibold mb-1 text-[var(--text-secondary)]">Passport Number *</label>
            <input
              type="text"
              value={data.passportNumber}
              onChange={(e) => onChange({ passportNumber: e.target.value.toUpperCase() })}
              placeholder="e.g. AB1234567"
              className={`w-full p-2.5 bg-[var(--bg-input)] border rounded-xl text-xs font-mono uppercase text-[var(--text-primary)] focus:outline-none focus:border-emerald-500 ${
                errors.passportNumber ? "border-rose-500/80" : "border-[var(--border-default)]"
              }`}
            />
            {errors.passportNumber && <p className="text-[11px] text-rose-400 mt-1">{errors.passportNumber}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1 text-[var(--text-secondary)]">Issue Date *</label>
            <input
              type="date"
              value={data.passportIssueDate}
              onChange={(e) => onChange({ passportIssueDate: e.target.value })}
              className="w-full p-2.5 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-xl text-xs text-[var(--text-primary)] focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1 text-[var(--text-secondary)]">Expiry Date *</label>
            <input
              type="date"
              value={data.passportExpiryDate}
              onChange={(e) => onChange({ passportExpiryDate: e.target.value })}
              className={`w-full p-2.5 bg-[var(--bg-input)] border rounded-xl text-xs text-[var(--text-primary)] focus:outline-none focus:border-emerald-500 ${
                errors.passportExpiryDate ? "border-rose-500/80" : "border-[var(--border-default)]"
              }`}
            />
            {errors.passportExpiryDate && <p className="text-[11px] text-rose-400 mt-1">{errors.passportExpiryDate}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1 text-[var(--text-secondary)]">Issuing Authority *</label>
            <input
              type="text"
              value={data.passportIssuingAuthority}
              onChange={(e) => onChange({ passportIssuingAuthority: e.target.value })}
              placeholder="e.g. Gov of Pakistan / Passport Office"
              className="w-full p-2.5 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-xl text-xs text-[var(--text-primary)] focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>
      </div>

      {/* SECTION 3: CONTACT & RESIDENCE */}
      <div className="p-5 bg-[var(--bg-card)] border border-[var(--border-default)] rounded-2xl space-y-4 shadow-sm">
        <h3 className="font-bold text-sm text-[var(--text-primary)] flex items-center gap-2">
          <Phone className="w-4 h-4 text-emerald-400" />
          Direct Student Contact Information
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold mb-1 text-[var(--text-secondary)] flex items-center gap-1">
              <Mail className="w-3.5 h-3.5" /> Student Email Address *
            </label>
            <input
              type="email"
              value={data.email}
              onChange={(e) => onChange({ email: e.target.value })}
              placeholder="student@example.com"
              className={`w-full p-2.5 bg-[var(--bg-input)] border rounded-xl text-xs text-[var(--text-primary)] focus:outline-none focus:border-emerald-500 ${
                errors.email ? "border-rose-500/80" : "border-[var(--border-default)]"
              }`}
            />
            {errors.email && <p className="text-[11px] text-rose-400 mt-1">{errors.email}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1 text-[var(--text-secondary)]">Mobile / WhatsApp Number *</label>
            <div className="flex gap-2">
              <select
                value={data.phoneCountryCode}
                onChange={(e) => onChange({ phoneCountryCode: e.target.value })}
                className="w-28 p-2.5 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-xl text-xs text-[var(--text-primary)] focus:outline-none focus:border-emerald-500"
              >
                <option value="+44">UK (+44)</option>
                <option value="+1">US/CA (+1)</option>
                <option value="+92">PK (+92)</option>
                <option value="+91">IN (+91)</option>
                <option value="+234">NG (+234)</option>
                <option value="+86">CN (+86)</option>
                <option value="+971">UAE (+971)</option>
                <option value="+880">BD (+880)</option>
              </select>
              <input
                type="tel"
                value={data.phone}
                onChange={(e) => onChange({ phone: e.target.value })}
                placeholder="300 1234567"
                className={`flex-1 p-2.5 bg-[var(--bg-input)] border rounded-xl text-xs text-[var(--text-primary)] focus:outline-none focus:border-emerald-500 ${
                  errors.phone ? "border-rose-500/80" : "border-[var(--border-default)]"
                }`}
              />
            </div>
            {errors.phone && <p className="text-[11px] text-rose-400 mt-1">{errors.phone}</p>}
          </div>
        </div>

        {/* Permanent Residential Address */}
        <div className="pt-3 border-t border-[var(--border-default)] space-y-3">
          <h4 className="font-semibold text-xs text-[var(--text-primary)] flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-emerald-400" />
            Permanent Residential Address
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] text-[var(--text-secondary)] mb-1">Street Address *</label>
              <input
                type="text"
                value={data.permanentAddress.street}
                onChange={(e) => updateAddress("street", e.target.value)}
                placeholder="House / Apartment #, Street name"
                className="w-full p-2 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-xl text-xs text-[var(--text-primary)]"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] text-[var(--text-secondary)] mb-1">City *</label>
                <input
                  type="text"
                  value={data.permanentAddress.city}
                  onChange={(e) => updateAddress("city", e.target.value)}
                  placeholder="e.g. Lahore"
                  className="w-full p-2 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-xl text-xs text-[var(--text-primary)]"
                />
              </div>
              <div>
                <label className="block text-[11px] text-[var(--text-secondary)] mb-1">State / Province *</label>
                <input
                  type="text"
                  value={data.permanentAddress.state}
                  onChange={(e) => updateAddress("state", e.target.value)}
                  placeholder="e.g. Punjab"
                  className="w-full p-2 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-xl text-xs text-[var(--text-primary)]"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] text-[var(--text-secondary)] mb-1">Postal / ZIP Code *</label>
              <input
                type="text"
                value={data.permanentAddress.postalCode}
                onChange={(e) => updateAddress("postalCode", e.target.value)}
                placeholder="e.g. 54000"
                className="w-full p-2 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-xl text-xs text-[var(--text-primary)]"
              />
            </div>

            <div>
              <label className="block text-[11px] text-[var(--text-secondary)] mb-1">Country *</label>
              <input
                type="text"
                value={data.permanentAddress.country}
                onChange={(e) => updateAddress("country", e.target.value)}
                placeholder="e.g. Pakistan"
                className="w-full p-2 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-xl text-xs text-[var(--text-primary)]"
              />
            </div>
          </div>
        </div>

        {/* Emergency Contact */}
        <div className="pt-3 border-t border-[var(--border-default)] space-y-3">
          <h4 className="font-semibold text-xs text-[var(--text-primary)] flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-emerald-400" />
            Emergency Contact / Next of Kin
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="block text-[11px] text-[var(--text-secondary)] mb-1">Full Name *</label>
              <input
                type="text"
                value={data.emergencyContact.name}
                onChange={(e) => updateEmergency("name", e.target.value)}
                placeholder="e.g. Mansoor Ahmad"
                className="w-full p-2 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-xl text-xs text-[var(--text-primary)]"
              />
            </div>
            <div>
              <label className="block text-[11px] text-[var(--text-secondary)] mb-1">Relationship *</label>
              <input
                type="text"
                value={data.emergencyContact.relation}
                onChange={(e) => updateEmergency("relation", e.target.value)}
                placeholder="e.g. Father, Mother, Guardian"
                className="w-full p-2 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-xl text-xs text-[var(--text-primary)]"
              />
            </div>
            <div>
              <label className="block text-[11px] text-[var(--text-secondary)] mb-1">Contact Phone *</label>
              <input
                type="tel"
                value={data.emergencyContact.phone}
                onChange={(e) => updateEmergency("phone", e.target.value)}
                placeholder="+92 300 0000000"
                className="w-full p-2 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-xl text-xs text-[var(--text-primary)]"
              />
            </div>
            <div>
              <label className="block text-[11px] text-[var(--text-secondary)] mb-1">Email Address *</label>
              <input
                type="email"
                value={data.emergencyContact.email}
                onChange={(e) => updateEmergency("email", e.target.value)}
                placeholder="guardian@example.com"
                className="w-full p-2 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-xl text-xs text-[var(--text-primary)]"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
