import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import { LocalFileSystem } from '../../src/backend/infrastructure/fileSystem';

describe('LocalFileSystem Integration', () => {
  let tmpDir: string;
  let sourceDir: string;
  let destDir: string;
  let fileSystem: LocalFileSystem;
  const logger = { debug: () => {}, info: () => {}, warn: () => {}, error: () => {} };

  beforeAll(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'cms-test-'));
    sourceDir = path.join(tmpDir, 'source');
    destDir = path.join(tmpDir, 'dest');

    await fs.mkdir(path.join(sourceDir, 'Rock', 'Queen', 'Greatest Hits'), { recursive: true });
    await fs.mkdir(path.join(sourceDir, 'Jazz', 'Miles Davis'), { recursive: true });

    await fs.writeFile(
      path.join(sourceDir, 'Rock', 'Queen', 'Greatest Hits', '01 - Song.mp3'),
      'fake-mp3-data-1',
    );
    await fs.writeFile(
      path.join(sourceDir, 'Rock', 'Queen', 'Greatest Hits', '02 - Track.flac'),
      'fake-flac-data',
    );
    await fs.writeFile(
      path.join(sourceDir, 'Rock', 'Queen', 'Greatest Hits', 'cover.jpg'),
      'fake-jpg-data',
    );
    await fs.writeFile(path.join(sourceDir, 'Jazz', 'Miles Davis', 'track.m4a'), 'fake-m4a-data');

    await fs.mkdir(destDir, { recursive: true });

    fileSystem = new LocalFileSystem(sourceDir, destDir, logger);
  });

  afterAll(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  describe('scanDirectoryShallow', () => {
    it('returns only one level of children', async () => {
      const tree = await fileSystem.scanDirectoryShallow('Rock');

      expect(tree.name).toBe('Rock');
      expect(tree.children).toBeDefined();
      expect(tree.children!.length).toBeGreaterThan(0);
      // Queen should be a directory with no further children
      const queen = tree.children!.find((c) => c.name === 'Queen');
      expect(queen).toBeDefined();
      expect(queen!.children).toBeUndefined();
    });

    it('marks directories containing audio files as albums', async () => {
      const tree = await fileSystem.scanDirectoryShallow('Rock/Queen');

      expect(tree.type).toBe('directory');
      const greatestHits = tree.children!.find((c) => c.name === 'Greatest Hits');
      expect(greatestHits).toBeDefined();
      expect(greatestHits!.type).toBe('album');
      expect(greatestHits!.trackCount).toBe(2);
    });

    it('includes track children for album nodes', async () => {
      const tree = await fileSystem.scanDirectoryShallow('Rock/Queen/Greatest Hits');

      expect(tree.type).toBe('album');
      expect(tree.children).toBeDefined();
      expect(tree.children!.length).toBe(2);
      expect(tree.children![0]!.type).toBe('track');
    });

    it('includes files array for album nodes', async () => {
      const tree = await fileSystem.scanDirectoryShallow('Jazz/Miles Davis');

      expect(tree.type).toBe('album');
      expect(tree.files).toBeDefined();
      expect(tree.files!.length).toBe(1);
      expect(tree.files![0]).toBe('track.m4a');
    });
  });

  describe('collectAlbumPaths', () => {
    it('collects all album paths under a directory', async () => {
      const paths = await fileSystem.collectAlbumPaths('Rock');

      expect(paths.length).toBeGreaterThanOrEqual(1);
      expect(paths).toContain('Rock/Queen/Greatest Hits');
    });

    it('returns single album path when given an album directory', async () => {
      const paths = await fileSystem.collectAlbumPaths('Rock/Queen/Greatest Hits');

      expect(paths).toEqual(['Rock/Queen/Greatest Hits']);
    });

    it('returns empty for directories with no audio files', async () => {
      await fs.mkdir(path.join(sourceDir, 'Empty'), { recursive: true });
      const paths = await fileSystem.collectAlbumPaths('Empty');
      expect(paths).toEqual([]);
    });
  });

  describe('destinationExists', () => {
    it('returns true for existing destination path', async () => {
      await fileSystem.copyFile(
        'Rock/Queen/Greatest Hits/01 - Song.mp3',
        'exists-test/file.mp3',
      );
      const exists = await fileSystem.destinationExists('exists-test');
      expect(exists).toBe(true);
    });

    it('returns false for non-existing destination path', async () => {
      const exists = await fileSystem.destinationExists('non-existing-path-xyz');
      expect(exists).toBe(false);
    });
  });

  describe('scanDirectory', () => {
    it('builds tree for source directory', async () => {
      const tree = await fileSystem.scanDirectory('');

      expect(tree.name).toContain('source');
      expect(tree.children).toBeDefined();
      expect(tree.children!.length).toBeGreaterThan(0);
    });

    it('detects albums (directories with audio files)', async () => {
      const tree = await fileSystem.scanDirectory('Rock/Queen/Greatest Hits');

      expect(tree.type).toBe('album');
      expect(tree.trackCount).toBe(2);
    });

    it('detects directories without audio files', async () => {
      await fs.mkdir(path.join(sourceDir, 'Empty'), { recursive: true });

      const tree = await fileSystem.scanDirectory('Empty');
      expect(tree.type).toBe('directory');
      expect(tree.trackCount).toBeUndefined();
    });
  });

  describe('copyFile', () => {
    it('copies file from source to destination preserving structure', async () => {
      await fileSystem.copyFile(
        'Rock/Queen/Greatest Hits/01 - Song.mp3',
        'Rock/Queen/Greatest Hits/01 - Song.mp3',
      );

      const destFile = path.join(destDir, 'Rock', 'Queen', 'Greatest Hits', '01 - Song.mp3');
      const content = await fs.readFile(destFile, 'utf-8');
      expect(content).toBe('fake-mp3-data-1');
    });
  });

  describe('calculateDirectorySize', () => {
    it('calculates size of destination directory', async () => {
      const size = await fileSystem.calculateDirectorySize('');
      expect(size).toBeGreaterThan(0);
    });
  });

  describe('deleteFolder', () => {
    it('deletes a folder in destination', async () => {
      await fileSystem.copyFile('Rock/Queen/Greatest Hits/01 - Song.mp3', 'temp-delete/test.mp3');

      await fileSystem.deleteFolder('temp-delete');

      const exists = await fileSystem.fileExists('temp-delete/test.mp3').catch(() => false);
      expect(exists).toBeDefined();
    });
  });
});
