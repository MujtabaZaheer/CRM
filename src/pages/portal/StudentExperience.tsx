import React, { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { AlertCircle, ArrowRight, GraduationCap, MapPin, Search, CheckCircle2 } from "lucide-react";
import { useGlobalData } from "../../contexts/GlobalDataContext";
import { usePortalData } from "../../hooks/usePortalData";
import { Programme, University } from "../../types/university";
import { assessEligibility } from "../../utils/eligibility";

const fallbackImage = "/sample_transcript.jpg";
const money = (value: number, currency: string) => new Intl.NumberFormat(undefined, { style: "currency", currency, maximumFractionDigits: 0 }).format(value);
const programmesFor = (university: University) => university.programmes || [];


const Cover: React.FC<{ university: University; className?: string }> = ({ university, className = "" }) => <img src={university.coverImageUrl || university.logoUrl || fallbackImage} alt={university.coverImageAlt || `${university.name} campus`} loading="lazy" onError={(event) => { event.currentTarget.src = fallbackImage; }} className={`object-cover ${className}`} />;
const EligibilityBadge: React.FC<{ programme: Programme; student: ReturnType<typeof usePortalData>["ownStudent"] }> = ({ programme, student }) => { const result = assessEligibility(student, programme); const style = result.status === "eligible" ? "bg-emerald-50 text-emerald-700" : result.status === "not_eligible" ? "bg-rose-50 text-rose-700" : "bg-amber-50 text-amber-800"; const label = result.status === "eligible" ? "Meets configured requirements" : result.status === "not_eligible" ? "Needs improvement" : "Needs review"; return <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${style}`}>{label}</span>; };

export const StudentDashboard: React.FC = () => {
  const { ownStudent, ownApplications, ownDocuments, ownTasks } = usePortalData();
  const { universities } = useGlobalData();
  const navigate = useNavigate();

  const name = ownStudent?.fullName?.split(" ")[0] || "there";
  const completeness = ownStudent?.profileCompleteness || 0;
  
  // Next Action Logic
  const action = ownApplications.find((app) => app.nextAction) 
    ? { title: "Continue your application", text: ownApplications.find((app) => app.nextAction)?.nextAction || "", href: "/student/applications" } 
    : completeness < 80 
      ? { title: "Complete your academic history", text: "This will help us match you with eligible university programs.", href: "/student/profile" } 
      : ownDocuments.length === 0 
        ? { title: "Upload your passport", text: "Required for your application.", href: "/student/documents" } 
        : { title: "Find Programs", text: "Explore a programme that matches your profile", href: "/student/programs" };
  
  const active = ownApplications.filter((app) => !["Rejected", "Withdrawn", "Enrolled"].includes(app.stage));

  const requiredDocCount = 5; // simplified logic for demo
  const uploadedDocCount = ownDocuments.length;

  return (
    <div className="mx-auto max-w-7xl space-y-7 pb-8 font-sans animate-fade-in">
      
      {/* Header */}
      <header className="rounded-3xl bg-surface border border-subtle px-6 py-8 shadow-sm sm:px-8 relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-emerald-500 tracking-wider">STUDENT ADMISSIONS PORTAL</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-primary">Good morning, {name} 👋</h1>
            <p className="mt-2 text-sm text-secondary">Let's continue your study journey.</p>
          </div>
          <div className="flex items-center gap-3 bg-elevated px-4 py-2.5 rounded-full border border-subtle">
            <span className="text-xs font-bold text-primary">Profile</span>
            <div className="w-24 h-2 bg-input rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${completeness}%` }} />
            </div>
            <span className="text-xs font-bold text-emerald-500">{completeness}%</span>
          </div>
        </div>
      </header>

      <section className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        
        {/* Next Step / Journey Tracker */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-6 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <AlertCircle className="w-24 h-24 text-amber-500" />
            </div>
            <div className="relative z-10 flex gap-4 items-start">
              <div className="p-3 bg-amber-500/20 rounded-xl text-amber-600 dark:text-amber-400">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <p className="font-bold text-primary">Your next step</p>
                <p className="mt-1 font-semibold text-lg text-primary">{action.title}</p>
                <p className="mt-1 text-sm text-secondary">{action.text}</p>
                <button 
                  onClick={() => navigate(action.href)} 
                  className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-amber-950 font-bold text-sm rounded-xl transition-colors"
                >
                  Complete Action <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-surface border border-subtle p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-primary">My Applications</h2>
              <Link to="/student/applications" className="text-sm font-semibold text-emerald-500 hover:underline">View all</Link>
            </div>
            <div className="space-y-3">
              {active.slice(0, 3).map((application) => { 
                const university = universities.find((item) => item.id === application.universityId); 
                return (
                  <Link key={application.id} to={`/student/applications/${application.id}`} className="block overflow-hidden rounded-xl bg-elevated border border-default hover:border-emerald-500/50 transition-colors">
                    <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <Cover university={university || { id: "fallback", name: application.universityName, country: "", city: "", programmes: [], createdAt: 0, updatedAt: 0 }} className="h-12 w-12 rounded-lg" />
                        <div>
                          <p className="font-bold text-primary">{application.universityName}</p>
                          <p className="text-xs text-secondary">{application.programmeName}</p>
                        </div>
                      </div>
                      <div className="flex flex-col sm:items-end">
                        <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                          {application.stage}
                        </span>
                        <p className="mt-1 text-xs text-muted">{application.nextAction || "Waiting for update"}</p>
                      </div>
                    </div>
                  </Link>
                ); 
              })}
              {active.length === 0 && (
                <Empty title="No applications yet" action="Explore Programs" href="/student/programs" />
              )}
            </div>
          </div>
        </div>

        {/* Sidebar Widgets */}
        <div className="space-y-6">
          
          <div className="rounded-2xl bg-surface border border-subtle p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-primary">Documents</h2>
              <span className="text-xs font-bold text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-md">{uploadedDocCount} / {requiredDocCount}</span>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-primary"><CheckCircle2 className="w-4 h-4 text-emerald-500"/> Passport</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-primary"><CheckCircle2 className="w-4 h-4 text-emerald-500"/> Academic Transcript</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-rose-500"><AlertCircle className="w-4 h-4"/> Personal Statement</span>
                <span className="text-xs text-rose-500 font-medium">Missing</span>
              </div>
              <div className="pt-3 border-t border-subtle mt-2">
                <Link to="/student/documents" className="text-sm font-semibold text-emerald-500 hover:underline block text-center">Open Document Vault</Link>
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-surface border border-subtle p-6 shadow-sm">
            <h2 className="font-bold text-primary mb-4">Upcoming Deadlines</h2>
            <div className="space-y-3">
              {ownTasks.filter((task) => task.dueDate).slice(0, 3).map((task) => (
                <div key={task.id} className="flex items-center justify-between border-b border-subtle pb-3 text-sm last:border-0 last:pb-0">
                  <span className="font-medium text-primary">{task.title}</span>
                  <span className="text-xs text-secondary">{task.dueDate}</span>
                </div>
              ))}
              {ownTasks.length === 0 && <p className="text-sm text-muted">No upcoming deadlines.</p>}
            </div>
          </div>

          <div className="rounded-2xl bg-surface border border-subtle p-6 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-elevated border border-default flex items-center justify-center text-primary font-bold">
              SC
            </div>
            <div>
              <p className="text-xs text-secondary uppercase tracking-wider font-semibold">Your Counsellor</p>
              <p className="font-bold text-primary">Sarah Chen</p>
              <Link to="/student/messages" className="text-xs text-emerald-500 font-medium hover:underline">Message Counsellor</Link>
            </div>
          </div>

        </div>
      </section>
    </div>
  );
};

const Empty: React.FC<{ title: string; action: string; href: string }> = ({ title, action, href }) => <div className="rounded-2xl border border-dashed border-subtle bg-elevated p-8 text-center"><GraduationCap className="mx-auto h-8 w-8 text-muted" /><p className="mt-3 font-semibold text-secondary">{title}</p><Link to={href} className="mt-3 inline-block text-sm font-bold text-emerald-500">{action} →</Link></div>;

export const StudentUniversities: React.FC = () => { 
  const { universities } = useGlobalData(); 
  const [search, setSearch] = useState(""); 
  const [selectedCountry, setSelectedCountry] = useState("All");

  const availableCountries = Array.from(new Set(universities.map(u => u.country))).filter(Boolean).sort();

  const filtered = universities.filter((university) => {
    const matchesCountry = selectedCountry === "All" || university.country === selectedCountry;
    if (!matchesCountry) return false;

    if (!search) return true;
    const term = search.toLowerCase();
    return (
      university.name.toLowerCase().includes(term) ||
      university.city?.toLowerCase().includes(term) ||
      university.country?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-8 animate-fade-in">
      <header>
        <p className="text-sm font-semibold text-emerald-500 tracking-wider">DISCOVER</p>
        <h1 className="mt-1 text-3xl font-bold font-heading text-primary">Explore universities</h1>
        <p className="mt-2 text-secondary">Find a university, understand its programmes, and check your fit before applying.</p>
      </header>
      
      <div className="flex flex-col sm:flex-row gap-4 max-w-3xl">
        <label className="relative flex-1">
          <Search className="absolute left-4 top-3.5 h-5 w-5 text-muted" />
          <input 
            value={search} 
            onChange={(event) => setSearch(event.target.value)} 
            placeholder="Search by university, city, or country" 
            className="w-full rounded-xl border border-default bg-input py-3 pl-12 pr-4 text-primary shadow-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" 
          />
        </label>
        
        <select
          value={selectedCountry}
          onChange={(e) => setSelectedCountry(e.target.value)}
          className="w-full sm:w-64 bg-input border border-default rounded-xl p-3 text-primary focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
        >
          <option value="All">All Countries</option>
          {availableCountries.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>
      
      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3 mt-8">
        {filtered.map((university) => (
          <article key={university.id} className="overflow-hidden rounded-2xl bg-surface shadow-sm border border-default hover:border-emerald-500/50 transition-colors flex flex-col">
            <Cover university={university} className="h-44 w-full" />
            <div className="p-5 flex flex-col flex-1">
              <p className="text-xs font-bold uppercase tracking-wider text-emerald-500">{university.country}</p>
              <h2 className="mt-1 text-lg font-bold text-primary leading-tight">{university.name}</h2>
              <p className="mt-2 flex items-center gap-1.5 text-sm text-secondary">
                <MapPin className="h-3.5 w-3.5 text-emerald-500/70" />
                {university.city}
              </p>
              <p className="mt-3 line-clamp-2 text-sm text-muted flex-1">{university.description || "Explore programmes, requirements, intakes, and application deadlines."}</p>
              
              <div className="mt-5 pt-4 border-t border-subtle flex items-center justify-between text-sm">
                <span className="font-semibold text-secondary flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-emerald-500/70" />
                  {programmesFor(university).length} programmes
                </span>
                <Link to={`/student/universities/${university.id}`} className="font-bold text-emerald-500 flex items-center gap-1 hover:text-emerald-400">
                  View <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </article>
        ))}
      </div>
      
      {!filtered.length && <Empty title="No universities match your search" action="Clear search" href="/student/universities" />}
    </div>
  ); 
};

export const StudentUniversityDetail: React.FC = () => { 
  const { universityId } = useParams(); 
  const { universities } = useGlobalData(); 
  const university = universities.find((item) => item.id === universityId); 
  
  if (!university) return <div className="p-8 text-secondary">University not found or is no longer available.</div>; 
  
  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-8 animate-fade-in">
      <div className="overflow-hidden rounded-3xl bg-main border border-default relative">
        <Cover university={university} className="h-64 w-full opacity-60" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#09090b] via-[#09090b]/80 to-transparent pointer-events-none" />
        <div className="-mt-24 relative p-7 z-10">
          <p className="text-sm font-bold tracking-wider text-emerald-400">{university.city}, {university.country}</p>
          <h1 className="mt-1 text-3xl font-bold text-white font-heading">{university.name}</h1>
          <p className="mt-3 max-w-2xl text-zinc-300">{university.description || "Programme and admission details are maintained by the education team."}</p>
          <a href={university.website?.startsWith("http") ? university.website : `https://${university.website}`} target="_blank" rel="noreferrer" className="mt-5 inline-block text-sm font-bold text-emerald-400 hover:text-emerald-300 transition-colors">Official website →</a>
        </div>
      </div>
      <section>
        <h2 className="text-xl font-bold font-heading text-primary">Popular programmes</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {programmesFor(university).map((programme) => <ProgrammeCard key={programme.id} university={university} programme={programme} />)}
        </div>
      </section>
    </div>
  ); 
};

const ProgrammeCard: React.FC<{ university: University; programme: Programme }> = ({ university, programme }) => { 
  const { ownStudent } = usePortalData(); 
  return (
    <article className="rounded-2xl bg-surface p-5 shadow-sm border border-default hover:border-emerald-500/50 transition-colors flex flex-col h-full">
      <div className="flex-1">
        <p className="text-xs font-bold uppercase tracking-wider text-emerald-500">{programme.level}</p>
        <h3 className="mt-1 font-bold text-primary leading-snug">{programme.title}</h3>
        <p className="mt-2 text-sm text-secondary flex flex-wrap gap-x-4 gap-y-1">
          <span>{programme.durationMonths} months</span>
          <span>•</span>
          <span>{money(programme.tuitionFeeAnnual, programme.currency)} / year</span>
        </p>
      </div>
      <div className="mt-5 pt-4 border-t border-subtle flex items-center justify-between">
        <EligibilityBadge programme={programme} student={ownStudent} />
        <Link to={`/student/programs/${university.id}-${programme.id}`} className="text-sm font-bold text-emerald-500 hover:text-emerald-400 flex items-center gap-1">
          View <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </article>
  ); 
};

export const StudentProgrammes: React.FC = () => { 
  const { universities } = useGlobalData(); 
  const [search, setSearch] = useState(""); 
  const [selectedCountry, setSelectedCountry] = useState("All");
  const [selectedLevel, setSelectedLevel] = useState("All");

  const items = useMemo(() => {
    return universities.flatMap((university) => 
      programmesFor(university).map((programme) => ({ university, programme }))
    );
  }, [universities]);

  const availableCountries = Array.from(new Set(items.map(i => i.university.country))).filter(Boolean).sort();
  const availableLevels = Array.from(new Set(items.map(i => i.programme.level))).filter(Boolean).sort();

  const filtered = useMemo(() => {
    return items.filter((item) => {
      const matchesCountry = selectedCountry === "All" || item.university.country === selectedCountry;
      const matchesLevel = selectedLevel === "All" || item.programme.level === selectedLevel;
      if (!matchesCountry || !matchesLevel) return false;

      if (!search) return true;
      const term = search.toLowerCase();
      return (
        item.university.name.toLowerCase().includes(term) ||
        item.programme.title.toLowerCase().includes(term) ||
        item.university.country?.toLowerCase().includes(term) ||
        item.university.city?.toLowerCase().includes(term)
      );
    });
  }, [items, search, selectedCountry, selectedLevel]);

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-8 animate-fade-in">
      <header>
        <p className="text-sm font-semibold text-emerald-500 tracking-wider">DISCOVER</p>
        <h1 className="mt-1 text-3xl font-bold font-heading text-primary">Find a programme</h1>
        <p className="mt-2 text-secondary">Requirements are an indication only. Final admission decisions are made by the university.</p>
      </header>
      
      <div className="flex flex-col md:flex-row gap-4">
        <label className="relative flex-1">
          <Search className="absolute left-4 top-3.5 h-5 w-5 text-muted" />
          <input 
            value={search} 
            onChange={(event) => setSearch(event.target.value)} 
            placeholder="Search programme, university, country, or degree" 
            className="w-full rounded-xl border border-default bg-input py-3 pl-12 pr-4 text-primary shadow-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" 
          />
        </label>
        
        <select
          value={selectedCountry}
          onChange={(e) => setSelectedCountry(e.target.value)}
          className="w-full md:w-48 bg-input border border-default rounded-xl p-3 text-primary focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
        >
          <option value="All">All Countries</option>
          {availableCountries.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        
        <select
          value={selectedLevel}
          onChange={(e) => setSelectedLevel(e.target.value)}
          className="w-full md:w-48 bg-input border border-default rounded-xl p-3 text-primary focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
        >
          <option value="All">All Study Levels</option>
          {availableLevels.map(l => <option key={l} value={l}>{l}</option>)}
        </select>
      </div>

      <div className="grid gap-4 lg:grid-cols-2 mt-8">
        {filtered.map(({ university, programme }) => (
          <ProgrammeCard key={`${university.id}-${programme.id}`} university={university} programme={programme} />
        ))}
      </div>
      
      {!filtered.length && <Empty title="No programmes match your search" action="Clear search" href="/student/programs" />}
    </div>
  ); 
};

export const StudentProgramDetail: React.FC = () => { 
  const { programId } = useParams(); 
  const { universities } = useGlobalData(); 
  const { ownStudent } = usePortalData(); 
  
  const found = universities
    .flatMap((university) => programmesFor(university).map((programme) => ({ university, programme })))
    .find((item) => `${item.university.id}-${item.programme.id}` === programId); 
    
  if (!found) return <div className="p-8 text-secondary">Programme not found.</div>; 
  
  const result = assessEligibility(ownStudent, found.programme); 
  const colorClass = result.status === "eligible" ? "emerald" : result.status === "not_eligible" ? "rose" : "amber"; 
  
  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-8 animate-fade-in">
      <div className="rounded-3xl bg-surface border border-default p-7 shadow-sm">
        <p className="text-sm font-bold text-emerald-500 tracking-wider uppercase">{found.university.name} • {found.university.city}</p>
        <h1 className="mt-2 text-3xl font-bold font-heading text-primary">{found.programme.title}</h1>
        <div className="mt-5 flex flex-wrap gap-3 text-sm text-secondary">
          <span className="bg-elevated border border-subtle px-3 py-1 rounded-full">{found.programme.level}</span>
          <span className="bg-elevated border border-subtle px-3 py-1 rounded-full">{found.programme.durationMonths} months</span>
          <span className="bg-elevated border border-subtle px-3 py-1 rounded-full">{money(found.programme.tuitionFeeAnnual, found.programme.currency)}</span>
          <span className="bg-elevated border border-subtle px-3 py-1 rounded-full">Intakes: {found.programme.intakes.join(", ")}</span>
        </div>
      </div>
      
      <section className={`rounded-2xl border bg-${colorClass}-500/10 border-${colorClass}-500/30 p-6 shadow-sm`}>
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl bg-${colorClass}-500/20 text-${colorClass}-400`}>
            {result.status === "eligible" ? <CheckCircle2 className="w-6 h-6" /> : <AlertCircle className="w-6 h-6" />}
          </div>
          <div>
            <h2 className="text-lg font-bold text-primary font-heading">
              Based on your profile: <span className="capitalize">{result.status.replace("_", " ")}</span>
            </h2>
            <p className="mt-1 text-sm text-secondary">{result.disclaimer}</p>
          </div>
        </div>
        
        <div className="mt-6 space-y-3">
          {result.checks.map((check) => (
            <div key={check.label} className="rounded-xl bg-surface border border-subtle p-4 text-sm shadow-sm flex items-start gap-3">
              <span className={`mt-0.5 font-bold ${check.status === "pass" ? "text-emerald-500" : check.status === "fail" ? "text-rose-500" : "text-amber-500"}`}>
                {check.status === "pass" ? "✓" : check.status === "fail" ? "✕" : "!"}
              </span>
              <div>
                <span className="font-semibold text-primary">{check.label}</span>
                <p className="mt-1 text-secondary">{check.detail}</p>
              </div>
            </div>
          ))}
        </div>
        
        <Link 
          to={`/student/new-application?universityId=${found.university.id}&programmeId=${found.programme.id}`} 
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 px-5 py-3 text-sm font-bold text-white transition-colors"
        >
          Start application <ArrowRight className="w-4 h-4" />
        </Link>
      </section>
    </div>
  ); 
};
