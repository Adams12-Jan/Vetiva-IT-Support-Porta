import React, { useState } from "react";
import { 
  Plus, 
  Search, 
  MessageSquare, 
  Sparkles, 
  UserPlus, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  Paperclip,
  UploadCloud,
  ChevronRight,
  User,
  LayoutGrid
} from "lucide-react";
import { 
  Ticket, 
  TicketCategory, 
  PriorityLevel, 
  TicketStatus, 
  UserRole, 
  User as UserType 
} from "../types";

interface TicketsProps {
  tickets: Ticket[];
  currentUser: UserType;
  users: UserType[];
  onCreateTicket: (ticketData: any) => Promise<void>;
  onUpdateStatus: (id: string, status: TicketStatus) => Promise<void>;
  onAssignTicket: (id: string, assignedToId: string, assignedToName: string) => Promise<void>;
  onAddComment: (id: string, commentMessage: string) => Promise<void>;
}

export default function Tickets({ 
  tickets, 
  currentUser, 
  users, 
  onCreateTicket, 
  onUpdateStatus, 
  onAssignTicket, 
  onAddComment 
}: TicketsProps) {
  // Navigation & filter states
  const [filterStatus, setFilterStatus] = useState<string>("All");
  const [filterPriority, setFilterPriority] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(tickets[0]?.id || null);
  
  // Custom ticket dialog form states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newCategory, setNewCategory] = useState<TicketCategory>(TicketCategory.SOFTWARE);
  const [newPriority, setNewPriority] = useState<PriorityLevel>(PriorityLevel.MEDIUM);
  const [newDept, setNewDept] = useState("Finance");
  
  // Custom attachment files
  const [attachedFiles, setAttachedFiles] = useState<string[]>([]);
  const [dragActive, setDragActive] = useState(false);
  
  // AI assist states
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiDiagnosticLog, setAiDiagnosticLog] = useState("");

  // Comment state
  const [commentInput, setCommentInput] = useState("");

  const supportStaff = users.filter(u => u.role === UserRole.IT_SUPPORT || u.role === UserRole.IT_ADMIN || u.role === UserRole.SYS_ADMIN);

  const selectedTicket = tickets.find(t => t.id === selectedTicketId);

  // Filter tickets
  const filteredTickets = tickets.filter(t => {
    const matchesStatus = filterStatus === "All" || t.status === filterStatus;
    const matchesPriority = filterPriority === "All" || t.priority === filterPriority;
    const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          t.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          t.requesterName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesPriority && matchesSearch;
  });

  const getPriorityBadgeStyle = (prio: PriorityLevel) => {
    switch (prio) {
      case PriorityLevel.CRITICAL: return "bg-red-950/40 text-red-400 border border-red-800/80";
      case PriorityLevel.HIGH: return "bg-orange-950/40 text-orange-400 border border-orange-850";
      case PriorityLevel.MEDIUM: return "bg-amber-955/40 text-amber-500 border border-amber-800/80";
      case PriorityLevel.LOW: return "bg-emerald-950/40 text-emerald-400 border border-emerald-800/80";
      default: return "bg-slate-900 text-slate-400 border border-slate-800";
    }
  };

  const getStatusBadgeStyle = (status: TicketStatus) => {
    switch (status) {
      case TicketStatus.OPEN: return "bg-blue-950/40 text-blue-400 border border-blue-800/60";
      case TicketStatus.ASSIGNED: return "bg-indigo-950/40 text-indigo-400 border border-indigo-800/50";
      case TicketStatus.IN_PROGRESS: return "bg-amber-950/40 text-amber-500 border border-amber-800/60";
      case TicketStatus.AWAITING_RESPONSE: return "bg-purple-950/40 text-purple-400 border border-purple-800/60";
      case TicketStatus.RESOLVED: return "bg-emerald-950/40 text-emerald-405 border border-emerald-800/65";
      case TicketStatus.CLOSED: return "bg-slate-900 text-slate-400 border border-slate-800";
      default: return "bg-slate-900 text-slate-400 border border-slate-800";
    }
  };

  // Run AI trigger classifier
  const triggerAiClassification = async () => {
    if (!newDescription.trim()) {
      alert("Provide a description of the IT support request so that the AI can analyze details.");
      return;
    }
    setIsAiLoading(true);
    setAiDiagnosticLog("");
    try {
      const response = await fetch("/api/tickets/ai-classify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTitle, description: newDescription })
      });
      const data = await response.json();
      if (response.ok) {
        setNewCategory(data.category);
        setNewPriority(data.priority);
        setAiDiagnosticLog(data.aiInsights || "Classification generated successfully.");
      } else {
        setAiDiagnosticLog("Failed to link AI core models. Default analyzer applied.");
      }
    } catch (e: any) {
      console.error(e);
      setAiDiagnosticLog("Server-side connection issue. Falling back to local keyword analyzer definitions.");
    } finally {
      setIsAiLoading(false);
    }
  };

  // Drag over control
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  // Drag drop files trigger
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const fileNames = Array.from(e.dataTransfer.files).map((f: any) => f.name);
      setAttachedFiles(prev => [...prev, ...fileNames]);
    }
  };

  const handleManualFileSelection = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const fileNames = Array.from(e.target.files).map((f: any) => f.name);
      setAttachedFiles(prev => [...prev, ...fileNames]);
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDescription.trim()) {
      alert("Please complete standard fields.");
      return;
    }
    await onCreateTicket({
      title: newTitle,
      description: newDescription,
      category: newCategory,
      priority: newPriority,
      requesterId: currentUser.id,
      requesterName: currentUser.name,
      requesterDept: newDept
    });
    
    // Clear modals
    setNewTitle("");
    setNewDescription("");
    setAttachedFiles([]);
    setAiDiagnosticLog("");
    setShowCreateModal(false);
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentInput.trim() || !selectedTicketId) return;
    await onAddComment(selectedTicketId, commentInput);
    setCommentInput("");
  };

  return (
    <div className="h-[calc(100vh-100px)] flex flex-col md:flex-row gap-6" id="tickets-tab">
      
      {/* Left panel: tickets master column list */}
      <div className="w-full md:w-88 flex flex-col h-full bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shrink-0">
        
        {/* Ticket controls panel */}
        <div className="p-4 border-b border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-white text-xs font-bold uppercase tracking-wider">Active Tickets ({filteredTickets.length})</h3>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-[#C4A052] hover:bg-amber-600 text-slate-950 p-1.5 rounded-lg flex items-center justify-center cursor-pointer transition-colors"
              title="Create Support Ticket"
              id="btn-trigger-ticket-modal"
            >
              <Plus size={15} />
            </button>
          </div>

          {/* Search box filters */}
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 text-slate-500" size={13} />
            <input
              type="text"
              placeholder="Search ID, author, or issue..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-[11px] bg-slate-900 border border-slate-800 rounded-lg pl-8 pr-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500"
              id="ticket-search"
            />
          </div>

          {/* Double level state filters select */}
          <div className="grid grid-cols-2 gap-2 text-[10px]">
            <div>
              <label className="text-slate-500 block mb-1">Status</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-slate-300 focus:outline-none"
                id="filter-status"
              >
                <option value="All">All statuses</option>
                {Object.values(TicketStatus).map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="text-slate-500 block mb-1">Priority</label>
              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-slate-300 focus:outline-none"
                id="filter-priority"
              >
                <option value="All">All Priorities</option>
                {Object.values(PriorityLevel).map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Dynamic Ticket Scroll Container */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-900 scrollbar-thin">
          {filteredTickets.length > 0 ? (
            filteredTickets.map((t) => {
              const isSel = t.id === selectedTicketId;
              const openCommentsCount = t.comments.length;
              return (
                <div
                  key={t.id}
                  onClick={() => setSelectedTicketId(t.id)}
                  className={`p-3.5 cursor-pointer text-left transition-all ${
                    isSel 
                      ? "bg-slate-900 border-l-4 border-amber-500" 
                      : "hover:bg-slate-900/60"
                  }`}
                  id={`ticket-item-${t.id}`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="text-[10px] font-mono font-bold text-slate-500">{t.id}</span>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded font-medium ${getPriorityBadgeStyle(t.priority)}`}>
                      {t.priority}
                    </span>
                  </div>

                  <h4 className={`text-xs font-semibold leading-snug line-clamp-2 ${isSel ? "text-white" : "text-slate-200"}`}>
                    {t.title}
                  </h4>

                  <div className="flex items-center justify-between text-[10px] text-slate-500 mt-2.5">
                    <span className="truncate max-w-[120px]">{t.requesterName}</span>
                    <span className={`text-[8px] font-bold px-1 rounded uppercase tracking-wider ${getStatusBadgeStyle(t.status)}`}>
                      {t.status}
                    </span>
                  </div>

                  {openCommentsCount > 0 && (
                    <div className="flex items-center gap-1 text-[9px] text-[#C4A052] font-semibold mt-1.5">
                      <MessageSquare size={10} />
                      <span>{openCommentsCount} check comments</span>
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="p-8 text-center text-slate-500 text-xs">
              No matching tickets found. Click "+" to create a support request.
            </div>
          )}
        </div>
      </div>

      {/* Right panel: ticket detail viewer pane */}
      <div className="flex-grow bg-slate-950 border border-slate-800 rounded-xl flex flex-col h-full overflow-hidden">
        {selectedTicket ? (
          <div className="flex flex-col h-full divide-y divide-slate-800">
            
            {/* Detail top pane */}
            <div className="p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1 text-left">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono font-bold text-slate-500">{selectedTicket.id}</span>
                    <span className="text-xs text-[#C4A052] font-semibold">{selectedTicket.category}</span>
                  </div>
                  <h2 className="text-base font-bold text-white tracking-tight">{selectedTicket.title}</h2>
                </div>

                {/* State action switchers */}
                <div className="flex items-center gap-2" id="ticket-actions-bar">
                  <label className="text-[11px] text-slate-400">Status:</label>
                  <select
                    value={selectedTicket.status}
                    onChange={(e) => onUpdateStatus(selectedTicket.id, e.target.value as TicketStatus)}
                    className="bg-slate-900 border border-slate-805 rounded px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                    id="status-updater"
                  >
                    {Object.values(TicketStatus).map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              {/* SLA compliance bar details */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-slate-930 rounded-lg border border-slate-850 text-xs">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-semibold">Requester</span>
                  <p className="text-slate-200 font-medium mt-0.5">{selectedTicket.requesterName}</p>
                  <p className="text-[10px] text-slate-400">{selectedTicket.requesterDept}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-semibold">SLA Resolution Target</span>
                  <div className="flex items-center gap-1 mt-0.5 text-slate-300">
                    <Clock size={12} className="text-amber-500" />
                    <span>{selectedTicket.slaDueHours} hours</span>
                  </div>
                  <p className="text-[9px] text-slate-400 font-mono mt-0.5">
                    {new Date(selectedTicket.slaDueTime).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-semibold">Assigned Specialist</span>
                  {selectedTicket.assignedToName ? (
                    <p className="text-slate-200 font-medium mt-0.5">{selectedTicket.assignedToName}</p>
                  ) : (
                    <div className="mt-1 flex items-center gap-1.5" id="assignee-select-container">
                      <select
                        onChange={(e) => {
                          const target = supportStaff.find(s => s.id === e.target.value);
                          if (target) onAssignTicket(selectedTicket.id, target.id, target.name);
                        }}
                        defaultValue=""
                        className="bg-slate-900 border border-slate-800 rounded px-1.5 py-0.5 text-[10px] text-[#C4A052] focus:outline-none"
                      >
                        <option value="" disabled>Assign Officer...</option>
                        {supportStaff.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </select>
                    </div>
                  )}
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-semibold">SLA Status Code</span>
                  <div className="mt-1">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded font-mono ${
                      selectedTicket.slaStatus === 'Met' ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-800' :
                      selectedTicket.slaStatus === 'Breached' ? 'bg-red-950/40 text-red-400 border border-red-800' :
                      'bg-slate-900 text-amber-500 border border-slate-800'
                    }`}>
                      {selectedTicket.slaStatus}
                    </span>
                  </div>
                </div>
              </div>

              {/* AI diagnostic insights badge */}
              {selectedTicket.aiInsights && (
                <div className="bg-amber-955/10 border border-amber-900/60 rounded-lg p-3.5 text-xs text-slate-300" id="ai-insight-pane">
                  <div className="flex items-center gap-2 mb-1.5">
                    <Sparkles size={14} className="text-amber-500" />
                    <span className="font-bold text-amber-400 text-[11px] uppercase tracking-wider">AI Support Diagnostics Insights</span>
                  </div>
                  <p className="leading-relaxed leading-normal text-[11px] block">{selectedTicket.aiInsights}</p>
                </div>
              )}

              {/* Core description block */}
              <div className="text-left">
                <span className="text-[10px] text-slate-500 uppercase font-semibold block mb-1.5">Description details</span>
                <p className="text-slate-200 text-xs leading-relaxed max-w-none whitespace-pre-line bg-slate-900 p-4 rounded-xl border border-slate-850">
                  {selectedTicket.description}
                </p>
              </div>

            </div>

            {/* Comment details timeline and entry log */}
            <div className="flex-grow flex flex-col min-h-[180px] overflow-hidden">
              <div className="px-6 py-3 bg-slate-900/40 border-b border-slate-800 flex items-center justify-between">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Activity timeline chat logs</span>
                <span className="text-[10px] text-slate-500 font-mono">Real-time status tracking audit</span>
              </div>

              {/* Comment timeline scroll */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4 max-h-[220px] scrollbar-thin">
                {selectedTicket.comments.length > 0 ? (
                  selectedTicket.comments.map((c) => (
                    <div key={c.id} className="text-xs text-left">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-slate-200">{c.senderName}</span>
                        <span className="text-[9px] bg-slate-900 text-[#C4A052] font-mono border border-slate-800 px-1 rounded uppercase">
                          {c.senderRole}
                        </span>
                        <span className="text-[9px] text-slate-500 font-mono ml-auto">
                          {new Date(c.createdAt).toLocaleString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div className="bg-slate-900 p-3 rounded-lg border border-slate-850 text-slate-300">
                        {c.message}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-slate-500 py-6">
                    No activity logs recorded. Assign a specialist and comment to log progress.
                  </div>
                )}
              </div>

              {/* Quick file message submit form */}
              <form onSubmit={handleCommentSubmit} className="p-4 border-t border-slate-800 bg-slate-950 flex gap-2">
                <input
                  type="text"
                  placeholder="Type troubleshooting notes or request response..."
                  value={commentInput}
                  onChange={(e) => setCommentInput(e.target.value)}
                  className="flex-1 text-xs bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500"
                  id="comment-input"
                />
                <button
                  type="submit"
                  className="bg-[#C4A052] hover:bg-amber-600 text-slate-950 font-semibold px-4 rounded-lg text-xs transition-colors cursor-pointer"
                  id="comment-submit"
                >
                  Post Action
                </button>
              </form>
            </div>

          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center p-8 text-center text-slate-500">
            <LayoutGrid size={40} className="text-slate-700 mb-3" />
            <h4 className="font-semibold text-slate-400 text-sm">No ticket selected</h4>
            <p className="text-xs text-slate-500 mt-1 max-w-[240px]">Select any active support ticket item from the left columns list to view timeline resolution audits.</p>
          </div>
        )}
      </div>

      {/* MODAL: CREATE SUPPORT TICKET */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-slate-950 border border-slate-800 rounded-xl w-full max-w-2xl overflow-hidden shadow-2xl animate-fade-in text-left">
            
            {/* Modal header */}
            <div className="p-6 border-b border-slate-800 bg-slate-900/60 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles size={18} className="text-[#C4A052]" />
                <h3 className="text-white text-sm font-bold">New IT Support Ticket File</h3>
              </div>
              <button 
                onClick={() => setShowCreateModal(false)}
                className="text-slate-550 hover:text-white cursor-pointer transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-6 space-y-4" id="create-ticket-form">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 text-xs font-semibold mb-2">Ticket Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Bloomberg desk terminal feed lag on Floor 2"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full text-xs bg-slate-900 border border-slate-800 rounded-lg px-3.5 py-2.5 text-slate-200 focus:outline-none focus:border-amber-500"
                    id="new-ticket-title"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 text-xs font-semibold mb-2">Requesting Department</label>
                  <select
                    value={newDept}
                    onChange={(e) => setNewDept(e.target.value)}
                    className="w-full text-xs bg-slate-900 border border-slate-800 rounded-lg px-3.5 py-2.5 text-slate-100 focus:outline-none focus:border-amber-500"
                  >
                    {["Finance", "Operations", "Compliance", "Investment Banking", "Asset Management", "Human Resources", "Administration", "Corporate Services"].map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Detailed description */}
              <div>
                <label className="block text-slate-300 text-xs font-semibold mb-2">Core Fault Description</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Specify absolute hardware tags, error messages, and actions leading to the fault..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full text-xs bg-slate-900 border border-slate-800 rounded-lg p-3.5 text-slate-200 focus:outline-none focus:border-amber-500"
                  id="new-ticket-desc"
                ></textarea>
              </div>

              {/* AI intelligent assist row */}
              <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <span className="text-[11px] font-bold text-amber-500 uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles size={12} />
                      AI Support Specialist Assist
                    </span>
                    <p className="text-[10px] text-slate-400">
                      Instantly categorize requests, verify risk logs, and get recommended SLA thresholds from Gemini server APIs.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={triggerAiClassification}
                    disabled={isAiLoading}
                    className="bg-purple-600 hover:bg-purple-700 text-white text-[11px] font-semibold py-1.5 px-3 rounded-lg flex items-center justify-center gap-1 cursor-pointer transition-all disabled:opacity-50"
                    id="btn-ai-classifier"
                  >
                    {isAiLoading ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Processing with Gemini...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles size={12} />
                        <span>AI Suggest Category &amp; Priority</span>
                      </>
                    )}
                  </button>
                </div>

                {aiDiagnosticLog && (
                  <div className="text-[10px] bg-slate-950 p-3 rounded border border-purple-950 text-slate-300 leading-normal block">
                    <span className="font-semibold text-purple-400 block mb-1">AI Output:</span>
                    {aiDiagnosticLog}
                  </div>
                )}
              </div>

              {/* Dynamic Categories Selection (AI or Manual update) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 text-xs font-semibold mb-2">Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as TicketCategory)}
                    className="w-full text-xs bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none"
                    id="new-ticket-category"
                  >
                    {Object.values(TicketCategory).map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 text-xs font-semibold mb-2">SLA Priority Level</label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as PriorityLevel)}
                    className="w-full text-xs bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none"
                    id="new-ticket-priority"
                  >
                    {Object.values(PriorityLevel).map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>

              {/* Drag-and-drop file upload */}
              <div>
                <label className="block text-slate-350 text-xs font-semibold mb-2">Incident Attachments (Evidence, Screenshots)</label>
                <div
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-xl p-6 text-center select-none cursor-pointer transition-all relative ${
                    dragActive 
                      ? "border-amber-500 bg-amber-500/10 text-slate-200" 
                      : "border-slate-800 hover:border-slate-700 bg-slate-900/40 text-slate-400"
                  }`}
                  id="drag-drop-area"
                >
                  <input
                    type="file"
                    multiple
                    onChange={handleManualFileSelection}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <UploadCloud size={24} className="text-slate-500" />
                    <p className="text-[11px]">
                      Drag and drop system log images, or <span className="text-[#C4A052] font-semibold">browse files</span>
                    </p>
                    <p className="text-[9px] text-slate-500">Supports PDF, PNG, JPG logs up to 10MB.</p>
                  </div>
                </div>

                {/* Display uploaded evidence lists */}
                {attachedFiles.length > 0 && (
                  <div className="mt-3 space-y-1.5" id="attachments-display">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Loaded Log Modules Checklist:</p>
                    {attachedFiles.map((filename, index) => (
                      <div key={index} className="flex items-center justify-between p-2 rounded bg-slate-900 border border-slate-800 text-[10px] text-slate-300">
                        <div className="flex items-center gap-1.5">
                          <Paperclip size={11} className="text-amber-500" />
                          <span className="font-mono truncate max-w-[340px]">{filename}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setAttachedFiles(prev => prev.filter((_, i) => i !== index))}
                          className="text-red-500 font-semibold hover:underline"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Action operations buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-5 py-2.5 rounded-lg text-slate-400 hover:bg-slate-900 transition-colors text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-[#C4A052] hover:bg-amber-600 text-slate-950 font-bold rounded-lg text-xs transition-colors cursor-pointer"
                  id="submit-ticket-btn"
                >
                  Deploy Support Ticket
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
