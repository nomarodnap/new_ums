import {
  pgTable,
  text,
  timestamp,
  integer,
  decimal,
  boolean,
} from "drizzle-orm/pg-core";

// Better Auth core tables
export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull(),
  image: text("image"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
  role: text("role"),
  banned: boolean("banned"),
  banReason: text("ban_reason"),
  banExpires: timestamp("ban_expires"),
  departmentId: text("department_id"),
  phone: text("phone"),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at"),
  updatedAt: timestamp("updated_at"),
});

// Application specific tables

export const departments = pgTable("departments", {
  id: text("id").primaryKey(),
  costCenterCode: text("cost_center_code"),
  disbursingUnit: text("disbursing_unit"),
  depositUnit: text("deposit_unit"),
  fullName: text("full_name").notNull(),
  shortName: text("short_name"),
  division: text("division"),
  location: text("location"),
  province: text("province"),
  responsiblePerson: text("responsible_person"),
  phone: text("phone"),
  responsiblePhone: text("responsible_phone"),
  email: text("email"),
  type: text("type"), // 'central', 'regional_central', 'regional'
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const departmentServices = pgTable("department_services", {
  id: text("id").primaryKey(),
  departmentId: text("department_id").notNull(),
  utilityType: text("utility_type").notNull(),
  provider: text("provider").notNull(),
  serviceNumber: text("service_number").notNull(),
  locationType: text("location_type"),

  phoneOwnerName: text("phone_owner_name"),
  phoneOwnerPosition: text("phone_owner_position"),
  phoneReimbursementLimit: integer("phone_reimbursement_limit"),

  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const budgets = pgTable("budgets", {
  id: text("id").primaryKey(),
  budgetCode: text("budget_code").notNull(),
  name: text("name").notNull(),
  fundSource: text("fund_source"),
  allocatedAmount: decimal("allocated_amount", { precision: 15, scale: 2 })
    .notNull()
    .default("0"),
  transferredAmount: decimal("transferred_amount", { precision: 15, scale: 2 })
    .notNull()
    .default("0"),
  departmentId: text("department_id").notNull(),
  fiscalYear: integer("fiscal_year").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const budgetCodes = pgTable("budget_codes", {
  id: text("id").primaryKey(),
  code: text("code").notNull(),
  name: text("name").notNull(),
  fiscalYear: integer("fiscal_year").notNull(),
  description: text("description"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const utilityBills = pgTable("utility_bills", {
  id: text("id").primaryKey(),
  billCode: text("bill_code").unique(),
  departmentId: text("department_id").notNull(),
  utilityType: text("utility_type").notNull(), // ไฟฟ้า, ประปา, โทรศัพท์, etc.
  billingMonth: integer("billing_month").notNull(),
  billingYear: integer("billing_year").notNull(),
  provider: text("provider"),
  serviceNumber: text("service_number"),
  serviceBreakdown: text("service_breakdown"), // JSON string e.g. {"02-1234567": "500.00"}
  invoiceNumber: text("invoice_number"),
  invoiceDate: timestamp("invoice_date"),
  locationType: text("location_type"), // สำนักงาน, บ่อเพาะ, บ้านพัก
  usageAmount: decimal("usage_amount", { precision: 10, scale: 2 }),
  invoiceAmount: decimal("invoice_amount", { precision: 15, scale: 2 }),
  estimatedAmount: decimal("estimated_amount", { precision: 15, scale: 2 }), // กรณีไม่ได้รับบิล

  receivedDate: timestamp("received_date"),
  sentToDisbursingDate: timestamp("sent_to_disbursing_date"),
  disbursingReceivedDate: timestamp("disbursing_received_date"),

  paymentDate: timestamp("payment_date"),
  paymentDocNumber: text("payment_doc_number"),
  docType: text("doc_type"),
  accountCode: text("account_code"),
  budgetCode: text("budget_code"),
  fundSource: text("fund_source"),
  paidAmount: decimal("paid_amount", { precision: 15, scale: 2 }),

  paymentStatus: text("payment_status").notNull().default("PENDING"), // PENDING, PAID
  invoiceStatus: text("invoice_status").notNull().default("RECEIVED"), // RECEIVED, NOT_RECEIVED

  receiptNumber: text("receipt_number"),
  receiptDate: timestamp("receipt_date"),
  receiptPaymentDate: timestamp("receipt_payment_date"),

  attachmentInvoice: text("attachment_invoice"),
  attachmentReceipt: text("attachment_receipt"),
  attachmentPaymentDoc: text("attachment_payment_doc"),
  attachmentDirectPayment: text("attachment_direct_payment"),
  attachmentKtbReport: text("attachment_ktb_report"),

  isPendingBillOnly: boolean("is_pending_bill_only").notNull().default(false),
  depositUnitId: text("deposit_unit_id"),

  isReviewed: boolean("is_reviewed").default(false),
  reviewedBy: text("reviewed_by"),
  reviewedAt: timestamp("reviewed_at"),

  createdBy: text("created_by").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const audits = pgTable("audits", {
  id: text("id").primaryKey(),
  utilityBillId: text("utility_bill_id").notNull(),
  auditorId: text("auditor_id").notNull(),

  isLateReceive: boolean("is_late_receive").default(false),

  isLatePayment: boolean("is_late_payment").default(false),
  isOverdueMoreThan2Months: boolean("is_overdue_more_than_2_months").default(
    false,
  ),
  isDisbursementOver2Months: boolean("is_disbursement_over_2_months").default(
    false,
  ),
  isWrongMonth: boolean("is_wrong_month").default(false),
  isPhoneOverLimit: boolean("is_phone_over_limit").default(false),
  isPhoneUsageOverLimit: boolean("is_phone_usage_over_limit").default(false),
  isWrongBudget: boolean("is_wrong_budget").default(false),
  isDuplicate: boolean("is_duplicate").default(false),
  isAnomalyExpense: boolean("is_anomaly_expense").default(false),
  isManualAnomaly: boolean("is_manual_anomaly").default(false),

  status: text("status").notNull().default("PENDING_CORRECTION"), // PENDING_CORRECTION, CORRECTED
  remarks: text("remarks"),
  manualAnomalyReason: text("manual_anomaly_reason"),
  attachmentProof: text("attachment_proof"),

  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const notifications = pgTable("notifications", {
  id: text("id").primaryKey(),
  departmentId: text("department_id"), // null = to all or to specific roles
  targetRole: text("target_role"), // e.g. "admin", "auditor", null = target by department
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: text("type").notNull(), // BUDGET_LIMIT, LATE_PAYMENT, PENDING_BILL, MISSING_DATA, ABNORMAL_EXPENSE
  severity: text("severity").notNull().default("NORMAL"), // NORMAL, WARNING, URGENT
  isRead: boolean("is_read").notNull().default(false),
  link: text("link"), // URL to relevant report or page

  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const billActivityLogs = pgTable("bill_activity_logs", {
  id: text("id").primaryKey(),
  billId: text("bill_id").notNull(),
  userId: text("user_id").notNull(),
  action: text("action").notNull(), // CREATED, UPDATED, AUDITED, STATUS_CHANGED, ATTACHMENT_ADDED
  details: text("details"),

  createdAt: timestamp("created_at").notNull().defaultNow(),
});
