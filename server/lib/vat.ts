// === VAT/IVA SERVER UTILITIES ===
// Prezzi nel DB sono SENZA IVA, calcolati CON IVA per visualizzazione

export const DEFAULT_VAT_RATE = 22; // Aliquota IVA standard Italia

/**
 * Calcola il prezzo con IVA inclusa
 */
export function addVat(priceCents: number, vatRate: number = DEFAULT_VAT_RATE): number {
  return Math.round(priceCents * (1 + vatRate / 100));
}

/**
 * Rimuove l'IVA dal prezzo
 */
export function removeVat(priceWithVatCents: number, vatRate: number = DEFAULT_VAT_RATE): number {
  return Math.round(priceWithVatCents / (1 + vatRate / 100));
}

/**
 * Calcola l'importo IVA
 */
export function calculateVat(priceCents: number, vatRate: number = DEFAULT_VAT_RATE): number {
  return Math.round(priceCents * vatRate / 100);
}

/**
 * Calcola riepilogo IVA per lista items
 */
export function calculateVatSummary(items: Array<{ priceCents: number; quantity: number; vatRate?: number }>): {
  subtotal: number;
  vatAmount: number;
  total: number;
} {
  let subtotal = 0;
  let vatAmount = 0;

  for (const item of items) {
    const itemTotal = item.priceCents * item.quantity;
    subtotal += itemTotal;
    vatAmount += calculateVat(itemTotal, item.vatRate ?? DEFAULT_VAT_RATE);
  }

  return {
    subtotal,
    vatAmount,
    total: subtotal + vatAmount,
  };
}
