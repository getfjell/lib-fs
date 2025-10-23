import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { DirectoryManager } from '../src/DirectoryManager';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

describe('DirectoryManager - Coverage Completion', () => {
  let testDir: string;
  let manager: DirectoryManager;

  beforeEach(async () => {
    testDir = await fs.mkdtemp(path.join(os.tmpdir(), 'lib-fs-test-'));
    manager = new DirectoryManager(testDir);
  });

  afterEach(async () => {
    await fs.rm(testDir, { recursive: true, force: true });
  });

  it('should handle readdir error in listFiles (lines 70-72)', async () => {
    // Create a file (not a directory) and try to list its contents
    const filePath = path.join(testDir, 'not-a-dir.txt');
    await fs.writeFile(filePath, 'content');

    const files = await manager.listFiles(filePath);
    
    // Should return empty array on error
    expect(files).toEqual([]);
  });

  it('should handle recursive listing error (lines 103-105)', async () => {
    // Try to recursively list a file (not a directory)
    const filePath = path.join(testDir, 'file.txt');
    await fs.writeFile(filePath, 'content');

    const files = await manager.listFilesRecursive(filePath);
    
    // Should return empty array on error
    expect(files).toEqual([]);
  });

  it('should handle permission error in listFiles', async () => {
    // Try to list a path that doesn't allow reading
    const files = await manager.listFiles('/dev/null/impossible');
    expect(files).toEqual([]);
  });

  it('should handle deep nesting error in listFilesRecursive', async () => {
    // Create a very deep structure and then make part of it unreadable
    const deepDir = path.join(testDir, 'a', 'b', 'c');
    await fs.mkdir(deepDir, { recursive: true });
    await fs.writeFile(path.join(deepDir, 'file.txt'), 'content');

    // Now try to list from a non-existent sibling
    const files = await manager.listFilesRecursive(path.join(testDir, 'x', 'y', 'z'));
    expect(files).toEqual([]);
  });
});

