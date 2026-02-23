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

export function buildEmailTemplate(
  title: string,
  body: string,
  footerText?: string
): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { margin: 0; padding: 0; font-family: 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f7; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .card { background: #ffffff; border-radius: 8px; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .header { text-align: center; padding-bottom: 24px; border-bottom: 1px solid #e8e8e8; margin-bottom: 24px; }
    .header h1 { color: #1a1a1a; font-size: 22px; margin: 0; }
    .logo { font-size: 28px; font-weight: 700; color: #2563eb; margin-bottom: 8px; }
    .body { color: #374151; font-size: 15px; line-height: 1.6; }
    .body h2 { color: #1a1a1a; font-size: 18px; }
    .body p { margin: 12px 0; }
    .btn { display: inline-block; padding: 12px 24px; background: #2563eb; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 16px 0; }
    .footer { text-align: center; padding-top: 24px; margin-top: 24px; border-top: 1px solid #e8e8e8; color: #9ca3af; font-size: 13px; }
    .info-row { display: flex; padding: 8px 0; border-bottom: 1px solid #f3f4f6; }
    .info-label { font-weight: 600; color: #6b7280; min-width: 140px; }
    .info-value { color: #1a1a1a; }
    table.details { width: 100%; border-collapse: collapse; margin: 16px 0; }
    table.details th { background: #f9fafb; padding: 8px 12px; text-align: left; font-size: 13px; color: #6b7280; border-bottom: 1px solid #e5e7eb; }
    table.details td { padding: 8px 12px; border-bottom: 1px solid #f3f4f6; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <div class="header">
        <div class="logo">MonkeyPlan</div>
        <h1>${title}</h1>
      </div>
      <div class="body">
        ${body}
      </div>
      <div class="footer">
        ${footerText || "&copy; " + new Date().getFullYear() + " MonkeyPlan - Gestione Riparazioni"}
      </div>
    </div>
  </div>
</body>
</html>`;
}
