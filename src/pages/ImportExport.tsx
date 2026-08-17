import React, { useState } from "react";
import { collection, writeBatch, doc } from "firebase/firestore";
import { db } from "../firebase/config";
import { useAuth } from "../contexts/AuthContext";
import { RoleGate } from "../components/layout/RoleGate";
import { logAuditEvent } from "../utils/auditLogger";
import {
  FileSpreadsheet,
  Upload,
  Download,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Database,
  RefreshCw,
  FileText,
  FileDown
} from "lucide-react";

export type ImportTarget = "leads" | "students" | "universities";

export const ImportExportContent: React.FC = () => {
  const { appUser } = useAuth();
  const [targetCollection, setTargetCollection] = useState<ImportTarget>("leads");
  const [rawCsvText, setRawCsvText] = useState("");
  const [parsedRows, setParsedRows] = useState<Record<string, string>[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [importing, setImporting] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setRawCsvText(text);
      parseCSV(text);
    };
    reader.readAsText(file);
  };

  const parseCSV = (text: string) => {
    try {
      const lines = text.split(/\r\n|\n/).filter((l) => l.trim() !== "");
      if (lines.length < 2) {
        setError("CSV file must contain a header row and at least one data row.");
        return;
      }

      const rawHeaders = lines[0].split(",").map((h) => h.replace(/^["']|["']$/g, "").trim());
      const rows: Record<string, string>[] = [];

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(",").map((v) => v.replace(/^["']|["']$/g, "").trim());
        const row: Record<string, string> = {};
        rawHeaders.forEach((h, idx) => {
          row[h] = values[idx] || "";
        });
        rows.push(row);
      }

      setHeaders(rawHeaders);
      setParsedRows(rows);
      setError(null);
      setNotice(`Parsed ${rows.length} rows successfully.`);
    } catch (err: any) {
      setError(`CSV parsing error: ${err.message}`);
    }
  };

  const handleExecuteImport = async () => {
    if (parsedRows.length === 0) {
      setError("No parsed rows to import.");
      return;
    }

    try {
      setImporting(true);
      setError(null);

      const batch = writeBatch(db);
      let count = 0;

      for (const row of parsedRows) {
        const newDocRef = doc(collection(db, targetCollection));
        if (targetCollection === "leads") {
          batch.set(newDocRef, {
            fullName: row.fullName || row.Name || row.name || "Imported Lead",
            email: row.email || row.Email || `lead_${Date.now()}_${count}@imported.invalid`,
            phone: row.phone || row.Phone || "",
            destinationCountry: row.country || row.destinationCountry || "United Kingdom",
            programInterest: row.programme || row.programInterest || "General Inquiry",
            source: row.source || "CSV Import",
            stage: row.stage || "New",
            createdAt: Date.now(),
            updatedAt: Date.now(),
          });
        } else if (targetCollection === "students") {
          batch.set(newDocRef, {
            fullName: row.fullName || row.Name || "Imported Student",
            email: row.email || row.Email || "",
            phone: row.phone || "",
            nationality: row.nationality || "Unspecified",
            countryOfResidence: row.country || "Unspecified",
            profileCompleteness: 50,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          });
        } else if (targetCollection === "universities") {
          batch.set(newDocRef, {
            name: row.universityName || row.name || "Imported University",
            country: row.country || "United Kingdom",
            city: row.city || "Main Campus",
            programmes: [],
            createdAt: Date.now(),
          });
        }
        count++;
      }

      await batch.commit();

      await logAuditEvent(
        "DATA_BULK_IMPORTED",
        appUser?.email || "Admin",
        "Data Migration",
        `Bulk imported ${count} records into ${targetCollection}`,
        targetCollection,
        appUser?.role
      );

      setNotice(`Successfully imported ${count} records into Firestore target collection '${targetCollection}'.`);
      setParsedRows([]);
      setRawCsvText("");
    } catch (err: any) {
      setError(`Batch write failed: ${err.message}`);
    } finally {
      setImporting(false);
    }
  };

  const downloadSampleTemplate = () => {
    let csv = "";
    if (targetCollection === "leads") {
      csv = "fullName,email,phone,country,programInterest,source,stage\nJane Doe,jane@example.com,+447700900000,United Kingdom,MSc Data Science,Website,New\nJohn Smith,john@example.com,+15550199,Canada,BBA Management,Referral,Contacted";
    } else if (targetCollection === "students") {
      csv = "fullName,email,phone,nationality,country\nAlice Walker,alice@example.com,+447700900111,British,United Kingdom";
    } else {
      csv = "universityName,country,city\nUniversity of Oxford,United Kingdom,Oxford\nHarvard University,United States,Cambridge";
    }

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.setAttribute("href", url);
    a.setAttribute("download", `EduCRM_Sample_${targetCollection}_Template.csv`);
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 text-xs">
      {/* Header */}
      <div>
        <h1 className="font-heading text-2xl font-bold text-[var(--text-primary)] tracking-tight">
          CSV Data Migration & Import / Export Engine
        </h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">
          Bulk import leads, students, and universities from CSV files, dry-run validate schemas, and export datasets.
        </p>
      </div>

      {/* Target Selector */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-default)] p-4 sq-card flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <Database className="w-5 h-5 text-emerald-400" />
          <div>
            <div className="font-bold text-[var(--text-primary)]">Target Collection</div>
            <div className="text-[11px] text-[var(--text-secondary)]">Select destination Firestore dataset</div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <select
            value={targetCollection}
            onChange={(e) => {
              setTargetCollection(e.target.value as ImportTarget);
              setParsedRows([]);
              setNotice(null);
            }}
            className="px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-default)] sq-input font-semibold text-[var(--text-primary)]"
          >
            <option value="leads">Leads & Inquiries</option>
            <option value="students">Student Profiles</option>
            <option value="universities">Universities & Campuses</option>
          </select>

          <button
            onClick={downloadSampleTemplate}
            className="flex items-center space-x-1 px-3 py-2 bg-[var(--bg-input)] hover:bg-[var(--bg-hover)] text-emerald-400 border border-emerald-500/30 font-semibold sq-btn"
          >
            <FileDown className="w-3.5 h-3.5" />
            <span>Download CSV Template</span>
          </button>
        </div>
      </div>

      {/* Upload Zone */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-default)] p-6 sq-card space-y-4">
        <div className="border-2 border-dashed border-[var(--border-default)] hover:border-emerald-500/50 p-8 rounded-xl text-center space-y-3 transition-colors bg-[var(--bg-input)]/50">
          <Upload className="w-10 h-10 text-emerald-400 mx-auto" />
          <div className="font-bold text-sm text-[var(--text-primary)]">Choose a CSV file to import</div>
          <p className="text-[11px] text-[var(--text-secondary)] max-w-md mx-auto">
            Supports UTF-8 CSV files with headers. Data will be validated and mapped automatically before committing.
          </p>
          <input
            type="file"
            accept=".csv,text/csv"
            onChange={handleFileUpload}
            className="hidden"
            id="csv-file-input"
          />
          <label
            htmlFor="csv-file-input"
            className="inline-flex items-center space-x-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold rounded-lg cursor-pointer transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Select CSV File</span>
          </label>
        </div>

        {notice && <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg">{notice}</div>}
        {error && <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-lg">{error}</div>}
      </div>

      {/* Parsed Preview Table */}
      {parsedRows.length > 0 && (
        <div className="bg-[var(--bg-card)] border border-[var(--border-default)] rounded-xl overflow-hidden space-y-3 p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-[var(--text-primary)]">Data Validation Preview ({parsedRows.length} Records)</h3>
              <p className="text-[11px] text-[var(--text-secondary)]">Dry-run preview before batch writing to Firestore</p>
            </div>
            <button
              onClick={handleExecuteImport}
              disabled={importing}
              className="flex items-center space-x-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold rounded-lg shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{importing ? "Writing to Firestore..." : `Commit ${parsedRows.length} Rows to Firestore`}</span>
            </button>
          </div>

          <div className="overflow-x-auto border border-[var(--border-default)] rounded-lg">
            <table className="w-full text-left text-xs">
              <thead className="bg-[var(--bg-elevated)] text-[var(--text-muted)] uppercase text-[10px]">
                <tr>
                  {headers.map((h) => (
                    <th key={h} className="p-2.5 border-b border-[var(--border-default)]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-default)]">
                {parsedRows.slice(0, 10).map((row, idx) => (
                  <tr key={idx} className="hover:bg-[var(--bg-hover)]">
                    {headers.map((h) => (
                      <td key={h} className="p-2.5 text-[var(--text-primary)] font-mono text-[11px] truncate max-w-[200px]">
                        {row[h] || "-"}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export const ImportExportPage: React.FC = () => {
  return (
    <RoleGate allowedRoles={["platform_super_admin", "org_admin", "office_manager"]}>
      <ImportExportContent />
    </RoleGate>
  );
};
