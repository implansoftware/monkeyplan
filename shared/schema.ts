import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, boolean, pgEnum } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
export const userRoleEnum = pgEnum("user_role", ["admin", "reseller", "repair_center", "customer"]);
export const ticketStatusEnum = pgEnum("ticket_status", ["open", "in_progress", "closed"]);
export const ticketPriorityEnum = pgEnum("ticket_priority", ["low", "medium", "high"]);
export const repairStatusEnum = pgEnum("repair_status", ["pending", "in_progress", "waiting_parts", "completed", "delivered", "cancelled"]);
export const paymentStatusEnum = pgEnum("payment_status", ["pending", "paid", "overdue", "cancelled"]);
export const movementTypeEnum = pgEnum("movement_type", ["in", "out", "adjustment"]);
export const notificationTypeEnum = pgEnum("notification_type", ["repair_update", "sla_warning", "review_request", "message", "system"]);

// Users table with role-based access
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  fullName: text("full_name").notNull(),
  role: userRoleEnum("role").notNull().default("customer"),
  isActive: boolean("is_active").notNull().default(true),
  repairCenterId: varchar("repair_center_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Repair Centers
export const repairCenters = pgTable("repair_centers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  address: text("address").notNull(),
  city: text("city").notNull(),
  phone: text("phone").notNull(),
  email: text("email").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Products (Inventory items)
export const products = pgTable("products", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  sku: text("sku").notNull().unique(),
  category: text("category").notNull(), // smartphone, laptop, tablet, accessory
  description: text("description"),
  unitPrice: integer("unit_price").notNull(), // in cents
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Inventory movements
export const inventoryMovements = pgTable("inventory_movements", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  productId: varchar("product_id").notNull(),
  repairCenterId: varchar("repair_center_id").notNull(),
  movementType: movementTypeEnum("movement_type").notNull(),
  quantity: integer("quantity").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  createdBy: varchar("created_by").notNull(),
});

// Current inventory stock by repair center
export const inventoryStock = pgTable("inventory_stock", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  productId: varchar("product_id").notNull(),
  repairCenterId: varchar("repair_center_id").notNull(),
  quantity: integer("quantity").notNull().default(0),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Repair orders (Lavorazioni)
export const repairOrders = pgTable("repair_orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderNumber: text("order_number").notNull().unique(),
  customerId: varchar("customer_id").notNull(),
  resellerId: varchar("reseller_id"),
  repairCenterId: varchar("repair_center_id"),
  deviceType: text("device_type").notNull(), // smartphone, laptop, tablet
  deviceModel: text("device_model").notNull(),
  issueDescription: text("issue_description").notNull(),
  status: repairStatusEnum("status").notNull().default("pending"),
  estimatedCost: integer("estimated_cost"), // in cents
  finalCost: integer("final_cost"), // in cents
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Repair Order Attachments (Photos and documents for repair orders)
export const repairAttachments = pgTable("repair_attachments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  repairOrderId: varchar("repair_order_id").notNull(),
  objectKey: text("object_key").notNull(), // Key in object storage
  fileName: text("file_name").notNull(), // Original file name
  fileType: text("file_type").notNull(), // MIME type
  fileSize: integer("file_size").notNull(), // Size in bytes
  uploadedBy: varchar("uploaded_by").notNull(),
  uploadedAt: timestamp("uploaded_at").notNull().defaultNow(),
});

// Support Tickets
export const tickets = pgTable("tickets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ticketNumber: text("ticket_number").notNull().unique(),
  customerId: varchar("customer_id").notNull(),
  subject: text("subject").notNull(),
  description: text("description").notNull(),
  status: ticketStatusEnum("status").notNull().default("open"),
  priority: ticketPriorityEnum("priority").notNull().default("medium"),
  assignedTo: varchar("assigned_to"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Ticket Messages (conversation thread)
export const ticketMessages = pgTable("ticket_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ticketId: varchar("ticket_id").notNull(),
  userId: varchar("user_id").notNull(),
  message: text("message").notNull(),
  isInternal: boolean("is_internal").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Invoices (Fatture)
export const invoices = pgTable("invoices", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  invoiceNumber: text("invoice_number").notNull().unique(),
  repairOrderId: varchar("repair_order_id"),
  customerId: varchar("customer_id").notNull(),
  amount: integer("amount").notNull(), // in cents
  tax: integer("tax").notNull().default(0), // in cents
  total: integer("total").notNull(), // in cents
  paymentStatus: paymentStatusEnum("payment_status").notNull().default("pending"),
  paymentMethod: text("payment_method").default("bank_transfer"),
  dueDate: timestamp("due_date"),
  paidDate: timestamp("paid_date"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Billing Data
export const billingData = pgTable("billing_data", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().unique(),
  companyName: text("company_name"),
  vatNumber: text("vat_number"),
  fiscalCode: text("fiscal_code"),
  address: text("address").notNull(),
  city: text("city").notNull(),
  zipCode: text("zip_code").notNull(),
  country: text("country").notNull().default("IT"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Live Chat Messages
export const chatMessages = pgTable("chat_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  senderId: varchar("sender_id").notNull(),
  receiverId: varchar("receiver_id").notNull(),
  message: text("message").notNull(),
  isRead: boolean("is_read").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Activity Logs (Audit Trail)
export const activityLogs = pgTable("activity_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  action: text("action").notNull(), // e.g., "CREATE", "UPDATE", "DELETE", "LOGIN", "LOGOUT"
  entityType: text("entity_type"), // e.g., "user", "repair_order", "ticket", "product"
  entityId: varchar("entity_id"),
  changes: text("changes"), // JSON string with before/after data
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Analytics Cache (for performance optimization)
export const analyticsCache = pgTable("analytics_cache", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  key: text("key").notNull().unique(),
  data: text("data").notNull(), // JSON string with aggregated analytics data
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Notifications (Real-time alerts for users)
export const notifications = pgTable("notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  type: notificationTypeEnum("type").notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  data: text("data"), // JSON string with additional notification data
  isRead: boolean("is_read").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Notification Preferences (User settings for notifications)
export const notificationPreferences = pgTable("notification_preferences", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().unique(),
  emailEnabled: boolean("email_enabled").notNull().default(true),
  pushEnabled: boolean("push_enabled").notNull().default(true),
  types: text("types").array().notNull().default(sql`ARRAY['repair_update', 'sla_warning', 'review_request', 'message', 'system']::text[]`),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ one, many }) => ({
  repairCenter: one(repairCenters, {
    fields: [users.repairCenterId],
    references: [repairCenters.id],
  }),
  repairOrders: many(repairOrders),
  tickets: many(tickets),
  billingData: one(billingData),
  sentMessages: many(chatMessages, { relationName: "sentMessages" }),
  receivedMessages: many(chatMessages, { relationName: "receivedMessages" }),
  activityLogs: many(activityLogs),
  notifications: many(notifications),
  notificationPreferences: one(notificationPreferences),
}));

export const repairCentersRelations = relations(repairCenters, ({ many }) => ({
  staff: many(users),
  repairOrders: many(repairOrders),
  inventoryStock: many(inventoryStock),
  inventoryMovements: many(inventoryMovements),
}));

export const productsRelations = relations(products, ({ many }) => ({
  inventoryStock: many(inventoryStock),
  inventoryMovements: many(inventoryMovements),
}));

export const repairOrdersRelations = relations(repairOrders, ({ one, many }) => ({
  customer: one(users, {
    fields: [repairOrders.customerId],
    references: [users.id],
  }),
  reseller: one(users, {
    fields: [repairOrders.resellerId],
    references: [users.id],
  }),
  repairCenter: one(repairCenters, {
    fields: [repairOrders.repairCenterId],
    references: [repairCenters.id],
  }),
  invoices: many(invoices),
  attachments: many(repairAttachments),
}));

export const repairAttachmentsRelations = relations(repairAttachments, ({ one }) => ({
  repairOrder: one(repairOrders, {
    fields: [repairAttachments.repairOrderId],
    references: [repairOrders.id],
  }),
  uploadedByUser: one(users, {
    fields: [repairAttachments.uploadedBy],
    references: [users.id],
  }),
}));

export const ticketsRelations = relations(tickets, ({ one, many }) => ({
  customer: one(users, {
    fields: [tickets.customerId],
    references: [users.id],
  }),
  assignedUser: one(users, {
    fields: [tickets.assignedTo],
    references: [users.id],
  }),
  messages: many(ticketMessages),
}));

export const ticketMessagesRelations = relations(ticketMessages, ({ one }) => ({
  ticket: one(tickets, {
    fields: [ticketMessages.ticketId],
    references: [tickets.id],
  }),
  user: one(users, {
    fields: [ticketMessages.userId],
    references: [users.id],
  }),
}));

export const invoicesRelations = relations(invoices, ({ one }) => ({
  customer: one(users, {
    fields: [invoices.customerId],
    references: [users.id],
  }),
  repairOrder: one(repairOrders, {
    fields: [invoices.repairOrderId],
    references: [repairOrders.id],
  }),
}));

export const billingDataRelations = relations(billingData, ({ one }) => ({
  user: one(users, {
    fields: [billingData.userId],
    references: [users.id],
  }),
}));

export const inventoryStockRelations = relations(inventoryStock, ({ one }) => ({
  product: one(products, {
    fields: [inventoryStock.productId],
    references: [products.id],
  }),
  repairCenter: one(repairCenters, {
    fields: [inventoryStock.repairCenterId],
    references: [repairCenters.id],
  }),
}));

export const inventoryMovementsRelations = relations(inventoryMovements, ({ one }) => ({
  product: one(products, {
    fields: [inventoryMovements.productId],
    references: [products.id],
  }),
  repairCenter: one(repairCenters, {
    fields: [inventoryMovements.repairCenterId],
    references: [repairCenters.id],
  }),
  createdByUser: one(users, {
    fields: [inventoryMovements.createdBy],
    references: [users.id],
  }),
}));

export const chatMessagesRelations = relations(chatMessages, ({ one }) => ({
  sender: one(users, {
    fields: [chatMessages.senderId],
    references: [users.id],
    relationName: "sentMessages",
  }),
  receiver: one(users, {
    fields: [chatMessages.receiverId],
    references: [users.id],
    relationName: "receivedMessages",
  }),
}));

export const activityLogsRelations = relations(activityLogs, ({ one }) => ({
  user: one(users, {
    fields: [activityLogs.userId],
    references: [users.id],
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}));

export const notificationPreferencesRelations = relations(notificationPreferences, ({ one }) => ({
  user: one(users, {
    fields: [notificationPreferences.userId],
    references: [users.id],
  }),
}));

// Insert Schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertRepairCenterSchema = createInsertSchema(repairCenters).omit({
  id: true,
  createdAt: true,
});

export const insertProductSchema = createInsertSchema(products).omit({
  id: true,
  createdAt: true,
});

export const insertInventoryMovementSchema = createInsertSchema(inventoryMovements).omit({
  id: true,
  createdAt: true,
});

export const insertRepairOrderSchema = createInsertSchema(repairOrders).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTicketSchema = createInsertSchema(tickets).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTicketMessageSchema = createInsertSchema(ticketMessages).omit({
  id: true,
  createdAt: true,
});

export const insertInvoiceSchema = createInsertSchema(invoices).omit({
  id: true,
  createdAt: true,
});

export const insertBillingDataSchema = createInsertSchema(billingData).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertChatMessageSchema = createInsertSchema(chatMessages).omit({
  id: true,
  createdAt: true,
});

export const insertActivityLogSchema = createInsertSchema(activityLogs).omit({
  id: true,
  createdAt: true,
});

export const insertAnalyticsCacheSchema = createInsertSchema(analyticsCache).omit({
  id: true,
  createdAt: true,
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
});

export const insertNotificationPreferencesSchema = createInsertSchema(notificationPreferences).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertRepairAttachmentSchema = createInsertSchema(repairAttachments).omit({
  id: true,
  uploadedAt: true,
});

// Update schemas for PATCH endpoints
export const updateRepairStatusSchema = z.object({
  status: z.enum(["pending", "in_progress", "waiting_parts", "completed", "delivered", "cancelled"]),
});

export const updateTicketStatusSchema = z.object({
  status: z.enum(["open", "in_progress", "waiting_response", "resolved", "closed"]),
});

export const createTicketMessageSchema = z.object({
  message: z.string().min(1).trim(),
  isInternal: z.boolean().optional().default(false),
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type RepairCenter = typeof repairCenters.$inferSelect;
export type InsertRepairCenter = z.infer<typeof insertRepairCenterSchema>;

export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;

export type InventoryMovement = typeof inventoryMovements.$inferSelect;
export type InsertInventoryMovement = z.infer<typeof insertInventoryMovementSchema>;

export type InventoryStock = typeof inventoryStock.$inferSelect;

export type RepairOrder = typeof repairOrders.$inferSelect;
export type InsertRepairOrder = z.infer<typeof insertRepairOrderSchema>;

export type Ticket = typeof tickets.$inferSelect;
export type InsertTicket = z.infer<typeof insertTicketSchema>;

export type TicketMessage = typeof ticketMessages.$inferSelect;
export type InsertTicketMessage = z.infer<typeof insertTicketMessageSchema>;

export type Invoice = typeof invoices.$inferSelect;
export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;

export type BillingData = typeof billingData.$inferSelect;
export type InsertBillingData = z.infer<typeof insertBillingDataSchema>;

export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;

export type ActivityLog = typeof activityLogs.$inferSelect;
export type InsertActivityLog = z.infer<typeof insertActivityLogSchema>;

export type AnalyticsCache = typeof analyticsCache.$inferSelect;
export type InsertAnalyticsCache = z.infer<typeof insertAnalyticsCacheSchema>;

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;

export type NotificationPreferences = typeof notificationPreferences.$inferSelect;
export type InsertNotificationPreferences = z.infer<typeof insertNotificationPreferencesSchema>;

export type RepairAttachment = typeof repairAttachments.$inferSelect;
export type InsertRepairAttachment = z.infer<typeof insertRepairAttachmentSchema>;
