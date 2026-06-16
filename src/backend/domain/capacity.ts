import { CapacityLimit } from '@trackforge/shared';

export interface CapacityCheckResult {
  allowed: boolean;
  currentSizeBytes: number;
  incomingSizeBytes: number;
  limitBytes: number;
  availableBytes: number;
  usagePercent: number;
}

export function checkCapacity(
  currentSizeBytes: number,
  incomingSizeBytes: number,
  limit: CapacityLimit,
): CapacityCheckResult {
  const limitBytes = limit.toBytes();
  const totalAfter = currentSizeBytes + incomingSizeBytes;
  const allowed = totalAfter <= limitBytes;

  return {
    allowed,
    currentSizeBytes,
    incomingSizeBytes,
    limitBytes,
    availableBytes: limitBytes - currentSizeBytes,
    usagePercent: Math.round((currentSizeBytes / limitBytes) * 100),
  };
}

export function calculateTotalSize(files: { sizeBytes: number }[]): number {
  return files.reduce((sum, f) => sum + f.sizeBytes, 0);
}
