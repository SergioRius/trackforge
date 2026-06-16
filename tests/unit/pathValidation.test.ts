import { describe, it, expect } from 'vitest';
import {
  validatePathIsWithinDest,
  validateNoPathTraversal,
  isValidFileName,
  isAudioFile,
} from '../../src/backend/domain/pathValidation';

describe('pathValidation', () => {
  describe('validatePathIsWithinDest', () => {
    it('validates valid path', () => {
      const result = validatePathIsWithinDest('Rock/Queen', '/destination');
      expect(result.toString()).toBe('Rock/Queen');
    });

    it('throws on root path', () => {
      expect(() => validatePathIsWithinDest('', '/destination')).toThrow();
    });
  });

  describe('validateNoPathTraversal', () => {
    it('passes for safe paths', () => {
      expect(() => validateNoPathTraversal('Rock/Queen/Album')).not.toThrow();
    });

    it('throws on path traversal', () => {
      expect(() => validateNoPathTraversal('../secret')).toThrow();
      expect(() => validateNoPathTraversal('foo/../../bar')).toThrow();
    });

    it('allows dots in filenames that are not path segments', () => {
      expect(() =>
        validateNoPathTraversal('Dave Grusin/Migration/08 - T.K.O..mp3'),
      ).not.toThrow();
      expect(() => validateNoPathTraversal('Artist/Album/01 - Song...mp3')).not.toThrow();
    });
  });

  describe('isValidFileName', () => {
    it('accepts valid filenames', () => {
      expect(isValidFileName('01 - Song.mp3')).toBe(true);
      expect(isValidFileName('Song.flac')).toBe(true);
    });

    it('rejects filenames with illegal chars', () => {
      expect(isValidFileName('bad:file.mp3')).toBe(false);
      expect(isValidFileName('bad?file.mp3')).toBe(false);
    });

    it('rejects empty filenames', () => {
      expect(isValidFileName('')).toBe(false);
    });
  });

  describe('isAudioFile', () => {
    it('detects audio files', () => {
      expect(isAudioFile('song.mp3')).toBe(true);
      expect(isAudioFile('song.flac')).toBe(true);
      expect(isAudioFile('song.m4a')).toBe(true);
    });

    it('rejects non-audio files', () => {
      expect(isAudioFile('song.wav')).toBe(false);
      expect(isAudioFile('song.txt')).toBe(false);
      expect(isAudioFile('cover.jpg')).toBe(false);
    });
  });
});
