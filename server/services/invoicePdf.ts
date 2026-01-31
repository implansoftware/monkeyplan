import PDFDocument from "pdfkit";
import { Invoice, User } from "@shared/schema";
import { format } from "date-fns";
import { it } from "date-fns/locale";

interface InvoicePdfData {
  invoice: Invoice;
  issuer: {
    name: string;
    address?: string;
    city?: string;
    postalCode?: string;
    province?: string;
    vatNumber?: string;
    fiscalCode?: string;
    phone?: string;
    email?: string;
    pec?: string;
    iban?: string;
  };
  customer: {
    name: string;
    address?: string;
    city?: string;
    postalCode?: string;
    province?: string;
    vatNumber?: string;
    fiscalCode?: string;
    email?: string;
  };
  items?: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
}

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100);
}

export async function generateInvoicePdf(data: InvoicePdfData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 50 });
    const chunks: Buffer[] = [];

    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const { invoice, issuer, customer, items } = data;
    const pageWidth = doc.page.width - 100;

    doc.fontSize(20).font("Helvetica-Bold").text("FATTURA", { align: "center" });
    doc.moveDown(0.5);
    doc.fontSize(14).font("Helvetica").text(invoice.invoiceNumber, { align: "center" });
    doc.moveDown(1.5);

    const startY = doc.y;
    doc.fontSize(10).font("Helvetica-Bold").text("EMITTENTE", 50, startY);
    doc.font("Helvetica");
    doc.text(issuer.name, 50, doc.y + 5);
    if (issuer.address) doc.text(issuer.address);
    if (issuer.city) {
      const cityLine = [issuer.postalCode, issuer.city, issuer.province].filter(Boolean).join(" ");
      doc.text(cityLine);
    }
    if (issuer.vatNumber) doc.text(`P.IVA: ${issuer.vatNumber}`);
    if (issuer.fiscalCode) doc.text(`C.F.: ${issuer.fiscalCode}`);
    if (issuer.phone) doc.text(`Tel: ${issuer.phone}`);
    if (issuer.email) doc.text(`Email: ${issuer.email}`);
    if (issuer.pec) doc.text(`PEC: ${issuer.pec}`);
    const issuerEndY = doc.y;

    doc.font("Helvetica-Bold").text("CLIENTE", 320, startY);
    doc.font("Helvetica");
    doc.text(customer.name, 320, doc.y + 5);
    if (customer.address) doc.text(customer.address, 320);
    if (customer.city) {
      const cityLine = [customer.postalCode, customer.city, customer.province].filter(Boolean).join(" ");
      doc.text(cityLine, 320);
    }
    if (customer.vatNumber) doc.text(`P.IVA: ${customer.vatNumber}`, 320);
    if (customer.fiscalCode) doc.text(`C.F.: ${customer.fiscalCode}`, 320);
    if (customer.email) doc.text(`Email: ${customer.email}`, 320);

    doc.y = Math.max(issuerEndY, doc.y) + 30;

    doc.moveTo(50, doc.y).lineTo(pageWidth + 50, doc.y).stroke();
    doc.moveDown(1);

    doc.fontSize(10);
    const infoY = doc.y;
    doc.font("Helvetica-Bold").text("Data Emissione:", 50, infoY);
    doc.font("Helvetica").text(format(new Date(invoice.createdAt), "dd/MM/yyyy", { locale: it }), 140, infoY);
    
    doc.font("Helvetica-Bold").text("Scadenza:", 250, infoY);
    doc.font("Helvetica").text(
      invoice.dueDate ? format(new Date(invoice.dueDate), "dd/MM/yyyy", { locale: it }) : "N/D",
      310, infoY
    );
    
    doc.font("Helvetica-Bold").text("Metodo Pagamento:", 400, infoY);
    doc.font("Helvetica").text(
      invoice.paymentMethod?.replace("_", " ") || "Bonifico Bancario",
      500, infoY
    );

    doc.moveDown(2);

    if (items && items.length > 0) {
      const tableTop = doc.y;
      const colWidths = [250, 60, 90, 90];
      const cols = [50, 300, 360, 450];
      
      doc.rect(50, tableTop, pageWidth, 20).fill("#f0f0f0");
      doc.fillColor("#000000");
      doc.font("Helvetica-Bold").fontSize(9);
      doc.text("Descrizione", cols[0] + 5, tableTop + 5);
      doc.text("Qtà", cols[1] + 5, tableTop + 5);
      doc.text("Prezzo Unit.", cols[2] + 5, tableTop + 5);
      doc.text("Totale", cols[3] + 5, tableTop + 5);

      let rowY = tableTop + 25;
      doc.font("Helvetica").fontSize(9);
      
      items.forEach((item, index) => {
        if (index % 2 === 0) {
          doc.rect(50, rowY - 3, pageWidth, 18).fill("#fafafa");
          doc.fillColor("#000000");
        }
        doc.text(item.description, cols[0] + 5, rowY, { width: colWidths[0] - 10 });
        doc.text(item.quantity.toString(), cols[1] + 5, rowY);
        doc.text(formatCurrency(item.unitPrice), cols[2] + 5, rowY);
        doc.text(formatCurrency(item.total), cols[3] + 5, rowY);
        rowY += 20;
      });

      doc.y = rowY + 10;
    } else {
      doc.font("Helvetica").fontSize(10);
      doc.text("Vedi dettagli ordine allegato", 50);
      doc.moveDown(1);
    }

    doc.moveTo(50, doc.y).lineTo(pageWidth + 50, doc.y).stroke();
    doc.moveDown(1);

    const totalsX = 380;
    doc.font("Helvetica").fontSize(10);
    
    doc.text("Imponibile:", totalsX, doc.y);
    doc.text(formatCurrency(invoice.amount), totalsX + 80, doc.y - doc.currentLineHeight());
    doc.moveDown(0.5);
    
    const vatRateDisplay = invoice.vatRate ?? 22;
    doc.text(`IVA (${vatRateDisplay}%):`, totalsX, doc.y);
    doc.text(formatCurrency(invoice.tax), totalsX + 80, doc.y - doc.currentLineHeight());
    doc.moveDown(0.5);
    
    doc.rect(totalsX - 10, doc.y - 5, 170, 25).fill("#e8f4e8");
    doc.fillColor("#000000");
    doc.font("Helvetica-Bold").fontSize(12);
    doc.text("TOTALE:", totalsX, doc.y);
    doc.text(formatCurrency(invoice.total), totalsX + 80, doc.y - doc.currentLineHeight());

    doc.moveDown(3);

    if (issuer.iban) {
      doc.font("Helvetica-Bold").fontSize(10).text("Coordinate Bancarie:", 50);
      doc.font("Helvetica").text(`IBAN: ${issuer.iban}`);
      doc.moveDown(1);
    }

    if (invoice.notes) {
      doc.font("Helvetica-Bold").fontSize(10).text("Note:", 50);
      doc.font("Helvetica").text(invoice.notes);
    }

    const footerY = doc.page.height - 50;
    doc.fontSize(8).fillColor("#666666");
    doc.text(
      `Documento generato il ${format(new Date(), "dd/MM/yyyy HH:mm", { locale: it })} - ${invoice.invoiceNumber}`,
      50, footerY, { align: "center", width: pageWidth }
    );

    doc.end();
  });
}
