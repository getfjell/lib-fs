import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { DirectoryManager } from '../src/DirectoryManager';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

describe('DirectoryManager', () => {
  let testDir: string;
  let manager: DirectoryManager;

  beforeEach(async () => {
    // Create a temporary test directory
    testDir = await fs.mkdtemp(path.join(os.tmpdir(), 'lib-fs-test-'));
    manager = new DirectoryManager(testDir);
  });

  afterEach(async () => {
    // Clean up test directory
    await fs.rm(testDir, { recursive: true, force: true });
  });

  describe('ensureDirectory', () => {
    it('should create directory if it does not exist', async () => {
      const newDir = path.join(testDir, 'new-dir');
      await manager.ensureDirectory(newDir);

      const exists = await manager.directoryExists(newDir);
      expect(exists).toBe(true);
    });

    it('should not throw if directory already exists', async () => {
      const newDir = path.join(testDir, 'existing-dir');
      await fs.mkdir(newDir);

      await expect(manager.ensureDirectory(newDir)).resolves.not.toThrow();
    });

    it('should create nested directories', async () => {
      const nestedDir = path.join(testDir, 'level1', 'level2', 'level3');
      await manager.ensureDirectory(nestedDir);

      const exists = await manager.directoryExists(nestedDir);
      expect(exists).toBe(true);
    });
  });

  describe('directoryExists', () => {
    it('should return true for existing directory', async () => {
      const exists = await manager.directoryExists(testDir);
      expect(exists).toBe(true);
    });

    it('should return false for non-existing directory', async () => {
      const nonExisting = path.join(testDir, 'does-not-exist');
      const exists = await manager.directoryExists(nonExisting);
      expect(exists).toBe(false);
    });
  });

  describe('listFiles', () => {
    it('should list all files in directory', async () => {
      // Create some test files
      await fs.writeFile(path.join(testDir, 'file1.txt'), 'content1');
      await fs.writeFile(path.join(testDir, 'file2.txt'), 'content2');
      await fs.writeFile(path.join(testDir, 'file3.json'), 'content3');

      const files = await manager.listFiles(testDir);
      expect(files).toHaveLength(3);
    });

    it('should filter files by extension', async () => {
      await fs.writeFile(path.join(testDir, 'file1.txt'), 'content1');
      await fs.writeFile(path.join(testDir, 'file2.json'), 'content2');
      await fs.writeFile(path.join(testDir, 'file3.json'), 'content3');

      const jsonFiles = await manager.listFiles(testDir, '.json');
      expect(jsonFiles).toHaveLength(2);
    });

    it('should return empty array for non-existing directory', async () => {
      const files = await manager.listFiles(path.join(testDir, 'does-not-exist'));
      expect(files).toEqual([]);
    });
  });

  describe('listFilesRecursive', () => {
    it('should list files recursively', async () => {
      // Create nested structure
      const subDir = path.join(testDir, 'subdir');
      await fs.mkdir(subDir);
      
      await fs.writeFile(path.join(testDir, 'file1.txt'), 'content1');
      await fs.writeFile(path.join(subDir, 'file2.txt'), 'content2');

      const files = await manager.listFilesRecursive(testDir, '.txt');
      expect(files).toHaveLength(2);
    });

    it('should return empty array for non-existing directory', async () => {
      const files = await manager.listFilesRecursive(path.join(testDir, 'does-not-exist'));
      expect(files).toEqual([]);
    });
  });

  describe('ensureNestedDirectories', () => {
    it('should ensure all parent directories exist', async () => {
      const filePath = path.join(testDir, 'level1', 'level2', 'file.txt');
      await manager.ensureNestedDirectories(filePath);

      const dirExists = await manager.directoryExists(path.join(testDir, 'level1', 'level2'));
      expect(dirExists).toBe(true);
    });
  });

  describe('listNestedFiles', () => {
    it('should list files in nested structure', async () => {
      // Create nested structure
      const subDir1 = path.join(testDir, 'level1');
      const subDir2 = path.join(testDir, 'level1', 'level2');
      await fs.mkdir(subDir1);
      await fs.mkdir(subDir2);
      
      await fs.writeFile(path.join(testDir, 'file1.txt'), 'content1');
      await fs.writeFile(path.join(subDir1, 'file2.txt'), 'content2');
      await fs.writeFile(path.join(subDir2, 'file3.txt'), 'content3');

      const files = await manager.listNestedFiles(testDir, '.txt');
      expect(files).toHaveLength(3);
    });

    it('should return empty array for non-existent directory', async () => {
      const files = await manager.listNestedFiles(path.join(testDir, 'nonexistent'), '.txt');
      expect(files).toEqual([]);
    });
  });

  describe('error handling', () => {
    it('should handle permission errors gracefully', async () => {
      // This test ensures error handling works
      const files = await manager.listFiles('/root/protected-dir-that-does-not-exist');
      expect(files).toEqual([]);
    });

    it('should handle errors in recursive listing', async () => {
      const files = await manager.listFilesRecursive('/root/protected-dir-that-does-not-exist');
      expect(files).toEqual([]);
    });
  });

  describe('directoryExists edge cases', () => {
    it('should return false for file path (not directory)', async () => {
      const filePath = path.join(testDir, 'test.txt');
      await fs.writeFile(filePath, 'content');

      const isDir = await manager.directoryExists(filePath);
      expect(isDir).toBe(false);
    });
  });
});

