import { db } from "../db";
import { products } from "@shared/schema";
import { eq } from "drizzle-orm";

/**
 * Genera un barcode univoco nel formato MP-AAMM-XXXXXX
 * MP = MonkeyPlan prefix
 * AA = Anno (2 cifre)
 * MM = Mese (2 cifre)
 * XXXXXX = 6 caratteri alfanumerici random
 */
export function generateBarcodeString(): string {
  const now = new Date();
  const year = now.getFullYear().toString().slice(-2);
  const month = (now.getMonth() + 1).toString().padStart(2, "0");
  
  // Genera 6 caratteri alfanumerici random (escluse lettere confondibili O, I, L)
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZ0123456789";
  let random = "";
  for (let i = 0; i < 6; i++) {
    random += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return `MP-${year}${month}-${random}`;
}

/**
 * Genera un barcode univoco verificando che non esista già nel database
 */
export async function generateUniqueBarcode(): Promise<string> {
  let barcode: string;
  let attempts = 0;
  const maxAttempts = 10;
  
  do {
    barcode = generateBarcodeString();
    const existing = await db.select({ id: products.id })
      .from(products)
      .where(eq(products.barcode, barcode))
      .limit(1);
    
    if (existing.length === 0) {
      return barcode;
    }
    
    attempts++;
  } while (attempts < maxAttempts);
  
  // Fallback: aggiungi timestamp per garantire unicità
  const timestamp = Date.now().toString(36).toUpperCase();
  return `MP-${new Date().getFullYear().toString().slice(-2)}${(new Date().getMonth() + 1).toString().padStart(2, "0")}-${timestamp.slice(-6)}`;
}

/**
 * Genera barcode per tutti i prodotti esistenti che non ne hanno uno
 */
export async function backfillProductBarcodes(): Promise<{ updated: number; errors: string[] }> {
  const errors: string[] = [];
  let updated = 0;
  
  // Trova prodotti senza barcode
  const productsWithoutBarcode = await db.select({ id: products.id, name: products.name })
    .from(products)
    .where(eq(products.barcode, null as any));
  
  for (const product of productsWithoutBarcode) {
    try {
      const barcode = await generateUniqueBarcode();
      await db.update(products)
        .set({ barcode })
        .where(eq(products.id, product.id));
      updated++;
    } catch (error) {
      errors.push(`Errore per prodotto ${product.id}: ${error}`);
    }
  }
  
  return { updated, errors };
}
