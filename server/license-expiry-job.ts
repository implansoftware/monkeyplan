import { db } from "./db";
import { licenses } from "@shared/schema";
import { eq, and, lt } from "drizzle-orm";
import { storage } from "./storage";

export function startLicenseExpiryJob(intervalMinutes: number = 60) {
  async function checkExpiredLicenses() {
    try {
      const now = new Date();
      const result = await db.update(licenses)
        .set({ status: "expired" })
        .where(and(
          eq(licenses.status, "active"),
          lt(licenses.endDate, now)
        ))
        .returning({ id: licenses.id, resellerId: licenses.resellerId });
      
      if (result.length > 0) {
        console.log(`[LicenseExpiry] Marked ${result.length} license(s) as expired`);
        for (const license of result) {
          try { await storage.createNotification({ userId: license.resellerId, type: "system", title: "Licenza scaduta", message: "La tua licenza è scaduta. Rinnova per continuare ad utilizzare il servizio.", data: JSON.stringify({ licenseId: license.id }) }); } catch(e) { console.error("Notification error:", e); }
        }
      }
    } catch (error) {
      console.error("[LicenseExpiry] Error checking expired licenses:", error);
    }
  }

  checkExpiredLicenses();
  setInterval(checkExpiredLicenses, intervalMinutes * 60 * 1000);
  console.log(`[LicenseExpiry] Started license expiry job (interval: ${intervalMinutes} minutes)`);
}
