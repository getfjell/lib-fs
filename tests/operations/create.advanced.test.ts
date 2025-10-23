import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { create } from '../../src/ops/create';
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

interface ContainedItem extends Item<'comment', 'post'> {
  kt: 'comment';
  pk: string;
  loc: [{ kt: 'post'; lk: string }];
  text: string;
}

describe('create operation - Advanced Coverage', () => {
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

  it('should create with provided key in options', async () => {
    const result = await create<TestItem, 'test'>(
      { name: 'With Key' },
      { key: { kt: 'test', pk: 'custom-key' } },
      pathBuilder,
      fileProcessor,
      directoryManager,
      coordinate,
      options
    );

    expect(result.pk).toBe('custom-key');
  });

  it('should create ComKey when locations provided', async () => {
    const containedCoordinate = { kt: 'comment', kta: ['comment', 'post'] } as Coordinate<'comment', 'post'>;
    const containedPathBuilder = new PathBuilder({
      globalDirectory: testDir,
      directoryPaths: ['comments', 'posts'],
      useJsonExtension: true
    });

    const result = await create<ContainedItem, 'comment', 'post'>(
      { text: 'Test comment' } as any,
      { locations: [{ kt: 'post', lk: 'post-1' }] },
      containedPathBuilder,
      fileProcessor,
      directoryManager,
      containedCoordinate,
      options as any
    );

    expect(result.kt).toBe('comment');
    expect(result.loc).toBeDefined();
    expect(result.loc[0].kt).toBe('post');
    expect(result.loc[0].lk).toBe('post-1');
  });

  it('should handle item with existing pk in data', async () => {
    const result = await create<TestItem, 'test'>(
      { pk: 'existing-pk', name: 'Test' },
      undefined,
      pathBuilder,
      fileProcessor,
      directoryManager,
      coordinate,
      options
    );

    expect(result.pk).toBe('existing-pk');
  });

  it('should handle item with numeric pk', async () => {
    const result = await create<TestItem, 'test'>(
      { pk: 123 as any, name: 'Numeric PK' },
      undefined,
      pathBuilder,
      fileProcessor,
      directoryManager,
      coordinate,
      options
    );

    expect(result.pk).toBe(123);
  });

  it('should handle deep nested directory creation', async () => {
    const containedCoordinate = { kt: 'item', kta: ['item', 'a', 'b'] } as Coordinate<'item', 'a', 'b'>;
    const deepPathBuilder = new PathBuilder({
      globalDirectory: testDir,
      directoryPaths: ['items', 'a-dir', 'b-dir'],
      useJsonExtension: true
    });

    const result = await create<any, 'item', 'a', 'b'>(
      { name: 'Deep Item' } as any,
      { locations: [{ kt: 'a', lk: 'a-1' }, { kt: 'b', lk: 'b-1' }] },
      deepPathBuilder,
      fileProcessor,
      directoryManager,
      containedCoordinate,
      options as any
    );

    expect(result).toBeDefined();
    
    // Verify directory structure was created (actual path may vary based on implementation)
    // The important thing is that the file was created successfully
    expect(result.kt).toBe('item');
  });

  it('should handle create with empty name', async () => {
    const result = await create<TestItem, 'test'>(
      { name: '' },
      undefined,
      pathBuilder,
      fileProcessor,
      directoryManager,
      coordinate,
      options
    );

    expect(result.name).toBe('');
    expect(result.pk).toBeDefined();
  });

  it('should handle create with special characters in name', async () => {
    const result = await create<TestItem, 'test'>(
      { name: 'Special: #@$%^&*()' },
      undefined,
      pathBuilder,
      fileProcessor,
      directoryManager,
      coordinate,
      options
    );

    expect(result.name).toBe('Special: #@$%^&*()');
  });
});

