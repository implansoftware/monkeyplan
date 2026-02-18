import PDFDocument from "pdfkit";
import { format } from "date-fns";
import { it } from "date-fns/locale";

export interface PosReceiptData {
  transaction: {
    transactionNumber: string;
    dailyNumber?: number | null;
    createdAt: Date;
    subtotal: number;
    discountAmount: number;
    taxRate: number;
    taxAmount: number;
    total: number;
    paymentMethod: string;
    cashReceived: number | null;
    changeGiven: number | null;
    lotteryCode?: string | null;
    documentType?: string | null;
    rtStatus?: string | null;
    rtSubmissionId?: string | null;
    rtSubmittedAt?: Date | null;
    rtProvider?: string | null;
    rtDocumentUrl?: string | null;
  };
  items: Array<{
    productName: string;
    productSku?: string | null;
    quantity: number;
    unitPrice: number;
    discount: number;
    totalPrice: number;
    vatRate?: number | null;
  }>;
  repairCenter: {
    name: string;
    address?: string;
    city?: string;
    postalCode?: string;
    province?: string;
    phone?: string;
    email?: string;
    partitaIva?: string;
  };
  operator?: {
    fullName: string;
  };
  customer?: {
    fullName?: string;
    email?: string;
  } | null;
  billingData?: {
    companyName?: string;
    fiscalCode?: string;
    vatNumber?: string;
    address?: string;
    city?: string;
    postalCode?: string;
    province?: string;
  } | null;
  isInvoice: boolean;
}

const formatCurrency = (cents: number): string => {
  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100);
};

const paymentMethodLabels: Record<string, string> = {
  cash: "Contanti",
  card: "Carta",
  pos_terminal: "POS",
  mixed: "Misto",
};

interface VatBreakdown {
  rate: number;
  imponibile: number;
  iva: number;
  totale: number;
}

function computeVatBreakdown(items: PosReceiptData["items"]): VatBreakdown[] {
  const map: Record<number, VatBreakdown> = {};
  for (const item of items) {
    const rate = item.vatRate ?? 22;
    if (!map[rate]) map[rate] = { rate, imponibile: 0, iva: 0, totale: 0 };
    const itemIva = Math.round(item.totalPrice * rate / (100 + rate));
    map[rate].imponibile += item.totalPrice - itemIva;
    map[rate].iva += itemIva;
    map[rate].totale += item.totalPrice;
  }
  return Object.values(map).sort((a, b) => a.rate - b.rate);
}

export async function generatePosReceiptPdf(data: PosReceiptData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const { transaction, items, repairCenter, operator, customer, billingData, isInvoice } = data;
    
    let doc: PDFKit.PDFDocument;
    let margin: number;
    let contentWidth: number;
    let pageWidth: number;
    
    if (isInvoice) {
      doc = new PDFDocument({ 
        size: "A4",
        margin: 50,
        bufferPages: true
      });
      margin = 50;
      pageWidth = 595.28;
      contentWidth = pageWidth - margin * 2;
    } else {
      const receiptWidth = 226;
      margin = 10;
      contentWidth = receiptWidth - margin * 2;
      pageWidth = receiptWidth;
      const hasFiscalSection = transaction.rtStatus && transaction.rtStatus !== "not_required";
      const estimatedHeight = 350 + (items.length * 45) + 
        (isInvoice && billingData ? 80 : 0) +
        (hasFiscalSection ? 80 : 0);
      
      doc = new PDFDocument({ 
        size: [receiptWidth, Math.max(estimatedHeight, 450)],
        margin: margin,
        bufferPages: true
      });
    }
    
    const chunks: Buffer[] = [];

    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    let y = margin;

    if (isInvoice) {
      generateA4Invoice(doc, data, margin, contentWidth, pageWidth);
    } else {
      generateThermalReceipt(doc, data, margin, contentWidth, pageWidth);
    }

    doc.end();
  });
}

function generateA4Invoice(
  doc: PDFKit.PDFDocument, 
  data: PosReceiptData, 
  margin: number, 
  contentWidth: number,
  pageWidth: number
): void {
  const { transaction, items, repairCenter, operator, customer, billingData } = data;
  let y = margin;

  doc.fontSize(18).font("Helvetica-Bold");
  doc.text(repairCenter.name.toUpperCase(), margin, y, { 
    width: contentWidth, 
    align: "center" 
  });
  y += 25;

  doc.fontSize(10).font("Helvetica");
  if (repairCenter.address) {
    doc.text(repairCenter.address, margin, y, { width: contentWidth, align: "center" });
    y += 14;
  }
  if (repairCenter.city) {
    let cityLine = "";
    if (repairCenter.postalCode) cityLine = `${repairCenter.postalCode} `;
    cityLine += repairCenter.city;
    if (repairCenter.province) cityLine += ` (${repairCenter.province})`;
    doc.text(cityLine, margin, y, { width: contentWidth, align: "center" });
    y += 14;
  }
  if (repairCenter.phone) {
    doc.text(`Tel: ${repairCenter.phone}`, margin, y, { width: contentWidth, align: "center" });
    y += 14;
  }
  if (repairCenter.email) {
    doc.text(`Email: ${repairCenter.email}`, margin, y, { width: contentWidth, align: "center" });
    y += 14;
  }
  if (repairCenter.partitaIva) {
    doc.text(`P.IVA: ${repairCenter.partitaIva}`, margin, y, { width: contentWidth, align: "center" });
    y += 14;
  }

  y += 20;
  doc.moveTo(margin, y).lineTo(pageWidth - margin, y).stroke();
  y += 20;

  const docTypeLabel = transaction.documentType === "invoice" ? "FATTURA" : "DOCUMENTO COMMERCIALE";
  doc.fontSize(16).font("Helvetica-Bold");
  doc.text(docTypeLabel, margin, y, { width: contentWidth, align: "center" });
  y += 25;

  doc.fontSize(11).font("Helvetica");
  const numLabel = transaction.dailyNumber 
    ? `N. ${transaction.transactionNumber} (prog. ${transaction.dailyNumber})`
    : `N. ${transaction.transactionNumber}`;
  doc.text(numLabel, margin, y, { width: contentWidth, align: "center" });
  y += 16;
  doc.text(
    format(new Date(transaction.createdAt), "dd MMMM yyyy - HH:mm", { locale: it }),
    margin, y, 
    { width: contentWidth, align: "center" }
  );
  y += 25;

  if (billingData || customer) {
    doc.moveTo(margin, y).lineTo(pageWidth - margin, y).stroke();
    y += 15;
    
    doc.fontSize(11).font("Helvetica-Bold");
    doc.text("DATI CLIENTE", margin, y);
    y += 16;
    
    doc.font("Helvetica").fontSize(10);
    if (billingData?.companyName) {
      doc.text(billingData.companyName, margin, y);
      y += 14;
    } else if (customer?.fullName) {
      doc.text(customer.fullName, margin, y);
      y += 14;
    }
    if (customer?.email) {
      doc.text(`Email: ${customer.email}`, margin, y);
      y += 14;
    }
    if (billingData?.address) {
      doc.text(billingData.address, margin, y);
      y += 14;
    }
    if (billingData?.city) {
      let addr = "";
      if (billingData.postalCode) addr = `${billingData.postalCode} `;
      addr += billingData.city;
      if (billingData.province) addr += ` (${billingData.province})`;
      doc.text(addr, margin, y);
      y += 14;
    }
    if (billingData?.fiscalCode) {
      doc.text(`C.F.: ${billingData.fiscalCode}`, margin, y);
      y += 14;
    }
    if (billingData?.vatNumber) {
      doc.text(`P.IVA: ${billingData.vatNumber}`, margin, y);
      y += 14;
    }
    y += 10;
  }

  doc.moveTo(margin, y).lineTo(pageWidth - margin, y).stroke();
  y += 15;

  doc.fontSize(10).font("Helvetica-Bold");
  const colProduct = margin;
  const colQty = margin + contentWidth * 0.45;
  const colPrice = margin + contentWidth * 0.55;
  const colVat = margin + contentWidth * 0.7;
  const colTotal = margin + contentWidth * 0.85;

  doc.text("Prodotto", colProduct, y);
  doc.text("Qtà", colQty, y);
  doc.text("Prezzo", colPrice, y);
  doc.text("IVA%", colVat, y);
  doc.text("Totale", colTotal, y);
  y += 16;

  doc.moveTo(margin, y).lineTo(pageWidth - margin, y).stroke();
  y += 10;

  doc.font("Helvetica").fontSize(10);
  for (const item of items) {
    const productName = item.productName.length > 35 
      ? item.productName.substring(0, 35) + "..."
      : item.productName;
    
    doc.text(productName, colProduct, y, { width: contentWidth * 0.4 });
    doc.text(item.quantity.toString(), colQty, y);
    doc.text(formatCurrency(item.unitPrice), colPrice, y);
    doc.text(`${item.vatRate ?? 22}%`, colVat, y);
    doc.text(formatCurrency(item.totalPrice), colTotal, y);
    y += 18;
    
    if (item.discount > 0) {
      doc.fontSize(9).text(`  Sconto: -${formatCurrency(item.discount)}`, colProduct, y);
      y += 14;
    }
  }

  y += 10;
  doc.moveTo(margin, y).lineTo(pageWidth - margin, y).stroke();
  y += 20;

  const vatBreakdown = computeVatBreakdown(items);
  if (vatBreakdown.length > 1) {
    doc.fontSize(10).font("Helvetica-Bold");
    doc.text("RIEPILOGO IVA", margin, y);
    y += 16;

    doc.fontSize(9).font("Helvetica-Bold");
    const rColRate = margin;
    const rColImpon = margin + contentWidth * 0.25;
    const rColIva = margin + contentWidth * 0.5;
    const rColTot = margin + contentWidth * 0.75;
    doc.text("Aliquota", rColRate, y);
    doc.text("Imponibile", rColImpon, y);
    doc.text("IVA", rColIva, y);
    doc.text("Totale", rColTot, y);
    y += 14;

    doc.font("Helvetica").fontSize(9);
    for (const vb of vatBreakdown) {
      doc.text(`${vb.rate}%`, rColRate, y);
      doc.text(formatCurrency(vb.imponibile), rColImpon, y);
      doc.text(formatCurrency(vb.iva), rColIva, y);
      doc.text(formatCurrency(vb.totale), rColTot, y);
      y += 14;
    }
    y += 10;
    doc.moveTo(margin, y).lineTo(pageWidth - margin, y).stroke();
    y += 15;
  }

  const totalsX = margin + contentWidth * 0.6;
  const valuesX = margin + contentWidth * 0.85;

  doc.fontSize(10).font("Helvetica");
  doc.text("Subtotale:", totalsX, y);
  doc.text(formatCurrency(transaction.subtotal), valuesX, y);
  y += 16;

  if (transaction.discountAmount > 0) {
    doc.text("Sconto:", totalsX, y);
    doc.text(`-${formatCurrency(transaction.discountAmount)}`, valuesX, y);
    y += 16;
  }

  if (vatBreakdown.length === 1) {
    doc.text(`IVA (${vatBreakdown[0].rate}%):`, totalsX, y);
    doc.text(formatCurrency(transaction.taxAmount), valuesX, y);
    y += 20;
  } else {
    doc.text("Totale IVA:", totalsX, y);
    doc.text(formatCurrency(transaction.taxAmount), valuesX, y);
    y += 20;
  }

  doc.fontSize(12).font("Helvetica-Bold");
  doc.text("TOTALE:", totalsX, y);
  doc.text(formatCurrency(transaction.total), valuesX, y);
  y += 25;

  doc.moveTo(margin, y).lineTo(pageWidth - margin, y).stroke();
  y += 20;

  doc.fontSize(10).font("Helvetica");
  doc.text(`Metodo di pagamento: ${paymentMethodLabels[transaction.paymentMethod] || transaction.paymentMethod}`, margin, y);
  y += 16;

  if (transaction.paymentMethod === "cash" && transaction.cashReceived) {
    doc.text(`Importo ricevuto: ${formatCurrency(transaction.cashReceived)}`, margin, y);
    y += 14;
    if (transaction.changeGiven) {
      doc.text(`Resto: ${formatCurrency(transaction.changeGiven)}`, margin, y);
      y += 14;
    }
  }

  if (transaction.lotteryCode) {
    y += 5;
    doc.fontSize(10).font("Helvetica");
    doc.text(`Codice Lotteria: ${transaction.lotteryCode}`, margin, y);
    y += 14;
  }

  if (operator) {
    y += 10;
    doc.fontSize(9).text(`Operatore: ${operator.fullName}`, margin, y);
    y += 20;
  }

  if (transaction.rtStatus && transaction.rtStatus !== "not_required") {
    y += 10;
    doc.moveTo(margin, y).lineTo(pageWidth - margin, y).stroke();
    y += 15;

    doc.fontSize(11).font("Helvetica-Bold");
    doc.text("TRASMISSIONE FISCALE", margin, y, { width: contentWidth, align: "center" });
    y += 18;

    doc.fontSize(10).font("Helvetica");

    const rtStatusLabels: Record<string, string> = {
      submitted: "Inviato",
      confirmed: "Confermato",
      error: "Errore",
      pending: "In attesa",
    };
    doc.text(`Stato: ${rtStatusLabels[transaction.rtStatus] || transaction.rtStatus}`, margin, y);
    y += 14;

    if (transaction.rtProvider) {
      doc.text(`Provider: ${transaction.rtProvider}`, margin, y);
      y += 14;
    }

    if (transaction.rtSubmissionId) {
      doc.text(`ID Trasmissione: ${transaction.rtSubmissionId}`, margin, y);
      y += 14;
    }

    if (transaction.rtSubmittedAt) {
      doc.text(
        `Data invio: ${format(new Date(transaction.rtSubmittedAt), "dd/MM/yyyy HH:mm:ss", { locale: it })}`,
        margin, y
      );
      y += 14;
    }

    if (transaction.rtStatus === "confirmed") {
      y += 5;
      doc.fontSize(10).font("Helvetica-Bold");
      doc.text("DOCUMENTO FISCALMENTE VALIDO", margin, y, { width: contentWidth, align: "center" });
      y += 14;
    }
  }

  y += 30;
  doc.fontSize(10).font("Helvetica");
  doc.text("Grazie per la fiducia!", margin, y, { width: contentWidth, align: "center" });
}

function generateThermalReceipt(
  doc: PDFKit.PDFDocument, 
  data: PosReceiptData, 
  margin: number, 
  contentWidth: number,
  pageWidth: number
): void {
  const { transaction, items, repairCenter, operator, customer, billingData, isInvoice } = data;
  let y = margin;

  const drawDashedLine = () => {
    doc.fontSize(6).font("Courier");
    doc.text("-".repeat(34), margin, y, { width: contentWidth, align: "center" });
    y += 8;
  };

  doc.fontSize(10).font("Helvetica-Bold");
  doc.text(repairCenter.name.toUpperCase(), margin, y, { 
    width: contentWidth, 
    align: "center" 
  });
  y += 14;

  doc.fontSize(7).font("Helvetica");
  if (repairCenter.address) {
    doc.text(repairCenter.address, margin, y, { width: contentWidth, align: "center" });
    y += 9;
  }
  if (repairCenter.city) {
    let cityLine = "";
    if (repairCenter.postalCode) cityLine = `${repairCenter.postalCode} `;
    cityLine += repairCenter.city;
    if (repairCenter.province) cityLine += ` (${repairCenter.province})`;
    doc.text(cityLine, margin, y, { width: contentWidth, align: "center" });
    y += 9;
  }
  if (repairCenter.phone) {
    doc.text(`Tel: ${repairCenter.phone}`, margin, y, { width: contentWidth, align: "center" });
    y += 9;
  }
  if (repairCenter.partitaIva) {
    doc.text(`P.IVA: ${repairCenter.partitaIva}`, margin, y, { width: contentWidth, align: "center" });
    y += 9;
  }
  
  y += 5;
  drawDashedLine();

  const docLabel = transaction.documentType === "invoice" ? "DOCUMENTO COMMERCIALE" : "SCONTRINO";
  doc.fontSize(9).font("Helvetica-Bold");
  doc.text(docLabel, margin, y, { 
    width: contentWidth, 
    align: "center" 
  });
  y += 12;

  doc.fontSize(8).font("Helvetica");
  const numStr = transaction.dailyNumber 
    ? `N. ${transaction.transactionNumber} (${transaction.dailyNumber})`
    : `N. ${transaction.transactionNumber}`;
  doc.text(numStr, margin, y, { 
    width: contentWidth, 
    align: "center" 
  });
  y += 10;
  
  doc.fontSize(7);
  doc.text(
    format(new Date(transaction.createdAt), "dd/MM/yyyy HH:mm", { locale: it }),
    margin, y, 
    { width: contentWidth, align: "center" }
  );
  y += 10;

  drawDashedLine();

  for (const item of items) {
    doc.fontSize(7).font("Helvetica");
    
    const productName = item.productName.length > 28 
      ? item.productName.substring(0, 28) + "..."
      : item.productName;
    doc.text(productName, margin, y);
    y += 9;

    const vatLabel = (item.vatRate != null && item.vatRate !== 22) ? ` [${item.vatRate}%]` : "";
    const qtyPrice = `${item.quantity} x ${formatCurrency(item.unitPrice)}${vatLabel}`;
    const totalStr = formatCurrency(item.totalPrice);
    
    doc.text(qtyPrice, margin, y);
    doc.text(totalStr, margin, y, { width: contentWidth, align: "right" });
    y += 10;
    
    if (item.discount > 0) {
      doc.fontSize(6).text(`  Sconto: -${formatCurrency(item.discount)}`, margin, y);
      y += 8;
    }
  }

  drawDashedLine();

  doc.fontSize(7).font("Helvetica");
  doc.text("Subtotale:", margin, y);
  doc.text(formatCurrency(transaction.subtotal), margin, y, { 
    width: contentWidth, 
    align: "right" 
  });
  y += 10;

  if (transaction.discountAmount > 0) {
    doc.text("Sconto:", margin, y);
    doc.text(`-${formatCurrency(transaction.discountAmount)}`, margin, y, { 
      width: contentWidth, 
      align: "right" 
    });
    y += 10;
  }

  const vatBreakdown = computeVatBreakdown(items);
  if (vatBreakdown.length > 1) {
    drawDashedLine();
    doc.fontSize(7).font("Helvetica-Bold");
    doc.text("RIEPILOGO IVA", margin, y, { width: contentWidth, align: "center" });
    y += 10;
    doc.font("Helvetica").fontSize(6);
    for (const vb of vatBreakdown) {
      doc.text(`${vb.rate}%: Imp. ${formatCurrency(vb.imponibile)} IVA ${formatCurrency(vb.iva)}`, margin, y);
      y += 8;
    }
    drawDashedLine();
    doc.fontSize(7).font("Helvetica");
    doc.text("Totale IVA:", margin, y);
    doc.text(formatCurrency(transaction.taxAmount), margin, y, { 
      width: contentWidth, 
      align: "right" 
    });
    y += 12;
  } else {
    doc.text(`IVA (${vatBreakdown[0]?.rate ?? transaction.taxRate}%):`, margin, y);
    doc.text(formatCurrency(transaction.taxAmount), margin, y, { 
      width: contentWidth, 
      align: "right" 
    });
    y += 12;
  }

  doc.fontSize(9).font("Helvetica-Bold");
  doc.text("TOTALE:", margin, y);
  doc.text(formatCurrency(transaction.total), margin, y, { 
    width: contentWidth, 
    align: "right" 
  });
  y += 14;

  drawDashedLine();

  doc.fontSize(7).font("Helvetica");
  doc.text(`Pagamento: ${paymentMethodLabels[transaction.paymentMethod] || transaction.paymentMethod}`, margin, y);
  y += 10;

  if (transaction.paymentMethod === "cash" && transaction.cashReceived) {
    doc.text(`Ricevuto: ${formatCurrency(transaction.cashReceived)}`, margin, y);
    y += 9;
    if (transaction.changeGiven) {
      doc.text(`Resto: ${formatCurrency(transaction.changeGiven)}`, margin, y);
      y += 9;
    }
  }

  if (transaction.lotteryCode) {
    y += 3;
    doc.fontSize(7).font("Helvetica");
    doc.text(`Cod. Lotteria: ${transaction.lotteryCode}`, margin, y, { width: contentWidth, align: "center" });
    y += 10;
  }

  if (operator) {
    y += 5;
    doc.fontSize(6).text(`Op: ${operator.fullName}`, margin, y);
    y += 8;
  }

  if (transaction.rtStatus && transaction.rtStatus !== "not_required") {
    y += 5;
    drawDashedLine();

    doc.fontSize(7).font("Helvetica-Bold");
    doc.text("TRASMISSIONE FISCALE", margin, y, { width: contentWidth, align: "center" });
    y += 10;

    doc.fontSize(6).font("Helvetica");

    const rtStatusLabels: Record<string, string> = {
      submitted: "Inviato",
      confirmed: "Confermato",
      error: "Errore",
      pending: "In attesa",
    };
    doc.text(`Stato: ${rtStatusLabels[transaction.rtStatus] || transaction.rtStatus}`, margin, y);
    y += 8;

    if (transaction.rtProvider) {
      doc.text(`Provider: ${transaction.rtProvider}`, margin, y);
      y += 8;
    }

    if (transaction.rtSubmissionId) {
      const subId = transaction.rtSubmissionId.length > 30
        ? transaction.rtSubmissionId.substring(0, 30) + "..."
        : transaction.rtSubmissionId;
      doc.text(`ID: ${subId}`, margin, y);
      y += 8;
    }

    if (transaction.rtSubmittedAt) {
      doc.text(
        `Invio: ${format(new Date(transaction.rtSubmittedAt), "dd/MM/yy HH:mm", { locale: it })}`,
        margin, y
      );
      y += 8;
    }

    if (transaction.rtStatus === "confirmed") {
      y += 3;
      doc.fontSize(7).font("Helvetica-Bold");
      doc.text("DOC. FISCALE VALIDO", margin, y, { width: contentWidth, align: "center" });
      y += 10;
    }
  }

  y += 10;
  drawDashedLine();
  
  doc.fontSize(7).font("Helvetica");
  doc.text("Grazie per l'acquisto!", margin, y, { 
    width: contentWidth, 
    align: "center" 
  });
  y += 10;
  
  doc.text("Arrivederci", margin, y, { 
    width: contentWidth, 
    align: "center" 
  });
}
