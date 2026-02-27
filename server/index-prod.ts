import fs from "node:fs";
import path from "node:path";
import { type Server } from "node:http";

import express, { type Express } from "express";
import runApp from "./app";
import { startSLANotificationJob } from "./sla-notification-job";
import { startPushNotificationJobs } from "./services/expoPush";
import { verifySmtpConnection } from "./services/email";

const BASE_URL = "https://monkeyplan.replit.app";

const SEO_META: Record<string, { title: string; description: string; canonical: string }> = {
  "/": {
    title: "MonkeyPlan - Gestionale per Assistenza Tecnica, Retail Telefonia e Rivendita Usato",
    description: "MonkeyPlan è il software gestionale operativo per centri di assistenza tecnica, negozi di telefonia, rivendita usato e reti multi-negozio. Ticketing, magazzino, POS fiscale, CRM e B2B integrati.",
    canonical: `${BASE_URL}/`,
  },
  "/auth": {
    title: "Accedi o Registrati | MonkeyPlan",
    description: "Accedi alla piattaforma MonkeyPlan o crea un nuovo account per gestire assistenza tecnica, magazzino, vendite e fatturazione.",
    canonical: `${BASE_URL}/auth`,
  },
  "/track": {
    title: "Traccia la tua Riparazione | MonkeyPlan",
    description: "Controlla lo stato della tua riparazione in tempo reale su MonkeyPlan. Inserisci il codice per vedere aggiornamenti su diagnosi, lavorazione e consegna.",
    canonical: `${BASE_URL}/track`,
  },
};

export async function serveStatic(app: Express, _server: Server) {
  const distPath = path.resolve(import.meta.dirname, "public");

  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  app.use(express.static(distPath));

  app.use("*", (req, res) => {
    const indexPath = path.resolve(distPath, "index.html");
    const routePath = req.originalUrl.split("?")[0];
    const seo = SEO_META[routePath];

    if (seo) {
      let html = fs.readFileSync(indexPath, "utf-8");
      html = html.replace(/<title>[^<]*<\/title>/, `<title>${seo.title}</title>`);
      html = html.replace(/(<meta name="description" content=")[^"]*(")/,  `$1${seo.description}$2`);
      html = html.replace(/(<link rel="canonical" href=")[^"]*(")/,  `$1${seo.canonical}$2`);
      html = html.replace(/(<meta property="og:title" content=")[^"]*(")/,  `$1${seo.title}$2`);
      html = html.replace(/(<meta property="og:description" content=")[^"]*(")/,  `$1${seo.description}$2`);
      html = html.replace(/(<meta property="og:url" content=")[^"]*(")/,  `$1${seo.canonical}$2`);
      html = html.replace(/(<meta name="twitter:title" content=")[^"]*(")/,  `$1${seo.title}$2`);
      html = html.replace(/(<meta name="twitter:description" content=")[^"]*(")/,  `$1${seo.description}$2`);

      if (routePath === "/") {
        const jsonLd = JSON.stringify({
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          "name": "MonkeyPlan",
          "applicationCategory": "BusinessApplication",
          "operatingSystem": "Web",
          "description": seo.description,
          "offers": {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "EUR",
            "description": "Prime 100 licenze gratuite",
            "availability": "https://schema.org/LimitedAvailability"
          },
          "inLanguage": "it"
        });
        html = html.replace("</head>", `<script type="application/ld+json">${jsonLd}</script>\n</head>`);
      }

      res.status(200).set({ "Content-Type": "text/html" }).end(html);
    } else {
      res.sendFile(indexPath);
    }
  });
}

(async () => {
  // Run database migrations before starting the server
  try {
    const pg = await import("pg");
    const migrationPool = new pg.default.Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_URL?.includes("neon.tech") ? undefined : { rejectUnauthorized: false },
    });
    console.log("[Migration] Running startup SQL migrations...");

    await migrationPool.query(`
      CREATE TABLE IF NOT EXISTS "password_reset_tokens" (
        "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "user_id" varchar NOT NULL,
        "token" varchar(255) NOT NULL,
        "expires_at" timestamp NOT NULL,
        "used_at" timestamp,
        "created_at" timestamp DEFAULT now() NOT NULL
      );
    `);
    await migrationPool.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "password_reset_tokens_token_idx"
      ON "password_reset_tokens" ("token");
    `);

    await migrationPool.end();
    console.log("[Migration] Startup SQL migrations completed successfully");
  } catch (err) {
    console.error("[Migration] Warning: startup SQL migrations failed, continuing anyway:", err);
  }

  await runApp(serveStatic);

  startSLANotificationJob(30);
  startPushNotificationJobs();

  // Log SMTP configuration status at startup
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const smtpHost = process.env.SMTP_HOST || "mail.monkeyplan.it";
  const smtpPort = process.env.SMTP_PORT || "587";
  if (!smtpUser || !smtpPass) {
    console.error(`[Email] STARTUP CHECK FAILED: SMTP credentials missing. SMTP_USER=${smtpUser ? "SET" : "MISSING"}, SMTP_PASS=${smtpPass ? "SET" : "MISSING"}`);
  } else {
    console.log(`[Email] SMTP configured: host=${smtpHost}, port=${smtpPort}, user=${smtpUser}`);
    verifySmtpConnection().catch(() => {});
  }
})();
