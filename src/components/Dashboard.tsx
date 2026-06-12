import React from "react";
import { 
  Building, 
  Clock, 
  Activity, 
  CheckSquare, 
  TrendingUp, 
  AlertOctagon, 
  Heart, 
  UserCheck 
} from "lucide-react";
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  PieChart, 
  Pie, 
  Cell 
} from "recharts";
import { Ticket, MaintenanceRecord, Asset, Incident } from "../types";

interface DashboardProps {
  tickets: Ticket[];
  maintenanceRecords: MaintenanceRecord[];
  assets: Asset[];
  incidents: Incident[];
  currentUser: any;
}

export default function Dashboard({ 
  tickets, 
  maintenanceRecords, 
  assets, 
  incidents, 
  currentUser 
}: DashboardProps) {

  // 1. Calculations: Support ticket KPIs
  const totalTickets = tickets.length;
  const openTickets = tickets.filter(t => t.status !== "Resolved" && t.status !== "Closed").length;
  const activeCritical = tickets.filter(t => t.priority === "Critical" && t.status !== "Resolved" && t.status !== "Closed").length;
  
  // Calculate average response compliance index
  const resolvedTickets = tickets.filter(t => t.status === "Resolved" || t.status === "Closed");
  const metSlaCount = resolvedTickets.filter(t => t.slaStatus === "Met").length;
  const complianceRate = resolvedTickets.length > 0 
    ? Math.round((metSlaCount / resolvedTickets.length) * 100) 
    : 96; // fallback pre-seeded data score

  // 2. Asset Health calculation
  const totalAssetsNum = assets.length;
  const optimalAssets = assets.filter(a => a.healthStatus === "Optimal").length;
  const degradedAssets = assets.filter(a => a.healthStatus === "Degraded").length;
  const criticalAssets = assets.filter(a => a.healthStatus === "Critical").length;
  const assetHealthIndex = totalAssetsNum > 0 
    ? Math.round((optimalAssets / totalAssetsNum) * 100) 
    : 100;

  // 3. Maintenance checklist completion compliance
  const completedMaintenance = maintenanceRecords.filter(m => m.status === "Completed").length;
  const pmComplianceIndex = maintenanceRecords.length > 0 
    ? Math.round((completedMaintenance / maintenanceRecords.length) * 100) 
    : 100;

  // 4. Incident stats
  const totalDowntime = incidents.reduce((total, inc) => total + inc.downtimeMinutes, 0);

  // 5. Data Transformer: Tickets by priority for PieChart
  const priorityDistribution = [
    { name: "Critical", value: tickets.filter(t => t.priority === "Critical").length, color: "#ef4444" },
    { name: "High", value: tickets.filter(t => t.priority === "High").length, color: "#f97316" },
    { name: "Medium", value: tickets.filter(t => t.priority === "Medium").length, color: "#d97706" },
    { name: "Low", value: tickets.filter(t => t.priority === "Low").length, color: "#10b981" }
  ].filter(p => p.value > 0);

  // 6. Data Transformer: Department volume
  const departmentCounts: Record<string, number> = {};
  tickets.forEach(t => {
    departmentCounts[t.requesterDept] = (departmentCounts[t.requesterDept] || 0) + 1;
  });
  
  const departmentData = Object.keys(departmentCounts).map(dept => ({
    name: dept,
    Tickets: departmentCounts[dept]
  }));

  // 7. Dynamic operational trend stats (simulated history + current live items)
  const complianceHistoryData = [
    { day: "Mon", compliance: 92, limit: 100 },
    { day: "Tue", compliance: 95, limit: 100 },
    { day: "Wed", compliance: 89, limit: 100 },
    { day: "Thu", compliance: 96, limit: 100 },
    { day: "Fri", compliance: complianceRate, limit: 100 }
  ];

  const categoryCounts: Record<string, number> = {};
  tickets.forEach(t => {
    categoryCounts[t.category] = (categoryCounts[t.category] || 0) + 1;
  });
  const categoryData = Object.keys(categoryCounts).map(cat => ({
    category: cat.replace(" Issues", "").replace(" Incidents", ""),
    Count: categoryCounts[cat]
  }));

  return (
    <div className="space-y-6" id="dashboard-tab">
      
      {/* Upper header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2 font-sans tracking-tight">
            <Building className="text-[#C4A052]" size={22} />
            Vetiva IT Support Command Dashboard
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time analytics monitor for critical transaction infrastructure systems &amp; support compliance.
          </p>
        </div>
        
        {/* Dynamic status line indicators */}
        <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 p-2 rounded-lg text-xs">
          <Activity size={14} className="text-emerald-500 animate-pulse" />
          <span className="text-slate-400">Trading System Network Status:</span>
          <span className="font-bold text-emerald-400">ACTIVE &amp; ONLINE</span>
        </div>
      </div>

      {/* KPI summary grid cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" id="kpi-grid">
        
        {/* Active Open Queue Card */}
        <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 flex items-center justify-between shadow-sm relative overflow-hidden group hover:border-[#C4A052] transition-colors">
          <div className="space-y-1 z-10">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Live Open Tickets</span>
            <span className="text-2xl font-bold font-mono text-slate-100">{openTickets}</span>
            <div className="text-[10px] text-slate-500 flex items-center gap-1">
              <span className={`w-1.5 h-1.5 rounded-full ${activeCritical > 0 ? 'bg-red-500' : 'bg-slate-500'}`}></span>
              {activeCritical} Critical Priority
            </div>
          </div>
          <div className="p-3 bg-red-950/20 text-red-500 rounded-lg shrink-0">
            <AlertOctagon size={20} />
          </div>
        </div>

        {/* SLA Response compliance Card */}
        <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 flex items-center justify-between shadow-sm relative overflow-hidden group hover:border-[#C4A052] transition-colors">
          <div className="space-y-1 z-10">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">SLA Compliance</span>
            <span className="text-2xl font-bold font-mono text-slate-100">{complianceRate}%</span>
            <div className="text-[10px] text-slate-400 flex items-center gap-1">
              <TrendingUp size={11} className="text-emerald-500" />
              Target: &gt;95% Resolution Log
            </div>
          </div>
          <div className="p-3 bg-blue-950/20 text-blue-400 rounded-lg shrink-0">
            <Clock size={20} />
          </div>
        </div>

        {/* Prevent Care compliance Card */}
        <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 flex items-center justify-between shadow-sm relative overflow-hidden group hover:border-[#C4A052] transition-colors">
          <div className="space-y-1 z-10">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Maintenance Index</span>
            <span className="text-2xl font-bold font-mono text-slate-100">{pmComplianceIndex}%</span>
            <div className="text-[10px] text-slate-400 flex items-center gap-1">
              <CheckSquare size={11} className="text-emerald-400" />
              {completedMaintenance} Complete Schedules
            </div>
          </div>
          <div className="p-3 bg-emerald-950/20 text-emerald-400 rounded-lg shrink-0">
            <CheckSquare size={20} />
          </div>
        </div>

        {/* Asset operational Health Index Card */}
        <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 flex items-center justify-between shadow-sm relative overflow-hidden group hover:border-[#C4A052] transition-colors">
          <div className="space-y-1 z-10">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Hardware Health Status</span>
            <span className="text-2xl font-bold font-mono text-slate-100">{assetHealthIndex}%</span>
            <div className="text-[10px] text-slate-400 flex items-center gap-1">
              {criticalAssets > 0 ? (
                <span className="text-amber-500 font-bold">{criticalAssets} Critical failures</span>
              ) : (
                <span className="text-slate-500">All primary servers secure</span>
              )}
            </div>
          </div>
          <div className="p-3 bg-amber-950/20 text-[#C4A052] rounded-lg shrink-0">
            <Heart size={20} />
          </div>
        </div>

      </div>

      {/* Main visualization grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="dashboard-charts">
        
        {/* Chart 1: SLA Compliance trend history */}
        <div className="lg:col-span-2 bg-slate-950 p-5 rounded-xl border border-slate-800 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-slate-200 font-bold text-sm">SLA Resolution Performance Trend</h3>
              <p className="text-[11px] text-slate-400">Weekly resolution compliance rate comparison metrics.</p>
            </div>
            <span className="text-[10px] font-mono font-bold bg-[#C4A052]/10 text-[#C4A052] border border-[#C4A052]/20 py-1 px-2 rounded">
              Goal SLA Met
            </span>
          </div>

          <div className="h-68 w-full" id="area-chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={complianceHistoryData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="slaColor" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#C4A052" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#C4A052" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="day" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} domain={[70, 100]} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: "#020617", borderColor: "#1e293b", borderRadius: "8px" }}
                  labelStyle={{ color: "#94a3b8", fontSize: "11px", fontWeight: "bold" }}
                  itemStyle={{ color: "#f8fafc", fontSize: "11px" }}
                />
                <Area type="monotone" dataKey="compliance" stroke="#C4A052" strokeWidth={2} fillOpacity={1} fill="url(#slaColor)" name="Compliance %" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Priority breakdown Pie Chart */}
        <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 shadow-sm flex flex-col">
          <div>
            <h3 className="text-slate-200 font-bold text-sm">Ticket Priority Allocation</h3>
            <p className="text-[11px] text-slate-400">Unresolved and resolved current database queue weighting.</p>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center min-h-[220px]" id="priority-pie-container">
            {priorityDistribution.length > 0 ? (
              <div className="relative w-full h-full flex flex-col items-center justify-center">
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie
                      data={priorityDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={70}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {priorityDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: "#020617", borderColor: "#1e293b", borderRadius: "8px" }}
                      itemStyle={{ fontSize: "11px", color: "#f8fafc" }}
                    />
                  </PieChart>
                </ResponsiveContainer>

                {/* Legend panel lists */}
                <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 mt-2">
                  {priorityDistribution.map((p, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-[11px] text-slate-350">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: p.color }}></span>
                      <span>{p.name}: <strong className="font-mono text-white">{p.value}</strong></span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center p-4 text-slate-500 text-xs text-balance">
                No tickets registered in the local workspace to compile priority ratios.
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Grid 3: Tickets by categories and department allocation */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" id="dashboard-lower-grid">
        
        {/* Support Tickets category volume */}
        <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 shadow-sm">
          <h3 className="text-slate-200 font-bold text-sm mb-4">Core IT Categories Volumetric Index</h3>
          <div className="h-56 w-full">
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="category" stroke="#94a3b8" fontSize={10} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} allowDecimals={false} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: "#020617", borderColor: "#1e293b", borderRadius: "8px" }}
                    itemStyle={{ color: "#f8fafc", fontSize: "11px" }}
                  />
                  <Bar dataKey="Count" fill="#0E8A8A" radius={[4, 4, 0, 0]} name="Ticket Count" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-500 text-xs text-center">
                Create support logs first to populate category metrics.
              </div>
            )}
          </div>
        </div>

        {/* Tickets by department */}
        <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 shadow-sm">
          <h3 className="text-slate-200 font-bold text-sm mb-4">Volume Requests by Department</h3>
          <div className="h-56 w-full">
            {departmentData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={departmentData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={8} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} allowDecimals={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#020617", borderColor: "#1e293b", borderRadius: "8px" }}
                    itemStyle={{ color: "#f8fafc", fontSize: "11px" }}
                  />
                  <Bar dataKey="Tickets" fill="#9a3412" radius={[4, 4, 0, 0]} name="Department Tickets" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-500 text-xs text-center">
                No active department requests processed.
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Core Infrastructure Alert Box */}
      {criticalAssets > 0 && (
        <div className="p-4 bg-red-950/20 border border-red-800/80 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-4 animate-pulse">
          <div className="flex items-center gap-3">
            <span className="p-2 bg-red-900/40 text-red-400 rounded-lg shrink-0">
              <AlertOctagon size={18} />
            </span>
            <div>
              <h4 className="text-red-400 text-xs font-bold leading-normal">System Maintenance Warning</h4>
              <p className="text-[11px] text-slate-350 mt-0.5">
                We have detected {criticalAssets} critical asset failure log(s). This can cause unscheduled down times for brokerage clients if they are left unattended. Operational checks required.
              </p>
            </div>
          </div>
          <p className="text-[10px] bg-red-400 text-slate-950 px-2 py-1.5 font-bold rounded shrink-0 self-start sm:self-center">
            IMMEDIATE AUDIT ADVISED
          </p>
        </div>
      )}

    </div>
  );
}
