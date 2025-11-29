import {
  User, InsertUser, RepairCenter, InsertRepairCenter, Product, InsertProduct,
  RepairOrder, InsertRepairOrder, Ticket, InsertTicket, TicketMessage, InsertTicketMessage,
  Invoice, InsertInvoice, BillingData, InsertBillingData, ChatMessage, InsertChatMessage,
  InventoryMovement, InsertInventoryMovement, InventoryStock, ActivityLog, InsertActivityLog,
  AnalyticsCache, InsertAnalyticsCache, Notification, InsertNotification,
  NotificationPreferences, InsertNotificationPreferences, RepairAttachment, InsertRepairAttachment,
  RepairAcceptance, InsertRepairAcceptance, RepairDiagnostics, InsertRepairDiagnostics,
  RepairQuote, InsertRepairQuote,
  DeviceType, InsertDeviceType, DeviceBrand, InsertDeviceBrand, DeviceModel, InsertDeviceModel,
  IssueType, InsertIssueType, AestheticDefect, InsertAestheticDefect, AccessoryType, InsertAccessoryType,
  DiagnosticFinding, DamagedComponentType, EstimatedRepairTime,
  PartsOrder, InsertPartsOrder, RepairLog, InsertRepairLog,
  RepairTestChecklist, InsertRepairTestChecklist, RepairDelivery, InsertRepairDelivery,
  AdminSetting, InsertAdminSetting,
  Promotion, InsertPromotion, UnrepairableReason, InsertUnrepairableReason,
  ExternalLab, InsertExternalLab, DataRecoveryJob, InsertDataRecoveryJob, DataRecoveryEvent, InsertDataRecoveryEvent,
  CreateDataRecoveryJob, UpdateDataRecoveryJob,
  Supplier, InsertSupplier, ProductSupplier, InsertProductSupplier,
  SupplierOrder, InsertSupplierOrder, SupplierOrderItem, InsertSupplierOrderItem,
  SupplierReturn, InsertSupplierReturn, SupplierReturnItem, InsertSupplierReturnItem,
  SupplierCommunicationLog, InsertSupplierCommunicationLog,
  PartsLoadDocument, InsertPartsLoadDocument, PartsLoadItem, InsertPartsLoadItem,
  RepairOrderStateHistory, InsertRepairOrderStateHistory,
  SupplierReturnStateHistory, InsertSupplierReturnStateHistory,
  SlaThresholds, slaThresholdsSchema,
  users, repairCenters, products, repairOrders, tickets, ticketMessages,
  invoices, billingData, chatMessages, inventoryMovements, inventoryStock, activityLogs, analyticsCache,
  notifications, notificationPreferences, repairAttachments, repairAcceptance, repairDiagnostics,
  repairQuotes, partsOrders, repairLogs, repairTestChecklist, repairDelivery,
  deviceTypes, deviceBrands, deviceModels, issueTypes, aestheticDefects, accessoryTypes,
  diagnosticFindings, damagedComponentTypes, estimatedRepairTimes, adminSettings,
  promotions, unrepairableReasons, externalLabs, dataRecoveryJobs, dataRecoveryEvents,
  suppliers, productSuppliers, supplierOrders, supplierOrderItems, supplierReturns, supplierReturnItems, supplierCommunicationLogs,
  partsLoadDocuments, partsLoadItems,
  repairOrderStateHistory, supplierReturnStateHistory
} from "@shared/schema";
import { db, pool } from "./db";
import { eq, and, or, desc, lt, sql, not } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  // Auth & User management
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<Pick<User, 'username' | 'email' | 'fullName' | 'role' | 'isActive' | 'repairCenterId'>>): Promise<User>;
  listUsers(): Promise<User[]>;
  listStaffUsers(): Promise<{ id: string; username: string; role: string }[]>;
  deleteUser(id: string): Promise<void>;
  createCustomerWithBilling(userData: InsertUser, billingInfo: InsertBillingData): Promise<{ user: User; billing: BillingData }>;
  
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
  createRepairWithAcceptance(order: InsertRepairOrder, acceptance: InsertRepairAcceptance): Promise<{ order: RepairOrder; acceptance: RepairAcceptance }>;
  updateRepairOrder(id: string, updates: Partial<Pick<RepairOrder, 'status' | 'priority' | 'estimatedCost' | 'finalCost' | 'notes' | 'repairCenterId' | 'quoteBypassReason' | 'quoteBypassedAt'>>): Promise<RepairOrder>;
  updateRepairOrderStatus(id: string, status: string, changedBy?: string): Promise<RepairOrder>;
  checkImeiSerialDuplicate(imei?: string, serial?: string, excludeId?: string): Promise<RepairOrder | undefined>;
  
  // Tickets
  listTickets(filters?: { customerId?: string; assignedTo?: string; status?: string }): Promise<Ticket[]>;
  getTicket(id: string): Promise<Ticket | undefined>;
  createTicket(ticket: InsertTicket): Promise<Ticket>;
  updateTicketStatus(id: string, status: string): Promise<Ticket>;
  assignTicket(id: string, assignedTo: string | null): Promise<Ticket>;
  updateTicketPriority(id: string, priority: string): Promise<Ticket>;
  
  // Ticket Messages
  listTicketMessages(ticketId: string): Promise<TicketMessage[]>;
  createTicketMessage(message: InsertTicketMessage): Promise<TicketMessage>;
  
  // Invoices
  listInvoices(filters?: { customerId?: string; paymentStatus?: string }): Promise<Invoice[]>;
  getInvoice(id: string): Promise<Invoice | undefined>;
  createInvoice(invoice: InsertInvoice): Promise<Invoice>;
  updateInvoice(id: string, updates: Partial<Pick<Invoice, 'paymentStatus' | 'paidDate' | 'notes' | 'paymentMethod'>>): Promise<Invoice>;
  
  // Billing Data
  getBillingDataByUserId(userId: string): Promise<BillingData | undefined>;
  createBillingData(data: InsertBillingData): Promise<BillingData>;
  
  // Chat Messages
  listChatMessages(userId1: string, userId2: string): Promise<ChatMessage[]>;
  createChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
  
  // Inventory
  listInventoryStock(repairCenterId?: string): Promise<InventoryStock[]>;
  getInventoryStock(productId: string, repairCenterId: string): Promise<InventoryStock | undefined>;
  createInventoryMovement(movement: InsertInventoryMovement): Promise<InventoryMovement>;
  listInventoryMovements(filters?: { repairCenterId?: string; productId?: string }): Promise<InventoryMovement[]>;
  getProductStockByCenter(productId: string): Promise<Array<{ repairCenterId: string; repairCenterName: string; quantity: number }>>;
  getAllProductsWithStock(): Promise<Array<{ product: Product; stockByCenter: Array<{ repairCenterId: string; repairCenterName: string; quantity: number }>; totalStock: number }>>;
  updateProduct(id: string, updates: Partial<Omit<Product, 'id' | 'createdAt'>>): Promise<Product>;
  
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
  
  // Repair Acceptance
  getRepairAcceptance(repairOrderId: string): Promise<RepairAcceptance | undefined>;
  
  // Repair Diagnostics
  createRepairDiagnostics(diagnostics: InsertRepairDiagnostics): Promise<RepairDiagnostics>;
  updateRepairDiagnostics(repairOrderId: string, updates: Partial<Omit<InsertRepairDiagnostics, 'repairOrderId' | 'diagnosedBy'>>): Promise<RepairDiagnostics>;
  getRepairDiagnostics(repairOrderId: string): Promise<RepairDiagnostics | undefined>;
  listAllDiagnostics(filters?: { userId?: string; role?: string; search?: string; dateFrom?: string; dateTo?: string }): Promise<any[]>;
  
  // Repair Quotes
  createRepairQuote(quote: InsertRepairQuote): Promise<RepairQuote>;
  updateRepairQuote(repairOrderId: string, updates: Partial<Omit<InsertRepairQuote, 'repairOrderId' | 'quoteNumber' | 'createdBy'>>): Promise<RepairQuote>;
  getRepairQuote(repairOrderId: string): Promise<RepairQuote | undefined>;
  updateQuoteStatus(repairOrderId: string, status: string): Promise<RepairQuote>;
  listAllQuotes(filters?: { userId?: string; role?: string; status?: string; search?: string; dateFrom?: string; dateTo?: string }): Promise<any[]>;
  
  // Device Types (Admin-managed categories)
  listDeviceTypes(activeOnly?: boolean): Promise<DeviceType[]>;
  getDeviceType(id: string): Promise<DeviceType | undefined>;
  createDeviceType(deviceType: InsertDeviceType): Promise<DeviceType>;
  updateDeviceType(id: string, updates: Partial<InsertDeviceType>): Promise<DeviceType>;
  deleteDeviceType(id: string): Promise<void>;
  
  // Device Brands (Admin-managed brands)
  listDeviceBrands(activeOnly?: boolean): Promise<DeviceBrand[]>;
  getDeviceBrand(id: string): Promise<DeviceBrand | undefined>;
  createDeviceBrand(deviceBrand: InsertDeviceBrand): Promise<DeviceBrand>;
  updateDeviceBrand(id: string, updates: Partial<InsertDeviceBrand>): Promise<DeviceBrand>;
  deleteDeviceBrand(id: string): Promise<void>;
  
  // Issue Types (Predefined problems per device type)
  listIssueTypes(deviceTypeId?: string, activeOnly?: boolean): Promise<IssueType[]>;
  
  // Aesthetic Defects (Predefined defects per device type)
  listAestheticDefects(deviceTypeId?: string, activeOnly?: boolean): Promise<AestheticDefect[]>;
  
  // Accessory Types (Predefined accessories per device type)
  listAccessoryTypes(deviceTypeId?: string, activeOnly?: boolean): Promise<AccessoryType[]>;
  
  // Diagnostic Findings (Predefined diagnostic results per device type)
  listDiagnosticFindings(deviceTypeId?: string, activeOnly?: boolean): Promise<DiagnosticFinding[]>;
  
  // Damaged Component Types (Predefined damaged components per device type)
  listDamagedComponentTypes(deviceTypeId?: string, activeOnly?: boolean): Promise<DamagedComponentType[]>;
  
  // Estimated Repair Times (Predefined repair time ranges)
  listEstimatedRepairTimes(deviceTypeId?: string, activeOnly?: boolean): Promise<EstimatedRepairTime[]>;
  
  // Device Models (Cascading dropdown catalog)
  listDeviceModels(filters?: { typeId?: string; brandId?: string; activeOnly?: boolean }): Promise<DeviceModel[]>;
  getDeviceModel(id: string): Promise<DeviceModel | undefined>;
  
  // Parts Orders (FASE 5)
  createPartsOrder(order: InsertPartsOrder): Promise<PartsOrder>;
  listPartsOrders(repairOrderId: string): Promise<PartsOrder[]>;
  listAllPartsOrders(filters?: { repairCenterId?: string; status?: string }): Promise<any[]>;
  getPartsOrder(id: string): Promise<PartsOrder | undefined>;
  updatePartsOrderStatus(id: string, status: string, receivedAt?: Date): Promise<PartsOrder>;
  
  // Repair Logs (FASE 6)
  createRepairLog(log: InsertRepairLog): Promise<RepairLog>;
  listRepairLogs(repairOrderId: string): Promise<RepairLog[]>;
  
  // Test Checklist (FASE 7)
  createTestChecklist(checklist: InsertRepairTestChecklist): Promise<RepairTestChecklist>;
  getTestChecklist(repairOrderId: string): Promise<RepairTestChecklist | undefined>;
  updateTestChecklist(repairOrderId: string, updates: Partial<Omit<InsertRepairTestChecklist, 'repairOrderId' | 'testedBy'>>): Promise<RepairTestChecklist>;
  
  // Delivery (FASE 7)
  createDelivery(delivery: InsertRepairDelivery): Promise<RepairDelivery>;
  getDelivery(repairOrderId: string): Promise<RepairDelivery | undefined>;
  
  // Admin Settings
  getAdminSetting(key: string): Promise<AdminSetting | undefined>;
  setAdminSetting(key: string, value: string, description?: string, updatedBy?: string): Promise<AdminSetting>;
  listAdminSettings(): Promise<AdminSetting[]>;
  
  // Promotions (for "Non Conveniente" diagnosis outcome)
  listPromotions(activeOnly?: boolean): Promise<Promotion[]>;
  getPromotion(id: string): Promise<Promotion | undefined>;
  createPromotion(promotion: InsertPromotion): Promise<Promotion>;
  updatePromotion(id: string, updates: Partial<InsertPromotion>): Promise<Promotion>;
  deletePromotion(id: string): Promise<void>;
  
  // Unrepairable Reasons (for "Irriparabile" diagnosis outcome)
  listUnrepairableReasons(deviceTypeId?: string, activeOnly?: boolean): Promise<UnrepairableReason[]>;
  getUnrepairableReason(id: string): Promise<UnrepairableReason | undefined>;
  createUnrepairableReason(reason: InsertUnrepairableReason): Promise<UnrepairableReason>;
  updateUnrepairableReason(id: string, updates: Partial<InsertUnrepairableReason>): Promise<UnrepairableReason>;
  deleteUnrepairableReason(id: string): Promise<void>;
  
  // External Labs (Laboratori esterni per recupero dati)
  listExternalLabs(activeOnly?: boolean): Promise<ExternalLab[]>;
  getExternalLab(id: string): Promise<ExternalLab | undefined>;
  createExternalLab(lab: InsertExternalLab): Promise<ExternalLab>;
  updateExternalLab(id: string, updates: Partial<InsertExternalLab>): Promise<ExternalLab>;
  deleteExternalLab(id: string): Promise<void>;
  
  // Data Recovery Jobs
  createDataRecoveryJob(job: CreateDataRecoveryJob, createdBy: string): Promise<DataRecoveryJob>;
  getDataRecoveryJob(id: string): Promise<DataRecoveryJob | undefined>;
  listDataRecoveryJobs(filters?: { repairOrderId?: string; status?: string; handlingType?: string }): Promise<DataRecoveryJob[]>;
  updateDataRecoveryJob(id: string, updates: UpdateDataRecoveryJob): Promise<DataRecoveryJob>;
  getDataRecoveryJobByRepairOrderId(repairOrderId: string): Promise<DataRecoveryJob | undefined>;
  
  // Data Recovery Events
  createDataRecoveryEvent(event: InsertDataRecoveryEvent): Promise<DataRecoveryEvent>;
  listDataRecoveryEvents(jobId: string): Promise<DataRecoveryEvent[]>;
  
  // Suppliers (Fornitori)
  listSuppliers(activeOnly?: boolean): Promise<Supplier[]>;
  getSupplier(id: string): Promise<Supplier | undefined>;
  getSupplierByCode(code: string): Promise<Supplier | undefined>;
  createSupplier(supplier: InsertSupplier): Promise<Supplier>;
  updateSupplier(id: string, updates: Partial<InsertSupplier>): Promise<Supplier>;
  deleteSupplier(id: string): Promise<void>;
  
  // Product Suppliers (Relazione prodotti-fornitori)
  listProductSuppliers(productId: string): Promise<ProductSupplier[]>;
  listSupplierProducts(supplierId: string): Promise<ProductSupplier[]>;
  getProductSupplier(id: string): Promise<ProductSupplier | undefined>;
  createProductSupplier(productSupplier: InsertProductSupplier): Promise<ProductSupplier>;
  updateProductSupplier(id: string, updates: Partial<InsertProductSupplier>): Promise<ProductSupplier>;
  deleteProductSupplier(id: string): Promise<void>;
  setPreferredSupplier(productId: string, supplierId: string): Promise<void>;
  
  // Supplier Orders (Ordini fornitori)
  listSupplierOrders(filters?: { supplierId?: string; repairCenterId?: string; status?: string }): Promise<SupplierOrder[]>;
  getSupplierOrder(id: string): Promise<SupplierOrder | undefined>;
  createSupplierOrder(order: InsertSupplierOrder): Promise<SupplierOrder>;
  updateSupplierOrder(id: string, updates: Partial<Omit<InsertSupplierOrder, 'orderNumber' | 'createdBy'>>): Promise<SupplierOrder>;
  updateSupplierOrderStatus(id: string, status: string): Promise<SupplierOrder>;
  
  // Supplier Order Items (Righe ordine)
  listSupplierOrderItems(orderId: string): Promise<SupplierOrderItem[]>;
  createSupplierOrderItem(item: InsertSupplierOrderItem): Promise<SupplierOrderItem>;
  updateSupplierOrderItem(id: string, updates: Partial<InsertSupplierOrderItem>): Promise<SupplierOrderItem>;
  deleteSupplierOrderItem(id: string): Promise<void>;
  updateSupplierOrderItemReceived(id: string, quantityReceived: number): Promise<SupplierOrderItem>;
  
  // Supplier Returns (Resi fornitori)
  listSupplierReturns(filters?: { supplierId?: string; repairCenterId?: string; status?: string }): Promise<SupplierReturn[]>;
  getSupplierReturn(id: string): Promise<SupplierReturn | undefined>;
  createSupplierReturn(returnData: InsertSupplierReturn): Promise<SupplierReturn>;
  updateSupplierReturn(id: string, updates: Partial<Omit<InsertSupplierReturn, 'returnNumber' | 'createdBy'>>): Promise<SupplierReturn>;
  updateSupplierReturnStatus(id: string, status: string, changedBy?: string): Promise<SupplierReturn>;
  
  // Supplier Return Items (Righe reso)
  listSupplierReturnItems(returnId: string): Promise<SupplierReturnItem[]>;
  createSupplierReturnItem(item: InsertSupplierReturnItem): Promise<SupplierReturnItem>;
  deleteSupplierReturnItem(id: string): Promise<void>;
  
  // Communication Logs (Log comunicazioni)
  listSupplierCommunicationLogs(filters?: { supplierId?: string; entityType?: string; entityId?: string }): Promise<SupplierCommunicationLog[]>;
  createSupplierCommunicationLog(log: InsertSupplierCommunicationLog): Promise<SupplierCommunicationLog>;
  updateSupplierCommunicationLog(id: string, updates: Partial<InsertSupplierCommunicationLog>): Promise<SupplierCommunicationLog>;
  
  // Parts Load Documents (Carico Ricambi)
  listPartsLoadDocuments(filters?: { repairCenterId?: string; supplierId?: string; status?: string }): Promise<PartsLoadDocument[]>;
  getPartsLoadDocument(id: string): Promise<PartsLoadDocument | undefined>;
  createPartsLoadDocument(doc: InsertPartsLoadDocument): Promise<PartsLoadDocument>;
  updatePartsLoadDocument(id: string, updates: Partial<InsertPartsLoadDocument>): Promise<PartsLoadDocument>;
  processPartsLoadDocument(id: string): Promise<{ matched: number; stock: number; errors: number }>;
  
  // Parts Load Items
  listPartsLoadItems(documentId: string): Promise<PartsLoadItem[]>;
  getPartsLoadItem(id: string): Promise<PartsLoadItem | undefined>;
  createPartsLoadItem(item: InsertPartsLoadItem): Promise<PartsLoadItem>;
  updatePartsLoadItem(id: string, updates: Partial<InsertPartsLoadItem>): Promise<PartsLoadItem>;
  deletePartsLoadItem(id: string): Promise<void>;
  matchPartsLoadItem(id: string, partsOrderId?: string, productId?: string): Promise<PartsLoadItem>;
  
  // SLA State History
  listRepairOrderStateHistory(repairOrderId: string): Promise<RepairOrderStateHistory[]>;
  createRepairOrderStateHistory(history: InsertRepairOrderStateHistory): Promise<RepairOrderStateHistory>;
  closeRepairOrderStateHistory(repairOrderId: string, changedBy?: string): Promise<void>;
  getCurrentRepairOrderState(repairOrderId: string): Promise<RepairOrderStateHistory | undefined>;
  
  listSupplierReturnStateHistory(supplierReturnId: string): Promise<SupplierReturnStateHistory[]>;
  createSupplierReturnStateHistory(history: InsertSupplierReturnStateHistory): Promise<SupplierReturnStateHistory>;
  closeSupplierReturnStateHistory(supplierReturnId: string, changedBy?: string): Promise<void>;
  getCurrentSupplierReturnState(supplierReturnId: string): Promise<SupplierReturnStateHistory | undefined>;
  
  // SLA Thresholds
  getSlaThresholds(): Promise<SlaThresholds>;
  updateSlaThresholds(thresholds: SlaThresholds, updatedBy: string): Promise<void>;
  
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

  async updateUser(id: string, updates: Partial<Pick<User, 'username' | 'email' | 'fullName' | 'role' | 'isActive' | 'repairCenterId'>>): Promise<User> {
    const [user] = await db.update(users)
      .set(updates)
      .where(eq(users.id, id))
      .returning();
    
    if (!user) {
      throw new Error("User not found");
    }
    
    return user;
  }

  async createCustomerWithBilling(userData: InsertUser, billingInfo: InsertBillingData): Promise<{ user: User; billing: BillingData }> {
    return await db.transaction(async (tx) => {
      // Create user first
      const [user] = await tx.insert(users).values(userData).returning();
      
      // Create billing data with user ID
      const [billing] = await tx.insert(billingData).values({
        ...billingInfo,
        userId: user.id,
      }).returning();
      
      return { user, billing };
    });
  }

  async listUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }

  async listStaffUsers(): Promise<{ id: string; username: string; role: string }[]> {
    const staffUsers = await db
      .select({
        id: users.id,
        username: users.username,
        role: users.role,
      })
      .from(users)
      .where(
        or(
          eq(users.role, 'admin'),
          eq(users.role, 'reseller'),
          eq(users.role, 'repair_center')
        )
      )
      .orderBy(users.username);
    
    return staffUsers;
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
    
    // Create initial state history entry
    await this.createRepairOrderStateHistory({
      repairOrderId: order.id,
      status: order.status as any,
      enteredAt: new Date(),
    });
    
    return order;
  }

  async createRepairWithAcceptance(
    insertOrder: InsertRepairOrder,
    insertAcceptance: InsertRepairAcceptance
  ): Promise<{ order: RepairOrder; acceptance: RepairAcceptance }> {
    // Use transaction to ensure atomicity
    const result = await db.transaction(async (tx) => {
      // Generate order number
      const count = await tx.select().from(repairOrders);
      const orderNumber = `ORD-${Date.now()}-${count.length + 1}`;
      
      // Create repair order with 'ingressato' status
      const [order] = await tx.insert(repairOrders).values({
        ...insertOrder,
        orderNumber,
        status: 'ingressato' as any,
        ingressatoAt: new Date(),
      }).returning();
      
      // Create acceptance record linked to the repair order
      const [acceptance] = await tx.insert(repairAcceptance).values({
        ...insertAcceptance,
        repairOrderId: order.id,
      }).returning();
      
      return { order, acceptance };
    });
    
    // Create initial state history entry (outside transaction to use class method)
    await this.createRepairOrderStateHistory({
      repairOrderId: result.order.id,
      status: 'ingressato' as any,
      enteredAt: new Date(),
    });
    
    return result;
  }

  async updateRepairOrderStatus(id: string, status: string, changedBy?: string): Promise<RepairOrder> {
    // Close the current state history entry
    await this.closeRepairOrderStateHistory(id, changedBy);
    
    // Update the repair order
    const [order] = await db.update(repairOrders)
      .set({ status: status as any, updatedAt: new Date() })
      .where(eq(repairOrders.id, id))
      .returning();
    
    // Create a new state history entry for the new status
    await this.createRepairOrderStateHistory({
      repairOrderId: id,
      status: status as any,
      enteredAt: new Date(),
      changedBy,
    });
    
    return order;
  }

  async updateRepairOrder(id: string, updates: Partial<Pick<RepairOrder, 'status' | 'priority' | 'estimatedCost' | 'finalCost' | 'notes' | 'repairCenterId' | 'quoteBypassReason' | 'quoteBypassedAt'>>): Promise<RepairOrder> {
    const [order] = await db.update(repairOrders)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(repairOrders.id, id))
      .returning();
    return order;
  }

  async checkImeiSerialDuplicate(imei?: string, serial?: string, excludeId?: string): Promise<RepairOrder | undefined> {
    // If neither IMEI nor serial provided, nothing to check
    if (!imei && !serial) return undefined;

    // Build the identifier condition (IMEI OR Serial)
    let identifierCondition;
    if (imei && serial) {
      // Both provided: use OR
      identifierCondition = or(eq(repairOrders.imei, imei), eq(repairOrders.serial, serial));
    } else if (imei) {
      // Only IMEI provided
      identifierCondition = eq(repairOrders.imei, imei);
    } else {
      // Only serial provided
      identifierCondition = eq(repairOrders.serial, serial!);
    }

    // Query for existing repair orders with same IMEI or Serial
    // Exclude delivered/cancelled orders (those are closed/completed)
    const results = await db.select().from(repairOrders)
      .where(
        and(
          identifierCondition,
          not(eq(repairOrders.status, 'consegnato' as any)),
          not(eq(repairOrders.status, 'cancelled' as any))
        )
      );

    // Filter out the excluded ID if provided
    const filtered = excludeId 
      ? results.filter(r => r.id !== excludeId)
      : results;

    return filtered[0];
  }

  // Tickets
  async listTickets(filters?: { customerId?: string; assignedTo?: string; status?: string }): Promise<Ticket[]> {
    let query = db.select().from(tickets);
    
    if (filters) {
      const conditions = [];
      if (filters.customerId) conditions.push(eq(tickets.customerId, filters.customerId));
      if (filters.assignedTo) conditions.push(eq(tickets.assignedTo, filters.assignedTo));
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

  async assignTicket(id: string, assignedTo: string | null): Promise<Ticket> {
    const [ticket] = await db.update(tickets)
      .set({ assignedTo, updatedAt: new Date() })
      .where(eq(tickets.id, id))
      .returning();
    return ticket;
  }

  async updateTicketPriority(id: string, priority: string): Promise<Ticket> {
    const [ticket] = await db.update(tickets)
      .set({ priority: priority as any, updatedAt: new Date() })
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
  async listInvoices(filters?: { customerId?: string; paymentStatus?: string }): Promise<Invoice[]> {
    const conditions = [];
    
    if (filters?.customerId) {
      conditions.push(eq(invoices.customerId, filters.customerId));
    }
    if (filters?.paymentStatus) {
      conditions.push(eq(invoices.paymentStatus, filters.paymentStatus as any));
    }
    
    let query = db.select().from(invoices);
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }
    
    return await query.orderBy(desc(invoices.createdAt));
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

  async updateInvoice(id: string, updates: Partial<Pick<Invoice, 'paymentStatus' | 'paidDate' | 'notes' | 'paymentMethod'>>): Promise<Invoice> {
    const [invoice] = await db.update(invoices)
      .set(updates)
      .where(eq(invoices.id, id))
      .returning();
    
    if (!invoice) {
      throw new Error("Invoice not found");
    }
    
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

  async getInventoryStock(productId: string, repairCenterId: string): Promise<InventoryStock | undefined> {
    const [stock] = await db.select().from(inventoryStock)
      .where(
        and(
          eq(inventoryStock.productId, productId),
          eq(inventoryStock.repairCenterId, repairCenterId)
        )
      );
    return stock || undefined;
  }

  async listInventoryMovements(filters?: { repairCenterId?: string; productId?: string }): Promise<InventoryMovement[]> {
    let query = db.select().from(inventoryMovements);
    
    if (filters) {
      const conditions = [];
      if (filters.repairCenterId) conditions.push(eq(inventoryMovements.repairCenterId, filters.repairCenterId));
      if (filters.productId) conditions.push(eq(inventoryMovements.productId, filters.productId));
      
      if (conditions.length > 0) {
        query = query.where(and(...conditions)) as any;
      }
    }
    
    return await query.orderBy(desc(inventoryMovements.createdAt));
  }

  async getProductStockByCenter(productId: string): Promise<Array<{ repairCenterId: string; repairCenterName: string; quantity: number }>> {
    const result = await db.select({
      repairCenterId: inventoryStock.repairCenterId,
      repairCenterName: repairCenters.name,
      quantity: inventoryStock.quantity,
    })
    .from(inventoryStock)
    .innerJoin(repairCenters, eq(inventoryStock.repairCenterId, repairCenters.id))
    .where(eq(inventoryStock.productId, productId));
    
    return result;
  }

  async getAllProductsWithStock(): Promise<Array<{ 
    product: Product; 
    stockByCenter: Array<{ repairCenterId: string; repairCenterName: string; quantity: number }>;
    totalStock: number;
  }>> {
    const allProducts = await this.listProducts();
    const allStock = await db.select({
      productId: inventoryStock.productId,
      repairCenterId: inventoryStock.repairCenterId,
      repairCenterName: repairCenters.name,
      quantity: inventoryStock.quantity,
    })
    .from(inventoryStock)
    .innerJoin(repairCenters, eq(inventoryStock.repairCenterId, repairCenters.id));
    
    // Aggregate stock by product and repair center (handles potential duplicates)
    const stockMap = new Map<string, Map<string, { repairCenterId: string; repairCenterName: string; quantity: number }>>();
    for (const stock of allStock) {
      if (!stockMap.has(stock.productId)) {
        stockMap.set(stock.productId, new Map());
      }
      const centerMap = stockMap.get(stock.productId)!;
      if (centerMap.has(stock.repairCenterId)) {
        // Aggregate quantities for same product/center
        const existing = centerMap.get(stock.repairCenterId)!;
        existing.quantity += stock.quantity;
      } else {
        centerMap.set(stock.repairCenterId, {
          repairCenterId: stock.repairCenterId,
          repairCenterName: stock.repairCenterName,
          quantity: stock.quantity,
        });
      }
    }
    
    return allProducts.map(product => {
      const centerMap = stockMap.get(product.id);
      const stockByCenter = centerMap ? Array.from(centerMap.values()) : [];
      const totalStock = stockByCenter.reduce((sum, s) => sum + s.quantity, 0);
      return { product, stockByCenter, totalStock };
    });
  }

  async updateProduct(id: string, updates: Partial<Omit<Product, 'id' | 'createdAt'>>): Promise<Product> {
    const [updated] = await db.update(products)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(products.id, id))
      .returning();
    return updated;
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

  // Repair Acceptance
  async getRepairAcceptance(repairOrderId: string): Promise<RepairAcceptance | undefined> {
    const [acceptance] = await db.select()
      .from(repairAcceptance)
      .where(eq(repairAcceptance.repairOrderId, repairOrderId));
    return acceptance || undefined;
  }

  // Repair Diagnostics
  async createRepairDiagnostics(diagnostics: InsertRepairDiagnostics): Promise<RepairDiagnostics> {
    const [created] = await db.insert(repairDiagnostics).values(diagnostics).returning();
    return created;
  }

  async updateRepairDiagnostics(
    repairOrderId: string, 
    updates: Partial<Omit<InsertRepairDiagnostics, 'repairOrderId' | 'diagnosedBy'>>
  ): Promise<RepairDiagnostics> {
    const [updated] = await db.update(repairDiagnostics)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(repairDiagnostics.repairOrderId, repairOrderId))
      .returning();
    return updated;
  }

  async getRepairDiagnostics(repairOrderId: string): Promise<RepairDiagnostics | undefined> {
    const [diagnostics] = await db.select()
      .from(repairDiagnostics)
      .where(eq(repairDiagnostics.repairOrderId, repairOrderId));
    return diagnostics || undefined;
  }

  // Repair Quotes
  async createRepairQuote(quote: InsertRepairQuote): Promise<RepairQuote> {
    const count = await db.select().from(repairQuotes);
    const quoteNumber = `PRV-${Date.now()}-${count.length + 1}`;
    const [created] = await db.insert(repairQuotes).values({
      ...quote,
      quoteNumber,
    }).returning();
    return created;
  }

  async updateRepairQuote(
    repairOrderId: string,
    updates: Partial<Omit<InsertRepairQuote, 'repairOrderId' | 'quoteNumber' | 'createdBy'>>
  ): Promise<RepairQuote> {
    const updateData: any = { ...updates, updatedAt: new Date() };
    const [updated] = await db.update(repairQuotes)
      .set(updateData)
      .where(eq(repairQuotes.repairOrderId, repairOrderId))
      .returning();
    return updated;
  }

  async getRepairQuote(repairOrderId: string): Promise<RepairQuote | undefined> {
    const [quote] = await db.select()
      .from(repairQuotes)
      .where(eq(repairQuotes.repairOrderId, repairOrderId));
    return quote || undefined;
  }

  async updateQuoteStatus(repairOrderId: string, status: string): Promise<RepairQuote> {
    const [updated] = await db.update(repairQuotes)
      .set({ status: status as any, updatedAt: new Date() })
      .where(eq(repairQuotes.repairOrderId, repairOrderId))
      .returning();
    return updated;
  }

  async listAllDiagnostics(filters?: { userId?: string; role?: string; search?: string; dateFrom?: string; dateTo?: string }): Promise<any[]> {
    // Join diagnostics with repair orders to get device info and filter by role
    const results = await db
      .select({
        id: repairDiagnostics.id,
        repairOrderId: repairDiagnostics.repairOrderId,
        technicalDiagnosis: repairDiagnostics.technicalDiagnosis,
        damagedComponents: repairDiagnostics.damagedComponents,
        estimatedRepairTime: repairDiagnostics.estimatedRepairTime,
        requiresExternalParts: repairDiagnostics.requiresExternalParts,
        diagnosisNotes: repairDiagnostics.diagnosisNotes,
        diagnosedBy: repairDiagnostics.diagnosedBy,
        diagnosedAt: repairDiagnostics.diagnosedAt,
        orderNumber: repairOrders.orderNumber,
        deviceType: repairOrders.deviceType,
        deviceModel: repairOrders.deviceModel,
        status: repairOrders.status,
        customerId: repairOrders.customerId,
        repairCenterId: repairOrders.repairCenterId,
      })
      .from(repairDiagnostics)
      .innerJoin(repairOrders, eq(repairDiagnostics.repairOrderId, repairOrders.id))
      .orderBy(sql`${repairDiagnostics.diagnosedAt} DESC`);

    let filtered = results;

    // Filter based on role
    if (filters?.role === 'repair_center' && filters?.userId) {
      filtered = filtered.filter(d => d.repairCenterId === filters.userId);
    } else if (filters?.role === 'reseller' && filters?.userId) {
      const resellerOrders = await db.select({ id: repairOrders.id })
        .from(repairOrders)
        .where(eq(repairOrders.resellerId, filters.userId));
      const orderIds = resellerOrders.map(o => o.id);
      filtered = filtered.filter(d => orderIds.includes(d.repairOrderId));
    } else if (filters?.role === 'customer' && filters?.userId) {
      filtered = filtered.filter(d => d.customerId === filters.userId);
    }

    if (filters?.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(d => 
        d.orderNumber?.toLowerCase().includes(searchLower) ||
        d.deviceType?.toLowerCase().includes(searchLower) ||
        d.deviceModel?.toLowerCase().includes(searchLower) ||
        d.technicalDiagnosis?.toLowerCase().includes(searchLower)
      );
    }

    if (filters?.dateFrom) {
      const fromDate = new Date(filters.dateFrom);
      filtered = filtered.filter(d => d.diagnosedAt && new Date(d.diagnosedAt) >= fromDate);
    }

    if (filters?.dateTo) {
      const toDate = new Date(filters.dateTo);
      toDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter(d => d.diagnosedAt && new Date(d.diagnosedAt) <= toDate);
    }

    return filtered;
  }

  async listAllQuotes(filters?: { userId?: string; role?: string; status?: string; search?: string; dateFrom?: string; dateTo?: string }): Promise<any[]> {
    // Join quotes with repair orders to get device info and filter by role
    const results = await db
      .select({
        id: repairQuotes.id,
        repairOrderId: repairQuotes.repairOrderId,
        quoteNumber: repairQuotes.quoteNumber,
        parts: repairQuotes.parts,
        laborCost: repairQuotes.laborCost,
        totalAmount: repairQuotes.totalAmount,
        quoteStatus: repairQuotes.status,
        validUntil: repairQuotes.validUntil,
        notes: repairQuotes.notes,
        createdBy: repairQuotes.createdBy,
        createdAt: repairQuotes.createdAt,
        orderNumber: repairOrders.orderNumber,
        deviceType: repairOrders.deviceType,
        deviceModel: repairOrders.deviceModel,
        orderStatus: repairOrders.status,
        customerId: repairOrders.customerId,
        repairCenterId: repairOrders.repairCenterId,
      })
      .from(repairQuotes)
      .innerJoin(repairOrders, eq(repairQuotes.repairOrderId, repairOrders.id))
      .orderBy(sql`${repairQuotes.createdAt} DESC`);

    let filtered = results;

    // Filter based on role
    if (filters?.role === 'repair_center' && filters?.userId) {
      filtered = filtered.filter(q => q.repairCenterId === filters.userId);
    } else if (filters?.role === 'reseller' && filters?.userId) {
      const resellerOrders = await db.select({ id: repairOrders.id })
        .from(repairOrders)
        .where(eq(repairOrders.resellerId, filters.userId));
      const orderIds = resellerOrders.map(o => o.id);
      filtered = filtered.filter(q => orderIds.includes(q.repairOrderId));
    } else if (filters?.role === 'customer' && filters?.userId) {
      filtered = filtered.filter(q => q.customerId === filters.userId);
    }

    // Apply additional filters
    if (filters?.status) {
      filtered = filtered.filter(q => q.quoteStatus === filters.status);
    }

    if (filters?.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(q => 
        q.quoteNumber?.toLowerCase().includes(searchLower) ||
        q.orderNumber?.toLowerCase().includes(searchLower) ||
        q.deviceType?.toLowerCase().includes(searchLower) ||
        q.deviceModel?.toLowerCase().includes(searchLower)
      );
    }

    if (filters?.dateFrom) {
      const fromDate = new Date(filters.dateFrom);
      filtered = filtered.filter(q => q.createdAt && new Date(q.createdAt) >= fromDate);
    }

    if (filters?.dateTo) {
      const toDate = new Date(filters.dateTo);
      toDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter(q => q.createdAt && new Date(q.createdAt) <= toDate);
    }

    return filtered;
  }

  // Device Types
  async listDeviceTypes(activeOnly: boolean = false): Promise<DeviceType[]> {
    let query = db.select().from(deviceTypes);
    
    if (activeOnly) {
      query = query.where(eq(deviceTypes.isActive, true)) as any;
    }
    
    return await query.orderBy(deviceTypes.name);
  }

  async getDeviceType(id: string): Promise<DeviceType | undefined> {
    const [deviceType] = await db.select().from(deviceTypes).where(eq(deviceTypes.id, id));
    return deviceType || undefined;
  }

  async createDeviceType(insertDeviceType: InsertDeviceType): Promise<DeviceType> {
    const [deviceType] = await db.insert(deviceTypes).values(insertDeviceType).returning();
    return deviceType;
  }

  async updateDeviceType(id: string, updates: Partial<InsertDeviceType>): Promise<DeviceType> {
    const [deviceType] = await db
      .update(deviceTypes)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(deviceTypes.id, id))
      .returning();
    
    if (!deviceType) {
      throw new Error("Device type not found");
    }
    
    return deviceType;
  }

  async deleteDeviceType(id: string): Promise<void> {
    await db.delete(deviceTypes).where(eq(deviceTypes.id, id));
  }

  // Device Brands
  async listDeviceBrands(activeOnly: boolean = false): Promise<DeviceBrand[]> {
    let query = db.select().from(deviceBrands);
    
    if (activeOnly) {
      query = query.where(eq(deviceBrands.isActive, true)) as any;
    }
    
    return await query.orderBy(deviceBrands.name);
  }

  async getDeviceBrand(id: string): Promise<DeviceBrand | undefined> {
    const [deviceBrand] = await db.select().from(deviceBrands).where(eq(deviceBrands.id, id));
    return deviceBrand || undefined;
  }

  async createDeviceBrand(insertDeviceBrand: InsertDeviceBrand): Promise<DeviceBrand> {
    const [deviceBrand] = await db.insert(deviceBrands).values(insertDeviceBrand).returning();
    return deviceBrand;
  }

  async updateDeviceBrand(id: string, updates: Partial<InsertDeviceBrand>): Promise<DeviceBrand> {
    const [deviceBrand] = await db
      .update(deviceBrands)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(deviceBrands.id, id))
      .returning();
    
    if (!deviceBrand) {
      throw new Error("Device brand not found");
    }
    
    return deviceBrand;
  }

  async deleteDeviceBrand(id: string): Promise<void> {
    await db.delete(deviceBrands).where(eq(deviceBrands.id, id));
  }

  // Issue Types (Predefined problems per device type)
  async listIssueTypes(deviceTypeId?: string, activeOnly: boolean = true): Promise<IssueType[]> {
    let query = db.select().from(issueTypes);
    
    const conditions = [];
    
    if (deviceTypeId) {
      // Include issues for specific device type OR generic issues (null deviceTypeId)
      conditions.push(or(
        eq(issueTypes.deviceTypeId, deviceTypeId),
        sql`${issueTypes.deviceTypeId} IS NULL`
      ));
    }
    
    if (activeOnly) {
      conditions.push(eq(issueTypes.isActive, true));
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }
    
    return await query.orderBy(issueTypes.sortOrder, issueTypes.name);
  }

  // Aesthetic Defects (Predefined defects per device type)
  async listAestheticDefects(deviceTypeId?: string, activeOnly: boolean = true): Promise<AestheticDefect[]> {
    let query = db.select().from(aestheticDefects);
    
    const conditions = [];
    
    if (deviceTypeId) {
      conditions.push(or(
        eq(aestheticDefects.deviceTypeId, deviceTypeId),
        sql`${aestheticDefects.deviceTypeId} IS NULL`
      ));
    }
    
    if (activeOnly) {
      conditions.push(eq(aestheticDefects.isActive, true));
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }
    
    return await query.orderBy(aestheticDefects.sortOrder, aestheticDefects.name);
  }

  // Accessory Types (Predefined accessories per device type)
  async listAccessoryTypes(deviceTypeId?: string, activeOnly: boolean = true): Promise<AccessoryType[]> {
    let query = db.select().from(accessoryTypes);
    
    const conditions = [];
    
    if (deviceTypeId) {
      conditions.push(or(
        eq(accessoryTypes.deviceTypeId, deviceTypeId),
        sql`${accessoryTypes.deviceTypeId} IS NULL`
      ));
    }
    
    if (activeOnly) {
      conditions.push(eq(accessoryTypes.isActive, true));
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }
    
    return await query.orderBy(accessoryTypes.sortOrder, accessoryTypes.name);
  }

  // Diagnostic Findings (Predefined diagnostic results per device type)
  async listDiagnosticFindings(deviceTypeId?: string, activeOnly: boolean = true): Promise<DiagnosticFinding[]> {
    let query = db.select().from(diagnosticFindings);
    
    const conditions = [];
    
    if (deviceTypeId) {
      conditions.push(or(
        eq(diagnosticFindings.deviceTypeId, deviceTypeId),
        sql`${diagnosticFindings.deviceTypeId} IS NULL`
      ));
    }
    
    if (activeOnly) {
      conditions.push(eq(diagnosticFindings.isActive, true));
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }
    
    return await query.orderBy(diagnosticFindings.sortOrder, diagnosticFindings.name);
  }

  // Damaged Component Types (Predefined damaged components per device type)
  async listDamagedComponentTypes(deviceTypeId?: string, activeOnly: boolean = true): Promise<DamagedComponentType[]> {
    let query = db.select().from(damagedComponentTypes);
    
    const conditions = [];
    
    if (deviceTypeId) {
      conditions.push(or(
        eq(damagedComponentTypes.deviceTypeId, deviceTypeId),
        sql`${damagedComponentTypes.deviceTypeId} IS NULL`
      ));
    }
    
    if (activeOnly) {
      conditions.push(eq(damagedComponentTypes.isActive, true));
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }
    
    return await query.orderBy(damagedComponentTypes.sortOrder, damagedComponentTypes.name);
  }

  // Estimated Repair Times (Predefined repair time ranges)
  async listEstimatedRepairTimes(deviceTypeId?: string, activeOnly: boolean = true): Promise<EstimatedRepairTime[]> {
    let query = db.select().from(estimatedRepairTimes);
    
    const conditions = [];
    
    if (deviceTypeId) {
      conditions.push(or(
        eq(estimatedRepairTimes.deviceTypeId, deviceTypeId),
        sql`${estimatedRepairTimes.deviceTypeId} IS NULL`
      ));
    }
    
    if (activeOnly) {
      conditions.push(eq(estimatedRepairTimes.isActive, true));
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }
    
    return await query.orderBy(estimatedRepairTimes.sortOrder, estimatedRepairTimes.name);
  }

  // Device Models (Cascading dropdown)
  async listDeviceModels(filters?: { typeId?: string; brandId?: string; activeOnly?: boolean }): Promise<DeviceModel[]> {
    let query = db.select().from(deviceModels);
    
    const conditions = [];
    
    if (filters?.typeId) {
      conditions.push(eq(deviceModels.typeId, filters.typeId));
    }
    
    if (filters?.brandId) {
      conditions.push(eq(deviceModels.brandId, filters.brandId));
    }
    
    if (filters?.activeOnly !== false) {
      conditions.push(eq(deviceModels.isActive, true));
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }
    
    return await query.orderBy(deviceModels.modelName);
  }

  async getDeviceModel(id: string): Promise<DeviceModel | undefined> {
    const [deviceModel] = await db.select().from(deviceModels).where(eq(deviceModels.id, id));
    return deviceModel || undefined;
  }

  // Parts Orders (FASE 5)
  async createPartsOrder(order: InsertPartsOrder): Promise<PartsOrder> {
    const [created] = await db.insert(partsOrders).values(order).returning();
    return created;
  }

  async listPartsOrders(repairOrderId: string): Promise<PartsOrder[]> {
    return await db.select()
      .from(partsOrders)
      .where(eq(partsOrders.repairOrderId, repairOrderId))
      .orderBy(desc(partsOrders.orderedAt));
  }

  async listAllPartsOrders(filters?: { repairCenterId?: string; status?: string }): Promise<any[]> {
    const result = await db.select({
      partsOrder: partsOrders,
      repairOrder: repairOrders,
      repairCenter: repairCenters,
      product: products,
    })
    .from(partsOrders)
    .innerJoin(repairOrders, eq(partsOrders.repairOrderId, repairOrders.id))
    .leftJoin(repairCenters, eq(repairOrders.repairCenterId, repairCenters.id))
    .leftJoin(products, eq(partsOrders.productId, products.id))
    .orderBy(desc(partsOrders.orderedAt));

    let filtered = result;
    
    if (filters?.repairCenterId) {
      filtered = filtered.filter(r => r.repairOrder.repairCenterId === filters.repairCenterId);
    }
    
    if (filters?.status) {
      filtered = filtered.filter(r => r.partsOrder.status === filters.status);
    }

    return filtered.map(r => ({
      ...r.partsOrder,
      repairOrderNumber: r.repairOrder.orderNumber,
      repairCenterName: r.repairCenter?.name || 'N/A',
      repairCenterId: r.repairOrder.repairCenterId,
      productName: r.product?.name || r.partsOrder.partName,
      productSku: r.product?.sku || r.partsOrder.partNumber,
    }));
  }

  async getPartsOrder(id: string): Promise<PartsOrder | undefined> {
    const [order] = await db.select().from(partsOrders).where(eq(partsOrders.id, id));
    return order || undefined;
  }

  async updatePartsOrderStatus(id: string, status: string, receivedAt?: Date): Promise<PartsOrder> {
    const updates: any = { status };
    if (receivedAt) {
      updates.receivedAt = receivedAt;
    }
    const [updated] = await db.update(partsOrders)
      .set(updates)
      .where(eq(partsOrders.id, id))
      .returning();
    return updated;
  }

  // Repair Logs (FASE 6)
  async createRepairLog(log: InsertRepairLog): Promise<RepairLog> {
    const [created] = await db.insert(repairLogs).values(log).returning();
    return created;
  }

  async listRepairLogs(repairOrderId: string): Promise<RepairLog[]> {
    return await db.select()
      .from(repairLogs)
      .where(eq(repairLogs.repairOrderId, repairOrderId))
      .orderBy(desc(repairLogs.createdAt));
  }

  // Test Checklist (FASE 7)
  async createTestChecklist(checklist: InsertRepairTestChecklist): Promise<RepairTestChecklist> {
    const [created] = await db.insert(repairTestChecklist).values(checklist).returning();
    return created;
  }

  async getTestChecklist(repairOrderId: string): Promise<RepairTestChecklist | undefined> {
    const [checklist] = await db.select()
      .from(repairTestChecklist)
      .where(eq(repairTestChecklist.repairOrderId, repairOrderId));
    return checklist || undefined;
  }

  async updateTestChecklist(repairOrderId: string, updates: Partial<Omit<InsertRepairTestChecklist, 'repairOrderId' | 'testedBy'>>): Promise<RepairTestChecklist> {
    const [updated] = await db.update(repairTestChecklist)
      .set(updates)
      .where(eq(repairTestChecklist.repairOrderId, repairOrderId))
      .returning();
    return updated;
  }

  // Delivery (FASE 7)
  async createDelivery(delivery: InsertRepairDelivery): Promise<RepairDelivery> {
    const [created] = await db.insert(repairDelivery).values(delivery).returning();
    return created;
  }

  async getDelivery(repairOrderId: string): Promise<RepairDelivery | undefined> {
    const [delivery] = await db.select()
      .from(repairDelivery)
      .where(eq(repairDelivery.repairOrderId, repairOrderId));
    return delivery || undefined;
  }

  // Admin Settings
  async getAdminSetting(key: string): Promise<AdminSetting | undefined> {
    const [setting] = await db.select()
      .from(adminSettings)
      .where(eq(adminSettings.settingKey, key));
    return setting || undefined;
  }

  async setAdminSetting(key: string, value: string, description?: string, updatedBy?: string): Promise<AdminSetting> {
    const existing = await this.getAdminSetting(key);
    
    if (existing) {
      const [updated] = await db.update(adminSettings)
        .set({ 
          settingValue: value, 
          description: description ?? existing.description,
          updatedBy: updatedBy ?? existing.updatedBy,
          updatedAt: new Date()
        })
        .where(eq(adminSettings.settingKey, key))
        .returning();
      return updated;
    } else {
      const [created] = await db.insert(adminSettings)
        .values({ settingKey: key, settingValue: value, description, updatedBy })
        .returning();
      return created;
    }
  }

  async listAdminSettings(): Promise<AdminSetting[]> {
    return await db.select().from(adminSettings).orderBy(adminSettings.settingKey);
  }

  // Promotions (for "Non Conveniente" diagnosis outcome)
  async listPromotions(activeOnly: boolean = true): Promise<Promotion[]> {
    if (activeOnly) {
      return await db.select()
        .from(promotions)
        .where(eq(promotions.isActive, true))
        .orderBy(promotions.sortOrder);
    }
    return await db.select().from(promotions).orderBy(promotions.sortOrder);
  }

  async getPromotion(id: string): Promise<Promotion | undefined> {
    const [promotion] = await db.select().from(promotions).where(eq(promotions.id, id));
    return promotion || undefined;
  }

  async createPromotion(promotion: InsertPromotion): Promise<Promotion> {
    const [created] = await db.insert(promotions).values(promotion).returning();
    return created;
  }

  async updatePromotion(id: string, updates: Partial<InsertPromotion>): Promise<Promotion> {
    const [updated] = await db.update(promotions)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(promotions.id, id))
      .returning();
    if (!updated) throw new Error("Promotion not found");
    return updated;
  }

  async deletePromotion(id: string): Promise<void> {
    await db.delete(promotions).where(eq(promotions.id, id));
  }

  // Unrepairable Reasons (for "Irriparabile" diagnosis outcome)
  async listUnrepairableReasons(deviceTypeId?: string, activeOnly: boolean = true): Promise<UnrepairableReason[]> {
    const conditions = [];
    
    if (activeOnly) {
      conditions.push(eq(unrepairableReasons.isActive, true));
    }
    
    // Filter by device type: show reasons that are generic (null deviceTypeId) OR specific to this device type
    if (deviceTypeId) {
      conditions.push(
        or(
          eq(unrepairableReasons.deviceTypeId, deviceTypeId),
          sql`${unrepairableReasons.deviceTypeId} IS NULL`
        )!
      );
    }
    
    if (conditions.length > 0) {
      return await db.select()
        .from(unrepairableReasons)
        .where(and(...conditions))
        .orderBy(unrepairableReasons.sortOrder);
    }
    
    return await db.select().from(unrepairableReasons).orderBy(unrepairableReasons.sortOrder);
  }

  async getUnrepairableReason(id: string): Promise<UnrepairableReason | undefined> {
    const [reason] = await db.select().from(unrepairableReasons).where(eq(unrepairableReasons.id, id));
    return reason || undefined;
  }

  async createUnrepairableReason(reason: InsertUnrepairableReason): Promise<UnrepairableReason> {
    const [created] = await db.insert(unrepairableReasons).values(reason).returning();
    return created;
  }

  async updateUnrepairableReason(id: string, updates: Partial<InsertUnrepairableReason>): Promise<UnrepairableReason> {
    const [updated] = await db.update(unrepairableReasons)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(unrepairableReasons.id, id))
      .returning();
    if (!updated) throw new Error("Unrepairable reason not found");
    return updated;
  }

  async deleteUnrepairableReason(id: string): Promise<void> {
    await db.delete(unrepairableReasons).where(eq(unrepairableReasons.id, id));
  }

  // ==========================================
  // DATA RECOVERY SYSTEM
  // ==========================================

  // External Labs
  async listExternalLabs(activeOnly: boolean = true): Promise<ExternalLab[]> {
    if (activeOnly) {
      return await db.select().from(externalLabs).where(eq(externalLabs.isActive, true)).orderBy(externalLabs.name);
    }
    return await db.select().from(externalLabs).orderBy(externalLabs.name);
  }

  async getExternalLab(id: string): Promise<ExternalLab | undefined> {
    const [lab] = await db.select().from(externalLabs).where(eq(externalLabs.id, id));
    return lab || undefined;
  }

  async createExternalLab(lab: InsertExternalLab): Promise<ExternalLab> {
    const [created] = await db.insert(externalLabs).values(lab).returning();
    return created;
  }

  async updateExternalLab(id: string, updates: Partial<InsertExternalLab>): Promise<ExternalLab> {
    const [updated] = await db.update(externalLabs)
      .set(updates)
      .where(eq(externalLabs.id, id))
      .returning();
    if (!updated) throw new Error("External lab not found");
    return updated;
  }

  async deleteExternalLab(id: string): Promise<void> {
    await db.delete(externalLabs).where(eq(externalLabs.id, id));
  }

  // Data Recovery Jobs
  async createDataRecoveryJob(job: CreateDataRecoveryJob, createdBy: string): Promise<DataRecoveryJob> {
    // Generate job number: REC-YYYY-NNNN
    const year = new Date().getFullYear();
    const countResult = await db.select({ count: sql<number>`count(*)` })
      .from(dataRecoveryJobs)
      .where(sql`EXTRACT(YEAR FROM created_at) = ${year}`);
    const count = Number(countResult[0]?.count || 0) + 1;
    const jobNumber = `REC-${year}-${count.toString().padStart(4, '0')}`;

    const [created] = await db.insert(dataRecoveryJobs).values({
      ...job,
      jobNumber,
      createdBy,
      diagnosisId: null, // Will be set if triggered from diagnosis
    }).returning();

    // Create initial event
    await this.createDataRecoveryEvent({
      dataRecoveryJobId: created.id,
      eventType: "created",
      title: "Recupero dati avviato",
      description: job.handlingType === "internal" 
        ? "Recupero dati avviato internamente" 
        : "Recupero dati inviato a laboratorio esterno",
      createdBy,
    });

    return created;
  }

  async getDataRecoveryJob(id: string): Promise<DataRecoveryJob | undefined> {
    const [job] = await db.select().from(dataRecoveryJobs).where(eq(dataRecoveryJobs.id, id));
    return job || undefined;
  }

  async listDataRecoveryJobs(filters?: { repairOrderId?: string; status?: string; handlingType?: string }): Promise<DataRecoveryJob[]> {
    const conditions = [];
    
    if (filters?.repairOrderId) {
      conditions.push(eq(dataRecoveryJobs.parentRepairOrderId, filters.repairOrderId));
    }
    if (filters?.status) {
      conditions.push(sql`${dataRecoveryJobs.status}::text = ${filters.status}`);
    }
    if (filters?.handlingType) {
      conditions.push(sql`${dataRecoveryJobs.handlingType}::text = ${filters.handlingType}`);
    }
    
    if (conditions.length > 0) {
      return await db.select().from(dataRecoveryJobs).where(and(...conditions)).orderBy(desc(dataRecoveryJobs.createdAt));
    }
    
    return await db.select().from(dataRecoveryJobs).orderBy(desc(dataRecoveryJobs.createdAt));
  }

  async updateDataRecoveryJob(id: string, updates: UpdateDataRecoveryJob): Promise<DataRecoveryJob> {
    const updateData: any = { ...updates, updatedAt: new Date() };
    
    // If status changes to completed/partial/failed, set completedAt
    if (updates.status && ["completed", "partial", "failed"].includes(updates.status)) {
      updateData.completedAt = new Date();
    }
    
    // If status changes to shipped, set shippedAt
    if (updates.status === "shipped" && !updateData.shippedAt) {
      updateData.shippedAt = new Date();
    }
    
    // If status changes to at_lab, set receivedAtLabAt
    if (updates.status === "at_lab" && !updateData.receivedAtLabAt) {
      updateData.receivedAtLabAt = new Date();
    }

    const [updated] = await db.update(dataRecoveryJobs)
      .set(updateData)
      .where(eq(dataRecoveryJobs.id, id))
      .returning();
    
    if (!updated) throw new Error("Data recovery job not found");
    return updated;
  }

  async getDataRecoveryJobByRepairOrderId(repairOrderId: string): Promise<DataRecoveryJob | undefined> {
    const [job] = await db.select()
      .from(dataRecoveryJobs)
      .where(eq(dataRecoveryJobs.parentRepairOrderId, repairOrderId))
      .orderBy(desc(dataRecoveryJobs.createdAt));
    return job || undefined;
  }

  // Data Recovery Events
  async createDataRecoveryEvent(event: InsertDataRecoveryEvent): Promise<DataRecoveryEvent> {
    const [created] = await db.insert(dataRecoveryEvents).values(event).returning();
    return created;
  }

  async listDataRecoveryEvents(jobId: string): Promise<DataRecoveryEvent[]> {
    return await db.select()
      .from(dataRecoveryEvents)
      .where(eq(dataRecoveryEvents.dataRecoveryJobId, jobId))
      .orderBy(desc(dataRecoveryEvents.createdAt));
  }

  // ==========================================
  // SUPPLIER MANAGEMENT
  // ==========================================

  // Suppliers
  async listSuppliers(activeOnly: boolean = false): Promise<Supplier[]> {
    let query = db.select().from(suppliers);
    
    if (activeOnly) {
      query = query.where(eq(suppliers.isActive, true)) as any;
    }
    
    return await query.orderBy(suppliers.name);
  }

  async getSupplier(id: string): Promise<Supplier | undefined> {
    const [supplier] = await db.select().from(suppliers).where(eq(suppliers.id, id));
    return supplier || undefined;
  }

  async getSupplierByCode(code: string): Promise<Supplier | undefined> {
    const [supplier] = await db.select().from(suppliers).where(eq(suppliers.code, code));
    return supplier || undefined;
  }

  async createSupplier(insertSupplier: InsertSupplier): Promise<Supplier> {
    // Auto-generate supplier code: FORN-0001, FORN-0002, etc.
    const allSuppliers = await db.select({ code: suppliers.code }).from(suppliers);
    let maxNumber = 0;
    for (const s of allSuppliers) {
      const match = s.code.match(/^FORN-(\d+)$/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxNumber) maxNumber = num;
      }
    }
    const supplierCode = `FORN-${String(maxNumber + 1).padStart(4, '0')}`;
    
    const [supplier] = await db.insert(suppliers).values({
      ...insertSupplier,
      code: supplierCode,
    }).returning();
    return supplier;
  }

  async updateSupplier(id: string, updates: Partial<InsertSupplier>): Promise<Supplier> {
    const [supplier] = await db.update(suppliers)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(suppliers.id, id))
      .returning();
    
    if (!supplier) {
      throw new Error("Fornitore non trovato");
    }
    
    return supplier;
  }

  async deleteSupplier(id: string): Promise<void> {
    await db.delete(suppliers).where(eq(suppliers.id, id));
  }

  // Product Suppliers
  async listProductSuppliers(productId: string): Promise<ProductSupplier[]> {
    return await db.select()
      .from(productSuppliers)
      .where(eq(productSuppliers.productId, productId))
      .orderBy(desc(productSuppliers.isPreferred), productSuppliers.createdAt);
  }

  async listSupplierProducts(supplierId: string): Promise<ProductSupplier[]> {
    return await db.select()
      .from(productSuppliers)
      .where(eq(productSuppliers.supplierId, supplierId))
      .orderBy(productSuppliers.createdAt);
  }

  async getProductSupplier(id: string): Promise<ProductSupplier | undefined> {
    const [ps] = await db.select().from(productSuppliers).where(eq(productSuppliers.id, id));
    return ps || undefined;
  }

  async createProductSupplier(insertPS: InsertProductSupplier): Promise<ProductSupplier> {
    const [ps] = await db.insert(productSuppliers).values(insertPS).returning();
    return ps;
  }

  async updateProductSupplier(id: string, updates: Partial<InsertProductSupplier>): Promise<ProductSupplier> {
    const [ps] = await db.update(productSuppliers)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(productSuppliers.id, id))
      .returning();
    
    if (!ps) {
      throw new Error("Relazione prodotto-fornitore non trovata");
    }
    
    return ps;
  }

  async deleteProductSupplier(id: string): Promise<void> {
    await db.delete(productSuppliers).where(eq(productSuppliers.id, id));
  }

  async setPreferredSupplier(productId: string, supplierId: string): Promise<void> {
    await db.transaction(async (tx) => {
      // Remove preferred flag from all suppliers for this product
      await tx.update(productSuppliers)
        .set({ isPreferred: false, updatedAt: new Date() })
        .where(eq(productSuppliers.productId, productId));
      
      // Set preferred flag for the specified supplier
      await tx.update(productSuppliers)
        .set({ isPreferred: true, updatedAt: new Date() })
        .where(and(
          eq(productSuppliers.productId, productId),
          eq(productSuppliers.supplierId, supplierId)
        ));
    });
  }

  // Supplier Orders
  async listSupplierOrders(filters?: { supplierId?: string; repairCenterId?: string; status?: string }): Promise<SupplierOrder[]> {
    const conditions = [];
    
    if (filters?.supplierId) {
      conditions.push(eq(supplierOrders.supplierId, filters.supplierId));
    }
    if (filters?.repairCenterId) {
      conditions.push(eq(supplierOrders.repairCenterId, filters.repairCenterId));
    }
    if (filters?.status) {
      conditions.push(sql`${supplierOrders.status}::text = ${filters.status}`);
    }
    
    if (conditions.length > 0) {
      return await db.select().from(supplierOrders)
        .where(and(...conditions))
        .orderBy(desc(supplierOrders.createdAt));
    }
    
    return await db.select().from(supplierOrders).orderBy(desc(supplierOrders.createdAt));
  }

  async getSupplierOrder(id: string): Promise<SupplierOrder | undefined> {
    const [order] = await db.select().from(supplierOrders).where(eq(supplierOrders.id, id));
    return order || undefined;
  }

  async createSupplierOrder(insertOrder: InsertSupplierOrder): Promise<SupplierOrder> {
    const count = await db.select().from(supplierOrders);
    const year = new Date().getFullYear();
    const orderNumber = `ORD-FORN-${year}-${String(count.length + 1).padStart(5, '0')}`;
    
    const [order] = await db.insert(supplierOrders).values({
      ...insertOrder,
      orderNumber,
    }).returning();
    return order;
  }

  async updateSupplierOrder(id: string, updates: Partial<Omit<InsertSupplierOrder, 'orderNumber' | 'createdBy'>>): Promise<SupplierOrder> {
    const [order] = await db.update(supplierOrders)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(supplierOrders.id, id))
      .returning();
    
    if (!order) {
      throw new Error("Ordine fornitore non trovato");
    }
    
    return order;
  }

  async updateSupplierOrderStatus(id: string, status: string): Promise<SupplierOrder> {
    const updateData: any = { 
      status: status as any, 
      updatedAt: new Date() 
    };
    
    // Set timestamp based on status
    if (status === 'sent') updateData.sentAt = new Date();
    if (status === 'confirmed') updateData.confirmedAt = new Date();
    if (status === 'shipped') updateData.shippedAt = new Date();
    if (status === 'received') updateData.receivedAt = new Date();
    
    const [order] = await db.update(supplierOrders)
      .set(updateData)
      .where(eq(supplierOrders.id, id))
      .returning();
    
    if (!order) {
      throw new Error("Ordine fornitore non trovato");
    }
    
    return order;
  }

  // Supplier Order Items
  async listSupplierOrderItems(orderId: string): Promise<SupplierOrderItem[]> {
    return await db.select()
      .from(supplierOrderItems)
      .where(eq(supplierOrderItems.supplierOrderId, orderId))
      .orderBy(supplierOrderItems.createdAt);
  }

  async createSupplierOrderItem(item: InsertSupplierOrderItem): Promise<SupplierOrderItem> {
    const [created] = await db.insert(supplierOrderItems).values(item).returning();
    return created;
  }

  async updateSupplierOrderItem(id: string, updates: Partial<InsertSupplierOrderItem>): Promise<SupplierOrderItem> {
    const [item] = await db.update(supplierOrderItems)
      .set(updates)
      .where(eq(supplierOrderItems.id, id))
      .returning();
    
    if (!item) {
      throw new Error("Riga ordine non trovata");
    }
    
    return item;
  }

  async deleteSupplierOrderItem(id: string): Promise<void> {
    await db.delete(supplierOrderItems).where(eq(supplierOrderItems.id, id));
  }

  async updateSupplierOrderItemReceived(id: string, quantityReceived: number): Promise<SupplierOrderItem> {
    const [item] = await db.update(supplierOrderItems)
      .set({ quantityReceived })
      .where(eq(supplierOrderItems.id, id))
      .returning();
    
    if (!item) {
      throw new Error("Riga ordine non trovata");
    }
    
    return item;
  }

  // Supplier Returns
  async listSupplierReturns(filters?: { supplierId?: string; repairCenterId?: string; status?: string }): Promise<SupplierReturn[]> {
    const conditions = [];
    
    if (filters?.supplierId) {
      conditions.push(eq(supplierReturns.supplierId, filters.supplierId));
    }
    if (filters?.repairCenterId) {
      conditions.push(eq(supplierReturns.repairCenterId, filters.repairCenterId));
    }
    if (filters?.status) {
      conditions.push(sql`${supplierReturns.status}::text = ${filters.status}`);
    }
    
    if (conditions.length > 0) {
      return await db.select().from(supplierReturns)
        .where(and(...conditions))
        .orderBy(desc(supplierReturns.createdAt));
    }
    
    return await db.select().from(supplierReturns).orderBy(desc(supplierReturns.createdAt));
  }

  async getSupplierReturn(id: string): Promise<SupplierReturn | undefined> {
    const [returnData] = await db.select().from(supplierReturns).where(eq(supplierReturns.id, id));
    return returnData || undefined;
  }

  async createSupplierReturn(insertReturn: InsertSupplierReturn): Promise<SupplierReturn> {
    const count = await db.select().from(supplierReturns);
    const year = new Date().getFullYear();
    const returnNumber = `RES-FORN-${year}-${String(count.length + 1).padStart(5, '0')}`;
    
    const [returnData] = await db.insert(supplierReturns).values({
      ...insertReturn,
      returnNumber,
    }).returning();
    
    // Create initial state history entry
    await this.createSupplierReturnStateHistory({
      supplierReturnId: returnData.id,
      status: returnData.status,
      enteredAt: new Date(),
    });
    
    return returnData;
  }

  async updateSupplierReturn(id: string, updates: Partial<Omit<InsertSupplierReturn, 'returnNumber' | 'createdBy'>>): Promise<SupplierReturn> {
    const [returnData] = await db.update(supplierReturns)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(supplierReturns.id, id))
      .returning();
    
    if (!returnData) {
      throw new Error("Reso fornitore non trovato");
    }
    
    return returnData;
  }

  async updateSupplierReturnStatus(id: string, status: string, changedBy?: string): Promise<SupplierReturn> {
    // Close the current state history entry
    await this.closeSupplierReturnStateHistory(id, changedBy);
    
    const updateData: any = { 
      status: status as any, 
      updatedAt: new Date() 
    };
    
    // Set timestamp based on status
    if (status === 'requested') updateData.requestedAt = new Date();
    if (status === 'approved') updateData.approvedAt = new Date();
    if (status === 'shipped') updateData.shippedAt = new Date();
    if (status === 'received') updateData.receivedAt = new Date();
    if (status === 'refunded') updateData.refundedAt = new Date();
    
    const [returnData] = await db.update(supplierReturns)
      .set(updateData)
      .where(eq(supplierReturns.id, id))
      .returning();
    
    if (!returnData) {
      throw new Error("Reso fornitore non trovato");
    }
    
    // Create a new state history entry for the new status
    await this.createSupplierReturnStateHistory({
      supplierReturnId: id,
      status: status,
      enteredAt: new Date(),
      changedBy,
    });
    
    return returnData;
  }

  // Supplier Return Items
  async listSupplierReturnItems(returnId: string): Promise<SupplierReturnItem[]> {
    return await db.select()
      .from(supplierReturnItems)
      .where(eq(supplierReturnItems.supplierReturnId, returnId))
      .orderBy(supplierReturnItems.createdAt);
  }

  async createSupplierReturnItem(item: InsertSupplierReturnItem): Promise<SupplierReturnItem> {
    const [created] = await db.insert(supplierReturnItems).values(item).returning();
    return created;
  }

  async deleteSupplierReturnItem(id: string): Promise<void> {
    await db.delete(supplierReturnItems).where(eq(supplierReturnItems.id, id));
  }

  // Supplier Communication Logs
  async listSupplierCommunicationLogs(filters?: { supplierId?: string; entityType?: string; entityId?: string }): Promise<SupplierCommunicationLog[]> {
    const conditions = [];
    
    if (filters?.supplierId) {
      conditions.push(eq(supplierCommunicationLogs.supplierId, filters.supplierId));
    }
    if (filters?.entityType) {
      conditions.push(eq(supplierCommunicationLogs.entityType, filters.entityType));
    }
    if (filters?.entityId) {
      conditions.push(eq(supplierCommunicationLogs.entityId, filters.entityId));
    }
    
    if (conditions.length > 0) {
      return await db.select().from(supplierCommunicationLogs)
        .where(and(...conditions))
        .orderBy(desc(supplierCommunicationLogs.createdAt));
    }
    
    return await db.select().from(supplierCommunicationLogs).orderBy(desc(supplierCommunicationLogs.createdAt));
  }

  async createSupplierCommunicationLog(log: InsertSupplierCommunicationLog): Promise<SupplierCommunicationLog> {
    const [created] = await db.insert(supplierCommunicationLogs).values(log).returning();
    return created;
  }

  async updateSupplierCommunicationLog(id: string, updates: Partial<InsertSupplierCommunicationLog>): Promise<SupplierCommunicationLog> {
    const [log] = await db.update(supplierCommunicationLogs)
      .set(updates)
      .where(eq(supplierCommunicationLogs.id, id))
      .returning();
    
    if (!log) {
      throw new Error("Log comunicazione non trovato");
    }
    
    return log;
  }

  // Parts Load Documents (Carico Ricambi)
  async listPartsLoadDocuments(filters?: { repairCenterId?: string; supplierId?: string; status?: string }): Promise<PartsLoadDocument[]> {
    const conditions = [];
    
    if (filters?.repairCenterId) {
      conditions.push(eq(partsLoadDocuments.repairCenterId, filters.repairCenterId));
    }
    if (filters?.supplierId) {
      conditions.push(eq(partsLoadDocuments.supplierId, filters.supplierId));
    }
    if (filters?.status) {
      conditions.push(sql`${partsLoadDocuments.status}::text = ${filters.status}`);
    }
    
    if (conditions.length > 0) {
      return await db.select().from(partsLoadDocuments)
        .where(and(...conditions))
        .orderBy(desc(partsLoadDocuments.createdAt));
    }
    
    return await db.select().from(partsLoadDocuments).orderBy(desc(partsLoadDocuments.createdAt));
  }

  async getPartsLoadDocument(id: string): Promise<PartsLoadDocument | undefined> {
    const [doc] = await db.select().from(partsLoadDocuments).where(eq(partsLoadDocuments.id, id));
    return doc || undefined;
  }

  async createPartsLoadDocument(insertDoc: InsertPartsLoadDocument): Promise<PartsLoadDocument> {
    const count = await db.select().from(partsLoadDocuments);
    const year = new Date().getFullYear();
    const loadNumber = `CARICO-${year}-${String(count.length + 1).padStart(5, '0')}`;
    
    const [doc] = await db.insert(partsLoadDocuments).values({
      ...insertDoc,
      loadNumber,
    }).returning();
    return doc;
  }

  async updatePartsLoadDocument(id: string, updates: Partial<InsertPartsLoadDocument>): Promise<PartsLoadDocument> {
    const [doc] = await db.update(partsLoadDocuments)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(partsLoadDocuments.id, id))
      .returning();
    
    if (!doc) {
      throw new Error("Documento di carico non trovato");
    }
    
    return doc;
  }

  async processPartsLoadDocument(id: string): Promise<{ matched: number; stock: number; errors: number }> {
    const doc = await this.getPartsLoadDocument(id);
    if (!doc) {
      throw new Error("Documento di carico non trovato");
    }
    
    const items = await this.listPartsLoadItems(id);
    let matched = 0;
    let stock = 0;
    let errors = 0;
    
    for (const item of items) {
      if (item.status === 'pending') {
        // Try to match with waiting parts orders by part number
        const waitingOrders = await db.select().from(partsOrders)
          .where(and(
            eq(partsOrders.partNumber, item.partCode),
            sql`${partsOrders.status}::text = 'ordered'`
          ));
        
        if (waitingOrders.length > 0) {
          // Match with first waiting order
          const partsOrder = waitingOrders[0];
          await this.updatePartsLoadItem(item.id, {
            status: 'matched',
            matchedPartsOrderId: partsOrder.id,
            matchedRepairOrderId: partsOrder.repairOrderId,
          });
          
          // Update parts order status
          await this.updatePartsOrderStatus(partsOrder.id, 'received', new Date());
          matched++;
        } else {
          // Try to find matching product for stock
          const matchingProducts = await db.select().from(products)
            .where(eq(products.sku, item.partCode));
          
          if (matchingProducts.length > 0) {
            await this.updatePartsLoadItem(item.id, {
              status: 'stock',
              matchedProductId: matchingProducts[0].id,
            });
            stock++;
          } else {
            await this.updatePartsLoadItem(item.id, {
              status: 'error',
              errorMessage: 'Codice parte non riconosciuto - richiede abbinamento manuale',
            });
            errors++;
          }
        }
      } else if (item.status === 'matched') {
        matched++;
      } else if (item.status === 'stock') {
        stock++;
      } else if (item.status === 'error') {
        errors++;
      }
    }
    
    // Update document totals
    const newStatus = errors > 0 ? 'partial' : 'completed';
    await this.updatePartsLoadDocument(id, {
      status: newStatus as any,
      matchedItems: matched,
      stockItems: stock,
      errorItems: errors,
      processedAt: new Date(),
      completedAt: errors === 0 ? new Date() : undefined,
    });
    
    return { matched, stock, errors };
  }

  // Parts Load Items
  async listPartsLoadItems(documentId: string): Promise<PartsLoadItem[]> {
    return await db.select()
      .from(partsLoadItems)
      .where(eq(partsLoadItems.partsLoadDocumentId, documentId))
      .orderBy(partsLoadItems.createdAt);
  }

  async getPartsLoadItem(id: string): Promise<PartsLoadItem | undefined> {
    const [item] = await db.select().from(partsLoadItems).where(eq(partsLoadItems.id, id));
    return item || undefined;
  }

  async createPartsLoadItem(item: InsertPartsLoadItem): Promise<PartsLoadItem> {
    const [created] = await db.insert(partsLoadItems).values(item).returning();
    
    // Update document totals
    const doc = await this.getPartsLoadDocument(item.partsLoadDocumentId);
    if (doc) {
      await this.updatePartsLoadDocument(item.partsLoadDocumentId, {
        totalItems: (doc.totalItems || 0) + 1,
        totalQuantity: (doc.totalQuantity || 0) + (item.quantity || 1),
        totalAmount: (doc.totalAmount || 0) + (item.totalPrice || 0),
      });
    }
    
    return created;
  }

  async updatePartsLoadItem(id: string, updates: Partial<InsertPartsLoadItem>): Promise<PartsLoadItem> {
    const [item] = await db.update(partsLoadItems)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(partsLoadItems.id, id))
      .returning();
    
    if (!item) {
      throw new Error("Riga carico non trovata");
    }
    
    return item;
  }

  async deletePartsLoadItem(id: string): Promise<void> {
    const item = await this.getPartsLoadItem(id);
    if (item) {
      // Update document totals
      const doc = await this.getPartsLoadDocument(item.partsLoadDocumentId);
      if (doc) {
        await this.updatePartsLoadDocument(item.partsLoadDocumentId, {
          totalItems: Math.max(0, (doc.totalItems || 0) - 1),
          totalQuantity: Math.max(0, (doc.totalQuantity || 0) - (item.quantity || 1)),
          totalAmount: Math.max(0, (doc.totalAmount || 0) - (item.totalPrice || 0)),
        });
      }
    }
    
    await db.delete(partsLoadItems).where(eq(partsLoadItems.id, id));
  }

  async matchPartsLoadItem(id: string, partsOrderId?: string, productId?: string): Promise<PartsLoadItem> {
    const item = await this.getPartsLoadItem(id);
    if (!item) {
      throw new Error("Riga carico non trovata");
    }
    
    if (partsOrderId) {
      // Match with parts order (for repair)
      const partsOrder = await this.getPartsOrder(partsOrderId);
      if (!partsOrder) {
        throw new Error("Ordine ricambio non trovato");
      }
      
      await this.updatePartsOrderStatus(partsOrderId, 'received', new Date());
      
      return await this.updatePartsLoadItem(id, {
        status: 'matched',
        matchedPartsOrderId: partsOrderId,
        matchedRepairOrderId: partsOrder.repairOrderId,
      });
    } else if (productId) {
      // Match with product (for stock)
      const product = await this.getProduct(productId);
      if (!product) {
        throw new Error("Prodotto non trovato");
      }
      
      return await this.updatePartsLoadItem(id, {
        status: 'stock',
        matchedProductId: productId,
      });
    } else {
      throw new Error("Specificare partsOrderId o productId");
    }
  }

  // ==========================================
  // SLA STATE HISTORY
  // ==========================================
  
  async listRepairOrderStateHistory(repairOrderId: string): Promise<RepairOrderStateHistory[]> {
    return await db.select()
      .from(repairOrderStateHistory)
      .where(eq(repairOrderStateHistory.repairOrderId, repairOrderId))
      .orderBy(desc(repairOrderStateHistory.enteredAt));
  }

  async createRepairOrderStateHistory(history: InsertRepairOrderStateHistory): Promise<RepairOrderStateHistory> {
    const [record] = await db.insert(repairOrderStateHistory).values(history).returning();
    return record;
  }

  async closeRepairOrderStateHistory(repairOrderId: string, changedBy?: string): Promise<void> {
    const now = new Date();
    
    // Find the current open state (exitedAt is null)
    const [currentState] = await db.select()
      .from(repairOrderStateHistory)
      .where(and(
        eq(repairOrderStateHistory.repairOrderId, repairOrderId),
        sql`${repairOrderStateHistory.exitedAt} IS NULL`
      ))
      .limit(1);
    
    if (currentState) {
      const enteredAt = new Date(currentState.enteredAt);
      const durationMinutes = Math.floor((now.getTime() - enteredAt.getTime()) / (1000 * 60));
      
      await db.update(repairOrderStateHistory)
        .set({ 
          exitedAt: now,
          durationMinutes,
        })
        .where(eq(repairOrderStateHistory.id, currentState.id));
    }
  }

  async getCurrentRepairOrderState(repairOrderId: string): Promise<RepairOrderStateHistory | undefined> {
    const [state] = await db.select()
      .from(repairOrderStateHistory)
      .where(and(
        eq(repairOrderStateHistory.repairOrderId, repairOrderId),
        sql`${repairOrderStateHistory.exitedAt} IS NULL`
      ))
      .limit(1);
    return state || undefined;
  }

  async listSupplierReturnStateHistory(supplierReturnId: string): Promise<SupplierReturnStateHistory[]> {
    return await db.select()
      .from(supplierReturnStateHistory)
      .where(eq(supplierReturnStateHistory.supplierReturnId, supplierReturnId))
      .orderBy(desc(supplierReturnStateHistory.enteredAt));
  }

  async createSupplierReturnStateHistory(history: InsertSupplierReturnStateHistory): Promise<SupplierReturnStateHistory> {
    const [record] = await db.insert(supplierReturnStateHistory).values(history).returning();
    return record;
  }

  async closeSupplierReturnStateHistory(supplierReturnId: string, changedBy?: string): Promise<void> {
    const now = new Date();
    
    // Find the current open state (exitedAt is null)
    const [currentState] = await db.select()
      .from(supplierReturnStateHistory)
      .where(and(
        eq(supplierReturnStateHistory.supplierReturnId, supplierReturnId),
        sql`${supplierReturnStateHistory.exitedAt} IS NULL`
      ))
      .limit(1);
    
    if (currentState) {
      const enteredAt = new Date(currentState.enteredAt);
      const durationMinutes = Math.floor((now.getTime() - enteredAt.getTime()) / (1000 * 60));
      
      await db.update(supplierReturnStateHistory)
        .set({ 
          exitedAt: now,
          durationMinutes,
        })
        .where(eq(supplierReturnStateHistory.id, currentState.id));
    }
  }

  async getCurrentSupplierReturnState(supplierReturnId: string): Promise<SupplierReturnStateHistory | undefined> {
    const [state] = await db.select()
      .from(supplierReturnStateHistory)
      .where(and(
        eq(supplierReturnStateHistory.supplierReturnId, supplierReturnId),
        sql`${supplierReturnStateHistory.exitedAt} IS NULL`
      ))
      .limit(1);
    return state || undefined;
  }

  // ==========================================
  // SLA THRESHOLDS
  // ==========================================

  async getSlaThresholds(): Promise<SlaThresholds> {
    const [setting] = await db.select()
      .from(adminSettings)
      .where(eq(adminSettings.settingKey, 'sla_thresholds'))
      .limit(1);
    
    if (setting) {
      try {
        const parsed = JSON.parse(setting.settingValue);
        return slaThresholdsSchema.parse(parsed);
      } catch {
        // Return defaults if parsing fails
        return slaThresholdsSchema.parse({});
      }
    }
    
    // Return defaults
    return slaThresholdsSchema.parse({});
  }

  async updateSlaThresholds(thresholds: SlaThresholds, updatedBy: string): Promise<void> {
    const settingValue = JSON.stringify(thresholds);
    
    await db.insert(adminSettings)
      .values({
        settingKey: 'sla_thresholds',
        settingValue,
        description: 'Soglie SLA per stati riparazioni e resi (valori in ore)',
        updatedBy,
      })
      .onConflictDoUpdate({
        target: adminSettings.settingKey,
        set: {
          settingValue,
          updatedBy,
          updatedAt: new Date(),
        },
      });
  }
}

export const storage = new DatabaseStorage();
