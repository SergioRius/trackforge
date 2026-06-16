// eslint-disable-next-line no-control-regex
const ILLEGAL_CHARS_REGEX = /[<>:"/\\|?*\x00-\x1f]/g;

export function sanitizeFilename(name: string): string {
  return name.replace(ILLEGAL_CHARS_REGEX, '_').trim();
}

export function formatTrackTitle(trackNumber: number, title: string): string {
  const num = trackNumber.toString().padStart(2, '0');
  return `${num} - ${title}`;
}

export function formatTrackFilename(trackNumber: number, title: string, extension: string): string {
  const num = trackNumber.toString().padStart(2, '0');
  const safeExt = extension.startsWith('.') ? extension : `.${extension}`;
  return sanitizeFilename(`${num} - ${title}${safeExt}`);
}

export function extractTrackNumber(title: string): number | null {
  const match = title.match(/^(\d{1,3})\s*[-./]\s*/);
  if (!match) return null;
  const num = parseInt(match[1]!, 10);
  if (num < 1 || num > 999) return null;
  return num;
}

export function stripTrackNumberPrefix(title: string): string {
  return title.replace(/^\d{1,3}\s*[-./]\s*/, '').trim();
}
