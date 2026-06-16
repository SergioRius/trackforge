import { describe, it, expect } from 'vitest';
import {
  normalizeTrackForAlbum,
  normalizeTrackForCompilation,
  isCompilationPath,
  getCompilationName,
} from '../../src/backend/domain/normalization';
import type { Track } from '../../src/shared/types/entities';

const makeTrack = (overrides: Partial<Track> = {}): Track => ({
  sourcePath: '/music/Rock/Queen/01 - Bohemian Rhapsody.mp3',
  filename: '01 - Bohemian Rhapsody.mp3',
  title: 'Bohemian Rhapsody',
  trackNumber: '01',
  album: 'Greatest Hits',
  artist: 'Queen',
  sizeBytes: 5000000,
  format: 'mp3',
  duration: 354,
  ...overrides,
});

describe('normalization', () => {
  describe('normalizeTrackForAlbum', () => {
    it('adds track number prefix to title', () => {
      const track = makeTrack({ title: 'One Vision' });
      const result = normalizeTrackForAlbum(track, 7);
      expect(result.track.title).toBe('07 - One Vision');
      expect(result.changes.titleChanged).toBe(true);
      expect(result.changes.albumChanged).toBe(false);
      expect(result.changes.filenameChanged).toBe(false);
    });

    it('does not change if title already matches', () => {
      const track = makeTrack({ title: '01 - Bohemian Rhapsody' });
      const result = normalizeTrackForAlbum(track, 1);
      expect(result.track.title).toBe('01 - Bohemian Rhapsody');
      expect(result.changes.titleChanged).toBe(false);
    });
  });

  describe('normalizeTrackForCompilation', () => {
    it('sets all metadata for compilation track', () => {
      const track = makeTrack({ title: 'Bohemian Rhapsody', album: 'Greatest Hits' });
      const result = normalizeTrackForCompilation(track, 0, 'Road Trip');
      expect(result.track.title).toBe('01 - Bohemian Rhapsody');
      expect(result.track.album).toBe('Road Trip');
      expect(result.track.filename).toBe('01 - Bohemian Rhapsody.mp3');
      expect(result.track.trackNumber).toBe('01');
      expect(result.changes.titleChanged).toBe(true);
      expect(result.changes.albumChanged).toBe(true);
      expect(result.changes.filenameChanged).toBe(false); // same filename as original
    });

    it('uses correct track number based on index', () => {
      const track = makeTrack();
      const result = normalizeTrackForCompilation(track, 4, 'Mixtape');
      expect(result.track.trackNumber).toBe('05');
      expect(result.track.title).toBe('05 - Bohemian Rhapsody');
    });

    it('strips existing track number prefix from title', () => {
      const track = makeTrack({ title: '01 - Fill Me In' });
      const result = normalizeTrackForCompilation(track, 2, 'New Mix');
      expect(result.track.title).toBe('03 - Fill Me In');
    });

    it('strips existing track number prefix from filename', () => {
      const track = makeTrack({
        title: '01 - Fill Me In',
        filename: '01 - Fill Me In.mp3',
      });
      const result = normalizeTrackForCompilation(track, 0, 'Mixtape');
      expect(result.track.filename).toBe('01 - Fill Me In.mp3');
    });
  });

  describe('isCompilationPath', () => {
    it('detects compilation path', () => {
      expect(isCompilationPath('Compilations/Road Trip', 'Compilations')).toBe(true);
    });

    it('detects non-compilation path', () => {
      expect(isCompilationPath('Rock/Queen/Album', 'Compilations')).toBe(false);
    });

    it('handles windows separators', () => {
      expect(isCompilationPath('Compilations\\Road Trip', 'Compilations')).toBe(true);
    });
  });

  describe('getCompilationName', () => {
    it('extracts compilation name from path', () => {
      expect(getCompilationName('Compilations/Road Trip 2026')).toBe('Road Trip 2026');
    });

    it('returns null for shallow path', () => {
      expect(getCompilationName('Compilations')).toBeNull();
    });
  });
});
