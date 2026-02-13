import PDFDocument from "pdfkit";
import { StandaloneQuote, StandaloneQuoteItem } from "@shared/schema";
import { format } from "date-fns";
import { it } from "date-fns/locale";

interface QuotePdfData {
  quote: StandaloneQuote & { items: StandaloneQuoteItem[] };
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
  };
}

const statusLabels: Record<string, string> = {
  draft: "Bozza",
  sent: "Inviato",
  accepted: "Accettato",
  rejected: "Rifiutato",
  expired: "Scaduto",
};

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100);
}

export async function generateQuotePdf(data: QuotePdfData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 50 });
    const chunks: Buffer[] = [];

    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const { quote, issuer } = data;
    const pageWidth = doc.page.width - 100;

    doc.fontSize(20).font("Helvetica-Bold").text("PREVENTIVO", { align: "center" });
    doc.moveDown(0.5);
    doc.fontSize(14).font("Helvetica").text(quote.quoteNumber, { align: "center" });
    doc.moveDown(0.3);
    doc.fontSize(10).fillColor("#666666").text(
      `Stato: ${statusLabels[quote.status] || quote.status}`,
      { align: "center" }
    );
    doc.fillColor("#000000");
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

    if (quote.customerName || quote.customerEmail) {
      doc.font("Helvetica-Bold").text("CLIENTE", 320, startY);
      doc.font("Helvetica");
      if (quote.customerName) doc.text(quote.customerName, 320, doc.y + 5);
      if (quote.customerEmail) doc.text(quote.customerEmail, 320);
      if (quote.customerPhone) doc.text(`Tel: ${quote.customerPhone}`, 320);
    }

    doc.y = Math.max(issuerEndY, doc.y) + 30;

    doc.moveTo(50, doc.y).lineTo(pageWidth + 50, doc.y).stroke();
    doc.moveDown(1);

    doc.fontSize(10);
    const infoY = doc.y;
    doc.font("Helvetica-Bold").text("Data:", 50, infoY);
    doc.font("Helvetica").text(
      format(new Date(quote.createdAt), "dd/MM/yyyy", { locale: it }),
      90, infoY
    );

    if (quote.validUntil) {
      doc.font("Helvetica-Bold").text("Valido fino al:", 200, infoY);
      doc.font("Helvetica").text(
        format(new Date(quote.validUntil), "dd/MM/yyyy", { locale: it }),
        300, infoY
      );
    }

    doc.moveDown(1.5);

    if (quote.deviceDescription) {
      doc.font("Helvetica-Bold").text("Dispositivo:", 50);
      doc.font("Helvetica").text(quote.deviceDescription);
      doc.moveDown(1);
    }

    const serviceItems = quote.items.filter(i => (i as any).itemType === "service" || !(i as any).itemType);
    const productItems = quote.items.filter(i => (i as any).itemType === "product");
    const customItems = quote.items.filter(i => (i as any).itemType === "custom");

    const allSections: Array<{ label: string; items: StandaloneQuoteItem[] }> = [];
    if (serviceItems.length > 0) allSections.push({ label: "SERVIZI", items: serviceItems });
    if (productItems.length > 0) allSections.push({ label: "PRODOTTI", items: productItems });
    if (customItems.length > 0) allSections.push({ label: "VOCI PERSONALIZZATE", items: customItems });

    if (allSections.length === 0) {
      allSections.push({ label: "VOCI", items: quote.items });
    }

    for (const section of allSections) {
      if (allSections.length > 1) {
        doc.font("Helvetica-Bold").fontSize(10).text(section.label, 50);
        doc.moveDown(0.5);
      }

      const tableTop = doc.y;
      const cols = [50, 280, 320, 385, 450];

      doc.rect(50, tableTop, pageWidth, 20).fill("#f0f0f0");
      doc.fillColor("#000000");
      doc.font("Helvetica-Bold").fontSize(9);
      doc.text("Descrizione", cols[0] + 5, tableTop + 5);
      doc.text("Qtà", cols[1] + 5, tableTop + 5);
      doc.text("Prezzo Unit.", cols[2] + 5, tableTop + 5);
      doc.text("IVA", cols[3] + 5, tableTop + 5);
      doc.text("Totale", cols[4] + 5, tableTop + 5);

      let rowY = tableTop + 25;
      doc.font("Helvetica").fontSize(9);

      section.items.forEach((item, index) => {
        if (rowY > doc.page.height - 100) {
          doc.addPage();
          rowY = 50;
        }

        if (index % 2 === 0) {
          doc.rect(50, rowY - 3, pageWidth, 18).fill("#fafafa");
          doc.fillColor("#000000");
        }
        const descText = item.description ? `${item.name} - ${item.description}` : item.name;
        doc.text(descText, cols[0] + 5, rowY, { width: 220 });
        doc.text(item.quantity.toString(), cols[1] + 5, rowY);
        doc.text(formatCurrency(item.unitPriceCents), cols[2] + 5, rowY);
        doc.text(`${item.vatRate}%`, cols[3] + 5, rowY);
        doc.text(formatCurrency(item.totalCents), cols[4] + 5, rowY);
        rowY += 20;
      });

      doc.y = rowY + 10;
    }

    doc.moveTo(50, doc.y).lineTo(pageWidth + 50, doc.y).stroke();
    doc.moveDown(1);

    const totalsX = 380;
    doc.font("Helvetica").fontSize(10);

    doc.text("Imponibile:", totalsX, doc.y);
    doc.text(formatCurrency(quote.subtotalCents), totalsX + 80, doc.y - doc.currentLineHeight());
    doc.moveDown(0.5);

    doc.text("IVA:", totalsX, doc.y);
    doc.text(formatCurrency(quote.vatAmountCents), totalsX + 80, doc.y - doc.currentLineHeight());
    doc.moveDown(0.5);

    doc.rect(totalsX - 10, doc.y - 5, 170, 25).fill("#e0ecff");
    doc.fillColor("#000000");
    doc.font("Helvetica-Bold").fontSize(12);
    doc.text("TOTALE:", totalsX, doc.y);
    doc.text(formatCurrency(quote.totalAmountCents), totalsX + 80, doc.y - doc.currentLineHeight());

    doc.moveDown(3);

    if (quote.notes) {
      doc.font("Helvetica-Bold").fontSize(10).text("Note:", 50);
      doc.font("Helvetica").text(quote.notes);
      doc.moveDown(1);
    }

    doc.moveDown(1);
    doc.font("Helvetica").fontSize(9).fillColor("#666666");
    doc.text("Condizioni:", 50);
    doc.text("- Il presente preventivo non costituisce impegno vincolante fino all'accettazione formale.");
    if (quote.validUntil) {
      doc.text(`- Il preventivo è valido fino al ${format(new Date(quote.validUntil), "dd/MM/yyyy", { locale: it })}.`);
    }
    doc.text("- I prezzi indicati sono in Euro e soggetti ad IVA come indicato.");

    const footerY = doc.page.height - 50;
    doc.fontSize(8).fillColor("#666666");
    doc.text(
      `Documento generato il ${format(new Date(), "dd/MM/yyyy HH:mm", { locale: it })} - ${quote.quoteNumber}`,
      50, footerY, { align: "center", width: pageWidth }
    );

    doc.end();
  });
}
