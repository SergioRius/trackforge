import { TreeNode } from '@trackforge/shared';
import { IFileSystem, ILogger, OperationResult } from './ports.js';

export class ScanSourceLibrary {
  constructor(
    private readonly fs: IFileSystem,
    private readonly logger: ILogger,
  ) {}

  async execute(subPath?: string): Promise<OperationResult<TreeNode>> {
    try {
      const dirPath = subPath ?? '';
      this.logger.debug('Scanning source library', { path: dirPath });

      const tree = await this.fs.scanDirectoryShallow(dirPath);

      return { success: true, data: tree };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      this.logger.error('Failed to scan source library', { error: message });
      return { success: false, error: message };
    }
  }
}
