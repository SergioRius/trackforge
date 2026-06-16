export type AudioFormat = 'mp3' | 'flac' | 'm4a' | 'unknown';

export const SUPPORTED_FORMATS: AudioFormat[] = ['mp3', 'flac', 'm4a'];
export const SUPPORTED_EXTENSIONS = ['.mp3', '.flac', '.m4a'];

export interface Track {
  /** Absolute path to the source file */
  sourcePath: string;
  /** Filename with extension */
  filename: string;
  /** Normalized title: "NN - Title" */
  title: string;
  /** Zero-padded track number, e.g. "01" */
  trackNumber: string;
  /** Album name */
  album: string;
  /** Artist name */
  artist: string;
  /** File size in bytes */
  sizeBytes: number;
  /** Audio format */
  format: AudioFormat;
  /** Duration in seconds */
  duration: number;
}

export interface Album {
  /** Relative path from source root, e.g. "Rock/Queen/1986 - A Kind Of Magic" */
  relativePath: string;
  /** Album name (leaf folder name) */
  name: string;
  /** Tracks in this album */
  tracks: Track[];
  /** Total size in bytes */
  totalSizeBytes: number;
}

export interface Compilation {
  /** Compilation name */
  name: string;
  /** Ordered tracks */
  tracks: Track[];
  /** Copy progress or status */
  status: 'draft' | 'copying' | 'completed' | 'error';
}

export interface TreeNode {
  name: string;
  relativePath: string;
  type: 'directory' | 'album' | 'track';
  children?: TreeNode[];
  trackCount?: number;
  totalSizeBytes?: number;
  files?: string[];
}

export interface LibraryStats {
  albumCount: number;
  compilationCount: number;
  totalTracks: number;
  totalSizeBytes: number;
}

// Value Objects

export class TrackNumber {
  private constructor(private readonly value: string) {}

  static create(num: number): TrackNumber {
    if (!Number.isInteger(num) || num < 1 || num > 999) {
      throw new Error(`Invalid track number: ${num}. Must be 1-999.`);
    }
    return new TrackNumber(num.toString().padStart(2, '0'));
  }

  static fromString(str: string): TrackNumber {
    const parsed = parseInt(str, 10);
    return TrackNumber.create(parsed);
  }

  toString(): string {
    return this.value;
  }

  toNumber(): number {
    return parseInt(this.value, 10);
  }
}

export class LibraryPath {
  private constructor(private readonly value: string) {}

  static create(path: string): LibraryPath {
    const normalized = path.replace(/\\/g, '/').replace(/\/+$/, '').replace(/^\/+/, '');
    if (normalized.includes('..')) {
      throw new Error(`Path traversal detected: ${path}`);
    }
    return new LibraryPath(normalized);
  }

  toString(): string {
    return this.value;
  }

  getSegments(): string[] {
    return this.value.split('/').filter(Boolean);
  }

  getParent(): LibraryPath {
    const segments = this.getSegments();
    if (segments.length === 0) return this;
    return LibraryPath.create(segments.slice(0, -1).join('/'));
  }

  getLeaf(): string {
    return this.getSegments().pop() ?? '';
  }
}

export class CapacityLimit {
  private constructor(private readonly gigabytes: number) {}

  static create(gb: number): CapacityLimit {
    if (gb <= 0 || !Number.isFinite(gb)) {
      throw new Error(`Invalid capacity: ${gb}GB. Must be > 0.`);
    }
    return new CapacityLimit(gb);
  }

  toBytes(): number {
    return this.gigabytes * 1024 * 1024 * 1024;
  }

  toGigabytes(): number {
    return this.gigabytes;
  }
}
