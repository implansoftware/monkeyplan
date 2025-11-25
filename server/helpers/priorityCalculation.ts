/**
 * Calculate repair order priority based on diagnostic data
 * 
 * Priority calculation rules:
 * - Critical/High severity → high priority
 * - Medium severity + external parts needed → medium priority
 * - Medium severity + long repair time (>8h) → medium priority
 * - Low severity or simple repairs → low priority
 */

export type DiagnosisSeverity = 'low' | 'medium' | 'high' | 'critical';
export type RepairPriority = 'low' | 'medium' | 'high';

export interface DiagnosticData {
  severity: DiagnosisSeverity;
  estimatedRepairTime?: number; // in hours
  requiresExternalParts: boolean;
}

export function calculateRepairPriority(diagnostic: DiagnosticData): RepairPriority {
  const { severity, estimatedRepairTime, requiresExternalParts } = diagnostic;
  
  // Critical or high severity always gets high priority
  if (severity === 'critical' || severity === 'high') {
    return 'high';
  }
  
  // Medium severity conditions
  if (severity === 'medium') {
    // Requires external parts → medium priority (potential delays)
    if (requiresExternalParts) {
      return 'medium';
    }
    
    // Long repair time (>8 hours) → medium priority
    if (estimatedRepairTime && estimatedRepairTime > 8) {
      return 'medium';
    }
    
    // Otherwise medium severity → low priority (routine repair)
    return 'low';
  }
  
  // Low severity → low priority
  return 'low';
}
