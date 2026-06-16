import { LibraryPath } from '@trackforge/shared';

export function validatePathIsWithinDest(
  relativePath: string,
  _destinationDir: string,
): LibraryPath {
  const lp = LibraryPath.create(relativePath);

  if (lp.toString() === '') {
    throw new Error('Cannot delete the root destination directory.');
  }

  return lp;
}

export function validateNoPathTraversal(filePath: string): void {
  const normalized = filePath.replace(/\\/g, '/');
  const segments = normalized.split('/');
  if (segments.includes('..')) {
    throw new Error(`Path traversal detected: ${filePath}`);
  }
}

export function isValidFileName(filename: string): boolean {
  const ILLEGAL = /[<>:"/\\|?*\u0000-\u001F]/u;
  return !ILLEGAL.test(filename) && filename.length > 0 && filename.length <= 255;
}

export function isAudioFile(filename: string): boolean {
  const ext = filename.toLowerCase().split('.').pop();
  return ext === 'mp3' || ext === 'flac' || ext === 'm4a';
}
