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
    const doc = new PDFDocument({ size: "A4", margin: 40 });
    const chunks: Buffer[] = [];

    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const { transaction, items, repairCenter, operator, customer, billingData, isInvoice } = data;

    doc.fontSize(18).font("Helvetica-Bold").text(
      isInvoice ? "FATTURA DI VENDITA" : "SCONTRINO DI VENDITA",
      { align: "center" }
    );
    doc.moveDown(0.5);
    doc.fontSize(12).font("Helvetica").text(
      `N. ${transaction.transactionNumber}`,
      { align: "center" }
    );
    doc.fontSize(10).text(
      format(new Date(transaction.createdAt), "dd MMMM yyyy, HH:mm", { locale: it }),
      { align: "center" }
    );
    doc.moveDown(1);

    doc.fontSize(11).font("Helvetica-Bold").text("VENDITORE:");
    doc.fontSize(9).font("Helvetica");
    doc.text(repairCenter.name);
    if (repairCenter.address) doc.text(repairCenter.address);
    if (repairCenter.city) {
      let cityLine = repairCenter.city;
      if (repairCenter.postalCode) cityLine = `${repairCenter.postalCode} ${cityLine}`;
      if (repairCenter.province) cityLine += ` (${repairCenter.province})`;
      doc.text(cityLine);
    }
    if (repairCenter.phone) doc.text(`Tel: ${repairCenter.phone}`);
    if (repairCenter.email) doc.text(`Email: ${repairCenter.email}`);
    if (repairCenter.partitaIva) doc.text(`P.IVA: ${repairCenter.partitaIva}`);
    doc.moveDown(1);

    if (isInvoice && billingData) {
      doc.fontSize(11).font("Helvetica-Bold").text("CLIENTE:");
      doc.fontSize(9).font("Helvetica");
      if (billingData.companyName) doc.text(billingData.companyName);
      if (customer?.fullName && !billingData.companyName) doc.text(customer.fullName);
      if (billingData.fiscalCode) doc.text(`C.F.: ${billingData.fiscalCode}`);
      if (billingData.vatNumber) doc.text(`P.IVA: ${billingData.vatNumber}`);
      if (billingData.address) doc.text(billingData.address);
      if (billingData.city) {
        let cityLine = billingData.city;
        if (billingData.postalCode) cityLine = `${billingData.postalCode} ${cityLine}`;
        if (billingData.province) cityLine += ` (${billingData.province})`;
        doc.text(cityLine);
      }
      doc.moveDown(1);
    }

    doc.fontSize(11).font("Helvetica-Bold").text("PRODOTTI:");
    doc.moveDown(0.3);

    const tableTop = doc.y;
    const col1 = 40;
    const col2 = 280;
    const col3 = 340;
    const col4 = 400;
    const col5 = 470;

    doc.fontSize(8).font("Helvetica-Bold");
    doc.text("Descrizione", col1, tableTop);
    doc.text("Q.tà", col2, tableTop);
    doc.text("Prezzo", col3, tableTop);
    doc.text("Sconto", col4, tableTop);
    doc.text("Totale", col5, tableTop);

    doc.moveTo(col1, tableTop + 12).lineTo(555, tableTop + 12).stroke();

    let y = tableTop + 18;
    doc.font("Helvetica");
    for (const item of items) {
      doc.text(item.productName.substring(0, 40), col1, y, { width: 230 });
      doc.text(String(item.quantity), col2, y);
      doc.text(formatCurrency(item.unitPrice), col3, y);
      doc.text(item.discount > 0 ? formatCurrency(item.discount) : "-", col4, y);
      doc.text(formatCurrency(item.totalPrice), col5, y);
      y += 15;
      if (y > 700) {
        doc.addPage();
        y = 40;
      }
    }

    doc.moveTo(col1, y + 5).lineTo(555, y + 5).stroke();
    y += 15;

    doc.fontSize(9).font("Helvetica");
    doc.text("Subtotale:", 380, y);
    doc.text(formatCurrency(transaction.subtotal), col5, y);
    y += 14;

    if (transaction.discountAmount > 0) {
      doc.text("Sconto:", 380, y);
      doc.text(`-${formatCurrency(transaction.discountAmount)}`, col5, y);
      y += 14;
    }

    doc.text(`IVA (${transaction.taxRate}%):`, 380, y);
    doc.text(formatCurrency(transaction.taxAmount), col5, y);
    y += 14;

    doc.fontSize(11).font("Helvetica-Bold");
    doc.text("TOTALE:", 380, y);
    doc.text(formatCurrency(transaction.total), col5, y);
    y += 25;

    doc.fontSize(9).font("Helvetica");
    doc.text(`Pagamento: ${paymentMethodLabels[transaction.paymentMethod] || transaction.paymentMethod}`, col1, y);
    y += 12;

    if (transaction.paymentMethod === "cash" && transaction.cashReceived) {
      doc.text(`Ricevuto: ${formatCurrency(transaction.cashReceived)}`, col1, y);
      y += 12;
      if (transaction.changeGiven) {
        doc.text(`Resto: ${formatCurrency(transaction.changeGiven)}`, col1, y);
        y += 12;
      }
    }

    if (operator) {
      y += 10;
      doc.text(`Operatore: ${operator.fullName}`, col1, y);
    }

    y += 30;
    doc.fontSize(8).font("Helvetica").text(
      "Grazie per il vostro acquisto!",
      col1, y,
      { align: "center", width: 515 }
    );

    doc.end();
  });
}
