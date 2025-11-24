import {
  User, InsertUser, RepairCenter, InsertRepairCenter, Product, InsertProduct,
  RepairOrder, InsertRepairOrder, Ticket, InsertTicket, TicketMessage, InsertTicketMessage,
  Invoice, InsertInvoice, BillingData, InsertBillingData, ChatMessage, InsertChatMessage,
  InventoryMovement, InsertInventoryMovement, InventoryStock, ActivityLog, InsertActivityLog,
  AnalyticsCache, InsertAnalyticsCache, Notification, InsertNotification,
  NotificationPreferences, InsertNotificationPreferences, RepairAttachment, InsertRepairAttachment,
  users, repairCenters, products, repairOrders, tickets, ticketMessages,
  invoices, billingData, chatMessages, inventoryMovements, inventoryStock, activityLogs, analyticsCache,
  notifications, notificationPreferences, repairAttachments
} from "@shared/schema";
import { db, pool } from "./db";
import { eq, and, or, desc, lt, sql } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  // Auth & User management
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  listUsers(): Promise<User[]>;
  deleteUser(id: string): Promise<void>;
  
  // Repair Centers
  listRepairCenters(): Promise<RepairCenter[]>;
  getRepairCenter(id: string): Promise<RepairCenter | undefined>;
  createRepairCenter(center: InsertRepairCenter): Promise<RepairCenter>;
  deleteRepairCenter(id: string): Promise<void>;
  
  // Products
  listProducts(): Promise<Product[]>;
  getProduct(id: string): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  deleteProduct(id: string): Promise<void>;
  
  // Repair Orders
  listRepairOrders(filters?: { customerId?: string; resellerId?: string; repairCenterId?: string; status?: string }): Promise<RepairOrder[]>;
  getRepairOrder(id: string): Promise<RepairOrder | undefined>;
  createRepairOrder(order: InsertRepairOrder): Promise<RepairOrder>;
  updateRepairOrderStatus(id: string, status: string): Promise<RepairOrder>;
  
  // Tickets
  listTickets(filters?: { customerId?: string; status?: string }): Promise<Ticket[]>;
  getTicket(id: string): Promise<Ticket | undefined>;
  createTicket(ticket: InsertTicket): Promise<Ticket>;
  updateTicketStatus(id: string, status: string): Promise<Ticket>;
  
  // Ticket Messages
  listTicketMessages(ticketId: string): Promise<TicketMessage[]>;
  createTicketMessage(message: InsertTicketMessage): Promise<TicketMessage>;
  
  // Invoices
  listInvoices(): Promise<Invoice[]>;
  getInvoice(id: string): Promise<Invoice | undefined>;
  createInvoice(invoice: InsertInvoice): Promise<Invoice>;
  
  // Billing Data
  getBillingDataByUserId(userId: string): Promise<BillingData | undefined>;
  createBillingData(data: InsertBillingData): Promise<BillingData>;
  
  // Chat Messages
  listChatMessages(userId1: string, userId2: string): Promise<ChatMessage[]>;
  createChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
  
  // Inventory
  listInventoryStock(repairCenterId?: string): Promise<InventoryStock[]>;
  createInventoryMovement(movement: InsertInventoryMovement): Promise<InventoryMovement>;
  
  // Activity Logs
  createActivityLog(log: InsertActivityLog): Promise<ActivityLog>;
  listActivityLogs(filters?: { userId?: string; action?: string; entityType?: string; startDate?: Date; endDate?: Date; limit?: number }): Promise<ActivityLog[]>;
  getActivityLog(id: string): Promise<ActivityLog | undefined>;
  purgeOldActivityLogs(retentionDays: number): Promise<number>;
  
  // Analytics & Cache
  getCachedAnalytics(key: string): Promise<any | null>;
  setCachedAnalytics(key: string, data: any, expiresAt: Date): Promise<void>;
  invalidateCache(pattern: string): Promise<void>;
  getRevenueByPeriod(startDate: Date, endDate: Date, groupBy: 'day' | 'week' | 'month'): Promise<any[]>;
  getRepairCenterPerformance(centerId?: string, period?: { start: Date; end: Date }): Promise<any>;
  getTopProducts(limit: number, period?: { start: Date; end: Date }): Promise<any[]>;
  getOverviewKPIs(period?: { start: Date; end: Date }): Promise<any>;
  
  // Notifications
  createNotification(notification: InsertNotification): Promise<Notification>;
  listNotifications(userId: string, filters?: { isRead?: boolean; limit?: number }): Promise<Notification[]>;
  markNotificationAsRead(id: string, userId: string): Promise<Notification>;
  getNotificationPreferences(userId: string): Promise<NotificationPreferences | undefined>;
  createNotificationPreferences(preferences: InsertNotificationPreferences): Promise<NotificationPreferences>;
  updateNotificationPreferences(userId: string, updates: { emailEnabled?: boolean; pushEnabled?: boolean; types?: string[] }): Promise<NotificationPreferences>;
  
  // Repair Attachments
  addRepairAttachment(attachment: InsertRepairAttachment): Promise<RepairAttachment>;
  listRepairAttachments(repairOrderId: string): Promise<RepairAttachment[]>;
  getRepairAttachment(id: string): Promise<RepairAttachment | undefined>;
  deleteRepairAttachment(id: string): Promise<void>;
  
  sessionStore: session.Store;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new PostgresSessionStore({ pool, createTableIfMissing: true });
  }

  // Users
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async listUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }

  async deleteUser(id: string): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  }

  // Repair Centers
  async listRepairCenters(): Promise<RepairCenter[]> {
    return await db.select().from(repairCenters).orderBy(desc(repairCenters.createdAt));
  }

  async getRepairCenter(id: string): Promise<RepairCenter | undefined> {
    const [center] = await db.select().from(repairCenters).where(eq(repairCenters.id, id));
    return center || undefined;
  }

  async createRepairCenter(insertCenter: InsertRepairCenter): Promise<RepairCenter> {
    const [center] = await db.insert(repairCenters).values(insertCenter).returning();
    return center;
  }

  async deleteRepairCenter(id: string): Promise<void> {
    await db.delete(repairCenters).where(eq(repairCenters.id, id));
  }

  // Products
  async listProducts(): Promise<Product[]> {
    return await db.select().from(products).orderBy(desc(products.createdAt));
  }

  async getProduct(id: string): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product || undefined;
  }

  async createProduct(insertProduct: InsertProduct): Promise<Product> {
    const [product] = await db.insert(products).values(insertProduct).returning();
    return product;
  }

  async deleteProduct(id: string): Promise<void> {
    await db.delete(products).where(eq(products.id, id));
  }

  // Repair Orders
  async listRepairOrders(filters?: { customerId?: string; resellerId?: string; repairCenterId?: string; status?: string }): Promise<RepairOrder[]> {
    let query = db.select().from(repairOrders);
    
    if (filters) {
      const conditions = [];
      if (filters.customerId) conditions.push(eq(repairOrders.customerId, filters.customerId));
      if (filters.resellerId) conditions.push(eq(repairOrders.resellerId, filters.resellerId));
      if (filters.repairCenterId) conditions.push(eq(repairOrders.repairCenterId, filters.repairCenterId));
      if (filters.status) conditions.push(eq(repairOrders.status, filters.status as any));
      
      if (conditions.length > 0) {
        query = query.where(and(...conditions)) as any;
      }
    }
    
    return await query.orderBy(desc(repairOrders.createdAt));
  }

  async getRepairOrder(id: string): Promise<RepairOrder | undefined> {
    const [order] = await db.select().from(repairOrders).where(eq(repairOrders.id, id));
    return order || undefined;
  }

  async createRepairOrder(insertOrder: InsertRepairOrder): Promise<RepairOrder> {
    // Generate order number
    const count = await db.select().from(repairOrders);
    const orderNumber = `ORD-${Date.now()}-${count.length + 1}`;
    
    const [order] = await db.insert(repairOrders).values({
      ...insertOrder,
      orderNumber,
    }).returning();
    return order;
  }

  async updateRepairOrderStatus(id: string, status: string): Promise<RepairOrder> {
    const [order] = await db.update(repairOrders)
      .set({ status: status as any, updatedAt: new Date() })
      .where(eq(repairOrders.id, id))
      .returning();
    return order;
  }

  // Tickets
  async listTickets(filters?: { customerId?: string; status?: string }): Promise<Ticket[]> {
    let query = db.select().from(tickets);
    
    if (filters) {
      const conditions = [];
      if (filters.customerId) conditions.push(eq(tickets.customerId, filters.customerId));
      if (filters.status) conditions.push(eq(tickets.status, filters.status as any));
      
      if (conditions.length > 0) {
        query = query.where(and(...conditions)) as any;
      }
    }
    
    return await query.orderBy(desc(tickets.createdAt));
  }

  async getTicket(id: string): Promise<Ticket | undefined> {
    const [ticket] = await db.select().from(tickets).where(eq(tickets.id, id));
    return ticket || undefined;
  }

  async createTicket(insertTicket: InsertTicket): Promise<Ticket> {
    // Generate ticket number
    const count = await db.select().from(tickets);
    const ticketNumber = `TKT-${Date.now()}-${count.length + 1}`;
    
    const [ticket] = await db.insert(tickets).values({
      ...insertTicket,
      ticketNumber,
    }).returning();
    return ticket;
  }

  async updateTicketStatus(id: string, status: string): Promise<Ticket> {
    const [ticket] = await db.update(tickets)
      .set({ status: status as any, updatedAt: new Date() })
      .where(eq(tickets.id, id))
      .returning();
    return ticket;
  }

  // Ticket Messages
  async listTicketMessages(ticketId: string): Promise<TicketMessage[]> {
    return await db.select().from(ticketMessages)
      .where(eq(ticketMessages.ticketId, ticketId))
      .orderBy(ticketMessages.createdAt);
  }

  async createTicketMessage(insertMessage: InsertTicketMessage): Promise<TicketMessage> {
    const [message] = await db.insert(ticketMessages).values(insertMessage).returning();
    return message;
  }

  // Invoices
  async listInvoices(): Promise<Invoice[]> {
    return await db.select().from(invoices).orderBy(desc(invoices.createdAt));
  }

  async getInvoice(id: string): Promise<Invoice | undefined> {
    const [invoice] = await db.select().from(invoices).where(eq(invoices.id, id));
    return invoice || undefined;
  }

  async createInvoice(insertInvoice: InsertInvoice): Promise<Invoice> {
    // Generate invoice number
    const count = await db.select().from(invoices);
    const invoiceNumber = `INV-${Date.now()}-${count.length + 1}`;
    
    const [invoice] = await db.insert(invoices).values({
      ...insertInvoice,
      invoiceNumber,
    }).returning();
    return invoice;
  }

  // Billing Data
  async getBillingDataByUserId(userId: string): Promise<BillingData | undefined> {
    const [data] = await db.select().from(billingData).where(eq(billingData.userId, userId));
    return data || undefined;
  }

  async createBillingData(insertData: InsertBillingData): Promise<BillingData> {
    const [data] = await db.insert(billingData).values(insertData).returning();
    return data;
  }

  // Chat Messages
  async listChatMessages(userId1: string, userId2: string): Promise<ChatMessage[]> {
    return await db.select().from(chatMessages)
      .where(
        or(
          and(eq(chatMessages.senderId, userId1), eq(chatMessages.receiverId, userId2)),
          and(eq(chatMessages.senderId, userId2), eq(chatMessages.receiverId, userId1))
        )
      )
      .orderBy(chatMessages.createdAt);
  }

  async createChatMessage(insertMessage: InsertChatMessage): Promise<ChatMessage> {
    const [message] = await db.insert(chatMessages).values(insertMessage).returning();
    return message;
  }

  // Inventory
  async listInventoryStock(repairCenterId?: string): Promise<InventoryStock[]> {
    let query = db.select().from(inventoryStock);
    
    if (repairCenterId) {
      query = query.where(eq(inventoryStock.repairCenterId, repairCenterId)) as any;
    }
    
    return await query;
  }

  async createInventoryMovement(insertMovement: InsertInventoryMovement): Promise<InventoryMovement> {
    const [movement] = await db.insert(inventoryMovements).values(insertMovement).returning();
    
    // Update stock
    const [existingStock] = await db.select().from(inventoryStock)
      .where(
        and(
          eq(inventoryStock.productId, insertMovement.productId),
          eq(inventoryStock.repairCenterId, insertMovement.repairCenterId)
        )
      );
    
    const quantityChange = insertMovement.movementType === "in" ? insertMovement.quantity :
                          insertMovement.movementType === "out" ? -insertMovement.quantity :
                          insertMovement.quantity;
    
    if (existingStock) {
      await db.update(inventoryStock)
        .set({
          quantity: existingStock.quantity + quantityChange,
          updatedAt: new Date()
        })
        .where(eq(inventoryStock.id, existingStock.id));
    } else {
      await db.insert(inventoryStock).values({
        productId: insertMovement.productId,
        repairCenterId: insertMovement.repairCenterId,
        quantity: Math.max(0, quantityChange),
      });
    }
    
    return movement;
  }

  // Activity Logs
  async createActivityLog(insertLog: InsertActivityLog): Promise<ActivityLog> {
    const [log] = await db.insert(activityLogs).values(insertLog).returning();
    return log;
  }

  async listActivityLogs(filters?: { userId?: string; action?: string; entityType?: string; startDate?: Date; endDate?: Date; limit?: number }): Promise<ActivityLog[]> {
    let query = db.select().from(activityLogs);
    
    const conditions = [];
    if (filters?.userId) {
      conditions.push(eq(activityLogs.userId, filters.userId));
    }
    if (filters?.action) {
      conditions.push(eq(activityLogs.action, filters.action));
    }
    if (filters?.entityType) {
      conditions.push(eq(activityLogs.entityType, filters.entityType));
    }
    if (filters?.startDate) {
      conditions.push(sql`${activityLogs.createdAt} >= ${filters.startDate}`);
    }
    if (filters?.endDate) {
      conditions.push(sql`${activityLogs.createdAt} <= ${filters.endDate}`);
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }
    
    query = query.orderBy(desc(activityLogs.createdAt)) as any;
    
    // Always apply limit (default 100 if not specified)
    const limit = filters?.limit ?? 100;
    query = query.limit(limit) as any;
    
    return await query;
  }

  async getActivityLog(id: string): Promise<ActivityLog | undefined> {
    const [log] = await db.select().from(activityLogs).where(eq(activityLogs.id, id));
    return log || undefined;
  }

  async purgeOldActivityLogs(retentionDays: number): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
    
    const deleted = await db.delete(activityLogs)
      .where(lt(activityLogs.createdAt, cutoffDate))
      .returning({ id: activityLogs.id });
    
    return deleted.length;
  }

  // Analytics & Cache
  async getCachedAnalytics(key: string): Promise<any | null> {
    const [cached] = await db.select().from(analyticsCache).where(eq(analyticsCache.key, key));
    
    if (!cached) return null;
    
    if (new Date() > new Date(cached.expiresAt)) {
      await db.delete(analyticsCache).where(eq(analyticsCache.key, key));
      return null;
    }
    
    return JSON.parse(cached.data);
  }

  async setCachedAnalytics(key: string, data: any, expiresAt: Date): Promise<void> {
    const existing = await db.select().from(analyticsCache).where(eq(analyticsCache.key, key));
    
    if (existing.length > 0) {
      await db.update(analyticsCache)
        .set({ data: JSON.stringify(data), expiresAt, createdAt: new Date() })
        .where(eq(analyticsCache.key, key));
    } else {
      await db.insert(analyticsCache).values({
        key,
        data: JSON.stringify(data),
        expiresAt,
      });
    }
  }

  async invalidateCache(pattern: string): Promise<void> {
    await db.delete(analyticsCache).where(sql`${analyticsCache.key} LIKE ${pattern}`);
  }

  async getRevenueByPeriod(startDate: Date, endDate: Date, groupBy: 'day' | 'week' | 'month'): Promise<any[]> {
    const dateFormat = groupBy === 'day' ? 'YYYY-MM-DD' :
                       groupBy === 'week' ? 'YYYY-"W"IW' :
                       'YYYY-MM';
    
    const result = await db.execute(sql`
      SELECT 
        TO_CHAR(created_at, ${dateFormat}) as period,
        SUM(total) as revenue,
        COUNT(*) as invoice_count
      FROM ${invoices}
      WHERE created_at >= ${startDate}
        AND created_at <= ${endDate}
        AND payment_status = 'paid'
      GROUP BY period
      ORDER BY period
    `);
    
    return result.rows.map((row: any) => ({
      period: row.period,
      revenue: parseInt(row.revenue) || 0,
      invoiceCount: parseInt(row.invoice_count) || 0,
    }));
  }

  async getRepairCenterPerformance(centerId?: string, period?: { start: Date; end: Date }): Promise<any> {
    const conditions = [];
    
    if (centerId) {
      conditions.push(sql`repair_center_id = ${centerId}`);
    }
    if (period) {
      conditions.push(sql`created_at >= ${period.start}`);
      conditions.push(sql`created_at <= ${period.end}`);
    }
    
    const whereClause = conditions.length > 0 ? sql`WHERE ${sql.join(conditions, sql` AND `)}` : sql``;
    
    const result = await db.execute(sql`
      SELECT 
        repair_center_id,
        COUNT(*) as total_repairs,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_repairs,
        COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_repairs,
        AVG(EXTRACT(EPOCH FROM (updated_at - created_at)) / 86400) as avg_days,
        SUM(final_cost) as total_revenue
      FROM ${repairOrders}
      ${whereClause}
      GROUP BY repair_center_id
      ORDER BY total_repairs DESC
    `);
    
    return result.rows.map((row: any) => ({
      repairCenterId: row.repair_center_id,
      totalRepairs: parseInt(row.total_repairs) || 0,
      completedRepairs: parseInt(row.completed_repairs) || 0,
      cancelledRepairs: parseInt(row.cancelled_repairs) || 0,
      avgRepairDays: parseFloat(row.avg_days) || 0,
      successRate: row.total_repairs > 0 ? (parseInt(row.completed_repairs) / parseInt(row.total_repairs)) * 100 : 0,
      totalRevenue: parseInt(row.total_revenue) || 0,
    }));
  }

  async getTopProducts(limit: number, period?: { start: Date; end: Date }): Promise<any[]> {
    const conditions = [];
    
    if (period) {
      conditions.push(sql`im.created_at >= ${period.start}`);
      conditions.push(sql`im.created_at <= ${period.end}`);
    }
    
    const whereClause = conditions.length > 0 ? sql`WHERE ${sql.join(conditions, sql` AND `)}` : sql``;
    
    const result = await db.execute(sql`
      SELECT 
        p.id,
        p.name,
        p.sku,
        p.category,
        SUM(CASE WHEN im.movement_type = 'out' THEN im.quantity ELSE 0 END) as usage_count,
        SUM(CASE WHEN im.movement_type = 'in' THEN im.quantity ELSE 0 END) as stock_in,
        COUNT(DISTINCT im.repair_center_id) as centers_count
      FROM ${products} p
      LEFT JOIN ${inventoryMovements} im ON p.id = im.product_id
      ${whereClause}
      GROUP BY p.id, p.name, p.sku, p.category
      ORDER BY usage_count DESC
      LIMIT ${limit}
    `);
    
    return result.rows.map((row: any) => ({
      id: row.id,
      name: row.name,
      sku: row.sku,
      category: row.category,
      usageCount: parseInt(row.usage_count) || 0,
      stockIn: parseInt(row.stock_in) || 0,
      centersCount: parseInt(row.centers_count) || 0,
    }));
  }

  async getOverviewKPIs(period?: { start: Date; end: Date }): Promise<any> {
    const conditions = period ? 
      sql`WHERE created_at >= ${period.start} AND created_at <= ${period.end}` : 
      sql``;
    
    const revenueResult = await db.execute(sql`
      SELECT 
        SUM(total) as total_revenue,
        COUNT(*) as paid_invoices
      FROM ${invoices}
      ${conditions}
      ${period ? sql`AND` : sql`WHERE`} payment_status = 'paid'
    `);
    
    const repairsResult = await db.execute(sql`
      SELECT 
        COUNT(*) as total_repairs,
        COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as active_repairs,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_repairs,
        AVG(EXTRACT(EPOCH FROM (updated_at - created_at)) / 86400) as avg_repair_time
      FROM ${repairOrders}
      ${conditions}
    `);
    
    const ticketsResult = await db.execute(sql`
      SELECT 
        COUNT(*) as total_tickets,
        COUNT(CASE WHEN status = 'open' THEN 1 END) as open_tickets
      FROM ${tickets}
      ${conditions}
    `);
    
    const revenue = revenueResult.rows[0] as any;
    const repairs = repairsResult.rows[0] as any;
    const ticketsData = ticketsResult.rows[0] as any;
    
    return {
      totalRevenue: parseInt(revenue?.total_revenue as string) || 0,
      paidInvoices: parseInt(revenue?.paid_invoices as string) || 0,
      totalRepairs: parseInt(repairs?.total_repairs as string) || 0,
      activeRepairs: parseInt(repairs?.active_repairs as string) || 0,
      completedRepairs: parseInt(repairs?.completed_repairs as string) || 0,
      avgRepairTime: parseFloat(repairs?.avg_repair_time as string) || 0,
      totalTickets: parseInt(ticketsData?.total_tickets as string) || 0,
      openTickets: parseInt(ticketsData?.open_tickets as string) || 0,
    };
  }

  async createNotification(insertNotification: InsertNotification): Promise<Notification> {
    const [notification] = await db.insert(notifications).values(insertNotification).returning();
    return notification;
  }

  async listNotifications(userId: string, filters?: { isRead?: boolean; limit?: number }): Promise<Notification[]> {
    const conditions = filters?.isRead !== undefined
      ? and(eq(notifications.userId, userId), eq(notifications.isRead, filters.isRead))
      : eq(notifications.userId, userId);
    
    let query = db.select().from(notifications).where(conditions);
    
    query = query.orderBy(desc(notifications.createdAt)) as any;
    
    if (filters?.limit) {
      query = query.limit(filters.limit) as any;
    }
    
    return await query;
  }

  async markNotificationAsRead(id: string, userId: string): Promise<Notification> {
    const [notification] = await db
      .update(notifications)
      .set({ isRead: true })
      .where(and(eq(notifications.id, id), eq(notifications.userId, userId)))
      .returning();
    if (!notification) {
      throw new Error("Notification not found or access denied");
    }
    return notification;
  }

  async getNotificationPreferences(userId: string): Promise<NotificationPreferences | undefined> {
    const [preferences] = await db
      .select()
      .from(notificationPreferences)
      .where(eq(notificationPreferences.userId, userId));
    return preferences || undefined;
  }

  async createNotificationPreferences(insertPreferences: InsertNotificationPreferences): Promise<NotificationPreferences> {
    const [preferences] = await db
      .insert(notificationPreferences)
      .values(insertPreferences)
      .returning();
    return preferences;
  }

  async updateNotificationPreferences(userId: string, updates: { emailEnabled?: boolean; pushEnabled?: boolean; types?: string[] }): Promise<NotificationPreferences> {
    const allowedFields: { emailEnabled?: boolean; pushEnabled?: boolean; types?: string[]; updatedAt: Date } = {
      updatedAt: new Date()
    };
    
    if (updates.emailEnabled !== undefined) {
      allowedFields.emailEnabled = updates.emailEnabled;
    }
    if (updates.pushEnabled !== undefined) {
      allowedFields.pushEnabled = updates.pushEnabled;
    }
    if (updates.types !== undefined) {
      allowedFields.types = updates.types;
    }
    
    if (Object.keys(allowedFields).length === 1) {
      throw new Error("No valid fields to update");
    }
    
    const [preferences] = await db
      .update(notificationPreferences)
      .set(allowedFields)
      .where(eq(notificationPreferences.userId, userId))
      .returning();
    
    if (!preferences) {
      throw new Error("Notification preferences not found");
    }
    
    return preferences;
  }

  // Repair Attachments
  async addRepairAttachment(insertAttachment: InsertRepairAttachment): Promise<RepairAttachment> {
    const [attachment] = await db.insert(repairAttachments).values(insertAttachment).returning();
    return attachment;
  }

  async listRepairAttachments(repairOrderId: string): Promise<RepairAttachment[]> {
    return await db.select().from(repairAttachments)
      .where(eq(repairAttachments.repairOrderId, repairOrderId))
      .orderBy(desc(repairAttachments.uploadedAt));
  }

  async getRepairAttachment(id: string): Promise<RepairAttachment | undefined> {
    const [attachment] = await db.select().from(repairAttachments).where(eq(repairAttachments.id, id));
    return attachment || undefined;
  }

  async deleteRepairAttachment(id: string): Promise<void> {
    await db.delete(repairAttachments).where(eq(repairAttachments.id, id));
  }
}

export const storage = new DatabaseStorage();
