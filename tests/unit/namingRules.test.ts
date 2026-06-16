import { describe, it, expect } from 'vitest';
import {
  sanitizeFilename,
  formatTrackTitle,
  formatTrackFilename,
  extractTrackNumber,
  stripTrackNumberPrefix,
} from '../../src/backend/domain/namingRules';

describe('namingRules', () => {
  describe('sanitizeFilename', () => {
    it('removes illegal characters', () => {
      expect(sanitizeFilename('Hello: World?')).toBe('Hello_ World_');
      expect(sanitizeFilename('test<file>.mp3')).toBe('test_file_.mp3');
      expect(sanitizeFilename('normal.txt')).toBe('normal.txt');
    });

    it('handles empty strings', () => {
      expect(sanitizeFilename('')).toBe('');
    });
  });

  describe('formatTrackTitle', () => {
    it('formats track number and title', () => {
      expect(formatTrackTitle(1, 'Bohemian Rhapsody')).toBe('01 - Bohemian Rhapsody');
      expect(formatTrackTitle(12, 'One Vision')).toBe('12 - One Vision');
    });

    it('zero-pads single digit numbers', () => {
      expect(formatTrackTitle(7, 'Song')).toBe('07 - Song');
    });

    it('handles three digit numbers', () => {
      expect(formatTrackTitle(100, 'Track')).toBe('100 - Track');
    });
  });

  describe('formatTrackFilename', () => {
    it('formats track filename with extension', () => {
      expect(formatTrackFilename(1, 'Bohemian Rhapsody', '.mp3')).toBe(
        '01 - Bohemian Rhapsody.mp3',
      );
      expect(formatTrackFilename(5, 'Song', 'mp3')).toBe('05 - Song.mp3');
    });

    it('sanitizes illegal characters in title', () => {
      expect(formatTrackFilename(1, 'Bad:Title', '.mp3')).toBe('01 - Bad_Title.mp3');
    });
  });

  describe('extractTrackNumber', () => {
    it('extracts track number from title', () => {
      expect(extractTrackNumber('01 - Bohemian Rhapsody')).toBe(1);
      expect(extractTrackNumber('12. Song')).toBe(12);
      expect(extractTrackNumber('07/ Title')).toBe(7);
    });

    it('returns null for invalid formats', () => {
      expect(extractTrackNumber('No Number')).toBeNull();
      expect(extractTrackNumber('0123 - Too Many')).toBeNull();
      expect(extractTrackNumber('0 - Zero')).toBeNull();
    });
  });

  describe('stripTrackNumberPrefix', () => {
    it('strips track number prefix', () => {
      expect(stripTrackNumberPrefix('01 - Bohemian Rhapsody')).toBe('Bohemian Rhapsody');
      expect(stripTrackNumberPrefix('12. My Song')).toBe('My Song');
    });

    it('returns original if no prefix', () => {
      expect(stripTrackNumberPrefix('Pure Title')).toBe('Pure Title');
    });
  });
});
