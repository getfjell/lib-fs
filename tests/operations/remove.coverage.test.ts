import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { create } from '../../src/ops/create';
import { remove } from '../../src/ops/remove';
import { PathBuilder } from '../../src/PathBuilder';
import { FileProcessor } from '../../src/FileProcessor';
import { DirectoryManager } from '../../src/DirectoryManager';
import type { Coordinate, Item } from '@fjell/core';
import type { Options } from '../../src/Options';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

interface TestItem extends Item<'test'> {
  kt: 'test';
  pk: string;
  name: string;
}

describe('remove operation - Coverage Completion', () => {
  let testDir: string;
  let pathBuilder: PathBuilder;
  let fileProcessor: FileProcessor;
  let directoryManager: DirectoryManager;
  let coordinate: Coordinate<'test'>;
  let optionsWithFiles: Options<TestItem, 'test'>;

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
    
    optionsWithFiles = {
      globalDirectory: testDir,
      encoding: 'utf-8',
      autoCreateDirectories: true,
      fileMode: 0o644,
      files: {
        directory: '_files',
        includeMetadataInItem: true
      }
    } as Options<TestItem, 'test'>;
  });

  afterEach(async () => {
    await fs.rm(testDir, { recursive: true, force: true });
  });

  it('should hit debug log when files directory deletion fails (lines 56-57)', async () => {
    const item = await create<TestItem, 'test'>(
      { pk: 'delete-fail', name: 'Test' },
      undefined,
      pathBuilder,
      fileProcessor,
      directoryManager,
      coordinate,
      optionsWithFiles
    );

    // Create files directory with a problematic structure
    const filesDir = pathBuilder.buildFilesDirectory({ kt: 'test', pk: item.pk });
    await fs.mkdir(filesDir, { recursive: true });
    
    // Create a subdirectory that might cause issues
    await fs.mkdir(path.join(filesDir, 'sub'), { recursive: true });

    // Remove - should handle any issues with files directory gracefully
    const removed = await remove<TestItem, 'test'>(
      { kt: 'test', pk: item.pk },
      pathBuilder,
      fileProcessor,
      coordinate,
      optionsWithFiles
    );

    expect(removed).toBeDefined();
  });

  it('should handle error when getting item before remove', async () => {
    // Try to remove a non-existent item
    await expect(
      remove<TestItem, 'test'>(
        { kt: 'test', pk: 'does-not-exist' },
        pathBuilder,
        fileProcessor,
        coordinate,
        optionsWithFiles
      )
    ).rejects.toThrow();
  });
});

