import PDFDocument from "pdfkit";
import { objectStorageClient, parseObjectPath } from "../objectStorage";
import { B2bReturn, B2bReturnItem, User, Product, Warehouse } from "@shared/schema";
import { format } from "date-fns";
import { it } from "date-fns/locale";

export interface TransferDdtData {
  ddtNumber: string;
  requestNumber: string;
  shippedAt: Date;
  trackingNumber: string;
  trackingCarrier: string;
  sender: {
    name: string;
    address?: string;
    city?: string;
    postalCode?: string;
    province?: string;
    phone?: string;
    email?: string;
    partitaIva?: string;
  };
  recipient: {
    name: string;
    address?: string;
    city?: string;
    postalCode?: string;
    province?: string;
    phone?: string;
    email?: string;
    partitaIva?: string;
  };
  items: Array<{
    productName: string;
    productSku?: string;
    quantity: number;
  }>;
  sourceWarehouse: string;
  destinationWarehouse: string;
}

interface ReturnDocumentData {
  returnData: B2bReturn;
  items: B2bReturnItem[];
  reseller: User;
  adminAddress: {
    companyName: string;
    address: string;
    city: string;
    postalCode: string;
    province: string;
    country: string;
    phone?: string;
    email?: string;
  };
}

function getPrivateObjectDir(): string {
  const dir = process.env.PRIVATE_OBJECT_DIR || "";
  if (!dir) {
    throw new Error("PRIVATE_OBJECT_DIR not set");
  }
  return dir;
}

async function uploadPdfToStorage(
  pdfBuffer: Buffer,
  filename: string
): Promise<string> {
  const privateDir = getPrivateObjectDir();
  const fullPath = `${privateDir}/returns/${filename}`;
  const { bucketName, objectName } = parseObjectPath(fullPath);
  
  const bucket = objectStorageClient.bucket(bucketName);
  const file = bucket.file(objectName);
  
  await file.save(pdfBuffer, {
    contentType: "application/pdf",
    metadata: {
      cacheControl: "private, max-age=31536000",
    },
  });
  
  return fullPath;
}

export async function generateShippingLabel(
  data: ReturnDocumentData
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A5", margin: 30 });
    const chunks: Buffer[] = [];

    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const { returnData, reseller, adminAddress } = data;

    doc.fontSize(16).font("Helvetica-Bold").text("ETICHETTA SPEDIZIONE RESO", { align: "center" });
    doc.moveDown(0.5);
    
    doc.fontSize(10).font("Helvetica").text(`Numero Reso: ${returnData.returnNumber}`, { align: "center" });
    doc.moveDown(1.5);

    doc.fontSize(12).font("Helvetica-Bold").text("MITTENTE:");
    doc.fontSize(10).font("Helvetica");
    doc.text(reseller.ragioneSociale || reseller.fullName || reseller.username || "");
    if (reseller.indirizzo) doc.text(reseller.indirizzo);
    if (reseller.citta) {
      let cityLine = reseller.citta;
      if (reseller.cap) cityLine = `${reseller.cap} ${cityLine}`;
      if (reseller.provincia) cityLine += ` (${reseller.provincia})`;
      doc.text(cityLine);
    }
    if (reseller.phone) doc.text(`Tel: ${reseller.phone}`);
    if (reseller.email) doc.text(`Email: ${reseller.email}`);
    
    doc.moveDown(1);

    doc.fontSize(12).font("Helvetica-Bold").text("DESTINATARIO:");
    doc.fontSize(10).font("Helvetica");
    doc.text(adminAddress.companyName);
    doc.text(adminAddress.address);
    doc.text(`${adminAddress.postalCode} ${adminAddress.city} (${adminAddress.province})`);
    doc.text(adminAddress.country);
    if (adminAddress.phone) doc.text(`Tel: ${adminAddress.phone}`);
    if (adminAddress.email) doc.text(`Email: ${adminAddress.email}`);

    doc.moveDown(1.5);

    doc.rect(30, doc.y, doc.page.width - 60, 60).stroke();
    doc.moveDown(0.3);
    doc.fontSize(10).font("Helvetica-Bold").text("NUMERO RMA:", { align: "center" });
    doc.fontSize(18).font("Helvetica-Bold").text(returnData.returnNumber, { align: "center" });

    doc.moveDown(2);
    doc.fontSize(8).font("Helvetica").fillColor("gray");
    doc.text(`Data generazione: ${format(new Date(), "dd/MM/yyyy HH:mm", { locale: it })}`, { align: "center" });

    doc.end();
  });
}

export async function generateDDT(
  data: ReturnDocumentData
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 40 });
    const chunks: Buffer[] = [];

    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const { returnData, items, reseller, adminAddress } = data;

    doc.fontSize(18).font("Helvetica-Bold").text("DOCUMENTO DI TRASPORTO", { align: "center" });
    doc.fontSize(10).font("Helvetica").text("(D.D.T. - Art. 1 D.P.R. 472/96)", { align: "center" });
    doc.moveDown(0.5);
    doc.fontSize(12).font("Helvetica-Bold").text(`Reso n. ${returnData.returnNumber}`, { align: "center" });
    doc.moveDown(1);

    const startY = doc.y;
    const halfWidth = (doc.page.width - 80) / 2;

    doc.fontSize(10).font("Helvetica-Bold").text("MITTENTE:", 40, startY);
    doc.fontSize(9).font("Helvetica");
    let y = doc.y;
    doc.text(reseller.ragioneSociale || reseller.fullName || reseller.username || "", 40, y);
    y = doc.y;
    if (reseller.indirizzo) { doc.text(reseller.indirizzo, 40, y); y = doc.y; }
    if (reseller.citta) {
      let cityLine = reseller.citta;
      if (reseller.cap) cityLine = `${reseller.cap} ${cityLine}`;
      if (reseller.provincia) cityLine += ` (${reseller.provincia})`;
      doc.text(cityLine, 40, y);
      y = doc.y;
    }
    if (reseller.phone) { doc.text(`Tel: ${reseller.phone}`, 40, y); y = doc.y; }
    if (reseller.partitaIva) { doc.text(`P.IVA: ${reseller.partitaIva}`, 40, y); y = doc.y; }

    const destX = 40 + halfWidth + 20;
    doc.fontSize(10).font("Helvetica-Bold").text("DESTINATARIO:", destX, startY);
    doc.fontSize(9).font("Helvetica");
    let dy = startY + 12;
    doc.text(adminAddress.companyName, destX, dy); dy += 12;
    doc.text(adminAddress.address, destX, dy); dy += 12;
    doc.text(`${adminAddress.postalCode} ${adminAddress.city} (${adminAddress.province})`, destX, dy); dy += 12;
    doc.text(adminAddress.country, destX, dy); dy += 12;
    if (adminAddress.phone) { doc.text(`Tel: ${adminAddress.phone}`, destX, dy); dy += 12; }

    doc.moveDown(4);

    const infoY = doc.y;
    doc.fontSize(9).font("Helvetica-Bold");
    doc.text("Data documento:", 40, infoY);
    doc.font("Helvetica").text(format(new Date(), "dd/MM/yyyy", { locale: it }), 130, infoY);
    
    doc.font("Helvetica-Bold").text("Causale trasporto:", 250, infoY);
    doc.font("Helvetica").text("RESO MERCE", 350, infoY);

    doc.moveDown(2);

    const tableTop = doc.y + 10;
    const tableLeft = 40;
    const colWidths = [200, 60, 80, 80, 90];
    const headers = ["Descrizione", "Qtà", "Prezzo Unit.", "Totale", "Condizione"];
    
    doc.fontSize(9).font("Helvetica-Bold");
    let xPos = tableLeft;
    headers.forEach((header, i) => {
      doc.text(header, xPos, tableTop, { width: colWidths[i], align: i === 0 ? "left" : "center" });
      xPos += colWidths[i];
    });

    doc.moveTo(tableLeft, tableTop + 15)
       .lineTo(tableLeft + colWidths.reduce((a, b) => a + b, 0), tableTop + 15)
       .stroke();

    doc.font("Helvetica");
    let rowY = tableTop + 20;
    let totalAmount = 0;

    items.forEach((item) => {
      xPos = tableLeft;
      const itemTotal = (item.unitPrice || 0) * (item.quantity || 1);
      totalAmount += itemTotal;

      doc.text(item.productName || "", xPos, rowY, { width: colWidths[0] });
      xPos += colWidths[0];
      doc.text(String(item.quantity || 1), xPos, rowY, { width: colWidths[1], align: "center" });
      xPos += colWidths[1];
      doc.text(`€ ${((item.unitPrice || 0) / 100).toFixed(2)}`, xPos, rowY, { width: colWidths[2], align: "center" });
      xPos += colWidths[2];
      doc.text(`€ ${(itemTotal / 100).toFixed(2)}`, xPos, rowY, { width: colWidths[3], align: "center" });
      xPos += colWidths[3];
      doc.text(item.condition || "Da verificare", xPos, rowY, { width: colWidths[4], align: "center" });
      
      rowY += 18;
    });

    doc.moveTo(tableLeft, rowY)
       .lineTo(tableLeft + colWidths.reduce((a, b) => a + b, 0), rowY)
       .stroke();

    rowY += 10;
    doc.font("Helvetica-Bold");
    doc.text("TOTALE ARTICOLI:", tableLeft + colWidths[0] + colWidths[1], rowY);
    doc.text(`€ ${(totalAmount / 100).toFixed(2)}`, tableLeft + colWidths[0] + colWidths[1] + colWidths[2], rowY, { width: colWidths[3], align: "center" });

    if (returnData.reason) {
      doc.moveDown(2);
      doc.font("Helvetica-Bold").text("Motivo reso:", 40);
      const reasonLabels: Record<string, string> = {
        defective: "Difettoso",
        wrong_item: "Articolo errato",
        not_as_described: "Non conforme alla descrizione",
        damaged_in_transit: "Danneggiato in transito",
        excess_stock: "Eccesso di stock",
        quality_issue: "Problema qualità",
        other: "Altro",
      };
      doc.font("Helvetica").text(reasonLabels[returnData.reason] || returnData.reason);
      if (returnData.reasonDetails) {
        doc.text(returnData.reasonDetails);
      }
    }

    if (returnData.resellerNotes) {
      doc.moveDown(1);
      doc.font("Helvetica-Bold").text("Note:", 40);
      doc.font("Helvetica").text(returnData.resellerNotes);
    }

    const footerY = doc.page.height - 120;
    doc.fontSize(9).font("Helvetica");
    
    doc.text("Firma Mittente:", 40, footerY);
    doc.moveTo(40, footerY + 40).lineTo(200, footerY + 40).stroke();
    
    doc.text("Firma Vettore:", 250, footerY);
    doc.moveTo(250, footerY + 40).lineTo(410, footerY + 40).stroke();
    
    doc.text("Data e Ora Ritiro:", 40, footerY + 50);
    doc.moveTo(130, footerY + 50).lineTo(200, footerY + 50).stroke();

    doc.fontSize(8).fillColor("gray");
    doc.text(`Documento generato il ${format(new Date(), "dd/MM/yyyy HH:mm", { locale: it })}`, 40, doc.page.height - 40, { align: "center" });

    doc.end();
  });
}

export async function generateAndStoreReturnDocuments(
  data: ReturnDocumentData
): Promise<{ labelPath: string; ddtPath: string }> {
  const timestamp = Date.now();
  const returnNumber = data.returnData.returnNumber.replace(/[^a-zA-Z0-9-]/g, "_");

  const [labelBuffer, ddtBuffer] = await Promise.all([
    generateShippingLabel(data),
    generateDDT(data),
  ]);

  const [labelPath, ddtPath] = await Promise.all([
    uploadPdfToStorage(labelBuffer, `${returnNumber}_label_${timestamp}.pdf`),
    uploadPdfToStorage(ddtBuffer, `${returnNumber}_ddt_${timestamp}.pdf`),
  ]);

  return { labelPath, ddtPath };
}

const REPLIT_SIDECAR_ENDPOINT = "http://127.0.0.1:1106";

export async function getSignedDownloadUrl(
  objectPath: string,
  ttlSec: number = 3600
): Promise<string> {
  const { bucketName, objectName } = parseObjectPath(objectPath);
  
  const request = {
    bucket_name: bucketName,
    object_name: objectName,
    method: "GET",
    expires_at: new Date(Date.now() + ttlSec * 1000).toISOString(),
  };
  
  const response = await fetch(
    `${REPLIT_SIDECAR_ENDPOINT}/object-storage/signed-object-url`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    }
  );
  
  if (!response.ok) {
    throw new Error(
      `Impossibile generare URL firmato, errore: ${response.status}`
    );
  }

  const { signed_url: signedURL } = await response.json();
  return signedURL;
}

const carrierLabels: Record<string, string> = {
  brt: "BRT/Bartolini",
  gls: "GLS",
  dhl: "DHL",
  ups: "UPS",
  fedex: "FedEx",
  poste_italiane: "Poste Italiane",
  sda: "SDA",
  tnt: "TNT",
  other: "Altro",
};

export async function generateTransferDDT(data: TransferDdtData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 40 });
    const chunks: Buffer[] = [];

    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    doc.fontSize(18).font("Helvetica-Bold").text("DOCUMENTO DI TRASPORTO", { align: "center" });
    doc.fontSize(10).font("Helvetica").text("(D.D.T. - Art. 1 D.P.R. 472/96)", { align: "center" });
    doc.moveDown(0.5);
    doc.fontSize(14).font("Helvetica-Bold").text(`N. ${data.ddtNumber}`, { align: "center" });
    doc.fontSize(10).font("Helvetica").text(`Rif. Richiesta: ${data.requestNumber}`, { align: "center" });
    doc.moveDown(1);

    const startY = doc.y;
    const halfWidth = (doc.page.width - 80) / 2;

    doc.fontSize(11).font("Helvetica-Bold").text("MITTENTE:", 40, startY);
    doc.fontSize(9).font("Helvetica");
    let y = doc.y;
    doc.text(data.sender.name, 40, y); y = doc.y;
    if (data.sender.address) { doc.text(data.sender.address, 40, y); y = doc.y; }
    if (data.sender.city) {
      let cityLine = data.sender.city;
      if (data.sender.postalCode) cityLine = `${data.sender.postalCode} ${cityLine}`;
      if (data.sender.province) cityLine += ` (${data.sender.province})`;
      doc.text(cityLine, 40, y); y = doc.y;
    }
    if (data.sender.phone) { doc.text(`Tel: ${data.sender.phone}`, 40, y); y = doc.y; }
    if (data.sender.email) { doc.text(`Email: ${data.sender.email}`, 40, y); y = doc.y; }
    if (data.sender.partitaIva) { doc.text(`P.IVA: ${data.sender.partitaIva}`, 40, y); y = doc.y; }

    const destX = 40 + halfWidth + 20;
    doc.fontSize(11).font("Helvetica-Bold").text("DESTINATARIO:", destX, startY);
    doc.fontSize(9).font("Helvetica");
    let dy = startY + 14;
    doc.text(data.recipient.name, destX, dy); dy += 12;
    if (data.recipient.address) { doc.text(data.recipient.address, destX, dy); dy += 12; }
    if (data.recipient.city) {
      let cityLine = data.recipient.city;
      if (data.recipient.postalCode) cityLine = `${data.recipient.postalCode} ${cityLine}`;
      if (data.recipient.province) cityLine += ` (${data.recipient.province})`;
      doc.text(cityLine, destX, dy); dy += 12;
    }
    if (data.recipient.phone) { doc.text(`Tel: ${data.recipient.phone}`, destX, dy); dy += 12; }
    if (data.recipient.email) { doc.text(`Email: ${data.recipient.email}`, destX, dy); dy += 12; }
    if (data.recipient.partitaIva) { doc.text(`P.IVA: ${data.recipient.partitaIva}`, destX, dy); dy += 12; }

    doc.moveDown(4);

    const infoY = doc.y;
    doc.fontSize(9).font("Helvetica-Bold");
    doc.text("Data documento:", 40, infoY);
    doc.font("Helvetica").text(format(data.shippedAt, "dd/MM/yyyy", { locale: it }), 130, infoY);
    
    doc.font("Helvetica-Bold").text("Causale trasporto:", 250, infoY);
    doc.font("Helvetica").text("TRASFERIMENTO MERCE", 350, infoY);

    const infoY2 = infoY + 15;
    doc.font("Helvetica-Bold").text("Magazzino Origine:", 40, infoY2);
    doc.font("Helvetica").text(data.sourceWarehouse, 150, infoY2);
    
    doc.font("Helvetica-Bold").text("Magazzino Dest.:", 300, infoY2);
    doc.font("Helvetica").text(data.destinationWarehouse, 400, infoY2);

    const infoY3 = infoY2 + 15;
    doc.font("Helvetica-Bold").text("Corriere:", 40, infoY3);
    doc.font("Helvetica").text(carrierLabels[data.trackingCarrier] || data.trackingCarrier, 100, infoY3);
    
    doc.font("Helvetica-Bold").text("Tracking:", 200, infoY3);
    doc.font("Helvetica").text(data.trackingNumber, 260, infoY3);

    doc.moveDown(3);

    const tableTop = doc.y + 10;
    const tableLeft = 40;
    const colWidths = [30, 250, 160, 70];
    const headers = ["#", "Descrizione Prodotto", "Codice", "Quantità"];
    
    doc.fontSize(9).font("Helvetica-Bold");
    let xPos = tableLeft;
    headers.forEach((header, i) => {
      doc.text(header, xPos + 5, tableTop);
      xPos += colWidths[i];
    });

    doc.moveTo(tableLeft, tableTop + 14).lineTo(tableLeft + colWidths.reduce((a, b) => a + b, 0), tableTop + 14).stroke();

    doc.font("Helvetica");
    let rowY = tableTop + 20;
    data.items.forEach((item, index) => {
      xPos = tableLeft;
      doc.text(String(index + 1), xPos + 5, rowY);
      xPos += colWidths[0];
      doc.text(item.productName, xPos + 5, rowY, { width: colWidths[1] - 10 });
      xPos += colWidths[1];
      doc.text(item.productSku || "-", xPos + 5, rowY, { width: colWidths[2] - 10 });
      xPos += colWidths[2];
      doc.text(String(item.quantity), xPos + 5, rowY, { width: colWidths[3] - 10, align: 'left' });
      rowY += 18;
    });

    doc.moveTo(tableLeft, rowY).lineTo(tableLeft + colWidths.reduce((a, b) => a + b, 0), rowY).stroke();

    doc.moveDown(2);
    doc.y = rowY + 20;
    doc.fontSize(10).font("Helvetica-Bold");
    doc.text(`Totale Colli: ${data.items.reduce((sum, item) => sum + item.quantity, 0)}`, 40);

    const footerY = doc.page.height - 130;
    doc.fontSize(9).font("Helvetica");
    
    doc.text("Firma Mittente:", 40, footerY);
    doc.moveTo(40, footerY + 40).lineTo(200, footerY + 40).stroke();
    
    doc.text("Firma Vettore:", 250, footerY);
    doc.moveTo(250, footerY + 40).lineTo(410, footerY + 40).stroke();
    
    doc.text("Data e Ora Ritiro:", 40, footerY + 55);
    doc.moveTo(130, footerY + 55).lineTo(250, footerY + 55).stroke();

    doc.fontSize(8).fillColor("gray");
    doc.text(`Documento generato automaticamente il ${format(new Date(), "dd/MM/yyyy HH:mm", { locale: it })}`, 40, doc.page.height - 50, { align: "center" });

    doc.end();
  });
}
