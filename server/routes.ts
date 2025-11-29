import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
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
  insertSupplierReturnItemSchema,
  insertSupplierCommunicationLogSchema,
  type Product
} from "@shared/schema";
import { ObjectStorageService, objectStorageClient, parseObjectPath } from "./objectStorage";
import { canAccessObject, ObjectPermission } from "./objectAcl";
import { calculateRepairPriority } from "./helpers/priorityCalculation";
import { db } from "./db";
import { sql } from "drizzle-orm";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
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
      
      // Aggregate customer counts per reseller, omit password
      const resellersWithCounts = resellers.map(reseller => {
        const { password, ...safeReseller } = reseller;
        return {
          ...safeReseller,
          customerCount: customers.filter(c => c.resellerId === reseller.id).length,
        };
      });
      
      res.json(resellersWithCounts);
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
      
      const user = await storage.createUser({
        ...validatedData,
        password: hashedPassword,
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
      
      await storage.deleteUser(req.params.id);
      
      setActivityEntity(res, { type: 'users', id: req.params.id });
      res.sendStatus(204);
    } catch (error: any) {
      res.status(500).send(error.message);
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
  app.get("/api/repair-centers", requireAuth, async (req, res) => {
    try {
      const centers = await storage.listRepairCenters();
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

  app.get("/api/reseller/stats", requireRole("reseller"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");

      const repairs = await storage.listRepairOrders({ resellerId: req.user.id });
      const customers = await storage.listUsers(); // Filter by reseller's customers in production

      const stats = {
        totalOrders: repairs.length,
        activeRepairs: repairs.filter(r => r.status === "in_progress" || r.status === "pending").length,
        totalCustomers: customers.filter(c => c.role === "customer").length,
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
      const repairs = await storage.listRepairOrders({ resellerId: req.user.id });
      res.json(repairs);
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

  app.get("/api/reseller/customers", requireRole("reseller"), async (req, res) => {
    try {
      const allUsers = await storage.listUsers();
      const customers = allUsers.filter(user => user.role === "customer");
      res.json(customers);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  app.post("/api/reseller/customers", requireRole("reseller"), async (req, res) => {
    try {
      const baseSchema = insertUserSchema.pick({
        username: true,
        password: true,
        email: true,
        fullName: true,
        phone: true,
        isActive: true,
      });
      const validatedData = baseSchema.parse(req.body);

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
      });
      setActivityEntity(res, { type: 'users', id: user.id });
      res.status(201).json(user);
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
      
      res.json(repair);
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
      
      // Check access based on role
      const hasAccess = 
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
      
      const hasAccess = 
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
      
      const filters: { customerId?: string; resellerId?: string; repairCenterId?: string; status?: string } = {};
      
      // Role-based filtering
      if (req.user.role === 'customer') {
        // Customers see only their own orders
        filters.customerId = req.user.id;
      } else if (req.user.role === 'reseller') {
        // Resellers see orders they created
        filters.resellerId = req.user.id;
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
      res.json(orders);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });
  
  // Get single repair order details
  app.get("/api/repair-orders/:id", requireAuth, async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      const order = await storage.getRepairOrder(req.params.id);
      if (!order) return res.status(404).send("Repair order not found");
      
      // Check access based on role
      const hasAccess = 
        req.user.role === 'admin' ||
        order.customerId === req.user.id ||
        order.resellerId === req.user.id ||
        (req.user.role === 'repair_center' && 
         req.user.repairCenterId && 
         order.repairCenterId && 
         order.repairCenterId === req.user.repairCenterId);
      
      if (!hasAccess) return res.status(403).send("Forbidden");
      
      res.json(order);
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
      
      // Build order data
      const orderData: any = {
        ...validatedData,
        customerId,
        status: hasAcceptance ? 'ingressato' : 'pending',
      };
      
      // Set resellerId if user is reseller
      if (req.user.role === 'reseller') {
        orderData.resellerId = req.user.id;
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
      
      // Only admin and repair_center can update orders
      if (req.user.role !== 'admin' && req.user.role !== 'repair_center') {
        return res.status(403).send("Only admins and repair centers can update orders");
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
  app.get("/api/products", requireAuth, async (req, res) => {
    try {
      const products = await storage.listProducts();
      res.json(products);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });
  
  // Get products with stock by repair center (admin only)
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
  
  // Create product (admin only)
  app.post("/api/products", requireAuth, async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      // Only admins can create products
      if (req.user.role !== 'admin') {
        return res.status(403).send("Only admins can create products");
      }
      
      // Extract initial stock assignments from request body
      const { initialStock, ...productData } = req.body;
      
      const validatedData = insertProductSchema.parse(productData);
      const product = await storage.createProduct(validatedData);
      setActivityEntity(res, { type: 'product', id: product.id });
      
      // Create initial inventory movements for each repair center
      if (initialStock && Array.isArray(initialStock)) {
        for (const stockEntry of initialStock) {
          if (stockEntry.repairCenterId && stockEntry.quantity > 0) {
            await storage.createInventoryMovement({
              productId: product.id,
              repairCenterId: stockEntry.repairCenterId,
              movementType: 'in',
              quantity: stockEntry.quantity,
              notes: 'Quantità iniziale alla creazione prodotto',
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

  // ============ INVENTORY ============
  
  // List inventory stock with role-based filtering
  app.get("/api/inventory", requireAuth, async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      let inventory;
      
      // Only admin and repair_center can view inventory
      if (req.user.role !== 'admin' && req.user.role !== 'repair_center') {
        return res.status(403).send("Only admins and repair centers can view inventory");
      }
      
      if (req.user.role === 'admin') {
        // Admin sees all inventory, optionally filtered by repairCenterId
        const filterRepairCenterId = req.query.repairCenterId as string | undefined;
        inventory = await storage.listInventoryStock(filterRepairCenterId);
      } else {
        // Repair center sees only their own inventory
        if (!req.user.repairCenterId) {
          return res.json([]);
        }
        inventory = await storage.listInventoryStock(req.user.repairCenterId);
      }
      
      // Hydrate with product and repair center details
      const productIds = Array.from(new Set(inventory.map(item => item.productId)));
      const repairCenterIds = Array.from(new Set(inventory.map(item => item.repairCenterId)));
      
      const products = await Promise.all(productIds.map(id => storage.getProduct(id)));
      const repairCenters = await Promise.all(repairCenterIds.map(id => storage.getRepairCenter(id)));
      
      const productMap = new Map(products.filter(p => p).map(p => [p!.id, p]));
      const repairCenterMap = new Map(repairCenters.filter(rc => rc).map(rc => [rc!.id, rc]));
      
      const enrichedInventory = inventory.map(item => ({
        ...item,
        product: productMap.get(item.productId),
        repairCenter: repairCenterMap.get(item.repairCenterId),
      }));
      
      res.json(enrichedInventory);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });
  
  // List inventory movements with role-based filtering
  app.get("/api/inventory/movements", requireAuth, async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      // Only admin and repair_center can view movements
      if (req.user.role !== 'admin' && req.user.role !== 'repair_center') {
        return res.status(403).send("Only admins and repair centers can view inventory movements");
      }
      
      let movements;
      
      if (req.user.role === 'admin') {
        // Admin sees all movements (optionally filtered by query params)
        const filters: { repairCenterId?: string; productId?: string } = {};
        if (req.query.repairCenterId && typeof req.query.repairCenterId === 'string') {
          filters.repairCenterId = req.query.repairCenterId;
        }
        if (req.query.productId && typeof req.query.productId === 'string') {
          filters.productId = req.query.productId;
        }
        movements = await storage.listInventoryMovements(filters);
      } else {
        // Repair center sees only their own movements
        if (!req.user.repairCenterId) {
          return res.json([]);
        }
        movements = await storage.listInventoryMovements({ repairCenterId: req.user.repairCenterId });
      }
      
      res.json(movements);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });
  
  // Create inventory movement
  app.post("/api/inventory/movements", requireAuth, async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      // Only admin and repair_center can create movements
      if (req.user.role !== 'admin' && req.user.role !== 'repair_center') {
        return res.status(403).send("Only admins and repair centers can create inventory movements");
      }
      
      const schema = insertInventoryMovementSchema.pick({
        productId: true,
        repairCenterId: true,
        movementType: true,
        quantity: true,
        notes: true,
      });
      
      const validatedData = schema.parse(req.body);
      
      // For repair center, force repairCenterId from session
      let repairCenterId = validatedData.repairCenterId;
      if (req.user.role === 'repair_center') {
        if (!req.user.repairCenterId) {
          return res.status(403).send("Repair center ID not configured");
        }
        repairCenterId = req.user.repairCenterId; // Force from session
      } else if (req.user.role === 'admin') {
        // Admin must provide repairCenterId in body
        if (!repairCenterId) {
          return res.status(400).send("repairCenterId is required");
        }
        // Validate repair center exists
        const center = await storage.getRepairCenter(repairCenterId);
        if (!center) {
          return res.status(400).send("Invalid repair center ID");
        }
      }
      
      // Validate product exists
      const product = await storage.getProduct(validatedData.productId);
      if (!product) {
        return res.status(400).send("Invalid product ID");
      }
      
      const movement = await storage.createInventoryMovement({
        productId: validatedData.productId,
        repairCenterId,
        movementType: validatedData.movementType,
        quantity: validatedData.quantity,
        notes: validatedData.notes,
        createdBy: req.user.id, // Force from authenticated session
      });
      
      setActivityEntity(res, { type: 'inventory_movement', id: movement.id });
      res.status(201).json(movement);
    } catch (error: any) {
      res.status(400).send(error.message);
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
      } else {
        // Reseller/Repair Center: no access to invoices
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
      if (req.user.role === 'reseller' && order.resellerId !== req.user.id) {
        return res.status(403).send("Access denied");
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
      if (req.user.role === 'reseller' && order.resellerId !== req.user.id) {
        return res.status(403).send("Access denied");
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
      
      // Only repair center technicians and admins can create diagnostics
      if (req.user.role !== 'admin' && req.user.role !== 'repair_center') {
        return res.status(403).send("Only repair centers and admins can create diagnostics");
      }
      
      // Verify repair order exists
      const order = await storage.getRepairOrder(req.params.id);
      if (!order) {
        return res.status(404).send("Repair order not found");
      }
      
      // Repair center can only diagnose their own orders
      if (req.user.role === 'repair_center') {
        if (!req.user.repairCenterId || order.repairCenterId !== req.user.repairCenterId) {
          return res.status(403).send("Access denied");
        }
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
      
      // Only repair center technicians and admins can update diagnostics
      if (req.user.role !== 'admin' && req.user.role !== 'repair_center') {
        return res.status(403).send("Only repair centers and admins can update diagnostics");
      }
      
      // Verify repair order exists
      const order = await storage.getRepairOrder(req.params.id);
      if (!order) {
        return res.status(404).send("Repair order not found");
      }
      
      // Repair center can only update their own orders
      if (req.user.role === 'repair_center') {
        if (!req.user.repairCenterId || order.repairCenterId !== req.user.repairCenterId) {
          return res.status(403).send("Access denied");
        }
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
        if (repairOrder.resellerId !== req.user.id) {
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
      
      // Only admin and repair_center can create quotes
      if (req.user.role !== 'admin' && req.user.role !== 'repair_center') {
        return res.status(403).send("Only admins and repair centers can create quotes");
      }
      
      const repairOrder = await storage.getRepairOrder(req.params.id);
      if (!repairOrder) {
        return res.status(404).send("Repair order not found");
      }
      
      // Repair center can only create quotes for their assigned orders
      if (req.user.role === 'repair_center') {
        if (repairOrder.repairCenterId !== req.user.repairCenterId) {
          return res.status(403).send("Access denied");
        }
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
      
      // Only admin and repair_center can update quotes
      if (req.user.role !== 'admin' && req.user.role !== 'repair_center') {
        return res.status(403).send("Only admins and repair centers can update quotes");
      }
      
      const repairOrder = await storage.getRepairOrder(req.params.id);
      if (!repairOrder) {
        return res.status(404).send("Repair order not found");
      }
      
      // Repair center can only update quotes for their assigned orders
      if (req.user.role === 'repair_center') {
        if (repairOrder.repairCenterId !== req.user.repairCenterId) {
          return res.status(403).send("Access denied");
        }
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
      
      // Only admin and repair_center can skip quote
      if (req.user.role !== 'admin' && req.user.role !== 'repair_center') {
        return res.status(403).send("Solo admin e centri riparazione possono saltare il preventivo");
      }
      
      const repairOrder = await storage.getRepairOrder(req.params.id);
      if (!repairOrder) {
        return res.status(404).send("Ordine di riparazione non trovato");
      }
      
      // Check repair center access
      if (req.user.role === 'repair_center' && repairOrder.repairCenterId !== req.user.repairCenterId) {
        return res.status(403).send("Accesso negato");
      }
      
      // Validate status - can only skip quote from in_diagnosi
      if (repairOrder.status !== 'in_diagnosi') {
        return res.status(400).send("Il preventivo può essere saltato solo dallo stato 'in_diagnosi'");
      }
      
      // Check that diagnosis exists
      const diagnosis = await storage.getRepairDiagnostics(req.params.id);
      if (!diagnosis) {
        return res.status(400).send("La diagnosi deve essere completata prima di saltare il preventivo");
      }
      
      // Validate bypass reason
      const { reason } = req.body;
      if (!reason || !['garanzia', 'omaggio'].includes(reason)) {
        return res.status(400).send("Motivo non valido. Deve essere 'garanzia' o 'omaggio'");
      }
      
      // Update repair order - skip to attesa_ricambi or in_riparazione based on diagnosis
      const nextStatus = diagnosis.requiresExternalParts ? 'attesa_ricambi' : 'in_riparazione';
      
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
      if (req.user.role === 'reseller' && repairOrder.resellerId !== req.user.id) {
        return res.status(403).send("Access denied");
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
      
      // Only admin and repair_center can order parts
      if (req.user.role !== 'admin' && req.user.role !== 'repair_center') {
        return res.status(403).send("Only admins and repair centers can order parts");
      }
      
      const repairOrder = await storage.getRepairOrder(req.params.id);
      if (!repairOrder) {
        return res.status(404).send("Repair order not found");
      }
      
      // Repair center access check
      if (req.user.role === 'repair_center' && repairOrder.repairCenterId !== req.user.repairCenterId) {
        return res.status(403).send("Access denied");
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
      
      if (req.user.role !== 'admin' && req.user.role !== 'repair_center') {
        return res.status(403).send("Only admins and repair centers can update parts status");
      }
      
      const partsOrder = await storage.getPartsOrder(req.params.id);
      if (!partsOrder) {
        return res.status(404).send("Parts order not found");
      }
      
      const receivedAt = req.body.status === 'received' ? new Date() : undefined;
      const updated = await storage.updatePartsOrderStatus(req.params.id, req.body.status, receivedAt);
      
      // If parts received, update inventory
      if (req.body.status === 'received') {
        const repairOrder = await storage.getRepairOrder(partsOrder.repairOrderId);
        
        // If linked to a product, add to inventory
        if (partsOrder.productId && repairOrder?.repairCenterId) {
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
      
      // Only admin, repair_center can see logs
      if (req.user.role !== 'admin' && req.user.role !== 'repair_center') {
        return res.status(403).send("Access denied");
      }
      
      if (req.user.role === 'repair_center' && repairOrder.repairCenterId !== req.user.repairCenterId) {
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
      
      if (req.user.role !== 'admin' && req.user.role !== 'repair_center') {
        return res.status(403).send("Only admins and repair centers can add logs");
      }
      
      const repairOrder = await storage.getRepairOrder(req.params.id);
      if (!repairOrder) {
        return res.status(404).send("Repair order not found");
      }
      
      if (req.user.role === 'repair_center' && repairOrder.repairCenterId !== req.user.repairCenterId) {
        return res.status(403).send("Access denied");
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
      
      if (req.user.role !== 'admin' && req.user.role !== 'repair_center') {
        return res.status(403).send("Only admins and repair centers can start repairs");
      }
      
      const repairOrder = await storage.getRepairOrder(req.params.id);
      if (!repairOrder) {
        return res.status(404).send("Repair order not found");
      }
      
      if (req.user.role === 'repair_center' && repairOrder.repairCenterId !== req.user.repairCenterId) {
        return res.status(403).send("Access denied");
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
      
      if (req.user.role !== 'admin' && req.user.role !== 'repair_center') {
        return res.status(403).send("Access denied");
      }
      
      if (req.user.role === 'repair_center' && repairOrder.repairCenterId !== req.user.repairCenterId) {
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
      
      if (req.user.role !== 'admin' && req.user.role !== 'repair_center') {
        return res.status(403).send("Only admins and repair centers can update test checklist");
      }
      
      const repairOrder = await storage.getRepairOrder(req.params.id);
      if (!repairOrder) {
        return res.status(404).send("Repair order not found");
      }
      
      if (req.user.role === 'repair_center' && repairOrder.repairCenterId !== req.user.repairCenterId) {
        return res.status(403).send("Access denied");
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
      
      if (req.user.role !== 'admin' && req.user.role !== 'repair_center') {
        return res.status(403).send("Only admins and repair centers can mark as ready");
      }
      
      const repairOrder = await storage.getRepairOrder(req.params.id);
      if (!repairOrder) {
        return res.status(404).send("Repair order not found");
      }
      
      if (req.user.role === 'repair_center' && repairOrder.repairCenterId !== req.user.repairCenterId) {
        return res.status(403).send("Access denied");
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
      
      if (req.user.role !== 'admin' && req.user.role !== 'repair_center') {
        return res.status(403).send("Only admins and repair centers can complete delivery");
      }
      
      const repairOrder = await storage.getRepairOrder(req.params.id);
      if (!repairOrder) {
        return res.status(404).send("Repair order not found");
      }
      
      if (req.user.role === 'repair_center' && repairOrder.repairCenterId !== req.user.repairCenterId) {
        return res.status(403).send("Access denied");
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
      if (req.user.role === 'reseller' && repairOrder.resellerId !== req.user.id) {
        return res.status(403).send("Access denied");
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
      if (req.user.role === 'reseller' && repairOrder.resellerId !== req.user.id) {
        return res.status(403).send("Access denied");
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
      doc.fontSize(12).font('Helvetica-Bold').text('DATI CLIENTE');
      doc.fontSize(10).font('Helvetica');
      if (customer) {
        doc.text(`Nome: ${customer.fullName || customer.username || ''}`);
        if (customer.email) doc.text(`Email: ${customer.email}`);
        if (customer.phone) doc.text(`Telefono: ${customer.phone}`);
      }
      doc.moveDown();
      
      // Device info
      doc.fontSize(12).font('Helvetica-Bold').text('DISPOSITIVO RIPARATO');
      doc.fontSize(10).font('Helvetica');
      doc.text(`Tipo: ${repairOrder.deviceType || 'N/A'}`);
      doc.text(`Modello: ${repairOrder.deviceModel || 'N/A'}`);
      if (acceptance?.imei) doc.text(`IMEI/Seriale: ${acceptance.imei}`);
      if (repairOrder.issueDescription) doc.text(`Problema originale: ${repairOrder.issueDescription}`);
      doc.moveDown();
      
      // Repair summary
      doc.fontSize(12).font('Helvetica-Bold').text('RIEPILOGO RIPARAZIONE');
      doc.fontSize(10).font('Helvetica');
      if (diagnostics?.diagnosis) doc.text(`Diagnosi: ${diagnostics.diagnosis}`);
      if (quote) {
        doc.text(`Totale Parti: € ${quote.partsTotal?.toFixed(2) || '0.00'}`);
        doc.text(`Totale Manodopera: € ${quote.laborTotal?.toFixed(2) || '0.00'}`);
        doc.font('Helvetica-Bold').text(`TOTALE: € ${quote.totalAmount?.toFixed(2) || '0.00'}`);
        doc.font('Helvetica');
      }
      doc.moveDown();
      
      // Delivery info
      doc.fontSize(12).font('Helvetica-Bold').text('DATI CONSEGNA');
      doc.fontSize(10).font('Helvetica');
      doc.text(`Ritirato da: ${delivery.deliveredTo}`);
      const methodLabels: Record<string, string> = {
        'in_store': 'Ritiro in Negozio',
        'courier': 'Spedizione Corriere',
        'pickup': 'Ritiro Cliente'
      };
      doc.text(`Metodo: ${methodLabels[delivery.deliveryMethod] || delivery.deliveryMethod}`);
      if (delivery.idDocumentType) {
        const docTypeLabels: Record<string, string> = {
          'id_card': "Carta d'Identità",
          'drivers_license': 'Patente',
          'passport': 'Passaporto',
          'other': 'Altro'
        };
        doc.text(`Documento: ${docTypeLabels[delivery.idDocumentType] || delivery.idDocumentType} - ${delivery.idDocumentNumber || ''}`);
      }
      if (delivery.notes) doc.text(`Note: ${delivery.notes}`);
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
      if (req.user.role === 'reseller' && repairOrder.resellerId !== req.user.id) {
        return res.status(403).send("Access denied");
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
      doc.moveDown();
      
      // Customer info
      doc.fontSize(12).font('Helvetica-Bold').text('DATI CLIENTE');
      doc.fontSize(10).font('Helvetica');
      if (customer) {
        doc.text(`Nome: ${customer.fullName || customer.username || ''}`);
        if (customer.email) doc.text(`Email: ${customer.email}`);
        if (customer.phone) doc.text(`Telefono: ${customer.phone}`);
        if (customer.address) doc.text(`Indirizzo: ${customer.address}`);
      }
      doc.moveDown();
      
      // Device info
      doc.fontSize(12).font('Helvetica-Bold').text('DATI DISPOSITIVO');
      doc.fontSize(10).font('Helvetica');
      doc.text(`Tipo Dispositivo: ${deviceTypeName || 'N/A'}`);
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
      if (req.user.role === 'reseller' && repairOrder.resellerId !== req.user.id) {
        return res.status(403).send("Access denied");
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
      doc.moveDown();
      
      // Customer info
      doc.fontSize(12).font('Helvetica-Bold').text('DATI CLIENTE');
      doc.fontSize(10).font('Helvetica');
      if (customer) {
        doc.text(`Nome: ${customer.fullName || customer.username || ''}`);
        if (customer.email) doc.text(`Email: ${customer.email}`);
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
      
      // Original problem
      doc.fontSize(12).font('Helvetica-Bold').text('PROBLEMA ORIGINALE');
      doc.fontSize(10).font('Helvetica');
      doc.text(repairOrder.issueDescription || 'N/A');
      doc.moveDown();
      
      // Technical Diagnosis
      doc.fontSize(12).font('Helvetica-Bold').text('DIAGNOSI TECNICA');
      doc.fontSize(10).font('Helvetica');
      doc.text(diagnostics.technicalDiagnosis || 'N/A');
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
      if (req.user.role === 'reseller' && repairOrder.resellerId !== req.user.id) {
        return res.status(403).send("Access denied");
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
      
      // Format currency helper
      const formatCurrency = (cents: number) => {
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
      doc.moveDown();
      
      // Customer info
      doc.fontSize(12).font('Helvetica-Bold').text('DATI CLIENTE');
      doc.fontSize(10).font('Helvetica');
      if (customer) {
        doc.text(`Nome: ${customer.fullName || customer.username || ''}`);
        if (customer.email) doc.text(`Email: ${customer.email}`);
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
      doc.fontSize(12).font('Helvetica-Bold').text('RIEPILOGO COSTI');
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
      
      const users = await storage.listUsers();
      res.json(users);
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
        ? ['username', 'email', 'fullName', 'role', 'isActive', 'repairCenterId'] as const
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
      
      const updatedUser = await storage.updateUser(req.params.id, updates);
      
      setActivityEntity(res, { type: 'user', id: updatedUser.id });
      res.json(updatedUser);
    } catch (error: any) {
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
        // Reseller sees own orders and customers stats
        const ownOrders = await storage.listRepairOrders({ resellerId: req.user.id });
        
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
      if (user.role === 'reseller' && repairOrder.resellerId !== user.id) {
        return res.status(403).send("Access denied");
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
      
      // Recalculate order totals
      const items = await storage.listSupplierOrderItems(req.params.id);
      const subtotal = items.reduce((sum, i) => sum + i.totalPrice, 0);
      const taxAmount = Math.round(subtotal * 0.22); // 22% IVA
      const shippingCost = order.shippingCost || 0;
      const totalAmount = subtotal + taxAmount + shippingCost;
      
      await storage.updateSupplierOrder(req.params.id, { subtotal, taxAmount, totalAmount });
      
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
      
      // Recalculate order totals
      const remainingItems = await storage.listSupplierOrderItems(order.id);
      const subtotal = remainingItems.reduce((sum, i) => sum + i.totalPrice, 0);
      const taxAmount = Math.round(subtotal * 0.22);
      const shippingCost = order.shippingCost || 0;
      const totalAmount = subtotal + taxAmount + shippingCost;
      
      await storage.updateSupplierOrder(order.id, { subtotal, taxAmount, totalAmount });
      
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

  return httpServer;
}
