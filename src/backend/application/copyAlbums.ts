import { CapacityLimit, Album, Track } from '@trackforge/shared';
import {
  IFileSystem,
  IMetadataReader,
  IMetadataWriter,
  ILogger,
  OperationResult,
  PreviewData,
  IConfigStore,
} from './ports.js';
import { checkCapacity, calculateTotalSize, normalizeTrackForAlbum } from '../domain/index.js';
import path from 'path';

export class CopyAlbums {
  constructor(
    private readonly fs: IFileSystem,
    private readonly metadataReader: IMetadataReader,
    private readonly metadataWriter: IMetadataWriter,
    private readonly config: IConfigStore,
    private readonly logger: ILogger,
  ) {}

  async execute(albumPaths: string[], previewOnly = false): Promise<OperationResult<PreviewData>> {
    try {
      const settings = this.config.getConfig();
      const limit = CapacityLimit.create(settings.maxLibrarySizeGb);

      const currentSize = await this.fs.calculateDirectorySize('');
      const albums = await this.scanAlbums(albumPaths);
      const incomingSize = albums.reduce((sum, a) => sum + a.totalSizeBytes, 0);

      const capacityCheck = checkCapacity(currentSize, incomingSize, limit);

      const preview: PreviewData = {
        filesAffected: albums.reduce((sum, a) => sum + a.tracks.length, 0),
        estimatedSizeBytes: incomingSize,
        metadataChanges: {
          title: albums.reduce((sum, a) => sum + a.tracks.length, 0),
          album: 0,
          filename: 0,
          trackNumber: 0,
        },
      };

      if (!capacityCheck.allowed) {
        return {
          success: false,
          error:
            `Capacity exceeded. Current: ${(currentSize / 1e9).toFixed(2)}GB, ` +
            `Incoming: ${(incomingSize / 1e9).toFixed(2)}GB, ` +
            `Limit: ${settings.maxLibrarySizeGb}GB`,
          preview,
        };
      }

      if (previewOnly) {
        return { success: true, preview };
      }

      for (const album of albums) {
        this.logger.info('Copying album', { album: album.relativePath });

        for (let i = 0; i < album.tracks.length; i++) {
          const track = album.tracks[i]!;
          const relativeDest = path.join(album.relativePath, track.filename);
          await this.fs.copyFile(track.sourcePath, relativeDest);

          const destPath = path.join(settings.destinationDir, relativeDest);
          const result = normalizeTrackForAlbum(track, i + 1);
          try {
            await this.metadataWriter.writeMetadata(result.track, destPath);
          } catch (metaErr) {
            this.logger.warn('Failed to write metadata, skipping', {
              file: relativeDest,
              error: (metaErr as Error).message,
            });
          }
        }
      }

      return { success: true, preview };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      this.logger.error('Failed to copy albums', { error: message });
      return { success: false, error: message };
    }
  }

  private async scanAlbums(
    albumPaths: string[],
  ): Promise<Album[]> {
    const expanded = await this.expandPaths(albumPaths);
    const albums: Album[] = [];

    for (const albumPath of expanded) {
      const files = await this.fs.listFiles(albumPath);
      const audioFiles = files.filter((f) => {
        const ext = f.toLowerCase().split('.').pop();
        return ext === 'mp3' || ext === 'flac' || ext === 'm4a';
      });

      const tracks: Track[] = [];
      for (const file of audioFiles) {
        const filePath = path.posix.join(albumPath, file);
        const track = await this.metadataReader.readMetadata(filePath);
        tracks.push(track);
      }

      albums.push({
        relativePath: albumPath,
        name: albumPath.split('/').pop() ?? albumPath,
        tracks,
        totalSizeBytes: calculateTotalSize(tracks),
      });
    }

    return albums;
  }

  private async expandPaths(paths: string[]): Promise<string[]> {
    const result: string[] = [];
    for (const p of paths) {
      const isDir = await this.fs.isDirectory(p);
      if (!isDir) continue;

      const files = await this.fs.listFiles(p);
      const hasAudio = files.some((f) => {
        const ext = f.toLowerCase().split('.').pop();
        return ext === 'mp3' || ext === 'flac' || ext === 'm4a';
      });

      if (hasAudio) {
        result.push(p);
      } else {
        const albumPaths = await this.fs.collectAlbumPaths(p);
        result.push(...albumPaths);
      }
    }
    return result;
  }
}
