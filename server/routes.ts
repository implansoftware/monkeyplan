import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";
import {
  insertUserSchema, insertRepairCenterSchema, insertProductSchema,
  insertRepairOrderSchema, insertTicketSchema, insertInvoiceSchema,
  updateRepairStatusSchema, updateTicketStatusSchema, createTicketMessageSchema,
  insertInventoryMovementSchema, insertBillingDataSchema, insertChatMessageSchema
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

export function registerRoutes(app: Express): Server {
  // Setup authentication routes
  setupAuth(app);

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
      // Validate input
      const validatedData = insertUserSchema.parse(req.body);
      
      // Hash password before storing
      const hashedPassword = await hashPassword(validatedData.password);
      
      const user = await storage.createUser({
        ...validatedData,
        password: hashedPassword,
      });
      res.status(201).json(user);
    } catch (error: any) {
      res.status(400).send(error.message);
    }
  });

  app.delete("/api/admin/users/:id", requireRole("admin"), async (req, res) => {
    try {
      await storage.deleteUser(req.params.id);
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
      res.status(201).json(center);
    } catch (error: any) {
      res.status(400).send(error.message);
    }
  });

  app.delete("/api/admin/repair-centers/:id", requireRole("admin"), async (req, res) => {
    try {
      await storage.deleteRepairCenter(req.params.id);
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
      res.status(201).json(product);
    } catch (error: any) {
      res.status(400).send(error.message);
    }
  });

  app.delete("/api/admin/products/:id", requireRole("admin"), async (req, res) => {
    try {
      await storage.deleteProduct(req.params.id);
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
      res.status(201).json(movement);
    } catch (error: any) {
      res.status(400).send(error.message);
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
      res.status(201).json(repair);
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
      res.status(201).json(ticket);
    } catch (error: any) {
      res.status(400).send(error.message);
    }
  });

  // ============ WEBSOCKET FOR LIVECHAT ============

  const httpServer = createServer(app);
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  const clients = new Map<string, WebSocket>();

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
