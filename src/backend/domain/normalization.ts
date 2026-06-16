import { Track } from '@trackforge/shared';
import {
  formatTrackTitle,
  formatTrackFilename,
  stripTrackNumberPrefix,
} from './namingRules.js';

export interface NormalizationResult {
  track: Track;
  changes: {
    titleChanged: boolean;
    albumChanged: boolean;
    filenameChanged: boolean;
    trackNumberChanged: boolean;
  };
}

export function normalizeTrackForAlbum(track: Track, trackNumber: number): NormalizationResult {
  const newTitle = formatTrackTitle(
    trackNumber,
    track.album ? stripAlbumPrefix(track.title) : track.title,
  );
  const oldTitle = track.title;

  return {
    track: { ...track, title: newTitle },
    changes: {
      titleChanged: oldTitle !== newTitle,
      albumChanged: false,
      filenameChanged: false,
      trackNumberChanged: false,
    },
  };
}

export function normalizeTrackForCompilation(
  track: Track,
  index: number,
  compilationName: string,
): NormalizationResult {
  const trackNumber = index + 1;
  const numStr = trackNumber.toString().padStart(2, '0');
  const cleanTitle = stripTrackNumberPrefix(track.title);
  const newTitle = formatTrackTitle(trackNumber, cleanTitle);
  const ext = track.filename.split('.').pop() ?? 'mp3';
  const cleanFilenameTitle = stripTrackNumberPrefix(
    track.filename.replace(/\.[^.]+$/, ''),
  );
  const newFilename = formatTrackFilename(trackNumber, cleanFilenameTitle, ext);

  const changes = {
    titleChanged: track.title !== newTitle,
    albumChanged: track.album !== compilationName,
    filenameChanged: track.filename !== newFilename,
    trackNumberChanged: track.trackNumber !== numStr,
  };

  return {
    track: {
      ...track,
      title: newTitle,
      album: compilationName,
      trackNumber: numStr,
      filename: newFilename,
    },
    changes,
  };
}

function stripAlbumPrefix(title: string): string {
  return title.replace(/^\d{2}\s*-\s*/, '').trim();
}

export function isCompilationPath(relativePath: string, compilationsDirectory: string): boolean {
  const firstSegment = relativePath.replace(/\\/g, '/').split('/').filter(Boolean)[0];
  return firstSegment === compilationsDirectory;
}

export function getCompilationName(relativePath: string): string | null {
  const segments = relativePath.replace(/\\/g, '/').split('/').filter(Boolean);
  if (segments.length < 2) return null;
  return segments[1] ?? null;
}
