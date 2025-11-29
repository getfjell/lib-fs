import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { all } from '../../src/ops/all';
import { PathBuilder } from '../../src/PathBuilder';
import { FileProcessor } from '../../src/FileProcessor';
import { DirectoryManager } from '../../src/DirectoryManager';
import type { Coordinate, Item } from '@fjell/core';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

interface TestItem extends Item<'test'> {
  kt: 'test';
  pk: string;
  name: string;
}

describe('all operation - Coverage Completion', () => {
  let testDir: string;
  let pathBuilder: PathBuilder;
  let fileProcessor: FileProcessor;
  let directoryManager: DirectoryManager;
  let coordinate: Coordinate<'test'>;

  beforeEach(async () => {
    testDir = await fs.mkdtemp(path.join(os.tmpdir(), 'lib-fs-test-'));
    
    pathBuilder = new PathBuilder({
      globalDirectory: testDir,
      directoryPaths: ['tests'],
      useJsonExtension: true
    });
    
    fileProcessor = new FileProcessor();
    directoryManager = new DirectoryManager(testDir);
    coordinate = { kt: 'test', kta: ['test'] } as Coordinate<'test'>;
  });

  afterEach(async () => {
    await fs.rm(testDir, { recursive: true, force: true });
  });

  it('should handle file read error in map function (lines 48-50)', async () => {
    const dirPath = path.join(testDir, 'tests');
    await fs.mkdir(dirPath, { recursive: true });
    
    // Create a file
    await fs.writeFile(path.join(dirPath, 'good.json'), JSON.stringify({
      kt: 'test', pk: 'good', name: 'Good'
    }));
    
    // Create a directory with .json extension (will cause read to fail)
    await fs.mkdir(path.join(dirPath, 'bad.json'), { recursive: true });

    const result = await all<TestItem, 'test'>(
      undefined,
      undefined,
      pathBuilder,
      fileProcessor,
      directoryManager,
      coordinate
    );

    // Should skip the bad file and return only good ones
    expect(result.items.length).toBeGreaterThanOrEqual(1);
    expect(result.metadata.total).toBeGreaterThanOrEqual(1);
  });

  it('should handle non-ENOENT errors and rethrow (lines 85-92)', async () => {
    // Create a custom DirectoryManager that throws a non-ENOENT error
    const badDirectoryManager = {
      ...directoryManager,
      listFiles: async () => {
        const error: any = new Error('Permission denied');
        error.code = 'EACCES'; // Not ENOENT
        throw error;
      }
    };

    // This should throw the permission error (not ENOENT)
    await expect(
      all<TestItem, 'test'>(
        undefined,
        undefined,
        pathBuilder,
        fileProcessor,
        badDirectoryManager as any,
        coordinate
      )
    ).rejects.toThrow('Permission denied');
  });

  it('should handle ENOENT gracefully (line 88)', async () => {
    // This should hit line 88 where it returns empty result for ENOENT
    const result = await all<TestItem, 'test'>(
      undefined,
      undefined,
      pathBuilder,
      fileProcessor,
      directoryManager,
      coordinate
    );

    expect(result.items).toEqual([]);
    expect(result.metadata.total).toBe(0);
  });
});

