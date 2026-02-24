import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "mail.tophost.it",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  cc?: string;
  bcc?: string;
  replyTo?: string;
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
    contentType?: string;
  }>;
}

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.error("[Email] SMTP credentials not configured");
      return false;
    }

    const fromName = process.env.SMTP_FROM_NAME || "MonkeyPlan";
    const fromEmail = process.env.SMTP_FROM || process.env.SMTP_USER;

    const info = await transporter.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
      cc: options.cc,
      bcc: options.bcc,
      replyTo: options.replyTo,
      attachments: options.attachments,
    });

    console.log(`[Email] Sent to ${options.to} - MessageId: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error("[Email] Failed to send:", error);
    return false;
  }
}

export async function verifySmtpConnection(): Promise<boolean> {
  try {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.log("[Email] SMTP not configured - skipping verification");
      return false;
    }
    await transporter.verify();
    console.log("[Email] SMTP connection verified successfully");
    return true;
  } catch (error) {
    console.error("[Email] SMTP connection failed:", error);
    return false;
  }
}

const MONKEY_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80" width="48" height="48">
  <circle cx="40" cy="40" r="38" fill="#1a56db"/>
  <circle cx="18" cy="32" r="12" fill="#2563eb" stroke="#1a56db" stroke-width="1.5"/>
  <circle cx="62" cy="32" r="12" fill="#2563eb" stroke="#1a56db" stroke-width="1.5"/>
  <ellipse cx="40" cy="42" rx="22" ry="20" fill="#3b82f6"/>
  <ellipse cx="40" cy="48" rx="14" ry="12" fill="#93c5fd"/>
  <circle cx="33" cy="36" r="3.5" fill="#ffffff"/>
  <circle cx="47" cy="36" r="3.5" fill="#ffffff"/>
  <circle cx="34" cy="35.5" r="2" fill="#1e293b"/>
  <circle cx="48" cy="35.5" r="2" fill="#1e293b"/>
  <ellipse cx="37" cy="47" rx="2" ry="1.5" fill="#1e293b" opacity="0.6"/>
  <ellipse cx="43" cy="47" rx="2" ry="1.5" fill="#1e293b" opacity="0.6"/>
  <path d="M35 52 Q40 56 45 52" stroke="#1e293b" stroke-width="1.5" fill="none" stroke-linecap="round" opacity="0.7"/>
</svg>`;

function baseTemplate(title: string, body: string, accentColor: string = "#1a56db", footerExtra?: string): string {
  const year = new Date().getFullYear();
  return `<!DOCTYPE html>
<html lang="it">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>${title} - MonkeyPlan</title>
<!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
<style>
  body{margin:0;padding:0;font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;background-color:#f0f4f8;-webkit-font-smoothing:antialiased;}
  .wrapper{width:100%;background-color:#f0f4f8;padding:32px 0;}
  .container{max-width:600px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);}
  .header{background:linear-gradient(135deg,${accentColor} 0%,#2563eb 50%,#3b82f6 100%);padding:32px 40px;text-align:center;}
  .header-logo{display:inline-block;margin-bottom:12px;}
  .header-title{color:#ffffff;font-size:14px;font-weight:400;letter-spacing:1.5px;text-transform:uppercase;margin:0 0 4px 0;opacity:0.85;}
  .header-subtitle{color:#ffffff;font-size:22px;font-weight:700;margin:0;line-height:1.3;}
  .accent-bar{height:4px;background:linear-gradient(90deg,#60a5fa,#2563eb,#1d4ed8,#2563eb,#60a5fa);background-size:200% 100%;animation:shimmer 3s ease infinite;}
  @keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
  .content{padding:32px 40px;}
  .content p{color:#374151;font-size:15px;line-height:1.7;margin:0 0 16px 0;}
  .content h2{color:#111827;font-size:18px;font-weight:700;margin:24px 0 12px 0;padding-bottom:8px;border-bottom:2px solid #e5e7eb;}
  .detail-card{background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:20px;margin:16px 0;}
  .detail-row{display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #f1f5f9;font-size:14px;}
  .detail-row:last-child{border-bottom:none;}
  .detail-label{color:#64748b;font-weight:500;min-width:140px;}
  .detail-value{color:#1e293b;font-weight:600;text-align:right;}
  .status-badge{display:inline-block;padding:6px 16px;border-radius:20px;font-size:13px;font-weight:700;letter-spacing:0.5px;text-transform:uppercase;}
  .status-info{background:#dbeafe;color:#1d4ed8;}
  .status-success{background:#dcfce7;color:#166534;}
  .status-warning{background:#fef3c7;color:#92400e;}
  .status-danger{background:#fee2e2;color:#991b1b;}
  .status-purple{background:#f3e8ff;color:#7c3aed;}
  .btn{display:inline-block;padding:14px 32px;background:${accentColor};color:#ffffff!important;text-decoration:none;border-radius:8px;font-weight:700;font-size:15px;letter-spacing:0.3px;text-align:center;margin:8px 0;}
  .btn:hover{background:#1d4ed8;}
  .btn-outline{background:transparent;border:2px solid ${accentColor};color:${accentColor}!important;}
  .divider{height:1px;background:#e5e7eb;margin:24px 0;}
  table.items{width:100%;border-collapse:collapse;margin:16px 0;font-size:14px;}
  table.items thead th{background:#f1f5f9;color:#475569;padding:10px 12px;text-align:left;font-weight:600;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;border-bottom:2px solid #e2e8f0;}
  table.items tbody td{padding:10px 12px;border-bottom:1px solid #f1f5f9;color:#334155;}
  table.items tbody tr:last-child td{border-bottom:none;}
  table.items tfoot td{padding:12px;font-weight:700;border-top:2px solid #e2e8f0;color:#1e293b;}
  .total-row{background:#f0f4f8;font-size:16px;}
  .footer{background:#f8fafc;padding:24px 40px;text-align:center;border-top:1px solid #e5e7eb;}
  .footer p{color:#94a3b8;font-size:12px;line-height:1.6;margin:0 0 4px 0;}
  .footer a{color:#2563eb;text-decoration:none;}
  .footer-brand{color:#64748b;font-weight:700;font-size:13px;letter-spacing:0.5px;}
  .tip-box{background:#eff6ff;border-left:4px solid #2563eb;padding:14px 18px;border-radius:0 8px 8px 0;margin:16px 0;font-size:14px;color:#1e40af;}
  .warning-box{background:#fffbeb;border-left:4px solid #f59e0b;padding:14px 18px;border-radius:0 8px 8px 0;margin:16px 0;font-size:14px;color:#92400e;}
  @media only screen and (max-width:640px){
    .content{padding:24px 20px!important;}
    .header{padding:24px 20px!important;}
    .footer{padding:20px!important;}
    .detail-row{flex-direction:column;gap:2px;}
    .detail-value{text-align:left;}
  }
</style>
</head>
<body>
<div class="wrapper">
  <div class="container">
    <div class="header">
      <div class="header-logo">${MONKEY_SVG}</div>
      <p class="header-title">MonkeyPlan</p>
      <h1 class="header-subtitle">${title}</h1>
    </div>
    <div class="accent-bar"></div>
    <div class="content">
      ${body}
    </div>
    <div class="footer">
      <p class="footer-brand">MonkeyPlan</p>
      <p>Gestione Riparazioni Professionale</p>
      <p>&copy; ${year} MonkeyPlan &mdash; Tutti i diritti riservati</p>
      ${footerExtra || ""}
    </div>
  </div>
</div>
</body>
</html>`;
}

export function buildEmailTemplate(title: string, body: string, footerText?: string): string {
  return baseTemplate(title, body, "#1a56db", footerText ? `<p>${footerText}</p>` : undefined);
}

function detailCard(rows: Array<{ label: string; value: string }>): string {
  return `<div class="detail-card">${rows.map(r => `<div class="detail-row"><span class="detail-label">${r.label}</span><span class="detail-value">${r.value}</span></div>`).join("")}</div>`;
}

function statusBadge(text: string, type: "info" | "success" | "warning" | "danger" | "purple" = "info"): string {
  return `<span class="status-badge status-${type}">${text}</span>`;
}

function formatDate(date?: Date | string | null): string {
  if (!date) return "N/D";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("it-IT", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function formatCurrency(amount?: number | null): string {
  if (amount == null) return "N/D";
  return new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(amount);
}

const STATUS_LABELS: Record<string, { label: string; type: "info" | "success" | "warning" | "danger" | "purple" }> = {
  pending: { label: "In Attesa", type: "warning" },
  ingressato: { label: "Ingressato", type: "info" },
  in_diagnosi: { label: "In Diagnosi", type: "purple" },
  preventivo_emesso: { label: "Preventivo Emesso", type: "info" },
  preventivo_accettato: { label: "Preventivo Accettato", type: "success" },
  preventivo_rifiutato: { label: "Preventivo Rifiutato", type: "danger" },
  attesa_ricambi: { label: "In Attesa Ricambi", type: "warning" },
  in_riparazione: { label: "In Riparazione", type: "purple" },
  in_test: { label: "In Test", type: "info" },
  pronto_ritiro: { label: "Pronto al Ritiro", type: "success" },
  consegnato: { label: "Consegnato", type: "success" },
  cancelled: { label: "Annullato", type: "danger" },
};

export interface RepairEmailData {
  repairCode: string;
  customerName: string;
  customerEmail: string;
  deviceType?: string;
  brand?: string;
  model?: string;
  serialNumber?: string;
  issueDescription?: string;
  status: string;
  estimatedCost?: number | null;
  finalCost?: number | null;
  notes?: string;
  repairCenterName?: string;
  resellerName?: string;
}

export function emailRepairCreated(data: RepairEmailData): { subject: string; html: string } {
  const statusInfo = STATUS_LABELS[data.status] || STATUS_LABELS.pending;
  const body = `
    <p>Gentile <strong>${data.customerName}</strong>,</p>
    <p>La informiamo che il suo ordine di riparazione è stato registrato con successo nel nostro sistema.</p>
    ${detailCard([
      { label: "Codice Riparazione", value: `<strong>${data.repairCode}</strong>` },
      { label: "Dispositivo", value: [data.brand, data.model].filter(Boolean).join(" ") || "N/D" },
      { label: "Tipo", value: data.deviceType || "N/D" },
      ...(data.serialNumber ? [{ label: "Seriale / IMEI", value: data.serialNumber }] : []),
      { label: "Stato", value: statusBadge(statusInfo.label, statusInfo.type) },
    ])}
    ${data.issueDescription ? `<div class="tip-box"><strong>Problema segnalato:</strong> ${data.issueDescription}</div>` : ""}
    <p>Riceverà aggiornamenti via email ad ogni cambio di stato della riparazione.</p>
    ${data.repairCenterName ? `<p style="color:#64748b;font-size:13px;">Centro assistenza: ${data.repairCenterName}</p>` : ""}
  `;
  return { subject: `Riparazione ${data.repairCode} - Ordine Registrato`, html: baseTemplate("Ordine di Riparazione Registrato", body) };
}

export function emailRepairStatusChanged(data: RepairEmailData, oldStatus: string): { subject: string; html: string } {
  const newStatusInfo = STATUS_LABELS[data.status] || { label: data.status, type: "info" as const };
  const oldStatusInfo = STATUS_LABELS[oldStatus] || { label: oldStatus, type: "info" as const };

  let messageBlock = "";
  switch (data.status) {
    case "ingressato":
      messageBlock = `<p>Il dispositivo è stato ricevuto presso il nostro laboratorio e sarà preso in carico a breve.</p>`;
      break;
    case "in_diagnosi":
      messageBlock = `<p>I nostri tecnici stanno effettuando la diagnosi del dispositivo per identificare il problema.</p>`;
      break;
    case "preventivo_emesso":
      messageBlock = `<p>Il preventivo per la riparazione è stato preparato. La preghiamo di prenderne visione e confermare o rifiutare.</p>
        ${data.estimatedCost != null ? `<p style="font-size:20px;text-align:center;margin:16px 0;"><strong>Importo stimato: ${formatCurrency(data.estimatedCost)}</strong></p>` : ""}`;
      break;
    case "preventivo_accettato":
      messageBlock = `<p>Il preventivo è stato accettato. Procederemo con la riparazione del dispositivo.</p>`;
      break;
    case "preventivo_rifiutato":
      messageBlock = `<p>Il preventivo è stato rifiutato. Il dispositivo sarà disponibile per il ritiro.</p>`;
      break;
    case "attesa_ricambi":
      messageBlock = `<div class="warning-box">Siamo in attesa dei ricambi necessari per completare la riparazione. La terremo aggiornata sui tempi di consegna.</div>`;
      break;
    case "in_riparazione":
      messageBlock = `<p>La riparazione del dispositivo è in corso. I nostri tecnici stanno lavorando per risolvere il problema.</p>`;
      break;
    case "in_test":
      messageBlock = `<p>La riparazione è stata completata e il dispositivo è in fase di test per verificare il corretto funzionamento.</p>`;
      break;
    case "pronto_ritiro":
      messageBlock = `<div class="tip-box"><strong>Il dispositivo è pronto!</strong> Può procedere al ritiro presso il nostro centro assistenza.</div>
        ${data.finalCost != null ? `<p style="font-size:18px;text-align:center;"><strong>Importo finale: ${formatCurrency(data.finalCost)}</strong></p>` : ""}`;
      break;
    case "consegnato":
      messageBlock = `<p>Il dispositivo è stato consegnato con successo. Grazie per aver scelto i nostri servizi!</p>
        ${data.finalCost != null ? `<p>Importo totale: <strong>${formatCurrency(data.finalCost)}</strong></p>` : ""}`;
      break;
    case "cancelled":
      messageBlock = `<p>L'ordine di riparazione è stato annullato.${data.notes ? ` Motivo: ${data.notes}` : ""}</p>`;
      break;
    default:
      messageBlock = `<p>Lo stato della riparazione è stato aggiornato.</p>`;
  }

  const body = `
    <p>Gentile <strong>${data.customerName}</strong>,</p>
    <p>La informiamo che lo stato della sua riparazione <strong>${data.repairCode}</strong> è stato aggiornato.</p>
    <div style="text-align:center;margin:20px 0;">
      ${statusBadge(oldStatusInfo.label, oldStatusInfo.type)}
      <span style="display:inline-block;margin:0 12px;color:#94a3b8;font-size:20px;">&#8594;</span>
      ${statusBadge(newStatusInfo.label, newStatusInfo.type)}
    </div>
    ${messageBlock}
    ${detailCard([
      { label: "Codice", value: data.repairCode },
      { label: "Dispositivo", value: [data.brand, data.model].filter(Boolean).join(" ") || "N/D" },
    ])}
  `;
  return { subject: `Riparazione ${data.repairCode} - ${newStatusInfo.label}`, html: baseTemplate(`Aggiornamento Riparazione`, body) };
}

export function emailQuoteIssued(data: RepairEmailData, quoteItems?: Array<{ description: string; quantity: number; unitPrice: number }>): { subject: string; html: string } {
  let itemsTable = "";
  if (quoteItems && quoteItems.length > 0) {
    const total = quoteItems.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0);
    itemsTable = `
      <table class="items">
        <thead><tr><th>Descrizione</th><th style="text-align:center">Qtà</th><th style="text-align:right">Prezzo</th><th style="text-align:right">Totale</th></tr></thead>
        <tbody>${quoteItems.map(i => `<tr><td>${i.description}</td><td style="text-align:center">${i.quantity}</td><td style="text-align:right">${formatCurrency(i.unitPrice)}</td><td style="text-align:right">${formatCurrency(i.quantity * i.unitPrice)}</td></tr>`).join("")}</tbody>
        <tfoot><tr class="total-row"><td colspan="3" style="text-align:right">Totale</td><td style="text-align:right">${formatCurrency(total)}</td></tr></tfoot>
      </table>`;
  }

  const body = `
    <p>Gentile <strong>${data.customerName}</strong>,</p>
    <p>Abbiamo completato la diagnosi del suo dispositivo e preparato il seguente preventivo di riparazione:</p>
    ${detailCard([
      { label: "Codice Riparazione", value: data.repairCode },
      { label: "Dispositivo", value: [data.brand, data.model].filter(Boolean).join(" ") || "N/D" },
    ])}
    ${itemsTable}
    ${data.estimatedCost != null ? `<div style="text-align:center;margin:24px 0;padding:20px;background:#f0f4f8;border-radius:8px;"><p style="margin:0;color:#64748b;font-size:13px;">IMPORTO TOTALE PREVENTIVO</p><p style="margin:4px 0 0;font-size:28px;font-weight:800;color:#1a56db;">${formatCurrency(data.estimatedCost)}</p></div>` : ""}
    <p>La preghiamo di contattarci per confermare o rifiutare il preventivo.</p>
  `;
  return { subject: `Preventivo Riparazione ${data.repairCode}`, html: baseTemplate("Preventivo di Riparazione", body) };
}

export function emailReadyForPickup(data: RepairEmailData): { subject: string; html: string } {
  const body = `
    <p>Gentile <strong>${data.customerName}</strong>,</p>
    <p style="font-size:17px;">Il suo dispositivo <strong>${[data.brand, data.model].filter(Boolean).join(" ")}</strong> è stato riparato ed è <strong>pronto per il ritiro</strong>.</p>
    ${detailCard([
      { label: "Codice", value: data.repairCode },
      { label: "Dispositivo", value: [data.brand, data.model].filter(Boolean).join(" ") || "N/D" },
      ...(data.finalCost != null ? [{ label: "Importo", value: `<strong>${formatCurrency(data.finalCost)}</strong>` }] : []),
    ])}
    <div class="tip-box">
      <strong>Come ritirare:</strong> Si presenti presso il centro assistenza con un documento d'identità valido. 
      ${data.repairCenterName ? `Centro: <strong>${data.repairCenterName}</strong>` : ""}
    </div>
    <p style="color:#64748b;font-size:13px;">Il dispositivo rimarrà in custodia per un massimo di 30 giorni dal ricevimento di questa comunicazione.</p>
  `;
  return { subject: `${data.repairCode} - Dispositivo Pronto al Ritiro`, html: baseTemplate("Dispositivo Pronto al Ritiro", body, "#059669") };
}

export function emailRepairDelivered(data: RepairEmailData): { subject: string; html: string } {
  const body = `
    <p>Gentile <strong>${data.customerName}</strong>,</p>
    <p>La informiamo che il suo dispositivo <strong>${[data.brand, data.model].filter(Boolean).join(" ")}</strong> è stato consegnato con successo.</p>
    ${detailCard([
      { label: "Codice", value: data.repairCode },
      { label: "Dispositivo", value: [data.brand, data.model].filter(Boolean).join(" ") || "N/D" },
      ...(data.finalCost != null ? [{ label: "Importo Totale", value: formatCurrency(data.finalCost) }] : []),
      { label: "Stato", value: statusBadge("Consegnato", "success") },
    ])}
    <p>Grazie per aver scelto i nostri servizi. Se dovesse riscontrare qualsiasi problema, non esiti a contattarci.</p>
  `;
  return { subject: `${data.repairCode} - Dispositivo Consegnato`, html: baseTemplate("Riparazione Completata", body, "#059669") };
}

export interface InvoiceEmailData {
  invoiceNumber: string;
  customerName: string;
  customerEmail: string;
  amount: number;
  tax?: number;
  totalAmount: number;
  issueDate: string;
  dueDate?: string;
  repairCode?: string;
  items?: Array<{ description: string; quantity: number; unitPrice: number; total: number }>;
  status?: string;
}

export function emailInvoiceCreated(data: InvoiceEmailData): { subject: string; html: string } {
  let itemsTable = "";
  if (data.items && data.items.length > 0) {
    itemsTable = `
      <table class="items">
        <thead><tr><th>Descrizione</th><th style="text-align:center">Qtà</th><th style="text-align:right">Prezzo</th><th style="text-align:right">Totale</th></tr></thead>
        <tbody>${data.items.map(i => `<tr><td>${i.description}</td><td style="text-align:center">${i.quantity}</td><td style="text-align:right">${formatCurrency(i.unitPrice)}</td><td style="text-align:right">${formatCurrency(i.total)}</td></tr>`).join("")}</tbody>
        <tfoot>
          <tr><td colspan="3" style="text-align:right;color:#64748b;">Imponibile</td><td style="text-align:right">${formatCurrency(data.amount)}</td></tr>
          ${data.tax != null ? `<tr><td colspan="3" style="text-align:right;color:#64748b;">IVA</td><td style="text-align:right">${formatCurrency(data.tax)}</td></tr>` : ""}
          <tr class="total-row"><td colspan="3" style="text-align:right">Totale</td><td style="text-align:right">${formatCurrency(data.totalAmount)}</td></tr>
        </tfoot>
      </table>`;
  }

  const body = `
    <p>Gentile <strong>${data.customerName}</strong>,</p>
    <p>Di seguito i dettagli della fattura emessa a suo nome:</p>
    ${detailCard([
      { label: "Numero Fattura", value: `<strong>${data.invoiceNumber}</strong>` },
      { label: "Data Emissione", value: formatDate(data.issueDate) },
      ...(data.dueDate ? [{ label: "Scadenza", value: formatDate(data.dueDate) }] : []),
      ...(data.repairCode ? [{ label: "Rif. Riparazione", value: data.repairCode }] : []),
      { label: "Stato", value: statusBadge(data.status === "paid" ? "Pagata" : "Da Pagare", data.status === "paid" ? "success" : "warning") },
    ])}
    ${itemsTable}
    <div style="text-align:center;margin:24px 0;padding:20px;background:#f0f4f8;border-radius:8px;">
      <p style="margin:0;color:#64748b;font-size:13px;">IMPORTO TOTALE</p>
      <p style="margin:4px 0 0;font-size:28px;font-weight:800;color:#1a56db;">${formatCurrency(data.totalAmount)}</p>
    </div>
  `;
  return { subject: `Fattura ${data.invoiceNumber} - MonkeyPlan`, html: baseTemplate("Fattura", body) };
}

export interface TicketEmailData {
  ticketCode: string;
  customerName: string;
  customerEmail: string;
  subject: string;
  message?: string;
  priority?: string;
  category?: string;
}

export function emailTicketCreated(data: TicketEmailData): { subject: string; html: string } {
  const body = `
    <p>Gentile <strong>${data.customerName}</strong>,</p>
    <p>Il suo ticket di assistenza è stato aperto con successo.</p>
    ${detailCard([
      { label: "Codice Ticket", value: `<strong>${data.ticketCode}</strong>` },
      { label: "Oggetto", value: data.subject },
      ...(data.priority ? [{ label: "Priorità", value: statusBadge(data.priority, data.priority === "high" || data.priority === "urgent" ? "danger" : data.priority === "medium" ? "warning" : "info") }] : []),
      ...(data.category ? [{ label: "Categoria", value: data.category }] : []),
    ])}
    ${data.message ? `<div class="detail-card"><p style="margin:0;color:#374151;font-size:14px;white-space:pre-wrap;">${data.message}</p></div>` : ""}
    <p>Riceverà una risposta il prima possibile dal nostro team di supporto.</p>
  `;
  return { subject: `Ticket #${data.ticketCode} - ${data.subject}`, html: baseTemplate("Ticket di Assistenza", body, "#7c3aed") };
}

export function emailTicketReply(data: TicketEmailData, replyMessage: string, replierName: string): { subject: string; html: string } {
  const body = `
    <p>Gentile <strong>${data.customerName}</strong>,</p>
    <p>È stata aggiunta una nuova risposta al suo ticket <strong>#${data.ticketCode}</strong>.</p>
    ${detailCard([
      { label: "Ticket", value: `#${data.ticketCode}` },
      { label: "Oggetto", value: data.subject },
      { label: "Risposta di", value: replierName },
    ])}
    <div class="detail-card">
      <p style="margin:0;color:#374151;font-size:14px;white-space:pre-wrap;">${replyMessage}</p>
    </div>
  `;
  return { subject: `Re: Ticket #${data.ticketCode} - ${data.subject}`, html: baseTemplate("Nuova Risposta al Ticket", body, "#7c3aed") };
}

export function emailTicketClosed(data: TicketEmailData): { subject: string; html: string } {
  const body = `
    <p>Gentile <strong>${data.customerName}</strong>,</p>
    <p>Il suo ticket <strong>#${data.ticketCode}</strong> è stato chiuso.</p>
    ${detailCard([
      { label: "Ticket", value: `#${data.ticketCode}` },
      { label: "Oggetto", value: data.subject },
      { label: "Stato", value: statusBadge("Chiuso", "success") },
    ])}
    <p>Se il problema non è stato risolto, può riaprire il ticket rispondendo a questa email o contattandoci direttamente.</p>
  `;
  return { subject: `Ticket #${data.ticketCode} - Chiuso`, html: baseTemplate("Ticket Chiuso", body, "#7c3aed") };
}

export interface UserEmailData {
  fullName: string;
  email: string;
  username: string;
  password?: string;
  role?: string;
}

export function emailWelcome(data: UserEmailData): { subject: string; html: string } {
  const roleLabel = data.role === "reseller" ? "Rivenditore" : data.role === "repair_center" ? "Centro Riparazione" : data.role === "customer" ? "Cliente" : data.role || "Utente";

  const body = `
    <p>Gentile <strong>${data.fullName}</strong>,</p>
    <p>Benvenuto su <strong>MonkeyPlan</strong>! Il suo account è stato creato con successo.</p>
    ${detailCard([
      { label: "Nome Utente", value: `<strong>${data.username}</strong>` },
      ...(data.password ? [{ label: "Password", value: `<code style="background:#f1f5f9;padding:2px 8px;border-radius:4px;font-family:monospace;">${data.password}</code>` }] : []),
      { label: "Ruolo", value: roleLabel },
    ])}
    <div class="warning-box">
      <strong>Importante:</strong> La preghiamo di modificare la password al primo accesso per garantire la sicurezza del suo account.
    </div>
    <div style="text-align:center;margin:24px 0;">
      <a href="https://www.monkeyplan.it" class="btn">Accedi a MonkeyPlan</a>
    </div>
  `;
  return { subject: "Benvenuto su MonkeyPlan", html: baseTemplate("Benvenuto!", body, "#059669") };
}

export interface B2BOrderEmailData {
  orderCode: string;
  buyerName: string;
  buyerEmail: string;
  sellerName: string;
  totalAmount: number;
  status: string;
  items?: Array<{ name: string; quantity: number; price: number }>;
}

export function emailB2BOrderCreated(data: B2BOrderEmailData): { subject: string; html: string } {
  let itemsTable = "";
  if (data.items && data.items.length > 0) {
    itemsTable = `
      <table class="items">
        <thead><tr><th>Prodotto</th><th style="text-align:center">Qtà</th><th style="text-align:right">Prezzo</th></tr></thead>
        <tbody>${data.items.map(i => `<tr><td>${i.name}</td><td style="text-align:center">${i.quantity}</td><td style="text-align:right">${formatCurrency(i.price)}</td></tr>`).join("")}</tbody>
        <tfoot><tr class="total-row"><td colspan="2" style="text-align:right">Totale</td><td style="text-align:right">${formatCurrency(data.totalAmount)}</td></tr></tfoot>
      </table>`;
  }

  const body = `
    <p>Un nuovo ordine B2B è stato ricevuto.</p>
    ${detailCard([
      { label: "Codice Ordine", value: `<strong>${data.orderCode}</strong>` },
      { label: "Acquirente", value: data.buyerName },
      { label: "Importo", value: `<strong>${formatCurrency(data.totalAmount)}</strong>` },
      { label: "Stato", value: statusBadge("Nuovo Ordine", "info") },
    ])}
    ${itemsTable}
  `;
  return { subject: `Nuovo Ordine B2B ${data.orderCode}`, html: baseTemplate("Nuovo Ordine B2B", body) };
}

export function emailB2BOrderShipped(data: B2BOrderEmailData, trackingNumber?: string): { subject: string; html: string } {
  const body = `
    <p>Gentile <strong>${data.buyerName}</strong>,</p>
    <p>Il suo ordine <strong>${data.orderCode}</strong> è stato spedito.</p>
    ${detailCard([
      { label: "Codice Ordine", value: data.orderCode },
      { label: "Fornitore", value: data.sellerName },
      ...(trackingNumber ? [{ label: "Tracking", value: `<strong>${trackingNumber}</strong>` }] : []),
      { label: "Stato", value: statusBadge("Spedito", "info") },
    ])}
  `;
  return { subject: `Ordine ${data.orderCode} - Spedito`, html: baseTemplate("Ordine Spedito", body) };
}

export interface WarrantyEmailData {
  customerName: string;
  customerEmail: string;
  warrantyCode: string;
  planName: string;
  deviceInfo: string;
  startDate: string;
  endDate: string;
  coverageDetails?: string;
}

export function emailWarrantyActivated(data: WarrantyEmailData): { subject: string; html: string } {
  const body = `
    <p>Gentile <strong>${data.customerName}</strong>,</p>
    <p>La sua garanzia è stata attivata con successo.</p>
    ${detailCard([
      { label: "Codice Garanzia", value: `<strong>${data.warrantyCode}</strong>` },
      { label: "Piano", value: data.planName },
      { label: "Dispositivo", value: data.deviceInfo },
      { label: "Inizio Copertura", value: formatDate(data.startDate) },
      { label: "Fine Copertura", value: formatDate(data.endDate) },
    ])}
    ${data.coverageDetails ? `<div class="tip-box"><strong>Cosa copre:</strong> ${data.coverageDetails}</div>` : ""}
    <p>Conservi il codice garanzia per eventuali futuri interventi.</p>
  `;
  return { subject: `Garanzia Attivata - ${data.warrantyCode}`, html: baseTemplate("Garanzia Attivata", body, "#059669") };
}

export interface DeliveryAppointmentEmailData {
  customerName: string;
  customerEmail: string;
  appointmentDate: string;
  repairCode?: string;
  notes?: string;
}

export function emailDeliveryAppointment(data: DeliveryAppointmentEmailData): { subject: string; html: string } {
  const body = `
    <p>Gentile <strong>${data.customerName}</strong>,</p>
    <p>Il suo appuntamento per il ritiro è stato confermato.</p>
    ${detailCard([
      { label: "Data e Ora", value: `<strong>${formatDate(data.appointmentDate)}</strong>` },
      ...(data.repairCode ? [{ label: "Riparazione", value: data.repairCode }] : []),
    ])}
    ${data.notes ? `<div class="tip-box">${data.notes}</div>` : ""}
    <p>La preghiamo di presentarsi con un documento d'identità valido.</p>
  `;
  return { subject: `Appuntamento Ritiro Confermato${data.repairCode ? ` - ${data.repairCode}` : ""}`, html: baseTemplate("Appuntamento Confermato", body) };
}

export function emailPasswordReset(resetLink: string, userName: string): { subject: string; html: string } {
  const body = `
    <p>Gentile <strong>${userName}</strong>,</p>
    <p>Abbiamo ricevuto una richiesta per reimpostare la password del suo account MonkeyPlan.</p>
    <p>Clicchi il pulsante qui sotto per impostare una nuova password:</p>
    <div style="text-align:center;margin:24px 0;">
      <a href="${resetLink}" style="display:inline-block;padding:14px 32px;background:linear-gradient(135deg,#10b981,#14b8a6);color:#fff;text-decoration:none;border-radius:12px;font-weight:600;font-size:16px;">Reimposta Password</a>
    </div>
    <div class="tip-box">
      <strong>Nota:</strong> Questo link scade tra <strong>1 ora</strong>. Se non ha richiesto il reset della password, ignori questa email.
    </div>
    <p style="color:#94a3b8;font-size:13px;margin-top:16px;">Se il pulsante non funziona, copi e incolli questo link nel browser:<br/><a href="${resetLink}" style="color:#10b981;word-break:break-all;">${resetLink}</a></p>
  `;
  return { subject: "Reimposta la tua password - MonkeyPlan", html: baseTemplate("Reimposta Password", body) };
}

export interface StandaloneQuoteEmailData {
  quoteNumber: string;
  customerName: string;
  customerEmail: string;
  totalAmount: number;
  validUntil?: string;
  items: Array<{ description: string; quantity: number; unitPrice: number; total: number }>;
  notes?: string;
}

export function emailStandaloneQuote(data: StandaloneQuoteEmailData): { subject: string; html: string } {
  const itemsTable = `
    <table class="items">
      <thead><tr><th>Servizio</th><th style="text-align:center">Qtà</th><th style="text-align:right">Prezzo</th><th style="text-align:right">Totale</th></tr></thead>
      <tbody>${data.items.map(i => `<tr><td>${i.description}</td><td style="text-align:center">${i.quantity}</td><td style="text-align:right">${formatCurrency(i.unitPrice)}</td><td style="text-align:right">${formatCurrency(i.total)}</td></tr>`).join("")}</tbody>
      <tfoot><tr class="total-row"><td colspan="3" style="text-align:right">Totale</td><td style="text-align:right">${formatCurrency(data.totalAmount)}</td></tr></tfoot>
    </table>`;

  const body = `
    <p>Gentile <strong>${data.customerName}</strong>,</p>
    <p>Le inviamo il preventivo richiesto per i seguenti servizi:</p>
    ${detailCard([
      { label: "N. Preventivo", value: `<strong>${data.quoteNumber}</strong>` },
      ...(data.validUntil ? [{ label: "Valido fino al", value: formatDate(data.validUntil) }] : []),
    ])}
    ${itemsTable}
    <div style="text-align:center;margin:24px 0;padding:20px;background:#f0f4f8;border-radius:8px;">
      <p style="margin:0;color:#64748b;font-size:13px;">IMPORTO TOTALE</p>
      <p style="margin:4px 0 0;font-size:28px;font-weight:800;color:#1a56db;">${formatCurrency(data.totalAmount)}</p>
    </div>
    ${data.notes ? `<div class="tip-box">${data.notes}</div>` : ""}
  `;
  return { subject: `Preventivo ${data.quoteNumber} - MonkeyPlan`, html: baseTemplate("Preventivo", body) };
}
