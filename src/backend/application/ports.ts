import { Track, TreeNode, AppConfig, SettingsDTO } from '@trackforge/shared';

export interface IConfigStore {
  getConfig(): AppConfig;
  getSettings(): SettingsDTO;
  updateSettings(settings: Partial<SettingsDTO>): SettingsDTO;
}

export interface IFileSystem {
  scanDirectory(path: string): Promise<TreeNode>;
  scanDirectoryShallow(path: string): Promise<TreeNode>;
  scanDirectoryFlat(path: string): Promise<TreeNode>;
  collectAlbumPaths(path: string): Promise<string[]>;
  copyFile(source: string, dest: string): Promise<void>;
  deleteFolder(path: string): Promise<void>;
  ensureDir(path: string): Promise<void>;
  isDirectory(path: string): Promise<boolean>;
  isFile(path: string): Promise<boolean>;
  getFileSize(path: string): Promise<number>;
  calculateDirectorySize(path: string): Promise<number>;
  fileExists(path: string): Promise<boolean>;
  destinationExists(path: string): Promise<boolean>;
  listFiles(path: string): Promise<string[]>;
  listDirectories(path: string): Promise<string[]>;
}

export interface IMetadataReader {
  readMetadata(filePath: string): Promise<Track>;
}

export interface IMetadataWriter {
  writeMetadata(track: Track, filePath: string): Promise<void>;
}

export interface ILogger {
  info(msg: string, data?: Record<string, unknown>): void;
  warn(msg: string, data?: Record<string, unknown>): void;
  error(msg: string, data?: Record<string, unknown>): void;
  debug(msg: string, data?: Record<string, unknown>): void;
}

export interface OperationResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  preview?: PreviewData;
}

export interface PreviewData {
  filesAffected: number;
  estimatedSizeBytes: number;
  metadataChanges?: {
    title: number;
    album: number;
    filename: number;
    trackNumber: number;
  };
  destinationPath?: string;
}
