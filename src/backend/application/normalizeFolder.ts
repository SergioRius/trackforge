import {
  IFileSystem,
  IMetadataReader,
  IMetadataWriter,
  ILogger,
  OperationResult,
  IConfigStore,
} from './ports.js';
import {
  isCompilationPath,
  normalizeTrackForAlbum,
  normalizeTrackForCompilation,
} from '../domain/index.js';
import path from 'path';

export class NormalizeFolder {
  constructor(
    private readonly fs: IFileSystem,
    private readonly metadataReader: IMetadataReader,
    private readonly metadataWriter: IMetadataWriter,
    private readonly config: IConfigStore,
    private readonly logger: ILogger,
  ) {}

  private async safeWrite(track: import('@trackforge/shared').Track, filePath: string): Promise<void> {
    try {
      await this.metadataWriter.writeMetadata(track, filePath);
    } catch (err) {
      this.logger.warn('Failed to write metadata, skipping', {
        file: filePath,
        error: (err as Error).message,
      });
    }
  }

  async execute(
    folderPath: string,
    previewOnly = false,
  ): Promise<
    OperationResult<{
      filesAffected: number;
      mode: 'album' | 'compilation';
      changes: { title: number; album: number; filename: number; trackNumber: number };
    }>
  > {
    try {
      const config = this.config.getConfig();
      const mode: 'album' | 'compilation' = isCompilationPath(
        folderPath,
        config.compilationsDirectory,
      )
        ? 'compilation'
        : 'album';

      const files = await this.fs.listFiles(folderPath);
      const audioFiles = files.filter((f) => {
        const ext = f.toLowerCase().split('.').pop();
        return ext === 'mp3' || ext === 'flac' || ext === 'm4a';
      });

      const sorted = audioFiles.sort();

      const preview = {
        filesAffected: sorted.length,
        mode,
        changes: {
          title: sorted.length,
          album: mode === 'compilation' ? sorted.length : 0,
          filename: mode === 'compilation' ? sorted.length : 0,
          trackNumber: mode === 'compilation' ? sorted.length : 0,
        },
      };

      if (previewOnly) {
        return { success: true, data: preview };
      }

      for (let i = 0; i < sorted.length; i++) {
        const file = sorted[i]!;
        const filePath = path.posix.join(folderPath, file);
        const absPath = path.join(config.destinationDir, filePath);

        const track = await this.metadataReader.readMetadata(absPath);

        if (mode === 'album') {
          const result = normalizeTrackForAlbum(track, i + 1);
          if (result.changes.titleChanged) {
            await this.safeWrite(result.track, absPath);
          }
        } else {
          const compilationName = folderPath.split('/').slice(-1)[0] ?? folderPath;
          const result = normalizeTrackForCompilation(track, i, compilationName);

          if (result.changes.filenameChanged) {
            const newAbs = path.join(path.dirname(absPath), result.track.filename);
            await this.fs.copyFile(filePath, path.relative(config.destinationDir, newAbs));
            await this.safeWrite(result.track, newAbs);
            await this.fs.deleteFolder(filePath);
          } else {
            await this.safeWrite(result.track, absPath);
          }
        }
      }

      return { success: true, data: preview };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      this.logger.error('Failed to normalize folder', { error: message });
      return { success: false, error: message };
    }
  }
}
