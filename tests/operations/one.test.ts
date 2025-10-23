import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { create } from '../../src/ops/create';
import { one } from '../../src/ops/one';
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
  priority?: number;
}

describe('one operation', () => {
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

  it('should get first item', async () => {
    // Create multiple items
    await create<TestItem, 'test'>(
      { pk: 'item-1', name: 'Item 1' },
      undefined,
      pathBuilder,
      fileProcessor,
      directoryManager,
      coordinate,
      options
    );
    
    await create<TestItem, 'test'>(
      { pk: 'item-2', name: 'Item 2' },
      undefined,
      pathBuilder,
      fileProcessor,
      directoryManager,
      coordinate,
      options
    );

    const item = await one<TestItem, 'test'>(
      undefined,
      undefined,
      pathBuilder,
      fileProcessor,
      directoryManager,
      coordinate
    );

    expect(item).toBeDefined();
    expect(item?.kt).toBe('test');
  });

  it('should return null for empty directory', async () => {
    const item = await one<TestItem, 'test'>(
      undefined,
      undefined,
      pathBuilder,
      fileProcessor,
      directoryManager,
      coordinate
    );

    expect(item).toBeNull();
  });

  it('should apply filter from query', async () => {
    await create<TestItem, 'test'>(
      { pk: 'item-1', name: 'Alpha' },
      undefined,
      pathBuilder,
      fileProcessor,
      directoryManager,
      coordinate,
      options
    );
    
    await create<TestItem, 'test'>(
      { pk: 'item-2', name: 'Beta' },
      undefined,
      pathBuilder,
      fileProcessor,
      directoryManager,
      coordinate,
      options
    );

    const item = await one<TestItem, 'test'>(
      {
        filter: (item) => item.name === 'Beta'
      },
      undefined,
      pathBuilder,
      fileProcessor,
      directoryManager,
      coordinate
    );

    expect(item).toBeDefined();
    expect(item?.name).toBe('Beta');
  });

  it('should apply sort from query and return first', async () => {
    await create<TestItem, 'test'>(
      { pk: 'item-1', name: 'Charlie', priority: 3 },
      undefined,
      pathBuilder,
      fileProcessor,
      directoryManager,
      coordinate,
      options
    );
    
    await create<TestItem, 'test'>(
      { pk: 'item-2', name: 'Alpha', priority: 1 },
      undefined,
      pathBuilder,
      fileProcessor,
      directoryManager,
      coordinate,
      options
    );
    
    await create<TestItem, 'test'>(
      { pk: 'item-3', name: 'Beta', priority: 2 },
      undefined,
      pathBuilder,
      fileProcessor,
      directoryManager,
      coordinate,
      options
    );

    const item = await one<TestItem, 'test'>(
      {
        sort: (a, b) => (a.priority || 0) - (b.priority || 0)
      },
      undefined,
      pathBuilder,
      fileProcessor,
      directoryManager,
      coordinate
    );

    expect(item?.name).toBe('Alpha'); // First when sorted by priority
  });

  it('should automatically limit to 1', async () => {
    await create<TestItem, 'test'>({ pk: 'item-1', name: 'Item 1' }, undefined, pathBuilder, fileProcessor, directoryManager, coordinate, options);
    await create<TestItem, 'test'>({ pk: 'item-2', name: 'Item 2' }, undefined, pathBuilder, fileProcessor, directoryManager, coordinate, options);
    await create<TestItem, 'test'>({ pk: 'item-3', name: 'Item 3' }, undefined, pathBuilder, fileProcessor, directoryManager, coordinate, options);

    const item = await one<TestItem, 'test'>(
      undefined,
      undefined,
      pathBuilder,
      fileProcessor,
      directoryManager,
      coordinate
    );

    // Should only return one item, not an array
    expect(item).toBeDefined();
    expect(typeof item).toBe('object');
    expect(item?.kt).toBe('test');
  });

  it('should respect offset in query', async () => {
    await create<TestItem, 'test'>({ pk: 'item-1', name: 'Item 1', priority: 1 }, undefined, pathBuilder, fileProcessor, directoryManager, coordinate, options);
    await create<TestItem, 'test'>({ pk: 'item-2', name: 'Item 2', priority: 2 }, undefined, pathBuilder, fileProcessor, directoryManager, coordinate, options);
    await create<TestItem, 'test'>({ pk: 'item-3', name: 'Item 3', priority: 3 }, undefined, pathBuilder, fileProcessor, directoryManager, coordinate, options);

    const item = await one<TestItem, 'test'>(
      {
        offset: 1,
        sort: (a, b) => (a.priority || 0) - (b.priority || 0)
      },
      undefined,
      pathBuilder,
      fileProcessor,
      directoryManager,
      coordinate
    );

    expect(item?.priority).toBe(2); // Second item after offset 1
  });

  it('should return null when filter matches nothing', async () => {
    await create<TestItem, 'test'>(
      { pk: 'item-1', name: 'Alpha' },
      undefined,
      pathBuilder,
      fileProcessor,
      directoryManager,
      coordinate,
      options
    );

    const item = await one<TestItem, 'test'>(
      {
        filter: (item) => item.name === 'DoesNotExist'
      },
      undefined,
      pathBuilder,
      fileProcessor,
      directoryManager,
      coordinate
    );

    expect(item).toBeNull();
  });
});

