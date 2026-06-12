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

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<string>("dashboard");

  // State elements
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [maintenanceRecords, setMaintenanceRecords] = useState<MaintenanceRecord[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [articles, setArticles] = useState<KbArticle[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [slaSettings, setSlaSettings] = useState<any>({
    criticalHours: 2,
    highHours: 8,
    mediumHours: 24,
    lowHours: 72
  });

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
    } catch (e) {
      console.error("Failed to connect with background Express database controllers.", e);
    } finally {
      setIsDataLoading(false);
    }
  };

  // Load users directory on mount for authentication
  useEffect(() => {
    fetch("/api/users")
      .then(res => res.json())
      .then(data => setUsers(data))
      .catch(err => console.error("Could not fetch domain accounts catalog:", err));
  }, []);

  // Sync state data on LoginSuccess
  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    fetchAllData();
  };

  // Callback implementations
  const handleCreateTicket = async (ticketData: any) => {
    try {
      const response = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(ticketData)
      });
      if (response.ok) {
        await fetchAllData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateTicketStatus = async (id: string, status: TicketStatus) => {
    try {
      const response = await fetch(`/api/tickets/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });
      if (response.ok) {
        await fetchAllData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAssignTicket = async (id: string, assignedToId: string, assignedToName: string) => {
    try {
      const response = await fetch(`/api/tickets/${id}/assign`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignedToId, assignedToName })
      });
      if (response.ok) {
        await fetchAllData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddComment = async (id: string, message: string) => {
    if (!currentUser) return;
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
        await fetchAllData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCompleteMaintenance = async (id: string, notes: string) => {
    if (!currentUser) return;
    try {
      const response = await fetch(`/api/maintenance/${id}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes, completedBy: currentUser.name })
      });
      if (response.ok) {
        await fetchAllData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleScheduleMaintenance = async (pmData: any) => {
    try {
      const response = await fetch("/api/maintenance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pmData)
      });
      if (response.ok) {
        await fetchAllData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateChecklist = async (id: string, checklist: any[]) => {
    try {
      const response = await fetch(`/api/maintenance/${id}/checklist`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ checklist })
      });
      if (response.ok) {
        await fetchAllData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRegisterAsset = async (assetData: any) => {
    try {
      const response = await fetch("/api/assets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(assetData)
      });
      if (response.ok) {
        await fetchAllData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddServicalLog = async (id: string, logData: any) => {
    try {
      const response = await fetch(`/api/assets/${id}/service`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(logData)
      });
      if (response.ok) {
        await fetchAllData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogIncident = async (incidentData: any) => {
    try {
      const response = await fetch("/api/incidents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(incidentData)
      });
      if (response.ok) {
        await fetchAllData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleResolveIncident = async (id: string, resolutionData: any) => {
    try {
      const response = await fetch(`/api/incidents/${id}/resolve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(resolutionData)
      });
      if (response.ok) {
        await fetchAllData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddKbArticle = async (articleData: any) => {
    try {
      const response = await fetch("/api/kb", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(articleData)
      });
      if (response.ok) {
        await fetchAllData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpvoteArticle = async (id: string) => {
    try {
      const response = await fetch(`/api/kb/${id}/upvote`, { method: "POST" });
      if (response.ok) {
        await fetchAllData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleViewArticle = async (id: string) => {
    try {
      await fetch(`/api/kb/${id}/view`, { method: "POST" });
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateSlaHours = async (slaData: any) => {
    try {
      const response = await fetch("/api/sla", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(slaData)
      });
      if (response.ok) {
        await fetchAllData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateUserRole = async (userId: string, targetRole: UserRole) => {
    try {
      const response = await fetch(`/api/users/${userId}/role`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: targetRole })
      });
      if (response.ok) {
        await fetchAllData();
      }
    } catch (err) {
      console.error(err);
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
