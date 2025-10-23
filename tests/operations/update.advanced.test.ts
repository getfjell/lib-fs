import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { create } from '../../src/ops/create';
import { update } from '../../src/ops/update';
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
  nested?: {
    deep?: {
      value?: string;
    };
  };
}

describe('update operation - Advanced Coverage', () => {
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

  it('should throw error for invalid merge strategy', async () => {
    const item = await create<TestItem, 'test'>(
      { pk: 'test-invalid', name: 'Original' },
      undefined,
      pathBuilder,
      fileProcessor,
      directoryManager,
      coordinate,
      options
    );

    await expect(
      update<TestItem, 'test'>(
        { kt: 'test', pk: item.pk },
        { name: 'Updated' },
        { mergeStrategy: 'invalid' as any },
        pathBuilder,
        fileProcessor,
        directoryManager,
        coordinate,
        options
      )
    ).rejects.toThrow('Invalid merge strategy');
  });

  it('should handle deeply nested merge with deep strategy', async () => {
    const item = await create<TestItem, 'test'>(
      {
        pk: 'deep-nest',
        name: 'Original',
        nested: { deep: { value: 'original' } }
      },
      undefined,
      pathBuilder,
      fileProcessor,
      directoryManager,
      coordinate,
      options
    );

    const updated = await update<TestItem, 'test'>(
      { kt: 'test', pk: item.pk },
      { nested: { deep: { value: 'new' } } },
      { mergeStrategy: 'deep' },
      pathBuilder,
      fileProcessor,
      directoryManager,
      coordinate,
      options
    );

    expect(updated.nested?.deep?.value).toBe('new');
  });

  it('should preserve nested objects not mentioned in update (deep merge)', async () => {
    const item = await create<TestItem, 'test'>(
      {
        pk: 'preserve-test',
        name: 'Original',
        nested: { deep: { value: 'keep' } }
      },
      undefined,
      pathBuilder,
      fileProcessor,
      directoryManager,
      coordinate,
      options
    );

    const updated = await update<TestItem, 'test'>(
      { kt: 'test', pk: item.pk },
      { name: 'Updated Name' },
      { mergeStrategy: 'deep' },
      pathBuilder,
      fileProcessor,
      directoryManager,
      coordinate,
      options
    );

    expect(updated.name).toBe('Updated Name');
    expect(updated.nested?.deep?.value).toBe('keep');
  });

  it('should replace nested objects with shallow merge', async () => {
    const item = await create<TestItem, 'test'>(
      {
        pk: 'shallow-test',
        name: 'Original',
        nested: { deep: { value: 'original' } }
      },
      undefined,
      pathBuilder,
      fileProcessor,
      directoryManager,
      coordinate,
      options
    );

    const updated = await update<TestItem, 'test'>(
      { kt: 'test', pk: item.pk },
      { nested: {} },
      { mergeStrategy: 'shallow' },
      pathBuilder,
      fileProcessor,
      directoryManager,
      coordinate,
      options
    );

    expect(updated.nested?.deep).toBeUndefined();
  });

  it('should handle update with empty object', async () => {
    const item = await create<TestItem, 'test'>(
      { pk: 'empty-update', name: 'Original' },
      undefined,
      pathBuilder,
      fileProcessor,
      directoryManager,
      coordinate,
      options
    );

    const updated = await update<TestItem, 'test'>(
      { kt: 'test', pk: item.pk },
      {},
      undefined,
      pathBuilder,
      fileProcessor,
      directoryManager,
      coordinate,
      options
    );

    expect(updated.name).toBe('Original'); // Should preserve everything
    expect(updated.pk).toBe('empty-update');
  });
});

