import { CapacityLimit, CompilationCreateRequest } from '@trackforge/shared';
import {
  IFileSystem,
  IMetadataReader,
  IMetadataWriter,
  ILogger,
  OperationResult,
  PreviewData,
  IConfigStore,
} from './ports.js';
import {
  checkCapacity,
  normalizeTrackForCompilation,
  formatTrackFilename,
  stripTrackNumberPrefix,
} from '../domain/index.js';
import path from 'path';

export class CreateCompilation {
  constructor(
    private readonly fs: IFileSystem,
    private readonly metadataReader: IMetadataReader,
    private readonly metadataWriter: IMetadataWriter,
    private readonly config: IConfigStore,
    private readonly logger: ILogger,
  ) {}

  async execute(
    request: CompilationCreateRequest,
    previewOnly = false,
  ): Promise<OperationResult<PreviewData>> {
    try {
      const settings = this.config.getConfig();
      const limit = CapacityLimit.create(settings.maxLibrarySizeGb);

      const currentSize = await this.fs.calculateDirectorySize('');
      const incomingSize = request.tracks.reduce((sum, t) => sum + t.sizeBytes, 0);

      const capacityCheck = checkCapacity(currentSize, incomingSize, limit);

      const destRelPath = `${settings.compilationsDirectory}/${request.name}`;
      const preview: PreviewData = {
        filesAffected: request.tracks.length,
        estimatedSizeBytes: incomingSize,
        destinationPath: destRelPath,
        metadataChanges: {
          title: request.tracks.length,
          album: request.tracks.length,
          filename: request.tracks.length,
          trackNumber: request.tracks.length,
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

      await this.fs.ensureDir(destRelPath);

      for (let i = 0; i < request.tracks.length; i++) {
        const t = request.tracks[i]!;
        const ext = t.sourcePath.split('.').pop() ?? 'mp3';
        const cleanTitle = stripTrackNumberPrefix(t.title);
        const newFilename = formatTrackFilename(i + 1, cleanTitle, ext);
        const destFileRel = `${destRelPath}/${newFilename}`;

        this.logger.debug('Copying compilation track', { source: t.sourcePath, dest: destFileRel });

        await this.fs.copyFile(t.sourcePath, destFileRel);

        const fullTrack = await this.metadataReader.readMetadata(t.sourcePath);
        const result = normalizeTrackForCompilation(fullTrack, i, request.name);

        const destAbs = path.join(settings.destinationDir, destFileRel);
        try {
          await this.metadataWriter.writeMetadata(result.track, destAbs);
        } catch (metaErr) {
          this.logger.warn('Failed to write compilation metadata, skipping', {
            file: destFileRel,
            error: (metaErr as Error).message,
          });
        }
      }

      return { success: true, preview };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      this.logger.error('Failed to create compilation', { error: message });
      return { success: false, error: message };
    }
  }
}
