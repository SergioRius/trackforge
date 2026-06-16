import { IFileSystem } from '../application/ports.js';
import { TreeNode } from '@trackforge/shared';
import { validateNoPathTraversal, isAudioFile } from '../domain/pathValidation.js';
import * as fs from 'fs/promises';
import path from 'path';

export class LocalFileSystem implements IFileSystem {
  private sourceDir: string;
  private destinationDir: string;
  private logger: { debug: (msg: string, data?: Record<string, unknown>) => void };

  constructor(
    sourceDir: string,
    destinationDir: string,
    logger: { debug: (msg: string, data?: Record<string, unknown>) => void },
  ) {
    this.sourceDir = sourceDir;
    this.destinationDir = destinationDir;
    this.logger = logger;
  }

  async scanDirectory(dirPath: string): Promise<TreeNode> {
    const absolute = this.resolvePath(dirPath);
    await this.validateInSource(absolute);
    return this.buildTree(absolute, dirPath, false);
  }

  async scanDirectoryShallow(dirPath: string): Promise<TreeNode> {
    const absolute = this.resolvePath(dirPath);
    await this.validateInSource(absolute);
    return this.buildTree(absolute, dirPath, true);
  }

  async scanDirectoryFlat(dirPath: string): Promise<TreeNode> {
    const absolute = this.resolveDestination(dirPath);
    return this.buildTree(absolute, dirPath, false);
  }

  private async buildTree(
    absolutePath: string,
    relativePath: string,
    shallow: boolean,
  ): Promise<TreeNode> {
    const name = path.basename(absolutePath);
    const stat = await fs.stat(absolutePath);

    if (!stat.isDirectory()) {
      throw new Error(`Not a directory: ${relativePath}`);
    }

    const entries = await fs.readdir(absolutePath, { withFileTypes: true });
    const directories: TreeNode[] = [];
    const audioFiles: string[] = [];

    for (const entry of entries) {
      if (entry.isDirectory()) {
        const childRel = relativePath ? `${relativePath}/${entry.name}` : entry.name;
        if (shallow) {
          const childAbsPath = path.join(absolutePath, entry.name);
          let childType: 'directory' | 'album' = 'directory';
          let childTrackCount: number | undefined;
          let childFiles: string[] | undefined;
          let childChildren: TreeNode[] | undefined;
          try {
            const childEntries = await fs.readdir(childAbsPath, { withFileTypes: true });
            const childAudioFiles = childEntries
              .filter((e) => e.isFile() && isAudioFile(e.name))
              .map((e) => e.name)
              .sort();
            if (childAudioFiles.length > 0) {
              childType = 'album';
              childTrackCount = childAudioFiles.length;
              childFiles = childAudioFiles;
              childChildren = childAudioFiles.map((filename) => ({
                name: filename,
                relativePath: childRel ? `${childRel}/${filename}` : filename,
                type: 'track' as const,
              }));
            }
          } catch {
            // can't read, stay as directory
          }
          directories.push({
            name: entry.name,
            relativePath: childRel,
            type: childType,
            children: childChildren,
            trackCount: childTrackCount,
            files: childFiles,
          });
        } else {
          const child = await this.buildTree(path.join(absolutePath, entry.name), childRel, false);
          directories.push(child);
        }
      } else if (isAudioFile(entry.name)) {
        audioFiles.push(entry.name);
      }
    }

    const sortedDirs = directories.sort((a, b) => a.name.localeCompare(b.name));
    const sortedAudio = audioFiles.sort();
    const isAlbum = audioFiles.length > 0;

    let children: TreeNode[] | undefined;
    if (sortedDirs.length > 0) {
      children = sortedDirs;
    } else if (isAlbum) {
      children = sortedAudio.map((filename) => ({
        name: filename,
        relativePath: relativePath ? `${relativePath}/${filename}` : filename,
        type: 'track' as const,
      }));
    }

    const node: TreeNode = {
      name,
      relativePath: relativePath || name,
      type: isAlbum ? 'album' : 'directory',
      children,
      trackCount: isAlbum ? audioFiles.length : undefined,
      files: isAlbum ? sortedAudio : undefined,
    };

    return node;
  }

  async copyFile(source: string, dest: string): Promise<void> {
    const srcAbsolute = this.resolvePath(source);
    const destAbsolute = this.resolveDestination(dest);

    await this.validateInSource(srcAbsolute);

    const destDir = path.dirname(destAbsolute);
    await fs.mkdir(destDir, { recursive: true });

    this.logger.debug('Copying file', { source, dest });
    await fs.copyFile(srcAbsolute, destAbsolute);
  }

  async deleteFolder(dirPath: string): Promise<void> {
    const absolute = this.resolveDestination(dirPath);

    const stat = await fs.stat(absolute);
    if (!stat.isDirectory()) {
      throw new Error(`Not a directory: ${dirPath}`);
    }

    this.logger.debug('Deleting folder', { path: dirPath });
    await fs.rm(absolute, { recursive: true, force: true });
  }

  async ensureDir(dirPath: string): Promise<void> {
    const absolute = this.resolveDestination(dirPath);
    await fs.mkdir(absolute, { recursive: true });
  }

  async isDirectory(dirPath: string): Promise<boolean> {
    try {
      const absolute = this.resolvePath(dirPath);
      const stat = await fs.stat(absolute);
      return stat.isDirectory();
    } catch {
      return false;
    }
  }

  async isFile(dirPath: string): Promise<boolean> {
    try {
      const absolute = this.resolvePath(dirPath);
      const stat = await fs.stat(absolute);
      return stat.isFile();
    } catch {
      return false;
    }
  }

  async getFileSize(filePath: string): Promise<number> {
    const absolute = this.resolvePath(filePath);
    const stat = await fs.stat(absolute);
    return stat.size;
  }

  async calculateDirectorySize(dirPath: string): Promise<number> {
    const absolute = this.resolveDestination(dirPath);
    let totalSize = 0;

    const walk = async (currentPath: string): Promise<void> => {
      const entries = await fs.readdir(currentPath, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(currentPath, entry.name);
        if (entry.isDirectory()) {
          await walk(fullPath);
        } else if (entry.isFile()) {
          const stat = await fs.stat(fullPath);
          totalSize += stat.size;
        }
      }
    };

    try {
      if ((await fs.stat(absolute)).isDirectory()) {
        await walk(absolute);
      }
    } catch {
      return 0;
    }

    return totalSize;
  }

  async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(this.resolvePath(filePath));
      return true;
    } catch {
      return false;
    }
  }

  async listFiles(dirPath: string): Promise<string[]> {
    const absolute = this.resolvePath(dirPath);
    const entries = await fs.readdir(absolute, { withFileTypes: true });
    return entries.filter((e) => e.isFile()).map((e) => e.name);
  }

  async listDirectories(dirPath: string): Promise<string[]> {
    const absolute = this.resolvePath(dirPath);
    const entries = await fs.readdir(absolute, { withFileTypes: true });
    return entries.filter((e) => e.isDirectory()).map((e) => e.name);
  }

  async collectAlbumPaths(dirPath: string): Promise<string[]> {
    const absolute = this.resolvePath(dirPath);
    const albums: string[] = [];

    const walk = async (currentPath: string, currentRel: string): Promise<void> => {
      const entries = await fs.readdir(currentPath, { withFileTypes: true });
      const hasAudio = entries.some((e) => e.isFile() && isAudioFile(e.name));
      if (hasAudio) {
        albums.push(currentRel);
      }
      for (const entry of entries) {
        if (entry.isDirectory()) {
          const childRel = currentRel ? `${currentRel}/${entry.name}` : entry.name;
          await walk(path.join(currentPath, entry.name), childRel);
        }
      }
    };

    await walk(absolute, dirPath);
    return albums;
  }

  async destinationExists(dirPath: string): Promise<boolean> {
    try {
      const absolute = this.resolveDestination(dirPath);
      await fs.stat(absolute);
      return true;
    } catch {
      return false;
    }
  }

  private resolvePath(relativePath: string): string {
    return path.resolve(this.sourceDir, relativePath);
  }

  private resolveDestination(relativePath: string): string {
    validateNoPathTraversal(relativePath);
    return path.resolve(this.destinationDir, relativePath);
  }

  private async validateInSource(absolutePath: string): Promise<void> {
    const resolved = path.resolve(absolutePath);
    if (!resolved.startsWith(path.resolve(this.sourceDir))) {
      throw new Error(`Path outside source directory: ${absolutePath}`);
    }
  }
}
