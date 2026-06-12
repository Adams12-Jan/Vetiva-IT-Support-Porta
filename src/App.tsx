import React, { useState, useEffect } from "react";
import Login from "./components/Login";
import Sidebar from "./components/Sidebar";
import Dashboard from "./components/Dashboard";
import Tickets from "./components/Tickets";
import Maintenance from "./components/Maintenance";
import Assets from "./components/Assets";
import Incidents from "./components/Incidents";
import KnowledgeBase from "./components/KnowledgeBase";
import Reports from "./components/Reports";
import AdminPanel from "./components/AdminPanel";
import { 
  User, 
  Ticket, 
  MaintenanceRecord, 
  Asset, 
  Incident, 
  KbArticle, 
  AuditLog, 
  TicketStatus,
  UserRole
} from "./types";
import { AppWindow, Loader2 } from "lucide-react";
import {
  FALLBACK_USERS,
  FALLBACK_TICKETS,
  FALLBACK_MAINTENANCE,
  FALLBACK_ASSETS,
  FALLBACK_INCIDENTS,
  FALLBACK_ARTICLES,
  FALLBACK_AUDIT_LOGS,
  FALLBACK_SLA
} from "./fallbackData";

const getInitialState = <T,>(key: string, fallback: T): T => {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : fallback;
  } catch {
    return fallback;
  }
};

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<string>("dashboard");

  // State elements (with pre-populated client fallbacks for static hosting like Vercel)
  const [tickets, setTickets] = useState<Ticket[]>(() => getInitialState("vetiva_tickets", FALLBACK_TICKETS));
  const [maintenanceRecords, setMaintenanceRecords] = useState<MaintenanceRecord[]>(() => getInitialState("vetiva_maintenance", FALLBACK_MAINTENANCE));
  const [assets, setAssets] = useState<Asset[]>(() => getInitialState("vetiva_assets", FALLBACK_ASSETS));
  const [incidents, setIncidents] = useState<Incident[]>(() => getInitialState("vetiva_incidents", FALLBACK_INCIDENTS));
  const [articles, setArticles] = useState<KbArticle[]>(() => getInitialState("vetiva_articles", FALLBACK_ARTICLES));
  const [users, setUsers] = useState<User[]>(() => getInitialState("vetiva_users", FALLBACK_USERS));
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => getInitialState("vetiva_audit_logs", FALLBACK_AUDIT_LOGS));
  const [slaSettings, setSlaSettings] = useState<any>(() => getInitialState("vetiva_sla", FALLBACK_SLA));

  // Loading indicator states
  const [isDataLoading, setIsDataLoading] = useState(false);

  // Read whole operational state from express API
  const fetchAllData = async () => {
    setIsDataLoading(true);
    try {
      const endpoints = [
        "/api/tickets",
        "/api/maintenance",
        "/api/assets",
        "/api/incidents",
        "/api/kb",
        "/api/users",
        "/api/audit-logs",
        "/api/sla"
      ];
      
      const responses = await Promise.all(endpoints.map(ep => fetch(ep)));
      const data = await Promise.all(responses.map(res => res.json()));

      setTickets(data[0]);
      setMaintenanceRecords(data[1]);
      setAssets(data[2]);
      setIncidents(data[3]);
      setArticles(data[4]);
      setUsers(data[5]);
      setAuditLogs(data[6]);
      if (data[7]) {
        setSlaSettings(data[7]);
      }

      // Sync down to persistent local storage for seamless offline continuation
      try {
        localStorage.setItem("vetiva_tickets", JSON.stringify(data[0]));
        localStorage.setItem("vetiva_maintenance", JSON.stringify(data[1]));
        localStorage.setItem("vetiva_assets", JSON.stringify(data[2]));
        localStorage.setItem("vetiva_incidents", JSON.stringify(data[3]));
        localStorage.setItem("vetiva_articles", JSON.stringify(data[4]));
        localStorage.setItem("vetiva_users", JSON.stringify(data[5]));
        localStorage.setItem("vetiva_audit_logs", JSON.stringify(data[6]));
        if (data[7]) {
          localStorage.setItem("vetiva_sla", JSON.stringify(data[7]));
        }
      } catch (stoErr) {
        console.warn("Could not save directory logs cache offline:", stoErr);
      }
    } catch (e) {
      console.warn("Direct live link offline. Using local device state fallback context.", e);
    } finally {
      setIsDataLoading(false);
    }
  };

  // Load users directory on mount for authentication
  useEffect(() => {
    fetch("/api/users")
      .then(res => res.json())
      .then(data => {
        setUsers(data);
        try {
          localStorage.setItem("vetiva_users", JSON.stringify(data));
        } catch {}
      })
      .catch(err => console.warn("Executing under offline browser routing:", err));
  }, []);

  // Sync state data on LoginSuccess
  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    fetchAllData();
  };

  // Callback implementations
  const handleCreateTicket = async (ticketData: any) => {
    let succeeded = false;
    try {
      const response = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(ticketData)
      });
      if (response.ok) {
        succeeded = true;
        await fetchAllData();
      }
    } catch (err) {
      console.warn("Client fallback trigger activated", err);
    }

    if (!succeeded) {
      const newTicket: Ticket = {
        id: `TKT-${Math.floor(1000 + Math.random() * 9000)}`,
        title: ticketData.title,
        description: ticketData.description,
        category: ticketData.category,
        priority: ticketData.priority,
        status: TicketStatus.OPEN,
        requesterId: currentUser?.id || "u-guest",
        requesterName: currentUser?.name || "Guest User",
        requesterDept: currentUser?.department || "General",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        slaDueHours: ticketData.priority === "Critical" ? 2 : ticketData.priority === "High" ? 8 : ticketData.priority === "Medium" ? 24 : 72,
        slaDueTime: new Date(Date.now() + 3600000 * 4).toISOString(),
        slaStatus: "Ongoing",
        comments: []
      };
      const updated = [newTicket, ...tickets];
      setTickets(updated);
      localStorage.setItem("vetiva_tickets", JSON.stringify(updated));

      const newLog: AuditLog = {
        id: `AUD-${Math.floor(100 + Math.random() * 900)}`,
        userId: currentUser?.id || "u-guest",
        userName: currentUser?.name || "Guest User",
        userRole: currentUser?.role || "Staff",
        action: "Create Ticket",
        details: `Created new offline support ticket ${newTicket.id}: ${newTicket.title}`,
        timestamp: new Date().toISOString()
      };
      const updatedLogs = [newLog, ...auditLogs];
      setAuditLogs(updatedLogs);
      localStorage.setItem("vetiva_audit_logs", JSON.stringify(updatedLogs));
    }
  };

  const handleUpdateTicketStatus = async (id: string, status: TicketStatus) => {
    let succeeded = false;
    try {
      const response = await fetch(`/api/tickets/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });
      if (response.ok) {
        succeeded = true;
        await fetchAllData();
      }
    } catch (err) {
      console.warn("REST offline fallback enabled", err);
    }
    if (!succeeded) {
      const updated = tickets.map(t => t.id === id ? { ...t, status, updatedAt: new Date().toISOString() } : t);
      setTickets(updated);
      localStorage.setItem("vetiva_tickets", JSON.stringify(updated));
    }
  };

  const handleAssignTicket = async (id: string, assignedToId: string, assignedToName: string) => {
    let succeeded = false;
    try {
      const response = await fetch(`/api/tickets/${id}/assign`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignedToId, assignedToName })
      });
      if (response.ok) {
        succeeded = true;
        await fetchAllData();
      }
    } catch (err) {
      console.warn("REST offline fallback enabled", err);
    }
    if (!succeeded) {
      const updated = tickets.map(t => t.id === id ? { ...t, assignedToId, assignedToName, status: TicketStatus.IN_PROGRESS, updatedAt: new Date().toISOString() } : t);
      setTickets(updated);
      localStorage.setItem("vetiva_tickets", JSON.stringify(updated));
    }
  };

  const handleAddComment = async (id: string, message: string) => {
    if (!currentUser) return;
    let succeeded = false;
    try {
      const response = await fetch(`/api/tickets/${id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          senderId: currentUser.id,
          senderName: currentUser.name,
          senderRole: currentUser.role,
          message
        })
      });
      if (response.ok) {
        succeeded = true;
        await fetchAllData();
      }
    } catch (err) {
      console.warn("REST offline fallback enabled", err);
    }
    if (!succeeded) {
      const updated = tickets.map(t => {
        if (t.id === id) {
          const comments = t.comments || [];
          return {
            ...t,
            comments: [
              ...comments,
              {
                id: `c-${Date.now()}`,
                senderName: currentUser.name,
                senderRole: currentUser.role,
                message,
                createdAt: new Date().toISOString()
              }
            ],
            updatedAt: new Date().toISOString()
          };
        }
        return t;
      });
      setTickets(updated);
      localStorage.setItem("vetiva_tickets", JSON.stringify(updated));
    }
  };

  const handleCompleteMaintenance = async (id: string, notes: string) => {
    if (!currentUser) return;
    let succeeded = false;
    try {
      const response = await fetch(`/api/maintenance/${id}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes, completedBy: currentUser.name })
      });
      if (response.ok) {
        succeeded = true;
        await fetchAllData();
      }
    } catch (err) {
      console.warn("REST offline fallback enabled", err);
    }
    if (!succeeded) {
      const updated = maintenanceRecords.map(m => m.id === id ? {
        ...m,
        status: "Completed",
        notes,
        completedBy: currentUser.name,
        completedAt: new Date().toISOString()
      } : m);
      setMaintenanceRecords(updated);
      localStorage.setItem("vetiva_maintenance", JSON.stringify(updated));
    }
  };

  const handleScheduleMaintenance = async (pmData: any) => {
    let succeeded = false;
    try {
      const response = await fetch("/api/maintenance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pmData)
      });
      if (response.ok) {
        succeeded = true;
        await fetchAllData();
      }
    } catch (err) {
      console.warn("REST offline fallback enabled", err);
    }
    if (!succeeded) {
      const newM: MaintenanceRecord = {
        id: `PM-${Math.floor(200 + Math.random() * 800)}`,
        title: pmData.title,
        scheduleType: pmData.scheduleType,
        description: pmData.description,
        status: "Scheduled",
        checklist: (pmData.checklist || []).map((t: string) => ({ id: `tsk-${Math.random()}`, task: t, completed: false })),
        assignedTo: pmData.assignedTo,
        nextScheduledDate: pmData.nextScheduledDate,
        lastCompletedDate: ""
      };
      const updated = [newM, ...maintenanceRecords];
      setMaintenanceRecords(updated);
      localStorage.setItem("vetiva_maintenance", JSON.stringify(updated));
    }
  };

  const handleUpdateChecklist = async (id: string, checklist: any[]) => {
    let succeeded = false;
    try {
      const response = await fetch(`/api/maintenance/${id}/checklist`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ checklist })
      });
      if (response.ok) {
        succeeded = true;
        await fetchAllData();
      }
    } catch (err) {
      console.warn("REST offline fallback enabled", err);
    }
    if (!succeeded) {
      const updated = maintenanceRecords.map(m => m.id === id ? { ...m, checklist } : m);
      setMaintenanceRecords(updated);
      localStorage.setItem("vetiva_maintenance", JSON.stringify(updated));
    }
  };

  const handleRegisterAsset = async (assetData: any) => {
    let succeeded = false;
    try {
      const response = await fetch("/api/assets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(assetData)
      });
      if (response.ok) {
        succeeded = true;
        await fetchAllData();
      }
    } catch (err) {
      console.warn("REST offline fallback enabled", err);
    }
    if (!succeeded) {
      const newAsset: Asset = {
        id: `AST-${Math.floor(300 + Math.random() * 700)}`,
        name: assetData.name,
        tag: assetData.tag,
        category: assetData.category,
        purchaseDate: assetData.purchaseDate,
        warrantyExpiry: assetData.warrantyExpiry,
        cost: assetData.cost,
        healthStatus: assetData.healthStatus,
        assignedTo: assetData.assignedTo,
        location: assetData.location,
        lastMaintenanceDate: "",
        serviceHistory: [],
        qrCodeDataUrl: ""
      };
      const updated = [newAsset, ...assets];
      setAssets(updated);
      localStorage.setItem("vetiva_assets", JSON.stringify(updated));
    }
  };

  const handleAddServicalLog = async (id: string, logData: any) => {
    let succeeded = false;
    try {
      const response = await fetch(`/api/assets/${id}/service`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(logData)
      });
      if (response.ok) {
        succeeded = true;
        await fetchAllData();
      }
    } catch (err) {
      console.warn("REST offline fallback enabled", err);
    }
    if (!succeeded) {
      const updated = assets.map(a => {
        if (a.id === id) {
          const serviceHistory = a.serviceHistory || [];
          return {
            ...a,
            serviceHistory: [
              ...serviceHistory,
              {
                id: `h-${Date.now()}`,
                type: logData.type,
                description: logData.description,
                date: logData.date,
                by: logData.by
              }
            ],
            lastMaintenanceDate: logData.date
          };
        }
        return a;
      });
      setAssets(updated);
      localStorage.setItem("vetiva_assets", JSON.stringify(updated));
    }
  };

  const handleLogIncident = async (incidentData: any) => {
    let succeeded = false;
    try {
      const response = await fetch("/api/incidents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(incidentData)
      });
      if (response.ok) {
        succeeded = true;
        await fetchAllData();
      }
    } catch (err) {
      console.warn("REST offline fallback enabled", err);
    }
    if (!succeeded) {
      const newInc: Incident = {
        id: `INC-${Math.floor(400 + Math.random() * 600)}`,
        title: incidentData.title,
        description: incidentData.description,
        severity: incidentData.severity,
        status: "Investigating",
        downtimeMinutes: 0,
        loggedAt: new Date().toISOString(),
        loggedBy: currentUser?.name || "Guest"
      };
      const updated = [newInc, ...incidents];
      setIncidents(updated);
      localStorage.setItem("vetiva_incidents", JSON.stringify(updated));
    }
  };

  const handleResolveIncident = async (id: string, resolutionData: any) => {
    let succeeded = false;
    try {
      const response = await fetch(`/api/incidents/${id}/resolve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(resolutionData)
      });
      if (response.ok) {
        succeeded = true;
        await fetchAllData();
      }
    } catch (err) {
      console.warn("REST offline fallback enabled", err);
    }
    if (!succeeded) {
      const updated = incidents.map(i => i.id === id ? {
        ...i,
        status: "Resolved",
        downtimeMinutes: resolutionData.downtimeMinutes,
        rootCause: resolutionData.rootCause,
        correctiveAction: resolutionData.correctiveAction,
        lessonsLearned: resolutionData.lessonsLearned,
        resolvedAt: new Date().toISOString()
      } : i);
      setIncidents(updated);
      localStorage.setItem("vetiva_incidents", JSON.stringify(updated));
    }
  };

  const handleAddKbArticle = async (articleData: any) => {
    let succeeded = false;
    try {
      const response = await fetch("/api/kb", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(articleData)
      });
      if (response.ok) {
        succeeded = true;
        await fetchAllData();
      }
    } catch (err) {
      console.warn("REST offline fallback enabled", err);
    }
    if (!succeeded) {
      const newArt: KbArticle = {
        id: `KB-${Math.floor(500 + Math.random() * 500)}`,
        title: articleData.title,
        category: articleData.category,
        content: articleData.content,
        views: 1,
        upvotes: 0,
        lastUpdated: new Date().toISOString().split("T")[0],
        author: currentUser?.name || "Guest",
        tags: articleData.tags || []
      };
      const updated = [newArt, ...articles];
      setArticles(updated);
      localStorage.setItem("vetiva_articles", JSON.stringify(updated));
    }
  };

  const handleUpvoteArticle = async (id: string) => {
    let succeeded = false;
    try {
      const response = await fetch(`/api/kb/${id}/upvote`, { method: "POST" });
      if (response.ok) {
        succeeded = true;
        await fetchAllData();
      }
    } catch (err) {
      console.warn("REST offline fallback enabled", err);
    }
    if (!succeeded) {
      const updated = articles.map(a => a.id === id ? { ...a, upvotes: a.upvotes + 1 } : a);
      setArticles(updated);
      localStorage.setItem("vetiva_articles", JSON.stringify(updated));
    }
  };

  const handleViewArticle = async (id: string) => {
    let succeeded = false;
    try {
      const response = await fetch(`/api/kb/${id}/view`, { method: "POST" });
      if (response.ok) {
        succeeded = true;
      }
    } catch (err) {
      console.warn("REST offline fallback enabled", err);
    }
    if (!succeeded) {
      const updated = articles.map(a => a.id === id ? { ...a, views: a.views + 1 } : a);
      setArticles(updated);
      localStorage.setItem("vetiva_articles", JSON.stringify(updated));
    }
  };

  const handleUpdateSlaHours = async (slaData: any) => {
    let succeeded = false;
    try {
      const response = await fetch("/api/sla", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(slaData)
      });
      if (response.ok) {
        succeeded = true;
        await fetchAllData();
      }
    } catch (err) {
      console.warn("REST offline fallback enabled", err);
    }
    if (!succeeded) {
      setSlaSettings(slaData);
      localStorage.setItem("vetiva_sla", JSON.stringify(slaData));
    }
  };

  const handleUpdateUserRole = async (userId: string, targetRole: UserRole) => {
    let succeeded = false;
    try {
      const response = await fetch(`/api/users/${userId}/role`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: targetRole })
      });
      if (response.ok) {
        succeeded = true;
        await fetchAllData();
      }
    } catch (err) {
      console.warn("REST offline fallback enabled", err);
    }
    if (!succeeded) {
      const updated = users.map(u => u.id === userId ? { ...u, role: targetRole } : u);
      setUsers(updated);
      localStorage.setItem("vetiva_users", JSON.stringify(updated));
      if (currentUser && currentUser.id === userId) {
        setCurrentUser({ ...currentUser, role: targetRole });
      }
    }
  };

  // Safe logout handler
  const handleUserLogout = () => {
    setCurrentUser(null);
    setActiveTab("dashboard");
    setTickets([]);
  };

  // Mount components based on navigation tab selection
  const renderSelectedTabContent = () => {
    if (!currentUser) return null;

    if (isDataLoading && tickets.length === 0) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center p-12 text-slate-400">
          <Loader2 className="w-8 h-8 text-[#C4A052] animate-spin mb-4" />
          <span className="text-xs font-mono">Synchronizing Vetiva Infrastructure Logs...</span>
        </div>
      );
    }

    switch (activeTab) {
      case "dashboard":
        return (
          <Dashboard 
            tickets={tickets} 
            maintenanceRecords={maintenanceRecords} 
            assets={assets} 
            incidents={incidents}
            currentUser={currentUser}
          />
        );
      case "tickets":
        return (
          <Tickets 
            tickets={tickets} 
            currentUser={currentUser} 
            users={users}
            onCreateTicket={handleCreateTicket} 
            onUpdateStatus={handleUpdateTicketStatus}
            onAssignTicket={handleAssignTicket}
            onAddComment={handleAddComment}
          />
        );
      case "maintenance":
        return (
          <Maintenance 
            records={maintenanceRecords} 
            assets={assets} 
            currentUser={currentUser}
            onCompleteMaintenance={handleCompleteMaintenance}
            onScheduleMaintenance={handleScheduleMaintenance}
            onUpdateChecklist={handleUpdateChecklist}
          />
        );
      case "assets":
        return (
          <Assets 
            assets={assets} 
            currentUser={currentUser} 
            onRegisterAsset={handleRegisterAsset}
            onAddServicalLog={handleAddServicalLog}
          />
        );
      case "incidents":
        return (
          <Incidents 
            incidents={incidents} 
            currentUser={currentUser} 
            onLogIncident={handleLogIncident} 
            onResolveIncident={handleResolveIncident}
          />
        );
      case "kb":
        return (
          <KnowledgeBase 
            articles={articles} 
            currentUser={currentUser} 
            onAddArticle={handleAddKbArticle}
            onUpvoteArticle={handleUpvoteArticle}
            onViewArticle={handleViewArticle}
          />
        );
      case "reports":
        return (
          <Reports 
            state={{ tickets, maintenanceRecords, assets, incidents }} 
          />
        );
      case "admin":
        return (
          <AdminPanel 
            users={users} 
            auditLogs={auditLogs} 
            slaSettings={slaSettings}
            onUpdateSlaHours={handleUpdateSlaHours}
            onUpdateUserRole={handleUpdateUserRole}
          />
        );
      default:
        return (
          <div className="p-8 text-slate-400">Section placeholder</div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans selection:bg-[#C4A052] selection:text-slate-950">
      {!currentUser ? (
        <Login onLoginSuccess={handleLoginSuccess} users={users} />
      ) : (
        <div className="flex flex-col md:flex-row min-h-screen">
          
          {/* Main system navigation sidebar */}
          <Sidebar 
            currentUser={currentUser} 
            activeTab={activeTab} 
            setActiveTab={setActiveTab} 
            onLogout={handleUserLogout} 
          />

          {/* Unified dynamic content canvas window */}
          <main className="flex-grow p-4 md:p-8 overflow-x-hidden" id="applet-viewport">
            {renderSelectedTabContent()}
          </main>

        </div>
      )}
    </div>
  );
}
