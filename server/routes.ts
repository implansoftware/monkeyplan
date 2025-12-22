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
  insertSupplierReturnItemSchema,
  insertSupplierCommunicationLogSchema,
  insertPartsLoadDocumentSchema,
  insertPartsLoadItemSchema,
  insertCustomerBranchSchema,
  insertServiceItemSchema,
  insertServiceItemPriceSchema,
  updateServiceItemSchema,
  updateServiceItemPriceSchema,
  insertRepairCenterAvailabilitySchema,
  insertRepairCenterBlackoutSchema,
  insertDeliveryAppointmentSchema,
  type Product
} from "@shared/schema";
import { ObjectStorageService, objectStorageClient, parseObjectPath } from "./objectStorage";
import { canAccessObject, ObjectPermission } from "./objectAcl";
import { generateAndStoreReturnDocuments, getSignedDownloadUrl } from "./services/shippingDocuments";
import { calculateRepairPriority } from "./helpers/priorityCalculation";
import { db } from "./db";
import { sql } from "drizzle-orm";

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
      const hasPermission = await storage.checkStaffPermission(req.user.id, module, action);
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
  app.get("/api/reseller/service-catalog", requireRole("reseller"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      const items = await storage.listServiceItems();
      const activeItems = items.filter(item => item.isActive);
      
      // Get all custom prices for this reseller
      const resellerPrices = await storage.listServiceItemPricesByReseller(req.user.id);
      
      // Get reseller's repair centers
      const repairCenters = await storage.listRepairCenters();
      const myRepairCenters = repairCenters.filter(rc => rc.resellerId === req.user!.id);
      
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
  app.post("/api/reseller/service-item-prices", requireRole("reseller"), async (req, res) => {
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
  app.delete("/api/reseller/service-item-prices/:id", requireRole("reseller"), async (req, res) => {
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
  app.get("/api/reseller/service-items", requireRole("reseller"), async (req, res) => {
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
  app.post("/api/reseller/service-items", requireRole("reseller"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      const { code, name, description, category, deviceTypeId, defaultPriceCents, defaultLaborMinutes } = req.body;
      
      if (!code || !name || !category || defaultPriceCents === undefined) {
        return res.status(400).send("Code, name, category, and defaultPriceCents are required");
      }
      
      const created = await storage.createServiceItem({
        code,
        name,
        description: description || null,
        category,
        deviceTypeId: deviceTypeId || null,
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
  app.patch("/api/reseller/service-items/:id", requireRole("reseller"), async (req, res) => {
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
      
      const { code, name, description, category, deviceTypeId, defaultPriceCents, defaultLaborMinutes, isActive } = req.body;
      
      const updated = await storage.updateServiceItem(req.params.id, {
        ...(code !== undefined && { code }),
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(category !== undefined && { category }),
        ...(deviceTypeId !== undefined && { deviceTypeId }),
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
  app.delete("/api/reseller/service-items/:id", requireRole("reseller"), async (req, res) => {
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
      } else if (req.user.role === 'reseller') {
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
      
      // Enrich with device compatibility info
      const enrichedAccessories = await Promise.all(accessories.map(async (accessory) => {
        const compatibilities = await storage.listProductCompatibilities(accessory.id);
        
        // Get brand/model names for each compatibility
        const enrichedCompatibilities = await Promise.all(compatibilities.map(async (c) => {
          const brand = await storage.getDeviceBrand(c.deviceBrandId);
          const model = c.deviceModelId ? await storage.getDeviceModel(c.deviceModelId) : null;
          return {
            ...c,
            brandName: brand?.name,
            modelName: model?.modelName || "Tutti i modelli"
          };
        }));
        
        return {
          ...accessory,
          deviceCompatibilities: enrichedCompatibilities
        };
      }));
      
      res.json(enrichedAccessories);
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
      
      // Aggregate customer and staff counts per reseller, omit password
      const resellersWithCounts = resellers.map(reseller => {
        const { password, ...safeReseller } = reseller;
        return {
          ...safeReseller,
          customerCount: customers.filter(c => c.resellerId === reseller.id).length,
          staffCount: staff.filter(s => s.resellerId === reseller.id).length,
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
        resellerId: resellerId,
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

  app.post("/api/admin/users", requireRole("admin"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      // Validate input
      const validatedData = insertUserSchema.parse(req.body);
      
      // Hash password before storing
      const hashedPassword = await hashPassword(validatedData.password);
      
      // Only set resellerCategory for reseller role
      const resellerCategory = validatedData.role === 'reseller' 
        ? (validatedData.resellerCategory || 'standard') 
        : null;
      
      const user = await storage.createUser({
        ...validatedData,
        password: hashedPassword,
        resellerCategory,
      });
      
      setActivityEntity(res, { type: 'users', id: user.id });
      res.status(201).json(user);
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
  // Filters by role: resellers see only their centers, admins see all
  app.get("/api/repair-centers", requireAuth, async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      let centers = await storage.listRepairCenters();
      
      // Filter based on role
      if (req.user.role === 'reseller') {
        // Resellers see only their own repair centers
        centers = centers.filter(c => c.resellerId === req.user!.id && c.isActive);
      } else if (req.user.role === 'repair_center') {
        // Repair center users see only active centers (they typically work at one)
        centers = centers.filter(c => c.isActive);
      } else {
        // Admin sees all active centers
        centers = centers.filter(c => c.isActive);
      }
      
      // Return only essential fields for selection
      res.json(centers.map(c => ({
        id: c.id,
        name: c.name,
        address: c.address,
        phone: c.phone,
        email: c.email
      })));
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
      const center = await storage.createRepairCenter(validatedData);
      setActivityEntity(res, { type: 'repair-centers', id: center.id });
      res.status(201).json(center);
    } catch (error: any) {
      res.status(400).send(error.message);
    }
  });

  app.patch("/api/admin/repair-centers/:id", requireRole("admin"), async (req, res) => {
    try {
      const { 
        name, address, city, phone, email, resellerId, isActive,
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

      // Get device compatibilities
      const compatibilities = await storage.listProductCompatibilities(product.id);
      
      // Enrich compatibilities with brand and model names
      const enrichedCompatibilities = await Promise.all(
        compatibilities.map(async (c) => {
          const brand = await storage.getDeviceBrand(c.deviceBrandId);
          const model = c.deviceModelId ? await storage.getDeviceModel(c.deviceModelId) : null;
          return {
            ...c,
            brandName: brand?.name || 'Sconosciuto',
            modelName: model?.name || 'Tutti i modelli',
          };
        })
      );

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

      res.json({
        product,
        specs,
        compatibilities: enrichedCompatibilities,
        prices: pricesWithReseller,
        assignments: assignmentsWithReseller,
        stock: stockByWarehouse,
      });
    } catch (error: any) {
      console.error("Error fetching product details:", error);
      res.status(500).send(error.message);
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
      res.json(repairs);
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
      
      // Log the state transition
      await storage.createRepairOrderStateHistory({
        repairOrderId: req.params.id,
        fromStatus: 'ingressato',
        toStatus: 'in_diagnosi',
        changedBy: req.user.id,
        notes: reason ? `Diagnosi saltata: ${reason}` : 'Diagnosi saltata',
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
        userId: req.user.id,
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
          data = repairs
            .filter(rep => {
              if (startDate && new Date(rep.createdAt) < new Date(startDate as string)) return false;
              if (endDate && new Date(rep.createdAt) > new Date(endDate as string)) return false;
              if (status && rep.status !== status) return false;
              return true;
            })
            .map(rep => ({
              'Order Number': rep.orderNumber,
              'Customer ID': rep.customerId,
              'Reseller ID': rep.resellerId,
              'Repair Center ID': rep.repairCenterId,
              'Device Type': rep.deviceType,
              'Issue Description': rep.issueDescription,
              'Status': rep.status,
              'Estimated Cost': rep.estimatedCost,
              'Final Cost': rep.finalCost,
              'Created At': new Date(rep.createdAt).toLocaleString(),
              'Updated At': new Date(rep.updatedAt).toLocaleString(),
            }));
          fileName = 'repairs_export.xlsx';
          sheetName = 'Repairs';
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

  // Helper to get effective reseller/repair center ID based on context switching
  function getEffectiveContext(req: Request): { resellerId: string; repairCenterId?: string; isActingAs: boolean } {
    const actingAs = (req.session as any).actingAs;
    if (actingAs && actingAs.type === 'reseller') {
      return { resellerId: actingAs.id, isActingAs: true };
    }
    if (actingAs && actingAs.type === 'repair_center') {
      return { resellerId: req.user!.id, repairCenterId: actingAs.id, isActingAs: true };
    }
    return { resellerId: req.user!.id, isActingAs: false };
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
          const totalRevenue = orders.reduce((sum, o) => sum + (o.totalAmountCents || 0), 0);
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

  app.get("/api/reseller/repairs", requireRole("reseller"), async (req, res) => {
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

  app.post("/api/reseller/repairs", requireRole("reseller"), async (req, res) => {
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
      
      await storage.invalidateCache('overview_%');
      await storage.invalidateCache('centers_%');
      
      res.status(201).json(repair);
    } catch (error: any) {
      res.status(400).send(error.message);
    }
  });

  // Export Repairs (Reseller) - Only their own repairs
  app.get("/api/reseller/export/repairs", requireRole("reseller", "reseller_staff"), async (req, res) => {
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
  app.post("/api/reseller/repairs/:id/skip-diagnosis", requireRole("reseller", "reseller_staff"), async (req, res) => {
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
      
      // Log the state transition
      await storage.createRepairOrderStateHistory({
        repairOrderId: req.params.id,
        fromStatus: 'ingressato',
        toStatus: 'in_diagnosi',
        changedBy: req.user.id,
        notes: reason ? `Diagnosi saltata: ${reason}` : 'Diagnosi saltata',
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

  app.get("/api/reseller/customers", requireRole("reseller"), async (req, res) => {
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

  app.post("/api/reseller/customers", requireRole("reseller"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
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
      });
      const validatedData = baseSchema.parse(req.body);

      // Validate repair centers belong to this reseller
      const repairCenterIds = validatedData.repairCenterIds || (validatedData.repairCenterId ? [validatedData.repairCenterId] : []);
      if (repairCenterIds.length > 0) {
        for (const centerId of repairCenterIds) {
          const center = await storage.getRepairCenter(centerId);
          if (!center || center.resellerId !== req.user.id) {
            return res.status(403).send("Centro di riparazione non autorizzato");
          }
        }
      }

      // Hash password before storing
      const hashedPassword = await hashPassword(validatedData.password);

      const user = await storage.createUser({
        username: validatedData.username,
        password: hashedPassword,
        email: validatedData.email,
        fullName: validatedData.fullName,
        phone: validatedData.phone,
        isActive: validatedData.isActive,
        role: "customer", // Force customer role
        resellerId: req.user.id, // Associate with the reseller
        repairCenterId: repairCenterIds[0] || null, // Keep first one for backward compatibility
      });
      
      // Set all repair center associations
      if (repairCenterIds.length > 0) {
        await storage.setCustomerRepairCenters(user.id, repairCenterIds);
      }
      
      setActivityEntity(res, { type: 'users', id: user.id });
      res.status(201).json(user);
    } catch (error: any) {
      res.status(400).send(error.message);
    }
  });

  // Update an existing customer
  app.patch("/api/reseller/customers/:id", requireRole("reseller"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      const customerId = req.params.id;
      
      // Verify customer exists and belongs to this reseller
      const existingCustomer = await storage.getUser(customerId);
      if (!existingCustomer || existingCustomer.role !== "customer" || existingCustomer.resellerId !== req.user.id) {
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
          if (!center || center.resellerId !== req.user.id) {
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
  app.delete("/api/reseller/customers/:id", requireRole("reseller"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      const customerId = req.params.id;
      
      // Verify customer exists and belongs to this reseller
      const existingCustomer = await storage.getUser(customerId);
      if (!existingCustomer || existingCustomer.role !== "customer" || existingCustomer.resellerId !== req.user.id) {
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
      
      // Get permissions and assigned repair centers for each staff member
      const staffWithPermissions = await Promise.all(
        staff.map(async (member) => {
          const permissions = await storage.getStaffPermissions(member.id);
          const assignedRepairCenters = await storage.listRepairCentersForStaff(member.id);
          return {
            ...member,
            password: undefined, // Never send password
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

  // Create a new staff member
  app.post("/api/reseller/team", requireRole("reseller"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Non autorizzato");
      
      const { user: userData, permissions, repairCenterIds } = req.body;
      
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

      // Get created permissions and assigned repair centers
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
      console.error("Error creating staff member:", error);
      res.status(400).send(error.message);
    }
  });

  // Update a staff member
  app.patch("/api/reseller/team/:id", requireRole("reseller"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Non autorizzato");
      
      const staffId = req.params.id;
      const { user: userData, permissions, repairCenterIds } = req.body;
      
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

      // Get updated staff member with permissions and repair centers
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
      console.error("Error updating staff member:", error);
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
      
      // Get reseller custom models
      const customModels = await storage.listResellerDeviceModels(resellerId, brandId, typeId, activeOnly);
      
      if (includeGlobal) {
        // Also get global models and merge
        const globalModels = await storage.listDeviceModels({ brandId, typeId, activeOnly });
        const mergedModels = [
          ...globalModels.map(m => ({ ...m, isGlobal: true, isCustom: false })),
          // Normalize custom models: use resellerBrandId as brandId if brandId is null
          ...customModels.map(m => ({ 
            ...m, 
            brandId: m.brandId || m.resellerBrandId, // Use resellerBrandId as fallback
            isGlobal: false, 
            isCustom: true 
          }))
        ];
        return res.json(mergedModels);
      }
      
      // Normalize custom models: use resellerBrandId as brandId if brandId is null
      res.json(customModels.map(m => ({ 
        ...m, 
        brandId: m.brandId || m.resellerBrandId,
        isGlobal: false, 
        isCustom: true 
      })));
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // Create a custom model for the reseller
  app.post("/api/reseller/device-models", requireRole("reseller", "reseller_staff"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Non autorizzato");
      
      const resellerId = req.user.role === 'reseller' ? req.user.id : req.user.resellerId;
      if (!resellerId) return res.status(400).send("Rivenditore non trovato");
      
      const { modelName, brandId, resellerBrandId, brandName, typeId, photoUrl } = req.body;
      if (!modelName) return res.status(400).send("Nome modello obbligatorio");
      
      const model = await storage.createResellerDeviceModel({
        resellerId,
        modelName,
        brandId: brandId || null,
        resellerBrandId: resellerBrandId || null,
        brandName: brandName || null,
        typeId: typeId || null,
        photoUrl: photoUrl || null,
        isActive: true
      });
      
      setActivityEntity(res, { type: 'reseller_device_model', id: model.id });
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
  app.get("/api/reseller/inventory", requireRole("reseller"), async (req, res) => {
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
      
      // Ottieni tutti i prodotti (globali admin + propri del reseller)
      const allProducts = await storage.listProducts();
      
      // Filtra: prodotti globali (createdBy null) + prodotti propri
      const visibleProducts = allProducts.filter(p => 
        p.createdBy === null || p.createdBy === context.resellerId
      );
      
      // Ottieni prezzi personalizzati per questo reseller
      const customPrices = await storage.listProductPrices({ resellerId: context.resellerId });
      const priceMap = new Map(customPrices.map(cp => [cp.productId, cp]));
      
      // Arricchisci prodotti con prezzi effettivi
      const enrichedProducts = visibleProducts.map(product => {
        const customPrice = priceMap.get(product.id);
        const isOwn = product.createdBy === context.resellerId;
        
        return {
          ...product,
          isOwn, // true = prodotto creato dal reseller
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
        // Get reseller's centers to verify ownership
        const resellerCenters = await storage.listRepairCenters({ resellerId: req.user.id });
        const resellerCenterIds = new Set(resellerCenters.map(c => c.id));
        
        for (const stock of initialStock) {
          if (stock.repairCenterId && stock.quantity > 0 && resellerCenterIds.has(stock.repairCenterId)) {
            await storage.createInventoryMovement({
              productId: product.id,
              repairCenterId: stock.repairCenterId,
              quantity: stock.quantity,
              movementType: "in",
              notes: "Quantità iniziale alla creazione del prodotto",
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
  app.patch("/api/reseller/products/:id", requireRole("reseller"), async (req, res) => {
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
  app.get("/api/reseller/catalog", requireRole("reseller"), async (req, res) => {
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
  app.patch("/api/reseller/catalog/:assignmentId/publish", requireRole("reseller"), async (req, res) => {
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
  app.patch("/api/reseller/catalog/:assignmentId/price", requireRole("reseller"), async (req, res) => {
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
  app.get("/api/reseller/shop-catalog", requireRole("reseller"), async (req, res) => {
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
  app.post("/api/reseller/catalog/:productId/publish", requireRole("reseller"), async (req, res) => {
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
  app.post("/api/reseller/catalog/:productId/unpublish", requireRole("reseller"), async (req, res) => {
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
  app.patch("/api/reseller/catalog/:productId/price", requireRole("reseller"), async (req, res) => {
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
  app.delete("/api/reseller/products/:id", requireRole("reseller"), async (req, res) => {
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
  app.post("/api/reseller/products/:id/image", requireRole("reseller"), upload.single("image"), async (req, res) => {
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
  app.delete("/api/reseller/products/:id/image", requireRole("reseller"), async (req, res) => {
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
  app.get("/api/reseller/products/with-stock", requireRole("reseller"), async (req, res) => {
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
  app.get("/api/reseller/products/:id/stock", requireRole("reseller"), async (req, res) => {
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
      
      const stockByCenter = await storage.getResellerProductStockByCenter(req.params.id, req.user.id);
      res.json(stockByCenter);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // Reseller Products - Update stock for a product in a specific repair center
  app.post("/api/reseller/products/:id/stock", requireRole("reseller"), async (req, res) => {
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
      
      const { repairCenterId, quantity, notes } = req.body;
      
      if (!repairCenterId) {
        return res.status(400).send("repairCenterId è richiesto");
      }
      
      if (typeof quantity !== 'number') {
        return res.status(400).send("quantity deve essere un numero");
      }
      
      // Verify repair center belongs to reseller
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
  app.post("/api/reseller/inventory/movements", requireRole("reseller"), async (req, res) => {
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
  app.get("/api/reseller/inventory/movements", requireRole("reseller"), async (req, res) => {
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
  app.get("/api/reseller/repair-centers", requireRole("reseller"), async (req, res) => {
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
      
      res.json(resellerCenters);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // Reseller Repair Centers - get single repair center by ID
  app.get("/api/reseller/repair-centers/:id", requireRole("reseller"), async (req, res) => {
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
  app.post("/api/reseller/repair-centers", requireRole("reseller"), async (req, res) => {
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
      
      setActivityEntity(res, { type: 'repair-centers', id: center.id });
      res.status(201).json(center);
    } catch (error: any) {
      res.status(400).send(error.message);
    }
  });

  // Reseller Repair Centers - update repair center
  app.patch("/api/reseller/repair-centers/:id", requireRole("reseller"), async (req, res) => {
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
      
      const center = await storage.updateRepairCenter(req.params.id, updates);
      setActivityEntity(res, { type: 'repair-centers', id: center.id });
      res.json(center);
    } catch (error: any) {
      res.status(400).send(error.message);
    }
  });

  // Reseller Repair Centers - delete repair center
  app.delete("/api/reseller/repair-centers/:id", requireRole("reseller"), async (req, res) => {
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

  // Reseller Suppliers - view global suppliers (admin) + own suppliers
  app.get("/api/reseller/suppliers", requireRole("reseller"), async (req, res) => {
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
  app.post("/api/reseller/suppliers", requireRole("reseller"), async (req, res) => {
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
  app.patch("/api/reseller/suppliers/:id", requireRole("reseller"), async (req, res) => {
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
  app.delete("/api/reseller/suppliers/:id", requireRole("reseller"), async (req, res) => {
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
  app.get("/api/reseller/supplier-orders", requireRole("reseller"), async (req, res) => {
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
  app.get("/api/reseller/supplier-orders/:id", requireRole("reseller"), async (req, res) => {
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
  app.get("/api/reseller/supplier-returns", requireRole("reseller"), async (req, res) => {
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
  app.get("/api/reseller/supplier-returns/:id", requireRole("reseller"), async (req, res) => {
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
  app.post("/api/reseller/appointments", requireRole("reseller"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      // Get repair centers associated with this reseller
      const allCenters = await storage.listRepairCenters();
      const resellerCenters = allCenters.filter(c => c.resellerId === req.user!.id);
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
  app.get("/api/reseller/appointments/available-slots", requireRole("reseller"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      const { repairCenterId, date } = req.query as { repairCenterId: string; date: string };
      
      if (!repairCenterId || !date) {
        return res.status(400).send("repairCenterId and date are required");
      }
      
      // Verify the repairCenterId belongs to this reseller
      const allCenters = await storage.listRepairCenters();
      const resellerCenterIds = allCenters
        .filter(c => c.resellerId === req.user!.id)
        .map(c => c.id);
      
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

  // ============ RESELLER PARTS LOAD (CARICO RICAMBI) ============

  // GET /api/reseller/parts-load - List parts load documents for reseller's repair centers
  app.get("/api/reseller/parts-load", requireRole("reseller"), async (req, res) => {
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
      const docs = await storage.listPartsLoadDocumentsByRepairCenters(resellerCenterIds);
      
      // Get suppliers for enrichment
      const suppliers = await storage.listSuppliers();
      const suppliersMap = new Map(suppliers.map(s => [s.id, { id: s.id, name: s.name, code: s.code }]));
      const centersMap = new Map(resellerCenters.map(c => [c.id, { id: c.id, name: c.name, city: c.city }]));
      
      // Enrich documents
      const enrichedDocs = docs.map(doc => ({
        ...doc,
        supplierName: suppliersMap.get(doc.supplierId)?.name || null,
        repairCenterName: centersMap.get(doc.repairCenterId)?.name || null,
      }));
      
      res.json(enrichedDocs);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // GET /api/reseller/parts-load/:id - Get parts load document details
  app.get("/api/reseller/parts-load/:id", requireRole("reseller"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      // Use effective context (may be viewing specific repair center)
      const context = getEffectiveContext(req);
      
      const doc = await storage.getPartsLoadDocument(req.params.id);
      if (!doc) {
        return res.status(404).send("Documento non trovato");
      }
      
      // Verify reseller has access to this document's repair center
      const allCenters = await storage.listRepairCenters();
      let resellerCenters = allCenters.filter(c => c.resellerId === context.resellerId);
      
      // If viewing specific repair center, only allow access to that center's data
      if (context.repairCenterId) {
        resellerCenters = resellerCenters.filter(c => c.id === context.repairCenterId);
      }
      
      const resellerCenterIds = resellerCenters.map(c => c.id);
      
      if (!resellerCenterIds.includes(doc.repairCenterId)) {
        return res.status(403).send("Accesso negato");
      }
      
      // Get items
      const items = await storage.listPartsLoadItems(doc.id);
      
      // Get supplier and center info
      const supplier = await storage.getSupplier(doc.supplierId);
      const center = allCenters.find(c => c.id === doc.repairCenterId);
      
      // Get products for items enrichment
      const products = await storage.listProducts();
      const productsMap = new Map(products.map(p => [p.id, p]));
      
      const enrichedItems = items.map(item => ({
        ...item,
        product: item.productId ? productsMap.get(item.productId) : null,
      }));
      
      res.json({
        ...doc,
        items: enrichedItems,
        supplier: supplier ? { id: supplier.id, name: supplier.name, code: supplier.code } : null,
        repairCenter: center ? { id: center.id, name: center.name, city: center.city } : null,
      });
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // POST /api/reseller/parts-load - Create parts load document
  app.post("/api/reseller/parts-load", requireRole("reseller"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      // Get repair centers associated with this reseller
      const allCenters = await storage.listRepairCenters();
      const resellerCenterIds = allCenters
        .filter(c => c.resellerId === req.user!.id)
        .map(c => c.id);
      
      if (resellerCenterIds.length === 0) {
        return res.status(400).send("Nessun centro di riparazione associato");
      }
      
      // Verify the repairCenterId belongs to this reseller
      const repairCenterId = req.body.repairCenterId;
      if (!repairCenterId || !resellerCenterIds.includes(repairCenterId)) {
        return res.status(403).send("Centro di riparazione non autorizzato");
      }
      
      // Convert documentDate string to Date object
      const bodyWithDate = {
        ...req.body,
        documentDate: req.body.documentDate ? new Date(req.body.documentDate) : undefined,
        createdBy: req.user.id,
      };
      
      const validated = insertPartsLoadDocumentSchema.parse(bodyWithDate);
      
      const doc = await storage.createPartsLoadDocument(validated);
      res.status(201).json(doc);
    } catch (error: any) {
      res.status(400).send(error.message);
    }
  });

  // PATCH /api/reseller/parts-load/:id - Update parts load document
  app.patch("/api/reseller/parts-load/:id", requireRole("reseller"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      const doc = await storage.getPartsLoadDocument(req.params.id);
      if (!doc) {
        return res.status(404).send("Documento non trovato");
      }
      
      // Verify reseller has access to this document's repair center
      const allCenters = await storage.listRepairCenters();
      const resellerCenterIds = allCenters
        .filter(c => c.resellerId === req.user!.id)
        .map(c => c.id);
      
      if (!resellerCenterIds.includes(doc.repairCenterId)) {
        return res.status(403).send("Accesso negato");
      }
      
      // Only allow updates on draft documents
      if (doc.status !== 'draft') {
        return res.status(400).send("Solo i documenti in bozza possono essere modificati");
      }
      
      const updated = await storage.updatePartsLoadDocument(req.params.id, req.body);
      res.json(updated);
    } catch (error: any) {
      res.status(400).send(error.message);
    }
  });

  // POST /api/reseller/parts-load/:id/items - Add item to parts load document
  app.post("/api/reseller/parts-load/:id/items", requireRole("reseller"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      const doc = await storage.getPartsLoadDocument(req.params.id);
      if (!doc) {
        return res.status(404).send("Documento non trovato");
      }
      
      // Verify reseller has access
      const allCenters = await storage.listRepairCenters();
      const resellerCenterIds = allCenters
        .filter(c => c.resellerId === req.user!.id)
        .map(c => c.id);
      
      if (!resellerCenterIds.includes(doc.repairCenterId)) {
        return res.status(403).send("Accesso negato");
      }
      
      // Only allow adding items to draft documents
      if (doc.status !== 'draft') {
        return res.status(400).send("Solo i documenti in bozza possono essere modificati");
      }
      
      const validated = insertPartsLoadItemSchema.parse({
        ...req.body,
        partsLoadDocumentId: doc.id,
      });
      
      const item = await storage.createPartsLoadItem(validated);
      
      // Update document totals
      const items = await storage.listPartsLoadItems(doc.id);
      const totalAmount = items.reduce((sum, i) => sum + (i.totalPrice || 0), 0);
      await storage.updatePartsLoadDocument(doc.id, {
        totalItems: items.length,
        totalAmount,
      });
      
      res.status(201).json(item);
    } catch (error: any) {
      res.status(400).send(error.message);
    }
  });

  // PATCH /api/reseller/parts-load-items/:id - Update parts load item
  app.patch("/api/reseller/parts-load-items/:id", requireRole("reseller"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      const item = await storage.getPartsLoadItem(req.params.id);
      if (!item) {
        return res.status(404).send("Riga non trovata");
      }
      
      const doc = await storage.getPartsLoadDocument(item.partsLoadDocumentId);
      if (!doc) {
        return res.status(404).send("Documento non trovato");
      }
      
      // Verify reseller has access
      const allCenters = await storage.listRepairCenters();
      const resellerCenterIds = allCenters
        .filter(c => c.resellerId === req.user!.id)
        .map(c => c.id);
      
      if (!resellerCenterIds.includes(doc.repairCenterId)) {
        return res.status(403).send("Accesso negato");
      }
      
      if (doc.status !== 'draft') {
        return res.status(400).send("Solo i documenti in bozza possono essere modificati");
      }
      
      const updated = await storage.updatePartsLoadItem(req.params.id, req.body);
      
      // Update document totals
      const items = await storage.listPartsLoadItems(doc.id);
      const totalAmount = items.reduce((sum, i) => sum + (i.totalPrice || 0), 0);
      await storage.updatePartsLoadDocument(doc.id, {
        totalAmount,
      });
      
      res.json(updated);
    } catch (error: any) {
      res.status(400).send(error.message);
    }
  });

  // DELETE /api/reseller/parts-load-items/:id - Delete parts load item
  app.delete("/api/reseller/parts-load-items/:id", requireRole("reseller"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      const item = await storage.getPartsLoadItem(req.params.id);
      if (!item) {
        return res.status(404).send("Riga non trovata");
      }
      
      const doc = await storage.getPartsLoadDocument(item.partsLoadDocumentId);
      if (!doc) {
        return res.status(404).send("Documento non trovato");
      }
      
      // Verify reseller has access
      const allCenters = await storage.listRepairCenters();
      const resellerCenterIds = allCenters
        .filter(c => c.resellerId === req.user!.id)
        .map(c => c.id);
      
      if (!resellerCenterIds.includes(doc.repairCenterId)) {
        return res.status(403).send("Accesso negato");
      }
      
      if (doc.status !== 'draft') {
        return res.status(400).send("Solo i documenti in bozza possono essere modificati");
      }
      
      await storage.deletePartsLoadItem(req.params.id);
      
      // Update document totals
      const items = await storage.listPartsLoadItems(doc.id);
      const totalAmount = items.reduce((sum, i) => sum + (i.totalPrice || 0), 0);
      await storage.updatePartsLoadDocument(doc.id, {
        totalItems: items.length,
        totalAmount,
      });
      
      res.status(204).send();
    } catch (error: any) {
      res.status(400).send(error.message);
    }
  });

  // POST /api/reseller/parts-load/:id/process - Process document (auto-match items)
  app.post("/api/reseller/parts-load/:id/process", requireRole("reseller"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      const doc = await storage.getPartsLoadDocument(req.params.id);
      if (!doc) {
        return res.status(404).send("Documento non trovato");
      }
      
      // Verify reseller has access
      const allCenters = await storage.listRepairCenters();
      const resellerCenterIds = allCenters
        .filter(c => c.resellerId === req.user!.id)
        .map(c => c.id);
      
      if (!resellerCenterIds.includes(doc.repairCenterId)) {
        return res.status(403).send("Accesso negato");
      }
      
      if (doc.status !== 'draft') {
        return res.status(400).send("Solo i documenti in bozza possono essere elaborati");
      }
      
      // Update status to processing
      await storage.updatePartsLoadDocument(req.params.id, { status: 'processing' as any });
      
      // Process document - auto-match items
      const result = await storage.processPartsLoadDocument(req.params.id);
      
      res.json({
        message: "Elaborazione completata",
        ...result,
      });
    } catch (error: any) {
      res.status(400).send(error.message);
    }
  });

  // ============ REPAIR CENTER ROUTES ============

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
      
      // Log the state transition
      await storage.createRepairOrderStateHistory({
        repairOrderId: req.params.id,
        fromStatus: 'ingressato',
        toStatus: 'in_diagnosi',
        changedBy: req.user.id,
        notes: reason ? `Diagnosi saltata: ${reason}` : 'Diagnosi saltata',
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

  // ============ NOTIFICATIONS ============
  
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
          userId: req.user.id,
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
  
  // Get repair order details (role-neutral endpoint with ACL check)
  app.get("/api/repair-orders/:id", requireAuth, async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      const repairOrder = await storage.getRepairOrder(req.params.id);
      if (!repairOrder) return res.status(404).send("Repair order not found");
      
      // For resellers, check if the order's customer belongs to them FIRST
      // This handles the case where order.resellerId is NULL but customer.resellerId matches
      if (req.user.role === 'reseller' && repairOrder.customerId) {
        const customer = await storage.getUser(repairOrder.customerId);
        if (customer && customer.resellerId === req.user.id) {
          return res.json(repairOrder);
        }
      }
      
      // Check access based on role
      const hasAccess = 
        req.user.role === 'admin' ||
        (req.user.role === 'customer' && repairOrder.customerId === req.user.id) ||
        (req.user.role === 'reseller' && repairOrder.resellerId === req.user.id) ||
        (req.user.role === 'repair_center' && repairOrder.repairCenterId === req.user.repairCenterId);
      
      if (!hasAccess) return res.status(403).send("Forbidden");
      
      res.json(repairOrder);
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
  
  // List attachments for repair order
  app.get("/api/repair-orders/:id/attachments", requireAuth, async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
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
      
      const hasAccess = 
        resellerHasAccess ||
        req.user.role === 'admin' ||
        (req.user.role === 'customer' && repairOrder.customerId === req.user.id) ||
        (req.user.role === 'reseller' && repairOrder.resellerId === req.user.id) ||
        (req.user.role === 'repair_center' && repairOrder.repairCenterId === req.user.repairCenterId);
      
      if (!hasAccess) return res.status(403).send("Forbidden");
      
      const attachments = await storage.listRepairAttachments(repairOrderId);
      res.json(attachments);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });
  
  // Get attachment details
  app.get("/api/repair-orders/attachments/:id", requireAuth, async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      const attachment = await storage.getRepairAttachment(req.params.id);
      if (!attachment) return res.status(404).send("Attachment not found");
      
      // Check access via repair order
      const repairOrder = await storage.getRepairOrder(attachment.repairOrderId);
      if (!repairOrder) return res.status(404).send("Repair order not found");
      
      const hasAccess = 
        req.user.role === 'admin' ||
        (req.user.role === 'customer' && repairOrder.customerId === req.user.id) ||
        (req.user.role === 'reseller' && repairOrder.resellerId === req.user.id) ||
        (req.user.role === 'repair_center' && repairOrder.repairCenterId === req.user.repairCenterId);
      
      if (!hasAccess) return res.status(403).send("Forbidden");
      
      res.json(attachment);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });
  
  // Delete attachment
  app.delete("/api/repair-orders/attachments/:id", requireAuth, async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      const attachment = await storage.getRepairAttachment(req.params.id);
      if (!attachment) return res.status(404).send("Attachment not found");
      
      // Check access - only uploader, admin, or repair center staff can delete
      const repairOrder = await storage.getRepairOrder(attachment.repairOrderId);
      if (!repairOrder) return res.status(404).send("Repair order not found");
      
      const canDelete = 
        req.user.role === 'admin' ||
        attachment.uploadedBy === req.user.id ||
        (req.user.role === 'repair_center' && repairOrder.repairCenterId === req.user.repairCenterId);
      
      if (!canDelete) return res.status(403).send("Forbidden");
      
      // Delete from Google Cloud Storage
      const { bucketName, objectName } = parseObjectPath(attachment.objectKey);
      const bucket = objectStorageClient.bucket(bucketName);
      const file = bucket.file(objectName);
      
      await file.delete().catch(err => {
        console.error('Error deleting from GCS:', err);
        // Continue even if GCS delete fails (file might already be deleted)
      });
      
      // Delete from database
      await storage.deleteRepairAttachment(req.params.id);
      
      setActivityEntity(res, { type: 'repair_attachments', id: attachment.id });
      res.json({ message: 'Attachment deleted successfully' });
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // Download/preview attachment - serve file directly
  app.get("/api/repair-orders/attachments/:id/download", requireAuth, async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      const attachment = await storage.getRepairAttachment(req.params.id);
      if (!attachment) return res.status(404).send("Attachment not found");
      
      // Check access via repair order
      const repairOrder = await storage.getRepairOrder(attachment.repairOrderId);
      if (!repairOrder) return res.status(404).send("Repair order not found");
      
      const hasAccess = 
        req.user.role === 'admin' ||
        (req.user.role === 'customer' && repairOrder.customerId === req.user.id) ||
        (req.user.role === 'reseller' && repairOrder.resellerId === req.user.id) ||
        (req.user.role === 'repair_center' && repairOrder.repairCenterId === req.user.repairCenterId);
      
      if (!hasAccess) return res.status(403).send("Forbidden");
      
      // Get file from storage
      const { bucketName, objectName } = parseObjectPath(attachment.objectKey);
      const bucket = objectStorageClient.bucket(bucketName);
      const file = bucket.file(objectName);
      
      // Use inline disposition for preview, attachment for download
      const isPreview = req.query.preview === 'true';
      const disposition = isPreview
        ? 'inline'
        : `attachment; filename="${encodeURIComponent(attachment.fileName)}"`;
      
      // Set headers
      res.setHeader('Content-Type', attachment.fileType || 'application/octet-stream');
      res.setHeader('Content-Disposition', disposition);
      
      // Stream file directly to response
      const [fileContents] = await file.download();
      res.send(fileContents);
    } catch (error: any) {
      console.error('Download error:', error);
      res.status(500).send(error.message);
    }
  });

  // Generic file upload endpoint for delivery documents, etc.
  app.post("/api/attachments/upload", requireAuth, upload.single('file'), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      if (!req.file) return res.status(400).send("No file uploaded");
      
      const repairOrderId = req.body.repairOrderId;
      if (!repairOrderId) return res.status(400).send("repairOrderId is required");
      
      // Check if user has access to this repair order
      const repairOrder = await storage.getRepairOrder(repairOrderId);
      if (!repairOrder) return res.status(404).send("Repair order not found");
      
      // Check access based on role
      const hasAccess = 
        req.user.role === 'admin' ||
        (req.user.role === 'repair_center' && repairOrder.repairCenterId === req.user.repairCenterId);
      
      if (!hasAccess) return res.status(403).send("Forbidden");
      
      // Generate unique object key
      const objectId = randomUUID();
      const privateDir = objectStorage.getPrivateObjectDir();
      const objectKey = `${privateDir}/delivery-documents/${repairOrderId}/${objectId}`;
      
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
      
      // Save metadata to database as attachment
      const attachment = await storage.addRepairAttachment({
        repairOrderId,
        objectKey,
        fileName: req.file.originalname,
        fileType: req.file.mimetype,
        fileSize: req.file.size,
        uploadedBy: req.user.id,
      });
      
      // Return the attachment with a download URL
      res.json({ 
        id: attachment.id,
        url: `/api/repair-orders/attachments/${attachment.id}/download?preview=true`,
        fileName: attachment.fileName
      });
    } catch (error: any) {
      console.error('Upload error:', error);
      res.status(500).send(error.message);
    }
  });

  // ============ USERS ============
  
  // Get staff users (admin-only) - for ticket assignment
  app.get("/api/users/staff", requireRole("admin"), async (req, res) => {
    try {
      const staffUsers = await storage.listStaffUsers();
      res.json(staffUsers);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // ============ TICKETS ============
  
  // List tickets with role-based filtering
  app.get("/api/tickets", requireAuth, async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      const filters: { customerId?: string; assignedTo?: string; status?: string } = {};
      
      // Role-based filtering
      if (req.user.role === 'customer') {
        // Customers see only their own tickets
        filters.customerId = req.user.id;
      } else if (req.user.role === 'reseller' || req.user.role === 'repair_center') {
        // Resellers and repair center staff see assigned tickets
        filters.assignedTo = req.user.id;
      }
      // Admin sees all tickets (no filter)
      
      // Apply status filter if provided
      if (req.query.status && typeof req.query.status === 'string') {
        filters.status = req.query.status;
      }
      
      const tickets = await storage.listTickets(filters);
      res.json(tickets);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });
  
  // Get single ticket details
  app.get("/api/tickets/:id", requireAuth, async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      const ticket = await storage.getTicket(req.params.id);
      if (!ticket) return res.status(404).send("Ticket not found");
      
      // Check access based on role
      const hasAccess = 
        req.user.role === 'admin' ||
        ticket.customerId === req.user.id ||
        ticket.assignedTo === req.user.id;
      
      if (!hasAccess) return res.status(403).send("Forbidden");
      
      res.json(ticket);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });
  
  // Create new ticket (customers only)
  app.post("/api/tickets", requireAuth, async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      // Only customers can create tickets
      if (req.user.role !== 'customer') {
        return res.status(403).send("Only customers can create tickets");
      }
      
      const ticketSchema = insertTicketSchema.pick({
        subject: true,
        description: true,
        priority: true,
      });
      
      const validatedData = ticketSchema.parse(req.body);
      
      // Force customerId and status from server
      const ticket = await storage.createTicket({
        customerId: req.user.id,
        subject: validatedData.subject,
        description: validatedData.description,
        priority: validatedData.priority,
        status: 'open',
      });
      
      setActivityEntity(res, { type: 'ticket', id: ticket.id });
      res.json(ticket);
    } catch (error: any) {
      res.status(400).send(error.message);
    }
  });
  
  // Update ticket status (admin and assigned users)
  app.patch("/api/tickets/:id/status", requireAuth, async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      const ticket = await storage.getTicket(req.params.id);
      if (!ticket) return res.status(404).send("Ticket not found");
      
      // Only admin or assigned user can update status
      const canUpdate = 
        req.user.role === 'admin' ||
        ticket.assignedTo === req.user.id;
      
      if (!canUpdate) return res.status(403).send("Forbidden");
      
      const { status } = req.body;
      if (!status || !['open', 'in_progress', 'closed'].includes(status)) {
        return res.status(400).send("Invalid status");
      }
      
      const updatedTicket = await storage.updateTicketStatus(req.params.id, status);
      setActivityEntity(res, { type: 'ticket', id: updatedTicket.id });
      
      // Broadcast real-time update to customer and assigned user
      broadcastNotification(updatedTicket.customerId, { 
        type: 'ticket_status_changed', 
        ticketId: updatedTicket.id,
        status: updatedTicket.status 
      });
      
      if (updatedTicket.assignedTo) {
        broadcastNotification(updatedTicket.assignedTo, { 
          type: 'ticket_status_changed', 
          ticketId: updatedTicket.id,
          status: updatedTicket.status 
        });
      }
      
      res.json(updatedTicket);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });
  
  // Assign ticket (admin only)
  app.patch("/api/tickets/:id/assign", requireAuth, async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      if (req.user.role !== 'admin') {
        return res.status(403).send("Only admins can assign tickets");
      }
      
      const ticket = await storage.getTicket(req.params.id);
      if (!ticket) return res.status(404).send("Ticket not found");
      
      const { assignedTo } = req.body;
      
      // Validate assignedTo user exists if provided
      if (assignedTo) {
        const assignedUser = await storage.getUser(assignedTo);
        if (!assignedUser) return res.status(400).send("Invalid user ID");
        
        // Can only assign to reseller or repair_center staff
        if (!['reseller', 'repair_center', 'admin'].includes(assignedUser.role)) {
          return res.status(400).send("Can only assign to reseller, repair center, or admin");
        }
      }
      
      const updatedTicket = await storage.assignTicket(req.params.id, assignedTo || null);
      setActivityEntity(res, { type: 'ticket', id: updatedTicket.id });
      
      // Broadcast real-time update to customer, old assignee, and new assignee
      broadcastNotification(updatedTicket.customerId, { 
        type: 'ticket_assigned', 
        ticketId: updatedTicket.id,
        assignedTo: updatedTicket.assignedTo 
      });
      
      if (ticket.assignedTo && ticket.assignedTo !== updatedTicket.assignedTo) {
        broadcastNotification(ticket.assignedTo, { 
          type: 'ticket_assigned', 
          ticketId: updatedTicket.id,
          assignedTo: updatedTicket.assignedTo 
        });
      }
      
      if (updatedTicket.assignedTo) {
        broadcastNotification(updatedTicket.assignedTo, { 
          type: 'ticket_assigned', 
          ticketId: updatedTicket.id,
          assignedTo: updatedTicket.assignedTo 
        });
      }
      
      res.json(updatedTicket);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });
  
  // Update ticket priority (admin only)
  app.patch("/api/tickets/:id/priority", requireAuth, async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      if (req.user.role !== 'admin') {
        return res.status(403).send("Only admins can update priority");
      }
      
      const ticket = await storage.getTicket(req.params.id);
      if (!ticket) return res.status(404).send("Ticket not found");
      
      const { priority } = req.body;
      if (!priority || !['low', 'medium', 'high'].includes(priority)) {
        return res.status(400).send("Invalid priority");
      }
      
      const updatedTicket = await storage.updateTicketPriority(req.params.id, priority);
      setActivityEntity(res, { type: 'ticket', id: updatedTicket.id });
      
      // Broadcast real-time update to customer and assigned user
      broadcastNotification(updatedTicket.customerId, { 
        type: 'ticket_priority_changed', 
        ticketId: updatedTicket.id,
        priority: updatedTicket.priority 
      });
      
      if (updatedTicket.assignedTo) {
        broadcastNotification(updatedTicket.assignedTo, { 
          type: 'ticket_priority_changed', 
          ticketId: updatedTicket.id,
          priority: updatedTicket.priority 
        });
      }
      
      res.json(updatedTicket);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });
  
  // List ticket messages
  app.get("/api/tickets/:id/messages", requireAuth, async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      const ticket = await storage.getTicket(req.params.id);
      if (!ticket) return res.status(404).send("Ticket not found");
      
      // Check access
      const hasAccess = 
        req.user.role === 'admin' ||
        ticket.customerId === req.user.id ||
        ticket.assignedTo === req.user.id;
      
      if (!hasAccess) return res.status(403).send("Forbidden");
      
      const messages = await storage.listTicketMessages(req.params.id);
      
      // Filter internal messages for customers
      const filteredMessages = req.user.role === 'customer' 
        ? messages.filter(msg => !msg.isInternal)
        : messages;
      
      res.json(filteredMessages);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });
  
  // Create ticket message (reply)
  app.post("/api/tickets/:id/messages", requireAuth, async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      const ticket = await storage.getTicket(req.params.id);
      if (!ticket) return res.status(404).send("Ticket not found");
      
      // Check access
      const hasAccess = 
        req.user.role === 'admin' ||
        ticket.customerId === req.user.id ||
        ticket.assignedTo === req.user.id;
      
      if (!hasAccess) return res.status(403).send("Forbidden");
      
      // Prevent replies on closed tickets
      if (ticket.status === 'closed') {
        return res.status(400).send("Cannot reply to closed ticket");
      }
      
      const { message, isInternal } = req.body;
      if (!message || typeof message !== 'string' || message.trim().length === 0) {
        return res.status(400).send("Message is required");
      }
      
      // Force isInternal=false for customers, only staff can set internal
      let messageIsInternal = false;
      if (req.user.role === 'admin' || ticket.assignedTo === req.user.id) {
        messageIsInternal = isInternal === true;
      }
      
      const ticketMessage = await storage.createTicketMessage({
        ticketId: req.params.id,
        userId: req.user.id,
        message: message.trim(),
        isInternal: messageIsInternal,
      });
      
      // Broadcast real-time update to other participants (not sender)
      // Notify customer (unless they're the sender)
      if (ticket.customerId !== req.user.id) {
        broadcastNotification(ticket.customerId, { 
          type: 'ticket_new_message', 
          ticketId: ticket.id,
          messageId: ticketMessage.id 
        });
      }
      
      // Notify assigned user (unless they're the sender)
      if (ticket.assignedTo && ticket.assignedTo !== req.user.id) {
        broadcastNotification(ticket.assignedTo, { 
          type: 'ticket_new_message', 
          ticketId: ticket.id,
          messageId: ticketMessage.id 
        });
      }
      
      setActivityEntity(res, { type: 'ticket_message', id: ticketMessage.id });
      res.json(ticketMessage);
    } catch (error: any) {
      res.status(400).send(error.message);
    }
  });

  // ============ REPAIR ORDERS ============
  
  // List repair orders with role-based filtering
  app.get("/api/repair-orders", requireAuth, async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      const filters: { customerId?: string; customerIds?: string[]; resellerId?: string; repairCenterId?: string; status?: string } = {};
      
      // Role-based filtering
      if (req.user.role === 'customer') {
        // Customers see only their own orders
        filters.customerId = req.user.id;
      } else if (req.user.role === 'reseller') {
        // Use context switching to determine effective reseller/repair center
        const context = getEffectiveContext(req);
        
        if (context.repairCenterId) {
          // Acting as a specific repair center - filter by that center only
          filters.repairCenterId = context.repairCenterId;
        } else {
          // Acting as reseller (own or sub-reseller) - filter by resellerId
          // This will return orders where resellerId matches OR orders of customers belonging to this reseller
          filters.resellerId = context.resellerId;
        }
      } else if (req.user.role === 'repair_center') {
        // Repair centers see only orders explicitly assigned to their center
        if (!req.user.repairCenterId) {
          // Repair center without configured ID sees nothing
          return res.json([]);
        }
        filters.repairCenterId = req.user.repairCenterId;
      }
      // Admin sees all orders (no filter)
      
      // Apply status filter if provided
      if (req.query.status && typeof req.query.status === 'string') {
        filters.status = req.query.status;
      }
      
      const orders = await storage.listRepairOrders(filters);
      
      // Compute SLA for each order
      const { loadSLAConfig, computeSLASeverity } = await import("./sla-utils");
      const slaConfig = await loadSLAConfig();
      const slaSeverityFilter = req.query.slaSeverity as string | undefined;
      
      // Build maps for customer and repair center names
      const customerIds = [...new Set(orders.map(o => o.customerId).filter(Boolean))];
      const repairCenterIds = [...new Set(orders.map(o => o.repairCenterId).filter(Boolean))];
      
      const customersMap = new Map<string, { fullName: string | null; ragioneSociale: string | null }>();
      const repairCentersMap = new Map<string, string>();
      
      // Fetch customers
      for (const customerId of customerIds) {
        const customer = await storage.getUser(customerId);
        if (customer) {
          customersMap.set(customerId, {
            fullName: customer.fullName,
            ragioneSociale: customer.ragioneSociale || null,
          });
        }
      }
      
      // Fetch repair centers
      for (const rcId of repairCenterIds) {
        const rc = await storage.getRepairCenter(rcId);
        if (rc) {
          repairCentersMap.set(rcId, rc.name);
        }
      }
      
      // Fetch quotes for all orders to get totalAmount
      const quotesMap = new Map<string, number>();
      for (const order of orders) {
        const quote = await storage.getRepairQuote(order.id);
        if (quote && quote.totalAmount) {
          quotesMap.set(order.id, quote.totalAmount);
        }
      }
      
      const ordersWithSLA = await Promise.all(orders.map(async (order) => {
        const currentState = await storage.getCurrentRepairOrderState(order.id);
        const stateEnteredAt = currentState?.enteredAt || order.createdAt;
        const { severity, minutesInState, phase } = computeSLASeverity(order.status, stateEnteredAt, slaConfig);
        
        const customer = order.customerId ? customersMap.get(order.customerId) : null;
        const customerName = customer?.ragioneSociale || customer?.fullName || null;
        const repairCenterName = order.repairCenterId ? repairCentersMap.get(order.repairCenterId) || null : null;
        
        // Get quote totalAmount if available
        const quoteTotalAmount = quotesMap.get(order.id) || null;
        
        return {
          ...order,
          customerName,
          repairCenterName,
          quoteTotalAmount,
          slaSeverity: severity,
          slaMinutesInState: minutesInState,
          slaPhase: phase,
          slaEnteredAt: stateEnteredAt.toISOString(),
        };
      }));
      
      // Apply SLA severity filter if provided
      let filteredOrders = ordersWithSLA;
      if (slaSeverityFilter && slaSeverityFilter !== 'all') {
        filteredOrders = ordersWithSLA.filter(order => order.slaSeverity === slaSeverityFilter);
      }
      
      res.json(filteredOrders);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });
  
  // Create new repair order (customers, resellers, admins, repair centers)
  app.post("/api/repair-orders", requireAuth, async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      // Check if this is an acceptance wizard submission (has acceptance data)
      const hasAcceptance = req.body.acceptance && Object.keys(req.body.acceptance).length > 0;
      
      // Define schemas based on whether it's acceptance wizard or simple order
      const basicOrderSchema = insertRepairOrderSchema.pick({
        deviceType: true,
        deviceModel: true,
        issueDescription: true,
        notes: true,
      });
      
      const acceptanceOrderSchema = insertRepairOrderSchema.pick({
        deviceType: true,
        deviceModel: true,
        issueDescription: true,
        notes: true,
        imei: true,
        serial: true,
        imeiNotReadable: true,
        imeiNotPresent: true,
        serialOnly: true,
        brand: true,
        deviceModelId: true, // FK to device catalog
      });
      
      const orderSchema = hasAcceptance ? acceptanceOrderSchema : basicOrderSchema;
      const validatedData = orderSchema.parse(req.body);
      
      // Check IMEI/Serial duplicate if provided (only for acceptance wizard)
      if (hasAcceptance && ('imei' in validatedData || 'serial' in validatedData)) {
        const imeiValue = 'imei' in validatedData ? (validatedData as any).imei : undefined;
        const serialValue = 'serial' in validatedData ? (validatedData as any).serial : undefined;
        const duplicate = await storage.checkImeiSerialDuplicate(
          imeiValue || undefined,
          serialValue || undefined
        );
        if (duplicate) {
          return res.status(409).send({
            error: "IMEI or Serial number already exists in an open repair order",
            existingOrder: {
              id: duplicate.id,
              orderNumber: duplicate.orderNumber,
              status: duplicate.status,
              imei: duplicate.imei,
              serial: duplicate.serial,
            }
          });
        }
      }
      
      // Determine customerId based on role and validate
      let customerId: string;
      
      if (req.user.role === 'customer') {
        // Customer is creating order for themselves
        customerId = req.user.id;
      } else if (req.user.role === 'reseller') {
        // Reseller must provide customerId
        if (!req.body.customerId) {
          return res.status(400).send("Customer ID is required for reseller orders");
        }
        customerId = req.body.customerId;
        
        // Validate customer exists
        const customer = await storage.getUser(customerId);
        if (!customer || customer.role !== 'customer') {
          return res.status(400).send("Invalid customer ID");
        }
      } else if (req.user.role === 'admin' || req.user.role === 'repair_center') {
        // Admin/repair_center must provide customerId for acceptance wizard
        if (!req.body.customerId) {
          return res.status(400).send("Customer ID is required");
        }
        customerId = req.body.customerId;
        
        // Validate customer exists
        const customer = await storage.getUser(customerId);
        if (!customer || customer.role !== 'customer') {
          return res.status(400).send("Invalid customer ID");
        }
      } else {
        return res.status(403).send("Unauthorized role");
      }
      
      // Validate branchId if provided - must belong to the selected customer
      if (req.body.branchId) {
        const branch = await storage.getCustomerBranch(req.body.branchId);
        if (!branch) {
          return res.status(400).send("Branch not found");
        }
        if (branch.parentCustomerId !== customerId) {
          return res.status(400).send("Branch does not belong to the selected customer");
        }
        if (!branch.isActive) {
          return res.status(400).send("Branch is not active");
        }
      }
      
      // Build order data
      const orderData: any = {
        ...validatedData,
        customerId,
        branchId: req.body.branchId || null,
        status: hasAcceptance ? 'ingressato' : 'pending',
      };
      
      // Set resellerId if user is reseller
      if (req.user.role === 'reseller') {
        orderData.resellerId = req.user.id;
      }
      
      // Set repairCenterId if provided in body, or from user's associated repair center
      if (req.body.repairCenterId) {
        orderData.repairCenterId = req.body.repairCenterId;
      } else if (req.user.role === 'repair_center' && req.user.repairCenterId) {
        orderData.repairCenterId = req.user.repairCenterId;
      }
      
      // Create order with or without acceptance data
      if (hasAcceptance) {
        // Validate and prepare acceptance data
        const acceptanceSchema = insertRepairAcceptanceSchema.pick({
          declaredDefects: true,
          aestheticCondition: true,
          aestheticNotes: true,
          aestheticPhotosMandatory: true,
          accessories: true,
          lockCode: true,
          lockPattern: true,
          hasLockCode: true,
          accessoriesRemoved: true,
        });
        
        const parsedAcceptance = acceptanceSchema.parse(req.body.acceptance);
        
        // Prepare acceptance data with required fields
        const acceptanceData: any = {
          ...parsedAcceptance,
          acceptedBy: req.user.id,
        };
        
        const { order, acceptance } = await storage.createRepairWithAcceptance(orderData, acceptanceData);
        
        setActivityEntity(res, { type: 'repair_order', id: order.id });
        res.json({ order, acceptance });
      } else {
        const order = await storage.createRepairOrder(orderData);
        
        setActivityEntity(res, { type: 'repair_order', id: order.id });
        res.json(order);
      }
    } catch (error: any) {
      res.status(400).send(error.message);
    }
  });
  
  // Update repair order (status, costs, notes, assignment)
  app.patch("/api/repair-orders/:id", requireAuth, async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      // Only admin, repair_center, and reseller can update orders
      if (req.user.role !== 'admin' && req.user.role !== 'repair_center' && req.user.role !== 'reseller') {
        return res.status(403).send("Only admins, repair centers, and resellers can update orders");
      }
      
      const order = await storage.getRepairOrder(req.params.id);
      if (!order) return res.status(404).send("Repair order not found");
      
      const updates: any = {};
      
      // Determine what can be updated based on role
      if (req.user.role === 'admin') {
        // Admin can update everything
        if (req.body.status) updates.status = req.body.status;
        if (req.body.estimatedCost !== undefined) updates.estimatedCost = req.body.estimatedCost;
        if (req.body.finalCost !== undefined) updates.finalCost = req.body.finalCost;
        if (req.body.notes !== undefined) updates.notes = req.body.notes;
        if (req.body.repairCenterId !== undefined) {
          // Validate repair center exists
          if (req.body.repairCenterId) {
            const repairCenter = await storage.getRepairCenter(req.body.repairCenterId);
            if (!repairCenter) return res.status(400).send("Invalid repair center ID");
          }
          updates.repairCenterId = req.body.repairCenterId;
        }
      } else if (req.user.role === 'reseller') {
        // Reseller can update orders of their customers
        // Check if the order's customer belongs to this reseller
        if (!order.customerId) {
          return res.status(403).send("Order has no customer");
        }
        const customer = await storage.getUser(order.customerId);
        if (!customer || customer.resellerId !== req.user.id) {
          return res.status(403).send("Order does not belong to your customers");
        }
        
        // Resellers can update: repairCenterId, notes, priority
        if (req.body.notes !== undefined) updates.notes = req.body.notes;
        if (req.body.repairCenterId !== undefined) {
          if (req.body.repairCenterId) {
            // Validate repair center exists and belongs to reseller
            const repairCenter = await storage.getRepairCenter(req.body.repairCenterId);
            if (!repairCenter) return res.status(400).send("Invalid repair center ID");
            if (repairCenter.resellerId !== req.user.id) {
              return res.status(403).send("Repair center does not belong to you");
            }
          }
          updates.repairCenterId = req.body.repairCenterId;
        }
      } else if (req.user.role === 'repair_center') {
        // Repair center can only update orders assigned to their center
        if (!req.user.repairCenterId) {
          return res.status(403).send("Repair center ID not configured");
        }
        if (!order.repairCenterId) {
          return res.status(403).send("Order not yet assigned to a repair center");
        }
        if (order.repairCenterId !== req.user.repairCenterId) {
          return res.status(403).send("Not assigned to your repair center");
        }
        
        if (req.body.status) updates.status = req.body.status;
        if (req.body.estimatedCost !== undefined) updates.estimatedCost = req.body.estimatedCost;
        if (req.body.finalCost !== undefined) updates.finalCost = req.body.finalCost;
        if (req.body.notes !== undefined) updates.notes = req.body.notes;
      }
      
      if (Object.keys(updates).length === 0) {
        return res.status(400).send("No valid updates provided");
      }
      
      const updatedOrder = await storage.updateRepairOrder(req.params.id, updates);
      setActivityEntity(res, { type: 'repair_order', id: updatedOrder.id });
      
      res.json(updatedOrder);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // ============ PRODUCTS ============
  
  // List all products (all roles can view)
  // Supports optional search and limit query params
  app.get("/api/products", requireAuth, async (req, res) => {
    try {
      const search = req.query.search as string | undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      
      let products = await storage.listProducts();
      
      // Filter by search term if provided (case-insensitive on name, sku, brand)
      if (search && search.trim()) {
        const searchLower = search.toLowerCase().trim();
        products = products.filter(p => 
          p.name.toLowerCase().includes(searchLower) ||
          p.sku.toLowerCase().includes(searchLower) ||
          (p.brand && p.brand.toLowerCase().includes(searchLower)) ||
          (p.category && p.category.toLowerCase().includes(searchLower))
        );
      }
      
      // Apply limit if provided
      if (limit && limit > 0) {
        products = products.slice(0, limit);
      }
      
      res.json(products);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // Get products with stock by repair center (admin only)
  // NOTE: This route MUST be defined BEFORE /api/products/:id to avoid "with-stock" being interpreted as an ID
  app.get("/api/products/with-stock", requireAuth, async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      // Only admins can view all stock across centers
      if (req.user.role !== 'admin') {
        return res.status(403).send("Only admins can view stock across all centers");
      }
      
      const productsWithStock = await storage.getAllProductsWithStock();
      res.json(productsWithStock);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // Get single product by ID (all roles can view)
  app.get("/api/products/:id", requireAuth, async (req, res) => {
    try {
      const product = await storage.getProduct(req.params.id);
      if (!product) {
        return res.status(404).send("Product not found");
      }
      res.json(product);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });
  
  // Create product (admin only)
  app.post("/api/products", requireAuth, async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      // Only admins can create products
      if (req.user.role !== 'admin') {
        return res.status(403).send("Only admins can create products");
      }
      
      // Extract initial stock assignments and supplier info from request body
      const { initialStock, supplierId, supplierCode: supplierCodeParam, ...productData } = req.body;
      
      // Save costPrice before validation for use in supplier linking
      const productCostPrice = productData.costPrice;
      
      // Admin products have createdBy = null (global products)
      const validatedData = insertProductSchema.parse({
        ...productData,
        createdBy: null,
      });
      const product = await storage.createProduct(validatedData);
      setActivityEntity(res, { type: 'product', id: product.id });
      
      // Create initial stock in warehouses
      if (initialStock && Array.isArray(initialStock)) {
        for (const stockEntry of initialStock) {
          if (stockEntry.warehouseId && stockEntry.quantity > 0) {
            // Validate warehouse exists
            const warehouse = await storage.getWarehouse(stockEntry.warehouseId);
            if (!warehouse) {
              console.warn(`Warehouse ${stockEntry.warehouseId} not found, skipping stock entry`);
              continue;
            }
            
            // Create warehouse movement
            await storage.createWarehouseMovement({
              warehouseId: stockEntry.warehouseId,
              productId: product.id,
              movementType: 'carico',
              quantity: stockEntry.quantity,
              referenceType: 'creazione_prodotto',
              notes: 'Quantità iniziale alla creazione prodotto',
              createdBy: req.user.id,
            });
            
            // Update warehouse stock (increment, not overwrite) with optional location
            const stockLocation = typeof stockEntry.location === 'string' && stockEntry.location.trim() 
              ? stockEntry.location.trim() 
              : null;
            await storage.updateWarehouseStockQuantity(
              stockEntry.warehouseId,
              product.id,
              stockEntry.quantity,
              stockLocation
            );
          }
        }
      }
      
      // Create product-supplier relationship if supplierId is provided
      if (supplierId) {
        const supplier = await storage.getSupplier(supplierId);
        if (!supplier) {
          console.warn(`Supplier ${supplierId} not found, skipping product-supplier link`);
        } else {
          await storage.createProductSupplier({
            productId: product.id,
            supplierId: supplierId,
            supplierCode: supplierCodeParam || null,
            purchasePrice: productCostPrice || null,
            isPreferred: true,
          });
        }
      }
      
      res.status(201).json(product);
    } catch (error: any) {
      res.status(400).send(error.message);
    }
  });
  
  // Update product (admin only)
  app.patch("/api/products/:id", requireAuth, async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      // Only admins can update products
      if (req.user.role !== 'admin') {
        return res.status(403).send("Only admins can update products");
      }
      
      const product = await storage.getProduct(req.params.id);
      if (!product) return res.status(404).send("Product not found");
      
      const updates: Partial<Omit<Product, 'id' | 'createdAt'>> = {};
      if (req.body.name !== undefined) updates.name = req.body.name;
      if (req.body.sku !== undefined) updates.sku = req.body.sku;
      if (req.body.category !== undefined) updates.category = req.body.category;
      if (req.body.productType !== undefined) updates.productType = req.body.productType;
      if (req.body.description !== undefined) updates.description = req.body.description;
      if (req.body.deviceTypeId !== undefined) updates.deviceTypeId = req.body.deviceTypeId;
      if (req.body.brand !== undefined) updates.brand = req.body.brand;
      if (req.body.compatibleModels !== undefined) updates.compatibleModels = req.body.compatibleModels;
      if (req.body.color !== undefined) updates.color = req.body.color;
      if (req.body.costPrice !== undefined) updates.costPrice = req.body.costPrice;
      if (req.body.unitPrice !== undefined) updates.unitPrice = req.body.unitPrice;
      if (req.body.condition !== undefined) updates.condition = req.body.condition;
      if (req.body.warrantyMonths !== undefined) updates.warrantyMonths = req.body.warrantyMonths;
      if (req.body.supplier !== undefined) updates.supplier = req.body.supplier;
      if (req.body.supplierCode !== undefined) updates.supplierCode = req.body.supplierCode;
      if (req.body.minStock !== undefined) updates.minStock = req.body.minStock;
      if (req.body.location !== undefined) updates.location = req.body.location;
      if (req.body.isActive !== undefined) updates.isActive = req.body.isActive;
      
      if (Object.keys(updates).length === 0) {
        return res.status(400).send("No valid updates provided");
      }
      
      const updated = await storage.updateProduct(req.params.id, updates);
      setActivityEntity(res, { type: 'product', id: updated.id });
      
      res.json(updated);
    } catch (error: any) {
      res.status(400).send(error.message);
    }
  });
  
  // Delete product (admin only)
  app.delete("/api/products/:id", requireAuth, async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      // Only admins can delete products
      if (req.user.role !== 'admin') {
        return res.status(403).send("Only admins can delete products");
      }
      
      const product = await storage.getProduct(req.params.id);
      if (!product) return res.status(404).send("Product not found");
      
      await storage.deleteProduct(req.params.id);
      setActivityEntity(res, { type: 'product', id: req.params.id });
      
      res.status(204).send();
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // Get product stock by repair center (admin only)
  app.get("/api/products/:id/stock", requireAuth, async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      // Only admins can view stock across all centers
      if (req.user.role !== 'admin') {
        return res.status(403).send("Only admins can view stock by center");
      }
      
      const product = await storage.getProduct(req.params.id);
      if (!product) return res.status(404).send("Product not found");
      
      const stockByCenter = await storage.getProductStockByCenter(req.params.id);
      res.json(stockByCenter);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // Update product stock for a specific repair center (admin only)
  app.post("/api/products/:id/stock", requireAuth, async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      // Only admins can update stock
      if (req.user.role !== 'admin') {
        return res.status(403).send("Only admins can update stock");
      }
      
      const product = await storage.getProduct(req.params.id);
      if (!product) return res.status(404).send("Product not found");
      
      const { repairCenterId, quantity, notes } = req.body;
      
      if (!repairCenterId) {
        return res.status(400).send("repairCenterId is required");
      }
      
      if (typeof quantity !== 'number') {
        return res.status(400).send("quantity must be a number");
      }
      
      // Get current stock
      const currentStock = await storage.getInventoryStock(req.params.id, repairCenterId);
      const currentQuantity = currentStock?.quantity || 0;
      const difference = quantity - currentQuantity;
      
      if (difference === 0) {
        return res.json({ message: "No change in quantity" });
      }
      
      // Create inventory movement for the difference
      const movement = await storage.createInventoryMovement({
        productId: req.params.id,
        repairCenterId,
        movementType: difference > 0 ? 'in' : 'out',
        quantity: Math.abs(difference),
        notes: notes || `Rettifica manuale: da ${currentQuantity} a ${quantity}`,
        createdBy: req.user.id,
      });
      
      // Get updated stock
      const updatedStock = await storage.getProductStockByCenter(req.params.id);
      setActivityEntity(res, { type: 'inventory', id: movement.id });
      
      res.json(updatedStock);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // Get product warehouse stocks (unified system)
  app.get("/api/products/:id/warehouse-stocks", requireAuth, async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      const product = await storage.getProduct(req.params.id);
      if (!product) return res.status(404).send("Product not found");
      
      const warehouseStocks = await storage.getProductWarehouseStocks(req.params.id);
      
      // Enrich with owner info
      const enriched = [];
      for (const ws of warehouseStocks) {
        let ownerName = 'Sistema';
        const warehouse = ws.warehouse;
        if (warehouse && warehouse.ownerId && warehouse.ownerId !== 'system') {
          const owner = await storage.getUser(warehouse.ownerId);
          ownerName = owner?.fullName || owner?.username || 'Sconosciuto';
        }
        enriched.push({
          warehouseId: ws.warehouseId,
          productId: ws.productId,
          quantity: ws.quantity,
          minStock: ws.minStock,
          location: ws.location,
          warehouse: warehouse ? {
            id: warehouse.id,
            name: warehouse.name,
            ownerType: warehouse.ownerType,
            ownerId: warehouse.ownerId,
            ownerName,
          } : null,
        });
      }
      
      const totalQuantity = warehouseStocks.reduce((sum, ws) => sum + ws.quantity, 0);
      
      res.json({
        stocks: enriched,
        totalQuantity,
      });
    } catch (error: any) {
      console.error("Error in /api/products/:id/warehouse-stocks:", error);
      res.status(500).send(error.message);
    }
  });

  // Update product warehouse stock (unified system)
  app.post("/api/products/:id/warehouse-stock", requireAuth, async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      // Only admins can update stock
      if (req.user.role !== 'admin') {
        return res.status(403).send("Only admins can update stock");
      }
      
      const product = await storage.getProduct(req.params.id);
      if (!product) return res.status(404).send("Product not found");
      
      const { warehouseId, quantity, notes, location } = req.body;
      
      if (!warehouseId) {
        return res.status(400).send("warehouseId is required");
      }
      
      if (typeof quantity !== 'number') {
        return res.status(400).send("quantity must be a number");
      }
      
      const warehouse = await storage.getWarehouse(warehouseId);
      if (!warehouse) {
        return res.status(404).send("Warehouse not found");
      }
      
      // Get current stock
      const currentStock = await storage.getWarehouseStockItem(warehouseId, req.params.id);
      const currentQuantity = currentStock?.quantity || 0;
      const difference = quantity - currentQuantity;
      
      // Normalize location value
      const locationValue = typeof location === 'string' ? (location || null) : undefined;
      
      // Update location if provided (even if quantity unchanged) and stock exists
      if (locationValue !== undefined && currentStock) {
        await storage.updateWarehouseStock(currentStock.id, { location: locationValue });
      }
      
      if (difference === 0) {
        // Return updated stocks even if only location changed
        const updatedStocks = await storage.getProductWarehouseStocks(req.params.id);
        const totalQuantity = updatedStocks.reduce((sum, ws) => sum + ws.quantity, 0);
        return res.json({
          stocks: updatedStocks,
          totalQuantity,
        });
      }
      
      // Create warehouse movement for the difference
      await storage.createWarehouseMovement({
        warehouseId,
        productId: req.params.id,
        movementType: difference > 0 ? 'carico' : 'scarico',
        quantity: Math.abs(difference),
        referenceType: 'rettifica',
        notes: notes || `Rettifica manuale: da ${currentQuantity} a ${quantity}`,
        createdBy: req.user.id,
      });
      
      // Update warehouse stock (passes location for new entries)
      await storage.updateWarehouseStockQuantity(warehouseId, req.params.id, difference, locationValue);
      
      // Get updated stocks
      const updatedStocks = await storage.getProductWarehouseStocks(req.params.id);
      const totalQuantity = updatedStocks.reduce((sum, ws) => sum + ws.quantity, 0);
      
      res.json({
        stocks: updatedStocks,
        totalQuantity,
      });
    } catch (error: any) {
      console.error("Error in POST /api/products/:id/warehouse-stock:", error);
      res.status(500).send(error.message);
    }
  });

  // ============ SMARTPHONES (Dispositivi) ============
  
  // List smartphones with specs (reseller sees own, admin sees all)
  app.get("/api/smartphones", requireAuth, async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      const filters: { resellerId?: string; brand?: string; condition?: string } = {};
      
      if (req.user.role === 'reseller' || req.user.role === 'reseller_collaborator') {
        const effectiveResellerId = req.user.role === 'reseller_collaborator' ? req.user.resellerId : req.user.id;
        if (effectiveResellerId) filters.resellerId = effectiveResellerId;
      } else if (req.user.role !== 'admin') {
        return res.status(403).send("Access denied");
      }
      
      if (req.query.brand) filters.brand = req.query.brand as string;
      if (req.query.condition) filters.condition = req.query.condition as string;
      
      const smartphones = await storage.listSmartphones(filters);
      res.json(smartphones);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });
  
  // Get smartphone specs for a product
  app.get("/api/smartphones/:productId/specs", requireAuth, async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      const specs = await storage.getSmartphoneSpecs(req.params.productId);
      if (!specs) return res.status(404).send("Smartphone specs not found");
      
      res.json(specs);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });
  
  // Create smartphone with specs (reseller or admin) - supports multipart/form-data for image upload
  app.post("/api/smartphones", requireAuth, requireRole("admin", "reseller", "reseller_collaborator"), upload.single("image"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      // Parse product and specs - support both JSON body and FormData (stringified JSON)
      let product, specs, initialStock: any[] = [];
      let legacyInitialQuantity = 0, legacyWarehouseId: string | null = null;
      if (typeof req.body.product === 'string') {
        product = JSON.parse(req.body.product);
        specs = JSON.parse(req.body.specs);
        if (req.body.initialStock) {
          initialStock = typeof req.body.initialStock === 'string' 
            ? JSON.parse(req.body.initialStock) 
            : req.body.initialStock;
        }
        // Legacy support
        if (req.body.initialQuantity) legacyInitialQuantity = parseInt(req.body.initialQuantity) || 0;
        if (req.body.warehouseId) legacyWarehouseId = req.body.warehouseId;
      } else {
        product = req.body.product;
        specs = req.body.specs;
        initialStock = req.body.initialStock || [];
        // Legacy support
        legacyInitialQuantity = req.body.initialQuantity || 0;
        legacyWarehouseId = req.body.warehouseId || null;
      }
      
      // Convert legacy format to initialStock if needed
      if (initialStock.length === 0 && legacyInitialQuantity > 0 && legacyWarehouseId) {
        initialStock = [{ warehouseId: legacyWarehouseId, quantity: legacyInitialQuantity, location: null }];
      }
      
      if (!product || !specs) {
        return res.status(400).send("Product and specs are required");
      }
      
      // Set product type to 'dispositivo'
      product.productType = 'dispositivo';
      product.createdBy = req.user.role === 'reseller_collaborator' ? req.user.resellerId : req.user.id;
      
      // Create product first
      const createdProduct = await storage.createProduct(product);
      
      // Create initial warehouse stock for each entry
      if (initialStock && Array.isArray(initialStock)) {
        for (const stockEntry of initialStock) {
          if (stockEntry.warehouseId && stockEntry.quantity > 0) {
            const warehouse = await storage.getWarehouse(stockEntry.warehouseId);
            if (!warehouse) {
              console.warn(`Warehouse ${stockEntry.warehouseId} not found, skipping stock entry`);
              continue;
            }
            await storage.createWarehouseMovement({
              warehouseId: stockEntry.warehouseId,
              productId: createdProduct.id,
              movementType: 'carico',
              quantity: stockEntry.quantity,
              referenceType: 'initial_stock',
              notes: 'Quantità iniziale alla creazione prodotto',
              createdBy: req.user.id,
            });
            const stockLocation = typeof stockEntry.location === 'string' && stockEntry.location.trim() 
              ? stockEntry.location.trim() 
              : null;
            await storage.updateWarehouseStockQuantity(
              stockEntry.warehouseId, 
              createdProduct.id, 
              stockEntry.quantity,
              stockLocation
            );
          }
        }
      }
      
      // Create specs linked to product
      specs.productId = createdProduct.id;
      const createdSpecs = await storage.createSmartphoneSpecs(specs);
      
      // Handle image upload if file is provided
      let imageUrl = null;
      if (req.file) {
        const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
        if (!allowedMimeTypes.includes(req.file.mimetype)) {
          return res.status(400).send("Formato immagine non supportato. Usa JPEG, PNG, WebP o GIF.");
        }
        
        const maxSize = 10 * 1024 * 1024;
        if (req.file.size > maxSize) {
          return res.status(400).send("Immagine troppo grande. Massimo 10MB.");
        }
        
        const ext = req.file.originalname.split(".").pop() || "jpg";
        const objectPath = `products/${createdProduct.id}/${Date.now()}.${ext}`;
        
        const privateObjectDir = objectStorage.getPrivateObjectDir();
        const fullPath = `${privateObjectDir}/${objectPath}`;
        const { bucketName, objectName } = parseObjectPath(fullPath);
        const bucket = objectStorageClient.bucket(bucketName);
        const file = bucket.file(objectName);
        
        await file.save(req.file.buffer, {
          metadata: { contentType: req.file.mimetype }
        });
        
        imageUrl = `/objects/${objectPath}`;
        await storage.updateProduct(createdProduct.id, { imageUrl });
      }
      
      res.json({ ...createdProduct, imageUrl: imageUrl || createdProduct.imageUrl, specs: createdSpecs });
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });
  
  // Update smartphone (product and specs together) - Admin or owner reseller only
  app.patch("/api/smartphones/:productId", requireAuth, requireRole("admin", "reseller", "reseller_collaborator"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      const product = await storage.getProduct(req.params.productId);
      if (!product) return res.status(404).send("Product not found");
      
      // Resellers can only modify products they created, not assigned products
      if (req.user.role === 'reseller') {
        if (product.createdBy !== req.user.id) {
          return res.status(403).send("Puoi modificare solo i prodotti che hai creato. Per i prodotti assegnati usa le impostazioni di vendita.");
        }
      }
      if (req.user.role === 'reseller_collaborator') {
        const resellerId = req.user.resellerId;
        if (!resellerId || product.createdBy !== resellerId) {
          return res.status(403).send("Puoi modificare solo i prodotti creati dal tuo rivenditore.");
        }
      }
      
      const { product: productData, specs: specsData } = req.body;
      
      // Update product if provided
      if (productData) {
        await storage.updateProduct(req.params.productId, productData);
      }
      
      // Update specs if provided
      if (specsData) {
        await storage.updateSmartphoneSpecs(req.params.productId, specsData);
      }
      
      // Return updated data
      const updatedProduct = await storage.getProduct(req.params.productId);
      const updatedSpecs = await storage.getSmartphoneSpecs(req.params.productId);
      
      res.json({ ...updatedProduct, specs: updatedSpecs });
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });
  
  // Update smartphone specs - Admin or owner reseller only
  app.patch("/api/smartphones/:productId/specs", requireAuth, requireRole("admin", "reseller", "reseller_collaborator"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      const product = await storage.getProduct(req.params.productId);
      if (!product) return res.status(404).send("Product not found");
      
      // Resellers can only modify specs for products they created
      if (req.user.role === 'reseller') {
        if (product.createdBy !== req.user.id) {
          return res.status(403).send("Puoi modificare solo le specifiche dei prodotti che hai creato.");
        }
      }
      if (req.user.role === 'reseller_collaborator') {
        const resellerId = req.user.resellerId;
        if (!resellerId || product.createdBy !== resellerId) {
          return res.status(403).send("Puoi modificare solo le specifiche dei prodotti creati dal tuo rivenditore.");
        }
      }
      
      const updatedSpecs = await storage.updateSmartphoneSpecs(req.params.productId, req.body);
      res.json(updatedSpecs);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });
  
  // Delete smartphone (deletes product and specs) - Admin or owner reseller only
  app.delete("/api/smartphones/:productId", requireAuth, requireRole("admin", "reseller", "reseller_collaborator"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      const product = await storage.getProduct(req.params.productId);
      if (!product) return res.status(404).send("Product not found");
      
      // Resellers can only delete products they created
      if (req.user.role === 'reseller') {
        if (product.createdBy !== req.user.id) {
          return res.status(403).send("Puoi eliminare solo i prodotti che hai creato.");
        }
      }
      if (req.user.role === 'reseller_collaborator') {
        const resellerId = req.user.resellerId;
        if (!resellerId || product.createdBy !== resellerId) {
          return res.status(403).send("Puoi eliminare solo i prodotti creati dal tuo rivenditore.");
        }
      }
      
      // Delete specs first, then product
      await storage.deleteSmartphoneSpecs(req.params.productId);
      await storage.deleteProduct(req.params.productId);
      
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // ============ ACCESSORIES (Accessori) ============
  
  // List accessories with specs and device compatibilities
  app.get("/api/accessories", requireAuth, async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      const filters: { resellerId?: string; accessoryType?: string } = {};
      
      if (req.user.role === 'reseller' || req.user.role === 'reseller_collaborator') {
        const effectiveResellerId = req.user.role === 'reseller_collaborator' ? req.user.resellerId : req.user.id;
        if (effectiveResellerId) filters.resellerId = effectiveResellerId;
      } else if (req.user.role !== 'admin') {
        return res.status(403).send("Access denied");
      }
      
      if (req.query.accessoryType) filters.accessoryType = req.query.accessoryType as string;
      
      const accessories = await storage.listAccessories(filters);
      
      // Fetch device compatibilities for each accessory
      const accessoriesWithCompatibilities = await Promise.all(
        accessories.map(async (accessory) => {
          const deviceCompatibilities = await storage.listProductCompatibilities(accessory.id);
          return { ...accessory, deviceCompatibilities };
        })
      );
      
      res.json(accessoriesWithCompatibilities);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });
  
  // Get accessory specs for a product
  app.get("/api/accessories/:productId/specs", requireAuth, async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      const specs = await storage.getAccessorySpecs(req.params.productId);
      if (!specs) return res.status(404).send("Accessory specs not found");
      
      res.json(specs);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });
  
  // Create accessory with specs - supports multipart/form-data for image upload
  app.post("/api/accessories", requireAuth, requireRole("admin", "reseller", "reseller_collaborator"), upload.single("image"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      // Parse product and specs - support both JSON body and FormData (stringified JSON)
      let product, specs;
      let deviceCompatibilities: Array<{ deviceBrandId: string; deviceModelId?: string | null }> = [];
      let initialStock: any[] = [];
      let legacyInitialQuantity = 0, legacyWarehouseId: string | null = null;
      if (typeof req.body.product === 'string') {
        product = JSON.parse(req.body.product);
        specs = JSON.parse(req.body.specs);
        if (req.body.deviceCompatibilities) {
          deviceCompatibilities = JSON.parse(req.body.deviceCompatibilities);
        }
        if (req.body.initialStock) {
          initialStock = typeof req.body.initialStock === 'string' 
            ? JSON.parse(req.body.initialStock) 
            : req.body.initialStock;
        }
        // Legacy support
        if (req.body.initialQuantity) legacyInitialQuantity = parseInt(req.body.initialQuantity) || 0;
        if (req.body.warehouseId) legacyWarehouseId = req.body.warehouseId;
      } else {
        product = req.body.product;
        specs = req.body.specs;
        deviceCompatibilities = req.body.deviceCompatibilities || [];
        initialStock = req.body.initialStock || [];
        // Legacy support
        legacyInitialQuantity = req.body.initialQuantity || 0;
        legacyWarehouseId = req.body.warehouseId || null;
      }
      
      // Convert legacy format to initialStock if needed
      if (initialStock.length === 0 && legacyInitialQuantity > 0 && legacyWarehouseId) {
        initialStock = [{ warehouseId: legacyWarehouseId, quantity: legacyInitialQuantity, location: null }];
      }
      
      if (!product || !specs) {
        return res.status(400).send("Product and specs are required");
      }
      
      // Set product type to 'accessorio'
      product.productType = 'accessorio';
      product.createdBy = req.user.role === 'reseller_collaborator' ? req.user.resellerId : req.user.id;
      
      // Create product first
      const createdProduct = await storage.createProduct(product);
      
      // Create initial warehouse stock for each entry
      if (initialStock && Array.isArray(initialStock)) {
        for (const stockEntry of initialStock) {
          if (stockEntry.warehouseId && stockEntry.quantity > 0) {
            const warehouse = await storage.getWarehouse(stockEntry.warehouseId);
            if (!warehouse) {
              console.warn(`Warehouse ${stockEntry.warehouseId} not found, skipping stock entry`);
              continue;
            }
            await storage.createWarehouseMovement({
              warehouseId: stockEntry.warehouseId,
              productId: createdProduct.id,
              movementType: 'carico',
              quantity: stockEntry.quantity,
              referenceType: 'initial_stock',
              notes: 'Quantità iniziale alla creazione prodotto',
              createdBy: req.user.id,
            });
            const stockLocation = typeof stockEntry.location === 'string' && stockEntry.location.trim() 
              ? stockEntry.location.trim() 
              : null;
            await storage.updateWarehouseStockQuantity(
              stockEntry.warehouseId, 
              createdProduct.id, 
              stockEntry.quantity,
              stockLocation
            );
          }
        }
      }
      
      // Create specs linked to product
      specs.productId = createdProduct.id;
      const createdSpecs = await storage.createAccessorySpecs(specs);
      
      // Handle device compatibilities (supports brand-only and brand+model)
      if (deviceCompatibilities && deviceCompatibilities.length > 0) {
        await storage.setProductCompatibilities(createdProduct.id, deviceCompatibilities);
      }
      
      // Handle image upload if file is provided
      let imageUrl = null;
      if (req.file) {
        const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
        if (!allowedMimeTypes.includes(req.file.mimetype)) {
          return res.status(400).send("Formato immagine non supportato. Usa JPEG, PNG, WebP o GIF.");
        }
        
        const maxSize = 10 * 1024 * 1024;
        if (req.file.size > maxSize) {
          return res.status(400).send("Immagine troppo grande. Massimo 10MB.");
        }
        
        const ext = req.file.originalname.split(".").pop() || "jpg";
        const objectPath = `products/${createdProduct.id}/${Date.now()}.${ext}`;
        
        const privateObjectDir = objectStorage.getPrivateObjectDir();
        const fullPath = `${privateObjectDir}/${objectPath}`;
        const { bucketName, objectName } = parseObjectPath(fullPath);
        const bucket = objectStorageClient.bucket(bucketName);
        const file = bucket.file(objectName);
        
        await file.save(req.file.buffer, {
          metadata: { contentType: req.file.mimetype }
        });
        
        imageUrl = `/objects/${objectPath}`;
        await storage.updateProduct(createdProduct.id, { imageUrl });
      }
      
      // Fetch device compatibilities to include in response
      const savedCompatibilities = await storage.listProductCompatibilities(createdProduct.id);
      
      res.json({ ...createdProduct, imageUrl: imageUrl || createdProduct.imageUrl, specs: createdSpecs, deviceCompatibilities: savedCompatibilities });
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });
  
  // Update accessory (product, specs, and device compatibilities)
  app.patch("/api/accessories/:productId", requireAuth, requireRole("admin", "reseller", "reseller_collaborator"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      const existingProduct = await storage.getProduct(req.params.productId);
      if (!existingProduct) return res.status(404).send("Product not found");
      
      // Check ownership for reseller (admin can edit all)
      const effectiveResellerId = req.user.role === 'reseller_collaborator' ? req.user.resellerId : req.user.id;
      if (req.user.role === 'reseller' || req.user.role === 'reseller_collaborator') {
        // Resellers can edit products they created or that are assigned to them via product_prices
        const isCreator = existingProduct.createdBy === effectiveResellerId;
        if (!isCreator) {
          // Check if product is assigned to this reseller
          const assignedPrice = await storage.getProductPriceForReseller(req.params.productId, effectiveResellerId!);
          if (!assignedPrice) {
            return res.status(403).send("Access denied");
          }
        }
      }
      
      const { product, specs, deviceCompatibilities: incomingCompatibilities } = req.body;
      
      // Update product fields if provided
      if (product) {
        await storage.updateProduct(req.params.productId, product);
      }
      
      // Update specs if provided
      let updatedSpecs = null;
      if (specs) {
        updatedSpecs = await storage.updateAccessorySpecs(req.params.productId, specs);
      }
      
      // Update device compatibilities if provided (supports brand-only and brand+model)
      if (incomingCompatibilities !== undefined) {
        await storage.setProductCompatibilities(req.params.productId, incomingCompatibilities);
      }
      
      // Fetch updated data
      const updatedProduct = await storage.getProduct(req.params.productId);
      const deviceCompatibilities = await storage.listProductCompatibilities(req.params.productId);
      
      res.json({ ...updatedProduct, specs: updatedSpecs, deviceCompatibilities });
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });
  
  // Update accessory specs only (legacy endpoint)
  app.patch("/api/accessories/:productId/specs", requireAuth, requireRole("admin", "reseller", "reseller_collaborator"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      const product = await storage.getProduct(req.params.productId);
      if (!product) return res.status(404).send("Product not found");
      
      // Check ownership for reseller
      if (req.user.role === 'reseller' && product.createdBy !== req.user.id) {
        return res.status(403).send("Access denied");
      }
      if (req.user.role === 'reseller_collaborator' && product.createdBy !== req.user.resellerId) {
        return res.status(403).send("Access denied");
      }
      
      const updatedSpecs = await storage.updateAccessorySpecs(req.params.productId, req.body);
      res.json(updatedSpecs);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });
  
  // Delete accessory (deletes product and specs)
  app.delete("/api/accessories/:productId", requireAuth, requireRole("admin", "reseller", "reseller_collaborator"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      const product = await storage.getProduct(req.params.productId);
      if (!product) return res.status(404).send("Product not found");
      
      // Check ownership for reseller
      if (req.user.role === 'reseller' && product.createdBy !== req.user.id) {
        return res.status(403).send("Access denied");
      }
      if (req.user.role === 'reseller_collaborator' && product.createdBy !== req.user.resellerId) {
        return res.status(403).send("Access denied");
      }
      
      // Delete specs first, then product
      await storage.deleteAccessorySpecs(req.params.productId);
      await storage.deleteProduct(req.params.productId);
      
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // Assign accessory to reseller (admin only)
  app.patch("/api/admin/accessories/:productId/assign", requireAuth, requireRole("admin"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      const { resellerId } = req.body;
      const product = await storage.getProduct(req.params.productId);
      
      if (!product) return res.status(404).send("Accessory not found");
      if (product.category !== "accessorio") return res.status(400).send("Product is not an accessory");
      
      // Validate reseller if provided
      if (resellerId) {
        const reseller = await storage.getUser(resellerId);
        if (!reseller || reseller.role !== 'reseller') {
          return res.status(400).send("Invalid reseller");
        }
      }
      
      // Update product ownership
      const updatedProduct = await storage.updateProduct(req.params.productId, {
        ownerId: resellerId || null,
        ownerType: resellerId ? 'reseller' : null,
      });
      
      // Log activity
      await storage.createActivityLog({
        userId: req.user.id,
        action: resellerId ? 'accessory_assigned' : 'accessory_unassigned',
        entityType: 'product',
        entityId: req.params.productId,
        details: {
          productName: product.name,
          resellerId: resellerId || null,
        },
      });
      
      res.json(updatedProduct);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // ============ INVOICES ============

  app.get("/api/invoices", requireAuth, async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      let invoices;
      
      if (req.user.role === 'admin') {
        // Admin sees all invoices
        const paymentStatus = req.query.paymentStatus as string | undefined;
        invoices = await storage.listInvoices({ paymentStatus });
      } else if (req.user.role === 'customer') {
        // Customer sees only own invoices
        invoices = await storage.listInvoices({ customerId: req.user.id });
      } else if (req.user.role === 'reseller') {
        // Reseller sees invoices for their customers (respecting context switch)
        const context = getEffectiveContext(req);
        invoices = await storage.listInvoices({ resellerId: context.resellerId });
      } else {
        // Repair Center: no access to invoices
        return res.status(403).send("Access denied");
      }
      
      res.json(invoices);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  app.get("/api/invoices/:id", requireAuth, async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      const invoice = await storage.getInvoice(req.params.id);
      if (!invoice) {
        return res.status(404).send("Invoice not found");
      }
      
      // Access control: admin sees all, customer sees own only
      if (req.user.role === 'customer' && invoice.customerId !== req.user.id) {
        return res.status(403).send("Access denied");
      }
      if (req.user.role !== 'admin' && req.user.role !== 'customer') {
        return res.status(403).send("Access denied");
      }
      
      res.json(invoice);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  app.post("/api/invoices", requireAuth, async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      // Only admin can create invoices
      if (req.user.role !== 'admin') {
        return res.status(403).send("Only admins can create invoices");
      }
      
      const schema = insertInvoiceSchema.pick({
        customerId: true,
        repairOrderId: true,
        amount: true,
        tax: true,
        total: true,
        paymentStatus: true,
        paymentMethod: true,
        dueDate: true,
        notes: true,
      });
      
      const validatedData = schema.parse(req.body);
      
      // If linked to repair order, validate it exists
      if (validatedData.repairOrderId) {
        const order = await storage.getRepairOrder(validatedData.repairOrderId);
        if (!order) {
          return res.status(400).send("Invalid repair order ID");
        }
      }
      
      const invoice = await storage.createInvoice({
        customerId: validatedData.customerId,
        repairOrderId: validatedData.repairOrderId,
        amount: validatedData.amount,
        tax: validatedData.tax,
        total: validatedData.total,
        paymentStatus: validatedData.paymentStatus,
        paymentMethod: validatedData.paymentMethod,
        dueDate: validatedData.dueDate,
        notes: validatedData.notes,
      });
      
      setActivityEntity(res, { type: 'invoice', id: invoice.id });
      res.status(201).json(invoice);
    } catch (error: any) {
      res.status(400).send(error.message);
    }
  });

  app.patch("/api/invoices/:id", requireAuth, async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      // Only admin can update invoices
      if (req.user.role !== 'admin') {
        return res.status(403).send("Only admins can update invoices");
      }
      
      const invoice = await storage.getInvoice(req.params.id);
      if (!invoice) {
        return res.status(404).send("Invoice not found");
      }
      
      const allowedUpdates = ['paymentStatus', 'paidDate', 'notes', 'paymentMethod'] as const;
      const updates: any = {};
      
      for (const key of allowedUpdates) {
        if (req.body[key] !== undefined) {
          updates[key] = req.body[key];
        }
      }
      
      // Auto-set paidDate when marking as paid
      if (updates.paymentStatus === 'paid' && !updates.paidDate) {
        updates.paidDate = new Date();
      }
      
      const updatedInvoice = await storage.updateInvoice(req.params.id, updates);
      
      setActivityEntity(res, { type: 'invoice', id: updatedInvoice.id });
      res.json(updatedInvoice);
    } catch (error: any) {
      res.status(400).send(error.message);
    }
  });

  // ============ REPAIR ATTACHMENTS (File Uploads) ============

  app.get("/api/repair-orders/:repairOrderId/attachments", requireAuth, async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      // Verify user has access to this repair order
      const order = await storage.getRepairOrder(req.params.repairOrderId);
      if (!order) {
        return res.status(404).send("Repair order not found");
      }
      
      // Role-based access control
      if (req.user.role === 'customer' && order.customerId !== req.user.id) {
        return res.status(403).send("Access denied");
      }
      if (req.user.role === 'reseller' && order.resellerId !== req.user.id) {
        return res.status(403).send("Access denied");
      }
      if (req.user.role === 'repair_center') {
        if (!req.user.repairCenterId || order.repairCenterId !== req.user.repairCenterId) {
          return res.status(403).send("Access denied");
        }
      }
      
      const attachments = await storage.listRepairAttachments(req.params.repairOrderId);
      res.json(attachments);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  app.post("/api/repair-orders/:repairOrderId/attachments", requireAuth, async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      // Verify user has access to this repair order
      const order = await storage.getRepairOrder(req.params.repairOrderId);
      if (!order) {
        return res.status(404).send("Repair order not found");
      }
      
      // Role-based access control
      if (req.user.role === 'customer' && order.customerId !== req.user.id) {
        return res.status(403).send("Access denied");
      }
      if (req.user.role === 'reseller' && order.resellerId !== req.user.id) {
        return res.status(403).send("Access denied");
      }
      if (req.user.role === 'repair_center') {
        if (!req.user.repairCenterId || order.repairCenterId !== req.user.repairCenterId) {
          return res.status(403).send("Access denied");
        }
      }
      if (req.user.role !== 'admin' && req.user.role !== 'customer' && req.user.role !== 'reseller' && req.user.role !== 'repair_center') {
        return res.status(403).send("Access denied");
      }
      
      // Create attachment record (file upload handled separately by frontend via object storage)
      const attachment = await storage.addRepairAttachment({
        repairOrderId: req.params.repairOrderId,
        objectKey: req.body.objectKey,
        fileName: req.body.fileName,
        fileType: req.body.fileType,
        fileSize: req.body.fileSize,
        uploadedBy: req.user.id,
      });
      
      setActivityEntity(res, { type: 'repair_attachment', id: attachment.id });
      res.status(201).json(attachment);
    } catch (error: any) {
      res.status(400).send(error.message);
    }
  });

  app.delete("/api/repair-attachments/:id", requireAuth, async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      const attachment = await storage.getRepairAttachment(req.params.id);
      if (!attachment) {
        return res.status(404).send("Attachment not found");
      }
      
      // Verify user has access
      const order = await storage.getRepairOrder(attachment.repairOrderId);
      if (!order) {
        return res.status(404).send("Repair order not found");
      }
      
      // Only admin or attachment uploader can delete
      if (req.user.role !== 'admin' && attachment.uploadedBy !== req.user.id) {
        return res.status(403).send("Access denied");
      }
      
      await storage.deleteRepairAttachment(req.params.id);
      res.status(204).send();
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // ============ DIAGNOSTICS ============

  // List all diagnostics (with role-based filtering and search filters)
  app.get("/api/diagnostics", requireAuth, async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      const diagnostics = await storage.listAllDiagnostics({
        userId: req.user.role === 'repair_center' ? req.user.repairCenterId : req.user.id,
        role: req.user.role,
        search: req.query.search as string | undefined,
        dateFrom: req.query.dateFrom as string | undefined,
        dateTo: req.query.dateTo as string | undefined,
      });
      
      res.json(diagnostics);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // Get diagnostics for repair order
  app.get("/api/repair-orders/:id/diagnostics", requireAuth, async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      // Verify user has access to this repair order
      const order = await storage.getRepairOrder(req.params.id);
      if (!order) {
        return res.status(404).send("Repair order not found");
      }
      
      // Role-based access control (same as repair order detail)
      if (req.user.role === 'customer' && order.customerId !== req.user.id) {
        return res.status(403).send("Access denied");
      }
      if (req.user.role === 'reseller') {
        let hasAccess = order.resellerId === req.user.id;
        if (!hasAccess && order.customerId) {
          const customer = await storage.getUser(order.customerId);
          hasAccess = !!(customer && customer.resellerId === req.user.id);
        }
        if (!hasAccess) {
          return res.status(403).send("Access denied");
        }
      }
      if (req.user.role === 'repair_center') {
        if (!req.user.repairCenterId || order.repairCenterId !== req.user.repairCenterId) {
          return res.status(403).send("Access denied");
        }
      }
      
      const diagnostics = await storage.getRepairDiagnostics(req.params.id);
      if (!diagnostics) {
        return res.status(404).send("Diagnostics not found");
      }
      
      res.json(diagnostics);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // Get acceptance data for repair order
  app.get("/api/repair-orders/:id/acceptance", requireAuth, async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      // Verify user has access to this repair order
      const order = await storage.getRepairOrder(req.params.id);
      if (!order) {
        return res.status(404).send("Repair order not found");
      }
      
      // Role-based access control (same as repair order detail)
      if (req.user.role === 'customer' && order.customerId !== req.user.id) {
        return res.status(403).send("Access denied");
      }
      if (req.user.role === 'reseller') {
        let hasAccess = order.resellerId === req.user.id;
        if (!hasAccess && order.customerId) {
          const customer = await storage.getUser(order.customerId);
          hasAccess = !!(customer && customer.resellerId === req.user.id);
        }
        if (!hasAccess) {
          return res.status(403).send("Access denied");
        }
      }
      if (req.user.role === 'repair_center') {
        if (!req.user.repairCenterId || order.repairCenterId !== req.user.repairCenterId) {
          return res.status(403).send("Access denied");
        }
      }
      
      const acceptance = await storage.getRepairAcceptance(req.params.id);
      if (!acceptance) {
        return res.status(404).send("Acceptance data not found");
      }
      
      res.json(acceptance);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // Create diagnostics for repair order
  app.post("/api/repair-orders/:id/diagnostics", requireAuth, async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      // Verify repair order exists
      const order = await storage.getRepairOrder(req.params.id);
      if (!order) {
        return res.status(404).send("Repair order not found");
      }
      
      // Role-based access control for creating diagnostics
      if (req.user.role === 'admin') {
        // Admin can create diagnostics for any order
      } else if (req.user.role === 'repair_center') {
        // Repair center can only diagnose their own orders
        if (!req.user.repairCenterId || order.repairCenterId !== req.user.repairCenterId) {
          return res.status(403).send("Access denied");
        }
      } else if (req.user.role === 'reseller') {
        // Reseller can diagnose orders of their customers
        const canManage = await canResellerManageOrder(req.user.id, order);
        if (!canManage) {
          return res.status(403).send("Access denied");
        }
      } else {
        return res.status(403).send("Only admins, repair centers and resellers can create diagnostics");
      }
      
      // Check if diagnostics already exists
      const existing = await storage.getRepairDiagnostics(req.params.id);
      if (existing) {
        return res.status(409).send("Diagnostics already exists for this repair order");
      }
      
      // Validate request body with Zod
      const validationResult = insertRepairDiagnosticsSchema.safeParse({
        repairOrderId: req.params.id,
        technicalDiagnosis: req.body.technicalDiagnosis,
        damagedComponents: req.body.damagedComponents || [],
        estimatedRepairTime: req.body.estimatedRepairTime,
        requiresExternalParts: req.body.requiresExternalParts || false,
        diagnosisNotes: req.body.diagnosisNotes,
        photos: req.body.photos || [],
        skipPhotos: req.body.skipPhotos || false,
        findingIds: req.body.findingIds || [],
        componentIds: req.body.componentIds || [],
        estimatedRepairTimeId: req.body.estimatedRepairTimeId,
        diagnosedBy: req.user.id,
      });
      
      if (!validationResult.success) {
        return res.status(400).send(validationResult.error.message);
      }
      
      const diagnosticsData = validationResult.data;
      const diagnostics = await storage.createRepairDiagnostics(diagnosticsData);
      
      // Calculate automatic priority based on diagnostic data
      const calculatedPriority = calculateRepairPriority({
        estimatedRepairTime: diagnosticsData.estimatedRepairTime ?? undefined,
        requiresExternalParts: diagnosticsData.requiresExternalParts,
      });
      
      // Update repair order status to 'in_diagnosi' (priority field doesn't exist yet - will be added in quote phase)
      await storage.updateRepairOrder(req.params.id, { 
        status: 'in_diagnosi' as any,
      });
      
      setActivityEntity(res, { type: 'repair_diagnostics', id: diagnostics.id });
      res.status(201).json(diagnostics);
    } catch (error: any) {
      res.status(400).send(error.message);
    }
  });

  // Update diagnostics for repair order
  app.patch("/api/repair-orders/:id/diagnostics", requireAuth, async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      // Verify repair order exists
      const order = await storage.getRepairOrder(req.params.id);
      if (!order) {
        return res.status(404).send("Repair order not found");
      }
      
      // Role-based access control for updating diagnostics
      if (req.user.role === 'admin') {
        // Admin can update diagnostics for any order
      } else if (req.user.role === 'repair_center') {
        // Repair center can only update their own orders
        if (!req.user.repairCenterId || order.repairCenterId !== req.user.repairCenterId) {
          return res.status(403).send("Access denied");
        }
      } else if (req.user.role === 'reseller') {
        // Reseller can update diagnostics for orders of their customers
        const canManage = await canResellerManageOrder(req.user.id, order);
        if (!canManage) {
          return res.status(403).send("Access denied");
        }
      } else {
        return res.status(403).send("Only admins, repair centers and resellers can update diagnostics");
      }
      
      // Check if diagnostics exists
      const existing = await storage.getRepairDiagnostics(req.params.id);
      if (!existing) {
        return res.status(404).send("Diagnostics not found");
      }
      
      // Validate and prepare update data
      const updates: any = {};
      if (req.body.technicalDiagnosis !== undefined) updates.technicalDiagnosis = req.body.technicalDiagnosis;
      if (req.body.damagedComponents !== undefined) updates.damagedComponents = req.body.damagedComponents;
      if (req.body.estimatedRepairTime !== undefined) updates.estimatedRepairTime = req.body.estimatedRepairTime;
      if (req.body.requiresExternalParts !== undefined) updates.requiresExternalParts = req.body.requiresExternalParts;
      if (req.body.diagnosisNotes !== undefined) updates.diagnosisNotes = req.body.diagnosisNotes;
      if (req.body.photos !== undefined) updates.photos = req.body.photos;
      if (req.body.skipPhotos !== undefined) updates.skipPhotos = req.body.skipPhotos;
      if (req.body.findingIds !== undefined) updates.findingIds = req.body.findingIds;
      if (req.body.componentIds !== undefined) updates.componentIds = req.body.componentIds;
      if (req.body.estimatedRepairTimeId !== undefined) updates.estimatedRepairTimeId = req.body.estimatedRepairTimeId;
      
      const diagnostics = await storage.updateRepairDiagnostics(req.params.id, updates);
      
      // Recalculate priority if factors changed
      if (updates.estimatedRepairTime !== undefined || updates.requiresExternalParts !== undefined) {
        const calculatedPriority = calculateRepairPriority({
          estimatedRepairTime: diagnostics.estimatedRepairTime ?? undefined,
          requiresExternalParts: diagnostics.requiresExternalParts,
        });
        // Priority will be applied in quote phase when priority field is added to repair_orders
      }
      
      setActivityEntity(res, { type: 'repair_diagnostics', id: diagnostics.id });
      res.json(diagnostics);
    } catch (error: any) {
      res.status(400).send(error.message);
    }
  });

  // ============ REPAIR QUOTES ENDPOINTS ============

  // List all quotes (with role-based filtering and search filters)
  app.get("/api/quotes", requireAuth, async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      const quotes = await storage.listAllQuotes({
        userId: req.user.role === 'repair_center' ? req.user.repairCenterId : req.user.id,
        role: req.user.role,
        status: req.query.status as string | undefined,
        search: req.query.search as string | undefined,
        dateFrom: req.query.dateFrom as string | undefined,
        dateTo: req.query.dateTo as string | undefined,
      });
      
      res.json(quotes);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // GET /api/repair-orders/:id/quote - Get quote for a repair order
  app.get("/api/repair-orders/:id/quote", requireAuth, async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      const repairOrder = await storage.getRepairOrder(req.params.id);
      if (!repairOrder) {
        return res.status(404).send("Repair order not found");
      }
      
      // RBAC check
      if (req.user.role === 'customer') {
        if (repairOrder.customerId !== req.user.id) {
          return res.status(403).send("Access denied");
        }
      } else if (req.user.role === 'reseller') {
        let hasAccess = repairOrder.resellerId === req.user.id;
        if (!hasAccess && repairOrder.customerId) {
          const customer = await storage.getUser(repairOrder.customerId);
          hasAccess = !!(customer && customer.resellerId === req.user.id);
        }
        if (!hasAccess) {
          return res.status(403).send("Access denied");
        }
      } else if (req.user.role === 'repair_center') {
        if (repairOrder.repairCenterId !== req.user.repairCenterId) {
          return res.status(403).send("Access denied");
        }
      }
      
      const quote = await storage.getRepairQuote(req.params.id);
      if (!quote) {
        return res.status(404).send("Quote not found");
      }
      
      res.json(quote);
    } catch (error: any) {
      res.status(400).send(error.message);
    }
  });

  // POST /api/repair-orders/:id/quote - Create quote for a repair order
  app.post("/api/repair-orders/:id/quote", requireAuth, async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      const repairOrder = await storage.getRepairOrder(req.params.id);
      if (!repairOrder) {
        return res.status(404).send("Repair order not found");
      }
      
      // Role-based access control for creating quotes
      if (req.user.role === 'admin') {
        // Admin can create quotes for any order
      } else if (req.user.role === 'repair_center') {
        // Repair center can only create quotes for their assigned orders
        if (repairOrder.repairCenterId !== req.user.repairCenterId) {
          return res.status(403).send("Access denied");
        }
      } else if (req.user.role === 'reseller') {
        // Reseller can create quotes for orders of their customers
        const canManage = await canResellerManageOrder(req.user.id, repairOrder);
        if (!canManage) {
          return res.status(403).send("Access denied");
        }
      } else {
        return res.status(403).send("Only admins, repair centers and resellers can create quotes");
      }
      
      // Check if quote already exists
      const existingQuote = await storage.getRepairQuote(req.params.id);
      if (existingQuote) {
        return res.status(409).send("Quote already exists for this repair order");
      }
      
      // Auto-generate quote number (QUOTE-timestamp-count format)
      const timestamp = Date.now();
      const quoteCount = await db.execute(sql`SELECT COUNT(*) as count FROM repair_quotes`);
      const count = (quoteCount.rows[0] as any).count;
      const quoteNumber = `QUOTE-${timestamp}-${parseInt(count) + 1}`;
      
      // Parse and validate parts JSON if provided
      let partsData: Array<{ name: string; quantity: number; unitPrice: number }> = [];
      if (req.body.parts) {
        try {
          partsData = typeof req.body.parts === 'string' 
            ? JSON.parse(req.body.parts) 
            : req.body.parts;
          if (!Array.isArray(partsData)) {
            return res.status(400).send("Parts must be an array");
          }
          for (const part of partsData) {
            if (!part.name || typeof part.quantity !== 'number' || typeof part.unitPrice !== 'number') {
              return res.status(400).send("Each part must have name, quantity, and unitPrice");
            }
          }
        } catch (e) {
          return res.status(400).send("Invalid parts JSON format");
        }
      }
      
      // Calculate totalAmount server-side
      const partsTotal = partsData.reduce((sum, part) => sum + (part.quantity * part.unitPrice), 0);
      const laborCost = req.body.laborCost || 0;
      const calculatedTotal = partsTotal + laborCost;
      
      // Convert validUntil string to Date if provided
      let validUntilDate: Date | null = null;
      if (req.body.validUntil) {
        const parsed = new Date(req.body.validUntil);
        if (!isNaN(parsed.getTime())) {
          validUntilDate = parsed;
        }
      }
      
      // Validate and create quote
      const validationResult = insertRepairQuoteSchema.safeParse({
        repairOrderId: req.params.id,
        quoteNumber,
        parts: partsData.length > 0 ? JSON.stringify(partsData) : null,
        laborCost,
        totalAmount: calculatedTotal,
        status: 'draft',
        validUntil: validUntilDate,
        notes: req.body.notes || null,
        createdBy: req.user.id,
      });
      
      if (!validationResult.success) {
        return res.status(400).send(validationResult.error.message);
      }
      
      // Add quoteNumber back to the data (it was omitted by the schema)
      const quoteData = {
        ...validationResult.data,
        quoteNumber,
      };
      
      const quote = await storage.createRepairQuote(quoteData);
      
      // Calculate priority based on diagnostics or use default
      const diagnostics = await storage.getRepairDiagnostics(req.params.id);
      let calculatedPriority = 'medium'; // Default priority
      
      if (diagnostics) {
        calculatedPriority = calculateRepairPriority({
          estimatedRepairTime: diagnostics.estimatedRepairTime ?? undefined,
          requiresExternalParts: diagnostics.requiresExternalParts,
        });
      }
      
      // Update repair order with priority and status
      await storage.updateRepairOrder(req.params.id, {
        priority: calculatedPriority as any,
        status: 'preventivo_emesso' as any,
      });
      
      setActivityEntity(res, { type: 'repair_quote', id: quote.id });
      res.status(201).json(quote);
    } catch (error: any) {
      res.status(400).send(error.message);
    }
  });

  // PATCH /api/repair-orders/:id/quote - Update quote
  app.patch("/api/repair-orders/:id/quote", requireAuth, async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      const repairOrder = await storage.getRepairOrder(req.params.id);
      if (!repairOrder) {
        return res.status(404).send("Repair order not found");
      }
      
      // Role-based access control for updating quotes
      if (req.user.role === 'admin') {
        // Admin can update quotes for any order
      } else if (req.user.role === 'repair_center') {
        // Repair center can only update quotes for their assigned orders
        if (repairOrder.repairCenterId !== req.user.repairCenterId) {
          return res.status(403).send("Access denied");
        }
      } else if (req.user.role === 'reseller') {
        // Reseller can update quotes for orders of their customers
        const canManage = await canResellerManageOrder(req.user.id, repairOrder);
        if (!canManage) {
          return res.status(403).send("Access denied");
        }
      } else {
        return res.status(403).send("Only admins, repair centers and resellers can update quotes");
      }
      
      const existingQuote = await storage.getRepairQuote(req.params.id);
      if (!existingQuote) {
        return res.status(404).send("Quote not found");
      }
      
      // Prepare updates
      const updates: any = {};
      if (req.body.parts !== undefined) updates.parts = req.body.parts;
      if (req.body.laborCost !== undefined) updates.laborCost = req.body.laborCost;
      if (req.body.totalAmount !== undefined) updates.totalAmount = req.body.totalAmount;
      if (req.body.validUntil !== undefined) updates.validUntil = req.body.validUntil;
      if (req.body.notes !== undefined) updates.notes = req.body.notes;
      if (req.body.status !== undefined) {
        const validStatuses = ['draft', 'sent', 'accepted', 'rejected'];
        if (!validStatuses.includes(req.body.status)) {
          return res.status(400).send(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
        }
        updates.status = req.body.status;
      }
      
      const quote = await storage.updateRepairQuote(req.params.id, updates);
      
      // If status changed to accepted, update repair order status
      if (req.body.status === 'accepted') {
        await storage.updateRepairOrder(req.params.id, {
          status: 'preventivo_accettato' as any,
        });
      } else if (req.body.status === 'rejected') {
        await storage.updateRepairOrder(req.params.id, {
          status: 'preventivo_rifiutato' as any,
        });
      } else if (req.body.status === 'sent') {
        await storage.updateRepairOrder(req.params.id, {
          status: 'preventivo_emesso' as any,
        });
      }
      
      setActivityEntity(res, { type: 'repair_quote', id: quote.id });
      res.json(quote);
    } catch (error: any) {
      res.status(400).send(error.message);
    }
  });

  // POST /api/repair-orders/:id/quote/accept - Accept quote (customer only)
  app.post("/api/repair-orders/:id/quote/accept", requireAuth, async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      const repairOrder = await storage.getRepairOrder(req.params.id);
      if (!repairOrder) {
        return res.status(404).send("Repair order not found");
      }
      
      // Only customer can accept their own quote
      if (req.user.role === 'customer') {
        if (repairOrder.customerId !== req.user.id) {
          return res.status(403).send("Access denied");
        }
      } else if (req.user.role !== 'admin') {
        return res.status(403).send("Only customers can accept quotes");
      }
      
      const quote = await storage.getRepairQuote(req.params.id);
      if (!quote) {
        return res.status(404).send("Quote not found");
      }
      
      // Update quote status to accepted
      await storage.updateQuoteStatus(req.params.id, 'accepted');
      
      // Update repair order status to preventivo_accettato
      await storage.updateRepairOrder(req.params.id, {
        status: 'preventivo_accettato' as any,
      });
      
      res.json({ message: "Quote accepted successfully" });
    } catch (error: any) {
      res.status(400).send(error.message);
    }
  });

  // POST /api/repair-orders/:id/quote/reject - Reject quote (customer only)
  app.post("/api/repair-orders/:id/quote/reject", requireAuth, async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      const repairOrder = await storage.getRepairOrder(req.params.id);
      if (!repairOrder) {
        return res.status(404).send("Repair order not found");
      }
      
      // Only customer can reject their own quote
      if (req.user.role === 'customer') {
        if (repairOrder.customerId !== req.user.id) {
          return res.status(403).send("Access denied");
        }
      } else if (req.user.role !== 'admin') {
        return res.status(403).send("Only customers can reject quotes");
      }
      
      const quote = await storage.getRepairQuote(req.params.id);
      if (!quote) {
        return res.status(404).send("Quote not found");
      }
      
      // Update quote status to rejected
      await storage.updateQuoteStatus(req.params.id, 'rejected');
      
      // Update repair order status to preventivo_rifiutato
      await storage.updateRepairOrder(req.params.id, {
        status: 'preventivo_rifiutato' as any,
      });
      
      res.json({ message: "Quote rejected successfully" });
    } catch (error: any) {
      res.status(400).send(error.message);
    }
  });

  // POST /api/repair-orders/:id/skip-quote - Skip quote (garanzia/omaggio)
  app.post("/api/repair-orders/:id/skip-quote", requireAuth, async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      const repairOrder = await storage.getRepairOrder(req.params.id);
      if (!repairOrder) {
        return res.status(404).send("Ordine di riparazione non trovato");
      }
      
      // Role-based access control for skipping quote
      if (req.user.role === 'admin') {
        // Admin can skip quote for any order
      } else if (req.user.role === 'repair_center') {
        if (repairOrder.repairCenterId !== req.user.repairCenterId) {
          return res.status(403).send("Accesso negato");
        }
      } else if (req.user.role === 'reseller') {
        const canManage = await canResellerManageOrder(req.user.id, repairOrder);
        if (!canManage) {
          return res.status(403).send("Accesso negato");
        }
      } else {
        return res.status(403).send("Solo admin, centri riparazione e rivenditori possono saltare il preventivo");
      }
      
      // Validate status - can only skip quote from in_diagnosi
      if (repairOrder.status !== 'in_diagnosi') {
        return res.status(400).send("Il preventivo può essere saltato solo dallo stato 'in_diagnosi'");
      }
      
      // Check that diagnosis exists OR was skipped
      const diagnosis = await storage.getRepairDiagnostics(req.params.id);
      if (!diagnosis && !repairOrder.skipDiagnosis) {
        return res.status(400).send("La diagnosi deve essere completata prima di saltare il preventivo");
      }
      
      // Validate bypass reason
      const { reason } = req.body;
      if (!reason || !['garanzia', 'omaggio'].includes(reason)) {
        return res.status(400).send("Motivo non valido. Deve essere 'garanzia' o 'omaggio'");
      }
      
      // Update repair order - skip to attesa_ricambi or in_riparazione based on diagnosis
      // If diagnosis was skipped, default to in_riparazione
      const nextStatus = diagnosis?.requiresExternalParts ? 'attesa_ricambi' : 'in_riparazione';
      
      await storage.updateRepairOrder(req.params.id, {
        status: nextStatus as any,
        quoteBypassReason: reason as any,
        quoteBypassedAt: new Date(),
      });
      
      res.json({ 
        message: `Preventivo saltato (${reason === 'garanzia' ? 'In Garanzia' : 'Omaggio'}). Stato aggiornato a: ${nextStatus}`,
        nextStatus 
      });
    } catch (error: any) {
      res.status(400).send(error.message);
    }
  });

  // ============ FASE 5: PARTS ORDERS ============

  // GET /api/repair-orders/:id/parts - List parts orders
  app.get("/api/repair-orders/:id/parts", requireAuth, async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      const repairOrder = await storage.getRepairOrder(req.params.id);
      if (!repairOrder) {
        return res.status(404).send("Repair order not found");
      }
      
      // RBAC check
      if (req.user.role === 'customer' && repairOrder.customerId !== req.user.id) {
        return res.status(403).send("Access denied");
      }
      if (req.user.role === 'reseller') {
        const canManage = await canResellerManageOrder(req.user.id, repairOrder);
        if (!canManage) {
          return res.status(403).send("Access denied");
        }
      }
      if (req.user.role === 'repair_center' && repairOrder.repairCenterId !== req.user.repairCenterId) {
        return res.status(403).send("Access denied");
      }
      
      const parts = await storage.listPartsOrders(req.params.id);
      res.json(parts);
    } catch (error: any) {
      res.status(400).send(error.message);
    }
  });

  // POST /api/repair-orders/:id/parts - Create parts order
  app.post("/api/repair-orders/:id/parts", requireAuth, async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      const repairOrder = await storage.getRepairOrder(req.params.id);
      if (!repairOrder) {
        return res.status(404).send("Repair order not found");
      }
      
      // Role-based access control for creating parts order
      if (req.user.role === 'admin') {
        // Admin can create parts order for any order
      } else if (req.user.role === 'repair_center') {
        if (repairOrder.repairCenterId !== req.user.repairCenterId) {
          return res.status(403).send("Access denied");
        }
      } else if (req.user.role === 'reseller') {
        const canManage = await canResellerManageOrder(req.user.id, repairOrder);
        if (!canManage) {
          return res.status(403).send("Access denied");
        }
      } else {
        return res.status(403).send("Only admins, repair centers and resellers can order parts");
      }
      
      // Convert expectedArrival string to Date if provided
      const expectedArrival = req.body.expectedArrival 
        ? new Date(req.body.expectedArrival) 
        : undefined;
      
      const partsOrder = await storage.createPartsOrder({
        repairOrderId: req.params.id,
        productId: req.body.productId || null,
        partName: req.body.partName,
        partNumber: req.body.partNumber,
        quantity: req.body.quantity || 1,
        unitCost: req.body.unitCost,
        supplier: req.body.supplier,
        expectedArrival,
        notes: req.body.notes,
        orderedBy: req.user.id,
      });
      
      // Transition status to attesa_ricambi if not already
      if (repairOrder.status === 'preventivo_accettato') {
        await storage.updateRepairOrder(req.params.id, {
          status: 'attesa_ricambi' as any,
        });
      }
      
      res.status(201).json(partsOrder);
    } catch (error: any) {
      res.status(400).send(error.message);
    }
  });

  // GET /api/parts-orders - List all parts orders (admin only)
  app.get("/api/parts-orders", requireAuth, async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      let filters: { repairCenterId?: string; status?: string } = {};
      
      if (req.user.role === 'admin') {
        if (req.query.repairCenterId) {
          filters.repairCenterId = req.query.repairCenterId as string;
        }
      } else if (req.user.role === 'repair_center') {
        if (!req.user.repairCenterId) {
          return res.json([]);
        }
        filters.repairCenterId = req.user.repairCenterId;
      } else {
        return res.status(403).send("Only admins and repair centers can view parts orders");
      }
      
      if (req.query.status) {
        filters.status = req.query.status as string;
      }
      
      const orders = await storage.listAllPartsOrders(filters);
      res.json(orders);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // PATCH /api/parts-orders/:id/status - Update parts order status
  app.patch("/api/parts-orders/:id/status", requireAuth, async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      const partsOrder = await storage.getPartsOrder(req.params.id);
      if (!partsOrder) {
        return res.status(404).send("Parts order not found");
      }
      
      // Get the repair order to check access
      const repairOrder = await storage.getRepairOrder(partsOrder.repairOrderId);
      if (!repairOrder) {
        return res.status(404).send("Repair order not found");
      }
      
      // Role-based access control for updating parts status
      if (req.user.role === 'admin') {
        // Admin can update parts status for any order
      } else if (req.user.role === 'repair_center') {
        if (repairOrder.repairCenterId !== req.user.repairCenterId) {
          return res.status(403).send("Access denied");
        }
      } else if (req.user.role === 'reseller') {
        const canManage = await canResellerManageOrder(req.user.id, repairOrder);
        if (!canManage) {
          return res.status(403).send("Access denied");
        }
      } else {
        return res.status(403).send("Only admins, repair centers and resellers can update parts status");
      }
      
      const receivedAt = req.body.status === 'received' ? new Date() : undefined;
      const updated = await storage.updatePartsOrderStatus(req.params.id, req.body.status, receivedAt);
      
      // If parts received, update inventory
      if (req.body.status === 'received') {
        // If linked to a product, add to inventory
        if (partsOrder.productId && repairOrder.repairCenterId) {
          await storage.createInventoryMovement({
            productId: partsOrder.productId,
            repairCenterId: repairOrder.repairCenterId,
            quantity: partsOrder.quantity,
            movementType: 'in',
            reference: `Ricambio ricevuto - Ordine #${partsOrder.id}`,
            performedBy: req.user.id,
          });
        }
        
        // If all parts received, check if we can transition to in_riparazione
        if (repairOrder && repairOrder.status === 'attesa_ricambi') {
          const allParts = await storage.listPartsOrders(partsOrder.repairOrderId);
          const allReceived = allParts.every(p => p.status === 'received' || p.status === 'cancelled');
          if (allReceived) {
            await storage.updateRepairOrder(partsOrder.repairOrderId, {
              status: 'in_riparazione' as any,
            });
          }
        }
      }
      
      res.json(updated);
    } catch (error: any) {
      res.status(400).send(error.message);
    }
  });

  // ============ FASE 6: REPAIR LOGS ============

  // GET /api/repair-orders/:id/logs - List repair logs
  app.get("/api/repair-orders/:id/logs", requireAuth, async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      const repairOrder = await storage.getRepairOrder(req.params.id);
      if (!repairOrder) {
        return res.status(404).send("Repair order not found");
      }
      
      // Role-based access control for viewing logs
      if (req.user.role === 'admin') {
        // Admin can view logs for any order
      } else if (req.user.role === 'customer') {
        // Customer can view logs for their own orders
        if (repairOrder.customerId !== req.user.id) {
          return res.status(403).send("Access denied");
        }
      } else if (req.user.role === 'repair_center') {
        if (repairOrder.repairCenterId !== req.user.repairCenterId) {
          return res.status(403).send("Access denied");
        }
      } else if (req.user.role === 'reseller') {
        const canManage = await canResellerManageOrder(req.user.id, repairOrder);
        if (!canManage) {
          return res.status(403).send("Access denied");
        }
      } else {
        return res.status(403).send("Access denied");
      }
      
      const logs = await storage.listRepairLogs(req.params.id);
      res.json(logs);
    } catch (error: any) {
      res.status(400).send(error.message);
    }
  });

  // POST /api/repair-orders/:id/logs - Create repair log
  app.post("/api/repair-orders/:id/logs", requireAuth, async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      const repairOrder = await storage.getRepairOrder(req.params.id);
      if (!repairOrder) {
        return res.status(404).send("Repair order not found");
      }
      
      // Role-based access control for creating logs
      if (req.user.role === 'admin') {
        // Admin can add logs for any order
      } else if (req.user.role === 'repair_center') {
        if (repairOrder.repairCenterId !== req.user.repairCenterId) {
          return res.status(403).send("Access denied");
        }
      } else if (req.user.role === 'reseller') {
        const canManage = await canResellerManageOrder(req.user.id, repairOrder);
        if (!canManage) {
          return res.status(403).send("Access denied");
        }
      } else {
        return res.status(403).send("Only admins, repair centers and resellers can add logs");
      }
      
      const log = await storage.createRepairLog({
        repairOrderId: req.params.id,
        logType: req.body.logType,
        description: req.body.description,
        technicianId: req.user.id,
        hoursWorked: req.body.hoursWorked,
        partsUsed: req.body.partsUsed,
        testResults: req.body.testResults,
        photos: req.body.photos,
      });
      
      res.status(201).json(log);
    } catch (error: any) {
      res.status(400).send(error.message);
    }
  });

  // POST /api/repair-orders/:id/start-repair - Start repair (transition to in_riparazione)
  app.post("/api/repair-orders/:id/start-repair", requireAuth, async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      const repairOrder = await storage.getRepairOrder(req.params.id);
      if (!repairOrder) {
        return res.status(404).send("Repair order not found");
      }
      
      // Role-based access control for starting repair
      if (req.user.role === 'admin') {
        // Admin can start repair for any order
      } else if (req.user.role === 'repair_center') {
        if (repairOrder.repairCenterId !== req.user.repairCenterId) {
          return res.status(403).send("Access denied");
        }
      } else if (req.user.role === 'reseller') {
        const canManage = await canResellerManageOrder(req.user.id, repairOrder);
        if (!canManage) {
          return res.status(403).send("Access denied");
        }
      } else {
        return res.status(403).send("Only admins, repair centers and resellers can start repairs");
      }
      
      // Can start repair from preventivo_accettato or attesa_ricambi
      if (repairOrder.status !== 'preventivo_accettato' && repairOrder.status !== 'attesa_ricambi') {
        return res.status(400).send("Cannot start repair from current status");
      }
      
      await storage.updateRepairOrder(req.params.id, {
        status: 'in_riparazione' as any,
      });
      
      // Create log entry
      await storage.createRepairLog({
        repairOrderId: req.params.id,
        logType: 'status_change' as any,
        description: 'Repair started',
        technicianId: req.user.id,
      });
      
      res.json({ message: "Repair started" });
    } catch (error: any) {
      res.status(400).send(error.message);
    }
  });

  // ============ FASE 7: TEST & DELIVERY ============

  // GET /api/repair-orders/:id/test-checklist - Get test checklist
  app.get("/api/repair-orders/:id/test-checklist", requireAuth, async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      const repairOrder = await storage.getRepairOrder(req.params.id);
      if (!repairOrder) {
        return res.status(404).send("Repair order not found");
      }
      
      // Role-based access control for viewing test checklist
      if (req.user.role === 'admin') {
        // Admin can view test checklist for any order
      } else if (req.user.role === 'customer') {
        // Customer can view test checklist for their own orders
        if (repairOrder.customerId !== req.user.id) {
          return res.status(403).send("Access denied");
        }
      } else if (req.user.role === 'repair_center') {
        if (repairOrder.repairCenterId !== req.user.repairCenterId) {
          return res.status(403).send("Access denied");
        }
      } else if (req.user.role === 'reseller') {
        const canManage = await canResellerManageOrder(req.user.id, repairOrder);
        if (!canManage) {
          return res.status(403).send("Access denied");
        }
      } else {
        return res.status(403).send("Access denied");
      }
      
      const checklist = await storage.getTestChecklist(req.params.id);
      res.json(checklist || null);
    } catch (error: any) {
      res.status(400).send(error.message);
    }
  });

  // POST /api/repair-orders/:id/test-checklist - Create/update test checklist
  app.post("/api/repair-orders/:id/test-checklist", requireAuth, async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      const repairOrder = await storage.getRepairOrder(req.params.id);
      if (!repairOrder) {
        return res.status(404).send("Repair order not found");
      }
      
      // Role-based access control for updating test checklist
      if (req.user.role === 'admin') {
        // Admin can update test checklist for any order
      } else if (req.user.role === 'repair_center') {
        if (repairOrder.repairCenterId !== req.user.repairCenterId) {
          return res.status(403).send("Access denied");
        }
      } else if (req.user.role === 'reseller') {
        const canManage = await canResellerManageOrder(req.user.id, repairOrder);
        if (!canManage) {
          return res.status(403).send("Access denied");
        }
      } else {
        return res.status(403).send("Only admins, repair centers and resellers can update test checklist");
      }
      
      // Check if checklist exists
      const existing = await storage.getTestChecklist(req.params.id);
      
      let checklist;
      if (existing) {
        checklist = await storage.updateTestChecklist(req.params.id, {
          displayTest: req.body.displayTest,
          touchTest: req.body.touchTest,
          batteryTest: req.body.batteryTest,
          audioTest: req.body.audioTest,
          cameraTest: req.body.cameraTest,
          connectivityTest: req.body.connectivityTest,
          buttonsTest: req.body.buttonsTest,
          sensorsTest: req.body.sensorsTest,
          chargingTest: req.body.chargingTest,
          softwareTest: req.body.softwareTest,
          overallResult: req.body.overallResult,
          notes: req.body.notes,
        });
      } else {
        checklist = await storage.createTestChecklist({
          repairOrderId: req.params.id,
          displayTest: req.body.displayTest,
          touchTest: req.body.touchTest,
          batteryTest: req.body.batteryTest,
          audioTest: req.body.audioTest,
          cameraTest: req.body.cameraTest,
          connectivityTest: req.body.connectivityTest,
          buttonsTest: req.body.buttonsTest,
          sensorsTest: req.body.sensorsTest,
          chargingTest: req.body.chargingTest,
          softwareTest: req.body.softwareTest,
          overallResult: req.body.overallResult,
          notes: req.body.notes,
          testedBy: req.user.id,
        });
      }
      
      // Transition to in_test if coming from in_riparazione
      if (repairOrder.status === 'in_riparazione') {
        await storage.updateRepairOrder(req.params.id, {
          status: 'in_test' as any,
        });
      }
      
      res.json(checklist);
    } catch (error: any) {
      res.status(400).send(error.message);
    }
  });

  // POST /api/repair-orders/:id/ready-for-pickup - Mark as ready for pickup
  app.post("/api/repair-orders/:id/ready-for-pickup", requireAuth, async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      const repairOrder = await storage.getRepairOrder(req.params.id);
      if (!repairOrder) {
        return res.status(404).send("Repair order not found");
      }
      
      // Role-based access control for marking as ready for pickup
      if (req.user.role === 'admin') {
        // Admin can mark any order as ready
      } else if (req.user.role === 'repair_center') {
        if (repairOrder.repairCenterId !== req.user.repairCenterId) {
          return res.status(403).send("Access denied");
        }
      } else if (req.user.role === 'reseller') {
        const canManage = await canResellerManageOrder(req.user.id, repairOrder);
        if (!canManage) {
          return res.status(403).send("Access denied");
        }
      } else {
        return res.status(403).send("Only admins, repair centers and resellers can mark as ready");
      }
      
      // Must have passed tests
      const checklist = await storage.getTestChecklist(req.params.id);
      if (!checklist || !checklist.overallResult) {
        return res.status(400).send("Device must pass all tests before marking as ready");
      }
      
      await storage.updateRepairOrder(req.params.id, {
        status: 'pronto_ritiro' as any,
      });
      
      // Create log
      await storage.createRepairLog({
        repairOrderId: req.params.id,
        logType: 'status_change' as any,
        description: 'Device ready for customer pickup',
        technicianId: req.user.id,
      });
      
      res.json({ message: "Device marked as ready for pickup" });
    } catch (error: any) {
      res.status(400).send(error.message);
    }
  });

  // POST /api/repair-orders/:id/deliver - Complete delivery
  app.post("/api/repair-orders/:id/deliver", requireAuth, async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      const repairOrder = await storage.getRepairOrder(req.params.id);
      if (!repairOrder) {
        return res.status(404).send("Repair order not found");
      }
      
      // Role-based access control for completing delivery
      if (req.user.role === 'admin') {
        // Admin can complete delivery for any order
      } else if (req.user.role === 'repair_center') {
        if (repairOrder.repairCenterId !== req.user.repairCenterId) {
          return res.status(403).send("Access denied");
        }
      } else if (req.user.role === 'reseller') {
        const canManage = await canResellerManageOrder(req.user.id, repairOrder);
        if (!canManage) {
          return res.status(403).send("Access denied");
        }
      } else {
        return res.status(403).send("Only admins, repair centers and resellers can complete delivery");
      }
      
      // Must be ready for pickup
      if (repairOrder.status !== 'pronto_ritiro') {
        return res.status(400).send("Device must be ready for pickup before delivery");
      }
      
      // Create delivery record
      const delivery = await storage.createDelivery({
        repairOrderId: req.params.id,
        deliveredTo: req.body.deliveredTo,
        deliveryMethod: req.body.deliveryMethod || 'in_store',
        signatureData: req.body.signatureData,
        idDocumentType: req.body.idDocumentType,
        idDocumentNumber: req.body.idDocumentNumber,
        idDocumentPhoto: req.body.idDocumentPhoto,
        notes: req.body.notes,
        deliveredBy: req.user.id,
        customerSignature: req.body.customerSignature,
        customerSignerName: req.body.customerSignerName,
        customerSignedAt: req.body.customerSignature ? new Date() : null,
        technicianSignature: req.body.technicianSignature,
        technicianSignerName: req.body.technicianSignerName,
        technicianSignedAt: req.body.technicianSignature ? new Date() : null,
      });
      
      // Update status to consegnato
      await storage.updateRepairOrder(req.params.id, {
        status: 'consegnato' as any,
      });
      
      // Create log
      await storage.createRepairLog({
        repairOrderId: req.params.id,
        logType: 'status_change' as any,
        description: `Device delivered to ${req.body.deliveredTo}`,
        technicianId: req.user.id,
      });
      
      res.json(delivery);
    } catch (error: any) {
      res.status(400).send(error.message);
    }
  });

  // GET /api/repair-orders/:id/delivery - Get delivery info
  app.get("/api/repair-orders/:id/delivery", requireAuth, async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      const repairOrder = await storage.getRepairOrder(req.params.id);
      if (!repairOrder) {
        return res.status(404).send("Repair order not found");
      }
      
      // RBAC
      if (req.user.role === 'customer' && repairOrder.customerId !== req.user.id) {
        return res.status(403).send("Access denied");
      }
      if (req.user.role === 'reseller') {
        const canManage = await canResellerManageOrder(req.user.id, repairOrder);
        if (!canManage) {
          return res.status(403).send("Access denied");
        }
      }
      if (req.user.role === 'repair_center' && repairOrder.repairCenterId !== req.user.repairCenterId) {
        return res.status(403).send("Access denied");
      }
      
      const delivery = await storage.getDelivery(req.params.id);
      res.json(delivery || null);
    } catch (error: any) {
      res.status(400).send(error.message);
    }
  });

  // ==========================================
  // DELIVERY APPOINTMENT SYSTEM
  // ==========================================

  // GET /api/repair-centers/:id/availability - Get repair center weekly availability
  app.get("/api/repair-centers/:id/availability", requireAuth, async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      // RBAC: Admin can view all, repair center can view own, reseller can view their centers
      if (req.user.role === 'admin') {
        // Admin can view all
      } else if (req.user.role === 'repair_center') {
        if (req.user.repairCenterId !== req.params.id) {
          return res.status(403).send("Access denied");
        }
      } else if (req.user.role === 'reseller') {
        const center = await storage.getRepairCenter(req.params.id);
        if (!center || center.resellerId !== req.user.id) {
          return res.status(403).send("Access denied - this center does not belong to you");
        }
      } else if (req.user.role === 'customer') {
        // Customers can view availability for booking purposes
      } else {
        return res.status(403).send("Access denied");
      }
      
      const availability = await storage.listRepairCenterAvailability(req.params.id);
      res.json(availability);
    } catch (error: any) {
      res.status(400).send(error.message);
    }
  });

  // POST /api/repair-centers/:id/availability - Set repair center weekly availability (admin/repair_center/reseller)
  app.post("/api/repair-centers/:id/availability", requireAuth, async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      // Admin, repair center itself, or owning reseller can modify availability
      if (req.user.role === 'admin') {
        // Admin can modify any center
      } else if (req.user.role === 'repair_center') {
        if (req.user.repairCenterId !== req.params.id) {
          return res.status(403).send("Access denied");
        }
      } else if (req.user.role === 'reseller') {
        // Reseller can manage centers that belong to them
        const center = await storage.getRepairCenter(req.params.id);
        if (!center || center.resellerId !== req.user.id) {
          return res.status(403).send("Access denied - this center does not belong to you");
        }
      } else {
        return res.status(403).send("Only admins, repair centers and resellers can manage availability");
      }
      
      const { availability } = req.body;
      if (!Array.isArray(availability)) {
        return res.status(400).send("Availability must be an array");
      }
      
      // Validate each availability item
      const validatedItems = [];
      for (const item of availability) {
        const validationResult = insertRepairCenterAvailabilitySchema.safeParse({
          repairCenterId: req.params.id,
          weekday: item.weekday,
          startTime: item.startTime || '09:00',
          endTime: item.endTime || '18:00',
          slotDurationMinutes: item.slotDurationMinutes || item.slotDuration || 30,
          capacityPerSlot: item.capacityPerSlot || 1,
          isClosed: item.isClosed ?? false,
        });
        
        if (!validationResult.success) {
          return res.status(400).send(`Validation error for weekday ${item.weekday}: ${validationResult.error.message}`);
        }
        validatedItems.push(validationResult.data);
      }
      
      const created = await storage.setRepairCenterAvailability(req.params.id, validatedItems);
      res.json(created);
    } catch (error: any) {
      res.status(400).send(error.message);
    }
  });

  // GET /api/repair-centers/:id/blackouts - Get repair center blackout dates
  app.get("/api/repair-centers/:id/blackouts", requireAuth, async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      // RBAC: Admin can view all, repair center can view own, reseller can view their centers
      if (req.user.role === 'admin') {
        // Admin can view all
      } else if (req.user.role === 'repair_center') {
        if (req.user.repairCenterId !== req.params.id) {
          return res.status(403).send("Access denied");
        }
      } else if (req.user.role === 'reseller') {
        const center = await storage.getRepairCenter(req.params.id);
        if (!center || center.resellerId !== req.user.id) {
          return res.status(403).send("Access denied - this center does not belong to you");
        }
      } else if (req.user.role === 'customer') {
        // Customers can view blackouts for booking purposes
      } else {
        return res.status(403).send("Access denied");
      }
      
      const { from, to } = req.query;
      const blackouts = await storage.listRepairCenterBlackouts(
        req.params.id,
        from as string | undefined,
        to as string | undefined
      );
      res.json(blackouts);
    } catch (error: any) {
      res.status(400).send(error.message);
    }
  });

  // POST /api/repair-centers/:id/blackouts - Create a blackout date
  app.post("/api/repair-centers/:id/blackouts", requireAuth, async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      if (req.user.role === 'admin') {
        // Admin can create for any center
      } else if (req.user.role === 'repair_center') {
        if (req.user.repairCenterId !== req.params.id) {
          return res.status(403).send("Access denied");
        }
      } else if (req.user.role === 'reseller') {
        // Reseller can manage centers that belong to them
        const center = await storage.getRepairCenter(req.params.id);
        if (!center || center.resellerId !== req.user.id) {
          return res.status(403).send("Access denied - this center does not belong to you");
        }
      } else {
        return res.status(403).send("Only admins, repair centers and resellers can manage blackouts");
      }
      
      // Validate the blackout data
      const validationResult = insertRepairCenterBlackoutSchema.safeParse({
        repairCenterId: req.params.id,
        date: req.body.date,
        startTime: req.body.startTime || null,
        endTime: req.body.endTime || null,
        reason: req.body.reason || null,
      });
      
      if (!validationResult.success) {
        return res.status(400).send(validationResult.error.message);
      }
      
      const blackout = await storage.createRepairCenterBlackout(validationResult.data);
      res.json(blackout);
    } catch (error: any) {
      res.status(400).send(error.message);
    }
  });

  // DELETE /api/repair-centers/:id/blackouts/:blackoutId - Delete a blackout date
  app.delete("/api/repair-centers/:id/blackouts/:blackoutId", requireAuth, async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      if (req.user.role === 'admin') {
        // Admin can delete for any center
      } else if (req.user.role === 'repair_center') {
        if (req.user.repairCenterId !== req.params.id) {
          return res.status(403).send("Access denied");
        }
      } else if (req.user.role === 'reseller') {
        // Reseller can manage centers that belong to them
        const center = await storage.getRepairCenter(req.params.id);
        if (!center || center.resellerId !== req.user.id) {
          return res.status(403).send("Access denied - this center does not belong to you");
        }
      } else {
        return res.status(403).send("Only admins, repair centers and resellers can manage blackouts");
      }
      
      await storage.deleteRepairCenterBlackout(req.params.blackoutId);
      res.json({ message: "Blackout deleted" });
    } catch (error: any) {
      res.status(400).send(error.message);
    }
  });

  // GET /api/repair-centers/:id/slots - Get available time slots for a specific date
  app.get("/api/repair-centers/:id/slots", requireAuth, async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      const { date } = req.query;
      if (!date) {
        return res.status(400).send("Date is required");
      }
      
      // Get weekday from date (0=Sunday, 1=Monday, ..., 6=Saturday)
      const dateObj = new Date(date as string);
      const weekday = dateObj.getDay();
      
      // Get availability for this weekday
      const availability = await storage.listRepairCenterAvailability(req.params.id);
      const dayAvailability = availability.find(a => a.weekday === weekday);
      
      if (!dayAvailability) {
        return res.json({ slots: [], isClosed: true, reason: "Orari non configurati per questo centro" });
      }
      
      if (dayAvailability.isClosed) {
        return res.json({ slots: [], isClosed: true, reason: "Chiuso in questo giorno" });
      }
      
      // Check for blackouts on this date
      const blackouts = await storage.listRepairCenterBlackouts(req.params.id, date as string, date as string);
      const fullDayBlackout = blackouts.find(b => !b.startTime && !b.endTime);
      
      if (fullDayBlackout) {
        return res.json({ slots: [], isClosed: true, reason: fullDayBlackout.reason });
      }
      
      // Generate time slots
      const slots: { startTime: string; endTime: string; available: boolean }[] = [];
      const slotDuration = dayAvailability.slotDurationMinutes;
      const capacity = dayAvailability.capacityPerSlot;
      
      const startParts = dayAvailability.startTime.split(':').map(Number);
      const endParts = dayAvailability.endTime.split(':').map(Number);
      
      let currentMinutes = startParts[0] * 60 + startParts[1];
      const endMinutes = endParts[0] * 60 + endParts[1];
      
      // Get existing appointments for this date
      const existingAppointments = await storage.listDeliveryAppointments({
        repairCenterId: req.params.id,
        date: date as string,
      });
      
      while (currentMinutes + slotDuration <= endMinutes) {
        const startHour = Math.floor(currentMinutes / 60);
        const startMin = currentMinutes % 60;
        const endSlotMinutes = currentMinutes + slotDuration;
        const endHour = Math.floor(endSlotMinutes / 60);
        const endMin = endSlotMinutes % 60;
        
        const startTimeStr = `${startHour.toString().padStart(2, '0')}:${startMin.toString().padStart(2, '0')}`;
        const endTimeStr = `${endHour.toString().padStart(2, '0')}:${endMin.toString().padStart(2, '0')}`;
        
        // Check if this slot is blacked out
        const isBlackedOut = blackouts.some(b => {
          if (!b.startTime || !b.endTime) return false;
          return startTimeStr >= b.startTime && startTimeStr < b.endTime;
        });
        
        // Count active appointments in this slot
        const appointmentsInSlot = existingAppointments.filter(
          a => a.startTime === startTimeStr && a.status !== 'cancelled'
        ).length;
        
        slots.push({
          startTime: startTimeStr,
          endTime: endTimeStr,
          available: !isBlackedOut && appointmentsInSlot < capacity,
        });
        
        currentMinutes += slotDuration;
      }
      
      res.json({ slots, isClosed: false });
    } catch (error: any) {
      res.status(400).send(error.message);
    }
  });

  // GET /api/repair-centers/:id/appointments - List appointments for a repair center
  app.get("/api/repair-centers/:id/appointments", requireAuth, async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      // Admin, repair center itself, or reseller that owns the center can view appointments
      if (req.user.role === 'admin') {
        // Admin can view all
      } else if (req.user.role === 'repair_center') {
        if (req.user.repairCenterId !== req.params.id) {
          return res.status(403).send("Access denied");
        }
      } else if (req.user.role === 'reseller') {
        const center = await storage.getRepairCenter(req.params.id);
        if (!center || center.resellerId !== req.user.id) {
          return res.status(403).send("Access denied - this center does not belong to you");
        }
      } else {
        return res.status(403).send("Only admins, repair centers and resellers can view appointments");
      }
      
      const { from, to, status } = req.query;
      
      let filters: any = { repairCenterId: req.params.id };
      if (status) filters.status = status;
      
      const appointments = await storage.listDeliveryAppointments(filters);
      
      // Filter by date range if provided
      let filtered = appointments;
      if (from || to) {
        filtered = appointments.filter(a => {
          if (from && a.date < (from as string)) return false;
          if (to && a.date > (to as string)) return false;
          return true;
        });
      }
      
      // Enrich appointments with repair order and customer data
      const enriched = await Promise.all(filtered.map(async (appointment) => {
        let repairOrder = null;
        let customer = null;
        
        if (appointment.repairOrderId) {
          repairOrder = await storage.getRepairOrder(appointment.repairOrderId);
        }
        
        if (appointment.customerId) {
          customer = await storage.getUser(appointment.customerId);
        } else if (repairOrder?.customerId) {
          customer = await storage.getUser(repairOrder.customerId);
        }
        
        return {
          ...appointment,
          repairOrder: repairOrder ? {
            id: repairOrder.id,
            orderNumber: repairOrder.orderNumber,
            deviceType: repairOrder.deviceType,
            brand: repairOrder.brand,
            deviceModel: repairOrder.deviceModel,
            issueDescription: repairOrder.issueDescription,
            status: repairOrder.status,
          } : null,
          customer: customer ? {
            id: customer.id,
            fullName: customer.fullName,
            phone: customer.phone,
            email: customer.email,
          } : null,
        };
      }));
      
      res.json(enriched);
    } catch (error: any) {
      res.status(400).send(error.message);
    }
  });

  // GET /api/repair-orders/:id/appointment - Get appointment for a repair order
  app.get("/api/repair-orders/:id/appointment", requireAuth, async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      const repairOrder = await storage.getRepairOrder(req.params.id);
      if (!repairOrder) {
        return res.status(404).send("Repair order not found");
      }
      
      // RBAC
      if (req.user.role === 'customer' && repairOrder.customerId !== req.user.id) {
        return res.status(403).send("Access denied");
      }
      if (req.user.role === 'reseller') {
        const canManage = await canResellerManageOrder(req.user.id, repairOrder);
        if (!canManage) {
          return res.status(403).send("Access denied");
        }
      }
      if (req.user.role === 'repair_center' && repairOrder.repairCenterId !== req.user.repairCenterId) {
        return res.status(403).send("Access denied");
      }
      
      const appointment = await storage.getDeliveryAppointmentByRepairOrder(req.params.id);
      res.json(appointment || null);
    } catch (error: any) {
      res.status(400).send(error.message);
    }
  });

  // POST /api/repair-orders/:id/appointment - Book a delivery appointment
  app.post("/api/repair-orders/:id/appointment", requireAuth, async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      const repairOrder = await storage.getRepairOrder(req.params.id);
      if (!repairOrder) {
        return res.status(404).send("Repair order not found");
      }
      
      // RBAC - reseller, admin, repair_center, or customer (own orders) can book
      if (req.user.role === 'admin') {
        // Admin can book for any order
      } else if (req.user.role === 'customer') {
        // Customer can only book for their own orders
        if (repairOrder.customerId !== req.user.id) {
          return res.status(403).send("Access denied");
        }
      } else if (req.user.role === 'reseller') {
        const canManage = await canResellerManageOrder(req.user.id, repairOrder);
        if (!canManage) {
          return res.status(403).send("Access denied");
        }
      } else if (req.user.role === 'repair_center') {
        if (repairOrder.repairCenterId !== req.user.repairCenterId) {
          return res.status(403).send("Access denied");
        }
      } else {
        return res.status(403).send("Non autorizzato a prenotare appuntamenti");
      }
      
      // Must be ready for pickup
      if (repairOrder.status !== 'pronto_ritiro') {
        return res.status(400).send("Il dispositivo deve essere pronto per il ritiro per prenotare un appuntamento");
      }
      
      // Check if there's already an active appointment
      const existingAppointment = await storage.getDeliveryAppointmentByRepairOrder(req.params.id);
      if (existingAppointment) {
        return res.status(400).send("Esiste già un appuntamento attivo per questa riparazione");
      }
      
      if (!repairOrder.repairCenterId) {
        return res.status(400).send("Nessun centro di riparazione assegnato");
      }
      
      // Validate the appointment data
      const validationResult = insertDeliveryAppointmentSchema.safeParse({
        repairOrderId: req.params.id,
        repairCenterId: repairOrder.repairCenterId,
        resellerId: req.user.role === 'reseller' ? req.user.id : repairOrder.resellerId,
        customerId: repairOrder.customerId,
        date: req.body.date,
        startTime: req.body.startTime,
        endTime: req.body.endTime,
        notes: req.body.notes || null,
      });
      
      if (!validationResult.success) {
        return res.status(400).send(validationResult.error.message);
      }
      
      const { date, startTime, endTime } = validationResult.data;
      
      // Check for conflicts
      const hasConflict = await storage.checkAppointmentConflict(
        repairOrder.repairCenterId,
        date,
        startTime
      );
      
      if (hasConflict) {
        return res.status(400).send("Lo slot orario selezionato non è più disponibile");
      }
      
      const appointment = await storage.createDeliveryAppointment(validationResult.data);
      
      // Create log entry
      await storage.createRepairLog({
        repairOrderId: req.params.id,
        logType: 'status_change' as any,
        description: `Appuntamento consegna prenotato per il ${date} alle ${startTime}`,
        technicianId: req.user.id,
      });
      
      res.json(appointment);
    } catch (error: any) {
      res.status(400).send(error.message);
    }
  });

  // PATCH /api/appointments/:id - Update an appointment (reschedule, confirm, cancel)
  app.patch("/api/appointments/:id", requireAuth, async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      const appointment = await storage.getDeliveryAppointment(req.params.id);
      if (!appointment) {
        return res.status(404).send("Appointment not found");
      }
      
      const repairOrder = await storage.getRepairOrder(appointment.repairOrderId);
      if (!repairOrder) {
        return res.status(404).send("Repair order not found");
      }
      
      // RBAC
      const isCustomer = req.user.role === 'customer';
      if (req.user.role === 'admin') {
        // Admin can modify any appointment
      } else if (req.user.role === 'customer') {
        // Customer can only cancel their own appointments
        if (repairOrder.customerId !== req.user.id) {
          return res.status(403).send("Access denied");
        }
      } else if (req.user.role === 'repair_center') {
        if (repairOrder.repairCenterId !== req.user.repairCenterId) {
          return res.status(403).send("Access denied");
        }
      } else if (req.user.role === 'reseller') {
        const canManage = await canResellerManageOrder(req.user.id, repairOrder);
        if (!canManage) {
          return res.status(403).send("Access denied");
        }
      } else {
        return res.status(403).send("Access denied");
      }
      
      const { date, startTime, endTime, status, notes, cancelReason } = req.body;
      
      // Customers can only cancel, not reschedule, confirm, or modify notes
      if (isCustomer) {
        if (status !== 'cancelled') {
          return res.status(403).send("I clienti possono solo annullare gli appuntamenti");
        }
        if (date || startTime || endTime || notes !== undefined) {
          return res.status(403).send("I clienti non possono modificare i dettagli degli appuntamenti");
        }
      }
      
      let updates: any = {};
      
      // Handle rescheduling
      if (date || startTime || endTime) {
        if (appointment.status === 'completed' || appointment.status === 'cancelled') {
          return res.status(400).send("Cannot reschedule a completed or cancelled appointment");
        }
        
        // Check for conflicts if changing time
        if ((date && date !== appointment.date) || (startTime && startTime !== appointment.startTime)) {
          const hasConflict = await storage.checkAppointmentConflict(
            appointment.repairCenterId,
            date || appointment.date,
            startTime || appointment.startTime,
            appointment.id
          );
          
          if (hasConflict) {
            return res.status(400).send("Lo slot orario selezionato non è disponibile");
          }
        }
        
        if (date) updates.date = date;
        if (startTime) updates.startTime = startTime;
        if (endTime) updates.endTime = endTime;
      }
      
      // Handle status changes
      if (status) {
        if (status === 'confirmed') {
          updates.status = 'confirmed';
          updates.confirmedBy = req.user.id;
          updates.confirmedAt = new Date();
        } else if (status === 'cancelled') {
          updates.status = 'cancelled';
          updates.cancelledBy = req.user.id;
          updates.cancelledAt = new Date();
          updates.cancelReason = cancelReason;
        } else if (status === 'completed') {
          updates.status = 'completed';
        } else if (status === 'no_show') {
          updates.status = 'no_show';
        }
      }
      
      if (notes !== undefined) {
        updates.notes = notes;
      }
      
      const updated = await storage.updateDeliveryAppointment(req.params.id, updates);
      
      // Create log entry for significant changes
      if (status === 'cancelled') {
        await storage.createRepairLog({
          repairOrderId: appointment.repairOrderId,
          logType: 'status_change' as any,
          description: `Appuntamento consegna annullato${cancelReason ? ': ' + cancelReason : ''}`,
          technicianId: req.user.id,
        });
      } else if (status === 'confirmed') {
        await storage.createRepairLog({
          repairOrderId: appointment.repairOrderId,
          logType: 'status_change' as any,
          description: `Appuntamento consegna confermato per il ${updated.date} alle ${updated.startTime}`,
          technicianId: req.user.id,
        });
      } else if (date || startTime) {
        await storage.createRepairLog({
          repairOrderId: appointment.repairOrderId,
          logType: 'status_change' as any,
          description: `Appuntamento consegna riprogrammato per il ${updated.date} alle ${updated.startTime}`,
          technicianId: req.user.id,
        });
      }
      
      res.json(updated);
    } catch (error: any) {
      res.status(400).send(error.message);
    }
  });

  // GET /api/appointments/:id - Get appointment details
  app.get("/api/appointments/:id", requireAuth, async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      const appointment = await storage.getDeliveryAppointment(req.params.id);
      if (!appointment) {
        return res.status(404).send("Appointment not found");
      }
      
      const repairOrder = await storage.getRepairOrder(appointment.repairOrderId);
      if (!repairOrder) {
        return res.status(404).send("Repair order not found");
      }
      
      // RBAC
      if (req.user.role === 'customer' && repairOrder.customerId !== req.user.id) {
        return res.status(403).send("Access denied");
      }
      if (req.user.role === 'reseller') {
        const canManage = await canResellerManageOrder(req.user.id, repairOrder);
        if (!canManage) {
          return res.status(403).send("Access denied");
        }
      }
      if (req.user.role === 'repair_center' && repairOrder.repairCenterId !== req.user.repairCenterId) {
        return res.status(403).send("Access denied");
      }
      
      res.json(appointment);
    } catch (error: any) {
      res.status(400).send(error.message);
    }
  });

  // GET /api/repair-orders/:id/delivery-document - Generate delivery PDF document
  app.get("/api/repair-orders/:id/delivery-document", requireAuth, async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      const repairOrder = await storage.getRepairOrder(req.params.id);
      if (!repairOrder) {
        return res.status(404).send("Repair order not found");
      }
      
      // RBAC
      if (req.user.role === 'customer' && repairOrder.customerId !== req.user.id) {
        return res.status(403).send("Access denied");
      }
      if (req.user.role === 'reseller') {
        let hasAccess = repairOrder.resellerId === req.user.id;
        if (!hasAccess && repairOrder.customerId) {
          const customer = await storage.getUser(repairOrder.customerId);
          hasAccess = !!(customer && customer.resellerId === req.user.id);
        }
        if (!hasAccess) return res.status(403).send("Access denied");
      }
      if (req.user.role === 'repair_center' && repairOrder.repairCenterId !== req.user.repairCenterId) {
        return res.status(403).send("Access denied");
      }
      
      const delivery = await storage.getDelivery(req.params.id);
      if (!delivery) {
        return res.status(404).send("Delivery record not found");
      }
      
      // Get customer info
      const customer = repairOrder.customerId ? await storage.getUser(repairOrder.customerId) : null;
      
      // Get repair center info if available
      const repairCenter = repairOrder.repairCenterId ? await storage.getRepairCenter(repairOrder.repairCenterId) : null;
      
      // Get acceptance info
      const acceptance = await storage.getRepairAcceptance(req.params.id);
      
      // Get diagnostics info
      const diagnostics = await storage.getRepairDiagnostics(req.params.id);
      
      // Get quote info
      const quote = await storage.getRepairQuote(req.params.id);
      
      // Format currency helper (Italian format: € 1.234,56) - values are in cents
      const formatCurrency = (cents: number | null | undefined) => {
        if (cents == null) return '€ 0,00';
        return new Intl.NumberFormat('it-IT', {
          style: 'currency',
          currency: 'EUR',
        }).format(cents / 100);
      };
      
      // Generate PDF
      const PDFDocument = (await import('pdfkit')).default;
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="consegna-${repairOrder.orderNumber}.pdf"`);
      
      doc.pipe(res);
      
      // Header
      doc.fontSize(20).font('Helvetica-Bold').text('DOCUMENTO DI CONSEGNA', { align: 'center' });
      doc.moveDown();
      
      // Repair center info (if available)
      if (repairCenter) {
        doc.fontSize(12).font('Helvetica-Bold').text(repairCenter.name);
        if (repairCenter.address) doc.font('Helvetica').text(repairCenter.address);
        if (repairCenter.phone) doc.text(`Tel: ${repairCenter.phone}`);
        if (repairCenter.email) doc.text(`Email: ${repairCenter.email}`);
        doc.moveDown();
      }
      
      // Order info box
      doc.rect(50, doc.y, 500, 60).stroke();
      const boxY = doc.y + 10;
      doc.fontSize(10).font('Helvetica-Bold').text('ORDINE DI RIPARAZIONE', 60, boxY);
      doc.font('Helvetica').text(`Numero: ${repairOrder.orderNumber}`, 60, boxY + 15);
      doc.text(`Data Consegna: ${new Date(delivery.deliveredAt).toLocaleDateString('it-IT')}`, 60, boxY + 30);
      doc.text(`Ora: ${new Date(delivery.deliveredAt).toLocaleTimeString('it-IT')}`, 300, boxY + 30);
      doc.y = boxY + 50;
      doc.moveDown();
      
      // Customer info
      doc.fontSize(12).font('Helvetica-Bold').text('DATI CLIENTE', { align: 'left' });
      doc.fontSize(10).font('Helvetica');
      if (customer) {
        doc.text(`Nome: ${customer.fullName || customer.username || ''}`, { align: 'left' });
        if (customer.email) doc.text(`Email: ${customer.email}`, { align: 'left' });
        if (customer.phone) doc.text(`Telefono: ${customer.phone}`, { align: 'left' });
      }
      doc.moveDown();
      
      // Device info
      doc.fontSize(12).font('Helvetica-Bold').text('DISPOSITIVO RIPARATO', { align: 'left' });
      doc.fontSize(10).font('Helvetica');
      doc.text(`Tipo: ${repairOrder.deviceType || 'N/A'}`, { align: 'left' });
      doc.text(`Modello: ${repairOrder.deviceModel || 'N/A'}`, { align: 'left' });
      if (acceptance?.imei) doc.text(`IMEI/Seriale: ${acceptance.imei}`, { align: 'left' });
      if (repairOrder.issueDescription) doc.text(`Problema originale: ${repairOrder.issueDescription}`, { align: 'left' });
      doc.moveDown();
      
      // Repair summary
      doc.fontSize(12).font('Helvetica-Bold').text('RIEPILOGO RIPARAZIONE', { align: 'left' });
      doc.fontSize(10).font('Helvetica');
      if (diagnostics?.diagnosis) doc.text(`Diagnosi: ${diagnostics.diagnosis}`, { align: 'left' });
      if (quote) {
        doc.text(`Totale Parti: ${formatCurrency(quote.partsTotal)}`, { align: 'left' });
        doc.text(`Totale Manodopera: ${formatCurrency(quote.laborTotal)}`, { align: 'left' });
        doc.font('Helvetica-Bold').text(`TOTALE: ${formatCurrency(quote.totalAmount)}`, { align: 'left' });
        doc.font('Helvetica');
      }
      doc.moveDown();
      
      // Delivery info
      doc.fontSize(12).font('Helvetica-Bold').text('DATI CONSEGNA', { align: 'left' });
      doc.fontSize(10).font('Helvetica');
      doc.text(`Ritirato da: ${delivery.deliveredTo}`, { align: 'left' });
      const methodLabels: Record<string, string> = {
        'in_store': 'Ritiro in Negozio',
        'courier': 'Spedizione Corriere',
        'pickup': 'Ritiro Cliente'
      };
      doc.text(`Metodo: ${methodLabels[delivery.deliveryMethod] || delivery.deliveryMethod}`, { align: 'left' });
      if (delivery.idDocumentType) {
        const docTypeLabels: Record<string, string> = {
          'id_card': "Carta d'Identità",
          'drivers_license': 'Patente',
          'passport': 'Passaporto',
          'other': 'Altro'
        };
        doc.text(`Documento: ${docTypeLabels[delivery.idDocumentType] || delivery.idDocumentType} - ${delivery.idDocumentNumber || ''}`, { align: 'left' });
      }
      if (delivery.notes) doc.text(`Note: ${delivery.notes}`, { align: 'left' });
      doc.moveDown(2);
      
      // Signature areas
      doc.fontSize(10).font('Helvetica');
      const signatureY = doc.y;
      
      // Customer signature
      doc.text('Firma del Cliente:', 60, signatureY);
      if (delivery.customerSignature) {
        try {
          const customerSigBuffer = Buffer.from(delivery.customerSignature.replace(/^data:image\/\w+;base64,/, ''), 'base64');
          doc.image(customerSigBuffer, 60, signatureY + 15, { width: 150, height: 60 });
          doc.text(delivery.customerSignerName || delivery.deliveredTo, 60, signatureY + 80);
          if (delivery.customerSignedAt) {
            doc.fontSize(8).text(`Firmato: ${new Date(delivery.customerSignedAt).toLocaleString('it-IT')}`, 60, signatureY + 95);
          }
        } catch (e) {
          doc.text('_______________________________', 60, signatureY + 15);
        }
      } else {
        doc.text('_______________________________', 60, signatureY + 15);
      }
      
      // Technician signature
      doc.fontSize(10).text('Firma del Tecnico:', 320, signatureY);
      if (delivery.technicianSignature) {
        try {
          const techSigBuffer = Buffer.from(delivery.technicianSignature.replace(/^data:image\/\w+;base64,/, ''), 'base64');
          doc.image(techSigBuffer, 320, signatureY + 15, { width: 150, height: 60 });
          doc.text(delivery.technicianSignerName || '', 320, signatureY + 80);
          if (delivery.technicianSignedAt) {
            doc.fontSize(8).text(`Firmato: ${new Date(delivery.technicianSignedAt).toLocaleString('it-IT')}`, 320, signatureY + 95);
          }
        } catch (e) {
          doc.text('_______________________________', 320, signatureY + 15);
        }
      } else {
        doc.text('_______________________________', 320, signatureY + 15);
      }
      
      doc.y = signatureY + 110;
      doc.moveDown(2);
      
      // Footer
      doc.fontSize(8).font('Helvetica').text(
        'Questo documento certifica la consegna del dispositivo riparato. ' +
        'Il cliente conferma di aver ricevuto il dispositivo nelle condizioni descritte.',
        { align: 'center' }
      );
      doc.text(`Documento generato il ${new Date().toLocaleDateString('it-IT')} alle ${new Date().toLocaleTimeString('it-IT')}`, { align: 'center' });
      
      doc.end();
    } catch (error: any) {
      res.status(400).send(error.message);
    }
  });

  // GET /api/repair-orders/:id/intake-document - Generate intake/acceptance PDF document
  app.get("/api/repair-orders/:id/intake-document", requireAuth, async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      const repairOrder = await storage.getRepairOrder(req.params.id);
      if (!repairOrder) {
        return res.status(404).send("Repair order not found");
      }
      
      // RBAC
      if (req.user.role === 'customer' && repairOrder.customerId !== req.user.id) {
        return res.status(403).send("Access denied");
      }
      if (req.user.role === 'reseller') {
        let hasAccess = repairOrder.resellerId === req.user.id;
        if (!hasAccess && repairOrder.customerId) {
          const customerForAccess = await storage.getUser(repairOrder.customerId);
          hasAccess = !!(customerForAccess && customerForAccess.resellerId === req.user.id);
        }
        if (!hasAccess) return res.status(403).send("Access denied");
      }
      if (req.user.role === 'repair_center' && repairOrder.repairCenterId !== req.user.repairCenterId) {
        return res.status(403).send("Access denied");
      }
      
      // Get customer info
      const customer = repairOrder.customerId ? await storage.getUser(repairOrder.customerId) : null;
      
      // Get repair center info if available
      const repairCenter = repairOrder.repairCenterId ? await storage.getRepairCenter(repairOrder.repairCenterId) : null;
      
      // Get acceptance info
      const acceptance = await storage.getRepairAcceptance(req.params.id);
      
      // Get device brand and model names
      let brandName = repairOrder.brand || '';
      let modelName = repairOrder.deviceModel || '';
      
      // Try to get brand name from database
      if (repairOrder.brand) {
        const brand = await storage.getDeviceBrand(repairOrder.brand);
        if (brand) brandName = brand.name;
      }
      
      // Try to get model name from database
      if (repairOrder.deviceModel) {
        const model = await storage.getDeviceModel(repairOrder.deviceModel);
        if (model) modelName = model.name;
      }
      
      // Get device type name
      let deviceTypeName = repairOrder.deviceType || '';
      if (repairOrder.deviceType) {
        const deviceType = await storage.getDeviceType(repairOrder.deviceType);
        if (deviceType) deviceTypeName = deviceType.name;
      }
      
      // Generate PDF
      const PDFDocument = (await import('pdfkit')).default;
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="accettazione-${repairOrder.orderNumber}.pdf"`);
      
      doc.pipe(res);
      
      // Header
      doc.fontSize(20).font('Helvetica-Bold').text('DOCUMENTO DI ACCETTAZIONE', { align: 'center' });
      doc.fontSize(12).font('Helvetica').text('Modulo di Ingresso Riparazione', { align: 'center' });
      doc.moveDown();
      
      // Repair center info (if available)
      if (repairCenter) {
        doc.fontSize(12).font('Helvetica-Bold').text(repairCenter.name);
        if (repairCenter.address) doc.font('Helvetica').text(repairCenter.address);
        if (repairCenter.phone) doc.text(`Tel: ${repairCenter.phone}`);
        if (repairCenter.email) doc.text(`Email: ${repairCenter.email}`);
        doc.moveDown();
      }
      
      // Order info box
      const ingressDate = repairOrder.ingressatoAt ? new Date(repairOrder.ingressatoAt) : new Date(repairOrder.createdAt);
      doc.rect(50, doc.y, 500, 60).stroke();
      const boxY = doc.y + 10;
      doc.fontSize(10).font('Helvetica-Bold').text('ORDINE DI RIPARAZIONE', 60, boxY);
      doc.font('Helvetica').text(`Numero: ${repairOrder.orderNumber}`, 60, boxY + 15);
      doc.text(`Data Ingresso: ${ingressDate.toLocaleDateString('it-IT')}`, 60, boxY + 30);
      doc.text(`Ora: ${ingressDate.toLocaleTimeString('it-IT')}`, 300, boxY + 30);
      doc.y = boxY + 50;
      doc.x = 50; // Reset x position after box
      doc.moveDown();
      
      // Customer info
      doc.fontSize(12).font('Helvetica-Bold').text('DATI CLIENTE', { align: 'left' });
      doc.fontSize(10).font('Helvetica');
      if (customer) {
        doc.text(`Nome: ${customer.fullName || customer.username || ''}`, { align: 'left' });
        if (customer.email) doc.text(`Email: ${customer.email}`, { align: 'left' });
        if (customer.phone) doc.text(`Telefono: ${customer.phone}`, { align: 'left' });
        if (customer.address) doc.text(`Indirizzo: ${customer.address}`, { align: 'left' });
      }
      doc.moveDown();
      
      // Device info
      doc.fontSize(12).font('Helvetica-Bold').text('DATI DISPOSITIVO', { align: 'left' });
      doc.fontSize(10).font('Helvetica');
      doc.text(`Tipo Dispositivo: ${deviceTypeName || 'N/A'}`, { align: 'left' });
      doc.text(`Marca: ${brandName || 'N/A'}`);
      doc.text(`Modello: ${modelName || 'N/A'}`);
      
      // IMEI/Serial info
      if (repairOrder.imei) {
        doc.text(`IMEI: ${repairOrder.imei}`);
      }
      if (repairOrder.serialNumber) {
        doc.text(`Numero Seriale: ${repairOrder.serialNumber}`);
      }
      if (repairOrder.imeiNotReadable) {
        doc.text('IMEI: Non leggibile');
      }
      if (repairOrder.imeiNotPresent) {
        doc.text('IMEI: Non presente sul dispositivo');
      }
      doc.moveDown();
      
      // Problem description
      doc.fontSize(12).font('Helvetica-Bold').text('PROBLEMA RISCONTRATO');
      doc.fontSize(10).font('Helvetica');
      doc.text(repairOrder.issueDescription || 'N/A');
      doc.moveDown();
      
      // Acceptance details (if available)
      if (acceptance) {
        // Declared defects
        if (acceptance.declaredDefects && acceptance.declaredDefects.length > 0) {
          doc.fontSize(12).font('Helvetica-Bold').text('DIFETTI DICHIARATI DAL CLIENTE');
          doc.fontSize(10).font('Helvetica');
          acceptance.declaredDefects.forEach((defect: string) => {
            doc.text(`• ${defect}`);
          });
          doc.moveDown();
        }
        
        // Aesthetic condition
        doc.fontSize(12).font('Helvetica-Bold').text('CONDIZIONE ESTETICA');
        doc.fontSize(10).font('Helvetica');
        const aestheticLabels: Record<string, string> = {
          'nuovo': 'Nuovo/Come Nuovo',
          'ottimo': 'Ottimo',
          'buono': 'Buono',
          'discreto': 'Discreto',
          'usato': 'Usato',
          'danneggiato': 'Danneggiato'
        };
        doc.text(`Condizione: ${aestheticLabels[acceptance.aestheticCondition || ''] || acceptance.aestheticCondition || 'N/A'}`);
        if (acceptance.aestheticNotes) {
          doc.text(`Note estetiche: ${acceptance.aestheticNotes}`);
        }
        doc.moveDown();
        
        // Accessories
        if (acceptance.accessories && acceptance.accessories.length > 0) {
          doc.fontSize(12).font('Helvetica-Bold').text('ACCESSORI CONSEGNATI');
          doc.fontSize(10).font('Helvetica');
          acceptance.accessories.forEach((acc: string) => {
            doc.text(`• ${acc}`);
          });
          doc.moveDown();
        }
        
        // Lock code info
        if (acceptance.hasLockCode) {
          doc.fontSize(12).font('Helvetica-Bold').text('CODICE DI SBLOCCO');
          doc.fontSize(10).font('Helvetica');
          if (acceptance.lockCode) {
            doc.text(`Codice: ${acceptance.lockCode}`);
          }
          if (acceptance.lockPattern) {
            doc.text(`Pattern: ${acceptance.lockPattern}`);
          }
          doc.moveDown();
        }
      }
      
      // Notes
      if (repairOrder.notes) {
        doc.fontSize(12).font('Helvetica-Bold').text('NOTE AGGIUNTIVE');
        doc.fontSize(10).font('Helvetica');
        doc.text(repairOrder.notes);
        doc.moveDown();
      }
      
      // Terms and conditions
      doc.moveDown();
      doc.fontSize(8).font('Helvetica').text(
        'CONDIZIONI DI ACCETTAZIONE:\n' +
        '1. Il dispositivo viene accettato nelle condizioni sopra descritte.\n' +
        '2. La diagnosi e il preventivo verranno comunicati al cliente prima di procedere con la riparazione.\n' +
        '3. Il cliente autorizza il centro assistenza ad aprire il dispositivo per la diagnosi.\n' +
        '4. Il centro non è responsabile per dati presenti sul dispositivo.\n' +
        '5. Il dispositivo non ritirato entro 30 giorni dalla comunicazione di fine lavori potrà essere smaltito.',
        { align: 'left' }
      );
      doc.moveDown(2);
      
      // Signature areas
      doc.fontSize(10).font('Helvetica');
      doc.text('_______________________________', 60);
      doc.text('Firma del Cliente', 60);
      doc.text('_______________________________', 320);
      doc.text('Firma del Tecnico', 320);
      doc.moveDown(2);
      
      // Footer
      doc.fontSize(8).font('Helvetica').text(
        `Documento generato il ${new Date().toLocaleDateString('it-IT')} alle ${new Date().toLocaleTimeString('it-IT')}`,
        { align: 'center' }
      );
      
      doc.end();
    } catch (error: any) {
      res.status(400).send(error.message);
    }
  });

  // GET /api/repair-orders/:id/diagnosis-document - Generate diagnosis PDF document
  app.get("/api/repair-orders/:id/diagnosis-document", requireAuth, async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      const repairOrder = await storage.getRepairOrder(req.params.id);
      if (!repairOrder) {
        return res.status(404).send("Repair order not found");
      }
      
      // RBAC
      if (req.user.role === 'customer' && repairOrder.customerId !== req.user.id) {
        return res.status(403).send("Access denied");
      }
      if (req.user.role === 'reseller') {
        let hasAccess = repairOrder.resellerId === req.user.id;
        if (!hasAccess && repairOrder.customerId) {
          const customer = await storage.getUser(repairOrder.customerId);
          hasAccess = !!(customer && customer.resellerId === req.user.id);
        }
        if (!hasAccess) return res.status(403).send("Access denied");
      }
      if (req.user.role === 'repair_center' && repairOrder.repairCenterId !== req.user.repairCenterId) {
        return res.status(403).send("Access denied");
      }
      
      // Get diagnostics info - required for this document
      const diagnostics = await storage.getRepairDiagnostics(req.params.id);
      if (!diagnostics) {
        return res.status(404).send("Diagnosi non ancora effettuata");
      }
      
      // Get customer info
      const customer = repairOrder.customerId ? await storage.getUser(repairOrder.customerId) : null;
      
      // Get repair center info if available
      const repairCenter = repairOrder.repairCenterId ? await storage.getRepairCenter(repairOrder.repairCenterId) : null;
      
      // Get acceptance info
      const acceptance = await storage.getRepairAcceptance(req.params.id);
      
      // Get technician who performed diagnosis
      const technician = diagnostics.diagnosedBy ? await storage.getUser(diagnostics.diagnosedBy) : null;
      
      // Get device brand and model names
      let brandName = repairOrder.brand || '';
      let modelName = repairOrder.deviceModel || '';
      
      if (repairOrder.brand) {
        const brand = await storage.getDeviceBrand(repairOrder.brand);
        if (brand) brandName = brand.name;
      }
      
      if (repairOrder.deviceModel) {
        const model = await storage.getDeviceModel(repairOrder.deviceModel);
        if (model) modelName = model.name;
      }
      
      // Get device type name
      let deviceTypeName = repairOrder.deviceType || '';
      if (repairOrder.deviceType) {
        const deviceType = await storage.getDeviceType(repairOrder.deviceType);
        if (deviceType) deviceTypeName = deviceType.name;
      }
      
      // Generate PDF
      const PDFDocument = (await import('pdfkit')).default;
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="diagnosi-${repairOrder.orderNumber}.pdf"`);
      
      doc.pipe(res);
      
      // Header
      doc.fontSize(20).font('Helvetica-Bold').text('RAPPORTO DI DIAGNOSI', { align: 'center' });
      doc.fontSize(12).font('Helvetica').text('Esito Diagnosi Tecnica', { align: 'center' });
      doc.moveDown();
      
      // Repair center info (if available)
      if (repairCenter) {
        doc.fontSize(12).font('Helvetica-Bold').text(repairCenter.name);
        if (repairCenter.address) doc.font('Helvetica').text(repairCenter.address);
        if (repairCenter.phone) doc.text(`Tel: ${repairCenter.phone}`);
        if (repairCenter.email) doc.text(`Email: ${repairCenter.email}`);
        doc.moveDown();
      }
      
      // Order info box
      const diagnosisDate = diagnostics.diagnosedAt ? new Date(diagnostics.diagnosedAt) : new Date();
      doc.rect(50, doc.y, 500, 60).stroke();
      const boxY = doc.y + 10;
      doc.fontSize(10).font('Helvetica-Bold').text('ORDINE DI RIPARAZIONE', 60, boxY);
      doc.font('Helvetica').text(`Numero: ${repairOrder.orderNumber}`, 60, boxY + 15);
      doc.text(`Data Diagnosi: ${diagnosisDate.toLocaleDateString('it-IT')}`, 60, boxY + 30);
      doc.text(`Ora: ${diagnosisDate.toLocaleTimeString('it-IT')}`, 300, boxY + 30);
      doc.y = boxY + 50;
      doc.x = 50; // Reset x position after box
      doc.moveDown();
      
      // Customer info
      doc.fontSize(12).font('Helvetica-Bold').text('DATI CLIENTE', { align: 'left' });
      doc.fontSize(10).font('Helvetica');
      if (customer) {
        doc.text(`Nome: ${customer.fullName || customer.username || ''}`, { align: 'left' });
        if (customer.email) doc.text(`Email: ${customer.email}`, { align: 'left' });
        if (customer.phone) doc.text(`Telefono: ${customer.phone}`, { align: 'left' });
      }
      doc.moveDown();
      
      // Device info
      doc.fontSize(12).font('Helvetica-Bold').text('DISPOSITIVO', { align: 'left' });
      doc.fontSize(10).font('Helvetica');
      doc.text(`Tipo: ${deviceTypeName || 'N/A'}`, { align: 'left' });
      doc.text(`Marca: ${brandName || 'N/A'}`, { align: 'left' });
      doc.text(`Modello: ${modelName || 'N/A'}`, { align: 'left' });
      if (repairOrder.imei) doc.text(`IMEI: ${repairOrder.imei}`, { align: 'left' });
      if (repairOrder.serialNumber) doc.text(`Seriale: ${repairOrder.serialNumber}`, { align: 'left' });
      doc.moveDown();
      
      // Original problem
      doc.fontSize(12).font('Helvetica-Bold').text('PROBLEMA ORIGINALE', { align: 'left' });
      doc.fontSize(10).font('Helvetica');
      doc.text(repairOrder.issueDescription || 'N/A', { align: 'left' });
      doc.moveDown();
      
      // Technical Diagnosis
      doc.fontSize(12).font('Helvetica-Bold').text('DIAGNOSI TECNICA', { align: 'left' });
      doc.fontSize(10).font('Helvetica');
      doc.text(diagnostics.technicalDiagnosis || 'N/A', { align: 'left' });
      doc.moveDown();
      
      // Damaged components
      if (diagnostics.damagedComponents && diagnostics.damagedComponents.length > 0) {
        doc.fontSize(12).font('Helvetica-Bold').text('COMPONENTI DANNEGGIATI');
        doc.fontSize(10).font('Helvetica');
        diagnostics.damagedComponents.forEach((component: string) => {
          doc.text(`• ${component}`);
        });
        doc.moveDown();
      }
      
      // Valutation details
      doc.fontSize(12).font('Helvetica-Bold').text('VALUTAZIONE');
      doc.fontSize(10).font('Helvetica');
      
      if (diagnostics.estimatedRepairTime) {
        const hours = diagnostics.estimatedRepairTime;
        const timeText = hours >= 24 
          ? `${Math.floor(hours / 24)} giorni e ${hours % 24} ore`
          : `${hours} ore`;
        doc.text(`Tempo Stimato Riparazione: ${timeText}`);
      }
      
      doc.text(`Necessita Ricambi Esterni: ${diagnostics.requiresExternalParts ? 'Sì' : 'No'}`);
      doc.moveDown();
      
      // Diagnosis notes
      if (diagnostics.diagnosisNotes) {
        doc.fontSize(12).font('Helvetica-Bold').text('NOTE DEL TECNICO');
        doc.fontSize(10).font('Helvetica');
        doc.text(diagnostics.diagnosisNotes);
        doc.moveDown();
      }
      
      // Technician info
      doc.fontSize(12).font('Helvetica-Bold').text('TECNICO RESPONSABILE');
      doc.fontSize(10).font('Helvetica');
      doc.text(technician ? (technician.fullName || technician.username) : 'N/A');
      doc.moveDown();
      
      // Next steps
      doc.moveDown();
      doc.fontSize(10).font('Helvetica-Bold').text('PROSSIMI PASSI:');
      doc.fontSize(9).font('Helvetica').text(
        'A seguito della presente diagnosi, verrà elaborato un preventivo dettagliato con i costi di riparazione.\n' +
        'Il cliente sarà contattato per la conferma o il rifiuto del preventivo prima di procedere con la riparazione.',
        { align: 'left' }
      );
      doc.moveDown(2);
      
      // Signature areas
      doc.fontSize(10).font('Helvetica');
      doc.text('_______________________________', 60);
      doc.text('Firma Tecnico', 60);
      doc.text('_______________________________', 320);
      doc.text('Timbro Centro Assistenza', 320);
      doc.moveDown(2);
      
      // Footer
      doc.fontSize(8).font('Helvetica').text(
        `Documento generato il ${new Date().toLocaleDateString('it-IT')} alle ${new Date().toLocaleTimeString('it-IT')}`,
        { align: 'center' }
      );
      
      doc.end();
    } catch (error: any) {
      res.status(400).send(error.message);
    }
  });

  // GET /api/repair-orders/:id/quote-document - Generate quote PDF document
  app.get("/api/repair-orders/:id/quote-document", requireAuth, async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      const repairOrder = await storage.getRepairOrder(req.params.id);
      if (!repairOrder) {
        return res.status(404).send("Repair order not found");
      }
      
      // RBAC
      if (req.user.role === 'customer' && repairOrder.customerId !== req.user.id) {
        return res.status(403).send("Access denied");
      }
      if (req.user.role === 'reseller') {
        let hasAccess = repairOrder.resellerId === req.user.id;
        if (!hasAccess && repairOrder.customerId) {
          const customer = await storage.getUser(repairOrder.customerId);
          hasAccess = !!(customer && customer.resellerId === req.user.id);
        }
        if (!hasAccess) return res.status(403).send("Access denied");
      }
      if (req.user.role === 'repair_center' && repairOrder.repairCenterId !== req.user.repairCenterId) {
        return res.status(403).send("Access denied");
      }
      
      // Get quote info - required for this document
      const quote = await storage.getRepairQuote(req.params.id);
      if (!quote) {
        return res.status(404).send("Preventivo non ancora creato");
      }
      
      // Get customer info
      const customer = repairOrder.customerId ? await storage.getUser(repairOrder.customerId) : null;
      
      // Get repair center info if available
      const repairCenter = repairOrder.repairCenterId ? await storage.getRepairCenter(repairOrder.repairCenterId) : null;
      
      // Get device brand and model names
      let brandName = repairOrder.brand || '';
      let modelName = repairOrder.deviceModel || '';
      
      if (repairOrder.brand) {
        const brand = await storage.getDeviceBrand(repairOrder.brand);
        if (brand) brandName = brand.name;
      }
      
      if (repairOrder.deviceModel) {
        const model = await storage.getDeviceModel(repairOrder.deviceModel);
        if (model) modelName = model.name;
      }
      
      // Get device type name
      let deviceTypeName = repairOrder.deviceType || '';
      if (repairOrder.deviceType) {
        const deviceType = await storage.getDeviceType(repairOrder.deviceType);
        if (deviceType) deviceTypeName = deviceType.name;
      }
      
      // Parse parts from quote
      let parts: Array<{ name: string; quantity: number; unitPrice: number }> = [];
      if (quote.parts) {
        try {
          parts = typeof quote.parts === 'string' ? JSON.parse(quote.parts) : quote.parts;
        } catch (e) {
          parts = [];
        }
      }
      
      // Format currency helper (Italian format: € 1.234,56) - values are in cents
      const formatCurrency = (cents: number | null | undefined) => {
        if (cents == null) return '€ 0,00';
        return new Intl.NumberFormat('it-IT', {
          style: 'currency',
          currency: 'EUR',
        }).format(cents / 100);
      };
      
      // Generate PDF
      const PDFDocument = (await import('pdfkit')).default;
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="preventivo-${quote.quoteNumber}.pdf"`);
      
      doc.pipe(res);
      
      // Header
      doc.fontSize(20).font('Helvetica-Bold').text('PREVENTIVO DI RIPARAZIONE', { align: 'center' });
      doc.fontSize(14).font('Helvetica').text(`N. ${quote.quoteNumber}`, { align: 'center' });
      doc.moveDown();
      
      // Repair center info (if available)
      if (repairCenter) {
        doc.fontSize(12).font('Helvetica-Bold').text(repairCenter.name);
        if (repairCenter.address) doc.font('Helvetica').text(repairCenter.address);
        if (repairCenter.phone) doc.text(`Tel: ${repairCenter.phone}`);
        if (repairCenter.email) doc.text(`Email: ${repairCenter.email}`);
        doc.moveDown();
      }
      
      // Quote info box
      const quoteDate = quote.createdAt ? new Date(quote.createdAt) : new Date();
      doc.rect(50, doc.y, 500, 70).stroke();
      const boxY = doc.y + 10;
      doc.fontSize(10).font('Helvetica-Bold').text('RIFERIMENTO RIPARAZIONE', 60, boxY);
      doc.font('Helvetica').text(`Ordine: ${repairOrder.orderNumber}`, 60, boxY + 15);
      doc.text(`Data Preventivo: ${quoteDate.toLocaleDateString('it-IT')}`, 60, boxY + 30);
      if (quote.validUntil) {
        const validDate = new Date(quote.validUntil);
        doc.text(`Valido Fino Al: ${validDate.toLocaleDateString('it-IT')}`, 60, boxY + 45);
      }
      
      // Status badge
      const statusLabels: Record<string, string> = {
        'draft': 'Bozza',
        'sent': 'Inviato',
        'accepted': 'Accettato',
        'rejected': 'Rifiutato',
      };
      doc.text(`Stato: ${statusLabels[quote.status] || quote.status}`, 350, boxY + 15);
      
      doc.y = boxY + 60;
      doc.x = 50; // Reset x position after box
      doc.moveDown();
      
      // Customer info
      doc.fontSize(12).font('Helvetica-Bold').text('DATI CLIENTE', { align: 'left' });
      doc.fontSize(10).font('Helvetica');
      if (customer) {
        doc.text(`Nome: ${customer.fullName || customer.username || ''}`, { align: 'left' });
        if (customer.email) doc.text(`Email: ${customer.email}`, { align: 'left' });
        if (customer.phone) doc.text(`Telefono: ${customer.phone}`);
      }
      doc.moveDown();
      
      // Device info
      doc.fontSize(12).font('Helvetica-Bold').text('DISPOSITIVO');
      doc.fontSize(10).font('Helvetica');
      doc.text(`Tipo: ${deviceTypeName || 'N/A'}`);
      doc.text(`Marca: ${brandName || 'N/A'}`);
      doc.text(`Modello: ${modelName || 'N/A'}`);
      if (repairOrder.imei) doc.text(`IMEI: ${repairOrder.imei}`);
      if (repairOrder.serialNumber) doc.text(`Seriale: ${repairOrder.serialNumber}`);
      doc.moveDown();
      
      // Problem description
      doc.fontSize(12).font('Helvetica-Bold').text('PROBLEMA RISCONTRATO');
      doc.fontSize(10).font('Helvetica');
      doc.text(repairOrder.issueDescription || 'N/A');
      doc.moveDown();
      
      // Parts table
      if (parts.length > 0) {
        doc.fontSize(12).font('Helvetica-Bold').text('DETTAGLIO RICAMBI');
        doc.moveDown(0.5);
        
        // Table header
        const tableTop = doc.y;
        doc.fontSize(9).font('Helvetica-Bold');
        doc.text('Descrizione', 60, tableTop);
        doc.text('Qtà', 320, tableTop);
        doc.text('Prezzo Unit.', 370, tableTop);
        doc.text('Totale', 460, tableTop);
        
        doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke();
        
        let currentY = tableTop + 20;
        doc.fontSize(9).font('Helvetica');
        
        parts.forEach((part) => {
          const lineTotal = part.quantity * part.unitPrice;
          doc.text(part.name, 60, currentY, { width: 250 });
          doc.text(part.quantity.toString(), 320, currentY);
          doc.text(formatCurrency(part.unitPrice), 370, currentY);
          doc.text(formatCurrency(lineTotal), 460, currentY);
          currentY += 18;
        });
        
        doc.moveTo(50, currentY).lineTo(550, currentY).stroke();
        doc.y = currentY + 10;
        doc.moveDown();
      }
      
      // Totals section
      doc.fontSize(12).font('Helvetica-Bold').text('RIEPILOGO COSTI', { align: 'left' });
      doc.moveDown(0.5);
      
      let currentTotalsY = doc.y;
      doc.fontSize(10).font('Helvetica');
      
      // Parts subtotal
      const partsSubtotal = parts.reduce((sum, p) => sum + (p.quantity * p.unitPrice), 0);
      if (parts.length > 0) {
        doc.text('Subtotale Ricambi:', 350, currentTotalsY);
        doc.text(formatCurrency(partsSubtotal), 460, currentTotalsY);
        currentTotalsY += 18;
      }
      
      // Labor cost - always show if greater than 0
      if (quote.laborCost && quote.laborCost > 0) {
        doc.text('Manodopera:', 350, currentTotalsY);
        doc.text(formatCurrency(quote.laborCost), 460, currentTotalsY);
        currentTotalsY += 18;
      }
      
      // Total line
      currentTotalsY += 5;
      doc.moveTo(350, currentTotalsY).lineTo(550, currentTotalsY).stroke();
      currentTotalsY += 8;
      doc.fontSize(12).font('Helvetica-Bold');
      doc.text('TOTALE:', 350, currentTotalsY);
      doc.text(formatCurrency(quote.totalAmount), 460, currentTotalsY);
      
      doc.y = currentTotalsY + 30;
      doc.moveDown();
      
      // Notes
      if (quote.notes) {
        doc.fontSize(12).font('Helvetica-Bold').text('NOTE');
        doc.fontSize(10).font('Helvetica');
        doc.text(quote.notes);
        doc.moveDown();
      }
      
      // Terms and conditions
      doc.moveDown();
      doc.fontSize(8).font('Helvetica').text(
        'CONDIZIONI DEL PREVENTIVO:\n' +
        '1. I prezzi indicati sono IVA inclusa salvo diversa indicazione.\n' +
        '2. Il preventivo ha validità di 15 giorni dalla data di emissione, salvo diversa indicazione.\n' +
        '3. I tempi di riparazione sono indicativi e possono variare in base alla disponibilità dei ricambi.\n' +
        '4. L\'accettazione del preventivo autorizza il centro a procedere con la riparazione.\n' +
        '5. In caso di rifiuto, il dispositivo verrà restituito senza alcun costo aggiuntivo.',
        { align: 'left' }
      );
      doc.moveDown(2);
      
      // Signature areas
      doc.fontSize(10).font('Helvetica');
      doc.text('_______________________________', 60);
      doc.text('Firma per Accettazione Cliente', 60);
      doc.text('_______________________________', 320);
      doc.text('Timbro Centro Assistenza', 320);
      doc.moveDown(2);
      
      // Footer
      doc.fontSize(8).font('Helvetica').text(
        `Documento generato il ${new Date().toLocaleDateString('it-IT')} alle ${new Date().toLocaleTimeString('it-IT')}`,
        { align: 'center' }
      );
      
      doc.end();
    } catch (error: any) {
      res.status(400).send(error.message);
    }
  });

  // ============ REPORTS & EXPORT ============

  app.get("/api/reports/repairs", requireAuth, async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      // Only admin can generate reports
      if (req.user.role !== 'admin') {
        return res.status(403).send("Only admins can generate reports");
      }
      
      const filters: any = {};
      
      if (req.query.status) filters.status = req.query.status as string;
      if (req.query.repairCenterId) filters.repairCenterId = req.query.repairCenterId as string;
      
      const repairs = await storage.listRepairOrders(filters);
      
      // If Excel export requested
      if (req.query.format === 'excel') {
        const ExcelJS = await import('exceljs');
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Riparazioni');
        
        worksheet.columns = [
          { header: 'Numero Ordine', key: 'orderNumber', width: 15 },
          { header: 'Tipo Dispositivo', key: 'deviceType', width: 15 },
          { header: 'Modello', key: 'deviceModel', width: 20 },
          { header: 'Stato', key: 'status', width: 15 },
          { header: 'Costo Stimato', key: 'estimatedCost', width: 15 },
          { header: 'Costo Finale', key: 'finalCost', width: 15 },
          { header: 'Data Creazione', key: 'createdAt', width: 20 },
        ];
        
        repairs.forEach(repair => {
          worksheet.addRow({
            orderNumber: repair.orderNumber,
            deviceType: repair.deviceType,
            deviceModel: repair.deviceModel,
            status: repair.status,
            estimatedCost: repair.estimatedCost ? (repair.estimatedCost / 100).toFixed(2) : '',
            finalCost: repair.finalCost ? (repair.finalCost / 100).toFixed(2) : '',
            createdAt: repair.createdAt,
          });
        });
        
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=riparazioni.xlsx');
        
        await workbook.xlsx.write(res);
        res.end();
      } else {
        res.json(repairs);
      }
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  app.get("/api/reports/inventory", requireAuth, async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      // Only admin can generate reports
      if (req.user.role !== 'admin') {
        return res.status(403).send("Only admins can generate reports");
      }
      
      const movements = await storage.listInventoryMovements();
      
      // If Excel export requested
      if (req.query.format === 'excel') {
        const ExcelJS = await import('exceljs');
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Movimenti Inventario');
        
        worksheet.columns = [
          { header: 'Prodotto ID', key: 'productId', width: 36 },
          { header: 'Centro Riparazione ID', key: 'repairCenterId', width: 36 },
          { header: 'Tipo Movimento', key: 'movementType', width: 15 },
          { header: 'Quantità', key: 'quantity', width: 10 },
          { header: 'Note', key: 'notes', width: 30 },
          { header: 'Data Creazione', key: 'createdAt', width: 20 },
        ];
        
        movements.forEach(movement => {
          worksheet.addRow({
            productId: movement.productId,
            repairCenterId: movement.repairCenterId,
            movementType: movement.movementType,
            quantity: movement.quantity,
            notes: movement.notes || '',
            createdAt: movement.createdAt,
          });
        });
        
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=inventario.xlsx');
        
        await workbook.xlsx.write(res);
        res.end();
      } else {
        res.json(movements);
      }
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // ============ USER MANAGEMENT ============

  app.get("/api/users", requireAuth, async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      // Only admin can list all users
      if (req.user.role !== 'admin') {
        return res.status(403).send("Only admins can list users");
      }
      
      const allUsers = await storage.listUsers();
      const staffUsers = allUsers.filter(u => u.role !== 'customer');
      res.json(staffUsers);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  app.patch("/api/users/:id", requireAuth, async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      // Only admin can update other users
      if (req.user.role !== 'admin' && req.user.id !== req.params.id) {
        return res.status(403).send("Only admins can update other users");
      }
      
      const user = await storage.getUser(req.params.id);
      if (!user) {
        return res.status(404).send("User not found");
      }
      
      const allowedUpdates = req.user.role === 'admin' 
        ? ['username', 'email', 'fullName', 'role', 'isActive', 'repairCenterId', 'resellerCategory', 'resellerId', 'parentResellerId'] as const
        : ['email', 'fullName'] as const; // Non-admin can only update own profile fields
      
      const updates: any = {};
      
      for (const key of allowedUpdates) {
        if (req.body[key] !== undefined) {
          updates[key] = req.body[key];
        }
      }
      
      // Validate repairCenterId if provided
      if (updates.repairCenterId) {
        const center = await storage.getRepairCenter(updates.repairCenterId);
        if (!center) {
          return res.status(400).send("Invalid repair center ID");
        }
      }
      
      // Validate resellerCategory: only valid for reseller role
      if (updates.resellerCategory) {
        const targetRole = updates.role || user.role;
        if (targetRole !== 'reseller') {
          delete updates.resellerCategory; // Ignore resellerCategory for non-resellers
        } else if (!['standard', 'franchising', 'gdo'].includes(updates.resellerCategory)) {
          return res.status(400).send("Invalid reseller category");
        }
      }
      
      // Validate resellerId if provided (for customers)
      if (updates.resellerId !== undefined) {
        // Allow null to unassign customer from reseller
        if (updates.resellerId !== null) {
          const reseller = await storage.getUser(updates.resellerId);
          if (!reseller || reseller.role !== 'reseller') {
            return res.status(400).send("Invalid reseller ID");
          }
        }
      }
      
      // Validate parentResellerId if provided (for reseller hierarchy)
      if (updates.parentResellerId !== undefined) {
        // Allow null to unassign parent reseller
        if (updates.parentResellerId !== null) {
          const parentReseller = await storage.getUser(updates.parentResellerId);
          if (!parentReseller || parentReseller.role !== 'reseller') {
            return res.status(400).send("Invalid parent reseller ID");
          }
          // Prevent self-reference
          if (updates.parentResellerId === req.params.id) {
            return res.status(400).send("A reseller cannot be its own parent");
          }
        }
      }
      
      const updatedUser = await storage.updateUser(req.params.id, updates);
      
      setActivityEntity(res, { type: 'user', id: updatedUser.id });
      res.json(updatedUser);
    } catch (error: any) {
      res.status(400).send(error.message);
    }
  });

  // ============ CUSTOMER MANAGEMENT ============

  app.get("/api/customers", requireAuth, async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      let customers;
      
      switch (req.user.role) {
        case 'admin':
          // Admin sees all customers, optionally filtered by resellerId
          const resellerFilter = req.query.resellerId as string | undefined;
          customers = await storage.listCustomers(resellerFilter ? { resellerId: resellerFilter } : undefined);
          break;
        case 'reseller':
          // Use context switching to determine effective reseller/repair center
          const context = getEffectiveContext(req);
          if (context.repairCenterId) {
            // Acting as a specific repair center - show customers from that center's orders
            customers = await storage.listCustomers({ repairCenterId: context.repairCenterId });
          } else {
            // Acting as reseller (own or sub-reseller) - show their customers
            customers = await storage.listCustomers({ resellerId: context.resellerId });
          }
          break;
        case 'repair_center':
          // Repair center sees customers from their repair orders
          customers = await storage.listCustomers({ repairCenterId: req.user.repairCenterId || undefined });
          break;
        default:
          return res.status(403).send("Forbidden");
      }
      
      res.json(customers);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // GET /api/customers/:id - Get customer details with related data
  app.get("/api/customers/:id", requireAuth, async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      const customerId = req.params.id;
      const customer = await storage.getUser(customerId);
      
      if (!customer || customer.role !== 'customer') {
        return res.status(404).send("Customer not found");
      }
      
      // Check access rights
      if (req.user.role === 'reseller') {
        const context = getEffectiveContext(req);
        if (customer.resellerId !== context.resellerId) {
          return res.status(403).send("Access denied");
        }
      } else if (req.user.role !== 'admin') {
        return res.status(403).send("Forbidden");
      }
      
      // Get related data
      const [repairOrders, salesOrders, billingData] = await Promise.all([
        storage.listRepairOrders({ customerId }),
        storage.listSalesOrders({ customerId }),
        storage.getBillingDataByUserId(customerId),
      ]);
      
      // Get reseller info if available
      let reseller = null;
      if (customer.resellerId) {
        reseller = await storage.getUser(customer.resellerId);
      }
      
      res.json({
        customer,
        reseller: reseller ? { id: reseller.id, fullName: reseller.fullName } : null,
        repairOrders,
        salesOrders,
        billingData,
      });
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // Update customer billing data
  app.patch("/api/customers/:id/billing", requireAuth, async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      const customerId = req.params.id;
      const customer = await storage.getUser(customerId);
      
      if (!customer || customer.role !== 'customer') {
        return res.status(404).send("Customer not found");
      }
      
      // Check permissions
      const context = getEffectiveContext(req);
      if (req.user.role === 'reseller') {
        if (customer.resellerId !== context.resellerId) {
          return res.status(403).send("Access denied");
        }
      } else if (req.user.role !== 'admin') {
        return res.status(403).send("Forbidden");
      }
      
      // Get existing billing data
      let billingData = await storage.getBillingDataByUserId(customerId);
      
      const updates = {
        customerType: req.body.customerType,
        companyName: req.body.companyName,
        vatNumber: req.body.vatNumber,
        fiscalCode: req.body.fiscalCode,
        pec: req.body.pec,
        codiceUnivoco: req.body.codiceUnivoco,
        iban: req.body.iban,
        address: req.body.address,
        city: req.body.city,
        zipCode: req.body.zipCode,
        country: req.body.country,
      };
      
      // Remove undefined values
      Object.keys(updates).forEach(key => {
        if (updates[key as keyof typeof updates] === undefined) {
          delete updates[key as keyof typeof updates];
        }
      });
      
      if (billingData) {
        // Update existing
        billingData = await storage.updateBillingData(billingData.id, updates);
      } else {
        // Create new billing data
        billingData = await storage.createBillingData({
          userId: customerId,
          address: updates.address || '',
          city: updates.city || '',
          zipCode: updates.zipCode || '',
          country: updates.country || 'IT',
          ...updates,
        });
      }
      
      res.json(billingData);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // ============ QUICK CUSTOMER CREATION ============
  
  app.post("/api/customers/quick", requireAuth, async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      // Only admin and reseller can quick-create customers
      if (!['admin', 'reseller'].includes(req.user.role)) {
        return res.status(403).send("Forbidden");
      }
      
      // Validate minimal fields
      const quickCreateSchema = z.object({
        fullName: z.string().min(2, "Nome richiesto (minimo 2 caratteri)"),
        email: z.string().email("Email non valida").optional().nullable(),
        phone: z.string().optional().nullable(),
      });
      
      const validatedData = quickCreateSchema.parse(req.body);
      
      // Generate unique username from fullName
      let baseUsername = validatedData.fullName
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '')
        .substring(0, 20);
      
      if (baseUsername.length < 3) {
        baseUsername = 'cliente';
      }
      
      let username = baseUsername;
      let counter = 1;
      
      // Ensure username is unique
      while (await storage.getUserByUsername(username)) {
        username = `${baseUsername}${counter}`;
        counter++;
      }
      
      // Generate unique email if not provided
      let email = validatedData.email;
      if (!email) {
        email = `${username}@temp.monkeyplan.local`;
        // Ensure email is unique
        let emailCounter = 1;
        while (await storage.getUserByEmail(email)) {
          email = `${username}${emailCounter}@temp.monkeyplan.local`;
          emailCounter++;
        }
      } else {
        // Check if provided email is already in use
        const existingUser = await storage.getUserByEmail(email);
        if (existingUser) {
          return res.status(400).send("Email già in uso");
        }
      }
      
      // Generate temporary password
      const tempPassword = randomBytes(8).toString('hex');
      const hashedPassword = await hashPassword(tempPassword);
      
      // Determine resellerId based on role
      let assignedResellerId: string | null = null;
      if (req.user.role === 'reseller') {
        assignedResellerId = req.user.id;
      } else if (req.user.role === 'admin') {
        assignedResellerId = (req.body.resellerId as string) || null;
      }
      
      // Create customer
      const customer = await storage.createUser({
        username,
        password: hashedPassword,
        email,
        fullName: validatedData.fullName,
        phone: validatedData.phone || null,
        role: 'customer',
        isActive: true,
        resellerId: assignedResellerId,
      });
      
      // Remove password from response
      const { password: _, ...customerWithoutPassword } = customer;
      
      setActivityEntity(res, { type: 'users', id: customer.id });
      res.status(201).json(customerWithoutPassword);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).send(error.errors[0]?.message || "Dati non validi");
      }
      res.status(400).send(error.message);
    }
  });

  // ============ CUSTOMER REGISTRATION WIZARD ============

  app.post("/api/customers", requireAuth, async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      // Only admin, reseller, and repair_center can create customers via wizard
      if (!['admin', 'reseller', 'repair_center'].includes(req.user.role)) {
        return res.status(403).send("Forbidden");
      }
      
      // Validate wizard data
      const validatedData = customerWizardSchema.parse(req.body);
      
      // Generate unique username from email
      const emailPrefix = validatedData.email.split('@')[0];
      let username = emailPrefix.toLowerCase().replace(/[^a-z0-9]/g, '');
      let counter = 1;
      
      // Ensure username is unique
      while (await storage.getUserByUsername(username)) {
        username = `${emailPrefix.toLowerCase().replace(/[^a-z0-9]/g, '')}${counter}`;
        counter++;
      }
      
      // Generate temporary password
      const tempPassword = randomBytes(8).toString('hex');
      const hashedPassword = await hashPassword(tempPassword);
      
      // Determine resellerId based on role
      // - Reseller/Repair Center: Force their own ID (cannot be overridden)
      // - Admin: Can specify resellerId in body or leave null
      let assignedResellerId: string | null = null;
      if (req.user.role === 'reseller' || req.user.role === 'repair_center') {
        assignedResellerId = req.user.id;
      } else if (req.user.role === 'admin') {
        // Admin can optionally specify resellerId from body
        assignedResellerId = (req.body.resellerId as string) || null;
      }
      
      // Prepare user data with reseller assignment
      const userData = {
        username,
        password: hashedPassword, // Hash password before storing (consistent with other user creation routes)
        email: validatedData.email,
        fullName: validatedData.customerType === 'private' ? validatedData.fullName : validatedData.companyName,
        phone: validatedData.phone,
        role: 'customer' as const,
        isActive: true,
        resellerId: assignedResellerId,
      };
      
      // Prepare billing data
      const billingInfo = {
        customerType: validatedData.customerType,
        companyName: validatedData.customerType === 'company' ? validatedData.companyName : null,
        vatNumber: validatedData.customerType === 'company' ? (validatedData.vatNumber || null) : null,
        fiscalCode: validatedData.customerType === 'company' ? (validatedData.fiscalCode || null) : null,
        pec: validatedData.customerType === 'company' ? (validatedData.pec || null) : null,
        codiceUnivoco: validatedData.customerType === 'company' ? (validatedData.codiceUnivoco || null) : null,
        iban: validatedData.iban || null,
        address: validatedData.address,
        city: validatedData.city,
        zipCode: validatedData.zipCode,
        country: validatedData.country || 'IT',
        googlePlaceId: validatedData.googlePlaceId || null,
      };
      
      // Create customer with billing data in transaction
      const result = await storage.createCustomerWithBilling(userData, billingInfo);
      
      // Handle repair center associations if provided
      const repairCenterIds = req.body.repairCenterIds as string[] | undefined;
      if (repairCenterIds && repairCenterIds.length > 0) {
        // Validate repair centers belong to reseller (if reseller is creating)
        if (assignedResellerId && req.user.role !== 'admin') {
          for (const centerId of repairCenterIds) {
            const center = await storage.getRepairCenter(centerId);
            if (!center || center.resellerId !== assignedResellerId) {
              throw new Error("Centro di riparazione non autorizzato");
            }
          }
        }
        await storage.setCustomerRepairCenters(result.user.id, repairCenterIds);
      }
      
      // Log activity
      await logActivity(
        req.user.id,
        'CREATE',
        'customer',
        result.user.id,
        { customerType: validatedData.customerType },
        req
      );
      
      // Return created customer with temporary password
      res.status(201).json({
        customer: {
          id: result.user.id,
          username: result.user.username,
          email: result.user.email,
          fullName: result.user.fullName,
          phone: result.user.phone,
        },
        tempPassword,
        billing: result.billing,
      });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: "Validation failed", details: error.errors });
      }
      res.status(500).send(error.message);
    }
  });

  // ============ CUSTOMER BRANCHES (FILIALI) ============

  // List branches for a customer (parent company)
  app.get("/api/customers/:customerId/branches", requireAuth, async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      const { customerId } = req.params;
      
      // Check access: admin can see all, reseller/repair_center can see their customers, customer can see own
      if (req.user.role === 'customer' && req.user.id !== customerId) {
        return res.status(403).send("Forbidden");
      }
      
      if (req.user.role === 'reseller' || req.user.role === 'repair_center') {
        const customer = await storage.getUser(customerId);
        if (!customer || customer.resellerId !== req.user.id) {
          return res.status(403).send("Forbidden");
        }
      }
      
      const branches = await storage.listCustomerBranches(customerId);
      res.json(branches);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // Get single branch
  app.get("/api/branches/:branchId", requireAuth, async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      const branch = await storage.getCustomerBranch(req.params.branchId);
      if (!branch) {
        return res.status(404).send("Branch not found");
      }
      
      // Check access
      if (req.user.role === 'customer' && req.user.id !== branch.parentCustomerId) {
        return res.status(403).send("Forbidden");
      }
      
      if (req.user.role === 'reseller' || req.user.role === 'repair_center') {
        const customer = await storage.getUser(branch.parentCustomerId);
        if (!customer || customer.resellerId !== req.user.id) {
          return res.status(403).send("Forbidden");
        }
      }
      
      res.json(branch);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // Create branch
  app.post("/api/customers/:customerId/branches", requireAuth, async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      const { customerId } = req.params;
      
      // Only admin, reseller (for their customers), repair_center (for their customers) can create branches
      if (!['admin', 'reseller', 'repair_center'].includes(req.user.role)) {
        return res.status(403).send("Forbidden");
      }
      
      // Check reseller/repair_center access to customer
      if (req.user.role === 'reseller' || req.user.role === 'repair_center') {
        const customer = await storage.getUser(customerId);
        if (!customer || customer.resellerId !== req.user.id) {
          return res.status(403).send("Forbidden");
        }
      }
      
      // Verify customer exists and is a company type (for franchising/gdo)
      const billingData = await storage.getBillingDataByUserId(customerId);
      if (!billingData) {
        return res.status(400).send("Customer billing data not found");
      }
      
      // Validate request body
      const validatedData = insertCustomerBranchSchema.parse({
        ...req.body,
        parentCustomerId: customerId,
      });
      
      // Check for duplicate branch code
      const existingBranch = await storage.getBranchByCode(customerId, validatedData.branchCode);
      if (existingBranch) {
        return res.status(400).send("Branch code already exists for this customer");
      }
      
      const branch = await storage.createCustomerBranch(validatedData);
      
      // Log activity
      await logActivity(
        req.user.id,
        'CREATE',
        'branch',
        branch.id,
        { customerId, branchCode: branch.branchCode },
        req
      );
      
      res.status(201).json(branch);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: "Validation failed", details: error.errors });
      }
      res.status(500).send(error.message);
    }
  });

  // Update branch
  app.patch("/api/branches/:branchId", requireAuth, async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      // Only admin, reseller (for their customers), repair_center (for their customers) can update branches
      if (!['admin', 'reseller', 'repair_center'].includes(req.user.role)) {
        return res.status(403).send("Forbidden");
      }
      
      const branch = await storage.getCustomerBranch(req.params.branchId);
      if (!branch) {
        return res.status(404).send("Branch not found");
      }
      
      // Check access
      if (req.user.role === 'reseller' || req.user.role === 'repair_center') {
        const customer = await storage.getUser(branch.parentCustomerId);
        if (!customer || customer.resellerId !== req.user.id) {
          return res.status(403).send("Forbidden");
        }
      }
      
      // Validate allowed updates
      const allowedFields = ['branchName', 'branchCode', 'address', 'city', 'province', 'postalCode', 
                            'contactName', 'contactPhone', 'contactEmail', 'notes', 'isActive'];
      const updates: Record<string, any> = {};
      
      for (const field of allowedFields) {
        if (req.body[field] !== undefined) {
          updates[field] = req.body[field];
        }
      }
      
      // If changing branch code, check for duplicates
      if (updates.branchCode && updates.branchCode !== branch.branchCode) {
        const existingBranch = await storage.getBranchByCode(branch.parentCustomerId, updates.branchCode);
        if (existingBranch) {
          return res.status(400).send("Branch code already exists for this customer");
        }
      }
      
      const updatedBranch = await storage.updateCustomerBranch(req.params.branchId, updates);
      
      // Log activity
      await logActivity(
        req.user.id,
        'UPDATE',
        'branch',
        updatedBranch.id,
        { updates },
        req
      );
      
      res.json(updatedBranch);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // Delete branch
  app.delete("/api/branches/:branchId", requireAuth, async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      // Only admin, reseller (for their customers) can delete branches
      if (!['admin', 'reseller'].includes(req.user.role)) {
        return res.status(403).send("Forbidden");
      }
      
      const branch = await storage.getCustomerBranch(req.params.branchId);
      if (!branch) {
        return res.status(404).send("Branch not found");
      }
      
      // Check access
      if (req.user.role === 'reseller') {
        const customer = await storage.getUser(branch.parentCustomerId);
        if (!customer || customer.resellerId !== req.user.id) {
          return res.status(403).send("Forbidden");
        }
      }
      
      await storage.deleteCustomerBranch(req.params.branchId);
      
      // Log activity
      await logActivity(
        req.user.id,
        'DELETE',
        'branch',
        req.params.branchId,
        { branchCode: branch.branchCode },
        req
      );
      
      res.status(204).send();
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // ============ DASHBOARD STATISTICS ============

  app.get("/api/stats", requireAuth, async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      const stats: any = {};
      
      if (req.user.role === 'admin') {
        // Admin sees comprehensive dashboard stats
        const overviewKPIs = await storage.getOverviewKPIs();
        const topProducts = await storage.getTopProducts(5);
        const repairCenterPerformance = await storage.getRepairCenterPerformance();
        
        // Get ticket counts by status
        const allTickets = await storage.listTickets();
        const ticketsByStatus = {
          open: allTickets.filter(t => t.status === 'open').length,
          in_progress: allTickets.filter(t => t.status === 'in_progress').length,
          closed: allTickets.filter(t => t.status === 'closed').length,
        };
        
        // Get repair orders by status
        const allRepairs = await storage.listRepairOrders();
        const repairsByStatus = {
          pending: allRepairs.filter(r => r.status === 'pending').length,
          in_progress: allRepairs.filter(r => r.status === 'in_progress').length,
          completed: allRepairs.filter(r => r.status === 'completed').length,
          cancelled: allRepairs.filter(r => r.status === 'cancelled').length,
        };
        
        stats.overview = overviewKPIs;
        stats.ticketsByStatus = ticketsByStatus;
        stats.repairsByStatus = repairsByStatus;
        stats.topProducts = topProducts;
        stats.repairCenterPerformance = repairCenterPerformance;
        
      } else if (req.user.role === 'repair_center') {
        // Repair center sees own stats
        if (!req.user.repairCenterId) {
          return res.json({
            overview: { assignedRepairs: 0, completedRepairs: 0, assignedTickets: 0 },
            repairsByStatus: { pending: 0, in_progress: 0, completed: 0, cancelled: 0 },
            lowStockProducts: [],
          });
        }
        
        const assignedRepairs = await storage.listRepairOrders({ repairCenterId: req.user.repairCenterId });
        const assignedTickets = await storage.listTickets({ assignedTo: req.user.id });
        
        const repairsByStatus = {
          pending: assignedRepairs.filter(r => r.status === 'pending').length,
          in_progress: assignedRepairs.filter(r => r.status === 'in_progress').length,
          completed: assignedRepairs.filter(r => r.status === 'completed').length,
          cancelled: assignedRepairs.filter(r => r.status === 'cancelled').length,
        };
        
        // Get low stock alerts (quantity < 5)
        const inventory = await storage.listInventoryStock(req.user.repairCenterId);
        const products = await Promise.all(inventory.map(item => storage.getProduct(item.productId)));
        const lowStockProducts = inventory
          .filter(item => item.quantity < 5)
          .map((item, index) => ({
            ...item,
            product: products[index],
          }))
          .filter(item => item.product);
        
        stats.overview = {
          assignedRepairs: assignedRepairs.length,
          completedRepairs: assignedRepairs.filter(r => r.status === 'completed').length,
          assignedTickets: assignedTickets.length,
        };
        stats.repairsByStatus = repairsByStatus;
        stats.lowStockProducts = lowStockProducts;
        
      } else if (req.user.role === 'reseller') {
        // Reseller sees own orders and customers stats (respecting context switch)
        const context = getEffectiveContext(req);
        
        let ownOrders;
        if (context.repairCenterId) {
          ownOrders = await storage.listRepairOrders({ repairCenterId: context.repairCenterId });
        } else {
          ownOrders = await storage.listRepairOrders({ resellerId: context.resellerId });
        }
        
        const repairsByStatus = {
          pending: ownOrders.filter(r => r.status === 'pending').length,
          in_progress: ownOrders.filter(r => r.status === 'in_progress').length,
          completed: ownOrders.filter(r => r.status === 'completed').length,
          cancelled: ownOrders.filter(r => r.status === 'cancelled').length,
        };
        
        // Count unique customers
        const uniqueCustomers = new Set(ownOrders.map(o => o.customerId));
        
        // Calculate revenue from completed orders
        const revenue = ownOrders
          .filter(o => o.status === 'completed' && o.finalCost)
          .reduce((sum, o) => sum + (o.finalCost || 0), 0);
        
        stats.overview = {
          totalOrders: ownOrders.length,
          completedOrders: ownOrders.filter(r => r.status === 'completed').length,
          totalCustomers: uniqueCustomers.size,
          totalRevenue: revenue,
        };
        stats.repairsByStatus = repairsByStatus;
        
      } else if (req.user.role === 'customer') {
        // Customer sees own tickets and repairs stats
        const ownTickets = await storage.listTickets({ customerId: req.user.id });
        const ownRepairs = await storage.listRepairOrders({ customerId: req.user.id });
        
        const ticketsByStatus = {
          open: ownTickets.filter(t => t.status === 'open').length,
          in_progress: ownTickets.filter(t => t.status === 'in_progress').length,
          closed: ownTickets.filter(t => t.status === 'closed').length,
        };
        
        const repairsByStatus = {
          pending: ownRepairs.filter(r => r.status === 'pending').length,
          in_progress: ownRepairs.filter(r => r.status === 'in_progress').length,
          completed: ownRepairs.filter(r => r.status === 'completed').length,
          cancelled: ownRepairs.filter(r => r.status === 'cancelled').length,
        };
        
        stats.overview = {
          totalTickets: ownTickets.length,
          openTickets: ownTickets.filter(t => t.status === 'open').length,
          totalRepairs: ownRepairs.length,
          activeRepairs: ownRepairs.filter(r => r.status === 'in_progress').length,
        };
        stats.ticketsByStatus = ticketsByStatus;
        stats.repairsByStatus = repairsByStatus;
      }
      
      res.json(stats);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // ============ WEBSOCKET FOR LIVECHAT & NOTIFICATIONS ============

  const httpServer = createServer(app);
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  const clients = new Map<string, WebSocket>();

  // Helper function to broadcast notification to a specific user
  function broadcastNotification(userId: string, notification: any) {
    const userWs = clients.get(userId);
    if (userWs && userWs.readyState === WebSocket.OPEN) {
      userWs.send(JSON.stringify({
        type: 'notification',
        data: notification,
      }));
    }
  }

  wss.on('connection', (ws: WebSocket) => {
    let userId: string | null = null;
    let authenticated = false;

    ws.on('message', async (message: string) => {
      try {
        const data = JSON.parse(message.toString());

        if (data.type === 'auth') {
          // Verify user exists
          const user = await storage.getUser(data.userId);
          if (user) {
            userId = data.userId;
            authenticated = true;
            clients.set(data.userId, ws);
            
            // Send auth confirmation
            ws.send(JSON.stringify({ type: 'auth_success' }));
          } else {
            ws.send(JSON.stringify({ type: 'auth_failed', error: 'Invalid user' }));
            ws.close();
          }
        } else if (data.type === 'message' && userId && authenticated) {
          // Validate message with Zod schema
          const messageSchema = insertChatMessageSchema.pick({
            receiverId: true,
            message: true,
            isRead: true,
          });

          const validatedData = messageSchema.parse({
            receiverId: data.receiverId,
            message: data.message,
            isRead: false,
          });

          // Verify receiver exists
          if (!validatedData.receiverId) {
            ws.send(JSON.stringify({ type: 'error', error: 'Receiver ID required' }));
            return;
          }
          
          const receiver = await storage.getUser(validatedData.receiverId);
          if (!receiver) {
            ws.send(JSON.stringify({ type: 'error', error: 'Receiver not found' }));
            return;
          }

          // Save message to database for persistence - force senderId from authenticated session
          const chatMessage = await storage.createChatMessage({
            senderId: userId, // Force from authenticated session
            receiverId: validatedData.receiverId,
            message: validatedData.message,
            isRead: false,
          });

          // Send to receiver if online
          const receiverWs = clients.get(validatedData.receiverId);
          if (receiverWs && receiverWs.readyState === WebSocket.OPEN) {
            receiverWs.send(JSON.stringify({
              type: 'message',
              data: chatMessage,
            }));
          }

          // Echo back to sender
          ws.send(JSON.stringify({
            type: 'message',
            data: chatMessage,
          }));
        } else if (!authenticated) {
          ws.send(JSON.stringify({ type: 'error', error: 'Not authenticated' }));
        }
      } catch (error) {
        console.error('WebSocket error:', error);
        ws.send(JSON.stringify({ type: 'error', error: 'Server error' }));
      }
    });

    ws.on('close', () => {
      if (userId) {
        clients.delete(userId);
      }
    });

    ws.on('error', (error) => {
      console.error('WebSocket connection error:', error);
    });
  });

  // ============ DEVICE TYPES & BRANDS ============

  // Get device types (only active for dropdown)
  app.get("/api/device-types", requireAuth, async (req, res) => {
    try {
      const activeOnly = req.query.activeOnly !== 'false'; // Default true
      const deviceTypes = await storage.listDeviceTypes(activeOnly);
      res.json(deviceTypes);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // Get device brands (only active for dropdown)
  app.get("/api/device-brands", requireAuth, async (req, res) => {
    try {
      const activeOnly = req.query.activeOnly !== 'false'; // Default true
      const deviceBrands = await storage.listDeviceBrands(activeOnly);
      res.json(deviceBrands);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // Get device models (cascading dropdown filtered by type/brand)
  app.get("/api/device-models", requireAuth, async (req, res) => {
    try {
      const typeId = req.query.typeId as string | undefined;
      const brandId = req.query.brandId as string | undefined;
      const activeOnly = req.query.activeOnly !== 'false'; // Default true
      
      const deviceModels = await storage.listDeviceModels({ typeId, brandId, activeOnly });
      res.json(deviceModels);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // ============ ISSUE TYPES ============

  // Get issue types (filtered by device type, includes "Altro" option)
  app.get("/api/issue-types", requireAuth, async (req, res) => {
    try {
      const deviceTypeId = req.query.deviceTypeId as string | undefined;
      const activeOnly = req.query.activeOnly !== 'false'; // Default true
      const issueTypes = await storage.listIssueTypes(deviceTypeId, activeOnly);
      res.json(issueTypes);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // ============ AESTHETIC DEFECTS ============

  // Get aesthetic defects (filtered by device type)
  app.get("/api/aesthetic-defects", requireAuth, async (req, res) => {
    try {
      const deviceTypeId = req.query.deviceTypeId as string | undefined;
      const activeOnly = req.query.activeOnly !== 'false'; // Default true
      const defects = await storage.listAestheticDefects(deviceTypeId, activeOnly);
      res.json(defects);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // ============ ACCESSORY TYPES ============

  // Get accessory types (filtered by device type)
  app.get("/api/accessory-types", requireAuth, async (req, res) => {
    try {
      const deviceTypeId = req.query.deviceTypeId as string | undefined;
      const activeOnly = req.query.activeOnly !== 'false'; // Default true
      const accessories = await storage.listAccessoryTypes(deviceTypeId, activeOnly);
      res.json(accessories);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // ============ DIAGNOSTIC FINDINGS ============

  // Get diagnostic findings (filtered by device type)
  app.get("/api/diagnostic-findings", requireAuth, async (req, res) => {
    try {
      const deviceTypeId = req.query.deviceTypeId as string | undefined;
      const activeOnly = req.query.activeOnly !== 'false'; // Default true
      const findings = await storage.listDiagnosticFindings(deviceTypeId, activeOnly);
      res.json(findings);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // ============ DAMAGED COMPONENT TYPES ============

  // Get damaged component types (filtered by device type)
  app.get("/api/damaged-component-types", requireAuth, async (req, res) => {
    try {
      const deviceTypeId = req.query.deviceTypeId as string | undefined;
      const activeOnly = req.query.activeOnly !== 'false'; // Default true
      const components = await storage.listDamagedComponentTypes(deviceTypeId, activeOnly);
      res.json(components);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // ============ ESTIMATED REPAIR TIMES ============

  // Get estimated repair times (filtered by device type)
  app.get("/api/estimated-repair-times", requireAuth, async (req, res) => {
    try {
      const deviceTypeId = req.query.deviceTypeId as string | undefined;
      const activeOnly = req.query.activeOnly !== 'false'; // Default true
      const times = await storage.listEstimatedRepairTimes(deviceTypeId, activeOnly);
      res.json(times);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // ============ PROMOTIONS (for "Non Conveniente" diagnosis outcome) ============

  // Get all promotions (for diagnosis form)
  app.get("/api/promotions", requireAuth, async (req, res) => {
    try {
      const activeOnly = req.query.activeOnly !== 'false'; // Default true
      const promotions = await storage.listPromotions(activeOnly);
      res.json(promotions);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // Admin: Create promotion
  app.post("/api/admin/promotions", requireAuth, requireRole('admin'), async (req, res) => {
    try {
      const promotion = await storage.createPromotion(req.body);
      res.status(201).json(promotion);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // Admin: Update promotion
  app.patch("/api/admin/promotions/:id", requireAuth, requireRole('admin'), async (req, res) => {
    try {
      const promotion = await storage.updatePromotion(req.params.id, req.body);
      res.json(promotion);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // Admin: Delete promotion
  app.delete("/api/admin/promotions/:id", requireAuth, requireRole('admin'), async (req, res) => {
    try {
      await storage.deletePromotion(req.params.id);
      res.status(204).send();
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // ============ UNREPAIRABLE REASONS (for "Irriparabile" diagnosis outcome) ============

  // Get unrepairable reasons (filtered by device type)
  app.get("/api/unrepairable-reasons", requireAuth, async (req, res) => {
    try {
      const deviceTypeId = req.query.deviceTypeId as string | undefined;
      const activeOnly = req.query.activeOnly !== 'false'; // Default true
      const reasons = await storage.listUnrepairableReasons(deviceTypeId, activeOnly);
      res.json(reasons);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // Admin: Create unrepairable reason
  app.post("/api/admin/unrepairable-reasons", requireAuth, requireRole('admin'), async (req, res) => {
    try {
      const reason = await storage.createUnrepairableReason(req.body);
      res.status(201).json(reason);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // Admin: Update unrepairable reason
  app.patch("/api/admin/unrepairable-reasons/:id", requireAuth, requireRole('admin'), async (req, res) => {
    try {
      const reason = await storage.updateUnrepairableReason(req.params.id, req.body);
      res.json(reason);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // Admin: Delete unrepairable reason
  app.delete("/api/admin/unrepairable-reasons/:id", requireAuth, requireRole('admin'), async (req, res) => {
    try {
      await storage.deleteUnrepairableReason(req.params.id);
      res.status(204).send();
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // ==========================================
  // DATA RECOVERY API ENDPOINTS
  // ==========================================

  // List external labs - Only admin and repair_center can see labs
  app.get("/api/external-labs", requireAuth, requireRole('admin', 'repair_center'), async (req, res) => {
    try {
      const activeOnly = req.query.activeOnly !== 'false';
      const labs = await storage.listExternalLabs(activeOnly);
      res.json(labs);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // Get single external lab - Only admin and repair_center can see lab details
  app.get("/api/external-labs/:id", requireAuth, requireRole('admin', 'repair_center'), async (req, res) => {
    try {
      const lab = await storage.getExternalLab(req.params.id);
      if (!lab) {
        return res.status(404).send("External lab not found");
      }
      res.json(lab);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // Admin: Create external lab
  app.post("/api/admin/external-labs", requireAuth, requireRole('admin'), async (req, res) => {
    try {
      const lab = await storage.createExternalLab(req.body);
      res.status(201).json(lab);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // Admin: Update external lab
  app.patch("/api/admin/external-labs/:id", requireAuth, requireRole('admin'), async (req, res) => {
    try {
      const lab = await storage.updateExternalLab(req.params.id, req.body);
      res.json(lab);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // Admin: Delete external lab
  app.delete("/api/admin/external-labs/:id", requireAuth, requireRole('admin'), async (req, res) => {
    try {
      await storage.deleteExternalLab(req.params.id);
      res.status(204).send();
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // Get data recovery job for a repair order - RBAC with ownership check
  app.get("/api/repair-orders/:id/data-recovery", requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      const repairOrderId = req.params.id;
      
      // First check if user has access to the repair order
      const repairOrder = await storage.getRepairOrder(repairOrderId);
      if (!repairOrder) {
        return res.status(404).send("Repair order not found");
      }
      
      // RBAC check based on role and ownership
      if (user.role === 'customer' && repairOrder.customerId !== user.id) {
        return res.status(403).send("Access denied");
      }
      if (user.role === 'reseller') {
        let hasAccess = repairOrder.resellerId === user.id;
        if (!hasAccess && repairOrder.customerId) {
          const customer = await storage.getUser(repairOrder.customerId);
          hasAccess = !!(customer && customer.resellerId === user.id);
        }
        if (!hasAccess) {
          return res.status(403).send("Access denied");
        }
      }
      if (user.role === 'repair_center' && repairOrder.repairCenterId !== user.repairCenterId) {
        return res.status(403).send("Access denied");
      }
      
      const job = await storage.getDataRecoveryJobByRepairOrderId(repairOrderId);
      if (!job) {
        return res.status(404).send("Data recovery job not found");
      }
      
      // Include events for timeline
      const events = await storage.listDataRecoveryEvents(job.id);
      
      // Include external lab details if applicable
      let externalLab = null;
      if (job.externalLabId) {
        externalLab = await storage.getExternalLab(job.externalLabId);
      }
      
      // Include assigned user details if applicable
      let assignedUser = null;
      if (job.assignedToUserId) {
        assignedUser = await storage.getUser(job.assignedToUserId);
      }
      
      res.json({
        ...job,
        events,
        externalLab,
        assignedUser: assignedUser ? { id: assignedUser.id, fullName: assignedUser.fullName, username: assignedUser.username } : null
      });
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // Create data recovery job for a repair order
  app.post("/api/repair-orders/:id/data-recovery", requireAuth, requireRole('admin', 'repair_center'), async (req, res) => {
    try {
      const repairOrderId = req.params.id;
      const user = req.user as any;
      
      // Validate request body with zod
      const bodyValidation = createDataRecoveryJobSchema.omit({ parentRepairOrderId: true, deviceDescription: true }).safeParse(req.body);
      if (!bodyValidation.success) {
        return res.status(400).json({ error: "Invalid request body", details: bodyValidation.error.flatten() });
      }
      const validatedBody = bodyValidation.data;
      
      // Check if repair order exists
      const repairOrder = await storage.getRepairOrder(repairOrderId);
      if (!repairOrder) {
        return res.status(404).send("Repair order not found");
      }
      
      // Ownership check for repair_center role
      if (user.role === 'repair_center' && repairOrder.repairCenterId !== user.repairCenterId) {
        return res.status(403).send("Access denied - repair order does not belong to your repair center");
      }
      
      // Check if data recovery job already exists
      const existingJob = await storage.getDataRecoveryJobByRepairOrderId(repairOrderId);
      if (existingJob && !["completed", "failed", "cancelled"].includes(existingJob.status)) {
        return res.status(400).send("Data recovery job already in progress for this repair order");
      }
      
      // Build device description from repair order
      const deviceDescription = `${repairOrder.brand || ''} ${repairOrder.deviceModel} - ${repairOrder.imei ? `IMEI: ${repairOrder.imei}` : repairOrder.serial ? `S/N: ${repairOrder.serial}` : 'N/A'}`.trim();
      
      const job = await storage.createDataRecoveryJob({
        parentRepairOrderId: repairOrderId,
        triggerType: validatedBody.triggerType || "manual",
        handlingType: validatedBody.handlingType,
        deviceDescription,
        assignedToUserId: validatedBody.assignedToUserId || null,
        externalLabId: validatedBody.externalLabId || null,
        estimatedCost: validatedBody.estimatedCost || null,
        internalNotes: validatedBody.internalNotes || null,
        customerNotes: validatedBody.customerNotes || null,
      }, user.id);
      
      // Log activity using validated body only
      await storage.createActivityLog({
        userId: user.id,
        action: "data_recovery_created",
        entityType: "data_recovery_job",
        entityId: job.id,
        details: JSON.stringify({
          repairOrderId,
          handlingType: validatedBody.handlingType,
          jobNumber: job.jobNumber
        })
      });
      
      res.status(201).json(job);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // Update data recovery job status
  app.patch("/api/data-recovery/:id", requireAuth, requireRole('admin', 'repair_center'), async (req, res) => {
    try {
      const user = req.user as any;
      const jobId = req.params.id;
      
      // Validate request body with zod
      const bodyValidation = updateDataRecoveryJobSchema.safeParse(req.body);
      if (!bodyValidation.success) {
        return res.status(400).json({ error: "Invalid request body", details: bodyValidation.error.flatten() });
      }
      const updates = bodyValidation.data;
      
      const existingJob = await storage.getDataRecoveryJob(jobId);
      if (!existingJob) {
        return res.status(404).send("Data recovery job not found");
      }
      
      // Ownership check for repair_center role
      if (user.role === 'repair_center') {
        const repairOrder = await storage.getRepairOrder(existingJob.parentRepairOrderId);
        if (repairOrder && repairOrder.repairCenterId !== user.repairCenterId) {
          return res.status(403).send("Access denied - repair order does not belong to your repair center");
        }
      }
      
      const updatedJob = await storage.updateDataRecoveryJob(jobId, updates);
      
      // Create event for status change
      if (updates.status && updates.status !== existingJob.status) {
        const statusLabels: Record<string, string> = {
          pending: "In Attesa",
          assigned: "Assegnato",
          in_progress: "In Lavorazione",
          awaiting_shipment: "In Attesa Spedizione",
          shipped: "Spedito",
          at_lab: "Ricevuto dal Laboratorio",
          completed: "Completato",
          partial: "Recupero Parziale",
          failed: "Fallito",
          cancelled: "Annullato"
        };
        
        await storage.createDataRecoveryEvent({
          dataRecoveryJobId: jobId,
          eventType: "status_change",
          title: `Stato aggiornato a: ${statusLabels[updates.status] || updates.status}`,
          description: updates.internalNotes || null,
          createdBy: user.id,
        });
      }
      
      // Log activity
      await storage.createActivityLog({
        userId: user.id,
        action: "data_recovery_updated",
        entityType: "data_recovery_job",
        entityId: jobId,
        details: JSON.stringify(updates)
      });
      
      res.json(updatedJob);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // Add event/note to data recovery job
  app.post("/api/data-recovery/:id/events", requireAuth, requireRole('admin', 'repair_center'), async (req, res) => {
    try {
      const user = req.user as any;
      const jobId = req.params.id;
      
      // Validate request body with zod
      const bodyValidation = createDataRecoveryEventSchema.safeParse(req.body);
      if (!bodyValidation.success) {
        return res.status(400).json({ error: "Invalid request body", details: bodyValidation.error.flatten() });
      }
      const validatedBody = bodyValidation.data;
      
      const existingJob = await storage.getDataRecoveryJob(jobId);
      if (!existingJob) {
        return res.status(404).send("Data recovery job not found");
      }
      
      // Ownership check for repair_center role
      if (user.role === 'repair_center') {
        const repairOrder = await storage.getRepairOrder(existingJob.parentRepairOrderId);
        if (repairOrder && repairOrder.repairCenterId !== user.repairCenterId) {
          return res.status(403).send("Access denied - repair order does not belong to your repair center");
        }
      }
      
      const event = await storage.createDataRecoveryEvent({
        dataRecoveryJobId: jobId,
        eventType: validatedBody.eventType,
        title: validatedBody.title,
        description: validatedBody.description || null,
        metadata: validatedBody.metadata ? JSON.stringify(validatedBody.metadata) : null,
        createdBy: user.id,
      });
      
      res.status(201).json(event);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // List all data recovery jobs (for admin dashboard)
  app.get("/api/data-recovery", requireAuth, requireRole('admin', 'repair_center'), async (req, res) => {
    try {
      const filters: { status?: string; handlingType?: string } = {};
      if (req.query.status) filters.status = req.query.status as string;
      if (req.query.handlingType) filters.handlingType = req.query.handlingType as string;
      
      const jobs = await storage.listDataRecoveryJobs(filters);
      res.json(jobs);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // Get single data recovery job by ID
  app.get("/api/data-recovery/:id", requireAuth, async (req, res) => {
    try {
      const job = await storage.getDataRecoveryJob(req.params.id);
      if (!job) {
        return res.status(404).send("Data recovery job not found");
      }
      
      const events = await storage.listDataRecoveryEvents(job.id);
      
      let externalLab = null;
      if (job.externalLabId) {
        externalLab = await storage.getExternalLab(job.externalLabId);
      }
      
      let assignedUser = null;
      if (job.assignedToUserId) {
        assignedUser = await storage.getUser(job.assignedToUserId);
      }
      
      res.json({
        ...job,
        events,
        externalLab,
        assignedUser: assignedUser ? { id: assignedUser.id, fullName: assignedUser.fullName, username: assignedUser.username } : null
      });
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // ==========================================
  // DATA RECOVERY PDF DOCUMENTS
  // ==========================================

  // Generate shipping document for external lab data recovery
  app.get("/api/data-recovery/:id/shipping-document", requireAuth, async (req, res) => {
    try {
      const job = await storage.getDataRecoveryJob(req.params.id);
      if (!job) {
        return res.status(404).send("Data recovery job not found");
      }
      
      if (job.handlingType !== 'external') {
        return res.status(400).send("Shipping document only available for external lab jobs");
      }
      
      const externalLab = job.externalLabId ? await storage.getExternalLab(job.externalLabId) : null;
      if (!externalLab) {
        return res.status(400).send("External lab not found");
      }
      
      // Get parent repair order details
      const repairOrder = await storage.getRepairOrder(job.parentRepairOrderId);
      const customer = repairOrder?.customerId ? await storage.getUser(repairOrder.customerId) : null;
      
      // Generate PDF
      const PDFDocument = (await import('pdfkit')).default;
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="invio-recupero-${job.jobNumber}.pdf"`);
      
      doc.pipe(res);
      
      // Header
      doc.fontSize(20).font('Helvetica-Bold').text('DOCUMENTO DI INVIO', { align: 'center' });
      doc.fontSize(12).font('Helvetica').text('Recupero Dati - Laboratorio Esterno', { align: 'center' });
      doc.moveDown();
      
      // Job info box
      doc.rect(50, doc.y, 500, 50).stroke();
      const boxY = doc.y + 10;
      doc.fontSize(10).font('Helvetica-Bold').text('PRATICA RECUPERO DATI', 60, boxY);
      doc.font('Helvetica').text(`Numero: ${job.jobNumber}`, 60, boxY + 15);
      doc.text(`Data: ${new Date(job.createdAt).toLocaleDateString('it-IT')}`, 60, boxY + 30);
      if (repairOrder) {
        doc.text(`Rif. Riparazione: ${repairOrder.orderNumber}`, 300, boxY + 15);
      }
      doc.y = boxY + 45;
      doc.moveDown();
      
      // Lab destination info
      doc.fontSize(12).font('Helvetica-Bold').text('DESTINATARIO - LABORATORIO ESTERNO');
      doc.fontSize(10).font('Helvetica');
      doc.text(`${externalLab.name}`);
      doc.text(`${externalLab.address}`);
      doc.text(`${externalLab.zipCode || ''} ${externalLab.city} ${externalLab.province ? `(${externalLab.province})` : ''}`);
      if (externalLab.contactPerson) doc.text(`Att.ne: ${externalLab.contactPerson}`);
      if (externalLab.phone) doc.text(`Tel: ${externalLab.phone}`);
      doc.text(`Email: ${externalLab.email}`);
      doc.moveDown();
      
      // Device info
      doc.fontSize(12).font('Helvetica-Bold').text('DISPOSITIVO');
      doc.fontSize(10).font('Helvetica');
      doc.text(job.deviceDescription || 'N/A');
      doc.moveDown();
      
      // Customer info (sender)
      doc.fontSize(12).font('Helvetica-Bold').text('MITTENTE / CLIENTE');
      doc.fontSize(10).font('Helvetica');
      if (customer) {
        doc.text(`Nome: ${customer.fullName || customer.username}`);
        if (customer.phone) doc.text(`Telefono: ${customer.phone}`);
        if (customer.email) doc.text(`Email: ${customer.email}`);
      } else {
        doc.text('N/A');
      }
      doc.moveDown();
      
      // Notes
      if (job.customerNotes) {
        doc.fontSize(12).font('Helvetica-Bold').text('NOTE PER IL LABORATORIO');
        doc.fontSize(10).font('Helvetica');
        doc.text(job.customerNotes);
        doc.moveDown();
      }
      
      // Terms and conditions
      doc.moveDown();
      doc.fontSize(9).font('Helvetica').text(
        'CONDIZIONI DI SERVIZIO: Il laboratorio si impegna a effettuare la diagnosi del dispositivo ' +
        'e a comunicare preventivo per il recupero dati. Il cliente autorizza il trattamento dei dati ' +
        'contenuti nel dispositivo ai fini esclusivi del recupero. I dati recuperati saranno trattati ' +
        'con la massima riservatezza e restituiti su supporto concordato.',
        { align: 'justify' }
      );
      doc.moveDown(2);
      
      // Signature areas
      doc.fontSize(10).font('Helvetica');
      doc.text('_______________________________', 60);
      doc.text('Firma Mittente', 60);
      doc.text(`Data: ${new Date().toLocaleDateString('it-IT')}`, 60);
      doc.text('_______________________________', 320);
      doc.text('Timbro e Firma Laboratorio', 320);
      doc.text('Data ricezione: ______________', 320);
      
      // Footer
      doc.moveDown(2);
      doc.fontSize(8).font('Helvetica').text(
        `Documento generato il ${new Date().toLocaleDateString('it-IT')} alle ${new Date().toLocaleTimeString('it-IT')}`,
        { align: 'center' }
      );
      
      doc.end();
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // Generate shipping label for external lab data recovery
  app.get("/api/data-recovery/:id/label", requireAuth, async (req, res) => {
    try {
      const job = await storage.getDataRecoveryJob(req.params.id);
      if (!job) {
        return res.status(404).send("Data recovery job not found");
      }
      
      if (job.handlingType !== 'external') {
        return res.status(400).send("Shipping label only available for external lab jobs");
      }
      
      const externalLab = job.externalLabId ? await storage.getExternalLab(job.externalLabId) : null;
      if (!externalLab) {
        return res.status(400).send("External lab not found");
      }
      
      // Generate PDF - A6 size for label
      const PDFDocument = (await import('pdfkit')).default;
      const doc = new PDFDocument({ 
        margin: 20, 
        size: [297.64, 419.53] // A6 in points
      });
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="etichetta-${job.jobNumber}.pdf"`);
      
      doc.pipe(res);
      
      // Border
      doc.rect(10, 10, 277.64, 399.53).stroke();
      
      // Header with job number
      doc.fontSize(14).font('Helvetica-Bold').text('RECUPERO DATI', { align: 'center' });
      doc.fontSize(18).font('Helvetica-Bold').text(job.jobNumber, { align: 'center' });
      doc.moveDown();
      
      // Divider line
      doc.moveTo(20, doc.y).lineTo(277.64, doc.y).stroke();
      doc.moveDown(0.5);
      
      // Destination label
      doc.fontSize(10).font('Helvetica-Bold').text('DESTINATARIO:');
      doc.fontSize(12).font('Helvetica-Bold').text(externalLab.name);
      doc.fontSize(10).font('Helvetica');
      doc.text(externalLab.address);
      doc.text(`${externalLab.zipCode || ''} ${externalLab.city}`);
      if (externalLab.province) doc.text(`(${externalLab.province})`);
      if (externalLab.contactPerson) {
        doc.moveDown(0.5);
        doc.text(`Att.ne: ${externalLab.contactPerson}`);
      }
      doc.moveDown();
      
      // Divider line
      doc.moveTo(20, doc.y).lineTo(277.64, doc.y).stroke();
      doc.moveDown(0.5);
      
      // Device description
      doc.fontSize(10).font('Helvetica-Bold').text('CONTENUTO:');
      doc.fontSize(10).font('Helvetica').text(job.deviceDescription || 'Dispositivo per recupero dati');
      doc.moveDown();
      
      // Warning box
      doc.rect(20, doc.y, 257.64, 40).stroke();
      doc.fontSize(8).font('Helvetica-Bold').text('ATTENZIONE - MATERIALE FRAGILE', 25, doc.y + 5, { align: 'center' });
      doc.fontSize(7).font('Helvetica').text('Maneggiare con cura - Evitare urti e vibrazioni', 25, doc.y + 18, { align: 'center' });
      doc.y += 45;
      
      // Reference number at bottom
      doc.moveDown();
      doc.fontSize(8).font('Helvetica').text(`Rif: ${job.jobNumber}`, { align: 'center' });
      doc.text(`${new Date().toLocaleDateString('it-IT')}`, { align: 'center' });
      
      doc.end();
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // ============ SUPPLIER MANAGEMENT SYSTEM ============

  // ============ SUPPLIERS (Anagrafica Fornitori) ============

  // GET /api/suppliers - List all suppliers
  app.get("/api/suppliers", requireAuth, requireRole("admin", "repair_center"), async (req, res) => {
    try {
      const activeOnly = req.query.activeOnly === 'true';
      const suppliers = await storage.listSuppliers(activeOnly);
      res.json(suppliers);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // GET /api/suppliers/:id - Get supplier details
  app.get("/api/suppliers/:id", requireAuth, requireRole("admin", "repair_center"), async (req, res) => {
    try {
      const supplier = await storage.getSupplier(req.params.id);
      if (!supplier) {
        return res.status(404).send("Fornitore non trovato");
      }
      res.json(supplier);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // POST /api/suppliers - Create new supplier (admin only)
  app.post("/api/suppliers", requireAuth, requireRole("admin"), async (req, res) => {
    try {
      const validated = insertSupplierSchema.parse(req.body);
      
      // Check for duplicate code
      const existing = await storage.getSupplierByCode(validated.code);
      if (existing) {
        return res.status(400).send("Codice fornitore già esistente");
      }
      
      const supplier = await storage.createSupplier(validated);
      res.status(201).json(supplier);
    } catch (error: any) {
      res.status(400).send(error.message);
    }
  });

  // PATCH /api/suppliers/:id - Update supplier (admin only)
  app.patch("/api/suppliers/:id", requireAuth, requireRole("admin"), async (req, res) => {
    try {
      const supplier = await storage.updateSupplier(req.params.id, req.body);
      res.json(supplier);
    } catch (error: any) {
      res.status(400).send(error.message);
    }
  });

  // DELETE /api/suppliers/:id - Delete supplier (admin only)
  app.delete("/api/suppliers/:id", requireAuth, requireRole("admin"), async (req, res) => {
    try {
      await storage.deleteSupplier(req.params.id);
      res.status(204).send();
    } catch (error: any) {
      res.status(400).send(error.message);
    }
  });

  // POST /api/suppliers/:id/test-connection - Test API connection to supplier
  app.post("/api/suppliers/:id/test-connection", requireAuth, requireRole("admin"), async (req, res) => {
    try {
      const supplier = await storage.getSupplier(req.params.id);
      if (!supplier) {
        return res.status(404).send("Fornitore non trovato");
      }

      // Check if API is configured
      if (!supplier.apiType) {
        return res.status(400).send("Tipo integrazione API non configurato.");
      }

      // Use Foneday-specific service if type is foneday
      if (supplier.apiType === 'foneday') {
        const { fonedayApi } = await import('./services/foneday');
        const result = await fonedayApi.testConnection();
        
        if (result.success) {
          res.json({ 
            success: true, 
            message: result.message,
            productsCount: result.productsCount
          });
        } else {
          res.status(400).json({ 
            success: false, 
            message: result.message 
          });
        }
        return;
      }

      // Generic API test for other types
      if (!supplier.apiSecretName) {
        return res.status(400).send("Nome segreto API non configurato.");
      }

      const apiKey = process.env[supplier.apiSecretName];
      if (!apiKey) {
        return res.status(400).send(`Segreto "${supplier.apiSecretName}" non trovato nei Replit Secrets.`);
      }

      const testEndpoint = supplier.apiProductsEndpoint || supplier.apiEndpoint;
      if (!testEndpoint) {
        return res.status(400).send("Nessun endpoint configurato per il test.");
      }

      const headers: Record<string, string> = {
        'Accept': 'application/json',
      };

      switch (supplier.apiAuthMethod) {
        case 'bearer_token':
          headers['Authorization'] = `Bearer ${apiKey}`;
          break;
        case 'api_key_header':
          headers['X-API-Key'] = apiKey;
          break;
        case 'basic_auth':
          headers['Authorization'] = `Basic ${Buffer.from(apiKey).toString('base64')}`;
          break;
        case 'none':
          break;
        default:
          headers['Authorization'] = `Bearer ${apiKey}`;
      }

      const testUrl = supplier.apiAuthMethod === 'api_key_query' 
        ? `${testEndpoint}${testEndpoint.includes('?') ? '&' : '?'}api_key=${apiKey}`
        : testEndpoint;

      const response = await fetch(testUrl, {
        method: 'GET',
        headers,
        signal: AbortSignal.timeout(10000),
      });

      if (response.ok) {
        res.json({ 
          success: true, 
          status: response.status,
          message: "Connessione riuscita" 
        });
      } else {
        res.status(400).json({ 
          success: false, 
          status: response.status,
          message: `Errore API: ${response.statusText}` 
        });
      }
    } catch (error: any) {
      console.error("Supplier connection test error:", error);
      res.status(500).json({ 
        success: false, 
        message: error.message || "Errore durante il test di connessione" 
      });
    }
  });

  // POST /api/suppliers/:id/sync-catalog - Sync supplier product catalog
  app.post("/api/suppliers/:id/sync-catalog", requireAuth, requireRole("admin"), async (req, res) => {
    try {
      const supplier = await storage.getSupplier(req.params.id);
      if (!supplier) {
        return res.status(404).send("Fornitore non trovato");
      }

      // Check if sync is enabled
      if (!supplier.catalogSyncEnabled) {
        return res.status(400).send("Sincronizzazione catalogo non abilitata per questo fornitore.");
      }

      // Check if API is configured
      if (!supplier.apiType) {
        return res.status(400).send("Tipo integrazione API non configurato.");
      }

      const startTime = Date.now();

      // Update sync status to syncing
      await storage.updateSupplier(req.params.id, {
        catalogSyncStatus: 'syncing' as any,
      });

      // Create sync log
      const syncLog = await storage.createSupplierSyncLog({
        supplierId: req.params.id,
        status: 'syncing' as any,
      });

      let products: any[] = [];
      let created = 0;
      let updated = 0;
      let failed = 0;

      try {
        // Use Foneday-specific service
        if (supplier.apiType === 'foneday') {
          const { fonedayApi } = await import('./services/foneday');
          const result = await fonedayApi.getProducts();
          products = result.products || [];

          // Process Foneday products
          for (const product of products) {
            try {
              const catalogProduct = {
                supplierId: req.params.id,
                externalSku: product.sku,
                externalEan: product.ean || null,
                externalArtcode: product.artcode || null,
                title: product.title,
                category: product.category || null,
                brand: product.product_brand || null,
                modelBrand: product.model_brand || null,
                modelCodes: product.model_codes ? JSON.stringify(product.model_codes) : null,
                suitableFor: product.suitable_for || null,
                quality: product.quality || null,
                priceCents: Math.round(product.price * 100),
                currency: 'EUR',
                inStock: product.instock === 'Y',
                stockQuantity: null,
                rawData: JSON.stringify(product),
              };

              if (!catalogProduct.externalSku || !catalogProduct.title) {
                failed++;
                continue;
              }

              const result = await storage.upsertSupplierCatalogProduct(catalogProduct);
              if (result.created) {
                created++;
              } else {
                updated++;
              }
            } catch (err) {
              console.error("Error processing Foneday product:", err);
              failed++;
            }
          }
        } else {
          // Generic API handling for other suppliers
          if (!supplier.apiSecretName || !supplier.apiProductsEndpoint) {
            throw new Error("Configurazione API incompleta per fornitore generico.");
          }

          const apiKey = process.env[supplier.apiSecretName];
          if (!apiKey) {
            throw new Error(`Segreto "${supplier.apiSecretName}" non trovato.`);
          }

          const headers: Record<string, string> = { 'Accept': 'application/json' };
          switch (supplier.apiAuthMethod) {
            case 'bearer_token':
              headers['Authorization'] = `Bearer ${apiKey}`;
              break;
            case 'api_key_header':
              headers['X-API-Key'] = apiKey;
              break;
            case 'basic_auth':
              headers['Authorization'] = `Basic ${Buffer.from(apiKey).toString('base64')}`;
              break;
            default:
              headers['Authorization'] = `Bearer ${apiKey}`;
          }

          const endpoint = supplier.apiAuthMethod === 'api_key_query'
            ? `${supplier.apiProductsEndpoint}${supplier.apiProductsEndpoint.includes('?') ? '&' : '?'}api_key=${apiKey}`
            : supplier.apiProductsEndpoint;

          const response = await fetch(endpoint, {
            method: 'GET',
            headers,
            signal: AbortSignal.timeout(60000),
          });

          if (!response.ok) {
            throw new Error(`API error: ${response.status} ${response.statusText}`);
          }

          const data = await response.json();
          products = Array.isArray(data) ? data : (data.products || data.items || data.data || []);

          // Process generic products
          for (const product of products) {
            try {
              const catalogProduct = {
                supplierId: req.params.id,
                externalSku: product.sku || product.code || product.id?.toString() || '',
                title: product.name || product.title || '',
                category: product.category || null,
                brand: product.brand || null,
                priceCents: product.price ? Math.round(parseFloat(product.price) * 100) : 0,
                currency: product.currency || 'EUR',
                inStock: product.instock === 'Y' || product.in_stock === true || product.available === true,
                rawData: JSON.stringify(product),
              };

              if (!catalogProduct.externalSku || !catalogProduct.title) {
                failed++;
                continue;
              }

              const result = await storage.upsertSupplierCatalogProduct(catalogProduct);
              if (result.created) {
                created++;
              } else {
                updated++;
              }
            } catch (err) {
              console.error("Error processing product:", err);
              failed++;
            }
          }
        }

        const durationMs = Date.now() - startTime;
        const finalStatus = failed > 0 && created + updated === 0 ? 'failed' : (failed > 0 ? 'partial' : 'success');

        // Update supplier with sync results
        await storage.updateSupplier(req.params.id, {
          catalogSyncStatus: finalStatus as any,
          catalogLastSyncAt: new Date(),
          catalogProductsCount: created + updated,
        });

        // Update sync log
        await storage.updateSupplierSyncLog(syncLog.id, {
          status: finalStatus as any,
          productsTotal: products.length,
          productsCreated: created,
          productsUpdated: updated,
          productsFailed: failed,
          durationMs: durationMs,
        });

        res.json({
          success: true,
          productsFetched: products.length,
          productsCreated: created,
          productsUpdated: updated,
          productsFailed: failed,
          productsSynced: created + updated,
        });
      } catch (error: any) {
        console.error("Catalog sync error:", error);

        // Update supplier and log with error
        await storage.updateSupplier(req.params.id, {
          catalogSyncStatus: 'failed' as any,
        });

        const durationMs = Date.now() - startTime;
        await storage.updateSupplierSyncLog(syncLog.id, {
          status: 'failed' as any,
          errorMessage: error.message,
          durationMs: durationMs,
        });

        res.status(500).json({
          success: false,
          message: error.message || "Errore durante la sincronizzazione del catalogo",
        });
      }
    } catch (error: any) {
      console.error("Sync catalog error:", error);
      res.status(500).send(error.message);
    }
  });

  // GET /api/suppliers/:id/catalog - List catalog products for a supplier
  app.get("/api/suppliers/:id/catalog", requireAuth, requireRole("admin", "repair_center"), async (req, res) => {
    try {
      const products = await storage.listSupplierCatalogProducts(req.params.id);
      res.json(products);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // GET /api/suppliers/:id/sync-logs - List sync logs for a supplier
  app.get("/api/suppliers/:id/sync-logs", requireAuth, requireRole("admin"), async (req, res) => {
    try {
      const logs = await storage.listSupplierSyncLogs(req.params.id);
      res.json(logs);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // ============ FONEDAY API ENDPOINTS ============

  // GET /api/foneday/orders - Get Foneday orders
  app.get("/api/foneday/orders", requireAuth, requireRole("admin"), async (req, res) => {
    try {
      const { fonedayApi } = await import('./services/foneday');
      const result = await fonedayApi.getOrders();
      res.json(result);
    } catch (error: any) {
      console.error("Foneday orders error:", error);
      res.status(500).json({ 
        success: false, 
        message: error.message || "Errore recupero ordini Foneday" 
      });
    }
  });


  // GET /api/foneday/invoices - Get Foneday invoices
  app.get("/api/foneday/invoices", requireAuth, requireRole("admin"), async (req, res) => {
    try {
      const { fonedayApi } = await import('./services/foneday');
      const result = await fonedayApi.getInvoices();
      res.json(result);
    } catch (error: any) {
      console.error("Foneday invoices error:", error);
      res.status(500).json({ 
        success: false, 
        message: error.message || "Errore recupero fatture Foneday" 
      });
    }
  });

  // GET /api/foneday/invoices/:number/pdf - Get invoice PDF
  app.get("/api/foneday/invoices/:number/pdf", requireAuth, requireRole("admin"), async (req, res) => {
    try {
      const invoiceNumber = parseInt(req.params.number);
      if (isNaN(invoiceNumber)) {
        return res.status(400).send("Numero fattura non valido");
      }

      const { fonedayApi } = await import('./services/foneday');
      const result = await fonedayApi.getInvoicePdf(invoiceNumber);
      res.json(result);
    } catch (error: any) {
      console.error("Foneday invoice PDF error:", error);
      res.status(500).json({ 
        success: false, 
        message: error.message || "Errore recupero PDF fattura" 
      });
    }
  });

  // GET /api/foneday/invoices/:number/xml - Get invoice XML
  app.get("/api/foneday/invoices/:number/xml", requireAuth, requireRole("admin"), async (req, res) => {
    try {
      const invoiceNumber = parseInt(req.params.number);
      if (isNaN(invoiceNumber)) {
        return res.status(400).send("Numero fattura non valido");
      }

      const { fonedayApi } = await import('./services/foneday');
      const xml = await fonedayApi.getInvoiceXml(invoiceNumber);
      res.type('application/xml').send(xml);
    } catch (error: any) {
      console.error("Foneday invoice XML error:", error);
      res.status(500).json({ 
        success: false, 
        message: error.message || "Errore recupero XML fattura" 
      });
    }
  });

  // GET /api/foneday/product/:sku - Get single Foneday product
  app.get("/api/foneday/product/:sku", requireAuth, requireRole("admin", "repair_center"), async (req, res) => {
    try {
      const { fonedayApi } = await import('./services/foneday');
      const result = await fonedayApi.getProduct(req.params.sku);
      res.json(result);
    } catch (error: any) {
      console.error("Foneday product error:", error);
      res.status(500).json({ 
        success: false, 
        message: error.message || "Errore recupero prodotto Foneday" 
      });
    }
  });

  // ============ TROVAUSATI API ENDPOINTS ============

  // GET /api/trovausati/credentials - Get TrovaUsati credentials for current reseller
  app.get("/api/trovausati/credentials", requireAuth, requireRole("admin", "reseller"), async (req, res) => {
    try {
      const resellerId = req.user!.role === 'admin' ? req.query.resellerId as string : req.user!.id;
      if (!resellerId) {
        return res.status(400).send("Reseller ID required");
      }
      
      const credential = await storage.getTrovausatiCredentialByReseller(resellerId);
      res.json(credential || null);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // POST /api/trovausati/credentials - Create TrovaUsati credentials
  app.post("/api/trovausati/credentials", requireAuth, requireRole("admin", "reseller"), async (req, res) => {
    try {
      const resellerId = req.user!.role === 'admin' ? req.body.resellerId : req.user!.id;
      if (!resellerId) {
        return res.status(400).send("Reseller ID required");
      }
      
      const existing = await storage.getTrovausatiCredentialByReseller(resellerId);
      if (existing) {
        return res.status(409).send("Credenziali già esistenti per questo reseller");
      }
      
      const credential = await storage.createTrovausatiCredential({
        resellerId,
        apiType: req.body.apiType || "resellers",
        apiKey: req.body.apiKey,
        marketplaceId: req.body.marketplaceId,
        isActive: true,
      });
      
      res.status(201).json(credential);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // PUT /api/trovausati/credentials/:id - Update TrovaUsati credentials
  app.put("/api/trovausati/credentials/:id", requireAuth, requireRole("admin", "reseller"), async (req, res) => {
    try {
      const credential = await storage.getTrovausatiCredential(req.params.id);
      if (!credential) {
        return res.status(404).send("Credenziali non trovate");
      }
      
      if (req.user!.role !== 'admin' && credential.resellerId !== req.user!.id) {
        return res.status(403).send("Non autorizzato");
      }
      
      const updated = await storage.updateTrovausatiCredential(req.params.id, {
        apiType: req.body.apiType,
        apiKey: req.body.apiKey,
        marketplaceId: req.body.marketplaceId,
        isActive: req.body.isActive,
      });
      
      res.json(updated);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // DELETE /api/trovausati/credentials/:id - Delete TrovaUsati credentials
  app.delete("/api/trovausati/credentials/:id", requireAuth, requireRole("admin", "reseller"), async (req, res) => {
    try {
      const credential = await storage.getTrovausatiCredential(req.params.id);
      if (!credential) {
        return res.status(404).send("Credenziali non trovate");
      }
      
      if (req.user!.role !== 'admin' && credential.resellerId !== req.user!.id) {
        return res.status(403).send("Non autorizzato");
      }
      
      await storage.deleteTrovausatiCredential(req.params.id);
      res.status(204).send();
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // POST /api/trovausati/test - Test TrovaUsati connection
  app.post("/api/trovausati/test", requireAuth, requireRole("admin", "reseller"), async (req, res) => {
    try {
      const resellerId = req.user!.role === 'admin' ? req.body.resellerId : req.user!.id;
      if (!resellerId) {
        return res.status(400).send("Reseller ID required");
      }
      
      const credential = await storage.getTrovausatiCredentialByReseller(resellerId);
      if (!credential) {
        return res.status(404).send("Credenziali TrovaUsati non configurate");
      }
      
      if (!credential.isActive) {
        return res.status(400).json({ success: false, message: "Credenziali disattivate" });
      }
      
      const { createTrovausatiService } = await import('./trovausatiService');
      const service = createTrovausatiService(credential);
      const result = await service.testConnection();
      
      await storage.updateTrovausatiCredential(credential.id, {
        lastTestAt: new Date(),
        lastTestResult: result.success ? "success" : result.message,
      });
      
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // GET /api/trovausati/models - Get available device models for valuation
  app.get("/api/trovausati/models", requireAuth, requireRole("admin", "reseller", "reseller_staff"), async (req, res) => {
    try {
      const resellerId = req.user!.role === 'admin' ? req.query.resellerId as string : 
        (req.user!.role === 'reseller' ? req.user!.id : req.user!.resellerId);
      if (!resellerId) {
        return res.status(400).send("Reseller ID required");
      }
      
      const credential = await storage.getTrovausatiCredentialByReseller(resellerId);
      if (!credential) {
        return res.status(404).send("Credenziali TrovaUsati non configurate");
      }
      
      const { createTrovausatiService } = await import('./trovausatiService');
      const service = createTrovausatiService(credential);
      const models = await service.getModels({
        brand: req.query.brand as string,
        type: req.query.type as string,
        search: req.query.search as string,
      });
      
      res.json(models);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // GET /api/trovausati/models/:id - Get model valuation details
  app.get("/api/trovausati/models/:id", requireAuth, requireRole("admin", "reseller", "reseller_staff"), async (req, res) => {
    try {
      const resellerId = req.user!.role === 'admin' ? req.query.resellerId as string : 
        (req.user!.role === 'reseller' ? req.user!.id : req.user!.resellerId);
      if (!resellerId) {
        return res.status(400).send("Reseller ID required");
      }
      
      const credential = await storage.getTrovausatiCredentialByReseller(resellerId);
      if (!credential) {
        return res.status(404).send("Credenziali TrovaUsati non configurate");
      }
      
      const modelId = parseInt(req.params.id);
      if (isNaN(modelId)) {
        return res.status(400).send("ID modello non valido");
      }
      
      const { createTrovausatiService } = await import('./trovausatiService');
      const service = createTrovausatiService(credential);
      const model = await service.getModelValuation(modelId, req.query.ean as string);
      
      res.json(model);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // GET /api/trovausati/marketplace/products - Get marketplace products
  app.get("/api/trovausati/marketplace/products", requireAuth, requireRole("admin", "reseller"), async (req, res) => {
    try {
      const resellerId = req.user!.role === 'admin' ? req.query.resellerId as string : req.user!.id;
      if (!resellerId) {
        return res.status(400).send("Reseller ID required");
      }
      
      const credential = await storage.getTrovausatiCredentialByReseller(resellerId);
      if (!credential) {
        return res.status(404).send("Credenziali TrovaUsati non configurate");
      }
      
      const { createTrovausatiService } = await import('./trovausatiService');
      const service = createTrovausatiService(credential);
      const products = await service.getMarketplaceProducts(
        parseInt(req.query.page as string) || 0,
        parseInt(req.query.limit as string) || 25
      );
      
      res.json(products);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // POST /api/trovausati/marketplace/order - Create marketplace order
  app.post("/api/trovausati/marketplace/order", requireAuth, requireRole("admin", "reseller"), async (req, res) => {
    try {
      const resellerId = req.user!.role === 'admin' ? req.body.resellerId : req.user!.id;
      if (!resellerId) {
        return res.status(400).send("Reseller ID required");
      }
      
      const credential = await storage.getTrovausatiCredentialByReseller(resellerId);
      if (!credential) {
        return res.status(404).send("Credenziali TrovaUsati non configurate");
      }
      
      const { createTrovausatiService } = await import('./trovausatiService');
      const service = createTrovausatiService(credential);
      const order = await service.orderProducts(req.body.productIds, req.body.reference);
      
      await storage.createTrovausatiOrder({
        credentialId: credential.id,
        externalOrderId: order.id.toString(),
        reference: order.attributes.reference,
        status: order.attributes.status as any,
        totalProducts: order.attributes.total_products,
        totalCents: order.attributes.price,
        addressData: JSON.stringify(order.attributes.address),
        productsData: JSON.stringify(order.attributes.products),
      });
      
      res.json(order);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // GET /api/trovausati/shops - List TrovaUsati shops
  app.get("/api/trovausati/shops", requireAuth, requireRole("admin", "reseller"), async (req, res) => {
    try {
      const resellerId = req.user!.role === 'admin' ? req.query.resellerId as string : req.user!.id;
      if (!resellerId) {
        return res.status(400).send("Reseller ID required");
      }
      
      const credential = await storage.getTrovausatiCredentialByReseller(resellerId);
      if (!credential) {
        return res.status(404).send("Credenziali TrovaUsati non configurate");
      }
      
      const shops = await storage.listTrovausatiShops(credential.id);
      res.json(shops);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // POST /api/trovausati/shops - Create TrovaUsati shop mapping
  app.post("/api/trovausati/shops", requireAuth, requireRole("admin", "reseller"), async (req, res) => {
    try {
      const resellerId = req.user!.role === 'admin' ? req.body.resellerId : req.user!.id;
      if (!resellerId) {
        return res.status(400).send("Reseller ID required");
      }
      
      const credential = await storage.getTrovausatiCredentialByReseller(resellerId);
      if (!credential) {
        return res.status(404).send("Credenziali TrovaUsati non configurate");
      }
      
      const shop = await storage.createTrovausatiShop({
        credentialId: credential.id,
        shopId: req.body.shopId,
        shopName: req.body.shopName,
        branchId: req.body.branchId,
        repairCenterId: req.body.repairCenterId,
        isActive: true,
      });
      
      res.status(201).json(shop);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // PUT /api/trovausati/shops/:id - Update TrovaUsati shop
  app.put("/api/trovausati/shops/:id", requireAuth, requireRole("admin", "reseller"), async (req, res) => {
    try {
      const shop = await storage.getTrovausatiShop(req.params.id);
      if (!shop) {
        return res.status(404).send("Negozio non trovato");
      }
      
      const resellerId = req.user!.role === 'admin' ? req.body.resellerId : req.user!.id;
      const credential = await storage.getTrovausatiCredentialByReseller(resellerId);
      
      if (!credential || shop.credentialId !== credential.id) {
        return res.status(403).send("Non autorizzato a modificare questo negozio");
      }
      
      const updated = await storage.updateTrovausatiShop(req.params.id, {
        shopId: req.body.shopId,
        shopName: req.body.shopName,
        branchId: req.body.branchId,
        repairCenterId: req.body.repairCenterId,
        isActive: req.body.isActive,
      });
      
      res.json(updated);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // DELETE /api/trovausati/shops/:id - Delete TrovaUsati shop
  app.delete("/api/trovausati/shops/:id", requireAuth, requireRole("admin", "reseller"), async (req, res) => {
    try {
      const shop = await storage.getTrovausatiShop(req.params.id);
      if (!shop) {
        return res.status(404).send("Negozio non trovato");
      }
      
      const resellerId = req.user!.role === 'admin' ? req.query.resellerId as string : req.user!.id;
      const credential = await storage.getTrovausatiCredentialByReseller(resellerId);
      
      if (!credential || shop.credentialId !== credential.id) {
        return res.status(403).send("Non autorizzato a eliminare questo negozio");
      }
      
      await storage.deleteTrovausatiShop(req.params.id);
      res.status(204).send();
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // GET /api/trovausati/coupons - List coupons (GDS)
  app.get("/api/trovausati/coupons", requireAuth, requireRole("admin", "reseller", "reseller_staff"), async (req, res) => {
    try {
      const resellerId = req.user!.role === 'admin' ? req.query.resellerId as string : 
        (req.user!.role === 'reseller' ? req.user!.id : req.user!.resellerId);
      if (!resellerId) {
        return res.status(400).send("Reseller ID required");
      }
      
      const credential = await storage.getTrovausatiCredentialByReseller(resellerId);
      if (!credential) {
        return res.status(404).send("Credenziali TrovaUsati non configurate");
      }
      
      const shopId = req.query.shopId as string;
      const { createTrovausatiService } = await import('./trovausatiService');
      const service = createTrovausatiService(credential, shopId);
      
      const result = await service.getCoupons({
        page: parseInt(req.query.page as string) || 0,
        pageSize: parseInt(req.query.pageSize as string) || 25,
        from: req.query.from as string,
        to: req.query.to as string,
        status: req.query.status as string,
      });
      
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // GET /api/trovausati/coupons/:code - Get coupon details
  app.get("/api/trovausati/coupons/:code", requireAuth, requireRole("admin", "reseller", "reseller_staff"), async (req, res) => {
    try {
      const resellerId = req.user!.role === 'admin' ? req.query.resellerId as string : 
        (req.user!.role === 'reseller' ? req.user!.id : req.user!.resellerId);
      if (!resellerId) {
        return res.status(400).send("Reseller ID required");
      }
      
      const credential = await storage.getTrovausatiCredentialByReseller(resellerId);
      if (!credential) {
        return res.status(404).send("Credenziali TrovaUsati non configurate");
      }
      
      const { createTrovausatiService } = await import('./trovausatiService');
      const service = createTrovausatiService(credential);
      const coupon = await service.getCoupon(req.params.code);
      
      res.json(coupon);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // PATCH /api/trovausati/coupons/:code/consume - Consume coupon
  app.patch("/api/trovausati/coupons/:code/consume", requireAuth, requireRole("admin", "reseller", "reseller_staff"), async (req, res) => {
    try {
      const resellerId = req.user!.role === 'admin' ? req.body.resellerId : 
        (req.user!.role === 'reseller' ? req.user!.id : req.user!.resellerId);
      if (!resellerId) {
        return res.status(400).send("Reseller ID required");
      }
      
      const credential = await storage.getTrovausatiCredentialByReseller(resellerId);
      if (!credential) {
        return res.status(404).send("Credenziali TrovaUsati non configurate");
      }
      
      if (!req.body.shopId) {
        return res.status(400).send("Shop ID required");
      }
      
      const { createTrovausatiService } = await import('./trovausatiService');
      const service = createTrovausatiService(credential, req.body.shopId);
      const coupon = await service.consumeCoupon(req.params.code);
      
      res.json(coupon);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // GET /api/trovausati/access-token - Get iframe access token
  app.get("/api/trovausati/access-token", requireAuth, requireRole("admin", "reseller", "reseller_staff"), async (req, res) => {
    try {
      const resellerId = req.user!.role === 'admin' ? req.query.resellerId as string : 
        (req.user!.role === 'reseller' ? req.user!.id : req.user!.resellerId);
      if (!resellerId) {
        return res.status(400).send("Reseller ID required");
      }
      
      const credential = await storage.getTrovausatiCredentialByReseller(resellerId);
      if (!credential) {
        return res.status(404).send("Credenziali TrovaUsati non configurate");
      }
      
      const shopId = req.query.shopId as string;
      if (!shopId) {
        return res.status(400).send("Shop ID required");
      }
      
      const { createTrovausatiService } = await import('./trovausatiService');
      const service = createTrovausatiService(credential, shopId);
      const token = await service.getAccessToken();
      
      res.json(token);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ============ PRODUCT SUPPLIERS (Relazione Prodotti-Fornitori) ============

  // GET /api/products/:id/suppliers - List suppliers for a product
  app.get("/api/products/:id/suppliers", requireAuth, requireRole("admin", "repair_center"), async (req, res) => {
    try {
      const productSuppliers = await storage.listProductSuppliers(req.params.id);
      
      // Enrich with supplier details
      const enriched = await Promise.all(productSuppliers.map(async (ps) => {
        const supplier = await storage.getSupplier(ps.supplierId);
        return { ...ps, supplier };
      }));
      
      res.json(enriched);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // GET /api/suppliers/:id/products - List products from a supplier
  app.get("/api/suppliers/:id/products", requireAuth, requireRole("admin", "repair_center"), async (req, res) => {
    try {
      const productSuppliers = await storage.listSupplierProducts(req.params.id);
      
      // Enrich with product details
      const enriched = await Promise.all(productSuppliers.map(async (ps) => {
        const product = await storage.getProduct(ps.productId);
        return { ...ps, product };
      }));
      
      res.json(enriched);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // POST /api/products/:id/suppliers - Add supplier to product (admin only)
  app.post("/api/products/:id/suppliers", requireAuth, requireRole("admin"), async (req, res) => {
    try {
      const validated = insertProductSupplierSchema.parse({
        ...req.body,
        productId: req.params.id,
      });
      
      const productSupplier = await storage.createProductSupplier(validated);
      res.status(201).json(productSupplier);
    } catch (error: any) {
      res.status(400).send(error.message);
    }
  });

  // PATCH /api/product-suppliers/:id - Update product supplier relationship (admin only)
  app.patch("/api/product-suppliers/:id", requireAuth, requireRole("admin"), async (req, res) => {
    try {
      const updated = await storage.updateProductSupplier(req.params.id, req.body);
      res.json(updated);
    } catch (error: any) {
      res.status(400).send(error.message);
    }
  });

  // DELETE /api/product-suppliers/:id - Remove supplier from product (admin only)
  app.delete("/api/product-suppliers/:id", requireAuth, requireRole("admin"), async (req, res) => {
    try {
      await storage.deleteProductSupplier(req.params.id);
      res.status(204).send();
    } catch (error: any) {
      res.status(400).send(error.message);
    }
  });

  // POST /api/products/:productId/suppliers/:supplierId/set-preferred - Set preferred supplier
  app.post("/api/products/:productId/suppliers/:supplierId/set-preferred", requireAuth, requireRole("admin"), async (req, res) => {
    try {
      await storage.setPreferredSupplier(req.params.productId, req.params.supplierId);
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).send(error.message);
    }
  });

  // ============ PRODUCT DEVICE COMPATIBILITIES ============

  // GET /api/products/:id/compatibilities - List device compatibilities for a product
  app.get("/api/products/:id/compatibilities", requireAuth, async (req, res) => {
    try {
      const compatibilities = await storage.listProductCompatibilities(req.params.id);
      
      // Enrich with brand and model names
      const enriched = await Promise.all(compatibilities.map(async (c) => {
        const brand = await storage.getDeviceBrand(c.deviceBrandId);
        const model = c.deviceModelId ? await storage.getDeviceModel(c.deviceModelId) : null;
        return {
          ...c,
          brandName: brand?.name,
          modelName: model?.name
        };
      }));
      
      res.json(enriched);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // PUT /api/products/:id/compatibilities - Set all compatibilities for a product (replace)
  app.put("/api/products/:id/compatibilities", requireAuth, requireRole("admin", "reseller"), async (req, res) => {
    try {
      const { compatibilities } = req.body as { 
        compatibilities: { deviceBrandId: string; deviceModelId?: string | null }[] 
      };
      
      if (!Array.isArray(compatibilities)) {
        return res.status(400).send("Il campo 'compatibilities' deve essere un array");
      }
      
      const result = await storage.setProductCompatibilities(req.params.id, compatibilities);
      res.json(result);
    } catch (error: any) {
      res.status(400).send(error.message);
    }
  });

  // POST /api/products/:id/compatibilities - Add a single compatibility
  app.post("/api/products/:id/compatibilities", requireAuth, requireRole("admin", "reseller"), async (req, res) => {
    try {
      const { deviceBrandId, deviceModelId } = req.body;
      
      if (!deviceBrandId) {
        return res.status(400).send("deviceBrandId è obbligatorio");
      }
      
      const compatibility = await storage.addProductCompatibility({
        productId: req.params.id,
        deviceBrandId,
        deviceModelId: deviceModelId || null
      });
      
      res.status(201).json(compatibility);
    } catch (error: any) {
      res.status(400).send(error.message);
    }
  });

  // DELETE /api/product-compatibilities/:id - Remove a single compatibility
  app.delete("/api/product-compatibilities/:id", requireAuth, requireRole("admin", "reseller"), async (req, res) => {
    try {
      await storage.removeProductCompatibility(req.params.id);
      res.status(204).send();
    } catch (error: any) {
      res.status(400).send(error.message);
    }
  });

  // ============ SUPPLIER ORDERS (Ordini a Fornitori) ============

  // GET /api/supplier-orders - List supplier orders
  app.get("/api/supplier-orders", requireAuth, requireRole("admin", "repair_center"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      const filters: { supplierId?: string; repairCenterId?: string; status?: string } = {};
      
      // Repair centers can only see their own orders
      if (req.user.role === 'repair_center') {
        if (!req.user.repairCenterId) {
          return res.json([]);
        }
        filters.repairCenterId = req.user.repairCenterId;
      } else if (req.query.repairCenterId) {
        filters.repairCenterId = req.query.repairCenterId as string;
      }
      
      if (req.query.supplierId) {
        filters.supplierId = req.query.supplierId as string;
      }
      if (req.query.status) {
        filters.status = req.query.status as string;
      }
      
      const orders = await storage.listSupplierOrders(filters);
      
      // Enrich with supplier names
      const enriched = await Promise.all(orders.map(async (order) => {
        const supplier = await storage.getSupplier(order.supplierId);
        const repairCenter = await storage.getRepairCenter(order.repairCenterId);
        return { ...order, supplierName: supplier?.name, repairCenterName: repairCenter?.name };
      }));
      
      res.json(enriched);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // GET /api/supplier-orders/:id - Get supplier order details
  app.get("/api/supplier-orders/:id", requireAuth, requireRole("admin", "repair_center"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      const order = await storage.getSupplierOrder(req.params.id);
      if (!order) {
        return res.status(404).send("Ordine non trovato");
      }
      
      // Repair center access check
      if (req.user.role === 'repair_center' && order.repairCenterId !== req.user.repairCenterId) {
        return res.status(403).send("Accesso negato");
      }
      
      const [supplier, repairCenter, items] = await Promise.all([
        storage.getSupplier(order.supplierId),
        storage.getRepairCenter(order.repairCenterId),
        storage.listSupplierOrderItems(order.id),
      ]);
      
      // Enrich items with product info
      const enrichedItems = await Promise.all(items.map(async (item) => {
        const product = item.productId ? await storage.getProduct(item.productId) : null;
        return { ...item, productName: product?.name };
      }));
      
      res.json({ ...order, supplier, repairCenter, items: enrichedItems });
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // GET /api/supplier-orders/:id/items - Get items for a supplier order
  app.get("/api/supplier-orders/:id/items", requireAuth, requireRole("admin", "repair_center"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      const order = await storage.getSupplierOrder(req.params.id);
      if (!order) {
        return res.status(404).send("Ordine non trovato");
      }
      
      // Repair center access check
      if (req.user.role === 'repair_center' && order.repairCenterId !== req.user.repairCenterId) {
        return res.status(403).send("Accesso negato");
      }
      
      const items = await storage.listSupplierOrderItems(order.id);
      
      // Enrich items with product info
      const enrichedItems = await Promise.all(items.map(async (item) => {
        const product = item.productId ? await storage.getProduct(item.productId) : null;
        return { ...item, productName: product?.name };
      }));
      
      res.json(enrichedItems);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // POST /api/supplier-orders - Create supplier order
  app.post("/api/supplier-orders", requireAuth, requireRole("admin", "repair_center"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      // Determine repair center ID
      let repairCenterId = req.body.repairCenterId;
      if (req.user.role === 'repair_center') {
        if (!req.user.repairCenterId) {
          return res.status(400).send("Centro riparazione non assegnato");
        }
        repairCenterId = req.user.repairCenterId;
      }
      
      const validated = insertSupplierOrderSchema.parse({
        ...req.body,
        repairCenterId,
        createdBy: req.user.id,
      });
      
      const order = await storage.createSupplierOrder(validated);
      res.status(201).json(order);
    } catch (error: any) {
      res.status(400).send(error.message);
    }
  });

  // PATCH /api/supplier-orders/:id - Update supplier order
  app.patch("/api/supplier-orders/:id", requireAuth, requireRole("admin", "repair_center"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      const order = await storage.getSupplierOrder(req.params.id);
      if (!order) {
        return res.status(404).send("Ordine non trovato");
      }
      
      // Repair center access check
      if (req.user.role === 'repair_center' && order.repairCenterId !== req.user.repairCenterId) {
        return res.status(403).send("Accesso negato");
      }
      
      // Don't allow editing after certain statuses
      if (['received', 'cancelled'].includes(order.status)) {
        return res.status(400).send("Ordine già completato o annullato");
      }
      
      const updated = await storage.updateSupplierOrder(req.params.id, req.body);
      res.json(updated);
    } catch (error: any) {
      res.status(400).send(error.message);
    }
  });

  // POST /api/supplier-orders/:id/status - Update order status
  app.post("/api/supplier-orders/:id/status", requireAuth, requireRole("admin", "repair_center"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      const order = await storage.getSupplierOrder(req.params.id);
      if (!order) {
        return res.status(404).send("Ordine non trovato");
      }
      
      // Repair center access check
      if (req.user.role === 'repair_center' && order.repairCenterId !== req.user.repairCenterId) {
        return res.status(403).send("Accesso negato");
      }
      
      const { status } = req.body;
      if (!status) {
        return res.status(400).send("Stato richiesto");
      }
      
      // Validate minimum order amount before sending
      if (status === 'sent') {
        const supplier = await storage.getSupplier(order.supplierId);
        if (supplier && supplier.minOrderAmount && supplier.minOrderAmount > 0) {
          if ((order.subtotal || 0) < supplier.minOrderAmount) {
            const minAmount = (supplier.minOrderAmount / 100).toFixed(2);
            const currentAmount = ((order.subtotal || 0) / 100).toFixed(2);
            return res.status(400).send(`Ordine minimo non raggiunto. Minimo: €${minAmount}, Attuale: €${currentAmount}`);
          }
        }
      }
      
      const updated = await storage.updateSupplierOrderStatus(req.params.id, status);
      
      // Log the communication if order was sent
      if (status === 'sent') {
        const supplier = await storage.getSupplier(order.supplierId);
        if (supplier) {
          await storage.createSupplierCommunicationLog({
            supplierId: supplier.id,
            communicationType: 'order_sent',
            channel: supplier.communicationChannel,
            entityType: 'supplier_order',
            entityId: order.id,
            content: `Ordine ${order.orderNumber} inviato`,
            sentAt: new Date(),
            createdBy: req.user.id,
          });
        }
      }
      
      res.json(updated);
    } catch (error: any) {
      res.status(400).send(error.message);
    }
  });

  // ============ SUPPLIER ORDER ITEMS (Righe Ordine) ============

  // POST /api/supplier-orders/:id/items - Add item to order
  app.post("/api/supplier-orders/:id/items", requireAuth, requireRole("admin", "repair_center"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      const order = await storage.getSupplierOrder(req.params.id);
      if (!order) {
        return res.status(404).send("Ordine non trovato");
      }
      
      // Repair center access check
      if (req.user.role === 'repair_center' && order.repairCenterId !== req.user.repairCenterId) {
        return res.status(403).send("Accesso negato");
      }
      
      // Only allow adding items to draft orders
      if (order.status !== 'draft') {
        return res.status(400).send("Impossibile modificare ordine già inviato");
      }
      
      const validated = insertSupplierOrderItemSchema.parse({
        ...req.body,
        supplierOrderId: req.params.id,
      });
      
      const item = await storage.createSupplierOrderItem(validated);
      
      // Recalculate order totals with free shipping threshold check
      const items = await storage.listSupplierOrderItems(req.params.id);
      const subtotal = items.reduce((sum, i) => sum + i.totalPrice, 0);
      const taxAmount = Math.round(subtotal * 0.22); // 22% IVA
      
      // Check free shipping threshold
      const supplier = await storage.getSupplier(order.supplierId);
      let shippingCost = order.shippingCost || 0;
      if (supplier && supplier.freeShippingThreshold && supplier.freeShippingThreshold > 0) {
        if (subtotal >= supplier.freeShippingThreshold) {
          shippingCost = 0; // Free shipping!
        }
      }
      
      const totalAmount = subtotal + taxAmount + shippingCost;
      
      await storage.updateSupplierOrder(req.params.id, { subtotal, taxAmount, shippingCost, totalAmount });
      
      res.status(201).json(item);
    } catch (error: any) {
      res.status(400).send(error.message);
    }
  });

  // DELETE /api/supplier-order-items/:id - Remove item from order
  app.delete("/api/supplier-order-items/:id", requireAuth, requireRole("admin", "repair_center"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      // Get item first to find the order
      const items = await db.execute(sql`SELECT * FROM supplier_order_items WHERE id = ${req.params.id}`);
      const item = items.rows[0] as any;
      if (!item) {
        return res.status(404).send("Riga non trovata");
      }
      
      const order = await storage.getSupplierOrder(item.supplier_order_id);
      if (!order) {
        return res.status(404).send("Ordine non trovato");
      }
      
      // Repair center access check
      if (req.user.role === 'repair_center' && order.repairCenterId !== req.user.repairCenterId) {
        return res.status(403).send("Accesso negato");
      }
      
      // Only allow removing items from draft orders
      if (order.status !== 'draft') {
        return res.status(400).send("Impossibile modificare ordine già inviato");
      }
      
      await storage.deleteSupplierOrderItem(req.params.id);
      
      // Recalculate order totals with free shipping threshold check
      const remainingItems = await storage.listSupplierOrderItems(order.id);
      const subtotal = remainingItems.reduce((sum, i) => sum + i.totalPrice, 0);
      const taxAmount = Math.round(subtotal * 0.22);
      
      // Check free shipping threshold
      const supplier = await storage.getSupplier(order.supplierId);
      let shippingCost = order.shippingCost || 0;
      if (supplier && supplier.freeShippingThreshold && supplier.freeShippingThreshold > 0) {
        // Reset shipping cost if below threshold
        if (subtotal < supplier.freeShippingThreshold) {
          // Keep existing shipping cost or set default
          shippingCost = order.shippingCost || 0;
        } else {
          shippingCost = 0; // Free shipping!
        }
      }
      
      const totalAmount = subtotal + taxAmount + shippingCost;
      
      await storage.updateSupplierOrder(order.id, { subtotal, taxAmount, shippingCost, totalAmount });
      
      res.status(204).send();
    } catch (error: any) {
      res.status(400).send(error.message);
    }
  });

  // POST /api/supplier-order-items/:id/receive - Mark item as received (with incremental inventory movement)
  app.post("/api/supplier-order-items/:id/receive", requireAuth, requireRole("admin", "repair_center"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      const { quantityReceived } = req.body;
      if (typeof quantityReceived !== 'number' || quantityReceived < 0) {
        return res.status(400).send("Quantità non valida");
      }
      
      // Get current item BEFORE update to calculate delta
      const currentItems = await db.execute(sql`SELECT * FROM supplier_order_items WHERE id = ${req.params.id}`);
      const currentItem = currentItems.rows[0] as any;
      if (!currentItem) {
        return res.status(404).send("Articolo non trovato");
      }
      
      const oldQuantityReceived = currentItem.quantity_received || 0;
      const delta = quantityReceived - oldQuantityReceived;
      
      // Update the item
      const item = await storage.updateSupplierOrderItemReceived(req.params.id, quantityReceived);
      
      // Create incremental inventory movement only if delta > 0 and product is linked
      if (delta > 0 && currentItem.product_id) {
        const order = await storage.getSupplierOrder(currentItem.supplier_order_id);
        if (order) {
          await storage.createInventoryMovement({
            productId: currentItem.product_id,
            repairCenterId: order.repairCenterId,
            movementType: 'in',
            quantity: delta,
            notes: `Ordine fornitore ${order.orderNumber} - Ricezione parziale (+${delta})`,
            createdBy: req.user.id,
          });
        }
      }
      
      // Check if all items are received to update order status
      const orderItems = await storage.listSupplierOrderItems(currentItem.supplier_order_id);
      const allReceived = orderItems.every(i => (i.quantityReceived || 0) >= i.quantity);
      const someReceived = orderItems.some(i => (i.quantityReceived || 0) > 0);
      
      if (allReceived) {
        await storage.updateSupplierOrderStatus(currentItem.supplier_order_id, 'received');
      } else if (someReceived) {
        await storage.updateSupplierOrderStatus(currentItem.supplier_order_id, 'partially_received');
      }
      
      res.json(item);
    } catch (error: any) {
      res.status(400).send(error.message);
    }
  });

  // ============ SUPPLIER RETURNS (Resi a Fornitori) ============

  // GET /api/supplier-returns - List supplier returns
  app.get("/api/supplier-returns", requireAuth, requireRole("admin", "repair_center"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      const filters: { supplierId?: string; repairCenterId?: string; status?: string } = {};
      
      if (req.user.role === 'repair_center') {
        if (!req.user.repairCenterId) {
          return res.json([]);
        }
        filters.repairCenterId = req.user.repairCenterId;
      } else if (req.query.repairCenterId) {
        filters.repairCenterId = req.query.repairCenterId as string;
      }
      
      if (req.query.supplierId) {
        filters.supplierId = req.query.supplierId as string;
      }
      if (req.query.status) {
        filters.status = req.query.status as string;
      }
      
      const returns = await storage.listSupplierReturns(filters);
      
      // Enrich with supplier names
      const enriched = await Promise.all(returns.map(async (ret) => {
        const supplier = await storage.getSupplier(ret.supplierId);
        return { ...ret, supplierName: supplier?.name };
      }));
      
      res.json(enriched);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // GET /api/supplier-returns/:id - Get return details
  app.get("/api/supplier-returns/:id", requireAuth, requireRole("admin", "repair_center"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      const returnData = await storage.getSupplierReturn(req.params.id);
      if (!returnData) {
        return res.status(404).send("Reso non trovato");
      }
      
      // Repair center access check
      if (req.user.role === 'repair_center' && returnData.repairCenterId !== req.user.repairCenterId) {
        return res.status(403).send("Accesso negato");
      }
      
      const [supplier, items] = await Promise.all([
        storage.getSupplier(returnData.supplierId),
        storage.listSupplierReturnItems(returnData.id),
      ]);
      
      res.json({ ...returnData, supplier, items });
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // GET /api/supplier-returns/:id/items - Get items for a supplier return
  app.get("/api/supplier-returns/:id/items", requireAuth, requireRole("admin", "repair_center"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      const returnData = await storage.getSupplierReturn(req.params.id);
      if (!returnData) {
        return res.status(404).send("Reso non trovato");
      }
      
      // Repair center access check
      if (req.user.role === 'repair_center' && returnData.repairCenterId !== req.user.repairCenterId) {
        return res.status(403).send("Accesso negato");
      }
      
      const items = await storage.listSupplierReturnItems(returnData.id);
      
      // Enrich items with product info
      const enrichedItems = await Promise.all(items.map(async (item) => {
        const product = item.productId ? await storage.getProduct(item.productId) : null;
        return { ...item, productName: product?.name };
      }));
      
      res.json(enrichedItems);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // POST /api/supplier-returns - Create supplier return
  app.post("/api/supplier-returns", requireAuth, requireRole("admin", "repair_center"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      let repairCenterId = req.body.repairCenterId;
      if (req.user.role === 'repair_center') {
        if (!req.user.repairCenterId) {
          return res.status(400).send("Centro riparazione non assegnato");
        }
        repairCenterId = req.user.repairCenterId;
      }
      
      const validated = insertSupplierReturnSchema.parse({
        ...req.body,
        repairCenterId,
        createdBy: req.user.id,
      });
      
      const returnData = await storage.createSupplierReturn(validated);
      res.status(201).json(returnData);
    } catch (error: any) {
      res.status(400).send(error.message);
    }
  });

  // PATCH /api/supplier-returns/:id - Update return
  app.patch("/api/supplier-returns/:id", requireAuth, requireRole("admin", "repair_center"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      const returnData = await storage.getSupplierReturn(req.params.id);
      if (!returnData) {
        return res.status(404).send("Reso non trovato");
      }
      
      if (req.user.role === 'repair_center' && returnData.repairCenterId !== req.user.repairCenterId) {
        return res.status(403).send("Accesso negato");
      }
      
      const updated = await storage.updateSupplierReturn(req.params.id, req.body);
      res.json(updated);
    } catch (error: any) {
      res.status(400).send(error.message);
    }
  });

  // POST /api/supplier-returns/:id/status - Update return status
  app.post("/api/supplier-returns/:id/status", requireAuth, requireRole("admin", "repair_center"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      const returnData = await storage.getSupplierReturn(req.params.id);
      if (!returnData) {
        return res.status(404).send("Reso non trovato");
      }
      
      if (req.user.role === 'repair_center' && returnData.repairCenterId !== req.user.repairCenterId) {
        return res.status(403).send("Accesso negato");
      }
      
      const { status } = req.body;
      if (!status) {
        return res.status(400).send("Stato richiesto");
      }
      
      // Only create inventory movements if status is changing FROM something else TO shipped
      // This ensures idempotency - if already shipped, don't create duplicate movements
      const wasAlreadyShipped = returnData.status === 'shipped';
      
      const updated = await storage.updateSupplierReturnStatus(req.params.id, status);
      
      // Decrement inventory when return is shipped to supplier (only on first transition to shipped)
      if (status === 'shipped' && !wasAlreadyShipped) {
        const items = await storage.listSupplierReturnItems(returnData.id);
        for (const item of items) {
          // Only process items with quantity and a linked product
          if (item.quantity > 0 && item.productId) {
            // Create negative movement (out) for shipped returns
            await storage.createInventoryMovement({
              productId: item.productId,
              repairCenterId: returnData.repairCenterId,
              movementType: 'out',
              quantity: item.quantity,
              notes: `Reso fornitore ${returnData.returnNumber} - Spedito al fornitore`,
              createdBy: req.user.id,
            });
          }
        }
      }
      
      res.json(updated);
    } catch (error: any) {
      res.status(400).send(error.message);
    }
  });

  // POST /api/supplier-returns/:id/items - Add item to return
  app.post("/api/supplier-returns/:id/items", requireAuth, requireRole("admin", "repair_center"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      const returnData = await storage.getSupplierReturn(req.params.id);
      if (!returnData) {
        return res.status(404).send("Reso non trovato");
      }
      
      if (req.user.role === 'repair_center' && returnData.repairCenterId !== req.user.repairCenterId) {
        return res.status(403).send("Accesso negato");
      }
      
      const validated = insertSupplierReturnItemSchema.parse({
        ...req.body,
        supplierReturnId: req.params.id,
      });
      
      const item = await storage.createSupplierReturnItem(validated);
      
      // Update return total
      const items = await storage.listSupplierReturnItems(req.params.id);
      const totalAmount = items.reduce((sum, i) => sum + i.totalPrice, 0);
      await storage.updateSupplierReturn(req.params.id, { totalAmount });
      
      res.status(201).json(item);
    } catch (error: any) {
      res.status(400).send(error.message);
    }
  });

  // ============ SUPPLIER COMMUNICATION LOGS ============

  // GET /api/supplier-communications - List communication logs
  app.get("/api/supplier-communications", requireAuth, requireRole("admin", "repair_center"), async (req, res) => {
    try {
      const filters: { supplierId?: string; entityType?: string; entityId?: string } = {};
      
      if (req.query.supplierId) {
        filters.supplierId = req.query.supplierId as string;
      }
      if (req.query.entityType) {
        filters.entityType = req.query.entityType as string;
      }
      if (req.query.entityId) {
        filters.entityId = req.query.entityId as string;
      }
      
      const logs = await storage.listSupplierCommunicationLogs(filters);
      res.json(logs);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // POST /api/supplier-communications - Create communication log (manual entry)
  app.post("/api/supplier-communications", requireAuth, requireRole("admin", "repair_center"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      const validated = insertSupplierCommunicationLogSchema.parse({
        ...req.body,
        createdBy: req.user.id,
      });
      
      const log = await storage.createSupplierCommunicationLog(validated);
      res.status(201).json(log);
    } catch (error: any) {
      res.status(400).send(error.message);
    }
  });

  // ============ EXTERNAL INTEGRATIONS (INTEGRAZIONI ESTERNE) ============

  // GET /api/external-integrations - List all integrations (admins get all, resellers get active only)
  app.get("/api/external-integrations", requireAuth, requireRole("admin", "reseller", "reseller_staff"), async (req, res) => {
    try {
      // Admin sees all, others see only active
      if (req.user?.role === 'admin') {
        const integrations = await storage.listExternalIntegrations();
        res.json(integrations);
      } else {
        const integrations = await storage.listActiveExternalIntegrations();
        res.json(integrations);
      }
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // GET /api/external-integrations/:id - Get single integration
  app.get("/api/external-integrations/:id", requireAuth, requireRole("admin", "reseller", "reseller_staff"), async (req, res) => {
    try {
      const integration = await storage.getExternalIntegration(req.params.id);
      if (!integration) {
        return res.status(404).send("Integrazione non trovata");
      }
      // Non-admin users can only see active integrations
      if (req.user?.role !== 'admin' && !integration.isActive) {
        return res.status(404).send("Integrazione non trovata");
      }
      res.json(integration);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // POST /api/external-integrations - Create integration (admin only)
  app.post("/api/external-integrations", requireAuth, requireRole("admin"), async (req, res) => {
    try {
      const integration = await storage.createExternalIntegration(req.body);
      res.status(201).json(integration);
    } catch (error: any) {
      res.status(400).send(error.message);
    }
  });

  // PATCH /api/external-integrations/:id - Update integration (admin only)
  app.patch("/api/external-integrations/:id", requireAuth, requireRole("admin"), async (req, res) => {
    try {
      const integration = await storage.updateExternalIntegration(req.params.id, req.body);
      res.json(integration);
    } catch (error: any) {
      res.status(400).send(error.message);
    }
  });

  // DELETE /api/external-integrations/:id - Delete integration (admin only)
  app.delete("/api/external-integrations/:id", requireAuth, requireRole("admin"), async (req, res) => {
    try {
      await storage.deleteExternalIntegration(req.params.id);
      res.status(204).send();
    } catch (error: any) {
      res.status(400).send(error.message);
    }
  });

  // ============ PARTS LOAD DOCUMENTS (CARICO RICAMBI) ============

  // GET /api/parts-load - List parts load documents
  app.get("/api/parts-load", requireAuth, requireRole("admin", "repair_center"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      const filters: { repairCenterId?: string; supplierId?: string; status?: string } = {};
      
      // Filter by repair center for non-admin users
      if (req.user.role === 'repair_center') {
        if (!req.user.repairCenterId) {
          return res.status(400).send("Centro riparazione non assegnato");
        }
        filters.repairCenterId = req.user.repairCenterId;
      } else if (req.query.repairCenterId) {
        filters.repairCenterId = req.query.repairCenterId as string;
      }
      
      if (req.query.supplierId) {
        filters.supplierId = req.query.supplierId as string;
      }
      if (req.query.status) {
        filters.status = req.query.status as string;
      }
      
      const documents = await storage.listPartsLoadDocuments(filters);
      
      // Enrich with supplier and repair center names
      const enriched = await Promise.all(documents.map(async (doc) => {
        const [supplier, repairCenter] = await Promise.all([
          storage.getSupplier(doc.supplierId),
          storage.getRepairCenter(doc.repairCenterId),
        ]);
        return {
          ...doc,
          supplierName: supplier?.name,
          repairCenterName: repairCenter?.name,
        };
      }));
      
      res.json(enriched);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // GET /api/parts-load/:id - Get parts load document details
  app.get("/api/parts-load/:id", requireAuth, requireRole("admin", "repair_center"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      const doc = await storage.getPartsLoadDocument(req.params.id);
      if (!doc) {
        return res.status(404).send("Documento di carico non trovato");
      }
      
      // Repair center access check
      if (req.user.role === 'repair_center' && doc.repairCenterId !== req.user.repairCenterId) {
        return res.status(403).send("Accesso negato");
      }
      
      const [supplier, repairCenter, items] = await Promise.all([
        storage.getSupplier(doc.supplierId),
        storage.getRepairCenter(doc.repairCenterId),
        storage.listPartsLoadItems(doc.id),
      ]);
      
      // Enrich items with product/repair order info
      const enrichedItems = await Promise.all(items.map(async (item) => {
        let product = null;
        let repairOrder = null;
        let partsOrder = null;
        
        if (item.matchedProductId) {
          product = await storage.getProduct(item.matchedProductId);
        }
        if (item.matchedRepairOrderId) {
          repairOrder = await storage.getRepairOrder(item.matchedRepairOrderId);
        }
        if (item.matchedPartsOrderId) {
          partsOrder = await storage.getPartsOrder(item.matchedPartsOrderId);
        }
        
        return {
          ...item,
          product,
          repairOrder,
          partsOrder,
        };
      }));
      
      res.json({
        ...doc,
        supplier,
        repairCenter,
        items: enrichedItems,
      });
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // POST /api/parts-load - Create parts load document
  app.post("/api/parts-load", requireAuth, requireRole("admin", "repair_center"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      let repairCenterId = req.body.repairCenterId;
      if (req.user.role === 'repair_center') {
        if (!req.user.repairCenterId) {
          return res.status(400).send("Centro riparazione non assegnato");
        }
        repairCenterId = req.user.repairCenterId;
      }
      
      // Convert documentDate string to Date object
      const bodyWithDate = {
        ...req.body,
        documentDate: req.body.documentDate ? new Date(req.body.documentDate) : undefined,
        repairCenterId,
        createdBy: req.user.id,
      };
      
      const validated = insertPartsLoadDocumentSchema.parse(bodyWithDate);
      
      const doc = await storage.createPartsLoadDocument(validated);
      res.status(201).json(doc);
    } catch (error: any) {
      res.status(400).send(error.message);
    }
  });

  // PATCH /api/parts-load/:id - Update parts load document
  app.patch("/api/parts-load/:id", requireAuth, requireRole("admin", "repair_center"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      const doc = await storage.getPartsLoadDocument(req.params.id);
      if (!doc) {
        return res.status(404).send("Documento di carico non trovato");
      }
      
      if (req.user.role === 'repair_center' && doc.repairCenterId !== req.user.repairCenterId) {
        return res.status(403).send("Accesso negato");
      }
      
      const updated = await storage.updatePartsLoadDocument(req.params.id, req.body);
      res.json(updated);
    } catch (error: any) {
      res.status(400).send(error.message);
    }
  });

  // POST /api/parts-load/:id/process - Process document (auto-match items)
  app.post("/api/parts-load/:id/process", requireAuth, requireRole("admin", "repair_center"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      const doc = await storage.getPartsLoadDocument(req.params.id);
      if (!doc) {
        return res.status(404).send("Documento di carico non trovato");
      }
      
      if (req.user.role === 'repair_center' && doc.repairCenterId !== req.user.repairCenterId) {
        return res.status(403).send("Accesso negato");
      }
      
      // Update status to processing
      await storage.updatePartsLoadDocument(req.params.id, { status: 'processing' as any });
      
      // Process document - auto-match items
      const result = await storage.processPartsLoadDocument(req.params.id);
      
      res.json({
        message: "Elaborazione completata",
        ...result,
      });
    } catch (error: any) {
      res.status(400).send(error.message);
    }
  });

  // POST /api/parts-load/:id/items - Add item to parts load document
  app.post("/api/parts-load/:id/items", requireAuth, requireRole("admin", "repair_center"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      const doc = await storage.getPartsLoadDocument(req.params.id);
      if (!doc) {
        return res.status(404).send("Documento di carico non trovato");
      }
      
      if (req.user.role === 'repair_center' && doc.repairCenterId !== req.user.repairCenterId) {
        return res.status(403).send("Accesso negato");
      }
      
      const validated = insertPartsLoadItemSchema.parse({
        ...req.body,
        partsLoadDocumentId: req.params.id,
      });
      
      const item = await storage.createPartsLoadItem(validated);
      res.status(201).json(item);
    } catch (error: any) {
      res.status(400).send(error.message);
    }
  });

  // POST /api/parts-load/:id/bulk-items - Bulk import items from pasted text
  app.post("/api/parts-load/:id/bulk-items", requireAuth, requireRole("admin", "repair_center"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      const doc = await storage.getPartsLoadDocument(req.params.id);
      if (!doc) {
        return res.status(404).send("Documento di carico non trovato");
      }
      
      if (req.user.role === 'repair_center' && doc.repairCenterId !== req.user.repairCenterId) {
        return res.status(403).send("Accesso negato");
      }
      
      if (doc.status !== 'draft') {
        return res.status(400).send("Solo i documenti in bozza possono essere modificati");
      }
      
      const { items, createProducts } = req.body;
      
      if (!Array.isArray(items) || items.length === 0) {
        return res.status(400).send("Nessun articolo da importare");
      }
      
      const results = {
        imported: 0,
        productsCreated: 0,
        errors: [] as string[],
      };
      
      // Load products and supplier once at the beginning for efficiency
      let allProducts: any[] = [];
      let supplierName: string | undefined;
      
      if (createProducts) {
        allProducts = await storage.listProducts();
        if (doc.supplierId) {
          const supplier = await storage.getSupplier(doc.supplierId);
          supplierName = supplier?.name;
        }
      }
      
      // Create a map for quick lookup
      const productMap = new Map<string, string>();
      for (const p of allProducts) {
        productMap.set(p.sku.toLowerCase(), p.id);
        if (p.supplierCode) {
          productMap.set(p.supplierCode.toLowerCase(), p.id);
        }
      }
      
      for (const item of items) {
        try {
          // Validate and coerce item fields
          const partCode = String(item.partCode || '').trim();
          const description = String(item.description || '').trim();
          const quantity = Math.max(1, parseInt(String(item.quantity)) || 1);
          const unitPrice = Math.max(0, parseFloat(String(item.unitPrice)) || 0);
          const category = String(item.category || 'ricambio').trim();
          
          if (!partCode || !description) {
            results.errors.push(`Riga incompleta: ${partCode || 'codice mancante'}`);
            continue;
          }
          
          let productId: string | undefined;
          
          // Se createProducts è true, cerca/crea il prodotto
          if (createProducts) {
            // Check existing product from map
            const existingProductId = productMap.get(partCode.toLowerCase());
            
            if (existingProductId) {
              productId = existingProductId;
            } else {
              // Crea nuovo prodotto
              const newProduct = await storage.createProduct({
                name: description,
                sku: partCode,
                category: category,
                productType: 'ricambio',
                description: description,
                unitPrice: Math.round(unitPrice * 100),
                costPrice: Math.round(unitPrice * 100),
                supplier: supplierName,
                supplierCode: partCode,
              });
              productId = newProduct.id;
              // Add to map for subsequent lookups
              productMap.set(partCode.toLowerCase(), newProduct.id);
              results.productsCreated++;
            }
          }
          
          // Crea la riga del carico
          await storage.createPartsLoadItem({
            partsLoadDocumentId: doc.id,
            partCode,
            description,
            quantity,
            unitPrice: Math.round(unitPrice * 100),
            totalPrice: Math.round(unitPrice * 100 * quantity),
            status: 'pending',
            matchedProductId: productId,
          });
          
          results.imported++;
        } catch (err: any) {
          results.errors.push(`Errore riga ${item.partCode}: ${err.message}`);
        }
      }
      
      // Aggiorna totali documento
      const docItems = await storage.listPartsLoadItems(doc.id);
      const totalItems = docItems.length;
      const totalQuantity = docItems.reduce((sum, i) => sum + i.quantity, 0);
      const totalAmount = docItems.reduce((sum, i) => sum + i.totalPrice, 0);
      
      await storage.updatePartsLoadDocument(doc.id, {
        totalItems,
        totalQuantity,
        totalAmount,
      });
      
      res.json({
        message: `Importati ${results.imported} articoli`,
        ...results,
      });
    } catch (error: any) {
      res.status(400).send(error.message);
    }
  });

  // PATCH /api/parts-load-items/:id - Update parts load item
  app.patch("/api/parts-load-items/:id", requireAuth, requireRole("admin", "repair_center"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      const item = await storage.getPartsLoadItem(req.params.id);
      if (!item) {
        return res.status(404).send("Riga carico non trovata");
      }
      
      const doc = await storage.getPartsLoadDocument(item.partsLoadDocumentId);
      if (!doc) {
        return res.status(404).send("Documento di carico non trovato");
      }
      
      if (req.user.role === 'repair_center' && doc.repairCenterId !== req.user.repairCenterId) {
        return res.status(403).send("Accesso negato");
      }
      
      const updated = await storage.updatePartsLoadItem(req.params.id, req.body);
      res.json(updated);
    } catch (error: any) {
      res.status(400).send(error.message);
    }
  });

  // DELETE /api/parts-load-items/:id - Delete parts load item
  app.delete("/api/parts-load-items/:id", requireAuth, requireRole("admin", "repair_center"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      const item = await storage.getPartsLoadItem(req.params.id);
      if (!item) {
        return res.status(404).send("Riga carico non trovata");
      }
      
      const doc = await storage.getPartsLoadDocument(item.partsLoadDocumentId);
      if (!doc) {
        return res.status(404).send("Documento di carico non trovato");
      }
      
      if (req.user.role === 'repair_center' && doc.repairCenterId !== req.user.repairCenterId) {
        return res.status(403).send("Accesso negato");
      }
      
      await storage.deletePartsLoadItem(req.params.id);
      res.status(204).send();
    } catch (error: any) {
      res.status(400).send(error.message);
    }
  });

  // POST /api/parts-load-items/:id/match - Manual match item
  app.post("/api/parts-load-items/:id/match", requireAuth, requireRole("admin", "repair_center"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      const item = await storage.getPartsLoadItem(req.params.id);
      if (!item) {
        return res.status(404).send("Riga carico non trovata");
      }
      
      const doc = await storage.getPartsLoadDocument(item.partsLoadDocumentId);
      if (!doc) {
        return res.status(404).send("Documento di carico non trovato");
      }
      
      if (req.user.role === 'repair_center' && doc.repairCenterId !== req.user.repairCenterId) {
        return res.status(403).send("Accesso negato");
      }
      
      const { partsOrderId, productId } = req.body;
      
      if (!partsOrderId && !productId) {
        return res.status(400).send("Specificare partsOrderId o productId");
      }
      
      const matched = await storage.matchPartsLoadItem(req.params.id, partsOrderId, productId);
      
      // Recalculate document totals
      const items = await storage.listPartsLoadItems(item.partsLoadDocumentId);
      const matchedCount = items.filter(i => i.status === 'matched').length;
      const stockCount = items.filter(i => i.status === 'stock').length;
      const errorCount = items.filter(i => i.status === 'error').length;
      
      await storage.updatePartsLoadDocument(item.partsLoadDocumentId, {
        matchedItems: matchedCount,
        stockItems: stockCount,
        errorItems: errorCount,
        status: (errorCount === 0 && items.every(i => i.status !== 'pending') ? 'completed' : 'partial') as any,
      });
      
      res.json(matched);
    } catch (error: any) {
      res.status(400).send(error.message);
    }
  });

  // POST /api/parts-load-items/:id/add-to-inventory - Add matched item to inventory
  app.post("/api/parts-load-items/:id/add-to-inventory", requireAuth, requireRole("admin", "repair_center"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      const item = await storage.getPartsLoadItem(req.params.id);
      if (!item) {
        return res.status(404).send("Riga carico non trovata");
      }
      
      if (item.addedToInventory) {
        return res.status(400).send("Articolo già aggiunto all'inventario");
      }
      
      if (item.status !== 'stock' || !item.matchedProductId) {
        return res.status(400).send("L'articolo deve essere abbinato a un prodotto per essere aggiunto all'inventario");
      }
      
      const doc = await storage.getPartsLoadDocument(item.partsLoadDocumentId);
      if (!doc) {
        return res.status(404).send("Documento di carico non trovato");
      }
      
      if (req.user.role === 'repair_center' && doc.repairCenterId !== req.user.repairCenterId) {
        return res.status(403).send("Accesso negato");
      }
      
      const { stockLocation } = req.body;
      
      // Create inventory movement
      const movement = await storage.createInventoryMovement({
        productId: item.matchedProductId,
        repairCenterId: doc.repairCenterId,
        movementType: 'in',
        quantity: item.quantity,
        notes: `Carico ricambi ${doc.loadNumber} - ${item.description}`,
        createdBy: req.user.id,
      });
      
      // Update item
      const updated = await storage.updatePartsLoadItem(req.params.id, {
        addedToInventory: true,
        inventoryMovementId: movement.id,
        stockLocationConfirmed: stockLocation || item.stockLocationSuggested,
      });
      
      res.json(updated);
    } catch (error: any) {
      res.status(400).send(error.message);
    }
  });

  // GET /api/parts-orders/waiting - Get parts orders waiting for arrival
  app.get("/api/parts-orders/waiting", requireAuth, requireRole("admin", "repair_center"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      let filters: { repairCenterId?: string; status?: string } = { status: 'ordered' };
      
      if (req.user.role === 'repair_center') {
        filters.repairCenterId = req.user.repairCenterId || undefined;
      }
      
      const orders = await storage.listAllPartsOrders(filters);
      res.json(orders);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // ==========================================
  // UTILITY MODULE API
  // ==========================================

  // ----- UTILITY SUPPLIERS -----

  // GET /api/utility/suppliers - List utility suppliers
  app.get("/api/utility/suppliers", requireAuth, requireRole("admin", "reseller"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      let filters: { resellerId?: string } = {};
      if (req.user.role === 'reseller') {
        filters.resellerId = req.user.id;
      }
      
      const suppliers = await storage.listUtilitySuppliers(filters);
      res.json(suppliers);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // GET /api/utility/suppliers/:id - Get utility supplier
  app.get("/api/utility/suppliers/:id", requireAuth, requireRole("admin", "reseller"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      const supplier = await storage.getUtilitySupplier(req.params.id);
      if (!supplier) {
        return res.status(404).send("Fornitore utility non trovato");
      }
      
      // Reseller può vedere solo i propri fornitori o quelli globali
      if (req.user.role === 'reseller' && supplier.resellerId && supplier.resellerId !== req.user.id) {
        return res.status(403).send("Accesso non autorizzato a questo fornitore");
      }
      
      res.json(supplier);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // POST /api/utility/suppliers - Create utility supplier (Admin o Reseller)
  app.post("/api/utility/suppliers", requireAuth, requireRole("admin", "reseller"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      const validated = insertUtilitySupplierSchema.parse(req.body);
      
      // Se reseller, assegna automaticamente il resellerId
      if (req.user.role === 'reseller') {
        (validated as any).resellerId = req.user.id;
      }
      // Admin può creare fornitori globali (resellerId = null) o assegnati
      
      const supplier = await storage.createUtilitySupplier(validated);
      res.status(201).json(supplier);
    } catch (error: any) {
      res.status(400).send(error.message);
    }
  });

  // PATCH /api/utility/suppliers/:id - Update utility supplier
  app.patch("/api/utility/suppliers/:id", requireAuth, requireRole("admin", "reseller"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      const existingSupplier = await storage.getUtilitySupplier(req.params.id);
      if (!existingSupplier) {
        return res.status(404).send("Fornitore utility non trovato");
      }
      
      // Reseller può modificare solo i propri fornitori (non quelli globali)
      if (req.user.role === 'reseller') {
        if (!existingSupplier.resellerId || existingSupplier.resellerId !== req.user.id) {
          return res.status(403).send("Non puoi modificare fornitori globali o di altri reseller");
        }
        // Impedisce al reseller di cambiare il resellerId
        delete req.body.resellerId;
      }
      
      const supplier = await storage.updateUtilitySupplier(req.params.id, req.body);
      res.json(supplier);
    } catch (error: any) {
      res.status(400).send(error.message);
    }
  });

  // DELETE /api/utility/suppliers/:id - Delete utility supplier
  app.delete("/api/utility/suppliers/:id", requireAuth, requireRole("admin", "reseller"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      const existingSupplier = await storage.getUtilitySupplier(req.params.id);
      if (!existingSupplier) {
        return res.status(404).send("Fornitore utility non trovato");
      }
      
      // Reseller può eliminare solo i propri fornitori (non quelli globali)
      if (req.user.role === 'reseller') {
        if (!existingSupplier.resellerId || existingSupplier.resellerId !== req.user.id) {
          return res.status(403).send("Non puoi eliminare fornitori globali o di altri reseller");
        }
      }
      
      await storage.deleteUtilitySupplier(req.params.id);
      res.status(204).send();
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // ----- UTILITY SERVICES -----

  // GET /api/utility/services - List utility services
  app.get("/api/utility/services", requireAuth, requireRole("admin", "reseller"), async (req, res) => {
    try {
      const supplierId = req.query.supplierId as string | undefined;
      const services = await storage.listUtilityServices(supplierId);
      res.json(services);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // GET /api/utility/services/:id - Get utility service
  app.get("/api/utility/services/:id", requireAuth, requireRole("admin", "reseller"), async (req, res) => {
    try {
      const service = await storage.getUtilityService(req.params.id);
      if (!service) {
        return res.status(404).send("Servizio utility non trovato");
      }
      res.json(service);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // POST /api/utility/services - Create utility service
  app.post("/api/utility/services", requireAuth, requireRole("admin"), async (req, res) => {
    try {
      const validated = insertUtilityServiceSchema.parse(req.body);
      const service = await storage.createUtilityService(validated);
      res.status(201).json(service);
    } catch (error: any) {
      res.status(400).send(error.message);
    }
  });

  // PATCH /api/utility/services/:id - Update utility service
  app.patch("/api/utility/services/:id", requireAuth, requireRole("admin"), async (req, res) => {
    try {
      const service = await storage.updateUtilityService(req.params.id, req.body);
      res.json(service);
    } catch (error: any) {
      res.status(400).send(error.message);
    }
  });

  // DELETE /api/utility/services/:id - Delete utility service
  app.delete("/api/utility/services/:id", requireAuth, requireRole("admin"), async (req, res) => {
    try {
      await storage.deleteUtilityService(req.params.id);
      res.status(204).send();
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // ----- UTILITY PRACTICES -----

  // GET /api/utility/practices - List utility practices
  app.get("/api/utility/practices", requireAuth, async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      let filters: { customerId?: string; resellerId?: string; status?: string; supplierId?: string } = {};
      
      // RBAC: filter based on role
      if (req.user.role === 'customer') {
        filters.customerId = req.user.id;
      } else if (req.user.role === 'reseller') {
        filters.resellerId = req.user.id;
      }
      // Admin sees all
      
      if (req.query.status) {
        filters.status = req.query.status as string;
      }
      if (req.query.supplierId) {
        filters.supplierId = req.query.supplierId as string;
      }
      
      const practices = await storage.listUtilityPractices(filters);
      
      // Enrich with product count for each practice (for product or service_with_products types)
      const enrichedPractices = await Promise.all(
        practices.map(async (practice) => {
          if (practice.itemType === 'product' || practice.itemType === 'service_with_products') {
            const practiceProducts = await storage.listUtilityPracticeProducts(practice.id);
            return { 
              ...practice, 
              productCount: practiceProducts.length,
              practiceProducts: practiceProducts
            };
          }
          return { ...practice, productCount: 0, practiceProducts: [] };
        })
      );
      
      res.json(enrichedPractices);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // GET /api/utility/practices/:id - Get utility practice
  app.get("/api/utility/practices/:id", requireAuth, async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      const practice = await storage.getUtilityPractice(req.params.id);
      if (!practice) {
        return res.status(404).send("Pratica utility non trovata");
      }
      
      // RBAC check
      if (req.user.role === 'customer' && practice.customerId !== req.user.id) {
        return res.status(403).send("Accesso negato");
      }
      if (req.user.role === 'reseller' && practice.resellerId !== req.user.id) {
        return res.status(403).send("Accesso negato");
      }
      
      // Enrich with supplier, service, product info and practice products
      const [supplier, service, product, practiceProducts] = await Promise.all([
        practice.supplierId ? storage.getUtilitySupplier(practice.supplierId) : null,
        practice.serviceId ? storage.getUtilityService(practice.serviceId) : null,
        practice.productId ? storage.getProduct(practice.productId) : null,
        storage.listUtilityPracticeProducts(practice.id),
      ]);
      
      // Enrich practice products with product details
      const productsWithDetails = await Promise.all(
        practiceProducts.map(async (pp) => {
          const productDetail = await storage.getProduct(pp.productId);
          return { ...pp, product: productDetail };
        })
      );
      
      res.json({ ...practice, supplier, service, product, practiceProducts: productsWithDetails });
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // POST /api/utility/practices - Create utility practice
  app.post("/api/utility/practices", requireAuth, requireRole("admin", "reseller"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      const { products: productsArray, ...practiceData } = req.body;
      
      // If reseller, set resellerId automatically
      if (req.user.role === 'reseller') {
        practiceData.resellerId = req.user.id;
      }
      
      const validated = insertUtilityPracticeSchema.parse(practiceData);
      
      // XOR validation: for service/service_with_products, require either serviceId OR customServiceName (not both)
      if (validated.itemType === 'service' || validated.itemType === 'service_with_products') {
        const hasService = !!validated.serviceId;
        const hasCustomService = !!validated.customServiceName?.trim();
        
        if (!hasService && !hasCustomService) {
          return res.status(400).send("Per pratiche di tipo servizio, è richiesto un servizio dal catalogo oppure un servizio temporaneo");
        }
        if (hasService && hasCustomService) {
          return res.status(400).send("Selezionare un servizio dal catalogo OPPURE inserire un servizio temporaneo, non entrambi");
        }
      } else if (validated.itemType === 'product') {
        // For product-only practices, clear service fields
        validated.serviceId = null;
        validated.customServiceName = null;
      }
      
      // If products array is provided, create practice with products transactionally
      if (productsArray && Array.isArray(productsArray) && productsArray.length > 0) {
        const validProducts = productsArray
          .filter((p: any) => p.productId)
          .map((p: any) => ({
            productId: p.productId,
            quantity: p.quantity || 1,
            unitPriceCents: p.unitPriceCents || 0,
            notes: p.notes || null,
          }));
        
        if (validProducts.length > 0) {
          const result = await storage.createUtilityPracticeWithProducts(validated, validProducts);
          return res.status(201).json(result.practice);
        }
      }
      
      // Create practice without products
      const practice = await storage.createUtilityPractice(validated);
      res.status(201).json(practice);
    } catch (error: any) {
      res.status(400).send(error.message);
    }
  });

  // PATCH /api/utility/practices/:id - Update utility practice
  app.patch("/api/utility/practices/:id", requireAuth, requireRole("admin", "reseller"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      const practice = await storage.getUtilityPractice(req.params.id);
      if (!practice) {
        return res.status(404).send("Pratica utility non trovata");
      }
      
      // Resellers can only update their own practices
      if (req.user.role === 'reseller' && practice.resellerId !== req.user.id) {
        return res.status(403).send("Accesso negato");
      }
      
      const { products: productsArray, ...practiceData } = req.body;
      
      // XOR validation for service fields on update
      const finalItemType = practiceData.itemType || practice.itemType;
      if (finalItemType === 'service' || finalItemType === 'service_with_products') {
        const finalServiceId = practiceData.serviceId !== undefined ? practiceData.serviceId : practice.serviceId;
        const finalCustomService = practiceData.customServiceName !== undefined ? practiceData.customServiceName : practice.customServiceName;
        const hasService = !!finalServiceId;
        const hasCustomService = !!finalCustomService?.trim();
        
        if (!hasService && !hasCustomService) {
          return res.status(400).send("Per pratiche di tipo servizio, è richiesto un servizio dal catalogo oppure un servizio temporaneo");
        }
        if (hasService && hasCustomService) {
          return res.status(400).send("Selezionare un servizio dal catalogo OPPURE inserire un servizio temporaneo, non entrambi");
        }
      } else if (finalItemType === 'product') {
        // For product-only practices, clear service fields
        practiceData.serviceId = null;
        practiceData.customServiceName = null;
      }
      
      const updated = await storage.updateUtilityPractice(req.params.id, practiceData);
      
      // If products array is provided, sync practice products transactionally
      if (productsArray && Array.isArray(productsArray)) {
        const validProducts = productsArray
          .filter((p: any) => p.productId)
          .map((p: any) => ({
            productId: p.productId,
            quantity: p.quantity || 1,
            unitPriceCents: p.unitPriceCents || 0,
            notes: p.notes || null,
          }));
        
        if (validProducts.length > 0) {
          await storage.syncUtilityPracticeProductsTransactional(req.params.id, validProducts);
        } else {
          // If empty array, just delete all products
          await storage.deleteUtilityPracticeProductsByPractice(req.params.id);
        }
      }
      
      res.json(updated);
    } catch (error: any) {
      res.status(400).send(error.message);
    }
  });

  // DELETE /api/utility/practices/:id - Delete utility practice
  app.delete("/api/utility/practices/:id", requireAuth, requireRole("admin"), async (req, res) => {
    try {
      await storage.deleteUtilityPractice(req.params.id);
      res.status(204).send();
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // ----- UTILITY COMMISSIONS -----

  // GET /api/utility/commissions - List utility commissions
  app.get("/api/utility/commissions", requireAuth, requireRole("admin", "reseller"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      let filters: { practiceId?: string; status?: string; periodYear?: number } = {};
      
      if (req.query.practiceId) {
        filters.practiceId = req.query.practiceId as string;
      }
      if (req.query.status) {
        filters.status = req.query.status as string;
      }
      if (req.query.periodYear) {
        filters.periodYear = parseInt(req.query.periodYear as string);
      }
      
      // For resellers, we need to filter commissions by their practices
      if (req.user.role === 'reseller') {
        const practices = await storage.listUtilityPractices({ resellerId: req.user.id });
        const practiceIds = practices.map(p => p.id);
        
        // Get all commissions and filter by practiceIds
        const allCommissions = await storage.listUtilityCommissions(filters);
        const filtered = allCommissions.filter(c => practiceIds.includes(c.practiceId));
        return res.json(filtered);
      }
      
      const commissions = await storage.listUtilityCommissions(filters);
      res.json(commissions);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // GET /api/utility/commissions/:id - Get utility commission
  app.get("/api/utility/commissions/:id", requireAuth, requireRole("admin", "reseller"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      const commission = await storage.getUtilityCommission(req.params.id);
      if (!commission) {
        return res.status(404).send("Commissione utility non trovata");
      }
      
      // RBAC for resellers
      if (req.user.role === 'reseller') {
        const practice = await storage.getUtilityPractice(commission.practiceId);
        if (!practice || practice.resellerId !== req.user.id) {
          return res.status(403).send("Accesso negato");
        }
      }
      
      res.json(commission);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // POST /api/utility/commissions - Create utility commission
  app.post("/api/utility/commissions", requireAuth, requireRole("admin"), async (req, res) => {
    try {
      const validated = insertUtilityCommissionSchema.parse(req.body);
      const commission = await storage.createUtilityCommission(validated);
      res.status(201).json(commission);
    } catch (error: any) {
      res.status(400).send(error.message);
    }
  });

  // PATCH /api/utility/commissions/:id - Update utility commission
  app.patch("/api/utility/commissions/:id", requireAuth, requireRole("admin"), async (req, res) => {
    try {
      const commission = await storage.updateUtilityCommission(req.params.id, req.body);
      res.json(commission);
    } catch (error: any) {
      res.status(400).send(error.message);
    }
  });

  // DELETE /api/utility/commissions/:id - Delete utility commission
  app.delete("/api/utility/commissions/:id", requireAuth, requireRole("admin"), async (req, res) => {
    try {
      await storage.deleteUtilityCommission(req.params.id);
      res.status(204).send();
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // ----- UTILITY PRACTICE DOCUMENTS -----

  // GET /api/utility/practices/:id/documents - List practice documents
  app.get("/api/utility/practices/:id/documents", requireAuth, async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      const practice = await storage.getUtilityPractice(req.params.id);
      if (!practice) return res.status(404).send("Pratica non trovata");
      
      // RBAC check
      if (req.user.role === 'customer' && practice.customerId !== req.user.id) {
        return res.status(403).send("Accesso negato");
      }
      if (req.user.role === 'reseller' && practice.resellerId !== req.user.id) {
        return res.status(403).send("Accesso negato");
      }
      
      const documents = await storage.listUtilityPracticeDocuments(req.params.id);
      res.json(documents);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // POST /api/utility/practices/:id/documents - Upload practice document
  app.post("/api/utility/practices/:id/documents", requireAuth, requireRole("admin", "reseller"), upload.single('file'), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      if (!req.file) return res.status(400).send("Nessun file caricato");
      
      const practice = await storage.getUtilityPractice(req.params.id);
      if (!practice) return res.status(404).send("Pratica non trovata");
      
      // RBAC check for resellers
      if (req.user.role === 'reseller' && practice.resellerId !== req.user.id) {
        return res.status(403).send("Accesso negato");
      }
      
      // Generate unique object key
      const objectId = randomUUID();
      const privateDir = objectStorage.getPrivateObjectDir();
      const objectKey = `${privateDir}/utility-documents/${req.params.id}/${objectId}`;
      
      // Parse bucket and object name
      const { bucketName, objectName } = parseObjectPath(objectKey);
      
      // Upload to Google Cloud Storage
      const bucket = objectStorageClient.bucket(bucketName);
      const file = bucket.file(objectName);
      
      await file.save(req.file.buffer, {
        metadata: {
          contentType: req.file.mimetype,
        },
      });
      
      // Save to database
      const category = req.body.category || 'altro';
      const description = req.body.description || null;
      
      const document = await storage.createUtilityPracticeDocument({
        practiceId: req.params.id,
        objectKey: objectKey,
        fileName: req.file.originalname,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        category: category,
        description: description,
        uploadedBy: req.user.id,
      });
      
      // Create timeline event
      await storage.createUtilityPracticeTimelineEvent({
        practiceId: req.params.id,
        eventType: 'document_uploaded',
        title: `Documento caricato: ${req.file.originalname}`,
        description: description,
        payload: { documentId: document.id, category: category },
        createdBy: req.user.id,
      });
      
      res.status(201).json(document);
    } catch (error: any) {
      console.error("Error uploading utility document:", error);
      res.status(400).send(error.message);
    }
  });

  // GET /api/utility/practices/:practiceId/documents/:id/download - Download practice document
  app.get("/api/utility/practices/:practiceId/documents/:id/download", requireAuth, async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      const document = await storage.getUtilityPracticeDocument(req.params.id);
      if (!document) return res.status(404).send("Documento non trovato");
      
      const practice = await storage.getUtilityPractice(document.practiceId);
      if (!practice) return res.status(404).send("Pratica non trovata");
      
      // RBAC check
      if (req.user.role === 'customer' && practice.customerId !== req.user.id) {
        return res.status(403).send("Accesso negato");
      }
      if (req.user.role === 'reseller' && practice.resellerId !== req.user.id) {
        return res.status(403).send("Accesso negato");
      }
      
      // Parse object key and get file from storage
      const { bucketName, objectName } = parseObjectPath(document.objectKey);
      const bucket = objectStorageClient.bucket(bucketName);
      const file = bucket.file(objectName);
      
      // Check if file exists
      const [exists] = await file.exists();
      if (!exists) {
        return res.status(404).send("File non trovato nello storage");
      }
      
      // Set response headers for download
      res.set({
        'Content-Type': document.mimeType || 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(document.fileName)}"`,
      });
      
      // Stream file to response
      file.createReadStream().pipe(res);
    } catch (error: any) {
      console.error("Error downloading utility document:", error);
      res.status(500).send(error.message);
    }
  });

  // DELETE /api/utility/practices/:practiceId/documents/:id - Delete practice document
  app.delete("/api/utility/practices/:practiceId/documents/:id", requireAuth, requireRole("admin", "reseller"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      const document = await storage.getUtilityPracticeDocument(req.params.id);
      if (!document) return res.status(404).send("Documento non trovato");
      
      const practice = await storage.getUtilityPractice(document.practiceId);
      if (!practice) return res.status(404).send("Pratica non trovata");
      
      // RBAC check for resellers
      if (req.user.role === 'reseller' && practice.resellerId !== req.user.id) {
        return res.status(403).send("Accesso negato");
      }
      
      await storage.deleteUtilityPracticeDocument(req.params.id);
      
      // Create timeline event
      await storage.createUtilityPracticeTimelineEvent({
        practiceId: document.practiceId,
        eventType: 'document_deleted',
        title: `Documento eliminato: ${document.fileName}`,
        createdBy: req.user.id,
      });
      
      res.status(204).send();
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // ----- UTILITY PRACTICE TASKS -----

  // GET /api/utility/practices/:id/tasks - List practice tasks
  app.get("/api/utility/practices/:id/tasks", requireAuth, async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      const practice = await storage.getUtilityPractice(req.params.id);
      if (!practice) return res.status(404).send("Pratica non trovata");
      
      // RBAC check
      if (req.user.role === 'customer' && practice.customerId !== req.user.id) {
        return res.status(403).send("Accesso negato");
      }
      if (req.user.role === 'reseller' && practice.resellerId !== req.user.id) {
        return res.status(403).send("Accesso negato");
      }
      
      const tasks = await storage.listUtilityPracticeTasks(req.params.id);
      res.json(tasks);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // POST /api/utility/practices/:id/tasks - Create practice task
  app.post("/api/utility/practices/:id/tasks", requireAuth, requireRole("admin", "reseller"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      const practice = await storage.getUtilityPractice(req.params.id);
      if (!practice) return res.status(404).send("Pratica non trovata");
      
      // RBAC check for resellers
      if (req.user.role === 'reseller' && practice.resellerId !== req.user.id) {
        return res.status(403).send("Accesso negato");
      }
      
      const task = await storage.createUtilityPracticeTask({
        ...req.body,
        practiceId: req.params.id,
        createdBy: req.user.id,
      });
      
      // Create timeline event
      await storage.createUtilityPracticeTimelineEvent({
        practiceId: req.params.id,
        eventType: 'task_created',
        title: `Nuova attività: ${req.body.title}`,
        payload: { taskId: task.id },
        createdBy: req.user.id,
      });
      
      res.status(201).json(task);
    } catch (error: any) {
      res.status(400).send(error.message);
    }
  });

  // PATCH /api/utility/practices/:practiceId/tasks/:id - Update practice task
  app.patch("/api/utility/practices/:practiceId/tasks/:id", requireAuth, requireRole("admin", "reseller"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      const existingTask = await storage.getUtilityPracticeTask(req.params.id);
      if (!existingTask) return res.status(404).send("Task non trovato");
      
      const practice = await storage.getUtilityPractice(existingTask.practiceId);
      if (!practice) return res.status(404).send("Pratica non trovata");
      
      // RBAC check for resellers
      if (req.user.role === 'reseller' && practice.resellerId !== req.user.id) {
        return res.status(403).send("Accesso negato");
      }
      
      // Handle task completion
      let updates = { ...req.body };
      if (req.body.status === 'completato' && existingTask.status !== 'completato') {
        updates.completedAt = new Date();
        updates.completedBy = req.user.id;
        
        // Create timeline event for completion
        await storage.createUtilityPracticeTimelineEvent({
          practiceId: existingTask.practiceId,
          eventType: 'task_completed',
          title: `Attività completata: ${existingTask.title}`,
          payload: { taskId: existingTask.id },
          createdBy: req.user.id,
        });
      }
      
      const task = await storage.updateUtilityPracticeTask(req.params.id, updates);
      res.json(task);
    } catch (error: any) {
      res.status(400).send(error.message);
    }
  });

  // DELETE /api/utility/practices/:practiceId/tasks/:id - Delete practice task
  app.delete("/api/utility/practices/:practiceId/tasks/:id", requireAuth, requireRole("admin", "reseller"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      const task = await storage.getUtilityPracticeTask(req.params.id);
      if (!task) return res.status(404).send("Task non trovato");
      
      const practice = await storage.getUtilityPractice(task.practiceId);
      if (!practice) return res.status(404).send("Pratica non trovata");
      
      // RBAC check for resellers
      if (req.user.role === 'reseller' && practice.resellerId !== req.user.id) {
        return res.status(403).send("Accesso negato");
      }
      
      await storage.deleteUtilityPracticeTask(req.params.id);
      res.status(204).send();
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // ----- UTILITY PRACTICE NOTES -----

  // GET /api/utility/practices/:id/notes - List practice notes
  app.get("/api/utility/practices/:id/notes", requireAuth, async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      const practice = await storage.getUtilityPractice(req.params.id);
      if (!practice) return res.status(404).send("Pratica non trovata");
      
      // RBAC check
      if (req.user.role === 'customer' && practice.customerId !== req.user.id) {
        return res.status(403).send("Accesso negato");
      }
      if (req.user.role === 'reseller' && practice.resellerId !== req.user.id) {
        return res.status(403).send("Accesso negato");
      }
      
      let notes = await storage.listUtilityPracticeNotes(req.params.id);
      
      // Filter internal notes for customers
      if (req.user.role === 'customer') {
        notes = notes.filter(n => n.visibility === 'customer');
      }
      
      res.json(notes);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // POST /api/utility/practices/:id/notes - Create practice note
  app.post("/api/utility/practices/:id/notes", requireAuth, requireRole("admin", "reseller"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      const practice = await storage.getUtilityPractice(req.params.id);
      if (!practice) return res.status(404).send("Pratica non trovata");
      
      // RBAC check for resellers
      if (req.user.role === 'reseller' && practice.resellerId !== req.user.id) {
        return res.status(403).send("Accesso negato");
      }
      
      const note = await storage.createUtilityPracticeNote({
        ...req.body,
        practiceId: req.params.id,
        createdBy: req.user.id,
      });
      
      // Create timeline event
      await storage.createUtilityPracticeTimelineEvent({
        practiceId: req.params.id,
        eventType: 'note_added',
        title: 'Nuova nota aggiunta',
        description: req.body.body.substring(0, 100) + (req.body.body.length > 100 ? '...' : ''),
        payload: { noteId: note.id, visibility: req.body.visibility },
        createdBy: req.user.id,
      });
      
      res.status(201).json(note);
    } catch (error: any) {
      res.status(400).send(error.message);
    }
  });

  // DELETE /api/utility/practices/:practiceId/notes/:id - Delete practice note
  app.delete("/api/utility/practices/:practiceId/notes/:id", requireAuth, requireRole("admin", "reseller"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      const notes = await storage.listUtilityPracticeNotes(req.params.practiceId);
      const note = notes.find(n => n.id === req.params.id);
      if (!note) return res.status(404).send("Nota non trovata");
      
      const practice = await storage.getUtilityPractice(note.practiceId);
      if (!practice) return res.status(404).send("Pratica non trovata");
      
      // RBAC check for resellers
      if (req.user.role === 'reseller' && practice.resellerId !== req.user.id) {
        return res.status(403).send("Accesso negato");
      }
      
      await storage.deleteUtilityPracticeNote(req.params.id);
      res.status(204).send();
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // ----- UTILITY PRACTICE TIMELINE -----

  // GET /api/utility/practices/:id/timeline - List practice timeline
  app.get("/api/utility/practices/:id/timeline", requireAuth, async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      const practice = await storage.getUtilityPractice(req.params.id);
      if (!practice) return res.status(404).send("Pratica non trovata");
      
      // RBAC check
      if (req.user.role === 'customer' && practice.customerId !== req.user.id) {
        return res.status(403).send("Accesso negato");
      }
      if (req.user.role === 'reseller' && practice.resellerId !== req.user.id) {
        return res.status(403).send("Accesso negato");
      }
      
      const timeline = await storage.listUtilityPracticeTimeline(req.params.id);
      res.json(timeline);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // POST /api/utility/practices/:id/timeline - Add timeline event (comment)
  app.post("/api/utility/practices/:id/timeline", requireAuth, requireRole("admin", "reseller"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      const practice = await storage.getUtilityPractice(req.params.id);
      if (!practice) return res.status(404).send("Pratica non trovata");
      
      // RBAC check for resellers
      if (req.user.role === 'reseller' && practice.resellerId !== req.user.id) {
        return res.status(403).send("Accesso negato");
      }
      
      const event = await storage.createUtilityPracticeTimelineEvent({
        practiceId: req.params.id,
        eventType: req.body.eventType || 'comment',
        title: req.body.title,
        description: req.body.description,
        payload: req.body.payload,
        createdBy: req.user.id,
      });
      
      res.status(201).json(event);
    } catch (error: any) {
      res.status(400).send(error.message);
    }
  });

  // ----- UTILITY PRACTICE STATE HISTORY -----

  // GET /api/utility/practices/:id/state-history - List practice state history
  app.get("/api/utility/practices/:id/state-history", requireAuth, async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      const practice = await storage.getUtilityPractice(req.params.id);
      if (!practice) return res.status(404).send("Pratica non trovata");
      
      // RBAC check
      if (req.user.role === 'customer' && practice.customerId !== req.user.id) {
        return res.status(403).send("Accesso negato");
      }
      if (req.user.role === 'reseller' && practice.resellerId !== req.user.id) {
        return res.status(403).send("Accesso negato");
      }
      
      const history = await storage.listUtilityPracticeStateHistory(req.params.id);
      res.json(history);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // ----- UTILITY PRACTICE STATUS UPDATE -----

  // PATCH /api/utility/practices/:id/status - Update practice status with history
  app.patch("/api/utility/practices/:id/status", requireAuth, requireRole("admin", "reseller"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      const practice = await storage.getUtilityPractice(req.params.id);
      if (!practice) return res.status(404).send("Pratica non trovata");
      
      // RBAC check for resellers
      if (req.user.role === 'reseller' && practice.resellerId !== req.user.id) {
        return res.status(403).send("Accesso negato");
      }
      
      const { status, reason } = req.body;
      
      // Create state history entry
      await storage.createUtilityPracticeStateHistory({
        practiceId: req.params.id,
        fromStatus: practice.status,
        toStatus: status,
        reason,
        changedBy: req.user.id,
      });
      
      // Create timeline event
      await storage.createUtilityPracticeTimelineEvent({
        practiceId: req.params.id,
        eventType: 'status_change',
        title: `Stato cambiato: ${practice.status} → ${status}`,
        description: reason,
        payload: { fromStatus: practice.status, toStatus: status },
        createdBy: req.user.id,
      });
      
      // Update practice
      const updated = await storage.updateUtilityPractice(req.params.id, { status });
      
      res.json(updated);
    } catch (error: any) {
      res.status(400).send(error.message);
    }
  });

  // ----- UTILITY REPORTS -----

  // GET /api/utility/reports/summary - Get utility summary report
  app.get("/api/utility/reports/summary", requireAuth, requireRole("admin", "reseller"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      const year = req.query.year ? parseInt(req.query.year as string) : new Date().getFullYear();
      
      // Get practices based on role
      let practicesFilters: { resellerId?: string } = {};
      if (req.user.role === 'reseller') {
        practicesFilters.resellerId = req.user.id;
      }
      
      const practices = await storage.listUtilityPractices(practicesFilters);
      const commissions = await storage.listUtilityCommissions({ periodYear: year });
      const suppliers = await storage.listUtilitySuppliers();
      
      // Filter commissions for resellers
      let relevantCommissions = commissions;
      if (req.user.role === 'reseller') {
        const practiceIds = practices.map(p => p.id);
        relevantCommissions = commissions.filter(c => practiceIds.includes(c.practiceId));
      }
      
      // Calculate stats by category
      const byCategory: Record<string, { count: number; revenue: number; commissions: number }> = {};
      const byStatus: Record<string, number> = {};
      
      for (const practice of practices) {
        const service = await storage.getUtilityService(practice.serviceId);
        const category = service?.category || 'altro';
        
        if (!byCategory[category]) {
          byCategory[category] = { count: 0, revenue: 0, commissions: 0 };
        }
        byCategory[category].count++;
        byCategory[category].revenue += practice.monthlyPriceCents || 0;
        byCategory[category].commissions += practice.commissionAmountCents || 0;
        
        byStatus[practice.status] = (byStatus[practice.status] || 0) + 1;
      }
      
      // Calculate total commissions
      const totalCommissions = relevantCommissions.reduce((sum, c) => sum + c.amountCents, 0);
      const pendingCommissions = relevantCommissions.filter(c => c.status === 'pending').reduce((sum, c) => sum + c.amountCents, 0);
      const paidCommissions = relevantCommissions.filter(c => c.status === 'paid').reduce((sum, c) => sum + c.amountCents, 0);
      
      res.json({
        year,
        totalPractices: practices.length,
        activePractices: practices.filter(p => p.status === 'completata').length,
        byCategory,
        byStatus,
        commissions: {
          total: totalCommissions,
          pending: pendingCommissions,
          paid: paidCommissions,
        },
        supplierCount: suppliers.length,
      });
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // ============ SIFAR INTEGRATION API ============
  
  // GET /api/sifar/credentials - Get reseller's SIFAR credentials
  app.get("/api/sifar/credentials", requireAuth, requireRole("reseller"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      const credential = await storage.getSifarCredentialByReseller(req.user.id);
      if (!credential) {
        return res.json(null);
      }
      
      // Don't expose sensitive data
      res.json({
        id: credential.id,
        environment: credential.environment,
        isActive: credential.isActive,
        lastSyncAt: credential.lastSyncAt,
        createdAt: credential.createdAt,
        hasClientKey: !!credential.clientKey,
      });
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });
  
  // POST /api/sifar/credentials - Create/update SIFAR credentials
  app.post("/api/sifar/credentials", requireAuth, requireRole("reseller"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      const { clientKey, environment } = req.body;
      
      if (!clientKey || !environment) {
        return res.status(400).send("Client key e ambiente sono obbligatori");
      }
      
      const existing = await storage.getSifarCredentialByReseller(req.user.id);
      
      let credential;
      if (existing) {
        credential = await storage.updateSifarCredential(existing.id, {
          clientKey,
          environment,
        });
      } else {
        credential = await storage.createSifarCredential({
          resellerId: req.user.id,
          clientKey,
          environment,
          isActive: true,
        });
      }
      
      res.json({
        id: credential.id,
        environment: credential.environment,
        isActive: credential.isActive,
        hasClientKey: !!credential.clientKey,
      });
    } catch (error: any) {
      res.status(400).send(error.message);
    }
  });
  
  // POST /api/sifar/test-connection - Test SIFAR connection
  app.post("/api/sifar/test-connection", requireAuth, requireRole("reseller"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      const { storeCode } = req.body;
      if (!storeCode) {
        return res.status(400).send("Codice punto vendita obbligatorio");
      }
      
      const credential = await storage.getSifarCredentialByReseller(req.user.id);
      if (!credential) {
        return res.status(404).send("Credenziali SIFAR non configurate");
      }
      
      const { createSifarService } = await import("./sifarService");
      const sifarService = createSifarService(credential);
      
      const result = await sifarService.testConnection(storeCode);
      res.json(result);
    } catch (error: any) {
      res.status(400).send(error.message);
    }
  });
  
  // GET /api/sifar/stores - List SIFAR stores for reseller
  app.get("/api/sifar/stores", requireAuth, requireRole("reseller"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      const credential = await storage.getSifarCredentialByReseller(req.user.id);
      if (!credential) {
        return res.json([]);
      }
      
      const stores = await storage.listSifarStores(credential.id);
      res.json(stores);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });
  
  // POST /api/sifar/stores - Add a SIFAR store
  app.post("/api/sifar/stores", requireAuth, requireRole("reseller"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      const credential = await storage.getSifarCredentialByReseller(req.user.id);
      if (!credential) {
        return res.status(404).send("Credenziali SIFAR non configurate");
      }
      
      const { storeCode, storeName, isDefault } = req.body;
      
      if (!storeCode) {
        return res.status(400).send("Codice punto vendita obbligatorio");
      }
      
      // If setting as default, unset other defaults
      if (isDefault) {
        const existingStores = await storage.listSifarStores(credential.id);
        for (const store of existingStores) {
          if (store.isDefault) {
            await storage.updateSifarStore(store.id, { isDefault: false });
          }
        }
      }
      
      const store = await storage.createSifarStore({
        credentialId: credential.id,
        storeCode,
        storeName,
        isDefault: isDefault || false,
      });
      
      res.status(201).json(store);
    } catch (error: any) {
      res.status(400).send(error.message);
    }
  });
  
  // DELETE /api/sifar/stores/:id - Remove a SIFAR store
  app.delete("/api/sifar/stores/:id", requireAuth, requireRole("reseller"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      const store = await storage.getSifarStore(req.params.id);
      if (!store) {
        return res.status(404).send("Punto vendita non trovato");
      }
      
      const credential = await storage.getSifarCredentialByReseller(req.user.id);
      if (!credential || store.credentialId !== credential.id) {
        return res.status(403).send("Accesso negato");
      }
      
      await storage.deleteSifarStore(req.params.id);
      res.status(204).send();
    } catch (error: any) {
      res.status(400).send(error.message);
    }
  });
  
  // GET /api/sifar/catalog/brands - Get SIFAR brands
  app.get("/api/sifar/catalog/brands", requireAuth, requireRole("reseller"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      const storeCode = req.query.storeCode as string;
      if (!storeCode) {
        return res.status(400).send("Codice punto vendita obbligatorio");
      }
      
      const credential = await storage.getSifarCredentialByReseller(req.user.id);
      if (!credential) {
        return res.status(404).send("Credenziali SIFAR non configurate");
      }
      
      const { createSifarService } = await import("./sifarService");
      const sifarService = createSifarService(credential);
      
      const brands = await sifarService.getBrands(storeCode);
      res.json(brands);
    } catch (error: any) {
      res.status(400).send(error.message);
    }
  });
  
  // GET /api/sifar/catalog/models - Get SIFAR models by brand
  app.get("/api/sifar/catalog/models", requireAuth, requireRole("reseller"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      const storeCode = req.query.storeCode as string;
      const brandCode = req.query.brandCode as string;
      
      if (!storeCode || !brandCode) {
        return res.status(400).send("Codice punto vendita e marca obbligatori");
      }
      
      const credential = await storage.getSifarCredentialByReseller(req.user.id);
      if (!credential) {
        return res.status(404).send("Credenziali SIFAR non configurate");
      }
      
      const { createSifarService } = await import("./sifarService");
      const sifarService = createSifarService(credential);
      
      const models = await sifarService.getModelsByBrand(storeCode, brandCode);
      res.json(models);
    } catch (error: any) {
      res.status(400).send(error.message);
    }
  });
  
  // GET /api/sifar/catalog/categories - Get SIFAR categories
  app.get("/api/sifar/catalog/categories", requireAuth, requireRole("reseller"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      const storeCode = req.query.storeCode as string;
      if (!storeCode) {
        return res.status(400).send("Codice punto vendita obbligatorio");
      }
      
      const credential = await storage.getSifarCredentialByReseller(req.user.id);
      if (!credential) {
        return res.status(404).send("Credenziali SIFAR non configurate");
      }
      
      const { createSifarService } = await import("./sifarService");
      const sifarService = createSifarService(credential);
      
      const categories = await sifarService.getCategories(storeCode);
      res.json(categories);
    } catch (error: any) {
      res.status(400).send(error.message);
    }
  });
  
  // GET /api/sifar/catalog/groups - Get SIFAR groups
  app.get("/api/sifar/catalog/groups", requireAuth, requireRole("reseller"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      const storeCode = req.query.storeCode as string;
      if (!storeCode) {
        return res.status(400).send("Codice punto vendita obbligatorio");
      }
      
      const credential = await storage.getSifarCredentialByReseller(req.user.id);
      if (!credential) {
        return res.status(404).send("Credenziali SIFAR non configurate");
      }
      
      const { createSifarService } = await import("./sifarService");
      const sifarService = createSifarService(credential);
      
      const groups = await sifarService.getGroups(storeCode);
      res.json(groups);
    } catch (error: any) {
      res.status(400).send(error.message);
    }
  });
  
  // GET /api/sifar/catalog/articles - Get SIFAR articles by model
  app.get("/api/sifar/catalog/articles", requireAuth, requireRole("reseller"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      const storeCode = req.query.storeCode as string;
      const modelCode = req.query.modelCode as string;
      const categoryCode = req.query.categoryCode as string | undefined;
      const groupCode = req.query.groupCode as string | undefined;
      
      if (!storeCode || !modelCode) {
        return res.status(400).send("Codice punto vendita e modello obbligatori");
      }
      
      const credential = await storage.getSifarCredentialByReseller(req.user.id);
      if (!credential) {
        return res.status(404).send("Credenziali SIFAR non configurate");
      }
      
      const { createSifarService } = await import("./sifarService");
      const sifarService = createSifarService(credential);
      
      const articles = await sifarService.getArticlesByModel(storeCode, modelCode, categoryCode, groupCode);
      res.json(articles);
    } catch (error: any) {
      res.status(400).send(error.message);
    }
  });
  
  // GET /api/sifar/catalog/article/:code - Get SIFAR article detail
  app.get("/api/sifar/catalog/article/:code", requireAuth, requireRole("reseller"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      const storeCode = req.query.storeCode as string;
      if (!storeCode) {
        return res.status(400).send("Codice punto vendita obbligatorio");
      }
      
      const credential = await storage.getSifarCredentialByReseller(req.user.id);
      if (!credential) {
        return res.status(404).send("Credenziali SIFAR non configurate");
      }
      
      const { createSifarService } = await import("./sifarService");
      const sifarService = createSifarService(credential);
      
      const article = await sifarService.getArticleDetail(storeCode, req.params.code);
      res.json(article);
    } catch (error: any) {
      res.status(400).send(error.message);
    }
  });
  
  // GET /api/sifar/cart - Get cart detail
  app.get("/api/sifar/cart", requireAuth, requireRole("reseller"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      const storeCode = req.query.storeCode as string;
      if (!storeCode) {
        return res.status(400).send("Codice punto vendita obbligatorio");
      }
      
      const credential = await storage.getSifarCredentialByReseller(req.user.id);
      if (!credential) {
        return res.status(404).send("Credenziali SIFAR non configurate");
      }
      
      const { createSifarService } = await import("./sifarService");
      const sifarService = createSifarService(credential);
      
      const cart = await sifarService.getCartDetail(storeCode);
      res.json(cart);
    } catch (error: any) {
      res.status(400).send(error.message);
    }
  });
  
  // POST /api/sifar/cart/add - Add item to cart
  app.post("/api/sifar/cart/add", requireAuth, requireRole("reseller"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      const { storeCode, articleCode, quantity } = req.body;
      
      if (!storeCode || !articleCode || !quantity) {
        return res.status(400).send("Dati incompleti");
      }
      
      const credential = await storage.getSifarCredentialByReseller(req.user.id);
      if (!credential) {
        return res.status(404).send("Credenziali SIFAR non configurate");
      }
      
      const { createSifarService } = await import("./sifarService");
      const sifarService = createSifarService(credential);
      
      await sifarService.addToCart(storeCode, articleCode, quantity);
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).send(error.message);
    }
  });
  
  // POST /api/sifar/cart/update - Update cart item quantity
  app.post("/api/sifar/cart/update", requireAuth, requireRole("reseller"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      const { storeCode, articleCode, quantity } = req.body;
      
      if (!storeCode || !articleCode || quantity === undefined) {
        return res.status(400).send("Dati incompleti");
      }
      
      const credential = await storage.getSifarCredentialByReseller(req.user.id);
      if (!credential) {
        return res.status(404).send("Credenziali SIFAR non configurate");
      }
      
      const { createSifarService } = await import("./sifarService");
      const sifarService = createSifarService(credential);
      
      await sifarService.updateCartItem(storeCode, articleCode, quantity);
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).send(error.message);
    }
  });
  
  // DELETE /api/sifar/cart/remove - Remove item from cart
  app.delete("/api/sifar/cart/remove", requireAuth, requireRole("reseller"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      const storeCode = req.query.storeCode as string;
      const articleCode = req.query.articleCode as string;
      
      if (!storeCode || !articleCode) {
        return res.status(400).send("Dati incompleti");
      }
      
      const credential = await storage.getSifarCredentialByReseller(req.user.id);
      if (!credential) {
        return res.status(404).send("Credenziali SIFAR non configurate");
      }
      
      const { createSifarService } = await import("./sifarService");
      const sifarService = createSifarService(credential);
      
      await sifarService.removeFromCart(storeCode, articleCode);
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).send(error.message);
    }
  });
  
  // DELETE /api/sifar/cart/clear - Clear cart
  app.delete("/api/sifar/cart/clear", requireAuth, requireRole("reseller"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      const storeCode = req.query.storeCode as string;
      if (!storeCode) {
        return res.status(400).send("Codice punto vendita obbligatorio");
      }
      
      const credential = await storage.getSifarCredentialByReseller(req.user.id);
      if (!credential) {
        return res.status(404).send("Credenziali SIFAR non configurate");
      }
      
      const { createSifarService } = await import("./sifarService");
      const sifarService = createSifarService(credential);
      
      await sifarService.clearCart(storeCode);
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).send(error.message);
    }
  });
  
  // GET /api/sifar/couriers - Get available couriers
  app.get("/api/sifar/couriers", requireAuth, requireRole("reseller"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      const storeCode = req.query.storeCode as string;
      if (!storeCode) {
        return res.status(400).send("Codice punto vendita obbligatorio");
      }
      
      const credential = await storage.getSifarCredentialByReseller(req.user.id);
      if (!credential) {
        return res.status(404).send("Credenziali SIFAR non configurate");
      }
      
      const { createSifarService } = await import("./sifarService");
      const sifarService = createSifarService(credential);
      
      const couriers = await sifarService.getCouriers(storeCode);
      res.json(couriers);
    } catch (error: any) {
      res.status(400).send(error.message);
    }
  });
  
  // POST /api/sifar/order - Submit order
  app.post("/api/sifar/order", requireAuth, requireRole("reseller"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      const { storeCode, courierId } = req.body;
      
      if (!storeCode || !courierId) {
        return res.status(400).send("Dati incompleti");
      }
      
      const credential = await storage.getSifarCredentialByReseller(req.user.id);
      if (!credential) {
        return res.status(404).send("Credenziali SIFAR non configurate");
      }
      
      const { createSifarService } = await import("./sifarService");
      const sifarService = createSifarService(credential);
      
      const order = await sifarService.submitOrder(storeCode, courierId);
      res.json(order);
    } catch (error: any) {
      res.status(400).send(error.message);
    }
  });
  
  // GET /api/sifar/orders - Get order list
  app.get("/api/sifar/orders", requireAuth, requireRole("reseller"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      const storeCode = req.query.storeCode as string;
      if (!storeCode) {
        return res.status(400).send("Codice punto vendita obbligatorio");
      }
      
      const credential = await storage.getSifarCredentialByReseller(req.user.id);
      if (!credential) {
        return res.status(404).send("Credenziali SIFAR non configurate");
      }
      
      const { createSifarService } = await import("./sifarService");
      const sifarService = createSifarService(credential);
      
      const orders = await sifarService.getOrders(storeCode);
      res.json(orders);
    } catch (error: any) {
      res.status(400).send(error.message);
    }
  });
  
  // GET /api/sifar/orders/:id - Get order detail
  app.get("/api/sifar/orders/:id", requireAuth, requireRole("reseller"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      const storeCode = req.query.storeCode as string;
      if (!storeCode) {
        return res.status(400).send("Codice punto vendita obbligatorio");
      }
      
      const credential = await storage.getSifarCredentialByReseller(req.user.id);
      if (!credential) {
        return res.status(404).send("Credenziali SIFAR non configurate");
      }
      
      const { createSifarService } = await import("./sifarService");
      const sifarService = createSifarService(credential);
      
      const order = await sifarService.getOrderDetail(storeCode, req.params.id);
      res.json(order);
    } catch (error: any) {
      res.status(400).send(error.message);
    }
  });

  // ==========================================
  // FONEDAY INTEGRATION API
  // ==========================================

  // GET /api/foneday/credentials - Get reseller's Foneday credentials
  app.get("/api/foneday/credentials", requireAuth, requireRole("reseller"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      const credential = await storage.getFonedayCredentialByReseller(req.user.id);
      res.json(credential || null);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // POST /api/foneday/credentials - Create/update Foneday credentials
  app.post("/api/foneday/credentials", requireAuth, requireRole("reseller"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      const { apiToken } = req.body;
      if (!apiToken) {
        return res.status(400).send("API Token obbligatorio");
      }
      
      const existing = await storage.getFonedayCredentialByReseller(req.user.id);
      
      if (existing) {
        const updated = await storage.updateFonedayCredential(existing.id, {
          apiToken,
          isActive: true,
        });
        res.json(updated);
      } else {
        const created = await storage.createFonedayCredential({
          resellerId: req.user.id,
          apiToken,
          isActive: true,
        });
        res.json(created);
      }
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // DELETE /api/foneday/credentials - Delete Foneday credentials
  app.delete("/api/foneday/credentials", requireAuth, requireRole("reseller"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      const existing = await storage.getFonedayCredentialByReseller(req.user.id);
      if (!existing) {
        return res.status(404).send("Credenziali non trovate");
      }
      
      await storage.deleteFonedayCredential(existing.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // POST /api/foneday/test-connection - Test Foneday connection
  app.post("/api/foneday/test-connection", requireAuth, requireRole("reseller"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      const credential = await storage.getFonedayCredentialByReseller(req.user.id);
      if (!credential) {
        return res.status(404).send("Credenziali Foneday non configurate");
      }
      
      const { createFonedayService } = await import("./fonedayService");
      const fonedayService = createFonedayService(credential);
      
      const result = await fonedayService.testConnection();
      
      await storage.updateFonedayCredential(credential.id, {
        lastTestAt: new Date(),
        testStatus: result.success ? "success" : "error",
        testMessage: result.message,
      });
      
      res.json(result);
    } catch (error: any) {
      res.status(400).send(error.message);
    }
  });

  // GET /api/foneday/catalog/categories - Get Foneday categories
  app.get("/api/foneday/catalog/categories", requireAuth, requireRole("reseller"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      const credential = await storage.getFonedayCredentialByReseller(req.user.id);
      if (!credential) {
        return res.status(404).send("Credenziali Foneday non configurate");
      }
      
      const { createFonedayService } = await import("./fonedayService");
      const fonedayService = createFonedayService(credential);
      
      const categories = await fonedayService.getCategories();
      res.json(categories);
    } catch (error: any) {
      res.status(400).send(error.message);
    }
  });

  // GET /api/foneday/catalog/brands - Get Foneday brands
  app.get("/api/foneday/catalog/brands", requireAuth, requireRole("reseller"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      const credential = await storage.getFonedayCredentialByReseller(req.user.id);
      if (!credential) {
        return res.status(404).send("Credenziali Foneday non configurate");
      }
      
      const { createFonedayService } = await import("./fonedayService");
      const fonedayService = createFonedayService(credential);
      
      const brands = await fonedayService.getBrands();
      res.json(brands);
    } catch (error: any) {
      res.status(400).send(error.message);
    }
  });

  // GET /api/foneday/catalog/products - Search Foneday products (with caching)
  app.get("/api/foneday/catalog/products", requireAuth, requireRole("reseller"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      const credential = await storage.getFonedayCredentialByReseller(req.user.id);
      if (!credential) {
        return res.status(404).send("Credenziali Foneday non configurate");
      }
      
      const search = (req.query.search as string) || "";
      const page = req.query.page ? Number(req.query.page) : 1;
      const perPage = req.query.per_page ? Number(req.query.per_page) : 20;
      
      // Check cache first
      const cacheKey = getFonedayCacheKey(req.user.id, search, page, perPage);
      const cachedData = getFonedayFromCache(cacheKey);
      if (cachedData) {
        return res.json(cachedData);
      }
      
      const { createFonedayService } = await import("./fonedayService");
      const fonedayService = createFonedayService(credential);
      
      const products = await fonedayService.searchProducts({
        query: search,
        category_id: req.query.category_id ? Number(req.query.category_id) : undefined,
        brand: req.query.brand as string,
        page,
        per_page: perPage,
      });
      
      // Cache the result
      setFonedayCache(cacheKey, products);
      
      res.json(products);
    } catch (error: any) {
      res.status(400).send(error.message);
    }
  });

  // GET /api/foneday/catalog/products/:sku - Get Foneday product detail
  app.get("/api/foneday/catalog/products/:sku", requireAuth, requireRole("reseller"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      const credential = await storage.getFonedayCredentialByReseller(req.user.id);
      if (!credential) {
        return res.status(404).send("Credenziali Foneday non configurate");
      }
      
      const { createFonedayService } = await import("./fonedayService");
      const fonedayService = createFonedayService(credential);
      
      const product = await fonedayService.getProduct(req.params.sku);
      res.json(product);
    } catch (error: any) {
      res.status(400).send(error.message);
    }
  });

  // GET /api/foneday/cart - Get cart from local cache (Foneday API doesn't persist cart)
  app.get("/api/foneday/cart", requireAuth, requireRole("reseller"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      const credential = await storage.getFonedayCredentialByReseller(req.user.id);
      if (!credential) {
        return res.status(404).send("Credenziali Foneday non configurate");
      }
      
      // Return cart from local cache
      const cart = fonedayCartCache.get(req.user.id) || [];
      res.json({ cart });
    } catch (error: any) {
      res.status(400).send(error.message);
    }
  });

  // POST /api/foneday/cart/add - Add items to cart (local cache + API sync)
  app.post("/api/foneday/cart/add", requireAuth, requireRole("reseller"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      const { sku, quantity, note, productName, productPrice } = req.body;
      if (!sku || !quantity) {
        return res.status(400).send("SKU prodotto e quantità obbligatori");
      }
      
      const credential = await storage.getFonedayCredentialByReseller(req.user.id);
      if (!credential) {
        return res.status(404).send("Credenziali Foneday non configurate");
      }
      
      // Update local cart cache
      const currentCart = fonedayCartCache.get(req.user.id) || [];
      const existingItem = currentCart.find(item => item.sku === sku);
      
      if (existingItem) {
        existingItem.quantity += Number(quantity);
        if (note) existingItem.note = note;
      } else {
        currentCart.push({
          sku,
          quantity: Number(quantity),
          title: productName || sku,
          price: String(productPrice || "0"),
          note: note || null,
        });
      }
      
      fonedayCartCache.set(req.user.id, currentCart);
      
      // Also sync with Foneday API (fire and forget - cart state is local)
      try {
        const { createFonedayService } = await import("./fonedayService");
        const fonedayService = createFonedayService(credential);
        await fonedayService.addToCart([{ sku, quantity: Number(quantity), note: note || null }]);
      } catch (apiError) {
        console.log("Foneday API cart sync error (non-blocking):", apiError);
      }
      
      res.json({ cart: currentCart });
    } catch (error: any) {
      res.status(400).send(error.message);
    }
  });

  // POST /api/foneday/cart/remove - Remove items from cart (local cache + API sync)
  app.post("/api/foneday/cart/remove", requireAuth, requireRole("reseller"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      const { sku, quantity } = req.body;
      if (!sku || !quantity) {
        return res.status(400).send("SKU prodotto e quantità obbligatori");
      }
      
      const credential = await storage.getFonedayCredentialByReseller(req.user.id);
      if (!credential) {
        return res.status(404).send("Credenziali Foneday non configurate");
      }
      
      // Update local cart cache
      const currentCart = fonedayCartCache.get(req.user.id) || [];
      const existingItemIndex = currentCart.findIndex(item => item.sku === sku);
      
      if (existingItemIndex >= 0) {
        const existingItem = currentCart[existingItemIndex];
        existingItem.quantity -= Number(quantity);
        if (existingItem.quantity <= 0) {
          currentCart.splice(existingItemIndex, 1);
        }
      }
      
      fonedayCartCache.set(req.user.id, currentCart);
      
      // Also sync with Foneday API (fire and forget)
      try {
        const { createFonedayService } = await import("./fonedayService");
        const fonedayService = createFonedayService(credential);
        await fonedayService.removeFromCart([{ sku, quantity: Number(quantity) }]);
      } catch (apiError) {
        console.log("Foneday API cart sync error (non-blocking):", apiError);
      }
      
      res.json({ cart: currentCart });
    } catch (error: any) {
      res.status(400).send(error.message);
    }
  });

  // POST /api/foneday/cart/clear - Clear cart
  app.post("/api/foneday/cart/clear", requireAuth, requireRole("reseller"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      fonedayCartCache.set(req.user.id, []);
      res.json({ cart: [] });
    } catch (error: any) {
      res.status(400).send(error.message);
    }
  });

  // GET /api/foneday/shipping-methods - Get available shipping methods
  app.get("/api/foneday/shipping-methods", requireAuth, requireRole("reseller"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      const credential = await storage.getFonedayCredentialByReseller(req.user.id);
      if (!credential) {
        return res.status(404).send("Credenziali Foneday non configurate");
      }
      
      const { createFonedayService } = await import("./fonedayService");
      const fonedayService = createFonedayService(credential);
      
      const methods = await fonedayService.getShippingMethods();
      res.json(methods);
    } catch (error: any) {
      res.status(400).send(error.message);
    }
  });

  // POST /api/foneday/orders - Submit order
  app.post("/api/foneday/orders", requireAuth, requireRole("reseller"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      const { shippingMethodId, shippingAddress, notes } = req.body;
      if (!shippingMethodId || !shippingAddress) {
        return res.status(400).send("Metodo spedizione e indirizzo obbligatori");
      }
      
      const credential = await storage.getFonedayCredentialByReseller(req.user.id);
      if (!credential) {
        return res.status(404).send("Credenziali Foneday non configurate");
      }
      
      const { createFonedayService } = await import("./fonedayService");
      const fonedayService = createFonedayService(credential);
      
      const order = await fonedayService.submitOrder(shippingMethodId, shippingAddress, notes);
      
      await storage.createFonedayOrder({
        credentialId: credential.id,
        externalOrderId: order.order_id,
        orderNumber: order.order_number,
        status: order.status,
        totalCents: Math.round(order.total * 100),
        orderData: order as any,
      });
      
      res.json(order);
    } catch (error: any) {
      res.status(400).send(error.message);
    }
  });

  // GET /api/foneday/orders - Get order list
  app.get("/api/foneday/orders", requireAuth, requireRole("reseller"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      const credential = await storage.getFonedayCredentialByReseller(req.user.id);
      if (!credential) {
        return res.status(404).send("Credenziali Foneday non configurate");
      }
      
      const { createFonedayService } = await import("./fonedayService");
      const fonedayService = createFonedayService(credential);
      
      const page = req.query.page ? Number(req.query.page) : 1;
      const perPage = req.query.per_page ? Number(req.query.per_page) : 20;
      
      const orders = await fonedayService.getOrders(page, perPage);
      res.json(orders);
    } catch (error: any) {
      res.status(400).send(error.message);
    }
  });

  // GET /api/foneday/orders/:id - Get order detail
  app.get("/api/foneday/orders/:id", requireAuth, requireRole("reseller"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      const credential = await storage.getFonedayCredentialByReseller(req.user.id);
      if (!credential) {
        return res.status(404).send("Credenziali Foneday non configurate");
      }
      
      const { createFonedayService } = await import("./fonedayService");
      const fonedayService = createFonedayService(credential);
      
      const order = await fonedayService.getOrder(req.params.id);
      res.json(order);
    } catch (error: any) {
      res.status(400).send(error.message);
    }
  });

  // GET /api/foneday/invoices - Get invoice list
  app.get("/api/foneday/invoices", requireAuth, requireRole("reseller"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      const credential = await storage.getFonedayCredentialByReseller(req.user.id);
      if (!credential) {
        return res.status(404).send("Credenziali Foneday non configurate");
      }
      
      const { createFonedayService } = await import("./fonedayService");
      const fonedayService = createFonedayService(credential);
      
      const page = req.query.page ? Number(req.query.page) : 1;
      const perPage = req.query.per_page ? Number(req.query.per_page) : 20;
      
      const invoices = await fonedayService.getInvoices(page, perPage);
      res.json(invoices);
    } catch (error: any) {
      res.status(400).send(error.message);
    }
  });

  // GET /api/foneday/invoices/:id - Get invoice detail
  app.get("/api/foneday/invoices/:id", requireAuth, requireRole("reseller"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      const credential = await storage.getFonedayCredentialByReseller(req.user.id);
      if (!credential) {
        return res.status(404).send("Credenziali Foneday non configurate");
      }
      
      const { createFonedayService } = await import("./fonedayService");
      const fonedayService = createFonedayService(credential);
      
      const invoice = await fonedayService.getInvoice(req.params.id);
      res.json(invoice);
    } catch (error: any) {
      res.status(400).send(error.message);
    }
  });

  // GET /api/foneday/invoices/:id/pdf - Download invoice PDF
  app.get("/api/foneday/invoices/:id/pdf", requireAuth, requireRole("reseller"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      const credential = await storage.getFonedayCredentialByReseller(req.user.id);
      if (!credential) {
        return res.status(404).send("Credenziali Foneday non configurate");
      }
      
      const { createFonedayService } = await import("./fonedayService");
      const fonedayService = createFonedayService(credential);
      
      const result = await fonedayService.downloadInvoicePdf(req.params.id);
      res.json(result);
    } catch (error: any) {
      res.status(400).send(error.message);
    }
  });

  // ==========================================
  // MOBILESENTRIX INTEGRATION (RESELLER)
  // ==========================================

  // GET /api/mobilesentrix/credentials - Get reseller's MobileSentrix credentials
  app.get("/api/mobilesentrix/credentials", requireAuth, requireRole("reseller"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      const credential = await storage.getMobilesentrixCredentialByReseller(req.user.id);
      res.json(credential || null);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // POST /api/mobilesentrix/credentials - Create/update MobileSentrix credentials
  app.post("/api/mobilesentrix/credentials", requireAuth, requireRole("reseller"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      const { consumerName, consumerKey, consumerSecret, environment } = req.body;
      if (!consumerName || !consumerKey || !consumerSecret) {
        return res.status(400).send("Consumer Name, Consumer Key e Consumer Secret sono obbligatori");
      }

      const validEnvironment = environment === "staging" ? "staging" : "production";
      const existing = await storage.getMobilesentrixCredentialByReseller(req.user.id);
      
      if (existing) {
        const updated = await storage.updateMobilesentrixCredential(existing.id, {
          consumerName,
          consumerKey,
          consumerSecret,
          environment: validEnvironment,
        });
        res.json(updated);
      } else {
        const created = await storage.createMobilesentrixCredential({
          resellerId: req.user.id,
          consumerName,
          consumerKey,
          consumerSecret,
          environment: validEnvironment,
          isActive: true,
        });
        res.json(created);
      }
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // DELETE /api/mobilesentrix/credentials - Delete MobileSentrix credentials
  app.delete("/api/mobilesentrix/credentials", requireAuth, requireRole("reseller"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      const credential = await storage.getMobilesentrixCredentialByReseller(req.user.id);
      if (credential) {
        await storage.deleteMobilesentrixCredential(credential.id);
      }
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // POST /api/mobilesentrix/test-connection - Test MobileSentrix connection
  app.post("/api/mobilesentrix/test-connection", requireAuth, requireRole("reseller"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      const credential = await storage.getMobilesentrixCredentialByReseller(req.user.id);
      if (!credential) {
        return res.status(404).send("Credenziali MobileSentrix non configurate");
      }

      const { getMobilesentrixService } = await import("./mobilesentrixService");
      const mobilesentrixService = getMobilesentrixService(credential);
      
      const result = await mobilesentrixService.testConnection();
      
      await storage.updateMobilesentrixCredential(credential.id, {
        lastTestAt: new Date(),
        testStatus: result.success ? "success" : "failed",
        testMessage: result.message,
      });
      
      res.json(result);
    } catch (error: any) {
      res.status(400).send(error.message);
    }
  });

  // GET /api/mobilesentrix/catalog/categories - Get MobileSentrix categories
  app.get("/api/mobilesentrix/catalog/categories", requireAuth, requireRole("reseller"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      const credential = await storage.getMobilesentrixCredentialByReseller(req.user.id);
      if (!credential) {
        return res.status(404).send("Credenziali MobileSentrix non configurate");
      }

      const { getMobilesentrixService } = await import("./mobilesentrixService");
      const mobilesentrixService = getMobilesentrixService(credential);
      const categories = await mobilesentrixService.getCategories();
      res.json(categories);
    } catch (error: any) {
      res.status(400).send(error.message);
    }
  });

  // GET /api/mobilesentrix/catalog/brands - Get MobileSentrix brands
  app.get("/api/mobilesentrix/catalog/brands", requireAuth, requireRole("reseller"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      const credential = await storage.getMobilesentrixCredentialByReseller(req.user.id);
      if (!credential) {
        return res.status(404).send("Credenziali MobileSentrix non configurate");
      }

      const { getMobilesentrixService } = await import("./mobilesentrixService");
      const mobilesentrixService = getMobilesentrixService(credential);
      const brands = await mobilesentrixService.getBrands();
      res.json(brands);
    } catch (error: any) {
      res.status(400).send(error.message);
    }
  });

  // GET /api/mobilesentrix/catalog/products - Search MobileSentrix products
  app.get("/api/mobilesentrix/catalog/products", requireAuth, requireRole("reseller"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      const credential = await storage.getMobilesentrixCredentialByReseller(req.user.id);
      if (!credential) {
        return res.status(404).send("Credenziali MobileSentrix non configurate");
      }

      const { getMobilesentrixService } = await import("./mobilesentrixService");
      const mobilesentrixService = getMobilesentrixService(credential);
      
      const params: any = {};
      if (req.query.search) params.query = String(req.query.search);
      if (req.query.category_id) params.category_id = String(req.query.category_id);
      if (req.query.brand) params.brand = String(req.query.brand);
      if (req.query.page) params.page = Number(req.query.page);
      if (req.query.per_page) params.per_page = Number(req.query.per_page);
      
      const result = await mobilesentrixService.searchProducts(params);
      res.json(result);
    } catch (error: any) {
      res.status(400).send(error.message);
    }
  });

  // GET /api/mobilesentrix/catalog/products/:id - Get MobileSentrix product detail
  app.get("/api/mobilesentrix/catalog/products/:id", requireAuth, requireRole("reseller"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      const credential = await storage.getMobilesentrixCredentialByReseller(req.user.id);
      if (!credential) {
        return res.status(404).send("Credenziali MobileSentrix non configurate");
      }

      const { getMobilesentrixService } = await import("./mobilesentrixService");
      const mobilesentrixService = getMobilesentrixService(credential);
      const product = await mobilesentrixService.getProduct(req.params.id);
      res.json(product);
    } catch (error: any) {
      res.status(400).send(error.message);
    }
  });

  // GET /api/mobilesentrix/account - Get account info
  app.get("/api/mobilesentrix/account", requireAuth, requireRole("reseller"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      const credential = await storage.getMobilesentrixCredentialByReseller(req.user.id);
      if (!credential) {
        return res.status(404).send("Credenziali MobileSentrix non configurate");
      }

      const { getMobilesentrixService } = await import("./mobilesentrixService");
      const mobilesentrixService = getMobilesentrixService(credential);
      const accountInfo = await mobilesentrixService.getAccountInfo();
      res.json(accountInfo);
    } catch (error: any) {
      res.status(400).send(error.message);
    }
  });

  // ==========================================
  // MAPBOX ADDRESS AUTOCOMPLETE
  // ==========================================
  
  // GET /api/geocode/autocomplete - Proxy per Mapbox Searchbox API (address autocomplete)
  app.get("/api/geocode/autocomplete", requireAuth, async (req, res) => {
    try {
      const query = req.query.q as string;
      const sessionToken = req.query.session_token as string || crypto.randomUUID();
      
      if (!query || query.length < 3) {
        return res.json({ suggestions: [] });
      }
      
      const mapboxToken = process.env.MAPBOX_ACCESS_TOKEN;
      if (!mapboxToken) {
        console.error("[Geocode] MAPBOX_ACCESS_TOKEN not configured");
        return res.json({ suggestions: [] });
      }
      
      // Mapbox Searchbox API v1 - designed for autocomplete
      const url = `https://api.mapbox.com/search/searchbox/v1/suggest?q=${encodeURIComponent(query)}&access_token=${mapboxToken}&session_token=${sessionToken}&country=IT&language=it&limit=5&types=address,street,place,locality,neighborhood`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("[Geocode] Mapbox API error:", response.status, errorText);
        return res.json({ suggestions: [] });
      }
      
      const data = await response.json();
      
      // Parse Mapbox Searchbox response
      const suggestions = (data.suggestions || []).map((suggestion: any) => {
        const context = suggestion.context || {};
        
        // Extract address components
        let address = suggestion.name || "";
        let city = "";
        let province = "";
        let postalCode = "";
        
        // Find city from context (place or locality)
        if (context.place?.name) {
          city = context.place.name;
        } else if (context.locality?.name) {
          city = context.locality.name;
        }
        
        // Find province from region
        if (context.region?.region_code) {
          province = context.region.region_code;
        } else if (context.region?.name) {
          // Try to extract province code from name
          province = context.region.name.substring(0, 2).toUpperCase();
        }
        
        // Get postcode
        if (context.postcode?.name) {
          postalCode = context.postcode.name;
        }
        
        // For place/locality types, use as city
        if (suggestion.feature_type === "place" || suggestion.feature_type === "locality") {
          city = suggestion.name || city;
          address = "";
        }
        
        return {
          mapboxId: suggestion.mapbox_id,
          fullAddress: suggestion.full_address || suggestion.place_formatted || suggestion.name || "",
          address,
          city,
          province,
          postalCode,
          country: "IT"
        };
      });
      
      res.json({ suggestions });
    } catch (error: any) {
      console.error("Geocode autocomplete error:", error.message);
      res.json({ suggestions: [] });
    }
  });
  
  // GET /api/geocode/retrieve/:mapboxId - Get full details for a selected suggestion
  app.get("/api/geocode/retrieve/:mapboxId", requireAuth, async (req, res) => {
    try {
      const { mapboxId } = req.params;
      const sessionToken = req.query.session_token as string || crypto.randomUUID();
      
      const mapboxToken = process.env.MAPBOX_ACCESS_TOKEN;
      if (!mapboxToken) {
        return res.status(500).json({ error: "Mapbox token not configured" });
      }
      
      // Retrieve full details from Mapbox
      const url = `https://api.mapbox.com/search/searchbox/v1/retrieve/${mapboxId}?access_token=${mapboxToken}&session_token=${sessionToken}`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        return res.status(response.status).json({ error: "Failed to retrieve address details" });
      }
      
      const data = await response.json();
      const feature = data.features?.[0];
      
      if (!feature) {
        return res.status(404).json({ error: "Address not found" });
      }
      
      const props = feature.properties || {};
      const context = props.context || {};
      
      // Extract full address details
      let address = props.name || "";
      let city = context.place?.name || context.locality?.name || "";
      let province = context.region?.region_code || "";
      let postalCode = context.postcode?.name || "";
      
      // For address type, combine street and house number
      if (props.feature_type === "address" && props.address) {
        address = props.address;
      }
      
      res.json({
        fullAddress: props.full_address || props.place_formatted || "",
        address,
        city,
        province,
        postalCode,
        country: "IT"
      });
    } catch (error: any) {
      console.error("Geocode retrieve error:", error.message);
      res.status(500).json({ error: error.message });
    }
  });

  // ==========================================
  // E-COMMERCE: CUSTOMER ADDRESSES
  // ==========================================

  app.get("/api/customer-addresses", requireAuth, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ error: "Non autenticato" });
      const addresses = await storage.listCustomerAddresses(req.user.id);
      res.json(addresses);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/customer-addresses/:id", requireAuth, async (req, res) => {
    try {
      const address = await storage.getCustomerAddress(req.params.id);
      if (!address) return res.status(404).json({ error: "Indirizzo non trovato" });
      if (address.customerId !== req.user?.id) return res.status(403).json({ error: "Accesso negato" });
      res.json(address);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/customer-addresses", requireAuth, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ error: "Non autenticato" });
      const address = await storage.createCustomerAddress({
        ...req.body,
        customerId: req.user.id,
        resellerId: req.user.resellerId || req.user.id
      });
      res.json(address);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.put("/api/customer-addresses/:id", requireAuth, async (req, res) => {
    try {
      const existing = await storage.getCustomerAddress(req.params.id);
      if (!existing) return res.status(404).json({ error: "Indirizzo non trovato" });
      if (existing.customerId !== req.user?.id) return res.status(403).json({ error: "Accesso negato" });
      const updated = await storage.updateCustomerAddress(req.params.id, req.body);
      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/customer-addresses/:id", requireAuth, async (req, res) => {
    try {
      const existing = await storage.getCustomerAddress(req.params.id);
      if (!existing) return res.status(404).json({ error: "Indirizzo non trovato" });
      if (existing.customerId !== req.user?.id) return res.status(403).json({ error: "Accesso negato" });
      await storage.deleteCustomerAddress(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/customer-addresses/:id/set-default", requireAuth, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ error: "Non autenticato" });
      const existing = await storage.getCustomerAddress(req.params.id);
      if (!existing) return res.status(404).json({ error: "Indirizzo non trovato" });
      if (existing.customerId !== req.user.id) return res.status(403).json({ error: "Accesso negato" });
      await storage.setDefaultAddress(req.user.id, req.params.id, req.body.isBilling || false);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ==========================================
  // E-COMMERCE: SHOP CATALOG (Public)
  // ==========================================

  // Shop del singolo venditore (admin o reseller)
  // sellerId può essere 'admin' per lo shop dell'admin o un resellerId
  app.get("/api/shop/:sellerId/products", async (req, res) => {
    try {
      const { sellerId } = req.params;
      const { type, brand, category, search, limit, offset } = req.query;
      
      // Usa la nuova logica che include prodotti propri + assegnati pubblicati
      let shopProducts = await storage.getShopProductsForSeller(sellerId);
      
      // Applica filtri
      if (type) shopProducts = shopProducts.filter(p => p.productType === type);
      if (brand) shopProducts = shopProducts.filter(p => p.brand === brand);
      if (category) shopProducts = shopProducts.filter(p => p.category === category);
      if (search) {
        const searchLower = (search as string).toLowerCase();
        shopProducts = shopProducts.filter(p => 
          p.name.toLowerCase().includes(searchLower) ||
          p.sku?.toLowerCase().includes(searchLower)
        );
      }
      
      const total = shopProducts.length;
      const offsetNum = parseInt(offset as string) || 0;
      const limitNum = parseInt(limit as string) || 20;
      const paginatedProducts = shopProducts.slice(offsetNum, offsetNum + limitNum);
      
      res.json({ products: paginatedProducts, total, limit: limitNum, offset: offsetNum });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Marketplace aggregato con info venditori (formato per frontend)
  app.get("/api/shop/marketplace", async (req, res) => {
    try {
      const marketplaceProducts = await storage.getMarketplaceProducts();
      
      // Raggruppa per productId con tutti i venditori
      const productMap = new Map<string, {
        product: any;
        sellers: Array<{ resellerId: string; resellerName: string; price: number; isPublished: boolean }>;
      }>();
      
      for (const p of marketplaceProducts) {
        const existing = productMap.get(p.id);
        if (existing) {
          existing.sellers.push({
            resellerId: p.sellerId || 'admin',
            resellerName: p.sellerName || 'Admin Shop',
            price: p.effectivePrice || p.unitPrice,
            isPublished: true,
          });
        } else {
          productMap.set(p.id, {
            product: {
              id: p.id,
              name: p.name,
              description: p.description,
              sku: p.sku,
              category: p.category,
              brand: p.brand,
              imageUrl: p.imageUrl,
              unitPrice: p.unitPrice,
            },
            sellers: [{
              resellerId: p.sellerId || 'admin',
              resellerName: p.sellerName || 'Admin Shop',
              price: p.effectivePrice || p.unitPrice,
              isPublished: true,
            }],
          });
        }
      }
      
      const result = Array.from(productMap.values()).map(entry => ({
        product: entry.product,
        sellers: entry.sellers,
        lowestPrice: Math.min(...entry.sellers.map(s => s.price)),
        sellerCount: entry.sellers.length,
      }));
      
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Marketplace - tutti i prodotti di tutti i venditori
  app.get("/api/marketplace/products", async (req, res) => {
    try {
      const { type, brand, category, search, limit, offset } = req.query;
      
      let marketplaceProducts = await storage.getMarketplaceProducts();
      
      // Applica filtri
      if (type) marketplaceProducts = marketplaceProducts.filter(p => p.productType === type);
      if (brand) marketplaceProducts = marketplaceProducts.filter(p => p.brand === brand);
      if (category) marketplaceProducts = marketplaceProducts.filter(p => p.category === category);
      if (search) {
        const searchLower = (search as string).toLowerCase();
        marketplaceProducts = marketplaceProducts.filter(p => 
          p.name.toLowerCase().includes(searchLower) ||
          p.sku?.toLowerCase().includes(searchLower)
        );
      }
      
      const total = marketplaceProducts.length;
      const offsetNum = parseInt(offset as string) || 0;
      const limitNum = parseInt(limit as string) || 20;
      const paginatedProducts = marketplaceProducts.slice(offsetNum, offsetNum + limitNum);
      
      res.json({ products: paginatedProducts, total, limit: limitNum, offset: offsetNum });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Marketplace - dettaglio singolo prodotto con tutti i venditori
  app.get("/api/marketplace/products/:productId", async (req, res) => {
    try {
      const { productId } = req.params;
      
      const product = await storage.getProduct(productId);
      if (!product) {
        return res.status(404).json({ error: "Prodotto non trovato" });
      }
      
      // Get specs based on product type
      let specs = null;
      if (product.productType === 'dispositivo') {
        specs = await storage.getSmartphoneSpecs(product.id);
      } else if (product.productType === 'accessorio') {
        specs = await storage.getAccessorySpecs(product.id);
      }
      
      // Get all sellers for this product from marketplace
      const marketplaceProducts = await storage.getMarketplaceProducts();
      const productEntries = marketplaceProducts.filter(p => p.id === productId);
      
      const sellers = productEntries.map(p => ({
        resellerId: p.sellerId || 'admin',
        resellerName: p.sellerName || 'Admin Shop',
        price: p.effectivePrice || p.unitPrice,
        isPublished: true,
      }));
      
      // If no sellers found, add the product with base price as admin
      if (sellers.length === 0) {
        sellers.push({
          resellerId: 'admin',
          resellerName: 'Admin Shop',
          price: product.unitPrice,
          isPublished: true,
        });
      }
      
      const lowestPrice = Math.min(...sellers.map(s => s.price));
      
      // Get warehouse stock for availability
      const warehouseStock = await storage.getProductWarehouseStocks(productId);
      const totalStock = warehouseStock.reduce((sum, ws) => sum + ws.quantity, 0);
      
      res.json({
        product: {
          id: product.id,
          name: product.name,
          description: product.description,
          sku: product.sku,
          category: product.category,
          brand: product.brand,
          imageUrl: product.imageUrl,
          unitPrice: product.unitPrice,
          productType: product.productType,
        },
        specs,
        sellers,
        lowestPrice: sellers.length > 0 ? Math.min(...sellers.map(s => s.price)) : product.unitPrice,
        sellerCount: sellers.length,
        totalStock,
        hasValidSellers: sellers.length > 0,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/shop/:resellerId/products/:productId", async (req, res) => {
    try {
      const product = await storage.getProduct(req.params.productId);
      if (!product) return res.status(404).json({ error: "Prodotto non trovato" });
      if (product.resellerId !== req.params.resellerId) return res.status(404).json({ error: "Prodotto non trovato" });
      
      let specs = null;
      if (product.productType === 'dispositivo') {
        specs = await storage.getSmartphoneSpecs(product.id);
      } else if (product.productType === 'accessorio') {
        specs = await storage.getAccessorySpecs(product.id);
      }
      
      res.json({ product, specs });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ==========================================
  // E-COMMERCE: SHOPPING CART
  // ==========================================

  app.get("/api/shop/:resellerId/cart", async (req, res) => {
    try {
      const { resellerId } = req.params;
      const customerId = req.user?.id || null;
      const sessionId = req.session?.id || null;
      
      let cart = await storage.getActiveCart(customerId, sessionId, resellerId);
      
      if (!cart) {
        cart = await storage.createCart({
          resellerId,
          customerId,
          sessionId: customerId ? null : sessionId
        });
      }
      
      const items = await storage.listCartItems(cart.id);
      
      const itemsWithProducts = await Promise.all(items.map(async (item) => {
        const product = await storage.getProduct(item.productId);
        return { ...item, product };
      }));
      
      res.json({ cart, items: itemsWithProducts });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/shop/:resellerId/cart/items", async (req, res) => {
    try {
      const { resellerId } = req.params;
      const { productId, quantity = 1 } = req.body;
      
      const customerId = req.user?.id || null;
      const sessionId = req.session?.id || null;
      
      let cart = await storage.getActiveCart(customerId, sessionId, resellerId);
      if (!cart) {
        cart = await storage.createCart({
          resellerId,
          customerId,
          sessionId: customerId ? null : sessionId
        });
      }
      
      const product = await storage.getProduct(productId);
      if (!product) return res.status(404).json({ error: "Prodotto non trovato" });
      if (product.resellerId !== resellerId) return res.status(400).json({ error: "Prodotto non disponibile" });
      
      const existingItem = await storage.getCartItemByProduct(cart.id, productId);
      
      if (existingItem) {
        const updated = await storage.updateCartItem(existingItem.id, {
          quantity: existingItem.quantity + quantity
        });
        res.json(updated);
      } else {
        const unitPrice = (product.priceCents || 0) / 100;
        const item = await storage.addCartItem({
          cartId: cart.id,
          productId,
          quantity,
          unitPrice,
          totalPrice: unitPrice * quantity,
          discount: 0
        });
        res.json(item);
      }
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.put("/api/cart/items/:itemId", async (req, res) => {
    try {
      const { quantity } = req.body;
      if (quantity < 1) {
        await storage.removeCartItem(req.params.itemId);
        return res.json({ success: true, removed: true });
      }
      const updated = await storage.updateCartItem(req.params.itemId, { quantity });
      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/cart/items/:itemId", async (req, res) => {
    try {
      await storage.removeCartItem(req.params.itemId);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/cart/:cartId", async (req, res) => {
    try {
      await storage.clearCart(req.params.cartId);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ==========================================
  // E-COMMERCE: CHECKOUT
  // ==========================================

  app.post("/api/shop/:resellerId/checkout", requireAuth, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ error: "Non autenticato" });
      
      const { resellerId } = req.params;
      const {
        shippingAddressId,
        billingAddressId,
        deliveryType = 'shipping',
        paymentMethod,
        customerNotes
      } = req.body;
      
      const cart = await storage.getActiveCart(req.user.id, null, resellerId);
      if (!cart) return res.status(400).json({ error: "Carrello vuoto" });
      
      const cartItems = await storage.listCartItems(cart.id);
      if (cartItems.length === 0) return res.status(400).json({ error: "Carrello vuoto" });
      
      const shippingAddress = shippingAddressId ? await storage.getCustomerAddress(shippingAddressId) : null;
      const billingAddress = billingAddressId ? await storage.getCustomerAddress(billingAddressId) : shippingAddress;
      
      const orderNumber = await storage.generateOrderNumber(resellerId);
      
      const order = await storage.createSalesOrder({
        orderNumber,
        customerId: req.user.id,
        resellerId,
        status: 'pending',
        deliveryType: deliveryType as any,
        subtotal: cart.subtotal,
        discountAmount: cart.discount,
        shippingCost: cart.shippingCost,
        taxAmount: 0,
        total: cart.total,
        shippingAddressId,
        shippingRecipient: shippingAddress?.recipientName,
        shippingAddress: shippingAddress?.address,
        shippingCity: shippingAddress?.city,
        shippingProvince: shippingAddress?.province,
        shippingPostalCode: shippingAddress?.postalCode,
        shippingCountry: shippingAddress?.country,
        shippingPhone: shippingAddress?.phone,
        billingAddressId,
        billingRecipient: billingAddress?.recipientName,
        billingAddress: billingAddress?.address,
        billingCity: billingAddress?.city,
        billingProvince: billingAddress?.province,
        billingPostalCode: billingAddress?.postalCode,
        billingCountry: billingAddress?.country,
        customerNotes,
        source: 'web'
      });
      
      for (const item of cartItems) {
        const product = await storage.getProduct(item.productId);
        await storage.createSalesOrderItem({
          orderId: order.id,
          productId: item.productId,
          productName: product?.name || 'Prodotto',
          productSku: product?.sku,
          productImage: product?.images?.[0],
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discount: item.discount,
          totalPrice: item.totalPrice
        });
      }
      
      if (paymentMethod) {
        await storage.createSalesOrderPayment({
          orderId: order.id,
          method: paymentMethod,
          status: 'pending',
          amount: cart.total,
          currency: 'EUR'
        });
      }
      
      await storage.updateCart(cart.id, { status: 'converted' });
      
      res.json({ order, orderNumber: order.orderNumber });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ==========================================
  // E-COMMERCE: SALES ORDERS (Customer view)
  // ==========================================

  app.get("/api/my-orders", requireAuth, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ error: "Non autenticato" });
      const orders = await storage.listSalesOrders({ customerId: req.user.id });
      res.json(orders);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/my-orders/:orderId", requireAuth, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ error: "Non autenticato" });
      const order = await storage.getSalesOrder(req.params.orderId);
      if (!order) return res.status(404).json({ error: "Ordine non trovato" });
      if (order.customerId !== req.user.id) return res.status(403).json({ error: "Accesso negato" });
      
      const items = await storage.listSalesOrderItems(order.id);
      const payments = await storage.listSalesOrderPayments(order.id);
      const shipments = await storage.listSalesOrderShipments(order.id);
      
      res.json({ order, items, payments, shipments });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ==========================================
  // E-COMMERCE: SALES ORDERS (Reseller management)
  // ==========================================

  app.get("/api/sales-orders", requireAuth, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ error: "Non autenticato" });
      if (!['admin', 'admin_staff', 'reseller', 'reseller_staff'].includes(req.user.role)) {
        return res.status(403).json({ error: "Accesso negato" });
      }
      
      const filters: { resellerId?: string; status?: string; branchId?: string } = {};
      
      if (req.user.role === 'reseller') filters.resellerId = req.user.id;
      else if (req.user.role === 'reseller_staff' && req.user.resellerId) filters.resellerId = req.user.resellerId;
      else if (req.query.resellerId) filters.resellerId = req.query.resellerId as string;
      
      if (req.query.status) filters.status = req.query.status as string;
      if (req.query.branchId) filters.branchId = req.query.branchId as string;
      
      const orders = await storage.listSalesOrders(filters);
      res.json(orders);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/sales-orders/:id", requireAuth, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ error: "Non autenticato" });
      
      const order = await storage.getSalesOrder(req.params.id);
      if (!order) return res.status(404).json({ error: "Ordine non trovato" });
      
      if (req.user.role === 'reseller' && order.resellerId !== req.user.id) {
        return res.status(403).json({ error: "Accesso negato" });
      }
      if (req.user.role === 'reseller_staff' && order.resellerId !== req.user.resellerId) {
        return res.status(403).json({ error: "Accesso negato" });
      }
      
      const items = await storage.listSalesOrderItems(order.id);
      const payments = await storage.listSalesOrderPayments(order.id);
      const shipments = await storage.listSalesOrderShipments(order.id);
      const history = await storage.listSalesOrderStateHistory(order.id);
      
      res.json({ order, items, payments, shipments, history });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.put("/api/sales-orders/:id/status", requireAuth, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ error: "Non autenticato" });
      if (!['admin', 'admin_staff', 'reseller', 'reseller_staff'].includes(req.user.role)) {
        return res.status(403).json({ error: "Accesso negato" });
      }
      
      const order = await storage.getSalesOrder(req.params.id);
      if (!order) return res.status(404).json({ error: "Ordine non trovato" });
      
      if (req.user.role === 'reseller' && order.resellerId !== req.user.id) {
        return res.status(403).json({ error: "Accesso negato" });
      }
      if (req.user.role === 'reseller_staff' && order.resellerId !== req.user.resellerId) {
        return res.status(403).json({ error: "Accesso negato" });
      }
      
      const { status, reason } = req.body;
      const updated = await storage.updateSalesOrderStatus(req.params.id, status, req.user.id, reason);
      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ==========================================
  // E-COMMERCE: PAYMENTS
  // ==========================================

  app.get("/api/payments", requireAuth, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ error: "Non autenticato" });
      if (!['admin', 'admin_staff'].includes(req.user.role)) {
        return res.status(403).json({ error: "Accesso negato" });
      }
      
      const { status, method, orderType } = req.query;
      const payments = await storage.listAllPayments({
        status: status as string | undefined,
        method: method as string | undefined,
        orderType: orderType && orderType !== 'all' ? orderType as string : undefined
      });
      
      res.json(payments);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/sales-orders/:orderId/payments", requireAuth, async (req, res) => {
    try {
      const payments = await storage.listSalesOrderPayments(req.params.orderId);
      res.json(payments);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/sales-orders/:orderId/payments", requireAuth, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ error: "Non autenticato" });
      if (!['admin', 'admin_staff', 'reseller', 'reseller_staff'].includes(req.user.role)) {
        return res.status(403).json({ error: "Accesso negato" });
      }
      
      const payment = await storage.createSalesOrderPayment({
        orderId: req.params.orderId,
        ...req.body
      });
      res.json(payment);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.put("/api/payments/:id", requireAuth, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ error: "Non autenticato" });
      if (!['admin', 'admin_staff', 'reseller', 'reseller_staff'].includes(req.user.role)) {
        return res.status(403).json({ error: "Accesso negato" });
      }
      
      const updated = await storage.updateSalesOrderPayment(req.params.id, req.body);
      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ==========================================
  // E-COMMERCE: SHIPMENTS
  // ==========================================

  app.get("/api/sales-orders/:orderId/shipments", requireAuth, async (req, res) => {
    try {
      const shipments = await storage.listSalesOrderShipments(req.params.orderId);
      res.json(shipments);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/sales-orders/:orderId/shipments", requireAuth, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ error: "Non autenticato" });
      if (!['admin', 'admin_staff', 'reseller', 'reseller_staff'].includes(req.user.role)) {
        return res.status(403).json({ error: "Accesso negato" });
      }
      
      const shipment = await storage.createSalesOrderShipment({
        orderId: req.params.orderId,
        ...req.body
      });
      res.json(shipment);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.put("/api/shipments/:id", requireAuth, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ error: "Non autenticato" });
      if (!['admin', 'admin_staff', 'reseller', 'reseller_staff'].includes(req.user.role)) {
        return res.status(403).json({ error: "Accesso negato" });
      }
      
      const updated = await storage.updateSalesOrderShipment(req.params.id, req.body);
      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/shipments/:id/tracking", requireAuth, async (req, res) => {
    try {
      const events = await storage.listShipmentTrackingEvents(req.params.id);
      res.json(events);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/shipments/:id/tracking", requireAuth, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ error: "Non autenticato" });
      if (!['admin', 'admin_staff', 'reseller', 'reseller_staff'].includes(req.user.role)) {
        return res.status(403).json({ error: "Accesso negato" });
      }
      
      const event = await storage.createShipmentTrackingEvent({
        shipmentId: req.params.id,
        ...req.body
      });
      res.json(event);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ==========================================
  // E-COMMERCE: SALES ORDER RETURNS
  // ==========================================

  // List all returns with filtering
  app.get("/api/sales-returns", requireAuth, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ error: "Non autenticato" });
      
      const filters: any = {};
      if (req.query.status && req.query.status !== 'all') {
        filters.status = req.query.status;
      }
      if (req.query.orderId) {
        filters.orderId = req.query.orderId;
      }
      
      // Role-based filtering
      if (req.user.role === 'customer') {
        filters.customerId = req.user.id;
      } else if (['reseller', 'reseller_staff'].includes(req.user.role)) {
        filters.resellerId = req.user.role === 'reseller' ? req.user.id : req.user.resellerId;
      }
      // Admin sees all
      
      const returns = await storage.listSalesOrderReturns(filters);
      res.json(returns);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get single return by ID
  app.get("/api/sales-returns/:id", requireAuth, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ error: "Non autenticato" });
      
      const returnOrder = await storage.getSalesOrderReturn(req.params.id);
      if (!returnOrder) {
        return res.status(404).json({ error: "Reso non trovato" });
      }
      
      // Authorization check
      if (req.user.role === 'customer' && returnOrder.customerId !== req.user.id) {
        return res.status(403).json({ error: "Accesso negato" });
      }
      if (['reseller', 'reseller_staff'].includes(req.user.role)) {
        const resellerId = req.user.role === 'reseller' ? req.user.id : req.user.resellerId;
        if (returnOrder.resellerId !== resellerId) {
          return res.status(403).json({ error: "Accesso negato" });
        }
      }
      
      res.json(returnOrder);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Create a new return request
  app.post("/api/sales-returns", requireAuth, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ error: "Non autenticato" });
      
      const { orderId, reason, notes, items } = req.body;
      
      // Get the order to verify ownership and extract details
      const order = await storage.getSalesOrder(orderId);
      if (!order) {
        return res.status(404).json({ error: "Ordine non trovato" });
      }
      
      // Authorization: customer can only return their own orders
      if (req.user.role === 'customer' && order.customerId !== req.user.id) {
        return res.status(403).json({ error: "Non autorizzato" });
      }
      
      // Generate return number
      const returnNumber = await storage.generateReturnNumber(order.resellerId);
      
      // Create the return
      const returnData = await storage.createSalesOrderReturn({
        returnNumber,
        orderId,
        resellerId: order.resellerId,
        customerId: order.customerId || undefined,
        reason,
        customerNotes: notes,
        status: 'requested'
      });
      
      // Create return items if provided
      if (items && Array.isArray(items)) {
        for (const item of items) {
          await storage.createSalesOrderReturnItem({
            returnId: returnData.id,
            orderItemId: item.orderItemId,
            productId: item.productId,
            quantity: item.quantity,
            reason: item.reason || reason,
            condition: item.condition || 'unknown'
          });
        }
      }
      
      res.status(201).json(returnData);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Update return status
  app.put("/api/sales-returns/:id", requireAuth, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ error: "Non autenticato" });
      if (!['admin', 'admin_staff', 'reseller', 'reseller_staff'].includes(req.user.role)) {
        return res.status(403).json({ error: "Accesso negato" });
      }
      
      const updated = await storage.updateSalesOrderReturn(req.params.id, req.body);
      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get return items
  app.get("/api/sales-returns/:returnId/items", requireAuth, async (req, res) => {
    try {
      const items = await storage.listSalesOrderReturnItems(req.params.returnId);
      res.json(items);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Add item to return
  app.post("/api/sales-returns/:returnId/items", requireAuth, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ error: "Non autenticato" });
      
      const item = await storage.createSalesOrderReturnItem({
        returnId: req.params.returnId,
        ...req.body
      });
      res.status(201).json(item);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Update return item
  app.put("/api/sales-return-items/:id", requireAuth, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ error: "Non autenticato" });
      if (!['admin', 'admin_staff', 'reseller', 'reseller_staff'].includes(req.user.role)) {
        return res.status(403).json({ error: "Accesso negato" });
      }
      
      const updated = await storage.updateSalesOrderReturnItem(req.params.id, req.body);
      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Delete return item
  app.delete("/api/sales-return-items/:id", requireAuth, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ error: "Non autenticato" });
      
      await storage.deleteSalesOrderReturnItem(req.params.id);
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ==========================================
  // WAREHOUSE MANAGEMENT (Gestione Magazzini)
  // ==========================================

  // Admin endpoint to list ALL warehouses with owner info and stock counts
  app.get("/api/admin/all-warehouses", requireAuth, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ error: "Non autenticato" });
      if (!['admin', 'admin_staff'].includes(req.user.role)) {
        return res.status(403).json({ error: "Accesso negato" });
      }
      
      const { ownerType, isActive } = req.query;
      let filters: { ownerType?: string; isActive?: boolean } = {};
      if (ownerType) filters.ownerType = ownerType as string;
      if (isActive !== undefined) filters.isActive = isActive === 'true';
      
      const warehouses = await storage.listWarehouses(filters);
      
      // Enrich with owner info and stock counts
      const enrichedWarehouses = await Promise.all(warehouses.map(async (wh) => {
        let owner: { id: string; username: string; fullName: string | null; role: string } | null = null;
        
        // Check for system warehouse (ownerId can be 'system' or null)
        if (wh.ownerId === 'system' || !wh.ownerId || wh.ownerType === 'admin') {
          owner = { id: 'system', username: 'system', fullName: 'Magazzino Centrale', role: 'admin' };
        } else {
          const user = await storage.getUser(wh.ownerId);
          if (user) {
            owner = { id: user.id, username: user.username, fullName: user.fullName, role: user.role };
          }
        }
        
        // Get stock count and total quantity
        const stock = await storage.listWarehouseStock(wh.id);
        const stockCount = stock.length;
        const totalQuantity = stock.reduce((sum, s) => sum + s.quantity, 0);
        
        return {
          ...wh,
          owner,
          stockCount,
          totalQuantity,
        };
      }));
      
      res.json(enrichedWarehouses);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/warehouses", requireAuth, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ error: "Non autenticato" });
      
      let filters: { ownerType?: string; ownerId?: string; isActive?: boolean } = {};
      if (req.query.ownerType) filters.ownerType = req.query.ownerType as string;
      if (req.query.ownerId) filters.ownerId = req.query.ownerId as string;
      if (req.query.isActive) filters.isActive = req.query.isActive === 'true';
      
      if (!['admin', 'admin_staff'].includes(req.user.role)) {
        if (req.user.role === 'reseller' || req.user.role === 'reseller_staff') {
          filters.ownerType = 'reseller';
          filters.ownerId = req.user.resellerId || req.user.id;
        } else if (req.user.role === 'repair_center') {
          filters.ownerType = 'repair_center';
          filters.ownerId = req.user.repairCenterId || req.user.id;
        }
      }
      
      const warehouses = await storage.listWarehouses(filters);
      res.json(warehouses);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get accessible warehouses for current user (for transfer destination selection)
  // NOTE: Must be defined BEFORE /api/warehouses/:id to avoid route collision
  app.get("/api/warehouses/accessible", requireAuth, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ error: "Non autenticato" });
      
      let accessibleWarehouses: any[] = [];
      
      if (['admin', 'admin_staff'].includes(req.user.role)) {
        accessibleWarehouses = await storage.listWarehouses({});
      } else if (req.user.role === 'reseller' || req.user.role === 'reseller_staff' || req.user.role === 'reseller_collaborator') {
        const resellerId = req.user.resellerId || req.user.id;
        
        // 1. Proprio magazzino
        const ownWarehouse = await storage.getWarehouseByOwner('reseller', resellerId);
        if (ownWarehouse) accessibleWarehouses.push(ownWarehouse);
        
        // 2. Sub-rivenditori (users con role='reseller' e parentResellerId = questo reseller)
        const allUsers = await storage.listUsers();
        const subResellers = allUsers.filter(u => u.parentResellerId === resellerId);
        for (const sub of subResellers) {
          const subWarehouse = await storage.getWarehouseByOwner('sub_reseller', sub.id);
          if (subWarehouse) accessibleWarehouses.push(subWarehouse);
        }
        
        // 3. Centri di riparazione (dalla tabella repair_centers con resellerId = questo reseller)
        const allRepairCenters = await storage.listRepairCenters();
        const myRepairCenters = allRepairCenters.filter(rc => rc.resellerId === resellerId);
        for (const rc of myRepairCenters) {
          const rcWarehouse = await storage.getWarehouseByOwner('repair_center', rc.id);
          if (rcWarehouse) accessibleWarehouses.push(rcWarehouse);
        }
      } else if (req.user.role === 'repair_center') {
        const rcId = req.user.repairCenterId || req.user.id;
        const ownWarehouse = await storage.getWarehouseByOwner('repair_center', rcId);
        if (ownWarehouse) accessibleWarehouses.push(ownWarehouse);
      }
      
      const enriched = await Promise.all(accessibleWarehouses.map(async (wh) => {
        let owner = null;
        if (wh.ownerId && wh.ownerId !== 'system') {
          if (wh.ownerType === 'repair_center') {
            // Per i centri di riparazione, ownerId punta a repair_centers, non users
            const repairCenter = await storage.getRepairCenter(wh.ownerId);
            if (repairCenter) {
              owner = { id: repairCenter.id, username: repairCenter.name, fullName: repairCenter.name };
            }
          } else {
            // Per admin, reseller, sub_reseller, ownerId punta a users
            const user = await storage.getUser(wh.ownerId);
            if (user) owner = { id: user.id, username: user.username, fullName: user.fullName };
          }
        }
        return { ...wh, owner };
      }));
      
      res.json(enriched);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/warehouses/:id", requireAuth, async (req, res) => {
    try {
      const warehouse = await storage.getWarehouse(req.params.id);
      if (!warehouse) return res.status(404).json({ error: "Magazzino non trovato" });
      res.json(warehouse);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/my-warehouse", requireAuth, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ error: "Non autenticato" });
      
      let ownerType: string;
      let ownerId: string;
      let ownerName: string;
      
      if (req.user.role === 'admin' || req.user.role === 'admin_staff') {
        ownerType = 'admin';
        ownerId = 'system';
        ownerName = 'Centrale';
      } else if (req.user.role === 'reseller' || req.user.role === 'reseller_staff') {
        ownerType = 'reseller';
        ownerId = req.user.resellerId || req.user.id;
        ownerName = req.user.fullName || req.user.username;
      } else if (req.user.role === 'repair_center') {
        ownerType = 'repair_center';
        ownerId = req.user.repairCenterId || req.user.id;
        ownerName = req.user.fullName || req.user.username;
      } else {
        return res.status(403).json({ error: "Accesso negato" });
      }
      
      const warehouse = await storage.ensureDefaultWarehouse(ownerType, ownerId, ownerName);
      res.json(warehouse);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Immediate transfer between warehouses (executes stock movement right away)
  app.post("/api/warehouses/transfer-immediate", requireAuth, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ error: "Non autenticato" });
      
      const { sourceWarehouseId, destinationWarehouseId, productId, quantity, notes } = req.body;
      
      if (!sourceWarehouseId || !destinationWarehouseId || !productId || !quantity) {
        return res.status(400).json({ error: "Parametri mancanti: sourceWarehouseId, destinationWarehouseId, productId, quantity" });
      }
      
      if (sourceWarehouseId === destinationWarehouseId) {
        return res.status(400).json({ error: "Magazzino sorgente e destinazione devono essere diversi" });
      }
      
      if (quantity <= 0) {
        return res.status(400).json({ error: "La quantità deve essere maggiore di zero" });
      }
      
      // Verify source warehouse exists
      const sourceWarehouse = await storage.getWarehouse(sourceWarehouseId);
      if (!sourceWarehouse) return res.status(404).json({ error: "Magazzino sorgente non trovato" });
      
      // Verify destination warehouse exists
      const destWarehouse = await storage.getWarehouse(destinationWarehouseId);
      if (!destWarehouse) return res.status(404).json({ error: "Magazzino destinazione non trovato" });
      
      // Check permissions - user must have access to both warehouses
      let canAccessSource = false;
      let canAccessDest = false;
      
      if (['admin', 'admin_staff'].includes(req.user.role)) {
        canAccessSource = true;
        canAccessDest = true;
      } else if (req.user.role === 'reseller' || req.user.role === 'reseller_staff' || req.user.role === 'reseller_collaborator') {
        const resellerId = req.user.resellerId || req.user.id;
        
        // Costruisci set di magazzini accessibili (stessa logica di /api/warehouses/accessible)
        const accessibleWarehouseIds = new Set<string>();
        
        // 1. Proprio magazzino
        const ownWarehouse = await storage.getWarehouseByOwner('reseller', resellerId);
        if (ownWarehouse) accessibleWarehouseIds.add(ownWarehouse.id);
        
        // 2. Sub-rivenditori (users con parentResellerId = questo reseller)
        const allUsers = await storage.listUsers();
        const subResellers = allUsers.filter(u => u.parentResellerId === resellerId);
        for (const sub of subResellers) {
          const subWarehouse = await storage.getWarehouseByOwner('sub_reseller', sub.id);
          if (subWarehouse) accessibleWarehouseIds.add(subWarehouse.id);
        }
        
        // 3. Centri di riparazione (dalla tabella repair_centers con resellerId = questo reseller)
        const allRepairCenters = await storage.listRepairCenters();
        const myRepairCenters = allRepairCenters.filter(rc => rc.resellerId === resellerId);
        for (const rc of myRepairCenters) {
          const rcWarehouse = await storage.getWarehouseByOwner('repair_center', rc.id);
          if (rcWarehouse) accessibleWarehouseIds.add(rcWarehouse.id);
        }
        
        // Verifica accesso
        canAccessSource = accessibleWarehouseIds.has(sourceWarehouseId);
        canAccessDest = accessibleWarehouseIds.has(destinationWarehouseId);
      } else if (req.user.role === 'sub_reseller') {
        // Sub-reseller can only transfer from/to their own warehouse
        if (sourceWarehouse.ownerType === 'sub_reseller' && sourceWarehouse.ownerId === req.user.id) {
          canAccessSource = true;
        }
        if (destWarehouse.ownerType === 'sub_reseller' && destWarehouse.ownerId === req.user.id) {
          canAccessDest = true;
        }
      } else if (req.user.role === 'repair_center') {
        // Repair center can only transfer from/to their own warehouse
        const rcId = req.user.repairCenterId || req.user.id;
        if (sourceWarehouse.ownerType === 'repair_center' && sourceWarehouse.ownerId === rcId) {
          canAccessSource = true;
        }
        if (destWarehouse.ownerType === 'repair_center' && destWarehouse.ownerId === rcId) {
          canAccessDest = true;
        }
      }
      
      if (!canAccessSource || !canAccessDest) {
        return res.status(403).json({ error: "Non hai i permessi per trasferire tra questi magazzini" });
      }
      
      // Check available stock in source warehouse
      const sourceStock = await storage.getWarehouseStockItem(sourceWarehouseId, productId);
      if (!sourceStock || sourceStock.quantity < quantity) {
        return res.status(400).json({ error: `Stock insufficiente. Disponibili: ${sourceStock?.quantity || 0}` });
      }
      
      // Get product info
      const product = await storage.getProduct(productId);
      if (!product) return res.status(404).json({ error: "Prodotto non trovato" });
      
      // Execute transfer: decrement source, increment destination
      // Create movement for source warehouse (trasferimento_out)
      await storage.createWarehouseMovement({
        warehouseId: sourceWarehouseId,
        productId,
        movementType: 'trasferimento_out',
        quantity,
        referenceType: 'transfer',
        referenceId: destinationWarehouseId,
        notes: notes || `Trasferimento verso ${destWarehouse.name}`,
        createdBy: req.user.id,
      });
      await storage.updateWarehouseStockQuantity(sourceWarehouseId, productId, -quantity);
      
      // Create movement for destination warehouse (trasferimento_in)
      await storage.createWarehouseMovement({
        warehouseId: destinationWarehouseId,
        productId,
        movementType: 'trasferimento_in',
        quantity,
        referenceType: 'transfer',
        referenceId: sourceWarehouseId,
        notes: notes || `Trasferimento da ${sourceWarehouse.name}`,
        createdBy: req.user.id,
      });
      await storage.updateWarehouseStockQuantity(destinationWarehouseId, productId, quantity);
      
      res.json({ 
        success: true, 
        message: `Trasferite ${quantity} unità di "${product.name}" da "${sourceWarehouse.name}" a "${destWarehouse.name}"`,
        product: { id: product.id, name: product.name, sku: product.sku },
        quantity,
        sourceWarehouse: { id: sourceWarehouse.id, name: sourceWarehouse.name },
        destinationWarehouse: { id: destWarehouse.id, name: destWarehouse.name },
      });
    } catch (error: any) {
      console.error("Transfer error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/warehouses", requireAuth, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ error: "Non autenticato" });
      if (!['admin', 'admin_staff'].includes(req.user.role)) {
        return res.status(403).json({ error: "Solo admin possono creare magazzini" });
      }
      const warehouse = await storage.createWarehouse(req.body);
      res.status(201).json(warehouse);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/warehouses/:id", requireAuth, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ error: "Non autenticato" });
      const updated = await storage.updateWarehouse(req.params.id, req.body);
      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/warehouses/:id", requireAuth, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ error: "Non autenticato" });
      if (!['admin', 'admin_staff'].includes(req.user.role)) {
        return res.status(403).json({ error: "Solo admin possono eliminare magazzini" });
      }
      await storage.deleteWarehouse(req.params.id);
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/warehouses/:warehouseId/stock", requireAuth, async (req, res) => {
    try {
      const stock = await storage.listWarehouseStock(req.params.warehouseId);
      const enrichedStock = await Promise.all(stock.map(async (item) => {
        const product = await storage.getProduct(item.productId);
        return { ...item, product: product ? { id: product.id, name: product.name, sku: product.sku, category: product.category, imageUrl: product.imageUrl } : null };
      }));
      res.json(enrichedStock);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/warehouses/:warehouseId/stock", requireAuth, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ error: "Non autenticato" });
      const { productId, quantity, location, minStock, movementType, notes } = req.body;
      
      const stock = await storage.upsertWarehouseStock({
        warehouseId: req.params.warehouseId,
        productId,
        quantity: quantity || 0,
        location,
        minStock,
      });
      
      if (movementType && quantity) {
        await storage.createWarehouseMovement({
          warehouseId: req.params.warehouseId,
          productId,
          movementType,
          quantity: Math.abs(quantity),
          notes,
          createdBy: req.user.id,
        });
      }
      res.json(stock);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/warehouses/:warehouseId/movements", requireAuth, async (req, res) => {
    try {
      const movements = await storage.listWarehouseMovements({ warehouseId: req.params.warehouseId });
      const enrichedMovements = await Promise.all(movements.map(async (mov) => {
        const product = await storage.getProduct(mov.productId);
        const user = await storage.getUser(mov.createdBy);
        
        let relatedWarehouse: { id: string; name: string } | null = null;
        if (['trasferimento_in', 'trasferimento_out'].includes(mov.movementType) && mov.referenceId) {
          const warehouse = await storage.getWarehouse(mov.referenceId);
          if (warehouse) {
            relatedWarehouse = { id: warehouse.id, name: warehouse.name };
          }
        }
        
        return {
          ...mov,
          product: product ? { id: product.id, name: product.name, sku: product.sku } : null,
          createdByUser: user ? { id: user.id, fullName: user.fullName, username: user.username } : null,
          relatedWarehouse,
        };
      }));
      res.json(enrichedMovements);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/warehouses/:warehouseId/movements", requireAuth, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ error: "Non autenticato" });
      const { productId, movementType, quantity, notes, referenceType, referenceId } = req.body;
      
      const movement = await storage.createWarehouseMovement({
        warehouseId: req.params.warehouseId,
        productId,
        movementType,
        quantity,
        referenceType,
        referenceId,
        notes,
        createdBy: req.user.id,
      });
      
      const quantityDelta = ['carico', 'trasferimento_in'].includes(movementType) ? quantity : -quantity;
      await storage.updateWarehouseStockQuantity(req.params.warehouseId, productId, quantityDelta);
      res.status(201).json(movement);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/warehouse-stock/:stockId", requireAuth, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ error: "Non autenticato" });
      const { minStock, location } = req.body;
      const updated = await storage.updateWarehouseStock(req.params.stockId, { minStock, location });
      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/warehouse-transfers", requireAuth, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ error: "Non autenticato" });
      const filters: any = {};
      if (req.query.status) filters.status = req.query.status;
      if (req.query.sourceWarehouseId) filters.sourceWarehouseId = req.query.sourceWarehouseId;
      if (req.query.destinationWarehouseId) filters.destinationWarehouseId = req.query.destinationWarehouseId;
      
      const transfers = await storage.listWarehouseTransfers(filters);
      const enrichedTransfers = await Promise.all(transfers.map(async (t) => {
        const source = await storage.getWarehouse(t.sourceWarehouseId);
        const dest = await storage.getWarehouse(t.destinationWarehouseId);
        const requestedBy = await storage.getUser(t.requestedBy);
        const items = await storage.listWarehouseTransferItems(t.id);
        return {
          ...t,
          sourceWarehouse: source ? { id: source.id, name: source.name } : null,
          destinationWarehouse: dest ? { id: dest.id, name: dest.name } : null,
          requestedByUser: requestedBy ? { id: requestedBy.id, fullName: requestedBy.fullName } : null,
          itemCount: items.length,
        };
      }));
      res.json(enrichedTransfers);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/warehouse-transfers/:id", requireAuth, async (req, res) => {
    try {
      const transfer = await storage.getWarehouseTransfer(req.params.id);
      if (!transfer) return res.status(404).json({ error: "Trasferimento non trovato" });
      
      const items = await storage.listWarehouseTransferItems(transfer.id);
      const enrichedItems = await Promise.all(items.map(async (item) => {
        const product = await storage.getProduct(item.productId);
        return { ...item, product: product ? { id: product.id, name: product.name, sku: product.sku } : null };
      }));
      
      const source = await storage.getWarehouse(transfer.sourceWarehouseId);
      const dest = await storage.getWarehouse(transfer.destinationWarehouseId);
      res.json({ ...transfer, sourceWarehouse: source, destinationWarehouse: dest, items: enrichedItems });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/warehouse-transfers", requireAuth, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ error: "Non autenticato" });
      const { sourceWarehouseId, destinationWarehouseId, notes, items } = req.body;
      
      const transfer = await storage.createWarehouseTransfer({
        sourceWarehouseId,
        destinationWarehouseId,
        requestedBy: req.user.id,
        status: 'pending',
        notes,
      });
      
      if (items && Array.isArray(items)) {
        for (const item of items) {
          await storage.createWarehouseTransferItem({
            transferId: transfer.id,
            productId: item.productId,
            requestedQuantity: item.quantity,
          });
        }
      }
      res.status(201).json(transfer);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/warehouse-transfers/:id", requireAuth, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ error: "Non autenticato" });
      const transfer = await storage.getWarehouseTransfer(req.params.id);
      if (!transfer) return res.status(404).json({ error: "Trasferimento non trovato" });
      
      const { status, items } = req.body;
      const updates: any = { ...req.body };
      
      if (status === 'approved') {
        updates.approvedBy = req.user.id;
        updates.approvedAt = new Date();
      } else if (status === 'shipped' && items) {
        updates.shippedAt = new Date();
        for (const item of items) {
          await storage.updateWarehouseTransferItem(item.id, { shippedQuantity: item.shippedQuantity });
          await storage.updateWarehouseStockQuantity(transfer.sourceWarehouseId, item.productId, -item.shippedQuantity);
          await storage.createWarehouseMovement({
            warehouseId: transfer.sourceWarehouseId,
            productId: item.productId,
            movementType: 'trasferimento_out',
            quantity: item.shippedQuantity,
            referenceType: 'trasferimento',
            referenceId: transfer.id,
            createdBy: req.user.id,
          });
        }
      } else if (status === 'received' && items) {
        updates.receivedAt = new Date();
        for (const item of items) {
          await storage.updateWarehouseTransferItem(item.id, { receivedQuantity: item.receivedQuantity });
          await storage.updateWarehouseStockQuantity(transfer.destinationWarehouseId, item.productId, item.receivedQuantity);
          await storage.createWarehouseMovement({
            warehouseId: transfer.destinationWarehouseId,
            productId: item.productId,
            movementType: 'trasferimento_in',
            quantity: item.receivedQuantity,
            referenceType: 'trasferimento',
            referenceId: transfer.id,
            createdBy: req.user.id,
          });
        }
      }
      
      const updated = await storage.updateWarehouseTransfer(req.params.id, updates);
      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ==========================================
  // B2B RESELLER PURCHASE ORDERS
  // ==========================================

  // Reseller: Get admin catalog (products with stock available for B2B purchase)
  app.get("/api/reseller/b2b-catalog", requireRole("reseller"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ error: "Non autenticato" });
      const catalog = await storage.getAdminCatalogForReseller(req.user.id);
      res.json(catalog);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Reseller: List own B2B orders
  app.get("/api/reseller/b2b-orders", requireRole("reseller"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ error: "Non autenticato" });
      const orders = await storage.listResellerPurchaseOrders({ resellerId: req.user.id });
      
      // Enrich orders with items, product info, and returns
      const enrichedOrders = await Promise.all(orders.map(async (order) => {
        const items = await storage.listResellerPurchaseOrderItems(order.id);
        const enrichedItems = await Promise.all(items.map(async (item) => {
          const product = await storage.getProduct(item.productId);
          return { ...item, product };
        }));
        // Get returns associated with this order
        const returns = await storage.listB2bReturns({ orderId: order.id });
        return { ...order, items: enrichedItems, returns };
      }));
      
      res.json(enrichedOrders);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Reseller: Get single B2B order with items
  app.get("/api/reseller/b2b-orders/:id", requireRole("reseller"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ error: "Non autenticato" });
      const order = await storage.getResellerPurchaseOrder(req.params.id);
      if (!order) return res.status(404).json({ error: "Ordine non trovato" });
      if (order.resellerId !== req.user.id) return res.status(403).json({ error: "Accesso negato" });
      
      const items = await storage.listResellerPurchaseOrderItems(order.id);
      
      // Enrich items with product info
      const enrichedItems = await Promise.all(items.map(async (item) => {
        const product = await storage.getProduct(item.productId);
        return { ...item, product };
      }));
      
      // Get returns associated with this order
      const returns = await storage.listB2bReturns({ orderId: order.id });
      
      res.json({ ...order, items: enrichedItems, returns });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Reseller: Create B2B order
  app.post("/api/reseller/b2b-orders", requireRole("reseller"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ error: "Non autenticato" });
      const { items, paymentMethod, notes, shippingAddress } = req.body;
      
      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: "L'ordine deve contenere almeno un prodotto" });
      }
      
      // Get catalog to verify products and prices
      const catalog = await storage.getAdminCatalogForReseller(req.user.id);
      const catalogMap = new Map(catalog.map(c => [c.product.id, c]));
      
      let totalCents = 0;
      const orderItems: Array<{ productId: string; quantity: number; unitPriceCents: number; productName: string }> = [];
      
      for (const item of items) {
        const catalogItem = catalogMap.get(item.productId);
        if (!catalogItem) {
          return res.status(400).json({ error: `Prodotto ${item.productId} non disponibile nel catalogo` });
        }
        if (item.quantity > catalogItem.adminStock) {
          return res.status(400).json({ error: `Stock insufficiente per ${catalogItem.product.name}: disponibili ${catalogItem.adminStock}` });
        }
        if (item.quantity < catalogItem.minimumOrderQuantity) {
          return res.status(400).json({ error: `Quantità minima per ${catalogItem.product.name}: ${catalogItem.minimumOrderQuantity}` });
        }
        
        const lineTotalCents = catalogItem.b2bPrice * item.quantity;
        totalCents += lineTotalCents;
        orderItems.push({
          productId: item.productId,
          quantity: item.quantity,
          unitPriceCents: catalogItem.b2bPrice,
          productName: catalogItem.product.name,
        });
      }
      
      // Create order
      const order = await storage.createResellerPurchaseOrder({
        resellerId: req.user.id,
        status: 'pending',
        subtotal: totalCents,
        total: totalCents,
        paymentMethod: paymentMethod || 'bank_transfer',
        resellerNotes: notes,
      });
      
      // Create order items
      for (const item of orderItems) {
        await storage.createResellerPurchaseOrderItem({
          orderId: order.id,
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPriceCents,
          totalPrice: item.unitPriceCents * item.quantity,
          productName: item.productName,
        });
      }
      
      const createdItems = await storage.listResellerPurchaseOrderItems(order.id);
      res.status(201).json({ ...order, items: createdItems });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Admin: List all B2B orders from resellers
  app.get("/api/admin/b2b-orders", requireRole("admin"), async (req, res) => {
    try {
      const status = req.query.status as string | undefined;
      const orders = await storage.listResellerPurchaseOrders(status ? { status } : undefined);
      
      // Enrich orders with reseller info and items with product info
      const enrichedOrders = await Promise.all(orders.map(async (order) => {
        const [reseller, items] = await Promise.all([
          storage.getUser(order.resellerId),
          storage.listResellerPurchaseOrderItems(order.id)
        ]);
        const enrichedItems = await Promise.all(items.map(async (item) => {
          const product = await storage.getProduct(item.productId);
          return { ...item, product };
        }));
        return { ...order, reseller: reseller ? { id: reseller.id, fullName: reseller.fullName, email: reseller.email } : null, items: enrichedItems };
      }));
      
      res.json(enrichedOrders);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Admin: Get single B2B order with full details
  app.get("/api/admin/b2b-orders/:id", requireRole("admin"), async (req, res) => {
    try {
      const order = await storage.getResellerPurchaseOrder(req.params.id);
      if (!order) return res.status(404).json({ error: "Ordine non trovato" });
      
      const [reseller, items] = await Promise.all([
        storage.getUser(order.resellerId),
        storage.listResellerPurchaseOrderItems(order.id)
      ]);
      
      // Enrich items with product info
      const enrichedItems = await Promise.all(items.map(async (item) => {
        const product = await storage.getProduct(item.productId);
        return { ...item, product };
      }));
      
      res.json({ 
        ...order, 
        reseller: reseller ? { id: reseller.id, fullName: reseller.fullName, email: reseller.email } : null, 
        items: enrichedItems 
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Admin: Approve B2B order (transfers stock from admin warehouse to reseller warehouse)
  app.post("/api/admin/b2b-orders/:id/approve", requireRole("admin"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ error: "Non autenticato" });
      
      const order = await storage.getResellerPurchaseOrder(req.params.id);
      if (!order) return res.status(404).json({ error: "Ordine non trovato" });
      if (order.status !== 'pending') {
        return res.status(400).json({ error: `Impossibile approvare un ordine con stato ${order.status}` });
      }
      
      const items = await storage.listResellerPurchaseOrderItems(order.id);
      
      // Get admin warehouse (owner_id is 'system' for the central admin warehouse)
      const adminWarehouse = await storage.getWarehouseByOwner('admin', 'system');
      if (!adminWarehouse) {
        return res.status(500).json({ error: "Magazzino admin non trovato" });
      }
      
      // Get or create reseller warehouse
      const reseller = await storage.getUser(order.resellerId);
      if (!reseller) return res.status(404).json({ error: "Reseller non trovato" });
      const resellerWarehouse = await storage.ensureDefaultWarehouse('reseller', order.resellerId, reseller.fullName || 'Reseller');
      
      // Verify stock availability and transfer
      for (const item of items) {
        const stockItem = await storage.getWarehouseStockItem(adminWarehouse.id, item.productId);
        if (!stockItem || stockItem.quantity < item.quantity) {
          return res.status(400).json({ 
            error: `Stock insufficiente per prodotto ${item.productName}: disponibili ${stockItem?.quantity || 0}, richiesti ${item.quantity}` 
          });
        }
      }
      
      // Execute stock transfer
      for (const item of items) {
        // Decrement admin warehouse stock (trasferimento_out = uscita verso reseller)
        await storage.updateWarehouseStockQuantity(adminWarehouse.id, item.productId, -item.quantity);
        await storage.createWarehouseMovement({
          warehouseId: adminWarehouse.id,
          productId: item.productId,
          movementType: 'trasferimento_out',
          quantity: item.quantity,
          referenceType: 'ordine_b2b',
          referenceId: order.id,
          notes: `Ordine B2B ${order.orderNumber} → ${resellerWarehouse.name}`,
          createdBy: req.user.id,
        });
        
        // Increment reseller warehouse stock (trasferimento_in = ingresso da admin)
        await storage.updateWarehouseStockQuantity(resellerWarehouse.id, item.productId, item.quantity);
        await storage.createWarehouseMovement({
          warehouseId: resellerWarehouse.id,
          productId: item.productId,
          movementType: 'trasferimento_in',
          quantity: item.quantity,
          referenceType: 'ordine_b2b',
          referenceId: order.id,
          notes: `Ordine B2B ${order.orderNumber} ← ${adminWarehouse.name}`,
          createdBy: req.user.id,
        });
      }
      
      // Update order status
      const updated = await storage.updateResellerPurchaseOrder(order.id, {
        status: 'approved',
        approvedAt: new Date(),
        approvedBy: req.user.id,
      });
      
      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Admin: Confirm B2B order payment (bank transfer received)
  const confirmB2BPaymentSchema = z.object({
    transactionReference: z.string().optional(),
    notes: z.string().optional()
  });
  
  app.post("/api/admin/b2b-orders/:id/confirm-payment", requireRole("admin"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ error: "Non autenticato" });
      
      // Validate request body
      const parseResult = confirmB2BPaymentSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ error: "Dati non validi", details: parseResult.error.errors });
      }
      const { transactionReference, notes } = parseResult.data;
      
      const order = await storage.getResellerPurchaseOrder(req.params.id);
      if (!order) return res.status(404).json({ error: "Ordine non trovato" });
      
      // Double-check: if paymentConfirmedAt is already set, reject (idempotency guard)
      if (order.paymentConfirmedAt) {
        return res.status(400).json({ error: "Pagamento già confermato" });
      }
      
      // Check for existing payment record to prevent duplicates (efficient DB query)
      const existingB2BPayment = await storage.getPaymentByOrderId(order.id, 'b2b');
      if (existingB2BPayment) {
        return res.status(400).json({ error: "Esiste già un pagamento per questo ordine B2B" });
      }
      
      // Get reseller info
      const reseller = await storage.getUser(order.resellerId);
      
      // Create payment record using storage interface
      const payment = await storage.createSalesOrderPayment({
        orderId: order.id,
        orderType: 'b2b',
        orderNumber: order.orderNumber,
        method: (order.paymentMethod as any) || 'bank_transfer',
        status: 'completed',
        amount: order.total,
        currency: 'EUR',
        paidAt: new Date(),
        gatewayReference: transactionReference || null,
        notes: notes || `Bonifico ricevuto per ordine B2B ${order.orderNumber}`,
        confirmedBy: req.user.id,
        resellerId: order.resellerId,
        resellerName: reseller?.fullName || reseller?.ragioneSociale || 'N/A',
      });
      
      // Update order payment confirmation
      const updated = await storage.updateResellerPurchaseOrder(order.id, {
        paymentConfirmedAt: new Date(),
      });
      
      res.json({ ...updated, paymentId: payment.id });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Admin: Reject B2B order
  app.post("/api/admin/b2b-orders/:id/reject", requireRole("admin"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ error: "Non autenticato" });
      
      const order = await storage.getResellerPurchaseOrder(req.params.id);
      if (!order) return res.status(404).json({ error: "Ordine non trovato" });
      if (order.status !== 'pending') {
        return res.status(400).json({ error: `Impossibile rifiutare un ordine con stato ${order.status}` });
      }
      
      const { reason } = req.body;
      
      const updated = await storage.updateResellerPurchaseOrder(order.id, {
        status: 'cancelled',
        notes: order.notes ? `${order.notes}\n\nRIFIUTATO: ${reason || 'Nessun motivo specificato'}` : `RIFIUTATO: ${reason || 'Nessun motivo specificato'}`,
      });
      
      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Admin: Mark B2B order as shipped
  app.post("/api/admin/b2b-orders/:id/ship", requireRole("admin"), async (req, res) => {
    try {
      const order = await storage.getResellerPurchaseOrder(req.params.id);
      if (!order) return res.status(404).json({ error: "Ordine non trovato" });
      if (order.status !== 'approved') {
        return res.status(400).json({ error: `Impossibile spedire un ordine con stato ${order.status}` });
      }
      
      const { trackingNumber, carrier } = req.body;
      
      const updated = await storage.updateResellerPurchaseOrder(order.id, {
        status: 'shipped',
        shippedAt: new Date(),
        trackingNumber,
        carrier,
      });
      
      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Reseller: Confirm receipt of B2B order
  app.post("/api/reseller/b2b-orders/:id/receive", requireRole("reseller"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ error: "Non autenticato" });
      
      const order = await storage.getResellerPurchaseOrder(req.params.id);
      if (!order) return res.status(404).json({ error: "Ordine non trovato" });
      if (order.resellerId !== req.user.id) return res.status(403).json({ error: "Accesso negato" });
      if (order.status !== 'shipped') {
        return res.status(400).json({ error: `Impossibile confermare ricezione per un ordine con stato ${order.status}` });
      }
      
      const updated = await storage.updateResellerPurchaseOrder(order.id, {
        status: 'received',
        receivedAt: new Date(),
      });
      
      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ==========================================
  // B2B RETURNS - Resi ordini B2B
  // ==========================================

  // Reseller: List my B2B returns
  app.get("/api/reseller/b2b-returns", requireRole("reseller"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ error: "Non autenticato" });
      const returns = await storage.listB2bReturns({ resellerId: req.user.id });
      res.json(returns);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Reseller: Get B2B return details with items
  app.get("/api/reseller/b2b-returns/:id", requireRole("reseller"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ error: "Non autenticato" });
      const returnDoc = await storage.getB2bReturn(req.params.id);
      if (!returnDoc) return res.status(404).json({ error: "Reso non trovato" });
      if (returnDoc.resellerId !== req.user.id) return res.status(403).json({ error: "Accesso negato" });
      
      const items = await storage.listB2bReturnItems(returnDoc.id);
      res.json({ ...returnDoc, items });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Reseller: Create B2B return request
  app.post("/api/reseller/b2b-returns", requireRole("reseller"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ error: "Non autenticato" });
      
      const { orderId, reason, reasonDetails, resellerNotes, items } = req.body;
      
      // Validate order exists and belongs to reseller
      const order = await storage.getResellerPurchaseOrder(orderId);
      if (!order) return res.status(404).json({ error: "Ordine non trovato" });
      if (order.resellerId !== req.user.id) return res.status(403).json({ error: "Accesso negato" });
      if (order.status !== 'received') {
        return res.status(400).json({ error: "Puoi richiedere un reso solo per ordini ricevuti" });
      }
      
      // Generate return number
      const returnNumber = await storage.generateB2bReturnNumber();
      
      // Calculate total amount
      let totalAmount = 0;
      for (const item of items) {
        totalAmount += item.quantity * item.unitPrice;
      }
      
      // Create return
      const returnDoc = await storage.createB2bReturn({
        returnNumber,
        orderId,
        resellerId: req.user.id,
        reason,
        reasonDetails,
        resellerNotes,
        totalAmount,
        status: 'requested',
      });
      
      // Create return items
      for (const item of items) {
        await storage.createB2bReturnItem({
          returnId: returnDoc.id,
          orderItemId: item.orderItemId,
          productId: item.productId,
          productName: item.productName,
          productSku: item.productSku,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.quantity * item.unitPrice,
          reason: item.reason,
        });
      }
      
      const returnItems = await storage.listB2bReturnItems(returnDoc.id);
      res.status(201).json({ ...returnDoc, items: returnItems });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Reseller: Ship B2B return
  app.post("/api/reseller/b2b-returns/:id/ship", requireRole("reseller"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ error: "Non autenticato" });
      
      const returnDoc = await storage.getB2bReturn(req.params.id);
      if (!returnDoc) return res.status(404).json({ error: "Reso non trovato" });
      if (returnDoc.resellerId !== req.user.id) return res.status(403).json({ error: "Accesso negato" });
      if (returnDoc.status !== 'approved' && returnDoc.status !== 'awaiting_shipment') {
        return res.status(400).json({ error: `Impossibile spedire un reso con stato ${returnDoc.status}` });
      }
      
      const { trackingNumber, carrier } = req.body;
      
      const updated = await storage.updateB2bReturn(returnDoc.id, {
        status: 'shipped',
        shippedAt: new Date(),
        trackingNumber,
        carrier,
      });
      
      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Admin: List all B2B returns
  app.get("/api/admin/b2b-returns", requireRole("admin"), async (req, res) => {
    try {
      const { status, resellerId } = req.query;
      const returns = await storage.listB2bReturns({
        status: status as string | undefined,
        resellerId: resellerId as string | undefined,
      });
      res.json(returns);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Admin: Get B2B return details with items
  app.get("/api/admin/b2b-returns/:id", requireRole("admin"), async (req, res) => {
    try {
      const returnDoc = await storage.getB2bReturn(req.params.id);
      if (!returnDoc) return res.status(404).json({ error: "Reso non trovato" });
      
      const items = await storage.listB2bReturnItems(returnDoc.id);
      
      // Enrich with product images
      const enrichedItems = [];
      for (const item of items) {
        const product = await storage.getProduct(item.productId);
        enrichedItems.push({
          ...item,
          product,
        });
      }
      
      // Get reseller info
      const reseller = await storage.getUser(returnDoc.resellerId);
      
      // Get order info
      const order = await storage.getResellerPurchaseOrder(returnDoc.orderId);
      
      res.json({ ...returnDoc, items: enrichedItems, reseller, order });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Admin: Approve B2B return
  app.post("/api/admin/b2b-returns/:id/approve", requireRole("admin"), async (req, res) => {
    try {
      const returnDoc = await storage.getB2bReturn(req.params.id);
      if (!returnDoc) return res.status(404).json({ error: "Reso non trovato" });
      if (returnDoc.status !== 'requested') {
        return res.status(400).json({ error: `Impossibile approvare un reso con stato ${returnDoc.status}` });
      }
      
      const { adminNotes } = req.body;
      
      // Get reseller and items for document generation
      const reseller = await storage.getUser(returnDoc.resellerId);
      const items = await storage.listB2bReturnItems(returnDoc.id);
      
      if (!reseller) {
        return res.status(400).json({ error: "Rivenditore non trovato" });
      }
      
      // Generate shipping label and DDT
      let labelPath: string | undefined;
      let ddtPath: string | undefined;
      let documentsGeneratedAt: Date | undefined;
      
      try {
        const docs = await generateAndStoreReturnDocuments({
          returnData: returnDoc,
          items,
          reseller,
          adminAddress: {
            companyName: "MonkeyPlan S.r.l.",
            address: "Via Roma 123",
            city: "Milano",
            postalCode: "20100",
            province: "MI",
            country: "Italia",
            phone: "+39 02 1234567",
            email: "resi@monkeyplan.it",
          },
        });
        labelPath = docs.labelPath;
        ddtPath = docs.ddtPath;
        documentsGeneratedAt = new Date();
      } catch (docError: any) {
        console.error("Error generating return documents:", docError);
        // Continue without documents - they can be regenerated later
      }
      
      const updated = await storage.updateB2bReturn(returnDoc.id, {
        status: 'awaiting_shipment',
        approvedAt: new Date(),
        adminNotes,
        shippingLabelPath: labelPath,
        ddtPath: ddtPath,
        documentsGeneratedAt,
      });
      
      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Admin: Reject B2B return
  app.post("/api/admin/b2b-returns/:id/reject", requireRole("admin"), async (req, res) => {
    try {
      const returnDoc = await storage.getB2bReturn(req.params.id);
      if (!returnDoc) return res.status(404).json({ error: "Reso non trovato" });
      if (returnDoc.status !== 'requested') {
        return res.status(400).json({ error: `Impossibile rifiutare un reso con stato ${returnDoc.status}` });
      }
      
      const { rejectionReason, adminNotes } = req.body;
      
      const updated = await storage.updateB2bReturn(returnDoc.id, {
        status: 'rejected',
        rejectedAt: new Date(),
        rejectionReason,
        adminNotes,
      });
      
      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Admin: Receive B2B return and restore stock
  app.post("/api/admin/b2b-returns/:id/receive", requireRole("admin"), async (req, res) => {
    try {
      const returnDoc = await storage.getB2bReturn(req.params.id);
      if (!returnDoc) return res.status(404).json({ error: "Reso non trovato" });
      if (returnDoc.status !== 'shipped') {
        return res.status(400).json({ error: `Impossibile confermare ricezione per un reso con stato ${returnDoc.status}` });
      }
      
      const { inspectionNotes, creditAmount } = req.body;
      
      // Get return items
      const items = await storage.listB2bReturnItems(returnDoc.id);
      
      // Get admin warehouse
      const adminWarehouse = await storage.getWarehouseByOwner('admin', 'system');
      if (!adminWarehouse) {
        return res.status(400).json({ error: "Magazzino admin non trovato" });
      }
      
      // Get reseller warehouse
      const resellerWarehouse = await storage.getWarehouseByOwner('reseller', returnDoc.resellerId);
      
      // Restore stock to admin warehouse and remove from reseller
      for (const item of items) {
        // Add to admin warehouse
        await storage.updateWarehouseStockQuantity(adminWarehouse.id, item.productId, item.quantity);
        await storage.createWarehouseMovement({
          warehouseId: adminWarehouse.id,
          productId: item.productId,
          quantity: item.quantity,
          movementType: 'trasferimento_in',
          notes: `Reso B2B ${returnDoc.returnNumber} - Rientro da ${returnDoc.resellerId}`,
        });
        
        // Remove from reseller warehouse if exists
        if (resellerWarehouse) {
          await storage.updateWarehouseStockQuantity(resellerWarehouse.id, item.productId, -item.quantity);
          await storage.createWarehouseMovement({
            warehouseId: resellerWarehouse.id,
            productId: item.productId,
            quantity: -item.quantity,
            movementType: 'trasferimento_out',
            notes: `Reso B2B ${returnDoc.returnNumber} - Invio ad Admin`,
          });
        }
        
        // Mark item as restocked
        await storage.updateB2bReturnItem(item.id, {
          restocked: true,
          restockedAt: new Date(),
          restockedQuantity: item.quantity,
        });
      }
      
      const updated = await storage.updateB2bReturn(returnDoc.id, {
        status: 'completed',
        receivedAt: new Date(),
        completedAt: new Date(),
        inspectionNotes,
        creditAmount: creditAmount ?? returnDoc.totalAmount,
      });
      
      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Reseller: Download shipping label (proxy)
  app.get("/api/reseller/b2b-returns/:id/label", requireRole("reseller"), async (req, res) => {
    try {
      const returnDoc = await storage.getB2bReturn(req.params.id);
      if (!returnDoc) return res.status(404).json({ error: "Reso non trovato" });
      
      if (returnDoc.resellerId !== req.user?.id) {
        return res.status(403).json({ error: "Accesso non autorizzato" });
      }
      
      if (!returnDoc.shippingLabelPath) {
        return res.status(404).json({ error: "Etichetta non ancora generata" });
      }
      
      const { bucketName, objectName } = parseObjectPath(returnDoc.shippingLabelPath);
      const file = objectStorageClient.bucket(bucketName).file(objectName);
      
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="etichetta_${returnDoc.returnNumber}.pdf"`);
      
      file.createReadStream().pipe(res);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Reseller: Download DDT (proxy)
  app.get("/api/reseller/b2b-returns/:id/ddt", requireRole("reseller"), async (req, res) => {
    try {
      const returnDoc = await storage.getB2bReturn(req.params.id);
      if (!returnDoc) return res.status(404).json({ error: "Reso non trovato" });
      
      if (returnDoc.resellerId !== req.user?.id) {
        return res.status(403).json({ error: "Accesso non autorizzato" });
      }
      
      if (!returnDoc.ddtPath) {
        return res.status(404).json({ error: "DDT non ancora generato" });
      }
      
      const { bucketName, objectName } = parseObjectPath(returnDoc.ddtPath);
      const file = objectStorageClient.bucket(bucketName).file(objectName);
      
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="ddt_${returnDoc.returnNumber}.pdf"`);
      
      file.createReadStream().pipe(res);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Admin: Download shipping label (proxy)
  app.get("/api/admin/b2b-returns/:id/label", requireRole("admin"), async (req, res) => {
    try {
      const returnDoc = await storage.getB2bReturn(req.params.id);
      if (!returnDoc) return res.status(404).json({ error: "Reso non trovato" });
      
      if (!returnDoc.shippingLabelPath) {
        return res.status(404).json({ error: "Etichetta non ancora generata" });
      }
      
      const { bucketName, objectName } = parseObjectPath(returnDoc.shippingLabelPath);
      const file = objectStorageClient.bucket(bucketName).file(objectName);
      
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="etichetta_${returnDoc.returnNumber}.pdf"`);
      
      file.createReadStream().pipe(res);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Admin: Download DDT (proxy)
  app.get("/api/admin/b2b-returns/:id/ddt", requireRole("admin"), async (req, res) => {
    try {
      const returnDoc = await storage.getB2bReturn(req.params.id);
      if (!returnDoc) return res.status(404).json({ error: "Reso non trovato" });
      
      if (!returnDoc.ddtPath) {
        return res.status(404).json({ error: "DDT non ancora generato" });
      }
      
      const { bucketName, objectName } = parseObjectPath(returnDoc.ddtPath);
      const file = objectStorageClient.bucket(bucketName).file(objectName);
      
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="ddt_${returnDoc.returnNumber}.pdf"`);
      
      file.createReadStream().pipe(res);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Admin: Regenerate documents for a return
  app.post("/api/admin/b2b-returns/:id/regenerate-documents", requireRole("admin"), async (req, res) => {
    try {
      const returnDoc = await storage.getB2bReturn(req.params.id);
      if (!returnDoc) return res.status(404).json({ error: "Reso non trovato" });
      
      if (!['approved', 'awaiting_shipment', 'shipped', 'received', 'inspecting', 'completed'].includes(returnDoc.status)) {
        return res.status(400).json({ error: "Documenti disponibili solo per resi approvati" });
      }
      
      const reseller = await storage.getUser(returnDoc.resellerId);
      const items = await storage.listB2bReturnItems(returnDoc.id);
      
      if (!reseller) {
        return res.status(400).json({ error: "Rivenditore non trovato" });
      }
      
      const docs = await generateAndStoreReturnDocuments({
        returnData: returnDoc,
        items,
        reseller,
        adminAddress: {
          companyName: "MonkeyPlan S.r.l.",
          address: "Via Roma 123",
          city: "Milano",
          postalCode: "20100",
          province: "MI",
          country: "Italia",
          phone: "+39 02 1234567",
          email: "resi@monkeyplan.it",
        },
      });
      
      const updated = await storage.updateB2bReturn(returnDoc.id, {
        shippingLabelPath: docs.labelPath,
        ddtPath: docs.ddtPath,
        documentsGeneratedAt: new Date(),
      });
      
      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ==========================================
  // B2B REPAIR CENTER PURCHASE ORDERS
  // ==========================================

  // Repair Center: Get reseller catalog (products with stock available for B2B purchase)
  app.get("/api/repair-center/b2b-catalog", requireRole("repair_center"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ error: "Non autenticato" });
      
      // Get repair center to find the owning reseller
      const repairCenter = await storage.getRepairCenter(req.user.repairCenterId!);
      if (!repairCenter) {
        return res.status(404).json({ error: "Centro riparazione non trovato" });
      }
      if (!repairCenter.resellerId) {
        return res.status(400).json({ error: "Centro riparazione non associato a un rivenditore" });
      }
      
      // Get reseller's warehouse stock with products assigned to repair centers
      const resellerWarehouse = await storage.ensureDefaultWarehouse('reseller', repairCenter.resellerId, 'Reseller');
      const stock = await storage.listWarehouseStock(resellerWarehouse.id);
      
      // Build catalog from reseller stock
      const catalog = await Promise.all(stock.filter(s => s.quantity > 0).map(async (s) => {
        const product = await storage.getProduct(s.productId);
        if (!product || !product.isActive) return null;
        
        // Get B2B price for repair centers (use costPrice or 80% of unitPrice)
        const b2bPrice = product.costPrice || Math.round((product.unitPrice || 0) * 0.8);
        
        return {
          product,
          resellerStock: s.quantity,
          b2bPrice,
          minimumOrderQuantity: 1,
        };
      }));
      
      res.json(catalog.filter(Boolean));
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Repair Center: List own B2B orders
  app.get("/api/repair-center/b2b-orders", requireRole("repair_center"), async (req, res) => {
    try {
      if (!req.user || !req.user.repairCenterId) {
        return res.status(401).json({ error: "Non autenticato o centro riparazione non configurato" });
      }
      
      const orders = await storage.listRepairCenterPurchaseOrders({ repairCenterId: req.user.repairCenterId });
      
      // Enrich orders with items and product info
      const enrichedOrders = await Promise.all(orders.map(async (order) => {
        const items = await storage.listRepairCenterPurchaseOrderItems(order.id);
        const enrichedItems = await Promise.all(items.map(async (item) => {
          const product = await storage.getProduct(item.productId);
          return { ...item, product };
        }));
        return { ...order, items: enrichedItems };
      }));
      
      res.json(enrichedOrders);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Repair Center: Get single B2B order with items
  app.get("/api/repair-center/b2b-orders/:id", requireRole("repair_center"), async (req, res) => {
    try {
      if (!req.user || !req.user.repairCenterId) {
        return res.status(401).json({ error: "Non autenticato" });
      }
      
      const order = await storage.getRepairCenterPurchaseOrder(req.params.id);
      if (!order) return res.status(404).json({ error: "Ordine non trovato" });
      if (order.repairCenterId !== req.user.repairCenterId) {
        return res.status(403).json({ error: "Accesso negato" });
      }
      
      const items = await storage.listRepairCenterPurchaseOrderItems(order.id);
      const enrichedItems = await Promise.all(items.map(async (item) => {
        const product = await storage.getProduct(item.productId);
        return { ...item, product };
      }));
      
      res.json({ ...order, items: enrichedItems });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Repair Center: Create B2B order (purchase from reseller)
  app.post("/api/repair-center/b2b-orders", requireRole("repair_center"), async (req, res) => {
    try {
      if (!req.user || !req.user.repairCenterId) {
        return res.status(401).json({ error: "Non autenticato" });
      }
      
      const { items, paymentMethod, notes } = req.body;
      
      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: "L'ordine deve contenere almeno un prodotto" });
      }
      
      // Get repair center to find reseller
      const repairCenter = await storage.getRepairCenter(req.user.repairCenterId);
      if (!repairCenter || !repairCenter.resellerId) {
        return res.status(400).json({ error: "Centro riparazione non associato a un rivenditore" });
      }
      
      // Get reseller warehouse stock
      const resellerWarehouse = await storage.ensureDefaultWarehouse('reseller', repairCenter.resellerId, 'Reseller');
      const stock = await storage.listWarehouseStock(resellerWarehouse.id);
      const stockMap = new Map(stock.map(s => [s.productId, s.quantity]));
      
      let totalCents = 0;
      const orderItems: Array<{ productId: string; quantity: number; unitPriceCents: number; productName: string }> = [];
      
      for (const item of items) {
        const product = await storage.getProduct(item.productId);
        if (!product || !product.isActive) {
          return res.status(400).json({ error: `Prodotto ${item.productId} non disponibile` });
        }
        
        const availableStock = stockMap.get(item.productId) || 0;
        if (item.quantity > availableStock) {
          return res.status(400).json({ error: `Stock insufficiente per ${product.name}: disponibili ${availableStock}` });
        }
        
        const b2bPrice = product.costPrice || Math.round((product.unitPrice || 0) * 0.8);
        const lineTotalCents = b2bPrice * item.quantity;
        totalCents += lineTotalCents;
        
        orderItems.push({
          productId: item.productId,
          quantity: item.quantity,
          unitPriceCents: b2bPrice,
          productName: product.name,
        });
      }
      
      // Create order
      const order = await storage.createRepairCenterPurchaseOrder({
        repairCenterId: req.user.repairCenterId,
        resellerId: repairCenter.resellerId,
        status: 'pending',
        subtotal: totalCents,
        total: totalCents,
        paymentMethod: paymentMethod || 'bank_transfer',
        notes,
      });
      
      // Create order items
      for (const item of orderItems) {
        await storage.createRepairCenterPurchaseOrderItem({
          orderId: order.id,
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPriceCents,
          totalPrice: item.unitPriceCents * item.quantity,
          productName: item.productName,
        });
      }
      
      const createdItems = await storage.listRepairCenterPurchaseOrderItems(order.id);
      res.status(201).json({ ...order, items: createdItems });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Repair Center: Confirm receipt of B2B order
  app.post("/api/repair-center/b2b-orders/:id/receive", requireRole("repair_center"), async (req, res) => {
    try {
      if (!req.user || !req.user.repairCenterId) {
        return res.status(401).json({ error: "Non autenticato" });
      }
      
      const order = await storage.getRepairCenterPurchaseOrder(req.params.id);
      if (!order) return res.status(404).json({ error: "Ordine non trovato" });
      if (order.repairCenterId !== req.user.repairCenterId) {
        return res.status(403).json({ error: "Accesso negato" });
      }
      if (order.status !== 'shipped') {
        return res.status(400).json({ error: "Solo ordini spediti possono essere confermati come ricevuti" });
      }
      
      const updated = await storage.updateRepairCenterPurchaseOrder(order.id, {
        status: 'delivered',
        deliveredAt: new Date(),
      });
      
      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Reseller: List B2B orders from repair centers
  app.get("/api/reseller/rc-b2b-orders", requireRole("reseller"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ error: "Non autenticato" });
      
      const status = req.query.status as string | undefined;
      const orders = await storage.listRepairCenterPurchaseOrders({ 
        resellerId: req.user.id,
        ...(status && { status })
      });
      
      // Enrich orders with repair center info and items
      const enrichedOrders = await Promise.all(orders.map(async (order) => {
        const [repairCenter, items] = await Promise.all([
          storage.getRepairCenter(order.repairCenterId),
          storage.listRepairCenterPurchaseOrderItems(order.id)
        ]);
        const enrichedItems = await Promise.all(items.map(async (item) => {
          const product = await storage.getProduct(item.productId);
          return { ...item, product };
        }));
        return { 
          ...order, 
          repairCenter: repairCenter ? { id: repairCenter.id, name: repairCenter.name } : null, 
          items: enrichedItems 
        };
      }));
      
      res.json(enrichedOrders);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Reseller: Approve repair center B2B order
  app.post("/api/reseller/rc-b2b-orders/:id/approve", requireRole("reseller"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ error: "Non autenticato" });
      
      const order = await storage.getRepairCenterPurchaseOrder(req.params.id);
      if (!order) return res.status(404).json({ error: "Ordine non trovato" });
      if (order.resellerId !== req.user.id) {
        return res.status(403).json({ error: "Accesso negato" });
      }
      if (order.status !== 'pending') {
        return res.status(400).json({ error: "Solo ordini in attesa possono essere approvati" });
      }
      
      // Get warehouses
      const resellerWarehouse = await storage.ensureDefaultWarehouse('reseller', req.user.id, req.user.fullName || req.user.username);
      const rcWarehouse = await storage.ensureDefaultWarehouse('repair_center', order.repairCenterId, 'Repair Center');
      
      // Transfer stock
      const items = await storage.listRepairCenterPurchaseOrderItems(order.id);
      for (const item of items) {
        // Deduct from reseller
        await storage.updateWarehouseStockQuantity(resellerWarehouse.id, item.productId, -item.quantity);
        await storage.createWarehouseMovement({
          warehouseId: resellerWarehouse.id,
          productId: item.productId,
          movementType: 'trasferimento_out',
          quantity: item.quantity,
          referenceType: 'ordine_rc_b2b',
          referenceId: order.id,
          notes: `Ordine RC B2B ${order.orderNumber}`,
          createdBy: req.user.id,
        });
        
        // Add to repair center
        await storage.updateWarehouseStockQuantity(rcWarehouse.id, item.productId, item.quantity);
        await storage.createWarehouseMovement({
          warehouseId: rcWarehouse.id,
          productId: item.productId,
          movementType: 'trasferimento_in',
          quantity: item.quantity,
          referenceType: 'ordine_rc_b2b',
          referenceId: order.id,
          notes: `Ordine RC B2B ${order.orderNumber}`,
          createdBy: req.user.id,
        });
      }
      
      const updated = await storage.updateRepairCenterPurchaseOrder(order.id, {
        status: 'approved',
        approvedAt: new Date(),
        approvedBy: req.user.id,
      });
      
      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Reseller: Reject repair center B2B order
  app.post("/api/reseller/rc-b2b-orders/:id/reject", requireRole("reseller"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ error: "Non autenticato" });
      
      const order = await storage.getRepairCenterPurchaseOrder(req.params.id);
      if (!order) return res.status(404).json({ error: "Ordine non trovato" });
      if (order.resellerId !== req.user.id) {
        return res.status(403).json({ error: "Accesso negato" });
      }
      if (order.status !== 'pending') {
        return res.status(400).json({ error: "Solo ordini in attesa possono essere rifiutati" });
      }
      
      const { reason } = req.body;
      
      const updated = await storage.updateRepairCenterPurchaseOrder(order.id, {
        status: 'rejected',
        rejectionReason: reason,
      });
      
      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Reseller: Ship repair center B2B order
  app.post("/api/reseller/rc-b2b-orders/:id/ship", requireRole("reseller"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ error: "Non autenticato" });
      
      const order = await storage.getRepairCenterPurchaseOrder(req.params.id);
      if (!order) return res.status(404).json({ error: "Ordine non trovato" });
      if (order.resellerId !== req.user.id) {
        return res.status(403).json({ error: "Accesso negato" });
      }
      if (order.status !== 'approved' && order.status !== 'paid') {
        return res.status(400).json({ error: "Ordine non in stato idoneo per spedizione" });
      }
      
      const { trackingNumber, carrier } = req.body;
      
      const updated = await storage.updateRepairCenterPurchaseOrder(order.id, {
        status: 'shipped',
        shippedAt: new Date(),
        trackingNumber,
        carrier,
      });
      
      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ==========================================
  // REPAIR CENTER B2B RETURNS
  // ==========================================

  // Repair Center: List my B2B returns
  app.get("/api/repair-center/b2b-returns", requireRole("repair_center"), async (req, res) => {
    try {
      if (!req.user || !req.user.repairCenterId) {
        return res.status(401).json({ error: "Non autenticato" });
      }
      const returns = await storage.listRcB2bReturns({ repairCenterId: req.user.repairCenterId });
      res.json(returns);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Repair Center: Get B2B return details
  app.get("/api/repair-center/b2b-returns/:id", requireRole("repair_center"), async (req, res) => {
    try {
      if (!req.user || !req.user.repairCenterId) {
        return res.status(401).json({ error: "Non autenticato" });
      }
      
      const returnDoc = await storage.getRcB2bReturn(req.params.id);
      if (!returnDoc) return res.status(404).json({ error: "Reso non trovato" });
      if (returnDoc.repairCenterId !== req.user.repairCenterId) {
        return res.status(403).json({ error: "Accesso negato" });
      }
      
      const items = await storage.listRcB2bReturnItems(returnDoc.id);
      res.json({ ...returnDoc, items });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Repair Center: Create B2B return request
  app.post("/api/repair-center/b2b-returns", requireRole("repair_center"), async (req, res) => {
    try {
      if (!req.user || !req.user.repairCenterId) {
        return res.status(401).json({ error: "Non autenticato" });
      }
      
      const { orderId, reason, reasonDetails, repairCenterNotes, items } = req.body;
      
      // Validate request body
      if (!orderId || !reason || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: "Dati richiesta incompleti" });
      }
      
      // Validate order exists and belongs to this repair center
      const order = await storage.getRepairCenterPurchaseOrder(orderId);
      if (!order) return res.status(404).json({ error: "Ordine non trovato" });
      if (order.repairCenterId !== req.user.repairCenterId) {
        return res.status(403).json({ error: "Accesso negato" });
      }
      if (order.status !== 'received') {
        return res.status(400).json({ error: "Puoi richiedere un reso solo per ordini ricevuti" });
      }
      
      // SECURITY: Load order items from DB and validate against request
      const orderItems = await storage.listRepairCenterPurchaseOrderItems(orderId);
      const orderItemsMap = new Map(orderItems.map(oi => [oi.id, oi]));
      
      // Validate each requested item and calculate total from verified data
      let totalAmount = 0;
      const validatedItems: Array<{
        orderItemId: string;
        productId: string;
        productName: string;
        productSku: string | null;
        quantity: number;
        unitPrice: number;
        returnReason?: string;
        condition?: string;
      }> = [];
      
      for (const reqItem of items) {
        const orderItem = orderItemsMap.get(reqItem.orderItemId);
        if (!orderItem) {
          return res.status(400).json({ error: `Articolo ordine ${reqItem.orderItemId} non trovato` });
        }
        
        // Validate quantity doesn't exceed ordered quantity
        const returnQty = Math.min(Math.max(1, parseInt(reqItem.quantity) || 0), orderItem.quantity);
        if (returnQty <= 0) {
          return res.status(400).json({ error: `Quantità non valida per ${orderItem.productName}` });
        }
        
        // Use verified price from DB, not client
        const unitPriceCents = orderItem.unitPrice;
        totalAmount += returnQty * unitPriceCents;
        
        validatedItems.push({
          orderItemId: orderItem.id,
          productId: orderItem.productId,
          productName: orderItem.productName,
          productSku: orderItem.productSku,
          quantity: returnQty,
          unitPrice: unitPriceCents,
          returnReason: reqItem.returnReason,
          condition: reqItem.condition,
        });
      }
      
      // Generate return number
      const returnNumber = await storage.generateRcB2bReturnNumber();
      
      // Create return with verified total
      const returnDoc = await storage.createRcB2bReturn({
        returnNumber,
        orderId,
        repairCenterId: req.user.repairCenterId,
        resellerId: order.resellerId,
        reason,
        reasonDetails,
        repairCenterNotes,
        totalAmount,
        status: 'requested',
      });
      
      // Create return items with verified data
      for (const item of validatedItems) {
        await storage.createRcB2bReturnItem({
          returnId: returnDoc.id,
          orderItemId: item.orderItemId,
          productId: item.productId,
          productName: item.productName,
          productSku: item.productSku,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          returnReason: item.returnReason,
          condition: item.condition,
        });
      }
      
      res.json(returnDoc);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Repair Center: Mark return as shipped
  app.post("/api/repair-center/b2b-returns/:id/ship", requireRole("repair_center"), async (req, res) => {
    try {
      if (!req.user || !req.user.repairCenterId) {
        return res.status(401).json({ error: "Non autenticato" });
      }
      
      const returnDoc = await storage.getRcB2bReturn(req.params.id);
      if (!returnDoc) return res.status(404).json({ error: "Reso non trovato" });
      if (returnDoc.repairCenterId !== req.user.repairCenterId) {
        return res.status(403).json({ error: "Accesso negato" });
      }
      if (returnDoc.status !== 'approved' && returnDoc.status !== 'awaiting_shipment') {
        return res.status(400).json({ error: `Impossibile spedire un reso con stato ${returnDoc.status}` });
      }
      
      const { trackingNumber, carrier } = req.body;
      
      const updated = await storage.updateRcB2bReturn(returnDoc.id, {
        status: 'shipped',
        shippedAt: new Date(),
        trackingNumber,
        carrier,
      });
      
      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Reseller: List B2B returns from repair centers
  app.get("/api/reseller/rc-b2b-returns", requireRole("reseller"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ error: "Non autenticato" });
      const returns = await storage.listRcB2bReturns({ resellerId: req.user.id });
      res.json(returns);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Reseller: Approve/Reject RC B2B return
  app.post("/api/reseller/rc-b2b-returns/:id/approve", requireRole("reseller"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ error: "Non autenticato" });
      
      const returnDoc = await storage.getRcB2bReturn(req.params.id);
      if (!returnDoc) return res.status(404).json({ error: "Reso non trovato" });
      if (returnDoc.resellerId !== req.user.id) {
        return res.status(403).json({ error: "Accesso negato" });
      }
      if (returnDoc.status !== 'requested') {
        return res.status(400).json({ error: `Impossibile approvare un reso con stato ${returnDoc.status}` });
      }
      
      const updated = await storage.updateRcB2bReturn(returnDoc.id, {
        status: 'approved',
        approvedAt: new Date(),
      });
      
      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/reseller/rc-b2b-returns/:id/reject", requireRole("reseller"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ error: "Non autenticato" });
      
      const returnDoc = await storage.getRcB2bReturn(req.params.id);
      if (!returnDoc) return res.status(404).json({ error: "Reso non trovato" });
      if (returnDoc.resellerId !== req.user.id) {
        return res.status(403).json({ error: "Accesso negato" });
      }
      if (returnDoc.status !== 'requested') {
        return res.status(400).json({ error: `Impossibile rifiutare un reso con stato ${returnDoc.status}` });
      }
      
      const { rejectionReason } = req.body;
      
      const updated = await storage.updateRcB2bReturn(returnDoc.id, {
        status: 'rejected',
        rejectedAt: new Date(),
        rejectionReason,
      });
      
      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Reseller: Mark RC B2B return as received and complete
  app.post("/api/reseller/rc-b2b-returns/:id/receive", requireRole("reseller"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ error: "Non autenticato" });
      
      const returnDoc = await storage.getRcB2bReturn(req.params.id);
      if (!returnDoc) return res.status(404).json({ error: "Reso non trovato" });
      if (returnDoc.resellerId !== req.user.id) {
        return res.status(403).json({ error: "Accesso negato" });
      }
      if (returnDoc.status !== 'shipped') {
        return res.status(400).json({ error: `Impossibile ricevere un reso con stato ${returnDoc.status}` });
      }
      
      const { inspectionNotes, creditAmount } = req.body;
      
      const updated = await storage.updateRcB2bReturn(returnDoc.id, {
        status: 'completed',
        receivedAt: new Date(),
        completedAt: new Date(),
        inspectionNotes,
        creditAmount: creditAmount || returnDoc.totalAmount,
      });
      
      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ==========================================
  // REPAIR CENTER CUSTOMERS
  // ==========================================

  // Repair Center: List customers assigned to this repair center
  app.get("/api/repair-center/customers", requireRole("repair_center"), async (req, res) => {
    try {
      if (!req.user || !req.user.repairCenterId) {
        return res.status(401).json({ error: "Non autenticato" });
      }
      
      // Get customer IDs assigned to this repair center
      const customerIds = await storage.listCustomerIdsForRepairCenter(req.user.repairCenterId);
      
      if (customerIds.length === 0) {
        return res.json([]);
      }
      
      // Get customer details
      const allUsers = await storage.listUsers();
      const customers = allUsers.filter(user => 
        user.role === "customer" && customerIds.includes(user.id)
      );
      
      // Enrich with repair statistics
      const customersWithStats = await Promise.all(
        customers.map(async (customer) => {
          const repairs = await storage.listRepairOrders({ customerId: customer.id });
          const completedRepairs = repairs.filter(r => r.status === 'delivered');
          const pendingRepairs = repairs.filter(r => !['delivered', 'cancelled'].includes(r.status || ''));
          
          return {
            ...customer,
            totalRepairs: repairs.length,
            completedRepairs: completedRepairs.length,
            pendingRepairs: pendingRepairs.length,
          };
        })
      );
      
      res.json(customersWithStats);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Repair Center: Get single customer details
  app.get("/api/repair-center/customers/:id", requireRole("repair_center"), async (req, res) => {
    try {
      if (!req.user || !req.user.repairCenterId) {
        return res.status(401).json({ error: "Non autenticato" });
      }
      
      // Verify customer is assigned to this repair center
      const customerIds = await storage.listCustomerIdsForRepairCenter(req.user.repairCenterId);
      if (!customerIds.includes(req.params.id)) {
        return res.status(403).json({ error: "Cliente non associato a questo centro" });
      }
      
      const customer = await storage.getUser(req.params.id);
      if (!customer || customer.role !== "customer") {
        return res.status(404).json({ error: "Cliente non trovato" });
      }
      
      // Get customer's repair history at this repair center
      const allRepairs = await storage.listRepairOrders({ customerId: customer.id });
      const repairs = allRepairs.filter(r => r.repairCenterId === req.user?.repairCenterId);
      
      res.json({ ...customer, repairs });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ==========================================
  // REPAIR CENTER PRODUCT CATALOGS (READ-ONLY FROM RESELLER)
  // ==========================================

  // Repair Center: Get smartphone catalog from reseller (devices available for B2B purchase)
  app.get("/api/repair-center/smartphone-catalog", requireRole("repair_center"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ error: "Non autenticato" });
      
      const repairCenter = await storage.getRepairCenter(req.user.repairCenterId!);
      if (!repairCenter || !repairCenter.resellerId) {
        return res.status(400).json({ error: "Centro riparazione non associato a un rivenditore" });
      }
      
      // Get reseller's smartphones
      const smartphones = await storage.listSmartphones({ resellerId: repairCenter.resellerId });
      
      // Get reseller warehouse stock
      const resellerWarehouse = await storage.ensureDefaultWarehouse('reseller', repairCenter.resellerId, 'Reseller');
      const stock = await storage.listWarehouseStock(resellerWarehouse.id);
      const stockMap = new Map(stock.map(s => [s.productId, s.quantity]));
      
      // Enrich with stock and B2B price
      const catalog = smartphones.map(phone => {
        const resellerStock = stockMap.get(phone.id) || 0;
        const b2bPrice = phone.costPrice || Math.round((phone.unitPrice || 0) * 0.8);
        return {
          ...phone,
          resellerStock,
          b2bPrice,
          availableForPurchase: resellerStock > 0,
        };
      });
      
      res.json(catalog);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Repair Center: Get accessory catalog from reseller
  app.get("/api/repair-center/accessory-catalog", requireRole("repair_center"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ error: "Non autenticato" });
      
      const repairCenter = await storage.getRepairCenter(req.user.repairCenterId!);
      if (!repairCenter || !repairCenter.resellerId) {
        return res.status(400).json({ error: "Centro riparazione non associato a un rivenditore" });
      }
      
      // Get reseller's accessories
      const accessories = await storage.listAccessories({ resellerId: repairCenter.resellerId });
      
      // Get reseller warehouse stock
      const resellerWarehouse = await storage.ensureDefaultWarehouse('reseller', repairCenter.resellerId, 'Reseller');
      const stock = await storage.listWarehouseStock(resellerWarehouse.id);
      const stockMap = new Map(stock.map(s => [s.productId, s.quantity]));
      
      // Enrich with stock, B2B price, and compatibilities
      const catalog = await Promise.all(accessories.map(async (accessory) => {
        const resellerStock = stockMap.get(accessory.id) || 0;
        const b2bPrice = accessory.costPrice || Math.round((accessory.unitPrice || 0) * 0.8);
        const deviceCompatibilities = await storage.listProductCompatibilities(accessory.id);
        return {
          ...accessory,
          resellerStock,
          b2bPrice,
          availableForPurchase: resellerStock > 0,
          deviceCompatibilities,
        };
      }));
      
      res.json(catalog);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Repair Center: Get spare parts catalog from reseller
  app.get("/api/repair-center/spare-parts-catalog", requireRole("repair_center"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ error: "Non autenticato" });
      
      const repairCenter = await storage.getRepairCenter(req.user.repairCenterId!);
      if (!repairCenter || !repairCenter.resellerId) {
        return res.status(400).json({ error: "Centro riparazione non associato a un rivenditore" });
      }
      
      // Get reseller's spare parts
      const filters: { resellerId?: string; productType?: string } = { 
        resellerId: repairCenter.resellerId,
        productType: 'ricambio'
      };
      const spareParts = await storage.listProducts(filters);
      
      // Get reseller warehouse stock
      const resellerWarehouse = await storage.ensureDefaultWarehouse('reseller', repairCenter.resellerId, 'Reseller');
      const stock = await storage.listWarehouseStock(resellerWarehouse.id);
      const stockMap = new Map(stock.map(s => [s.productId, s.quantity]));
      
      // Enrich with stock and B2B price
      const catalog = await Promise.all(spareParts.map(async (part) => {
        const resellerStock = stockMap.get(part.id) || 0;
        const b2bPrice = part.costPrice || Math.round((part.unitPrice || 0) * 0.8);
        const deviceCompatibilities = await storage.listProductCompatibilities(part.id);
        return {
          ...part,
          resellerStock,
          b2bPrice,
          availableForPurchase: resellerStock > 0,
          deviceCompatibilities,
        };
      }));
      
      res.json(catalog);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  return httpServer;
}
