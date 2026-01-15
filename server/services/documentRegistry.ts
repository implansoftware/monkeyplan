import { storage } from "../storage";
import { InsertDocument, DocumentType, DocumentSourceType } from "@shared/schema";

export interface RegisterDocumentParams {
  title: string;
  documentType: DocumentType;
  sourceType: DocumentSourceType;
  sourceId?: string;
  sourceReference?: string;
  ownerId: string;
  ownerRole: string;
  resellerId?: string;
  repairCenterId?: string;
  customerId?: string;
  filePath?: string;
  fileUrl?: string;
  fileName: string;
  fileSize?: number;
  mimeType?: string;
  isExternal?: boolean;
  externalProvider?: string;
  metadata?: Record<string, any>;
  tags?: string[];
}

export async function registerDocument(params: RegisterDocumentParams) {
  try {
    const doc: InsertDocument = {
      title: params.title,
      documentType: params.documentType,
      sourceType: params.sourceType,
      sourceId: params.sourceId || null,
      sourceReference: params.sourceReference || null,
      ownerId: params.ownerId,
      ownerRole: params.ownerRole,
      resellerId: params.resellerId || null,
      repairCenterId: params.repairCenterId || null,
      customerId: params.customerId || null,
      filePath: params.filePath || null,
      fileUrl: params.fileUrl || null,
      fileName: params.fileName,
      fileSize: params.fileSize || null,
      mimeType: params.mimeType || "application/pdf",
      isExternal: params.isExternal || false,
      externalProvider: params.externalProvider || null,
      metadata: params.metadata || null,
      tags: params.tags || null,
    };

    console.log("[DocumentRegistry] Creating document:", { title: doc.title, type: doc.documentType, sourceType: doc.sourceType, sourceId: doc.sourceId });
    const result = await storage.createDocument(doc);
    console.log("[DocumentRegistry] Document created successfully:", result.id);
    return result;
  } catch (error) {
    console.error("[DocumentRegistry] Error creating document:", error);
    throw error;
  }
}

export function buildDocumentTitle(
  documentType: DocumentType,
  reference?: string
): string {
  const typeLabels: Record<DocumentType, string> = {
    intake: "Accettazione",
    delivery: "Consegna",
    diagnosis: "Diagnosi",
    quote: "Preventivo",
    label: "Etichetta",
    invoice: "Fattura",
    receipt: "Ricevuta",
    shipping: "DDT",
    attachment: "Allegato",
    contract: "Contratto",
    report: "Report",
    other: "Documento",
  };

  const label = typeLabels[documentType] || "Documento";
  return reference ? `${label} - ${reference}` : label;
}

export function buildFileName(
  documentType: DocumentType,
  reference?: string,
  extension: string = "pdf"
): string {
  const safeRef = reference ? reference.replace(/[^a-zA-Z0-9_-]/g, "_") : "";
  const timestamp = Date.now();
  return `${documentType}_${safeRef}_${timestamp}.${extension}`;
}

export async function ensureRepairDocumentRegistered(params: {
  documentType: DocumentType;
  repairOrderId: string;
  orderNumber: string;
  ownerId: string;
  ownerRole: string;
  resellerId?: string;
  repairCenterId?: string;
  customerId?: string;
}): Promise<void> {
  try {
    console.log("[DocumentRegistry] ensureRepairDocumentRegistered called:", { 
      documentType: params.documentType, 
      repairOrderId: params.repairOrderId, 
      orderNumber: params.orderNumber,
      resellerId: params.resellerId,
      repairCenterId: params.repairCenterId
    });
    
    const existingDocs = await storage.getDocumentsBySource("repair_order", params.repairOrderId);
    const alreadyExists = existingDocs.some(d => d.documentType === params.documentType);
    
    console.log("[DocumentRegistry] Existing docs found:", existingDocs.length, "Already exists:", alreadyExists);
    
    if (!alreadyExists) {
      await registerDocument({
        title: buildDocumentTitle(params.documentType, params.orderNumber),
        documentType: params.documentType,
        sourceType: "repair_order",
        sourceId: params.repairOrderId,
        sourceReference: params.orderNumber,
        ownerId: params.ownerId,
        ownerRole: params.ownerRole,
        resellerId: params.resellerId,
        repairCenterId: params.repairCenterId,
        customerId: params.customerId,
        fileUrl: `/api/repair-orders/${params.repairOrderId}/${params.documentType === 'intake' ? 'intake-document' : params.documentType === 'delivery' ? 'delivery-document' : params.documentType === 'diagnosis' ? 'diagnosis-document' : params.documentType === 'quote' ? 'quote-document' : 'labels'}`,
        fileName: `${params.documentType}-${params.orderNumber}.pdf`,
        mimeType: "application/pdf",
      });
      console.log("[DocumentRegistry] Repair document registered successfully:", params.documentType);
    } else {
      console.log("[DocumentRegistry] Document already exists, skipping:", params.documentType);
    }
  } catch (error) {
    console.error("[DocumentRegistry] Error in ensureRepairDocumentRegistered:", error);
    throw error;
  }
}

// Helper per registrare documenti POS (scontrini/ricevute)
export async function ensurePosReceiptRegistered(params: {
  transactionId: string;
  transactionNumber: string;
  isInvoice: boolean;
  ownerId: string;
  ownerRole: string;
  resellerId?: string;
  repairCenterId?: string;
  customerId?: string;
}): Promise<void> {
  const existingDocs = await storage.getDocumentsBySource("pos_transaction", params.transactionId);
  const docType = params.isInvoice ? "invoice" : "receipt";
  const alreadyExists = existingDocs.some(d => d.documentType === docType);
  
  if (!alreadyExists) {
    await registerDocument({
      title: buildDocumentTitle(docType, params.transactionNumber),
      documentType: docType,
      sourceType: "pos_transaction",
      sourceId: params.transactionId,
      sourceReference: params.transactionNumber,
      ownerId: params.ownerId,
      ownerRole: params.ownerRole,
      resellerId: params.resellerId,
      repairCenterId: params.repairCenterId,
      customerId: params.customerId,
      fileUrl: params.ownerRole === "repair_center" || params.ownerRole === "repair_center_staff"
        ? `/api/repair-center/pos/transaction/${params.transactionId}/receipt`
        : `/api/reseller/pos/transaction/${params.transactionId}/receipt`,
      fileName: `${docType}-${params.transactionNumber}.pdf`,
      mimeType: "application/pdf",
    });
  }
}

// Helper per registrare DDT trasferimenti warehouse
export async function ensureTransferDDTRegistered(params: {
  transferId: string;
  ddtNumber: string;
  ownerId: string;
  ownerRole: string;
  resellerId?: string;
  repairCenterId?: string;
}): Promise<void> {
  const existingDocs = await storage.getDocumentsBySource("warehouse_transfer", params.transferId);
  const alreadyExists = existingDocs.some(d => d.documentType === "shipping");
  
  if (!alreadyExists) {
    await registerDocument({
      title: buildDocumentTitle("shipping", params.ddtNumber),
      documentType: "shipping",
      sourceType: "warehouse_transfer",
      sourceId: params.transferId,
      sourceReference: params.ddtNumber,
      ownerId: params.ownerId,
      ownerRole: params.ownerRole,
      resellerId: params.resellerId,
      repairCenterId: params.repairCenterId,
      fileUrl: `/api/transfer-requests/${params.transferId}/ddt`,
      fileName: `DDT-${params.ddtNumber}.pdf`,
      mimeType: "application/pdf",
    });
  }
}

// Helper per registrare documenti B2B returns (etichette e DDT)
export async function ensureB2BReturnDocumentRegistered(params: {
  documentType: "label" | "shipping";
  returnId: string;
  returnNumber: string;
  ownerId: string;
  ownerRole: string;
  resellerId?: string;
}): Promise<void> {
  const existingDocs = await storage.getDocumentsBySource("b2b_return", params.returnId);
  const alreadyExists = existingDocs.some(d => d.documentType === params.documentType);
  
  if (!alreadyExists) {
    const endpoint = params.ownerRole === "admin" || params.ownerRole === "admin_staff"
      ? `/api/admin/b2b-returns/${params.returnId}/${params.documentType === "label" ? "label" : "ddt"}`
      : `/api/reseller/b2b-returns/${params.returnId}/${params.documentType === "label" ? "label" : "ddt"}`;
    
    await registerDocument({
      title: buildDocumentTitle(params.documentType, params.returnNumber),
      documentType: params.documentType,
      sourceType: "b2b_return",
      sourceId: params.returnId,
      sourceReference: params.returnNumber,
      ownerId: params.ownerId,
      ownerRole: params.ownerRole,
      resellerId: params.resellerId,
      fileUrl: endpoint,
      fileName: `${params.documentType === "label" ? "etichetta" : "ddt"}_${params.returnNumber}.pdf`,
      mimeType: "application/pdf",
    });
  }
}

// Helper per registrare DDT ordini servizio
export async function ensureServiceOrderDDTRegistered(params: {
  orderId: string;
  orderNumber: string;
  isRemoteRequest: boolean;
  ownerId: string;
  ownerRole: string;
  resellerId?: string;
  repairCenterId?: string;
  customerId?: string;
}): Promise<void> {
  const existingDocs = await storage.getDocumentsBySource("service_order", params.orderId);
  const alreadyExists = existingDocs.some(d => d.documentType === "shipping");
  
  if (!alreadyExists) {
    let fileUrl: string;
    if (params.ownerRole === "customer") {
      fileUrl = params.isRemoteRequest 
        ? `/api/customer/remote-requests/${params.orderId}/ddt`
        : `/api/customer/service-orders/${params.orderId}/ddt`;
    } else {
      fileUrl = `/api/reseller/service-orders/${params.orderId}/ddt`;
    }
    
    await registerDocument({
      title: buildDocumentTitle("shipping", params.orderNumber),
      documentType: "shipping",
      sourceType: "service_order",
      sourceId: params.orderId,
      sourceReference: params.orderNumber,
      ownerId: params.ownerId,
      ownerRole: params.ownerRole,
      resellerId: params.resellerId,
      repairCenterId: params.repairCenterId,
      customerId: params.customerId,
      fileUrl,
      fileName: `DDT-${params.orderNumber}.pdf`,
      mimeType: "application/pdf",
    });
  }
}

// Helper per registrare documenti data recovery
export async function ensureDataRecoveryDocumentRegistered(params: {
  documentType: "label" | "shipping";
  dataRecoveryId: string;
  reference: string;
  ownerId: string;
  ownerRole: string;
  resellerId?: string;
  repairCenterId?: string;
  customerId?: string;
}): Promise<void> {
  const existingDocs = await storage.getDocumentsBySource("data_recovery", params.dataRecoveryId);
  const alreadyExists = existingDocs.some(d => d.documentType === params.documentType);
  
  if (!alreadyExists) {
    const endpoint = params.documentType === "label"
      ? `/api/data-recovery/${params.dataRecoveryId}/label`
      : `/api/data-recovery/${params.dataRecoveryId}/shipping-document`;
    
    await registerDocument({
      title: buildDocumentTitle(params.documentType, params.reference),
      documentType: params.documentType,
      sourceType: "data_recovery",
      sourceId: params.dataRecoveryId,
      sourceReference: params.reference,
      ownerId: params.ownerId,
      ownerRole: params.ownerRole,
      resellerId: params.resellerId,
      repairCenterId: params.repairCenterId,
      customerId: params.customerId,
      fileUrl: endpoint,
      fileName: `${params.documentType === "label" ? "etichetta" : "spedizione"}-${params.reference}.pdf`,
      mimeType: "application/pdf",
    });
  }
}

// Helper per registrare documenti B2B orders (DDT spedizione, fatture)
export async function ensureB2BOrderDocumentRegistered(params: {
  orderId: string;
  orderNumber: string;
  documentType: "shipping" | "invoice" | "receipt";
  ownerId: string;
  ownerRole: string;
  resellerId?: string;
}): Promise<void> {
  const existingDocs = await storage.getDocumentsBySource("b2b_order", params.orderId);
  const alreadyExists = existingDocs.some(d => d.documentType === params.documentType);
  
  if (!alreadyExists) {
    const endpoint = params.documentType === "shipping" 
      ? `/api/admin/b2b-orders/${params.orderId}/ddt`
      : `/api/admin/b2b-orders/${params.orderId}/${params.documentType}`;
    
    await registerDocument({
      title: buildDocumentTitle(params.documentType, params.orderNumber),
      documentType: params.documentType,
      sourceType: "b2b_order",
      sourceId: params.orderId,
      sourceReference: params.orderNumber,
      ownerId: params.ownerId,
      ownerRole: params.ownerRole,
      resellerId: params.resellerId,
      fileUrl: endpoint,
      fileName: `${params.documentType === "shipping" ? "ddt" : params.documentType}_${params.orderNumber}.pdf`,
      mimeType: "application/pdf",
    });
  }
}

// Helper per registrare documenti Sales Orders (fatture, ricevute, DDT)
export async function ensureSalesOrderDocumentRegistered(params: {
  orderId: string;
  orderNumber: string;
  documentType: "shipping" | "invoice" | "receipt";
  ownerId: string;
  ownerRole: string;
  resellerId?: string;
  customerId?: string;
}): Promise<void> {
  const existingDocs = await storage.getDocumentsBySource("sales_order", params.orderId);
  const alreadyExists = existingDocs.some(d => d.documentType === params.documentType);
  
  if (!alreadyExists) {
    const endpoint = params.documentType === "shipping" 
      ? `/api/sales-orders/${params.orderId}/shipping-document`
      : `/api/sales-orders/${params.orderId}/${params.documentType}`;
    
    await registerDocument({
      title: buildDocumentTitle(params.documentType, params.orderNumber),
      documentType: params.documentType,
      sourceType: "sales_order",
      sourceId: params.orderId,
      sourceReference: params.orderNumber,
      ownerId: params.ownerId,
      ownerRole: params.ownerRole,
      resellerId: params.resellerId,
      customerId: params.customerId,
      fileUrl: endpoint,
      fileName: `${params.documentType}_${params.orderNumber}.pdf`,
      mimeType: "application/pdf",
    });
  }
}

// Helper per registrare documenti Supplier Orders (conferme, fatture)
export async function ensureSupplierOrderDocumentRegistered(params: {
  orderId: string;
  orderNumber: string;
  documentType: "invoice" | "receipt" | "other";
  ownerId: string;
  ownerRole: string;
  resellerId?: string;
  repairCenterId?: string;
}): Promise<void> {
  const existingDocs = await storage.getDocumentsBySource("supplier_order", params.orderId);
  const alreadyExists = existingDocs.some(d => d.documentType === params.documentType);
  
  if (!alreadyExists) {
    await registerDocument({
      title: buildDocumentTitle(params.documentType, params.orderNumber),
      documentType: params.documentType,
      sourceType: "supplier_order",
      sourceId: params.orderId,
      sourceReference: params.orderNumber,
      ownerId: params.ownerId,
      ownerRole: params.ownerRole,
      resellerId: params.resellerId,
      repairCenterId: params.repairCenterId,
      fileUrl: `/api/supplier-orders/${params.orderId}/document`,
      fileName: `${params.documentType}_${params.orderNumber}.pdf`,
      mimeType: "application/pdf",
    });
  }
}
