import { describe, it, expect } from 'vitest';
import { truncateFilename } from '../../src/frontend/components/common/Common';

describe('truncateFilename', () => {
  it('returns short names unchanged', () => {
    expect(truncateFilename('01 - Song.mp3')).toBe('01 - Song.mp3');
    expect(truncateFilename('Short')).toBe('Short');
  });

  it('truncates long names with ellipsis in the middle', () => {
    const long =
      '10 - Suite From The Milagro Beanfield War Soundtrack Deluxe Edition - Lupita.mp3';
    const result = truncateFilename(long);
    expect(result).toContain('...');
    expect(result).toContain('.mp3');
    expect(result.length).toBeLessThan(long.length);
    expect(result.startsWith('10 - ')).toBe(true);
    expect(result.endsWith('.mp3')).toBe(true);
  });

  it('preserves file extension', () => {
    const long =
      '01 - This Is A Very Very Long Track Name That Goes On And On And On.flac';
    const result = truncateFilename(long);
    expect(result.endsWith('.flac')).toBe(true);
  });

  it('handles names without extension', () => {
    const long =
      'This Is A Very Very Long Track Name Without Any Extension Whatsoever';
    const result = truncateFilename(long);
    expect(result).toContain('...');
    expect(result.length).toBeLessThan(long.length);
  });

  it('handles maxLen parameter', () => {
    const name = '01 - Not Really That Very Long Title Name.mp3';
    const result = truncateFilename(name, 27);
    expect(result).toContain('...');
    expect(result.length).toBeLessThanOrEqual(27);
  });
});
