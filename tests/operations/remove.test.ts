import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { create } from '../../src/ops/create';
import { remove } from '../../src/ops/remove';
import { get } from '../../src/ops/get';
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

describe('remove operation', () => {
  let testDir: string;
  let pathBuilder: PathBuilder;
  let fileProcessor: FileProcessor;
  let directoryManager: DirectoryManager;
  let coordinate: Coordinate<'test'>;
  let options: Options<TestItem, 'test'>;

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
    
    options = {
      globalDirectory: testDir,
      encoding: 'utf-8',
      autoCreateDirectories: true,
      fileMode: 0o644
    } as Options<TestItem, 'test'>;
  });

  afterEach(async () => {
    await fs.rm(testDir, { recursive: true, force: true });
  });

  it('should remove an existing item', async () => {
    // Create item
    const item = await create<TestItem, 'test'>(
      { pk: 'to-remove', name: 'Remove Me' },
      undefined,
      pathBuilder,
      fileProcessor,
      directoryManager,
      coordinate,
      options
    );

    // Remove it
    const removed = await remove<TestItem, 'test'>(
      { kt: 'test', pk: item.pk },
      pathBuilder,
      fileProcessor,
      coordinate,
      options
    );

    expect(removed).toEqual(item);

    // Verify it's gone
    const retrieved = await get<TestItem, 'test'>(
      { kt: 'test', pk: item.pk },
      pathBuilder,
      fileProcessor,
      coordinate,
      options
    );

    expect(retrieved).toBeNull();
  });

  it('should delete file from filesystem', async () => {
    // Create item
    const item = await create<TestItem, 'test'>(
      { pk: 'file-delete', name: 'Delete File' },
      undefined,
      pathBuilder,
      fileProcessor,
      directoryManager,
      coordinate,
      options
    );

    const filePath = pathBuilder.buildPath({ kt: 'test', pk: item.pk });
    
    // Verify file exists
    let exists = await fs.access(filePath, fs.constants.F_OK)
      .then(() => true)
      .catch(() => false);
    expect(exists).toBe(true);

    // Remove item
    await remove<TestItem, 'test'>(
      { kt: 'test', pk: item.pk },
      pathBuilder,
      fileProcessor,
      coordinate,
      options
    );

    // Verify file is deleted
    exists = await fs.access(filePath, fs.constants.F_OK)
      .then(() => true)
      .catch(() => false);
    expect(exists).toBe(false);
  });

  it('should return the deleted item', async () => {
    const item = await create<TestItem, 'test'>(
      { pk: 'return-test', name: 'Return Test' },
      undefined,
      pathBuilder,
      fileProcessor,
      directoryManager,
      coordinate,
      options
    );

    const removed = await remove<TestItem, 'test'>(
      { kt: 'test', pk: item.pk },
      pathBuilder,
      fileProcessor,
      coordinate,
      options
    );

    expect(removed).toBeDefined();
    expect(removed?.kt).toBe('test');
    expect(removed?.pk).toBe('return-test');
    expect(removed?.name).toBe('Return Test');
  });

  it('should throw error when removing non-existent item', async () => {
    await expect(
      remove<TestItem, 'test'>(
        { kt: 'test', pk: 'does-not-exist' },
        pathBuilder,
        fileProcessor,
        coordinate,
        options
      )
    ).rejects.toThrow();
  });
});

