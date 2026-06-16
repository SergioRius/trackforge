import { IFileSystem, ILogger, OperationResult } from './ports.js';

export class DeleteDestinationFolder {
  constructor(
    private readonly fs: IFileSystem,
    private readonly logger: ILogger,
  ) {}

  async execute(folderPath: string): Promise<OperationResult<void>> {
    try {
      if (!folderPath || folderPath === '/') {
        return { success: false, error: 'Cannot delete root or empty path.' };
      }

      this.logger.info('Deleting destination folder', { path: folderPath });

      try {
        await this.fs.deleteFolder(folderPath);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        return { success: false, error: `Failed to delete: ${message}` };
      }

      return { success: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      this.logger.error('Failed to delete folder', { error: message });
      return { success: false, error: message };
    }
  }
}
