import React, { useState } from "react";
import { 
  Plus, 
  ShieldAlert, 
  Search, 
  Activity, 
  Clock, 
  BookOpen, 
  CheckCircle, 
  AlertOctagon,
  Award,
  Inbox
} from "lucide-react";
import { Incident, User, UserRole } from "../types";

interface IncidentsProps {
  incidents: Incident[];
  currentUser: User;
  onLogIncident: (incidentData: any) => Promise<void>;
  onResolveIncident: (id: string, resolutionData: any) => Promise<void>;
}

export default function Incidents({ 
  incidents, 
  currentUser, 
  onLogIncident, 
  onResolveIncident 
}: IncidentsProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(incidents[0]?.id || null);

  // Modals & forms
  const [showLogModal, setShowLogModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newSeverity, setNewSeverity] = useState<"Critical" | "High" | "Medium">("Medium");
  const [newDowntime, setNewDowntime] = useState("");

  // Resolution states
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [rootCauseInput, setRootCauseInput] = useState("");
  const [correctiveInput, setCorrectiveInput] = useState("");
  const [lessonsInput, setLessonsInput] = useState("");

  const selectedIncident = incidents.find(i => i.id === selectedIncidentId);

  const filteredIncidents = incidents.filter(i => {
    return i.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
           i.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
           i.description.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const getSeverityStyle = (sev: "Critical" | "High" | "Medium") => {
    switch (sev) {
      case "Critical": return "bg-red-950/40 text-red-400 border border-red-800/80";
      case "High": return "bg-orange-950/40 text-orange-400 border border-orange-800/80";
      case "Medium": return "bg-amber-955/40 text-amber-500 border border-amber-800/85";
      default: return "bg-slate-900 text-slate-400";
    }
  };

  const handleLogSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDesc.trim()) {
      alert("Specify incident parameters.");
      return;
    }
    await onLogIncident({
      title: newTitle,
      description: newDesc,
      severity: newSeverity,
      downtimeMinutes: Number(newDowntime || 0),
      loggedBy: currentUser.name,
      loggedById: currentUser.id,
      loggedByRole: currentUser.role
    });

    setNewTitle("");
    setNewDesc("");
    setNewDowntime("");
    setShowLogModal(false);
  };

  const handleResolveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIncidentId || !rootCauseInput.trim()) {
      alert("Please include root cause diagnostics.");
      return;
    }
    await onResolveIncident(selectedIncidentId, {
      rootCause: rootCauseInput,
      correctiveAction: correctiveInput,
      lessonsLearned: lessonsInput,
      resolverId: currentUser.id,
      resolverName: currentUser.name,
      resolverRole: currentUser.role
    });

    setRootCauseInput("");
    setCorrectiveInput("");
    setLessonsInput("");
    setShowResolveModal(false);
  };

  return (
    <div className="h-[calc(100vh-100px)] flex flex-col md:flex-row gap-6" id="incidents-tab">
      
      {/* Left Column: Outage and incident ledger list */}
      <div className="w-full md:w-80 flex flex-col h-full bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shrink-0">
        <div className="p-4 border-b border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-white text-xs font-bold uppercase tracking-wider">Outage logs ({filteredIncidents.length})</h3>
            
            {currentUser.role !== UserRole.STAFF && (
              <button
                onClick={() => setShowLogModal(true)}
                className="bg-red-600 hover:bg-red-700 text-white p-1.5 rounded-lg flex items-center justify-center cursor-pointer transition-colors"
                title="Log Critical System Incident"
                id="btn-trigger-incident-log-modal"
              >
                <Plus size={15} />
              </button>
            )}
          </div>

          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 text-slate-500" size={13} />
            <input
              type="text"
              placeholder="Search outages, cause, root..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-[11px] bg-slate-900 border border-slate-800 rounded-lg pl-8 pr-32 py-2 text-slate-200 focus:outline-none focus:border-amber-500"
              id="incident-search"
            />
          </div>
        </div>

        {/* Scroll list */}
        <div className="flex-grow overflow-y-auto divide-y divide-slate-900 scrollbar-thin">
          {filteredIncidents.length > 0 ? (
            filteredIncidents.map(i => {
              const isSel = i.id === selectedIncidentId;
              return (
                <div
                  key={i.id}
                  onClick={() => setSelectedIncidentId(i.id)}
                  className={`p-3.5 cursor-pointer text-left transition-all ${isSel ? 'bg-slate-900 border-l-4 border-red-500' : 'hover:bg-slate-900/40'}`}
                  id={`incident-item-${i.id}`}
                >
                  <div className="flex items-center justify-between gap-1.5 mb-1.5">
                    <span className="text-[10px] font-mono font-bold text-slate-500">{i.id}</span>
                    <span className={`text-[8px] font-bold px-1.5 rounded uppercase tracking-wider ${getSeverityStyle(i.severity)}`}>
                      {i.severity}
                    </span>
                  </div>

                  <h4 className="text-xs font-semibold text-white truncate">{i.title}</h4>
                  
                  <div className="flex items-center justify-between text-[10px] text-slate-500 mt-2">
                    <span className="flex items-center gap-1">
                      <Clock size={10} className="text-red-400" />
                      {i.downtimeMinutes} mins downtime
                    </span>
                    <span className={`text-[8px] font-bold font-mono py-0.5 px-1 rounded uppercase ${
                      i.status === 'Resolved' ? 'bg-emerald-950/40 text-emerald-400' : 'text-amber-500 bg-slate-900 border border-slate-800'
                    }`}>
                      {i.status}
                    </span>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-8 text-center text-slate-500 text-xs text-balance">
              No outages recorded. Click "+" to file critical network downtime events.
            </div>
          )}
        </div>
      </div>

      {/* Right Column: Outage root cause analysis detail display */}
      <div className="flex-grow bg-slate-950 border border-slate-800 rounded-xl flex flex-col h-full overflow-hidden">
        {selectedIncident ? (
          <div className="p-6 flex flex-col h-full space-y-4 text-left overflow-y-auto scrollbar-thin">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono font-bold text-slate-550">{selectedIncident.id}</span>
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${getSeverityStyle(selectedIncident.severity)}`}>
                    {selectedIncident.severity} OUTAGE
                  </span>
                </div>
                <h2 className="text-base font-bold text-white tracking-tight">{selectedIncident.title}</h2>
              </div>

              {selectedIncident.status !== 'Resolved' && currentUser.role !== UserRole.STAFF && (
                <button
                  onClick={() => setShowResolveModal(true)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2 px-4 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer self-start sm:self-auto shadow"
                  id="btn-resolve-incident"
                >
                  <CheckCircle size={14} />
                  <span>Log Root Cause &amp; Resolve</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 p-4 bg-slate-930 rounded-lg border border-slate-850 text-xs">
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-semibold block">Incident Logging Date</span>
                <span className="text-slate-205 font-mono">
                  {new Date(selectedIncident.loggedAt).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-semibold block font-sans">Business Downtime</span>
                <span className="text-red-400 font-bold font-mono flex items-center gap-1 mt-0.5">
                  <Clock size={12} />
                  {selectedIncident.downtimeMinutes} minutes
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-semibold block">Logged By Specialist</span>
                <span className="text-slate-205">{selectedIncident.loggedBy}</span>
              </div>
            </div>

            {/* Core fault specifications */}
            <div className="space-y-1">
              <span className="text-[10px] text-slate-500 uppercase font-bold block mb-1">Incident Event Log details</span>
              <p className="text-slate-200 text-xs bg-slate-900 border border-slate-850 rounded-xl p-4 leading-normal max-w-none">
                {selectedIncident.description}
              </p>
            </div>

            {/* Root cause analysis folders display */}
            {selectedIncident.status === "Resolved" ? (
              <div className="space-y-4 pt-4 border-t border-slate-900" id="resolution-details-box">
                <div className="flex items-center gap-1.5 border-b border-slate-900 pb-1.5 text-[#C4A052]">
                  <Activity size={14} />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Root Cause Diagnostics Report</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-slate-930 p-4 rounded-xl border border-slate-850 space-y-1.5">
                    <span className="text-[9px] text-red-400 font-bold uppercase tracking-wider block">1. Diagnosed Root Cause:</span>
                    <p className="text-slate-300 text-xs leading-normal">{selectedIncident.rootCause}</p>
                  </div>

                  <div className="bg-slate-930 p-4 rounded-xl border border-slate-850 space-y-1.5">
                    <span className="text-[9px] text-emerald-400 font-bold uppercase tracking-wider block">2. Implemented Corrective Actions:</span>
                    <p className="text-slate-300 text-xs leading-normal">{selectedIncident.correctiveAction}</p>
                  </div>
                </div>

                <div className="p-4 bg-blue-950/15 border border-blue-900/60 rounded-xl space-y-1 flex gap-3 text-xs leading-normal font-sans">
                  <span className="p-2 bg-blue-950/30 text-blue-400 rounded-lg shrink-0 self-start">
                    <Award size={16} />
                  </span>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">3. Lessons Learned Archive Details:</span>
                    <p className="text-slate-300 mt-1">{selectedIncident.lessonsLearned}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-6 bg-slate-930/60 border border-slate-850 rounded-xl flex flex-col justify-center items-center text-center text-slate-500 max-w-md mx-auto">
                <AlertOctagon size={28} className="text-amber-500 mb-2 animate-bounce" />
                <h4 className="font-bold text-slate-400 text-xs">UNDER ACTIVE INVESTIGATION</h4>
                <p className="text-[10px] text-slate-400 mt-1 leading-normal">
                  Our network specialists are investigating tracer logs on this downtime trace. Corrective logs should be submitted once service sync returns green.
                </p>
              </div>
            )}

          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center p-8 text-center text-slate-500">
            <Inbox size={40} className="text-slate-700 mb-2" />
            <p className="text-xs">No outage incident record selected. Choose an incident from the side menu list.</p>
          </div>
        )}
      </div>

      {/* DISASTER LOG MODAL */}
      {showLogModal && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
          <div className="bg-slate-950 border border-slate-800 rounded-xl w-full max-w-md overflow-hidden text-left shadow-2xl animate-fade-in">
            <div className="p-5 border-b border-slate-850 bg-red-950/20 text-red-400 text-xs font-bold uppercase tracking-widest flex items-center gap-1.5">
              <ShieldAlert size={14} className="text-red-500" />
              Log Critical Network / Security Outage
            </div>

            <form onSubmit={handleLogSubmit} className="p-5 space-y-4" id="log-outage-form">
              <div>
                <label className="block text-xs text-slate-350 mb-1">Disaster Title / Outline</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Prime server rack Power outage SRV-002"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full text-xs bg-slate-900 border border-slate-810 rounded px-2.5 py-2 text-slate-200 focus:outline-none focus:border-red-500"
                  id="new-incident-title"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-350 mb-1">Outage Impact details</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Specify systems offline, departments blocked, and initial error logs..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full text-xs bg-slate-900 border border-slate-810 rounded p-3 text-slate-205 focus:outline-none focus:border-red-500"
                  id="new-incident-desc"
                ></textarea>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-350 mb-1">Downtime Duration (Mins)</label>
                  <input
                    type="number"
                    placeholder="e.g., 15"
                    value={newDowntime}
                    onChange={(e) => setNewDowntime(e.target.value)}
                    className="w-full text-xs bg-slate-900 border border-slate-805 rounded px-2 py-1.5 text-slate-201 font-mono font-bold"
                    id="new-incident-downtime"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-350 mb-1">Severity Rating</label>
                  <select
                    value={newSeverity}
                    onChange={(e) => setNewSeverity(e.target.value as any)}
                    className="w-full text-xs bg-slate-900 border border-slate-805 rounded px-2 py-2 text-slate-101"
                    id="new-incident-severity"
                  >
                    <option value="Critical">Critical Severity</option>
                    <option value="High">High Severity</option>
                    <option value="Medium">Medium Severity</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-850">
                <button
                  type="button"
                  onClick={() => setShowLogModal(false)}
                  className="px-4 py-2 text-slate-400 hover:bg-slate-900 text-xs font-semibold rounded cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded cursor-pointer"
                  id="btn-incident-save"
                >
                  Deploy Incident Outage
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RESOLUTION INVESTIGATION DIALOG */}
      {showResolveModal && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
          <div className="bg-slate-950 border border-slate-800 rounded-xl w-full max-w-lg overflow-hidden text-left shadow-2xl animate-fade-in">
            <div className="p-4 border-b border-slate-850 bg-slate-900/60 font-bold text-white text-xs uppercase tracking-wider flex items-center gap-2">
              <BookOpen size={14} className="text-emerald-500" />
              Write Incident Root Cause Analysis Resolution File
            </div>

            <form onSubmit={handleResolveSubmit} className="p-5 space-y-4" id="resolve-incident-form">
              <div>
                <label className="block text-xs text-slate-300 font-semibold mb-1.5">1. Root Cause diagnostics (How and why it failed)</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Specify physical fiber breakages, server cluster memory leaks, or switch packet storms..."
                  value={rootCauseInput}
                  onChange={(e) => setRootCauseInput(e.target.value)}
                  className="w-full text-xs bg-slate-900 border border-slate-800 rounded-lg p-3 text-slate-200 focus:outline-none focus:border-amber-500"
                  id="incident-root-cause"
                ></textarea>
              </div>

              <div>
                <label className="block text-xs text-slate-300 font-semibold mb-1.5">2. Corrective Action Plan (How we patched it permanently)</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Upgrade software levels, apply load balancing thresholds, schedule vendor battery changes..."
                  value={correctiveInput}
                  onChange={(e) => setCorrectiveInput(e.target.value)}
                  className="w-full text-xs bg-slate-900 border border-slate-800 rounded-lg p-3 text-slate-200 focus:outline-none focus:border-amber-500"
                  id="incident-corrective"
                ></textarea>
              </div>

              <div>
                <label className="block text-xs text-slate-300 font-semibold mb-1.5">3. Lessons Learned (How to secure operations going forward)</label>
                <textarea
                  rows={3}
                  required
                  placeholder="What can the IT support desk or administrators change in operational routine..."
                  value={lessonsInput}
                  onChange={(e) => setLessonsInput(e.target.value)}
                  className="w-full text-xs bg-slate-900 border border-slate-800 rounded-lg p-3 text-slate-200 focus:outline-none focus:border-amber-500"
                  id="incident-lessons-learned"
                ></textarea>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-850">
                <button
                  type="button"
                  onClick={() => setShowResolveModal(false)}
                  className="px-4 py-2 text-slate-400 hover:bg-slate-900 text-xs font-semibold rounded cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded cursor-pointer"
                  id="btn-resolve-save"
                >
                  Write Diagnostics &amp; Resolve Access
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
