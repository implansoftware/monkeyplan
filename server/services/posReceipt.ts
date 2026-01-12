import PDFDocument from "pdfkit";
import { format } from "date-fns";
import { it } from "date-fns/locale";

export interface PosReceiptData {
  transaction: {
    transactionNumber: string;
    createdAt: Date;
    subtotal: number;
    discountAmount: number;
    taxRate: number;
    taxAmount: number;
    total: number;
    paymentMethod: string;
    cashReceived: number | null;
    changeGiven: number | null;
  };
  items: Array<{
    productName: string;
    productSku?: string | null;
    quantity: number;
    unitPrice: number;
    discount: number;
    totalPrice: number;
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
  satispay: "Satispay",
  mixed: "Misto",
};

export async function generatePosReceiptPdf(data: PosReceiptData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const receiptWidth = 226;
    const margin = 10;
    const contentWidth = receiptWidth - margin * 2;
    
    const estimatedHeight = 300 + (data.items.length * 45) + 
      (data.isInvoice && data.billingData ? 80 : 0);
    
    const doc = new PDFDocument({ 
      size: [receiptWidth, Math.max(estimatedHeight, 400)],
      margin: margin,
      bufferPages: true
    });
    const chunks: Buffer[] = [];

    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const { transaction, items, repairCenter, operator, customer, billingData, isInvoice } = data;
    
    const centerX = receiptWidth / 2;
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

    doc.fontSize(9).font("Helvetica-Bold");
    doc.text(isInvoice ? "FATTURA" : "SCONTRINO", margin, y, { 
      width: contentWidth, 
      align: "center" 
    });
    y += 12;

    doc.fontSize(8).font("Helvetica");
    doc.text(`N. ${transaction.transactionNumber}`, margin, y, { 
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

    if (isInvoice && billingData) {
      drawDashedLine();
      doc.fontSize(7).font("Helvetica-Bold");
      doc.text("CLIENTE:", margin, y);
      y += 9;
      doc.font("Helvetica");
      if (billingData.companyName) {
        doc.text(billingData.companyName, margin, y);
        y += 9;
      } else if (customer?.fullName) {
        doc.text(customer.fullName, margin, y);
        y += 9;
      }
      if (billingData.fiscalCode) {
        doc.text(`C.F.: ${billingData.fiscalCode}`, margin, y);
        y += 9;
      }
      if (billingData.vatNumber) {
        doc.text(`P.IVA: ${billingData.vatNumber}`, margin, y);
        y += 9;
      }
    }

    drawDashedLine();

    for (const item of items) {
      doc.fontSize(7).font("Helvetica");
      
      const productName = item.productName.length > 28 
        ? item.productName.substring(0, 28) + "..."
        : item.productName;
      doc.text(productName, margin, y);
      y += 9;

      const qtyPrice = `${item.quantity} x ${formatCurrency(item.unitPrice)}`;
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

    doc.text(`IVA (${transaction.taxRate}%):`, margin, y);
    doc.text(formatCurrency(transaction.taxAmount), margin, y, { 
      width: contentWidth, 
      align: "right" 
    });
    y += 12;

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

    if (operator) {
      y += 5;
      doc.fontSize(6).text(`Op: ${operator.fullName}`, margin, y);
      y += 8;
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

    doc.end();
  });
}
