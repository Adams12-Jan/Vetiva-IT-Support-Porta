import React, { useState } from "react";
import {
  LayoutDashboard,
  LifeBuoy,
  FileSpreadsheet,
  Settings,
  CalendarCheck,
  ShieldAlert,
  LogOut,
  UserCheck,
  BookOpen,
  Bell,
  CheckCircle2,
  AlertTriangle
} from "lucide-react";
import { User, UserRole } from "../types";

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  currentUser: User;
  onLogout: () => void;
  notificationsCount?: number;
}

export default function Sidebar({ activeTab, setActiveTab, currentUser, onLogout, notificationsCount = 3 }: SidebarProps) {
  const [showNotificationMenu, setShowNotificationMenu] = useState(false);
  const [logoFailed, setLogoFailed] = useState(false);

  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "tickets", label: "IT Tickets", icon: LifeBuoy },
    { id: "preventive", label: "Preventive care", icon: CalendarCheck },
    { id: "assets", label: "IT Asset Register", icon: FileSpreadsheet },
    { id: "incidents", label: "Incident Track", icon: ShieldAlert },
    { id: "kb", label: "Knowledge Base", icon: BookOpen },
    { id: "reports", label: "Reporting Hub", icon: FileSpreadsheet, subText: ".pdf .csv" },
    { id: "admin", label: "Admin Controls", icon: Settings, roleRestricted: true }
  ];

  // System notifications sample array
  const activeAlerts = [
    { title: "Critical SLA Warning", text: "TKT-1001 Bloomberg terminal connectivity has 30 mins remaining.", urgent: true },
    { title: "Preventive Care Scheduled", text: "Dusting & diagnostics for primary server racks starts tomorrow.", urgent: false },
    { title: "Asset Warranty alert", text: "APC Smart-UPS warranty expired. Preventive recommendations advised.", urgent: true }
  ];

  return (
    <aside className="w-68 bg-slate-950 border-r border-slate-800 flex flex-col h-screen text-slate-300" id="portal-sidebar">
      {/* Vetiva Corporate Branding Header */}
      <div className="p-6 border-b border-slate-800 flex items-center justify-center">
        {!logoFailed ? (
          <img 
            src="https://imgur.com/r53TTWv.png" 
            alt="Vetiva Logo" 
            className="h-10 object-contain" 
            referrerPolicy="no-referrer"
            onError={() => setLogoFailed(true)}
          />
        ) : (
          <div className="flex items-center gap-3 w-full">
            <div className="p-2 bg-gradient-to-br from-amber-500 to-amber-600 rounded-lg flex items-center justify-center shadow-lg">
              <span className="text-slate-950 font-bold font-mono text-lg">V</span>
            </div>
            <div>
              <h2 className="text-white font-bold text-sm tracking-wider uppercase">VETIVA</h2>
              <p className="text-[9px] text-[#C4A052] font-semibold tracking-widest uppercase">IT Support Portal</p>
            </div>
          </div>
        )}
      </div>

      {/* User Information Profile block */}
      <div className="p-4 bg-slate-930/60 border-b border-slate-800 flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-slate-800 border border-amber-500/40 flex items-center justify-center text-white font-bold text-sm">
            {currentUser.name.split(" ").map(n => n[0]).join("")}
          </div>
          <div className="overflow-hidden">
            <h4 className="text-slate-200 text-xs font-semibold truncate">{currentUser.name}</h4>
            <p className="text-[10px] text-slate-400 truncate">{currentUser.email}</p>
          </div>
        </div>

        {/* Dynamic Role Badge */}
        <div className="mt-2 flex items-center justify-between text-[11px] bg-slate-900/90 border border-slate-800 py-1.5 px-2.5 rounded-lg">
          <span className="text-slate-400 flex items-center gap-1">
            <UserCheck size={12} className="text-amber-500" />
            Role:
          </span>
          <span className="font-bold text-[#C4A052] truncate">{currentUser.role}</span>
        </div>
      </div>

      {/* Sidebar Navigation Entries */}
      <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-1.5 scrollbar-thin">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          const isRestrictedForUser = item.roleRestricted && currentUser.role === UserRole.STAFF;

          return (
            <button
              key={item.id}
              onClick={() => {
                if (isRestrictedForUser) {
                  alert("Access Restricted: Only IT Administrators or System Administrators can alter system settings.");
                  return;
                }
                setActiveTab(item.id);
              }}
              className={`w-full flex items-center justify-between py-2.5 px-3.5 rounded-lg text-xs transition-all text-left cursor-pointer ${
                isActive
                  ? "bg-slate-800/80 text-white font-semibold border-l-4 border-amber-500 pl-2.5 shadow-sm"
                  : "text-slate-400 hover:bg-slate-900 hover:text-slate-200"
              } ${isRestrictedForUser ? "opacity-30 cursor-not-allowed" : ""}`}
              id={`nav-${item.id}`}
            >
              <div className="flex items-center gap-3">
                <Icon size={16} className={isActive ? "text-amber-500" : "text-slate-500"} />
                <span>{item.label}</span>
              </div>
              {item.subText && (
                <span className="text-[9px] font-mono font-bold text-[#C4A052] bg-slate-900 border border-slate-800 py-0.5 px-1.5 rounded">
                  {item.subText}
                </span>
              )}
              {isRestrictedForUser && (
                <span className="text-[8px] bg-slate-900 text-red-500 font-bold border border-slate-800 px-1 py-0.5 rounded">
                  LOCKED
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Real-time Portal Active Monitors / System Alerts */}
      <div className="p-4 border-t border-slate-800 bg-slate-930/40 relative">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Active Alerts</span>
          <button 
            onClick={() => setShowNotificationMenu(!showNotificationMenu)}
            className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white relative cursor-pointer"
            id="alert-bell-btn"
          >
            <Bell size={14} className={notificationsCount > 0 ? "animate-swing" : ""} />
            {notificationsCount > 0 && (
              <span className="absolute top-0 right-0 w-1.5 h-1.5 bg-amber-500 rounded-full"></span>
            )}
          </button>
        </div>

        {/* Mini alerts list inside side column */}
        <div className="space-y-2">
          {activeAlerts.slice(0, 2).map((alertItem, idx) => (
            <div key={idx} className="p-2 rounded bg-slate-900/60 border border-slate-800 text-[10px] flex gap-2 items-start">
              {alertItem.urgent ? (
                <AlertTriangle size={12} className="text-amber-500 shrink-0 mt-0.5" />
              ) : (
                <CheckCircle2 size={12} className="text-emerald-500 shrink-0 mt-0.5" />
              )}
              <div>
                <span className="font-semibold text-slate-200 block truncate">{alertItem.title}</span>
                <p className="text-slate-400 line-clamp-1">{alertItem.text}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Floating Notification Popover details */}
        {showNotificationMenu && (
          <div className="absolute bottom-16 left-4 right-4 bg-slate-900 border border-slate-800 rounded-lg p-3 shadow-xl z-50">
            <h4 className="text-slate-300 font-bold text-xs mb-2 border-b border-slate-800 pb-1.5 flex items-center justify-between">
              <span>All Active Security Alerts</span>
              <span className="text-[10px] bg-amber-500/20 text-amber-500 px-1.5 rounded-full">{activeAlerts.length}</span>
            </h4>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {activeAlerts.map((alertItem, idx) => (
                <div key={idx} className="p-2 rounded bg-slate-950 border border-slate-850 text-[10px]">
                  <span className={`font-semibold block ${alertItem.urgent ? "text-amber-500" : "text-slate-300"}`}>
                    {alertItem.title}
                  </span>
                  <p className="text-slate-400 mt-0.5">{alertItem.text}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Logout button */}
      <div className="p-4 border-t border-slate-800 flex items-center">
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 py-2 px-3 text-red-400 hover:bg-red-950/20 hover:text-red-300 rounded-lg text-xs transition-colors text-left cursor-pointer font-medium"
          id="btn-logout"
        >
          <LogOut size={16} />
          <span>Exit Workspace</span>
        </button>
      </div>
    </aside>
  );
}
