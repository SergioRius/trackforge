import { describe, it, expect } from 'vitest';
import { checkCapacity, calculateTotalSize } from '../../src/backend/domain/capacity';
import { CapacityLimit } from '../../src/shared/types/entities';

describe('capacity', () => {
  describe('checkCapacity', () => {
    it('allows when within limit', () => {
      const result = checkCapacity(1073741824, 1073741824, CapacityLimit.create(3));
      // 1GB + 1GB = 2GB, limit is 3GB
      expect(result.allowed).toBe(true);
      expect(result.usagePercent).toBe(33);
    });

    it('rejects when exceeds limit', () => {
      const result = checkCapacity(
        3 * 1024 * 1024 * 1024,
        1024 * 1024 * 1024,
        CapacityLimit.create(3),
      );
      expect(result.allowed).toBe(false);
    });

    it('allows when exactly at limit', () => {
      const limitBytes = 2 * 1024 * 1024 * 1024;
      const result = checkCapacity(limitBytes, 0, CapacityLimit.create(2));
      expect(result.allowed).toBe(true);
      expect(result.availableBytes).toBe(0);
    });

    it('calculates usage percent correctly', () => {
      const result = checkCapacity(5368709120, 0, CapacityLimit.create(10));
      // 5GB of 10GB = 50%
      expect(result.usagePercent).toBe(50);
    });
  });

  describe('calculateTotalSize', () => {
    it('sums file sizes', () => {
      const files = [{ sizeBytes: 100 }, { sizeBytes: 200 }, { sizeBytes: 300 }];
      expect(calculateTotalSize(files)).toBe(600);
    });

    it('returns 0 for empty array', () => {
      expect(calculateTotalSize([])).toBe(0);
    });
  });
});
