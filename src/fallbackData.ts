import { 
  User, 
  Ticket, 
  MaintenanceRecord, 
  Asset, 
  Incident, 
  KbArticle, 
  AuditLog, 
  UserRole,
  TicketCategory,
  PriorityLevel,
  TicketStatus,
  AssetCategory
} from "./types";

export const FALLBACK_USERS: User[] = [
  {
    id: "u-1",
    name: "Support Admin",
    email: "admin@corporate.com",
    role: UserRole.IT_ADMIN,
    department: "Administration",
    isMfaEnabled: true
  },
  {
    id: "u-2",
    name: "Samuel Awodele",
    email: "samuel.awodele@corporate.com",
    role: UserRole.IT_SUPPORT,
    department: "Administration",
    isMfaEnabled: true
  },
  {
    id: "u-3",
    name: "Chioma Okafor",
    email: "chioma.okafor@corporate.com",
    role: UserRole.STAFF,
    department: "Asset Management",
    isMfaEnabled: false
  },
  {
    id: "u-4",
    name: "Folayan Alabi",
    email: "folayan.alabi@corporate.com",
    role: UserRole.MANAGEMENT,
    department: "Investment Banking",
    isMfaEnabled: true
  },
  {
    id: "u-5",
    name: "Root Administrator",
    email: "sysadmin@corporate.com",
    role: UserRole.SYS_ADMIN,
    department: "Corporate Services",
    isMfaEnabled: true
  }
];

export const FALLBACK_TICKETS: Ticket[] = [
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
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    slaDueHours: 4,
    slaDueTime: new Date(Date.now() + 3600000 * 4).toISOString(),
    slaStatus: "Ongoing",
    comments: [
      {
        id: "c-1",
        senderName: "Folayan Alabi",
        senderRole: "Management",
        message: "We are currently pricing a critical corporate bonds issue, we need this live in 10 mins.",
        createdAt: new Date(Date.now() - 3600000 * 3).toISOString()
      },
      {
        id: "c-2",
        senderName: "Samuel Awodele",
        senderRole: "IT Support Officer",
        message: "Investigating routing table on the secondary gateway. Primary lease line reports active sync. Please stand by while I test path trace.",
        createdAt: new Date(Date.now() - 3600000 * 2).toISOString()
      }
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
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 18).toISOString(),
    slaDueHours: 24,
    slaDueTime: new Date(Date.now() - 3600000 * 12).toISOString(),
    slaStatus: "Met",
    comments: [
      {
        id: "c-3",
        senderName: "Samuel Awodele",
        senderRole: "IT Support Officer",
        message: "Cleaned print rollers, verified belt alignment and cleared paper bits from duplex bay. Tested with 20 pages double-sided stack successfully.",
        createdAt: new Date(Date.now() - 3600000 * 18).toISOString()
      }
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
    createdAt: new Date(Date.now() - 3600000 * 1).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 1).toISOString(),
    slaDueHours: 8,
    slaDueTime: new Date(Date.now() + 3600000 * 7).toISOString(),
    slaStatus: "Ongoing",
    comments: []
  }
];

export const FALLBACK_MAINTENANCE: MaintenanceRecord[] = [
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
    nextScheduledDate: "2026-06-19",
    lastCompletedDate: "2026-03-14"
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
    nextScheduledDate: "2026-07-07",
    lastCompletedDate: "2026-06-07",
    notes: "All switch ports active, cabling is neat and securely wrapped.",
    completedBy: "Samuel Awodele",
    completedAt: new Date(Date.now() - 3600000 * 120).toISOString()
  }
];

export const FALLBACK_ASSETS: Asset[] = [
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
      {
        id: "h-1",
        type: "RAM Upgrade",
        description: "Expanded ECC Memory from 64GB to 128GB to support increased virtualization load.",
        date: "2025-08-12",
        by: "Samuel Awodele"
      },
      {
        id: "h-2",
        type: "Preventive Care",
        description: "Checked thermal paste flow and cleared fan channels.",
        date: "2026-05-10",
        by: "Samuel Awodele"
      }
    ],
    qrCodeDataUrl: "",
    quantity: 4
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
      {
        id: "h-3",
        type: "Re-imaging OS",
        description: "Applied custom corporate security image with integrated Entra ID and Bitlocker controls.",
        date: "2026-04-18",
        by: "Samuel Awodele"
      }
    ],
    qrCodeDataUrl: "",
    quantity: 15
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
      {
        id: "h-4",
        type: "Port Audit",
        description: "Reset VLAN configurations on Ports 12-18 due to staff re-shuffling.",
        date: "2026-01-14",
        by: "Samuel Awodele"
      }
    ],
    qrCodeDataUrl: "",
    quantity: 6
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
      {
        id: "h-5",
        type: "Battery swap",
        description: "Replaced 4 modular cells after standard cyclic discharge testing.",
        date: "2025-10-02",
        by: "Samuel Awodele"
      }
    ],
    qrCodeDataUrl: "",
    quantity: 2
  }
];

export const FALLBACK_INCIDENTS: Incident[] = [
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
    loggedAt: new Date(Date.now() - 3600000 * 72).toISOString(),
    loggedBy: "Root Administrator",
    resolvedAt: new Date(Date.now() - 3600000 * 71.8).toISOString()
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
    loggedAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    loggedBy: "Samuel Awodele"
  }
];

export const FALLBACK_ARTICLES: KbArticle[] = [
  {
    id: "KB-501",
    title: "Troubleshooting Bloomberg Terminal Feed Lag",
    category: "Market Data Connectivity",
    content: "If the real-time tick price stream freezes or displays 'Feed Connection Timed Out', execute these diagnostic steps:\n\n1. Search for 'Bloomberg Terminal API Diagnostic' in your Windows Taskbar and run the script as Administrator.\n2. Confirm that TCP ports 8194 and 8196 are listing as ESTABLISHED in the terminal diagnostics log.\n3. Clear the bloomberg registry and cache path using command: C:\\blp\\API\\bin\\bbgcache.exe -reset\n4. If the error continues, ping core router address 192.168.10.1 and report the average delay to the IT support desk.",
    views: 124,
    upvotes: 28,
    lastUpdated: "2026-03-30",
    author: "Samuel Awodele",
    tags: ["Bloomberg", "Software", "Market Data"]
  },
  {
    id: "KB-502",
    title: "Connecting to Citrix Workspace securely from home",
    category: "Remote Access Setup",
    content: "To guarantee financial-sector compliance while operating outside the physical building:\n\n1. Ensure that Microsoft Authenticator MFA app is active on your device.\n2. Navigate to remote login portal and log in using your Entra ID login credentials.\n3. Approve the dynamic pop-up notification code on your mobile phone.\n4. Launch Citrix Virtual Desktop trading package and allow standard clipboard redirection options.",
    views: 310,
    upvotes: 49,
    lastUpdated: "2026-04-12",
    author: "Root Administrator",
    tags: ["Citrix", "Remote Work", "Access"]
  }
];

export const FALLBACK_AUDIT_LOGS: AuditLog[] = [
  {
    id: "AUD-101",
    userId: "u-1",
    userName: "Support Admin",
    userRole: "IT Administrator",
    action: "SLA Config Updated",
    details: "Altered global Critical Priority Ticket SLA to 4 hours response and 4 hours target resolution limit.",
    timestamp: new Date(Date.now() - 3600000 * 22).toISOString()
  },
  {
    id: "AUD-102",
    userId: "u-2",
    userName: "Samuel Awodele",
    userRole: "IT Support Officer",
    action: "Asset Health Decreased",
    details: "Set APC Smart-UPS SRT 10kVA Tower status to Critical due to cyclic battery deterioration alarm.",
    timestamp: new Date(Date.now() - 3600000 * 18).toISOString()
  }
];

export const FALLBACK_SLA = {
  criticalHours: 2,
  highHours: 8,
  mediumHours: 24,
  lowHours: 72
};
