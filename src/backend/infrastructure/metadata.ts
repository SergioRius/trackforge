import { IMetadataReader, IMetadataWriter } from '../application/ports.js';
import { Track, AudioFormat } from '@trackforge/shared';
import * as mm from 'music-metadata';
import * as fs from 'fs/promises';
import path from 'path';

function detectFormat(ext: string): AudioFormat {
  const map: Record<string, AudioFormat> = {
    '.mp3': 'mp3',
    '.flac': 'flac',
    '.m4a': 'm4a',
  };
  return map[ext] ?? 'unknown';
}

export class MusicMetadataService implements IMetadataReader, IMetadataWriter {
  private sourceDir: string;

  constructor(sourceDir: string) {
    this.sourceDir = sourceDir;
  }

  async readMetadata(filePath: string): Promise<Track> {
    const absolutePath = path.resolve(this.sourceDir, filePath);
    const metadata = await mm.parseFile(absolutePath);
    const stat = await fs.stat(absolutePath);
    const ext = absolutePath.split('.').pop()?.toLowerCase() ?? 'mp3';

    const common = metadata.common;
    const format = metadata.format;

    const trackNumber = String(common.track?.no ?? 1).padStart(2, '0');
    const title =
      common.title ??
      absolutePath
        .split('/')
        .pop()
        ?.replace(/\.[^.]+$/, '') ??
      'Unknown';
    const album = common.album ?? 'Unknown Album';
    const artist = common.artist ?? 'Unknown Artist';

    return {
      sourcePath: filePath,
      filename: absolutePath.split('/').pop() ?? 'unknown.mp3',
      title,
      trackNumber,
      album,
      artist,
      sizeBytes: stat.size,
      format: detectFormat(`.${ext}`),
      duration: format.duration ?? 0,
    };
  }

  async writeMetadata(track: Track, filePath: string): Promise<void> {
    const ext = filePath.split('.').pop()?.toLowerCase() ?? '.mp3';
    const audioFormat = detectFormat(`.${ext}`);

    if (audioFormat === 'mp3') {
      await this.writeMp3Metadata(track, filePath);
    } else if (audioFormat === 'flac') {
      await this.writeFlacMetadata(track, filePath);
    } else if (audioFormat === 'm4a') {
      await this.writeM4aMetadata(track, filePath);
    }
  }

  private async writeMp3Metadata(track: Track, filePath: string): Promise<void> {
    const ffmetadata = [
      ';FFMETADATA1',
      `title=${track.title}`,
      `artist=${track.artist}`,
      `album=${track.album}`,
      `track=${track.trackNumber}`,
    ].join('\n');

    const tmpFile = filePath + '.ffmeta.tmp';
    await fs.writeFile(tmpFile, ffmetadata, 'utf-8');

    try {
      const { execSync } = await import('child_process');
      execSync(
        `ffmpeg -y -i "${filePath}" -i "${tmpFile}" -map_metadata 1 -codec copy "${filePath}.tmp.mp3"`,
        {
          stdio: 'pipe',
        },
      );
      await fs.rename(`${filePath}.tmp.mp3`, filePath);
    } finally {
      try {
        await fs.unlink(tmpFile);
      } catch {
        /* ignore */
      }
      try {
        await fs.unlink(`${filePath}.tmp.mp3`);
      } catch {
        /* ignore */
      }
    }
  }

  private async writeFlacMetadata(track: Track, filePath: string): Promise<void> {
    const { execSync } = await import('child_process');
    execSync(
      `metaflac --remove-all-tags "${filePath}" ` +
        `--set-tag="TITLE=${track.title}" ` +
        `--set-tag="ARTIST=${track.artist}" ` +
        `--set-tag="ALBUM=${track.album}" ` +
        `--set-tag="TRACKNUMBER=${track.trackNumber}"`,
      { stdio: 'pipe' },
    );
  }

  private async writeM4aMetadata(track: Track, filePath: string): Promise<void> {
    const { execSync } = await import('child_process');
    const tmpFile = filePath + '.tmp.m4a';
    execSync(
      `ffmpeg -y -i "${filePath}" ` +
        `-metadata title="${track.title}" ` +
        `-metadata artist="${track.artist}" ` +
        `-metadata album="${track.album}" ` +
        `-metadata track="${track.trackNumber}" ` +
        `-codec copy "${tmpFile}"`,
      { stdio: 'pipe' },
    );
    await fs.rename(tmpFile, filePath);
  }
}
