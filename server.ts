import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import {
  UserRole,
  TicketCategory,
  PriorityLevel,
  TicketStatus,
  AssetCategory,
  User,
  Ticket,
  MaintenanceRecord,
  Asset,
  Incident,
  KbArticle,
  AuditLog,
  SlaConfig,
  TicketComment,
  ServiceHistoryItem
} from "./src/types";

// Setup dotenv
import dotenv from "dotenv";
dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini Client safely
let ai: GoogleGenAI | null = null;
const geminiKey = process.env.GEMINI_API_KEY;
if (geminiKey && geminiKey !== "MY_GEMINI_API_KEY") {
  try {
    ai = new GoogleGenAI({
      apiKey: geminiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
    console.log("Gemini client successfully initialized server-side.");
  } catch (error) {
    console.error("Failed to initialize Gemini Client:", error);
  }
} else {
  console.warn("GEMINI_API_KEY is not configured or left as default. AI features will fallback to rule-based simulations.");
}

// Durable Data Store configuration
const DATA_STORE_PATH = path.join(process.cwd(), "data_store.json");

// Default seeded database state for Vetiva Capital Management Limited
const INITIAL_DATABASE_STATE = {
  users: [
    { id: "u-1", name: "Support Admin", email: "admin@vetiva.com", role: UserRole.IT_ADMIN, department: "Administration", isMfaEnabled: true },
    { id: "u-2", name: "Samuel Awodele", email: "samuel.awodele@vetiva.com", role: UserRole.IT_SUPPORT, department: "Administration", isMfaEnabled: true },
    { id: "u-3", name: "Chioma Okafor", email: "chioma.okafor@vetiva.com", role: UserRole.STAFF, department: "Asset Management", isMfaEnabled: false },
    { id: "u-4", name: "Folayan Alabi", email: "folayan.alabi@vetiva.com", role: UserRole.MANAGEMENT, department: "Investment Banking", isMfaEnabled: true },
    { id: "u-5", name: "Root Administrator", email: "sysadmin@vetiva.com", role: UserRole.SYS_ADMIN, department: "Corporate Services", isMfaEnabled: true }
  ] as User[],

  tickets: [
    {
      id: "TKT-1001",
      title: "Bloomberg terminal connectivity failure",
      description: "Getting premium lease line error 104 on feed client 2. No live tickers updating on Floor 2 Investment desks. Requiring immediate diagnostic verification on our trading network route.",
      category: TicketCategory.SOFTWARE,
      priority: PriorityLevel.CRITICAL,
      status: TicketStatus.IN_PROGRESS,
      requesterId: "u-4",
      requesterName: "Folayan Alabi",
      requesterDept: "Investment Banking",
      assignedToId: "u-2",
      assignedToName: "Samuel Awodele",
      createdAt: new Date(Date.now() - 3600000 * 4).toISOString(), // 4 hours ago
      updatedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
      slaDueHours: 4,
      slaDueTime: new Date(Date.now() + 3600000 * 4).toISOString(),
      slaStatus: "Ongoing",
      comments: [
        { id: "c-1", senderName: "Folayan Alabi", senderRole: "Management", message: "We are currently pricing a critical corporate bonds issue, we need this live in 10 mins.", createdAt: new Date(Date.now() - 3600000 * 3).toISOString() },
        { id: "c-2", senderName: "Samuel Awodele", senderRole: "IT Support Officer", message: "Investigating routing table on the secondary gateway. Primary lease line reports active sync. Please stand by while I test path trace.", createdAt: new Date(Date.now() - 3600000 * 2).toISOString() }
      ]
    },
    {
      id: "TKT-1002",
      title: "HP OfficeJet Pro duplex tray jamming on Floor 3",
      description: "Whenever we print double-sided operations reports, pages crumple automatically in the rear rolling track. Needs toner cleaning and rollers re-alignment.",
      category: TicketCategory.PRINTER,
      priority: PriorityLevel.MEDIUM,
      status: TicketStatus.RESOLVED,
      requesterId: "u-3",
      requesterName: "Chioma Okafor",
      requesterDept: "Asset Management",
      assignedToId: "u-2",
      assignedToName: "Samuel Awodele",
      createdAt: new Date(Date.now() - 3600000 * 24).toISOString(), // 24 hours ago
      updatedAt: new Date(Date.now() - 3600000 * 18).toISOString(),
      slaDueHours: 24,
      slaDueTime: new Date(Date.now() - 3600000 * 12).toISOString(),
      slaStatus: "Met",
      comments: [
        { id: "c-3", senderName: "Samuel Awodele", senderRole: "IT Support Officer", message: "Cleaned print rollers, verified belt alignment and cleared paper bits from duplex bay. Tested with 20 pages double-sided stack successfully.", createdAt: new Date(Date.now() - 3600000 * 18).toISOString() }
      ]
    },
    {
      id: "TKT-1003",
      title: "Active Directory Account Lockout",
      description: "I entered my security password incorrectly multiple times after returning from asset enumeration exercises. Kindly unlock and reset system login permissions.",
      category: TicketCategory.ACCESS,
      priority: PriorityLevel.HIGH,
      status: TicketStatus.OPEN,
      requesterId: "u-3",
      requesterName: "Chioma Okafor",
      requesterDept: "Asset Management",
      createdAt: new Date(Date.now() - 3600000 * 1).toISOString(), // 1 hour ago
      updatedAt: new Date(Date.now() - 3600000 * 1).toISOString(),
      slaDueHours: 8,
      slaDueTime: new Date(Date.now() + 3600000 * 7).toISOString(),
      slaStatus: "Ongoing",
      comments: []
    }
  ] as Ticket[],

  maintenanceRecords: [
    {
      id: "PM-201",
      title: "Quarterly Data Center Cooling & Dusty Air Vent Vacuuming",
      scheduleType: "Quarterly",
      description: "Clean dust and foreign elements off Server Rack chassis grids, inspect secondary fan bearing, and clear the air intake vents in Server Room A.",
      status: "Scheduled",
      checklist: [
        { id: "tsk-1", task: "Deploy alert message to operations regarding planned alternate cooling load test", completed: true },
        { id: "tsk-2", task: "Perform visual inspections of all standard network fans and servers", completed: true },
        { id: "tsk-3", task: "Vacuum front ventilation grills on Server racks SRV-01 through SRV-10", completed: false },
        { id: "tsk-4", task: "Clean air conditioning filtration filters", completed: false },
        { id: "tsk-5", task: "Record system temperature readings post-cleaning", completed: false }
      ],
      assignedTo: "Samuel Awodele",
      nextScheduledDate: new Date(Date.now() + 3600000 * 24 * 7).toISOString().substring(0, 10), // 7 days from now
      lastCompletedDate: new Date(Date.now() - 3600000 * 24 * 90).toISOString().substring(0, 10)
    },
    {
      id: "PM-202",
      title: "Monthly Corporate Network Switch Patch Auditing",
      scheduleType: "Monthly",
      description: "Inspect network cabling connections on Floor 3 trading hub, secure fiber jumpers, and run switch visual port diagnostics.",
      status: "Completed",
      checklist: [
        { id: "tsk-a", task: "Check core backbone fiber cables for loose connections", completed: true },
        { id: "tsk-b", task: "Update switch hardware label logs in mapping Excel sheet", completed: true },
        { id: "tsk-c", task: "Confirm redundant power supply load balancing indicators are green", completed: true }
      ],
      assignedTo: "Samuel Awodele",
      nextScheduledDate: new Date(Date.now() + 3600000 * 24 * 25).toISOString().substring(0, 10),
      lastCompletedDate: new Date(Date.now() - 3600000 * 24 * 5).toISOString().substring(0, 10),
      notes: "All switch ports active, cabling is neat and securely wrapped.",
      completedBy: "Samuel Awodele",
      completedAt: new Date(Date.now() - 3600000 * 24 * 5).toISOString()
    }
  ] as MaintenanceRecord[],

  assets: [
    {
      id: "AST-301",
      name: "Dell PowerEdge R750 Enterprise Server",
      tag: "VET/IT/SRV/002",
      category: AssetCategory.SERVERS,
      purchaseDate: "2023-11-15",
      warrantyExpiry: "2026-11-15",
      cost: 8500,
      healthStatus: "Optimal",
      assignedTo: "Server Room A - Primary Active Rack",
      location: "Server Room A",
      lastMaintenanceDate: "2026-05-10",
      serviceHistory: [
        { id: "h-1", type: "RAM Upgrade", description: "Expanded ECC Memory from 64GB to 128GB to support increased virtualization load.", date: "2025-08-12", by: "Samuel Awodele" },
        { id: "h-2", type: "Preventive Care", description: "Checked thermal paste flow and cleared fan channels.", date: "2026-05-10", by: "Samuel Awodele" }
      ],
      qrCodeDataUrl: "https://ais-dev-svhx3epbtbaf6ov6uiss4g-92315164727.europe-west1.run.app/qr/AST-301"
    },
    {
      id: "AST-302",
      name: "Dell Latitude 5430 Space Gray Core i7",
      tag: "VET/IT/LT/042",
      category: AssetCategory.LAPTOPS,
      purchaseDate: "2024-02-10",
      warrantyExpiry: "2027-02-10",
      cost: 1450,
      healthStatus: "Optimal",
      assignedTo: "Folayan Alabi",
      location: "Executive Offices Floor 4",
      lastMaintenanceDate: "2026-04-18",
      serviceHistory: [
        { id: "h-3", type: "Re-imaging OS", description: "Applied custom Vetiva corporate security image with integrated Entra ID and Bitlocker controls.", date: "2026-04-18", by: "Samuel Awodele" }
      ],
      qrCodeDataUrl: "https://ais-dev-svhx3epbtbaf6ov6uiss4g-92315164727.europe-west1.run.app/qr/AST-302"
    },
    {
      id: "AST-303",
      name: "Cisco Catalyst 9300 48-Port Switch",
      tag: "VET/IT/NET/011",
      category: AssetCategory.NETWORK,
      purchaseDate: "2022-06-20",
      warrantyExpiry: "2025-06-20",
      cost: 4200,
      healthStatus: "Degraded",
      assignedTo: "Network Cabinet Floor 3",
      location: "Wiring Closet Floor 3",
      lastMaintenanceDate: "2026-01-14",
      serviceHistory: [
        { id: "h-4", type: "Port Audit", description: "Reset VLAN configurations on Ports 12-18 due to staff re-shuffling.", date: "2026-01-14", by: "Samuel Awodele" }
      ],
      qrCodeDataUrl: "https://ais-dev-svhx3epbtbaf6ov6uiss4g-92315164727.europe-west1.run.app/qr/AST-303"
    },
    {
      id: "AST-304",
      name: "APC Smart-UPS SRT 10kVA Tower",
      tag: "VET/IT/UPS/008",
      category: AssetCategory.UPS,
      purchaseDate: "2021-09-05",
      warrantyExpiry: "2024-09-05",
      cost: 5100,
      healthStatus: "Critical",
      assignedTo: "Server Room A - Emergency Backup Node",
      location: "Server Room A",
      lastMaintenanceDate: "2025-10-02",
      serviceHistory: [
        { id: "h-5", type: "Battery swap", description: "Replaced 4 modular cells after standard cyclic discharge testing.", date: "2025-10-02", by: "Samuel Awodele" }
      ],
      qrCodeDataUrl: "https://ais-dev-svhx3epbtbaf6ov6uiss4g-92315164727.europe-west1.run.app/qr/AST-304"
    }
  ] as Asset[],

  incidents: [
    {
      id: "INC-401",
      title: "Trading Floor internet gateway offline (Main One Link)",
      description: "A sudden loss of routing tables split the network connectivity between our local terminal stacks and our external liquidity providers. Active backup switched to Glo fiber after 12 minutes of complete system downtime.",
      severity: "Critical",
      status: "Resolved",
      downtimeMinutes: 12,
      rootCause: "Undersea fiber disruption on primary cable line coupled with BGP path convergence delay.",
      correctiveAction: "Configured aggressive routing health-checks (IPSLA) to auto-transition traffic within 2 seconds instead of relying on default routing protocol timeout.",
      lessonsLearned: "SLA response from primary provider was requested, but redundant ISP switchover needs to be fully serverless and instant.",
      loggedAt: new Date(Date.now() - 3600000 * 24 * 3).toISOString(), // 3 days ago
      loggedBy: "Root Administrator",
      resolvedAt: new Date(Date.now() - 3600000 * 24 * 3 + 12 * 60000).toISOString()
    },
    {
      id: "INC-402",
      title: "Trading Floor Terminal Power Outage on Desk Row B",
      description: "A residual circuit breaker tripped in Distribution Board Floor 2, immediately cutting power to 8 active broker terminals.",
      severity: "High",
      status: "Mitigated",
      downtimeMinutes: 20,
      rootCause: "A staff member plugged an unauthorized auxiliary oil heater under their workspace, creating a load surge.",
      correctiveAction: "Reset the distribution fuse switch, removed the unauthorized heating appliance, and audited compliance.",
      loggedAt: new Date(Date.now() - 3600000 * 24 * 1).toISOString(), // 1 day ago
      loggedBy: "Samuel Awodele"
    }
  ] as Incident[],

  kbArticles: [
    {
      id: "KB-501",
      title: "Troubleshooting Bloomberg Terminal Feed Lag",
      category: "Market Data Connectivity",
      content: "If the real-time tick price stream freezes or displays 'Feed Connection Timed Out', execute these diagnostic steps:\n\n1. Search for 'Bloomberg Terminal API Diagnostic' in your Windows Taskbar and run the script as Administrator.\n2. Confirm that TCP ports 8194 and 8196 are listing as ESTABLISHED in the terminal diagnostics log.\n3. Clear the bloomberg registry and cache path using command: C:\\blp\\API\\bin\\bbgcache.exe -reset\n4. If the error continues, ping core router address 192.168.10.1 and report the average delay to Vetiva IT support.",
      views: 124,
      upvotes: 28,
      lastUpdated: "2026-03-30",
      author: "Samuel Awodele",
      tags: ["Bloomberg", "Software", "Market Data"]
    },
    {
      id: "KB-502",
      title: "Connecting to Vetiva Citrix Workspace securely from home",
      category: "Remote Access Setup",
      content: "To guarantee financial-sector compliance while operating outside the physical building:\n\n1. Ensure that Microsoft Authenticator MFA app is active on your device.\n2. Navigate to https://remote.vetiva.com and log in using your Entra ID login credentials.\n3. Approve the dynamic pop-up notification code on your mobile phone.\n4. Launch Citrix Virtual Desktop trading package and allow standard clipboard redirection options.",
      views: 310,
      upvotes: 49,
      lastUpdated: "2026-04-12",
      author: "Root Administrator",
      tags: ["Citrix", "Remote Work", "Access"]
    }
  ] as KbArticle[],

  auditLogs: [
    {
      id: "AUD-101",
      userId: "u-1",
      userName: "Support Admin",
      userRole: "IT Administrator",
      action: "SLA Config Updated",
      details: "Altered global Critical Priority Ticket SLA to 4 hours response and 4 hours target resolution limit.",
      timestamp: new Date(Date.now() - 3600000 * 5).toISOString()
    },
    {
      id: "AUD-102",
      userId: "u-2",
      userName: "Samuel Awodele",
      userRole: "IT Support Officer",
      action: "Asset Health Decreated",
      details: "Set APC Smart-UPS SRT 10kVA Tower (VET/IT/UPS/008) status to Critical due to cyclic battery deterioration alarm.",
      timestamp: new Date(Date.now() - 3600000 * 3).toISOString()
    }
  ] as AuditLog[],

  slaConfigs: [
    { priority: PriorityLevel.CRITICAL, responseTimeHours: 1, resolutionTimeHours: 4 },
    { priority: PriorityLevel.HIGH, responseTimeHours: 2, resolutionTimeHours: 8 },
    { priority: PriorityLevel.MEDIUM, responseTimeHours: 4, resolutionTimeHours: 24 },
    { priority: PriorityLevel.LOW, responseTimeHours: 8, resolutionTimeHours: 48 }
  ] as SlaConfig[]
};

// Helper to load state from data_store.json
function loadDatabaseState() {
  if (fs.existsSync(DATA_STORE_PATH)) {
    try {
      const content = fs.readFileSync(DATA_STORE_PATH, "utf-8");
      return JSON.parse(content);
    } catch (e) {
      console.error("Error reading database store. Falling back to default seeded data.", e);
      return INITIAL_DATABASE_STATE;
    }
  } else {
    // Write defaults
    fs.writeFileSync(DATA_STORE_PATH, JSON.stringify(INITIAL_DATABASE_STATE, null, 2), "utf-8");
    return INITIAL_DATABASE_STATE;
  }
}

// Helper to save state
function saveDatabaseState(state: typeof INITIAL_DATABASE_STATE) {
  try {
    fs.writeFileSync(DATA_STORE_PATH, JSON.stringify(state, null, 2), "utf-8");
  } catch (e) {
    console.error("Failed to persist database state to storage", e);
  }
}

// Global active database state
let db = loadDatabaseState();

// Audit logger helper
function writeAuditLog(userId: string, userName: string, role: string, action: string, details: string) {
  const newLog: AuditLog = {
    id: `AUD-${Math.floor(Math.random() * 90000 + 10000)}`,
    userId,
    userName,
    userRole: role,
    action,
    details,
    timestamp: new Date().toISOString()
  };
  db.auditLogs.unshift(newLog);
  // Keep logs at a reasonable limit
  if (db.auditLogs.length > 200) {
    db.auditLogs = db.auditLogs.slice(0, 200);
  }
  saveDatabaseState(db);
}

// REST endpoints
app.get("/api/state", (req, res) => {
  res.json(db);
});

app.get("/api/tickets", (req, res) => {
  res.json(db.tickets);
});

app.get("/api/maintenance", (req, res) => {
  res.json(db.maintenanceRecords);
});

app.get("/api/assets", (req, res) => {
  res.json(db.assets);
});

app.get("/api/incidents", (req, res) => {
  res.json(db.incidents);
});

app.get("/api/kb", (req, res) => {
  res.json(db.kbArticles);
});

app.get("/api/users", (req, res) => {
  res.json(db.users);
});

app.get("/api/audit-logs", (req, res) => {
  res.json(db.auditLogs);
});

app.get("/api/sla", (req, res) => {
  res.json(db.slaConfigs);
});

app.patch("/api/users/:id/role", (req, res) => {
  const { id } = req.params;
  const { role } = req.body;
  const user = db.users.find((u: any) => u.id === id);
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }
  user.role = role;
  saveDatabaseState(db);
  res.json({ success: true, user });
});

// Create support ticket
app.post("/api/tickets", (req, res) => {
  const { title, description, category, priority, requesterId, requesterName, requesterDept } = req.body;
  
  if (!title || !description || !category || !priority || !requesterName) {
    return res.status(400).json({ error: "Missing required support ticket properties." });
  }

  // Calculate default SLA based on Priority
  const prioConfig = db.slaConfigs.find((s: SlaConfig) => s.priority === priority) || { resolutionTimeHours: 12 };
  const slaHours = prioConfig.resolutionTimeHours;

  const newTicket: Ticket = {
    id: `TKT-${Math.floor(Math.random() * 9000 + 1000)}`,
    title,
    description,
    category: category as TicketCategory,
    priority: priority as PriorityLevel,
    status: TicketStatus.OPEN,
    requesterId: requesterId || "u-guest",
    requesterName,
    requesterDept,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    slaDueHours: slaHours,
    slaDueTime: new Date(Date.now() + 3600000 * slaHours).toISOString(),
    slaStatus: "Ongoing",
    comments: []
  };

  db.tickets.unshift(newTicket);
  saveDatabaseState(db);
  
  writeAuditLog(
    newTicket.requesterId,
    newTicket.requesterName,
    "Department Staff",
    "Ticket Created",
    `Created support ticket ${newTicket.id}: "${newTicket.title}"`
  );

  res.status(201).json(newTicket);
});

// Update support ticket status
app.post("/api/tickets/:id/status", (req, res) => {
  const { id } = req.params;
  const { status, updaterId, updaterName, updaterRole } = req.body;

  const ticketIndex = db.tickets.findIndex((t: Ticket) => t.id === id);
  if (ticketIndex === -1) {
    return res.status(404).json({ error: "Support ticket not found" });
  }

  const oldStatus = db.tickets[ticketIndex].status;
  db.tickets[ticketIndex].status = status as TicketStatus;
  db.tickets[ticketIndex].updatedAt = new Date().toISOString();

  // If status resolved, evaluate SLA status
  if (status === TicketStatus.RESOLVED || status === TicketStatus.CLOSED) {
    const expires = new Date(db.tickets[ticketIndex].slaDueTime).getTime();
    if (Date.now() <= expires) {
      db.tickets[ticketIndex].slaStatus = "Met";
    } else {
      db.tickets[ticketIndex].slaStatus = "Breached";
    }
  }

  saveDatabaseState(db);

  writeAuditLog(
    updaterId || "u-sys",
    updaterName || "System",
    updaterRole || "IT Support Officer",
    "Ticket Updated",
    `Changed ticket ${id} status from "${oldStatus}" to "${status}"`
  );

  res.json(db.tickets[ticketIndex]);
});

// Assign support ticket
app.post("/api/tickets/:id/assign", (req, res) => {
  const { id } = req.params;
  const { assignedToId, assignedToName, updaterId, updaterName, updaterRole } = req.body;

  const ticketIndex = db.tickets.findIndex((t: Ticket) => t.id === id);
  if (ticketIndex === -1) {
    return res.status(404).json({ error: "Support ticket not found" });
  }

  db.tickets[ticketIndex].assignedToId = assignedToId;
  db.tickets[ticketIndex].assignedToName = assignedToName;
  db.tickets[ticketIndex].status = TicketStatus.ASSIGNED;
  db.tickets[ticketIndex].updatedAt = new Date().toISOString();
  saveDatabaseState(db);

  writeAuditLog(
    updaterId || "u-sys",
    updaterName || "System",
    updaterRole || "IT Support Officer",
    "Ticket Assigned",
    `Assigned ticket ${id} to ${assignedToName}`
  );

  res.json(db.tickets[ticketIndex]);
});

// Add comment to support ticket
app.post("/api/tickets/:id/comments", (req, res) => {
  const { id } = req.params;
  const { message, senderName, senderRole, senderId } = req.body;

  if (!message || !senderName) {
    return res.status(400).json({ error: "Message content is required" });
  }

  const ticketIndex = db.tickets.findIndex((t: Ticket) => t.id === id);
  if (ticketIndex === -1) {
    return res.status(404).json({ error: "Support ticket not found" });
  }

  const newComment: TicketComment = {
    id: `com-${Math.floor(Math.random() * 100000)}`,
    senderName,
    senderRole: senderRole || "Staff",
    message,
    createdAt: new Date().toISOString()
  };

  db.tickets[ticketIndex].comments.push(newComment);
  db.tickets[ticketIndex].updatedAt = new Date().toISOString();
  saveDatabaseState(db);

  writeAuditLog(
    senderId || "u-guest",
    senderName,
    senderRole || "Staff",
    "Comment Added",
    `Added activity diagnostic message on ticket ${id}`
  );

  res.status(201).json(db.tickets[ticketIndex]);
});

// AI Ticket Categorization & Priority suggestions via Gemini API
app.post("/api/tickets/ai-classify", async (req, res) => {
  const { title, description } = req.body;
  if (!description) {
    return res.status(400).json({ error: "Ticket description is required for AI classification." });
  }

  // If Gemini is not loaded
  if (!ai) {
    console.log("No active Gemini Key. Standard fuzzy match classifier triggered.");
    // Dummy intelligent match simulation
    let category = TicketCategory.OTHER;
    let priority = PriorityLevel.LOW;
    let explanation = "Active fallback analyzer: matches typical keywords (router, server, printer, officejet).";

    const descLower = (title + " " + description).toLowerCase();

    if (descLower.includes("printing") || descLower.includes("printer") || descLower.includes("laserjet")) {
      category = TicketCategory.PRINTER;
      priority = PriorityLevel.MEDIUM;
    } else if (descLower.includes("network") || descLower.includes("switch") || descLower.includes("latency") || descLower.includes("internet") || descLower.includes("fiber")) {
      category = TicketCategory.NETWORK;
      priority = PriorityLevel.HIGH;
    } else if (descLower.includes("bloomberg") || descLower.includes("software") || descLower.includes("application") || descLower.includes("citrix")) {
      category = TicketCategory.SOFTWARE;
      priority = PriorityLevel.HIGH;
    } else if (descLower.includes("mfa") || descLower.includes("incident") || descLower.includes("leak") || descLower.includes("unauthorized") || descLower.includes("malware")) {
      category = TicketCategory.SECURITY;
      priority = PriorityLevel.CRITICAL;
      explanation = "Detected severe words linked with potential data loss or compliance breaches. Handed over with critical rating.";
    } else if (descLower.includes("lock") || descLower.includes("reset") || descLower.includes("login") || descLower.includes("active directory")) {
      category = TicketCategory.ACCESS;
      priority = PriorityLevel.MEDIUM;
    } else if (descLower.includes("laptop") || descLower.includes("desktop") || descLower.includes("hardware") || descLower.includes("monitor") || descLower.includes("ups")) {
      category = TicketCategory.HARDWARE;
      priority = PriorityLevel.MEDIUM;
    }

    return res.json({
      category,
      priority,
      slaDueHours: priority === PriorityLevel.CRITICAL ? 4 : priority === PriorityLevel.HIGH ? 8 : priority === PriorityLevel.MEDIUM ? 24 : 48,
      aiInsights: `[Rule Mode] Suggested category: "${category}". Priority: "${priority}". Analysis: ${explanation}`
    });
  }

  try {
    const prompt = `You are the Vetiva Capital Management IT Support AI Specialist.
Analyze this user support request title and description:
Title: "${title || "None"}"
Description: "${description}"

Assign the query to exactly one of these Category values:
- "Hardware Issues"
- "Software Issues"
- "Network Issues"
- "Printer Issues"
- "Email Issues"
- "Security Incidents"
- "Access Requests"
- "Other Requests"

Assign exactly one of these Priority Levels:
- "Critical" (Severe system outages affecting entire departments, trading networks, or security breaches)
- "High" (Severe disruption for a key user, e.g. active broker terminal block, or partial network drops)
- "Medium" (Standard business issues, printers, single software errors, non-blocking requests)
- "Low" (Minor aesthetics, settings help, general long-term requests)

Provide AI insights detailing:
1. Short diagnostic explanation
2. Immediate verification recommendation for the responding IT support desk.

Return ONLY a valid JSON object matching the following structure:
{
  "category": "Hardware Issues",
  "priority": "Medium",
  "aiInsights": "This is a short diagnostic summary with recommendations..."
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            category: { type: Type.STRING },
            priority: { type: Type.STRING },
            aiInsights: { type: Type.STRING }
          },
          required: ["category", "priority", "aiInsights"]
        }
      }
    });

    const bodyText = response.text ? response.text.trim() : "";
    const parsed = JSON.parse(bodyText);

    // Map to config SLAs
    const validPriority = Object.values(PriorityLevel).includes(parsed.priority) ? parsed.priority : PriorityLevel.MEDIUM;
    const prioConfig = db.slaConfigs.find((s: SlaConfig) => s.priority === validPriority) || { resolutionTimeHours: 12 };
    
    res.json({
      category: Object.values(TicketCategory).includes(parsed.category) ? parsed.category : TicketCategory.OTHER,
      priority: validPriority,
      slaDueHours: prioConfig.resolutionTimeHours,
      aiInsights: `[Gemini Class] ${parsed.aiInsights}`
    });

  } catch (error: any) {
    console.error("Gemini classification failed:", error);
    res.status(500).json({ error: "Failed to execute AI analysis.", detail: error.message });
  }
});

// AI Predictive Maintenance Recommendation
app.post("/api/assets/ai-preventive-recommendation", async (req, res) => {
  const { id, assetName, category, healthStatus, ageDays, serviceHistoryCount } = req.body;
  if (!assetName || !category) {
    return res.status(400).json({ error: "Asset details are required." });
  }

  if (!ai) {
    // Local simulation recommendations
    let probabilityOfCriticalFailure = 15;
    let advice = "No primary anomalies detected. Ensure routine quarterly dusting and cleaning logs operate properly.";
    let urgentLevel = "Low";

    if (healthStatus === "Critical") {
      probabilityOfCriticalFailure = 85;
      advice = "IMMEDIATE INTERVENTION REQUIRED. UPS battery degradation requires server load shedding. Clean circuits of any dust and dispatch the vendor swap within 24 hours.";
      urgentLevel = "Immediate";
    } else if (healthStatus === "Degraded" || ageDays > 1000) {
      probabilityOfCriticalFailure = 55;
      advice = "Moderate structural risk. Swap system heat sink fans, upgrade active system firmware patches, and conduct operational diagnostic load tests within 7 business days.";
      urgentLevel = "Medium";
    }

    return res.json({
      failureRiskIndex: probabilityOfCriticalFailure,
      urgentLevel,
      recommendation: `[Rule Engine] ${advice}`
    });
  }

  try {
    const prompt = `You are the Vetiva Capital Management Predictive IT Maintenance AI Optimizer.
Analyze this asset state details:
- Asset Name: "${assetName}"
- ID: "${id}"
- Category: "${category}"
- Health Status: "${healthStatus}"
- Simulated Installed Age: ${ageDays || 500} days
- Recorded Services: ${serviceHistoryCount || 1} sessions

Assess the failure risk index on a scale from 0 to 100 representing the likelihood of critical failure or downtime in the next 30 days. Provide an urgency assessment ("Low", "Medium", "High", "Immediate") and highly specific customized preventive/predictive recommendations targeting financial industry server room configurations.

Return ONLY a valid JSON object matching this structure:
{
  "failureRiskIndex": 45,
  "urgentLevel": "Medium",
  "recommendation": "Detailed highly contextual engineering suggestions and maintenance advice..."
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            failureRiskIndex: { type: Type.INTEGER },
            urgentLevel: { type: Type.STRING },
            recommendation: { type: Type.STRING }
          },
          required: ["failureRiskIndex", "urgentLevel", "recommendation"]
        }
      }
    });

    const bodyText = response.text ? response.text.trim() : "";
    const parsed = JSON.parse(bodyText);

    res.json({
      failureRiskIndex: parsed.failureRiskIndex,
      urgentLevel: parsed.urgentLevel,
      recommendation: `[Gemini Predictive Optimizer] ${parsed.recommendation}`
    });
  } catch (error: any) {
    console.error("Gemini predictive maintenance assessment failed:", error);
    res.status(500).json({ error: "Failed to generate asset AI insights.", detail: error.message });
  }
});

// Update Preventive Maintenance tasks checklist
app.post("/api/maintenance/:id/checklist", (req, res) => {
  const { id } = req.params;
  const { checklist, userId, userName, userRole } = req.body;

  const recordIndex = db.maintenanceRecords.findIndex((m: MaintenanceRecord) => m.id === id);
  if (recordIndex === -1) {
    return res.status(404).json({ error: "Preventive Maintenance plan not found" });
  }

  db.maintenanceRecords[recordIndex].checklist = checklist;
  db.maintenanceRecords[recordIndex].status = "Pending";
  saveDatabaseState(db);

  writeAuditLog(
    userId || "u-sys",
    userName || "System",
    userRole || "IT Support Officer",
    "Maintenance Checklist Updated",
    `Updated checklist tasks on scheduled maintenance ${id}: "${db.maintenanceRecords[recordIndex].title}"`
  );

  res.json(db.maintenanceRecords[recordIndex]);
});

// Complete Preventive Maintenance
app.post("/api/maintenance/:id/complete", (req, res) => {
  const { id } = req.params;
  const { notes, completedBy, completedById, completedByRole } = req.body;

  const recordIndex = db.maintenanceRecords.findIndex((m: MaintenanceRecord) => m.id === id);
  if (recordIndex === -1) {
    return res.status(404).json({ error: "Preventive Maintenance plan not found" });
  }

  const record = db.maintenanceRecords[recordIndex];
  
  // Update state
  record.status = "Completed";
  record.checklist = record.checklist.map(item => ({ ...item, completed: true }));
  record.lastCompletedDate = new Date().toISOString().substring(0, 10);
  record.completedBy = completedBy;
  record.completedAt = new Date().toISOString();
  record.notes = notes || "Completed successfully. All checkbox parameters verified.";
  
  // Calculate next scheduled based on Type
  const curr = new Date();
  if (record.scheduleType === "Monthly") {
    curr.setMonth(curr.getMonth() + 1);
  } else if (record.scheduleType === "Quarterly") {
    curr.setMonth(curr.getMonth() + 3);
  } else {
    curr.setFullYear(curr.getFullYear() + 1);
  }
  record.nextScheduledDate = curr.toISOString().substring(0, 10);

  db.maintenanceRecords[recordIndex] = record;
  saveDatabaseState(db);

  writeAuditLog(
    completedById || "u-sys",
    completedBy,
    completedByRole || "IT Support Officer",
    "Maintenance Completed",
    `Completed Preventive Maintenance ${id}: "${record.title}". Next scheduled on ${record.nextScheduledDate}.`
  );

  res.json(record);
});

// Add Preventive Maintenance Scheduled Item
app.post("/api/maintenance/schedule", (req, res) => {
  const { title, description, scheduleType, assignedTo, nextScheduledDate, checklistItems, userId, userName, userRole } = req.body;

  if (!title || !description || !scheduleType || !assignedTo || !nextScheduledDate) {
    return res.status(400).json({ error: "Missing required properties." });
  }

  const newPM: MaintenanceRecord = {
    id: `PM-${Math.floor(Math.random() * 900 + 100)}`,
    title,
    description,
    scheduleType: scheduleType as "Monthly" | "Quarterly" | "Annual",
    status: "Scheduled",
    assignedTo,
    nextScheduledDate,
    checklist: (checklistItems || []).map((text: string, idx: number) => ({
      id: `tsk-gen-${idx + 1}`,
      task: text,
      completed: false
    }))
  };

  db.maintenanceRecords.push(newPM);
  saveDatabaseState(db);

  writeAuditLog(
    userId || "u-sys",
    userName || "System",
    userRole || "IT Administrator",
    "Maintenance Scheduled",
    `Scheduled new preventive maintenance plan ${newPM.id}: "${newPM.title}"`
  );

  res.status(201).json(newPM);
});

// Create Asset
app.post("/api/assets", (req, res) => {
  const { name, tag, category, purchaseDate, warrantyExpiry, cost, assignedTo, location, healthStatus, userId, userName, userRole } = req.body;

  if (!name || !tag || !category || !purchaseDate) {
    return res.status(400).json({ error: "Missing required asset specifications." });
  }

  const newAsset: Asset = {
    id: `AST-${Math.floor(Math.random() * 900 + 100)}`,
    name,
    tag,
    category: category as AssetCategory,
    purchaseDate,
    warrantyExpiry: warrantyExpiry || new Date(Date.now() + 3600000 * 24 * 365 * 3).toISOString().substring(0, 10), // Default 3 year
    cost: Number(cost || 0),
    healthStatus: (healthStatus || "Optimal") as "Optimal" | "Degraded" | "Critical",
    assignedTo: assignedTo || "Unassigned",
    location: location || "HQ IT Office",
    serviceHistory: []
  };

  // Attach beautiful simulated QR Code path using app development/production host IP
  const appUrl = process.env.APP_URL || "http://localhost:3000";
  newAsset.qrCodeDataUrl = `${appUrl}/api/assets/${newAsset.id}/qr`;

  db.assets.unshift(newAsset);
  saveDatabaseState(db);

  writeAuditLog(
    userId || "u-sys",
    userName || "System",
    userRole || "IT Administrator",
    "Asset Registered",
    `Registered new asset tag ${tag}: "${name}"`
  );

  res.status(201).json(newAsset);
});

// Update Asset service history/health
app.post("/api/assets/:id/service", (req, res) => {
  const { id } = req.params;
  const { type, description, by, healthStatus, userId, userName, userRole } = req.body;

  const assetIndex = db.assets.findIndex((a: Asset) => a.id === id);
  if (assetIndex === -1) {
    return res.status(404).json({ error: "Asset not found" });
  }

  const asset = db.assets[assetIndex];
  
  if (healthStatus) {
    asset.healthStatus = healthStatus as "Optimal" | "Degraded" | "Critical";
  }

  const newHistory: ServiceHistoryItem = {
    id: `item-${Math.floor(Math.random() * 10000)}`,
    type: type || "General Service",
    description,
    by: by || "Samuel Awodele",
    date: new Date().toISOString().substring(0, 10)
  };

  asset.serviceHistory.unshift(newHistory);
  asset.lastMaintenanceDate = new Date().toISOString().substring(0, 10);
  
  db.assets[assetIndex] = asset;
  saveDatabaseState(db);

  writeAuditLog(
    userId || "u-sys",
    userName || "System",
    userRole || "IT Support Officer",
    "Asset Serviced",
    `Logged maintenance history item on asset ${id} (${asset.tag})`
  );

  res.json(asset);
});

// Log Security / Network Incident
app.post("/api/incidents", (req, res) => {
  const { title, description, severity, downtimeMinutes, loggedBy, loggedById, loggedByRole } = req.body;

  if (!title || !description || !severity) {
    return res.status(400).json({ error: "Missing required fields for incident tracking" });
  }

  const newIncident: Incident = {
    id: `INC-${Math.floor(Math.random() * 900 + 100)}`,
    title,
    description,
    severity: severity as "Critical" | "High" | "Medium",
    status: "Investigating",
    downtimeMinutes: Number(downtimeMinutes || 0),
    loggedAt: new Date().toISOString(),
    loggedBy: loggedBy || "IT Support Desk"
  };

  db.incidents.unshift(newIncident);
  saveDatabaseState(db);

  writeAuditLog(
    loggedById || "u-sys",
    loggedBy || "System",
    loggedByRole || "IT Support Officer",
    "Incident Logged",
    `Created severity "${severity}" incident ${newIncident.id}: "${title}"`
  );

  res.status(201).json(newIncident);
});

// Resolve Incident with root cause diagnostics
app.post("/api/incidents/:id/resolve", (req, res) => {
  const { id } = req.params;
  const { rootCause, correctiveAction, lessonsLearned, resolverId, resolverName, resolverRole } = req.body;

  const incidentIndex = db.incidents.findIndex((i: Incident) => i.id === id);
  if (incidentIndex === -1) {
    return res.status(404).json({ error: "Incident not found" });
  }

  const incident = db.incidents[incidentIndex];
  incident.status = "Resolved";
  incident.resolvedAt = new Date().toISOString();
  incident.rootCause = rootCause || "Undergoing system audits.";
  incident.correctiveAction = correctiveAction || "Operational patches dispatched as compliant safety locks.";
  incident.lessonsLearned = lessonsLearned || "Audited checklists scheduled.";

  db.incidents[incidentIndex] = incident;
  saveDatabaseState(db);

  writeAuditLog(
    resolverId || "u-sys",
    resolverName || "System",
    resolverRole || "IT Support Officer",
    "Incident Resolved",
    `Resolved incident ${id} and saved root cause files.`
  );

  res.json(incident);
});

// Create Knowledge Base article
app.post("/api/kb", (req, res) => {
  const { title, category, content, author, tags, userId, userRole } = req.body;

  if (!title || !category || !content || !author) {
    return res.status(400).json({ error: "Missing required core property fields" });
  }

  const newArt: KbArticle = {
    id: `KB-${Math.floor(Math.random() * 900 + 100)}`,
    title,
    category,
    content,
    views: 1,
    upvotes: 0,
    lastUpdated: new Date().toISOString().substring(0, 10),
    author,
    tags: tags || []
  };

  db.kbArticles.push(newArt);
  saveDatabaseState(db);

  writeAuditLog(
    userId || "u-sys",
    author,
    userRole || "IT Support Officer",
    "Help Guide Added",
    `Authored search guide ${newArt.id}: "${newArt.title}"`
  );

  res.status(201).json(newArt);
});

// Upvote KB article
app.post("/api/kb/:id/upvote", (req, res) => {
  const { id } = req.params;
  const artIndex = db.kbArticles.findIndex((k: KbArticle) => k.id === id);
  if (artIndex === -1) {
    return res.status(404).json({ error: "Article not found" });
  }
  db.kbArticles[artIndex].upvotes += 1;
  saveDatabaseState(db);
  res.json(db.kbArticles[artIndex]);
});

// Increment views KB Article
app.post("/api/kb/:id/view", (req, res) => {
  const { id } = req.params;
  const artIndex = db.kbArticles.findIndex((k: KbArticle) => k.id === id);
  if (artIndex === -1) {
    return res.status(404).json({ error: "Article not found" });
  }
  db.kbArticles[artIndex].views += 1;
  saveDatabaseState(db);
  res.json(db.kbArticles[artIndex]);
});

// Update SLAs priority configure
app.post("/api/admin/sla", (req, res) => {
  const { priority, responseTimeHours, resolutionTimeHours, userId, userName, userRole } = req.body;

  const slaIdx = db.slaConfigs.findIndex((s: SlaConfig) => s.priority === priority);
  if (slaIdx === -1) {
    db.slaConfigs.push({ priority, responseTimeHours, resolutionTimeHours });
  } else {
    db.slaConfigs[slaIdx].responseTimeHours = Number(responseTimeHours);
    db.slaConfigs[slaIdx].resolutionTimeHours = Number(resolutionTimeHours);
  }

  saveDatabaseState(db);

  writeAuditLog(
    userId || "u-sys",
    userName || "Admin",
    userRole || "System Administrator",
    "SLA Altered",
    `Modified response guidelines targets on priority "${priority}"`
  );

  res.json({ message: "SLA Targets Updated Successfully" });
});

// QR code generation pathway
app.get("/api/assets/:id/qr", (req, res) => {
  const { id } = req.params;
  // Beautiful SVG rendering of a modern system QR code with badge details
  const asset = db.assets.find((a: Asset) => a.id === id);
  const title = asset ? asset.name : "Vetiva Asset";
  const tag = asset ? asset.tag : id;

  res.setHeader("Content-Type", "image/svg+xml");
  res.send(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="150" height="150">
      <rect width="200" height="200" fill="#f8fafc" rx="8" stroke="#cbd5e1" stroke-width="2"/>
      <rect x="25" y="25" width="40" height="40" fill="none" stroke="#0f172a" stroke-width="6"/>
      <rect x="37" y="37" width="16" height="16" fill="#0f172a"/>
      
      <rect x="135" y="25" width="40" height="40" fill="none" stroke="#0f172a" stroke-width="6"/>
      <rect x="147" y="37" width="16" height="16" fill="#0f172a"/>

      <rect x="25" y="135" width="40" height="40" fill="none" stroke="#0f172a" stroke-width="6"/>
      <rect x="37" y="147" width="16" height="16" fill="#0f172a"/>

      <rect x="135" y="135" width="15" height="15" fill="#0f172a"/>
      <rect x="160" y="145" width="15" height="15" fill="#d97706"/>

      <!-- QR grid lines -->
      <line x1="85" y1="25" x2="85" y2="175" stroke="#0f172a" stroke-dasharray="8, 6" stroke-width="4"/>
      <line x1="110" y1="25" x2="110" y2="175" stroke="#0f172a" stroke-dasharray="5, 10" stroke-width="4"/>
      <line x1="25" y1="85" x2="175" y2="85" stroke="#0f172a" stroke-dasharray="4, 4" stroke-width="4"/>
      <line x1="25" y1="110" x2="175" y2="110" stroke="#0f172a" stroke-dasharray="10, 4" stroke-width="4"/>

      <!-- Central secure stamp logo V -->
      <circle cx="100" cy="100" r="18" fill="#d97706" />
      <text x="100" y="105" font-family="Arial" font-weight="bold" font-size="16" fill="#ffffff" text-anchor="middle">V</text>

      <!-- Label text -->
      <text x="100" y="190" font-family="Courier" font-size="8" fill="#475569" text-anchor="middle" font-weight="bold">${tag}</text>
    </svg>
  `);
});

// Configure Vite integration for SPA fallback
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Vetiva IT Support Server is actively operating and accessible on http://0.0.0.0:${PORT}`);
  });
}

startServer();
