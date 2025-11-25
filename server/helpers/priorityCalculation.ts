/**
 * Calculate repair order priority based on diagnostic data
 * 
 * Priority calculation rules:
 * - Requires external parts → medium priority (potential delays)
 * - Long repair time (>8h) → high priority
 * - Medium repair time (4-8h) → medium priority
 * - Short repair time → low priority
 */

export type RepairPriority = 'low' | 'medium' | 'high';

export interface DiagnosticData {
  estimatedRepairTime?: number; // in hours
  requiresExternalParts: boolean;
}

export function calculateRepairPriority(diagnostic: DiagnosticData): RepairPriority {
  const { estimatedRepairTime, requiresExternalParts } = diagnostic;
  
  // Long repair time (>8 hours) → high priority
  if (estimatedRepairTime && estimatedRepairTime > 8) {
    return 'high';
  }
  
  // Requires external parts → medium priority (potential delays)
  if (requiresExternalParts) {
    return 'medium';
  }
  
  // Medium repair time (4-8 hours) → medium priority
  if (estimatedRepairTime && estimatedRepairTime >= 4) {
    return 'medium';
  }
  
  // Short repair time → low priority
  return 'low';
}
