import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { z } from "zod";
import { storage } from "./storage";
import { setupAuth, hashPassword } from "./auth";
import { scrypt, randomBytes, randomUUID } from "crypto";
import { promisify } from "util";
import ExcelJS from "exceljs";
import multer from "multer";
import {
  insertUserSchema, insertRepairCenterSchema, insertProductSchema,
  insertRepairOrderSchema, insertRepairAcceptanceSchema, insertTicketSchema, insertInvoiceSchema,
  updateRepairStatusSchema, updateTicketStatusSchema, createTicketMessageSchema,
  insertInventoryMovementSchema, insertBillingDataSchema, insertChatMessageSchema,
  insertNotificationPreferencesSchema, insertRepairAttachmentSchema, insertRepairDiagnosticsSchema,
  insertRepairQuoteSchema,
  customerWizardSchema,
  createDataRecoveryJobSchema,
  updateDataRecoveryJobSchema,
  createDataRecoveryEventSchema,
  insertExternalLabSchema,
  insertSupplierSchema,
  insertProductSupplierSchema,
  insertSupplierOrderSchema,
  insertSupplierOrderItemSchema,
  insertSupplierReturnSchema,
  insertUtilitySupplierSchema,
  insertUtilityServiceSchema,
  insertUtilityPracticeSchema,
  insertUtilityCommissionSchema,
  insertUtilityCategorySchema,
  insertSupplierReturnItemSchema,
  insertSupplierCommunicationLogSchema,
  insertCustomerBranchSchema,
  insertServiceItemSchema,
  insertServiceItemPriceSchema,
  updateServiceItemSchema,
  updateServiceItemPriceSchema,
  insertRepairCenterAvailabilitySchema,
  insertRepairCenterBlackoutSchema,
  insertDeliveryAppointmentSchema,
  insertDeviceTypeSchema,
  insertDeviceBrandSchema,
  insertDeviceModelSchema,
  type Product
} from "@shared/schema";
import { ObjectStorageService, objectStorageClient, parseObjectPath, signObjectURL } from "./objectStorage";
import { canAccessObject, ObjectPermission } from "./objectAcl";
import { generateAndStoreReturnDocuments, getSignedDownloadUrl, generateTransferDDT, TransferDdtData } from "./services/shippingDocuments";
import { generatePosReceiptPdf } from "./services/posReceipt";
import { calculateRepairPriority } from "./helpers/priorityCalculation";
import { db } from "./db";
import { sql, eq, and, inArray, isNull } from "drizzle-orm";
import { repairAttachments } from "@shared/schema";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

// In-memory Foneday cart cache per reseller (Foneday API doesn't persist cart state)
interface FonedayCartItem {
  sku: string;
  quantity: number;
  title: string;
  price: string;
  note: string | null;
}
const fonedayCartCache = new Map<string, FonedayCartItem[]>();

// In-memory Foneday search cache (API is very slow ~10s per request)
interface FonedayCacheEntry {
  data: any;
  timestamp: number;
}
const fonedaySearchCache = new Map<string, FonedayCacheEntry>();
const FONEDAY_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function getFonedayCacheKey(resellerId: string, search: string, page: number, perPage: number): string {
  return `${resellerId}:${search}:${page}:${perPage}`;
}

function getFonedayFromCache(key: string): any | null {
  const entry = fonedaySearchCache.get(key);
  if (entry && Date.now() - entry.timestamp < FONEDAY_CACHE_TTL) {
    return entry.data;
  }
  if (entry) {
    fonedaySearchCache.delete(key);
  }
  return null;
}

function setFonedayCache(key: string, data: any): void {
  fonedaySearchCache.set(key, { data, timestamp: Date.now() });
}

// Configure multer for file uploads (memory storage)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size
  },
  fileFilter: (req, file, cb) => {
    // Allow images and common document types
    const allowedMimes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images and PDF/DOC files are allowed.'));
    }
  },
});

// Object Storage Service instance
const objectStorage = new ObjectStorageService();

// Middleware to check if user is authenticated
function requireAuth(req: Request, res: Response, next: Function) {
  if (!req.isAuthenticated()) {
    return res.status(401).send("Unauthorized");
  }
  next();
}

// Middleware to check if user has specific role
function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: Function) => {
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).send("Unauthorized");
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).send("Forbidden");
    }
    next();
  };
}

// Middleware to check module-level permissions for reseller_staff users

// Helper function for resolving entity scope for HR endpoints with security validation
interface EntityScopeResult {
  resellerIds: string[];
  userIds?: string[];
  entityType: 'reseller' | 'repair-center';
  isExternalEntity: boolean;
}

async function resolveResellerEntityScope(opts: {
  storage: typeof storage;
  requesterResellerId: string;
  entityType?: string;
  entityId?: string;
}): Promise<EntityScopeResult> {
  const { storage: st, requesterResellerId, entityType, entityId } = opts;
  
  // Default: no entity filter, return all accessible reseller IDs
  if (!entityType || !entityId) {
    const resellerIds = await st.getAccessibleResellerIds(requesterResellerId);
    return { resellerIds, entityType: entityType as 'reseller' | 'repair-center' | 'all', isExternalEntity: false };
  }
  
  const accessibleIds = await st.getAccessibleResellerIds(requesterResellerId);
  
  if (entityType === 'sub-reseller') {
    // Validate sub-reseller is in accessible hierarchy and is not the requester
    if (!accessibleIds.includes(entityId) || entityId === requesterResellerId) {
      throw new Error('FORBIDDEN');
    }
    // Get staff of the sub-reseller + the sub-reseller itself
    const subResellerStaff = await st.listResellerStaff(entityId);
    const userIds = subResellerStaff.map(u => u.id);
    userIds.push(entityId); // Include the sub-reseller owner
    return { 
      resellerIds: [entityId], 
      userIds, 
      entityType: entityType as 'reseller' | 'repair-center' | 'all', 
      isExternalEntity: true 
    };
  }
  
  if (entityType === 'repair-center') {
    const rc = await st.getRepairCenter(entityId);
    if (!rc) {
      throw new Error('NOT_FOUND');
    }
    // Validate repair center belongs to an accessible reseller
    if (!accessibleIds.includes(rc.resellerId)) {
      throw new Error('FORBIDDEN');
    }
    const rcStaff = await st.listRepairCenterStaff(entityId);
    const userIds = rcStaff.map(u => u.id);
    return { 
      resellerIds: [rc.subResellerId || rc.resellerId], 
      userIds, 
      entityType: 'repair-center', 
      isExternalEntity: true 
    };
  }
  
  throw new Error('INVALID_ENTITY_TYPE');
}

// Admin-specific scope resolution - Admin can see ALL entities in the system
interface AdminEntityScopeResult {
  resellerIds: string[];
  userIds?: string[];
  entityType: 'reseller' | 'repair-center' | 'all';
  isGlobalAdminScope: boolean;
  isExternalEntity: boolean;
}

async function resolveAdminEntityScope(opts: {
  storage: typeof storage;
  entityType?: string;
  entityId?: string;
}): Promise<AdminEntityScopeResult> {
  const { storage: st, entityType, entityId } = opts;
  
  // Default: no entity filter, return ALL entities in the system
  if (!entityType || !entityId || entityType === 'all') {
    // Get all resellers (both top-level and sub-resellers)
    const allResellers = await st.getAllResellers();
    const resellerIds = allResellers.map(r => r.id);
    
    // Get all repair center staff
    const allRepairCenters = await st.getAllRepairCenters();
    const userIds: string[] = [...resellerIds]; // Include resellers as users
    
    // Add all reseller staff
    for (const resellerId of resellerIds) {
      const staff = await st.listResellerStaff(resellerId);
      userIds.push(...staff.map(s => s.id));
    }
    
    // Add all repair center staff
    for (const rc of allRepairCenters) {
      const rcStaff = await st.listRepairCenterStaff(rc.id);
      userIds.push(...rcStaff.map(s => s.id));
    }
    
    return { 
      resellerIds, 
      userIds: [...new Set(userIds)], // Deduplicate
      entityType: 'all', 
      isGlobalAdminScope: true,
      isExternalEntity: false 
    };
  }
  
  if (entityType === 'reseller' || entityType === 'sub-reseller') {
    // Admin viewing specific reseller - include complete subordinate hierarchy
    const reseller = await st.getUser(entityId);
    if (!reseller || reseller.role !== 'reseller') {
      throw new Error('NOT_FOUND');
    }
    // Get all accessible reseller IDs in hierarchy (includes entityId + all sub-resellers)
    const accessibleResellerIds = await st.getAccessibleResellerIds(entityId);
    const allResellerIds = [...new Set([entityId, ...accessibleResellerIds])];
    
    // Collect all staff userIds from resellers and their repair centers
    const userIds: string[] = [...allResellerIds]; // Include resellers as users
    for (const rid of allResellerIds) {
      const staff = await st.listResellerStaff(rid);
      userIds.push(...staff.map(s => s.id));
    }
    // Get repair centers for these resellers
    const repairCenters = await st.getRepairCentersByResellerIds(allResellerIds);
    for (const rc of repairCenters) {
      const rcStaff = await st.listRepairCenterStaff(rc.id);
      userIds.push(...rcStaff.map(s => s.id));
    }
    
    return { 
      resellerIds: allResellerIds, 
      userIds: [...new Set(userIds)], 
      entityType: entityType as 'reseller' | 'repair-center' | 'all', 
      isGlobalAdminScope: false,
      isExternalEntity: true 
    };
  }

  if (entityType === 'repair-center') {
    const rc = await st.getRepairCenter(entityId);
    if (!rc) {
      throw new Error('NOT_FOUND');
    }
    const rcStaff = await st.listRepairCenterStaff(entityId);
    const userIds = rcStaff.map(u => u.id);
    return { 
      resellerIds: [rc.subResellerId || rc.resellerId], 
      userIds, 
      entityType: 'repair-center', 
      isGlobalAdminScope: false,
      isExternalEntity: true 
    };
  }
  
  throw new Error('INVALID_ENTITY_TYPE');
}

// For reseller/admin/repair_center users, always allows access (full permissions)
// For reseller_staff users, checks granular permissions in the database
function requireModulePermission(module: string, action: 'read' | 'create' | 'update' | 'delete') {
  return async (req: Request, res: Response, next: Function) => {
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).send("Non autorizzato");
    }
    
    // Reseller, Admin, and Repair Center users have full access
    if (['admin', 'reseller', 'repair_center'].includes(req.user.role)) {
      return next();
    }
    
    // For reseller_staff, check module permissions
    if (req.user.role === 'reseller_staff') {
      console.log(`[Permission Check] User: ${req.user.id}, Module: ${module}, Action: ${action}`);
      const hasPermission = await storage.checkStaffPermission(req.user.id, module, action);
      console.log(`[Permission Check] Result: ${hasPermission}`);
      if (!hasPermission) {
        return res.status(403).send("Non hai i permessi per questa operazione");
      }
      return next();
    }
    
    // Other roles don't have access to reseller routes
    return res.status(403).send("Accesso negato");
  };
}

// Helper to check if a reseller can manage a repair order
// Returns true if the reseller owns the order directly OR owns the customer
async function canResellerManageOrder(resellerId: string, order: any): Promise<boolean> {
  // Direct ownership via order.resellerId
  if (order.resellerId === resellerId) {
    return true;
  }
  // Indirect ownership via customer.resellerId
  if (order.customerId) {
    const customer = await storage.getUser(order.customerId);
    if (customer && customer.resellerId === resellerId) {
      return true;
    }
  }
  return false;
}

// Helper to set entity metadata for activity logging
// Call this in handlers after creating/updating/deleting entities
// Example: setActivityEntity(res, { type: 'users', id: user.id });
function setActivityEntity(res: Response, entity: { type?: string; id?: string }) {
  res.locals.activityEntity = entity;
}

// Middleware for automatic activity logging
async function logActivity(
  userId: string,
  action: string,
  entityType?: string,
  entityId?: string,
  changes?: any,
  req?: Request
) {
  try {
    await storage.createActivityLog({
      userId,
      action,
      entityType: entityType || null,
      entityId: entityId || null,
      changes: changes ? JSON.stringify(changes) : null,
      ipAddress: req?.ip || req?.socket?.remoteAddress || null,
      userAgent: req?.get('user-agent') || null,
    });
  } catch (error) {
    console.error('Failed to log activity:', error);
  }
}

// Route metadata for accurate entity/action logging
// Maps path patterns to entity types for proper logging of nested resources
const ROUTE_ENTITY_MAP: Record<string, string> = {
  // Admin routes
  '/api/admin/users': 'users',
  '/api/admin/repair-centers': 'repair-centers',
  '/api/admin/products': 'products',
  '/api/admin/repairs': 'repairs',
  '/api/admin/tickets': 'tickets',
  '/api/admin/invoices': 'invoices',
  '/api/admin/inventory': 'inventory',
  '/api/admin/chat/messages': 'chat-messages',
  '/api/admin/ticket-messages': 'ticket-messages',
  
  // Reseller routes
  '/api/reseller/repairs': 'repairs',
  '/api/reseller/customers': 'customers',
  
  // Repair Center routes
  '/api/repair-center/repairs': 'repairs',
  '/api/repair-center/inventory': 'inventory',
  
  // Customer routes
  '/api/customer/tickets': 'tickets',
};

// Automatic logging middleware for all mutations
function autoLogMiddleware(req: Request, res: Response, next: Function) {
  // Only log POST, PATCH, DELETE requests
  if (!['POST', 'PATCH', 'DELETE'].includes(req.method)) {
    return next();
  }

  // Skip auth endpoints to avoid logging passwords
  if (req.path.includes('/api/login') || req.path.includes('/api/register')) {
    return next();
  }

  // Skip routes with manual logging (purge has custom PURGE action)
  if (req.path.includes('/purge')) {
    return next();
  }

  // Flag to track if we've already logged this request
  let hasLogged = false;
  let capturedResponseBody: any = null;

  // Wrap res.json and res.send to capture response body (needed for CREATE entity IDs)
  const originalJson = res.json.bind(res);
  const originalSend = res.send.bind(res);

  res.json = function (body: any) {
    capturedResponseBody = body;
    // Call performLogging immediately with body available
    setImmediate(() => performLogging());
    return originalJson(body);
  };

  res.send = function (body: any) {
    try {
      capturedResponseBody = JSON.parse(body);
    } catch {
      capturedResponseBody = body;
    }
    // Call performLogging immediately with body available
    setImmediate(() => performLogging());
    return originalSend(body);
  };

  // Helper to extract entity type from path using metadata map
  const extractEntityType = (path: string): string | null => {
    // Try exact match first
    for (const [pattern, entity] of Object.entries(ROUTE_ENTITY_MAP)) {
      if (path.startsWith(pattern)) {
        // Handle both /api/admin/users and /api/admin/users/:id
        const remainder = path.slice(pattern.length);
        if (remainder === '' || remainder.startsWith('/')) {
          return entity;
        }
      }
    }
    
    // Fallback to path parsing for routes not in map
    const pathParts = path.split('/').filter(Boolean);
    if (pathParts.length >= 3) {
      const entity = pathParts[2];
      if (entity && !entity.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
        return entity;
      }
    }
    
    return null;
  };

  const performLogging = () => {
    if (hasLogged) return;
    
    // Only log successful mutations (2xx status codes)
    if (res.statusCode >= 200 && res.statusCode < 300 && req.isAuthenticated() && req.user) {
      const action = req.method === 'POST' ? 'CREATE' : req.method === 'PATCH' ? 'UPDATE' : 'DELETE';
      
      // Priority 1: Read from res.locals if handler set explicit metadata
      let entityType = res.locals.activityEntity?.type;
      let entityId = res.locals.activityEntity?.id;
      
      // Priority 2: Extract from path if not set by handler
      if (!entityType) {
        entityType = extractEntityType(req.path);
      }
      
      // Priority 3: Extract entity ID from various sources if not set by handler
      if (!entityId) {
        entityId = req.params.id; // For PATCH/DELETE with :id in path
        
        // For CREATE (POST), try to get ID from response body
        if (!entityId && capturedResponseBody && typeof capturedResponseBody === 'object') {
          entityId = capturedResponseBody.id;
        }
        
        // Fallback to request body ID (rare case)
        if (!entityId && req.body && typeof req.body === 'object') {
          entityId = req.body.id;
        }
      }

      if (entityType) {
        hasLogged = true;
        setImmediate(() => {
          logActivity(
            (req.user as any).id,
            action,
            entityType,
            entityId,
            { method: req.method, path: req.path },
            req
          );
        });
      }
    }
  };

  // Listen for response finish event to catch all response types
  res.on('finish', () => {
    performLogging();
  });

  next();
}


// Helper function to auto-sync work profile from repair center opening hours
async function autoSyncWorkProfileFromRepairCenter(repairCenterId: string, openingHours: any, resellerId: string | null): Promise<void> {
  if (!openingHours || !resellerId) return;
  
  try {
    const dayMapping: Record<string, number> = {
      'sunday': 0, 'monday': 1, 'tuesday': 2, 'wednesday': 3,
      'thursday': 4, 'friday': 5, 'saturday': 6
    };
    
    const workDays: number[] = [];
    let startTime = "09:00";
    let endTime = "18:00";
    let breakMinutes = 60;
    
    Object.entries(openingHours as Record<string, { isOpen: boolean; start?: string; end?: string; breakStart?: string | null; breakEnd?: string | null }>).forEach(([day, config]) => {
      if (config.isOpen) {
        workDays.push(dayMapping[day.toLowerCase()]);
        if (config.start) startTime = config.start;
        if (config.end) endTime = config.end;
        if (config.breakStart && config.breakEnd) {
          const [bsH, bsM] = config.breakStart.split(':').map(Number);
          const [beH, beM] = config.breakEnd.split(':').map(Number);
          breakMinutes = (beH * 60 + beM) - (bsH * 60 + bsM);
        }
      }
    });
    
    workDays.sort((a, b) => a - b);
    
    const [startH, startM] = startTime.split(':').map(Number);
    const [endH, endM] = endTime.split(':').map(Number);
    const totalMinutes = (endH * 60 + endM) - (startH * 60 + startM) - breakMinutes;
    const dailyHours = Math.round(totalMinutes / 60 * 10) / 10;
    const weeklyHours = dailyHours * workDays.length;
    
    const repairCenter = await storage.getRepairCenter(repairCenterId);
    if (!repairCenter) return;
    
    const existingProfiles = await storage.listHrWorkProfiles(resellerId);
    const existingProfile = existingProfiles.find(p => 
      p.sourceType === 'repair_center' && p.sourceEntityId === repairCenterId && !p.autoSyncDisabled
    );
    
    const profileData = {
      resellerId,
      name: `Orario ${repairCenter.name}`,
      description: `Profilo sincronizzato automaticamente da ${repairCenter.name}`,
      weeklyHours,
      dailyHours,
      workDays,
      startTime,
      endTime,
      breakMinutes,
      sourceType: 'repair_center',
      sourceEntityId: repairCenterId,
      isSynced: true,
      lastSyncedAt: new Date(),
      isActive: true
    };
    
    if (existingProfile) {
      await storage.updateHrWorkProfile(existingProfile.id, profileData);
    } else {
      await storage.createHrWorkProfile(profileData);
    }
  } catch (error) {
    console.error('Auto-sync work profile failed:', error);
  }
}

export function registerRoutes(app: Express): Server {
  // Setup authentication routes
  setupAuth(app);

  // Apply automatic logging middleware to all routes
  app.use(autoLogMiddleware);

  // Serve product images and other objects from private storage
  app.get("/objects/*", async (req, res) => {
    try {
      const objectPath = req.params[0];
      if (!objectPath) {
        return res.status(400).send("Missing object path");
      }
      
      const privateObjectDir = objectStorage.getPrivateObjectDir();
      const fullPath = `${privateObjectDir}/${objectPath}`;
      const { bucketName, objectName } = parseObjectPath(fullPath);
      const bucket = objectStorageClient.bucket(bucketName);
      const file = bucket.file(objectName);
      
      const [exists] = await file.exists();
      if (!exists) {
        return res.status(404).send("File not found");
      }
      
      const [metadata] = await file.getMetadata();
      res.setHeader("Content-Type", metadata.contentType || "application/octet-stream");
      res.setHeader("Cache-Control", "public, max-age=86400");
      
      const [fileContents] = await file.download();
      res.send(fileContents);
    } catch (error: any) {
      console.error("Error serving object:", error);
      res.status(500).send("Error retrieving file");
    }
  });

  // Sign object storage URL for frontend access
  app.get("/api/object-storage/sign-url", requireAuth, async (req, res) => {
    try {
      const path = req.query.path as string;
      const method = (req.query.method as string) || "GET";
      
      if (!path) {
        return res.status(400).json({ error: "Missing path parameter" });
      }
      
      // Parse the path to get bucket and object name
      const { bucketName, objectName } = parseObjectPath(path);
      
      // Generate signed URL
      const signedUrl = await signObjectURL({
        bucketName,
        objectName,
        method: method as "GET" | "PUT" | "DELETE" | "HEAD",
        ttlSec: 3600, // 1 hour
      });
      
      res.json({ signedUrl });
    } catch (error: any) {
      console.error("Error signing object URL:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // ============ ADMIN ROUTES ============
  
  // Admin Settings - Hourly Rate
  app.get("/api/admin/settings/hourly-rate", requireRole("admin"), async (req, res) => {
    try {
      const setting = await storage.getAdminSetting("hourly_rate");
      if (!setting) {
        return res.json({ hourlyRateCents: 3500, description: "Tariffa oraria manodopera predefinita" });
      }
      res.json({
        hourlyRateCents: parseInt(setting.settingValue),
        description: setting.description,
        updatedAt: setting.updatedAt,
      });
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  app.patch("/api/admin/settings/hourly-rate", requireRole("admin"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      const { hourlyRateCents, description } = req.body;
      
      if (typeof hourlyRateCents !== "number" || hourlyRateCents < 0) {
        return res.status(400).send("La tariffa oraria deve essere un numero positivo");
      }
      
      const setting = await storage.setAdminSetting(
        "hourly_rate",
        hourlyRateCents.toString(),
        description ?? "Tariffa oraria manodopera in centesimi",
        req.user.id
      );
      
      res.json({
        hourlyRateCents: parseInt(setting.settingValue),
        description: setting.description,
        updatedAt: setting.updatedAt,
      });
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // Public endpoint to get hourly rate for quote calculation (authenticated users only)
  app.get("/api/settings/hourly-rate", requireAuth, async (req, res) => {
    try {
      const setting = await storage.getAdminSetting("hourly_rate");
      res.json({
        hourlyRateCents: setting ? parseInt(setting.settingValue) : 3500,
      });
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // Backfill missing warehouses for resellers
  app.post("/api/admin/backfill-reseller-warehouses", requireRole("admin"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      // Get all resellers
      const allUsers = await storage.listUsers();
      const resellers = allUsers.filter(u => u.role === 'reseller' && u.isActive);
      
      const results = {
        total: resellers.length,
        created: 0,
        existing: 0,
        errors: [] as string[],
      };
      
      for (const reseller of resellers) {
        try {
          // Check if warehouse already exists
          const existingWarehouse = await storage.getWarehouseByOwner('reseller', reseller.id);
          if (existingWarehouse) {
            results.existing++;
          } else {
            // Create warehouse
            await storage.ensureDefaultWarehouse('reseller', reseller.id, reseller.fullName || reseller.username);
            results.created++;
            console.log(`[WAREHOUSE BACKFILL] Created warehouse for reseller: ${reseller.id} (${reseller.fullName || reseller.username})`);
          }
        } catch (err: any) {
          results.errors.push(`${reseller.id}: ${err.message}`);
          console.error(`[WAREHOUSE BACKFILL] Error for reseller ${reseller.id}:`, err);
        }
      }
      
      res.json({
        message: `Backfill completato: ${results.created} magazzini creati, ${results.existing} già esistenti`,
        ...results,
      });
    } catch (error: any) {
      console.error("[WAREHOUSE BACKFILL] Error:", error);
      res.status(500).send(error.message);
    }
  });

  // ==========================================
  // SERVICE CATALOG (CATALOGO INTERVENTI) - Admin Only
  // ==========================================
  
  // List all service items
  app.get("/api/admin/service-items", requireRole("admin"), async (req, res) => {
    try {
      const items = await storage.listServiceItems();
      res.json(items);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // Get single service item
  app.get("/api/admin/service-items/:id", requireRole("admin"), async (req, res) => {
    try {
      const item = await storage.getServiceItem(req.params.id);
      if (!item) {
        return res.status(404).send("Intervento non trovato");
      }
      res.json(item);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // Create service item
  app.post("/api/admin/service-items", requireRole("admin"), async (req, res) => {
    try {
      const validatedData = insertServiceItemSchema.parse(req.body);
      const item = await storage.createServiceItem(validatedData);
      res.status(201).json(item);
    } catch (error: any) {
      res.status(400).send(error.message);
    }
  });

  // Update service item
  app.patch("/api/admin/service-items/:id", requireRole("admin"), async (req, res) => {
    try {
      const validatedData = updateServiceItemSchema.parse(req.body);
      const item = await storage.updateServiceItem(req.params.id, validatedData);
      res.json(item);
    } catch (error: any) {
      res.status(400).send(error.message);
    }
  });

  // Delete service item
  app.delete("/api/admin/service-items/:id", requireRole("admin"), async (req, res) => {
    try {
      await storage.deleteServiceItem(req.params.id);
      res.sendStatus(204);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // ==========================================
  // SERVICE ITEM PRICES (LISTINI PREZZI) - Admin Only
  // ==========================================
  
  // List prices for a service item
  app.get("/api/admin/service-items/:id/prices", requireRole("admin"), async (req, res) => {
    try {
      const prices = await storage.listServiceItemPrices(req.params.id);
      res.json(prices);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // Create custom price for reseller or repair center
  app.post("/api/admin/service-item-prices", requireRole("admin"), async (req, res) => {
    try {
      const validatedData = insertServiceItemPriceSchema.parse(req.body);
      const price = await storage.createServiceItemPrice(validatedData);
      res.status(201).json(price);
    } catch (error: any) {
      res.status(400).send(error.message);
    }
  });

  // Update custom price
  app.patch("/api/admin/service-item-prices/:id", requireRole("admin"), async (req, res) => {
    try {
      const validatedData = updateServiceItemPriceSchema.parse(req.body);
      const price = await storage.updateServiceItemPrice(req.params.id, validatedData);
      res.json(price);
    } catch (error: any) {
      res.status(400).send(error.message);
    }
  });

  // Delete custom price
  app.delete("/api/admin/service-item-prices/:id", requireRole("admin"), async (req, res) => {
    try {
      await storage.deleteServiceItemPrice(req.params.id);
      res.sendStatus(204);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // ==========================================
  // PUBLIC TRACKING ENDPOINT (no auth required)
  // ==========================================
  
  // Public tracking page - returns limited repair info by order number
  app.get("/api/public/track/:orderNumber", async (req, res) => {
    try {
      const { orderNumber } = req.params;
      
      // Find repair order by order number
      const allOrders = await storage.listRepairOrders();
      const repair = allOrders.find(r => r.orderNumber === orderNumber);
      
      if (!repair) {
        return res.status(404).json({ error: "Riparazione non trovata" });
      }
      
      // Return only public-safe information (no customer details, no internal notes)
      res.json({
        orderNumber: repair.orderNumber,
        status: repair.status,
        deviceBrand: repair.deviceBrand,
        deviceModel: repair.deviceModel,
        deviceColor: repair.deviceColor,
        problemDescription: repair.problemDescription,
        createdAt: repair.createdAt,
        ingressatoAt: repair.ingressatoAt,
        estimatedCompletionDate: repair.estimatedCompletionDate,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ==========================================
  // PUBLIC SERVICE CATALOG ENDPOINTS (for Quote creation)
  // ==========================================
  
  // Get available service items with effective prices for current user context
  // Supports optional search and limit query params
  app.get("/api/service-items", requireAuth, async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      const search = req.query.search as string | undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      
      const items = await storage.listServiceItems();
      let activeItems = items.filter(item => item.isActive);
      
      // Filter by search term if provided (case-insensitive on name, code, category)
      if (search && search.trim()) {
        const searchLower = search.toLowerCase().trim();
        activeItems = activeItems.filter(item => 
          item.name.toLowerCase().includes(searchLower) ||
          item.code.toLowerCase().includes(searchLower) ||
          (item.category && item.category.toLowerCase().includes(searchLower))
        );
      }
      
      // Apply limit if provided
      if (limit && limit > 0) {
        activeItems = activeItems.slice(0, limit);
      }
      
      // Get effective prices based on user role
      const resellerId = req.user.role === 'reseller' ? req.user.id : 
                         (req.query.resellerId as string) || undefined;
      const repairCenterId = req.user.role === 'repair_center' ? req.user.repairCenterId : 
                             (req.query.repairCenterId as string) || undefined;
      
      const itemsWithPrices = await Promise.all(activeItems.map(async (item) => {
        const effectivePrice = await storage.getEffectiveServicePrice(
          item.id, 
          resellerId, 
          repairCenterId || undefined
        );
        return {
          isOwned: item.repairCenterId === repairCenterId,
          ...item,
          effectivePriceCents: effectivePrice.priceCents,
          effectiveLaborMinutes: effectivePrice.laborMinutes,
          priceSource: effectivePrice.source
        };
      }));
      
      res.json(itemsWithPrices);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });


  // Get service items filtered by device type, brand, and model (for repair wizard)
  app.get("/api/service-items/by-device", requireAuth, async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      // Check staff permission for services:read
      if (req.user.role === 'reseller_staff' || req.user.role === 'reseller_collaborator') {
        const hasPermission = await storage.checkStaffPermission(req.user.id, 'services', 'read');
        if (!hasPermission) {
          return res.status(403).send("Non hai il permesso di visualizzare i servizi");
        }
      }
      
      let { deviceTypeId, brandId, modelId, search, limit } = req.query;
      const limitNum = Math.min(parseInt(limit as string) || 50, 100);
      
      // If modelId is provided, resolve brandId and typeId from the model
      if (modelId && (!brandId || !deviceTypeId)) {
        const model = await storage.getDeviceModel(modelId as string);
        if (model) {
          if (!brandId && model.brandId) {
            brandId = model.brandId;
          }
          if (!deviceTypeId && model.typeId) {
            deviceTypeId = model.typeId;
          }
        }
      }
      
      // Determine user context
      let resellerId: string | undefined;
      let parentResellerId: string | undefined;
      let repairCenterId: string | undefined;
      const isAdmin = req.user.role === 'admin';
      
      if (req.user.role === 'reseller' || req.user.role === 'sub_reseller') {
        resellerId = req.user.id;
        // Sub-resellers should also see parent reseller's services
        if (req.user.role === 'sub_reseller' && req.user.parentResellerId) {
          parentResellerId = req.user.parentResellerId;
        }
      } else if (req.user.role === 'reseller_staff' || req.user.role === 'reseller_collaborator') {
        resellerId = (req.user as any).resellerId;
      } else if (req.user.role === 'repair_center') {
        repairCenterId = req.user.repairCenterId;
      }
      
      // Use DB-level filtering
      const filteredItems = await storage.getServiceItemsFiltered({
        resellerId,
        parentResellerId,
        repairCenterId,
        isAdmin,
        deviceTypeId: deviceTypeId as string | undefined,
        brandId: brandId as string | undefined,
        modelId: modelId as string | undefined,
        search: search as string | undefined,
        limit: limitNum,
      });
      
      // Include prices for the user
      const itemsWithPrices = await Promise.all(filteredItems.map(async (item) => {
        const price = await storage.getEffectiveServicePrice(item.id, resellerId, repairCenterId);
        return {
          ...item,
          effectivePriceCents: price.priceCents,
          effectiveLaborMinutes: price.laborMinutes,
          priceSource: price.source,
        };
      }));
      
      res.json(itemsWithPrices);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // Get effective price for a specific service item (used in quote creation)
  app.get("/api/service-items/:id/price", requireAuth, async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      const resellerId = req.user.role === 'reseller' ? req.user.id : 
                         (req.query.resellerId as string) || undefined;
      const repairCenterId = req.user.role === 'repair_center' ? req.user.repairCenterId : 
                             (req.query.repairCenterId as string) || undefined;
      
      const effectivePrice = await storage.getEffectiveServicePrice(
        req.params.id,
        resellerId,
        repairCenterId || undefined
      );
      
      res.json(effectivePrice);
    } catch (error: any) {
      res.status(400).send(error.message);
    }
  });

  // ==========================================
  // RESELLER SERVICE CATALOG ENDPOINTS
  // ==========================================

  // Get service catalog with reseller's custom prices
  app.get("/api/reseller/service-catalog", requireRole("reseller", "reseller_staff"), requireModulePermission("services", "read"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      const items = await storage.listServiceItems();
      
      // Get reseller's repair centers first (needed for filtering)
      const repairCenters = await storage.listRepairCenters();
      const myRepairCenters = repairCenters.filter(rc => rc.resellerId === req.user!.id);
      
      // Include: global items (no owner) + reseller items + items owned by reseller's repair centers
      const activeItems = items.filter(item => 
        item.isActive && (
          (!item.resellerId && !item.repairCenterId) || // Global items
          item.resellerId === req.user!.id || // Reseller own items
          myRepairCenters.some(rc => rc.id === item.repairCenterId) // Repair center items
        )
      );

      // Get all custom prices for this reseller
      const resellerPrices = await storage.listServiceItemPricesByReseller(req.user.id);
      
      // Get custom prices for each repair center
      const centerPricesMap: { [centerId: string]: any[] } = {};
      for (const center of myRepairCenters) {
        centerPricesMap[center.id] = await storage.listServiceItemPricesByRepairCenter(center.id);
      }
      
      const itemsWithPrices = activeItems.map(item => {
        const resellerPrice = resellerPrices.find(p => p.serviceItemId === item.id);
        const centerPrices: { [centerId: string]: any } = {};
        
        for (const center of myRepairCenters) {
          const centerPrice = centerPricesMap[center.id]?.find(p => p.serviceItemId === item.id);
          if (centerPrice) {
            centerPrices[center.id] = centerPrice;
          }
        }
        
        return {
          isOwned: !!item.repairCenterId && myRepairCenters.some(rc => rc.id === item.repairCenterId),
          ...item,
          resellerPrice: resellerPrice || null,
          centerPrices,
        };
      });
      
      res.json({
        items: itemsWithPrices,
        repairCenters: myRepairCenters,
      });
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });
  // Create/Update reseller custom price
  app.post("/api/reseller/service-item-prices", requireRole("reseller", "reseller_staff"), requireModulePermission("services", "create"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      const { serviceItemId, priceCents, laborMinutes, repairCenterId } = req.body;
      
      // If repairCenterId is provided, verify it belongs to this reseller
      if (repairCenterId) {
        const center = await storage.getRepairCenter(repairCenterId);
        if (!center || center.resellerId !== req.user.id) {
          return res.status(403).send("This repair center does not belong to you");
        }
      }
      
      // Check if price already exists
      let existingPrice;
      if (repairCenterId) {
        const centerPrices = await storage.listServiceItemPricesByRepairCenter(repairCenterId);
        existingPrice = centerPrices.find(p => p.serviceItemId === serviceItemId);
      } else {
        const resellerPrices = await storage.listServiceItemPricesByReseller(req.user.id);
        existingPrice = resellerPrices.find(p => p.serviceItemId === serviceItemId);
      }
      
      if (existingPrice) {
        // Double-check ownership before update
        if (repairCenterId) {
          if (existingPrice.repairCenterId !== repairCenterId) {
            return res.status(403).send("Price record does not match repair center");
          }
        } else {
          if (existingPrice.resellerId !== req.user.id) {
            return res.status(403).send("Price record does not belong to you");
          }
        }
        
        // Update existing
        const updated = await storage.updateServiceItemPrice(existingPrice.id, {
          priceCents,
          laborMinutes: laborMinutes || null,
        });
        res.json(updated);
      } else {
        // Create new
        const created = await storage.createServiceItemPrice({
          serviceItemId,
          resellerId: repairCenterId ? null : req.user.id,
          repairCenterId: repairCenterId || null,
          priceCents,
          laborMinutes: laborMinutes || null,
          isActive: true,
        });
        res.status(201).json(created);
      }
    } catch (error: any) {
      res.status(400).send(error.message);
    }
  });

  // Delete reseller custom price
  app.delete("/api/reseller/service-item-prices/:id", requireRole("reseller", "reseller_staff"), requireModulePermission("services", "delete"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      // First, get the price record to check ownership
      const priceToDelete = await storage.getServiceItemPrice(req.params.id);
      if (!priceToDelete) {
        return res.status(404).send("Price not found");
      }
      
      // Check ownership based on whether it's a reseller or center price
      if (priceToDelete.resellerId) {
        // It's a reseller-level price - verify it belongs to this reseller
        if (priceToDelete.resellerId !== req.user.id) {
          return res.status(403).send("This price does not belong to you");
        }
      } else if (priceToDelete.repairCenterId) {
        // It's a center-level price - verify the center belongs to this reseller
        const center = await storage.getRepairCenter(priceToDelete.repairCenterId);
        if (!center || center.resellerId !== req.user.id) {
          return res.status(403).send("This price does not belong to your repair centers");
        }
      } else {
        // Neither resellerId nor repairCenterId - shouldn't happen, but deny access
        return res.status(403).send("Invalid price record");
      }
      
      await storage.deleteServiceItemPrice(req.params.id);
      res.sendStatus(204);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // ==========================================
  // RESELLER SERVICE ITEMS (Interventi personalizzati)
  // ==========================================

  // List reseller's own service items
  app.get("/api/reseller/service-items", requireRole("reseller", "reseller_staff"), requireModulePermission("services", "read"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      const allItems = await storage.listServiceItems();
      // Filter only items created by this reseller
      const myItems = allItems.filter(item => item.createdBy === req.user!.id);
      
      res.json(myItems);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // Create new service item for reseller
  app.post("/api/reseller/service-items", requireRole("reseller", "reseller_staff"), requireModulePermission("services", "create"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      const { code, name, description, category, deviceTypeId, brandId, modelId, defaultPriceCents, defaultLaborMinutes } = req.body;
      
      if (!code || !name || !category || defaultPriceCents === undefined) {
        return res.status(400).send("Code, name, category, and defaultPriceCents are required");
      }
      
      const created = await storage.createServiceItem({
        code,
        name,
        description: description || null,
        category,
        deviceTypeId: deviceTypeId || null,
        brandId: brandId || null,
        modelId: modelId || null,
        defaultPriceCents,
        defaultLaborMinutes: defaultLaborMinutes || 60,
        createdBy: req.user.id,
        isActive: true,
      });
      
      res.status(201).json(created);
    } catch (error: any) {
      if (error.message?.includes("duplicate key") || error.message?.includes("unique constraint")) {
        return res.status(400).send("Un intervento con questo codice esiste già");
      }
      res.status(500).send(error.message);
    }
  });

  // Update reseller's service item
  app.patch("/api/reseller/service-items/:id", requireRole("reseller", "reseller_staff"), requireModulePermission("services", "update"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      // Get item and verify ownership
      const item = await storage.getServiceItem(req.params.id);
      if (!item) {
        return res.status(404).send("Intervento non trovato");
      }
      
      if (item.createdBy !== req.user.id) {
        return res.status(403).send("Non puoi modificare questo intervento");
      }
      
      const { code, name, description, category, deviceTypeId, brandId, modelId, defaultPriceCents, defaultLaborMinutes, isActive } = req.body;
      
      const updated = await storage.updateServiceItem(req.params.id, {
        ...(code !== undefined && { code }),
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(category !== undefined && { category }),
        ...(deviceTypeId !== undefined && { deviceTypeId }),
        ...(brandId !== undefined && { brandId }),
        ...(modelId !== undefined && { modelId }),
        ...(defaultPriceCents !== undefined && { defaultPriceCents }),
        ...(defaultLaborMinutes !== undefined && { defaultLaborMinutes }),
        ...(isActive !== undefined && { isActive }),
      });
      
      res.json(updated);
    } catch (error: any) {
      if (error.message?.includes("duplicate key") || error.message?.includes("unique constraint")) {
        return res.status(400).send("Un intervento con questo codice esiste già");
      }
      res.status(500).send(error.message);
    }
  });

  // Delete reseller's service item
  app.delete("/api/reseller/service-items/:id", requireRole("reseller", "reseller_staff"), requireModulePermission("services", "delete"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      // Get item and verify ownership
      const item = await storage.getServiceItem(req.params.id);
      if (!item) {
        return res.status(404).send("Intervento non trovato");
      }
      
      if (item.createdBy !== req.user.id) {
        return res.status(403).send("Non puoi eliminare questo intervento");
      }
      
      await storage.deleteServiceItem(req.params.id);
      res.sendStatus(204);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // SLA Thresholds - Get
  app.get("/api/admin/settings/sla-thresholds", requireRole("admin"), async (req, res) => {
    try {
      const thresholds = await storage.getSlaThresholds();
      res.json(thresholds);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // SLA Thresholds - Update
  app.put("/api/admin/settings/sla-thresholds", requireRole("admin"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      const thresholds = req.body;
      await storage.updateSlaThresholds(thresholds, req.user.id);
      
      const updated = await storage.getSlaThresholds();
      res.json(updated);
    } catch (error: any) {
      res.status(400).send(error.message);
    }
  });

  // SLA Helper - Calculate severity based on time in state
  app.get("/api/sla/severity", requireAuth, async (req, res) => {
    try {
      const { status, enteredAt } = req.query;
      
      if (!status || !enteredAt) {
        return res.status(400).send("status and enteredAt are required");
      }
      
      const thresholds = await storage.getSlaThresholds();
      const statusKey = status as string;
      
      // Get threshold for this status
      const threshold = (thresholds as any)[statusKey];
      if (!threshold) {
        return res.json({ severity: "in_time", hoursInState: 0 });
      }
      
      const now = new Date();
      const entered = new Date(enteredAt as string);
      const hoursInState = (now.getTime() - entered.getTime()) / (1000 * 60 * 60);
      
      let severity: "in_time" | "late" | "urgent" = "in_time";
      if (hoursInState >= threshold.critical) {
        severity = "urgent";
      } else if (hoursInState >= threshold.warning) {
        severity = "late";
      }
      
      res.json({ severity, hoursInState: Math.round(hoursInState * 10) / 10 });
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // Repair Order State History - List
  app.get("/api/repairs/:id/state-history", requireAuth, async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      const repair = await storage.getRepairOrder(req.params.id);
      if (!repair) {
        return res.status(404).send("Repair order not found");
      }
      
      // RBAC for viewing state history
      if (req.user.role === 'customer') {
        if (repair.customerId !== req.user.id) {
          return res.status(403).send("Access denied");
        }
      } else if (req.user.role === 'reseller' || req.user.role === 'sub_reseller') {
        const canManage = await canResellerManageOrder(req.user.id, repair);
        if (!canManage) {
          return res.status(403).send("Access denied");
        }
      } else if (req.user.role === 'repair_center') {
        if (repair.repairCenterId !== req.user.repairCenterId) {
          return res.status(403).send("Access denied");
        }
      }
      // Admin has full access
      
      const history = await storage.listRepairOrderStateHistory(req.params.id);
      res.json(history);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // Repair Order Current SLA State
  app.get("/api/repairs/:id/sla-state", requireAuth, async (req, res) => {
    try {
      const repair = await storage.getRepairOrder(req.params.id);
      if (!repair) {
        return res.status(404).send("Repair order not found");
      }
      
      const currentState = await storage.getCurrentRepairOrderState(req.params.id);
      const stateEnteredAt = currentState?.enteredAt || repair.createdAt;
      
      res.json({
        status: repair.status,
        stateEnteredAt: stateEnteredAt.toISOString(),
        currentState: currentState || null
      });
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // Suggested Accessories for Repair (when status is pronto_ritiro)
  app.get("/api/repairs/:id/suggested-accessories", requireAuth, requireRole("admin", "reseller", "reseller_staff", "repair_center"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      const repair = await storage.getRepairOrder(req.params.id);
      if (!repair) {
        return res.status(404).send("Repair order not found");
      }
      
      // Verify ownership based on role
      if (req.user.role === 'reseller' || req.user.role === 'reseller_staff') {
        const resellerId = req.user.role === 'reseller' ? req.user.id : req.user.resellerId;
        if (repair.resellerId !== resellerId) {
          // Also check if customer belongs to this reseller
          const customer = await storage.getUser(repair.customerId);
          if (!customer || customer.resellerId !== resellerId) {
            return res.status(403).send("Access denied");
          }
        }
      } else if (req.user.role === 'repair_center') {
        if (repair.repairCenterId !== req.user.repairCenterId) {
          return res.status(403).send("Access denied");
        }
      }
      
      // Only suggest accessories when repair is ready for pickup
      if (repair.status !== "pronto_ritiro") {
        return res.json([]);
      }
      
      // Get device brand from model if we have deviceModelId, otherwise try to find by brand name
      let deviceBrandId: string | undefined;
      let deviceModelId: string | null = repair.deviceModelId || null;
      
      if (repair.deviceModelId) {
        const model = await storage.getDeviceModel(repair.deviceModelId);
        deviceBrandId = model?.brandId || undefined;
      } else if (repair.brand) {
        // Fallback: try to find brand by name (case-insensitive)
        const allBrands = await storage.listDeviceBrands();
        const matchingBrand = allBrands.find(b => 
          b.name.toLowerCase() === repair.brand?.toLowerCase()
        );
        if (matchingBrand) {
          deviceBrandId = matchingBrand.id;
          
          // Also try to find model by name if we have the brand
          if (repair.deviceModel) {
            const allModels = await storage.listDeviceModels(matchingBrand.id);
            const matchingModel = allModels.find(m => 
              m.name.toLowerCase() === repair.deviceModel?.toLowerCase()
            );
            if (matchingModel) {
              deviceModelId = matchingModel.id;
            }
          }
        }
      }
      
      // Get compatible accessories
      const accessories = await storage.listAccessoriesCompatibleWithDevice(
        deviceModelId,
        deviceBrandId
      );
      
      res.json(accessories);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // Supplier Return State History - List
  app.get("/api/supplier-returns/:id/state-history", requireAuth, async (req, res) => {
    try {
      const history = await storage.listSupplierReturnStateHistory(req.params.id);
      res.json(history);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // Admin Stats
  app.get("/api/admin/stats", requireRole("admin"), async (req, res) => {
    try {
      const users = await storage.listUsers();
      const centers = await storage.listRepairCenters();
      const repairs = await storage.listRepairOrders();
      const tickets = await storage.listTickets();
      const invoices = await storage.listInvoices();

      const stats = {
        totalUsers: users.length,
        totalRepairCenters: centers.filter(c => c.isActive).length,
        activeRepairs: repairs.filter(r => r.status === "in_progress" || r.status === "pending").length,
        openTickets: tickets.filter(t => t.status === "open").length,
        pendingInvoices: invoices.filter(i => i.paymentStatus === "pending").length,
        monthlyRevenue: invoices
          .filter(i => i.paymentStatus === "paid")
          .reduce((sum, inv) => sum + inv.total, 0),
      };

      res.json(stats);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // Activity Logs
  app.get("/api/admin/activity-logs", requireRole("admin"), async (req, res) => {
    try {
      const { userId, action, entityType, startDate, endDate, limit } = req.query;
      const logs = await storage.listActivityLogs({
        userId: userId as string | undefined,
        action: action as string | undefined,
        entityType: entityType as string | undefined,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
        limit: limit ? parseInt(limit as string) : 100,
      });
      res.json(logs);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  app.post("/api/admin/activity-logs/purge", requireRole("admin"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      // Default retention: 90 days, configurable via request body
      const retentionDays = req.body.retentionDays || parseInt(process.env.ACTIVITY_LOG_RETENTION_DAYS || "90");
      
      if (retentionDays < 1) {
        return res.status(400).send("Retention days must be at least 1");
      }
      
      const deletedCount = await storage.purgeOldActivityLogs(retentionDays);
      
      // Log the purge action itself
      await logActivity(
        req.user.id,
        'PURGE',
        'activity_logs',
        undefined,
        { retentionDays, deletedCount },
        req
      );
      
      res.json({ deletedCount, retentionDays });
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // Users
  app.get("/api/admin/users", requireRole("admin"), async (req, res) => {
    try {
      const users = await storage.listUsers();
      res.json(users);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // Resellers with aggregated customer counts
  app.get("/api/admin/resellers", requireRole("admin"), async (req, res) => {
    try {
      const users = await storage.listUsers();
      const resellers = users.filter(u => u.role === 'reseller');
      const customers = users.filter(u => u.role === 'customer');
      const staff = users.filter(u => u.role === 'reseller_staff');
      const repairCenters = await storage.listRepairCenters();
      
      // Aggregate customer, staff and repair center counts per reseller, omit password
      const resellersWithCounts = resellers.map(reseller => {
        const { password, ...safeReseller } = reseller;
        return {
          ...safeReseller,
          customerCount: customers.filter(c => c.resellerId === reseller.id).length,
          staffCount: staff.filter(s => s.resellerId === reseller.id).length,
          repairCenterCount: repairCenters.filter(rc => rc.resellerId === reseller.id).length,
          subResellerCount: resellers.filter(r => r.parentResellerId === reseller.id).length,
        };
      });
      
      res.json(resellersWithCounts);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // Delete a reseller (only if no active repairs, unpaid invoices, open tickets, customers, or repair centers)
  app.delete("/api/admin/resellers/:id", requireRole("admin"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Non autorizzato");
      
      const resellerId = req.params.id;
      const reseller = await storage.getUser(resellerId);
      
      if (!reseller || reseller.role !== "reseller") {
        return res.status(404).send("Rivenditore non trovato");
      }
      
      // Get all users related to this reseller
      const allUsers = await storage.listUsers();
      const resellerCustomers = allUsers.filter(u => u.role === "customer" && u.resellerId === resellerId);
      const resellerStaff = allUsers.filter(u => u.role === "reseller_staff" && u.resellerId === resellerId);
      const allUserIds = [resellerId, ...resellerCustomers.map(c => c.id), ...resellerStaff.map(s => s.id)];
      
      // Check for any repairs (active or completed) tied to this reseller
      const allRepairs = await storage.listRepairOrders();
      const terminalStatuses = ["consegnato", "cancelled"];
      const activeRepairs = allRepairs.filter(r => 
        (r.resellerId === resellerId || allUserIds.includes(r.customerId || "")) && 
        !terminalStatuses.includes(r.status)
      );
      
      if (activeRepairs.length > 0) {
        return res.status(409).json({
          error: "ACTIVE_REPAIRS",
          message: `Impossibile eliminare: il rivenditore ha ${activeRepairs.length} riparazione/i attiva/e`,
          count: activeRepairs.length
        });
      }
      
      // Check for unpaid invoices across reseller and all customers
      const allInvoices = await storage.listInvoices({});
      const unpaidInvoices = allInvoices.filter(i => 
        allUserIds.includes(i.customerId || "") && 
        i.paymentStatus !== "paid" && i.paymentStatus !== "cancelled"
      );
      
      if (unpaidInvoices.length > 0) {
        return res.status(409).json({
          error: "UNPAID_INVOICES",
          message: `Impossibile eliminare: ci sono ${unpaidInvoices.length} fattura/e non pagata/e`,
          count: unpaidInvoices.length
        });
      }
      
      // Check for open tickets by reseller, staff, or customers
      const allTickets = await storage.listTickets();
      const openTickets = allTickets.filter(t => 
        allUserIds.includes(t.createdBy || "") && t.status !== "closed"
      );
      
      if (openTickets.length > 0) {
        return res.status(409).json({
          error: "OPEN_TICKETS",
          message: `Impossibile eliminare: ci sono ${openTickets.length} ticket aperti`,
          count: openTickets.length
        });
      }
      
      // Check for customers - must be deleted individually first
      if (resellerCustomers.length > 0) {
        return res.status(409).json({
          error: "HAS_CUSTOMERS",
          message: `Impossibile eliminare: il rivenditore ha ancora ${resellerCustomers.length} cliente/i. Eliminali prima singolarmente.`,
          count: resellerCustomers.length
        });
      }
      
      // Check for repair centers
      const repairCenters = await storage.getRepairCentersForReseller(resellerId);
      if (repairCenters.length > 0) {
        return res.status(409).json({
          error: "HAS_REPAIR_CENTERS",
          message: `Impossibile eliminare: il rivenditore ha ancora ${repairCenters.length} centro/i riparazione. Eliminali prima.`,
          count: repairCenters.length
        });
      }
      
      // CASCADE DELETIONS (only staff and credentials at this point)
      
      // 1. Delete staff permissions and staff members
      for (const staff of resellerStaff) {
        await storage.deleteStaffPermissions(staff.id);
        const staffRepairCenters = await storage.listRepairCentersForStaff(staff.id);
        for (const rc of staffRepairCenters) {
          await storage.removeStaffFromRepairCenter(staff.id, rc.id);
        }
        await storage.deleteUser(staff.id);
      }
      
      // 2. Delete API credentials
      const sifarCred = await storage.getSifarCredentialByReseller(resellerId);
      if (sifarCred) await storage.deleteSifarCredential(sifarCred.id);
      
      const fonedayCred = await storage.getFonedayCredentialByReseller(resellerId);
      if (fonedayCred) await storage.deleteFonedayCredential(fonedayCred.id);
      
      const mobilesentrixCred = await storage.getMobilesentrixCredentialByReseller(resellerId);
      if (mobilesentrixCred) await storage.deleteMobilesentrixCredential(mobilesentrixCred.id);
      
      // 3. Finally delete the reseller
      await storage.deleteUser(resellerId);
      
      setActivityEntity(res, { type: 'users', id: resellerId });
      res.sendStatus(204);
    } catch (error: any) {
      console.error("Error deleting reseller:", error);
      res.status(500).send(error.message);
    }
  });
  // Assign repair centers to a reseller
  app.patch("/api/admin/resellers/:id/repair-centers", requireRole("admin"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Non autorizzato");
      
      const resellerId = req.params.id;
      const { repairCenterIds } = req.body;
      
      if (!Array.isArray(repairCenterIds)) {
        return res.status(400).send("repairCenterIds deve essere un array");
      }
      
      // Verify reseller exists
      const reseller = await storage.getUser(resellerId);
      if (!reseller || reseller.role !== "reseller") {
        return res.status(404).send("Rivenditore non trovato");
      }
      
      // Get all repair centers
      const allCenters = await storage.listRepairCenters();
      
      // Find centers currently assigned to this reseller
      const currentlyAssigned = allCenters.filter(c => c.resellerId === resellerId);
      const currentIds = currentlyAssigned.map(c => c.id);
      
      // Centers to unassign (currently assigned but not in new list)
      const toUnassign = currentIds.filter(id => !repairCenterIds.includes(id));
      
      // Centers to assign (in new list but not currently assigned)
      const toAssign = repairCenterIds.filter((id: string) => !currentIds.includes(id));
      
      // Verify all centers to assign exist and are either orphan or already assigned to this reseller
      for (const centerId of toAssign) {
        const center = allCenters.find(c => c.id === centerId);
        if (!center) {
          return res.status(404).send(`Centro di riparazione ${centerId} non trovato`);
        }
        if (center.resellerId && center.resellerId !== resellerId) {
          return res.status(400).send(`Centro ${center.name} è già assegnato a un altro rivenditore`);
        }
      }
      
      // Unassign centers
      for (const centerId of toUnassign) {
        await storage.updateRepairCenter(centerId, { resellerId: null as any });
      }
      
      // Assign centers
      for (const centerId of toAssign) {
        await storage.updateRepairCenter(centerId, { resellerId });
      }
      
      // Return updated list
      const updatedCenters = await storage.listRepairCenters();
      const assignedCenters = updatedCenters.filter(c => c.resellerId === resellerId);
      
      setActivityEntity(res, { type: 'users', id: resellerId });
      res.json({ assignedRepairCenters: assignedCenters });
    } catch (error: any) {
      console.error("Error assigning repair centers to reseller:", error);
      res.status(500).send(error.message);
    }
  });


  // ============================================
  // Admin Reseller Team Management
  // ============================================

  // List all staff members for a specific reseller
  app.get("/api/admin/resellers/:resellerId/team", requireRole("admin"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Non autorizzato");
      
      const { resellerId } = req.params;
      
      // Verify reseller exists
      const reseller = await storage.getUser(resellerId);
      if (!reseller || reseller.role !== 'reseller') {
        return res.status(404).send("Rivenditore non trovato");
      }
      
      const staff = await storage.listResellerStaff(resellerId);
      
      // Get permissions and assigned repair centers for each staff member
      const staffWithPermissions = await Promise.all(
        staff.map(async (member) => {
          const permissions = await storage.getStaffPermissions(member.id);
          const assignedRepairCenters = await storage.listRepairCentersForStaff(member.id);
          return {
            ...member,
            password: undefined,
            permissions,
            assignedRepairCenters
          };
        })
      );
      
      res.json(staffWithPermissions);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // Create a new staff member for a specific reseller
  app.post("/api/admin/resellers/:resellerId/team", requireRole("admin"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Non autorizzato");
      
      const { resellerId } = req.params;
      const { user: userData, permissions, repairCenterIds } = req.body;
      
      // Verify reseller exists
      const reseller = await storage.getUser(resellerId);
      if (!reseller || reseller.role !== 'reseller') {
        return res.status(404).send("Rivenditore non trovato");
      }
      
      if (!userData || !userData.username || !userData.email || !userData.password || !userData.fullName) {
        return res.status(400).send("Dati utente incompleti");
      }

      // Hash password
      const hashedPassword = await hashPassword(userData.password);

      // Create user with role reseller_staff
      const newUser = await storage.createUser({
        username: userData.username,
        password: hashedPassword,
        email: userData.email,
        fullName: userData.fullName,
        phone: userData.phone || null,
        role: "reseller_staff",
        resellerId,
        isActive: true
      });

      // Create permissions if provided
      if (permissions && Array.isArray(permissions)) {
        await storage.upsertStaffPermissions(newUser.id, resellerId, permissions);
      }

      // Assign repair centers if provided
      if (repairCenterIds && Array.isArray(repairCenterIds)) {
        await storage.setStaffRepairCenters(newUser.id, repairCenterIds);
      }

      // Get created staff with permissions
      const createdPermissions = await storage.getStaffPermissions(newUser.id);
      const assignedRepairCenters = await storage.listRepairCentersForStaff(newUser.id);

      setActivityEntity(res, { type: 'users', id: newUser.id });
      res.status(201).json({
        ...newUser,
        password: undefined,
        permissions: createdPermissions,
        assignedRepairCenters
      });
    } catch (error: any) {
      console.error("Error creating reseller staff by admin:", error);
      res.status(400).send(error.message);
    }
  });

  // Update a staff member for a specific reseller
  app.patch("/api/admin/resellers/:resellerId/team/:staffId", requireRole("admin"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Non autorizzato");
      
      const { resellerId, staffId } = req.params;
      const { user: userData, permissions, repairCenterIds } = req.body;
      
      // Verify reseller exists
      const reseller = await storage.getUser(resellerId);
      if (!reseller || reseller.role !== 'reseller') {
        return res.status(404).send("Rivenditore non trovato");
      }
      
      // Verify the staff member belongs to this reseller
      const staffMember = await storage.getUser(staffId);
      if (!staffMember || staffMember.resellerId !== resellerId || staffMember.role !== 'reseller_staff') {
        return res.status(404).send("Membro staff non trovato");
      }

      // Update user data if provided
      if (userData) {
        const updates: any = {};
        if (userData.fullName) updates.fullName = userData.fullName;
        if (userData.email) updates.email = userData.email;
        if (userData.phone !== undefined) updates.phone = userData.phone;
        if (typeof userData.isActive === 'boolean') updates.isActive = userData.isActive;
        
        if (Object.keys(updates).length > 0) {
          await storage.updateUser(staffId, updates);
        }
      }

      // Update permissions if provided
      if (permissions && Array.isArray(permissions)) {
        await storage.upsertStaffPermissions(staffId, resellerId, permissions);
      }

      // Update repair center assignments if provided
      if (repairCenterIds && Array.isArray(repairCenterIds)) {
        await storage.setStaffRepairCenters(staffId, repairCenterIds);
      }

      // Return updated staff member
      const updatedMember = await storage.getUser(staffId);
      const updatedPermissions = await storage.getStaffPermissions(staffId);
      const assignedRepairCenters = await storage.listRepairCentersForStaff(staffId);

      setActivityEntity(res, { type: 'users', id: staffId });
      res.json({
        ...updatedMember,
        password: undefined,
        permissions: updatedPermissions,
        assignedRepairCenters
      });
    } catch (error: any) {
      console.error("Error updating reseller staff by admin:", error);
      res.status(400).send(error.message);
    }
  });

  // Delete a staff member from a specific reseller's team
  app.delete("/api/admin/resellers/:resellerId/team/:staffId", requireRole("admin"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Non autorizzato");
      
      const { resellerId, staffId } = req.params;
      
      // Verify reseller exists
      const reseller = await storage.getUser(resellerId);
      if (!reseller || reseller.role !== 'reseller') {
        return res.status(404).send("Rivenditore non trovato");
      }
      
      // Verify the staff member belongs to this reseller
      const staffMember = await storage.getUser(staffId);
      if (!staffMember || staffMember.resellerId !== resellerId || staffMember.role !== 'reseller_staff') {
        return res.status(404).send("Membro staff non trovato");
      }

      // Delete permissions first
      await storage.deleteStaffPermissionsByUser(staffId);
      
      // Delete user
      await storage.deleteUser(staffId);

      setActivityEntity(res, { type: 'users', id: staffId });
      res.status(200).send("Membro staff eliminato");
    } catch (error: any) {
      console.error("Error deleting reseller staff by admin:", error);
      res.status(400).send(error.message);
    }
  });

  // Get repair centers for a specific reseller (for admin team management)
  app.get("/api/admin/resellers/:resellerId/repair-centers", requireRole("admin"), async (req, res) => {
    try {
      const { resellerId } = req.params;
      
      // Verify reseller exists
      const reseller = await storage.getUser(resellerId);
      if (!reseller || reseller.role !== 'reseller') {
        return res.status(404).send("Rivenditore non trovato");
      }
      
      const repairCenters = await storage.getRepairCentersForReseller(resellerId);
      res.json(repairCenters);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // Get sub-resellers for a specific reseller (for admin customer creation)
  app.get("/api/admin/resellers/:resellerId/sub-resellers", requireRole("admin"), async (req, res) => {
    try {
      const { resellerId } = req.params;
      
      // Verify reseller exists
      const reseller = await storage.getUser(resellerId);
      if (!reseller || reseller.role !== 'reseller') {
        return res.status(404).send("Rivenditore non trovato");
      }
      
      // Get sub-resellers for this reseller (resellers with parentResellerId = this reseller)
      const allUsers = await storage.listUsers();
      const subResellers = allUsers
        .filter(u => u.role === 'reseller' && u.parentResellerId === resellerId)
        .map(({ password, ...u }) => u);
      
      res.json(subResellers);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // Get reseller overview with all related entities (for admin detail view)
  app.get("/api/admin/resellers/:id/overview", requireRole("admin"), async (req, res) => {
    try {
      const { id } = req.params;
      
      // Get reseller
      const reseller = await storage.getUser(id);
      if (!reseller || reseller.role !== 'reseller') {
        return res.status(404).send("Rivenditore non trovato");
      }
      
      const { password, ...safeReseller } = reseller;
      
      // Get all related data
      const allUsers = await storage.listUsers();
      const repairCenters = await storage.listRepairCenters();
      
      // Sub-resellers (resellers with parentResellerId = this reseller)
      const subResellers = allUsers
        .filter(u => u.role === 'reseller' && u.parentResellerId === id)
        .map(({ password, ...u }) => u);
      
      // Repair centers belonging to this reseller
      const resellerRepairCenters = repairCenters.filter(rc => rc.resellerId === id);
      
      // Customers belonging to this reseller
      const customers = allUsers
        .filter(u => u.role === 'customer' && u.resellerId === id)
        .map(({ password, ...u }) => u);
      
      // Staff belonging to this reseller
      const staff = allUsers
        .filter(u => u.role === 'reseller_staff' && u.resellerId === id)
        .map(({ password, ...u }) => u);
      
      res.json({
        reseller: safeReseller,
        subResellers,
        repairCenters: resellerRepairCenters,
        customers,
        staff,
      });
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  app.post("/api/admin/users", requireRole("admin"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      // Validate input
      const validatedData = insertUserSchema.parse(req.body);
      
      // Check for duplicate email
      const existingEmail = await storage.getUserByEmail(validatedData.email);
      if (existingEmail) {
        return res.status(400).send("Email già registrata nel sistema");
      }
      
      // Check for duplicate username
      const existingUsername = await storage.getUserByUsername(validatedData.username);
      if (existingUsername) {
        return res.status(400).send("Username già in uso");
      }
      
      // Check for duplicate partita IVA (only if provided and not empty)
      if (validatedData.partitaIva && validatedData.partitaIva.trim() !== '') {
        const existingPartitaIva = await storage.getUserByPartitaIva(validatedData.partitaIva.trim());
        if (existingPartitaIva) {
          return res.status(400).send("Partita IVA già registrata nel sistema");
        }
      }
      
      // Hash password before storing
      const hashedPassword = await hashPassword(password);
      
      // Only set resellerCategory for reseller role
      const resellerCategory = validatedData.role === 'reseller' 
        ? (validatedData.resellerCategory || 'standard') 
        : null;
      
      const user = await storage.createUser({
        ...validatedData,
        password: hashedPassword,
        resellerCategory,
      });
      
      // Auto-create warehouse for new active resellers
      if (user.role === 'reseller' && user.isActive) {
        try {
          await storage.ensureDefaultWarehouse('reseller', user.id, user.fullName || user.username);
          console.log(`[WAREHOUSE] Auto-created warehouse for new reseller: ${user.id}`);
        } catch (warehouseError) {
          console.error(`[WAREHOUSE] Failed to create warehouse for reseller ${user.id}:`, warehouseError);
        }
      }
      
      setActivityEntity(res, { type: 'users', id: user.id });
      const { password: _, ...safeUser } = user;
      res.status(201).json({ customer: safeUser, tempPassword: password });
    } catch (error: any) {
      res.status(400).send(error.message);
    }
  });

  app.delete("/api/admin/users/:id", requireRole("admin"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      const userId = req.params.id;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).send("Utente non trovato");
      }
      
      // If user is a customer, check for active repairs
      if (user.role === "customer") {
        const allRepairs = await storage.listRepairOrders();
        const customerRepairs = allRepairs.filter(r => r.customerId === userId);
        const terminalStatuses = ["consegnato", "cancelled"];
        const activeRepairs = customerRepairs.filter(r => !terminalStatuses.includes(r.status));
        
        if (activeRepairs.length > 0) {
          return res.status(409).json({
            error: "ACTIVE_REPAIRS",
            message: `Impossibile eliminare: il cliente ha ${activeRepairs.length} riparazione/i attiva/e`,
            activeRepairsCount: activeRepairs.length
          });
        }
        
        // Remove customer from repair center associations
        const customerRepairCenters = await storage.listCustomerRepairCenters(userId);
        for (const crc of customerRepairCenters) {
          await storage.removeCustomerFromRepairCenter(crc.id);
        }
      }
      
      await storage.deleteUser(userId);
      
      setActivityEntity(res, { type: 'users', id: userId });
      res.sendStatus(204);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // Reset password for reseller or repair_center (admin only)
  app.post("/api/admin/users/:id/reset-password", requireRole("admin"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Non autorizzato");
      
      const userId = req.params.id;
      const { newPassword } = req.body;
      
      if (!newPassword || newPassword.length < 4) {
        return res.status(400).send("La password deve contenere almeno 4 caratteri");
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).send("Utente non trovato");
      }

      // Only allow reset for reseller and repair_center roles
      if (user.role !== 'reseller' && user.role !== 'repair_center') {
        return res.status(403).send("Reset password consentito solo per rivenditori e centri di riparazione");
      }

      // Hash and update password
      const hashedPassword = await hashPassword(newPassword);
      await storage.updateUser(userId, { password: hashedPassword });

      setActivityEntity(res, { type: 'users', id: userId });
      res.json({ message: "Password aggiornata con successo" });
    } catch (error: any) {
      console.error("Error resetting user password:", error);
      res.status(500).send(error.message);
    }
  });

  // Reset password for repair center by center ID (admin only)
  app.post("/api/admin/repair-centers/:id/reset-password", requireRole("admin"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Non autorizzato");
      
      const centerId = req.params.id;
      const { newPassword } = req.body;
      
      if (!newPassword || newPassword.length < 4) {
        return res.status(400).send("La password deve contenere almeno 4 caratteri");
      }

      // Find the user associated with this repair center
      const allUsers = await storage.listUsers();
      const repairCenterUser = allUsers.find(u => u.role === 'repair_center' && u.repairCenterId === centerId);
      
      if (!repairCenterUser) {
        return res.status(404).send("Utente del centro di riparazione non trovato");
      }

      // Hash and update password
      const hashedPassword = await hashPassword(newPassword);
      await storage.updateUser(repairCenterUser.id, { password: hashedPassword });

      setActivityEntity(res, { type: 'users', id: repairCenterUser.id });
      res.json({ message: "Password aggiornata con successo" });
    } catch (error: any) {
      console.error("Error resetting repair center password:", error);
      res.status(500).send(error.message);
    }
  });

  // Admin Team (Collaboratori Admin)
  // List all admin staff members
  app.get("/api/admin/team", requireRole("admin"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Non autorizzato");
      
      const staff = await storage.listAdminStaff();
      
      // Get permissions for each staff member
      const staffWithPermissions = await Promise.all(
        staff.map(async (member) => {
          const permissions = await storage.getAdminStaffPermissions(member.id);
          return {
            ...member,
            password: undefined,
            permissions
          };
        })
      );
      
      res.json(staffWithPermissions);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // Create a new admin staff member
  const adminStaffUserSchema = z.object({
    username: z.string().min(3, "Username deve essere almeno 3 caratteri"),
    email: z.string().email("Email non valida"),
    fullName: z.string().min(2, "Nome completo richiesto"),
    phone: z.string().nullable().optional(),
    password: z.string().min(6, "Password deve essere almeno 6 caratteri"),
  });

  const VALID_ADMIN_MODULES = ["users", "resellers", "repair_centers", "repairs", "products", "inventory", "suppliers", "supplier_orders", "invoices", "tickets", "utility", "reports", "settings", "service_catalog"] as const;

  const adminStaffPermissionSchema = z.object({
    module: z.enum(VALID_ADMIN_MODULES),
    canRead: z.boolean().default(false),
    canCreate: z.boolean().default(false),
    canUpdate: z.boolean().default(false),
    canDelete: z.boolean().default(false),
  });

  const createAdminStaffSchema = z.object({
    user: adminStaffUserSchema,
    permissions: z.array(adminStaffPermissionSchema).optional(),
  });

  app.post("/api/admin/team", requireRole("admin"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Non autorizzato");
      
      // Validate request body
      const parsed = createAdminStaffSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).send(parsed.error.errors[0]?.message || "Dati non validi");
      }

      const { user: userData, permissions } = parsed.data;

      // Hash password
      const hashedPassword = await hashPassword(userData.password);

      // Create user with role admin_staff
      const newUser = await storage.createUser({
        username: userData.username,
        password: hashedPassword,
        email: userData.email,
        fullName: userData.fullName,
        phone: userData.phone || null,
        role: "admin_staff",
        isActive: true
      });

      // Create permissions if provided
      if (permissions && permissions.length > 0) {
        await storage.upsertAdminStaffPermissions(newUser.id, req.user.id, permissions);
      }

      // Return created staff with permissions
      const staffPermissions = await storage.getAdminStaffPermissions(newUser.id);
      
      setActivityEntity(res, { type: 'users', id: newUser.id });
      res.status(201).json({
        ...newUser,
        password: undefined,
        permissions: staffPermissions
      });
    } catch (error: any) {
      console.error("Error creating admin staff:", error);
      res.status(400).send(error.message);
    }
  });

  // Update an admin staff member
  const updateAdminStaffUserSchema = z.object({
    fullName: z.string().min(2).optional(),
    email: z.string().email().optional(),
    phone: z.string().nullable().optional(),
    isActive: z.boolean().optional(),
  });

  const updateAdminStaffSchema = z.object({
    user: updateAdminStaffUserSchema.optional(),
    permissions: z.array(adminStaffPermissionSchema).optional(),
  });

  app.patch("/api/admin/team/:id", requireRole("admin"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Non autorizzato");
      
      const staffId = req.params.id;
      
      // Validate request body
      const parsed = updateAdminStaffSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).send(parsed.error.errors[0]?.message || "Dati non validi");
      }

      const { user: userData, permissions } = parsed.data;
      
      // Verify the staff member is admin_staff
      const staffMember = await storage.getUser(staffId);
      if (!staffMember || staffMember.role !== 'admin_staff') {
        return res.status(404).send("Membro staff non trovato");
      }

      // Update user data if provided
      if (userData) {
        const updates: Partial<{ fullName: string; email: string; phone: string | null; isActive: boolean }> = {};
        if (userData.fullName) updates.fullName = userData.fullName;
        if (userData.email) updates.email = userData.email;
        if (userData.phone !== undefined) updates.phone = userData.phone;
        if (typeof userData.isActive === 'boolean') updates.isActive = userData.isActive;
        
        if (Object.keys(updates).length > 0) {
          await storage.updateUser(staffId, updates);
        }
      }

      // Update permissions if provided
      if (permissions && permissions.length > 0) {
        await storage.upsertAdminStaffPermissions(staffId, req.user.id, permissions);
      }

      // Return updated staff with permissions
      const updatedStaff = await storage.getUser(staffId);
      const staffPermissions = await storage.getAdminStaffPermissions(staffId);
      
      setActivityEntity(res, { type: 'users', id: staffId });
      res.json({
        ...updatedStaff,
        password: undefined,
        permissions: staffPermissions
      });
    } catch (error: any) {
      console.error("Error updating admin staff:", error);
      res.status(400).send(error.message);
    }
  });

  // Delete an admin staff member
  app.delete("/api/admin/team/:id", requireRole("admin"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Non autorizzato");
      
      const staffId = req.params.id;
      
      // Verify the staff member is admin_staff
      const staffMember = await storage.getUser(staffId);
      if (!staffMember || staffMember.role !== 'admin_staff') {
        return res.status(404).send("Membro staff non trovato");
      }

      // Delete permissions first
      await storage.deleteAdminStaffPermissionsByUser(staffId);
      
      // Delete user
      await storage.deleteUser(staffId);

      setActivityEntity(res, { type: 'users', id: staffId });
      res.status(200).send("Membro staff eliminato");
    } catch (error: any) {
      console.error("Error deleting admin staff:", error);
      res.status(400).send(error.message);
    }
  });

  // Get permissions for a specific admin staff member
  app.get("/api/admin/team/:id/permissions", requireRole("admin"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Non autorizzato");
      
      const staffId = req.params.id;
      
      // Verify the staff member is admin_staff
      const staffMember = await storage.getUser(staffId);
      if (!staffMember || staffMember.role !== 'admin_staff') {
        return res.status(404).send("Membro staff non trovato");
      }

      const permissions = await storage.getAdminStaffPermissions(staffId);
      res.json(permissions);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // Update permissions for a specific admin staff member (bulk update)
  const updateAdminStaffPermissionsSchema = z.object({
    permissions: z.array(adminStaffPermissionSchema),
  });

  app.put("/api/admin/team/:id/permissions", requireRole("admin"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Non autorizzato");
      
      const staffId = req.params.id;
      
      // Validate request body
      const parsed = updateAdminStaffPermissionsSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).send(parsed.error.errors[0]?.message || "Permessi non validi");
      }

      const { permissions } = parsed.data;

      // Verify the staff member is admin_staff
      const staffMember = await storage.getUser(staffId);
      if (!staffMember || staffMember.role !== 'admin_staff') {
        return res.status(404).send("Membro staff non trovato");
      }

      const updatedPermissions = await storage.upsertAdminStaffPermissions(
        staffId, 
        req.user.id, 
        permissions
      );
      
      setActivityEntity(res, { type: 'users', id: staffId });
      res.json(updatedPermissions);
    } catch (error: any) {
      console.error("Error updating admin staff permissions:", error);
      res.status(400).send(error.message);
    }
  });

  // Repair Centers
  app.get("/api/admin/repair-centers", requireRole("admin"), async (req, res) => {
    try {
      const centers = await storage.listRepairCenters();
      res.json(centers);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // Public endpoint to list repair centers (for dropdowns)
  // Filters by role: resellers see only their centers (+ sub-reseller centers for franchising/gdo), admins see all
  app.get("/api/repair-centers", requireAuth, async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      let centers = await storage.listRepairCenters();
      const allUsers = await storage.listUsers();
      
      // Build reseller name map for owner info
      const resellerMap = new Map(
        allUsers
          .filter(u => u.role === 'reseller')
          .map(u => [u.id, u.fullName])
      );
      
      // Filter based on role
      let subResellerIds: string[] = [];
      if (req.user.role === 'reseller' || req.user.role === 'sub_reseller') {
        // Base: own centers
        let allowedCenterIds = centers
          .filter(c => c.resellerId === req.user!.id && c.isActive)
          .map(c => c.id);
        
        // Franchising/GDO: also include sub-reseller centers
        if (req.user.resellerCategory === 'franchising' || req.user.resellerCategory === 'gdo') {
          const subResellers = allUsers.filter(
            u => u.role === 'reseller' && u.parentResellerId === req.user!.id && u.isActive
          );
          subResellerIds = subResellers.map(s => s.id);
          
          const subResellerCenterIds = centers
            .filter(c => subResellerIds.includes(c.resellerId || '') && c.isActive)
            .map(c => c.id);
          
          allowedCenterIds = [...allowedCenterIds, ...subResellerCenterIds];
        }
        
        centers = centers.filter(c => allowedCenterIds.includes(c.id));
      } else if (req.user.role === 'repair_center') {
        // Repair center users see only active centers (they typically work at one)
        centers = centers.filter(c => c.isActive);
      } else {
        // Admin sees all active centers
        centers = centers.filter(c => c.isActive);
      }
      
      // Return fields for selection with owner info
      res.json(centers.map(c => {
        const isOwn = c.resellerId === req.user!.id;
        const ownerName = c.resellerId ? resellerMap.get(c.resellerId) : null;
        const isSubResellerCenter = subResellerIds.includes(c.resellerId || '');
        
        return {
          id: c.id,
          name: c.name,
          address: c.address,
          phone: c.phone,
          email: c.email,
          resellerId: c.resellerId,
          ownerName: ownerName || null,
          isOwn,
          isSubResellerCenter
        };
      }));
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // Get single repair center by ID (includes hourly rate for quote calculation)
  app.get("/api/repair-centers/:id", requireAuth, async (req, res) => {
    try {
      const center = await storage.getRepairCenter(req.params.id);
      if (!center) {
        return res.status(404).send("Centro di riparazione non trovato");
      }
      res.json(center);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  app.post("/api/admin/repair-centers", requireRole("admin"), async (req, res) => {
    try {
      const validatedData = insertRepairCenterSchema.parse(req.body);
      
      // Validate sub-reseller if provided
      if (validatedData.subResellerId) {
        if (!validatedData.resellerId) {
          return res.status(400).send("Seleziona un rivenditore prima di assegnare un sub-reseller");
        }
        const subReseller = await storage.getUser(validatedData.subResellerId);
        if (!subReseller || subReseller.role !== 'reseller' || subReseller.parentResellerId !== validatedData.resellerId) {
          return res.status(400).send("Sub-reseller non valido o non appartenente al rivenditore selezionato");
        }
      }
      
      // Check if password was provided for the user account
      const userPassword = req.body.password;
      if (!userPassword || userPassword.length < 6) {
        return res.status(400).send("Password richiesta (minimo 6 caratteri) per creare l'account del centro");
      }
      
      // Check for duplicate email
      const existingEmail = await storage.getUserByEmail(validatedData.email);
      if (existingEmail) {
        return res.status(400).send("Email già registrata nel sistema");
      }
      
      const center = await storage.createRepairCenter(validatedData);
      
      // Create user account for the repair center
      const hashedPassword = await hashPassword(userPassword);
      const emailUsername = validatedData.email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '_');
      const username = `rc_${emailUsername}_${Date.now().toString(36)}`;
      
      await storage.createUser({
        username,
        email: validatedData.email,
        password: hashedPassword,
        fullName: validatedData.name,
        role: 'repair_center',
        repairCenterId: center.id,
        phone: validatedData.phone || null,
        address: validatedData.address || null,
        city: validatedData.city || null,
        province: validatedData.provincia || null,
        postalCode: validatedData.cap || null,
      });
      
      // Create automatic warehouse for the repair center (with compensating cleanup)
      const existingWarehouse = await storage.getWarehouseByOwner('repair_center', center.id);
      if (!existingWarehouse) {
        try {
          await storage.createWarehouse({
            name: `Magazzino ${validatedData.name}`,
            ownerId: center.id,
            ownerType: 'repair_center',
            isActive: true,
          });
        } catch (warehouseError: any) {
          // Compensating cleanup: delete the center if warehouse creation fails
          console.error('Failed to create warehouse, rolling back center creation:', warehouseError);
          try {
            await storage.deleteRepairCenter(center.id);
          } catch (cleanupError) {
            console.error('Failed to cleanup repair center:', cleanupError);
          }
          throw new Error('Impossibile creare il magazzino per il centro di riparazione');
        }
      }
      
      setActivityEntity(res, { type: 'repair-centers', id: center.id });
      res.status(201).json(center);
    } catch (error: any) {
      res.status(400).send(error.message);
    }
  });

  app.patch("/api/admin/repair-centers/:id", requireRole("admin"), async (req, res) => {
    try {
      const { 
        name, address, city, phone, email, resellerId, subResellerId, isActive,
        hourlyRateCents, cap, provincia, ragioneSociale, partitaIva,
        codiceFiscale, iban, codiceUnivoco, pec
      } = req.body;
      const updates: any = {};
      if (name !== undefined) updates.name = name;
      if (address !== undefined) updates.address = address;
      if (city !== undefined) updates.city = city;
      if (phone !== undefined) updates.phone = phone;
      if (email !== undefined) updates.email = email;
      if (resellerId !== undefined) updates.resellerId = resellerId;
      if (subResellerId !== undefined) {
        // Validate sub-reseller if provided
        if (subResellerId) {
          const effectiveResellerId = resellerId !== undefined ? resellerId : (await storage.getRepairCenter(req.params.id))?.resellerId;
          if (!effectiveResellerId) {
            return res.status(400).send("Seleziona un rivenditore prima di assegnare un sub-reseller");
          }
          const subReseller = await storage.getUser(subResellerId);
          if (!subReseller || subReseller.role !== 'reseller' || subReseller.parentResellerId !== effectiveResellerId) {
            return res.status(400).send("Sub-reseller non valido o non appartenente al rivenditore selezionato");
          }
        }
        updates.subResellerId = subResellerId;
      }
      if (isActive !== undefined) updates.isActive = isActive;
      if (hourlyRateCents !== undefined) updates.hourlyRateCents = hourlyRateCents;
      if (cap !== undefined) updates.cap = cap;
      if (provincia !== undefined) updates.provincia = provincia;
      if (ragioneSociale !== undefined) updates.ragioneSociale = ragioneSociale;
      if (partitaIva !== undefined) updates.partitaIva = partitaIva;
      if (codiceFiscale !== undefined) updates.codiceFiscale = codiceFiscale;
      if (iban !== undefined) updates.iban = iban;
      if (codiceUnivoco !== undefined) updates.codiceUnivoco = codiceUnivoco;
      if (pec !== undefined) updates.pec = pec;
      
      const center = await storage.updateRepairCenter(req.params.id, updates);
      setActivityEntity(res, { type: 'repair-centers', id: center.id });
      res.json(center);
    } catch (error: any) {
      res.status(400).send(error.message);
    }
  });

  app.delete("/api/admin/repair-centers/:id", requireRole("admin"), async (req, res) => {
    try {
      await storage.deleteRepairCenter(req.params.id);
      setActivityEntity(res, { type: 'repair-centers', id: req.params.id });
      res.sendStatus(204);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // Find repair centers without user accounts (orphans)
  app.get("/api/admin/repair-centers/orphans", requireRole("admin"), async (req, res) => {
    try {
      const allCenters = await storage.listRepairCenters();
      const allUsers = await storage.listUsers();
      
      // Find centers that don't have a user with repairCenterId pointing to them
      const userCenterIds = new Set(
        allUsers
          .filter(u => u.role === 'repair_center' && u.repairCenterId)
          .map(u => u.repairCenterId)
      );
      
      const orphanCenters = allCenters.filter(center => !userCenterIds.has(center.id));
      
      res.json({
        totalCenters: allCenters.length,
        orphanCount: orphanCenters.length,
        orphans: orphanCenters.map(c => ({
          id: c.id,
          name: c.name,
          email: c.email,
          phone: c.phone,
          city: c.city,
          resellerId: c.resellerId,
        })),
      });
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // Backfill missing user accounts for repair centers
  app.post("/api/admin/repair-centers/backfill-accounts", requireRole("admin"), async (req, res) => {
    try {
      const allCenters = await storage.listRepairCenters();
      const allUsers = await storage.listUsers();
      
      // Find orphan centers
      const userCenterIds = new Set(
        allUsers
          .filter(u => u.role === 'repair_center' && u.repairCenterId)
          .map(u => u.repairCenterId)
      );
      
      const orphanCenters = allCenters.filter(center => !userCenterIds.has(center.id));
      
      if (orphanCenters.length === 0) {
        return res.json({ message: "Nessun centro orfano trovato", created: [] });
      }
      
      const createdAccounts: Array<{
        centerId: string;
        centerName: string;
        username: string;
        email: string;
        tempPassword: string;
      }> = [];
      
      const errors: Array<{ centerId: string; centerName: string; error: string }> = [];
      
      for (const center of orphanCenters) {
        try {
          // Check if email already exists
          const existingEmail = await storage.getUserByEmail(center.email);
          if (existingEmail) {
            errors.push({
              centerId: center.id,
              centerName: center.name,
              error: `Email ${center.email} già in uso da un altro utente`,
            });
            continue;
          }
          
          // Generate username
          const emailUsername = center.email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '_');
          const username = `rc_${emailUsername}_${Date.now().toString(36)}`;
          
          // Generate temporary password
          const tempPassword = randomBytes(8).toString('hex');
          const hashedPassword = await hashPassword(tempPassword);
          
          // Create user account
          await storage.createUser({
            username,
            email: center.email,
            password: hashedPassword,
            fullName: center.name,
            role: 'repair_center',
            repairCenterId: center.id,
            phone: center.phone || null,
            address: center.address || null,
            city: center.city || null,
            province: center.provincia || null,
            postalCode: center.cap || null,
          });
          
          createdAccounts.push({
            centerId: center.id,
            centerName: center.name,
            username,
            email: center.email,
            tempPassword,
          });
          
          console.log(`[BACKFILL] Created account for repair center: ${center.name} (${center.id})`);
        } catch (err: any) {
          errors.push({
            centerId: center.id,
            centerName: center.name,
            error: err.message,
          });
        }
      }
      
      res.json({
        message: `Creati ${createdAccounts.length} account su ${orphanCenters.length} centri orfani`,
        created: createdAccounts,
        errors,
      });
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // Get repair center overview with all related entities (for admin detail view)
  app.get("/api/admin/repair-centers/:id/overview", requireRole("admin"), async (req, res) => {
    try {
      const { id } = req.params;
      
      // Get repair center
      const center = await storage.getRepairCenter(id);
      if (!center) {
        return res.status(404).send("Centro di riparazione non trovato");
      }
      
      // Get all related data
      const allUsers = await storage.listUsers();
      const allRepairs = await storage.listRepairOrders();
      const allB2bOrders = await storage.listRepairCenterPurchaseOrders();
      
      // Filter repairs for this center
      const centerRepairs = allRepairs
        .filter(r => r.repairCenterId === id)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 100); // Last 100 repairs
      
      // Filter B2B orders for this center
      const centerB2bOrders = allB2bOrders
        .filter(o => o.repairCenterId === id)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 50);
      
      // Get customers associated with this center
      const customerRepairCentersData = await storage.listAllCustomerRepairCenters();
      const customerIds = customerRepairCentersData
        .filter(crc => crc.repairCenterId === id)
        .map(crc => crc.customerId);
      const customers = allUsers
        .filter(u => customerIds.includes(u.id))
        .map(({ password, ...u }) => u);
      
      // Get staff assigned to this center
      const staffRepairCentersData = await storage.listAllStaffRepairCenters();
      const staffIds = staffRepairCentersData
        .filter(src => src.repairCenterId === id)
        .map(src => src.staffId);
      const staff = allUsers
        .filter(u => staffIds.includes(u.id))
        .map(({ password, ...u }) => u);
      
      // Get reseller info if exists
      let reseller = null;
      if (center.resellerId) {
        const resellerData = await storage.getUser(center.resellerId);
        if (resellerData) {
          const { password, ...safeReseller } = resellerData;
          reseller = safeReseller;
        }
      }
      
      // Get sub-reseller info if exists
      let subReseller = null;
      if (center.subResellerId) {
        const subResellerData = await storage.getUser(center.subResellerId);
        if (subResellerData) {
          const { password, ...safeSubReseller } = subResellerData;
          subReseller = safeSubReseller;
        }
      }
      
      // Calculate stats
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const allCenterRepairs = allRepairs.filter(r => r.repairCenterId === id);
      
      const stats = {
        totalRepairs: allCenterRepairs.length,
        activeRepairs: allCenterRepairs.filter(r => 
          !['consegnato', 'cancelled'].includes(r.status)
        ).length,
        completedRepairs: allCenterRepairs.filter(r => r.status === 'consegnato').length,
        repairs30Days: allCenterRepairs.filter(r => 
          new Date(r.createdAt) >= thirtyDaysAgo
        ).length,
        totalCustomers: customers.length,
        totalStaff: staff.length,
        totalB2bOrders: centerB2bOrders.length,
      };
      
      // Create users map for customer name lookup in repairs
      const usersMap: Record<string, { id: string; fullName: string }> = {};
      allUsers.forEach(u => {
        usersMap[u.id] = { id: u.id, fullName: u.fullName };
      });
      
      // Get utility practices for customers of this center
      const allUtilityPractices = await storage.listUtilityPractices();
      const centerUtilityPractices = allUtilityPractices
        .filter(p => p.customerId && customerIds.includes(p.customerId))
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 50);
      
      // Get utility suppliers and services for lookup
      const allUtilitySuppliers = await storage.listUtilitySuppliers();
      const allUtilityServices = await storage.listUtilityServices();
      
      const suppliersMap: Record<string, string> = {};
      allUtilitySuppliers.forEach(s => {
        suppliersMap[s.id] = s.name;
      });
      
      const servicesMap: Record<string, string> = {};
      allUtilityServices.forEach(s => {
        servicesMap[s.id] = s.name;
      });
      
      res.json({
        center,
        reseller,
        subReseller,
        repairs: centerRepairs,
        b2bOrders: centerB2bOrders,
        customers,
        staff,
        stats: {
          ...stats,
          totalUtilityPractices: centerUtilityPractices.length,
        },
        usersMap,
        utilityPractices: centerUtilityPractices,
        suppliersMap,
        servicesMap,
      });
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // Products
  app.get("/api/admin/products", requireRole("admin"), async (req, res) => {
    try {
      const products = await storage.listProducts();
      res.json(products);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  app.post("/api/admin/products", requireRole("admin"), async (req, res) => {
    try {
      const validatedData = insertProductSchema.parse(req.body);
      const product = await storage.createProduct(validatedData);
      setActivityEntity(res, { type: 'products', id: product.id });
      res.status(201).json(product);
    } catch (error: any) {
      res.status(400).send(error.message);
    }
  });

  // Backfill barcode per prodotti esistenti senza barcode
  app.post("/api/admin/products/backfill-barcodes", requireRole("admin"), async (req, res) => {
    try {
      const result = await storage.backfillProductBarcodes();
      res.json({
        success: true,
        message: `Aggiornati ${result.updated} prodotti con barcode`,
        updated: result.updated,
        errors: result.errors,
      });
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  app.delete("/api/admin/products/:id", requireRole("admin"), async (req, res) => {
    try {
      await storage.deleteProduct(req.params.id);
      setActivityEntity(res, { type: 'products', id: req.params.id });
      res.sendStatus(204);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // Admin Products - Toggle shop visibility
  app.patch("/api/admin/products/:id/visibility", requireRole("admin"), async (req, res) => {
    try {
      const { isVisibleInShop } = req.body;
      if (typeof isVisibleInShop !== 'boolean') {
        return res.status(400).send("isVisibleInShop deve essere un valore booleano");
      }
      const product = await storage.updateProduct(req.params.id, { isVisibleInShop });
      setActivityEntity(res, { type: 'products', id: req.params.id });
      res.json(product);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // Admin Products - Upload product image
  app.post("/api/admin/products/:id/image", requireRole("admin"), upload.single("image"), async (req, res) => {
    try {
      const product = await storage.getProduct(req.params.id);
      if (!product) {
        return res.status(404).send("Prodotto non trovato");
      }
      
      if (!req.file) {
        return res.status(400).send("Nessun file caricato");
      }
      
      const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
      if (!allowedMimeTypes.includes(req.file.mimetype)) {
        return res.status(400).send("Formato immagine non supportato. Usa JPEG, PNG, WebP o GIF.");
      }
      
      const maxSize = 10 * 1024 * 1024;
      if (req.file.size > maxSize) {
        return res.status(400).send("Immagine troppo grande. Massimo 10MB.");
      }
      
      const ext = req.file.originalname.split(".").pop() || "jpg";
      const objectPath = `products/${req.params.id}/${Date.now()}.${ext}`;
      
      const privateObjectDir = objectStorage.getPrivateObjectDir();
      const fullPath = `${privateObjectDir}/${objectPath}`;
      const { bucketName, objectName } = parseObjectPath(fullPath);
      const bucket = objectStorageClient.bucket(bucketName);
      const file = bucket.file(objectName);
      
      await file.save(req.file.buffer, {
        metadata: { contentType: req.file.mimetype }
      });
      
      const imageUrl = `/objects/${objectPath}`;
      
      await storage.updateProduct(req.params.id, { imageUrl });
      setActivityEntity(res, { type: 'products', id: req.params.id });
      
      res.json({ imageUrl });
    } catch (error: any) {
      console.error("Error uploading product image:", error);
      res.status(500).send(error.message);
    }
  });

  // Admin Products - Delete product image
  app.delete("/api/admin/products/:id/image", requireRole("admin"), async (req, res) => {
    try {
      const product = await storage.getProduct(req.params.id);
      if (!product) {
        return res.status(404).send("Prodotto non trovato");
      }
      
      await storage.updateProduct(req.params.id, { imageUrl: null });
      setActivityEntity(res, { type: 'products', id: req.params.id });
      
      res.sendStatus(204);
    } catch (error: any) {
      console.error('[ERROR] GET /api/products:', error);
      res.status(500).send(error.message);
    }
  });

  // Get products with stock (admin only) - MUST be before :id routes
  app.get("/api/products/with-stock", requireAuth, async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      if (req.user.role !== 'admin') {
        return res.status(403).send("Only admins can view stock across all warehouses");
      }
      
      const productsWithStock = await storage.getAllProductsWithStock();
      res.json(productsWithStock);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // GET /api/products/:id - Get full product details with specs, prices, and compatibilities
  app.get("/api/products/:id", requireAuth, async (req, res) => {
    try {
      const product = await storage.getProduct(req.params.id);
      if (!product) {
        return res.status(404).send("Prodotto non trovato");
      }

      // Get type-specific specs
      let specs: any = null;
      if (product.productType === 'dispositivo') {
        specs = await storage.getSmartphoneSpecs(product.id);
      } else if (product.productType === 'accessorio') {
        specs = await storage.getAccessorySpecs(product.id);
      }

      // Get reseller prices and assignments
      const prices = await storage.listProductPrices({ productId: product.id });
      const pricesWithReseller = await Promise.all(
        prices.map(async (price) => {
          const reseller = await storage.getUser(price.resellerId);
          return {
            ...price,
            reseller: reseller ? {
              id: reseller.id,
              username: reseller.username,
              fullName: reseller.fullName,
            } : null,
          };
        })
      );

      // Get reseller assignments
      const assignments = await storage.listResellerProducts({ productId: product.id });
      const assignmentsWithReseller = await Promise.all(
        assignments.map(async (a) => {
          const reseller = await storage.getUser(a.resellerId);
          return {
            ...a,
            reseller: reseller ? {
              id: reseller.id,
              username: reseller.username,
              fullName: reseller.fullName,
            } : null,
          };
        })
      );

      // Get warehouse stock for this product across all warehouses
      const warehouses = await storage.listWarehouses({});
      const stockByWarehouse = await Promise.all(
        warehouses.map(async (wh) => {
          const stockItem = await storage.getWarehouseStockItem(wh.id, product.id);
          return {
            warehouseId: wh.id,
            warehouseName: wh.name,
            ownerType: wh.ownerType,
            quantity: stockItem?.quantity || 0,
            minStock: stockItem?.minStock || null,
            location: stockItem?.location || null,
          };
        })
      );

      // Get device compatibilities for this product
      const rawCompatibilities = await storage.listProductCompatibilities(product.id);
      const compatibilities = await Promise.all(
        rawCompatibilities.map(async (c) => {
          const brand = await storage.getDeviceBrand(c.deviceBrandId);
          const model = c.deviceModelId ? await storage.getDeviceModel(c.deviceModelId) : null;
          return {
            id: c.id,
            deviceBrandId: c.deviceBrandId,
            deviceBrandName: brand?.name || null,
            deviceModelId: c.deviceModelId,
            deviceModelName: model?.modelName || null,
          };
        })
      );

      res.json({
        product,
        specs,
        prices: pricesWithReseller,
        assignments: assignmentsWithReseller,
        stock: stockByWarehouse,
        compatibilities,
      });
    } catch (error: any) {
      console.error("Error fetching product details:", error);
      res.status(500).send(error.message);
    }
  });

  // GET /api/products/:id/compatibilities - Get device compatibilities for a product
  app.get("/api/products/:id/compatibilities", requireAuth, async (req, res) => {
    try {
      const product = await storage.getProduct(req.params.id);
      if (!product) {
        return res.status(404).send("Prodotto non trovato");
      }

      const rawCompatibilities = await storage.listProductCompatibilities(req.params.id);
      const compatibilities = await Promise.all(
        rawCompatibilities.map(async (c) => {
          const brand = await storage.getDeviceBrand(c.deviceBrandId);
          const model = c.deviceModelId ? await storage.getDeviceModel(c.deviceModelId) : null;
          return {
            id: c.id,
            deviceBrandId: c.deviceBrandId,
            deviceBrandName: brand?.name || null,
            deviceModelId: c.deviceModelId,
            deviceModelName: model?.modelName || null,
          };
        })
      );

      res.json(compatibilities);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // PUT /api/products/:id/compatibilities - Set device compatibilities for a product (replace all)
  app.put("/api/products/:id/compatibilities", requireAuth, requireRole("admin", "reseller", "reseller_collaborator", "reseller_staff", "sub_reseller", "repair_center"), async (req, res) => {
    try {
      const product = await storage.getProduct(req.params.id);
      if (!product) {
        return res.status(404).send("Prodotto non trovato");
      }

      const { compatibilities } = req.body;
      if (!Array.isArray(compatibilities)) {
        return res.status(400).send("compatibilities deve essere un array");
      }

      // Validate each compatibility entry
      const validCompatibilities: { deviceBrandId: string; deviceModelId: string | null }[] = [];
      for (const c of compatibilities) {
        if (!c.deviceBrandId) {
          return res.status(400).send("deviceBrandId è obbligatorio per ogni compatibilità");
        }
        const brand = await storage.getDeviceBrand(c.deviceBrandId);
        if (!brand) {
          return res.status(400).send(`Brand dispositivo non trovato: ${c.deviceBrandId}`);
        }
        if (c.deviceModelId) {
          const model = await storage.getDeviceModel(c.deviceModelId);
          if (!model) {
            return res.status(400).send(`Modello dispositivo non trovato: ${c.deviceModelId}`);
          }
        }
        validCompatibilities.push({
          deviceBrandId: c.deviceBrandId,
          deviceModelId: c.deviceModelId || null,
        });
      }

      // Set all compatibilities (replaces existing)
      const result = await storage.setProductCompatibilities(req.params.id, validCompatibilities);
      
      // Return enriched result
      const enriched = await Promise.all(
        result.map(async (c) => {
          const brand = await storage.getDeviceBrand(c.deviceBrandId);
          const model = c.deviceModelId ? await storage.getDeviceModel(c.deviceModelId) : null;
          return {
            id: c.id,
            deviceBrandId: c.deviceBrandId,
            deviceBrandName: brand?.name || null,
            deviceModelId: c.deviceModelId,
            deviceModelName: model?.modelName || null,
          };
        })
      );

      res.json(enriched);
    } catch (error: any) {
      res.status(400).send(error.message);
    }
  });

  // Product Prices (prezzi personalizzati per reseller - gestiti da admin)
  app.get("/api/admin/product-prices", requireRole("admin"), async (req, res) => {
    try {
      const { productId, resellerId } = req.query;
      const filters: { productId?: string; resellerId?: string } = {};
      if (productId) filters.productId = productId as string;
      if (resellerId) filters.resellerId = resellerId as string;
      
      const prices = await storage.listProductPrices(filters);
      
      // Add reseller info to each price
      const pricesWithReseller = await Promise.all(
        prices.map(async (price) => {
          const reseller = await storage.getUser(price.resellerId);
          return {
            ...price,
            reseller: reseller ? {
              id: reseller.id,
              username: reseller.username,
              fullName: reseller.fullName,
            } : null,
          };
        })
      );
      
      res.json(pricesWithReseller);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  app.get("/api/admin/product-prices/:id", requireRole("admin"), async (req, res) => {
    try {
      const price = await storage.getProductPrice(req.params.id);
      if (!price) {
        return res.status(404).send("Prezzo non trovato");
      }
      res.json(price);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  app.post("/api/admin/product-prices", requireRole("admin"), async (req, res) => {
    try {
      const { productId, resellerId, priceCents, costPriceCents } = req.body;
      
      if (!productId || !resellerId || priceCents === undefined) {
        return res.status(400).send("productId, resellerId e priceCents sono obbligatori");
      }
      
      // Verifica che il prodotto esista
      const product = await storage.getProduct(productId);
      if (!product) {
        return res.status(404).send("Prodotto non trovato");
      }
      
      // Verifica che il reseller esista
      const reseller = await storage.getUser(resellerId);
      if (!reseller || reseller.role !== "reseller") {
        return res.status(404).send("Rivenditore non trovato");
      }
      
      // Verifica se esiste già un prezzo per questo prodotto/reseller
      const existingPrice = await storage.getProductPriceForReseller(productId, resellerId);
      if (existingPrice) {
        // Aggiorna il prezzo esistente
        const updated = await storage.updateProductPrice(existingPrice.id, {
          priceCents,
          costPriceCents,
          isActive: true,
        });
        return res.json(updated);
      }
      
      // Crea nuovo prezzo
      const price = await storage.createProductPrice({
        productId,
        resellerId,
        priceCents,
        costPriceCents,
      });
      
      res.status(201).json(price);
    } catch (error: any) {
      res.status(400).send(error.message);
    }
  });

  app.patch("/api/admin/product-prices/:id", requireRole("admin"), async (req, res) => {
    try {
      const { priceCents, costPriceCents, isActive } = req.body;
      
      const existingPrice = await storage.getProductPrice(req.params.id);
      if (!existingPrice) {
        return res.status(404).send("Prezzo non trovato");
      }
      
      const updates: { priceCents?: number; costPriceCents?: number; isActive?: boolean } = {};
      if (priceCents !== undefined) updates.priceCents = priceCents;
      if (costPriceCents !== undefined) updates.costPriceCents = costPriceCents;
      if (isActive !== undefined) updates.isActive = isActive;
      
      const price = await storage.updateProductPrice(req.params.id, updates);
      res.json(price);
    } catch (error: any) {
      res.status(400).send(error.message);
    }
  });

  app.delete("/api/admin/product-prices/:id", requireRole("admin"), async (req, res) => {
    try {
      const existingPrice = await storage.getProductPrice(req.params.id);
      if (!existingPrice) {
        return res.status(404).send("Prezzo non trovato");
      }
      
      await storage.deleteProductPrice(req.params.id);
      res.sendStatus(204);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // Endpoint per ottenere tutti i reseller con i loro prezzi per un prodotto
  app.get("/api/admin/products/:productId/reseller-prices", requireRole("admin"), async (req, res) => {
    try {
      const product = await storage.getProduct(req.params.productId);
      if (!product) {
        return res.status(404).send("Prodotto non trovato");
      }
      
      // Ottieni tutti i reseller
      const allUsers = await storage.listUsers();
      const resellers = allUsers.filter(u => u.role === "reseller" && u.isActive);
      
      // Ottieni prezzi personalizzati per questo prodotto
      const prices = await storage.listProductPrices({ productId: req.params.productId });
      const priceMap = new Map(prices.map(p => [p.resellerId, p]));
      
      // Combina i dati
      const result = resellers.map(reseller => ({
        reseller: {
          id: reseller.id,
          username: reseller.username,
          fullName: reseller.fullName,
          email: reseller.email,
        },
        customPrice: priceMap.get(reseller.id) || null,
        defaultPrice: product.unitPrice,
        effectivePrice: priceMap.get(reseller.id)?.priceCents ?? product.unitPrice,
      }));
      
      res.json(result);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // Reseller Products Assignment (Admin - assegna prodotti globali ai reseller)
  app.get("/api/admin/products/:productId/reseller-assignments", requireRole("admin"), async (req, res) => {
    try {
      const product = await storage.getProduct(req.params.productId);
      if (!product) {
        return res.status(404).send("Prodotto non trovato");
      }
      
      // Ottieni tutti i reseller
      const allUsers = await storage.listUsers();
      const resellers = allUsers.filter(u => u.role === "reseller" && u.isActive);
      
      // Ottieni assegnazioni per questo prodotto
      const assignments = await storage.listResellerProducts({ productId: req.params.productId });
      const assignmentMap = new Map(assignments.map(a => [a.resellerId, a]));
      
      // Combina i dati
      const result = resellers.map(reseller => ({
        reseller: {
          id: reseller.id,
          username: reseller.username,
          fullName: reseller.fullName,
          email: reseller.email,
          resellerCategory: reseller.resellerCategory,
        },
        assignment: assignmentMap.get(reseller.id) || null,
        isAssigned: assignmentMap.has(reseller.id),
        isPublished: assignmentMap.get(reseller.id)?.isPublished || false,
      }));
      
      res.json(result);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  app.post("/api/admin/products/:productId/assign", requireRole("admin"), async (req, res) => {
    try {
      const { resellerIds } = z.object({
        resellerIds: z.array(z.string()).min(1),
      }).parse(req.body);
      
      const product = await storage.getProduct(req.params.productId);
      if (!product) {
        return res.status(404).send("Prodotto non trovato");
      }
      
      // Solo prodotti globali possono essere assegnati
      if (product.createdBy) {
        return res.status(400).send("Solo i prodotti globali (creati dall'admin) possono essere assegnati ai reseller");
      }
      
      const assignments = await storage.assignProductToResellers(req.params.productId, resellerIds);
      res.json({ message: `Prodotto assegnato a ${assignments.length} reseller`, assignments });
    } catch (error: any) {
      res.status(400).send(error.message);
    }
  });

  app.delete("/api/admin/products/:productId/assign/:resellerId", requireRole("admin"), async (req, res) => {
    try {
      await storage.removeProductFromReseller(req.params.productId, req.params.resellerId);
      res.sendStatus(204);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // Lista prodotti globali con stato assegnazione
  app.get("/api/admin/global-products", requireRole("admin"), async (req, res) => {
    try {
      const allProducts = await storage.listProducts();
      const globalProducts = allProducts.filter(p => !p.createdBy && p.isActive);
      
      // Per ogni prodotto, conta quanti reseller lo hanno assegnato/pubblicato
      const result = await Promise.all(globalProducts.map(async (product) => {
        const assignments = await storage.listResellerProducts({ productId: product.id });
        return {
          ...product,
          assignedCount: assignments.length,
          publishedCount: assignments.filter(a => a.isPublished).length,
        };
      }));
      
      res.json(result);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // Repair Orders (Admin)
  app.get("/api/admin/repairs", requireRole("admin"), async (req, res) => {
    try {
      const repairs = await storage.listRepairOrders();
      
      // Get all resellers to populate resellerName
      const allUsers = await storage.listUsers();
      const resellersMap = new Map<string, string>();
      allUsers.filter(u => u.role === 'reseller').forEach(r => {
        resellersMap.set(r.id, r.fullName || r.ragioneSociale || r.username);
      });
      
      // Enrich repairs with resellerName
      const enrichedRepairs = repairs.map(repair => ({
        ...repair,
        resellerName: repair.resellerId ? resellersMap.get(repair.resellerId) || null : null,
      }));
      
      res.json(enrichedRepairs);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // Paginated Repair Orders (Admin) - for performance with large datasets
  app.get("/api/admin/repairs/paginated", requireRole("admin", "admin_staff"), async (req, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const pageSize = Math.min(parseInt(req.query.pageSize as string) || 25, 100);
      
      const filters: any = {};
      if (req.query.status && req.query.status !== 'all') filters.status = req.query.status;
      if (req.query.priority && req.query.priority !== 'all') filters.priority = req.query.priority;
      if (req.query.repairCenterId && req.query.repairCenterId !== 'all') filters.repairCenterId = req.query.repairCenterId;
      if (req.query.resellerId && req.query.resellerId !== 'all') filters.resellerId = req.query.resellerId;
      if (req.query.deviceType && req.query.deviceType !== 'all') filters.deviceType = req.query.deviceType;
      if (req.query.search) filters.search = req.query.search;
      if (req.query.startDate) filters.startDate = req.query.startDate;
      if (req.query.endDate) filters.endDate = req.query.endDate;
      
      const result = await storage.listRepairOrdersPaginated({ page, pageSize, filters });
      
      // Enrich with names for display
      const allUsers = await storage.listUsers();
      const resellersMap = new Map<string, string>();
      const customersMap = new Map<string, { fullName: string | null; ragioneSociale: string | null }>();
      
      allUsers.forEach(u => {
        if (u.role === 'reseller') {
          resellersMap.set(u.id, u.ragioneSociale || u.fullName || u.username);
        }
        if (u.role === 'customer') {
          customersMap.set(u.id, { fullName: u.fullName, ragioneSociale: u.ragioneSociale });
        }
      });
      
      const allRepairCenters = await storage.listRepairCenters();
      const repairCentersMap = new Map<string, string>();
      allRepairCenters.forEach(rc => repairCentersMap.set(rc.id, rc.name));
      
      // Compute SLA for each order
      const { loadSLAConfig, computeSLASeverity } = await import("./sla-utils");
      const slaConfig = await loadSLAConfig();
      
      const enrichedData = await Promise.all(result.data.map(async (repair) => {
        const currentState = await storage.getCurrentRepairOrderState(repair.id);
        const stateEnteredAt = currentState?.enteredAt || repair.createdAt;
        const { severity, minutesInState, phase } = computeSLASeverity(repair.status, stateEnteredAt, slaConfig);
        
        const customer = repair.customerId ? customersMap.get(repair.customerId) : null;
        const customerName = customer?.ragioneSociale || customer?.fullName || null;
        
        return {
          ...repair,
          customerName,
          repairCenterName: repair.repairCenterId ? repairCentersMap.get(repair.repairCenterId) || null : null,
          resellerName: repair.resellerId ? resellersMap.get(repair.resellerId) || null : null,
          slaSeverity: severity,
          slaMinutesInState: minutesInState,
          slaPhase: phase,
          slaEnteredAt: stateEnteredAt.toISOString(),
        };
      }));
      
      // Apply SLA filter client-side (could be optimized later)
      let filteredData = enrichedData;
      if (req.query.slaSeverity && req.query.slaSeverity !== 'all') {
        filteredData = enrichedData.filter(r => r.slaSeverity === req.query.slaSeverity);
      }
      
      res.json({
        data: filteredData,
        page: result.page,
        pageSize: result.pageSize,
        total: result.total,
        totalPages: result.totalPages,
      });
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  app.patch("/api/admin/repairs/:id/status", requireRole("admin"), async (req, res) => {
    try {
      // Validate with Zod schema
      const validatedData = updateRepairStatusSchema.parse(req.body);
      const repair = await storage.updateRepairOrderStatus(req.params.id, validatedData.status);
      setActivityEntity(res, { type: 'repairs', id: req.params.id });
      
      await storage.invalidateCache('overview_%');
      await storage.invalidateCache('centers_%');
      
      res.json(repair);
    } catch (error: any) {
      res.status(400).send(error.message);
    }
  });

  // Skip diagnosis for admin - go directly from ingressato to preventivo_emesso
  app.post("/api/admin/repairs/:id/skip-diagnosis", requireRole("admin", "admin_staff"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      const { reason } = z.object({ reason: z.string().optional() }).parse(req.body);
      
      const repair = await storage.getRepairOrder(req.params.id);
      if (!repair) return res.status(404).send("Ordine di riparazione non trovato");
      
      // Can only skip diagnosis from ingressato state
      if (repair.status !== 'ingressato') {
        return res.status(400).send("La diagnosi può essere saltata solo dallo stato 'ingressato'");
      }
      
      // Update repair order with skip flag and move to in_diagnosi (to allow quote creation)
      const updated = await storage.updateRepairOrder(req.params.id, {
        skipDiagnosis: true,
        skipDiagnosisReason: reason || null,
        status: 'in_diagnosi' as any,
      });
      
      // Log the state transition - close previous state and create new one
      await storage.closeRepairOrderStateHistory(req.params.id, req.user.id);
      await storage.createRepairOrderStateHistory({
        repairOrderId: req.params.id,
        status: 'in_diagnosi' as any,
        enteredAt: new Date(),
        changedBy: req.user.id,
      });
      
      setActivityEntity(res, { type: 'repairs', id: req.params.id });
      
      await storage.invalidateCache('overview_%');
      await storage.invalidateCache('centers_%');
      
      res.json(updated);
    } catch (error: any) {
      console.error("Error skipping diagnosis:", error);
      res.status(400).send(error.message);
    }
  });

  // Tickets (Admin)
  app.get("/api/admin/tickets", requireRole("admin"), async (req, res) => {
    try {
      const tickets = await storage.listTickets();
      res.json(tickets);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  app.get("/api/admin/tickets/:id/messages", requireRole("admin"), async (req, res) => {
    try {
      const messages = await storage.listTicketMessages(req.params.id);
      res.json(messages);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  app.post("/api/admin/tickets/:id/messages", requireRole("admin"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      // Validate with Zod schema
      const validatedData = createTicketMessageSchema.parse(req.body);

      // Verify ticket exists before adding message
      const ticket = await storage.getTicket(req.params.id);
      if (!ticket) {
        return res.status(404).send("Ticket not found");
      }

      const message = await storage.createTicketMessage({
        ticketId: req.params.id,
        userId: req.body.userId || req.user.id,
        message: validatedData.message,
        isInternal: validatedData.isInternal,
      });
      setActivityEntity(res, { type: 'ticket-messages', id: message.id });
      res.status(201).json(message);
    } catch (error: any) {
      res.status(400).send(error.message);
    }
  });

  app.patch("/api/admin/tickets/:id/status", requireRole("admin"), async (req, res) => {
    try {
      // Validate with Zod schema
      const validatedData = updateTicketStatusSchema.parse(req.body);
      const ticket = await storage.updateTicketStatus(req.params.id, validatedData.status);
      setActivityEntity(res, { type: 'tickets', id: req.params.id });
      res.json(ticket);
    } catch (error: any) {
      res.status(400).send(error.message);
    }
  });

  // Inventory (Admin)
  app.get("/api/admin/inventory", requireRole("admin"), async (req, res) => {
    try {
      const inventory = await storage.listInventoryStock();
      res.json(inventory);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // Invoices (Admin)
  app.get("/api/admin/invoices", requireRole("admin"), async (req, res) => {
    try {
      const invoices = await storage.listInvoices();
      res.json(invoices);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  app.post("/api/admin/invoices", requireRole("admin"), async (req, res) => {
    try {
      const validatedData = insertInvoiceSchema.parse(req.body);
      const invoice = await storage.createInvoice(validatedData);
      setActivityEntity(res, { type: 'invoices', id: invoice.id });
      
      await storage.invalidateCache('overview_%');
      await storage.invalidateCache('revenue_%');
      
      res.status(201).json(invoice);
    } catch (error: any) {
      res.status(400).send(error.message);
    }
  });

  // Billing Data (Admin)
  app.post("/api/admin/billing-data", requireRole("admin"), async (req, res) => {
    try {
      const validatedData = insertBillingDataSchema.parse(req.body);
      const billing = await storage.createBillingData(validatedData);
      setActivityEntity(res, { type: 'billing-data', id: billing.id });
      res.status(201).json(billing);
    } catch (error: any) {
      res.status(400).send(error.message);
    }
  });

  // Inventory Movements (Admin)
  app.post("/api/admin/inventory/movements", requireRole("admin"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      const validatedData = insertInventoryMovementSchema.parse(req.body);

      const movement = await storage.createInventoryMovement({
        productId: validatedData.productId,
        repairCenterId: validatedData.repairCenterId,
        movementType: validatedData.movementType,
        quantity: validatedData.quantity,
        notes: validatedData.notes,
        createdBy: req.user.id, // Force from authenticated session
      });
      setActivityEntity(res, { type: 'inventory', id: movement.id });
      res.status(201).json(movement);
    } catch (error: any) {
      res.status(400).send(error.message);
    }
  });

  // Export Data (Admin)
  app.get("/api/admin/export/:type", requireRole("admin"), async (req, res) => {
    try {
      const { type } = req.params;
      const { startDate, endDate, status, centerId } = req.query;

      // Create workbook
      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'MonkeyPlan Admin';
      workbook.created = new Date();

      let data: any[] = [];
      let fileName = '';
      let sheetName = '';

      // Fetch and format data based on type
      switch (type) {
        case 'invoices':
          const invoices = await storage.listInvoices();
          data = invoices
            .filter(inv => {
              if (startDate && new Date(inv.createdAt) < new Date(startDate as string)) return false;
              if (endDate && new Date(inv.createdAt) > new Date(endDate as string)) return false;
              if (status && inv.paymentStatus !== status) return false;
              return true;
            })
            .map(inv => ({
              'Invoice Number': inv.invoiceNumber,
              'Repair Order ID': inv.repairOrderId,
              'Amount': inv.amount,
              'Payment Status': inv.paymentStatus,
              'Payment Method': inv.paymentMethod,
              'Created At': new Date(inv.createdAt).toLocaleString(),
            }));
          fileName = 'invoices_export.xlsx';
          sheetName = 'Invoices';
          break;

        case 'inventory':
          const inventory = await storage.listInventoryStock(centerId as string | undefined);
          data = inventory
            .filter(item => {
              if (startDate && new Date(item.updatedAt) < new Date(startDate as string)) return false;
              if (endDate && new Date(item.updatedAt) > new Date(endDate as string)) return false;
              if (centerId && item.repairCenterId !== centerId) return false;
              return true;
            })
            .map(item => ({
              'Product ID': item.productId,
              'Repair Center ID': item.repairCenterId,
              'Quantity': item.quantity,
              'Last Updated': new Date(item.updatedAt).toLocaleString(),
            }));
          fileName = 'inventory_export.xlsx';
          sheetName = 'Inventory';
          break;

        case 'repairs':
          const repairs = await storage.listRepairOrders();
          const filteredRepairs = repairs.filter(rep => {
            if (startDate && new Date(rep.createdAt) < new Date(startDate as string)) return false;
            if (endDate && new Date(rep.createdAt) > new Date(endDate as string)) return false;
            if (status && rep.status !== status) return false;
            return true;
          });
          
          // Build maps for names (parallel fetch)
          const exportCustomerIds = [...new Set(filteredRepairs.map(r => r.customerId).filter(Boolean))];
          const exportResellerIds = [...new Set(filteredRepairs.map(r => r.resellerId).filter(Boolean))];
          const exportRepairCenterIds = [...new Set(filteredRepairs.map(r => r.repairCenterId).filter(Boolean))];
          
          const exportCustomersMap = new Map<string, string>();
          const exportResellersMap = new Map<string, string>();
          const exportRepairCentersMap = new Map<string, string>();
          
          // Fetch all entities in parallel
          const [customerResults, resellerResults, repairCenterResults] = await Promise.all([
            Promise.all(exportCustomerIds.map(id => storage.getUser(id))),
            Promise.all(exportResellerIds.map(id => storage.getUser(id))),
            Promise.all(exportRepairCenterIds.map(id => storage.getRepairCenter(id))),
          ]);
          
          customerResults.forEach((user, idx) => {
            if (user) exportCustomersMap.set(exportCustomerIds[idx], user.ragioneSociale || user.fullName || user.username);
          });
          resellerResults.forEach((user, idx) => {
            if (user) exportResellersMap.set(exportResellerIds[idx], user.ragioneSociale || user.fullName || user.username);
          });
          repairCenterResults.forEach((rc, idx) => {
            if (rc) exportRepairCentersMap.set(exportRepairCenterIds[idx], rc.name);
          });
          
          data = filteredRepairs.map(rep => ({
            'Numero Ordine': rep.orderNumber,
            'Cliente': rep.customerId ? exportCustomersMap.get(rep.customerId) || '' : '',
            'Rivenditore': rep.resellerId ? exportResellersMap.get(rep.resellerId) || '' : '',
            'Centro Riparazione': rep.repairCenterId ? exportRepairCentersMap.get(rep.repairCenterId) || '' : '',
            'Tipo Dispositivo': rep.deviceType,
            'Modello': rep.deviceModel || '',
            'Problema': rep.issueDescription,
            'Stato': rep.status,
            'Costo Stimato': rep.estimatedCost ? (rep.estimatedCost / 100).toFixed(2) : '',
            'Costo Finale': rep.finalCost ? (rep.finalCost / 100).toFixed(2) : '',
            'Creato Il': new Date(rep.createdAt).toLocaleString('it-IT'),
            'Aggiornato Il': new Date(rep.updatedAt).toLocaleString('it-IT'),
          }));
          fileName = 'repairs_export.xlsx';
          sheetName = 'Lavorazioni';
          break;

        case 'users':
          const users = await storage.listUsers();
          data = users
            .filter(user => {
              if (startDate && new Date(user.createdAt) < new Date(startDate as string)) return false;
              if (endDate && new Date(user.createdAt) > new Date(endDate as string)) return false;
              if (status && user.role !== status) return false;
              return true;
            })
            .map(user => ({
              'Username': user.username,
              'Full Name': user.fullName,
              'Email': user.email,
              'Phone': user.phone,
              'Role': user.role,
              'Repair Center ID': user.repairCenterId,
              'Created At': new Date(user.createdAt).toLocaleString(),
            }));
          fileName = 'users_export.xlsx';
          sheetName = 'Users';
          break;

        default:
          return res.status(400).send('Invalid export type');
      }

      // Create worksheet
      const worksheet = workbook.addWorksheet(sheetName);

      if (data.length > 0) {
        // Add headers
        const headers = Object.keys(data[0]);
        worksheet.addRow(headers);

        // Style header row
        worksheet.getRow(1).font = { bold: true };
        worksheet.getRow(1).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFE0E0E0' }
        };

        // Add data rows
        data.forEach(row => {
          worksheet.addRow(Object.values(row));
        });

        // Auto-fit columns
        worksheet.columns.forEach(column => {
          let maxLength = 0;
          column.eachCell?.({ includeEmpty: true }, (cell) => {
            const length = cell.value ? cell.value.toString().length : 10;
            if (length > maxLength) maxLength = length;
          });
          column.width = Math.min(maxLength + 2, 50);
        });
      }

      // Set response headers
      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);

      // Write to response
      await workbook.xlsx.write(res);
      res.end();
    } catch (error: any) {
      console.error('Export error:', error);
      res.status(500).send(error.message);
    }
  });

  // Analytics (Admin)
  app.get("/api/admin/analytics/overview", requireRole("admin"), async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      
      const cacheKey = `overview_${startDate || 'all'}_${endDate || 'all'}`;
      const cached = await storage.getCachedAnalytics(cacheKey);
      
      if (cached) {
        return res.json(cached);
      }
      
      const period = startDate && endDate ? {
        start: new Date(startDate as string),
        end: new Date(endDate as string)
      } : undefined;
      
      const data = await storage.getOverviewKPIs(period);
      
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 15);
      await storage.setCachedAnalytics(cacheKey, data, expiresAt);
      
      res.json(data);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  app.get("/api/admin/analytics/revenue", requireRole("admin"), async (req, res) => {
    try {
      const { startDate, endDate, groupBy = 'month' } = req.query;
      
      if (!startDate || !endDate) {
        return res.status(400).send("startDate and endDate are required");
      }
      
      const cacheKey = `revenue_${startDate}_${endDate}_${groupBy}`;
      const cached = await storage.getCachedAnalytics(cacheKey);
      
      if (cached) {
        return res.json(cached);
      }
      
      const data = await storage.getRevenueByPeriod(
        new Date(startDate as string),
        new Date(endDate as string),
        groupBy as 'day' | 'week' | 'month'
      );
      
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 30);
      await storage.setCachedAnalytics(cacheKey, data, expiresAt);
      
      res.json(data);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  app.get("/api/admin/analytics/repair-centers/performance", requireRole("admin"), async (req, res) => {
    try {
      const { centerId, startDate, endDate } = req.query;
      
      const cacheKey = `centers_${centerId || 'all'}_${startDate || 'all'}_${endDate || 'all'}`;
      const cached = await storage.getCachedAnalytics(cacheKey);
      
      if (cached) {
        return res.json(cached);
      }
      
      const period = startDate && endDate ? {
        start: new Date(startDate as string),
        end: new Date(endDate as string)
      } : undefined;
      
      const data = await storage.getRepairCenterPerformance(
        centerId as string | undefined,
        period
      );
      
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 20);
      await storage.setCachedAnalytics(cacheKey, data, expiresAt);
      
      res.json(data);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  app.get("/api/admin/analytics/products/top", requireRole("admin"), async (req, res) => {
    try {
      const { limit = '10', startDate, endDate } = req.query;
      
      const cacheKey = `products_${limit}_${startDate || 'all'}_${endDate || 'all'}`;
      const cached = await storage.getCachedAnalytics(cacheKey);
      
      if (cached) {
        return res.json(cached);
      }
      
      const period = startDate && endDate ? {
        start: new Date(startDate as string),
        end: new Date(endDate as string)
      } : undefined;
      
      const data = await storage.getTopProducts(parseInt(limit as string), period);
      
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 30);
      await storage.setCachedAnalytics(cacheKey, data, expiresAt);
      
      res.json(data);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // ============ RESELLER ROUTES ============

  // Reseller Logo Upload - Upload logo for reseller
  app.post("/api/resellers/:id/logo", requireAuth, upload.single("logo"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      const resellerId = req.params.id;
      
      // Only the reseller themselves or an admin can upload logo
      if (req.user.role !== 'admin' && req.user.id !== resellerId) {
        return res.status(403).send("Non autorizzato a modificare questo profilo");
      }
      
      const reseller = await storage.getUser(resellerId);
      if (!reseller || reseller.role !== 'reseller') {
        return res.status(404).send("Rivenditore non trovato");
      }
      
      if (!req.file) {
        return res.status(400).send("Nessun file caricato");
      }
      
      const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp"];
      if (!allowedMimeTypes.includes(req.file.mimetype)) {
        return res.status(400).send("Formato immagine non supportato. Usa JPEG, PNG o WebP.");
      }
      
      const maxSize = 2 * 1024 * 1024; // 2MB
      if (req.file.size > maxSize) {
        return res.status(400).send("Immagine troppo grande. Massimo 2MB.");
      }
      
      const ext = req.file.originalname.split(".").pop() || "jpg";
      const objectPath = `resellers/${resellerId}/logo.${ext}`;
      
      const privateObjectDir = objectStorage.getPrivateObjectDir();
      const fullPath = `${privateObjectDir}/${objectPath}`;
      const { bucketName, objectName } = parseObjectPath(fullPath);
      const bucket = objectStorageClient.bucket(bucketName);
      const file = bucket.file(objectName);
      
      await file.save(req.file.buffer, {
        metadata: { contentType: req.file.mimetype }
      });
      
      const logoUrl = `/objects/${objectPath}`;
      
      await storage.updateUser(resellerId, { logoUrl });
      
      res.json({ logoUrl });
    } catch (error: any) {
      console.error("Error uploading reseller logo:", error);
      res.status(500).send(error.message);
    }
  });

  // Delete reseller logo
  app.delete("/api/resellers/:id/logo", requireAuth, async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      const resellerId = req.params.id;
      
      // Only the reseller themselves or an admin can delete logo
      if (req.user.role !== 'admin' && req.user.id !== resellerId) {
        return res.status(403).send("Non autorizzato a modificare questo profilo");
      }
      
      // Get current user to find existing logo path
      const reseller = await storage.getUser(resellerId);
      if (reseller?.logoUrl) {
        try {
          // Extract object path from URL and delete from storage
          const objectPath = reseller.logoUrl.replace('/objects/', '');
          const privateObjectDir = objectStorage.getPrivateObjectDir();
          const fullPath = `${privateObjectDir}/${objectPath}`;
          const { bucketName, objectName } = parseObjectPath(fullPath);
          const bucket = objectStorageClient.bucket(bucketName);
          const file = bucket.file(objectName);
          await file.delete().catch(() => {}); // Ignore errors if file doesn't exist
        } catch (deleteError) {
          console.error("Error deleting logo file:", deleteError);
        }
      }
      
      await storage.updateUser(resellerId, { logoUrl: null });
      
      res.sendStatus(204);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  function getEffectiveContext(req: Request): { resellerId: string; repairCenterId?: string; isActingAs: boolean } {
    const actingAs = (req.session as any).actingAs;
    const baseResellerId = req.user!.role === 'reseller_staff' 
      ? req.user!.resellerId! 
      : req.user!.id;
    
    if (actingAs && actingAs.type === 'reseller') {
      return { resellerId: actingAs.id, isActingAs: true };
    }
    if (actingAs && actingAs.type === 'repair_center') {
      return { resellerId: baseResellerId, repairCenterId: actingAs.id, isActingAs: true };
    }
    return { resellerId: baseResellerId, isActingAs: false };
  }

  // Context Switching for Parent Resellers (Franchising/GDO)
  // Get available entities to switch context to
  app.get("/api/reseller/context-options", requireRole("reseller"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      // Get repair centers owned by this reseller (all resellers can view their centers)
      const repairCenters = await storage.getRepairCentersForReseller(req.user.id);
      
      // Only franchising/gdo resellers can see child resellers
      let childResellers: any[] = [];
      if (req.user.resellerCategory === 'franchising' || req.user.resellerCategory === 'gdo') {
        childResellers = await storage.getChildResellers(req.user.id);
      }
      
      res.json({
        childResellers: childResellers.map(r => ({
          id: r.id,
          name: r.fullName,
          email: r.email,
          username: r.username,
        })),
        repairCenters: repairCenters.map(rc => ({
          id: rc.id,
          name: rc.name,
          city: rc.city,
        })),
      });
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // Get sub-resellers with enriched data (customers count, repair centers count)
  app.get("/api/reseller/sub-resellers", requireRole("reseller"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      // Only franchising/gdo resellers can see sub-resellers
      if (req.user.resellerCategory !== 'franchising' && req.user.resellerCategory !== 'gdo') {
        return res.json([]);
      }
      
      const childResellers = await storage.getChildResellers(req.user.id);
      
      // Enrich with counts
      const enrichedResellers = await Promise.all(
        childResellers.map(async (reseller) => {
          const customers = await storage.listCustomers({ resellerId: reseller.id });
          const repairCenters = await storage.getRepairCentersForReseller(reseller.id);
          
          return {
            id: reseller.id,
            fullName: reseller.fullName,
            email: reseller.email,
            username: reseller.username,
            phone: reseller.phone,
            resellerCategory: reseller.resellerCategory,
            isActive: reseller.isActive,
            createdAt: reseller.createdAt,
            customersCount: customers.length,
            repairCentersCount: repairCenters.length,
            partitaIva: reseller.partitaIva,
            ragioneSociale: reseller.ragioneSociale,
            codiceFiscale: reseller.codiceFiscale,
            indirizzo: reseller.indirizzo,
            citta: reseller.citta,
            cap: reseller.cap,
            provincia: reseller.provincia,
            pec: reseller.pec,
            codiceUnivoco: reseller.codiceUnivoco,
            hasAutonomousInvoicing: reseller.hasAutonomousInvoicing,
          };
        })
      );
      
      res.json(enrichedResellers);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // Get sub-resellers e-commerce data (for franchising/GDO resellers)
  app.get("/api/reseller/sub-resellers/ecommerce", requireRole("reseller"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      // Only franchising/gdo resellers can see sub-resellers e-commerce
      if (req.user.resellerCategory !== 'franchising' && req.user.resellerCategory !== 'gdo') {
        return res.json([]);
      }
      
      const childResellers = await storage.getChildResellers(req.user.id);
      
      // Get e-commerce data for each sub-reseller
      const ecommerceData = await Promise.all(
        childResellers.map(async (reseller) => {
          // Get product assignments
          const assignments = await storage.listResellerProducts({ resellerId: reseller.id });
          const publishedCount = assignments.filter(a => a.isPublished).length;
          
          // Get sales orders
          const orders = await storage.listSalesOrders({ resellerId: reseller.id });
          const totalRevenue = orders.reduce((sum, o) => sum + (o.total || 0), 0);
          const pendingOrders = orders.filter(o => o.status === 'pending' || o.status === 'processing').length;
          const lastOrder = orders.sort((a, b) => 
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          )[0];
          
          return {
            resellerId: reseller.id,
            resellerName: reseller.fullName,
            totalOrders: orders.length,
            totalRevenue,
            productsAssigned: assignments.length,
            productsPublished: publishedCount,
            pendingOrders,
            lastOrderDate: lastOrder?.createdAt || null,
          };
        })
      );
      
      res.json(ecommerceData);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // Get single sub-reseller detail (for franchising/GDO parent resellers)
  app.get("/api/reseller/sub-resellers/:id", requireRole("reseller"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      // Only franchising/gdo resellers can view sub-reseller details
      if (req.user.resellerCategory !== 'franchising' && req.user.resellerCategory !== 'gdo') {
        return res.status(403).send("Solo i rivenditori franchising/GDO possono visualizzare sub-rivenditori");
      }
      
      const { id } = req.params;
      
      // Verify sub-reseller belongs to this parent
      const subReseller = await storage.getSubResellerDetail(req.user.id, id);
      if (!subReseller) {
        return res.status(404).send("Sub-rivenditore non trovato");
      }
      
      // Get enriched data
      const customers = await storage.listCustomers({ resellerId: subReseller.id });
      const repairCenters = await storage.getRepairCentersForReseller(subReseller.id);
      
      // Return full details without password
      const { password: _, ...safeUser } = subReseller;
      
      res.json({
        ...safeUser,
        customersCount: customers.length,
        repairCentersCount: repairCenters.length,
      });
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // Create sub-reseller (for franchising/GDO parent resellers)
  app.post("/api/reseller/sub-resellers", requireRole("reseller"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      // Only franchising/gdo resellers can create sub-resellers
      if (req.user.resellerCategory !== 'franchising' && req.user.resellerCategory !== 'gdo') {
        return res.status(403).send("Solo i rivenditori franchising/GDO possono creare sub-rivenditori");
      }
      
      const validatedData = insertUserSchema.parse(req.body);
      
      // Check for duplicate email
      const existingEmail = await storage.getUserByEmail(validatedData.email);
      if (existingEmail) {
        return res.status(400).send("Email già registrata nel sistema");
      }
      
      // Check for duplicate username
      const existingUsername = await storage.getUserByUsername(validatedData.username);
      if (existingUsername) {
        return res.status(400).send("Username già in uso");
      }
      
      // Check for duplicate partita IVA (only if provided and not empty)
      if (validatedData.partitaIva && validatedData.partitaIva.trim() !== '') {
        const existingPartitaIva = await storage.getUserByPartitaIva(validatedData.partitaIva.trim());
        if (existingPartitaIva) {
          return res.status(400).send("Partita IVA già registrata nel sistema");
        }
      }
      
      // Hash password before storing
      const hashedPassword = await hashPassword(validatedData.password);
      
      // Force role to reseller and set parent
      const user = await storage.createUser({
        ...validatedData,
        password: hashedPassword,
        role: 'reseller',
        resellerCategory: validatedData.resellerCategory || 'standard',
        parentResellerId: req.user.id,
        hasAutonomousInvoicing: validatedData.hasAutonomousInvoicing ?? false,
      });
      
      // Create automatic warehouse for new sub-reseller
      await storage.ensureDefaultWarehouse('sub_reseller', user.id, user.fullName || user.username);
      
      setActivityEntity(res, { type: 'users', id: user.id });
      
      // Return user without password
      const { password: _, ...safeUser } = user;
      res.status(201).json(safeUser);
    } catch (error: any) {
      res.status(400).send(error.message);
    }
  });

  // Update sub-reseller (for franchising/GDO parent resellers)
  app.patch("/api/reseller/sub-resellers/:id", requireRole("reseller"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      // Only franchising/gdo resellers can update sub-resellers
      if (req.user.resellerCategory !== 'franchising' && req.user.resellerCategory !== 'gdo') {
        return res.status(403).send("Solo i rivenditori franchising/GDO possono modificare sub-rivenditori");
      }
      
      const { id } = req.params;
      
      // Verify sub-reseller belongs to this parent
      const childResellers = await storage.getChildResellers(req.user.id);
      const subReseller = childResellers.find(r => r.id === id);
      if (!subReseller) {
        return res.status(404).send("Sub-rivenditore non trovato");
      }
      
      // Only allow specific safe fields to be updated - explicitly destructure and ignore dangerous fields
      const { 
        fullName, email, phone, isActive, resellerCategory, password, hasAutonomousInvoicing,
        partitaIva, ragioneSociale, codiceFiscale, indirizzo, citta, cap, provincia, pec, codiceUnivoco
      } = req.body;
      
      // Check for duplicate email if changing
      if (email && email !== subReseller.email) {
        const existingEmail = await storage.getUserByEmail(email);
        if (existingEmail) {
          return res.status(400).send("Email già registrata nel sistema");
        }
      }
      
      // Check for duplicate partita IVA if changing
      if (partitaIva && partitaIva.trim() !== '' && partitaIva !== subReseller.partitaIva) {
        const existingPartitaIva = await storage.getUserByPartitaIva(partitaIva.trim());
        if (existingPartitaIva) {
          return res.status(400).send("Partita IVA già registrata nel sistema");
        }
      }
      
      // Build updates object with only whitelisted fields
      const updates: any = {};
      if (fullName !== undefined && typeof fullName === 'string') updates.fullName = fullName;
      if (email !== undefined && typeof email === 'string') updates.email = email;
      if (phone !== undefined) updates.phone = typeof phone === 'string' ? phone : null;
      if (isActive !== undefined && typeof isActive === 'boolean') updates.isActive = isActive;
      if (resellerCategory !== undefined && typeof resellerCategory === 'string' && 
          ['standard', 'franchising', 'gdo'].includes(resellerCategory)) {
        updates.resellerCategory = resellerCategory;
      }
      if (password && typeof password === 'string' && password.length >= 6) {
        updates.password = await hashPassword(password);
      }
      // Fiscal data fields
      if (partitaIva !== undefined) updates.partitaIva = typeof partitaIva === 'string' ? partitaIva : null;
      if (ragioneSociale !== undefined) updates.ragioneSociale = typeof ragioneSociale === 'string' ? ragioneSociale : null;
      if (codiceFiscale !== undefined) updates.codiceFiscale = typeof codiceFiscale === 'string' ? codiceFiscale : null;
      if (indirizzo !== undefined) updates.indirizzo = typeof indirizzo === 'string' ? indirizzo : null;
      if (citta !== undefined) updates.citta = typeof citta === 'string' ? citta : null;
      if (cap !== undefined) updates.cap = typeof cap === 'string' ? cap : null;
      if (provincia !== undefined) updates.provincia = typeof provincia === 'string' ? provincia : null;
      if (pec !== undefined) updates.pec = typeof pec === 'string' ? pec : null;
      if (codiceUnivoco !== undefined) updates.codiceUnivoco = typeof codiceUnivoco === 'string' ? codiceUnivoco : null;
      if (hasAutonomousInvoicing !== undefined && typeof hasAutonomousInvoicing === 'boolean') updates.hasAutonomousInvoicing = hasAutonomousInvoicing;
      
      const updated = await storage.updateUser(id, updates);
      
      setActivityEntity(res, { type: 'users', id: updated.id });
      
      // Return user without password
      const { password: _, ...safeUser } = updated;
      res.json(safeUser);
    } catch (error: any) {
      res.status(400).send(error.message);
    }
  });

  // Delete sub-reseller (for franchising/GDO parent resellers)
  app.delete("/api/reseller/sub-resellers/:id", requireRole("reseller"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      // Only franchising/gdo resellers can delete sub-resellers
      if (req.user.resellerCategory !== 'franchising' && req.user.resellerCategory !== 'gdo') {
        return res.status(403).send("Solo i rivenditori franchising/GDO possono eliminare sub-rivenditori");
      }
      
      const { id } = req.params;
      
      // Verify sub-reseller belongs to this parent
      const childResellers = await storage.getChildResellers(req.user.id);
      const subReseller = childResellers.find(r => r.id === id);
      if (!subReseller) {
        return res.status(404).send("Sub-rivenditore non trovato");
      }
      
      // Check for active repairs
      const allRepairs = await storage.listRepairOrders();
      const subResellerRepairs = allRepairs.filter(r => r.resellerId === id);
      const terminalStatuses = ["consegnato", "cancelled"];
      const activeRepairs = subResellerRepairs.filter(r => !terminalStatuses.includes(r.status));
      
      if (activeRepairs.length > 0) {
        return res.status(409).json({
          error: "ACTIVE_REPAIRS",
          message: `Impossibile eliminare: il sub-rivenditore ha ${activeRepairs.length} riparazione/i attiva/e`,
          activeRepairsCount: activeRepairs.length
        });
      }
      
      // Check for repair centers
      const repairCenters = await storage.getRepairCentersForReseller(id);
      if (repairCenters.length > 0) {
        return res.status(409).json({
          error: "HAS_REPAIR_CENTERS",
          message: `Impossibile eliminare: il sub-rivenditore ha ${repairCenters.length} centro/i di riparazione associati`,
          repairCentersCount: repairCenters.length
        });
      }
      
      await storage.deleteUser(id);
      
      setActivityEntity(res, { type: 'users', id });
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });


  // Get sub-reseller team (for parent resellers to view sub-reseller staff)
  app.get("/api/reseller/sub-resellers/:id/team", requireRole("reseller"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Non autorizzato");
      
      // Only franchising/gdo resellers can view sub-reseller teams
      if (req.user.resellerCategory !== 'franchising' && req.user.resellerCategory !== 'gdo') {
        return res.status(403).send("Solo i rivenditori franchising/GDO possono visualizzare i team dei sub-rivenditori");
      }
      
      const { id } = req.params;
      
      // Verify sub-reseller exists and belongs to this parent
      const subReseller = await storage.getUser(id);
      if (!subReseller || subReseller.role !== 'reseller' || subReseller.parentResellerId !== req.user.id) {
        return res.status(404).send("Sub-rivenditore non trovato o non autorizzato");
      }
      
      // Get the sub-reseller's team (staff + owner)
      const staff = await storage.listResellerStaff(id);
      
      // Return without password
      const safeStaff = staff.map((s: any) => {
        const { password: _, ...safe } = s;
        return safe;
      });
      
      res.json(safeStaff);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // Get repair center team (for resellers to view repair center staff)
  app.get("/api/reseller/repair-centers/:id/team", requireRole("reseller", "reseller_staff"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Non autorizzato");
      
      const resellerId = req.user.role === 'reseller' ? req.user.id : req.user.resellerId;
      if (!resellerId) return res.status(400).send("Reseller ID non trovato");
      
      const { id } = req.params;
      
      // Get the repair center to verify ownership
      const repairCenter = await storage.getRepairCenter(id);
      if (!repairCenter) {
        return res.status(404).send("Centro di riparazione non trovato");
      }
      
      // Check if this reseller can access this repair center
      const accessibleIds = await storage.getAccessibleResellerIds(resellerId);
      if (!accessibleIds.includes(repairCenter.resellerId)) {
        return res.status(403).send("Non autorizzato a visualizzare questo centro");
      }
      
      // Get the repair center's team (staff + owner)
      const staff = await storage.listRepairCenterStaff(id);
      
      // Return without password
      const safeStaff = staff.map((s: any) => {
        const { password: _, ...safe } = s;
        return safe;
      });
      
      res.json(safeStaff);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });
  // Assign products to sub-resellers (for franchising/GDO resellers)
  app.post("/api/reseller/sub-resellers/:subResellerId/assign-products", requireRole("reseller"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      // Only franchising/gdo resellers can assign to sub-resellers
      if (req.user.resellerCategory !== 'franchising' && req.user.resellerCategory !== 'gdo') {
        return res.status(403).send("Solo i rivenditori franchising/GDO possono assegnare prodotti ai sub-rivenditori");
      }
      
      // Verify sub-reseller belongs to this parent
      const childResellers = await storage.getChildResellers(req.user.id);
      const subReseller = childResellers.find(r => r.id === req.params.subResellerId);
      if (!subReseller) {
        return res.status(404).send("Sub-rivenditore non trovato");
      }
      
      const { productIds } = z.object({
        productIds: z.array(z.string()).min(1),
      }).parse(req.body);
      
      // Get parent's product assignments to verify they can be propagated
      const parentAssignments = await storage.listResellerProducts({ resellerId: req.user.id });
      const validProductIds = productIds.filter(pid => 
        parentAssignments.some(a => a.productId === pid)
      );
      
      if (validProductIds.length === 0) {
        return res.status(400).send("Nessun prodotto valido da assegnare");
      }
      
      // Assign products with inheritance chain
      const results = await Promise.all(
        validProductIds.map(async (productId) => {
          const existing = await storage.getResellerProduct(productId, req.params.subResellerId);
          if (existing) return existing;
          
          return storage.assignProductToReseller({
            productId,
            resellerId: req.params.subResellerId,
            isPublished: false,
            inheritedFrom: req.user!.id,
            createdBy: req.user!.id,
          });
        })
      );
      
      res.json({ 
        message: `${results.length} prodotti assegnati al sub-rivenditore`,
        assignments: results 
      });
    } catch (error: any) {
      res.status(400).send(error.message);
    }
  });

  // Set active context (switch to view sub-reseller or repair center data)
  app.post("/api/reseller/context", requireRole("reseller"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      const { type, id } = req.body;
      
      if (!type || !id) {
        return res.status(400).send("type e id sono obbligatori");
      }
      
      if (type !== 'reseller' && type !== 'repair_center') {
        return res.status(400).send("type deve essere 'reseller' o 'repair_center'");
      }
      
      // Validate ownership
      if (type === 'reseller') {
        // Only franchising/gdo resellers can switch to sub-resellers
        if (req.user.resellerCategory !== 'franchising' && req.user.resellerCategory !== 'gdo') {
          return res.status(403).send("Solo i rivenditori franchising/GDO possono visualizzare sub-rivenditori");
        }
        const childResellers = await storage.getChildResellers(req.user.id);
        const child = childResellers.find(r => r.id === id);
        if (!child) {
          return res.status(403).send("Non hai accesso a questo rivenditore");
        }
        (req.session as any).actingAs = { type: 'reseller', id, name: child.fullName };
      } else {
        // All resellers can view their repair centers
        const repairCenters = await storage.getRepairCentersForReseller(req.user.id);
        const center = repairCenters.find(rc => rc.id === id);
        if (!center) {
          return res.status(403).send("Non hai accesso a questo centro di riparazione");
        }
        (req.session as any).actingAs = { type: 'repair_center', id, name: center.name };
      }
      
      res.json({ 
        success: true, 
        actingAs: (req.session as any).actingAs 
      });
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // Clear active context (return to main reseller view)
  app.delete("/api/reseller/context", requireRole("reseller"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      // All resellers can clear context
      delete (req.session as any).actingAs;
      
      res.json({ success: true, actingAs: null });
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // Get current context status
  app.get("/api/reseller/context", requireRole("reseller"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      const actingAs = (req.session as any).actingAs || null;
      
      res.json({ actingAs });
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  app.get("/api/reseller/stats", requireRole("reseller"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");

      // Use effective context (may be acting as sub-reseller or viewing repair center)
      const context = getEffectiveContext(req);
      
      let repairs;
      let customers;
      
      if (context.repairCenterId) {
        // Viewing specific repair center
        repairs = await storage.listRepairOrders({ repairCenterId: context.repairCenterId });
        customers = [];
      } else {
        repairs = await storage.listRepairOrders({ resellerId: context.resellerId });
        customers = await storage.listCustomers({ resellerId: context.resellerId });
      }

      const stats = {
        totalOrders: repairs.length,
        activeRepairs: repairs.filter(r => r.status === "in_progress" || r.status === "pending").length,
        totalCustomers: customers.length,
        pendingRepairs: repairs.filter(r => r.status === "pending").length,
      };

      res.json(stats);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  app.get("/api/reseller/repairs", requireRole("reseller", "reseller_staff"), requireModulePermission("repairs", "read"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      // Use effective context (may be acting as sub-reseller or viewing repair center)
      const context = getEffectiveContext(req);
      
      // If acting as repair center, filter by that center only
      if (context.repairCenterId) {
        const repairs = await storage.listRepairOrders({ repairCenterId: context.repairCenterId });
        repairs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        return res.json(repairs);
      }
      
      // Get repairs where resellerId matches OR customer belongs to this reseller
      const customers = await storage.listCustomers({ resellerId: context.resellerId });
      const customerIds = customers.map(c => c.id);
      
      // Get repairs by resellerId OR by customerIds
      const repairsByReseller = await storage.listRepairOrders({ resellerId: context.resellerId });
      const repairsByCustomers = customerIds.length > 0 
        ? await storage.listRepairOrders({ customerIds })
        : [];
      
      // Merge and deduplicate
      const allRepairs = [...repairsByReseller];
      for (const repair of repairsByCustomers) {
        if (!allRepairs.find(r => r.id === repair.id)) {
          allRepairs.push(repair);
        }
      }
      
      // Sort by createdAt desc
      allRepairs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      res.json(allRepairs);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // Reseller paginated repairs endpoint
  app.get("/api/reseller/repairs/paginated", requireRole("reseller", "reseller_staff"), requireModulePermission("repairs", "read"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      const page = parseInt(req.query.page as string) || 1;
      const pageSize = Math.min(parseInt(req.query.pageSize as string) || 25, 100);
      
      // Use effective context
      const context = getEffectiveContext(req);
      
      const filters: any = { resellerId: context.resellerId };
      if (context.repairCenterId) {
        filters.repairCenterId = context.repairCenterId;
        delete filters.resellerId;
      }
      
      if (req.query.status && req.query.status !== 'all') filters.status = req.query.status;
      if (req.query.repairCenterId && req.query.repairCenterId !== 'all') filters.repairCenterId = req.query.repairCenterId;
      if (req.query.deviceType && req.query.deviceType !== 'all') filters.deviceType = req.query.deviceType;
      if (req.query.search) filters.search = req.query.search;
      if (req.query.startDate) filters.startDate = req.query.startDate;
      if (req.query.endDate) filters.endDate = req.query.endDate;
      
      const result = await storage.listRepairOrdersPaginated({ page, pageSize, filters });
      
      // Enrich with names for display
      const allUsers = await storage.listUsers();
      const customersMap = new Map<string, { fullName: string | null; ragioneSociale: string | null }>();
      
      allUsers.forEach(u => {
        if (u.role === 'customer') {
          customersMap.set(u.id, { fullName: u.fullName, ragioneSociale: u.ragioneSociale });
        }
      });
      
      const allRepairCenters = await storage.listRepairCenters();
      const repairCentersMap = new Map<string, string>();
      allRepairCenters.forEach(rc => repairCentersMap.set(rc.id, rc.name));
      
      // Compute SLA for each order
      const { loadSLAConfig, computeSLASeverity } = await import("./sla-utils");
      const slaConfig = await loadSLAConfig();
      
      const enrichedData = await Promise.all(result.data.map(async (repair) => {
        const currentState = await storage.getCurrentRepairOrderState(repair.id);
        const stateEnteredAt = currentState?.enteredAt || repair.createdAt;
        const { severity, minutesInState, phase } = computeSLASeverity(repair.status, stateEnteredAt, slaConfig);
        
        const customer = repair.customerId ? customersMap.get(repair.customerId) : null;
        const customerName = customer?.ragioneSociale || customer?.fullName || null;
        
        return {
          ...repair,
          customerName,
          repairCenterName: repair.repairCenterId ? repairCentersMap.get(repair.repairCenterId) || null : null,
          slaSeverity: severity,
          slaMinutesInState: minutesInState,
          slaPhase: phase,
          slaEnteredAt: stateEnteredAt.toISOString(),
        };
      }));
      
      // Apply SLA filter client-side
      let filteredData = enrichedData;
      if (req.query.slaSeverity && req.query.slaSeverity !== 'all') {
        filteredData = enrichedData.filter(r => r.slaSeverity === req.query.slaSeverity);
      }
      
      res.json({
        data: filteredData,
        page: result.page,
        pageSize: result.pageSize,
        total: result.total,
        totalPages: result.totalPages,
      });
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  app.post("/api/reseller/repairs", requireRole("reseller", "reseller_staff"), requireModulePermission("repairs", "create"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");

      // Validate with Zod schema - enforce reseller ownership
      const validatedData = insertRepairOrderSchema.pick({
        customerId: true,
        repairCenterId: true,
        deviceType: true,
        deviceModel: true,
        issueDescription: true,
        notes: true,
      }).parse(req.body);

      // Verify customer exists if provided
      if (validatedData.customerId) {
        const customer = await storage.getUser(validatedData.customerId);
        if (!customer || customer.role !== 'customer') {
          return res.status(400).send("Invalid customer");
        }
      }

      // Validate repair center ownership (own centers + sub-reseller centers for franchising/gdo)
      if (validatedData.repairCenterId) {
        const center = await storage.getRepairCenter(validatedData.repairCenterId);
        if (!center || !center.isActive) {
          return res.status(400).send("Centro di riparazione non valido o non attivo");
        }
        
        // Check if center belongs to reseller
        let isAllowed = center.resellerId === req.user.id;
        
        // Franchising/GDO can also use sub-reseller centers
        if (!isAllowed && (req.user.resellerCategory === 'franchising' || req.user.resellerCategory === 'gdo')) {
          const allUsers = await storage.listUsers();
          const subResellerIds = allUsers
            .filter(u => u.role === 'reseller' && u.parentResellerId === req.user!.id && u.isActive)
            .map(u => u.id);
          
          isAllowed = subResellerIds.includes(center.resellerId || '');
        }
        
        if (!isAllowed) {
          return res.status(403).send("Non hai accesso a questo centro di riparazione");
        }
      }

      const repair = await storage.createRepairOrder({
        customerId: validatedData.customerId,
        resellerId: req.user.id, // Force reseller ID from session
        repairCenterId: validatedData.repairCenterId,
        deviceType: validatedData.deviceType,
        deviceModel: validatedData.deviceModel,
        issueDescription: validatedData.issueDescription,
        notes: validatedData.notes,
      });
      setActivityEntity(res, { type: 'repairs', id: repair.id });
      
      // Auto-associate customer with repair center
      if (validatedData.customerId && validatedData.repairCenterId) {
        await storage.ensureCustomerRepairCenterAssociation(validatedData.customerId, validatedData.repairCenterId);
      }
      
      await storage.invalidateCache('overview_%');
      await storage.invalidateCache('centers_%');
      
      res.status(201).json(repair);
    } catch (error: any) {
      res.status(400).send(error.message);
    }
  });

  // Export Repairs (Reseller) - Only their own repairs
  app.get("/api/reseller/export/repairs", requireRole("reseller", "reseller_staff"), requireModulePermission("repairs", "read"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      const { startDate, endDate, status } = req.query;
      const context = getEffectiveContext(req);
      
      // Get all repair orders for this reseller
      const allRepairs = await storage.listRepairOrders();
      
      // Filter by reseller context
      let repairs = allRepairs.filter(r => r.resellerId === context.resellerId);
      
      // If viewing as repair center, filter further
      if (context.repairCenterId) {
        repairs = repairs.filter(r => r.repairCenterId === context.repairCenterId);
      }
      
      // Apply date and status filters
      repairs = repairs.filter(rep => {
        if (startDate && new Date(rep.createdAt) < new Date(startDate as string)) return false;
        if (endDate && new Date(rep.createdAt) > new Date(endDate as string)) return false;
        if (status && rep.status !== status) return false;
        return true;
      });
      
      // Get customer and repair center names
      const users = await storage.listUsers();
      const repairCenters = await storage.getRepairCentersForReseller(context.resellerId);
      const userMap = new Map(users.map(u => [u.id, u.fullName]));
      const centerMap = new Map(repairCenters.map(c => [c.id, c.name]));
      
      // Create workbook
      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'MonkeyPlan Reseller';
      workbook.created = new Date();
      
      const data = repairs.map(rep => ({
        'Numero Ordine': rep.orderNumber,
        'Cliente': rep.customerId ? userMap.get(rep.customerId) || rep.customerId : '-',
        'Centro Riparazione': rep.repairCenterId ? centerMap.get(rep.repairCenterId) || rep.repairCenterId : '-',
        'Tipo Dispositivo': rep.deviceType,
        'Modello': rep.deviceModel,
        'Problema': rep.issueDescription,
        'Stato': rep.status,
        'Costo Stimato': rep.estimatedCost ? (rep.estimatedCost / 100).toFixed(2) : '-',
        'Costo Finale': rep.finalCost ? (rep.finalCost / 100).toFixed(2) : '-',
        'Creato Il': new Date(rep.createdAt).toLocaleString('it-IT'),
        'Aggiornato Il': new Date(rep.updatedAt).toLocaleString('it-IT'),
      }));
      
      const worksheet = workbook.addWorksheet('Riparazioni');
      
      if (data.length > 0) {
        const headers = Object.keys(data[0]);
        worksheet.addRow(headers);
        
        worksheet.getRow(1).font = { bold: true };
        worksheet.getRow(1).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFE0E0E0' }
        };
        
        data.forEach(row => {
          worksheet.addRow(Object.values(row));
        });
        
        worksheet.columns.forEach(column => {
          let maxLength = 0;
          column.eachCell?.({ includeEmpty: true }, (cell) => {
            const length = cell.value ? cell.value.toString().length : 10;
            if (length > maxLength) maxLength = length;
          });
          column.width = Math.min(maxLength + 2, 50);
        });
      }
      
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=riparazioni_${new Date().toISOString().split('T')[0]}.xlsx`);
      
      const buffer = await workbook.xlsx.writeBuffer();
      res.send(buffer);
    } catch (error: any) {
      console.error("Error exporting reseller repairs:", error);
      res.status(500).send(error.message);
    }
  });

  // Skip diagnosis for reseller - go directly from ingressato to preventivo_emesso
  app.post("/api/reseller/repairs/:id/skip-diagnosis", requireRole("reseller", "reseller_staff"), requireModulePermission("repairs", "update"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      const { reason } = z.object({ reason: z.string().optional() }).parse(req.body);
      
      const repair = await storage.getRepairOrder(req.params.id);
      if (!repair) return res.status(404).send("Ordine di riparazione non trovato");
      
      // Verify reseller owns this repair
      if (repair.resellerId !== req.user.id) {
        return res.status(403).send("Non puoi modificare riparazioni di altri rivenditori");
      }
      
      // Can only skip diagnosis from ingressato state
      if (repair.status !== 'ingressato') {
        return res.status(400).send("La diagnosi può essere saltata solo dallo stato 'ingressato'");
      }
      
      // Update repair order with skip flag and move to in_diagnosi (to allow quote creation)
      const updated = await storage.updateRepairOrder(req.params.id, {
        skipDiagnosis: true,
        skipDiagnosisReason: reason || null,
        status: 'in_diagnosi' as any,
      });
      
      // Log the state transition - close previous state and create new one
      await storage.closeRepairOrderStateHistory(req.params.id, req.user.id);
      await storage.createRepairOrderStateHistory({
        repairOrderId: req.params.id,
        status: 'in_diagnosi' as any,
        enteredAt: new Date(),
        changedBy: req.user.id,
      });
      
      setActivityEntity(res, { type: 'repairs', id: req.params.id });
      
      await storage.invalidateCache('overview_%');
      await storage.invalidateCache('centers_%');
      
      res.json(updated);
    } catch (error: any) {
      console.error("Error skipping diagnosis:", error);
      res.status(400).send(error.message);
    }
  });

  app.get("/api/reseller/customers", requireRole("reseller", "reseller_staff"), requireModulePermission("customers", "read"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      // Use effective context (may be acting as sub-reseller or repair center)
      const context = getEffectiveContext(req);
      
      const allUsers = await storage.listUsers();
      // Filter customers that belong to this reseller (or acting-as reseller)
      let customers = allUsers.filter(user => 
        user.role === "customer" && user.resellerId === context.resellerId
      );
      
      // If viewing as repair center, further filter to only customers assigned to that center
      if (context.repairCenterId) {
        const customerIdsForCenter = await storage.listCustomerIdsForRepairCenter(context.repairCenterId);
        const customerIdSet = new Set(customerIdsForCenter);
        customers = customers.filter(customer => customerIdSet.has(customer.id));
      }
      
      // Enrich customers with their assigned repair centers
      const customersWithRepairCenters = await Promise.all(
        customers.map(async (customer) => {
          const repairCenters = await storage.listRepairCentersForCustomer(customer.id);
          return {
            ...customer,
            assignedRepairCenters: repairCenters,
          };
        })
      );
      
      res.json(customersWithRepairCenters);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  app.post("/api/reseller/customers", requireRole("reseller", "reseller_staff"), requireModulePermission("customers", "create"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      // Get effective reseller context (for staff, use their reseller's ID)
      const effectiveResellerId = req.user.role === 'reseller_staff' ? req.user.resellerId : req.user.id;
      
      const baseSchema = insertUserSchema.pick({
        username: true,
        password: true,
        email: true,
        fullName: true,
        phone: true,
        isActive: true,
      }).extend({
        repairCenterId: z.string().optional(),
        repairCenterIds: z.array(z.string()).optional(),
        username: z.string().optional(),
        password: z.string().optional(),
      });
      const validatedData = baseSchema.parse(req.body);
      
      // Auto-generate username if not provided
      let username = validatedData.username;
      if (!username && validatedData.fullName) {
        let baseUsername = validatedData.fullName
          .toLowerCase()
          .replace(/[^a-z0-9]/g, '')
          .substring(0, 20);
        if (baseUsername.length < 3) baseUsername = 'cliente';
        username = baseUsername;
        let counter = 1;
        while (await storage.getUserByUsername(username)) {
          username = `${baseUsername}${counter}`;
          counter++;
        }
      }
      
      // Auto-generate password if not provided
      let password = validatedData.password;
      if (!password) {
        password = randomBytes(8).toString('hex');
      }

      // Validate repair centers belong to this reseller
      const repairCenterIds = validatedData.repairCenterIds || (validatedData.repairCenterId ? [validatedData.repairCenterId] : []);
      if (repairCenterIds.length > 0) {
        for (const centerId of repairCenterIds) {
          const center = await storage.getRepairCenter(centerId);
          if (!center || center.resellerId !== effectiveResellerId) {
            return res.status(403).send("Centro di riparazione non autorizzato");
          }
        }
      }

      // Hash password before storing
      const hashedPassword = await hashPassword(password);

      const user = await storage.createUser({
        username: username,
        password: hashedPassword,
        email: validatedData.email,
        fullName: validatedData.fullName,
        phone: validatedData.phone,
        isActive: validatedData.isActive,
        role: "customer", // Force customer role
        resellerId: effectiveResellerId, // Associate with the reseller (or staff's reseller)
        repairCenterId: repairCenterIds[0] || null, // Keep first one for backward compatibility
      });
      
      // Set all repair center associations
      if (repairCenterIds.length > 0) {
        await storage.setCustomerRepairCenters(user.id, repairCenterIds);
      }
      
      setActivityEntity(res, { type: 'users', id: user.id });
      const { password: _, ...safeUser } = user;
      res.status(201).json({ customer: safeUser, tempPassword: password });
    } catch (error: any) {
      res.status(400).send(error.message);
    }
  });

  // Update an existing customer

  // Get single customer detail
  app.get("/api/reseller/customers/:id", requireRole("reseller", "reseller_staff"), requireModulePermission("customers", "read"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      const effectiveResellerId = req.user.role === 'reseller_staff' ? req.user.resellerId : req.user.id;
      
      const customerId = req.params.id;
      
      // Get customer
      const customer = await storage.getUser(customerId);
      if (!customer || customer.role !== "customer" || customer.resellerId !== effectiveResellerId) {
        return res.status(404).send("Cliente non trovato");
      }
      
      // Get related data
      const reseller = await storage.getUser(effectiveResellerId);
      const subReseller = customer.subResellerId ? await storage.getUser(customer.subResellerId) : null;
      
      // Get repair orders for this customer
      const allRepairOrders = await storage.listRepairOrders();
      const repairOrders = allRepairOrders.filter(r => r.customerId === customerId);
      
      // Get sales orders (POS transactions)
      const allSalesOrders = await storage.listSalesOrders({ customerId });
      const salesOrders = allSalesOrders;
      
      // Get billing data
      const billingData = await storage.getBillingDataByUserId(customerId);
      
      // Get utility practices
      const allPractices = await storage.listUtilityPractices();
      const practices = allPractices.filter(p => p.customerId === customerId);
      const utilityPractices = await Promise.all(practices.map(async (p) => {
        const supplier = p.supplierId ? await storage.getUtilitySupplier(p.supplierId) : null;
        const service = p.serviceId ? await storage.getUtilityService(p.serviceId) : null;
        return {
          ...p,
          supplierName: supplier?.name || null,
          serviceName: service?.name || null,
        };
      }));
      
      const { password: _, ...safeCustomer } = customer;
      res.json({
        customer: safeCustomer,
        reseller: reseller ? { id: reseller.id, fullName: reseller.fullName } : null,
        subReseller: subReseller ? { id: subReseller.id, fullName: subReseller.fullName } : null,
        repairOrders,
        salesOrders,
        billingData,
        utilityPractices,
      });
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  app.patch("/api/reseller/customers/:id", requireRole("reseller", "reseller_staff"), requireModulePermission("customers", "update"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      const effectiveResellerId = req.user.role === 'reseller_staff' ? req.user.resellerId : req.user.id;
      
      const customerId = req.params.id;
      
      // Verify customer exists and belongs to this reseller
      const existingCustomer = await storage.getUser(customerId);
      if (!existingCustomer || existingCustomer.role !== "customer" || existingCustomer.resellerId !== effectiveResellerId) {
        return res.status(404).send("Cliente non trovato");
      }
      
      const updateSchema = z.object({
        email: z.string().email().optional(),
        fullName: z.string().min(1).optional(),
        phone: z.string().optional().nullable(),
        isActive: z.boolean().optional(),
        repairCenterIds: z.array(z.string()).optional(),
      });
      
      const validatedData = updateSchema.parse(req.body);
      
      // Validate repair centers belong to this reseller
      const repairCenterIds = validatedData.repairCenterIds;
      if (repairCenterIds && repairCenterIds.length > 0) {
        for (const centerId of repairCenterIds) {
          const center = await storage.getRepairCenter(centerId);
          if (!center || center.resellerId !== effectiveResellerId) {
            return res.status(403).send("Centro di riparazione non autorizzato");
          }
        }
      }
      
      // Update user fields
      const updates: any = {};
      if (validatedData.email !== undefined) updates.email = validatedData.email;
      if (validatedData.fullName !== undefined) updates.fullName = validatedData.fullName;
      if (validatedData.phone !== undefined) updates.phone = validatedData.phone;
      if (validatedData.isActive !== undefined) updates.isActive = validatedData.isActive;
      
      // Also update repairCenterId for backward compatibility
      if (repairCenterIds !== undefined) {
        updates.repairCenterId = repairCenterIds[0] || null;
      }
      
      let updatedUser = existingCustomer;
      if (Object.keys(updates).length > 0) {
        updatedUser = await storage.updateUser(customerId, updates);
      }
      
      // Update repair center associations
      if (repairCenterIds !== undefined) {
        await storage.setCustomerRepairCenters(customerId, repairCenterIds);
      }
      
      // Return updated customer with repair centers
      const assignedRepairCenters = await storage.listRepairCentersForCustomer(customerId);
      
      setActivityEntity(res, { type: 'users', id: customerId });
      res.json({ ...updatedUser, assignedRepairCenters });
    } catch (error: any) {
      res.status(400).send(error.message);
    }
  });

  // Delete a customer (only if no active repairs)
  app.delete("/api/reseller/customers/:id", requireRole("reseller", "reseller_staff"), requireModulePermission("customers", "delete"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      const effectiveResellerId = req.user.role === 'reseller_staff' ? req.user.resellerId : req.user.id;
      
      const customerId = req.params.id;
      
      // Verify customer exists and belongs to this reseller
      const existingCustomer = await storage.getUser(customerId);
      if (!existingCustomer || existingCustomer.role !== "customer" || existingCustomer.resellerId !== effectiveResellerId) {
        return res.status(404).send("Cliente non trovato");
      }
      
      // Check for active repairs (only allow delete if all repairs are in terminal states)
      // Terminal statuses from schema: consegnato (delivered), cancelled (annullato)
      const allRepairs = await storage.listRepairOrders();
      const customerRepairs = allRepairs.filter(r => r.customerId === customerId);
      const terminalStatuses = ["consegnato", "cancelled"];
      const activeRepairs = customerRepairs.filter(r => !terminalStatuses.includes(r.status));
      
      if (activeRepairs.length > 0) {
        return res.status(409).json({
          error: "ACTIVE_REPAIRS",
          message: `Impossibile eliminare il cliente: ha ${activeRepairs.length} riparazion${activeRepairs.length === 1 ? 'e' : 'i'} in corso. Completa o annulla le riparazioni prima di eliminare il cliente.`,
          activeRepairsCount: activeRepairs.length
        });
      }
      
      // Remove customer repair center associations first
      await storage.setCustomerRepairCenters(customerId, []);
      
      // Delete the customer
      await storage.deleteUser(customerId);
      
      setActivityEntity(res, { type: 'users', id: customerId });
      res.json({ success: true, message: "Cliente eliminato con successo" });
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // ============================================================================
  // Reseller Staff Team Management
  // ============================================================================

  // List all staff members for this reseller
  app.get("/api/reseller/team", requireRole("reseller"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Non autorizzato");
      
      // Use context switching - team belongs to reseller, not repair center
      const context = getEffectiveContext(req);
      // Note: When acting as repair center, still show the reseller's team (not center-specific)
      const staff = await storage.listResellerStaff(context.resellerId);
      
      // Get permissions, assigned repair centers and sub-resellers for each staff member
      const staffWithPermissions = await Promise.all(
        staff.map(async (member) => {
          const permissions = await storage.getStaffPermissions(member.id);
          const assignedRepairCenters = await storage.listRepairCentersForStaff(member.id);
          const assignedSubResellerIds = await storage.listSubResellerIdsForStaff(member.id);
          return {
            ...member,
            password: undefined, // Never send password
            permissions,
            assignedRepairCenters,
            assignedSubResellerIds
          };
        })
      );
      
      res.json(staffWithPermissions);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // Create a new staff member
  app.post("/api/reseller/team", requireRole("reseller"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Non autorizzato");
      
      const { user: userData, permissions, repairCenterIds, subResellerIds } = req.body;
      
      if (!userData || !userData.username || !userData.email || !userData.password || !userData.fullName) {
        return res.status(400).send("Dati utente incompleti");
      }

      // Hash password
      const hashedPassword = await hashPassword(userData.password);

      // Create user with role reseller_staff
      const newUser = await storage.createUser({
        username: userData.username,
        password: hashedPassword,
        email: userData.email,
        fullName: userData.fullName,
        phone: userData.phone || null,
        role: "reseller_staff",
        resellerId: req.user.id,
        isActive: true
      });

      // Create permissions if provided
      if (permissions && Array.isArray(permissions)) {
        await storage.upsertStaffPermissions(newUser.id, req.user.id, permissions);
      }

      // Assign repair centers if provided
      if (repairCenterIds && Array.isArray(repairCenterIds)) {
        await storage.setStaffRepairCenters(newUser.id, repairCenterIds);
      }

      // Assign sub-resellers if provided
      if (subResellerIds && Array.isArray(subResellerIds)) {
        await storage.setStaffSubResellers(newUser.id, subResellerIds);
      }

      // Get created permissions, assigned repair centers and sub-resellers
      const createdPermissions = await storage.getStaffPermissions(newUser.id);
      const assignedRepairCenters = await storage.listRepairCentersForStaff(newUser.id);
      const assignedSubResellerIds = await storage.listSubResellerIdsForStaff(newUser.id);

      setActivityEntity(res, { type: 'users', id: newUser.id });
      res.status(201).json({
        ...newUser,
        password: undefined,
        permissions: createdPermissions,
        assignedRepairCenters,
        assignedSubResellerIds
      });
    } catch (error: any) {
      console.error("Error creating staff member:", error);
      res.status(400).send(error.message);
    }
  });

  // Update a staff member
  app.patch("/api/reseller/team/:id", requireRole("reseller"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Non autorizzato");
      
      const staffId = req.params.id;
      const { user: userData, permissions, repairCenterIds, subResellerIds } = req.body;
      
      // Verify the staff member belongs to this reseller
      const staffMember = await storage.getUser(staffId);
      if (!staffMember || staffMember.resellerId !== req.user.id || staffMember.role !== 'reseller_staff') {
        return res.status(404).send("Membro staff non trovato");
      }

      // Update user data if provided
      if (userData) {
        const updates: any = {};
        if (userData.fullName) updates.fullName = userData.fullName;
        if (userData.email) updates.email = userData.email;
        if (userData.phone !== undefined) updates.phone = userData.phone;
        if (typeof userData.isActive === 'boolean') updates.isActive = userData.isActive;
        
        if (Object.keys(updates).length > 0) {
          await storage.updateUser(staffId, updates);
        }
      }

      // Update permissions if provided
      if (permissions && Array.isArray(permissions)) {
        await storage.upsertStaffPermissions(staffId, req.user.id, permissions);
      }

      // Update repair center assignments if provided
      if (repairCenterIds !== undefined && Array.isArray(repairCenterIds)) {
        await storage.setStaffRepairCenters(staffId, repairCenterIds);
      }

      // Update sub-reseller assignments if provided
      if (subResellerIds !== undefined && Array.isArray(subResellerIds)) {
        await storage.setStaffSubResellers(staffId, subResellerIds);
      }

      // Get updated staff member with permissions, repair centers and sub-resellers
      const updatedMember = await storage.getUser(staffId);
      const updatedPermissions = await storage.getStaffPermissions(staffId);
      const assignedRepairCenters = await storage.listRepairCentersForStaff(staffId);
      const assignedSubResellerIds = await storage.listSubResellerIdsForStaff(staffId);

      setActivityEntity(res, { type: 'users', id: staffId });
      res.json({
        ...updatedMember,
        password: undefined,
        permissions: updatedPermissions,
        assignedRepairCenters,
        assignedSubResellerIds
      });
    } catch (error: any) {
      console.error("Error updating staff member:", error);
      res.status(400).send(error.message);
    }
  });

  // Reset password for a staff member
  app.post("/api/reseller/team/:id/reset-password", requireRole("reseller"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Non autorizzato");
      
      const staffId = req.params.id;
      const { newPassword } = req.body;
      
      if (!newPassword || newPassword.length < 4) {
        return res.status(400).send("La password deve contenere almeno 4 caratteri");
      }

      // Verify the staff member belongs to this reseller
      const staffMember = await storage.getUser(staffId);
      if (!staffMember || staffMember.resellerId !== req.user.id || staffMember.role !== 'reseller_staff') {
        return res.status(404).send("Membro staff non trovato");
      }

      // Hash and update password
      const hashedPassword = await hashPassword(newPassword);
      await storage.updateUser(staffId, { password: hashedPassword });

      setActivityEntity(res, { type: 'users', id: staffId });
      res.json({ message: "Password aggiornata con successo" });
    } catch (error: any) {
      console.error("Error resetting staff password:", error);
      res.status(400).send(error.message);
    }
  });

  // Delete a staff member
  app.delete("/api/reseller/team/:id", requireRole("reseller"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Non autorizzato");
      
      const staffId = req.params.id;
      
      // Verify the staff member belongs to this reseller
      const staffMember = await storage.getUser(staffId);
      if (!staffMember || staffMember.resellerId !== req.user.id || staffMember.role !== 'reseller_staff') {
        return res.status(404).send("Membro staff non trovato");
      }

      // Delete permissions first (cascade should handle this but be explicit)
      await storage.deleteStaffPermissionsByUser(staffId);
      
      // Delete user
      await storage.deleteUser(staffId);

      setActivityEntity(res, { type: 'users', id: staffId });
      res.status(200).send("Membro staff eliminato");
    } catch (error: any) {
      console.error("Error deleting staff member:", error);
      res.status(400).send(error.message);
    }
  });

  // Get permissions for a specific staff member
  app.get("/api/reseller/team/:id/permissions", requireRole("reseller"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Non autorizzato");
      
      const staffId = req.params.id;
      
      // Verify the staff member belongs to this reseller
      const staffMember = await storage.getUser(staffId);
      if (!staffMember || staffMember.resellerId !== req.user.id || staffMember.role !== 'reseller_staff') {
        return res.status(404).send("Membro staff non trovato");
      }

      const permissions = await storage.getStaffPermissions(staffId);
      res.json(permissions);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // Update permissions for a specific staff member (bulk update)
  app.put("/api/reseller/team/:id/permissions", requireRole("reseller"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Non autorizzato");
      
      const staffId = req.params.id;
      const { permissions } = req.body;
      
      if (!permissions || !Array.isArray(permissions)) {
        return res.status(400).send("Permessi non validi");
      }

      // Verify the staff member belongs to this reseller
      const staffMember = await storage.getUser(staffId);
      if (!staffMember || staffMember.resellerId !== req.user.id || staffMember.role !== 'reseller_staff') {
        return res.status(404).send("Membro staff non trovato");
      }

      const updatedPermissions = await storage.upsertStaffPermissions(staffId, req.user.id, permissions);
      
      setActivityEntity(res, { type: 'permissions', id: staffId });
      res.json(updatedPermissions);
    } catch (error: any) {
      console.error("Error updating permissions:", error);
      res.status(400).send(error.message);
    }
  });

  // Get current user's permissions (for staff to check their own access)
  app.get("/api/my-permissions", requireAuth, async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Non autorizzato");
      
      // For reseller_staff, return their permissions
      if (req.user.role === 'reseller_staff') {
        const permissions = await storage.getStaffPermissions(req.user.id);
        res.json({
          role: req.user.role,
          permissions
        });
      } else {
        // For other roles, return full access indicator
        res.json({
          role: req.user.role,
          fullAccess: true
        });
      }
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // Get repair center staff for hierarchical visibility
  app.get("/api/reseller/repair-center-staff", requireRole("reseller", "reseller_staff"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ error: "Non autenticato" });
      const resellerId = req.user.role === 'reseller' ? req.user.id : req.user.resellerId;
      if (!resellerId) return res.status(400).json({ error: "Reseller ID non trovato" });
      
      const staff = await storage.listRepairCenterStaffHierarchical(resellerId);
      res.json(staff);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });


  // ============================================================================
  // End of Reseller Staff Team Management
  // ============================================================================

  // ============================================================================
  // Reseller Custom Device Brands & Models Management
  // ============================================================================

  // List all custom brands for the reseller (includes global brands too for dropdown)
  app.get("/api/reseller/device-brands", requireRole("reseller", "reseller_staff"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Non autorizzato");
      
      const context = getEffectiveContext(req);
      const resellerId = context.resellerId;
      if (!resellerId) return res.status(400).send("Rivenditore non trovato");
      
      const includeGlobal = req.query.includeGlobal === 'true';
      const activeOnly = req.query.activeOnly === 'true';
      
      // Get reseller custom brands
      const customBrands = await storage.listResellerDeviceBrands(resellerId, activeOnly);
      
      if (includeGlobal) {
        // Also get global brands and merge
        const globalBrands = await storage.listDeviceBrands(activeOnly);
        const mergedBrands = [
          ...globalBrands.map(b => ({ ...b, isGlobal: true, isCustom: false })),
          ...customBrands.map(b => ({ ...b, isGlobal: false, isCustom: true }))
        ];
        return res.json(mergedBrands);
      }
      
      res.json(customBrands.map(b => ({ ...b, isGlobal: false, isCustom: true })));
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // Create a custom brand for the reseller
  app.post("/api/reseller/device-brands", requireRole("reseller", "reseller_staff"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Non autorizzato");
      
      const resellerId = req.user.role === 'reseller' ? req.user.id : req.user.resellerId;
      if (!resellerId) return res.status(400).send("Rivenditore non trovato");
      
      const { name, logoUrl } = req.body;
      if (!name) return res.status(400).send("Nome brand obbligatorio");
      
      const brand = await storage.createResellerDeviceBrand({
        resellerId,
        name,
        logoUrl: logoUrl || null,
        isActive: true
      });
      
      setActivityEntity(res, { type: 'reseller_device_brand', id: brand.id });
      res.status(201).json({ ...brand, isGlobal: false, isCustom: true });
    } catch (error: any) {
      res.status(400).send(error.message);
    }
  });

  // Update a custom brand
  app.patch("/api/reseller/device-brands/:id", requireRole("reseller", "reseller_staff"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Non autorizzato");
      
      const resellerId = req.user.role === 'reseller' ? req.user.id : req.user.resellerId;
      if (!resellerId) return res.status(400).send("Rivenditore non trovato");
      
      const brandId = req.params.id;
      const existing = await storage.getResellerDeviceBrand(brandId);
      
      if (!existing || existing.resellerId !== resellerId) {
        return res.status(404).send("Brand non trovato");
      }
      
      const { name, logoUrl, isActive } = req.body;
      const updated = await storage.updateResellerDeviceBrand(brandId, {
        ...(name !== undefined && { name }),
        ...(logoUrl !== undefined && { logoUrl }),
        ...(isActive !== undefined && { isActive })
      });
      
      setActivityEntity(res, { type: 'reseller_device_brand', id: brandId });
      res.json({ ...updated, isGlobal: false, isCustom: true });
    } catch (error: any) {
      res.status(400).send(error.message);
    }
  });

  // Delete a custom brand
  app.delete("/api/reseller/device-brands/:id", requireRole("reseller", "reseller_staff"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Non autorizzato");
      
      const resellerId = req.user.role === 'reseller' ? req.user.id : req.user.resellerId;
      if (!resellerId) return res.status(400).send("Rivenditore non trovato");
      
      const brandId = req.params.id;
      const existing = await storage.getResellerDeviceBrand(brandId);
      
      if (!existing || existing.resellerId !== resellerId) {
        return res.status(404).send("Brand non trovato");
      }
      
      await storage.deleteResellerDeviceBrand(brandId);
      setActivityEntity(res, { type: 'reseller_device_brand', id: brandId });
      res.status(204).send();
    } catch (error: any) {
      res.status(400).send(error.message);
    }
  });

  // List all custom models for the reseller (includes global models too for dropdown)
  app.get("/api/reseller/device-models", requireRole("reseller", "reseller_staff"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Non autorizzato");
      
      const context = getEffectiveContext(req);
      const resellerId = context.resellerId;
      if (!resellerId) return res.status(400).send("Rivenditore non trovato");
      
      const includeGlobal = req.query.includeGlobal === 'true';
      const activeOnly = req.query.activeOnly === 'true';
      const brandId = req.query.brandId as string | undefined;
      const typeId = req.query.typeId as string | undefined;
      
      if (includeGlobal) {
        // Get global + reseller's custom models from unified device_models table
        const allModels = await storage.listDeviceModelsForReseller(resellerId, { brandId, typeId, activeOnly });
        
        // Also get legacy custom models from reseller_device_models for backwards compat
        const legacyCustomModels = await storage.listResellerDeviceModels(resellerId, brandId, typeId, activeOnly);
        
        // Merge: unified models + legacy custom models (normalized)
        const unifiedWithFlags = allModels.map(m => ({
          ...m,
          isGlobal: m.resellerId === null,
          isCustom: m.resellerId !== null
        }));
        
        const legacyNormalized = legacyCustomModels.map(m => ({ 
          ...m, 
          brandId: m.brandId || m.resellerBrandId,
          isGlobal: false, 
          isCustom: true 
        }));
        
        // Combine, avoiding duplicates (legacy models have different IDs)
        return res.json([...unifiedWithFlags, ...legacyNormalized]);
      }
      
      // Only return reseller's custom models (from both tables)
      const unifiedCustom = await storage.listDeviceModelsForReseller(resellerId, { brandId, typeId, activeOnly });
      const resellerOnlyModels = unifiedCustom.filter(m => m.resellerId === resellerId);
      
      const legacyCustomModels = await storage.listResellerDeviceModels(resellerId, brandId, typeId, activeOnly);
      
      const unified = resellerOnlyModels.map(m => ({ ...m, isGlobal: false, isCustom: true }));
      const legacy = legacyCustomModels.map(m => ({ 
        ...m, 
        brandId: m.brandId || m.resellerBrandId,
        isGlobal: false, 
        isCustom: true 
      }));
      
      res.json([...unified, ...legacy]);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // Create a custom model for the reseller (inserisce in device_models con resellerId per FK compatibility)
  app.post("/api/reseller/device-models", requireRole("reseller", "reseller_staff"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Non autorizzato");
      
      const resellerId = req.user.role === 'reseller' ? req.user.id : req.user.resellerId;
      if (!resellerId) return res.status(400).send("Rivenditore non trovato");
      
      const { modelName, brandId, typeId, photoUrl } = req.body;
      if (!modelName) return res.status(400).send("Nome modello obbligatorio");
      
      // Inserisce direttamente in device_models con resellerId per compatibilità FK
      const model = await storage.createDeviceModel({
        modelName,
        brandId: brandId || null,
        typeId: typeId || null,
        resellerId, // Marca il modello come proprietà del reseller
        photoUrl: photoUrl || null,
        isActive: true
      });
      
      setActivityEntity(res, { type: 'device_model', id: model.id });
      res.status(201).json({ ...model, isGlobal: false, isCustom: true });
    } catch (error: any) {
      res.status(400).send(error.message);
    }
  });

  // Update a custom model
  app.patch("/api/reseller/device-models/:id", requireRole("reseller", "reseller_staff"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Non autorizzato");
      
      const resellerId = req.user.role === 'reseller' ? req.user.id : req.user.resellerId;
      if (!resellerId) return res.status(400).send("Rivenditore non trovato");
      
      const modelId = req.params.id;
      const existing = await storage.getResellerDeviceModel(modelId);
      
      if (!existing || existing.resellerId !== resellerId) {
        return res.status(404).send("Modello non trovato");
      }
      
      const { modelName, brandId, resellerBrandId, brandName, typeId, photoUrl, isActive } = req.body;
      const updated = await storage.updateResellerDeviceModel(modelId, {
        ...(modelName !== undefined && { modelName }),
        ...(brandId !== undefined && { brandId }),
        ...(resellerBrandId !== undefined && { resellerBrandId }),
        ...(brandName !== undefined && { brandName }),
        ...(typeId !== undefined && { typeId }),
        ...(photoUrl !== undefined && { photoUrl }),
        ...(isActive !== undefined && { isActive })
      });
      
      setActivityEntity(res, { type: 'reseller_device_model', id: modelId });
      res.json({ ...updated, isGlobal: false, isCustom: true });
    } catch (error: any) {
      res.status(400).send(error.message);
    }
  });

  // Delete a custom model
  app.delete("/api/reseller/device-models/:id", requireRole("reseller", "reseller_staff"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Non autorizzato");
      
      const resellerId = req.user.role === 'reseller' ? req.user.id : req.user.resellerId;
      if (!resellerId) return res.status(400).send("Rivenditore non trovato");
      
      const modelId = req.params.id;
      const existing = await storage.getResellerDeviceModel(modelId);
      
      if (!existing || existing.resellerId !== resellerId) {
        return res.status(404).send("Modello non trovato");
      }
      
      await storage.deleteResellerDeviceModel(modelId);
      setActivityEntity(res, { type: 'reseller_device_model', id: modelId });
      res.status(204).send();
    } catch (error: any) {
      res.status(400).send(error.message);
    }
  });

  // ============================================================================
  // End of Reseller Custom Device Brands & Models Management
  // ============================================================================

  // Reseller Inventory - view inventory of associated repair centers (enriched with product and center details)
  app.get("/api/reseller/inventory", requireRole("reseller", "reseller_staff"), requireModulePermission("inventory", "read"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      // Use effective context (may be viewing specific repair center)
      const context = getEffectiveContext(req);
      
      // Get all repair centers associated with this reseller
      const allCenters = await storage.listRepairCenters();
      let resellerCenters = allCenters.filter(c => c.resellerId === context.resellerId);
      
      // If viewing specific repair center, filter to just that center
      if (context.repairCenterId) {
        resellerCenters = resellerCenters.filter(c => c.id === context.repairCenterId);
      }
      
      if (resellerCenters.length === 0) {
        return res.json([]);
      }
      
      // Get inventory and products
      const inventory = await storage.listInventoryStockByReseller(context.resellerId);
      const productsList = await storage.listProducts();
      
      // Create lookup maps
      const productsMap = new Map(productsList.map(p => [p.id, p]));
      const centersMap = new Map(resellerCenters.map(c => [c.id, { id: c.id, name: c.name, city: c.city }]));
      
      // Enrich inventory with product and repair center details
      // Include isOwn flag to distinguish reseller's own products from global catalog
      // Filter by repair center if context specifies one
      let enrichedInventory = inventory.map(item => {
        const product = productsMap.get(item.productId);
        return {
          isOwned: item.repairCenterId === repairCenterId,
          ...item,
          product: product ? {
            ...product,
            isOwn: product.createdBy === context.resellerId,
          } : null,
          repairCenter: centersMap.get(item.repairCenterId) || null,
        };
      });
      
      // Filter to specific repair center if selected
      if (context.repairCenterId) {
        enrichedInventory = enrichedInventory.filter(item => item.repairCenterId === context.repairCenterId);
      }
      
      res.json(enrichedInventory);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // Reseller Products - view product catalog with custom prices
  app.get("/api/reseller/products", requireRole("reseller"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      const context = getEffectiveContext(req);
      if (!context.resellerId) return res.status(400).send("Rivenditore non trovato");
      
      const { deviceType, productType } = req.query;
      
      // Ottieni tutti i prodotti (globali admin + propri del reseller)
      const allProducts = await storage.listProducts();
      
      // Ottieni tutti i device types per arricchire i prodotti
      const deviceTypes = await storage.listDeviceTypes();
      const deviceTypeMap = new Map(deviceTypes.map(dt => [dt.id, dt.name]));
      
      // Filtra: prodotti globali (createdBy null) + prodotti propri
      let visibleProducts = allProducts.filter(p => 
        p.createdBy === null || p.createdBy === context.resellerId
      );
      
      // Filtra per deviceType se specificato
      if (deviceType) {
        const deviceTypeLower = String(deviceType).toLowerCase();
        visibleProducts = visibleProducts.filter(p => {
          // Check by device type name
          if (p.deviceTypeId) {
            const typeName = deviceTypeMap.get(p.deviceTypeId);
            if (typeName && typeName.toLowerCase() === deviceTypeLower) {
              return true;
            }
          }
          // Per "smartphone", include anche tutti i prodotti di tipo "dispositivo" senza deviceTypeId
          if (deviceTypeLower === 'smartphone' && p.productType === 'dispositivo') {
            return true;
          }
          return false;
        });
      }
      
      // Filtra per productType se specificato
      if (productType) {
        visibleProducts = visibleProducts.filter(p => p.productType === productType);
      }
      
      // Ottieni prezzi personalizzati per questo reseller
      const customPrices = await storage.listProductPrices({ resellerId: context.resellerId });
      const priceMap = new Map(customPrices.map(cp => [cp.productId, cp]));
      
      // Arricchisci prodotti con prezzi effettivi e device type name
      const enrichedProducts = visibleProducts.map(product => {
        const customPrice = priceMap.get(product.id);
        const isOwn = product.createdBy === context.resellerId;
        const deviceTypeName = product.deviceTypeId ? deviceTypeMap.get(product.deviceTypeId) : null;
        
        return {
          ...product,
          isOwn, // true = prodotto creato dal reseller
          deviceType: deviceTypeName || (product.productType === 'dispositivo' ? 'Smartphone' : null), // Fallback per dispositivi senza tipo
          customPrice: customPrice || null,
          effectivePrice: isOwn ? product.unitPrice : (customPrice?.priceCents ?? product.unitPrice),
          effectiveCostPrice: isOwn ? product.costPrice : (customPrice?.costPriceCents ?? product.costPrice),
        };
      });
      
      res.json(enrichedProducts);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // Reseller Products - create own product
  app.post("/api/reseller/products", requireRole("reseller"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      const { initialStock, ...productData } = req.body;
      
      // Pulisci i valori null convertendoli in undefined per compatibilità con Zod
      const cleanedProductData = Object.fromEntries(
        Object.entries(productData).map(([key, value]) => [key, value === null ? undefined : value])
      );
      
      const validationResult = insertProductSchema.safeParse({
        ...cleanedProductData,
        createdBy: req.user.id, // Imposta il creatore come il reseller corrente
      });
      
      if (!validationResult.success) {
        console.log("Reseller product validation error:", validationResult.error.errors);
        return res.status(400).send(validationResult.error.errors.map(e => `${e.path.join(".")}: ${e.message}`).join(", "));
      }
      
      const product = await storage.createProduct(validationResult.data);
      
      // Handle initial stock if provided
      if (initialStock && Array.isArray(initialStock) && initialStock.length > 0) {
        // Build set of accessible warehouse IDs for this reseller
        const accessibleWarehouseIds = new Set<string>();
        
        // 1. Reseller's own warehouse
        const ownWarehouse = await storage.getWarehouseByOwner('reseller', req.user.id);
        if (ownWarehouse) accessibleWarehouseIds.add(ownWarehouse.id);
        
        // 2. Sub-resellers' warehouses
        const allUsers = await storage.listUsers();
        const subResellers = allUsers.filter(u => u.parentResellerId === req.user.id);
        for (const sub of subResellers) {
          const subWarehouse = await storage.getWarehouseByOwner('sub_reseller', sub.id);
          if (subWarehouse) accessibleWarehouseIds.add(subWarehouse.id);
        }
        
        // 3. Repair centers' warehouses
        const resellerCenters = await storage.listRepairCenters({ resellerId: req.user.id });
        for (const rc of resellerCenters) {
          const rcWarehouse = await storage.getWarehouseByOwner('repair_center', rc.id);
          if (rcWarehouse) accessibleWarehouseIds.add(rcWarehouse.id);
        }
        
        for (const stock of initialStock) {
          const warehouseId = stock.warehouseId;
          if (warehouseId && stock.quantity > 0 && accessibleWarehouseIds.has(warehouseId)) {
            // Use warehouse stock system
            await storage.updateWarehouseStockQuantity(warehouseId, product.id, stock.quantity);
            await storage.createWarehouseMovement({
              warehouseId,
              productId: product.id,
              movementType: 'carico',
              quantity: stock.quantity,
              notes: 'Quantità iniziale alla creazione del prodotto',
              createdBy: req.user.id,
            });
          }
        }
      }
      
      res.status(201).json(product);
    } catch (error: any) {
      res.status(400).send(error.message);
    }
  });

  // Reseller Products - update own product
  app.patch("/api/reseller/products/:id", requireRole("reseller", "reseller_staff"), requireModulePermission("products", "update"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      const product = await storage.getProduct(req.params.id);
      if (!product) {
        return res.status(404).send("Prodotto non trovato");
      }
      
      // Verifica che il prodotto appartenga al reseller
      if (product.createdBy !== req.user.id) {
        return res.status(403).send("Non puoi modificare prodotti che non hai creato");
      }
      
      const { name, description, category, productType, brand, compatibleModels, color, 
              costPrice, unitPrice, condition, warrantyMonths, supplier, supplierCode, 
              minStock, location, isActive } = req.body;
      
      const updates: any = {};
      if (name !== undefined) updates.name = name;
      if (description !== undefined) updates.description = description;
      if (category !== undefined) updates.category = category;
      if (productType !== undefined) updates.productType = productType;
      if (brand !== undefined) updates.brand = brand;
      if (compatibleModels !== undefined) updates.compatibleModels = compatibleModels;
      if (color !== undefined) updates.color = color;
      if (costPrice !== undefined) updates.costPrice = costPrice;
      if (unitPrice !== undefined) updates.unitPrice = unitPrice;
      if (condition !== undefined) updates.condition = condition;
      if (warrantyMonths !== undefined) updates.warrantyMonths = warrantyMonths;
      if (supplier !== undefined) updates.supplier = supplier;
      if (supplierCode !== undefined) updates.supplierCode = supplierCode;
      if (minStock !== undefined) updates.minStock = minStock;
      if (location !== undefined) updates.location = location;
      if (isActive !== undefined) updates.isActive = isActive;
      
      const updated = await storage.updateProduct(req.params.id, updates);
      res.json(updated);
    } catch (error: any) {
      res.status(400).send(error.message);
    }
  });

  // Reseller Catalog - prodotti assegnati dall'admin (non propri)
  app.get("/api/reseller/catalog", requireRole("reseller", "reseller_staff"), requireModulePermission("products", "read"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      const context = getEffectiveContext(req);
      if (!context.resellerId) return res.status(400).send("Rivenditore non trovato");
      
      // Ottieni prodotti assegnati a questo reseller
      const assignments = await storage.listResellerProducts({ resellerId: context.resellerId });
      
      // Arricchisci con dati prodotto
      const result = await Promise.all(assignments.map(async (assignment) => {
        const product = await storage.getProduct(assignment.productId);
        return {
          ...assignment,
          product,
        };
      }));
      
      res.json(result.filter(r => r.product !== undefined));
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // Reseller Catalog - pubblica/nascondi prodotto nello shop
  app.patch("/api/reseller/catalog/:assignmentId/publish", requireRole("reseller", "reseller_staff"), requireModulePermission("products", "update"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      const { isPublished } = z.object({
        isPublished: z.boolean(),
      }).parse(req.body);
      
      const context = getEffectiveContext(req);
      if (!context.resellerId) return res.status(400).send("Rivenditore non trovato");
      
      // Verifica che l'assegnazione appartenga al reseller
      const assignments = await storage.listResellerProducts({ resellerId: context.resellerId });
      const assignment = assignments.find(a => a.id === req.params.assignmentId);
      
      if (!assignment) {
        return res.status(404).send("Assegnazione prodotto non trovata");
      }
      
      if (!assignment.canUnpublish && !isPublished) {
        return res.status(403).send("Non puoi rimuovere questo prodotto dallo shop");
      }
      
      const updated = await storage.updateResellerProduct(req.params.assignmentId, { isPublished });
      res.json(updated);
    } catch (error: any) {
      res.status(400).send(error.message);
    }
  });

  // Reseller Catalog - imposta prezzo personalizzato
  app.patch("/api/reseller/catalog/:assignmentId/price", requireRole("reseller", "reseller_staff"), requireModulePermission("products", "update"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      // Accetta sia priceCents che customPriceCents per retrocompatibilità
      const schema = z.object({
        priceCents: z.number().int().positive().nullable().optional(),
        customPriceCents: z.number().int().positive().nullable().optional(),
      }).refine(data => data.priceCents !== undefined || data.customPriceCents !== undefined, {
        message: "priceCents o customPriceCents richiesto"
      });
      
      const parsed = schema.parse(req.body);
      const priceCents = parsed.priceCents ?? parsed.customPriceCents ?? null;
      
      const context = getEffectiveContext(req);
      if (!context.resellerId) return res.status(400).send("Rivenditore non trovato");
      
      // Cerca per assignmentId O productId (supporta entrambi i pattern)
      const assignments = await storage.listResellerProducts({ resellerId: context.resellerId });
      let assignment = assignments.find(a => a.id === req.params.assignmentId);
      if (!assignment) {
        // Prova a cercare per productId
        assignment = assignments.find(a => a.productId === req.params.assignmentId);
      }
      
      if (!assignment) {
        return res.status(404).send("Assegnazione prodotto non trovata");
      }
      
      if (!assignment.canOverridePrice) {
        return res.status(403).send("Non puoi modificare il prezzo di questo prodotto");
      }
      
      const updated = await storage.updateResellerProduct(assignment.id, { 
        customPriceCents: priceCents || undefined 
      });
      res.json(updated);
    } catch (error: any) {
      res.status(400).send(error.message);
    }
  });

  // Reseller Shop Catalog - prodotti con stock nel magazzino del reseller
  app.get("/api/reseller/shop-catalog", requireRole("reseller", "reseller_staff"), requireModulePermission("products", "read"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      const context = getEffectiveContext(req);
      if (!context.resellerId) return res.status(400).send("Rivenditore non trovato");
      
      // Ottieni il magazzino del reseller
      const warehouse = await storage.getWarehouseByOwner('reseller', context.resellerId);
      if (!warehouse) {
        return res.json([]); // Nessun magazzino, nessun prodotto
      }
      
      // Ottieni lo stock del magazzino con quantità > 0
      const stockItems = await storage.listWarehouseStock(warehouse.id);
      const stockWithQuantity = stockItems.filter(s => s.quantity > 0);
      
      if (stockWithQuantity.length === 0) {
        return res.json([]); // Nessun prodotto in stock
      }
      
      // Crea mappa stock per lookup veloce
      const stockMap = new Map<string, number>();
      stockWithQuantity.forEach(s => stockMap.set(s.productId, s.quantity));
      
      // Ottieni prodotti assegnati a questo reseller
      const assignments = await storage.listResellerProducts({ resellerId: context.resellerId });
      
      // Ottieni tutti i prodotti per lookup
      const allProducts = await storage.listProducts();
      const productsMap = new Map(allProducts.map(p => [p.id, p]));
      
      // Filtra prodotti assegnati che hanno stock
      const assignedProducts = assignments
        .filter(assignment => stockMap.has(assignment.productId))
        .map(assignment => {
          const product = productsMap.get(assignment.productId);
          if (!product) return null;
          return {
            product,
            assignment: {
              id: assignment.id,
              isPublished: assignment.isPublished,
              customPriceCents: assignment.customPriceCents,
              inheritedFrom: assignment.inheritedFrom,
            },
            isOwn: false,
            effectivePrice: assignment.customPriceCents || product.unitPrice,
            availableQuantity: stockMap.get(assignment.productId) || 0,
          };
        })
        .filter(Boolean);
      
      // Ottieni prodotti propri del reseller che hanno stock
      const ownProducts = allProducts.filter(p => 
        p.createdBy === context.resellerId && 
        p.isActive && 
        stockMap.has(p.id)
      );
      
      // Aggiungi prodotti propri
      const ownCatalog = ownProducts.map(product => ({
        product,
        assignment: null,
        isOwn: true,
        effectivePrice: product.unitPrice,
        availableQuantity: stockMap.get(product.id) || 0,
      }));
      
      // Evita duplicati (prodotto potrebbe essere sia assegnato che proprio)
      const assignedIds = new Set(assignments.map(a => a.productId));
      const uniqueOwnCatalog = ownCatalog.filter(item => !assignedIds.has(item.product.id));
      
      const result = [...assignedProducts, ...uniqueOwnCatalog];
      res.json(result);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // Reseller Catalog - pubblica prodotto per ID prodotto
  app.post("/api/reseller/catalog/:productId/publish", requireRole("reseller", "reseller_staff"), requireModulePermission("products", "update"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      const context = getEffectiveContext(req);
      if (!context.resellerId) return res.status(400).send("Rivenditore non trovato");
      
      // Trova l'assegnazione per questo prodotto
      const assignments = await storage.listResellerProducts({ resellerId: context.resellerId });
      const assignment = assignments.find(a => a.productId === req.params.productId);
      
      if (!assignment) {
        return res.status(404).send("Prodotto non assegnato a questo reseller");
      }
      
      const updated = await storage.updateResellerProduct(assignment.id, { isPublished: true });
      res.json(updated);
    } catch (error: any) {
      res.status(400).send(error.message);
    }
  });

  // Reseller Catalog - nascondi prodotto per ID prodotto
  app.post("/api/reseller/catalog/:productId/unpublish", requireRole("reseller", "reseller_staff"), requireModulePermission("products", "update"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      const context = getEffectiveContext(req);
      if (!context.resellerId) return res.status(400).send("Rivenditore non trovato");
      
      // Trova l'assegnazione per questo prodotto
      const assignments = await storage.listResellerProducts({ resellerId: context.resellerId });
      const assignment = assignments.find(a => a.productId === req.params.productId);
      
      if (!assignment) {
        return res.status(404).send("Prodotto non assegnato a questo reseller");
      }
      
      if (!assignment.canUnpublish) {
        return res.status(403).send("Non puoi rimuovere questo prodotto dallo shop");
      }
      
      const updated = await storage.updateResellerProduct(assignment.id, { isPublished: false });
      res.json(updated);
    } catch (error: any) {
      res.status(400).send(error.message);
    }
  });

  // Reseller Catalog - imposta prezzo per ID prodotto
  app.patch("/api/reseller/catalog/:productId/price", requireRole("reseller", "reseller_staff"), requireModulePermission("products", "update"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      const { priceCents } = z.object({
        priceCents: z.number().int().positive().nullable(),
      }).parse(req.body);
      
      const context = getEffectiveContext(req);
      if (!context.resellerId) return res.status(400).send("Rivenditore non trovato");
      
      // Trova l'assegnazione per questo prodotto
      const assignments = await storage.listResellerProducts({ resellerId: context.resellerId });
      const assignment = assignments.find(a => a.productId === req.params.productId);
      
      if (!assignment) {
        return res.status(404).send("Prodotto non assegnato a questo reseller");
      }
      
      if (!assignment.canOverridePrice) {
        return res.status(403).send("Non puoi modificare il prezzo di questo prodotto");
      }
      
      const updated = await storage.updateResellerProduct(assignment.id, { 
        customPriceCents: priceCents || undefined 
      });
      res.json(updated);
    } catch (error: any) {
      res.status(400).send(error.message);
    }
  });

  // Reseller Products - delete own product
  app.delete("/api/reseller/products/:id", requireRole("reseller", "reseller_staff"), requireModulePermission("products", "delete"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      const product = await storage.getProduct(req.params.id);
      if (!product) {
        return res.status(404).send("Prodotto non trovato");
      }
      
      // Verifica che il prodotto appartenga al reseller
      if (product.createdBy !== req.user.id) {
        return res.status(403).send("Non puoi eliminare prodotti che non hai creato");
      }
      
      await storage.deleteProduct(req.params.id);
      res.sendStatus(204);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // Reseller Products - Upload product image
  app.post("/api/reseller/products/:id/image", requireRole("reseller", "reseller_staff"), requireModulePermission("products", "update"), upload.single("image"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      const product = await storage.getProduct(req.params.id);
      if (!product) {
        return res.status(404).send("Prodotto non trovato");
      }
      
      if (product.createdBy !== req.user.id) {
        return res.status(403).send("Non puoi modificare prodotti che non hai creato");
      }
      
      if (!req.file) {
        return res.status(400).send("Nessun file caricato");
      }
      
      const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
      if (!allowedMimeTypes.includes(req.file.mimetype)) {
        return res.status(400).send("Formato immagine non supportato. Usa JPEG, PNG, WebP o GIF.");
      }
      
      const maxSize = 10 * 1024 * 1024;
      if (req.file.size > maxSize) {
        return res.status(400).send("Immagine troppo grande. Massimo 10MB.");
      }
      
      const ext = req.file.originalname.split(".").pop() || "jpg";
      const objectPath = `products/${req.params.id}/${Date.now()}.${ext}`;
      
      const privateObjectDir = objectStorage.getPrivateObjectDir();
      const fullPath = `${privateObjectDir}/${objectPath}`;
      const { bucketName, objectName } = parseObjectPath(fullPath);
      const bucket = objectStorageClient.bucket(bucketName);
      const file = bucket.file(objectName);
      
      await file.save(req.file.buffer, {
        metadata: { contentType: req.file.mimetype }
      });
      
      const imageUrl = `/objects/${objectPath}`;
      
      await storage.updateProduct(req.params.id, { imageUrl });
      
      res.json({ imageUrl });
    } catch (error: any) {
      console.error("Error uploading product image:", error);
      res.status(500).send(error.message);
    }
  });

  // Reseller Products - Delete product image
  app.delete("/api/reseller/products/:id/image", requireRole("reseller", "reseller_staff"), requireModulePermission("products", "update"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      const product = await storage.getProduct(req.params.id);
      if (!product) {
        return res.status(404).send("Prodotto non trovato");
      }
      
      if (product.createdBy !== req.user.id) {
        return res.status(403).send("Non puoi modificare prodotti che non hai creato");
      }
      
      await storage.updateProduct(req.params.id, { imageUrl: null });
      
      res.sendStatus(204);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // Update reseller product settings (price, publish status) for assigned products
  app.patch("/api/reseller/products/:productId/settings", requireAuth, requireRole("reseller", "reseller_collaborator"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      const context = getEffectiveContext(req);
      if (!context.resellerId) return res.status(400).send("Rivenditore non trovato");
      
      // Verify product is assigned to this reseller
      const assignment = await storage.getResellerProduct(req.params.productId, context.resellerId);
      if (!assignment) {
        return res.status(404).send("Prodotto non assegnato a questo rivenditore");
      }
      
      // Check if reseller can override price
      if (req.body.customPriceCents !== undefined && !assignment.canOverridePrice) {
        return res.status(403).send("Non puoi modificare il prezzo di questo prodotto");
      }
      
      // Check if reseller can unpublish
      if (req.body.isPublished === false && !assignment.canUnpublish) {
        return res.status(403).send("Non puoi rimuovere questo prodotto dallo shop");
      }
      
      const updates: { customPriceCents?: number; isPublished?: boolean } = {};
      if (req.body.customPriceCents !== undefined) {
        updates.customPriceCents = req.body.customPriceCents;
      }
      if (req.body.isPublished !== undefined) {
        updates.isPublished = req.body.isPublished;
      }
      
      const updatedAssignment = await storage.updateResellerProductByProductAndReseller(
        req.params.productId,
        context.resellerId,
        updates
      );
      
      res.json(updatedAssignment);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // ========== RESELLER INVENTORY MANAGEMENT ==========
  
  // Reseller Products - Get all own products with stock in own centers
  app.get("/api/reseller/products/with-stock", requireRole("reseller", "reseller_staff"), requireModulePermission("products", "read"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      const context = getEffectiveContext(req);
      if (!context.resellerId) return res.status(400).send("Rivenditore non trovato");
      
      const productsWithStock = await storage.getResellerProductsWithStock(context.resellerId);
      res.json(productsWithStock);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // Reseller Products - Get stock for a specific product in own centers
  app.get("/api/reseller/products/:id/stock", requireRole("reseller", "reseller_staff"), requireModulePermission("products", "read"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      // Verify product belongs to reseller
      const product = await storage.getProduct(req.params.id);
      if (!product) {
        return res.status(404).send("Prodotto non trovato");
      }
      if (product.createdBy !== req.user.id) {
        return res.status(403).send("Non puoi visualizzare lo stock di prodotti che non hai creato");
      }
      
      // Use full warehouse stock (includes reseller, sub-resellers, and repair centers)
      // Get the effective reseller ID (for staff users, use their parent reseller)
      const effectiveResellerId = req.user.role === 'reseller_staff' && req.user.resellerId 
        ? req.user.resellerId 
        : req.user.id;
      const stockByWarehouse = await storage.getResellerFullWarehouseStock(req.params.id, effectiveResellerId);
      res.json(stockByWarehouse);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // Reseller Products - Update stock for a product in a specific warehouse (repair center, reseller, or sub-reseller)
  app.post("/api/reseller/products/:id/stock", requireRole("reseller", "reseller_staff"), requireModulePermission("products", "update"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      // Verify product belongs to reseller
      const product = await storage.getProduct(req.params.id);
      if (!product) {
        return res.status(404).send("Prodotto non trovato");
      }
      if (product.createdBy !== req.user.id) {
        return res.status(403).send("Non puoi modificare lo stock di prodotti che non hai creato");
      }
      
      const { warehouseId, repairCenterId, quantity, notes } = req.body;
      const targetWarehouseId = warehouseId || repairCenterId;
      
      if (!targetWarehouseId) {
        return res.status(400).send("warehouseId o repairCenterId è richiesto");
      }
      
      if (typeof quantity !== 'number') {
        return res.status(400).send("quantity deve essere un numero");
      }
      
      // If warehouseId is provided, verify it belongs to reseller's hierarchy
      if (warehouseId) {
        const warehouse = await storage.getWarehouse(warehouseId);
        if (!warehouse) {
          return res.status(404).send("Magazzino non trovato");
        }
        
        // Get the effective reseller ID (for staff users, use their parent reseller)
        const effectiveResellerId = req.user.role === 'reseller_staff' && req.user.resellerId 
          ? req.user.resellerId 
          : req.user.id;
        
        let isAuthorized = false;
        
        if (warehouse.ownerType === 'reseller' && warehouse.ownerId === effectiveResellerId) {
          isAuthorized = true;
        } else if (warehouse.ownerType === 'sub_reseller') {
          // Check if sub-reseller belongs to this reseller
          const subReseller = await storage.getUser(warehouse.ownerId);
          if (subReseller && subReseller.parentResellerId === effectiveResellerId) {
            isAuthorized = true;
          }
        } else if (warehouse.ownerType === 'repair_center') {
          // Check if repair center belongs to this reseller
          const center = await storage.getRepairCenter(warehouse.ownerId);
          if (center && center.resellerId === effectiveResellerId) {
            isAuthorized = true;
          }
        }
        
        if (!isAuthorized) {
          return res.status(403).send("Non puoi modificare lo stock in magazzini che non ti appartengono");
        }
        
        // Update warehouse stock directly
        const stockItem = await storage.getWarehouseStockItem(warehouseId, req.params.id);
        const currentQuantity = stockItem?.quantity || 0;
        const movement = {
          warehouseId,
          productId: req.params.id,
          movementType: quantity > currentQuantity ? 'in' : 'out',
          quantity: Math.abs(quantity - currentQuantity),
          notes: notes || 'Modifica manuale stock',
          createdBy: req.user.id,
        };
        
        await storage.createWarehouseMovement(movement as any);
        await storage.upsertWarehouseStock({ warehouseId, productId: req.params.id, quantity });
        
        return res.json({ success: true, warehouseId, quantity });
      }
      
      // Legacy: repairCenterId only - verify repair center belongs to reseller
      const repairCenter = await storage.getRepairCenter(repairCenterId);
      if (!repairCenter) {
        return res.status(404).send("Centro di riparazione non trovato");
      }
      if (repairCenter.resellerId !== req.user.id) {
        return res.status(403).send("Non puoi modificare lo stock in centri che non ti appartengono");
      }
      
      // Get current stock
      const currentStock = await storage.getInventoryStock(req.params.id, repairCenterId);
      const currentQuantity = currentStock?.quantity || 0;
      const difference = quantity - currentQuantity;
      
      if (difference === 0) {
        return res.json({ message: "Nessuna variazione nella quantità" });
      }
      
      // Create inventory movement for the difference
      const movement = await storage.createInventoryMovement({
        productId: req.params.id,
        repairCenterId,
        movementType: difference > 0 ? 'in' : 'out',
        quantity: Math.abs(difference),
        notes: notes || `Rettifica manuale reseller: da ${currentQuantity} a ${quantity}`,
        createdBy: req.user.id,
      });
      
      // Get updated stock for all centers
      const updatedStock = await storage.getResellerProductStockByCenter(req.params.id, req.user.id);
      setActivityEntity(res, { type: 'inventory', id: movement.id });
      
      res.json(updatedStock);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // Reseller Inventory - Create movement for own products in own centers
  app.post("/api/reseller/inventory/movements", requireRole("reseller", "reseller_staff"), requireModulePermission("inventory", "create"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      const { productId, repairCenterId, movementType, quantity, notes } = req.body;
      
      if (!productId || !repairCenterId || !movementType || typeof quantity !== 'number') {
        return res.status(400).send("productId, repairCenterId, movementType e quantity sono richiesti");
      }
      
      // Verify product belongs to reseller
      const product = await storage.getProduct(productId);
      if (!product) {
        return res.status(404).send("Prodotto non trovato");
      }
      if (product.createdBy !== req.user.id) {
        return res.status(403).send("Non puoi creare movimenti per prodotti che non hai creato");
      }
      
      // Verify repair center belongs to reseller
      const repairCenter = await storage.getRepairCenter(repairCenterId);
      if (!repairCenter) {
        return res.status(404).send("Centro di riparazione non trovato");
      }
      if (repairCenter.resellerId !== req.user.id) {
        return res.status(403).send("Non puoi creare movimenti in centri che non ti appartengono");
      }
      
      // Validate movement type
      if (!['in', 'out', 'adjustment'].includes(movementType)) {
        return res.status(400).send("movementType deve essere 'in', 'out' o 'adjustment'");
      }
      
      const movement = await storage.createInventoryMovement({
        productId,
        repairCenterId,
        movementType,
        quantity,
        notes: notes || '',
        createdBy: req.user.id,
      });
      
      setActivityEntity(res, { type: 'inventory_movement', id: movement.id });
      res.status(201).json(movement);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // Reseller Inventory - Get inventory movements for own products
  app.get("/api/reseller/inventory/movements", requireRole("reseller", "reseller_staff"), requireModulePermission("inventory", "read"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      // Use effective context (may be viewing specific repair center)
      const context = getEffectiveContext(req);
      
      // Get reseller's repair centers
      const allCenters = await storage.listRepairCenters();
      let resellerCenters = allCenters.filter(c => c.resellerId === context.resellerId);
      
      // If viewing specific repair center, filter to just that center
      if (context.repairCenterId) {
        resellerCenters = resellerCenters.filter(c => c.id === context.repairCenterId);
      }
      
      if (resellerCenters.length === 0) {
        return res.json([]);
      }
      
      const centerIds = resellerCenters.map(c => c.id);
      
      // Get reseller's own products
      const allProducts = await storage.listProducts();
      const resellerProducts = allProducts.filter(p => p.createdBy === context.resellerId);
      const productIds = resellerProducts.map(p => p.id);
      
      // Get all movements and filter by reseller's products and centers
      const filters: { repairCenterId?: string; productId?: string } = {};
      if (req.query.repairCenterId && typeof req.query.repairCenterId === 'string') {
        if (centerIds.includes(req.query.repairCenterId)) {
          filters.repairCenterId = req.query.repairCenterId;
        } else {
          return res.json([]); // Not authorized for this center
        }
      }
      if (req.query.productId && typeof req.query.productId === 'string') {
        if (productIds.includes(req.query.productId)) {
          filters.productId = req.query.productId;
        } else {
          return res.json([]); // Not authorized for this product
        }
      }
      
      const movements = await storage.listInventoryMovements(filters);
      
      // Filter movements to only include reseller's products in reseller's centers
      const filteredMovements = movements.filter(m => 
        productIds.includes(m.productId) && centerIds.includes(m.repairCenterId)
      );
      
      res.json(filteredMovements);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // ========== END RESELLER INVENTORY MANAGEMENT ==========

  // Reseller Repair Centers - list repair centers associated with this reseller
  app.get("/api/reseller/repair-centers", requireRole("reseller", "reseller_staff"), requireModulePermission("repair_centers", "read"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      // Use effective context (may be viewing specific repair center)
      const context = getEffectiveContext(req);
      
      const allCenters = await storage.listRepairCenters();
      // Return all fields for management, filter by resellerId
      let resellerCenters = allCenters.filter(c => c.resellerId === context.resellerId);
      
      // If viewing specific repair center, filter to just that center
      if (context.repairCenterId) {
        resellerCenters = resellerCenters.filter(c => c.id === context.repairCenterId);
      }
      
      // Add userId for each center (needed for remote request assignment lookup)
      const allUsers = await storage.listUsers();
      const centersWithUserId = resellerCenters.map(center => {
        const centerUser = allUsers.find(u => u.role === 'repair_center' && u.repairCenterId === center.id);
        return { ...center, userId: centerUser?.id || null };
      });
      
      res.json(centersWithUserId);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // Reseller Repair Centers - get single repair center by ID
  app.get("/api/reseller/repair-centers/:id", requireRole("reseller", "reseller_staff"), requireModulePermission("repair_centers", "read"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      const center = await storage.getRepairCenter(req.params.id);
      if (!center) {
        return res.status(404).send("Centro di riparazione non trovato");
      }
      // Verify this center belongs to the reseller
      if (center.resellerId !== req.user.id) {
        return res.status(403).send("Non autorizzato ad accedere a questo centro");
      }
      res.json(center);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // Reseller Repair Centers - create new repair center
  app.post("/api/reseller/repair-centers", requireRole("reseller", "reseller_staff"), requireModulePermission("repair_centers", "create"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      // Validate input using schema
      const validationResult = insertRepairCenterSchema.safeParse({
        ...req.body,
        resellerId: req.user.id, // Force resellerId to logged-in reseller
        isActive: true,
      });
      
      if (!validationResult.success) {
        return res.status(400).send(validationResult.error.errors.map(e => e.message).join(", "));
      }
      
      const validated = validationResult.data;

      // Check if password was provided for the user account
      const userPassword = req.body.password;
      if (!userPassword || userPassword.length < 6) {
        return res.status(400).send("Password richiesta (minimo 6 caratteri) per creare l'account del centro");
      }

      const center = await storage.createRepairCenter({
        name: validated.name,
        address: validated.address,
        city: validated.city,
        cap: validated.cap || null,
        provincia: validated.provincia || null,
        phone: validated.phone,
        email: validated.email,
        resellerId: req.user.id, // Always set to current reseller
        isActive: true,
        hourlyRateCents: validated.hourlyRateCents || null,
        ragioneSociale: validated.ragioneSociale || null,
        partitaIva: validated.partitaIva || null,
        codiceFiscale: validated.codiceFiscale || null,
        iban: validated.iban || null,
        codiceUnivoco: validated.codiceUnivoco || null,
        pec: validated.pec || null,
      });
      
      // Create user account for the repair center
      const hashedPassword = await hashPassword(userPassword);
      // Generate username from email (before @)
      const emailUsername = validated.email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '_');
      const username = `rc_${emailUsername}_${Date.now().toString(36)}`;
      
      await storage.createUser({
        username,
        email: validated.email,
        password: hashedPassword,
        fullName: validated.name,
        role: 'repair_center',
        repairCenterId: center.id,
        phone: validated.phone || null,
        address: validated.address || null,
        city: validated.city || null,
        province: validated.provincia || null,
        postalCode: validated.cap || null,
      });
      
      // Create automatic warehouse for the repair center (with compensating cleanup)
      const existingWarehouse = await storage.getWarehouseByOwner('repair_center', center.id);
      if (!existingWarehouse) {
        try {
          await storage.createWarehouse({
            name: `Magazzino ${validated.name}`,
            ownerId: center.id,
            ownerType: 'repair_center',
            isActive: true,
          });
        } catch (warehouseError: any) {
          // Compensating cleanup: delete the center if warehouse creation fails
          console.error('Failed to create warehouse, rolling back center creation:', warehouseError);
          try {
            await storage.deleteRepairCenter(center.id);
          } catch (cleanupError) {
            console.error('Failed to cleanup repair center:', cleanupError);
          }
          throw new Error('Impossibile creare il magazzino per il centro di riparazione');
        }
      }
      
      setActivityEntity(res, { type: 'repair-centers', id: center.id });
      res.status(201).json(center);
    } catch (error: any) {
      res.status(400).send(error.message);
    }
  });

  // Reseller Repair Centers - update repair center
  app.patch("/api/reseller/repair-centers/:id", requireRole("reseller", "reseller_staff"), requireModulePermission("repair_centers", "update"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      // Verify this center belongs to the reseller
      const existingCenter = await storage.getRepairCenter(req.params.id);
      if (!existingCenter) {
        return res.status(404).send("Centro di riparazione non trovato");
      }
      if (existingCenter.resellerId !== req.user.id) {
        return res.status(403).send("Non autorizzato a modificare questo centro");
      }

      // Validate input using partial schema (exclude resellerId changes)
      const partialSchema = insertRepairCenterSchema.partial().omit({ resellerId: true });
      const validationResult = partialSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        return res.status(400).send(validationResult.error.errors.map(e => e.message).join(", "));
      }
      
      const validated = validationResult.data;
      
      const updates: any = {};
      if (validated.name !== undefined) updates.name = validated.name;
      if (validated.address !== undefined) updates.address = validated.address;
      if (validated.city !== undefined) updates.city = validated.city;
      if (validated.phone !== undefined) updates.phone = validated.phone;
      if (validated.email !== undefined) updates.email = validated.email;
      if (validated.isActive !== undefined) updates.isActive = validated.isActive;
      if (validated.hourlyRateCents !== undefined) updates.hourlyRateCents = validated.hourlyRateCents;
      if (validated.cap !== undefined) updates.cap = validated.cap;
      if (validated.provincia !== undefined) updates.provincia = validated.provincia;
      if (validated.ragioneSociale !== undefined) updates.ragioneSociale = validated.ragioneSociale;
      if (validated.partitaIva !== undefined) updates.partitaIva = validated.partitaIva;
      if (validated.codiceFiscale !== undefined) updates.codiceFiscale = validated.codiceFiscale;
      if (validated.iban !== undefined) updates.iban = validated.iban;
      if (validated.codiceUnivoco !== undefined) updates.codiceUnivoco = validated.codiceUnivoco;
      if (validated.pec !== undefined) updates.pec = validated.pec;
      // Never allow changing resellerId via reseller endpoint
      
      // Handle subResellerId assignment
      if (validated.subResellerId !== undefined) {
        if (validated.subResellerId === null || validated.subResellerId === "") {
          updates.subResellerId = null;
        } else {
          // Verify sub-reseller belongs to this reseller (sub-resellers are resellers with parentResellerId set)
          const subReseller = await storage.getUser(validated.subResellerId);
          if (!subReseller || subReseller.role !== "reseller" || subReseller.parentResellerId !== req.user.id) {
            return res.status(403).send("Sub-reseller non valido o non autorizzato");
          }
          updates.subResellerId = validated.subResellerId;
        }
      }
      
      const center = await storage.updateRepairCenter(req.params.id, updates);
      setActivityEntity(res, { type: 'repair-centers', id: center.id });
      res.json(center);
    } catch (error: any) {
      res.status(400).send(error.message);
    }
  });

  // Reseller Repair Centers - delete repair center
  app.delete("/api/reseller/repair-centers/:id", requireRole("reseller", "reseller_staff"), requireModulePermission("repair_centers", "delete"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      // Verify this center belongs to the reseller
      const existingCenter = await storage.getRepairCenter(req.params.id);
      if (!existingCenter) {
        return res.status(404).send("Centro di riparazione non trovato");
      }
      if (existingCenter.resellerId !== req.user.id) {
        return res.status(403).send("Non autorizzato a eliminare questo centro");
      }

      await storage.deleteRepairCenter(req.params.id);
      setActivityEntity(res, { type: 'repair-centers', id: req.params.id });
      res.status(204).send();
    } catch (error: any) {
      res.status(400).send(error.message);
    }
  });

  // Reseller Repair Centers - reset password for a repair center
  app.post("/api/reseller/repair-centers/:id/reset-password", requireRole("reseller", "reseller_staff"), requireModulePermission("repair_centers", "update"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Non autorizzato");
      
      const centerId = req.params.id;
      const { newPassword } = req.body;
      
      if (!newPassword || newPassword.length < 6) {
        return res.status(400).send("La password deve contenere almeno 6 caratteri");
      }

      // Verify this center belongs to the reseller
      const existingCenter = await storage.getRepairCenter(centerId);
      if (!existingCenter) {
        return res.status(404).send("Centro di riparazione non trovato");
      }
      
      // Check ownership - reseller/sub-reseller must own this center
      // For reseller_staff: use parentResellerId (they work for a reseller)
      // For reseller (including sub-resellers): use their own id
      const effectiveResellerId = req.user.role === "reseller_staff" ? req.user.parentResellerId : req.user.id;
      if (existingCenter.resellerId !== effectiveResellerId) {
        return res.status(403).send("Non autorizzato a modificare questo centro");
      }

      // Find the user associated with this repair center
      const allUsers = await storage.listUsers();
      const repairCenterUser = allUsers.find(u => u.role === 'repair_center' && u.repairCenterId === centerId);
      
      if (!repairCenterUser) {
        return res.status(404).send("Account utente del centro non trovato. Contatta l'amministratore.");
      }

      // Hash and update password
      const hashedPassword = await hashPassword(newPassword);
      await storage.updateUser(repairCenterUser.id, { password: hashedPassword });

      setActivityEntity(res, { type: 'users', id: repairCenterUser.id });
      res.json({ message: "Password aggiornata con successo" });
    } catch (error: any) {
      console.error("Error resetting repair center password:", error);
      res.status(500).send(error.message);
    }
  });

  // Reseller Repair Centers - get detailed info with stats and recent repairs
  app.get("/api/reseller/repair-centers/:id/detail", requireRole("reseller", "reseller_staff"), requireModulePermission("repair_centers", "read"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Non autorizzato");
      
      const centerId = req.params.id;
      const effectiveResellerId = req.user.role === "reseller_staff" ? req.user.parentResellerId : req.user.id;
      
      if (!effectiveResellerId) {
        return res.status(403).send("Non autorizzato");
      }

      const detail = await storage.getResellerRepairCenterDetail(effectiveResellerId, centerId);
      if (!detail) {
        return res.status(404).send("Centro di riparazione non trovato o non autorizzato");
      }

      res.json(detail);
    } catch (error: any) {
      console.error("Error getting repair center detail:", error);
      res.status(500).send(error.message);
    }
  });

  // Reseller Repair Centers - get repairs list with pagination
  app.get("/api/reseller/repair-centers/:id/repairs", requireRole("reseller", "reseller_staff"), requireModulePermission("repair_centers", "read"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Non autorizzato");
      
      const centerId = req.params.id;
      const effectiveResellerId = req.user.role === "reseller_staff" ? req.user.parentResellerId : req.user.id;
      
      if (!effectiveResellerId) {
        return res.status(403).send("Non autorizzato");
      }

      // Verify ownership
      const center = await storage.getRepairCenter(centerId);
      if (!center) {
        return res.status(404).send("Centro di riparazione non trovato");
      }
      
      // Get sub-resellers to check ownership
      const subResellers = await storage.getChildResellers(effectiveResellerId);
      const subResellerIds = subResellers.map(sr => sr.id);
      const allowedResellerIds = [effectiveResellerId, ...subResellerIds];
      
      if (!center.resellerId || !allowedResellerIds.includes(center.resellerId)) {
        return res.status(403).send("Non autorizzato ad accedere a questo centro");
      }

      const limit = parseInt(req.query.limit as string) || 20;
      const offset = parseInt(req.query.offset as string) || 0;
      const status = req.query.status as string | undefined;

      const result = await storage.getRepairCenterRepairs(centerId, { limit, offset, status });
      res.json(result);
    } catch (error: any) {
      console.error("Error getting repair center repairs:", error);
      res.status(500).send(error.message);
    }
  });

  // Reseller Suppliers - view global suppliers (admin) + own suppliers
  app.get("/api/reseller/suppliers", requireRole("reseller", "reseller_staff"), requireModulePermission("suppliers", "read"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      // Get all active suppliers
      const allSuppliers = await storage.listSuppliers(true); // Only active
      
      // Filter: global suppliers (createdBy = null) OR reseller's own (createdBy = resellerId)
      const visibleSuppliers = allSuppliers.filter(s => 
        s.createdBy === null || s.createdBy === req.user!.id
      );
      
      // Map with ownership indicator
      const result = visibleSuppliers.map(s => ({
        id: s.id,
        code: s.code,
        name: s.name,
        email: s.email,
        phone: s.phone,
        whatsapp: s.whatsapp,
        website: s.website,
        address: s.address,
        city: s.city,
        zipCode: s.zipCode,
        country: s.country,
        vatNumber: s.vatNumber,
        fiscalCode: s.fiscalCode,
        communicationChannel: s.communicationChannel,
        deliveryDays: s.deliveryDays,
        minOrderAmount: s.minOrderAmount,
        shippingCost: s.shippingCost,
        freeShippingThreshold: s.freeShippingThreshold,
        paymentTerms: s.paymentTerms,
        isActive: s.isActive,
        createdBy: s.createdBy,
        isGlobal: s.createdBy === null, // Flag to indicate admin-created global supplier
        isOwn: s.createdBy === req.user!.id, // Flag to indicate reseller-owned supplier
        createdAt: s.createdAt,
      }));
      
      res.json(result);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // Reseller Suppliers - create own supplier
  app.post("/api/reseller/suppliers", requireRole("reseller", "reseller_staff"), requireModulePermission("suppliers", "create"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      const validated = insertSupplierSchema.parse({
        ...req.body,
        createdBy: req.user.id, // Set ownership to reseller
      });
      
      // Generate unique code for reseller supplier (prefix with R-)
      const allSuppliers = await storage.listSuppliers();
      const resellerSupplierCount = allSuppliers.filter(s => s.createdBy === req.user!.id).length;
      const code = `R-${req.user.id.substring(0, 4).toUpperCase()}-${String(resellerSupplierCount + 1).padStart(3, '0')}`;
      
      // Check for duplicate code
      const existing = await storage.getSupplierByCode(code);
      if (existing) {
        return res.status(400).send("Codice fornitore già esistente");
      }
      
      const supplier = await storage.createSupplier({ ...validated, code });
      setActivityEntity(res, { type: 'suppliers', id: supplier.id });
      res.status(201).json(supplier);
    } catch (error: any) {
      res.status(400).send(error.message);
    }
  });

  // Reseller Suppliers - update own supplier
  app.patch("/api/reseller/suppliers/:id", requireRole("reseller", "reseller_staff"), requireModulePermission("suppliers", "update"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      const existing = await storage.getSupplier(req.params.id);
      if (!existing) {
        return res.status(404).send("Fornitore non trovato");
      }
      
      // Only allow editing own suppliers (not global or others' suppliers)
      if (existing.createdBy === null) {
        return res.status(403).send("I fornitori globali non possono essere modificati");
      }
      if (existing.createdBy !== req.user.id) {
        return res.status(403).send("Non autorizzato a modificare questo fornitore");
      }
      
      const supplier = await storage.updateSupplier(req.params.id, req.body);
      setActivityEntity(res, { type: 'suppliers', id: supplier.id });
      res.json(supplier);
    } catch (error: any) {
      res.status(400).send(error.message);
    }
  });

  // Reseller Suppliers - delete own supplier
  app.delete("/api/reseller/suppliers/:id", requireRole("reseller", "reseller_staff"), requireModulePermission("suppliers", "delete"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      const existing = await storage.getSupplier(req.params.id);
      if (!existing) {
        return res.status(404).send("Fornitore non trovato");
      }
      
      // Only allow deleting own suppliers (not global or others' suppliers)
      if (existing.createdBy === null) {
        return res.status(403).send("I fornitori globali non possono essere eliminati");
      }
      if (existing.createdBy !== req.user.id) {
        return res.status(403).send("Non autorizzato a eliminare questo fornitore");
      }
      
      await storage.deleteSupplier(req.params.id);
      setActivityEntity(res, { type: 'suppliers', id: req.params.id });
      res.status(204).send();
    } catch (error: any) {
      res.status(400).send(error.message);
    }
  });

  // Reseller Supplier Orders - view orders from associated repair centers
  app.get("/api/reseller/supplier-orders", requireRole("reseller", "reseller_staff"), requireModulePermission("supplier_orders", "read"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      // Use effective context (may be viewing specific repair center)
      const context = getEffectiveContext(req);
      
      // Get repair centers associated with this reseller
      const allCenters = await storage.listRepairCenters();
      let resellerCenters = allCenters.filter(c => c.resellerId === context.resellerId);
      
      // If viewing specific repair center, filter to just that center
      if (context.repairCenterId) {
        resellerCenters = resellerCenters.filter(c => c.id === context.repairCenterId);
      }
      
      const resellerCenterIds = resellerCenters.map(c => c.id);
      
      if (resellerCenterIds.length === 0) {
        return res.json([]);
      }
      
      // Use storage-level filtering for security
      const resellerOrders = await storage.listSupplierOrdersByRepairCenters(resellerCenterIds);
      
      // Get suppliers for enrichment
      const suppliers = await storage.listSuppliers();
      const suppliersMap = new Map(suppliers.map(s => [s.id, { id: s.id, name: s.name, code: s.code }]));
      const centersMap = new Map(resellerCenters.map(c => [c.id, { id: c.id, name: c.name, city: c.city }]));
      
      // Enrich orders
      const enrichedOrders = resellerOrders.map(order => ({
        ...order,
        supplier: suppliersMap.get(order.supplierId) || null,
        repairCenter: centersMap.get(order.repairCenterId) || null,
      }));
      
      res.json(enrichedOrders);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // Reseller Supplier Order Details
  app.get("/api/reseller/supplier-orders/:id", requireRole("reseller", "reseller_staff"), requireModulePermission("supplier_orders", "read"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      // Use effective context (may be viewing specific repair center)
      const context = getEffectiveContext(req);
      
      const order = await storage.getSupplierOrder(req.params.id);
      if (!order) {
        return res.status(404).send("Ordine non trovato");
      }
      
      // Verify reseller has access to this order's repair center
      const allCenters = await storage.listRepairCenters();
      let resellerCenters = allCenters.filter(c => c.resellerId === context.resellerId);
      
      // If viewing specific repair center, only allow access to that center's data
      if (context.repairCenterId) {
        resellerCenters = resellerCenters.filter(c => c.id === context.repairCenterId);
      }
      
      const resellerCenterIds = resellerCenters.map(c => c.id);
      
      if (!resellerCenterIds.includes(order.repairCenterId)) {
        return res.status(403).send("Accesso negato");
      }
      
      // Get items
      const items = await storage.listSupplierOrderItems(order.id);
      
      // Get supplier info
      const supplier = await storage.getSupplier(order.supplierId);
      const center = allCenters.find(c => c.id === order.repairCenterId);
      
      res.json({
        ...order,
        items,
        supplier: supplier ? { id: supplier.id, name: supplier.name, code: supplier.code } : null,
        repairCenter: center ? { id: center.id, name: center.name, city: center.city } : null,
      });
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // Reseller Supplier Returns - view returns from associated repair centers
  app.get("/api/reseller/supplier-returns", requireRole("reseller", "reseller_staff"), requireModulePermission("supplier_orders", "read"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      // Use effective context (may be viewing specific repair center)
      const context = getEffectiveContext(req);
      
      // Get repair centers associated with this reseller
      const allCenters = await storage.listRepairCenters();
      let resellerCenters = allCenters.filter(c => c.resellerId === context.resellerId);
      
      // If viewing specific repair center, filter to just that center
      if (context.repairCenterId) {
        resellerCenters = resellerCenters.filter(c => c.id === context.repairCenterId);
      }
      
      const resellerCenterIds = resellerCenters.map(c => c.id);
      
      if (resellerCenterIds.length === 0) {
        return res.json([]);
      }
      
      // Use storage-level filtering for security
      const resellerReturns = await storage.listSupplierReturnsByRepairCenters(resellerCenterIds);
      
      // Get suppliers for enrichment
      const suppliers = await storage.listSuppliers();
      const suppliersMap = new Map(suppliers.map(s => [s.id, { id: s.id, name: s.name, code: s.code }]));
      const centersMap = new Map(resellerCenters.map(c => [c.id, { id: c.id, name: c.name, city: c.city }]));
      
      // Enrich returns
      const enrichedReturns = resellerReturns.map(ret => ({
        ...ret,
        supplier: suppliersMap.get(ret.supplierId) || null,
        repairCenter: centersMap.get(ret.repairCenterId) || null,
      }));
      
      res.json(enrichedReturns);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // Reseller Supplier Return Details
  app.get("/api/reseller/supplier-returns/:id", requireRole("reseller", "reseller_staff"), requireModulePermission("supplier_orders", "read"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      // Use effective context (may be viewing specific repair center)
      const context = getEffectiveContext(req);
      
      const ret = await storage.getSupplierReturn(req.params.id);
      if (!ret) {
        return res.status(404).send("Reso non trovato");
      }
      
      // Verify reseller has access to this return's repair center
      const allCenters = await storage.listRepairCenters();
      let resellerCenters = allCenters.filter(c => c.resellerId === context.resellerId);
      
      // If viewing specific repair center, only allow access to that center's data
      if (context.repairCenterId) {
        resellerCenters = resellerCenters.filter(c => c.id === context.repairCenterId);
      }
      
      const resellerCenterIds = resellerCenters.map(c => c.id);
      
      if (!resellerCenterIds.includes(ret.repairCenterId)) {
        return res.status(403).send("Accesso negato");
      }
      
      // Get items
      const items = await storage.listSupplierReturnItems(ret.id);
      
      // Get supplier info
      const supplier = await storage.getSupplier(ret.supplierId);
      const center = allCenters.find(c => c.id === ret.repairCenterId);
      
      res.json({
        ...ret,
        items,
        supplier: supplier ? { id: supplier.id, name: supplier.name, code: supplier.code } : null,
        repairCenter: center ? { id: center.id, name: center.name, city: center.city } : null,
      });
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // ============ RESELLER APPOINTMENTS ============

  // POST /api/reseller/appointments - Create a new delivery appointment
  app.post("/api/reseller/appointments", requireRole("reseller", "reseller_staff"), requireModulePermission("appointments", "create"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      // Use effective context (may be viewing as sub-reseller or repair center)
      const context = getEffectiveContext(req);
      
      // Get repair centers associated with this reseller (or acting-as reseller)
      const allCenters = await storage.listRepairCenters();
      let resellerCenters = allCenters.filter(c => c.resellerId === context.resellerId);
      
      // If viewing specific repair center, filter to just that center
      if (context.repairCenterId) {
        resellerCenters = resellerCenters.filter(c => c.id === context.repairCenterId);
      }
      
      const resellerCenterIds = resellerCenters.map(c => c.id);
      
      if (resellerCenterIds.length === 0) {
        return res.status(400).send("Nessun centro di riparazione associato");
      }
      
      // Validate request body
      const parsed = insertDeliveryAppointmentSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).send(parsed.error.message);
      }
      
      const { repairCenterId, repairOrderId, customerId, date, startTime, endTime, notes } = parsed.data;
      
      // Verify the repairCenterId belongs to this reseller
      if (!resellerCenterIds.includes(repairCenterId)) {
        return res.status(403).send("Centro di riparazione non autorizzato");
      }
      
      // Verify reseller can manage this repair order
      if (repairOrderId) {
        const order = await storage.getRepairOrder(repairOrderId);
        if (!order) {
          return res.status(404).send("Ordine di riparazione non trovato");
        }
        const canManage = await canResellerManageOrder(req.user.id, order);
        if (!canManage) {
          return res.status(403).send("Non hai accesso a questo ordine di riparazione");
        }
      }
      
      // Helper to convert HH:MM to minutes
      const timeToMinutes = (time: string): number => {
        const [h, m] = time.split(':').map(Number);
        return h * 60 + m;
      };
      
      const reqStartMinutes = timeToMinutes(startTime);
      const reqEndMinutes = timeToMinutes(endTime);
      
      // Check if there's a blackout on this date (any overlap blocks the slot)
      const blackouts = await storage.listRepairCenterBlackouts(repairCenterId);
      const isBlackout = blackouts.some(b => {
        if (b.date !== date) return false;
        // Full-day blackout
        if (!b.startTime) return true;
        // Partial blackout: check for any overlap using minutes
        const blackoutStart = timeToMinutes(b.startTime);
        const blackoutEnd = timeToMinutes(b.endTime!);
        return reqStartMinutes < blackoutEnd && reqEndMinutes > blackoutStart;
      });
      if (isBlackout) {
        return res.status(400).send("Il centro è chiuso in questa data/ora");
      }
      
      // Check slot availability
      const dateObj = new Date(date);
      const weekday = dateObj.getDay();
      const availabilities = await storage.listRepairCenterAvailability(repairCenterId);
      const dayAvailability = availabilities.find(a => a.weekday === weekday);
      
      if (!dayAvailability || dayAvailability.isClosed) {
        return res.status(400).send("Il centro è chiuso in questo giorno");
      }
      
      const dayStartMinutes = timeToMinutes(dayAvailability.startTime);
      const dayEndMinutes = timeToMinutes(dayAvailability.endTime);
      
      // Check if time is within availability
      if (reqStartMinutes < dayStartMinutes || reqEndMinutes > dayEndMinutes) {
        return res.status(400).send("L'orario selezionato è fuori dall'orario di apertura");
      }
      
      // Validate slot alignment - ensure requested slot matches system-generated slots
      const slotDuration = dayAvailability.slotDurationMinutes;
      
      // Check if start time is aligned to slot grid
      if ((reqStartMinutes - dayStartMinutes) % slotDuration !== 0) {
        return res.status(400).send("L'orario di inizio non è allineato con gli slot disponibili");
      }
      
      // Check if slot duration matches
      if (reqEndMinutes - reqStartMinutes !== slotDuration) {
        return res.status(400).send("La durata dello slot non è corretta");
      }
      
      // Check slot capacity - use canonical slot key (startTime) to count bookings
      const existingAppointments = await storage.listDeliveryAppointments(repairCenterId);
      const slotsAtTime = existingAppointments.filter(
        a => a.date === date && a.startTime === startTime && a.status !== 'cancelled'
      );
      
      if (slotsAtTime.length >= dayAvailability.capacityPerSlot) {
        return res.status(400).send("Questo slot è già al completo");
      }
      
      // Create the appointment
      const appointment = await storage.createDeliveryAppointment({
        repairOrderId,
        repairCenterId,
        resellerId: req.user.id,
        customerId: customerId || null,
        date,
        startTime,
        endTime,
        notes: notes || null,
        status: "scheduled",
      });
      
      res.status(201).json(appointment);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // GET /api/reseller/appointments/available-slots - Get available slots for a date
  app.get("/api/reseller/appointments/available-slots", requireRole("reseller", "reseller_staff"), requireModulePermission("appointments", "read"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      // Use effective context (may be viewing as sub-reseller or repair center)
      const context = getEffectiveContext(req);
      
      const { repairCenterId, date } = req.query as { repairCenterId: string; date: string };
      
      if (!repairCenterId || !date) {
        return res.status(400).send("repairCenterId and date are required");
      }
      
      // Verify the repairCenterId belongs to this reseller (or acting-as reseller)
      const allCenters = await storage.listRepairCenters();
      let resellerCenters = allCenters.filter(c => c.resellerId === context.resellerId);
      
      // If viewing specific repair center, only allow access to that center
      if (context.repairCenterId) {
        resellerCenters = resellerCenters.filter(c => c.id === context.repairCenterId);
      }
      
      const resellerCenterIds = resellerCenters.map(c => c.id);
      
      if (!resellerCenterIds.includes(repairCenterId)) {
        return res.status(403).send("Centro di riparazione non autorizzato");
      }
      
      // Check if there's a blackout on this date
      const blackouts = await storage.listRepairCenterBlackouts(repairCenterId);
      const isFullDayBlackout = blackouts.some(b => b.date === date && !b.startTime);
      if (isFullDayBlackout) {
        return res.json({ closed: true, reason: "Centro chiuso", slots: [] });
      }
      
      // Get day availability
      const dateObj = new Date(date);
      const weekday = dateObj.getDay();
      const availabilities = await storage.listRepairCenterAvailability(repairCenterId);
      const dayAvailability = availabilities.find(a => a.weekday === weekday);
      
      if (!dayAvailability || dayAvailability.isClosed) {
        return res.json({ closed: true, reason: "Giorno di chiusura", slots: [] });
      }
      
      // Generate all possible slots
      const slots: { startTime: string; endTime: string; available: number; total: number }[] = [];
      const [startHour, startMin] = dayAvailability.startTime.split(':').map(Number);
      const [endHour, endMin] = dayAvailability.endTime.split(':').map(Number);
      const slotDuration = dayAvailability.slotDurationMinutes;
      const capacity = dayAvailability.capacityPerSlot;
      
      let currentMinutes = startHour * 60 + startMin;
      const endMinutes = endHour * 60 + endMin;
      
      // Get existing appointments for this date
      const existingAppointments = await storage.listDeliveryAppointments(repairCenterId);
      const appointmentsOnDate = existingAppointments.filter(
        a => a.date === date && a.status !== 'cancelled'
      );
      
      while (currentMinutes + slotDuration <= endMinutes) {
        const slotStartTime = `${String(Math.floor(currentMinutes / 60)).padStart(2, '0')}:${String(currentMinutes % 60).padStart(2, '0')}`;
        const slotEndMinutes = currentMinutes + slotDuration;
        const slotEndTime = `${String(Math.floor(slotEndMinutes / 60)).padStart(2, '0')}:${String(slotEndMinutes % 60).padStart(2, '0')}`;
        
        // Check if slot is during a partial blackout
        const isBlocked = blackouts.some(b => 
          b.date === date && b.startTime && b.startTime <= slotStartTime && b.endTime! >= slotEndTime
        );
        
        if (!isBlocked) {
          const bookedCount = appointmentsOnDate.filter(a => a.startTime === slotStartTime).length;
          slots.push({
            startTime: slotStartTime,
            endTime: slotEndTime,
            available: capacity - bookedCount,
            total: capacity
          });
        }
        
        currentMinutes += slotDuration;
      }
      
      res.json({ closed: false, slots });
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // ============ REPAIR CENTER ROUTES ============

  // GET /api/repair-center/settings - Get repair center profile settings
  app.get("/api/repair-center/settings", requireRole("repair_center"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      const repairCenterId = req.user.repairCenterId;
      if (!repairCenterId) {
        return res.status(400).send("Nessun centro di riparazione associato");
      }
      
      const repairCenter = await storage.getRepairCenter(repairCenterId);
      if (!repairCenter) {
        return res.status(404).send("Centro di riparazione non trovato");
      }
      
      res.json(repairCenter);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // PATCH /api/repair-center/settings - Update repair center profile settings
  app.patch("/api/repair-center/settings", requireRole("repair_center"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      const repairCenterId = req.user.repairCenterId;
      if (!repairCenterId) {
        return res.status(400).send("Nessun centro di riparazione associato");
      }
      
      const repairCenter = await storage.getRepairCenter(repairCenterId);
      if (!repairCenter) {
        return res.status(404).send("Centro di riparazione non trovato");
      }
      
      // Validate incoming data
      const { updateRepairCenterSettingsSchema } = await import("@shared/schema");
      const validatedData = updateRepairCenterSettingsSchema.parse(req.body);
      
      // Update repair center with validated data
      const updated = await storage.updateRepairCenter(repairCenterId, validatedData);
      
      // Auto-sync work profile if openingHours changed
      if (validatedData.openingHours) {
        await autoSyncWorkProfileFromRepairCenter(repairCenterId, validatedData.openingHours, repairCenter.resellerId);
      }
      
      setActivityEntity(res, { type: 'repair_centers', id: repairCenterId });
      
      res.json(updated);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ errors: error.errors });
      }
      res.status(500).send(error.message);
    }
  });


  // GET /api/repair-center/service-catalog - View service catalog with prices
  app.get("/api/repair-center/service-catalog", requireRole("repair_center"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      const repairCenterId = req.user.repairCenterId;
      if (!repairCenterId) {
        return res.status(400).send("Repair center not found");
      }
      
      // Get repair center to find parent reseller
      const repairCenter = await storage.getRepairCenter(repairCenterId);
      if (!repairCenter) {
        return res.status(404).send("Repair center not found");
      }
      
      // Get all active service items
      const items = await storage.listServiceItems();
      // Include: global items (no owner) + reseller items + items owned by this center
      const activeItems = items.filter(item => 
        item.isActive && (
          !item.repairCenterId || // Global or reseller items
          item.repairCenterId === repairCenterId // Own items
        )
      );
      
      // Get custom prices for this repair center
      const centerPrices = await storage.listServiceItemPricesByRepairCenter(repairCenterId);
      
      // Get reseller prices as fallback
      const resellerPrices = repairCenter.resellerId 
        ? await storage.listServiceItemPricesByReseller(repairCenter.resellerId)
        : [];
      
      // Build response with effective prices
      const itemsWithPrices = activeItems.map(item => {
        const centerPrice = centerPrices.find(p => p.serviceItemId === item.id);
        const resellerPrice = resellerPrices.find(p => p.serviceItemId === item.id);
        
        // Priority: center price > reseller price > base price
        let effectivePrice = item.defaultPriceCents;
        let effectiveLaborMinutes = item.defaultLaborMinutes;
        let priceSource: 'base' | 'reseller' | 'center' = 'base';
        
        if (centerPrice) {
          effectivePrice = centerPrice.priceCents;
          effectiveLaborMinutes = centerPrice.laborMinutes ?? item.defaultLaborMinutes;
          priceSource = 'center';
        } else if (resellerPrice) {
          effectivePrice = resellerPrice.priceCents;
          effectiveLaborMinutes = resellerPrice.laborMinutes ?? item.defaultLaborMinutes;
          priceSource = 'reseller';
        }
        
        return {
          ...item,
          effectivePrice,
          effectiveLaborMinutes,
          priceSource,
        };
      });
      
      res.json(itemsWithPrices);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // =============================================
  // REPAIR CENTER SERVICE ITEMS CRUD
  // =============================================

  // POST /api/repair-center/service-items - Create new service item
  app.post("/api/repair-center/service-items", requireRole("repair_center"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      const repairCenterId = req.user.repairCenterId;
      if (!repairCenterId) {
        return res.status(400).send("Repair center not found");
      }
      
      const { code, name, description, category, deviceTypeId, brandId, modelId, defaultPriceCents, defaultLaborMinutes } = req.body;
      
      if (!code || !name || !category || defaultPriceCents === undefined) {
        return res.status(400).json({ error: "Missing required fields" });
      }
      
      // Create service item with repairCenterId ownership
      const newItem = await storage.createServiceItem({
        code,
        name,
        description: description || null,
        category,
        deviceTypeId: deviceTypeId || null,
        brandId: brandId || null,
        modelId: modelId || null,
        defaultPriceCents,
        defaultLaborMinutes: defaultLaborMinutes || 60,
        repairCenterId,
        isActive: true,
      });
      
      res.status(201).json(newItem);
    } catch (error: any) {
      if (error.message?.includes('duplicate key') || error.code === '23505') {
        return res.status(400).json({ error: "Codice intervento già esistente" });
      }
      res.status(500).send(error.message);
    }
  });

  // PATCH /api/repair-center/service-items/:id - Update service item
  app.patch("/api/repair-center/service-items/:id", requireRole("repair_center"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      const repairCenterId = req.user.repairCenterId;
      if (!repairCenterId) {
        return res.status(400).send("Repair center not found");
      }
      
      const { id } = req.params;
      
      // Verify ownership
      const existingItem = await storage.getServiceItem(id);
      if (!existingItem) {
        return res.status(404).send("Service item not found");
      }
      if (existingItem.repairCenterId !== repairCenterId) {
        return res.status(403).send("Non autorizzato a modificare questo intervento");
      }
      
      const { name, description, category, deviceTypeId, brandId, modelId, defaultPriceCents, defaultLaborMinutes, isActive } = req.body;
      
      const updated = await storage.updateServiceItem(id, {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(category !== undefined && { category }),
        ...(deviceTypeId !== undefined && { deviceTypeId }),
        ...(brandId !== undefined && { brandId }),
        ...(modelId !== undefined && { modelId }),
        ...(defaultPriceCents !== undefined && { defaultPriceCents }),
        ...(defaultLaborMinutes !== undefined && { defaultLaborMinutes }),
        ...(isActive !== undefined && { isActive }),
      });
      
      res.json(updated);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // DELETE /api/repair-center/service-items/:id - Delete service item
  app.delete("/api/repair-center/service-items/:id", requireRole("repair_center"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      const repairCenterId = req.user.repairCenterId;
      if (!repairCenterId) {
        return res.status(400).send("Repair center not found");
      }
      
      const { id } = req.params;
      
      // Verify ownership
      const existingItem = await storage.getServiceItem(id);
      if (!existingItem) {
        return res.status(404).send("Service item not found");
      }
      if (existingItem.repairCenterId !== repairCenterId) {
        return res.status(403).send("Non autorizzato a eliminare questo intervento");
      }
      
      await storage.deleteServiceItem(id);
      res.status(204).send();
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });
  app.get("/api/repair-center/stats", requireRole("repair_center"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");

      const repairs = await storage.listRepairOrders({ repairCenterId: req.user.repairCenterId || undefined });
      const inventory = await storage.listInventoryStock(req.user.repairCenterId || undefined);

      const stats = {
        assignedRepairs: repairs.length,
        inProgressRepairs: repairs.filter(r => r.status === "in_progress").length,
        completedToday: repairs.filter(r => 
          r.status === "completed" && 
          new Date(r.updatedAt).toDateString() === new Date().toDateString()
        ).length,
        inventoryItems: inventory.length,
      };

      res.json(stats);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  app.get("/api/repair-center/repairs", requireRole("repair_center"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      const repairs = await storage.listRepairOrders({ repairCenterId: req.user.repairCenterId || undefined });
      res.json(repairs);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // Paginated Repair Orders (Repair Center) - for advanced search and filtering
  app.get("/api/repair-center/repairs/paginated", requireRole("repair_center"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      if (!req.user.repairCenterId) return res.json({ data: [], page: 1, pageSize: 25, total: 0, totalPages: 0 });
      
      const page = parseInt(req.query.page as string) || 1;
      const pageSize = Math.min(parseInt(req.query.pageSize as string) || 25, 100);
      
      const filters: any = { repairCenterId: req.user.repairCenterId };
      
      if (req.query.status && req.query.status !== 'all') filters.status = req.query.status;
      if (req.query.deviceType && req.query.deviceType !== 'all') filters.deviceType = req.query.deviceType;
      if (req.query.search) filters.search = req.query.search;
      if (req.query.startDate) filters.startDate = req.query.startDate;
      if (req.query.endDate) filters.endDate = req.query.endDate;
      
      const result = await storage.listRepairOrdersPaginated({ page, pageSize, filters });
      
      // Enrich with customer names for display
      const allUsers = await storage.listUsers();
      const customersMap = new Map<string, { fullName: string | null; ragioneSociale: string | null }>();
      
      allUsers.forEach(u => {
        if (u.role === 'customer') {
          customersMap.set(u.id, { fullName: u.fullName, ragioneSociale: u.ragioneSociale });
        }
      });
      
      // Compute SLA for each order
      const { loadSLAConfig, computeSLASeverity } = await import("./sla-utils");
      const slaConfig = await loadSLAConfig();
      
      const enrichedData = await Promise.all(result.data.map(async (repair) => {
        const currentState = await storage.getCurrentRepairOrderState(repair.id);
        const stateEnteredAt = currentState?.enteredAt || repair.createdAt;
        const { severity, minutesInState, phase } = computeSLASeverity(repair.status, stateEnteredAt, slaConfig);
        
        const customer = repair.customerId ? customersMap.get(repair.customerId) : null;
        const customerName = customer?.ragioneSociale || customer?.fullName || null;
        
        return {
          ...repair,
          customerName,
          slaSeverity: severity,
          slaMinutesInState: minutesInState,
          slaPhase: phase,
          slaEnteredAt: stateEnteredAt.toISOString(),
        };
      }));
      
      // Apply SLA filter client-side
      let filteredData = enrichedData;
      if (req.query.slaSeverity && req.query.slaSeverity !== 'all') {
        filteredData = enrichedData.filter(r => r.slaSeverity === req.query.slaSeverity);
      }
      
      res.json({
        data: filteredData,
        page: result.page,
        pageSize: result.pageSize,
        total: result.total,
        totalPages: result.totalPages,
      });
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  app.get("/api/repair-center/inventory", requireRole("repair_center"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      const inventory = await storage.listInventoryStock(req.user.repairCenterId || undefined);
      res.json(inventory);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  app.patch("/api/repair-center/repairs/:id/status", requireRole("repair_center"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      const validatedData = updateRepairStatusSchema.parse(req.body);
      
      const repair = await storage.getRepairOrder(req.params.id);
      if (!repair) return res.status(404).send("Repair order not found");
      
      if (repair.repairCenterId !== req.user.repairCenterId) {
        return res.status(403).send("Cannot update repairs from other centers");
      }
      
      const updated = await storage.updateRepairOrderStatus(req.params.id, validatedData.status);
      setActivityEntity(res, { type: 'repairs', id: req.params.id });
      
      await storage.invalidateCache('overview_%');
      await storage.invalidateCache('centers_%');
      
      res.json(updated);
    } catch (error: any) {
      res.status(400).send(error.message);
    }
  });

  // Skip diagnosis - go directly from ingressato to preventivo_emesso
  const skipDiagnosisSchema = z.object({
    reason: z.string().optional(),
  });

  app.post("/api/repair-center/repairs/:id/skip-diagnosis", requireRole("repair_center"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      const { reason } = skipDiagnosisSchema.parse(req.body);
      
      const repair = await storage.getRepairOrder(req.params.id);
      if (!repair) return res.status(404).send("Ordine di riparazione non trovato");
      
      if (repair.repairCenterId !== req.user.repairCenterId) {
        return res.status(403).send("Non puoi modificare riparazioni di altri centri");
      }
      
      // Can only skip diagnosis from ingressato state
      if (repair.status !== 'ingressato') {
        return res.status(400).send("La diagnosi può essere saltata solo dallo stato 'ingressato'");
      }
      
      // Update repair order with skip flag and move to in_diagnosi (to allow quote creation)
      const updated = await storage.updateRepairOrder(req.params.id, {
        skipDiagnosis: true,
        skipDiagnosisReason: reason || null,
        status: 'in_diagnosi' as any,
      });
      
      // Log the state transition - close previous state and create new one
      await storage.closeRepairOrderStateHistory(req.params.id, req.user.id);
      await storage.createRepairOrderStateHistory({
        repairOrderId: req.params.id,
        status: 'in_diagnosi' as any,
        enteredAt: new Date(),
        changedBy: req.user.id,
      });
      
      setActivityEntity(res, { type: 'repairs', id: req.params.id });
      
      await storage.invalidateCache('overview_%');
      await storage.invalidateCache('centers_%');
      
      res.json(updated);
    } catch (error: any) {
      console.error("Error skipping diagnosis:", error);
      res.status(400).send(error.message);
    }
  });

  app.post("/api/repair-center/inventory/movements", requireRole("repair_center"), async (req, res) => {
    try {
      if (!req.user || !req.user.repairCenterId) {
        return res.status(401).send("Unauthorized or no repair center assigned");
      }

      const baseSchema = insertInventoryMovementSchema.pick({
        productId: true,
        movementType: true,
        quantity: true,
        notes: true,
      });
      const validatedData = baseSchema.parse(req.body);

      const movement = await storage.createInventoryMovement({
        productId: validatedData.productId,
        repairCenterId: req.user.repairCenterId, // Force center ID from session
        movementType: validatedData.movementType,
        quantity: validatedData.quantity,
        notes: validatedData.notes,
        createdBy: req.user.id,
      });
      setActivityEntity(res, { type: 'inventory', id: movement.id });
      res.status(201).json(movement);
    } catch (error: any) {
      res.status(400).send(error.message);
    }
  });

  // ============ CUSTOMER ROUTES ============

  app.get("/api/customer/stats", requireRole("customer"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");

      const repairs = await storage.listRepairOrders({ customerId: req.user.id });
      const tickets = await storage.listTickets({ customerId: req.user.id });

      const stats = {
        totalRepairs: repairs.length,
        activeRepairs: repairs.filter(r => r.status === "in_progress" || r.status === "pending").length,
        completedRepairs: repairs.filter(r => r.status === "completed" || r.status === "delivered").length,
        openTickets: tickets.filter(t => t.status === "open").length,
      };

      res.json(stats);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  app.get("/api/customer/repairs", requireRole("customer"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      const repairs = await storage.listRepairOrders({ customerId: req.user.id });
      res.json(repairs);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  app.get("/api/customer/repairs/:id", requireRole("customer"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      const repair = await storage.getRepairOrder(req.params.id);
      if (!repair) return res.status(404).send("Repair order not found");
      
      if (repair.customerId !== req.user.id) {
        return res.status(403).send("Cannot access other customers' repairs");
      }
      
      // Enrich response with repair center info for customer display
      let repairCenterInfo = null;
      if (repair.repairCenterId) {
        const repairCenter = await storage.getUser(repair.repairCenterId);
        if (repairCenter) {
          repairCenterInfo = {
            id: repairCenter.id,
            fullName: repairCenter.fullName,
            phone: repairCenter.phone,
            address: repairCenter.address,
          };
        }
      }
      
      res.json({
        ...repair,
        repairCenterInfo,
      });
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  app.get("/api/customer/tickets", requireRole("customer"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      const tickets = await storage.listTickets({ customerId: req.user.id });
      res.json(tickets);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  app.post("/api/customer/tickets", requireRole("customer"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");

      // Validate with Zod schema - enforce customer ownership
      const baseSchema = insertTicketSchema.pick({
        subject: true,
        description: true,
        priority: true,
      });

      const validatedData = baseSchema.parse(req.body);

      const ticket = await storage.createTicket({
        customerId: req.user.id, // Force customer ID from session
        subject: validatedData.subject,
        description: validatedData.description,
        priority: validatedData.priority,
      });
      setActivityEntity(res, { type: 'tickets', id: ticket.id });
      res.status(201).json(ticket);
    } catch (error: any) {
      res.status(400).send(error.message);
    }
  });

  // ============ CUSTOMER PROFILE ============
  
  app.get("/api/customer/profile", requireRole("customer"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      const user = await storage.getUser(req.user.id);
      if (!user) return res.status(404).send("User not found");
      
      // Return safe profile data (no password)
      const { password: _, ...safeUser } = user;
      res.json(safeUser);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  app.patch("/api/customer/profile", requireRole("customer"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      const { customerProfileUpdateSchema } = await import("@shared/schema");
      const validatedData = customerProfileUpdateSchema.parse(req.body);
      
      // Build update object only with provided fields
      const updates: Record<string, any> = {};
      if (validatedData.fullName !== undefined) updates.fullName = validatedData.fullName;
      if (validatedData.email !== undefined) updates.email = validatedData.email;
      if (validatedData.phone !== undefined) updates.phone = validatedData.phone;
      if (validatedData.ragioneSociale !== undefined) updates.ragioneSociale = validatedData.ragioneSociale;
      if (validatedData.partitaIva !== undefined) updates.partitaIva = validatedData.partitaIva;
      if (validatedData.codiceFiscale !== undefined) updates.codiceFiscale = validatedData.codiceFiscale;
      if (validatedData.indirizzo !== undefined) updates.indirizzo = validatedData.indirizzo;
      if (validatedData.citta !== undefined) updates.citta = validatedData.citta;
      if (validatedData.cap !== undefined) updates.cap = validatedData.cap;
      if (validatedData.provincia !== undefined) updates.provincia = validatedData.provincia;
      if (validatedData.pec !== undefined) updates.pec = validatedData.pec;
      if (validatedData.codiceUnivoco !== undefined) updates.codiceUnivoco = validatedData.codiceUnivoco;
      
      if (Object.keys(updates).length === 0) {
        return res.status(400).send("No valid fields to update");
      }
      
      const updatedUser = await storage.updateUser(req.user.id, updates);
      
      setActivityEntity(res, { type: 'users', id: updatedUser.id });
      
      // Return safe profile data (no password)
      const { password: _, ...safeUser } = updatedUser;
      res.json(safeUser);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: "Dati non validi", errors: error.errors });
      }
      res.status(500).send(error.message);
    }
  });

  // ============ REMOTE REPAIR REQUESTS ============
  
  // Customer endpoints
  app.get("/api/customer/remote-requests", requireRole("customer"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      const requests = await storage.listRemoteRepairRequests({
        customerId: req.user.id
      });
      
      // Enrich with signed photo URLs and center data
      const enrichedRequests = await Promise.all(requests.map(async (r) => {
        // Generate signed URLs for photos
        let photoUrls: string[] = [];
        if (r.photos && r.photos.length > 0) {
          photoUrls = await Promise.all(
            r.photos.map(async (photoKey: string) => {
              try {
                return await getSignedDownloadUrl(photoKey);
              } catch {
                return photoKey;
              }
            })
          );
        }
        
        // Get assigned center info for display
        let centerName = null;
        let centerData: any = null;
        if (r.assignedCenterId) {
          // Get the repair center user to find their repairCenterId
          const centerUser = await storage.getUser(r.assignedCenterId);
          if (centerUser?.repairCenterId) {
            const repairCenter = await storage.getRepairCenter(centerUser.repairCenterId);
            centerName = repairCenter?.name || null;
            centerData = repairCenter;
          }
        }
        
        return {
          ...r,
          photos: photoUrls,
          centerName,
          centerAddress: centerData?.address || null,
          centerCity: centerData?.city || null,
          centerCap: centerData?.cap || null,
          centerProvince: centerData?.provincia || null,
          centerPhone: centerData?.phone || null
        };
      }));
      
      res.json(enrichedRequests);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  app.post("/api/customer/remote-requests", requireRole("customer"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      const { insertRemoteRepairRequestSchema } = await import("@shared/schema");
      const validatedData = insertRemoteRepairRequestSchema.parse({
        ...req.body,
        customerId: req.user.id,
      });
      
      const request = await storage.createRemoteRepairRequest(validatedData);
      
      setActivityEntity(res, { type: 'remote_repair_requests', id: request.id });
      res.status(201).json(request);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: "Dati non validi", errors: error.errors });
      }
      res.status(500).send(error.message);
    }
  });

  app.get("/api/customer/remote-requests/:id", requireRole("customer"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      const request = await storage.getRemoteRepairRequest(req.params.id);
      if (!request) return res.status(404).send("Richiesta non trovata");
      
      // Verify ownership
      if (request.customerId !== req.user.id) {
        return res.status(403).send("Accesso non autorizzato");
      }
      
      res.json(request);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  app.patch("/api/customer/remote-requests/:id/shipping", requireRole("customer"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      const request = await storage.getRemoteRepairRequest(req.params.id);
      if (!request) return res.status(404).send("Richiesta non trovata");
      
      // Verify ownership
      if (request.customerId !== req.user.id) {
        return res.status(403).send("Accesso non autorizzato");
      }
      
      // Only allow updating shipping info when status is awaiting_shipment
      if (request.status !== 'awaiting_shipment') {
        return res.status(400).send("Impossibile aggiornare la spedizione in questo stato");
      }
      
      const { courierName, trackingNumber } = req.body;
      
      const updated = await storage.updateRemoteRepairRequest(req.params.id, {
        courierName,
        trackingNumber,
        shippedAt: new Date(),
        status: 'in_transit'
      });
      
      setActivityEntity(res, { type: 'remote_repair_requests', id: updated.id });
      res.json(updated);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // Generate DDT for remote repair request
  app.get("/api/customer/remote-requests/:id/ddt", requireRole("customer"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      const request = await storage.getRemoteRepairRequest(req.params.id);
      if (!request) return res.status(404).send("Richiesta non trovata");
      
      // Verify ownership
      if (request.customerId !== req.user.id) {
        return res.status(403).send("Accesso non autorizzato");
      }
      
      // Only allow DDT download when status is awaiting_shipment or later
      if (request.status === 'pending' || request.status === 'assigned' || request.status === 'rejected' || request.status === 'cancelled') {
        return res.status(400).send("DDT non disponibile per questo stato");
      }
      
      // Get customer (sender) data
      const customer = await storage.getUser(request.customerId);
      
      // Get repair center (recipient) data - assignedCenterId stores user ID
      const centerUser = request.assignedCenterId ? await storage.getUser(request.assignedCenterId) : null;
      const repairCenter = centerUser?.repairCenterId ? await storage.getRepairCenter(centerUser.repairCenterId) : null;
      
      // Generate DDT
      const ddtData: TransferDdtData = {
        ddtNumber: `DDT-${request.requestNumber}`,
        requestNumber: request.requestNumber,
        shippedAt: new Date(),
        trackingNumber: request.trackingNumber || '-',
        trackingCarrier: request.courierName || '-',
        sender: {
          name: customer?.username || customer?.email || 'Cliente',
          phone: customer?.phone || undefined,
          email: customer?.email || undefined,
        },
        recipient: {
          name: repairCenter?.name || centerUser?.username || 'Centro Riparazione',
          address: request.customerAddress || repairCenter?.address || undefined,
          city: request.customerCity || repairCenter?.city || undefined,
          postalCode: request.customerCap || repairCenter?.cap || undefined,
          province: request.customerProvince || repairCenter?.provincia || undefined,
          phone: repairCenterData?.phone || undefined,
          email: repairCenterData?.email || undefined,
        },
        items: [{
          description: `${request.brand} ${request.model}`,
          quantity: 1,
          imei: request.imei || undefined,
          serial: request.serial || undefined,
          notes: request.issueDescription || undefined,
        }],
      };
      
      const pdfBuffer = await generateTransferDDT(ddtData);
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="DDT-${request.requestNumber}.pdf"`);
      res.send(pdfBuffer);
    } catch (error: any) {
      console.error('Error generating DDT:', error);
      res.status(500).send(error.message);
    }
  });

  // Customer Remote Requests - Upload photos
  app.post("/api/customer/remote-requests/upload-photos", requireRole("customer"), upload.array("photos", 5), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      const files = req.files as Express.Multer.File[];
      if (!files || files.length === 0) {
        return res.status(400).send("Nessun file caricato");
      }
      
      const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
      const photoUrls: string[] = [];
      
      for (const file of files) {
        if (!allowedMimeTypes.includes(file.mimetype)) {
          return res.status(400).send("Formato immagine non supportato. Usa JPEG, PNG, WebP o GIF.");
        }
        
        const maxSize = 10 * 1024 * 1024;
        if (file.size > maxSize) {
          return res.status(400).send("Immagine troppo grande. Massimo 10MB.");
        }
        
        const ext = file.originalname.split(".").pop() || "jpg";
        const objectPath = `remote-requests/${req.user.id}/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${ext}`;
        
        const privateObjectDir = objectStorage.getPrivateObjectDir();
        const fullPath = `${privateObjectDir}/${objectPath}`;
        const { bucketName, objectName } = parseObjectPath(fullPath);
        const bucket = objectStorageClient.bucket(bucketName);
        const gcsFile = bucket.file(objectName);
        
        await gcsFile.save(file.buffer, {
          metadata: {
            contentType: file.mimetype,
          },
        });
        
        // Return the relative path for storage
        photoUrls.push(`/objects/${objectPath}`);
      }
      
      res.json({ photos: photoUrls });
    } catch (error: any) {
      console.error("Error uploading photos:", error);
      res.status(500).send(error.message);
    }
  });

  // Repair Center endpoints
  app.get("/api/repair-center/remote-requests", requireRole("repair_center"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      // Get repair center for this user (needed for requestedCenterId lookup)
      const repairCenters = await storage.listRepairCentersForStaff(req.user.id);
      const repairCenter = repairCenters[0];
      
      // Get requests assigned to this user (assignedCenterId now stores user ID)
      const requests = await storage.listRemoteRepairRequests({
        assignedCenterId: req.user.id
      });
      
      // Also get requests where this center was requested but not yet assigned
      // (requestedCenterId still uses repair_centers.id for customer preference)
      let requestedRequests: any[] = [];
      if (repairCenter) {
        requestedRequests = await storage.listRemoteRepairRequests({
          requestedCenterId: repairCenter.id
        });
      }
      
      // Merge and deduplicate
      const allRequests = [...requests];
      for (const r of requestedRequests) {
        if (!allRequests.find(ar => ar.id === r.id)) {
          allRequests.push(r);
        }
      }
      
      // Enrich with customer data and signed photo URLs
      const enrichedRequests = await Promise.all(allRequests.map(async (r) => {
        // Get customer data
        const customer = r.customerId ? await storage.getUser(r.customerId) : null;
        
        // Generate signed URLs for photos
        let photoUrls: string[] = [];
        if (r.photos && r.photos.length > 0) {
          photoUrls = await Promise.all(
            r.photos.map(async (photoKey: string) => {
              try {
                return await getSignedDownloadUrl(photoKey);
              } catch {
                return photoKey;
              }
            })
          );
        }
        
        return {
          ...r,
          customerName: customer?.username || customer?.email || null,
          customerEmail: customer?.email || null,
          customerPhone: customer?.phone || null,
          photos: photoUrls
        };
      }));
      
      res.json(enrichedRequests);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  app.patch("/api/repair-center/remote-requests/:id/accept", requireRole("repair_center"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      const request = await storage.getRemoteRepairRequest(req.params.id);
      if (!request) return res.status(404).send("Richiesta non trovata");
      
      // Verify this center can accept (assignedCenterId contains user ID)
      if (request.assignedCenterId && request.assignedCenterId !== req.user.id) {
        return res.status(403).send("Richiesta assegnata ad un altro centro");
      }
      
      if (request.status !== 'pending' && request.status !== 'assigned') {
        return res.status(400).send("Impossibile accettare la richiesta in questo stato");
      }
      
      // Get repair center address to auto-fill shipping destination
      const repairCenter = await storage.getRepairCenter((req.user as any).repairCenterId);
      
      // Automatically transition to awaiting_shipment with center's address
      const updated = await storage.updateRemoteRepairRequest(req.params.id, {
        status: 'awaiting_shipment',
        assignedCenterId: req.user.id,
        customerAddress: repairCenter?.address || null,
        customerCity: repairCenter?.city || null,
        customerCap: repairCenter?.cap || null,
        customerProvince: repairCenter?.provincia || null
      });
      
      setActivityEntity(res, { type: 'remote_repair_requests', id: updated.id });
      res.json(updated);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  app.patch("/api/repair-center/remote-requests/:id/reject", requireRole("repair_center"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      const request = await storage.getRemoteRepairRequest(req.params.id);
      if (!request) return res.status(404).send("Richiesta non trovata");
      
      // Verify user can reject this request
      if (request.assignedCenterId && request.assignedCenterId !== req.user.id) {
        return res.status(403).send("Richiesta assegnata ad un altro centro");
      }
      
      if (request.status !== 'pending' && request.status !== 'assigned') {
        return res.status(400).send("Impossibile rifiutare la richiesta in questo stato");
      }
      
      const { rejectionReason } = req.body;
      
      const updated = await storage.updateRemoteRepairRequest(req.params.id, {
        status: 'rejected',
        rejectionReason
      });
      
      setActivityEntity(res, { type: 'remote_repair_requests', id: updated.id });
      res.json(updated);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  app.patch("/api/repair-center/remote-requests/:id/ready-for-shipping", requireRole("repair_center"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      const request = await storage.getRemoteRepairRequest(req.params.id);
      if (!request) return res.status(404).send("Richiesta non trovata");
      
      if (request.assignedCenterId !== req.user.id) {
        return res.status(403).send("Accesso non autorizzato");
      }
      
      if (request.status !== 'accepted') {
        return res.status(400).send("La richiesta deve essere accettata prima di richiedere la spedizione");
      }
      
      const { centerNotes, customerAddress, customerCity, customerCap, customerProvince } = req.body;
      
      const updated = await storage.updateRemoteRepairRequest(req.params.id, {
        status: 'awaiting_shipment',
        centerNotes,
        customerAddress,
        customerCity,
        customerCap,
        customerProvince
      });
      
      setActivityEntity(res, { type: 'remote_repair_requests', id: updated.id });
      res.json(updated);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  app.patch("/api/repair-center/remote-requests/:id/received", requireRole("repair_center"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      const request = await storage.getRemoteRepairRequest(req.params.id);
      if (!request) return res.status(404).send("Richiesta non trovata");
      
      if (request.assignedCenterId !== req.user.id) {
        return res.status(403).send("Accesso non autorizzato");
      }
      
      if (request.status !== 'in_transit') {
        return res.status(400).send("La richiesta non è in transito");
      }
      
      // Prima imposta lo stato received
      await storage.updateRemoteRepairRequest(req.params.id, {
        status: 'received',
        receivedAt: new Date()
      });
      
      // Poi crea automaticamente la lavorazione
      const { repairOrder, remoteRequest } = await storage.createRepairFromRemoteRequest(req.params.id);
      
      setActivityEntity(res, { type: 'remote_repair_requests', id: remoteRequest.id });
      res.json({ 
        remoteRequest, 
        repairOrder,
        message: `Lavorazione ${repairOrder.orderNumber} creata automaticamente`
      });
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // Force received - when customer doesn't ship, center can force confirm
  app.patch("/api/repair-center/remote-requests/:id/force-received", requireRole("repair_center"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      const request = await storage.getRemoteRepairRequest(req.params.id);
      if (!request) return res.status(404).send("Richiesta non trovata");
      
      if (request.assignedCenterId !== req.user.id) {
        return res.status(403).send("Accesso non autorizzato");
      }
      
      // Allow force receive only from awaiting_shipment status
      if (request.status !== 'awaiting_shipment') {
        return res.status(400).send("Questa azione è disponibile solo quando la richiesta è in attesa di spedizione");
      }
      
      const { centerNotes } = req.body;
      
      // First update status to received
      await storage.updateRemoteRepairRequest(req.params.id, {
        status: 'received',
        receivedAt: new Date(),
        centerNotes: centerNotes || request.centerNotes
      });
      
      // Then create the repair order automatically
      const { repairOrder, remoteRequest } = await storage.createRepairFromRemoteRequest(req.params.id);
      
      setActivityEntity(res, { type: 'remote_repair_requests', id: remoteRequest.id });
      res.json({ 
        remoteRequest, 
        repairOrder,
        message: `Ricezione forzata. Lavorazione ${repairOrder.orderNumber} creata automaticamente`
      });
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // Cancel request - when customer doesn't respond
  app.patch("/api/repair-center/remote-requests/:id/cancel", requireRole("repair_center"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      const request = await storage.getRemoteRepairRequest(req.params.id);
      if (!request) return res.status(404).send("Richiesta non trovata");
      
      if (request.assignedCenterId !== req.user.id) {
        return res.status(403).send("Accesso non autorizzato");
      }
      
      // Allow cancel only from awaiting_shipment status
      if (request.status !== 'awaiting_shipment') {
        return res.status(400).send("Questa azione è disponibile solo quando la richiesta è in attesa di spedizione");
      }
      
      const { cancellationReason } = req.body;
      
      const updated = await storage.updateRemoteRepairRequest(req.params.id, {
        status: 'cancelled',
        centerNotes: cancellationReason || 'Annullata dal centro per mancata spedizione del cliente'
      });
      
      setActivityEntity(res, { type: 'remote_repair_requests', id: updated.id });
      res.json(updated);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // Repair Center Remote Requests - pending count for badge
  app.get("/api/repair-center/remote-requests/pending-count", requireRole("repair_center"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      // Count requests assigned to this user that need attention (assigned or in_transit)
      const requests = await storage.listRemoteRepairRequests({
        assignedCenterId: req.user.id
      });
      
      // Count only requests in states that need action: assigned, in_transit
      const pendingCount = requests.filter(r => 
        r.status === 'assigned' || r.status === 'in_transit'
      ).length;
      
      res.json({ count: pendingCount });
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // Reseller endpoints
  app.get("/api/reseller/remote-requests", requireRole("reseller", "sub_reseller"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      let requests;
      if (req.user.role === 'sub_reseller') {
        requests = await storage.listRemoteRepairRequests({
          subResellerId: req.user.id
        });
      } else {
        requests = await storage.listRemoteRepairRequests({
          resellerId: req.user.id
        });
      }
      
      res.json(requests);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  app.patch("/api/reseller/remote-requests/:id/assign", requireRole("reseller", "sub_reseller"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      const request = await storage.getRemoteRepairRequest(req.params.id);
      if (!request) return res.status(404).send("Richiesta non trovata");
      
      // Verify this reseller can manage this request
      if (req.user.role === 'sub_reseller') {
        if (request.subResellerId !== req.user.id) {
          return res.status(403).send("Accesso non autorizzato");
        }
      } else {
        if (request.resellerId !== req.user.id) {
          return res.status(403).send("Accesso non autorizzato");
        }
      }
      
      if (request.status !== 'pending') {
        return res.status(400).send("La richiesta è già stata gestita");
      }
      
      const { assignedCenterId } = req.body;

      // The frontend sends repair_center table ID, but we need the user ID
      // Find the user with role 'repair_center' that has this repairCenterId
      const allUsers = await storage.listUsers();
      const centerUser = allUsers.find(u => u.role === 'repair_center' && u.repairCenterId === assignedCenterId);

      if (!centerUser) {
        return res.status(400).send("Centro di riparazione non trovato o senza utente associato");
      }

      const updated = await storage.updateRemoteRepairRequest(req.params.id, {
        status: 'assigned',
        assignedCenterId: centerUser.id // Use user ID, not repair_center table ID
      });
      
      setActivityEntity(res, { type: 'remote_repair_requests', id: updated.id });
      res.json(updated);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });


  // Get pending count for reseller notification badge
  app.get("/api/reseller/remote-requests/pending-count", requireRole("reseller", "reseller_staff"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      let resellerId = req.user.id;
      if (req.user.role === 'reseller_staff') {
        resellerId = (req.user as any).resellerId;
      } else if (req.user.role === 'reseller' && (req.user as any).parentResellerId) {
        // Sub-reseller: use parent's resellerId
        resellerId = (req.user as any).parentResellerId;
      }
      
      const count = await storage.getResellerRemoteRequestPendingCount(resellerId);
      res.json({ count });
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });
  // Admin endpoints
  app.get("/api/admin/remote-requests", requireRole("admin"), async (req, res) => {
    try {
      const requests = await storage.listRemoteRepairRequests();
      res.json(requests);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  app.get("/api/admin/remote-requests/:id", requireRole("admin"), async (req, res) => {
    try {
      const request = await storage.getRemoteRepairRequest(req.params.id);
      if (!request) return res.status(404).send("Richiesta non trovata");
      res.json(request);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // ============ NOTIFICATIONS ============

  // ============ SERVICE ORDERS (Acquisto Interventi) ============
  
  // Customer: get their reseller's payment info (IBAN, ragione sociale, etc.)
  app.get("/api/customer/my-reseller", requireRole("customer"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      const resellerId = req.user.resellerId;
      if (!resellerId) {
        return res.status(400).send("Nessun rivenditore associato");
      }
      
      const reseller = await storage.getUser(resellerId);
      if (!reseller) {
        return res.status(404).send("Rivenditore non trovato");
      }
      
      // Return only safe fields for customer to see
      res.json({
        id: reseller.id,
        fullName: reseller.fullName,
        ragioneSociale: reseller.ragioneSociale,
        iban: reseller.iban,
        email: reseller.email,
        phone: reseller.phone,
      });
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // Customer: get service catalog from their reseller
  app.get("/api/customer/service-catalog", requireRole("customer"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      const resellerId = req.user.resellerId;
      if (!resellerId) {
        return res.status(400).send("Nessun rivenditore associato");
      }
      
      
      const items = await storage.listServiceItems();
      const activeItems = items.filter(item => 
        item.isActive && (item.createdBy === null || item.createdBy === resellerId)
      );
      
      const itemsWithPrices = await Promise.all(activeItems.map(async (item) => {
        const effectivePrice = await storage.getEffectiveServicePrice(
          item.id, 
          resellerId, 
          undefined
        );
        return {
          isOwned: item.repairCenterId === repairCenterId,
          ...item,
          effectivePriceCents: effectivePrice.priceCents,
          effectiveLaborMinutes: effectivePrice.laborMinutes,
          priceSource: effectivePrice.source
        };
      }));
      
      res.json(itemsWithPrices);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });
  
  // Customer: list their service orders
  app.get("/api/customer/service-orders", requireRole("customer"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      const orders = await storage.listServiceOrders({ customerId: req.user.id });
      res.json(orders);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });
  
  // Customer: get single service order
  app.get("/api/customer/service-orders/:id", requireRole("customer"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      const order = await storage.getServiceOrder(req.params.id);
      if (!order) return res.status(404).send("Ordine non trovato");
      if (order.customerId !== req.user.id) return res.status(403).send("Accesso non autorizzato");
      
      res.json(order);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });
  
  // Customer: create service order
  app.post("/api/customer/service-orders", requireRole("customer"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      const resellerId = req.user.resellerId;
      if (!resellerId) {
        return res.status(400).send("Nessun rivenditore associato");
      }
      
      const { serviceItemId, deviceType, deviceModelId, brand, model, imei, serial, issueDescription, customerNotes, paymentMethod } = req.body;
      
      if (!serviceItemId) {
        return res.status(400).send("Servizio richiesto");
      }
      
      if (!paymentMethod || !['in_person', 'bank_transfer'].includes(paymentMethod)) {
        return res.status(400).send("Metodo di pagamento richiesto (in_person o bank_transfer)");
      }
      
      const serviceItem = await storage.getServiceItem(serviceItemId);
      if (!serviceItem) {
        return res.status(404).send("Servizio non trovato");
      }
      
      // Verify service item is accessible to this reseller (global or created by reseller)
      if (serviceItem.createdBy !== null && serviceItem.createdBy !== resellerId) {
        return res.status(403).send("Servizio non disponibile");
      }
      
      const effectivePrice = await storage.getEffectiveServicePrice(serviceItemId, resellerId, undefined);
      
      const order = await storage.createServiceOrder({
        customerId: req.user.id,
        resellerId,
        serviceItemId,
        priceCents: effectivePrice.priceCents,
        deviceType,
        deviceModelId,
        brand,
        model,
        imei,
        serial,
        issueDescription,
        customerNotes,
        paymentMethod
      });
      
      setActivityEntity(res, { type: 'service_orders', id: order.id });
      res.status(201).json(order);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });
  
  // Customer: cancel service order (only if pending)
  app.patch("/api/customer/service-orders/:id/cancel", requireRole("customer"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      const order = await storage.getServiceOrder(req.params.id);
      if (!order) return res.status(404).send("Ordine non trovato");
      if (order.customerId !== req.user.id) return res.status(403).send("Accesso non autorizzato");
      
      if (order.status !== 'pending') {
        return res.status(400).send("L'ordine non può essere annullato in questo stato");
      }
      
      const updated = await storage.updateServiceOrder(req.params.id, {
        status: 'cancelled',
        cancelledAt: new Date()
      });
      
      setActivityEntity(res, { type: 'service_orders', id: updated.id });
      res.json(updated);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // Customer: set delivery method for accepted order
  app.patch("/api/customer/service-orders/:id/set-delivery", requireRole("customer"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      const order = await storage.getServiceOrder(req.params.id);
      if (!order) return res.status(404).send("Ordine non trovato");
      if (order.customerId !== req.user.id) return res.status(403).send("Accesso non autorizzato");
      
      if (!['accepted', 'scheduled'].includes(order.status)) {
        return res.status(400).send("Il metodo di consegna può essere impostato solo per ordini accettati");
      }
      
      const { deliveryMethod, shippingAddress, shippingCity, shippingCap, shippingProvince, courierName, trackingNumber } = req.body;
      
      if (!deliveryMethod || !['in_person', 'shipping'].includes(deliveryMethod)) {
        return res.status(400).send("Metodo di consegna non valido");
      }
      
      let updateData: any = { deliveryMethod };
      
      if (deliveryMethod === 'shipping') {
        if (!shippingAddress || !shippingCity || !shippingCap || !shippingProvince) {
          return res.status(400).send("Dati indirizzo spedizione obbligatori");
        }
        
        updateData = {
          ...updateData,
          shippingAddress,

          shippingCity,
          shippingCap,
          shippingProvince,
          courierName: courierName || null,
          trackingNumber: trackingNumber || null,
          shippedAt: new Date()
        };
        
        // Generate DDT for shipping
        const customer = await storage.getUser(req.user.id);
        const reseller = await storage.getUser(order.resellerId);
        
        if (customer && reseller) {
          const ddtData: TransferDdtData = {
            documentNumber: `DDT-SVC-${order.orderNumber}`,
            date: new Date(),
            sender: {
              name: customer.fullName || customer.username,
              address: shippingAddress,
              city: shippingCity,
              cap: shippingCap,
              province: shippingProvince
            },
            recipient: {
              name: reseller.fullName || reseller.username,
              address: reseller.address || '',
              city: reseller.city || '',
              cap: reseller.cap || '',
              province: reseller.province || ''
            },
            items: [{
              description: `Dispositivo per intervento ${order.orderNumber}`,
              quantity: 1,
              unit: 'pz'
            }],
            transportReason: 'Consegna per riparazione',
            carrier: courierName || 'Cliente',
            notes: `Ordine servizio: ${order.orderNumber}`
          };
          
          const pdfBuffer = await generateTransferDDT(ddtData);
          const fileName = `ddt-service-${order.orderNumber}-${Date.now()}.pdf`;
          
          // Store DDT in object storage
          const { Storage } = await import("@google-cloud/storage");
          const gcs = new Storage();
          const bucketId = process.env.DEFAULT_OBJECT_STORAGE_BUCKET_ID;
          if (bucketId) {
            const bucket = gcs.bucket(bucketId);
            const file = bucket.file(`.private/service-ddt/${fileName}`);
            await file.save(pdfBuffer, { contentType: 'application/pdf' });
            const ddtUrl = `.private/service-ddt/${fileName}`;
            updateData.ddtUrl = ddtUrl;
          }
        }
      }
      
      const updated = await storage.updateServiceOrder(req.params.id, updateData);
      setActivityEntity(res, { type: 'service_orders', id: updated.id });
      res.json(updated);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // Customer: update shipping tracking info
  app.patch("/api/customer/service-orders/:id/update-tracking", requireRole("customer"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      const order = await storage.getServiceOrder(req.params.id);
      if (!order) return res.status(404).send("Ordine non trovato");
      if (order.customerId !== req.user.id) return res.status(403).send("Accesso non autorizzato");
      
      if (order.deliveryMethod !== 'shipping') {
        return res.status(400).send("Tracking disponibile solo per spedizioni");
      }
      
      const { courierName, trackingNumber } = req.body;
      
      const updated = await storage.updateServiceOrder(req.params.id, {
        courierName: courierName || order.courierName,
        trackingNumber: trackingNumber || order.trackingNumber
      });
      
      res.json(updated);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // Customer: download DDT for shipping
  app.get("/api/customer/service-orders/:id/ddt", requireRole("customer"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      const order = await storage.getServiceOrder(req.params.id);
      if (!order) return res.status(404).send("Ordine non trovato");
      if (order.customerId !== req.user.id) return res.status(403).send("Accesso non autorizzato");
      
      if (!order.ddtUrl) {
        return res.status(404).send("DDT non disponibile");
      }
      
      const signedUrl = await getSignedDownloadUrl(order.ddtUrl);
      res.json({ url: signedUrl });
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });
  
  // Reseller: list service orders from their customers
  app.get("/api/reseller/service-orders", requireRole("reseller", "reseller_staff"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      let resellerId = req.user.id;
      if (req.user.role === 'reseller_staff') {
        resellerId = (req.user as any).resellerId;
      }
      
      const orders = await storage.listServiceOrders({ resellerId });
      
      const ordersWithDetails = await Promise.all(orders.map(async (order) => {
        const customer = await storage.getUser(order.customerId);
        const serviceItem = await storage.getServiceItem(order.serviceItemId);
        return {
          ...order,
          customerName: customer?.fullName || customer?.username || 'N/A',
          serviceName: serviceItem?.name || 'N/A',
          serviceCode: serviceItem?.code || 'N/A'
        };
      }));
      
      res.json(ordersWithDetails);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });
  
  // Reseller: get single service order
  // Pending service orders count for badge
  app.get("/api/reseller/service-orders/pending-count", requireRole("reseller", "reseller_staff"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      let resellerId = req.user.id;
      if (req.user.role === 'reseller_staff') {
        resellerId = (req.user as any).resellerId;
      }
      
      const orders = await storage.listServiceOrders({ resellerId, status: 'pending' });
      res.json({ count: orders.length });
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // Pending customer tickets count for badge (reseller/reseller_staff)
  app.get("/api/reseller/tickets/pending-count", requireRole("reseller", "reseller_staff"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      let resellerId = req.user.id;
      if (req.user.role === 'reseller_staff') {
        resellerId = (req.user as any).resellerId;
      }
      
      // Get all open tickets from customers of this reseller
      const tickets = await storage.listTickets({ resellerId, status: 'open' });
      res.json({ count: tickets.length });
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  app.get("/api/reseller/service-orders/:id", requireRole("reseller", "reseller_staff"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      let resellerId = req.user.id;
      if (req.user.role === 'reseller_staff') {
        resellerId = (req.user as any).resellerId;
      }
      
      const order = await storage.getServiceOrder(req.params.id);
      if (!order) return res.status(404).send("Ordine non trovato");
      if (order.resellerId !== resellerId) return res.status(403).send("Accesso non autorizzato");
      
      const customer = await storage.getUser(order.customerId);
      const serviceItem = await storage.getServiceItem(order.serviceItemId);
      
      res.json({
        ...order,
        customerName: customer?.fullName || customer?.username || 'N/A',
        serviceName: serviceItem?.name || 'N/A',
        serviceCode: serviceItem?.code || 'N/A'
      });
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });
  
  // Reseller: accept service order
  app.patch("/api/reseller/service-orders/:id/accept", requireRole("reseller", "reseller_staff"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      let resellerId = req.user.id;
      if (req.user.role === 'reseller_staff') {
        resellerId = (req.user as any).resellerId;
      }
      
      const order = await storage.getServiceOrder(req.params.id);
      if (!order) return res.status(404).send("Ordine non trovato");
      if (order.resellerId !== resellerId) return res.status(403).send("Accesso non autorizzato");
      
      if (order.status !== 'pending') {
        return res.status(400).send("L'ordine non può essere accettato in questo stato");
      }
      
      const { scheduledAt, repairCenterId, internalNotes } = req.body;
      
      const updated = await storage.updateServiceOrder(req.params.id, {
        status: scheduledAt ? 'scheduled' : 'accepted',
        acceptedAt: new Date(),
        scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
        repairCenterId,
        internalNotes
      });
      
      setActivityEntity(res, { type: 'service_orders', id: updated.id });
      res.json(updated);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });
  
  // Reseller: mark as in progress
  app.patch("/api/reseller/service-orders/:id/start", requireRole("reseller", "reseller_staff"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      let resellerId = req.user.id;
      if (req.user.role === 'reseller_staff') {
        resellerId = (req.user as any).resellerId;
      }
      
      const order = await storage.getServiceOrder(req.params.id);
      if (!order) return res.status(404).send("Ordine non trovato");
      if (order.resellerId !== resellerId) return res.status(403).send("Accesso non autorizzato");
      
      if (order.status !== 'accepted' && order.status !== 'scheduled') {
        return res.status(400).send("L'ordine non può essere avviato in questo stato");
      }
      
      const updated = await storage.updateServiceOrder(req.params.id, {
        status: 'in_progress'
      });
      
      setActivityEntity(res, { type: 'service_orders', id: updated.id });
      res.json(updated);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });
  
  // Reseller: complete service order
  app.patch("/api/reseller/service-orders/:id/complete", requireRole("reseller", "reseller_staff"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      let resellerId = req.user.id;
      if (req.user.role === 'reseller_staff') {
        resellerId = (req.user as any).resellerId;
      }
      
      const order = await storage.getServiceOrder(req.params.id);
      if (!order) return res.status(404).send("Ordine non trovato");
      if (order.resellerId !== resellerId) return res.status(403).send("Accesso non autorizzato");
      
      if (order.status !== 'in_progress') {
        return res.status(400).send("L'ordine non può essere completato in questo stato");
      }
      
      const { internalNotes } = req.body;
      
      const updated = await storage.updateServiceOrder(req.params.id, {
        status: 'completed',
        completedAt: new Date(),
        internalNotes: internalNotes || order.internalNotes
      });
      
      setActivityEntity(res, { type: 'service_orders', id: updated.id });
      res.json(updated);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });
  
  // Reseller: reject/cancel service order
  app.patch("/api/reseller/service-orders/:id/cancel", requireRole("reseller", "reseller_staff"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      let resellerId = req.user.id;
      if (req.user.role === 'reseller_staff') {
        resellerId = (req.user as any).resellerId;
      }
      
      const order = await storage.getServiceOrder(req.params.id);
      if (!order) return res.status(404).send("Ordine non trovato");
      if (order.resellerId !== resellerId) return res.status(403).send("Accesso non autorizzato");
      
      if (order.status === 'completed' || order.status === 'cancelled') {
        return res.status(400).send("L'ordine non può essere annullato in questo stato");
      }
      
      const { internalNotes } = req.body;
      
      const updated = await storage.updateServiceOrder(req.params.id, {
        status: 'cancelled',
        cancelledAt: new Date(),
        internalNotes: internalNotes || order.internalNotes
      });
      
      setActivityEntity(res, { type: 'service_orders', id: updated.id });
      res.json(updated);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // Reseller: schedule appointment (only after customer chooses in_person delivery)
  app.patch("/api/reseller/service-orders/:id/schedule", requireRole("reseller", "reseller_staff"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      let resellerId = req.user.id;
      if (req.user.role === 'reseller_staff') {
        resellerId = (req.user as any).resellerId;
      }
      
      const order = await storage.getServiceOrder(req.params.id);
      if (!order) return res.status(404).send("Ordine non trovato");
      if (order.resellerId !== resellerId) return res.status(403).send("Accesso non autorizzato");
      
      if (order.status !== 'accepted') {
        return res.status(400).send("L'ordine deve essere in stato accettato per programmare");
      }
      
      if (order.deliveryMethod !== 'in_person') {
        return res.status(400).send("La programmazione appuntamento è solo per consegne di persona");
      }
      
      const { scheduledAt } = req.body;
      if (!scheduledAt) {
        return res.status(400).send("Data appuntamento richiesta");
      }
      
      const updated = await storage.updateServiceOrder(req.params.id, {
        status: 'scheduled',
        scheduledAt: new Date(scheduledAt)
      });
      
      setActivityEntity(res, { type: 'service_orders', id: updated.id });
      res.json(updated);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });
  // Reseller: confirm device receipt and create repair order with acceptance
  app.patch("/api/reseller/service-orders/:id/confirm-receipt", requireRole("reseller", "reseller_staff"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      let resellerId = req.user.id;
      if (req.user.role === 'reseller_staff') {
        resellerId = (req.user as any).resellerId;
      }
      
      const order = await storage.getServiceOrder(req.params.id);
      if (!order) return res.status(404).send("Ordine non trovato");
      if (order.resellerId !== resellerId) return res.status(403).send("Accesso non autorizzato");
      
      if (!["accepted", "scheduled"].includes(order.status)) {
        return res.status(400).send("L'ordine non è in stato valido per confermare ricezione");
      }
      
      if (!order.deliveryMethod) {
        return res.status(400).send("Il cliente non ha ancora scelto il metodo di consegna");
      }
      
      // Check if repair order already exists (idempotency)
      if (order.repairOrderId) {
        return res.status(400).send("Ordine di riparazione già creato");
      }
      
      // Get service item details for issueDescription
      const serviceItem = await storage.getServiceItem(order.serviceItemId);
      const issueDescription = serviceItem 
        ? `Servizio: ${serviceItem.name} - ${order.issueDescription || 'Nessuna descrizione'}`
        : order.issueDescription || 'Servizio richiesto da catalogo';
      
      // Prepare declaredDefects from service order
      const declaredDefects: string[] = [];
      if (serviceItem?.name) declaredDefects.push(serviceItem.name);
      if (order.issueDescription) declaredDefects.push(order.issueDescription);
      
      // Create repair order WITH acceptance record
      const { order: repairOrder, acceptance } = await storage.createRepairWithAcceptance(
        {
          customerId: order.customerId,
          resellerId: order.resellerId,
          repairCenterId: order.repairCenterId || undefined,
          deviceType: order.deviceType || 'smartphone',
          deviceModel: order.model || order.brand || 'Dispositivo',
          brand: order.brand || undefined,
          deviceModelId: order.deviceModelId || undefined,
          imei: order.imei || undefined,
          serial: order.serial || undefined,
          issueDescription: issueDescription,
          notes: order.customerNotes || undefined,
        },
        {
          declaredDefects: declaredDefects.length > 0 ? declaredDefects : ['Da Service Order'],
          aestheticCondition: 'Non verificato - accettazione automatica',
          acceptedBy: req.user.id,
        }
      );
      
      
      // Auto-associate customer with repair center from service order
      if (order.customerId && order.repairCenterId) {
        await storage.ensureCustomerRepairCenterAssociation(order.customerId, order.repairCenterId);
      }
      // Link repair order to service order and update status
      const updated = await storage.updateServiceOrder(req.params.id, {
        deviceReceivedAt: new Date(),
        status: 'in_progress',
        repairOrderId: repairOrder.id
      });
      
      setActivityEntity(res, { type: 'service_orders', id: updated.id });
      res.json({ serviceOrder: updated, repairOrder, acceptance });
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });



  // Reseller: download DDT for service order
  app.get("/api/reseller/service-orders/:id/ddt", requireRole("reseller", "reseller_staff"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      let resellerId = req.user.id;
      if (req.user.role === 'reseller_staff') {
        resellerId = (req.user as any).resellerId;
      }
      
      const order = await storage.getServiceOrder(req.params.id);
      if (!order) return res.status(404).send("Ordine non trovato");
      if (order.resellerId !== resellerId) return res.status(403).send("Accesso non autorizzato");
      
      if (!order.ddtUrl) {
        return res.status(404).send("DDT non disponibile");
      }
      
      const signedUrl = await getSignedDownloadUrl(order.ddtUrl);
      res.json({ url: signedUrl });
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });
  
  // Reseller: pending service orders count for badge
  app.get("/api/notifications", requireAuth, async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      const isRead = req.query.isRead === 'true' ? true : req.query.isRead === 'false' ? false : undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      
      const notifications = await storage.listNotifications(req.user.id, { isRead, limit });
      res.json(notifications);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  app.patch("/api/notifications/:id/read", requireAuth, async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      const notification = await storage.markNotificationAsRead(req.params.id, req.user.id);
      setActivityEntity(res, { type: 'notifications', id: notification.id });
      res.json(notification);
    } catch (error: any) {
      res.status(403).send(error.message);
    }
  });

  app.get("/api/notifications/preferences", requireAuth, async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      let preferences = await storage.getNotificationPreferences(req.user.id);
      
      if (!preferences) {
        preferences = await storage.createNotificationPreferences({
          userId: req.body.userId || req.user.id,
          emailEnabled: true,
          pushEnabled: true,
          types: ['repair_update', 'sla_warning', 'review_request', 'message', 'system']
        });
      }
      
      res.json(preferences);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  app.patch("/api/notifications/preferences", requireAuth, async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      const updateSchema = insertNotificationPreferencesSchema.pick({
        emailEnabled: true,
        pushEnabled: true,
        types: true,
      }).partial();
      
      const validatedData = updateSchema.parse(req.body);
      
      const preferences = await storage.updateNotificationPreferences(req.user.id, validatedData);
      setActivityEntity(res, { type: 'notification_preferences', id: preferences.id });
      res.json(preferences);
    } catch (error: any) {
      res.status(400).send(error.message);
    }
  });

  // ============ REPAIR ORDERS - ROLE-NEUTRAL DETAIL ============
  
  // Redirect endpoint for QR codes - returns the correct path based on user role
  app.get("/api/repair-orders/:id/redirect", requireAuth, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ error: "Unauthorized" });
      
      const repairOrder = await storage.getRepairOrder(req.params.id);
      if (!repairOrder) return res.status(404).json({ error: "Repair order not found" });
      
      // Check access and determine redirect path based on role
      const userId = req.user.id;
      const role = req.user.role;
      
      // Admin has access to all
      if (role === 'admin') {
        return res.json({ redirectPath: `/admin/repairs/${req.params.id}` });
      }
      
      // Reseller staff - check if belongs to the reseller
      if (role === 'reseller_staff') {
        const staffUser = await storage.getUser(userId);
        if (staffUser?.resellerId === repairOrder.resellerId) {
          return res.json({ redirectPath: `/reseller/repairs/${req.params.id}` });
        }
        // Also check if customer belongs to their reseller
        if (repairOrder.customerId) {
          const customer = await storage.getUser(repairOrder.customerId);
          if (customer?.resellerId === staffUser?.resellerId) {
            return res.json({ redirectPath: `/reseller/repairs/${req.params.id}` });
          }
        }
      }
      
      // Reseller - check ownership or customer relationship
      if (role === 'reseller') {
        if (repairOrder.resellerId === userId) {
          return res.json({ redirectPath: `/reseller/repairs/${req.params.id}` });
        }
        // Check if customer belongs to reseller
        if (repairOrder.customerId) {
          const customer = await storage.getUser(repairOrder.customerId);
          if (customer?.resellerId === userId) {
            return res.json({ redirectPath: `/reseller/repairs/${req.params.id}` });
          }
        }
      }
      
      // Repair center
      if (role === 'repair_center') {
        if (repairOrder.repairCenterId === req.user.repairCenterId) {
          return res.json({ redirectPath: `/repair-center/repairs/${req.params.id}` });
        }
      }
      
      // Customer
      if (role === 'customer') {
        if (repairOrder.customerId === userId) {
          return res.json({ redirectPath: `/customer/repairs/${req.params.id}` });
        }
      }
      
      // No access
      return res.status(403).json({ error: "Non hai accesso a questa riparazione" });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get repair order details (role-neutral endpoint with ACL check)
  app.get("/api/repair-orders/:id", requireAuth, async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      const repairOrder = await storage.getRepairOrder(req.params.id);
      if (!repairOrder) return res.status(404).send("Repair order not found");
      
      // Fetch customer data if customerId exists
      let customer = null;
      if (repairOrder.customerId) {
        const customerData = await storage.getUser(repairOrder.customerId);
        if (customerData) {
          // Return only safe customer fields
          customer = {
            id: customerData.id,
            fullName: customerData.fullName,
            email: customerData.email,
            phone: customerData.phone,
            address: customerData.address,
            fiscalCode: customerData.fiscalCode,
            vatNumber: customerData.vatNumber,
            city: customerData.city,
            province: customerData.province,
            postalCode: customerData.postalCode,
          };
        }
      }
      
      // For resellers, check if the order's customer belongs to them FIRST
      // This handles the case where order.resellerId is NULL but customer.resellerId matches
      if (req.user.role === 'reseller' && repairOrder.customerId) {
        const customerCheck = await storage.getUser(repairOrder.customerId);
        if (customerCheck && customerCheck.resellerId === req.user.id) {
          return res.json({ ...repairOrder, customer });
        }
      }
      
      // Check access based on role
      const hasAccess = 
        req.user.role === 'admin' ||
        (req.user.role === 'customer' && repairOrder.customerId === req.user.id) ||
        (req.user.role === 'reseller' && repairOrder.resellerId === req.user.id) ||
        (req.user.role === 'repair_center' && repairOrder.repairCenterId === req.user.repairCenterId);
      
      if (!hasAccess) return res.status(403).send("Forbidden");
      
      res.json({ ...repairOrder, customer });
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // ============ REPAIR ORDER ATTACHMENTS ============
  
  // Upload attachment to repair order
  app.post("/api/repair-orders/:id/attachments", requireAuth, upload.single('file'), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      if (!req.file) return res.status(400).send("No file uploaded");
      
      const repairOrderId = req.params.id;
      
      // Check if user has access to this repair order
      const repairOrder = await storage.getRepairOrder(repairOrderId);
      if (!repairOrder) return res.status(404).send("Repair order not found");
      
      // For resellers, check if the order's customer belongs to them
      let resellerHasAccess = false;
      if (req.user.role === 'reseller' && repairOrder.customerId) {
        const customer = await storage.getUser(repairOrder.customerId);
        if (customer && customer.resellerId === req.user.id) {
          resellerHasAccess = true;
        }
      }
      
      // Check access based on role
      const hasAccess = 
        resellerHasAccess ||
        req.user.role === 'admin' ||
        (req.user.role === 'customer' && repairOrder.customerId === req.user.id) ||
        (req.user.role === 'reseller' && repairOrder.resellerId === req.user.id) ||
        (req.user.role === 'repair_center' && repairOrder.repairCenterId === req.user.repairCenterId);
      
      if (!hasAccess) return res.status(403).send("Forbidden");
      
      // Generate unique object key
      const objectId = randomUUID();
      const privateDir = objectStorage.getPrivateObjectDir();
      const objectKey = `${privateDir}/repair-attachments/${repairOrderId}/${objectId}`;
      
      // Parse bucket and object name
      const { bucketName, objectName } = parseObjectPath(objectKey);
      
      // Upload to Google Cloud Storage
      const bucket = objectStorageClient.bucket(bucketName);
      const file = bucket.file(objectName);
      
      await file.save(req.file.buffer, {
        contentType: req.file.mimetype,
        metadata: {
          metadata: {
            originalName: req.file.originalname,
            uploadedBy: req.user.id,
            repairOrderId: repairOrderId,
          }
        }
      });
      
      // Set ACL policy based on repair order access
      const acl = await import('./objectAcl');
      const aclPolicy: any = {
        visibility: 'private',
        repairOrderAccessGroup: {
          repairOrderId: repairOrderId,
          permissions: ['read']
        }
      };
      
      await acl.setObjectAclPolicy(file, aclPolicy);
      
      // Save metadata to database
      const attachment = await storage.addRepairAttachment({
        repairOrderId,
        objectKey,
        fileName: req.file.originalname,
        fileType: req.file.mimetype,
        fileSize: req.file.size,
        uploadedBy: req.user.id,
      });
      
      setActivityEntity(res, { type: 'repair_attachments', id: attachment.id });
      res.json(attachment);
    } catch (error: any) {
      console.error('Upload error:', error);
      res.status(500).send(error.message);
    }
  });
  

  // Temporary attachment upload (before order creation)
  app.post("/api/attachments/temp", requireAuth, upload.single('file'), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      if (!req.file) return res.status(400).send("No file uploaded");
      
      const uploadSessionId = req.body.uploadSessionId;
      if (!uploadSessionId) return res.status(400).send("uploadSessionId is required");
      
      // Generate unique object key for temp storage
      const objectId = randomUUID();
      const privateDir = objectStorage.getPrivateObjectDir();
      const objectKey = `${privateDir}/temp-attachments/${uploadSessionId}/${objectId}`;
      
      // Parse bucket and object name
      const { bucketName, objectName } = parseObjectPath(objectKey);
      
      // Upload to Google Cloud Storage
      const bucket = objectStorageClient.bucket(bucketName);
      const file = bucket.file(objectName);
      
      await file.save(req.file.buffer, {
        contentType: req.file.mimetype,
        metadata: {
          metadata: {
            originalName: req.file.originalname,
            uploadedBy: req.user.id,
            uploadSessionId: uploadSessionId,
          }
        }
      });
      
      // Save metadata to database with uploadSessionId (no repairOrderId yet)
      const attachment = await storage.addRepairAttachment({
        uploadSessionId,
        objectKey,
        fileName: req.file.originalname,
        fileType: req.file.mimetype,
        fileSize: req.file.size,
        uploadedBy: req.user.id,
      });
      
