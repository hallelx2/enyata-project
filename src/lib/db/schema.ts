import { boolean, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("emailVerified").notNull(),
  image: text("image"),
  createdAt: timestamp("createdAt").notNull(),
  updatedAt: timestamp("updatedAt").notNull(),
  role: text("role").notNull().default("patient"),
  phoneNumber: text("phoneNumber"),
  isApproved: boolean("isApproved").notNull().default(true),
});

export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
  emrRecords: many(emrRecord),
  patientLinks: many(patientHospitalLink, { relationName: "patientLinks" }),
  hospitalLinks: many(patientHospitalLink, { relationName: "hospitalLinks" }),
  patientEscrows: many(escrowTransaction, { relationName: "patientEscrows" }),
  hospitalEscrows: many(escrowTransaction, { relationName: "hospitalEscrows" }),
  patientTriages: many(triageRequest, { relationName: "patientTriages" }),
  hospitalTriages: many(triageRequest, { relationName: "hospitalTriages" }),
}));

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expiresAt").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("createdAt").notNull(),
  updatedAt: timestamp("updatedAt").notNull(),
  ipAddress: text("ipAddress"),
  userAgent: text("userAgent"),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
}));

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("accountId").notNull(),
  providerId: text("providerId").notNull(),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("accessToken"),
  refreshToken: text("refreshToken"),
  idToken: text("idToken"),
  accessTokenExpiresAt: timestamp("accessTokenExpiresAt"),
  refreshTokenExpiresAt: timestamp("refreshTokenExpiresAt"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("createdAt").notNull(),
  updatedAt: timestamp("updatedAt").notNull(),
});

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
}));

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt"),
  updatedAt: timestamp("updatedAt"),
});

// EMR records imported by hospitals from their external systems
export const emrRecord = pgTable("emr_record", {
  id: text("id").primaryKey(),
  hospitalId: text("hospital_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  patientName: text("patient_name").notNull(),
  patientEmail: text("patient_email"),
  patientPhone: text("patient_phone"),
  dateOfBirth: text("date_of_birth"),
  bloodType: text("blood_type"),
  allergies: text("allergies"),
  conditions: text("conditions"),
  lastVisit: text("last_visit"),
  auraId: text("aura_id"),
  createdAt: timestamp("created_at").notNull(),
});

export const emrRecordRelations = relations(emrRecord, ({ one }) => ({
  hospital: one(user, {
    fields: [emrRecord.hospitalId],
    references: [user.id],
  }),
}));

// Links between registered patients and hospitals (approved or pending)
export const patientHospitalLink = pgTable("patient_hospital_link", {
  id: text("id").primaryKey(),
  patientId: text("patient_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  hospitalId: text("hospital_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  // 'pending' = patient requested, awaiting hospital approval
  // 'approved' = hospital approved
  // 'auto' = auto-matched via EMR data
  status: text("status").notNull().default("pending"),
  requestedAt: timestamp("requested_at").notNull(),
  approvedAt: timestamp("approved_at"),
});

export const patientHospitalLinkRelations = relations(
  patientHospitalLink,
  ({ one }) => ({
    patient: one(user, {
      fields: [patientHospitalLink.patientId],
      references: [user.id],
      relationName: "patientLinks",
    }),
    hospital: one(user, {
      fields: [patientHospitalLink.hospitalId],
      references: [user.id],
      relationName: "hospitalLinks",
    }),
  }),
);

// Escrow transactions managed via Interswitch
export const escrowTransaction = pgTable("escrow_transaction", {
  id: text("id").primaryKey(),
  patientId: text("patient_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  hospitalId: text("hospital_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  // Amount in kobo (Naira * 100)
  amount: text("amount").notNull(),
  // 'pending' | 'held' | 'released' | 'refunded'
  status: text("status").notNull().default("pending"),
  transactionRef: text("transaction_ref").notNull().unique(),
  interswitchRef: text("interswitch_ref"),
  description: text("description"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
});

export const escrowTransactionRelations = relations(
  escrowTransaction,
  ({ one }) => ({
    patient: one(user, {
      fields: [escrowTransaction.patientId],
      references: [user.id],
      relationName: "patientEscrows",
    }),
    hospital: one(user, {
      fields: [escrowTransaction.hospitalId],
      references: [user.id],
      relationName: "hospitalEscrows",
    }),
  }),
);

// Central triage requests routed from patients to their linked hospital
export const triageRequest = pgTable("triage_request", {
  id: text("id").primaryKey(),
  patientId: text("patient_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  hospitalId: text("hospital_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  symptoms: text("symptoms").notNull(),
  // 'low' | 'medium' | 'high' | 'critical'
  severity: text("severity").notNull().default("medium"),
  // 'pending' | 'in_progress' | 'resolved'
  status: text("status").notNull().default("pending"),
  notes: text("notes"),
  escrowRef: text("escrow_ref"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
});

export const triageRequestRelations = relations(triageRequest, ({ one }) => ({
  patient: one(user, {
    fields: [triageRequest.patientId],
    references: [user.id],
    relationName: "patientTriages",
  }),
  hospital: one(user, {
    fields: [triageRequest.hospitalId],
    references: [user.id],
    relationName: "hospitalTriages",
  }),
}));
