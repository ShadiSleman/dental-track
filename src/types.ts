// ─── Roles ────────────────────────────────────────────────────────────────────
export type UserRole = 'doctor' | 'lab_manager' | 'technician' | 'courier' | 'super_admin'

// ─── Users ────────────────────────────────────────────────────────────────────
export interface User {
  _id: string
  name: string
  email: string
  phone?: string
  role: UserRole
  avatarUrl?: string
  labId?: string
  clinicId?: string
  isActive: boolean
  createdAt: string
  lastLogin?: string
}

// ─── Lab / Clinic ─────────────────────────────────────────────────────────────
export interface Lab {
  _id: string
  name: string
  address?: string
  phone?: string
  email?: string
  logoUrl?: string
}

export interface Clinic {
  _id: string
  name: string
  address?: string
  phone?: string
  email?: string
}

// ─── Work order stages ────────────────────────────────────────────────────────
export type Stage =
  | 'scan_received'
  | 'order_opened'
  | 'cad_design'
  | 'awaiting_approval'
  | 'approved'
  | 'manufacturing'
  | 'finishing'
  | 'quality_check'
  | 'ready_to_ship'
  | 'with_courier'
  | 'delivered'

export const STAGES: { key: Stage; label: string; color: string }[] = [
  { key: 'scan_received',     label: 'סריקה התקבלה',        color: 'bg-gray-400' },
  { key: 'order_opened',      label: 'עבודה נפתחה',          color: 'bg-blue-400' },
  { key: 'cad_design',        label: 'תכנון CAD',             color: 'bg-indigo-400' },
  { key: 'awaiting_approval', label: 'ממתין לאישור רופא',    color: 'bg-yellow-400' },
  { key: 'approved',          label: 'אושר',                  color: 'bg-emerald-400' },
  { key: 'manufacturing',     label: 'בייצור',               color: 'bg-cyan-400' },
  { key: 'finishing',         label: 'צביעה / גימור',        color: 'bg-purple-400' },
  { key: 'quality_check',     label: 'בקרת איכות',           color: 'bg-orange-400' },
  { key: 'ready_to_ship',     label: 'מוכן למשלוח',          color: 'bg-teal-400' },
  { key: 'with_courier',      label: 'אצל שליח',             color: 'bg-pink-400' },
  { key: 'delivered',         label: 'נמסר למרפאה',          color: 'bg-green-500' },
]

export type WorkType =
  | 'crown' | 'bridge' | 'implant' | 'veneer'
  | 'denture' | 'nightguard' | 'other'

export const WORK_TYPE_LABELS: Record<WorkType, string> = {
  crown: 'כתר',
  bridge: 'גשר',
  implant: 'שתל',
  veneer: 'ויניר',
  denture: 'תותבת',
  nightguard: 'סד לילה',
  other: 'אחר',
}

// ─── Work order ───────────────────────────────────────────────────────────────
export interface StageHistoryEntry {
  stage: Stage
  at: string
  by: { _id: string; name: string; role: UserRole }
  note?: string
  images?: string[]
}

export interface WorkOrderFile {
  url: string
  type: string
  name: string
  uploadedAt: string
}

export interface WorkOrder {
  _id: string
  orderNumber: string
  clinic: Clinic
  doctor: User
  lab: Lab
  assignedTechnician?: User
  patientCode: string
  workType: WorkType
  dueDate: string
  currentStage: Stage
  stageHistory: StageHistoryEntry[]
  files: WorkOrderFile[]
  isDelayed: boolean
  requiresDoctorApproval: boolean
  returnReason?: string
  signature?: string
  notes?: string
  createdAt: string
  updatedAt: string
}

// ─── Chat ─────────────────────────────────────────────────────────────────────
export interface Message {
  _id: string
  workOrderId: string
  sender: { _id: string; name: string; role: UserRole }
  text: string
  attachmentUrl?: string
  createdAt: string
}

// ─── Notification ─────────────────────────────────────────────────────────────
export interface AppNotification {
  _id: string
  userId: string
  type: 'stage_update' | 'approval_needed' | 'message' | 'delayed' | 'delivered'
  title: string
  body: string
  workOrderId?: string
  read: boolean
  createdAt: string
}

// ─── Subscription ─────────────────────────────────────────────────────────────
export type SubscriptionPlan =
  | 'clinic_basic' | 'clinic_pro'
  | 'lab_basic' | 'lab_pro' | 'enterprise'

export type SubscriptionStatus = 'active' | 'trial' | 'overdue' | 'cancelled'

export interface Subscription {
  _id: string
  accountId: string
  accountModel: 'Lab' | 'Clinic'
  accountName: string
  plan: SubscriptionPlan
  price: number
  status: SubscriptionStatus
  renewsAt: string
  trialEndsAt?: string
  createdAt: string
}

export const PLAN_LABELS: Record<SubscriptionPlan, string> = {
  clinic_basic: 'מרפאה בסיסי — 99₪',
  clinic_pro:   'מרפאה פרו — 199₪',
  lab_basic:    'מעבדה בסיסי — 499₪',
  lab_pro:      'מעבדה פרו — 999₪',
  enterprise:   'Enterprise',
}

export const PLAN_PRICES: Record<SubscriptionPlan, number> = {
  clinic_basic: 99,
  clinic_pro:   199,
  lab_basic:    499,
  lab_pro:      999,
  enterprise:   0,
}

// ─── Audit log ────────────────────────────────────────────────────────────────
export interface AuditLog {
  _id: string
  actor: { _id: string; name: string; role: UserRole }
  action: string
  target?: string
  targetModel?: string
  meta?: Record<string, unknown>
  ip?: string
  createdAt: string
}

// ─── Support ticket ───────────────────────────────────────────────────────────
export interface SupportTicket {
  _id: string
  from: { _id: string; name: string; email: string }
  subject: string
  body: string
  status: 'open' | 'in_progress' | 'resolved'
  replies: { sender: string; text: string; at: string }[]
  createdAt: string
}

// ─── Auth ─────────────────────────────────────────────────────────────────────
export interface AuthState {
  token: string | null
  user: User | null
}
