import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { one } from '../../src/ops/one';
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
  value?: number;
}

describe('one operation - Advanced Coverage', () => {
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

  it('should handle query with existing limit=1', async () => {
    await fs.mkdir(path.join(testDir, 'tests'), { recursive: true });
    await fs.writeFile(path.join(testDir, 'tests', 'item1.json'), JSON.stringify({ kt: 'test', pk: 'item-1', name: 'Item 1' }));
    await fs.writeFile(path.join(testDir, 'tests', 'item2.json'), JSON.stringify({ kt: 'test', pk: 'item-2', name: 'Item 2' }));

    const item = await one<TestItem, 'test'>(
      { limit: 1 }, // Already has limit
      undefined,
      pathBuilder,
      fileProcessor,
      directoryManager,
      coordinate
    );

    expect(item).toBeDefined();
  });

  it('should handle error from all operation', async () => {
    // Create a situation that might cause an error
    await fs.mkdir(path.join(testDir, 'tests'), { recursive: true });
    // Write a file that will cause deserialization error
    await fs.writeFile(path.join(testDir, 'tests', 'bad.json'), 'invalid{json');

    // Should handle gracefully
    const item = await one<TestItem, 'test'>(
      undefined,
      undefined,
      pathBuilder,
      fileProcessor,
      directoryManager,
      coordinate
    );

    // Should return null or handle gracefully
    expect(item === null || typeof item === 'object').toBe(true);
  });

  it('should work with complex query combining filter, sort, offset', async () => {
    await fs.mkdir(path.join(testDir, 'tests'), { recursive: true });
    await fs.writeFile(path.join(testDir, 'tests', 'item1.json'), JSON.stringify({ kt: 'test', pk: 'item-1', name: 'Alpha', value: 1 }));
    await fs.writeFile(path.join(testDir, 'tests', 'item2.json'), JSON.stringify({ kt: 'test', pk: 'item-2', name: 'Beta', value: 2 }));
    await fs.writeFile(path.join(testDir, 'tests', 'item3.json'), JSON.stringify({ kt: 'test', pk: 'item-3', name: 'Gamma', value: 3 }));

    const item = await one<TestItem, 'test'>(
      {
        filter: (item: TestItem) => (item.value || 0) > 1,
        sort: (a: TestItem, b: TestItem) => (b.value || 0) - (a.value || 0),
        offset: 0
      } as any,
      undefined,
      pathBuilder,
      fileProcessor,
      directoryManager,
      coordinate
    );

    expect(item).toBeDefined();
    expect(item?.value).toBe(3); // Highest value after filter
  });
});

