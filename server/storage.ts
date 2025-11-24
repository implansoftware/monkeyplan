import {
  User, InsertUser, RepairCenter, InsertRepairCenter, Product, InsertProduct,
  RepairOrder, InsertRepairOrder, Ticket, InsertTicket, TicketMessage, InsertTicketMessage,
  Invoice, InsertInvoice, BillingData, InsertBillingData, ChatMessage, InsertChatMessage,
  InventoryMovement, InsertInventoryMovement, InventoryStock, ActivityLog, InsertActivityLog,
  users, repairCenters, products, repairOrders, tickets, ticketMessages,
  invoices, billingData, chatMessages, inventoryMovements, inventoryStock, activityLogs
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
}

export const storage = new DatabaseStorage();
