import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { create } from '../../src/ops/create';
import { all } from '../../src/ops/all';
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

describe('all operation', () => {
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

  it('should get all items', async () => {
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
    
    await create<TestItem, 'test'>(
      { pk: 'item-3', name: 'Item 3' },
      undefined,
      pathBuilder,
      fileProcessor,
      directoryManager,
      coordinate,
      options
    );

    const items = await all<TestItem, 'test'>(
      undefined,
      undefined,
      pathBuilder,
      fileProcessor,
      directoryManager,
      coordinate
    );

    expect(items).toHaveLength(3);
    expect(items.map(i => i.pk).sort()).toEqual(['item-1', 'item-2', 'item-3']);
  });

  it('should return empty array for empty directory', async () => {
    const items = await all<TestItem, 'test'>(
      undefined,
      undefined,
      pathBuilder,
      fileProcessor,
      directoryManager,
      coordinate
    );

    expect(items).toEqual([]);
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

    const items = await all<TestItem, 'test'>(
      {
        filter: (item) => item.name === 'Alpha'
      },
      undefined,
      pathBuilder,
      fileProcessor,
      directoryManager,
      coordinate
    );

    expect(items).toHaveLength(1);
    expect(items[0].name).toBe('Alpha');
  });

  it('should apply sort from query', async () => {
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

    const items = await all<TestItem, 'test'>(
      {
        sort: (a, b) => (a.priority || 0) - (b.priority || 0)
      },
      undefined,
      pathBuilder,
      fileProcessor,
      directoryManager,
      coordinate
    );

    expect(items[0].name).toBe('Alpha');
    expect(items[1].name).toBe('Beta');
    expect(items[2].name).toBe('Charlie');
  });

  it('should apply limit from query', async () => {
    await create<TestItem, 'test'>({ pk: 'item-1', name: 'Item 1' }, undefined, pathBuilder, fileProcessor, directoryManager, coordinate, options);
    await create<TestItem, 'test'>({ pk: 'item-2', name: 'Item 2' }, undefined, pathBuilder, fileProcessor, directoryManager, coordinate, options);
    await create<TestItem, 'test'>({ pk: 'item-3', name: 'Item 3' }, undefined, pathBuilder, fileProcessor, directoryManager, coordinate, options);

    const items = await all<TestItem, 'test'>(
      { limit: 2 },
      undefined,
      pathBuilder,
      fileProcessor,
      directoryManager,
      coordinate
    );

    expect(items).toHaveLength(2);
  });

  it('should apply offset from query', async () => {
    await create<TestItem, 'test'>({ pk: 'item-1', name: 'Item 1' }, undefined, pathBuilder, fileProcessor, directoryManager, coordinate, options);
    await create<TestItem, 'test'>({ pk: 'item-2', name: 'Item 2' }, undefined, pathBuilder, fileProcessor, directoryManager, coordinate, options);
    await create<TestItem, 'test'>({ pk: 'item-3', name: 'Item 3' }, undefined, pathBuilder, fileProcessor, directoryManager, coordinate, options);

    const items = await all<TestItem, 'test'>(
      { offset: 1 },
      undefined,
      pathBuilder,
      fileProcessor,
      directoryManager,
      coordinate
    );

    expect(items).toHaveLength(2);
  });

  it('should apply offset and limit together', async () => {
    await create<TestItem, 'test'>({ pk: 'item-1', name: 'Item 1', priority: 1 }, undefined, pathBuilder, fileProcessor, directoryManager, coordinate, options);
    await create<TestItem, 'test'>({ pk: 'item-2', name: 'Item 2', priority: 2 }, undefined, pathBuilder, fileProcessor, directoryManager, coordinate, options);
    await create<TestItem, 'test'>({ pk: 'item-3', name: 'Item 3', priority: 3 }, undefined, pathBuilder, fileProcessor, directoryManager, coordinate, options);
    await create<TestItem, 'test'>({ pk: 'item-4', name: 'Item 4', priority: 4 }, undefined, pathBuilder, fileProcessor, directoryManager, coordinate, options);

    const items = await all<TestItem, 'test'>(
      {
        offset: 1,
        limit: 2,
        sort: (a, b) => (a.priority || 0) - (b.priority || 0)
      },
      undefined,
      pathBuilder,
      fileProcessor,
      directoryManager,
      coordinate
    );

    expect(items).toHaveLength(2);
    expect(items[0].priority).toBe(2);
    expect(items[1].priority).toBe(3);
  });
});

