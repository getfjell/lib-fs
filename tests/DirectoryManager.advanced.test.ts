import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { DirectoryManager } from '../src/DirectoryManager';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

describe('DirectoryManager - Advanced Coverage', () => {
  let testDir: string;
  let manager: DirectoryManager;

  beforeEach(async () => {
    testDir = await fs.mkdtemp(path.join(os.tmpdir(), 'lib-fs-test-'));
    manager = new DirectoryManager(testDir);
  });

  afterEach(async () => {
    await fs.rm(testDir, { recursive: true, force: true });
  });

  describe('listFiles edge cases', () => {
    it('should handle directory with only subdirectories', async () => {
      await fs.mkdir(path.join(testDir, 'subdir'));
      
      const files = await manager.listFiles(testDir);
      expect(files).toEqual([]);
    });

    it('should handle mixed files and directories', async () => {
      await fs.writeFile(path.join(testDir, 'file1.txt'), 'content');
      await fs.mkdir(path.join(testDir, 'subdir'));
      await fs.writeFile(path.join(testDir, 'file2.txt'), 'content');

      const files = await manager.listFiles(testDir);
      expect(files).toHaveLength(2);
    });

    it('should filter by extension correctly', async () => {
      await fs.writeFile(path.join(testDir, 'doc.txt'), 'content');
      await fs.writeFile(path.join(testDir, 'data.json'), 'content');
      await fs.writeFile(path.join(testDir, 'config.yaml'), 'content');

      const jsonFiles = await manager.listFiles(testDir, '.json');
      expect(jsonFiles).toHaveLength(1);
      expect(jsonFiles[0]).toContain('data.json');
    });

    it('should return empty array when directory does not exist', async () => {
      const files = await manager.listFiles(path.join(testDir, 'nonexistent'));
      expect(files).toEqual([]);
    });

    it('should handle errors from readdir', async () => {
      // Try to list files in a path that will cause an error
      const files = await manager.listFiles('/dev/null/impossible');
      expect(files).toEqual([]);
    });
  });

  describe('listFilesRecursive edge cases', () => {
    it('should find files in deeply nested directories', async () => {
      const deep = path.join(testDir, 'a', 'b', 'c', 'd');
      await fs.mkdir(deep, { recursive: true });
      await fs.writeFile(path.join(deep, 'deep.txt'), 'content');
      await fs.writeFile(path.join(testDir, 'root.txt'), 'content');

      const files = await manager.listFilesRecursive(testDir, '.txt');
      expect(files).toHaveLength(2);
    });

    it('should handle empty nested directories', async () => {
      await fs.mkdir(path.join(testDir, 'empty1'));
      await fs.mkdir(path.join(testDir, 'empty2', 'nested'), { recursive: true });

      const files = await manager.listFilesRecursive(testDir);
      expect(files).toEqual([]);
    });

    it('should handle directory with symlinks gracefully', async () => {
      // Create a file and a symlink
      const filePath = path.join(testDir, 'real.txt');
      await fs.writeFile(filePath, 'content');
      
      try {
        await fs.symlink(filePath, path.join(testDir, 'link.txt'));
      } catch {
        // Symlinks might not be supported on all systems
      }

      const files = await manager.listFilesRecursive(testDir);
      expect(files.length).toBeGreaterThanOrEqual(1);
    });

    it('should return empty array for non-existent directory', async () => {
      const files = await manager.listFilesRecursive(path.join(testDir, 'nope'));
      expect(files).toEqual([]);
    });

    it('should handle errors in nested listings', async () => {
      const files = await manager.listFilesRecursive('/dev/null/error');
      expect(files).toEqual([]);
    });
  });

  describe('ensureNestedDirectories', () => {
    it('should create all parent directories for deep path', async () => {
      const deepFile = path.join(testDir, 'a', 'b', 'c', 'd', 'file.txt');
      await manager.ensureNestedDirectories(deepFile);

      const parentExists = await manager.directoryExists(path.join(testDir, 'a', 'b', 'c', 'd'));
      expect(parentExists).toBe(true);
    });

    it('should work when some directories already exist', async () => {
      await fs.mkdir(path.join(testDir, 'existing'));
      
      const filePath = path.join(testDir, 'existing', 'new', 'file.txt');
      await manager.ensureNestedDirectories(filePath);

      const newExists = await manager.directoryExists(path.join(testDir, 'existing', 'new'));
      expect(newExists).toBe(true);
    });

    it('should work for file in root directory', async () => {
      const filePath = path.join(testDir, 'file.txt');
      await manager.ensureNestedDirectories(filePath);

      // Should not throw, parent is testDir which already exists
      expect(true).toBe(true);
    });
  });

  describe('listNestedFiles', () => {
    it('should call listFilesRecursive', async () => {
      await fs.writeFile(path.join(testDir, 'file1.txt'), 'content');
      const subdir = path.join(testDir, 'sub');
      await fs.mkdir(subdir);
      await fs.writeFile(path.join(subdir, 'file2.txt'), 'content');

      const files = await manager.listNestedFiles(testDir, '.txt');
      expect(files).toHaveLength(2);
    });

    it('should work with no extension filter', async () => {
      await fs.writeFile(path.join(testDir, 'file1.txt'), 'content');
      await fs.writeFile(path.join(testDir, 'file2.json'), 'content');

      const files = await manager.listNestedFiles(testDir);
      expect(files).toHaveLength(2);
    });
  });

  describe('directoryExists edge cases', () => {
    it('should return false for a file (not a directory)', async () => {
      const filePath = path.join(testDir, 'not-a-dir.txt');
      await fs.writeFile(filePath, 'content');

      const exists = await manager.directoryExists(filePath);
      expect(exists).toBe(false);
    });

    it('should return true for existing directory', async () => {
      const dirPath = path.join(testDir, 'real-dir');
      await fs.mkdir(dirPath);

      const exists = await manager.directoryExists(dirPath);
      expect(exists).toBe(true);
    });

    it('should return false for non-existent path', async () => {
      const exists = await manager.directoryExists(path.join(testDir, 'nope'));
      expect(exists).toBe(false);
    });
  });

  describe('ensureDirectory with existing directory', () => {
    it('should not throw when directory already exists', async () => {
      const dirPath = path.join(testDir, 'existing');
      await fs.mkdir(dirPath);

      // Should not throw
      await expect(manager.ensureDirectory(dirPath)).resolves.not.toThrow();
    });

    it('should work with nested existing directories', async () => {
      const nested = path.join(testDir, 'a', 'b');
      await fs.mkdir(nested, { recursive: true });

      await expect(manager.ensureDirectory(nested)).resolves.not.toThrow();
    });
  });
});

