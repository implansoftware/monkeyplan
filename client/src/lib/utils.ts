import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// === VAT/IVA UTILITIES ===
// Prezzi nel DB sono SENZA IVA, mostrati all'utente CON IVA

export const DEFAULT_VAT_RATE = 22; // Aliquota IVA standard Italia

// Aliquote IVA disponibili in Italia
export const VAT_RATES = [
  { value: 22, label: "22% - IVA Standard" },
  { value: 10, label: "10% - IVA Ridotta" },
  { value: 5, label: "5% - IVA Super Ridotta" },
  { value: 4, label: "4% - IVA Minima" },
  { value: 0, label: "0% - Esente IVA" },
] as const;

/**
 * Calcola il prezzo con IVA inclusa
 * @param priceCents - Prezzo in centesimi (IVA esclusa)
 * @param vatRate - Aliquota IVA % (default 22)
 * @returns Prezzo in centesimi (IVA inclusa)
 */
export function addVat(priceCents: number, vatRate: number = DEFAULT_VAT_RATE): number {
  return Math.round(priceCents * (1 + vatRate / 100));
}

/**
 * Rimuove l'IVA dal prezzo
 * @param priceWithVatCents - Prezzo in centesimi (IVA inclusa)
 * @param vatRate - Aliquota IVA % (default 22)
 * @returns Prezzo in centesimi (IVA esclusa)
 */
export function removeVat(priceWithVatCents: number, vatRate: number = DEFAULT_VAT_RATE): number {
  return Math.round(priceWithVatCents / (1 + vatRate / 100));
}

/**
 * Calcola l'importo IVA
 * @param priceCents - Prezzo in centesimi (IVA esclusa)
 * @param vatRate - Aliquota IVA % (default 22)
 * @returns Importo IVA in centesimi
 */
export function calculateVat(priceCents: number, vatRate: number = DEFAULT_VAT_RATE): number {
  return Math.round(priceCents * vatRate / 100);
}

/**
 * Formatta prezzo con IVA
 * @param priceCents - Prezzo in centesimi (IVA esclusa)
 * @param vatRate - Aliquota IVA % (default 22)
 * @returns Stringa formattata con IVA inclusa (es. "€ 122,00")
 */
export function formatPriceWithVat(priceCents: number, vatRate: number = DEFAULT_VAT_RATE): string {
  const priceWithVat = addVat(priceCents, vatRate);
  return formatCurrency(priceWithVat);
}

/**
 * Formatta valuta in Euro
 * @param cents - Importo in centesimi
 * @returns Stringa formattata (es. "€ 100,00")
 */
export function formatCurrency(cents: number): string {
  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: 'EUR',
  }).format(cents / 100);
}

/**
 * Calcola riepilogo IVA per lista items
 * @param items - Array di oggetti con priceCents, quantity, vatRate
 * @returns Oggetto con subtotal, vatAmount, total (tutti in cents)
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
