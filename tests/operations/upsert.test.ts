import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { create } from '../../src/ops/create';
import { upsert } from '../../src/ops/upsert';
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

describe('upsert operation', () => {
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

  it('should create item if it does not exist', async () => {
    const result = await upsert<TestItem, 'test'>(
      { kt: 'test', pk: 'new-item' },
      { name: 'New Item' },
      undefined,
      undefined,
      pathBuilder,
      fileProcessor,
      directoryManager,
      coordinate,
      options
    );

    expect(result).toBeDefined();
    expect(result.kt).toBe('test');
    expect(result.pk).toBe('new-item');
    expect(result.name).toBe('New Item');

    // Verify it was created
    const retrieved = await get<TestItem, 'test'>(
      { kt: 'test', pk: 'new-item' },
      pathBuilder,
      fileProcessor,
      coordinate,
      options
    );
    expect(retrieved).toEqual(result);
  });

  it('should update item if it exists (default deep merge)', async () => {
    // Create initial item
    await create<TestItem, 'test'>(
      { pk: 'existing', name: 'Original' },
      undefined,
      pathBuilder,
      fileProcessor,
      directoryManager,
      coordinate,
      options
    );

    // Upsert (should update)
    const result = await upsert<TestItem, 'test'>(
      { kt: 'test', pk: 'existing' },
      { name: 'Updated' },
      undefined,
      undefined,
      pathBuilder,
      fileProcessor,
      directoryManager,
      coordinate,
      options
    );

    expect(result.name).toBe('Updated');
    expect(result.pk).toBe('existing');
  });

  it('should honor merge strategy for update case', async () => {
    // Create item with nested structure
    await create<TestItem, 'test'>(
      { pk: 'merge-test', name: 'Original' } as any,
      undefined,
      pathBuilder,
      fileProcessor,
      directoryManager,
      coordinate,
      options
    );

    // Upsert with deep merge
    const deepMerge = await upsert<TestItem, 'test'>(
      { kt: 'test', pk: 'merge-test' },
      { name: 'Deep Updated' },
      undefined,
      { mergeStrategy: 'deep' },
      pathBuilder,
      fileProcessor,
      directoryManager,
      coordinate,
      options
    );

    expect(deepMerge.name).toBe('Deep Updated');
  });

  it('should ignore merge strategy for create case', async () => {
    // Upsert a non-existing item with replace strategy
    // Should create anyway, strategy is ignored
    const result = await upsert<TestItem, 'test'>(
      { kt: 'test', pk: 'new-with-strategy' },
      { name: 'Created' },
      undefined,
      { mergeStrategy: 'replace' },
      pathBuilder,
      fileProcessor,
      directoryManager,
      coordinate,
      options
    );

    expect(result.name).toBe('Created');
    expect(result.pk).toBe('new-with-strategy');
  });

  it('should work multiple times (idempotent)', async () => {
    const key = { kt: 'test', pk: 'idempotent' };

    // First upsert - creates
    const first = await upsert<TestItem, 'test'>(
      key,
      { name: 'First' },
      undefined,
      undefined,
      pathBuilder,
      fileProcessor,
      directoryManager,
      coordinate,
      options
    );

    expect(first.name).toBe('First');

    // Second upsert - updates
    const second = await upsert<TestItem, 'test'>(
      key,
      { name: 'Second' },
      undefined,
      undefined,
      pathBuilder,
      fileProcessor,
      directoryManager,
      coordinate,
      options
    );

    expect(second.name).toBe('Second');
    expect(second.pk).toBe('idempotent');

    // Third upsert - updates again
    const third = await upsert<TestItem, 'test'>(
      key,
      { name: 'Third' },
      undefined,
      undefined,
      pathBuilder,
      fileProcessor,
      directoryManager,
      coordinate,
      options
    );

    expect(third.name).toBe('Third');
  });
});

