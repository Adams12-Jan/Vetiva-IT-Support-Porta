export enum UserRole {
  IT_ADMIN = "IT Administrator",
  IT_SUPPORT = "IT Support Officer",
  STAFF = "Department Staff",
  MANAGEMENT = "Management",
  SYS_ADMIN = "System Administrator"
}

export enum TicketCategory {
  HARDWARE = "Hardware Issues",
  SOFTWARE = "Software Issues",
  NETWORK = "Network Issues",
  PRINTER = "Printer Issues",
  EMAIL = "Email Issues",
  SECURITY = "Security Incidents",
  ACCESS = "Access Requests",
  OTHER = "Other Requests"
}

export enum PriorityLevel {
  CRITICAL = "Critical",
  HIGH = "High",
  MEDIUM = "Medium",
  LOW = "Low"
}

export enum TicketStatus {
  OPEN = "Open",
  ASSIGNED = "Assigned",
  IN_PROGRESS = "In Progress",
  AWAITING_RESPONSE = "Awaiting User Response",
  RESOLVED = "Resolved",
  CLOSED = "Closed"
}

export enum AssetCategory {
  LAPTOPS = "Laptops",
  DESKTOPS = "Desktops",
  SERVERS = "Servers",
  PRINTERS = "Printers",
  NETWORK = "Network Devices",
  UPS = "UPS Systems",
  SECURITY = "Security Devices"
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department: string;
  avatarUrl?: string;
  isMfaEnabled?: boolean;
}

export interface TicketComment {
  id: string;
  senderName: string;
  senderRole: string;
  message: string;
  createdAt: string;
}

export interface Ticket {
  id: string;
  title: string;
  description: string;
  category: TicketCategory;
  priority: PriorityLevel;
  status: TicketStatus;
  requesterId: string;
  requesterName: string;
  requesterDept: string;
  assignedToId?: string;
  assignedToName?: string;
  createdAt: string;
  updatedAt: string;
  slaDueHours: number;
  slaDueTime: string;
  slaStatus: "Met" | "At Risk" | "Breached" | "Ongoing";
  comments: TicketComment[];
  aiCategorized?: boolean;
  aiInsights?: string;
}

export interface MaintenanceChecklistItem {
  id: string;
  task: string;
  completed: boolean;
}

export interface MaintenanceRecord {
  id: string;
  title: string;
  scheduleType: "Monthly" | "Quarterly" | "Annual";
  description: string;
  status: "Scheduled" | "Pending" | "Completed";
  checklist: MaintenanceChecklistItem[];
  assignedTo: string;
  nextScheduledDate: string;
  lastCompletedDate?: string;
  notes?: string;
  completedBy?: string;
  completedAt?: string;
}

export interface ServiceHistoryItem {
  id: string;
  type: string;
  description: string;
  date: string;
  by: string;
}

export interface Asset {
  id: string;
  name: string;
  tag: string;
  category: AssetCategory;
  purchaseDate: string;
  warrantyExpiry: string;
  cost: number;
  healthStatus: "Optimal" | "Degraded" | "Critical";
  assignedTo: string;
  location: string;
  lastMaintenanceDate?: string;
  serviceHistory: ServiceHistoryItem[];
  qrCodeDataUrl?: string;
}

export interface Incident {
  id: string;
  title: string;
  description: string;
  severity: "Critical" | "High" | "Medium";
  status: "Investigating" | "Mitigated" | "Resolved";
  downtimeMinutes: number;
  rootCause?: string;
  correctiveAction?: string;
  lessonsLearned?: string;
  loggedAt: string;
  loggedBy: string;
  resolvedAt?: string;
}

export interface KbArticle {
  id: string;
  title: string;
  category: string;
  content: string;
  views: number;
  upvotes: number;
  lastUpdated: string;
  author: string;
  tags: string[];
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  userRole: string;
  action: string;
  details: string;
  timestamp: string;
}

export interface DepartmentConfig {
  name: string;
  head: string;
  staffCount: number;
}

export interface SlaConfig {
  priority: PriorityLevel;
  responseTimeHours: number; // SLA time to first response
  resolutionTimeHours: number; // SLA time to resolve
}
