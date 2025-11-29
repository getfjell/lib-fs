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
    value: string;
    other?: string;
  };
}

describe('update operation', () => {
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

  it('should update an existing item (deep merge - default)', async () => {
    const item = await create<TestItem, 'test'>(
      { pk: 'test-1', name: 'Original', nested: { value: 'original', other: 'keep' } },
      undefined,
      pathBuilder,
      fileProcessor,
      directoryManager,
      coordinate,
      options
    );

    const updated = await update<TestItem, 'test'>(
      { kt: 'test', pk: item.pk },
      { name: 'Updated', nested: { value: 'new' } },
      undefined, // Default is deep merge
      pathBuilder,
      fileProcessor,
      directoryManager,
      coordinate,
      options
    );

    expect(updated.name).toBe('Updated');
    expect(updated.nested?.value).toBe('new');
    expect(updated.nested?.other).toBe('keep'); // Deep merge preserves this
  });

  it('should update with deep merge strategy', async () => {
    const item = await create<TestItem, 'test'>(
      { pk: 'test-2', name: 'Original', nested: { value: 'v1', other: 'o1' } },
      undefined,
      pathBuilder,
      fileProcessor,
      directoryManager,
      coordinate,
      options
    );

    const updated = await update<TestItem, 'test'>(
      { kt: 'test', pk: item.pk },
      { nested: { value: 'v2' } },
      { mergeStrategy: 'deep' },
      pathBuilder,
      fileProcessor,
      directoryManager,
      coordinate,
      options
    );

    expect(updated.nested?.value).toBe('v2');
    expect(updated.nested?.other).toBe('o1'); // Preserved with deep merge
  });

  it('should update with shallow merge strategy', async () => {
    const item = await create<TestItem, 'test'>(
      { pk: 'test-3', name: 'Original', nested: { value: 'v1', other: 'o1' } },
      undefined,
      pathBuilder,
      fileProcessor,
      directoryManager,
      coordinate,
      options
    );

    const updated = await update<TestItem, 'test'>(
      { kt: 'test', pk: item.pk },
      { nested: { value: 'v2' } },
      { mergeStrategy: 'shallow' },
      pathBuilder,
      fileProcessor,
      directoryManager,
      coordinate,
      options
    );

    expect(updated.nested?.value).toBe('v2');
    expect(updated.nested?.other).toBeUndefined(); // Lost with shallow merge
  });

  it('should update with replace strategy', async () => {
    const item = await create<TestItem, 'test'>(
      { pk: 'test-4', name: 'Original', nested: { value: 'v1', other: 'o1' } },
      undefined,
      pathBuilder,
      fileProcessor,
      directoryManager,
      coordinate,
      options
    );

    const updated = await update<TestItem, 'test'>(
      { kt: 'test', pk: item.pk },
      { name: 'Replaced' },
      { mergeStrategy: 'replace' },
      pathBuilder,
      fileProcessor,
      directoryManager,
      coordinate,
      options
    );

    expect(updated.name).toBe('Replaced');
    expect(updated.nested).toBeUndefined(); // Replace removes unspecified fields
    expect(updated.kt).toBe('test'); // Key fields preserved
    expect(updated.pk).toBe('test-4');
  });

  it('should throw error if item does not exist', async () => {
    await expect(
      update<TestItem, 'test'>(
        { kt: 'test', pk: 'does-not-exist' },
        { name: 'Update' },
        undefined,
        pathBuilder,
        fileProcessor,
        directoryManager,
        coordinate,
        options
      )
    ).rejects.toThrow();
  });

  it('should preserve key fields', async () => {
    const item = await create<TestItem, 'test'>(
      { pk: 'test-5', name: 'Original' },
      undefined,
      pathBuilder,
      fileProcessor,
      directoryManager,
      coordinate,
      options
    );

    const updated = await update<TestItem, 'test'>(
      { kt: 'test', pk: item.pk },
      { kt: 'different', pk: 'different', name: 'Updated' } as any,
      undefined,
      pathBuilder,
      fileProcessor,
      directoryManager,
      coordinate,
      options
    );

    expect(updated.kt).toBe('test'); // Original preserved
    expect(updated.pk).toBe('test-5'); // Original preserved
    expect(updated.name).toBe('Updated');
  });

  it('should handle replace flag in CoreUpdateOptions (line 78 branch)', async () => {
    const item = await create<TestItem, 'test'>(
      { pk: 'test-6', name: 'Original', nested: { value: 'v1', other: 'o1' } },
      undefined,
      pathBuilder,
      fileProcessor,
      directoryManager,
      coordinate,
      options
    );

    // Test the branch: 'replace' in updateOptions && updateOptions.replace
    const updated = await update<TestItem, 'test'>(
      { kt: 'test', pk: item.pk },
      { name: 'Replaced' },
      { replace: true } as any, // CoreUpdateOptions with replace flag
      pathBuilder,
      fileProcessor,
      directoryManager,
      coordinate,
      options
    );

    expect(updated.name).toBe('Replaced');
    expect(updated.nested).toBeUndefined(); // Replace removes unspecified fields
  });
});

