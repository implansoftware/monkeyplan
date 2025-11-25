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
  insertNotificationPreferencesSchema, insertRepairAttachmentSchema,
  customerWizardSchema,
  type Product
} from "@shared/schema";
import { ObjectStorageService, objectStorageClient, parseObjectPath } from "./objectStorage";
import { canAccessObject, ObjectPermission } from "./objectAcl";

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

  // Download/preview attachment with signed URL
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
      
      // Generate signed URL for download or preview (valid for 1 hour)
      const { bucketName, objectName } = parseObjectPath(attachment.objectKey);
      const bucket = objectStorageClient.bucket(bucketName);
      const file = bucket.file(objectName);
      
      // Use inline disposition for preview, attachment for download
      const isPreview = req.query.preview === 'true';
      const disposition = isPreview
        ? 'inline'
        : `attachment; filename="${encodeURIComponent(attachment.fileName)}"`;
      
      const [signedUrl] = await file.getSignedUrl({
        version: 'v4',
        action: 'read',
        expires: Date.now() + 60 * 60 * 1000, // 1 hour
        responseDisposition: disposition,
      });
      
      res.json({ signedUrl });
    } catch (error: any) {
      console.error('Download error:', error);
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
  
  // Create product (admin only)
  app.post("/api/products", requireAuth, async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      // Only admins can create products
      if (req.user.role !== 'admin') {
        return res.status(403).send("Only admins can create products");
      }
      
      const validatedData = insertProductSchema.parse(req.body);
      const product = await storage.createProduct(validatedData);
      setActivityEntity(res, { type: 'product', id: product.id });
      
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
      
      const updates: Partial<Pick<Product, 'name' | 'sku' | 'category' | 'description' | 'unitPrice'>> = {};
      if (req.body.name !== undefined) updates.name = req.body.name;
      if (req.body.sku !== undefined) updates.sku = req.body.sku;
      if (req.body.category !== undefined) updates.category = req.body.category;
      if (req.body.description !== undefined) updates.description = req.body.description;
      if (req.body.unitPrice !== undefined) updates.unitPrice = req.body.unitPrice;
      
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
        // Admin sees all inventory
        inventory = await storage.listInventoryStock();
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

  return httpServer;
}
