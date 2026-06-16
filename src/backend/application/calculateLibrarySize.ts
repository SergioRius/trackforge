import { CapacityLimit, LibraryStats } from '@trackforge/shared';
import { IFileSystem, ILogger, OperationResult, IConfigStore } from './ports.js';

export class CalculateLibrarySize {
  constructor(
    private readonly fs: IFileSystem,
    private readonly config: IConfigStore,
    private readonly logger: ILogger,
  ) {}

  async execute(): Promise<
    OperationResult<{
      usedBytes: number;
      limitBytes: number;
      availableBytes: number;
      usagePercent: number;
      stats: LibraryStats;
    }>
  > {
    try {
      const config = this.config.getConfig();
      const limit = CapacityLimit.create(config.maxLibrarySizeGb);

      const usedBytes = await this.fs.calculateDirectorySize('');
      const limitBytes = limit.toBytes();
      const availableBytes = limitBytes - usedBytes;
      const usagePercent = Math.round((usedBytes / limitBytes) * 100);

      const stats = await this.collectStats();

      return {
        success: true,
        data: {
          usedBytes,
          limitBytes,
          availableBytes,
          usagePercent,
          stats,
        },
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      this.logger.error('Failed to calculate library size', { error: message });
      return { success: false, error: message };
    }
  }

  private async collectStats(): Promise<LibraryStats> {
    const tree = await this.fs.scanDirectoryFlat('');

    let albumCount = 0;
    let compilationCount = 0;
    let totalTracks = 0;
    let totalSizeBytes = 0;

    const walk = async (node: import('@trackforge/shared').TreeNode): Promise<void> => {
      if (node.type === 'album') {
        albumCount++;
        totalTracks += node.trackCount ?? 0;
        totalSizeBytes += node.totalSizeBytes ?? 0;
      }
      if (node.children) {
        for (const child of node.children) {
          await walk(child);
        }
      }
    };

    await walk(tree);

    const config = this.config.getConfig();
    const compilationsNode = tree.children?.find((c) => c.name === config.compilationsDirectory);
    if (compilationsNode) {
      compilationCount = compilationsNode.children?.length ?? 0;
      albumCount -= compilationCount;
    }

    return { albumCount, compilationCount, totalTracks, totalSizeBytes };
  }
}
