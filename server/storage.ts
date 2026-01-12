import {
  User, InsertUser, RepairCenter, InsertRepairCenter, Product, InsertProduct, ProductPrice, InsertProductPrice,
  RepairOrder, InsertRepairOrder, PaginatedResult, RepairOrderFilters,
  Ticket, InsertTicket, TicketMessage, InsertTicketMessage,
  Invoice, InsertInvoice, BillingData, InsertBillingData, ChatMessage, InsertChatMessage,
  InventoryMovement, InsertInventoryMovement, InventoryStock, ActivityLog, InsertActivityLog,
  AnalyticsCache, InsertAnalyticsCache, Notification, InsertNotification,
  NotificationPreferences, InsertNotificationPreferences, RepairAttachment, InsertRepairAttachment,
  RepairAcceptance, InsertRepairAcceptance, RepairDiagnostics, InsertRepairDiagnostics,
  RepairQuote, InsertRepairQuote,
  DeviceType, InsertDeviceType, DeviceBrand, InsertDeviceBrand, DeviceModel, InsertDeviceModel,
  ResellerDeviceBrand, InsertResellerDeviceBrand, ResellerDeviceModel, InsertResellerDeviceModel,
  IssueType, InsertIssueType, AestheticDefect, InsertAestheticDefect, AccessoryType, InsertAccessoryType,
  DiagnosticFinding, DamagedComponentType, EstimatedRepairTime,
  PartsPurchaseOrder, InsertPartsPurchaseOrder, partsPurchaseOrders,
  PartsOrder, InsertPartsOrder, RepairLog, InsertRepairLog,
  RepairTestChecklist, InsertRepairTestChecklist, RepairDelivery, InsertRepairDelivery,
  RepairCenterAvailability, InsertRepairCenterAvailability,
  RepairCenterBlackout, InsertRepairCenterBlackout,
  DeliveryAppointment, InsertDeliveryAppointment,
  AdminSetting, InsertAdminSetting,
  Promotion, InsertPromotion, UnrepairableReason, InsertUnrepairableReason,
  ExternalLab, InsertExternalLab, DataRecoveryJob, InsertDataRecoveryJob, DataRecoveryEvent, InsertDataRecoveryEvent,
  CreateDataRecoveryJob, UpdateDataRecoveryJob,
  Supplier, InsertSupplier, ProductSupplier, InsertProductSupplier,
  SupplierCatalogProduct, InsertSupplierCatalogProduct, SupplierSyncLog, InsertSupplierSyncLog,
  SupplierOrder, InsertSupplierOrder, SupplierOrderItem, InsertSupplierOrderItem,
  SupplierReturn, InsertSupplierReturn, SupplierReturnItem, InsertSupplierReturnItem,
  SupplierCommunicationLog, InsertSupplierCommunicationLog,
  RepairOrderStateHistory, InsertRepairOrderStateHistory,
  SupplierReturnStateHistory, InsertSupplierReturnStateHistory,
  SlaThresholds, slaThresholdsSchema,
  CustomerBranch, InsertCustomerBranch,
  UtilityCategory, InsertUtilityCategory,
  UtilitySupplier, InsertUtilitySupplier, UtilityService, InsertUtilityService,
  UtilityPractice, InsertUtilityPractice, UtilityPracticeProduct, InsertUtilityPracticeProduct,
  UtilityCommission, InsertUtilityCommission,
  UtilityPracticeDocument, InsertUtilityPracticeDocument,
  UtilityPracticeTask, InsertUtilityPracticeTask,
  UtilityPracticeNote, InsertUtilityPracticeNote,
  UtilityPracticeTimelineEvent, InsertUtilityPracticeTimelineEvent,
  UtilityPracticeStateHistoryEntry, InsertUtilityPracticeStateHistoryEntry,
  SifarCredential, InsertSifarCredential, SifarStore, InsertSifarStore,
  TrovausatiCredential, InsertTrovausatiCredential, TrovausatiShop, InsertTrovausatiShop,
  TrovausatiOrder, InsertTrovausatiOrder, trovausatiCredentials, trovausatiShops, trovausatiOrders,
  FonedayCredential, InsertFonedayCredential, FonedayOrder, InsertFonedayOrder, FonedayProductsCache, InsertFonedayProductsCache,
  MobilesentrixCredential, InsertMobilesentrixCredential, MobilesentrixOrder, InsertMobilesentrixOrder, MobilesentrixCartItem, InsertMobilesentrixCartItem, MobilesentrixOrderItem, InsertMobilesentrixOrderItem,
  ExternalProductMapping, InsertExternalProductMapping, externalProductMappings,
  ExternalIntegration, InsertExternalIntegration, externalIntegrations,
  ServiceItem, InsertServiceItem, ServiceItemPrice, InsertServiceItemPrice,
  ProductDeviceCompatibility, InsertProductDeviceCompatibility, productDeviceCompatibilities,
  users, repairCenters, products, repairOrders, tickets, ticketMessages,
  invoices, billingData, chatMessages, inventoryMovements, inventoryStock, activityLogs, analyticsCache,
  notifications, notificationPreferences, repairAttachments, repairAcceptance, repairDiagnostics,
  repairQuotes, partsOrders, repairLogs, repairTestChecklist, repairDelivery,
  repairCenterAvailability, repairCenterBlackouts, deliveryAppointments,
  deviceTypes, deviceBrands, deviceModels, resellerDeviceBrands, resellerDeviceModels, issueTypes, aestheticDefects, accessoryTypes,
  diagnosticFindings, damagedComponentTypes, estimatedRepairTimes, adminSettings,
  promotions, unrepairableReasons, externalLabs, dataRecoveryJobs, dataRecoveryEvents,
  suppliers, productSuppliers, supplierCatalogProducts, supplierSyncLogs, supplierOrders, supplierOrderItems, supplierReturns, supplierReturnItems, supplierCommunicationLogs,
  repairOrderStateHistory, supplierReturnStateHistory,
  customerBranches,
  utilityCategories, utilitySuppliers, utilityServices, utilityPractices, utilityPracticeProducts, utilityCommissions,
  utilityPracticeDocuments, utilityPracticeTasks, utilityPracticeNotes,
  utilityPracticeTimeline, utilityPracticeStateHistory,
  sifarCredentials, sifarStores,
  fonedayCredentials, fonedayOrders, fonedayProductsCache,
  mobilesentrixCredentials, mobilesentrixOrders, mobilesentrixCartItems, mobilesentrixOrderItems,
  serviceItems, serviceItemPrices, productPrices,
  resellerProducts, ResellerProduct, InsertResellerProduct,
  resellerStaffPermissions, ResellerStaffPermission, InsertResellerStaffPermission,
  adminStaffPermissions, AdminStaffPermission, InsertAdminStaffPermission,
  customerRepairCenters, CustomerRepairCenter, InsertCustomerRepairCenter,
  staffRepairCenters, StaffRepairCenter, InsertStaffRepairCenter,
  staffSubResellers, StaffSubReseller, InsertStaffSubReseller,
  smartphoneSpecs, SmartphoneSpecs, InsertSmartphoneSpecs,
  accessorySpecs, AccessorySpecs, InsertAccessorySpecs,
  customerAddresses, CustomerAddress, InsertCustomerAddress,
  carts, Cart, InsertCart,
  cartItems, CartItem, InsertCartItem,
  salesOrders, SalesOrder, InsertSalesOrder,
  salesOrderItems, SalesOrderItem, InsertSalesOrderItem,
  salesOrderPayments, SalesOrderPayment, InsertSalesOrderPayment,
  salesOrderShipments, SalesOrderShipment, InsertSalesOrderShipment,
  shipmentTrackingEvents, ShipmentTrackingEvent, InsertShipmentTrackingEvent,
  stockReservations, StockReservation, InsertStockReservation,
  salesOrderStateHistory, SalesOrderStateHistoryEntry, InsertSalesOrderStateHistoryEntry,
  salesOrderReturns, SalesOrderReturn, InsertSalesOrderReturn,
  salesOrderReturnItems, SalesOrderReturnItem, InsertSalesOrderReturnItem,
  warehouses, Warehouse, InsertWarehouse,
  warehouseStock, WarehouseStock, InsertWarehouseStock,
  warehouseMovements, WarehouseMovement, InsertWarehouseMovement,
  warehouseTransfers, WarehouseTransfer, InsertWarehouseTransfer,
  warehouseTransferItems, WarehouseTransferItem, InsertWarehouseTransferItem,
  resellerPurchaseOrders, ResellerPurchaseOrder, InsertResellerPurchaseOrder,
  resellerPurchaseOrderItems, ResellerPurchaseOrderItem, InsertResellerPurchaseOrderItem,
  b2bReturns, B2bReturn, InsertB2bReturn,
  b2bReturnItems, B2bReturnItem, InsertB2bReturnItem,
  repairCenterPurchaseOrders, RepairCenterPurchaseOrder, InsertRepairCenterPurchaseOrder,
  repairCenterPurchaseOrderItems, RepairCenterPurchaseOrderItem, InsertRepairCenterPurchaseOrderItem,
  rcB2bReturns, RcB2bReturn, InsertRcB2bReturn,
  rcB2bReturnItems, RcB2bReturnItem, InsertRcB2bReturnItem,
  marketplaceOrders, MarketplaceOrder, InsertMarketplaceOrder,
  marketplaceOrderItems, MarketplaceOrderItem, InsertMarketplaceOrderItem,
  transferRequests, TransferRequest, InsertTransferRequest,
  transferRequestItems, TransferRequestItem, InsertTransferRequestItem,
  remoteRepairRequests, RemoteRepairRequest, InsertRemoteRepairRequest, UpdateRemoteRepairRequest,
  serviceOrders, ServiceOrder, InsertServiceOrder,
  hrWorkProfiles, HrWorkProfile, InsertHrWorkProfile,
  hrWorkProfileVersions, HrWorkProfileVersion, InsertHrWorkProfileVersion,
  hrWorkProfileAssignments, HrWorkProfileAssignment, InsertHrWorkProfileAssignment,
  hrClockingPolicies, HrClockingPolicy, InsertHrClockingPolicy,
  hrClockEvents, HrClockEvent, InsertHrClockEvent,
  hrLeaveBalances, HrLeaveBalance, InsertHrLeaveBalance,
  hrLeaveRequests, HrLeaveRequest, InsertHrLeaveRequest,
  hrSickLeaves, HrSickLeave, InsertHrSickLeave,
  hrCertificates, HrCertificate, InsertHrCertificate,
  hrAbsences, HrAbsence, InsertHrAbsence,
  hrJustifications, HrJustification, InsertHrJustification,
  hrExpenseReports, HrExpenseReport, InsertHrExpenseReport,
  hrExpenseItems, HrExpenseItem, InsertHrExpenseItem,
  hrNotifications, HrNotification, InsertHrNotification,
  hrAuditLogs, HrAuditLog, InsertHrAuditLog,
  posSessions, PosSession, InsertPosSession,
  posTransactions, PosTransaction, InsertPosTransaction, PosTransactionStatus,
  posTransactionItems, PosTransactionItem, InsertPosTransactionItem
} from "@shared/schema";
import { db, pool } from "./db";
import { eq, and, or, desc, lt, gt, gte, lte, sql, not, inArray, isNull, ilike, SQL } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  // Auth & User management
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByPartitaIva(partitaIva: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<Pick<User, 'username' | 'email' | 'fullName' | 'role' | 'isActive' | 'repairCenterId' | 'resellerId' | 'resellerCategory' | 'password' | 'phone' | 'partitaIva' | 'ragioneSociale' | 'codiceFiscale' | 'indirizzo' | 'citta' | 'cap' | 'provincia' | 'pec' | 'codiceUnivoco' | 'logoUrl'>>): Promise<User>;
  listUsers(): Promise<User[]>;
  listStaffUsers(): Promise<{ id: string; username: string; role: string }[]>;
  listCustomers(filters?: { resellerId?: string; repairCenterId?: string }): Promise<User[]>;
  deleteUser(id: string): Promise<void>;
  createCustomerWithBilling(userData: InsertUser, billingInfo: InsertBillingData): Promise<{ user: User; billing: BillingData }>;
  
  // Context Switching (for parent resellers managing sub-resellers/repair centers)
  getChildResellers(parentResellerId: string): Promise<User[]>;
  getSubResellerDetail(parentResellerId: string, subResellerId: string): Promise<User | null>;
  getRepairCentersForReseller(resellerId: string): Promise<RepairCenter[]>;
  
  // Customer-RepairCenter Many-to-Many
  listRepairCentersForCustomer(customerId: string): Promise<RepairCenter[]>;
  setCustomerRepairCenters(customerId: string, repairCenterIds: string[]): Promise<void>;
  listAllCustomerRepairCenters(): Promise<CustomerRepairCenter[]>;
  ensureCustomerRepairCenterAssociation(customerId: string, repairCenterId: string): Promise<void>;
  listCustomerIdsForRepairCenter(repairCenterId: string): Promise<string[]>;
  
  // Staff-RepairCenter Many-to-Many
  listRepairCentersForStaff(staffId: string): Promise<RepairCenter[]>;
  setStaffRepairCenters(staffId: string, repairCenterIds: string[]): Promise<void>;
  listAllStaffRepairCenters(): Promise<StaffRepairCenter[]>;
  
  // Repair Centers
  listRepairCenters(): Promise<RepairCenter[]>;
  getRepairCenter(id: string): Promise<RepairCenter | undefined>;
  getResellerRepairCenterDetail(resellerId: string, centerId: string): Promise<{
    center: RepairCenter;
    stats: {
      totalRepairs: number;
      pendingRepairs: number;
      completedRepairs: number;
      inProgressRepairs: number;
      totalRevenue: number;
    };
    recentRepairs: any[];
    staffCount: number;
    customersCount: number;
  } | null>;
  getRepairCenterRepairs(centerId: string, options?: { limit?: number; offset?: number; status?: string }): Promise<{ repairs: any[]; total: number }>;
  createRepairCenter(center: InsertRepairCenter): Promise<RepairCenter>;
  updateRepairCenter(id: string, updates: Partial<Pick<RepairCenter, 'name' | 'address' | 'city' | 'phone' | 'email' | 'resellerId' | 'isActive' | 'hourlyRateCents' | 'cap' | 'provincia' | 'ragioneSociale' | 'partitaIva' | 'codiceFiscale' | 'iban' | 'codiceUnivoco' | 'pec'>>): Promise<RepairCenter>;
  deleteRepairCenter(id: string): Promise<void>;
  
  // Products
  listProducts(): Promise<Product[]>;
  getProduct(id: string): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  deleteProduct(id: string): Promise<void>;
  listProductsByReseller(resellerId: string): Promise<Product[]>;
  updateProduct(id: string, updates: Partial<InsertProduct>): Promise<Product>;
  
  // Product Device Compatibilities
  listProductCompatibilities(productId: string): Promise<ProductDeviceCompatibility[]>;
  addProductCompatibility(compatibility: InsertProductDeviceCompatibility): Promise<ProductDeviceCompatibility>;
  removeProductCompatibility(id: string): Promise<void>;
  setProductCompatibilities(productId: string, compatibilities: Omit<InsertProductDeviceCompatibility, 'productId'>[]): Promise<ProductDeviceCompatibility[]>;
  
  // Product Prices (prezzi personalizzati per reseller - gestiti da admin)
  listProductPrices(filters?: { productId?: string; resellerId?: string }): Promise<ProductPrice[]>;
  getProductPrice(id: string): Promise<ProductPrice | undefined>;
  getProductPriceForReseller(productId: string, resellerId: string): Promise<ProductPrice | undefined>;
  createProductPrice(price: InsertProductPrice): Promise<ProductPrice>;
  updateProductPrice(id: string, updates: Partial<Pick<ProductPrice, 'priceCents' | 'costPriceCents' | 'isActive'>>): Promise<ProductPrice>;
  deleteProductPrice(id: string): Promise<void>;

  // Reseller Products (assegnazione prodotti globali ai reseller)
  listResellerProducts(filters?: { resellerId?: string; productId?: string; isPublished?: boolean }): Promise<ResellerProduct[]>;
  getResellerProduct(productId: string, resellerId: string): Promise<ResellerProduct | undefined>;
  assignProductToReseller(data: InsertResellerProduct): Promise<ResellerProduct>;
  assignProductToResellers(productId: string, resellerIds: string[], options?: { inheritedFrom?: string; createdBy?: string }): Promise<ResellerProduct[]>;
  updateResellerProduct(id: string, updates: Partial<Pick<ResellerProduct, 'isPublished' | 'customPriceCents' | 'canOverridePrice' | 'canUnpublish'>>): Promise<ResellerProduct>;
  updateResellerProductByProductAndReseller(productId: string, resellerId: string, updates: Partial<Pick<ResellerProduct, 'isPublished' | 'customPriceCents'>>): Promise<ResellerProduct>;
  removeProductFromReseller(productId: string, resellerId: string): Promise<void>;
  getShopProductsForSeller(sellerId: string): Promise<Array<Product & { shopPrice: number; sellerName: string }>>;
  getMarketplaceProducts(): Promise<Array<Product & { sellers: Array<{ sellerId: string; sellerName: string; price: number; isAdmin: boolean }> }>>;
  
  // Smartphone Specs (for products of type "dispositivo")
  getSmartphoneSpecs(productId: string): Promise<SmartphoneSpecs | undefined>;
  createSmartphoneSpecs(specs: InsertSmartphoneSpecs): Promise<SmartphoneSpecs>;
  updateSmartphoneSpecs(productId: string, updates: Partial<InsertSmartphoneSpecs>): Promise<SmartphoneSpecs>;
  deleteSmartphoneSpecs(productId: string): Promise<void>;
  listSmartphones(filters?: { resellerId?: string; brand?: string; condition?: string }): Promise<Array<Product & { specs: SmartphoneSpecs | null }>>;
  
  // Accessory Specs (for products of type "accessorio")
  getAccessorySpecs(productId: string): Promise<AccessorySpecs | undefined>;
  createAccessorySpecs(specs: InsertAccessorySpecs): Promise<AccessorySpecs>;
  updateAccessorySpecs(productId: string, updates: Partial<InsertAccessorySpecs>): Promise<AccessorySpecs>;
  deleteAccessorySpecs(productId: string): Promise<void>;
  listAccessories(filters?: { resellerId?: string; accessoryType?: string }): Promise<Array<Product & { specs: AccessorySpecs | null }>>;
  listAccessoriesCompatibleWithDevice(deviceModelId: string | null, deviceBrandId?: string): Promise<Array<Product & { specs: AccessorySpecs | null }>>;
  
  // Repair Orders
  listRepairOrders(filters?: { customerId?: string; resellerId?: string; repairCenterId?: string; status?: string }): Promise<RepairOrder[]>;
  listRepairOrdersPaginated(params: { page: number; pageSize: number; filters?: RepairOrderFilters }): Promise<PaginatedResult<RepairOrder>>;
  getRepairOrder(id: string): Promise<RepairOrder | undefined>;
  createRepairOrder(order: InsertRepairOrder): Promise<RepairOrder>;
  createRepairWithAcceptance(order: InsertRepairOrder, acceptance: InsertRepairAcceptance): Promise<{ order: RepairOrder; acceptance: RepairAcceptance }>;
  updateRepairOrder(id: string, updates: Partial<Pick<RepairOrder, 'status' | 'priority' | 'estimatedCost' | 'finalCost' | 'notes' | 'repairCenterId' | 'quoteBypassReason' | 'quoteBypassedAt'>>): Promise<RepairOrder>;
  updateRepairOrderStatus(id: string, status: string, changedBy?: string): Promise<RepairOrder>;
  checkImeiSerialDuplicate(imei?: string, serial?: string, excludeId?: string): Promise<RepairOrder | undefined>;
  
  // Tickets
  listTickets(filters?: { customerId?: string; assignedTo?: string; status?: string }): Promise<Ticket[]>;
  listInternalTickets(filters: { userId: string; userRole: string; targetType?: string; ticketType?: string }): Promise<Ticket[]>;
  getTicket(id: string): Promise<Ticket | undefined>;
  createTicket(ticket: InsertTicket): Promise<Ticket>;
  updateTicketStatus(id: string, status: string): Promise<Ticket>;
  assignTicket(id: string, assignedTo: string | null): Promise<Ticket>;
  updateTicketPriority(id: string, priority: string): Promise<Ticket>;
  
  // Ticket Messages
  listTicketMessages(ticketId: string): Promise<TicketMessage[]>;
  createTicketMessage(message: InsertTicketMessage): Promise<TicketMessage>;
  
  // Invoices
  listInvoices(filters?: { customerId?: string; paymentStatus?: string; resellerId?: string }): Promise<Invoice[]>;
  getInvoice(id: string): Promise<Invoice | undefined>;
  createInvoice(invoice: InsertInvoice): Promise<Invoice>;
  updateInvoice(id: string, updates: Partial<Pick<Invoice, 'paymentStatus' | 'paidDate' | 'notes' | 'paymentMethod'>>): Promise<Invoice>;
  
  // Billing Data
  getBillingDataByUserId(userId: string): Promise<BillingData | undefined>;
  createBillingData(data: InsertBillingData): Promise<BillingData>;
  updateBillingData(id: string, updates: Partial<Omit<BillingData, 'id' | 'userId' | 'createdAt'>>): Promise<BillingData>;
  
  // Chat Messages
  listChatMessages(userId1: string, userId2: string): Promise<ChatMessage[]>;
  createChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
  
  // Inventory
  listInventoryStock(repairCenterId?: string): Promise<InventoryStock[]>;
  listInventoryStockByReseller(resellerId: string): Promise<InventoryStock[]>;
  getInventoryStock(productId: string, repairCenterId: string): Promise<InventoryStock | undefined>;
  createInventoryMovement(movement: InsertInventoryMovement): Promise<InventoryMovement>;
  listInventoryMovements(filters?: { repairCenterId?: string; productId?: string }): Promise<InventoryMovement[]>;
  getProductStockByCenter(productId: string): Promise<Array<{ repairCenterId: string; repairCenterName: string; quantity: number }>>;
  getAllProductsWithStock(): Promise<Array<{ product: Product; stockByWarehouse: Array<{ warehouseId: string; warehouseName: string; ownerType: string; ownerName: string; quantity: number }>; totalStock: number; compatibilities: Array<{ brandId: string; brandName: string; modelId: string | null; modelName: string | null }> }>>;
  updateProduct(id: string, updates: Partial<Omit<Product, 'id' | 'createdAt'>>): Promise<Product>;
  
  // Reseller Inventory (for own products in own centers)
  getResellerProductsWithStock(resellerId: string): Promise<Array<{ product: Product; stockByCenter: Array<{ repairCenterId: string; repairCenterName: string; quantity: number }>; totalStock: number }>>;
  getResellerProductStockByCenter(productId: string, resellerId: string): Promise<Array<{ repairCenterId: string; repairCenterName: string; quantity: number }>>;
  getResellerFullWarehouseStock(productId: string, resellerId: string): Promise<Array<{ warehouseId: string; warehouseName: string; ownerType: 'reseller' | 'sub_reseller' | 'repair_center'; ownerId: string; ownerName: string; quantity: number }>>;
  
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
  
  // Admin Dashboard Extended Stats
  getLatestCustomers(limit: number): Promise<any[]>;
  getLatestResellers(limit: number): Promise<any[]>;
  getResellerStats(): Promise<{ total: number; active: number; withCenters: number; withCustomers: number }>;
  getRepairCenterGlobalStats(): Promise<{ total: number; active: number; totalRepairs: number; avgRepairsPerCenter: number }>;
  getUtilityPracticesStats(): Promise<{ total: number; byStatus: Record<string, number>; totalCommissions: number; pendingCommissions: number }>;
  getWarehouseGlobalStats(): Promise<{ totalWarehouses: number; totalStock: number; totalValue: number; lowStockItems: number }>;
  getEcommerceStats(): Promise<{ totalOrders: number; totalRevenue: number; pendingOrders: number; activeCartItems: number }>;
  
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
  
  // Reseller Custom Device Brands
  listResellerDeviceBrands(resellerId: string, activeOnly?: boolean): Promise<ResellerDeviceBrand[]>;
  getResellerDeviceBrand(id: string): Promise<ResellerDeviceBrand | undefined>;
  createResellerDeviceBrand(brand: InsertResellerDeviceBrand): Promise<ResellerDeviceBrand>;
  updateResellerDeviceBrand(id: string, updates: Partial<InsertResellerDeviceBrand>): Promise<ResellerDeviceBrand>;
  deleteResellerDeviceBrand(id: string): Promise<void>;
  
  // Reseller Custom Device Models
  listResellerDeviceModels(resellerId: string, brandId?: string, typeId?: string, activeOnly?: boolean): Promise<ResellerDeviceModel[]>;
  getResellerDeviceModel(id: string): Promise<ResellerDeviceModel | undefined>;
  createResellerDeviceModel(model: InsertResellerDeviceModel): Promise<ResellerDeviceModel>;
  updateResellerDeviceModel(id: string, updates: Partial<InsertResellerDeviceModel>): Promise<ResellerDeviceModel>;
  deleteResellerDeviceModel(id: string): Promise<void>;
  
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
  listDeviceModelsForReseller(resellerId: string, filters?: { typeId?: string; brandId?: string; activeOnly?: boolean }): Promise<DeviceModel[]>;
  getDeviceModel(id: string): Promise<DeviceModel | undefined>;
  createDeviceModel(insertDeviceModel: InsertDeviceModel): Promise<DeviceModel>;
  updateDeviceModel(id: string, updates: Partial<InsertDeviceModel>): Promise<DeviceModel>;
  deleteDeviceModel(id: string): Promise<void>;
  
  // Parts Purchase Orders (Ordini raggruppati ricambi)
  createPartsPurchaseOrder(order: InsertPartsPurchaseOrder): Promise<PartsPurchaseOrder>;
  getPartsPurchaseOrder(id: string): Promise<PartsPurchaseOrder | undefined>;
  listPartsPurchaseOrders(repairOrderId: string): Promise<PartsPurchaseOrder[]>;
  updatePartsPurchaseOrder(id: string, updates: Partial<InsertPartsPurchaseOrder>): Promise<PartsPurchaseOrder>;
  generatePartsPurchaseOrderNumber(): Promise<string>;
  
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
  
  // Delivery Appointments
  listRepairCenterAvailability(repairCenterId: string): Promise<RepairCenterAvailability[]>;
  setRepairCenterAvailability(repairCenterId: string, availability: InsertRepairCenterAvailability[]): Promise<RepairCenterAvailability[]>;
  listRepairCenterBlackouts(repairCenterId: string, fromDate?: string, toDate?: string): Promise<RepairCenterBlackout[]>;
  createRepairCenterBlackout(blackout: InsertRepairCenterBlackout): Promise<RepairCenterBlackout>;
  deleteRepairCenterBlackout(id: string): Promise<void>;
  
  listDeliveryAppointments(filters?: { repairCenterId?: string; resellerId?: string; customerId?: string; repairOrderId?: string; date?: string; status?: string }): Promise<DeliveryAppointment[]>;
  getDeliveryAppointment(id: string): Promise<DeliveryAppointment | undefined>;
  getDeliveryAppointmentByRepairOrder(repairOrderId: string): Promise<DeliveryAppointment | undefined>;
  createDeliveryAppointment(appointment: InsertDeliveryAppointment): Promise<DeliveryAppointment>;
  updateDeliveryAppointment(id: string, updates: Partial<Pick<DeliveryAppointment, 'date' | 'startTime' | 'endTime' | 'status' | 'notes' | 'confirmedBy' | 'confirmedAt' | 'cancelledBy' | 'cancelledAt' | 'cancelReason'>>): Promise<DeliveryAppointment>;
  checkAppointmentConflict(repairCenterId: string, date: string, startTime: string, excludeId?: string): Promise<boolean>;
  
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
  
  // Supplier Catalog Products
  listSupplierCatalogProducts(supplierId: string): Promise<SupplierCatalogProduct[]>;
  getSupplierCatalogProduct(id: string): Promise<SupplierCatalogProduct | undefined>;
  upsertSupplierCatalogProduct(product: InsertSupplierCatalogProduct): Promise<{ product: SupplierCatalogProduct; created: boolean }>;
  mapCatalogProductToLocal(catalogProductId: string, linkedProductId: string): Promise<SupplierCatalogProduct>;
  
  // Supplier Sync Logs
  listSupplierSyncLogs(supplierId: string): Promise<SupplierSyncLog[]>;
  createSupplierSyncLog(log: InsertSupplierSyncLog): Promise<SupplierSyncLog>;
  updateSupplierSyncLog(id: string, updates: Partial<InsertSupplierSyncLog>): Promise<SupplierSyncLog>;
  
  // Product Suppliers (Relazione prodotti-fornitori)
  listProductSuppliers(productId: string): Promise<ProductSupplier[]>;
  listSupplierProducts(supplierId: string): Promise<ProductSupplier[]>;
  getProductSupplier(id: string): Promise<ProductSupplier | undefined>;
  createProductSupplier(productSupplier: InsertProductSupplier): Promise<ProductSupplier>;
  updateProductSupplier(id: string, updates: Partial<InsertProductSupplier>): Promise<ProductSupplier>;
  deleteProductSupplier(id: string): Promise<void>;
  deleteAllProductSuppliers(productId: string): Promise<void>;
  setPreferredSupplier(productId: string, supplierId: string): Promise<void>;
  
  // Supplier Orders (Ordini fornitori)
  listSupplierOrders(filters?: { supplierId?: string; repairCenterId?: string; status?: string; ownerType?: string; ownerId?: string }): Promise<SupplierOrder[]>;
  listSupplierOrdersByRepairCenters(repairCenterIds: string[]): Promise<SupplierOrder[]>;
  listSupplierOrdersByOwner(ownerType: string, ownerId: string): Promise<SupplierOrder[]>;
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
  listSupplierReturnsByRepairCenters(repairCenterIds: string[]): Promise<SupplierReturn[]>;
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
  
  // Customer Branches (Filiali)
  listCustomerBranches(parentCustomerId: string): Promise<CustomerBranch[]>;
  getCustomerBranch(id: string): Promise<CustomerBranch | undefined>;
  createCustomerBranch(branch: InsertCustomerBranch): Promise<CustomerBranch>;
  updateCustomerBranch(id: string, updates: Partial<InsertCustomerBranch>): Promise<CustomerBranch>;
  deleteCustomerBranch(id: string): Promise<void>;
  getBranchByCode(parentCustomerId: string, branchCode: string): Promise<CustomerBranch | undefined>;
  
  // Utility Categories
  listUtilityCategories(activeOnly?: boolean): Promise<UtilityCategory[]>;
  getUtilityCategory(id: string): Promise<UtilityCategory | undefined>;
  getUtilityCategoryBySlug(slug: string): Promise<UtilityCategory | undefined>;
  createUtilityCategory(category: InsertUtilityCategory): Promise<UtilityCategory>;
  updateUtilityCategory(id: string, updates: Partial<InsertUtilityCategory>): Promise<UtilityCategory>;
  deleteUtilityCategory(id: string): Promise<void>;
  
  // Utility Suppliers
  listUtilitySuppliers(filters?: { resellerId?: string }): Promise<UtilitySupplier[]>;
  getUtilitySupplier(id: string): Promise<UtilitySupplier | undefined>;
  createUtilitySupplier(supplier: InsertUtilitySupplier): Promise<UtilitySupplier>;
  updateUtilitySupplier(id: string, updates: Partial<InsertUtilitySupplier>): Promise<UtilitySupplier>;
  deleteUtilitySupplier(id: string): Promise<void>;
  
  // Utility Services
  listUtilityServices(supplierId?: string): Promise<UtilityService[]>;
  getUtilityService(id: string): Promise<UtilityService | undefined>;
  createUtilityService(service: InsertUtilityService): Promise<UtilityService>;
  updateUtilityService(id: string, updates: Partial<InsertUtilityService>): Promise<UtilityService>;
  deleteUtilityService(id: string): Promise<void>;
  
  // Utility Practices
  listUtilityPractices(filters?: { customerId?: string; resellerId?: string; status?: string; supplierId?: string }): Promise<UtilityPractice[]>;
  getUtilityPractice(id: string): Promise<UtilityPractice | undefined>;
  createUtilityPractice(practice: InsertUtilityPractice): Promise<UtilityPractice>;
  createUtilityPracticeWithProducts(practice: InsertUtilityPractice, products: Array<{ productId: string; quantity: number; unitPriceCents: number; notes?: string | null }>): Promise<{ practice: UtilityPractice; products: UtilityPracticeProduct[] }>;
  updateUtilityPractice(id: string, updates: Partial<InsertUtilityPractice>): Promise<UtilityPractice>;
  deleteUtilityPractice(id: string): Promise<void>;
  
  // Utility Practice Products
  listUtilityPracticeProducts(practiceId: string): Promise<UtilityPracticeProduct[]>;
  createUtilityPracticeProduct(product: InsertUtilityPracticeProduct): Promise<UtilityPracticeProduct>;
  updateUtilityPracticeProduct(id: string, updates: Partial<InsertUtilityPracticeProduct>): Promise<UtilityPracticeProduct>;
  deleteUtilityPracticeProduct(id: string): Promise<void>;
  deleteUtilityPracticeProductsByPractice(practiceId: string): Promise<void>;
  syncUtilityPracticeProductsTransactional(practiceId: string, products: Array<{ productId: string; quantity: number; unitPriceCents: number; notes?: string | null }>): Promise<UtilityPracticeProduct[]>;
  
  // Utility Commissions
  listUtilityCommissions(filters?: { practiceId?: string; status?: string; periodYear?: number }): Promise<UtilityCommission[]>;
  getUtilityCommission(id: string): Promise<UtilityCommission | undefined>;
  createUtilityCommission(commission: InsertUtilityCommission): Promise<UtilityCommission>;
  updateUtilityCommission(id: string, updates: Partial<InsertUtilityCommission>): Promise<UtilityCommission>;
  deleteUtilityCommission(id: string): Promise<void>;
  
  // Utility Practice Documents
  listUtilityPracticeDocuments(practiceId: string): Promise<UtilityPracticeDocument[]>;
  getUtilityPracticeDocument(id: string): Promise<UtilityPracticeDocument | undefined>;
  createUtilityPracticeDocument(document: InsertUtilityPracticeDocument): Promise<UtilityPracticeDocument>;
  deleteUtilityPracticeDocument(id: string): Promise<void>;
  
  // Utility Practice Tasks
  listUtilityPracticeTasks(practiceId: string): Promise<UtilityPracticeTask[]>;
  getUtilityPracticeTask(id: string): Promise<UtilityPracticeTask | undefined>;
  createUtilityPracticeTask(task: InsertUtilityPracticeTask): Promise<UtilityPracticeTask>;
  updateUtilityPracticeTask(id: string, updates: Partial<InsertUtilityPracticeTask>): Promise<UtilityPracticeTask>;
  deleteUtilityPracticeTask(id: string): Promise<void>;
  
  // Utility Practice Notes
  listUtilityPracticeNotes(practiceId: string): Promise<UtilityPracticeNote[]>;
  createUtilityPracticeNote(note: InsertUtilityPracticeNote): Promise<UtilityPracticeNote>;
  deleteUtilityPracticeNote(id: string): Promise<void>;
  
  // Utility Practice Timeline
  listUtilityPracticeTimeline(practiceId: string): Promise<UtilityPracticeTimelineEvent[]>;
  createUtilityPracticeTimelineEvent(event: InsertUtilityPracticeTimelineEvent): Promise<UtilityPracticeTimelineEvent>;
  
  // Utility Practice State History
  listUtilityPracticeStateHistory(practiceId: string): Promise<UtilityPracticeStateHistoryEntry[]>;
  createUtilityPracticeStateHistory(entry: InsertUtilityPracticeStateHistoryEntry): Promise<UtilityPracticeStateHistoryEntry>;
  
  // External Integrations (Admin-managed)
  listExternalIntegrations(): Promise<ExternalIntegration[]>;
  listActiveExternalIntegrations(): Promise<ExternalIntegration[]>;
  getExternalIntegration(id: string): Promise<ExternalIntegration | undefined>;
  getExternalIntegrationByCode(code: string): Promise<ExternalIntegration | undefined>;
  createExternalIntegration(integration: InsertExternalIntegration): Promise<ExternalIntegration>;
  updateExternalIntegration(id: string, updates: Partial<InsertExternalIntegration>): Promise<ExternalIntegration>;
  deleteExternalIntegration(id: string): Promise<void>;
  
  // SIFAR Integration
  getSifarCredentialByReseller(resellerId: string): Promise<SifarCredential | undefined>;
  getSifarCredential(id: string): Promise<SifarCredential | undefined>;
  createSifarCredential(credential: InsertSifarCredential): Promise<SifarCredential>;
  updateSifarCredential(id: string, updates: Partial<InsertSifarCredential>): Promise<SifarCredential>;
  deleteSifarCredential(id: string): Promise<void>;
  
  listSifarStores(credentialId: string): Promise<SifarStore[]>;
  getSifarStore(id: string): Promise<SifarStore | undefined>;
  createSifarStore(store: InsertSifarStore): Promise<SifarStore>;
  updateSifarStore(id: string, updates: Partial<InsertSifarStore>): Promise<SifarStore>;
  deleteSifarStore(id: string): Promise<void>;
  
  // TrovaUsati Integration
  getTrovausatiCredentialByReseller(resellerId: string): Promise<TrovausatiCredential | undefined>;
  getTrovausatiCredential(id: string): Promise<TrovausatiCredential | undefined>;
  createTrovausatiCredential(credential: InsertTrovausatiCredential): Promise<TrovausatiCredential>;
  updateTrovausatiCredential(id: string, updates: Partial<InsertTrovausatiCredential>): Promise<TrovausatiCredential>;
  deleteTrovausatiCredential(id: string): Promise<void>;
  
  listTrovausatiShops(credentialId: string): Promise<TrovausatiShop[]>;
  getTrovausatiShop(id: string): Promise<TrovausatiShop | undefined>;
  createTrovausatiShop(shop: InsertTrovausatiShop): Promise<TrovausatiShop>;
  updateTrovausatiShop(id: string, updates: Partial<InsertTrovausatiShop>): Promise<TrovausatiShop>;
  deleteTrovausatiShop(id: string): Promise<void>;
  
  listTrovausatiOrders(credentialId: string): Promise<TrovausatiOrder[]>;
  getTrovausatiOrder(id: string): Promise<TrovausatiOrder | undefined>;
  createTrovausatiOrder(order: InsertTrovausatiOrder): Promise<TrovausatiOrder>;
  updateTrovausatiOrder(id: string, updates: Partial<InsertTrovausatiOrder>): Promise<TrovausatiOrder>;
  
  // Foneday Integration
  getFonedayCredentialByReseller(resellerId: string): Promise<FonedayCredential | undefined>;
  getFonedayCredential(id: string): Promise<FonedayCredential | undefined>;
  createFonedayCredential(credential: InsertFonedayCredential): Promise<FonedayCredential>;
  updateFonedayCredential(id: string, updates: Partial<InsertFonedayCredential>): Promise<FonedayCredential>;
  deleteFonedayCredential(id: string): Promise<void>;
  
  listFonedayOrders(credentialId: string): Promise<FonedayOrder[]>;
  getFonedayOrder(id: string): Promise<FonedayOrder | undefined>;
  createFonedayOrder(order: InsertFonedayOrder): Promise<FonedayOrder>;
  updateFonedayOrder(id: string, updates: Partial<InsertFonedayOrder>): Promise<FonedayOrder>;
  
  // Foneday Products Cache
  getFonedayProductsCache(resellerId: string): Promise<FonedayProductsCache | undefined>;
  createFonedayProductsCache(cache: InsertFonedayProductsCache): Promise<FonedayProductsCache>;
  updateFonedayProductsCache(id: string, updates: Partial<InsertFonedayProductsCache>): Promise<FonedayProductsCache>;
  deleteFonedayProductsCache(resellerId: string): Promise<void>;
  
  // MobileSentrix Integration
  getMobilesentrixCredentialByReseller(resellerId: string): Promise<MobilesentrixCredential | undefined>;
  getMobilesentrixCredential(id: string): Promise<MobilesentrixCredential | undefined>;
  createMobilesentrixCredential(credential: InsertMobilesentrixCredential): Promise<MobilesentrixCredential>;
  updateMobilesentrixCredential(id: string, updates: Partial<InsertMobilesentrixCredential>): Promise<MobilesentrixCredential>;
  deleteMobilesentrixCredential(id: string): Promise<void>;
  
  listMobilesentrixOrders(credentialId: string): Promise<MobilesentrixOrder[]>;
  getMobilesentrixOrder(id: string): Promise<MobilesentrixOrder | undefined>;
  createMobilesentrixOrder(order: InsertMobilesentrixOrder): Promise<MobilesentrixOrder>;
  updateMobilesentrixOrder(id: string, updates: Partial<InsertMobilesentrixOrder>): Promise<MobilesentrixOrder>;

  // MobileSentrix Cart
  getMobilesentrixCartItems(credentialId: string): Promise<MobilesentrixCartItem[]>;
  getMobilesentrixCartItem(id: string): Promise<MobilesentrixCartItem | undefined>;
  getMobilesentrixCartItemBySku(credentialId: string, sku: string): Promise<MobilesentrixCartItem | undefined>;
  addMobilesentrixCartItem(item: InsertMobilesentrixCartItem): Promise<MobilesentrixCartItem>;
  updateMobilesentrixCartItem(id: string, updates: Partial<InsertMobilesentrixCartItem>): Promise<MobilesentrixCartItem>;
  deleteMobilesentrixCartItem(id: string): Promise<void>;
  clearMobilesentrixCart(credentialId: string): Promise<void>;
  
  // MobileSentrix Order Items
  getMobilesentrixOrderItems(orderId: string): Promise<MobilesentrixOrderItem[]>;
  createMobilesentrixOrderItem(item: InsertMobilesentrixOrderItem): Promise<MobilesentrixOrderItem>;
  updateMobilesentrixOrderItem(id: string, updates: Partial<InsertMobilesentrixOrderItem>): Promise<MobilesentrixOrderItem>;
  
  // External Product Mappings (Mappature SKU esterni → prodotti MonkeyPlan)
  listExternalProductMappings(resellerId: string, source?: string): Promise<ExternalProductMapping[]>;
  getExternalProductMapping(id: string): Promise<ExternalProductMapping | undefined>;
  getExternalProductMappingBySku(resellerId: string, source: string, externalSku: string): Promise<ExternalProductMapping | undefined>;
  createExternalProductMapping(mapping: InsertExternalProductMapping): Promise<ExternalProductMapping>;
  updateExternalProductMapping(id: string, updates: Partial<InsertExternalProductMapping>): Promise<ExternalProductMapping>;
  deleteExternalProductMapping(id: string): Promise<void>;
  
  // Service Catalog (Catalogo Interventi)
  listServiceItems(): Promise<ServiceItem[]>;
  getServiceItem(id: string): Promise<ServiceItem | undefined>;
  createServiceItem(item: InsertServiceItem): Promise<ServiceItem>;
  updateServiceItem(id: string, updates: Partial<InsertServiceItem>): Promise<ServiceItem>;
  deleteServiceItem(id: string): Promise<void>;
  
  // Service Item Prices (Listini Prezzi)
  listServiceItemPrices(serviceItemId: string): Promise<ServiceItemPrice[]>;
  listServiceItemPricesByReseller(resellerId: string): Promise<ServiceItemPrice[]>;
  listServiceItemPricesByRepairCenter(repairCenterId: string): Promise<ServiceItemPrice[]>;
  getServiceItemPricesForEntity(resellerId?: string, repairCenterId?: string): Promise<ServiceItemPrice[]>;
  getServiceItemPrice(id: string): Promise<ServiceItemPrice | undefined>;
  createServiceItemPrice(price: InsertServiceItemPrice): Promise<ServiceItemPrice>;
  updateServiceItemPrice(id: string, updates: Partial<InsertServiceItemPrice>): Promise<ServiceItemPrice>;
  deleteServiceItemPrice(id: string): Promise<void>;
  
  // Get effective price for a service item (considers reseller/repair center customizations)
  getEffectiveServicePrice(serviceItemId: string, resellerId?: string, repairCenterId?: string): Promise<{ priceCents: number; laborMinutes: number; source: 'base' | 'reseller' | 'repair_center' }>;
  
  // Reseller Staff Team Management
  listResellerStaff(resellerId: string): Promise<User[]>;
  
  // Repair Center Staff Team Management
  listRepairCenterStaff(repairCenterId: string): Promise<User[]>;
  listRepairCenterStaffHierarchical(resellerId: string): Promise<Array<{
    id: string;
    username: string;
    email: string;
    fullName: string;
    phone: string | null;
    role: string;
    isActive: boolean;
    repairCenterId: string | null;
    createdAt: Date | null;
    repairCenterName: string;
  }>>;
  createRepairCenterStaff(data: { repairCenterId: string; username: string; password: string; email: string; fullName: string; phone?: string }): Promise<User>;
  updateRepairCenterStaff(userId: string, repairCenterId: string, updates: Partial<{ username: string; email: string; fullName: string; phone: string; isActive: boolean }>): Promise<User>;
  deleteRepairCenterStaff(userId: string, repairCenterId: string): Promise<void>;
  resetRepairCenterStaffPassword(userId: string, repairCenterId: string, newPassword: string): Promise<void>;
  
  // Reseller Staff Permissions
  getStaffPermissions(userId: string): Promise<ResellerStaffPermission[]>;
  getStaffPermissionForModule(userId: string, module: string): Promise<ResellerStaffPermission | undefined>;
  createStaffPermission(permission: InsertResellerStaffPermission): Promise<ResellerStaffPermission>;
  updateStaffPermission(id: string, updates: Partial<Pick<ResellerStaffPermission, 'canRead' | 'canCreate' | 'canUpdate' | 'canDelete'>>): Promise<ResellerStaffPermission>;
  deleteStaffPermission(id: string): Promise<void>;
  deleteStaffPermissionsByUser(userId: string): Promise<void>;
  upsertStaffPermissions(userId: string, resellerId: string, permissions: { module: string; canRead: boolean; canCreate: boolean; canUpdate: boolean; canDelete: boolean }[]): Promise<ResellerStaffPermission[]>;
  checkStaffPermission(userId: string, module: string, action: 'read' | 'create' | 'update' | 'delete'): Promise<boolean>;
  
  // E-commerce: Customer Addresses
  listCustomerAddresses(customerId: string): Promise<CustomerAddress[]>;
  getCustomerAddress(id: string): Promise<CustomerAddress | undefined>;
  createCustomerAddress(address: InsertCustomerAddress): Promise<CustomerAddress>;
  updateCustomerAddress(id: string, updates: Partial<InsertCustomerAddress>): Promise<CustomerAddress>;
  deleteCustomerAddress(id: string): Promise<void>;
  setDefaultAddress(customerId: string, addressId: string, isBilling?: boolean): Promise<void>;
  
  // E-commerce: Shopping Cart
  getActiveCart(customerId: string | null, sessionId: string | null, resellerId: string): Promise<Cart | undefined>;
  getCart(id: string): Promise<Cart | undefined>;
  createCart(cart: InsertCart): Promise<Cart>;
  updateCart(id: string, updates: Partial<InsertCart>): Promise<Cart>;
  deleteCart(id: string): Promise<void>;
  clearExpiredCarts(): Promise<number>;
  
  // E-commerce: Cart Items
  listCartItems(cartId: string): Promise<CartItem[]>;
  getCartItem(id: string): Promise<CartItem | undefined>;
  getCartItemByProduct(cartId: string, productId: string): Promise<CartItem | undefined>;
  addCartItem(item: InsertCartItem): Promise<CartItem>;
  updateCartItem(id: string, updates: Partial<Pick<CartItem, 'quantity' | 'unitPrice' | 'totalPrice' | 'discount'>>): Promise<CartItem>;
  removeCartItem(id: string): Promise<void>;
  clearCart(cartId: string): Promise<void>;
  recalculateCartTotals(cartId: string): Promise<Cart>;
  
  // E-commerce: Sales Orders
  listSalesOrders(filters?: { resellerId?: string; customerId?: string; status?: string; branchId?: string }): Promise<SalesOrder[]>;
  getSalesOrder(id: string): Promise<SalesOrder | undefined>;
  getSalesOrderByNumber(orderNumber: string): Promise<SalesOrder | undefined>;
  createSalesOrder(order: InsertSalesOrder): Promise<SalesOrder>;
  updateSalesOrder(id: string, updates: Partial<InsertSalesOrder>): Promise<SalesOrder>;
  updateSalesOrderStatus(id: string, status: string, changedBy?: string, reason?: string): Promise<SalesOrder>;
  generateOrderNumber(resellerId: string): Promise<string>;
  
  // E-commerce: Sales Order Items
  listSalesOrderItems(orderId: string): Promise<SalesOrderItem[]>;
  getSalesOrderItem(id: string): Promise<SalesOrderItem | undefined>;
  createSalesOrderItem(item: InsertSalesOrderItem): Promise<SalesOrderItem>;
  updateSalesOrderItem(id: string, updates: Partial<InsertSalesOrderItem>): Promise<SalesOrderItem>;
  deleteSalesOrderItem(id: string): Promise<void>;
  
  // E-commerce: Sales Order Payments
  listSalesOrderPayments(orderId: string): Promise<SalesOrderPayment[]>;
  listAllPayments(filters?: { status?: string; method?: string; orderType?: string }): Promise<SalesOrderPayment[]>;
  getSalesOrderPayment(id: string): Promise<SalesOrderPayment | undefined>;
  getPaymentByOrderId(orderId: string, orderType?: string): Promise<SalesOrderPayment | undefined>;
  createSalesOrderPayment(payment: InsertSalesOrderPayment): Promise<SalesOrderPayment>;
  updateSalesOrderPayment(id: string, updates: Partial<InsertSalesOrderPayment>): Promise<SalesOrderPayment>;
  
  // E-commerce: Sales Order Shipments
  listSalesOrderShipments(orderId: string): Promise<SalesOrderShipment[]>;
  getSalesOrderShipment(id: string): Promise<SalesOrderShipment | undefined>;
  createSalesOrderShipment(shipment: InsertSalesOrderShipment): Promise<SalesOrderShipment>;
  updateSalesOrderShipment(id: string, updates: Partial<InsertSalesOrderShipment>): Promise<SalesOrderShipment>;
  
  // E-commerce: Shipment Tracking
  listShipmentTrackingEvents(shipmentId: string): Promise<ShipmentTrackingEvent[]>;
  createShipmentTrackingEvent(event: InsertShipmentTrackingEvent): Promise<ShipmentTrackingEvent>;
  
  // E-commerce: Stock Reservations
  listStockReservations(orderId: string): Promise<StockReservation[]>;
  createStockReservation(reservation: InsertStockReservation): Promise<StockReservation>;
  updateStockReservation(id: string, updates: Partial<InsertStockReservation>): Promise<StockReservation>;
  releaseStockReservation(id: string): Promise<void>;
  commitStockReservation(id: string): Promise<void>;
  
  // E-commerce: Order State History
  listSalesOrderStateHistory(orderId: string): Promise<SalesOrderStateHistoryEntry[]>;
  createSalesOrderStateHistory(entry: InsertSalesOrderStateHistoryEntry): Promise<SalesOrderStateHistoryEntry>;
  
  // E-commerce: Sales Order Returns
  listSalesOrderReturns(filters?: { status?: string; resellerId?: string; customerId?: string; orderId?: string }): Promise<SalesOrderReturn[]>;
  getSalesOrderReturn(id: string): Promise<SalesOrderReturn | undefined>;
  getSalesOrderReturnByNumber(returnNumber: string): Promise<SalesOrderReturn | undefined>;
  createSalesOrderReturn(data: InsertSalesOrderReturn): Promise<SalesOrderReturn>;
  updateSalesOrderReturn(id: string, updates: Partial<InsertSalesOrderReturn>): Promise<SalesOrderReturn>;
  generateReturnNumber(resellerId: string): Promise<string>;
  
  // E-commerce: Sales Order Return Items
  listSalesOrderReturnItems(returnId: string): Promise<SalesOrderReturnItem[]>;
  getSalesOrderReturnItem(id: string): Promise<SalesOrderReturnItem | undefined>;
  createSalesOrderReturnItem(item: InsertSalesOrderReturnItem): Promise<SalesOrderReturnItem>;
  updateSalesOrderReturnItem(id: string, updates: Partial<InsertSalesOrderReturnItem>): Promise<SalesOrderReturnItem>;
  deleteSalesOrderReturnItem(id: string): Promise<void>;
  
  // Warehouse Management
  listWarehouses(filters?: { ownerType?: string; ownerId?: string; isActive?: boolean }): Promise<Warehouse[]>;
  getWarehouse(id: string): Promise<Warehouse | undefined>;
  getWarehouseByOwner(ownerType: string, ownerId: string): Promise<Warehouse | undefined>;
  createWarehouse(data: InsertWarehouse): Promise<Warehouse>;
  updateWarehouse(id: string, updates: Partial<InsertWarehouse>): Promise<Warehouse>;
  deleteWarehouse(id: string): Promise<void>;
  ensureDefaultWarehouse(ownerType: string, ownerId: string, ownerName: string): Promise<Warehouse>;
  
  // Warehouse Stock
  listWarehouseStock(warehouseId: string): Promise<WarehouseStock[]>;
  getWarehouseStockItem(warehouseId: string, productId: string): Promise<WarehouseStock | undefined>;
  getProductWarehouseStocks(productId: string): Promise<Array<WarehouseStock & { warehouse: Warehouse }>>;
  upsertWarehouseStock(data: InsertWarehouseStock): Promise<WarehouseStock>;
  updateWarehouseStock(id: string, updates: { minStock?: number | null; location?: string | null }): Promise<WarehouseStock>;
  updateWarehouseStockQuantity(warehouseId: string, productId: string, quantityDelta: number, location?: string | null): Promise<WarehouseStock>;
  listWarehouseProductsWithStock(warehouseId: string, search?: string, productType?: string): Promise<Array<Product & { availableQuantity: number }>>;
  listAccessibleWarehouses(resellerId: string): Promise<Warehouse[]>;
  
  // Product Search with Stock Availability
  searchProductsWithStock(filters: {
    query?: string;
    productType?: string;
    warehouseIds: string[];
  }): Promise<Array<{
    product: Product;
    productType: string;
    warehouses: Array<{
      warehouseId: string;
      warehouseName: string;
      ownerType: string;
      ownerId: string;
      ownerName: string;
      quantity: number;
    }>;
  }>>;
  
  // Warehouse Movements
  listWarehouseMovements(filters?: { warehouseId?: string; productId?: string }): Promise<WarehouseMovement[]>;
  createWarehouseMovement(data: InsertWarehouseMovement): Promise<WarehouseMovement>;
  
  // Warehouse Transfers
  listWarehouseTransfers(filters?: { sourceWarehouseId?: string; destinationWarehouseId?: string; status?: string }): Promise<WarehouseTransfer[]>;
  getWarehouseTransfer(id: string): Promise<WarehouseTransfer | undefined>;
  createWarehouseTransfer(data: InsertWarehouseTransfer): Promise<WarehouseTransfer>;
  updateWarehouseTransfer(id: string, updates: Partial<WarehouseTransfer>): Promise<WarehouseTransfer>;
  generateTransferNumber(): Promise<string>;
  
  // Warehouse Transfer Items
  listWarehouseTransferItems(transferId: string): Promise<WarehouseTransferItem[]>;
  createWarehouseTransferItem(data: InsertWarehouseTransferItem): Promise<WarehouseTransferItem>;
  updateWarehouseTransferItem(id: string, updates: Partial<WarehouseTransferItem>): Promise<WarehouseTransferItem>;
  
  // Transfer Requests (da repair_center/sub_reseller)
  listTransferRequests(filters?: { 
    requesterId?: string; 
    requesterType?: string; 
    targetResellerId?: string; 
    status?: string;
    sourceWarehouseId?: string;
  }): Promise<TransferRequest[]>;
  countIncomingTransferRequests(targetResellerId: string, status?: string): Promise<number>;
  getTransferRequest(id: string): Promise<TransferRequest | undefined>;
  createTransferRequest(data: InsertTransferRequest): Promise<TransferRequest>;
  updateTransferRequest(id: string, updates: Partial<TransferRequest>): Promise<TransferRequest>;
  generateTransferRequestNumber(): Promise<string>;
  
  // Transfer Request Items
  listTransferRequestItems(requestId: string): Promise<TransferRequestItem[]>;
  createTransferRequestItem(data: InsertTransferRequestItem): Promise<TransferRequestItem>;
  updateTransferRequestItem(id: string, updates: Partial<TransferRequestItem>): Promise<TransferRequestItem>;
  
  // B2B Reseller Purchase Orders
  listResellerPurchaseOrders(filters?: { resellerId?: string; status?: string }): Promise<ResellerPurchaseOrder[]>;
  getResellerPurchaseOrder(id: string): Promise<ResellerPurchaseOrder | undefined>;
  getResellerPurchaseOrderByNumber(orderNumber: string): Promise<ResellerPurchaseOrder | undefined>;
  createResellerPurchaseOrder(data: InsertResellerPurchaseOrder): Promise<ResellerPurchaseOrder>;
  updateResellerPurchaseOrder(id: string, updates: Partial<ResellerPurchaseOrder>): Promise<ResellerPurchaseOrder>;
  generateB2BOrderNumber(): Promise<string>;
  
  // B2B Reseller Purchase Order Items
  listResellerPurchaseOrderItems(orderId: string): Promise<ResellerPurchaseOrderItem[]>;
  createResellerPurchaseOrderItem(data: InsertResellerPurchaseOrderItem): Promise<ResellerPurchaseOrderItem>;
  updateResellerPurchaseOrderItem(id: string, updates: Partial<ResellerPurchaseOrderItem>): Promise<ResellerPurchaseOrderItem>;
  deleteResellerPurchaseOrderItem(id: string): Promise<void>;
  
  // B2B Catalog (prodotti admin con stock disponibile)
  getAdminCatalogForReseller(resellerId: string): Promise<Array<{
    product: Product;
    adminStock: number;
    b2bPrice: number;
    minimumOrderQuantity: number;
  }>>;
  
  // B2B Returns (Resi ordini B2B)
  listB2bReturns(filters?: { resellerId?: string; status?: string; orderId?: string }): Promise<B2bReturn[]>;
  getB2bReturn(id: string): Promise<B2bReturn | undefined>;
  getB2bReturnByNumber(returnNumber: string): Promise<B2bReturn | undefined>;
  createB2bReturn(data: InsertB2bReturn): Promise<B2bReturn>;
  updateB2bReturn(id: string, updates: Partial<B2bReturn>): Promise<B2bReturn>;
  generateB2bReturnNumber(): Promise<string>;
  
  // B2B Return Items
  listB2bReturnItems(returnId: string): Promise<B2bReturnItem[]>;
  createB2bReturnItem(data: InsertB2bReturnItem): Promise<B2bReturnItem>;
  updateB2bReturnItem(id: string, updates: Partial<B2bReturnItem>): Promise<B2bReturnItem>;
  
  // B2B Repair Center Purchase Orders
  listRepairCenterPurchaseOrders(filters?: { repairCenterId?: string; resellerId?: string; status?: string }): Promise<RepairCenterPurchaseOrder[]>;
  getRepairCenterPurchaseOrder(id: string): Promise<RepairCenterPurchaseOrder | undefined>;
  createRepairCenterPurchaseOrder(data: InsertRepairCenterPurchaseOrder): Promise<RepairCenterPurchaseOrder>;
  updateRepairCenterPurchaseOrder(id: string, updates: Partial<RepairCenterPurchaseOrder>): Promise<RepairCenterPurchaseOrder>;
  generateRCB2BOrderNumber(): Promise<string>;
  
  // B2B Repair Center Purchase Order Items
  listRepairCenterPurchaseOrderItems(orderId: string): Promise<RepairCenterPurchaseOrderItem[]>;
  createRepairCenterPurchaseOrderItem(data: InsertRepairCenterPurchaseOrderItem): Promise<RepairCenterPurchaseOrderItem>;
  
  // B2B Repair Center Returns (Resi RC -> Reseller)
  listRcB2bReturns(filters?: { repairCenterId?: string; resellerId?: string; status?: string; orderId?: string }): Promise<RcB2bReturn[]>;
  getRcB2bReturn(id: string): Promise<RcB2bReturn | undefined>;
  createRcB2bReturn(data: InsertRcB2bReturn): Promise<RcB2bReturn>;
  updateRcB2bReturn(id: string, updates: Partial<RcB2bReturn>): Promise<RcB2bReturn>;
  generateRcB2bReturnNumber(): Promise<string>;
  
  // B2B Repair Center Return Items
  listRcB2bReturnItems(returnId: string): Promise<RcB2bReturnItem[]>;
  createRcB2bReturnItem(data: InsertRcB2bReturnItem): Promise<RcB2bReturnItem>;
  
  // Marketplace (Reseller-to-Reseller B2B)
  listMarketplaceCatalog(buyerResellerId: string): Promise<Array<{
    product: Product;
    sellerResellerId: string;
    sellerName: string;
    availableStock: number;
    marketplacePrice: number;
    minQuantity: number;
  }>>;
  listMarketplaceOrders(filters?: { buyerResellerId?: string; sellerResellerId?: string; status?: string }): Promise<MarketplaceOrder[]>;
  getMarketplaceOrder(id: string): Promise<MarketplaceOrder | undefined>;
  getMarketplaceOrderByNumber(orderNumber: string): Promise<MarketplaceOrder | undefined>;
  createMarketplaceOrder(data: InsertMarketplaceOrder): Promise<MarketplaceOrder>;
  updateMarketplaceOrder(id: string, updates: Partial<MarketplaceOrder>): Promise<MarketplaceOrder>;
  generateMarketplaceOrderNumber(): Promise<string>;
  
  // Marketplace Order Items
  listMarketplaceOrderItems(orderId: string): Promise<MarketplaceOrderItem[]>;
  createMarketplaceOrderItem(data: InsertMarketplaceOrderItem): Promise<MarketplaceOrderItem>;
  
  // Remote Repair Requests
  listRemoteRepairRequests(filters?: { 
    customerId?: string; 
    resellerId?: string; 
    subResellerId?: string;
    assignedCenterId?: string; 
    requestedCenterId?: string;
    status?: string;
  }): Promise<RemoteRepairRequest[]>;
  getRemoteRepairRequest(id: string): Promise<RemoteRepairRequest | undefined>;
  createRemoteRepairRequest(data: InsertRemoteRepairRequest): Promise<RemoteRepairRequest>;
  updateRemoteRepairRequest(id: string, updates: UpdateRemoteRepairRequest): Promise<RemoteRepairRequest>;
  generateRemoteRequestNumber(): Promise<string>;
  getResellerRemoteRequestPendingCount(resellerId: string): Promise<number>;
  createRepairFromRemoteRequest(remoteRequestId: string): Promise<{ repairOrder: RepairOrder; remoteRequest: RemoteRepairRequest }>;
  
  // Service Orders
  listServiceOrders(filters?: { customerId?: string; resellerId?: string; repairCenterId?: string; status?: string }): Promise<ServiceOrder[]>;
  getServiceOrder(id: string): Promise<ServiceOrder | undefined>;
  getServiceOrderByNumber(orderNumber: string): Promise<ServiceOrder | undefined>;
  createServiceOrder(data: InsertServiceOrder): Promise<ServiceOrder>;
  updateServiceOrder(id: string, updates: Partial<ServiceOrder>): Promise<ServiceOrder>;
  generateServiceOrderNumber(): Promise<string>;
  
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

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async getUserByPartitaIva(partitaIva: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.partitaIva, partitaIva));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUser(id: string, updates: Partial<Pick<User, 'username' | 'email' | 'fullName' | 'role' | 'isActive' | 'repairCenterId' | 'resellerId' | 'resellerCategory' | 'password' | 'phone' | 'partitaIva' | 'ragioneSociale' | 'codiceFiscale' | 'indirizzo' | 'citta' | 'cap' | 'provincia' | 'pec' | 'codiceUnivoco' | 'logoUrl'>>): Promise<User> {
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

  async listCustomers(filters?: { resellerId?: string; repairCenterId?: string }): Promise<User[]> {
    if (filters?.resellerId) {
      return await db
        .select()
        .from(users)
        .where(
          and(
            eq(users.role, 'customer'),
            eq(users.resellerId, filters.resellerId)
          )
        )
        .orderBy(desc(users.createdAt));
    }
    
    if (filters?.repairCenterId) {
      const customerIds = await db
        .selectDistinct({ customerId: repairOrders.customerId })
        .from(repairOrders)
        .where(eq(repairOrders.repairCenterId, filters.repairCenterId));
      
      const ids = customerIds.map(c => c.customerId).filter((id): id is string => id !== null);
      
      if (ids.length === 0) {
        return [];
      }
      
      return await db
        .select()
        .from(users)
        .where(
          and(
            eq(users.role, 'customer'),
            inArray(users.id, ids)
          )
        )
        .orderBy(desc(users.createdAt));
    }
    
    return await db
      .select()
      .from(users)
      .where(eq(users.role, 'customer'))
      .orderBy(desc(users.createdAt));
  }

  async deleteUser(id: string): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  }

  // Context Switching
  async getChildResellers(parentResellerId: string): Promise<User[]> {
    return await db
      .select()
      .from(users)
      .where(
        and(
          eq(users.role, 'reseller'),
          eq(users.parentResellerId, parentResellerId),
          eq(users.isActive, true)
        )
      )
      .orderBy(users.fullName);
  }

  async getSubResellerDetail(parentResellerId: string, subResellerId: string): Promise<User | null> {
    const [subReseller] = await db
      .select()
      .from(users)
      .where(
        and(
          eq(users.id, subResellerId),
          eq(users.role, 'reseller'),
          eq(users.parentResellerId, parentResellerId)
        )
      );
    return subReseller || null;
  }

  async getRepairCentersForReseller(resellerId: string): Promise<RepairCenter[]> {
    return await db
      .select()
      .from(repairCenters)
      .where(
        and(
          eq(repairCenters.resellerId, resellerId),
          eq(repairCenters.isActive, true)
        )
      )
      .orderBy(repairCenters.name);
  }

  // Customer-RepairCenter Many-to-Many
  async listRepairCentersForCustomer(customerId: string): Promise<RepairCenter[]> {
    const results = await db
      .select({
        repairCenter: repairCenters,
      })
      .from(customerRepairCenters)
      .innerJoin(repairCenters, eq(customerRepairCenters.repairCenterId, repairCenters.id))
      .where(eq(customerRepairCenters.customerId, customerId));
    return results.map(r => r.repairCenter);
  }

  async setCustomerRepairCenters(customerId: string, repairCenterIds: string[]): Promise<void> {
    // De-duplicate and filter empty values
    const filteredIds = repairCenterIds.filter(id => id && id.trim());
    const uniqueRepairCenterIds = Array.from(new Set(filteredIds));
    
    // Delete existing associations
    await db.delete(customerRepairCenters).where(eq(customerRepairCenters.customerId, customerId));
    
    // Insert new associations
    if (uniqueRepairCenterIds.length > 0) {
      await db.insert(customerRepairCenters).values(
        uniqueRepairCenterIds.map(repairCenterId => ({
          customerId,
          repairCenterId,
        }))
      );
    }
  }

  async listCustomerIdsForRepairCenter(repairCenterId: string): Promise<string[]> {
    const results = await db
      .select({ customerId: customerRepairCenters.customerId })
      .from(customerRepairCenters)
      .where(eq(customerRepairCenters.repairCenterId, repairCenterId));
    return results.map(r => r.customerId);
  }

  async ensureCustomerRepairCenterAssociation(customerId: string, repairCenterId: string): Promise<void> {
    if (!customerId || !repairCenterId) return;
    
    // Check if association already exists
    const existing = await db
      .select()
      .from(customerRepairCenters)
      .where(and(
        eq(customerRepairCenters.customerId, customerId),
        eq(customerRepairCenters.repairCenterId, repairCenterId)
      ))
      .limit(1);
    
    // If not exists, create it
    if (existing.length === 0) {
      await db.insert(customerRepairCenters).values({
        customerId,
        repairCenterId,
      });
    }
  }

  // Staff-RepairCenter Many-to-Many
  async listRepairCentersForStaff(staffId: string): Promise<RepairCenter[]> {
    const results = await db
      .select({
        repairCenter: repairCenters,
      })
      .from(staffRepairCenters)
      .innerJoin(repairCenters, eq(staffRepairCenters.repairCenterId, repairCenters.id))
      .where(eq(staffRepairCenters.staffId, staffId));
    return results.map(r => r.repairCenter);
  }

  async setStaffRepairCenters(staffId: string, repairCenterIds: string[]): Promise<void> {
    // De-duplicate and filter empty values
    const filteredIds = repairCenterIds.filter(id => id && id.trim());
    const uniqueRepairCenterIds = Array.from(new Set(filteredIds));
    
    // Delete existing associations
    await db.delete(staffRepairCenters).where(eq(staffRepairCenters.staffId, staffId));
    
    // Insert new associations
    if (uniqueRepairCenterIds.length > 0) {
      await db.insert(staffRepairCenters).values(
        uniqueRepairCenterIds.map(repairCenterId => ({
          staffId,
          repairCenterId,
        }))
      );
    }
  }

  async listAllCustomerRepairCenters(): Promise<CustomerRepairCenter[]> {
    return await db.select().from(customerRepairCenters);
  }

  async listAllStaffRepairCenters(): Promise<StaffRepairCenter[]> {
    return await db.select().from(staffRepairCenters);
  }

  // Staff-SubReseller Many-to-Many
  async listSubResellersForStaff(staffId: string): Promise<User[]> {
    const results = await db
      .select({
        user: users,
      })
      .from(staffSubResellers)
      .innerJoin(users, eq(staffSubResellers.subResellerId, users.id))
      .where(eq(staffSubResellers.staffId, staffId));
    return results.map(r => r.user);
  }

  async listSubResellerIdsForStaff(staffId: string): Promise<string[]> {
    const results = await db
      .select({ subResellerId: staffSubResellers.subResellerId })
      .from(staffSubResellers)
      .where(eq(staffSubResellers.staffId, staffId));
    return results.map(r => r.subResellerId);
  }

  async setStaffSubResellers(staffId: string, subResellerIds: string[]): Promise<void> {
    // De-duplicate and filter empty values
    const filteredIds = subResellerIds.filter(id => id && id.trim());
    const uniqueSubResellerIds = Array.from(new Set(filteredIds));
    
    // Delete existing associations
    await db.delete(staffSubResellers).where(eq(staffSubResellers.staffId, staffId));
    
    // Insert new associations
    if (uniqueSubResellerIds.length > 0) {
      await db.insert(staffSubResellers).values(
        uniqueSubResellerIds.map(subResellerId => ({
          staffId,
          subResellerId,
        }))
      );
    }
  }

  async listAllStaffSubResellers(): Promise<StaffSubReseller[]> {
    return await db.select().from(staffSubResellers);
  }

  // Repair Centers
  async listRepairCenters(): Promise<RepairCenter[]> {
    return await db.select().from(repairCenters).orderBy(desc(repairCenters.createdAt));
  }

  async getRepairCenter(id: string): Promise<RepairCenter | undefined> {
    const [center] = await db.select().from(repairCenters).where(eq(repairCenters.id, id));
    return center || undefined;
  }

  // Get all resellers in the system (for admin visibility)
  async getAllResellers(): Promise<User[]> {
    return await db.select().from(users).where(eq(users.role, 'reseller')).orderBy(desc(users.createdAt));
  }

  // Alias for listRepairCenters (for admin visibility)
  async getAllRepairCenters(): Promise<RepairCenter[]> {
    return this.listRepairCenters();
  }

  // Get sub-resellers by parent IDs (for hierarchical queries)
  async getUsersByParentResellerIds(parentIds: string[]): Promise<User[]> {
    if (parentIds.length === 0) return [];
    return db.select().from(users).where(inArray(users.parentResellerId, parentIds));
  }

  // Get repair centers by multiple reseller IDs (for hierarchical queries)
  async getRepairCentersByResellerIds(resellerIds: string[]): Promise<RepairCenter[]> {
    if (resellerIds.length === 0) return [];
    return db.select().from(repairCenters)
      .where(or(
        inArray(repairCenters.resellerId, resellerIds),
        inArray(repairCenters.subResellerId, resellerIds)
      ));
  }

  async getResellerRepairCenterDetail(resellerId: string, centerId: string): Promise<{
    center: RepairCenter;
    stats: {
      totalRepairs: number;
      pendingRepairs: number;
      completedRepairs: number;
      inProgressRepairs: number;
      totalRevenue: number;
    };
    recentRepairs: any[];
    staffCount: number;
    customersCount: number;
  } | null> {
    const center = await this.getRepairCenter(centerId);
    if (!center) return null;
    
    // Verify ownership - center must belong to this reseller or one of their sub-resellers
    const resellerSubResellers = await db.select({ id: users.id })
      .from(users)
      .where(and(
        eq(users.parentResellerId, resellerId),
        eq(users.role, "reseller")
      ));
    const subResellerIds = resellerSubResellers.map(sr => sr.id);
    const allowedResellerIds = [resellerId, ...subResellerIds];
    
    if (!center.resellerId || !allowedResellerIds.includes(center.resellerId)) {
      return null;
    }

    // Get repair statistics
    const allRepairs = await db.select({
      id: repairOrders.id,
      status: repairOrders.status,
      finalCost: repairOrders.finalCost,
    }).from(repairOrders).where(eq(repairOrders.repairCenterId, centerId));

    const totalRepairs = allRepairs.length;
    const pendingRepairs = allRepairs.filter(r => r.status === "pending" || r.status === "attesa_ricambi" || r.status === "preventivo_emesso").length;
    const completedRepairs = allRepairs.filter(r => r.status === "consegnato" || r.status === "pronto_ritiro").length;
    const inProgressRepairs = allRepairs.filter(r => r.status === "in_riparazione" || r.status === "in_diagnosi" || r.status === "in_test").length;
    const totalRevenue = allRepairs.reduce((sum, r) => sum + (r.finalCost || 0), 0);

    // Get recent repairs with customer info
    const recentRepairsData = await db.select({
      id: repairOrders.id,
      orderNumber: repairOrders.orderNumber,
      status: repairOrders.status,
      deviceType: repairOrders.deviceType,
      brand: repairOrders.brand,
      deviceModel: repairOrders.deviceModel,
      issueDescription: repairOrders.issueDescription,
      finalCost: repairOrders.finalCost,
      estimatedCost: repairOrders.estimatedCost,
      createdAt: repairOrders.createdAt,
      customerName: users.fullName,
      customerEmail: users.email,
    })
    .from(repairOrders)
    .leftJoin(users, eq(repairOrders.customerId, users.id))
    .where(eq(repairOrders.repairCenterId, centerId))
    .orderBy(desc(repairOrders.createdAt))
    .limit(10);

    // Get staff count (users assigned to this center)
    const staffResult = await db.select({ count: sql<number>`count(*)` })
      .from(staffRepairCenters)
      .where(eq(staffRepairCenters.repairCenterId, centerId));
    const staffCount = Number(staffResult[0]?.count || 0);

    // Get customers count
    const customersResult = await db.select({ count: sql<number>`count(*)` })
      .from(customerRepairCenters)
      .where(eq(customerRepairCenters.repairCenterId, centerId));
    const customersCount = Number(customersResult[0]?.count || 0);

    return {
      center,
      stats: {
        totalRepairs,
        pendingRepairs,
        completedRepairs,
        inProgressRepairs,
        totalRevenue,
      },
      recentRepairs: recentRepairsData,
      staffCount,
      customersCount,
    };
  }

  async getRepairCenterRepairs(centerId: string, options?: { limit?: number; offset?: number; status?: string }): Promise<{ repairs: any[]; total: number }> {
    const limit = options?.limit || 20;
    const offset = options?.offset || 0;
    
    let conditions = [eq(repairOrders.repairCenterId, centerId)];
    if (options?.status && options.status !== "all") {
      conditions.push(eq(repairOrders.status, options.status as any));
    }

    const repairsData = await db.select({
      id: repairOrders.id,
      orderNumber: repairOrders.orderNumber,
      status: repairOrders.status,
      deviceType: repairOrders.deviceType,
      brand: repairOrders.brand,
      deviceModel: repairOrders.deviceModel,
      issueDescription: repairOrders.issueDescription,
      finalCost: repairOrders.finalCost,
      estimatedCost: repairOrders.estimatedCost,
      createdAt: repairOrders.createdAt,
      updatedAt: repairOrders.updatedAt,
      customerName: users.fullName,
      customerEmail: users.email,
      customerPhone: users.phone,
    })
    .from(repairOrders)
    .leftJoin(users, eq(repairOrders.customerId, users.id))
    .where(and(...conditions))
    .orderBy(desc(repairOrders.createdAt))
    .limit(limit)
    .offset(offset);

    const totalResult = await db.select({ count: sql<number>`count(*)` })
      .from(repairOrders)
      .where(and(...conditions));
    const total = Number(totalResult[0]?.count || 0);

    return { repairs: repairsData, total };
  }

  async createRepairCenter(insertCenter: InsertRepairCenter): Promise<RepairCenter> {
    const [center] = await db.insert(repairCenters).values(insertCenter).returning();
    return center;
  }

  async updateRepairCenter(id: string, updates: Partial<Pick<RepairCenter, 'name' | 'address' | 'city' | 'phone' | 'email' | 'resellerId' | 'isActive' | 'hourlyRateCents' | 'cap' | 'provincia' | 'ragioneSociale' | 'partitaIva' | 'codiceFiscale' | 'iban' | 'codiceUnivoco' | 'pec'>>): Promise<RepairCenter> {
    const [center] = await db.update(repairCenters).set(updates).where(eq(repairCenters.id, id)).returning();
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
    // Genera barcode univoco se non fornito
    let barcode = insertProduct.barcode;
    if (!barcode) {
      barcode = await this.generateUniqueBarcode();
    }
    
    const [product] = await db.insert(products).values({ ...insertProduct, barcode }).returning();
    return product;
  }
  
  // Genera barcode univoco formato MP-AAMM-XXXXXX
  private async generateUniqueBarcode(): Promise<string> {
    const chars = "ABCDEFGHJKMNPQRSTUVWXYZ0123456789";
    let attempts = 0;
    const maxAttempts = 10;
    
    while (attempts < maxAttempts) {
      const now = new Date();
      const year = now.getFullYear().toString().slice(-2);
      const month = (now.getMonth() + 1).toString().padStart(2, "0");
      
      let random = "";
      for (let i = 0; i < 6; i++) {
        random += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      
      const barcode = `MP-${year}${month}-${random}`;
      
      // Verifica unicità
      const existing = await db.select({ id: products.id })
        .from(products)
        .where(eq(products.barcode, barcode))
        .limit(1);
      
      if (existing.length === 0) {
        return barcode;
      }
      
      attempts++;
    }
    
    // Fallback con timestamp
    const timestamp = Date.now().toString(36).toUpperCase();
    return `MP-${new Date().getFullYear().toString().slice(-2)}${(new Date().getMonth() + 1).toString().padStart(2, "0")}-${timestamp.slice(-6)}`;
  }

  // Backfill barcode per prodotti esistenti senza barcode
  async backfillProductBarcodes(): Promise<{ updated: number; errors: string[] }> {
    const errors: string[] = [];
    let updated = 0;
    
    // Trova prodotti senza barcode
    const productsWithoutBarcode = await db.select({ id: products.id, name: products.name })
      .from(products)
      .where(isNull(products.barcode));
    
    for (const product of productsWithoutBarcode) {
      try {
        const barcode = await this.generateUniqueBarcode();
        await db.update(products)
          .set({ barcode, updatedAt: new Date() })
          .where(eq(products.id, product.id));
        updated++;
      } catch (error) {
        errors.push(`Errore per prodotto ${product.id}: ${error}`);
      }
    }
    
    return { updated, errors };
  }

  async deleteProduct(id: string): Promise<void> {
    await db.delete(products).where(eq(products.id, id));
  }

  async listProductsByReseller(resellerId: string): Promise<Product[]> {
    return await db.select().from(products)
      .where(eq(products.createdBy, resellerId))
      .orderBy(desc(products.createdAt));
  }

  async updateProduct(id: string, updates: Partial<InsertProduct>): Promise<Product> {
    const [product] = await db.update(products)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(products.id, id))
      .returning();
    if (!product) {
      throw new Error("Prodotto non trovato");
    }
    return product;
  }

  // Product Device Compatibilities
  async listProductCompatibilities(productId: string): Promise<ProductDeviceCompatibility[]> {
    return await db.select().from(productDeviceCompatibilities)
      .where(eq(productDeviceCompatibilities.productId, productId));
  }

  async addProductCompatibility(compatibility: InsertProductDeviceCompatibility): Promise<ProductDeviceCompatibility> {
    const [result] = await db.insert(productDeviceCompatibilities).values(compatibility).returning();
    return result;
  }

  async removeProductCompatibility(id: string): Promise<void> {
    await db.delete(productDeviceCompatibilities).where(eq(productDeviceCompatibilities.id, id));
  }

  async setProductCompatibilities(productId: string, compatibilities: Omit<InsertProductDeviceCompatibility, 'productId'>[]): Promise<ProductDeviceCompatibility[]> {
    // Delete existing compatibilities for this product
    await db.delete(productDeviceCompatibilities).where(eq(productDeviceCompatibilities.productId, productId));
    
    if (compatibilities.length === 0) {
      return [];
    }
    
    // Insert new compatibilities
    const toInsert = compatibilities.map(c => ({ ...c, productId }));
    const results = await db.insert(productDeviceCompatibilities).values(toInsert).returning();
    return results;
  }

  // Product Prices (prezzi personalizzati per reseller - gestiti da admin)
  async listProductPrices(filters?: { productId?: string; resellerId?: string }): Promise<ProductPrice[]> {
    let query = db.select().from(productPrices);
    
    if (filters) {
      const conditions = [];
      if (filters.productId) conditions.push(eq(productPrices.productId, filters.productId));
      if (filters.resellerId) conditions.push(eq(productPrices.resellerId, filters.resellerId));
      
      if (conditions.length > 0) {
        query = query.where(and(...conditions)) as any;
      }
    }
    
    return await query.orderBy(desc(productPrices.createdAt));
  }

  async getProductPrice(id: string): Promise<ProductPrice | undefined> {
    const [price] = await db.select().from(productPrices).where(eq(productPrices.id, id));
    return price || undefined;
  }

  async getProductPriceForReseller(productId: string, resellerId: string): Promise<ProductPrice | undefined> {
    const [price] = await db.select().from(productPrices)
      .where(and(
        eq(productPrices.productId, productId),
        eq(productPrices.resellerId, resellerId),
        eq(productPrices.isActive, true)
      ));
    return price || undefined;
  }

  async createProductPrice(insertPrice: InsertProductPrice): Promise<ProductPrice> {
    const [price] = await db.insert(productPrices).values(insertPrice).returning();
    return price;
  }

  async updateProductPrice(id: string, updates: Partial<Pick<ProductPrice, 'priceCents' | 'costPriceCents' | 'isActive'>>): Promise<ProductPrice> {
    const [price] = await db.update(productPrices)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(productPrices.id, id))
      .returning();
    return price;
  }

  async deleteProductPrice(id: string): Promise<void> {
    await db.delete(productPrices).where(eq(productPrices.id, id));
  }

  // Reseller Products (assegnazione prodotti globali ai reseller)
  async listResellerProducts(filters?: { resellerId?: string; productId?: string; isPublished?: boolean }): Promise<ResellerProduct[]> {
    let query = db.select().from(resellerProducts);
    
    if (filters) {
      const conditions = [];
      if (filters.resellerId) conditions.push(eq(resellerProducts.resellerId, filters.resellerId));
      if (filters.productId) conditions.push(eq(resellerProducts.productId, filters.productId));
      if (filters.isPublished !== undefined) conditions.push(eq(resellerProducts.isPublished, filters.isPublished));
      
      if (conditions.length > 0) {
        query = query.where(and(...conditions)) as any;
      }
    }
    
    return await query.orderBy(desc(resellerProducts.createdAt));
  }

  async getResellerProduct(productId: string, resellerId: string): Promise<ResellerProduct | undefined> {
    const [rp] = await db.select().from(resellerProducts)
      .where(and(
        eq(resellerProducts.productId, productId),
        eq(resellerProducts.resellerId, resellerId)
      ));
    return rp || undefined;
  }

  async assignProductToReseller(data: InsertResellerProduct): Promise<ResellerProduct> {
    const [rp] = await db.insert(resellerProducts).values(data).returning();
    return rp;
  }

  async assignProductToResellers(productId: string, resellerIds: string[], options?: { inheritedFrom?: string; createdBy?: string }): Promise<ResellerProduct[]> {
    if (resellerIds.length === 0) return [];
    
    const values = resellerIds.map(resellerId => ({
      productId,
      resellerId,
      isPublished: false,
      inheritedFrom: options?.inheritedFrom || null,
      createdBy: options?.createdBy || null,
    }));
    
    const result = await db.insert(resellerProducts)
      .values(values)
      .onConflictDoNothing()
      .returning();
    
    return result;
  }

  async updateResellerProduct(id: string, updates: Partial<Pick<ResellerProduct, 'isPublished' | 'customPriceCents' | 'canOverridePrice' | 'canUnpublish'>>): Promise<ResellerProduct> {
    const [rp] = await db.update(resellerProducts)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(resellerProducts.id, id))
      .returning();
    if (!rp) throw new Error("Assegnazione prodotto non trovata");
    return rp;
  }

  async updateResellerProductByProductAndReseller(productId: string, resellerId: string, updates: Partial<Pick<ResellerProduct, 'isPublished' | 'customPriceCents'>>): Promise<ResellerProduct> {
    const [rp] = await db.update(resellerProducts)
      .set({ ...updates, updatedAt: new Date() })
      .where(and(
        eq(resellerProducts.productId, productId),
        eq(resellerProducts.resellerId, resellerId)
      ))
      .returning();
    if (!rp) throw new Error("Assegnazione prodotto non trovata");
    return rp;
  }

  async removeProductFromReseller(productId: string, resellerId: string): Promise<void> {
    await db.delete(resellerProducts)
      .where(and(
        eq(resellerProducts.productId, productId),
        eq(resellerProducts.resellerId, resellerId)
      ));
  }

  async getShopProductsForSeller(sellerId: string): Promise<Array<Product & { shopPrice: number; sellerName: string }>> {
    // Se sellerId è 'admin', restituisci prodotti globali dell'admin
    if (sellerId === 'admin') {
      const adminProducts = await db.select().from(products)
        .where(and(
          isNull(products.createdBy),
          eq(products.isActive, true),
          eq(products.isVisibleInShop, true)
        ))
        .orderBy(desc(products.createdAt));
      
      return adminProducts.map(p => ({
        ...p,
        shopPrice: p.unitPrice,
        sellerName: 'MonkeyPlan Store',
      }));
    }
    
    // Altrimenti, prodotti del reseller (propri + assegnati pubblicati)
    const reseller = await this.getUser(sellerId);
    const sellerName = reseller?.fullName || 'Shop';
    
    // Prodotti propri del reseller (questi sono sempre visibili, indipendentemente da isVisibleInShop)
    const ownProducts = await db.select().from(products)
      .where(and(
        eq(products.createdBy, sellerId),
        eq(products.isActive, true)
      ));
    
    // Prodotti globali assegnati e pubblicati (filtro isVisibleInShop per prodotti admin)
    const assignedProducts = await db.select({
      product: products,
      resellerProduct: resellerProducts,
    }).from(resellerProducts)
      .innerJoin(products, eq(products.id, resellerProducts.productId))
      .where(and(
        eq(resellerProducts.resellerId, sellerId),
        eq(resellerProducts.isPublished, true),
        isNull(products.createdBy),
        eq(products.isActive, true),
        eq(products.isVisibleInShop, true)
      ));
    
    const result: Array<Product & { shopPrice: number; sellerName: string }> = [];
    
    // Aggiungi prodotti propri
    for (const p of ownProducts) {
      result.push({
        ...p,
        shopPrice: p.unitPrice,
        sellerName,
      });
    }
    
    // Aggiungi prodotti assegnati con prezzo personalizzato
    for (const { product, resellerProduct } of assignedProducts) {
      result.push({
        ...product,
        shopPrice: resellerProduct.customPriceCents || product.unitPrice,
        sellerName,
      });
    }
    
    return result;
  }

  async getMarketplaceProducts(): Promise<Array<Product & { sellers: Array<{ sellerId: string; sellerName: string; price: number; isAdmin: boolean }> }>> {
    // Ottieni tutti i prodotti attivi e visibili nello shop
    const allProducts = await db.select().from(products)
      .where(and(
        eq(products.isActive, true),
        eq(products.isVisibleInShop, true)
      ));
    
    // Ottieni tutte le assegnazioni pubblicate
    const allAssignments = await db.select().from(resellerProducts)
      .where(eq(resellerProducts.isPublished, true));
    
    // Ottieni tutti i reseller per i nomi
    const resellers = await db.select().from(users)
      .where(eq(users.role, 'reseller'));
    const resellerMap = new Map(resellers.map(r => [r.id, r.fullName || r.username]));
    
    const productMap = new Map<string, Product & { sellers: Array<{ sellerId: string; sellerName: string; price: number; isAdmin: boolean }> }>();
    
    for (const product of allProducts) {
      const sellers: Array<{ sellerId: string; sellerName: string; price: number; isAdmin: boolean }> = [];
      
      // Se è un prodotto globale (admin), l'admin lo vende
      if (!product.createdBy) {
        sellers.push({
          sellerId: 'admin',
          sellerName: 'MonkeyPlan Store',
          price: product.unitPrice,
          isAdmin: true,
        });
        
        // Aggiungi anche i reseller che lo hanno pubblicato
        const productAssignments = allAssignments.filter(a => a.productId === product.id);
        for (const assignment of productAssignments) {
          sellers.push({
            sellerId: assignment.resellerId,
            sellerName: resellerMap.get(assignment.resellerId) || 'Reseller',
            price: assignment.customPriceCents || product.unitPrice,
            isAdmin: false,
          });
        }
      } else {
        // Prodotto del reseller
        sellers.push({
          sellerId: product.createdBy,
          sellerName: resellerMap.get(product.createdBy) || 'Reseller',
          price: product.unitPrice,
          isAdmin: false,
        });
      }
      
      if (sellers.length > 0) {
        productMap.set(product.id, { ...product, sellers });
      }
    }
    
    return Array.from(productMap.values());
  }

  // Smartphone Specs
  async getSmartphoneSpecs(productId: string): Promise<SmartphoneSpecs | undefined> {
    const [specs] = await db.select().from(smartphoneSpecs).where(eq(smartphoneSpecs.productId, productId));
    return specs || undefined;
  }

  async createSmartphoneSpecs(specs: InsertSmartphoneSpecs): Promise<SmartphoneSpecs> {
    const [result] = await db.insert(smartphoneSpecs).values(specs).returning();
    return result;
  }

  async updateSmartphoneSpecs(productId: string, updates: Partial<InsertSmartphoneSpecs>): Promise<SmartphoneSpecs> {
    const [result] = await db.update(smartphoneSpecs)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(smartphoneSpecs.productId, productId))
      .returning();
    return result;
  }

  async deleteSmartphoneSpecs(productId: string): Promise<void> {
    await db.delete(smartphoneSpecs).where(eq(smartphoneSpecs.productId, productId));
  }

  async listSmartphones(filters?: { resellerId?: string; brand?: string; condition?: string }): Promise<Array<Product & { specs: SmartphoneSpecs | null }>> {
    const baseConditions: any[] = [eq(products.productType, 'dispositivo' as any)];
    if (filters?.brand) {
      baseConditions.push(eq(products.brand, filters.brand));
    }
    if (filters?.condition) {
      baseConditions.push(eq(products.condition, filters.condition as any));
    }
    
    if (filters?.resellerId) {
      // For resellers: get products they created OR products assigned to them via product_prices
      const ownProducts = await db.select()
        .from(products)
        .leftJoin(smartphoneSpecs, eq(products.id, smartphoneSpecs.productId))
        .where(and(...baseConditions, eq(products.createdBy, filters.resellerId)))
        .orderBy(desc(products.createdAt));
      
      // Get products assigned via product_prices
      const assignedProducts = await db.select({
        products: products,
        smartphone_specs: smartphoneSpecs,
      })
        .from(productPrices)
        .innerJoin(products, eq(productPrices.productId, products.id))
        .leftJoin(smartphoneSpecs, eq(products.id, smartphoneSpecs.productId))
        .where(and(
          eq(productPrices.resellerId, filters.resellerId),
          eq(productPrices.isActive, true),
          eq(products.productType, 'dispositivo' as any),
          ...(filters.brand ? [eq(products.brand, filters.brand)] : []),
          ...(filters.condition ? [eq(products.condition, filters.condition as any)] : [])
        ))
        .orderBy(desc(products.createdAt));
      
      // Merge and deduplicate by product id
      const allProducts = [...ownProducts, ...assignedProducts];
      const uniqueProducts = new Map();
      for (const r of allProducts) {
        if (!uniqueProducts.has(r.products.id)) {
          uniqueProducts.set(r.products.id, {
            ...r.products,
            specs: r.smartphone_specs || null
          });
        }
      }
      
      return Array.from(uniqueProducts.values());
    }
    
    // For admin: get all products
    const results = await db.select()
      .from(products)
      .leftJoin(smartphoneSpecs, eq(products.id, smartphoneSpecs.productId))
      .where(and(...baseConditions))
      .orderBy(desc(products.createdAt));
    
    return results.map(r => ({
      ...r.products,
      specs: r.smartphone_specs || null
    }));
  }

  // Accessory Specs
  async getAccessorySpecs(productId: string): Promise<AccessorySpecs | undefined> {
    const [specs] = await db.select().from(accessorySpecs).where(eq(accessorySpecs.productId, productId));
    return specs || undefined;
  }

  async createAccessorySpecs(specs: InsertAccessorySpecs): Promise<AccessorySpecs> {
    const [result] = await db.insert(accessorySpecs).values(specs).returning();
    return result;
  }

  async updateAccessorySpecs(productId: string, updates: Partial<InsertAccessorySpecs>): Promise<AccessorySpecs> {
    const [result] = await db.update(accessorySpecs)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(accessorySpecs.productId, productId))
      .returning();
    return result;
  }

  async deleteAccessorySpecs(productId: string): Promise<void> {
    await db.delete(accessorySpecs).where(eq(accessorySpecs.productId, productId));
  }

  async listAccessories(filters?: { resellerId?: string; accessoryType?: string }): Promise<Array<Product & { specs: AccessorySpecs | null }>> {
    const baseConditions: any[] = [eq(products.productType, 'accessorio' as any)];
    
    if (filters?.resellerId) {
      // For resellers: get accessories they created OR accessories assigned via product_prices
      const ownProducts = await db.select()
        .from(products)
        .leftJoin(accessorySpecs, eq(products.id, accessorySpecs.productId))
        .where(and(...baseConditions, eq(products.createdBy, filters.resellerId)))
        .orderBy(desc(products.createdAt));
      
      // Get accessories assigned via product_prices
      const assignedProducts = await db.select({
        products: products,
        accessory_specs: accessorySpecs,
      })
        .from(productPrices)
        .innerJoin(products, eq(productPrices.productId, products.id))
        .leftJoin(accessorySpecs, eq(products.id, accessorySpecs.productId))
        .where(and(
          eq(productPrices.resellerId, filters.resellerId),
          eq(productPrices.isActive, true),
          eq(products.productType, 'accessorio' as any)
        ))
        .orderBy(desc(products.createdAt));
      
      // Merge and deduplicate by product id
      const allProducts = [...ownProducts, ...assignedProducts];
      const uniqueProducts = new Map();
      for (const r of allProducts) {
        if (!uniqueProducts.has(r.products.id)) {
          uniqueProducts.set(r.products.id, {
            ...r.products,
            specs: r.accessory_specs || null
          });
        }
      }
      
      let results = Array.from(uniqueProducts.values());
      
      // Filter by accessory type in memory if needed
      if (filters.accessoryType) {
        results = results.filter((r: any) => r.specs?.accessoryType === filters.accessoryType);
      }
      
      return results;
    }
    
    // For admin: get all accessories
    const results = await db.select()
      .from(products)
      .leftJoin(accessorySpecs, eq(products.id, accessorySpecs.productId))
      .where(and(...baseConditions))
      .orderBy(desc(products.createdAt));
    
    // Filter by accessory type in memory if needed
    let filtered = results;
    if (filters?.accessoryType) {
      filtered = results.filter(r => r.accessory_specs?.accessoryType === filters.accessoryType);
    }
    
    return filtered.map(r => ({
      ...r.products,
      specs: r.accessory_specs || null
    }));
  }

  async listAccessoriesCompatibleWithDevice(deviceModelId: string | null, deviceBrandId?: string): Promise<Array<Product & { specs: AccessorySpecs | null }>> {
    // Build conditions for device compatibility matching
    const conditions: any[] = [];
    
    if (deviceModelId) {
      // Match accessories compatible with specific model OR all models of the brand
      conditions.push(
        or(
          eq(productDeviceCompatibilities.deviceModelId, deviceModelId),
          and(
            deviceBrandId ? eq(productDeviceCompatibilities.deviceBrandId, deviceBrandId) : undefined,
            isNull(productDeviceCompatibilities.deviceModelId)
          )
        )
      );
    } else if (deviceBrandId) {
      // Match accessories compatible with brand (all models)
      conditions.push(eq(productDeviceCompatibilities.deviceBrandId, deviceBrandId));
    }
    
    if (conditions.length === 0) {
      return [];
    }
    
    // Query products with accessory specs that have matching device compatibility
    const compatibleProductIds = await db.selectDistinct({ productId: productDeviceCompatibilities.productId })
      .from(productDeviceCompatibilities)
      .where(and(...conditions));
    
    if (compatibleProductIds.length === 0) {
      return [];
    }
    
    const productIdList = compatibleProductIds.map(p => p.productId);
    
    // Fetch accessories with their specs
    const results = await db.select()
      .from(products)
      .leftJoin(accessorySpecs, eq(products.id, accessorySpecs.productId))
      .where(and(
        inArray(products.id, productIdList),
        eq(products.productType, 'accessorio' as any),
        eq(products.isActive, true)
      ))
      .orderBy(desc(products.createdAt));
    
    return results.map(r => ({
      ...r.products,
      specs: r.accessory_specs || null
    }));
  }

  // Repair Orders
  async listRepairOrders(filters?: { customerId?: string; customerIds?: string[]; resellerId?: string; repairCenterId?: string; status?: string }): Promise<RepairOrder[]> {
    let query = db.select().from(repairOrders);
    
    if (filters) {
      const conditions = [];
      if (filters.customerId) conditions.push(eq(repairOrders.customerId, filters.customerId));
      if (filters.customerIds && filters.customerIds.length > 0) {
        conditions.push(inArray(repairOrders.customerId, filters.customerIds));
      }
      if (filters.resellerId) {
        // For reseller filtering, we need to match orders where:
        // 1. The order's resellerId matches directly, OR
        // 2. The order's customer belongs to this reseller
        const resellerCustomers = await db.select({ id: users.id })
          .from(users)
          .where(and(
            eq(users.resellerId, filters.resellerId),
            eq(users.role, 'customer')
          ));
        const resellerCustomerIds = resellerCustomers.map(c => c.id);
        
        if (resellerCustomerIds.length > 0) {
          // Orders with matching resellerId OR orders belonging to reseller's customers
          conditions.push(or(
            eq(repairOrders.resellerId, filters.resellerId),
            inArray(repairOrders.customerId, resellerCustomerIds)
          ));
        } else {
          // No customers, just match by resellerId
          conditions.push(eq(repairOrders.resellerId, filters.resellerId));
        }
      }
      if (filters.repairCenterId) conditions.push(eq(repairOrders.repairCenterId, filters.repairCenterId));
      if (filters.status) conditions.push(eq(repairOrders.status, filters.status as any));
      
      if (conditions.length > 0) {
        query = query.where(and(...conditions)) as any;
      }
    }
    
    return await query.orderBy(desc(repairOrders.createdAt));
  }

  async listRepairOrdersPaginated(params: { page: number; pageSize: number; filters?: RepairOrderFilters }): Promise<PaginatedResult<RepairOrder>> {
    const { page, pageSize, filters } = params;
    const offset = (page - 1) * pageSize;
    
    const conditions: any[] = [];
    
    if (filters) {
      if (filters.status && filters.status !== 'all') {
        conditions.push(eq(repairOrders.status, filters.status as any));
      }
      if (filters.priority && filters.priority !== 'all') {
        conditions.push(eq(repairOrders.priority, filters.priority as any));
      }
      if (filters.repairCenterId && filters.repairCenterId !== 'all') {
        conditions.push(eq(repairOrders.repairCenterId, filters.repairCenterId));
      }
      if (filters.resellerId && filters.resellerId !== 'all') {
        conditions.push(eq(repairOrders.resellerId, filters.resellerId));
      }
      if (filters.customerId) {
        conditions.push(eq(repairOrders.customerId, filters.customerId));
      }
      if (filters.deviceType && filters.deviceType !== 'all') {
        conditions.push(eq(repairOrders.deviceType, filters.deviceType));
      }
      if (filters.startDate) {
        conditions.push(gte(repairOrders.createdAt, new Date(filters.startDate)));
      }
      if (filters.endDate) {
        const endDate = new Date(filters.endDate);
        endDate.setHours(23, 59, 59, 999);
        conditions.push(lte(repairOrders.createdAt, endDate));
      }
      if (filters.search) {
        const searchTerm = `%${filters.search.toLowerCase()}%`;
        conditions.push(
          or(
            ilike(repairOrders.orderNumber, searchTerm),
            ilike(repairOrders.deviceModel, searchTerm),
            ilike(repairOrders.brand, searchTerm),
            ilike(repairOrders.serial, searchTerm),
            ilike(repairOrders.imei, searchTerm),
            ilike(repairOrders.deviceType, searchTerm),
            sql`EXISTS (SELECT 1 FROM users WHERE users.id = ${repairOrders.customerId} AND (LOWER(users.full_name) LIKE ${searchTerm} OR LOWER(users.ragione_sociale) LIKE ${searchTerm}))`
          )
        );
      }
    }
    
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
    
    const [countResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(repairOrders)
      .where(whereClause);
    
    const total = Number(countResult?.count || 0);
    const totalPages = Math.ceil(total / pageSize);
    
    const data = await db
      .select()
      .from(repairOrders)
      .where(whereClause)
      .orderBy(desc(repairOrders.createdAt))
      .limit(pageSize)
      .offset(offset);
    
    return {
      data,
      page,
      pageSize,
      total,
      totalPages,
    };
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
  async listTickets(filters?: { customerId?: string; assignedTo?: string; status?: string; resellerId?: string; repairCenterId?: string }): Promise<Ticket[]> {
    const conditions = [];
    
    // Standard filters
    if (filters?.customerId) conditions.push(eq(tickets.customerId, filters.customerId));
    if (filters?.assignedTo) conditions.push(eq(tickets.assignedTo, filters.assignedTo));
    if (filters?.status) conditions.push(eq(tickets.status, filters.status as any));
    
    // Reseller filter: find customers belonging to this reseller
    if (filters?.resellerId) {
      const resellerCustomers = await db.select({ id: users.id })
        .from(users)
        .where(and(
          eq(users.role, 'customer'),
          eq(users.resellerId, filters.resellerId)
        ));
      
      const customerIds = resellerCustomers.map(c => c.id);
      if (customerIds.length > 0) {
        conditions.push(inArray(tickets.customerId, customerIds));
      } else {
        // No customers for this reseller, return empty
        return [];
      }
    }
    
    // Repair center filter: find tickets assigned to staff of this center
    if (filters?.repairCenterId) {
      // Get staff IDs associated with this repair center
      const centerStaff = await db.select({ staffId: staffRepairCenters.staffId })
        .from(staffRepairCenters)
        .where(eq(staffRepairCenters.repairCenterId, filters.repairCenterId));
      
      const staffIds = centerStaff.map(s => s.staffId);
      if (staffIds.length > 0) {
        conditions.push(inArray(tickets.assignedTo, staffIds));
      } else {
        // No staff for this center, return empty
        return [];
      }
    }
    
    let query = db.select().from(tickets);
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }
    
    return await query.orderBy(desc(tickets.createdAt));
  }

  // List internal tickets (for multi-role ticket system)
  async listInternalTickets(filters: { userId: string; userRole: string; targetType?: string; ticketType?: string }): Promise<Ticket[]> {
    const conditions: any[] = [];
    
    // Filter by ticket type
    if (filters.ticketType) {
      conditions.push(eq(tickets.ticketType, filters.ticketType as any));
    } else {
      // Default to internal tickets
      conditions.push(eq(tickets.ticketType, 'internal'));
    }
    
    // User can see tickets where:
    // 1. They are the initiator (created the ticket)
    // 2. They are the target (ticket addressed to them)
    // 3. They are an admin (can see all internal tickets with targetType=admin)
    
    if (filters.userRole === 'admin' || filters.userRole === 'admin_staff') {
      // Admin sees all internal tickets where targetType is 'admin' OR they initiated
      conditions.push(
        or(
          eq(tickets.targetType, 'admin'),
          eq(tickets.initiatorId, filters.userId)
        )
      );
    } else if (filters.userRole === 'reseller' || filters.userRole === 'reseller_staff') {
      // Reseller sees tickets where they are initiator or target
      conditions.push(
        or(
          eq(tickets.initiatorId, filters.userId),
          and(
            eq(tickets.targetType, 'reseller'),
            eq(tickets.targetId, filters.userId)
          )
        )
      );
    } else if (filters.userRole === 'repair_center') {
      // Repair center sees tickets where they are initiator or target
      conditions.push(
        or(
          eq(tickets.initiatorId, filters.userId),
          and(
            eq(tickets.targetType, 'repair_center'),
            eq(tickets.targetId, filters.userId)
          )
        )
      );
    }
    
    // Filter by target type if specified
    if (filters.targetType) {
      conditions.push(eq(tickets.targetType, filters.targetType as any));
    }
    
    let query = db.select().from(tickets);
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
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
  async listInvoices(filters?: { customerId?: string; paymentStatus?: string; resellerId?: string }): Promise<Invoice[]> {
    const conditions = [];
    
    if (filters?.customerId) {
      conditions.push(eq(invoices.customerId, filters.customerId));
    }
    if (filters?.paymentStatus) {
      conditions.push(eq(invoices.paymentStatus, filters.paymentStatus as any));
    }
    if (filters?.resellerId) {
      // Get customers associated with this reseller through repair orders
      const resellerRepairs = await db.select({ customerId: repairOrders.customerId })
        .from(repairOrders)
        .where(eq(repairOrders.resellerId, filters.resellerId));
      const customerIds = Array.from(new Set(resellerRepairs.map(r => r.customerId).filter(Boolean))) as string[];
      if (customerIds.length === 0) {
        return []; // No customers found for this reseller
      }
      conditions.push(inArray(invoices.customerId, customerIds));
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

  async updateBillingData(id: string, updates: Partial<Omit<BillingData, 'id' | 'userId' | 'createdAt'>>): Promise<BillingData> {
    const [data] = await db.update(billingData)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(billingData.id, id))
      .returning();
    
    if (!data) {
      throw new Error("Billing data not found");
    }
    
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

  async listInventoryStockByReseller(resellerId: string): Promise<InventoryStock[]> {
    // Get all repair centers associated with this reseller
    const resellerCenters = await db.select()
      .from(repairCenters)
      .where(eq(repairCenters.resellerId, resellerId));
    
    if (resellerCenters.length === 0) {
      return [];
    }
    
    const centerIds = resellerCenters.map(c => c.id);
    
    return await db.select()
      .from(inventoryStock)
      .where(inArray(inventoryStock.repairCenterId, centerIds));
  }

  async createInventoryMovement(insertMovement: InsertInventoryMovement): Promise<InventoryMovement> {
    // BRIDGE: Redirect to new warehouse system
    // Find or create warehouse for this repair center
    const repairCenter = await this.getRepairCenter(insertMovement.repairCenterId);
    if (repairCenter) {
      const warehouse = await this.ensureDefaultWarehouse(
        'repair_center',
        insertMovement.repairCenterId,
        repairCenter.name
      );
      
      // Map legacy movement types to new warehouse types
      const movementTypeMap: Record<string, 'carico' | 'scarico' | 'rettifica'> = {
        'in': 'carico',
        'out': 'scarico',
        'adjustment': 'rettifica',
      };
      const warehouseMovementType = movementTypeMap[insertMovement.movementType] || 'rettifica';
      
      // Calculate quantity change
      const quantityDelta = insertMovement.movementType === "in" ? insertMovement.quantity :
                            insertMovement.movementType === "out" ? -insertMovement.quantity :
                            insertMovement.quantity;
      
      // Create movement in new warehouse system
      await this.createWarehouseMovement({
        warehouseId: warehouse.id,
        productId: insertMovement.productId,
        movementType: warehouseMovementType,
        quantity: insertMovement.quantity,
        referenceType: 'legacy_inventory',
        notes: insertMovement.notes,
        createdBy: insertMovement.createdBy,
      });
      
      // Update stock in new warehouse system
      await this.updateWarehouseStockQuantity(warehouse.id, insertMovement.productId, quantityDelta);
    }
    
    // Also update legacy tables for backward compatibility during migration
    const [movement] = await db.insert(inventoryMovements).values(insertMovement).returning();
    
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
    stockByWarehouse: Array<{ warehouseId: string; warehouseName: string; ownerType: string; ownerName: string; quantity: number }>;
    totalStock: number;
    compatibilities: Array<{ brandId: string; brandName: string; modelId: string | null; modelName: string | null }>;
  }>> {
    const allProducts = await this.listProducts();
    
    // Fetch warehouse stock with warehouse and owner info
    const allStock = await db.select({
      productId: warehouseStock.productId,
      warehouseId: warehouseStock.warehouseId,
      warehouseName: warehouses.name,
      ownerType: warehouses.ownerType,
      ownerId: warehouses.ownerId,
      quantity: warehouseStock.quantity,
    })
    .from(warehouseStock)
    .innerJoin(warehouses, eq(warehouseStock.warehouseId, warehouses.id));
    
    // Fetch owner names for warehouses
    const ownerIds = [...new Set(allStock.filter(s => s.ownerId && s.ownerId !== 'system').map(s => s.ownerId!))];
    const owners = ownerIds.length > 0 
      ? await db.select({ id: users.id, username: users.username, fullName: users.fullName })
          .from(users)
          .where(inArray(users.id, ownerIds))
      : [];
    const ownerMap = new Map(owners.map(o => [o.id, o.fullName || o.username]));
    
    // Fetch all compatibilities with brand/model names
    const allCompatibilities = await db.select({
      productId: productDeviceCompatibilities.productId,
      brandId: productDeviceCompatibilities.deviceBrandId,
      brandName: deviceBrands.name,
      modelId: productDeviceCompatibilities.deviceModelId,
      modelName: deviceModels.modelName,
    })
    .from(productDeviceCompatibilities)
    .innerJoin(deviceBrands, eq(productDeviceCompatibilities.deviceBrandId, deviceBrands.id))
    .leftJoin(deviceModels, eq(productDeviceCompatibilities.deviceModelId, deviceModels.id));
    
    // Build compatibility map by productId
    const compatibilityMap = new Map<string, Array<{ brandId: string; brandName: string; modelId: string | null; modelName: string | null }>>();
    for (const compat of allCompatibilities) {
      if (!compatibilityMap.has(compat.productId)) {
        compatibilityMap.set(compat.productId, []);
      }
      compatibilityMap.get(compat.productId)!.push({
        brandId: compat.brandId,
        brandName: compat.brandName,
        modelId: compat.modelId,
        modelName: compat.modelName,
      });
    }
    
    // Aggregate stock by product and warehouse
    const stockMap = new Map<string, Map<string, { warehouseId: string; warehouseName: string; ownerType: string; ownerName: string; quantity: number }>>();
    for (const stock of allStock) {
      if (!stockMap.has(stock.productId)) {
        stockMap.set(stock.productId, new Map());
      }
      const warehouseMap = stockMap.get(stock.productId)!;
      const ownerName = stock.ownerId && stock.ownerId !== 'system' 
        ? ownerMap.get(stock.ownerId) || 'Sconosciuto'
        : 'Sistema';
      
      if (warehouseMap.has(stock.warehouseId)) {
        const existing = warehouseMap.get(stock.warehouseId)!;
        existing.quantity += stock.quantity;
      } else {
        warehouseMap.set(stock.warehouseId, {
          warehouseId: stock.warehouseId,
          warehouseName: stock.warehouseName,
          ownerType: stock.ownerType,
          ownerName,
          quantity: stock.quantity,
        });
      }
    }
    
    return allProducts.map(product => {
      const warehouseMap = stockMap.get(product.id);
      const stockByWarehouse = warehouseMap ? Array.from(warehouseMap.values()) : [];
      const totalStock = stockByWarehouse.reduce((sum, s) => sum + s.quantity, 0);
      const compatibilities = compatibilityMap.get(product.id) || [];
      return { product, stockByWarehouse, totalStock, compatibilities };
    });
  }

  // Reseller Inventory - Get own products with stock in own centers
  async getResellerProductsWithStock(resellerId: string): Promise<Array<{ 
    product: Product; 
    stockByCenter: Array<{ repairCenterId: string; repairCenterName: string; quantity: number }>;
    totalStock: number;
  }>> {
    // Get reseller's own products (createdBy = resellerId)
    const resellerProducts = await db.select()
      .from(products)
      .where(and(
        eq(products.createdBy, resellerId),
        eq(products.isActive, true)
      ))
      .orderBy(desc(products.createdAt));
    
    if (resellerProducts.length === 0) {
      return [];
    }
    
    // Get reseller's own repair centers
    const resellerCenters = await db.select()
      .from(repairCenters)
      .where(eq(repairCenters.resellerId, resellerId));
    
    if (resellerCenters.length === 0) {
      // No centers, return products with empty stock
      return resellerProducts.map(product => ({
        product,
        stockByCenter: [],
        totalStock: 0,
      }));
    }
    
    const centerIds = resellerCenters.map(c => c.id);
    const productIds = resellerProducts.map(p => p.id);
    
    // Get stock only for reseller's products in reseller's centers
    const stockData = await db.select({
      productId: inventoryStock.productId,
      repairCenterId: inventoryStock.repairCenterId,
      repairCenterName: repairCenters.name,
      quantity: inventoryStock.quantity,
    })
    .from(inventoryStock)
    .innerJoin(repairCenters, eq(inventoryStock.repairCenterId, repairCenters.id))
    .where(and(
      inArray(inventoryStock.productId, productIds),
      inArray(inventoryStock.repairCenterId, centerIds)
    ));
    
    // Build stock map
    const stockMap = new Map<string, Array<{ repairCenterId: string; repairCenterName: string; quantity: number }>>();
    for (const stock of stockData) {
      if (!stockMap.has(stock.productId)) {
        stockMap.set(stock.productId, []);
      }
      stockMap.get(stock.productId)!.push({
        repairCenterId: stock.repairCenterId,
        repairCenterName: stock.repairCenterName,
        quantity: stock.quantity,
      });
    }
    
    return resellerProducts.map(product => {
      const stockByCenter = stockMap.get(product.id) || [];
      const totalStock = stockByCenter.reduce((sum, s) => sum + s.quantity, 0);
      return { product, stockByCenter, totalStock };
    });
  }

  // Get stock for a specific reseller product in reseller's centers only
  async getResellerProductStockByCenter(productId: string, resellerId: string): Promise<Array<{ repairCenterId: string; repairCenterName: string; quantity: number }>> {
    // Verify product belongs to reseller
    const [product] = await db.select()
      .from(products)
      .where(and(
        eq(products.id, productId),
        eq(products.createdBy, resellerId)
      ));
    
    if (!product) {
      return []; // Product not found or doesn't belong to reseller
    }
    
    // Get reseller's centers with stock for this product
    const resellerCenters = await db.select()
      .from(repairCenters)
      .where(eq(repairCenters.resellerId, resellerId));
    
    if (resellerCenters.length === 0) {
      return [];
    }
    
    const centerIds = resellerCenters.map(c => c.id);
    
    // Get existing stock
    const stockData = await db.select({
      repairCenterId: inventoryStock.repairCenterId,
      repairCenterName: repairCenters.name,
      quantity: inventoryStock.quantity,
    })
    .from(inventoryStock)
    .innerJoin(repairCenters, eq(inventoryStock.repairCenterId, repairCenters.id))
    .where(and(
      eq(inventoryStock.productId, productId),
      inArray(inventoryStock.repairCenterId, centerIds)
    ));
    
    // Build result with all centers (even if 0 stock)
    const stockMap = new Map(stockData.map(s => [s.repairCenterId, s]));
    
    return resellerCenters.map(center => ({
      repairCenterId: center.id,
      repairCenterName: center.name,
      quantity: stockMap.get(center.id)?.quantity || 0,
    }));
  }

  // Get full warehouse stock for a reseller product (includes reseller, sub-resellers, and repair centers)
  async getResellerFullWarehouseStock(productId: string, resellerId: string): Promise<Array<{ warehouseId: string; warehouseName: string; ownerType: 'reseller' | 'sub_reseller' | 'repair_center'; ownerId: string; ownerName: string; quantity: number }>> {
    // Verify product belongs to reseller
    const [product] = await db.select()
      .from(products)
      .where(and(
        eq(products.id, productId),
        eq(products.createdBy, resellerId)
      ));
    
    if (!product) {
      return [];
    }
    
    const result: Array<{ warehouseId: string; warehouseName: string; ownerType: 'reseller' | 'sub_reseller' | 'repair_center'; ownerId: string; ownerName: string; quantity: number }> = [];
    
    // 1. Get reseller's own warehouse
    const resellerWarehouses = await db.select()
      .from(warehouses)
      .where(and(
        eq(warehouses.ownerType, 'reseller'),
        eq(warehouses.ownerId, resellerId),
        eq(warehouses.isActive, true)
      ));
    
    // Get reseller name
    const [resellerUser] = await db.select().from(users).where(eq(users.id, resellerId));
    const resellerName = resellerUser?.username || 'Rivenditore';
    
    for (const wh of resellerWarehouses) {
      const [stock] = await db.select()
        .from(warehouseStock)
        .where(and(
          eq(warehouseStock.warehouseId, wh.id),
          eq(warehouseStock.productId, productId)
        ));
      
      result.push({
        warehouseId: wh.id,
        warehouseName: wh.name,
        ownerType: 'reseller',
        ownerId: resellerId,
        ownerName: resellerName,
        quantity: stock?.quantity || 0,
      });
    }
    
    // 2. Get sub-resellers' warehouses (users with parentResellerId = resellerId)
    const subResellers = await db.select()
      .from(users)
      .where(and(
        eq(users.parentResellerId, resellerId),
        eq(users.role, 'reseller'),
        eq(users.isActive, true)
      ));
    
    for (const subReseller of subResellers) {
      const subWarehouses = await db.select()
        .from(warehouses)
        .where(and(
          eq(warehouses.ownerType, 'sub_reseller'),
          eq(warehouses.ownerId, subReseller.id),
          eq(warehouses.isActive, true)
        ));
      
      for (const wh of subWarehouses) {
        const [stock] = await db.select()
          .from(warehouseStock)
          .where(and(
            eq(warehouseStock.warehouseId, wh.id),
            eq(warehouseStock.productId, productId)
          ));
        
        result.push({
          warehouseId: wh.id,
          warehouseName: wh.name,
          ownerType: 'sub_reseller',
          ownerId: subReseller.id,
          ownerName: subReseller.username,
          quantity: stock?.quantity || 0,
        });
      }
    }
    
    // 3. Get repair centers' warehouses
    const resellerCenters = await db.select()
      .from(repairCenters)
      .where(eq(repairCenters.resellerId, resellerId));
    
    for (const center of resellerCenters) {
      const centerWarehouses = await db.select()
        .from(warehouses)
        .where(and(
          eq(warehouses.ownerType, 'repair_center'),
          eq(warehouses.ownerId, center.id),
          eq(warehouses.isActive, true)
        ));
      
      for (const wh of centerWarehouses) {
        const [stock] = await db.select()
          .from(warehouseStock)
          .where(and(
            eq(warehouseStock.warehouseId, wh.id),
            eq(warehouseStock.productId, productId)
          ));
        
        result.push({
          warehouseId: wh.id,
          warehouseName: wh.name,
          ownerType: 'repair_center',
          ownerId: center.id,
          ownerName: center.name,
          quantity: stock?.quantity || 0,
        });
      }
    }
    
    return result;
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

  // Reseller Custom Device Brands
  async listResellerDeviceBrands(resellerId: string, activeOnly: boolean = false): Promise<ResellerDeviceBrand[]> {
    const conditions = [eq(resellerDeviceBrands.resellerId, resellerId)];
    if (activeOnly) {
      conditions.push(eq(resellerDeviceBrands.isActive, true));
    }
    return await db.select().from(resellerDeviceBrands)
      .where(and(...conditions))
      .orderBy(resellerDeviceBrands.name);
  }

  async getResellerDeviceBrand(id: string): Promise<ResellerDeviceBrand | undefined> {
    const [brand] = await db.select().from(resellerDeviceBrands).where(eq(resellerDeviceBrands.id, id));
    return brand || undefined;
  }

  async createResellerDeviceBrand(brand: InsertResellerDeviceBrand): Promise<ResellerDeviceBrand> {
    const [created] = await db.insert(resellerDeviceBrands).values(brand).returning();
    return created;
  }

  async updateResellerDeviceBrand(id: string, updates: Partial<InsertResellerDeviceBrand>): Promise<ResellerDeviceBrand> {
    const [updated] = await db
      .update(resellerDeviceBrands)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(resellerDeviceBrands.id, id))
      .returning();
    if (!updated) {
      throw new Error("Reseller device brand not found");
    }
    return updated;
  }

  async deleteResellerDeviceBrand(id: string): Promise<void> {
    await db.delete(resellerDeviceBrands).where(eq(resellerDeviceBrands.id, id));
  }

  // Reseller Custom Device Models
  async listResellerDeviceModels(resellerId: string, brandId?: string, typeId?: string, activeOnly: boolean = false): Promise<ResellerDeviceModel[]> {
    const conditions = [eq(resellerDeviceModels.resellerId, resellerId)];
    if (brandId) {
      conditions.push(or(
        eq(resellerDeviceModels.brandId, brandId),
        eq(resellerDeviceModels.resellerBrandId, brandId)
      ) as any);
    }
    if (typeId) {
      conditions.push(eq(resellerDeviceModels.typeId, typeId));
    }
    if (activeOnly) {
      conditions.push(eq(resellerDeviceModels.isActive, true));
    }
    return await db.select().from(resellerDeviceModels)
      .where(and(...conditions))
      .orderBy(resellerDeviceModels.modelName);
  }

  async getResellerDeviceModel(id: string): Promise<ResellerDeviceModel | undefined> {
    const [model] = await db.select().from(resellerDeviceModels).where(eq(resellerDeviceModels.id, id));
    return model || undefined;
  }

  async createResellerDeviceModel(model: InsertResellerDeviceModel): Promise<ResellerDeviceModel> {
    const [created] = await db.insert(resellerDeviceModels).values(model).returning();
    return created;
  }

  async updateResellerDeviceModel(id: string, updates: Partial<InsertResellerDeviceModel>): Promise<ResellerDeviceModel> {
    const [updated] = await db
      .update(resellerDeviceModels)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(resellerDeviceModels.id, id))
      .returning();
    if (!updated) {
      throw new Error("Reseller device model not found");
    }
    return updated;
  }

  async deleteResellerDeviceModel(id: string): Promise<void> {
    await db.delete(resellerDeviceModels).where(eq(resellerDeviceModels.id, id));
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

  // Device Models (Cascading dropdown) - Returns all models (global + any with resellerId)
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
  
  // List device models for a specific reseller (global + reseller's custom models)
  async listDeviceModelsForReseller(resellerId: string, filters?: { typeId?: string; brandId?: string; activeOnly?: boolean }): Promise<DeviceModel[]> {
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
    
    // Include both global models (resellerId IS NULL) and reseller's own models
    conditions.push(or(
      sql`${deviceModels.resellerId} IS NULL`,
      eq(deviceModels.resellerId, resellerId)
    ));
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }
    
    return await query.orderBy(deviceModels.modelName);
  }

  async getDeviceModel(id: string): Promise<DeviceModel | undefined> {
    const [deviceModel] = await db.select().from(deviceModels).where(eq(deviceModels.id, id));
    return deviceModel || undefined;
  }

  async createDeviceModel(insertDeviceModel: InsertDeviceModel): Promise<DeviceModel> {
    const [deviceModel] = await db.insert(deviceModels).values(insertDeviceModel).returning();
    return deviceModel;
  }

  async updateDeviceModel(id: string, updates: Partial<InsertDeviceModel>): Promise<DeviceModel> {
    const [deviceModel] = await db
      .update(deviceModels)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(deviceModels.id, id))
      .returning();
    
    if (!deviceModel) {
      throw new Error("Device model not found");
    }
    
    return deviceModel;
  }

  async deleteDeviceModel(id: string): Promise<void> {
    await db.delete(deviceModels).where(eq(deviceModels.id, id));
  }

  // Parts Purchase Orders (Ordini raggruppati ricambi)
  async generatePartsPurchaseOrderNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `ORD-${year}-`;
    
    // Get the latest order number for this year
    const lastOrder = await db.select({ orderNumber: partsPurchaseOrders.orderNumber })
      .from(partsPurchaseOrders)
      .where(sql`${partsPurchaseOrders.orderNumber} LIKE ${prefix + '%'}`)
      .orderBy(desc(partsPurchaseOrders.createdAt))
      .limit(1);
    
    let nextNumber = 1;
    if (lastOrder.length > 0) {
      const lastNum = parseInt(lastOrder[0].orderNumber.replace(prefix, ''), 10);
      if (!isNaN(lastNum)) {
        nextNumber = lastNum + 1;
      }
    }
    
    return `${prefix}${String(nextNumber).padStart(5, '0')}`;
  }

  async createPartsPurchaseOrder(order: InsertPartsPurchaseOrder): Promise<PartsPurchaseOrder> {
    const [created] = await db.insert(partsPurchaseOrders).values(order).returning();
    return created;
  }

  async getPartsPurchaseOrder(id: string): Promise<PartsPurchaseOrder | undefined> {
    const [order] = await db.select().from(partsPurchaseOrders).where(eq(partsPurchaseOrders.id, id));
    return order || undefined;
  }

  async listPartsPurchaseOrders(repairOrderId: string): Promise<PartsPurchaseOrder[]> {
    return await db.select()
      .from(partsPurchaseOrders)
      .where(eq(partsPurchaseOrders.repairOrderId, repairOrderId))
      .orderBy(desc(partsPurchaseOrders.createdAt));
  }

  async updatePartsPurchaseOrder(id: string, updates: Partial<InsertPartsPurchaseOrder>): Promise<PartsPurchaseOrder> {
    const [updated] = await db.update(partsPurchaseOrders)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(partsPurchaseOrders.id, id))
      .returning();
    if (!updated) {
      throw new Error("Parts purchase order not found");
    }
    return updated;
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

  // Delivery Appointments
  async listRepairCenterAvailability(repairCenterId: string): Promise<RepairCenterAvailability[]> {
    return await db.select()
      .from(repairCenterAvailability)
      .where(eq(repairCenterAvailability.repairCenterId, repairCenterId))
      .orderBy(repairCenterAvailability.weekday);
  }

  async setRepairCenterAvailability(repairCenterId: string, availability: InsertRepairCenterAvailability[]): Promise<RepairCenterAvailability[]> {
    await db.delete(repairCenterAvailability)
      .where(eq(repairCenterAvailability.repairCenterId, repairCenterId));
    
    if (availability.length === 0) {
      return [];
    }
    
    const created = await db.insert(repairCenterAvailability)
      .values(availability.map(a => ({ ...a, repairCenterId })))
      .returning();
    
    return created;
  }

  async listRepairCenterBlackouts(repairCenterId: string, fromDate?: string, toDate?: string): Promise<RepairCenterBlackout[]> {
    let conditions = [eq(repairCenterBlackouts.repairCenterId, repairCenterId)];
    
    if (fromDate) {
      conditions.push(sql`${repairCenterBlackouts.date} >= ${fromDate}`);
    }
    if (toDate) {
      conditions.push(sql`${repairCenterBlackouts.date} <= ${toDate}`);
    }
    
    return await db.select()
      .from(repairCenterBlackouts)
      .where(and(...conditions))
      .orderBy(repairCenterBlackouts.date);
  }

  async createRepairCenterBlackout(blackout: InsertRepairCenterBlackout): Promise<RepairCenterBlackout> {
    const [created] = await db.insert(repairCenterBlackouts).values(blackout).returning();
    return created;
  }

  async deleteRepairCenterBlackout(id: string): Promise<void> {
    await db.delete(repairCenterBlackouts).where(eq(repairCenterBlackouts.id, id));
  }

  async listDeliveryAppointments(filters?: { repairCenterId?: string; resellerId?: string; customerId?: string; repairOrderId?: string; date?: string; status?: string }): Promise<DeliveryAppointment[]> {
    let conditions: any[] = [];
    
    if (filters?.repairCenterId) {
      conditions.push(eq(deliveryAppointments.repairCenterId, filters.repairCenterId));
    }
    if (filters?.resellerId) {
      conditions.push(eq(deliveryAppointments.resellerId, filters.resellerId));
    }
    if (filters?.customerId) {
      conditions.push(eq(deliveryAppointments.customerId, filters.customerId));
    }
    if (filters?.repairOrderId) {
      conditions.push(eq(deliveryAppointments.repairOrderId, filters.repairOrderId));
    }
    if (filters?.date) {
      conditions.push(eq(deliveryAppointments.date, filters.date));
    }
    if (filters?.status) {
      conditions.push(eq(deliveryAppointments.status, filters.status as any));
    }
    
    if (conditions.length === 0) {
      return await db.select()
        .from(deliveryAppointments)
        .orderBy(desc(deliveryAppointments.date), deliveryAppointments.startTime);
    }
    
    return await db.select()
      .from(deliveryAppointments)
      .where(and(...conditions))
      .orderBy(desc(deliveryAppointments.date), deliveryAppointments.startTime);
  }

  async getDeliveryAppointment(id: string): Promise<DeliveryAppointment | undefined> {
    const [appointment] = await db.select()
      .from(deliveryAppointments)
      .where(eq(deliveryAppointments.id, id));
    return appointment || undefined;
  }

  async getDeliveryAppointmentByRepairOrder(repairOrderId: string): Promise<DeliveryAppointment | undefined> {
    const [appointment] = await db.select()
      .from(deliveryAppointments)
      .where(and(
        eq(deliveryAppointments.repairOrderId, repairOrderId),
        not(eq(deliveryAppointments.status, 'cancelled' as any))
      ));
    return appointment || undefined;
  }

  async createDeliveryAppointment(appointment: InsertDeliveryAppointment): Promise<DeliveryAppointment> {
    const [created] = await db.insert(deliveryAppointments).values(appointment).returning();
    return created;
  }

  async updateDeliveryAppointment(id: string, updates: Partial<Pick<DeliveryAppointment, 'date' | 'startTime' | 'endTime' | 'status' | 'notes' | 'confirmedBy' | 'confirmedAt' | 'cancelledBy' | 'cancelledAt' | 'cancelReason'>>): Promise<DeliveryAppointment> {
    const [updated] = await db.update(deliveryAppointments)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(deliveryAppointments.id, id))
      .returning();
    return updated;
  }

  async checkAppointmentConflict(repairCenterId: string, date: string, startTime: string, excludeId?: string): Promise<boolean> {
    let conditions: any[] = [
      eq(deliveryAppointments.repairCenterId, repairCenterId),
      eq(deliveryAppointments.date, date),
      eq(deliveryAppointments.startTime, startTime),
      not(eq(deliveryAppointments.status, 'cancelled' as any))
    ];
    
    if (excludeId) {
      conditions.push(not(eq(deliveryAppointments.id, excludeId)));
    }
    
    const existingAppointments = await db.select()
      .from(deliveryAppointments)
      .where(and(...conditions));
    
    // Get weekday from date to check capacity
    const dateObj = new Date(date);
    const weekday = dateObj.getDay();
    
    // Get availability for this weekday to check capacity
    const [availability] = await db.select()
      .from(repairCenterAvailability)
      .where(and(
        eq(repairCenterAvailability.repairCenterId, repairCenterId),
        eq(repairCenterAvailability.weekday, weekday)
      ));
    
    // If no availability set or closed, it's a conflict
    if (!availability || availability.isClosed) {
      return true;
    }
    
    // Check if slot is within operating hours
    if (startTime < availability.startTime || startTime >= availability.endTime) {
      return true;
    }
    
    // Check for blackouts on this date
    const blackouts = await db.select()
      .from(repairCenterBlackouts)
      .where(and(
        eq(repairCenterBlackouts.repairCenterId, repairCenterId),
        eq(repairCenterBlackouts.date, date)
      ));
    
    // Check for full-day blackout
    const fullDayBlackout = blackouts.find(b => !b.startTime && !b.endTime);
    if (fullDayBlackout) {
      return true;
    }
    
    // Check for time-range blackout covering this slot
    const slotBlackout = blackouts.find(b => {
      if (!b.startTime || !b.endTime) return false;
      return startTime >= b.startTime && startTime < b.endTime;
    });
    if (slotBlackout) {
      return true;
    }
    
    // Return true if capacity is full
    return existingAppointments.length >= availability.capacityPerSlot;
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

  // Supplier Catalog Products
  async listSupplierCatalogProducts(supplierId: string): Promise<SupplierCatalogProduct[]> {
    return await db.select()
      .from(supplierCatalogProducts)
      .where(eq(supplierCatalogProducts.supplierId, supplierId))
      .orderBy(supplierCatalogProducts.title);
  }

  async getSupplierCatalogProduct(id: string): Promise<SupplierCatalogProduct | undefined> {
    const [product] = await db.select()
      .from(supplierCatalogProducts)
      .where(eq(supplierCatalogProducts.id, id));
    return product || undefined;
  }

  async upsertSupplierCatalogProduct(product: InsertSupplierCatalogProduct): Promise<{ product: SupplierCatalogProduct; created: boolean }> {
    // Check if product exists
    const [existing] = await db.select()
      .from(supplierCatalogProducts)
      .where(and(
        eq(supplierCatalogProducts.supplierId, product.supplierId),
        eq(supplierCatalogProducts.externalSku, product.externalSku)
      ));

    if (existing) {
      // Update existing
      const [updated] = await db.update(supplierCatalogProducts)
        .set({
          ...product,
          updatedAt: new Date(),
        })
        .where(eq(supplierCatalogProducts.id, existing.id))
        .returning();
      return { product: updated, created: false };
    } else {
      // Create new
      const [created] = await db.insert(supplierCatalogProducts)
        .values(product)
        .returning();
      return { product: created, created: true };
    }
  }

  async mapCatalogProductToLocal(catalogProductId: string, linkedProductId: string): Promise<SupplierCatalogProduct> {
    const [updated] = await db.update(supplierCatalogProducts)
      .set({
        linkedProductId,
        updatedAt: new Date(),
      })
      .where(eq(supplierCatalogProducts.id, catalogProductId))
      .returning();

    if (!updated) {
      throw new Error("Prodotto catalogo non trovato");
    }

    return updated;
  }

  // Supplier Sync Logs
  async listSupplierSyncLogs(supplierId: string): Promise<SupplierSyncLog[]> {
    return await db.select()
      .from(supplierSyncLogs)
      .where(eq(supplierSyncLogs.supplierId, supplierId))
      .orderBy(desc(supplierSyncLogs.createdAt));
  }

  async createSupplierSyncLog(log: InsertSupplierSyncLog): Promise<SupplierSyncLog> {
    const [syncLog] = await db.insert(supplierSyncLogs)
      .values(log)
      .returning();
    return syncLog;
  }

  async updateSupplierSyncLog(id: string, updates: Partial<InsertSupplierSyncLog>): Promise<SupplierSyncLog> {
    const [syncLog] = await db.update(supplierSyncLogs)
      .set(updates)
      .where(eq(supplierSyncLogs.id, id))
      .returning();

    if (!syncLog) {
      throw new Error("Log di sincronizzazione non trovato");
    }

    return syncLog;
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

  async deleteAllProductSuppliers(productId: string): Promise<void> {
    await db.delete(productSuppliers).where(eq(productSuppliers.productId, productId));
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
  async listSupplierOrders(filters?: { supplierId?: string; repairCenterId?: string; status?: string; ownerType?: string; ownerId?: string }): Promise<SupplierOrder[]> {
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
    if (filters?.ownerType) {
      conditions.push(sql`${supplierOrders.ownerType}::text = ${filters.ownerType}`);
    }
    if (filters?.ownerId) {
      conditions.push(eq(supplierOrders.ownerId, filters.ownerId));
    }
    
    if (conditions.length > 0) {
      return await db.select().from(supplierOrders)
        .where(and(...conditions))
        .orderBy(desc(supplierOrders.createdAt));
    }
    
    return await db.select().from(supplierOrders).orderBy(desc(supplierOrders.createdAt));
  }

  async listSupplierOrdersByRepairCenters(repairCenterIds: string[]): Promise<SupplierOrder[]> {
    if (repairCenterIds.length === 0) {
      return [];
    }
    return await db.select().from(supplierOrders)
      .where(inArray(supplierOrders.repairCenterId, repairCenterIds))
      .orderBy(desc(supplierOrders.createdAt));
  }

  async listSupplierOrdersByOwner(ownerType: string, ownerId: string): Promise<SupplierOrder[]> {
    return await db.select().from(supplierOrders)
      .where(and(
        sql`${supplierOrders.ownerType}::text = ${ownerType}`,
        eq(supplierOrders.ownerId, ownerId)
      ))
      .orderBy(desc(supplierOrders.createdAt));
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
    // Convert string dates to Date objects for Drizzle compatibility
    const processedUpdates: any = { ...updates };
    const dateFields = ['sentAt', 'confirmedAt', 'shippedAt', 'receivedAt', 'expectedDelivery'];
    for (const field of dateFields) {
      if (processedUpdates[field] && typeof processedUpdates[field] === 'string') {
        processedUpdates[field] = new Date(processedUpdates[field]);
      }
    }
    
    const [order] = await db.update(supplierOrders)
      .set({ ...processedUpdates, updatedAt: new Date() })
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

  async listSupplierReturnsByRepairCenters(repairCenterIds: string[]): Promise<SupplierReturn[]> {
    if (repairCenterIds.length === 0) {
      return [];
    }
    return await db.select().from(supplierReturns)
      .where(inArray(supplierReturns.repairCenterId, repairCenterIds))
      .orderBy(desc(supplierReturns.createdAt));
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

  // ==========================================
  // CUSTOMER BRANCHES (FILIALI)
  // ==========================================

  async listCustomerBranches(parentCustomerId: string): Promise<CustomerBranch[]> {
    return await db.select()
      .from(customerBranches)
      .where(eq(customerBranches.parentCustomerId, parentCustomerId))
      .orderBy(customerBranches.branchName);
  }

  async getCustomerBranch(id: string): Promise<CustomerBranch | undefined> {
    const [branch] = await db.select()
      .from(customerBranches)
      .where(eq(customerBranches.id, id));
    return branch || undefined;
  }

  async createCustomerBranch(branch: InsertCustomerBranch): Promise<CustomerBranch> {
    const [created] = await db.insert(customerBranches)
      .values(branch)
      .returning();
    return created;
  }

  async updateCustomerBranch(id: string, updates: Partial<InsertCustomerBranch>): Promise<CustomerBranch> {
    const [updated] = await db.update(customerBranches)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(customerBranches.id, id))
      .returning();
    
    if (!updated) {
      throw new Error("Branch not found");
    }
    
    return updated;
  }

  async deleteCustomerBranch(id: string): Promise<void> {
    await db.delete(customerBranches)
      .where(eq(customerBranches.id, id));
  }

  async getBranchByCode(parentCustomerId: string, branchCode: string): Promise<CustomerBranch | undefined> {
    const [branch] = await db.select()
      .from(customerBranches)
      .where(and(
        eq(customerBranches.parentCustomerId, parentCustomerId),
        eq(customerBranches.branchCode, branchCode)
      ));
    return branch || undefined;
  }

  // ==========================================
  // UTILITY MODULE
  // ==========================================

  // Utility Categories
  async listUtilityCategories(activeOnly?: boolean): Promise<UtilityCategory[]> {
    if (activeOnly) {
      return await db.select()
        .from(utilityCategories)
        .where(eq(utilityCategories.isActive, true))
        .orderBy(utilityCategories.sortOrder, utilityCategories.name);
    }
    return await db.select()
      .from(utilityCategories)
      .orderBy(utilityCategories.sortOrder, utilityCategories.name);
  }

  async getUtilityCategory(id: string): Promise<UtilityCategory | undefined> {
    const [category] = await db.select()
      .from(utilityCategories)
      .where(eq(utilityCategories.id, id));
    return category || undefined;
  }

  async getUtilityCategoryBySlug(slug: string): Promise<UtilityCategory | undefined> {
    const [category] = await db.select()
      .from(utilityCategories)
      .where(eq(utilityCategories.slug, slug));
    return category || undefined;
  }

  async createUtilityCategory(category: InsertUtilityCategory): Promise<UtilityCategory> {
    const [created] = await db.insert(utilityCategories)
      .values(category)
      .returning();
    return created;
  }

  async updateUtilityCategory(id: string, updates: Partial<InsertUtilityCategory>): Promise<UtilityCategory> {
    const [updated] = await db.update(utilityCategories)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(utilityCategories.id, id))
      .returning();
    
    if (!updated) {
      throw new Error("Categoria utility non trovata");
    }
    
    return updated;
  }

  async deleteUtilityCategory(id: string): Promise<void> {
    await db.delete(utilityCategories)
      .where(eq(utilityCategories.id, id));
  }

  // Utility Suppliers
  async listUtilitySuppliers(filters?: { resellerId?: string }): Promise<UtilitySupplier[]> {
    if (filters?.resellerId) {
      // Reseller vede: i propri fornitori + quelli globali (resellerId = NULL)
      return await db.select()
        .from(utilitySuppliers)
        .where(or(
          eq(utilitySuppliers.resellerId, filters.resellerId),
          isNull(utilitySuppliers.resellerId)
        ))
        .orderBy(utilitySuppliers.name);
    }
    // Admin vede tutti
    return await db.select()
      .from(utilitySuppliers)
      .orderBy(utilitySuppliers.name);
  }

  async getUtilitySupplier(id: string): Promise<UtilitySupplier | undefined> {
    const [supplier] = await db.select()
      .from(utilitySuppliers)
      .where(eq(utilitySuppliers.id, id));
    return supplier || undefined;
  }

  async createUtilitySupplier(supplier: InsertUtilitySupplier): Promise<UtilitySupplier> {
    const [created] = await db.insert(utilitySuppliers)
      .values(supplier)
      .returning();
    return created;
  }

  async updateUtilitySupplier(id: string, updates: Partial<InsertUtilitySupplier>): Promise<UtilitySupplier> {
    const [updated] = await db.update(utilitySuppliers)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(utilitySuppliers.id, id))
      .returning();
    
    if (!updated) {
      throw new Error("Fornitore utility non trovato");
    }
    
    return updated;
  }

  async deleteUtilitySupplier(id: string): Promise<void> {
    await db.delete(utilitySuppliers)
      .where(eq(utilitySuppliers.id, id));
  }

  // Utility Services
  async listUtilityServices(supplierId?: string): Promise<UtilityService[]> {
    if (supplierId) {
      return await db.select()
        .from(utilityServices)
        .where(eq(utilityServices.supplierId, supplierId))
        .orderBy(utilityServices.name);
    }
    return await db.select()
      .from(utilityServices)
      .orderBy(utilityServices.name);
  }

  async getUtilityService(id: string): Promise<UtilityService | undefined> {
    const [service] = await db.select()
      .from(utilityServices)
      .where(eq(utilityServices.id, id));
    return service || undefined;
  }

  async createUtilityService(service: InsertUtilityService): Promise<UtilityService> {
    const [created] = await db.insert(utilityServices)
      .values(service)
      .returning();
    return created;
  }

  async updateUtilityService(id: string, updates: Partial<InsertUtilityService>): Promise<UtilityService> {
    const [updated] = await db.update(utilityServices)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(utilityServices.id, id))
      .returning();
    
    if (!updated) {
      throw new Error("Servizio utility non trovato");
    }
    
    return updated;
  }

  async deleteUtilityService(id: string): Promise<void> {
    await db.delete(utilityServices)
      .where(eq(utilityServices.id, id));
  }

  // Utility Practices
  async listUtilityPractices(filters?: { customerId?: string; resellerId?: string; status?: string; supplierId?: string }): Promise<UtilityPractice[]> {
    const conditions = [];
    
    if (filters?.customerId) {
      conditions.push(eq(utilityPractices.customerId, filters.customerId));
    }
    if (filters?.resellerId) {
      conditions.push(eq(utilityPractices.resellerId, filters.resellerId));
    }
    if (filters?.status) {
      conditions.push(eq(utilityPractices.status, filters.status as any));
    }
    if (filters?.supplierId) {
      conditions.push(eq(utilityPractices.supplierId, filters.supplierId));
    }
    
    if (conditions.length > 0) {
      return await db.select()
        .from(utilityPractices)
        .where(and(...conditions))
        .orderBy(desc(utilityPractices.createdAt));
    }
    
    return await db.select()
      .from(utilityPractices)
      .orderBy(desc(utilityPractices.createdAt));
  }

  async getUtilityPractice(id: string): Promise<UtilityPractice | undefined> {
    const [practice] = await db.select()
      .from(utilityPractices)
      .where(eq(utilityPractices.id, id));
    return practice || undefined;
  }

  async createUtilityPractice(practice: InsertUtilityPractice): Promise<UtilityPractice> {
    // Generate practice number
    const year = new Date().getFullYear();
    const [countResult] = await db.select({ count: sql<number>`count(*)` })
      .from(utilityPractices)
      .where(sql`EXTRACT(YEAR FROM ${utilityPractices.createdAt}) = ${year}`);
    
    const practiceNumber = `UTL-${year}-${String((countResult?.count || 0) + 1).padStart(4, '0')}`;
    
    const [created] = await db.insert(utilityPractices)
      .values({ ...practice, practiceNumber })
      .returning();
    return created;
  }

  async createUtilityPracticeWithProducts(
    practice: InsertUtilityPractice,
    products: Array<{ productId: string; quantity: number; unitPriceCents: number; notes?: string | null }>
  ): Promise<{ practice: UtilityPractice; products: UtilityPracticeProduct[] }> {
    return await db.transaction(async (tx) => {
      // Generate practice number within transaction
      const year = new Date().getFullYear();
      const [countResult] = await tx.select({ count: sql<number>`count(*)` })
        .from(utilityPractices)
        .where(sql`EXTRACT(YEAR FROM ${utilityPractices.createdAt}) = ${year}`);
      
      const practiceNumber = `UTL-${year}-${String((countResult?.count || 0) + 1).padStart(4, '0')}`;
      
      // Create practice
      const [createdPractice] = await tx.insert(utilityPractices)
        .values({ ...practice, practiceNumber })
        .returning();
      
      // Create all products
      const createdProducts: UtilityPracticeProduct[] = [];
      for (const product of products) {
        const [created] = await tx.insert(utilityPracticeProducts)
          .values({
            practiceId: createdPractice.id,
            productId: product.productId,
            quantity: product.quantity,
            unitPriceCents: product.unitPriceCents,
            notes: product.notes || null,
          })
          .returning();
        createdProducts.push(created);
      }
      
      return { practice: createdPractice, products: createdProducts };
    });
  }

  async updateUtilityPractice(id: string, updates: Partial<InsertUtilityPractice>): Promise<UtilityPractice> {
    const [updated] = await db.update(utilityPractices)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(utilityPractices.id, id))
      .returning();
    
    if (!updated) {
      throw new Error("Pratica utility non trovata");
    }
    
    return updated;
  }

  async deleteUtilityPractice(id: string): Promise<void> {
    await db.delete(utilityPractices)
      .where(eq(utilityPractices.id, id));
  }

  // Utility Practice Products
  async listUtilityPracticeProducts(practiceId: string): Promise<UtilityPracticeProduct[]> {
    return await db.select()
      .from(utilityPracticeProducts)
      .where(eq(utilityPracticeProducts.practiceId, practiceId))
      .orderBy(utilityPracticeProducts.createdAt);
  }

  async createUtilityPracticeProduct(product: InsertUtilityPracticeProduct): Promise<UtilityPracticeProduct> {
    const [created] = await db.insert(utilityPracticeProducts)
      .values(product)
      .returning();
    return created;
  }

  async updateUtilityPracticeProduct(id: string, updates: Partial<InsertUtilityPracticeProduct>): Promise<UtilityPracticeProduct> {
    const [updated] = await db.update(utilityPracticeProducts)
      .set(updates)
      .where(eq(utilityPracticeProducts.id, id))
      .returning();
    
    if (!updated) {
      throw new Error("Prodotto pratica non trovato");
    }
    
    return updated;
  }

  async deleteUtilityPracticeProduct(id: string): Promise<void> {
    await db.delete(utilityPracticeProducts)
      .where(eq(utilityPracticeProducts.id, id));
  }

  async deleteUtilityPracticeProductsByPractice(practiceId: string): Promise<void> {
    await db.delete(utilityPracticeProducts)
      .where(eq(utilityPracticeProducts.practiceId, practiceId));
  }

  async syncUtilityPracticeProductsTransactional(
    practiceId: string, 
    products: Array<{ productId: string; quantity: number; unitPriceCents: number; notes?: string | null }>
  ): Promise<UtilityPracticeProduct[]> {
    return await db.transaction(async (tx) => {
      // Delete all existing products for this practice
      await tx.delete(utilityPracticeProducts)
        .where(eq(utilityPracticeProducts.practiceId, practiceId));
      
      // Create all new products
      const createdProducts: UtilityPracticeProduct[] = [];
      for (const product of products) {
        const [created] = await tx.insert(utilityPracticeProducts)
          .values({
            practiceId,
            productId: product.productId,
            quantity: product.quantity,
            unitPriceCents: product.unitPriceCents,
            notes: product.notes || null,
          })
          .returning();
        createdProducts.push(created);
      }
      
      return createdProducts;
    });
  }

  // Utility Commissions
  async listUtilityCommissions(filters?: { practiceId?: string; status?: string; periodYear?: number }): Promise<UtilityCommission[]> {
    const conditions = [];
    
    if (filters?.practiceId) {
      conditions.push(eq(utilityCommissions.practiceId, filters.practiceId));
    }
    if (filters?.status) {
      conditions.push(eq(utilityCommissions.status, filters.status as any));
    }
    if (filters?.periodYear) {
      conditions.push(eq(utilityCommissions.periodYear, filters.periodYear));
    }
    
    if (conditions.length > 0) {
      return await db.select()
        .from(utilityCommissions)
        .where(and(...conditions))
        .orderBy(desc(utilityCommissions.periodYear), desc(utilityCommissions.periodMonth));
    }
    
    return await db.select()
      .from(utilityCommissions)
      .orderBy(desc(utilityCommissions.periodYear), desc(utilityCommissions.periodMonth));
  }

  async getUtilityCommission(id: string): Promise<UtilityCommission | undefined> {
    const [commission] = await db.select()
      .from(utilityCommissions)
      .where(eq(utilityCommissions.id, id));
    return commission || undefined;
  }

  async createUtilityCommission(commission: InsertUtilityCommission): Promise<UtilityCommission> {
    const [created] = await db.insert(utilityCommissions)
      .values(commission)
      .returning();
    return created;
  }

  async updateUtilityCommission(id: string, updates: Partial<InsertUtilityCommission>): Promise<UtilityCommission> {
    const [updated] = await db.update(utilityCommissions)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(utilityCommissions.id, id))
      .returning();
    
    if (!updated) {
      throw new Error("Commissione utility non trovata");
    }
    
    return updated;
  }

  async deleteUtilityCommission(id: string): Promise<void> {
    await db.delete(utilityCommissions)
      .where(eq(utilityCommissions.id, id));
  }

  // ==========================================
  // UTILITY PRACTICE DOCUMENTS
  // ==========================================
  
  async listUtilityPracticeDocuments(practiceId: string): Promise<UtilityPracticeDocument[]> {
    return await db.select()
      .from(utilityPracticeDocuments)
      .where(eq(utilityPracticeDocuments.practiceId, practiceId))
      .orderBy(desc(utilityPracticeDocuments.createdAt));
  }
  
  async getUtilityPracticeDocument(id: string): Promise<UtilityPracticeDocument | undefined> {
    const [document] = await db.select()
      .from(utilityPracticeDocuments)
      .where(eq(utilityPracticeDocuments.id, id));
    return document || undefined;
  }
  
  async createUtilityPracticeDocument(document: InsertUtilityPracticeDocument): Promise<UtilityPracticeDocument> {
    const [created] = await db.insert(utilityPracticeDocuments)
      .values(document)
      .returning();
    return created;
  }
  
  async deleteUtilityPracticeDocument(id: string): Promise<void> {
    await db.delete(utilityPracticeDocuments)
      .where(eq(utilityPracticeDocuments.id, id));
  }

  // ==========================================
  // UTILITY PRACTICE TASKS
  // ==========================================
  
  async listUtilityPracticeTasks(practiceId: string): Promise<UtilityPracticeTask[]> {
    return await db.select()
      .from(utilityPracticeTasks)
      .where(eq(utilityPracticeTasks.practiceId, practiceId))
      .orderBy(utilityPracticeTasks.sortOrder);
  }
  
  async getUtilityPracticeTask(id: string): Promise<UtilityPracticeTask | undefined> {
    const [task] = await db.select()
      .from(utilityPracticeTasks)
      .where(eq(utilityPracticeTasks.id, id));
    return task || undefined;
  }
  
  async createUtilityPracticeTask(task: InsertUtilityPracticeTask): Promise<UtilityPracticeTask> {
    const [created] = await db.insert(utilityPracticeTasks)
      .values(task)
      .returning();
    return created;
  }
  
  async updateUtilityPracticeTask(id: string, updates: Partial<InsertUtilityPracticeTask>): Promise<UtilityPracticeTask> {
    const [updated] = await db.update(utilityPracticeTasks)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(utilityPracticeTasks.id, id))
      .returning();
    
    if (!updated) {
      throw new Error("Task pratica utility non trovato");
    }
    
    return updated;
  }
  
  async deleteUtilityPracticeTask(id: string): Promise<void> {
    await db.delete(utilityPracticeTasks)
      .where(eq(utilityPracticeTasks.id, id));
  }

  // ==========================================
  // UTILITY PRACTICE NOTES
  // ==========================================
  
  async listUtilityPracticeNotes(practiceId: string): Promise<UtilityPracticeNote[]> {
    return await db.select()
      .from(utilityPracticeNotes)
      .where(eq(utilityPracticeNotes.practiceId, practiceId))
      .orderBy(desc(utilityPracticeNotes.createdAt));
  }
  
  async createUtilityPracticeNote(note: InsertUtilityPracticeNote): Promise<UtilityPracticeNote> {
    const [created] = await db.insert(utilityPracticeNotes)
      .values(note)
      .returning();
    return created;
  }
  
  async deleteUtilityPracticeNote(id: string): Promise<void> {
    await db.delete(utilityPracticeNotes)
      .where(eq(utilityPracticeNotes.id, id));
  }

  // ==========================================
  // UTILITY PRACTICE TIMELINE
  // ==========================================
  
  async listUtilityPracticeTimeline(practiceId: string): Promise<UtilityPracticeTimelineEvent[]> {
    return await db.select()
      .from(utilityPracticeTimeline)
      .where(eq(utilityPracticeTimeline.practiceId, practiceId))
      .orderBy(desc(utilityPracticeTimeline.createdAt));
  }
  
  async createUtilityPracticeTimelineEvent(event: InsertUtilityPracticeTimelineEvent): Promise<UtilityPracticeTimelineEvent> {
    const [created] = await db.insert(utilityPracticeTimeline)
      .values(event)
      .returning();
    return created;
  }

  // ==========================================
  // UTILITY PRACTICE STATE HISTORY
  // ==========================================
  
  async listUtilityPracticeStateHistory(practiceId: string): Promise<UtilityPracticeStateHistoryEntry[]> {
    return await db.select()
      .from(utilityPracticeStateHistory)
      .where(eq(utilityPracticeStateHistory.practiceId, practiceId))
      .orderBy(desc(utilityPracticeStateHistory.createdAt));
  }
  
  async createUtilityPracticeStateHistory(entry: InsertUtilityPracticeStateHistoryEntry): Promise<UtilityPracticeStateHistoryEntry> {
    const [created] = await db.insert(utilityPracticeStateHistory)
      .values(entry)
      .returning();
    return created;
  }

  // ==========================================
  // EXTERNAL INTEGRATIONS (Admin-managed)
  // ==========================================

  async listExternalIntegrations(): Promise<ExternalIntegration[]> {
    return await db.select()
      .from(externalIntegrations)
      .orderBy(externalIntegrations.displayOrder);
  }

  async listActiveExternalIntegrations(): Promise<ExternalIntegration[]> {
    return await db.select()
      .from(externalIntegrations)
      .where(eq(externalIntegrations.isActive, true))
      .orderBy(externalIntegrations.displayOrder);
  }

  async getExternalIntegration(id: string): Promise<ExternalIntegration | undefined> {
    const [integration] = await db.select()
      .from(externalIntegrations)
      .where(eq(externalIntegrations.id, id))
      .limit(1);
    return integration;
  }

  async getExternalIntegrationByCode(code: string): Promise<ExternalIntegration | undefined> {
    const [integration] = await db.select()
      .from(externalIntegrations)
      .where(eq(externalIntegrations.code, code))
      .limit(1);
    return integration;
  }

  async createExternalIntegration(integration: InsertExternalIntegration): Promise<ExternalIntegration> {
    const [created] = await db.insert(externalIntegrations)
      .values(integration)
      .returning();
    return created;
  }

  async updateExternalIntegration(id: string, updates: Partial<InsertExternalIntegration>): Promise<ExternalIntegration> {
    const [updated] = await db.update(externalIntegrations)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(externalIntegrations.id, id))
      .returning();
    return updated;
  }

  async deleteExternalIntegration(id: string): Promise<void> {
    await db.delete(externalIntegrations)
      .where(eq(externalIntegrations.id, id));
  }

  // SIFAR Credentials
  async getSifarCredentialByReseller(resellerId: string): Promise<SifarCredential | undefined> {
    const [credential] = await db.select()
      .from(sifarCredentials)
      .where(eq(sifarCredentials.resellerId, resellerId))
      .limit(1);
    return credential;
  }

  async getSifarCredential(id: string): Promise<SifarCredential | undefined> {
    const [credential] = await db.select()
      .from(sifarCredentials)
      .where(eq(sifarCredentials.id, id))
      .limit(1);
    return credential;
  }

  async createSifarCredential(credential: InsertSifarCredential): Promise<SifarCredential> {
    const [created] = await db.insert(sifarCredentials)
      .values(credential)
      .returning();
    return created;
  }

  async updateSifarCredential(id: string, updates: Partial<InsertSifarCredential>): Promise<SifarCredential> {
    const [updated] = await db.update(sifarCredentials)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(sifarCredentials.id, id))
      .returning();
    return updated;
  }

  async deleteSifarCredential(id: string): Promise<void> {
    await db.delete(sifarCredentials)
      .where(eq(sifarCredentials.id, id));
  }

  // SIFAR Stores
  async listSifarStores(credentialId: string): Promise<SifarStore[]> {
    return await db.select()
      .from(sifarStores)
      .where(eq(sifarStores.credentialId, credentialId));
  }

  async getSifarStore(id: string): Promise<SifarStore | undefined> {
    const [store] = await db.select()
      .from(sifarStores)
      .where(eq(sifarStores.id, id))
      .limit(1);
    return store;
  }

  async createSifarStore(store: InsertSifarStore): Promise<SifarStore> {
    const [created] = await db.insert(sifarStores)
      .values(store)
      .returning();
    return created;
  }

  async updateSifarStore(id: string, updates: Partial<InsertSifarStore>): Promise<SifarStore> {
    const [updated] = await db.update(sifarStores)
      .set(updates)
      .where(eq(sifarStores.id, id))
      .returning();
    return updated;
  }

  async deleteSifarStore(id: string): Promise<void> {
    await db.delete(sifarStores)
      .where(eq(sifarStores.id, id));
  }

  // ==========================================
  // TROVAUSATI INTEGRATION
  // ==========================================

  async getTrovausatiCredentialByReseller(resellerId: string): Promise<TrovausatiCredential | undefined> {
    const [credential] = await db.select()
      .from(trovausatiCredentials)
      .where(eq(trovausatiCredentials.resellerId, resellerId))
      .limit(1);
    return credential;
  }

  async getTrovausatiCredential(id: string): Promise<TrovausatiCredential | undefined> {
    const [credential] = await db.select()
      .from(trovausatiCredentials)
      .where(eq(trovausatiCredentials.id, id))
      .limit(1);
    return credential;
  }

  async createTrovausatiCredential(credential: InsertTrovausatiCredential): Promise<TrovausatiCredential> {
    const [created] = await db.insert(trovausatiCredentials)
      .values(credential)
      .returning();
    return created;
  }

  async updateTrovausatiCredential(id: string, updates: Partial<InsertTrovausatiCredential>): Promise<TrovausatiCredential> {
    const [updated] = await db.update(trovausatiCredentials)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(trovausatiCredentials.id, id))
      .returning();
    return updated;
  }

  async deleteTrovausatiCredential(id: string): Promise<void> {
    await db.delete(trovausatiCredentials)
      .where(eq(trovausatiCredentials.id, id));
  }

  async listTrovausatiShops(credentialId: string): Promise<TrovausatiShop[]> {
    return await db.select()
      .from(trovausatiShops)
      .where(eq(trovausatiShops.credentialId, credentialId));
  }

  async getTrovausatiShop(id: string): Promise<TrovausatiShop | undefined> {
    const [shop] = await db.select()
      .from(trovausatiShops)
      .where(eq(trovausatiShops.id, id))
      .limit(1);
    return shop;
  }

  async createTrovausatiShop(shop: InsertTrovausatiShop): Promise<TrovausatiShop> {
    const [created] = await db.insert(trovausatiShops)
      .values(shop)
      .returning();
    return created;
  }

  async updateTrovausatiShop(id: string, updates: Partial<InsertTrovausatiShop>): Promise<TrovausatiShop> {
    const [updated] = await db.update(trovausatiShops)
      .set(updates)
      .where(eq(trovausatiShops.id, id))
      .returning();
    return updated;
  }

  async deleteTrovausatiShop(id: string): Promise<void> {
    await db.delete(trovausatiShops)
      .where(eq(trovausatiShops.id, id));
  }

  async listTrovausatiOrders(credentialId: string): Promise<TrovausatiOrder[]> {
    return await db.select()
      .from(trovausatiOrders)
      .where(eq(trovausatiOrders.credentialId, credentialId))
      .orderBy(desc(trovausatiOrders.createdAt));
  }

  async getTrovausatiOrder(id: string): Promise<TrovausatiOrder | undefined> {
    const [order] = await db.select()
      .from(trovausatiOrders)
      .where(eq(trovausatiOrders.id, id))
      .limit(1);
    return order;
  }

  async createTrovausatiOrder(order: InsertTrovausatiOrder): Promise<TrovausatiOrder> {
    const [created] = await db.insert(trovausatiOrders)
      .values(order)
      .returning();
    return created;
  }

  async updateTrovausatiOrder(id: string, updates: Partial<InsertTrovausatiOrder>): Promise<TrovausatiOrder> {
    const [updated] = await db.update(trovausatiOrders)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(trovausatiOrders.id, id))
      .returning();
    return updated;
  }

  // ==========================================
  // FONEDAY INTEGRATION
  // ==========================================

  async getFonedayCredentialByReseller(resellerId: string): Promise<FonedayCredential | undefined> {
    const [credential] = await db.select()
      .from(fonedayCredentials)
      .where(eq(fonedayCredentials.resellerId, resellerId))
      .limit(1);
    return credential;
  }

  async getFonedayCredential(id: string): Promise<FonedayCredential | undefined> {
    const [credential] = await db.select()
      .from(fonedayCredentials)
      .where(eq(fonedayCredentials.id, id))
      .limit(1);
    return credential;
  }

  async createFonedayCredential(credential: InsertFonedayCredential): Promise<FonedayCredential> {
    const [created] = await db.insert(fonedayCredentials)
      .values(credential)
      .returning();
    return created;
  }

  async updateFonedayCredential(id: string, updates: Partial<InsertFonedayCredential>): Promise<FonedayCredential> {
    const [updated] = await db.update(fonedayCredentials)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(fonedayCredentials.id, id))
      .returning();
    return updated;
  }

  async deleteFonedayCredential(id: string): Promise<void> {
    await db.delete(fonedayCredentials)
      .where(eq(fonedayCredentials.id, id));
  }

  async listFonedayOrders(credentialId: string): Promise<FonedayOrder[]> {
    return await db.select()
      .from(fonedayOrders)
      .where(eq(fonedayOrders.credentialId, credentialId))
      .orderBy(sql`${fonedayOrders.createdAt} DESC`);
  }

  async getFonedayOrder(id: string): Promise<FonedayOrder | undefined> {
    const [order] = await db.select()
      .from(fonedayOrders)
      .where(eq(fonedayOrders.id, id))
      .limit(1);
    return order;
  }

  async createFonedayOrder(order: InsertFonedayOrder): Promise<FonedayOrder> {
    const [created] = await db.insert(fonedayOrders)
      .values(order)
      .returning();
    return created;
  }

  async updateFonedayOrder(id: string, updates: Partial<InsertFonedayOrder>): Promise<FonedayOrder> {
    const [updated] = await db.update(fonedayOrders)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(fonedayOrders.id, id))
      .returning();
    return updated;
  }

  // Foneday Products Cache
  async getFonedayProductsCache(resellerId: string): Promise<FonedayProductsCache | undefined> {
    const [cache] = await db.select()
      .from(fonedayProductsCache)
      .where(eq(fonedayProductsCache.resellerId, resellerId))
      .limit(1);
    return cache;
  }

  async createFonedayProductsCache(cache: InsertFonedayProductsCache): Promise<FonedayProductsCache> {
    const [created] = await db.insert(fonedayProductsCache)
      .values(cache)
      .returning();
    return created;
  }

  async updateFonedayProductsCache(id: string, updates: Partial<InsertFonedayProductsCache>): Promise<FonedayProductsCache> {
    const [updated] = await db.update(fonedayProductsCache)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(fonedayProductsCache.id, id))
      .returning();
    return updated;
  }

  async deleteFonedayProductsCache(resellerId: string): Promise<void> {
    await db.delete(fonedayProductsCache)
      .where(eq(fonedayProductsCache.resellerId, resellerId));
  }

  // ==========================================
  // MOBILESENTRIX INTEGRATION
  // ==========================================

  async getMobilesentrixCredentialByReseller(resellerId: string): Promise<MobilesentrixCredential | undefined> {
    const [credential] = await db.select()
      .from(mobilesentrixCredentials)
      .where(eq(mobilesentrixCredentials.resellerId, resellerId))
      .limit(1);
    return credential;
  }

  async getMobilesentrixCredential(id: string): Promise<MobilesentrixCredential | undefined> {
    const [credential] = await db.select()
      .from(mobilesentrixCredentials)
      .where(eq(mobilesentrixCredentials.id, id))
      .limit(1);
    return credential;
  }

  async createMobilesentrixCredential(credential: InsertMobilesentrixCredential): Promise<MobilesentrixCredential> {
    const [created] = await db.insert(mobilesentrixCredentials)
      .values(credential)
      .returning();
    return created;
  }

  async updateMobilesentrixCredential(id: string, updates: Partial<InsertMobilesentrixCredential>): Promise<MobilesentrixCredential> {
    const [updated] = await db.update(mobilesentrixCredentials)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(mobilesentrixCredentials.id, id))
      .returning();
    return updated;
  }

  async deleteMobilesentrixCredential(id: string): Promise<void> {
    await db.delete(mobilesentrixCredentials)
      .where(eq(mobilesentrixCredentials.id, id));
  }

  async listMobilesentrixOrders(credentialId: string): Promise<MobilesentrixOrder[]> {
    return await db.select()
      .from(mobilesentrixOrders)
      .where(eq(mobilesentrixOrders.credentialId, credentialId))
      .orderBy(sql`${mobilesentrixOrders.createdAt} DESC`);
  }

  async getMobilesentrixOrder(id: string): Promise<MobilesentrixOrder | undefined> {
    const [order] = await db.select()
      .from(mobilesentrixOrders)
      .where(eq(mobilesentrixOrders.id, id))
      .limit(1);
    return order;
  }

  async createMobilesentrixOrder(order: InsertMobilesentrixOrder): Promise<MobilesentrixOrder> {
    const [created] = await db.insert(mobilesentrixOrders)
      .values(order)
      .returning();
    return created;
  }

  async updateMobilesentrixOrder(id: string, updates: Partial<InsertMobilesentrixOrder>): Promise<MobilesentrixOrder> {
    const [updated] = await db.update(mobilesentrixOrders)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(mobilesentrixOrders.id, id))
      .returning();
    return updated;
  }

  // ==========================================
  // MOBILESENTRIX CART
  // ==========================================

  async getMobilesentrixCartItems(credentialId: string): Promise<MobilesentrixCartItem[]> {
    return await db.select()
      .from(mobilesentrixCartItems)
      .where(eq(mobilesentrixCartItems.credentialId, credentialId))
      .orderBy(desc(mobilesentrixCartItems.createdAt));
  }

  async getMobilesentrixCartItem(id: string): Promise<MobilesentrixCartItem | undefined> {
    const [item] = await db.select()
      .from(mobilesentrixCartItems)
      .where(eq(mobilesentrixCartItems.id, id));
    return item;
  }

  async getMobilesentrixCartItemBySku(credentialId: string, sku: string): Promise<MobilesentrixCartItem | undefined> {
    const [item] = await db.select()
      .from(mobilesentrixCartItems)
      .where(and(
        eq(mobilesentrixCartItems.credentialId, credentialId),
        eq(mobilesentrixCartItems.sku, sku)
      ));
    return item;
  }

  async addMobilesentrixCartItem(item: InsertMobilesentrixCartItem): Promise<MobilesentrixCartItem> {
    const [created] = await db.insert(mobilesentrixCartItems).values(item).returning();
    return created;
  }

  async updateMobilesentrixCartItem(id: string, updates: Partial<InsertMobilesentrixCartItem>): Promise<MobilesentrixCartItem> {
    const [updated] = await db.update(mobilesentrixCartItems)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(mobilesentrixCartItems.id, id))
      .returning();
    return updated;
  }

  async deleteMobilesentrixCartItem(id: string): Promise<void> {
    await db.delete(mobilesentrixCartItems).where(eq(mobilesentrixCartItems.id, id));
  }

  async clearMobilesentrixCart(credentialId: string): Promise<void> {
    await db.delete(mobilesentrixCartItems).where(eq(mobilesentrixCartItems.credentialId, credentialId));
  }

  async getMobilesentrixOrderItems(orderId: string): Promise<MobilesentrixOrderItem[]> {
    return await db.select()
      .from(mobilesentrixOrderItems)
      .where(eq(mobilesentrixOrderItems.orderId, orderId));
  }

  async createMobilesentrixOrderItem(item: InsertMobilesentrixOrderItem): Promise<MobilesentrixOrderItem> {
    const [created] = await db.insert(mobilesentrixOrderItems).values(item).returning();
    return created;
  }

  async updateMobilesentrixOrderItem(id: string, updates: Partial<InsertMobilesentrixOrderItem>): Promise<MobilesentrixOrderItem> {
    const [updated] = await db.update(mobilesentrixOrderItems)
      .set(updates)
      .where(eq(mobilesentrixOrderItems.id, id))
      .returning();
    return updated;
  }

  // ==========================================
  // EXTERNAL PRODUCT MAPPINGS
  // ==========================================

  async listExternalProductMappings(resellerId: string, source?: string): Promise<ExternalProductMapping[]> {
    const conditions = [eq(externalProductMappings.resellerId, resellerId)];
    if (source) {
      conditions.push(eq(externalProductMappings.source, source as any));
    }
    return await db.select()
      .from(externalProductMappings)
      .where(and(...conditions))
      .orderBy(desc(externalProductMappings.createdAt));
  }

  async getExternalProductMapping(id: string): Promise<ExternalProductMapping | undefined> {
    const [mapping] = await db.select()
      .from(externalProductMappings)
      .where(eq(externalProductMappings.id, id))
      .limit(1);
    return mapping;
  }

  async getExternalProductMappingBySku(resellerId: string, source: string, externalSku: string): Promise<ExternalProductMapping | undefined> {
    const [mapping] = await db.select()
      .from(externalProductMappings)
      .where(and(
        eq(externalProductMappings.resellerId, resellerId),
        eq(externalProductMappings.source, source as any),
        eq(externalProductMappings.externalSku, externalSku)
      ))
      .limit(1);
    return mapping;
  }

  async createExternalProductMapping(mapping: InsertExternalProductMapping): Promise<ExternalProductMapping> {
    const [created] = await db.insert(externalProductMappings)
      .values(mapping)
      .returning();
    return created;
  }

  async updateExternalProductMapping(id: string, updates: Partial<InsertExternalProductMapping>): Promise<ExternalProductMapping> {
    const [updated] = await db.update(externalProductMappings)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(externalProductMappings.id, id))
      .returning();
    return updated;
  }

  async deleteExternalProductMapping(id: string): Promise<void> {
    await db.delete(externalProductMappings).where(eq(externalProductMappings.id, id));
  }

  // ==========================================
  // SERVICE CATALOG (CATALOGO INTERVENTI)
  // ==========================================

  async listServiceItems(): Promise<ServiceItem[]> {
    return await db.select()
      .from(serviceItems)
      .orderBy(desc(serviceItems.createdAt));
  }

  async getServiceItem(id: string): Promise<ServiceItem | undefined> {
    const [item] = await db.select()
      .from(serviceItems)
      .where(eq(serviceItems.id, id))
      .limit(1);
    return item;
  }

  async createServiceItem(item: InsertServiceItem): Promise<ServiceItem> {
    const [created] = await db.insert(serviceItems)
      .values(item)
      .returning();
    return created;
  }

  async updateServiceItem(id: string, updates: Partial<InsertServiceItem>): Promise<ServiceItem> {
    const [updated] = await db.update(serviceItems)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(serviceItems.id, id))
      .returning();
    if (!updated) throw new Error("Service item not found");
    return updated;
  }

  async deleteServiceItem(id: string): Promise<void> {
    await db.delete(serviceItems)
      .where(eq(serviceItems.id, id));
  }

  // Service Item Prices
  async listServiceItemPrices(serviceItemId: string): Promise<ServiceItemPrice[]> {
    return await db.select()
      .from(serviceItemPrices)
      .where(eq(serviceItemPrices.serviceItemId, serviceItemId));
  }

  async listServiceItemPricesByReseller(resellerId: string): Promise<ServiceItemPrice[]> {
    return await db.select()
      .from(serviceItemPrices)
      .where(eq(serviceItemPrices.resellerId, resellerId));
  }

  async listServiceItemPricesByRepairCenter(repairCenterId: string): Promise<ServiceItemPrice[]> {
    return await db.select()
      .from(serviceItemPrices)
      .where(eq(serviceItemPrices.repairCenterId, repairCenterId));
  }

  async getServiceItemPricesForEntity(resellerId?: string, repairCenterId?: string): Promise<ServiceItemPrice[]> {
    if (repairCenterId) {
      return await db.select()
        .from(serviceItemPrices)
        .where(eq(serviceItemPrices.repairCenterId, repairCenterId));
    }
    if (resellerId) {
      return await db.select()
        .from(serviceItemPrices)
        .where(eq(serviceItemPrices.resellerId, resellerId));
    }
    return [];
  }

  async getServiceItemPrice(id: string): Promise<ServiceItemPrice | undefined> {
    const [price] = await db.select()
      .from(serviceItemPrices)
      .where(eq(serviceItemPrices.id, id))
      .limit(1);
    return price;
  }

  async createServiceItemPrice(price: InsertServiceItemPrice): Promise<ServiceItemPrice> {
    const [created] = await db.insert(serviceItemPrices)
      .values(price)
      .returning();
    return created;
  }

  async updateServiceItemPrice(id: string, updates: Partial<InsertServiceItemPrice>): Promise<ServiceItemPrice> {
    const [updated] = await db.update(serviceItemPrices)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(serviceItemPrices.id, id))
      .returning();
    if (!updated) throw new Error("Service item price not found");
    return updated;
  }

  async deleteServiceItemPrice(id: string): Promise<void> {
    await db.delete(serviceItemPrices)
      .where(eq(serviceItemPrices.id, id));
  }

  async getEffectiveServicePrice(
    serviceItemId: string, 
    resellerId?: string, 
    repairCenterId?: string
  ): Promise<{ priceCents: number; laborMinutes: number; source: 'base' | 'reseller' | 'repair_center' }> {
    // Get base service item
    const item = await this.getServiceItem(serviceItemId);
    if (!item) throw new Error("Service item not found");

    // Priority: repair_center > reseller > base
    if (repairCenterId) {
      const [centerPrice] = await db.select()
        .from(serviceItemPrices)
        .where(and(
          eq(serviceItemPrices.serviceItemId, serviceItemId),
          eq(serviceItemPrices.repairCenterId, repairCenterId),
          eq(serviceItemPrices.isActive, true)
        ))
        .limit(1);
      
      if (centerPrice) {
        return {
          priceCents: centerPrice.priceCents,
          laborMinutes: item.defaultLaborMinutes, // Sempre dal catalogo
          source: 'repair_center'
        };
      }
    }

    if (resellerId) {
      const [resellerPrice] = await db.select()
        .from(serviceItemPrices)
        .where(and(
          eq(serviceItemPrices.serviceItemId, serviceItemId),
          eq(serviceItemPrices.resellerId, resellerId),
          eq(serviceItemPrices.isActive, true)
        ))
        .limit(1);
      
      if (resellerPrice) {
        return {
          priceCents: resellerPrice.priceCents,
          laborMinutes: item.defaultLaborMinutes, // Sempre dal catalogo
          source: 'reseller'
        };
      }
    }

    // Return base price
    return {
      priceCents: item.defaultPriceCents,
      laborMinutes: item.defaultLaborMinutes,
      source: 'base'
    };
  }

  // Reseller Staff Team Management - includes owner + staff
  async listResellerStaff(resellerId: string): Promise<User[]> {
    return await db.select()
      .from(users)
      .where(or(
        // Staff members
        and(
          eq(users.resellerId, resellerId),
          eq(users.role, 'reseller_staff')
        ),
        // Owner (the reseller itself)
        and(
          eq(users.id, resellerId),
          eq(users.role, 'reseller')
        )
      ));
  }

  // Repair Center Staff Team Management - includes owner + staff
  async listRepairCenterStaff(repairCenterId: string): Promise<User[]> {
    return await db.select()
      .from(users)
      .where(or(
        // Staff members
        and(
          eq(users.repairCenterId, repairCenterId),
          eq(users.role, 'repair_center_staff')
        ),
        // Owner (the repair center user - their repair_center_id points to the center)
        and(
          eq(users.repairCenterId, repairCenterId),
          eq(users.role, 'repair_center')
        )
      ));
  }

  async listRepairCenterStaffHierarchical(resellerId: string): Promise<Array<{
    id: string;
    username: string;
    email: string;
    fullName: string;
    phone: string | null;
    role: string;
    isActive: boolean;
    repairCenterId: string | null;
    createdAt: Date | null;
    repairCenterName: string;
  }>> {
    const accessibleIds = await this.getAccessibleResellerIds(resellerId);
    
    if (accessibleIds.length === 0) {
      return [];
    }
    
    const repairCenters = await db.select({
      id: users.id,
      name: users.fullName,
      ragioneSociale: users.ragioneSociale
    })
      .from(users)
      .where(and(
        inArray(users.id, accessibleIds),
        eq(users.role, 'repair_center')
      ));
    
    const repairCenterIds = repairCenters.map(rc => rc.id);
    
    if (repairCenterIds.length === 0) {
      return [];
    }
    
    const repairCenterMap = new Map(
      repairCenters.map(rc => [rc.id, rc.name || rc.ragioneSociale || 'N/A'])
    );
    
    // Include both owners (repair_center role) and staff (repair_center_staff role)
    const staffMembers = await db.select({
      id: users.id,
      username: users.username,
      email: users.email,
      fullName: users.fullName,
      phone: users.phone,
      role: users.role,
      isActive: users.isActive,
      repairCenterId: users.repairCenterId,
      createdAt: users.createdAt
    })
      .from(users)
      .where(and(
        inArray(users.repairCenterId, repairCenterIds),
        or(
          eq(users.role, 'repair_center_staff'),
          eq(users.role, 'repair_center')
        )
      ));
    
    return staffMembers.map(staff => ({
      id: staff.id,
      username: staff.username,
      email: staff.email,
      fullName: staff.fullName,
      phone: staff.phone,
      role: staff.role,
      isActive: staff.isActive,
      repairCenterId: staff.repairCenterId,
      createdAt: staff.createdAt,
      repairCenterName: repairCenterMap.get(staff.repairCenterId!) || 'N/A'
    }));
  }

  async createRepairCenterStaff(data: { repairCenterId: string; username: string; password: string; email: string; fullName: string; phone?: string }): Promise<User> {
    const { scryptSync, randomBytes } = await import('crypto');
    const salt = randomBytes(16).toString('hex');
    const hash = scryptSync(data.password, salt, 64).toString('hex');
    const hashedPassword = `${salt}:${hash}`;
    
    const [user] = await db.insert(users)
      .values({
        id: crypto.randomUUID(),
        username: data.username,
        password: hashedPassword,
        email: data.email,
        fullName: data.fullName,
        phone: data.phone || null,
        role: 'repair_center_staff',
        repairCenterId: data.repairCenterId,
        isActive: true
      })
      .returning();
    return user;
  }

  async updateRepairCenterStaff(userId: string, repairCenterId: string, updates: Partial<{ username: string; email: string; fullName: string; phone: string; isActive: boolean }>): Promise<User> {
    const [existing] = await db.select().from(users)
      .where(and(
        eq(users.id, userId),
        eq(users.repairCenterId, repairCenterId),
        eq(users.role, 'repair_center_staff')
      ));
    if (!existing) throw new Error("Staff non trovato");
    
    const [updated] = await db.update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return updated;
  }

  async deleteRepairCenterStaff(userId: string, repairCenterId: string): Promise<void> {
    const [existing] = await db.select().from(users)
      .where(and(
        eq(users.id, userId),
        eq(users.repairCenterId, repairCenterId),
        eq(users.role, 'repair_center_staff')
      ));
    if (!existing) throw new Error("Staff non trovato");
    
    await db.delete(users).where(eq(users.id, userId));
  }

  async resetRepairCenterStaffPassword(userId: string, repairCenterId: string, newPassword: string): Promise<void> {
    const [existing] = await db.select().from(users)
      .where(and(
        eq(users.id, userId),
        eq(users.repairCenterId, repairCenterId),
        eq(users.role, 'repair_center_staff')
      ));
    if (!existing) throw new Error("Staff non trovato");
    
    const { scryptSync, randomBytes } = await import('crypto');
    const salt = randomBytes(16).toString('hex');
    const hash = scryptSync(newPassword, salt, 64).toString('hex');
    const hashedPassword = `${salt}:${hash}`;
    
    await db.update(users)
      .set({ password: hashedPassword, updatedAt: new Date() })
      .where(eq(users.id, userId));
  }

  // Reseller Staff Permissions
  async getStaffPermissions(userId: string): Promise<ResellerStaffPermission[]> {
    return await db.select()
      .from(resellerStaffPermissions)
      .where(eq(resellerStaffPermissions.userId, userId));
  }

  async getStaffPermissionForModule(userId: string, module: string): Promise<ResellerStaffPermission | undefined> {
    const [permission] = await db.select()
      .from(resellerStaffPermissions)
      .where(and(
        eq(resellerStaffPermissions.userId, userId),
        sql`${resellerStaffPermissions.module} = ${module}`
      ))
      .limit(1);
    return permission;
  }

  async createStaffPermission(permission: InsertResellerStaffPermission): Promise<ResellerStaffPermission> {
    const [created] = await db.insert(resellerStaffPermissions)
      .values(permission)
      .returning();
    return created;
  }

  async updateStaffPermission(id: string, updates: Partial<Pick<ResellerStaffPermission, 'canRead' | 'canCreate' | 'canUpdate' | 'canDelete'>>): Promise<ResellerStaffPermission> {
    const [updated] = await db.update(resellerStaffPermissions)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(resellerStaffPermissions.id, id))
      .returning();
    if (!updated) throw new Error("Staff permission not found");
    return updated;
  }

  async deleteStaffPermission(id: string): Promise<void> {
    await db.delete(resellerStaffPermissions)
      .where(eq(resellerStaffPermissions.id, id));
  }

  async deleteStaffPermissionsByUser(userId: string): Promise<void> {
    await db.delete(resellerStaffPermissions)
      .where(eq(resellerStaffPermissions.userId, userId));
  }

  async upsertStaffPermissions(
    userId: string, 
    resellerId: string, 
    permissions: { module: string; canRead: boolean; canCreate: boolean; canUpdate: boolean; canDelete: boolean }[]
  ): Promise<ResellerStaffPermission[]> {
    const results: ResellerStaffPermission[] = [];
    
    for (const perm of permissions) {
      // Check if permission exists
      const existing = await this.getStaffPermissionForModule(userId, perm.module);
      
      if (existing) {
        // Update existing
        const updated = await this.updateStaffPermission(existing.id, {
          canRead: perm.canRead,
          canCreate: perm.canCreate,
          canUpdate: perm.canUpdate,
          canDelete: perm.canDelete
        });
        results.push(updated);
      } else {
        // Create new
        const created = await db.insert(resellerStaffPermissions)
          .values({
            userId,
            resellerId,
            module: perm.module as any,
            canRead: perm.canRead,
            canCreate: perm.canCreate,
            canUpdate: perm.canUpdate,
            canDelete: perm.canDelete
          })
          .returning();
        results.push(created[0]);
      }
    }
    
    return results;
  }

  async checkStaffPermission(userId: string, module: string, action: 'read' | 'create' | 'update' | 'delete'): Promise<boolean> {
    const permission = await this.getStaffPermissionForModule(userId, module);
    if (!permission) return false;
    
    switch (action) {
      case 'read': return permission.canRead;
      case 'create': return permission.canCreate;
      case 'update': return permission.canUpdate;
      case 'delete': return permission.canDelete;
      default: return false;
    }
  }

  // Admin Staff Team Management
  async listAdminStaff(): Promise<User[]> {
    return await db.select()
      .from(users)
      .where(eq(users.role, 'admin_staff'));
  }

  // Admin Staff Permissions
  async getAdminStaffPermissions(userId: string): Promise<AdminStaffPermission[]> {
    return await db.select()
      .from(adminStaffPermissions)
      .where(eq(adminStaffPermissions.userId, userId));
  }

  async getAdminStaffPermissionForModule(userId: string, module: string): Promise<AdminStaffPermission | undefined> {
    const [permission] = await db.select()
      .from(adminStaffPermissions)
      .where(and(
        eq(adminStaffPermissions.userId, userId),
        sql`${adminStaffPermissions.module} = ${module}`
      ))
      .limit(1);
    return permission;
  }

  async createAdminStaffPermission(permission: InsertAdminStaffPermission): Promise<AdminStaffPermission> {
    const [created] = await db.insert(adminStaffPermissions)
      .values(permission)
      .returning();
    return created;
  }

  async updateAdminStaffPermission(id: string, updates: Partial<Pick<AdminStaffPermission, 'canRead' | 'canCreate' | 'canUpdate' | 'canDelete'>>): Promise<AdminStaffPermission> {
    const [updated] = await db.update(adminStaffPermissions)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(adminStaffPermissions.id, id))
      .returning();
    if (!updated) throw new Error("Admin staff permission not found");
    return updated;
  }

  async deleteAdminStaffPermission(id: string): Promise<void> {
    await db.delete(adminStaffPermissions)
      .where(eq(adminStaffPermissions.id, id));
  }

  async deleteAdminStaffPermissionsByUser(userId: string): Promise<void> {
    await db.delete(adminStaffPermissions)
      .where(eq(adminStaffPermissions.userId, userId));
  }

  async upsertAdminStaffPermissions(
    userId: string, 
    adminId: string, 
    permissions: { module: string; canRead: boolean; canCreate: boolean; canUpdate: boolean; canDelete: boolean }[]
  ): Promise<AdminStaffPermission[]> {
    const results: AdminStaffPermission[] = [];
    
    for (const perm of permissions) {
      const existing = await this.getAdminStaffPermissionForModule(userId, perm.module);
      
      if (existing) {
        const updated = await this.updateAdminStaffPermission(existing.id, {
          canRead: perm.canRead,
          canCreate: perm.canCreate,
          canUpdate: perm.canUpdate,
          canDelete: perm.canDelete
        });
        results.push(updated);
      } else {
        const created = await db.insert(adminStaffPermissions)
          .values({
            userId,
            adminId,
            module: perm.module as any,
            canRead: perm.canRead,
            canCreate: perm.canCreate,
            canUpdate: perm.canUpdate,
            canDelete: perm.canDelete
          })
          .returning();
        results.push(created[0]);
      }
    }
    
    return results;
  }

  async checkAdminStaffPermission(userId: string, module: string, action: 'read' | 'create' | 'update' | 'delete'): Promise<boolean> {
    const permission = await this.getAdminStaffPermissionForModule(userId, module);
    if (!permission) return false;
    
    switch (action) {
      case 'read': return permission.canRead;
      case 'create': return permission.canCreate;
      case 'update': return permission.canUpdate;
      case 'delete': return permission.canDelete;
      default: return false;
    }
  }

  // ==========================================
  // E-COMMERCE: CUSTOMER ADDRESSES
  // ==========================================

  async listCustomerAddresses(customerId: string): Promise<CustomerAddress[]> {
    return await db.select()
      .from(customerAddresses)
      .where(eq(customerAddresses.customerId, customerId))
      .orderBy(desc(customerAddresses.isDefault), desc(customerAddresses.createdAt));
  }

  async getCustomerAddress(id: string): Promise<CustomerAddress | undefined> {
    const [address] = await db.select()
      .from(customerAddresses)
      .where(eq(customerAddresses.id, id));
    return address;
  }

  async createCustomerAddress(address: InsertCustomerAddress): Promise<CustomerAddress> {
    const [created] = await db.insert(customerAddresses)
      .values(address)
      .returning();
    return created;
  }

  async updateCustomerAddress(id: string, updates: Partial<InsertCustomerAddress>): Promise<CustomerAddress> {
    const [updated] = await db.update(customerAddresses)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(customerAddresses.id, id))
      .returning();
    if (!updated) throw new Error("Customer address not found");
    return updated;
  }

  async deleteCustomerAddress(id: string): Promise<void> {
    await db.delete(customerAddresses)
      .where(eq(customerAddresses.id, id));
  }

  async setDefaultAddress(customerId: string, addressId: string, isBilling: boolean = false): Promise<void> {
    if (isBilling) {
      await db.update(customerAddresses)
        .set({ isBilling: false })
        .where(eq(customerAddresses.customerId, customerId));
      await db.update(customerAddresses)
        .set({ isBilling: true })
        .where(eq(customerAddresses.id, addressId));
    } else {
      await db.update(customerAddresses)
        .set({ isDefault: false })
        .where(eq(customerAddresses.customerId, customerId));
      await db.update(customerAddresses)
        .set({ isDefault: true })
        .where(eq(customerAddresses.id, addressId));
    }
  }

  // ==========================================
  // E-COMMERCE: SHOPPING CART
  // ==========================================

  async getActiveCart(customerId: string | null, sessionId: string | null, resellerId: string): Promise<Cart | undefined> {
    const conditions = [
      eq(carts.resellerId, resellerId),
      eq(carts.status, 'active')
    ];
    
    if (customerId) {
      conditions.push(eq(carts.customerId, customerId));
    } else if (sessionId) {
      conditions.push(eq(carts.sessionId, sessionId));
    } else {
      return undefined;
    }
    
    const [cart] = await db.select()
      .from(carts)
      .where(and(...conditions))
      .limit(1);
    return cart;
  }

  async getCart(id: string): Promise<Cart | undefined> {
    const [cart] = await db.select()
      .from(carts)
      .where(eq(carts.id, id));
    return cart;
  }

  async createCart(cart: InsertCart): Promise<Cart> {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    const [created] = await db.insert(carts)
      .values({ ...cart, expiresAt })
      .returning();
    return created;
  }

  async updateCart(id: string, updates: Partial<InsertCart>): Promise<Cart> {
    const [updated] = await db.update(carts)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(carts.id, id))
      .returning();
    if (!updated) throw new Error("Cart not found");
    return updated;
  }

  async deleteCart(id: string): Promise<void> {
    await db.delete(cartItems).where(eq(cartItems.cartId, id));
    await db.delete(carts).where(eq(carts.id, id));
  }

  async clearExpiredCarts(): Promise<number> {
    const result = await db.delete(carts)
      .where(and(
        lt(carts.expiresAt, new Date()),
        eq(carts.status, 'active')
      ))
      .returning();
    return result.length;
  }

  // ==========================================
  // E-COMMERCE: CART ITEMS
  // ==========================================

  async listCartItems(cartId: string): Promise<CartItem[]> {
    return await db.select()
      .from(cartItems)
      .where(eq(cartItems.cartId, cartId))
      .orderBy(desc(cartItems.createdAt));
  }

  async getCartItem(id: string): Promise<CartItem | undefined> {
    const [item] = await db.select()
      .from(cartItems)
      .where(eq(cartItems.id, id));
    return item;
  }

  async getCartItemByProduct(cartId: string, productId: string): Promise<CartItem | undefined> {
    const [item] = await db.select()
      .from(cartItems)
      .where(and(
        eq(cartItems.cartId, cartId),
        eq(cartItems.productId, productId)
      ));
    return item;
  }

  async addCartItem(item: InsertCartItem): Promise<CartItem> {
    const [created] = await db.insert(cartItems)
      .values(item)
      .returning();
    await this.recalculateCartTotals(item.cartId);
    return created;
  }

  async updateCartItem(id: string, updates: Partial<Pick<CartItem, 'quantity' | 'unitPrice' | 'totalPrice' | 'discount'>>): Promise<CartItem> {
    const [item] = await db.select().from(cartItems).where(eq(cartItems.id, id));
    if (!item) throw new Error("Cart item not found");
    
    const newQuantity = updates.quantity ?? item.quantity;
    const newUnitPrice = updates.unitPrice ?? item.unitPrice;
    const newDiscount = updates.discount ?? item.discount;
    const newTotalPrice = (newQuantity * newUnitPrice) - newDiscount;
    
    const [updated] = await db.update(cartItems)
      .set({ 
        ...updates, 
        totalPrice: newTotalPrice,
        updatedAt: new Date() 
      })
      .where(eq(cartItems.id, id))
      .returning();
    
    await this.recalculateCartTotals(item.cartId);
    return updated;
  }

  async removeCartItem(id: string): Promise<void> {
    const [item] = await db.select().from(cartItems).where(eq(cartItems.id, id));
    if (item) {
      await db.delete(cartItems).where(eq(cartItems.id, id));
      await this.recalculateCartTotals(item.cartId);
    }
  }

  async clearCart(cartId: string): Promise<void> {
    await db.delete(cartItems).where(eq(cartItems.cartId, cartId));
    await this.updateCart(cartId, { subtotal: 0, discount: 0, total: 0 });
  }

  async recalculateCartTotals(cartId: string): Promise<Cart> {
    const items = await this.listCartItems(cartId);
    const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
    const discount = items.reduce((sum, item) => sum + item.discount, 0);
    
    const cart = await this.getCart(cartId);
    const shippingCost = cart?.shippingCost ?? 0;
    const total = subtotal - discount + shippingCost;
    
    return await this.updateCart(cartId, { subtotal, discount, total });
  }

  // ==========================================
  // E-COMMERCE: SALES ORDERS
  // ==========================================

  async listSalesOrders(filters?: { resellerId?: string; customerId?: string; status?: string; branchId?: string }): Promise<SalesOrder[]> {
    const conditions = [];
    if (filters?.resellerId) conditions.push(eq(salesOrders.resellerId, filters.resellerId));
    if (filters?.customerId) conditions.push(eq(salesOrders.customerId, filters.customerId));
    if (filters?.status) conditions.push(sql`${salesOrders.status} = ${filters.status}`);
    if (filters?.branchId) conditions.push(eq(salesOrders.branchId, filters.branchId));
    
    return await db.select()
      .from(salesOrders)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(salesOrders.createdAt));
  }

  async getSalesOrder(id: string): Promise<SalesOrder | undefined> {
    const [order] = await db.select()
      .from(salesOrders)
      .where(eq(salesOrders.id, id));
    return order;
  }

  async getSalesOrderByNumber(orderNumber: string): Promise<SalesOrder | undefined> {
    const [order] = await db.select()
      .from(salesOrders)
      .where(eq(salesOrders.orderNumber, orderNumber));
    return order;
  }

  async createSalesOrder(order: InsertSalesOrder): Promise<SalesOrder> {
    const [created] = await db.insert(salesOrders)
      .values(order)
      .returning();
    
    await this.createSalesOrderStateHistory({
      orderId: created.id,
      fromStatus: null,
      toStatus: created.status
    });
    
    return created;
  }

  async updateSalesOrder(id: string, updates: Partial<InsertSalesOrder>): Promise<SalesOrder> {
    const [updated] = await db.update(salesOrders)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(salesOrders.id, id))
      .returning();
    if (!updated) throw new Error("Sales order not found");
    return updated;
  }

  async updateSalesOrderStatus(id: string, status: string, changedBy?: string, reason?: string): Promise<SalesOrder> {
    const currentOrder = await this.getSalesOrder(id);
    if (!currentOrder) throw new Error("Sales order not found");
    
    const statusUpdates: Partial<InsertSalesOrder> = { status: status as any };
    
    if (status === 'confirmed') statusUpdates.confirmedAt = new Date();
    if (status === 'shipped') statusUpdates.shippedAt = new Date();
    if (status === 'delivered') statusUpdates.deliveredAt = new Date();
    if (status === 'cancelled') {
      statusUpdates.cancelledAt = new Date();
      if (reason) statusUpdates.cancellationReason = reason;
    }
    
    const updated = await this.updateSalesOrder(id, statusUpdates);
    
    await this.createSalesOrderStateHistory({
      orderId: id,
      fromStatus: currentOrder.status,
      toStatus: status,
      changedBy,
      reason
    });
    
    return updated;
  }

  async generateOrderNumber(resellerId: string): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `ORD-${year}`;
    
    const [result] = await db.select({ count: sql<number>`count(*)` })
      .from(salesOrders)
      .where(and(
        eq(salesOrders.resellerId, resellerId),
        sql`${salesOrders.orderNumber} LIKE ${prefix + '%'}`
      ));
    
    const nextNumber = (result?.count ?? 0) + 1;
    return `${prefix}-${nextNumber.toString().padStart(6, '0')}`;
  }

  // ==========================================
  // E-COMMERCE: SALES ORDER ITEMS
  // ==========================================

  async listSalesOrderItems(orderId: string): Promise<SalesOrderItem[]> {
    return await db.select()
      .from(salesOrderItems)
      .where(eq(salesOrderItems.orderId, orderId));
  }

  async getSalesOrderItem(id: string): Promise<SalesOrderItem | undefined> {
    const [item] = await db.select()
      .from(salesOrderItems)
      .where(eq(salesOrderItems.id, id));
    return item;
  }

  async createSalesOrderItem(item: InsertSalesOrderItem): Promise<SalesOrderItem> {
    const [created] = await db.insert(salesOrderItems)
      .values(item)
      .returning();
    return created;
  }

  async updateSalesOrderItem(id: string, updates: Partial<InsertSalesOrderItem>): Promise<SalesOrderItem> {
    const [updated] = await db.update(salesOrderItems)
      .set(updates)
      .where(eq(salesOrderItems.id, id))
      .returning();
    if (!updated) throw new Error("Sales order item not found");
    return updated;
  }

  async deleteSalesOrderItem(id: string): Promise<void> {
    await db.delete(salesOrderItems)
      .where(eq(salesOrderItems.id, id));
  }

  // ==========================================
  // E-COMMERCE: SALES ORDER PAYMENTS
  // ==========================================

  async listSalesOrderPayments(orderId: string): Promise<SalesOrderPayment[]> {
    return await db.select()
      .from(salesOrderPayments)
      .where(eq(salesOrderPayments.orderId, orderId))
      .orderBy(desc(salesOrderPayments.createdAt));
  }

  async listAllPayments(filters?: { status?: string; method?: string; orderType?: string }): Promise<SalesOrderPayment[]> {
    const conditions = [];
    if (filters?.status) {
      conditions.push(eq(salesOrderPayments.status, filters.status as any));
    }
    if (filters?.method) {
      conditions.push(eq(salesOrderPayments.method, filters.method as any));
    }
    if (filters?.orderType) {
      conditions.push(eq(salesOrderPayments.orderType, filters.orderType as any));
    }
    
    if (conditions.length === 0) {
      return await db.select()
        .from(salesOrderPayments)
        .orderBy(desc(salesOrderPayments.createdAt));
    }
    
    return await db.select()
      .from(salesOrderPayments)
      .where(and(...conditions))
      .orderBy(desc(salesOrderPayments.createdAt));
  }

  async getSalesOrderPayment(id: string): Promise<SalesOrderPayment | undefined> {
    const [payment] = await db.select()
      .from(salesOrderPayments)
      .where(eq(salesOrderPayments.id, id));
    return payment;
  }
  
  async getPaymentByOrderId(orderId: string, orderType?: string): Promise<SalesOrderPayment | undefined> {
    const conditions = [eq(salesOrderPayments.orderId, orderId)];
    if (orderType) {
      conditions.push(eq(salesOrderPayments.orderType, orderType as any));
    }
    const [payment] = await db.select()
      .from(salesOrderPayments)
      .where(and(...conditions));
    return payment;
  }

  async createSalesOrderPayment(payment: InsertSalesOrderPayment): Promise<SalesOrderPayment> {
    const [created] = await db.insert(salesOrderPayments)
      .values(payment)
      .returning();
    return created;
  }

  async updateSalesOrderPayment(id: string, updates: Partial<InsertSalesOrderPayment>): Promise<SalesOrderPayment> {
    const [updated] = await db.update(salesOrderPayments)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(salesOrderPayments.id, id))
      .returning();
    if (!updated) throw new Error("Sales order payment not found");
    return updated;
  }

  // ==========================================
  // E-COMMERCE: SALES ORDER SHIPMENTS
  // ==========================================

  async listSalesOrderShipments(orderId: string): Promise<SalesOrderShipment[]> {
    return await db.select()
      .from(salesOrderShipments)
      .where(eq(salesOrderShipments.orderId, orderId))
      .orderBy(desc(salesOrderShipments.createdAt));
  }

  async getSalesOrderShipment(id: string): Promise<SalesOrderShipment | undefined> {
    const [shipment] = await db.select()
      .from(salesOrderShipments)
      .where(eq(salesOrderShipments.id, id));
    return shipment;
  }

  async createSalesOrderShipment(shipment: InsertSalesOrderShipment): Promise<SalesOrderShipment> {
    const [created] = await db.insert(salesOrderShipments)
      .values(shipment)
      .returning();
    return created;
  }

  async updateSalesOrderShipment(id: string, updates: Partial<InsertSalesOrderShipment>): Promise<SalesOrderShipment> {
    const [updated] = await db.update(salesOrderShipments)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(salesOrderShipments.id, id))
      .returning();
    if (!updated) throw new Error("Sales order shipment not found");
    return updated;
  }

  // ==========================================
  // E-COMMERCE: SHIPMENT TRACKING
  // ==========================================

  async listShipmentTrackingEvents(shipmentId: string): Promise<ShipmentTrackingEvent[]> {
    return await db.select()
      .from(shipmentTrackingEvents)
      .where(eq(shipmentTrackingEvents.shipmentId, shipmentId))
      .orderBy(desc(shipmentTrackingEvents.eventAt));
  }

  async createShipmentTrackingEvent(event: InsertShipmentTrackingEvent): Promise<ShipmentTrackingEvent> {
    const [created] = await db.insert(shipmentTrackingEvents)
      .values(event)
      .returning();
    return created;
  }

  // ==========================================
  // E-COMMERCE: STOCK RESERVATIONS
  // ==========================================

  async listStockReservations(orderId: string): Promise<StockReservation[]> {
    return await db.select()
      .from(stockReservations)
      .where(eq(stockReservations.orderId, orderId));
  }

  async createStockReservation(reservation: InsertStockReservation): Promise<StockReservation> {
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 30);
    
    const [created] = await db.insert(stockReservations)
      .values({ ...reservation, expiresAt })
      .returning();
    return created;
  }

  async updateStockReservation(id: string, updates: Partial<InsertStockReservation>): Promise<StockReservation> {
    const [updated] = await db.update(stockReservations)
      .set(updates)
      .where(eq(stockReservations.id, id))
      .returning();
    if (!updated) throw new Error("Stock reservation not found");
    return updated;
  }

  async releaseStockReservation(id: string): Promise<void> {
    await db.update(stockReservations)
      .set({ status: 'released', releasedAt: new Date() })
      .where(eq(stockReservations.id, id));
  }

  async commitStockReservation(id: string): Promise<void> {
    await db.update(stockReservations)
      .set({ status: 'committed', committedAt: new Date() })
      .where(eq(stockReservations.id, id));
  }

  // ==========================================
  // E-COMMERCE: ORDER STATE HISTORY
  // ==========================================

  async listSalesOrderStateHistory(orderId: string): Promise<SalesOrderStateHistoryEntry[]> {
    return await db.select()
      .from(salesOrderStateHistory)
      .where(eq(salesOrderStateHistory.orderId, orderId))
      .orderBy(desc(salesOrderStateHistory.createdAt));
  }

  async createSalesOrderStateHistory(entry: InsertSalesOrderStateHistoryEntry): Promise<SalesOrderStateHistoryEntry> {
    const [created] = await db.insert(salesOrderStateHistory)
      .values(entry)
      .returning();
    return created;
  }

  // E-commerce: Sales Order Returns
  async listSalesOrderReturns(filters?: { status?: string; resellerId?: string; customerId?: string; orderId?: string }): Promise<SalesOrderReturn[]> {
    const conditions = [];
    if (filters?.status) conditions.push(eq(salesOrderReturns.status, filters.status as any));
    if (filters?.resellerId) conditions.push(eq(salesOrderReturns.resellerId, filters.resellerId));
    if (filters?.customerId) conditions.push(eq(salesOrderReturns.customerId, filters.customerId));
    if (filters?.orderId) conditions.push(eq(salesOrderReturns.orderId, filters.orderId));
    
    if (conditions.length === 0) {
      return await db.select().from(salesOrderReturns).orderBy(desc(salesOrderReturns.createdAt));
    }
    return await db.select().from(salesOrderReturns)
      .where(and(...conditions))
      .orderBy(desc(salesOrderReturns.createdAt));
  }

  async getSalesOrderReturn(id: string): Promise<SalesOrderReturn | undefined> {
    const [ret] = await db.select().from(salesOrderReturns).where(eq(salesOrderReturns.id, id));
    return ret || undefined;
  }

  async getSalesOrderReturnByNumber(returnNumber: string): Promise<SalesOrderReturn | undefined> {
    const [ret] = await db.select().from(salesOrderReturns).where(eq(salesOrderReturns.returnNumber, returnNumber));
    return ret || undefined;
  }

  async createSalesOrderReturn(data: InsertSalesOrderReturn): Promise<SalesOrderReturn> {
    const [created] = await db.insert(salesOrderReturns)
      .values(data)
      .returning();
    return created;
  }

  async updateSalesOrderReturn(id: string, updates: Partial<InsertSalesOrderReturn>): Promise<SalesOrderReturn> {
    const [updated] = await db.update(salesOrderReturns)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(salesOrderReturns.id, id))
      .returning();
    if (!updated) throw new Error("Sales order return not found");
    return updated;
  }

  async generateReturnNumber(resellerId: string): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `RES-${year}`;
    
    const [result] = await db.select({ count: sql<number>`count(*)` })
      .from(salesOrderReturns)
      .where(sql`${salesOrderReturns.returnNumber} LIKE ${prefix + '%'}`);
    
    const nextNumber = (result?.count || 0) + 1;
    return `${prefix}-${String(nextNumber).padStart(5, '0')}`;
  }

  // E-commerce: Sales Order Return Items
  async listSalesOrderReturnItems(returnId: string): Promise<SalesOrderReturnItem[]> {
    return await db.select().from(salesOrderReturnItems)
      .where(eq(salesOrderReturnItems.returnId, returnId));
  }

  async getSalesOrderReturnItem(id: string): Promise<SalesOrderReturnItem | undefined> {
    const [item] = await db.select().from(salesOrderReturnItems).where(eq(salesOrderReturnItems.id, id));
    return item || undefined;
  }

  async createSalesOrderReturnItem(item: InsertSalesOrderReturnItem): Promise<SalesOrderReturnItem> {
    const [created] = await db.insert(salesOrderReturnItems)
      .values(item)
      .returning();
    return created;
  }

  async updateSalesOrderReturnItem(id: string, updates: Partial<InsertSalesOrderReturnItem>): Promise<SalesOrderReturnItem> {
    const [updated] = await db.update(salesOrderReturnItems)
      .set(updates)
      .where(eq(salesOrderReturnItems.id, id))
      .returning();
    if (!updated) throw new Error("Return item not found");
    return updated;
  }

  async deleteSalesOrderReturnItem(id: string): Promise<void> {
    await db.delete(salesOrderReturnItems).where(eq(salesOrderReturnItems.id, id));
  }

  // ==========================================
  // WAREHOUSE MANAGEMENT
  // ==========================================

  async listWarehouses(filters?: { ownerType?: string; ownerId?: string; isActive?: boolean }): Promise<Warehouse[]> {
    const conditions = [];
    if (filters?.ownerType) conditions.push(eq(warehouses.ownerType, filters.ownerType as any));
    if (filters?.ownerId) conditions.push(eq(warehouses.ownerId, filters.ownerId));
    if (filters?.isActive !== undefined) conditions.push(eq(warehouses.isActive, filters.isActive));
    
    if (conditions.length === 0) {
      return await db.select().from(warehouses).orderBy(desc(warehouses.createdAt));
    }
    return await db.select().from(warehouses)
      .where(and(...conditions))
      .orderBy(desc(warehouses.createdAt));
  }

  async getWarehouse(id: string): Promise<Warehouse | undefined> {
    const [warehouse] = await db.select().from(warehouses).where(eq(warehouses.id, id));
    return warehouse || undefined;
  }

  async getWarehouseByOwner(ownerType: string, ownerId: string): Promise<Warehouse | undefined> {
    const [warehouse] = await db.select().from(warehouses)
      .where(and(
        eq(warehouses.ownerType, ownerType as any),
        eq(warehouses.ownerId, ownerId)
      ));
    return warehouse || undefined;
  }

  async createWarehouse(data: InsertWarehouse): Promise<Warehouse> {
    const [created] = await db.insert(warehouses).values(data).returning();
    return created;
  }

  async updateWarehouse(id: string, updates: Partial<InsertWarehouse>): Promise<Warehouse> {
    const [updated] = await db.update(warehouses)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(warehouses.id, id))
      .returning();
    if (!updated) throw new Error("Warehouse not found");
    return updated;
  }

  async deleteWarehouse(id: string): Promise<void> {
    await db.delete(warehouses).where(eq(warehouses.id, id));
  }

  async ensureDefaultWarehouse(ownerType: string, ownerId: string, ownerName: string): Promise<Warehouse> {
    const existing = await this.getWarehouseByOwner(ownerType, ownerId);
    if (existing) return existing;
    
    const name = `Magazzino ${ownerName}`;
    return await this.createWarehouse({
      ownerType: ownerType as any,
      ownerId,
      name,
      isActive: true,
    });
  }

  // Warehouse Stock
  async listWarehouseStock(warehouseId: string): Promise<WarehouseStock[]> {
    return await db.select().from(warehouseStock)
      .where(eq(warehouseStock.warehouseId, warehouseId));
  }

  async getWarehouseStockItem(warehouseId: string, productId: string): Promise<WarehouseStock | undefined> {
    const [item] = await db.select().from(warehouseStock)
      .where(and(
        eq(warehouseStock.warehouseId, warehouseId),
        eq(warehouseStock.productId, productId)
      ));
    return item || undefined;
  }

  async getProductWarehouseStocks(productId: string): Promise<Array<WarehouseStock & { warehouse: Warehouse }>> {
    // Get all stock entries for this product
    const stockEntries = await db.select().from(warehouseStock)
      .where(eq(warehouseStock.productId, productId));
    
    // Fetch warehouse details for each stock entry
    const result: Array<WarehouseStock & { warehouse: Warehouse }> = [];
    for (const stock of stockEntries) {
      const [warehouse] = await db.select().from(warehouses)
        .where(eq(warehouses.id, stock.warehouseId));
      if (warehouse) {
        result.push({
          ...stock,
          warehouse,
        });
      }
    }
    
    return result;
  }

  async upsertWarehouseStock(data: InsertWarehouseStock): Promise<WarehouseStock> {
    const existing = await this.getWarehouseStockItem(data.warehouseId, data.productId);
    if (existing) {
      const [updated] = await db.update(warehouseStock)
        .set({ 
          quantity: data.quantity ?? existing.quantity,
          minStock: data.minStock ?? existing.minStock,
          location: data.location ?? existing.location,
          updatedAt: new Date() 
        })
        .where(eq(warehouseStock.id, existing.id))
        .returning();
      return updated;
    }
    const [created] = await db.insert(warehouseStock).values(data).returning();
    return created;
  }

  async updateWarehouseStock(id: string, updates: { minStock?: number | null; location?: string | null }): Promise<WarehouseStock> {
    const [updated] = await db.update(warehouseStock)
      .set({ 
        minStock: updates.minStock,
        location: updates.location,
        updatedAt: new Date() 
      })
      .where(eq(warehouseStock.id, id))
      .returning();
    return updated;
  }

  async updateWarehouseStockQuantity(warehouseId: string, productId: string, quantityDelta: number, location?: string | null): Promise<WarehouseStock> {
    const existing = await this.getWarehouseStockItem(warehouseId, productId);
    if (!existing) {
      // Create new stock entry with optional location
      const [created] = await db.insert(warehouseStock)
        .values({ warehouseId, productId, quantity: quantityDelta, location: location ?? null })
        .returning();
      return created;
    }
    const updateData: { quantity: number; updatedAt: Date; location?: string | null } = { 
      quantity: existing.quantity + quantityDelta,
      updatedAt: new Date() 
    };
    // Only update location if explicitly provided
    if (location !== undefined) {
      updateData.location = location;
    }
    const [updated] = await db.update(warehouseStock)
      .set(updateData)
      .where(eq(warehouseStock.id, existing.id))
      .returning();
    return updated;
  }

  async listWarehouseProductsWithStock(warehouseId: string, search?: string, productType?: string): Promise<Array<Product & { availableQuantity: number }>> {
    const conditions = [
      eq(warehouseStock.warehouseId, warehouseId),
      sql`${warehouseStock.quantity} > 0`,
      eq(products.isActive, true)
    ];
    
    if (productType) {
      conditions.push(eq(products.productType, productType as any));
    }
    
    const stockItems = await db.select()
      .from(warehouseStock)
      .innerJoin(products, eq(warehouseStock.productId, products.id))
      .where(and(...conditions));
    
    let result = stockItems.map(item => ({
      ...item.products,
      availableQuantity: item.warehouse_stock.quantity,
    }));
    
    if (search && search.trim()) {
      const searchLower = search.toLowerCase().trim();
      result = result.filter(p =>
        p.name.toLowerCase().includes(searchLower) ||
        p.sku.toLowerCase().includes(searchLower) ||
        (p.brand && p.brand.toLowerCase().includes(searchLower))
      );
    }
    
    return result;
  }

  async listAccessibleWarehouses(resellerId: string): Promise<Warehouse[]> {
    const result: Warehouse[] = [];
    
    // 1. Magazzino del reseller stesso
    const resellerWarehouse = await this.getWarehouseByOwner('reseller', resellerId);
    if (resellerWarehouse) result.push(resellerWarehouse);
    
    // 2. Magazzini dei sub-reseller del reseller
    const subResellers = await db.select().from(users)
      .where(and(
        eq(users.role, 'reseller'),
        eq(users.resellerId, resellerId)
      ));
    for (const subReseller of subResellers) {
      const subWarehouse = await this.getWarehouseByOwner('sub_reseller', subReseller.id);
      if (subWarehouse) result.push(subWarehouse);
    }
    
    // 3. Magazzini dei repair center del reseller
    const centers = await db.select().from(repairCenters)
      .where(eq(repairCenters.resellerId, resellerId));
    for (const rc of centers) {
      const rcWarehouse = await this.getWarehouseByOwner('repair_center', rc.id);
      if (rcWarehouse) result.push(rcWarehouse);
    }
    
    return result;
  }

  async searchProductsWithStock(filters: {
    query?: string;
    productType?: string;
    warehouseIds: string[];
  }): Promise<Array<{
    product: Product;
    productType: string;
    warehouses: Array<{
      warehouseId: string;
      warehouseName: string;
      ownerType: string;
      ownerId: string;
      ownerName: string;
      quantity: number;
    }>;
  }>> {
    if (filters.warehouseIds.length === 0) return [];

    const conditions = [eq(products.isActive, true)];
    
    if (filters.query) {
      const searchTerm = `%${filters.query.toLowerCase()}%`;
      conditions.push(
        or(
          sql`LOWER(${products.name}) LIKE ${searchTerm}`,
          sql`LOWER(${products.sku}) LIKE ${searchTerm}`,
          sql`LOWER(${products.brand}) LIKE ${searchTerm}`
        ) as any
      );
    }
    
    if (filters.productType) {
      conditions.push(eq(products.productType, filters.productType as any));
    }

    const matchingProducts = await db.select().from(products)
      .where(and(...conditions))
      .limit(50);

    if (matchingProducts.length === 0) return [];

    const productIds = matchingProducts.map(p => p.id);
    
    const stockEntries = await db.select({
      productId: warehouseStock.productId,
      warehouseId: warehouseStock.warehouseId,
      quantity: warehouseStock.quantity,
      warehouseName: warehouses.name,
      ownerType: warehouses.ownerType,
      ownerId: warehouses.ownerId,
    })
    .from(warehouseStock)
    .innerJoin(warehouses, eq(warehouseStock.warehouseId, warehouses.id))
    .where(and(
      inArray(warehouseStock.productId, productIds),
      inArray(warehouseStock.warehouseId, filters.warehouseIds),
      gt(warehouseStock.quantity, 0)
    ));

    const ownerIds = [...new Set(stockEntries.map(s => s.ownerId))];
    const ownerNames: Record<string, string> = {};
    
    for (const entry of stockEntries) {
      if (ownerNames[entry.ownerId]) continue;
      
      if (entry.ownerType === 'admin') {
        ownerNames[entry.ownerId] = 'Admin';
      } else if (entry.ownerType === 'reseller' || entry.ownerType === 'sub_reseller') {
        const user = await this.getUser(entry.ownerId);
        ownerNames[entry.ownerId] = user?.ragioneSociale || user?.username || 'Sconosciuto';
      } else if (entry.ownerType === 'repair_center') {
        const rc = await this.getRepairCenter(entry.ownerId);
        ownerNames[entry.ownerId] = rc?.name || 'Sconosciuto';
      }
    }

    const result: Array<{
      product: Product;
      productType: string;
      warehouses: Array<{
        warehouseId: string;
        warehouseName: string;
        ownerType: string;
        ownerId: string;
        ownerName: string;
        quantity: number;
      }>;
    }> = [];

    for (const product of matchingProducts) {
      const productStocks = stockEntries.filter(s => s.productId === product.id);
      if (productStocks.length === 0) continue;
      
      result.push({
        product,
        productType: product.productType,
        warehouses: productStocks.map(s => ({
          warehouseId: s.warehouseId,
          warehouseName: s.warehouseName,
          ownerType: s.ownerType,
          ownerId: s.ownerId,
          ownerName: ownerNames[s.ownerId] || 'Sconosciuto',
          quantity: s.quantity,
        })),
      });
    }

    return result;
  }

  // Warehouse Movements
  async listWarehouseMovements(filters?: { warehouseId?: string; productId?: string }): Promise<WarehouseMovement[]> {
    const conditions = [];
    if (filters?.warehouseId) conditions.push(eq(warehouseMovements.warehouseId, filters.warehouseId));
    if (filters?.productId) conditions.push(eq(warehouseMovements.productId, filters.productId));
    
    if (conditions.length === 0) {
      return await db.select().from(warehouseMovements).orderBy(desc(warehouseMovements.createdAt));
    }
    return await db.select().from(warehouseMovements)
      .where(and(...conditions))
      .orderBy(desc(warehouseMovements.createdAt));
  }

  async createWarehouseMovement(data: InsertWarehouseMovement): Promise<WarehouseMovement> {
    const [created] = await db.insert(warehouseMovements).values(data).returning();
    return created;
  }

  // Warehouse Transfers
  async listWarehouseTransfers(filters?: { sourceWarehouseId?: string; destinationWarehouseId?: string; status?: string }): Promise<WarehouseTransfer[]> {
    const conditions = [];
    if (filters?.sourceWarehouseId) conditions.push(eq(warehouseTransfers.sourceWarehouseId, filters.sourceWarehouseId));
    if (filters?.destinationWarehouseId) conditions.push(eq(warehouseTransfers.destinationWarehouseId, filters.destinationWarehouseId));
    if (filters?.status) conditions.push(eq(warehouseTransfers.status, filters.status as any));
    
    if (conditions.length === 0) {
      return await db.select().from(warehouseTransfers).orderBy(desc(warehouseTransfers.createdAt));
    }
    return await db.select().from(warehouseTransfers)
      .where(and(...conditions))
      .orderBy(desc(warehouseTransfers.createdAt));
  }

  async getWarehouseTransfer(id: string): Promise<WarehouseTransfer | undefined> {
    const [transfer] = await db.select().from(warehouseTransfers).where(eq(warehouseTransfers.id, id));
    return transfer || undefined;
  }

  async createWarehouseTransfer(data: InsertWarehouseTransfer): Promise<WarehouseTransfer> {
    const transferNumber = await this.generateTransferNumber();
    const [created] = await db.insert(warehouseTransfers)
      .values({ ...data, transferNumber })
      .returning();
    return created;
  }

  async updateWarehouseTransfer(id: string, updates: Partial<WarehouseTransfer>): Promise<WarehouseTransfer> {
    const [updated] = await db.update(warehouseTransfers)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(warehouseTransfers.id, id))
      .returning();
    if (!updated) throw new Error("Warehouse transfer not found");
    return updated;
  }

  async generateTransferNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `TRF-${year}`;
    
    const [result] = await db.select({ count: sql<number>`count(*)` })
      .from(warehouseTransfers)
      .where(sql`${warehouseTransfers.transferNumber} LIKE ${prefix + '%'}`);
    
    const nextNumber = (result?.count || 0) + 1;
    return `${prefix}-${String(nextNumber).padStart(5, '0')}`;
  }

  // Warehouse Transfer Items
  async listWarehouseTransferItems(transferId: string): Promise<WarehouseTransferItem[]> {
    return await db.select().from(warehouseTransferItems)
      .where(eq(warehouseTransferItems.transferId, transferId));
  }

  async createWarehouseTransferItem(data: InsertWarehouseTransferItem): Promise<WarehouseTransferItem> {
    const [created] = await db.insert(warehouseTransferItems).values(data).returning();
    return created;
  }

  async updateWarehouseTransferItem(id: string, updates: Partial<WarehouseTransferItem>): Promise<WarehouseTransferItem> {
    const [updated] = await db.update(warehouseTransferItems)
      .set(updates)
      .where(eq(warehouseTransferItems.id, id))
      .returning();
    if (!updated) throw new Error("Transfer item not found");
    return updated;
  }

  // ==========================================
  // TRANSFER REQUESTS (da repair_center/sub_reseller)
  // ==========================================

  async listTransferRequests(filters?: { 
    requesterId?: string; 
    requesterType?: string; 
    targetResellerId?: string; 
    status?: string;
    sourceWarehouseId?: string;
  }): Promise<TransferRequest[]> {
    const conditions = [];
    if (filters?.requesterId) conditions.push(eq(transferRequests.requesterId, filters.requesterId));
    if (filters?.requesterType) conditions.push(eq(transferRequests.requesterType, filters.requesterType as any));
    if (filters?.targetResellerId) conditions.push(eq(transferRequests.targetResellerId, filters.targetResellerId));
    if (filters?.status) conditions.push(eq(transferRequests.status, filters.status as any));
    if (filters?.sourceWarehouseId) conditions.push(eq(transferRequests.sourceWarehouseId, filters.sourceWarehouseId));
    
    if (conditions.length === 0) {
      return await db.select().from(transferRequests).orderBy(desc(transferRequests.createdAt));
    }
    return await db.select().from(transferRequests)
      .where(and(...conditions))
      .orderBy(desc(transferRequests.createdAt));
  }

  async getTransferRequest(id: string): Promise<TransferRequest | undefined> {
    const [request] = await db.select().from(transferRequests).where(eq(transferRequests.id, id));
    return request || undefined;
  }

  async countIncomingTransferRequests(targetResellerId: string, status?: string): Promise<number> {
    const conditions = [eq(transferRequests.targetResellerId, targetResellerId)];
    if (status) {
      conditions.push(eq(transferRequests.status, status as any));
    }
    const [result] = await db.select({ count: sql<number>`count(*)` })
      .from(transferRequests)
      .where(and(...conditions));
    return result?.count || 0;
  }

  async createTransferRequest(data: InsertTransferRequest): Promise<TransferRequest> {
    const requestNumber = await this.generateTransferRequestNumber();
    const [created] = await db.insert(transferRequests)
      .values({ ...data, requestNumber })
      .returning();
    return created;
  }

  async updateTransferRequest(id: string, updates: Partial<TransferRequest>): Promise<TransferRequest> {
    const [updated] = await db.update(transferRequests)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(transferRequests.id, id))
      .returning();
    if (!updated) throw new Error("Transfer request not found");
    return updated;
  }

  async generateTransferRequestNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `REQ-${year}`;
    
    const [result] = await db.select({ count: sql<number>`count(*)` })
      .from(transferRequests)
      .where(sql`${transferRequests.requestNumber} LIKE ${prefix + '%'}`);
    
    const nextNumber = (result?.count || 0) + 1;
    return `${prefix}-${String(nextNumber).padStart(5, '0')}`;
  }

  async generateDdtNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `DDT-${year}`;
    
    const [result] = await db.select({ count: sql<number>`count(*)` })
      .from(transferRequests)
      .where(sql`${transferRequests.ddtNumber} LIKE ${prefix + '%'}`);
    
    const nextNumber = (result?.count || 0) + 1;
    return `${prefix}-${String(nextNumber).padStart(5, '0')}`;
  }

  // Transfer Request Items
  async listTransferRequestItems(requestId: string): Promise<TransferRequestItem[]> {
    return await db.select().from(transferRequestItems)
      .where(eq(transferRequestItems.requestId, requestId));
  }

  async createTransferRequestItem(data: InsertTransferRequestItem): Promise<TransferRequestItem> {
    const [created] = await db.insert(transferRequestItems).values(data).returning();
    return created;
  }

  async updateTransferRequestItem(id: string, updates: Partial<TransferRequestItem>): Promise<TransferRequestItem> {
    const [updated] = await db.update(transferRequestItems)
      .set(updates)
      .where(eq(transferRequestItems.id, id))
      .returning();
    if (!updated) throw new Error("Transfer request item not found");
    return updated;
  }

  // ==========================================
  // B2B RESELLER PURCHASE ORDERS
  // ==========================================

  async listResellerPurchaseOrders(filters?: { resellerId?: string; status?: string }): Promise<ResellerPurchaseOrder[]> {
    const conditions = [];
    if (filters?.resellerId) conditions.push(eq(resellerPurchaseOrders.resellerId, filters.resellerId));
    if (filters?.status) conditions.push(eq(resellerPurchaseOrders.status, filters.status as any));
    
    if (conditions.length === 0) {
      return await db.select().from(resellerPurchaseOrders).orderBy(desc(resellerPurchaseOrders.createdAt));
    }
    return await db.select().from(resellerPurchaseOrders)
      .where(and(...conditions))
      .orderBy(desc(resellerPurchaseOrders.createdAt));
  }

  async getResellerPurchaseOrder(id: string): Promise<ResellerPurchaseOrder | undefined> {
    const [order] = await db.select().from(resellerPurchaseOrders).where(eq(resellerPurchaseOrders.id, id));
    return order || undefined;
  }

  async getResellerPurchaseOrderByNumber(orderNumber: string): Promise<ResellerPurchaseOrder | undefined> {
    const [order] = await db.select().from(resellerPurchaseOrders).where(eq(resellerPurchaseOrders.orderNumber, orderNumber));
    return order || undefined;
  }

  async createResellerPurchaseOrder(data: InsertResellerPurchaseOrder): Promise<ResellerPurchaseOrder> {
    const orderNumber = await this.generateB2BOrderNumber();
    const [created] = await db.insert(resellerPurchaseOrders)
      .values({ ...data, orderNumber })
      .returning();
    return created;
  }

  async updateResellerPurchaseOrder(id: string, updates: Partial<ResellerPurchaseOrder>): Promise<ResellerPurchaseOrder> {
    const [updated] = await db.update(resellerPurchaseOrders)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(resellerPurchaseOrders.id, id))
      .returning();
    if (!updated) throw new Error("B2B order not found");
    return updated;
  }

  async generateB2BOrderNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `B2B-${year}`;
    
    const [result] = await db.select({ count: sql<number>`count(*)` })
      .from(resellerPurchaseOrders)
      .where(sql`${resellerPurchaseOrders.orderNumber} LIKE ${prefix + '%'}`);
    
    const nextNumber = (result?.count || 0) + 1;
    return `${prefix}-${String(nextNumber).padStart(5, '0')}`;
  }

  // B2B Order Items
  async listResellerPurchaseOrderItems(orderId: string): Promise<ResellerPurchaseOrderItem[]> {
    return await db.select().from(resellerPurchaseOrderItems)
      .where(eq(resellerPurchaseOrderItems.orderId, orderId));
  }

  async createResellerPurchaseOrderItem(data: InsertResellerPurchaseOrderItem): Promise<ResellerPurchaseOrderItem> {
    const [created] = await db.insert(resellerPurchaseOrderItems).values(data).returning();
    return created;
  }

  async updateResellerPurchaseOrderItem(id: string, updates: Partial<ResellerPurchaseOrderItem>): Promise<ResellerPurchaseOrderItem> {
    const [updated] = await db.update(resellerPurchaseOrderItems)
      .set(updates)
      .where(eq(resellerPurchaseOrderItems.id, id))
      .returning();
    if (!updated) throw new Error("B2B order item not found");
    return updated;
  }

  async deleteResellerPurchaseOrderItem(id: string): Promise<void> {
    await db.delete(resellerPurchaseOrderItems).where(eq(resellerPurchaseOrderItems.id, id));
  }

  // B2B Catalog - tutti i prodotti con stock nel magazzino centrale admin disponibili per reseller
  async getAdminCatalogForReseller(resellerId: string): Promise<Array<{
    product: Product;
    adminStock: number;
    b2bPrice: number;
    minimumOrderQuantity: number;
  }>> {
    // Get admin warehouse (owner_id is 'system' for the central admin warehouse)
    const adminWarehouse = await this.getWarehouseByOwner('admin', 'system');
    if (!adminWarehouse) return [];
    
    // Get admin warehouse stock with quantity > 0
    const adminStock = await this.listWarehouseStock(adminWarehouse.id);
    const stockWithQuantity = adminStock.filter(s => s.quantity > 0);
    
    // Get all products that have stock in admin warehouse
    const productIds = stockWithQuantity.map(s => s.productId);
    if (productIds.length === 0) return [];
    
    // Fetch all active products that have stock
    const productsWithStock = await db.select().from(products)
      .where(and(
        eq(products.isActive, true),
        inArray(products.id, productIds)
      ));
    
    // Create stock map
    const stockMap = new Map(stockWithQuantity.map(s => [s.productId, s.quantity]));
    
    // Get reseller-specific assignments/prices
    const assignments = await db.select().from(resellerProducts)
      .where(eq(resellerProducts.resellerId, resellerId));
    const assignmentMap = new Map(assignments.map(a => [a.productId, a]));
    
    // Build catalog with available products
    const catalog: Array<{
      product: Product;
      adminStock: number;
      b2bPrice: number;
      minimumOrderQuantity: number;
    }> = [];
    
    for (const product of productsWithStock) {
      const stock = stockMap.get(product.id) || 0;
      
      const assignment = assignmentMap.get(product.id);
      
      // B2B price priority: assignment.b2bPriceCents > product.costPrice > product.unitPrice * 0.7
      const b2bPrice = assignment?.b2bPriceCents 
        ?? product.costPrice 
        ?? Math.round((product.unitPrice || 0) * 0.7);
      
      const minimumOrderQuantity = assignment?.minimumOrderQuantity ?? 1;
      
      catalog.push({
        product,
        adminStock: stock,
        b2bPrice,
        minimumOrderQuantity,
      });
    }
    
    return catalog;
  }

  // ==========================================
  // B2B RETURNS - Resi ordini B2B
  // ==========================================

  async listB2bReturns(filters?: { resellerId?: string; status?: string; orderId?: string }): Promise<B2bReturn[]> {
    const conditions = [];
    if (filters?.resellerId) conditions.push(eq(b2bReturns.resellerId, filters.resellerId));
    if (filters?.status) conditions.push(eq(b2bReturns.status, filters.status as any));
    if (filters?.orderId) conditions.push(eq(b2bReturns.orderId, filters.orderId));
    
    if (conditions.length === 0) {
      return await db.select().from(b2bReturns).orderBy(desc(b2bReturns.createdAt));
    }
    return await db.select().from(b2bReturns)
      .where(and(...conditions))
      .orderBy(desc(b2bReturns.createdAt));
  }

  async getB2bReturn(id: string): Promise<B2bReturn | undefined> {
    const [result] = await db.select().from(b2bReturns).where(eq(b2bReturns.id, id));
    return result || undefined;
  }

  async getB2bReturnByNumber(returnNumber: string): Promise<B2bReturn | undefined> {
    const [result] = await db.select().from(b2bReturns).where(eq(b2bReturns.returnNumber, returnNumber));
    return result || undefined;
  }

  async createB2bReturn(data: InsertB2bReturn): Promise<B2bReturn> {
    const [created] = await db.insert(b2bReturns).values(data).returning();
    return created;
  }

  async updateB2bReturn(id: string, updates: Partial<B2bReturn>): Promise<B2bReturn> {
    const [updated] = await db.update(b2bReturns)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(b2bReturns.id, id))
      .returning();
    if (!updated) throw new Error("B2B return not found");
    return updated;
  }

  async generateB2bReturnNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `RES-B2B-${year}`;
    
    const [result] = await db.select({ count: sql<number>`count(*)` })
      .from(b2bReturns)
      .where(sql`${b2bReturns.returnNumber} LIKE ${prefix + '%'}`);
    
    const nextNumber = (result?.count || 0) + 1;
    return `${prefix}-${String(nextNumber).padStart(5, '0')}`;
  }

  // B2B Return Items
  async listB2bReturnItems(returnId: string): Promise<B2bReturnItem[]> {
    return await db.select().from(b2bReturnItems)
      .where(eq(b2bReturnItems.returnId, returnId));
  }

  async createB2bReturnItem(data: InsertB2bReturnItem): Promise<B2bReturnItem> {
    const [created] = await db.insert(b2bReturnItems).values(data).returning();
    return created;
  }

  async updateB2bReturnItem(id: string, updates: Partial<B2bReturnItem>): Promise<B2bReturnItem> {
    const [updated] = await db.update(b2bReturnItems)
      .set(updates)
      .where(eq(b2bReturnItems.id, id))
      .returning();
    if (!updated) throw new Error("B2B return item not found");
    return updated;
  }

  // B2B Repair Center Purchase Orders
  async listRepairCenterPurchaseOrders(filters?: { repairCenterId?: string; resellerId?: string; status?: string }): Promise<RepairCenterPurchaseOrder[]> {
    const conditions = [];
    if (filters?.repairCenterId) conditions.push(eq(repairCenterPurchaseOrders.repairCenterId, filters.repairCenterId));
    if (filters?.resellerId) conditions.push(eq(repairCenterPurchaseOrders.resellerId, filters.resellerId));
    if (filters?.status) conditions.push(eq(repairCenterPurchaseOrders.status, filters.status as any));
    
    if (conditions.length === 0) {
      return await db.select().from(repairCenterPurchaseOrders).orderBy(desc(repairCenterPurchaseOrders.createdAt));
    }
    return await db.select().from(repairCenterPurchaseOrders)
      .where(and(...conditions))
      .orderBy(desc(repairCenterPurchaseOrders.createdAt));
  }

  async getRepairCenterPurchaseOrder(id: string): Promise<RepairCenterPurchaseOrder | undefined> {
    const [order] = await db.select().from(repairCenterPurchaseOrders).where(eq(repairCenterPurchaseOrders.id, id));
    return order || undefined;
  }

  async createRepairCenterPurchaseOrder(data: InsertRepairCenterPurchaseOrder): Promise<RepairCenterPurchaseOrder> {
    const orderNumber = await this.generateRCB2BOrderNumber();
    const [created] = await db.insert(repairCenterPurchaseOrders)
      .values({ ...data, orderNumber })
      .returning();
    return created;
  }

  async updateRepairCenterPurchaseOrder(id: string, updates: Partial<RepairCenterPurchaseOrder>): Promise<RepairCenterPurchaseOrder> {
    const [updated] = await db.update(repairCenterPurchaseOrders)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(repairCenterPurchaseOrders.id, id))
      .returning();
    if (!updated) throw new Error("RC B2B order not found");
    return updated;
  }

  async generateRCB2BOrderNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `RCB2B-${year}`;
    
    const [result] = await db.select({ count: sql<number>`count(*)` })
      .from(repairCenterPurchaseOrders)
      .where(sql`${repairCenterPurchaseOrders.orderNumber} LIKE ${prefix + '%'}`);
    
    const nextNumber = (result?.count || 0) + 1;
    return `${prefix}-${String(nextNumber).padStart(5, '0')}`;
  }

  // B2B Repair Center Purchase Order Items
  async listRepairCenterPurchaseOrderItems(orderId: string): Promise<RepairCenterPurchaseOrderItem[]> {
    return await db.select().from(repairCenterPurchaseOrderItems)
      .where(eq(repairCenterPurchaseOrderItems.orderId, orderId));
  }

  async createRepairCenterPurchaseOrderItem(data: InsertRepairCenterPurchaseOrderItem): Promise<RepairCenterPurchaseOrderItem> {
    const [created] = await db.insert(repairCenterPurchaseOrderItems).values(data).returning();
    return created;
  }

  // B2B Repair Center Returns (Resi RC -> Reseller)
  async listRcB2bReturns(filters?: { repairCenterId?: string; resellerId?: string; status?: string; orderId?: string }): Promise<RcB2bReturn[]> {
    const conditions = [];
    if (filters?.repairCenterId) conditions.push(eq(rcB2bReturns.repairCenterId, filters.repairCenterId));
    if (filters?.resellerId) conditions.push(eq(rcB2bReturns.resellerId, filters.resellerId));
    if (filters?.status) conditions.push(eq(rcB2bReturns.status, filters.status as any));
    if (filters?.orderId) conditions.push(eq(rcB2bReturns.orderId, filters.orderId));
    
    if (conditions.length === 0) {
      return await db.select().from(rcB2bReturns).orderBy(desc(rcB2bReturns.createdAt));
    }
    return await db.select().from(rcB2bReturns)
      .where(and(...conditions))
      .orderBy(desc(rcB2bReturns.createdAt));
  }

  async getRcB2bReturn(id: string): Promise<RcB2bReturn | undefined> {
    const [result] = await db.select().from(rcB2bReturns).where(eq(rcB2bReturns.id, id));
    return result || undefined;
  }

  async createRcB2bReturn(data: InsertRcB2bReturn): Promise<RcB2bReturn> {
    const [created] = await db.insert(rcB2bReturns).values(data).returning();
    return created;
  }

  async updateRcB2bReturn(id: string, updates: Partial<RcB2bReturn>): Promise<RcB2bReturn> {
    const [updated] = await db.update(rcB2bReturns)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(rcB2bReturns.id, id))
      .returning();
    if (!updated) throw new Error("RC B2B return not found");
    return updated;
  }

  async generateRcB2bReturnNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `RES-RCB2B-${year}`;
    
    const [result] = await db.select({ count: sql<number>`count(*)` })
      .from(rcB2bReturns)
      .where(sql`${rcB2bReturns.returnNumber} LIKE ${prefix + '%'}`);
    
    const nextNumber = (result?.count || 0) + 1;
    return `${prefix}-${String(nextNumber).padStart(5, '0')}`;
  }

  // B2B Repair Center Return Items
  async listRcB2bReturnItems(returnId: string): Promise<RcB2bReturnItem[]> {
    return await db.select().from(rcB2bReturnItems)
      .where(eq(rcB2bReturnItems.returnId, returnId));
  }

  async createRcB2bReturnItem(data: InsertRcB2bReturnItem): Promise<RcB2bReturnItem> {
    const [created] = await db.insert(rcB2bReturnItems).values(data).returning();
    return created;
  }

  // ==========================================
  // MARKETPLACE (Reseller-to-Reseller B2B)
  // ==========================================

  async listMarketplaceCatalog(buyerResellerId: string): Promise<Array<{
    product: Product;
    sellerResellerId: string;
    sellerName: string;
    availableStock: number;
    marketplacePrice: number;
    minQuantity: number;
  }>> {
    // Get all products that are marketplace-enabled from OTHER resellers
    const catalogProducts = await db
      .select({
        product: products,
        sellerResellerId: users.id,
        sellerName: users.fullName,
        warehouseId: warehouses.id,
      })
      .from(products)
      .innerJoin(users, eq(products.createdBy, users.id))
      .innerJoin(warehouses, and(
        eq(warehouses.ownerId, users.id),
        eq(warehouses.ownerType, 'reseller')
      ))
      .where(and(
        eq(products.isMarketplaceEnabled, true),
        eq(products.isActive, true),
        not(eq(products.createdBy, buyerResellerId)) // Exclude buyer's own products
      ));

    // For each product, get the available stock from the seller's warehouse
    const result = [];
    for (const item of catalogProducts) {
      const [stockItem] = await db.select()
        .from(warehouseStock)
        .where(and(
          eq(warehouseStock.warehouseId, item.warehouseId),
          eq(warehouseStock.productId, item.product.id)
        ));
      
      const availableStock = stockItem?.quantity || 0;
      if (availableStock > 0) {
        result.push({
          product: item.product,
          sellerResellerId: item.sellerResellerId,
          sellerName: item.sellerName || 'Rivenditore',
          availableStock,
          marketplacePrice: item.product.marketplacePriceCents || item.product.unitPrice,
          minQuantity: item.product.marketplaceMinQuantity || 1,
        });
      }
    }

    return result;
  }

  async listMarketplaceOrders(filters?: { buyerResellerId?: string; sellerResellerId?: string; status?: string }): Promise<MarketplaceOrder[]> {
    const conditions = [];
    if (filters?.buyerResellerId) conditions.push(eq(marketplaceOrders.buyerResellerId, filters.buyerResellerId));
    if (filters?.sellerResellerId) conditions.push(eq(marketplaceOrders.sellerResellerId, filters.sellerResellerId));
    if (filters?.status) conditions.push(eq(marketplaceOrders.status, filters.status as any));
    
    if (conditions.length === 0) {
      return await db.select().from(marketplaceOrders).orderBy(desc(marketplaceOrders.createdAt));
    }
    return await db.select().from(marketplaceOrders)
      .where(and(...conditions))
      .orderBy(desc(marketplaceOrders.createdAt));
  }

  async getMarketplaceOrder(id: string): Promise<MarketplaceOrder | undefined> {
    const [order] = await db.select().from(marketplaceOrders).where(eq(marketplaceOrders.id, id));
    return order || undefined;
  }

  async getMarketplaceOrderByNumber(orderNumber: string): Promise<MarketplaceOrder | undefined> {
    const [order] = await db.select().from(marketplaceOrders).where(eq(marketplaceOrders.orderNumber, orderNumber));
    return order || undefined;
  }

  async createMarketplaceOrder(data: InsertMarketplaceOrder): Promise<MarketplaceOrder> {
    const orderNumber = await this.generateMarketplaceOrderNumber();
    const [created] = await db.insert(marketplaceOrders)
      .values({ ...data, orderNumber })
      .returning();
    return created;
  }

  async updateMarketplaceOrder(id: string, updates: Partial<MarketplaceOrder>): Promise<MarketplaceOrder> {
    const [updated] = await db.update(marketplaceOrders)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(marketplaceOrders.id, id))
      .returning();
    if (!updated) throw new Error("Marketplace order not found");
    return updated;
  }

  async generateMarketplaceOrderNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `MP-${year}`;
    
    const [result] = await db.select({ count: sql<number>`count(*)` })
      .from(marketplaceOrders)
      .where(sql`${marketplaceOrders.orderNumber} LIKE ${prefix + '%'}`);
    
    const nextNumber = (result?.count || 0) + 1;
    return `${prefix}-${String(nextNumber).padStart(5, '0')}`;
  }

  // Marketplace Order Items
  async listMarketplaceOrderItems(orderId: string): Promise<MarketplaceOrderItem[]> {
    return await db.select().from(marketplaceOrderItems)
      .where(eq(marketplaceOrderItems.orderId, orderId));
  }

  async createMarketplaceOrderItem(data: InsertMarketplaceOrderItem): Promise<MarketplaceOrderItem> {
    const [created] = await db.insert(marketplaceOrderItems).values(data).returning();
    return created;
  }

  // Admin Dashboard Extended Stats
  async getLatestCustomers(limit: number): Promise<any[]> {
    const result = await db.select({
      id: users.id,
      username: users.username,
      email: users.email,
      fullName: users.fullName,
      phone: users.phone,
      createdAt: users.createdAt,
      resellerId: users.resellerId,
    })
    .from(users)
    .where(eq(users.role, 'customer'))
    .orderBy(desc(users.createdAt))
    .limit(limit);
    return result;
  }

  async getLatestResellers(limit: number): Promise<any[]> {
    const result = await db.select({
      id: users.id,
      username: users.username,
      email: users.email,
      fullName: users.fullName,
      phone: users.phone,
      createdAt: users.createdAt,
      isActive: users.isActive,
    })
    .from(users)
    .where(eq(users.role, 'reseller'))
    .orderBy(desc(users.createdAt))
    .limit(limit);
    return result;
  }

  async getResellerStats(): Promise<{ total: number; active: number; withCenters: number; withCustomers: number }> {
    const resellerCounts = await db.execute(sql`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN is_active = true THEN 1 END) as active
      FROM ${users}
      WHERE role = 'reseller'
    `);
    
    const withCentersResult = await db.execute(sql`
      SELECT COUNT(DISTINCT reseller_id) as count
      FROM ${repairCenters}
      WHERE reseller_id IS NOT NULL
    `);
    
    const withCustomersResult = await db.execute(sql`
      SELECT COUNT(DISTINCT reseller_id) as count
      FROM ${users}
      WHERE role = 'customer' AND reseller_id IS NOT NULL
    `);
    
    const row = resellerCounts.rows[0] as any;
    return {
      total: parseInt(row?.total) || 0,
      active: parseInt(row?.active) || 0,
      withCenters: parseInt((withCentersResult.rows[0] as any)?.count) || 0,
      withCustomers: parseInt((withCustomersResult.rows[0] as any)?.count) || 0,
    };
  }

  async getRepairCenterGlobalStats(): Promise<{ total: number; active: number; totalRepairs: number; avgRepairsPerCenter: number }> {
    const centerCounts = await db.execute(sql`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN is_active = true THEN 1 END) as active
      FROM ${repairCenters}
    `);
    
    const repairCount = await db.execute(sql`
      SELECT COUNT(*) as total FROM ${repairOrders}
    `);
    
    const row = centerCounts.rows[0] as any;
    const totalCenters = parseInt(row?.total) || 0;
    const activeCenters = parseInt(row?.active) || 0;
    const totalRepairs = parseInt((repairCount.rows[0] as any)?.total) || 0;
    
    return {
      total: totalCenters,
      active: activeCenters,
      totalRepairs,
      avgRepairsPerCenter: activeCenters > 0 ? Math.round(totalRepairs / activeCenters * 10) / 10 : 0,
    };
  }

  async getUtilityPracticesStats(resellerId?: string, repairCenterId?: string): Promise<{ total: number; byStatus: Record<string, number>; totalCommissions: number; pendingCommissions: number }> {
    // Use Drizzle ORM query builder for practices to enable dynamic filtering
    const conditions = [];
    if (resellerId) conditions.push(eq(utilityPractices.resellerId, resellerId));
    if (repairCenterId) conditions.push(eq(utilityPractices.repairCenterId, repairCenterId));
    
    // Single query for practice counts by status with optional filters
    let practicesQuery = db.select({
      status: utilityPractices.status,
      count: sql<number>`COUNT(*)`
    }).from(utilityPractices);
    
    if (conditions.length > 0) {
      practicesQuery = practicesQuery.where(and(...conditions)) as any;
    }
    
    const practicesByStatus = await practicesQuery.groupBy(utilityPractices.status);
    
    // Single query for commissions using JOIN with practices to apply same filters
    // This avoids fetching practice IDs separately
    let commissionQuery = db.select({
      total: sql<number>`COALESCE(SUM(${utilityCommissions.amountCents}), 0)`,
      pending: sql<number>`COALESCE(SUM(CASE WHEN ${utilityCommissions.status} = 'pending' THEN ${utilityCommissions.amountCents} ELSE 0 END), 0)`
    }).from(utilityCommissions);
    
    if (conditions.length > 0) {
      // Join with practices to apply filters
      commissionQuery = db.select({
        total: sql<number>`COALESCE(SUM(${utilityCommissions.amountCents}), 0)`,
        pending: sql<number>`COALESCE(SUM(CASE WHEN ${utilityCommissions.status} = 'pending' THEN ${utilityCommissions.amountCents} ELSE 0 END), 0)`
      }).from(utilityCommissions)
        .innerJoin(utilityPractices, eq(utilityCommissions.practiceId, utilityPractices.id))
        .where(and(...conditions)) as any;
    }
    
    const commissionStats = await commissionQuery;
    
    const byStatus: Record<string, number> = {};
    let totalPractices = 0;
    practicesByStatus.forEach((row: any) => {
      byStatus[row.status] = parseInt(row.count) || 0;
      totalPractices += parseInt(row.count) || 0;
    });
    
    const commRow = commissionStats[0] || { total: 0, pending: 0 };
    return {
      total: totalPractices,
      byStatus,
      totalCommissions: parseInt(String(commRow.total)) || 0,
      pendingCommissions: parseInt(String(commRow.pending)) || 0,
    };
  }

  async getWarehouseGlobalStats(): Promise<{ totalWarehouses: number; totalStock: number; totalValue: number; lowStockItems: number }> {
    const warehouseCount = await db.execute(sql`
      SELECT COUNT(*) as total FROM ${warehouses}
    `);
    
    const stockStats = await db.execute(sql`
      SELECT 
        COALESCE(SUM(COALESCE(i.quantity, 0)), 0) as total_stock,
        COALESCE(SUM(COALESCE(i.quantity, 0) * COALESCE(p.cost_price, 0)), 0) as total_value,
        COUNT(CASE WHEN COALESCE(i.quantity, 0) < 5 THEN 1 END) as low_stock
      FROM ${inventoryStock} i
      LEFT JOIN ${products} p ON i.product_id = p.id
    `);
    
    const row = stockStats.rows[0] as any;
    return {
      totalWarehouses: parseInt((warehouseCount.rows[0] as any)?.total) || 0,
      totalStock: parseInt(row?.total_stock) || 0,
      totalValue: parseInt(row?.total_value) || 0,
      lowStockItems: parseInt(row?.low_stock) || 0,
    };
  }

  async getEcommerceStats(): Promise<{ totalOrders: number; totalRevenue: number; pendingOrders: number; activeCartItems: number }> {
    const orderStats = await db.execute(sql`
      SELECT 
        COUNT(*) as total_orders,
        COALESCE(SUM(CASE WHEN status IN ('completed', 'delivered') THEN COALESCE(total, 0) ELSE 0 END), 0) as total_revenue,
        COUNT(CASE WHEN status IN ('pending', 'processing') THEN 1 END) as pending_orders
      FROM ${salesOrders}
    `);
    
    const cartCount = await db.execute(sql`
      SELECT COUNT(*) as total FROM ${cartItems}
    `);
    
    const row = orderStats.rows[0] as any;
    return {
      totalOrders: parseInt(row?.total_orders) || 0,
      totalRevenue: parseInt(row?.total_revenue) || 0,
      pendingOrders: parseInt(row?.pending_orders) || 0,
      activeCartItems: parseInt((cartCount.rows[0] as any)?.total) || 0,
    };
  }

  // Remote Repair Requests
  async listRemoteRepairRequests(filters?: { 
    customerId?: string; 
    resellerId?: string; 
    subResellerId?: string;
    assignedCenterId?: string; 
    requestedCenterId?: string;
    status?: string;
  }): Promise<RemoteRepairRequest[]> {
    let query = db.select().from(remoteRepairRequests).orderBy(desc(remoteRepairRequests.createdAt));
    const conditions = [];
    
    if (filters?.customerId) {
      conditions.push(eq(remoteRepairRequests.customerId, filters.customerId));
    }
    if (filters?.resellerId) {
      conditions.push(eq(remoteRepairRequests.resellerId, filters.resellerId));
    }
    if (filters?.subResellerId) {
      conditions.push(eq(remoteRepairRequests.subResellerId, filters.subResellerId));
    }
    if (filters?.assignedCenterId) {
      conditions.push(eq(remoteRepairRequests.assignedCenterId, filters.assignedCenterId));
    }
    if (filters?.requestedCenterId) {
      conditions.push(eq(remoteRepairRequests.requestedCenterId, filters.requestedCenterId));
    }
    if (filters?.status) {
      conditions.push(eq(remoteRepairRequests.status, filters.status as any));
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }
    
    return query;
  }

  async getRemoteRepairRequest(id: string): Promise<RemoteRepairRequest | undefined> {
    const [result] = await db.select().from(remoteRepairRequests).where(eq(remoteRepairRequests.id, id));
    return result || undefined;
  }

  async createRemoteRepairRequest(data: InsertRemoteRepairRequest): Promise<RemoteRepairRequest> {
    const requestNumber = await this.generateRemoteRequestNumber();
    const [result] = await db.insert(remoteRepairRequests).values({
      ...data,
      requestNumber,
    }).returning();
    return result;
  }

  async updateRemoteRepairRequest(id: string, updates: UpdateRemoteRepairRequest): Promise<RemoteRepairRequest> {
    const [result] = await db.update(remoteRepairRequests)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(remoteRepairRequests.id, id))
      .returning();
    return result;
  }

  async generateRemoteRequestNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `RRR-${year}-`;
    
    const latestResult = await db.execute(sql`
      SELECT request_number FROM remote_repair_requests 
      WHERE request_number LIKE ${prefix + '%'}
      ORDER BY request_number DESC
      LIMIT 1
    `);
    
    let nextNum = 1;
    if (latestResult.rows && latestResult.rows.length > 0) {
      const lastNumber = (latestResult.rows[0] as any).request_number;
      const match = lastNumber?.match(/RRR-\d{4}-(\d+)/);
      if (match) {
        nextNum = parseInt(match[1], 10) + 1;
      }
    }
    
    return `${prefix}${String(nextNum).padStart(5, '0')}`;
  }

  async getResellerRemoteRequestPendingCount(resellerId: string): Promise<number> {
    const result = await db.execute(sql`
      SELECT COUNT(*) as count FROM remote_repair_requests 
      WHERE reseller_id = ${resellerId} AND status = 'pending'
    `);
    return parseInt((result.rows[0] as any)?.count) || 0;
  }

  async createRepairFromRemoteRequest(remoteRequestId: string): Promise<{ repairOrder: RepairOrder; remoteRequest: RemoteRepairRequest }> {
    const request = await this.getRemoteRepairRequest(remoteRequestId);
    if (!request) {
      throw new Error("Richiesta remota non trovata");
    }
    
    if (request.status !== 'received') {
      throw new Error("La richiesta deve essere nello stato 'received' per creare la lavorazione");
    }
    
    if (request.repairOrderId) {
      throw new Error("La lavorazione è già stata creata per questa richiesta");
    }
    
    // Get the repair center ID from the assigned user (assignedCenterId stores user ID, not repair_center ID)
    const centerUser = request.assignedCenterId ? await this.getUser(request.assignedCenterId) : null;
    if (!centerUser?.repairCenterId) {
      throw new Error("Centro di riparazione non trovato per l'utente assegnato");
    }
    
    const count = await db.select().from(repairOrders);
    const orderNumber = `ORD-${Date.now()}-${count.length + 1}`;
    
    const [repairOrder] = await db.insert(repairOrders).values({
      orderNumber,
      customerId: request.customerId,
      resellerId: request.resellerId,
      repairCenterId: centerUser.repairCenterId,
      deviceType: request.deviceType,
      deviceModel: request.model,
      brand: request.brand,
      deviceModelId: request.deviceModelId,
      imei: request.imei,
      serial: request.serial,
      issueDescription: request.issueDescription,
      status: 'ingressato',
      ingressatoAt: new Date(),
      notes: `Creato da richiesta remota ${request.requestNumber}`,
    }).returning();
    
    await this.createRepairOrderStateHistory({
      repairOrderId: repairOrder.id,
      status: 'ingressato' as any,
      enteredAt: new Date(),
    });
    
    const [updatedRequest] = await db.update(remoteRepairRequests)
      .set({
        repairOrderId: repairOrder.id,
        status: 'repair_created',
        updatedAt: new Date(),
      })
      .where(eq(remoteRepairRequests.id, remoteRequestId))
      .returning();
    
    return { repairOrder, remoteRequest: updatedRequest };
  }
  
  // Service Orders
  async listServiceOrders(filters?: { customerId?: string; resellerId?: string; repairCenterId?: string; status?: string }): Promise<ServiceOrder[]> {
    const conditions = [];
    if (filters?.customerId) conditions.push(eq(serviceOrders.customerId, filters.customerId));
    if (filters?.resellerId) conditions.push(eq(serviceOrders.resellerId, filters.resellerId));
    if (filters?.repairCenterId) conditions.push(eq(serviceOrders.repairCenterId, filters.repairCenterId));
    if (filters?.status) conditions.push(eq(serviceOrders.status, filters.status as any));
    
    return db.select().from(serviceOrders)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(serviceOrders.createdAt));
  }
  
  async getServiceOrder(id: string): Promise<ServiceOrder | undefined> {
    const [order] = await db.select().from(serviceOrders).where(eq(serviceOrders.id, id));
    return order || undefined;
  }
  
  async getServiceOrderByNumber(orderNumber: string): Promise<ServiceOrder | undefined> {
    const [order] = await db.select().from(serviceOrders).where(eq(serviceOrders.orderNumber, orderNumber));
    return order || undefined;
  }
  
  async createServiceOrder(data: InsertServiceOrder): Promise<ServiceOrder> {
    const orderNumber = await this.generateServiceOrderNumber();
    const [order] = await db.insert(serviceOrders).values({
      ...data,
      orderNumber,
    }).returning();
    return order;
  }
  
  async updateServiceOrder(id: string, updates: Partial<ServiceOrder>): Promise<ServiceOrder> {
    const [order] = await db.update(serviceOrders)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(serviceOrders.id, id))
      .returning();
    return order;
  }
  
  async generateServiceOrderNumber(): Promise<string> {
    const date = new Date();
    const prefix = `SVC-${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}`;
    const existingOrders = await db.select().from(serviceOrders)
      .where(ilike(serviceOrders.orderNumber, `${prefix}%`));
    const nextNumber = existingOrders.length + 1;
    return `${prefix}-${String(nextNumber).padStart(5, '0')}`;
  }

  // ============================================================================
  // HR MODULE - Gestione Risorse Umane
  // ============================================================================

  // Work Profiles
  async listHrWorkProfiles(resellerId: string): Promise<HrWorkProfile[]> {
    return db.select().from(hrWorkProfiles)
      .where(eq(hrWorkProfiles.resellerId, resellerId))
      .orderBy(hrWorkProfiles.name);
  }

  // Work Profiles with hierarchical visibility (includes sub-resellers and repair centers recursively)
  async listHrWorkProfilesHierarchical(resellerId: string): Promise<(HrWorkProfile & { 
    originType: 'own' | 'sub_reseller' | 'repair_center';
    originEntityName: string;
  })[]> {
    // 1. Recursively get ALL sub-resellers at any depth
    const subResellerNames = new Map<string, string>();
    const allSubResellerIds: string[] = [];
    
    const collectSubResellers = async (parentIds: string[]) => {
      if (parentIds.length === 0) return;
      const children = await db.select({ id: users.id, fullName: users.fullName })
        .from(users)
        .where(inArray(users.parentResellerId, parentIds));
      const newIds: string[] = [];
      for (const child of children) {
        if (!allSubResellerIds.includes(child.id)) {
          allSubResellerIds.push(child.id);
          subResellerNames.set(child.id, child.fullName);
          newIds.push(child.id);
        }
      }
      if (newIds.length > 0) {
        await collectSubResellers(newIds);
      }
    };
    await collectSubResellers([resellerId]);

    // 2. Get ALL repair centers (direct + via any level of sub-resellers)
    const allResellerIds = [resellerId, ...allSubResellerIds];
    
    const allCenters = await db.select({ id: repairCenters.id, name: repairCenters.name })
      .from(repairCenters)
      .where(or(
        inArray(repairCenters.resellerId, allResellerIds),
        inArray(repairCenters.subResellerId, allResellerIds)
      ));
    
    const centerNames = new Map(allCenters.map(c => [c.id, c.name]));

    // 3. Query all work profiles for all reseller IDs in the hierarchy
    const profiles = await db.select().from(hrWorkProfiles)
      .where(inArray(hrWorkProfiles.resellerId, allResellerIds))
      .orderBy(hrWorkProfiles.name);

    // 4. Enrich with origin info
    return profiles.map(profile => {
      let originType: 'own' | 'sub_reseller' | 'repair_center' = 'own';
      let originEntityName = 'Proprio';

      if (profile.sourceType === 'repair_center' && profile.sourceEntityId) {
        originType = 'repair_center';
        originEntityName = centerNames.get(profile.sourceEntityId) || 'Centro Riparazione';
      } else if (profile.resellerId !== resellerId) {
        originType = 'sub_reseller';
        originEntityName = subResellerNames.get(profile.resellerId) || 'Sub-Reseller';
      }

      return { ...profile, originType, originEntityName };
    });
  }

  async getHrWorkProfile(id: string): Promise<HrWorkProfile | undefined> {
    const [profile] = await db.select().from(hrWorkProfiles).where(eq(hrWorkProfiles.id, id));
    return profile || undefined;
  }

  async createHrWorkProfile(data: InsertHrWorkProfile): Promise<HrWorkProfile> {
    const [profile] = await db.insert(hrWorkProfiles).values(data).returning();
    return profile;
  }

  async updateHrWorkProfile(id: string, updates: Partial<HrWorkProfile>): Promise<HrWorkProfile> {
    const [profile] = await db.update(hrWorkProfiles)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(hrWorkProfiles.id, id))
      .returning();
    return profile;
  }

  async deleteHrWorkProfile(id: string): Promise<void> {
    await db.delete(hrWorkProfiles).where(eq(hrWorkProfiles.id, id));
  }

  // Work Profile Assignments
  async assignWorkProfile(data: InsertHrWorkProfileAssignment): Promise<HrWorkProfileAssignment> {
    const [assignment] = await db.insert(hrWorkProfileAssignments).values(data).returning();
    return assignment;
  }

  async getUserWorkProfile(userId: string): Promise<HrWorkProfile | undefined> {
    const [assignment] = await db.select()
      .from(hrWorkProfileAssignments)
      .where(and(
        eq(hrWorkProfileAssignments.userId, userId),
        or(isNull(hrWorkProfileAssignments.validTo), gte(hrWorkProfileAssignments.validTo, new Date()))
      ))
      .orderBy(desc(hrWorkProfileAssignments.validFrom))
      .limit(1);
    
    if (!assignment) return undefined;
    return this.getHrWorkProfile(assignment.workProfileId);
  }

  // Clocking Policies
  async listHrClockingPolicies(resellerId: string): Promise<HrClockingPolicy[]> {
    return db.select().from(hrClockingPolicies)
      .where(eq(hrClockingPolicies.resellerId, resellerId))
      .orderBy(hrClockingPolicies.locationName);
  }

  // Get all accessible reseller IDs for a parent reseller (includes sub-resellers at any depth and repair centers)
  async getAccessibleResellerIds(resellerId: string): Promise<string[]> {
    const ids: string[] = [resellerId];
    
    // Recursively collect ALL sub-resellers at any depth
    const collectSubResellers = async (parentIds: string[]) => {
      if (parentIds.length === 0) return;
      const children = await db.select({ id: users.id })
        .from(users)
        .where(inArray(users.parentResellerId, parentIds));
      const newIds: string[] = [];
      for (const child of children) {
        if (child.id && !ids.includes(child.id)) {
          ids.push(child.id);
          newIds.push(child.id);
        }
      }
      if (newIds.length > 0) {
        await collectSubResellers(newIds);
      }
    };
    await collectSubResellers([resellerId]);
    
    // Get repair centers owned by all resellers in hierarchy
    const centers = await db.select({ id: repairCenters.id })
      .from(repairCenters)
      .where(or(
        inArray(repairCenters.resellerId, ids),
        inArray(repairCenters.subResellerId, ids)
      ));
    for (const c of centers) {
      if (c.id && !ids.includes(c.id)) ids.push(c.id);
    }
    
    // Get staff members of all resellers in hierarchy
    const staff = await db.select({ id: users.id })
      .from(users)
      .where(inArray(users.resellerId, ids));
    for (const s of staff) {
      if (s.id && !ids.includes(s.id)) ids.push(s.id);
    }
    
    return [...new Set(ids)]; // Remove duplicates
  }

  // Get accessible entities with names for calendar filter dropdown
  async getAccessibleEntitiesForCalendar(resellerId: string): Promise<Array<{
    type: "reseller" | "repair_center";
    id: string;
    name: string;
    parentId: string | null;
  }>> {
    const entities: Array<{
      type: "reseller" | "repair_center";
      id: string;
      name: string;
      parentId: string | null;
    }> = [];
    
    // Get all sub-resellers recursively
    const resellerIds: string[] = [];
    const collectSubResellers = async (parentIds: string[]) => {
      if (parentIds.length === 0) return;
      const children = await db.select({
        id: users.id,
        fullName: users.fullName,
        ragioneSociale: users.ragioneSociale,
        parentResellerId: users.parentResellerId
      })
        .from(users)
        .where(and(
          inArray(users.parentResellerId, parentIds),
          eq(users.role, 'reseller')
        ));
      const newIds: string[] = [];
      for (const child of children) {
        if (child.id && !resellerIds.includes(child.id)) {
          resellerIds.push(child.id);
          newIds.push(child.id);
          entities.push({
            type: 'reseller',
            id: child.id,
            name: child.ragioneSociale || child.fullName || 'Sub-Reseller',
            parentId: child.parentResellerId || null
          });
        }
      }
      if (newIds.length > 0) {
        await collectSubResellers(newIds);
      }
    };
    await collectSubResellers([resellerId]);
    
    // Get repair centers owned by all resellers in hierarchy (including root)
    const allResellerIds = [resellerId, ...resellerIds];
    // Build conditions array for repair centers - handle nullable subResellerId safely
    const rcConditions = [inArray(repairCenters.resellerId, allResellerIds)];
    // Only add subResellerId condition if we have IDs to check (avoid null comparison issues)
    if (allResellerIds.length > 0) {
      rcConditions.push(
        and(
          not(isNull(repairCenters.subResellerId)),
          inArray(repairCenters.subResellerId, allResellerIds)
        )!
      );
    }
    const centers = await db.select({
      id: repairCenters.id,
      name: repairCenters.name,
      resellerId: repairCenters.resellerId,
      subResellerId: repairCenters.subResellerId
    })
      .from(repairCenters)
      .where(or(...rcConditions));
    
    for (const center of centers) {
      entities.push({
        type: 'repair_center',
        id: center.id,
        name: center.name || 'Centro Riparazioni',
        parentId: center.subResellerId || center.resellerId || null
      });
    }
    
    return entities;
  }

  async getHrClockingPolicy(id: string): Promise<HrClockingPolicy | undefined> {
    const [policy] = await db.select().from(hrClockingPolicies).where(eq(hrClockingPolicies.id, id));
    return policy || undefined;
  }

  async createHrClockingPolicy(data: InsertHrClockingPolicy): Promise<HrClockingPolicy> {
    const [policy] = await db.insert(hrClockingPolicies).values(data).returning();
    return policy;
  }

  async updateHrClockingPolicy(id: string, updates: Partial<HrClockingPolicy>): Promise<HrClockingPolicy> {
    const [policy] = await db.update(hrClockingPolicies)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(hrClockingPolicies.id, id))
      .returning();
    return policy;
  }

  async deleteHrClockingPolicy(id: string): Promise<void> {
    await db.delete(hrClockingPolicies).where(eq(hrClockingPolicies.id, id));
  }

  // Clock Events (Timbrature)
  async createHrClockEvent(data: InsertHrClockEvent): Promise<HrClockEvent> {
    const [event] = await db.insert(hrClockEvents).values(data).returning();
    return event;
  }

  async getHrClockEvent(id: string): Promise<HrClockEvent | undefined> {
    const [event] = await db.select().from(hrClockEvents).where(eq(hrClockEvents.id, id));
    return event;
  }

  async updateHrClockEvent(id: string, data: Partial<InsertHrClockEvent>): Promise<HrClockEvent> {
    const [event] = await db.update(hrClockEvents).set(data).where(eq(hrClockEvents.id, id)).returning();
    return event;
  }

  async listHrClockEvents(filters: { userId?: string; resellerIds?: string[]; startDate?: Date; endDate?: Date }): Promise<any[]> {
    const conditions = [];
    if (filters.userId) conditions.push(eq(hrClockEvents.userId, filters.userId));
    if (filters.resellerIds && filters.resellerIds.length > 0) {
      conditions.push(inArray(hrClockEvents.resellerId, filters.resellerIds));
    }
    if (filters.startDate) conditions.push(gte(hrClockEvents.eventTime, filters.startDate));
    if (filters.endDate) conditions.push(lte(hrClockEvents.eventTime, filters.endDate));
    
    const results = await db.select({
      id: hrClockEvents.id,
      userId: hrClockEvents.userId,
      resellerId: hrClockEvents.resellerId,
      eventType: hrClockEvents.eventType,
      eventTime: hrClockEvents.eventTime,
      latitude: hrClockEvents.latitude,
      longitude: hrClockEvents.longitude,
      status: hrClockEvents.status,
      validationNote: hrClockEvents.validationNote,
      createdAt: hrClockEvents.createdAt,
      userFullName: users.fullName,
    }).from(hrClockEvents)
      .leftJoin(users, eq(hrClockEvents.userId, users.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(hrClockEvents.eventTime));
    
    return results.map(r => ({
      ...r,
      user: r.userFullName ? { fullName: r.userFullName } : undefined
    }));
  }
  async getTodayClockEvents(userId: string): Promise<HrClockEvent[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    return db.select().from(hrClockEvents)
      .where(and(
        eq(hrClockEvents.userId, userId),
        gte(hrClockEvents.eventTime, today),
        lt(hrClockEvents.eventTime, tomorrow)
      ))
      .orderBy(hrClockEvents.eventTime);
  }

  async validateHrClockEvent(id: string, validatedBy: string, note?: string): Promise<HrClockEvent> {
    const [event] = await db.update(hrClockEvents)
      .set({
        status: 'validated',
        validatedBy,
        validatedAt: new Date(),
        validationNote: note,
      })
      .where(eq(hrClockEvents.id, id))
      .returning();
    return event;
  }

  // Leave Balances
  async getHrLeaveBalance(userId: string, leaveType: string, year: number): Promise<HrLeaveBalance | undefined> {
    const [balance] = await db.select().from(hrLeaveBalances)
      .where(and(
        eq(hrLeaveBalances.userId, userId),
        eq(hrLeaveBalances.leaveType, leaveType as any),
        eq(hrLeaveBalances.year, year)
      ));
    return balance || undefined;
  }

  async listHrLeaveBalances(userId: string, year?: number): Promise<HrLeaveBalance[]> {
    const conditions = [eq(hrLeaveBalances.userId, userId)];
    if (year) conditions.push(eq(hrLeaveBalances.year, year));
    
    return db.select().from(hrLeaveBalances)
      .where(and(...conditions));
  }

  async upsertHrLeaveBalance(data: InsertHrLeaveBalance): Promise<HrLeaveBalance> {
    const existing = await this.getHrLeaveBalance(data.userId, data.leaveType, data.year);
    if (existing) {
      const [updated] = await db.update(hrLeaveBalances)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(hrLeaveBalances.id, existing.id))
        .returning();
      return updated;
    }
    const [created] = await db.insert(hrLeaveBalances).values(data).returning();
    return created;
  }

  // Leave Requests
  async createHrLeaveRequest(data: InsertHrLeaveRequest): Promise<HrLeaveRequest> {
    const [request] = await db.insert(hrLeaveRequests).values(data).returning();
    return request;
  }

  async getHrLeaveRequest(id: string): Promise<HrLeaveRequest | undefined> {
    const [request] = await db.select().from(hrLeaveRequests).where(eq(hrLeaveRequests.id, id));
    return request || undefined;
  }

  async listHrLeaveRequests(filters: { userId?: string; resellerId?: string; resellerIds?: string[]; status?: string }): Promise<(HrLeaveRequest & { user?: { fullName: string } })[]> {
    const conditions = [];
    if (filters.userId) conditions.push(eq(hrLeaveRequests.userId, filters.userId));
    if (filters.resellerIds && filters.resellerIds.length > 0) {
      conditions.push(inArray(hrLeaveRequests.resellerId, filters.resellerIds));
    } else if (filters.resellerId) {
      conditions.push(eq(hrLeaveRequests.resellerId, filters.resellerId));
    }
    if (filters.status) conditions.push(eq(hrLeaveRequests.status, filters.status as any));
    
    const results = await db.select({
      request: hrLeaveRequests,
      user: {
        fullName: users.fullName
      }
    })
      .from(hrLeaveRequests)
      .leftJoin(users, eq(hrLeaveRequests.userId, users.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(hrLeaveRequests.createdAt));
    
    return results.map(r => ({
      ...r.request,
      user: r.user ? { fullName: r.user.fullName } : undefined
    }));
  }

  async updateHrLeaveRequest(id: string, updates: Partial<HrLeaveRequest>): Promise<HrLeaveRequest> {
    const [request] = await db.update(hrLeaveRequests)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(hrLeaveRequests.id, id))
      .returning();
    return request;
  }

  async approveHrLeaveRequest(id: string, approvedBy: string): Promise<HrLeaveRequest> {
    const [request] = await db.update(hrLeaveRequests)
      .set({
        status: 'approved',
        approvedBy,
        approvedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(hrLeaveRequests.id, id))
      .returning();
    return request;
  }

  async rejectHrLeaveRequest(id: string, approvedBy: string, reason: string): Promise<HrLeaveRequest> {
    const [request] = await db.update(hrLeaveRequests)
      .set({
        status: 'rejected',
        approvedBy,
        approvedAt: new Date(),
        rejectionReason: reason,
        updatedAt: new Date(),
      })
      .where(eq(hrLeaveRequests.id, id))
      .returning();
    return request;
  }

  // Sick Leaves
  async createHrSickLeave(data: InsertHrSickLeave): Promise<HrSickLeave> {
    const [leave] = await db.insert(hrSickLeaves).values(data).returning();
    return leave;
  }

  async getHrSickLeave(id: string): Promise<HrSickLeave | undefined> {
    const [leave] = await db.select().from(hrSickLeaves).where(eq(hrSickLeaves.id, id));
    return leave || undefined;
  }

  async listHrSickLeaves(filters: { userId?: string; resellerId?: string; resellerIds?: string[]; status?: string }): Promise<(HrSickLeave & { user: { fullName: string } | null; certificate?: { id: string; fileName: string; fileUrl: string } | null })[]> {
    const conditions = [];
    if (filters.userId) conditions.push(eq(hrSickLeaves.userId, filters.userId));
    if (filters.resellerIds && filters.resellerIds.length > 0) {
      conditions.push(inArray(hrSickLeaves.resellerId, filters.resellerIds));
    } else if (filters.resellerId) {
      conditions.push(eq(hrSickLeaves.resellerId, filters.resellerId));
    }
    
    const results = await db.select({
      sickLeave: hrSickLeaves,
      userFullName: users.fullName,
      certificateId: hrCertificates.id,
      certificateFileName: hrCertificates.fileName,
      certificateFileUrl: hrCertificates.fileUrl,
    })
      .from(hrSickLeaves)
      .leftJoin(users, eq(hrSickLeaves.userId, users.id))
      .leftJoin(hrCertificates, eq(hrCertificates.relatedSickLeaveId, hrSickLeaves.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(hrSickLeaves.startDate));
    
    return results.map(r => ({
      ...r.sickLeave,
      user: r.userFullName ? { fullName: r.userFullName } : null,
      certificate: r.certificateId ? { 
        id: r.certificateId, 
        fileName: r.certificateFileName!, 
        fileUrl: r.certificateFileUrl! 
      } : null,
    }));
  }

  async updateHrSickLeave(id: string, updates: Partial<HrSickLeave>): Promise<HrSickLeave> {
    const [leave] = await db.update(hrSickLeaves)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(hrSickLeaves.id, id))
      .returning();
    return leave;
  }

  // HR Calendar Data - aggregates leaves, sick leaves for calendar view
  // Accepts array of resellerIds for hierarchical visibility
  async getHrCalendarData(resellerIds: string[], startDate: Date, endDate: Date): Promise<Array<{
    userId: string;
    userName: string;
    type: string;
    startDate: string;
    endDate: string;
  }>> {
    if (resellerIds.length === 0) {
      return [];
    }

    const events: Array<{
      userId: string;
      userName: string;
      type: string;
      startDate: string;
      endDate: string;
    }> = [];

    // Get approved leave requests (ferie, permessi, rol)
    const leaveRequests = await db.select({
      userId: hrLeaveRequests.userId,
      userName: users.fullName,
      leaveType: hrLeaveRequests.leaveType,
      startDate: hrLeaveRequests.startDate,
      endDate: hrLeaveRequests.endDate,
    })
      .from(hrLeaveRequests)
      .leftJoin(users, eq(hrLeaveRequests.userId, users.id))
      .where(and(
        inArray(hrLeaveRequests.resellerId, resellerIds),
        eq(hrLeaveRequests.status, 'approved'),
        or(
          and(gte(hrLeaveRequests.startDate, startDate), lte(hrLeaveRequests.startDate, endDate)),
          and(gte(hrLeaveRequests.endDate, startDate), lte(hrLeaveRequests.endDate, endDate)),
          and(lte(hrLeaveRequests.startDate, startDate), gte(hrLeaveRequests.endDate, endDate))
        )
      ));

    for (const lr of leaveRequests) {
      let eventType = 'vacation';
      if (lr.leaveType === 'permesso_studio' || lr.leaveType === 'permesso_medico' || lr.leaveType === 'permesso_lutto' || lr.leaveType === 'permesso_matrimonio') {
        eventType = 'permit';
      } else if (lr.leaveType === 'permesso_rol') {
        eventType = 'rol';
      }
      events.push({
        userId: lr.userId,
        userName: lr.userName || 'Sconosciuto',
        type: eventType,
        startDate: lr.startDate.toISOString(),
        endDate: lr.endDate.toISOString(),
      });
    }

    // Get sick leaves
    const sickLeaves = await db.select({
      userId: hrSickLeaves.userId,
      userName: users.fullName,
      startDate: hrSickLeaves.startDate,
      endDate: hrSickLeaves.endDate,
    })
      .from(hrSickLeaves)
      .leftJoin(users, eq(hrSickLeaves.userId, users.id))
      .where(and(
        inArray(hrSickLeaves.resellerId, resellerIds),
        or(
          and(gte(hrSickLeaves.startDate, startDate), lte(hrSickLeaves.startDate, endDate)),
          and(
            or(isNull(hrSickLeaves.endDate), gte(hrSickLeaves.endDate, startDate)),
            lte(hrSickLeaves.startDate, endDate)
          )
        )
      ));

    for (const sl of sickLeaves) {
      // For open-ended sick leaves (no endDate), clamp to the requested range endDate
      const effectiveEndDate = sl.endDate ? sl.endDate : endDate;
      events.push({
        userId: sl.userId,
        userName: sl.userName || 'Sconosciuto',
        type: 'sick',
        startDate: sl.startDate.toISOString(),
        endDate: effectiveEndDate.toISOString(),
      });
    }

    return events;
  }

  // Certificates
  async createHrCertificate(data: InsertHrCertificate): Promise<HrCertificate> {
    const [cert] = await db.insert(hrCertificates).values(data).returning();
    return cert;
  }

  async listHrCertificates(filters: { userId?: string; resellerId?: string; sickLeaveId?: string }): Promise<HrCertificate[]> {
    const conditions = [];
    if (filters.userId) conditions.push(eq(hrCertificates.userId, filters.userId));
    if (filters.resellerId) conditions.push(eq(hrCertificates.resellerId, filters.resellerId));
    if (filters.sickLeaveId) conditions.push(eq(hrCertificates.relatedSickLeaveId, filters.sickLeaveId));
    
    return db.select().from(hrCertificates)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(hrCertificates.createdAt));
  }

  async getHrCertificateBySickLeaveId(sickLeaveId: string): Promise<HrCertificate | undefined> {
    const [cert] = await db.select().from(hrCertificates)
      .where(eq(hrCertificates.relatedSickLeaveId, sickLeaveId))
      .orderBy(desc(hrCertificates.createdAt))
      .limit(1);
    return cert || undefined;
  }

  // Absences
  async createHrAbsence(data: InsertHrAbsence): Promise<HrAbsence> {
    const [absence] = await db.insert(hrAbsences).values(data).returning();
    return absence;
  }

  async listHrAbsences(filters: { userId?: string; resellerId?: string; resellerIds?: string[]; isJustified?: boolean; status?: string }): Promise<HrAbsence[]> {
    const conditions = [];
    if (filters.userId) conditions.push(eq(hrAbsences.userId, filters.userId));
    if (filters.resellerIds && filters.resellerIds.length > 0) {
      conditions.push(inArray(hrAbsences.resellerId, filters.resellerIds));
    } else if (filters.resellerId) {
      conditions.push(eq(hrAbsences.resellerId, filters.resellerId));
    }
    if (filters.isJustified !== undefined) conditions.push(eq(hrAbsences.isJustified, filters.isJustified));
    
    return db.select().from(hrAbsences)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(hrAbsences.absenceDate));
  }

  async updateHrAbsence(id: string, updates: Partial<HrAbsence>): Promise<HrAbsence> {
    const [absence] = await db.update(hrAbsences)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(hrAbsences.id, id))
      .returning();
    return absence;
  }

  // Justifications
  async createHrJustification(data: InsertHrJustification): Promise<HrJustification> {
    const [just] = await db.insert(hrJustifications).values(data).returning();
    return just;
  }

  async listHrJustifications(absenceId: string): Promise<HrJustification[]> {
    return db.select().from(hrJustifications)
      .where(eq(hrJustifications.absenceId, absenceId))
      .orderBy(desc(hrJustifications.createdAt));
  }

  async updateHrJustification(id: string, updates: Partial<HrJustification>): Promise<HrJustification> {
    const [just] = await db.update(hrJustifications)
      .set(updates)
      .where(eq(hrJustifications.id, id))
      .returning();
    return just;
  }

  // Expense Reports
  async createHrExpenseReport(data: InsertHrExpenseReport): Promise<HrExpenseReport> {
    const [report] = await db.insert(hrExpenseReports).values(data).returning();
    return report;
  }

  async getHrExpenseReport(id: string): Promise<HrExpenseReport | undefined> {
    const [report] = await db.select().from(hrExpenseReports).where(eq(hrExpenseReports.id, id));
    return report || undefined;
  }

  async listHrExpenseReports(filters: { userId?: string; resellerId?: string; resellerIds?: string[]; status?: string }): Promise<(HrExpenseReport & { user?: { fullName: string } })[]> {
    const conditions = [];
    if (filters.userId) conditions.push(eq(hrExpenseReports.userId, filters.userId));
    if (filters.resellerIds && filters.resellerIds.length > 0) {
      conditions.push(inArray(hrExpenseReports.resellerId, filters.resellerIds));
    } else if (filters.resellerId) {
      conditions.push(eq(hrExpenseReports.resellerId, filters.resellerId));
    }
    if (filters.status) conditions.push(eq(hrExpenseReports.status, filters.status as any));
    
    const results = await db.select({
      report: hrExpenseReports,
      userName: users.fullName
    })
      .from(hrExpenseReports)
      .leftJoin(users, eq(hrExpenseReports.userId, users.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(hrExpenseReports.createdAt));
    
    return results.map(r => ({
      ...r.report,
      user: r.userName ? { fullName: r.userName } : undefined
    }));
  }

  async deleteHrExpenseReport(id: string): Promise<void> {
    await db.delete(hrExpenseReports).where(eq(hrExpenseReports.id, id));
  }

  async updateHrExpenseReport(id: string, updates: Partial<HrExpenseReport>): Promise<HrExpenseReport> {
    const [report] = await db.update(hrExpenseReports)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(hrExpenseReports.id, id))
      .returning();
    return report;
  }

  // Expense Items
  async createHrExpenseItem(data: InsertHrExpenseItem): Promise<HrExpenseItem> {
    const [item] = await db.insert(hrExpenseItems).values(data).returning();
    // Update total amount
    await this.recalculateExpenseTotal(data.expenseReportId);
    return item;
  }

  async listHrExpenseItems(expenseReportId: string): Promise<HrExpenseItem[]> {
    return db.select().from(hrExpenseItems)
      .where(eq(hrExpenseItems.expenseReportId, expenseReportId))
      .orderBy(hrExpenseItems.expenseDate);
  }

  async deleteHrExpenseItem(id: string): Promise<void> {
    const [item] = await db.select().from(hrExpenseItems).where(eq(hrExpenseItems.id, id));
    if (item) {
      await db.delete(hrExpenseItems).where(eq(hrExpenseItems.id, id));
      await this.recalculateExpenseTotal(item.expenseReportId);
    }
  }

  private async recalculateExpenseTotal(reportId: string): Promise<void> {
    const items = await this.listHrExpenseItems(reportId);
    const total = items.reduce((sum, item) => sum + item.amount, 0);
    await db.update(hrExpenseReports)
      .set({ totalAmount: total, updatedAt: new Date() })
      .where(eq(hrExpenseReports.id, reportId));
  }

  // HR Notifications
  async createHrNotification(data: InsertHrNotification): Promise<HrNotification> {
    const [notif] = await db.insert(hrNotifications).values(data).returning();
    return notif;
  }

  async listHrNotifications(filters: { recipientId?: string; resellerId?: string; unreadOnly?: boolean }): Promise<HrNotification[]> {
    const conditions = [];
    if (filters.recipientId) conditions.push(eq(hrNotifications.recipientId, filters.recipientId));
    if (filters.resellerId) conditions.push(eq(hrNotifications.resellerId, filters.resellerId));
    if (filters.unreadOnly) conditions.push(isNull(hrNotifications.readAt));
    
    return db.select().from(hrNotifications)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(hrNotifications.createdAt));
  }

  async markHrNotificationRead(id: string): Promise<HrNotification> {
    const [notif] = await db.update(hrNotifications)
      .set({ readAt: new Date() })
      .where(eq(hrNotifications.id, id))
      .returning();
    return notif;
  }

  // HR Audit Logs
  async createHrAuditLog(data: InsertHrAuditLog): Promise<HrAuditLog> {
    const [log] = await db.insert(hrAuditLogs).values(data).returning();
    return log;
  }

  async listHrAuditLogs(filters: { resellerId?: string; userId?: string; entityType?: string; limit?: number }): Promise<HrAuditLog[]> {
    const conditions = [];
    if (filters.resellerId) conditions.push(eq(hrAuditLogs.resellerId, filters.resellerId));
    if (filters.userId) conditions.push(eq(hrAuditLogs.userId, filters.userId));
    if (filters.entityType) conditions.push(eq(hrAuditLogs.entityType, filters.entityType));
    
    let query = db.select().from(hrAuditLogs)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(hrAuditLogs.createdAt));
    
    if (filters.limit) {
      query = query.limit(filters.limit) as any;
    }
    
    return query;
  }

  // HR Dashboard Stats
  async getHrDashboardStats(resellerId: string): Promise<{
    totalStaff: number;
    presentToday: number;
    onLeave: number;
    pendingRequests: number;
    pendingExpenses: number;
  }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get staff count
    const staff = await db.select().from(users)
      .where(and(
        eq(users.resellerId, resellerId),
        eq(users.role, 'reseller_staff'),
        eq(users.isActive, true)
      ));

    // Get today's clock-ins
    const clockIns = await db.select().from(hrClockEvents)
      .where(and(
        eq(hrClockEvents.resellerId, resellerId),
        eq(hrClockEvents.eventType, 'entrata'),
        gte(hrClockEvents.eventTime, today),
        lt(hrClockEvents.eventTime, tomorrow)
      ));

    // Get approved leaves for today
    const onLeave = await db.select().from(hrLeaveRequests)
      .where(and(
        eq(hrLeaveRequests.resellerId, resellerId),
        eq(hrLeaveRequests.status, 'approved'),
        lte(hrLeaveRequests.startDate, today),
        gte(hrLeaveRequests.endDate, today)
      ));

    // Get pending leave requests
    const pendingLeave = await db.select().from(hrLeaveRequests)
      .where(and(
        eq(hrLeaveRequests.resellerId, resellerId),
        eq(hrLeaveRequests.status, 'pending')
      ));

    // Get pending expense reports
    const pendingExp = await db.select().from(hrExpenseReports)
      .where(and(
        eq(hrExpenseReports.resellerId, resellerId),
        eq(hrExpenseReports.status, 'pending')
      ));

    return {
      totalStaff: staff.length,
      presentToday: clockIns.length,
      onLeave: onLeave.length,
      pendingRequests: pendingLeave.length,
      pendingExpenses: pendingExp.length,
    };
  }

  // Shared Calendar - Get approved absences visible to colleagues
  async getSharedCalendarEvents(resellerId: string, startDate: Date, endDate: Date): Promise<{
    userId: string;
    userName: string;
    type: string;
    startDate: Date;
    endDate: Date;
  }[]> {
    const leaves = await db.select({
      userId: hrLeaveRequests.userId,
      userName: users.fullName,
      type: hrLeaveRequests.leaveType,
      startDate: hrLeaveRequests.startDate,
      endDate: hrLeaveRequests.endDate,
    })
    .from(hrLeaveRequests)
    .innerJoin(users, eq(hrLeaveRequests.userId, users.id))
    .where(and(
      eq(hrLeaveRequests.resellerId, resellerId),
      eq(hrLeaveRequests.status, 'approved'),
      lte(hrLeaveRequests.startDate, endDate),
      gte(hrLeaveRequests.endDate, startDate)
    ));

    return leaves.map(l => ({
      userId: l.userId,
      userName: l.userName || 'Unknown',
      type: l.type,
      startDate: l.startDate,
      endDate: l.endDate,
    }));
  }

  // ==========================================
  // POS (Point of Sale) - Cassa Digitale
  // ==========================================

  // POS Sessions
  async createPosSession(data: InsertPosSession): Promise<PosSession> {
    const [session] = await db.insert(posSessions).values(data).returning();
    return session;
  }

  async getPosSession(id: string): Promise<PosSession | undefined> {
    const [session] = await db.select().from(posSessions).where(eq(posSessions.id, id));
    return session;
  }

  async getOpenPosSession(repairCenterId: string): Promise<PosSession | undefined> {
    const [session] = await db.select().from(posSessions)
      .where(and(
        eq(posSessions.repairCenterId, repairCenterId),
        eq(posSessions.status, 'open')
      ))
      .limit(1);
    return session;
  }

  async getPosSessionsByRepairCenter(repairCenterId: string, limit = 50): Promise<PosSession[]> {
    return db.select().from(posSessions)
      .where(eq(posSessions.repairCenterId, repairCenterId))
      .orderBy(desc(posSessions.openedAt))
      .limit(limit);
  }

  async closePosSession(id: string, closingData: {
    closingCash: number;
    expectedCash: number;
    cashDifference: number;
    closingNotes?: string;
    totalSales: number;
    totalTransactions: number;
    totalCashSales: number;
    totalCardSales: number;
    totalRefunds: number;
  }): Promise<PosSession | undefined> {
    const [session] = await db.update(posSessions)
      .set({
        status: 'closed',
        closedAt: new Date(),
        ...closingData,
        updatedAt: new Date(),
      })
      .where(eq(posSessions.id, id))
      .returning();
    return session;
  }

  async updatePosSessionTotals(sessionId: string, updates: {
    totalSales?: number;
    totalTransactions?: number;
    totalCashSales?: number;
    totalCardSales?: number;
    totalRefunds?: number;
  }): Promise<void> {
    await db.update(posSessions)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(posSessions.id, sessionId));
  }

  // POS Transactions
  async createPosTransaction(data: InsertPosTransaction & { transactionNumber: string }): Promise<PosTransaction> {
    const [transaction] = await db.insert(posTransactions).values(data).returning();
    return transaction;
  }

  async getPosTransaction(id: string): Promise<PosTransaction | undefined> {
    const [transaction] = await db.select().from(posTransactions).where(eq(posTransactions.id, id));
    return transaction;
  }

  async getPosTransactionByNumber(transactionNumber: string): Promise<PosTransaction | undefined> {
    const [transaction] = await db.select().from(posTransactions)
      .where(eq(posTransactions.transactionNumber, transactionNumber));
    return transaction;
  }

  async getPosTransactionsBySession(sessionId: string): Promise<PosTransaction[]> {
    return db.select().from(posTransactions)
      .where(eq(posTransactions.sessionId, sessionId))
      .orderBy(desc(posTransactions.createdAt));
  }

  async getPosTransactionsByRepairCenter(repairCenterId: string, options?: {
    startDate?: Date;
    endDate?: Date;
    status?: PosTransactionStatus;
    limit?: number;
    offset?: number;
  }): Promise<PosTransaction[]> {
    const conditions = [eq(posTransactions.repairCenterId, repairCenterId)];
    
    if (options?.startDate) {
      conditions.push(gte(posTransactions.createdAt, options.startDate));
    }
    if (options?.endDate) {
      conditions.push(lte(posTransactions.createdAt, options.endDate));
    }
    if (options?.status) {
      conditions.push(eq(posTransactions.status, options.status));
    }

    return db.select().from(posTransactions)
      .where(and(...conditions))
      .orderBy(desc(posTransactions.createdAt))
      .limit(options?.limit || 100)
      .offset(options?.offset || 0);
  }

  async updatePosTransactionStatus(id: string, status: PosTransactionStatus, refundData?: {
    refundedAmount?: number;
    refundReason?: string;
    refundedBy?: string;
  }): Promise<PosTransaction | undefined> {
    const updateData: Partial<PosTransaction> = {
      status,
      updatedAt: new Date(),
    };
    
    if (refundData) {
      updateData.refundedAmount = refundData.refundedAmount;
      updateData.refundReason = refundData.refundReason;
      updateData.refundedBy = refundData.refundedBy;
      updateData.refundedAt = new Date();
    }

    const [transaction] = await db.update(posTransactions)
      .set(updateData)
      .where(eq(posTransactions.id, id))
      .returning();
    return transaction;
  }

  async generatePosTransactionNumber(repairCenterId: string): Promise<string> {
    const now = new Date();
    const yymm = `${now.getFullYear().toString().slice(-2)}${(now.getMonth() + 1).toString().padStart(2, '0')}`;
    
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    
    const [result] = await db.select({ count: sql<number>`count(*)` })
      .from(posTransactions)
      .where(and(
        eq(posTransactions.repairCenterId, repairCenterId),
        gte(posTransactions.createdAt, startOfMonth),
        lte(posTransactions.createdAt, endOfMonth)
      ));
    
    const nextNumber = (result?.count || 0) + 1;
    return `POS-${yymm}-${nextNumber.toString().padStart(4, '0')}`;
  }

  // POS Transaction Items
  async createPosTransactionItems(items: InsertPosTransactionItem[]): Promise<PosTransactionItem[]> {
    if (items.length === 0) return [];
    return db.insert(posTransactionItems).values(items).returning();
  }

  async getPosTransactionItems(transactionId: string): Promise<PosTransactionItem[]> {
    return db.select().from(posTransactionItems)
      .where(eq(posTransactionItems.transactionId, transactionId));
  }

  async markPosItemsInventoryDeducted(transactionId: string): Promise<void> {
    await db.update(posTransactionItems)
      .set({ inventoryDeducted: true })
      .where(eq(posTransactionItems.transactionId, transactionId));
  }

  // POS Statistics
  async getPosSessionStats(repairCenterId: string, startDate: Date, endDate: Date): Promise<{
    totalSessions: number;
    totalSales: number;
    totalTransactions: number;
    averagePerTransaction: number;
    cashSales: number;
    cardSales: number;
  }> {
    const sessions = await db.select().from(posSessions)
      .where(and(
        eq(posSessions.repairCenterId, repairCenterId),
        gte(posSessions.openedAt, startDate),
        lte(posSessions.openedAt, endDate)
      ));

    const totalSessions = sessions.length;
    const totalSales = sessions.reduce((sum, s) => sum + (s.totalSales || 0), 0);
    const totalTransactions = sessions.reduce((sum, s) => sum + (s.totalTransactions || 0), 0);
    const cashSales = sessions.reduce((sum, s) => sum + (s.totalCashSales || 0), 0);
    const cardSales = sessions.reduce((sum, s) => sum + (s.totalCardSales || 0), 0);

    return {
      totalSessions,
      totalSales,
      totalTransactions,
      averagePerTransaction: totalTransactions > 0 ? totalSales / totalTransactions : 0,
      cashSales,
      cardSales,
    };
  }

  async getPosDailySummary(repairCenterId: string, date: Date): Promise<{
    date: Date;
    totalSales: number;
    transactionCount: number;
    cashSales: number;
    cardSales: number;
    refunds: number;
    topProducts: { productId: string; productName: string; quantity: number; total: number }[];
  }> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const transactions = await this.getPosTransactionsByRepairCenter(repairCenterId, {
      startDate: startOfDay,
      endDate: endOfDay,
    });

    const completedTransactions = transactions.filter(t => t.status === 'completed');
    const refundedTransactions = transactions.filter(t => 
      t.status === 'refunded' || t.status === 'partial_refund'
    );

    const totalSales = completedTransactions.reduce((sum, t) => sum + t.total, 0);
    const cashSales = completedTransactions
      .filter(t => t.paymentMethod === 'cash')
      .reduce((sum, t) => sum + t.total, 0);
    const cardSales = completedTransactions
      .filter(t => t.paymentMethod === 'card' || t.paymentMethod === 'pos_terminal')
      .reduce((sum, t) => sum + t.total, 0);
    const refunds = refundedTransactions.reduce((sum, t) => sum + (t.refundedAmount || 0), 0);

    // Get top products
    const productMap = new Map<string, { productName: string; quantity: number; total: number }>();
    for (const t of completedTransactions) {
      const items = await this.getPosTransactionItems(t.id);
      for (const item of items) {
        const existing = productMap.get(item.productId);
        if (existing) {
          existing.quantity += item.quantity;
          existing.total += item.totalPrice;
        } else {
          productMap.set(item.productId, {
            productName: item.productName,
            quantity: item.quantity,
            total: item.totalPrice,
          });
        }
      }
    }

    const topProducts = Array.from(productMap.entries())
      .map(([productId, data]) => ({ productId, ...data }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);

    return {
      date,
      totalSales,
      transactionCount: completedTransactions.length,
      cashSales,
      cardSales,
      refunds,
      topProducts,
    };
  }

  // Get all POS sessions for reseller's repair centers
  async getPosSessionsForReseller(resellerId: string, options?: {
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  }): Promise<(PosSession & { repairCenterName: string })[]> {
    const conditions = [eq(repairCenters.resellerId, resellerId)];
    
    if (options?.startDate) {
      conditions.push(gte(posSessions.openedAt, options.startDate));
    }
    if (options?.endDate) {
      conditions.push(lte(posSessions.openedAt, options.endDate));
    }

    const result = await db.select({
      session: posSessions,
      repairCenterName: repairCenters.name,
    })
    .from(posSessions)
    .innerJoin(repairCenters, eq(posSessions.repairCenterId, repairCenters.id))
    .where(and(...conditions))
    .orderBy(desc(posSessions.openedAt))
    .limit(options?.limit || 100);

    return result.map(r => ({
      ...r.session,
      repairCenterName: r.repairCenterName,
    }));
  }

  // Get all POS transactions for admin (global view)
  async getAllPosTransactions(options?: {
    startDate?: Date;
    endDate?: Date;
    status?: PosTransactionStatus;
    limit?: number;
    offset?: number;
  }): Promise<(PosTransaction & { repairCenterName: string })[]> {
    const conditions: SQL[] = [];
    
    if (options?.startDate) {
      conditions.push(gte(posTransactions.createdAt, options.startDate));
    }
    if (options?.endDate) {
      conditions.push(lte(posTransactions.createdAt, options.endDate));
    }
    if (options?.status) {
      conditions.push(eq(posTransactions.status, options.status));
    }

    const result = await db.select({
      transaction: posTransactions,
      repairCenterName: repairCenters.name,
    })
    .from(posTransactions)
    .innerJoin(repairCenters, eq(posTransactions.repairCenterId, repairCenters.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(posTransactions.createdAt))
    .limit(options?.limit || 100)
    .offset(options?.offset || 0);

    return result.map(r => ({
      ...r.transaction,
      repairCenterName: r.repairCenterName,
    }));
  }

  // Get global POS statistics for admin
  async getGlobalPosStats(startDate: Date, endDate: Date): Promise<{
    totalSessions: number;
    totalTransactions: number;
    totalSales: number;
    averagePerTransaction: number;
    byRepairCenter: {
      repairCenterId: string;
      repairCenterName: string;
      totalSales: number;
      transactionCount: number;
    }[];
  }> {
    const sessions = await db.select({
      session: posSessions,
      repairCenterName: repairCenters.name,
    })
    .from(posSessions)
    .innerJoin(repairCenters, eq(posSessions.repairCenterId, repairCenters.id))
    .where(and(
      gte(posSessions.openedAt, startDate),
      lte(posSessions.openedAt, endDate)
    ));

    const totalSessions = sessions.length;
    const totalSales = sessions.reduce((sum, s) => sum + (s.session.totalSales || 0), 0);
    const totalTransactions = sessions.reduce((sum, s) => sum + (s.session.totalTransactions || 0), 0);

    // Group by repair center
    const rcMap = new Map<string, { name: string; totalSales: number; transactionCount: number }>();
    for (const s of sessions) {
      const existing = rcMap.get(s.session.repairCenterId);
      if (existing) {
        existing.totalSales += s.session.totalSales || 0;
        existing.transactionCount += s.session.totalTransactions || 0;
      } else {
        rcMap.set(s.session.repairCenterId, {
          name: s.repairCenterName,
          totalSales: s.session.totalSales || 0,
          transactionCount: s.session.totalTransactions || 0,
        });
      }
    }

    return {
      totalSessions,
      totalTransactions,
      totalSales,
      averagePerTransaction: totalTransactions > 0 ? totalSales / totalTransactions : 0,
      byRepairCenter: Array.from(rcMap.entries()).map(([id, data]) => ({
        repairCenterId: id,
        repairCenterName: data.name,
        totalSales: data.totalSales,
        transactionCount: data.transactionCount,
      })),
    };
  }
}

export const storage = new DatabaseStorage();
