import React, { useState } from "react";
import { 
  Plus, 
  Calendar, 
  CheckCircle, 
  AlertTriangle, 
  Sparkles, 
  CheckSquare, 
  Clock, 
  Activity,
  Award,
  BookOpen
} from "lucide-react";
import { MaintenanceRecord, Asset, User, UserRole } from "../types";

interface MaintenanceProps {
  records: MaintenanceRecord[];
  assets: Asset[];
  currentUser: User;
  onCompleteMaintenance: (id: string, notes: string) => Promise<void>;
  onScheduleMaintenance: (pmData: any) => Promise<void>;
  onUpdateChecklist: (id: string, checklist: any[]) => Promise<void>;
}

export default function Maintenance({ 
  records, 
  assets, 
  currentUser, 
  onCompleteMaintenance, 
  onScheduleMaintenance,
  onUpdateChecklist
}: MaintenanceProps) {
  // Navigation & modals
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(records[0]?.id || null);

  // Form states
  const [pmTitle, setPmTitle] = useState("");
  const [pmDesc, setPmDesc] = useState("");
  const [pmInterval, setPmInterval] = useState<"Monthly" | "Quarterly" | "Annual">("Monthly");
  const [pmOfficer, setPmOfficer] = useState("Samuel Awodele");
  const [pmDate, setPmDate] = useState("");
  const [pmChecklistTexts, setPmChecklistTexts] = useState<string>("");

  // Complete notes
  const [completeNotes, setCompleteNotes] = useState("");
  const [showCompleteModal, setShowCompleteModal] = useState(false);

  // AI Predictive Maintenance Simulator State
  const [selectedPredictiveAsset, setSelectedPredictiveAsset] = useState<string>(assets[0]?.id || "");
  const [isAiPredictiveLoading, setIsAiPredictiveLoading] = useState(false);
  const [aiPredictiveResult, setAiPredictiveResult] = useState<{
    failureRiskIndex: number;
    urgentLevel: string;
    recommendation: string;
  } | null>(null);

  const selectedRecord = records.find(r => r.id === selectedRecordId);

  // Run predictive recommends
  const triggerPredictiveCareModel = async () => {
    const assetObj = assets.find(a => a.id === selectedPredictiveAsset);
    if (!assetObj) {
      alert("Please register assets first.");
      return;
    }
    // Calculate simulated parameters
    const purchaseTime = new Date(assetObj.purchaseDate).getTime();
    const ageDays = Math.floor((Date.now() - purchaseTime) / (3600000 * 24));

    setIsAiPredictiveLoading(true);
    setAiPredictiveResult(null);

    try {
      const response = await fetch("/api/assets/ai-preventive-recommendation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: assetObj.id,
          assetName: assetObj.name,
          category: assetObj.category,
          healthStatus: assetObj.healthStatus,
          ageDays,
          serviceHistoryCount: assetObj.serviceHistory.length
        })
      });
      const data = await response.json();
      if (response.ok) {
        setAiPredictiveResult(data);
      } else {
        // Fallback simulation advice
        setAiPredictiveResult({
          failureRiskIndex: assetObj.healthStatus === 'Critical' ? 88 : assetObj.healthStatus === 'Degraded' ? 58 : 12,
          urgentLevel: assetObj.healthStatus === 'Critical' ? 'Immediate' : assetObj.healthStatus === 'Degraded' ? 'High' : 'Low',
          recommendation: "[Fallback Algorithm] Active diagnostics suggest routine cleaning and updating secondary firmware levels."
        });
      }
    } catch (e) {
      console.error(e);
      setAiPredictiveResult({
        failureRiskIndex: 40,
        urgentLevel: "Medium",
        recommendation: "[API Timeout Fallback] Monitor thermal performance metrics on peak trading days."
      });
    } finally {
      setIsAiPredictiveLoading(false);
    }
  };

  const handleCheckboxToggle = async (recordId: string, itemId: string, currentVal: boolean) => {
    const record = records.find(r => r.id === recordId);
    if (!record) return;

    const updatedChecklist = record.checklist.map(item => {
      if (item.id === itemId) {
        return { ...item, completed: !currentVal };
      }
      return item;
    });

    await onUpdateChecklist(recordId, updatedChecklist);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pmTitle.trim() || !pmDesc.trim() || !pmDate) {
      alert("Please fill standard properties.");
      return;
    }

    const items = pmChecklistTexts
      .split("\n")
      .map(t => t.trim())
      .filter(t => t.length > 0);

    await onScheduleMaintenance({
      title: pmTitle,
      description: pmDesc,
      scheduleType: pmInterval,
      assignedTo: pmOfficer,
      nextScheduledDate: pmDate,
      checklistItems: items.length > 0 ? items : ["Standard operational diagnostic visual audit", "Check cable security and heat vents"]
    });

    setPmTitle("");
    setPmDesc("");
    setPmChecklistTexts("");
    setShowScheduleModal(false);
  };

  const handleCompleteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecordId) return;
    await onCompleteMaintenance(selectedRecordId, completeNotes);
    setCompleteNotes("");
    setShowCompleteModal(false);
  };

  return (
    <div className="space-y-6" id="maintenance-tab">
      
      {/* Top action layout */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Calendar className="text-[#C4A052]" size={22} />
            Preventive Maintenance Care Planner
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Conduct cyclic hardware checkups, log maintenance audits, and compute dynamic asset health warnings.
          </p>
        </div>

        {currentUser.role !== UserRole.STAFF && (
          <button
            onClick={() => setShowScheduleModal(true)}
            className="bg-[#C4A052] hover:bg-amber-600 text-slate-950 text-xs font-bold py-2.5 px-4 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer self-start md:self-auto shadow"
            id="btn-schedule-care"
          >
            <Plus size={15} />
            Schedule Preventive Service
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Column 1: Asset Predictive recommendations (System Optimizer Card) */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* AI Optimizer recommendation panel card */}
          <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles size={18} className="text-purple-400" />
              <h2 className="text-slate-200 font-bold text-sm">AI Predictive Operations</h2>
            </div>
            
            <p className="text-[11px] text-slate-400leading-relaxed">
              Leverage Gemini's modeling to query asset indicators, purchase records, and heat parameters for predictive risk indices.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-slate-400 text-[10px] uppercase font-bold mb-1.5">Focus Asset</label>
                <select
                  value={selectedPredictiveAsset}
                  onChange={(e) => setSelectedPredictiveAsset(e.target.value)}
                  className="w-full text-xs bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200 focus:outline-none"
                  id="predictive-asset-selector"
                >
                  {assets.map(a => (
                    <option key={a.id} value={a.id}>{a.name} ({a.tag})</option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                onClick={triggerPredictiveCareModel}
                disabled={isAiPredictiveLoading || assets.length === 0}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold py-2 rounded-lg flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 transition-colors"
                id="btn-predictive-care"
              >
                {isAiPredictiveLoading ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Computing AI Analytics...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={14} />
                    <span>Run Failure Risk Test</span>
                  </>
                )}
              </button>
            </div>

            {/* AI result feedback */}
            {aiPredictiveResult && (
              <div className="pt-4 border-t border-slate-800 space-y-3 text-left animate-fade-in" id="ai-predictive-box">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-500 uppercase font-bold">Failure Risk index:</span>
                  <span className={`text-[11px] font-bold font-mono px-2 py-0.5 rounded ${
                    aiPredictiveResult.failureRiskIndex > 70 ? 'bg-red-950/40 text-red-400' :
                    aiPredictiveResult.failureRiskIndex > 40 ? 'bg-amber-955/40 text-amber-500' :
                    'bg-emerald-950/40 text-emerald-400'
                  }`}>
                    {aiPredictiveResult.failureRiskIndex}%
                  </span>
                </div>

                {/* Progress bar scale */}
                <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                  <div 
                    className={`h-full rounded-full ${
                      aiPredictiveResult.failureRiskIndex > 70 ? 'bg-red-500' :
                      aiPredictiveResult.failureRiskIndex > 40 ? 'bg-amber-500' :
                      'bg-emerald-400'
                    }`}
                    style={{ width: `${aiPredictiveResult.failureRiskIndex}%` }}
                  ></div>
                </div>

                <div className="space-y-1">
                  <span className="text-[9px] text-slate-500 uppercase font-bold flex items-center gap-1">
                    <Activity size={10} className="text-purple-400" />
                    Urgency Level Assessment:
                  </span>
                  <p className="text-white text-xs font-bold uppercase tracking-wider">{aiPredictiveResult.urgentLevel}</p>
                </div>

                <div className="p-3 bg-slate-900 rounded border border-purple-950 text-xs text-slate-300 leading-normal block">
                  <span className="font-bold text-[#C4A052] block mb-1">Preventive Advice:</span>
                  <div className="text-[10px] leading-relaxed block">{aiPredictiveResult.recommendation}</div>
                </div>
              </div>
            )}
          </div>

          {/* Simple troubleshooting standard list box */}
          <div className="bg-slate-950 p-5 rounded-xl border border-slate-800">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <Award size={14} className="text-amber-500" />
              Standard Compliance Guidelines
            </h3>
            <div className="space-y-2 text-[11px] text-slate-400">
              <p className="border-l-2 border-[#C4A052] pl-2">Servers must have cooling diagnostics run quarterly.</p>
              <p className="border-l-2 border-[#C4A052] pl-2">Printers are cleaned monthly on high volume desk rows.</p>
              <p className="border-l-2 border-[#C4A052] pl-2">APC Towers must show cyclic discharge history once a year.</p>
            </div>
          </div>

        </div>

        {/* Column 2 & 3: Scheduled items and detail viewer logs */}
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-12 gap-4">
          
          {/* Scheduled items matrix index */}
          <div className="sm:col-span-5 bg-slate-950 border border-slate-800 rounded-xl overflow-hidden flex flex-col min-h-[300px]">
            <div className="p-4 border-b border-slate-800 bg-slate-900/35">
              <h3 className="text-slate-300 font-bold text-xs uppercase tracking-wider">Scheduled Tasks Lists</h3>
            </div>

            <div className="divide-y divide-slate-900 overflow-y-auto flex-1 scrollbar-thin">
              {records.map(r => {
                const isSel = r.id === selectedRecordId;
                const percentDone = r.checklist.length > 0 
                  ? Math.round((r.checklist.filter(c => c.completed).length / r.checklist.length) * 100)
                  : 0;
                return (
                  <div
                    key={r.id}
                    onClick={() => setSelectedRecordId(r.id)}
                    className={`p-3.5 cursor-pointer transition-all text-left ${isSel ? 'bg-slate-900 border-l-4 border-amber-500' : 'hover:bg-slate-900/40'}`}
                    id={`pm-item-${r.id}`}
                  >
                    <div className="flex justify-between items-center gap-2 mb-1.5">
                      <span className="text-[10px] font-mono text-slate-500">{r.id}</span>
                      <span className={`text-[8px] font-bold px-1.5 rounded uppercase tracking-widest ${
                        r.status === 'Completed' ? 'bg-emerald-950/40 text-emerald-400' : 'bg-slate-900 text-amber-500 border border-slate-800'
                      }`}>
                        {r.status}
                      </span>
                    </div>

                    <h4 className="text-xs font-semibold text-white truncate">{r.title}</h4>
                    <p className="text-[10px] text-slate-400 mt-1">Interval: <strong className="text-amber-500">{r.scheduleType}</strong></p>

                    {/* Progress check list indicator */}
                    <div className="mt-3 flex items-center justify-between text-[10px] text-slate-500">
                      <span>Tasks: {r.checklist.filter(c => c.completed).length}/{r.checklist.length}</span>
                      <span>{percentDone}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Core checkbox tasks validator & completion trigger */}
          <div className="sm:col-span-7 bg-slate-950 border border-slate-800 rounded-xl overflow-hidden flex flex-col">
            {selectedRecord ? (
              <div className="p-6 flex flex-col h-full text-left space-y-4">
                
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-bold">{selectedRecord.scheduleType} Maintenance Care</span>
                    <h2 className="text-base font-bold text-white mt-1">{selectedRecord.title}</h2>
                    <p className="text-[11px] text-slate-400 mt-1">{selectedRecord.description}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 p-3 bg-slate-900 border border-slate-850 rounded-lg text-xs">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-bold block">Assigned Support Desk</span>
                    <span className="text-slate-300 font-medium">{selectedRecord.assignedTo}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-bold block">Next Target Scheduled Date</span>
                    <span className="text-[#C4A052] font-semibold">{selectedRecord.nextScheduledDate}</span>
                  </div>
                </div>

                {/* Checklist checkbox tasks */}
                <div className="space-y-3 flex-1" id="checklist-tasks-pane">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Operations Checklist Items</span>
                  <div className="space-y-1.5 max-h-[180px] overflow-y-auto pr-2 scrollbar-thin">
                    {selectedRecord.checklist.map((item) => (
                      <div 
                        key={item.id} 
                        className={`flex items-start gap-3 p-2.5 rounded border transition-colors ${
                          item.completed 
                            ? 'bg-slate-900/60 border-slate-850 text-slate-400' 
                            : 'bg-slate-900 border-slate-800 text-slate-200'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={item.completed}
                          disabled={selectedRecord.status === 'Completed' || currentUser.role === UserRole.STAFF}
                          onChange={() => handleCheckboxToggle(selectedRecord.id, item.id, item.completed)}
                          className="mt-0.5 w-4 h-4 text-amber-500 bg-slate-950 border-slate-700 rounded focus:ring-amber-500 cursor-pointer disabled:opacity-50"
                        />
                        <span className="text-xs leading-normal">{item.task}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Completion detail or Action trigger button */}
                {selectedRecord.status === 'Completed' ? (
                  <div className="p-4 bg-emerald-950/20 border border-emerald-800 hover:border-emerald-700 rounded-lg space-y-2 text-xs">
                    <div className="flex items-center gap-2 text-emerald-400 font-bold">
                      <CheckCircle size={14} />
                      <span>Completed Service logged successfully</span>
                    </div>
                    <p className="text-slate-300">Notes: <i>{selectedRecord.notes}</i></p>
                    <div className="flex items-center justify-between text-[10px] text-slate-450 pt-2 border-t border-emerald-900/40">
                      <span>By: {selectedRecord.completedBy}</span>
                      <span>At: {new Date(selectedRecord.completedAt!).toLocaleString()}</span>
                    </div>
                  </div>
                ) : (
                  currentUser.role !== UserRole.STAFF && (
                    <button
                      type="button"
                      onClick={() => setShowCompleteModal(true)}
                      disabled={selectedRecord.checklist.some(it => !it.completed)}
                      className="w-full bg-[#C4A052] hover:bg-amber-600 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 font-bold py-2.5 rounded-lg text-xs transition-colors cursor-pointer text-center"
                      id="btn-complete-pm-submit"
                    >
                      {selectedRecord.checklist.some(it => !it.completed) 
                        ? "Verify All Checklist Items to Enable Completion Report" 
                        : "Verify & Submit Completion Service Log"}
                    </button>
                  )
                )}

              </div>
            ) : (
              <div className="p-8 text-center text-slate-500 flex-1 flex flex-col justify-center items-center">
                <BookOpen size={40} className="text-slate-700 mb-2" />
                <p className="text-xs">Select a scheduled care record to inspect verification checklists.</p>
              </div>
            )}
          </div>

        </div>

      </div>

      {/* SCHEDULE PM MODAL */}
      {showScheduleModal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-slate-950 border border-slate-800 rounded-xl w-full max-w-md overflow-hidden text-left shadow-2xl animate-fade-in">
            <div className="p-5 border-b border-slate-850 bg-slate-900/60 flex items-center justify-between">
              <h3 className="text-white text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                <Calendar size={14} className="text-amber-500" />
                New Scheduled Maintenance Care
              </h3>
              <button onClick={() => setShowScheduleModal(false)} className="text-slate-500 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-5 space-y-4" id="create-pm-form">
              <div>
                <label className="block text-xs text-slate-350 font-semibold mb-1">Service Plan Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., APC Tower Emergency Cyclic Load testing"
                  value={pmTitle}
                  onChange={(e) => setPmTitle(e.target.value)}
                  className="w-full text-xs bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-slate-205 focus:outline-none focus:border-amber-500"
                  id="new-pm-title"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-350 font-semibold mb-1">Operational Directive / Goal</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Goals & equipment tags..."
                  value={pmDesc}
                  onChange={(e) => setPmDesc(e.target.value)}
                  className="w-full text-xs bg-slate-900 border border-slate-800 rounded-lg p-3 text-slate-205 focus:outline-none focus:border-amber-500"
                  id="new-pm-desc"
                ></textarea>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-350 font-semibold mb-1">Cyclic Interval</label>
                  <select
                    value={pmInterval}
                    onChange={(e) => setPmInterval(e.target.value as any)}
                    className="w-full text-xs bg-slate-900 border border-slate-805 rounded-lg px-2 py-2 text-slate-105"
                  >
                    <option value="Monthly">Monthly Cycle</option>
                    <option value="Quarterly">Quarterly Cycle</option>
                    <option value="Annual">Annual Cycle</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-350 font-semibold mb-1">Target Start Date</label>
                  <input
                    type="date"
                    required
                    value={pmDate}
                    onChange={(e) => setPmDate(e.target.value)}
                    className="w-full text-xs bg-slate-900 border border-slate-805 rounded-lg px-2 py-1.5 text-slate-105"
                    id="new-pm-date"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-350 font-semibold mb-1">Checkpoint Tasks (One item per line)</label>
                <textarea
                  rows={4}
                  placeholder="e.g. Verify voltage load limits&#10;Inward vacuum heat blowers&#10;Check backup transfer switch"
                  value={pmChecklistTexts}
                  onChange={(e) => setPmChecklistTexts(e.target.value)}
                  className="w-full text-xs bg-slate-900 border border-slate-800 rounded-lg p-3 text-slate-200 font-mono focus:outline-none focus:border-amber-500"
                  id="new-pm-checklist-text"
                ></textarea>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-850">
                <button
                  type="button"
                  onClick={() => setShowScheduleModal(false)}
                  className="px-4 py-2 rounded text-slate-400 hover:bg-slate-900 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#C4A052] hover:bg-amber-600 text-slate-950 font-bold rounded text-xs cursor-pointer"
                  id="btn-pm-save"
                >
                  Schedule Service
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* COMPLETE SERVICE DIALOG */}
      {showCompleteModal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-slate-950 border border-slate-800 rounded-xl w-full max-w-sm overflow-hidden text-left shadow-2xl animate-fade-in">
            <div className="p-4 border-b border-slate-850 bg-slate-900/60 font-bold text-white text-xs uppercase tracking-wider">
              Submit Service Completion Form
            </div>

            <form onSubmit={handleCompleteSubmit} className="p-5 space-y-4" id="complete-care-form">
              <div>
                <label className="block text-xs text-slate-300 font-semibold mb-1.5">Troubleshooting / Compliance Remarks</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Specify system values checked, parts cleansed, and state configurations verified..."
                  value={completeNotes}
                  onChange={(e) => setCompleteNotes(e.target.value)}
                  className="w-full text-xs bg-slate-900 border border-slate-800 rounded-lg p-3 text-slate-200 focus:outline-none focus:border-amber-500"
                  id="complete-pm-notes"
                ></textarea>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowCompleteModal(false)}
                  className="px-4 py-2 text-slate-400 hover:bg-slate-900 text-xs font-semibold rounded cursor-pointer"
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded cursor-pointer"
                  id="btn-complete-pm-submit-confirm"
                >
                  Sign &amp; Complete Service
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
