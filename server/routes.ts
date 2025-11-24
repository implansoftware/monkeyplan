import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";
import ExcelJS from "exceljs";
import {
  insertUserSchema, insertRepairCenterSchema, insertProductSchema,
  insertRepairOrderSchema, insertTicketSchema, insertInvoiceSchema,
  updateRepairStatusSchema, updateTicketStatusSchema, createTicketMessageSchema,
  insertInventoryMovementSchema, insertBillingDataSchema, insertChatMessageSchema,
  insertNotificationPreferencesSchema
} from "@shared/schema";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

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
      
      const validatedData = insertInventoryMovementSchema.omit({
        id: true,
        createdAt: true,
        createdBy: true, // Will be forced from session
      }).parse(req.body);

      const movement = await storage.createInventoryMovement({
        ...validatedData,
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
              'Bank Transfer Details': inv.bankTransferDetails,
              'Created At': new Date(inv.createdAt).toLocaleString(),
            }));
          fileName = 'invoices_export.xlsx';
          sheetName = 'Invoices';
          break;

        case 'inventory':
          const inventory = await storage.listInventoryStock(centerId as string | undefined);
          data = inventory
            .filter(item => {
              if (startDate && new Date(item.lastUpdated) < new Date(startDate as string)) return false;
              if (endDate && new Date(item.lastUpdated) > new Date(endDate as string)) return false;
              if (centerId && item.repairCenterId !== centerId) return false;
              return true;
            })
            .map(item => ({
              'Product SKU': item.productSku,
              'Repair Center ID': item.repairCenterId,
              'Quantity': item.quantity,
              'Last Updated': new Date(item.lastUpdated).toLocaleString(),
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
      const baseSchema = insertRepairOrderSchema.omit({ 
        orderNumber: true,
        resellerId: true, // Will be forced from session
        status: true,
        estimatedCost: true,
        finalCost: true,
        createdAt: true,
        updatedAt: true 
      });

      const validatedData = baseSchema.parse(req.body);

      // Verify customer exists if provided
      if (validatedData.customerId) {
        const customer = await storage.getUser(validatedData.customerId);
        if (!customer || customer.role !== 'customer') {
          return res.status(400).send("Invalid customer");
        }
      }

      const repair = await storage.createRepairOrder({
        ...validatedData,
        resellerId: req.user.id, // Force reseller ID from session
        customerId: validatedData.customerId || req.user.id,
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
      const baseSchema = insertUserSchema.omit({ 
        id: true, 
        role: true, 
        repairCenterId: true,
        createdAt: true 
      });
      const validatedData = baseSchema.parse(req.body);

      // Hash password before storing
      const hashedPassword = await hashPassword(validatedData.password);

      const user = await storage.createUser({
        ...validatedData,
        password: hashedPassword,
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

      const baseSchema = insertInventoryMovementSchema.omit({ 
        id: true, 
        centerId: true, 
        createdAt: true 
      });
      const validatedData = baseSchema.parse(req.body);

      const movement = await storage.createInventoryMovement({
        ...validatedData,
        centerId: req.user.repairCenterId, // Force center ID from session
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
      const baseSchema = insertTicketSchema.omit({
        ticketNumber: true,
        customerId: true,
        status: true,
        assignedTo: true,
        createdAt: true,
        updatedAt: true
      });

      const validatedData = baseSchema.parse(req.body);

      const ticket = await storage.createTicket({
        ...validatedData,
        customerId: req.user.id, // Force customer ID from session
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
      
      const updateSchema = insertNotificationPreferencesSchema.omit({
        id: true,
        userId: true,
        createdAt: true,
        updatedAt: true,
      }).partial();
      
      const validatedData = updateSchema.parse(req.body);
      
      const preferences = await storage.updateNotificationPreferences(req.user.id, validatedData);
      setActivityEntity(res, { type: 'notification_preferences', id: preferences.id });
      res.json(preferences);
    } catch (error: any) {
      res.status(400).send(error.message);
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
            clients.set(userId, ws);
            
            // Send auth confirmation
            ws.send(JSON.stringify({ type: 'auth_success' }));
          } else {
            ws.send(JSON.stringify({ type: 'auth_failed', error: 'Invalid user' }));
            ws.close();
          }
        } else if (data.type === 'message' && userId && authenticated) {
          // Validate message with Zod schema
          const messageSchema = insertChatMessageSchema.omit({
            id: true,
            senderId: true, // Will be forced from session
            createdAt: true,
          });

          const validatedData = messageSchema.parse({
            receiverId: data.receiverId,
            message: data.message,
          });

          // Verify receiver exists
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

  return httpServer;
}
