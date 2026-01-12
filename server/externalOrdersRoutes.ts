import type { Express, Request, Response } from "express";
import { storage } from "./storage";

function requireAuth(req: Request, res: Response, next: Function) {
  if (!req.isAuthenticated()) {
    return res.status(401).send("Unauthorized");
  }
  next();
}

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

const RESELLER_ROLES = ["reseller", "reseller_staff"];

function getEffectiveResellerId(req: Request): string {
  const actingAs = (req.session as any)?.actingAs;
  const baseResellerId = req.user!.role === 'reseller_staff' 
    ? req.user!.resellerId! 
    : req.user!.id;
  
  if (actingAs && actingAs.type === 'reseller') {
    return actingAs.id;
  }
  return baseResellerId;
}

export function registerExternalOrdersRoutes(app: Express) {
  // POST /api/mobilesentrix/orders/:id/receive - Receive MobileSentrix order into warehouse
  app.post("/api/mobilesentrix/orders/:id/receive", requireAuth, requireRole(...RESELLER_ROLES), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      const effectiveResellerId = getEffectiveResellerId(req);
      const { id } = req.params;
      const { items, targetWarehouseId } = req.body;
      
      if (!targetWarehouseId) {
        return res.status(400).json({ success: false, message: "Magazzino di destinazione richiesto" });
      }
      
      const order = await storage.getMobilesentrixOrder(id);
      if (!order) {
        return res.status(404).json({ success: false, message: "Ordine non trovato" });
      }
      
      // Verify ownership using effective reseller ID
      const credential = await storage.getMobilesentrixCredentialByReseller(effectiveResellerId);
      if (!credential || order.credentialId !== credential.id) {
        return res.status(403).json({ success: false, message: "Non autorizzato" });
      }
      
      if (order.isReceivedInWarehouse) {
        return res.status(400).json({ success: false, message: "Ordine già ricevuto in magazzino" });
      }
      
      // Verify warehouse belongs to reseller
      const warehouse = await storage.getWarehouse(targetWarehouseId);
      if (!warehouse || warehouse.ownerId !== effectiveResellerId) {
        return res.status(400).json({ success: false, message: "Magazzino non valido" });
      }
      
      const orderItems = await storage.getMobilesentrixOrderItems(id);
      let receivedCount = 0;
      
      for (const orderItem of orderItems) {
        // Find if user has mapped this SKU
        const itemConfig = items?.find((i: any) => i.orderItemId === orderItem.id);
        let monkeyplanProductId = orderItem.monkeyplanProductId;
        
        if (itemConfig?.monkeyplanProductId) {
          monkeyplanProductId = itemConfig.monkeyplanProductId;
          // Save mapping for future orders
          const existingMapping = await storage.getExternalProductMappingBySku(
            effectiveResellerId, "mobilesentrix", orderItem.sku
          );
          if (!existingMapping) {
            await storage.createExternalProductMapping({
              resellerId: effectiveResellerId,
              source: "mobilesentrix",
              externalSku: orderItem.sku,
              externalName: orderItem.name,
              externalBrand: orderItem.brand || null,
              monkeyplanProductId: itemConfig.monkeyplanProductId,
              autoCreated: false,
            });
          }
          // Update order item with mapping
          await storage.updateMobilesentrixOrderItem(orderItem.id, {
            monkeyplanProductId: itemConfig.monkeyplanProductId,
          });
        }
        
        if (monkeyplanProductId) {
          const quantityToReceive = itemConfig?.quantity || orderItem.quantity;
          
          // Create warehouse movement (carico)
          await storage.createWarehouseMovement({
            warehouseId: targetWarehouseId,
            productId: monkeyplanProductId,
            movementType: "carico",
            quantity: quantityToReceive,
            referenceType: "ordine_fornitore_esterno",
            referenceId: order.id,
            notes: `Ricezione ordine MobileSentrix ${order.orderNumber || order.mobilesentrixOrderId} - SKU: ${orderItem.sku}`,
            createdBy: req.user.id,
          });
          
          // Update warehouse stock
          await storage.upsertWarehouseStock({
            warehouseId: targetWarehouseId,
            productId: monkeyplanProductId,
            quantity: quantityToReceive,
          });
          
          // Update order item received quantity
          await storage.updateMobilesentrixOrderItem(orderItem.id, {
            quantityReceived: (orderItem.quantityReceived || 0) + quantityToReceive,
          });
          
          receivedCount++;
        }
      }
      
      // Mark order as received
      await storage.updateMobilesentrixOrder(id, {
        isReceivedInWarehouse: true,
        receivedAt: new Date(),
        receivedBy: req.user.id,
        targetWarehouseId,
      });
      
      res.json({ 
        success: true, 
        message: `Ordine ricevuto in magazzino. ${receivedCount} prodotti caricati.` 
      });
    } catch (error: any) {
      console.error("Error receiving order:", error);
      res.status(400).json({ success: false, message: error.message });
    }
  });

  // POST /api/foneday/orders/:id/receive - Receive Foneday order into warehouse
  app.post("/api/foneday/orders/:id/receive", requireAuth, requireRole(...RESELLER_ROLES), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      const effectiveResellerId = getEffectiveResellerId(req);
      const { id } = req.params;
      const { items, targetWarehouseId } = req.body;
      
      if (!targetWarehouseId) {
        return res.status(400).json({ success: false, message: "Magazzino di destinazione richiesto" });
      }
      
      const order = await storage.getFonedayOrder(id);
      if (!order) {
        return res.status(404).json({ success: false, message: "Ordine non trovato" });
      }
      
      // Verify ownership using effective reseller ID
      const credential = await storage.getFonedayCredentialByReseller(effectiveResellerId);
      if (!credential || order.credentialId !== credential.id) {
        return res.status(403).json({ success: false, message: "Non autorizzato" });
      }
      
      if (order.isReceivedInWarehouse) {
        return res.status(400).json({ success: false, message: "Ordine già ricevuto in magazzino" });
      }
      
      // Verify warehouse belongs to reseller
      const warehouse = await storage.getWarehouse(targetWarehouseId);
      if (!warehouse || warehouse.ownerId !== effectiveResellerId) {
        return res.status(400).json({ success: false, message: "Magazzino non valido" });
      }
      
      // Parse order data to get items
      const orderData = order.orderData ? JSON.parse(order.orderData) : {};
      const orderItems = orderData.products || [];
      let receivedCount = 0;
      
      for (const orderItem of orderItems) {
        const itemConfig = items?.find((i: any) => i.sku === orderItem.sku || i.orderItemId === orderItem.sku);
        const monkeyplanProductId = itemConfig?.monkeyplanProductId;
        
        if (monkeyplanProductId) {
          // Save mapping for future orders
          const existingMapping = await storage.getExternalProductMappingBySku(
            effectiveResellerId, "foneday", orderItem.sku
          );
          if (!existingMapping) {
            await storage.createExternalProductMapping({
              resellerId: effectiveResellerId,
              source: "foneday",
              externalSku: orderItem.sku,
              externalName: orderItem.name || orderItem.product_name,
              externalBrand: orderItem.brand || null,
              monkeyplanProductId,
              autoCreated: false,
            });
          }
          
          const quantityToReceive = itemConfig?.quantity || orderItem.qty || orderItem.quantity || 1;
          
          // Create warehouse movement (carico)
          await storage.createWarehouseMovement({
            warehouseId: targetWarehouseId,
            productId: monkeyplanProductId,
            movementType: "carico",
            quantity: quantityToReceive,
            referenceType: "ordine_fornitore_esterno",
            referenceId: order.id,
            notes: `Ricezione ordine Foneday ${order.fonedayOrderNumber} - SKU: ${orderItem.sku}`,
            createdBy: req.user.id,
          });
          
          // Update warehouse stock
          await storage.upsertWarehouseStock({
            warehouseId: targetWarehouseId,
            productId: monkeyplanProductId,
            quantity: quantityToReceive,
          });
          
          receivedCount++;
        }
      }
      
      // Mark order as received
      await storage.updateFonedayOrder(id, {
        isReceivedInWarehouse: true,
        receivedAt: new Date(),
        receivedBy: req.user.id,
        targetWarehouseId,
      });
      
      res.json({ 
        success: true, 
        message: `Ordine ricevuto in magazzino. ${receivedCount} prodotti caricati.` 
      });
    } catch (error: any) {
      console.error("Error receiving Foneday order:", error);
      res.status(400).json({ success: false, message: error.message });
    }
  });

  // ============ EXTERNAL PRODUCT MAPPINGS ============

  // GET /api/external-product-mappings - List all external product mappings for reseller
  app.get("/api/external-product-mappings", requireAuth, requireRole(...RESELLER_ROLES), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      const effectiveResellerId = getEffectiveResellerId(req);
      const source = req.query.source as string | undefined;
      const mappings = await storage.listExternalProductMappings(effectiveResellerId, source);
      res.json(mappings);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // POST /api/external-product-mappings - Create external product mapping
  app.post("/api/external-product-mappings", requireAuth, requireRole(...RESELLER_ROLES), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      const effectiveResellerId = getEffectiveResellerId(req);
      const mapping = await storage.createExternalProductMapping({
        ...req.body,
        resellerId: effectiveResellerId,
      });
      res.json(mapping);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // DELETE /api/external-product-mappings/:id - Delete external product mapping
  app.delete("/api/external-product-mappings/:id", requireAuth, requireRole(...RESELLER_ROLES), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      const effectiveResellerId = getEffectiveResellerId(req);
      const mapping = await storage.getExternalProductMapping(req.params.id);
      if (!mapping || mapping.resellerId !== effectiveResellerId) {
        return res.status(404).json({ error: "Mappatura non trovata" });
      }
      await storage.deleteExternalProductMapping(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // ============ UNIFIED EXTERNAL ORDERS ============

  // GET /api/external-orders - List all external orders from all suppliers
  app.get("/api/external-orders", requireAuth, requireRole(...RESELLER_ROLES), async (req, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      const effectiveResellerId = getEffectiveResellerId(req);
      const orders: any[] = [];
      
      // MobileSentrix orders
      const msCred = await storage.getMobilesentrixCredentialByReseller(effectiveResellerId);
      if (msCred) {
        const msOrders = await storage.listMobilesentrixOrders(msCred.id);
        orders.push(...msOrders.map((o: any) => ({
          ...o,
          source: "mobilesentrix",
          sourceLabel: "MobileSentrix",
          total: o.totalAmount,
        })));
      }
      
      // Foneday orders
      const fdCred = await storage.getFonedayCredentialByReseller(effectiveResellerId);
      if (fdCred) {
        const fdOrders = await storage.listFonedayOrders(fdCred.id);
        orders.push(...fdOrders.map((o: any) => ({
          ...o,
          source: "foneday",
          sourceLabel: "Foneday",
          total: o.totalInclVat,
          orderNumber: o.fonedayOrderNumber,
        })));
      }
      
      // Sort by date desc
      orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      res.json(orders);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });
}
