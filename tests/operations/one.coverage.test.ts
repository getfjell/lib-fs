import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { one } from '../../src/ops/one';
import { PathBuilder } from '../../src/PathBuilder';
import { FileProcessor } from '../../src/FileProcessor';
import { DirectoryManager } from '../../src/DirectoryManager';
import type { Coordinate, Item } from '@fjell/core';
import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs/promises';

interface TestItem extends Item<'test'> {
  kt: 'test';
  pk: string;
  name: string;
}

describe('one operation - Coverage Completion', () => {
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

  it('should throw error from all operation (lines 49-51)', async () => {
    // Create a custom DirectoryManager that throws
    const badDirectoryManager = {
      ...directoryManager,
      listFiles: async () => {
        const error: any = new Error('Filesystem error');
        error.code = 'EIO'; // I/O error, not ENOENT
        throw error;
      }
    };

    await expect(
      one<TestItem, 'test'>(
        undefined,
        undefined,
        pathBuilder,
        fileProcessor,
        badDirectoryManager as any,
        coordinate
      )
    ).rejects.toThrow('Filesystem error');
  });
});

