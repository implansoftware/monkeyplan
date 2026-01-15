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

  return storage.createDocument(doc);
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
