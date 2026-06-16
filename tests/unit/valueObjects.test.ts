import { describe, it, expect } from 'vitest';
import { CapacityLimit, TrackNumber, LibraryPath } from '../../src/shared/types/entities';

describe('Value Objects', () => {
  describe('TrackNumber', () => {
    it('creates zero-padded track number', () => {
      expect(TrackNumber.create(1).toString()).toBe('01');
      expect(TrackNumber.create(10).toString()).toBe('10');
      expect(TrackNumber.create(99).toString()).toBe('99');
    });

    it('throws on invalid numbers', () => {
      expect(() => TrackNumber.create(0)).toThrow();
      expect(() => TrackNumber.create(1000)).toThrow();
      expect(() => TrackNumber.create(-1)).toThrow();
    });

    it('parses from string', () => {
      expect(TrackNumber.fromString('07').toString()).toBe('07');
      expect(TrackNumber.fromString('7').toString()).toBe('07');
    });
  });

  describe('CapacityLimit', () => {
    it('converts to bytes', () => {
      const limit = CapacityLimit.create(1);
      expect(limit.toBytes()).toBe(1024 * 1024 * 1024);
    });

    it('returns gigabytes', () => {
      const limit = CapacityLimit.create(64);
      expect(limit.toGigabytes()).toBe(64);
    });

    it('throws on invalid values', () => {
      expect(() => CapacityLimit.create(0)).toThrow();
      expect(() => CapacityLimit.create(-10)).toThrow();
    });
  });

  describe('LibraryPath', () => {
    it('normalizes slashes', () => {
      expect(LibraryPath.create('Rock/Queen/Album').toString()).toBe('Rock/Queen/Album');
      expect(LibraryPath.create('Rock\\Queen').toString()).toBe('Rock/Queen');
    });

    it('detects path traversal', () => {
      expect(() => LibraryPath.create('../escape')).toThrow();
      expect(() => LibraryPath.create('foo/../../bar')).toThrow();
    });

    it('gets segments', () => {
      const path = LibraryPath.create('Rock/Queen/Album');
      expect(path.getSegments()).toEqual(['Rock', 'Queen', 'Album']);
    });

    it('gets parent', () => {
      expect(LibraryPath.create('Rock/Queen/Album').getParent().toString()).toBe('Rock/Queen');
    });

    it('gets leaf', () => {
      expect(LibraryPath.create('Rock/Queen/Album').getLeaf()).toBe('Album');
    });
  });
});
