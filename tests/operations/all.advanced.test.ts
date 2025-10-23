import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { all } from '../../src/ops/all';
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

describe('all operation - Advanced Coverage', () => {
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

  it('should handle directory with corrupted JSON files', async () => {
    const dirPath = path.join(testDir, 'tests');
    await fs.mkdir(dirPath, { recursive: true });
    
    // Create valid item
    await fs.writeFile(path.join(dirPath, 'valid.json'), JSON.stringify({
      kt: 'test', pk: 'valid', name: 'Valid'
    }));
    
    // Create corrupted JSON
    await fs.writeFile(path.join(dirPath, 'corrupt.json'), 'not valid json{');

    const items = await all<TestItem, 'test'>(
      undefined,
      undefined,
      pathBuilder,
      fileProcessor,
      directoryManager,
      coordinate
    );

    // Should only return valid item, skip corrupted
    expect(items).toHaveLength(1);
    expect(items[0].name).toBe('Valid');
  });

  it('should handle empty query object', async () => {
    await fs.mkdir(path.join(testDir, 'tests'), { recursive: true });
    await fs.writeFile(
      path.join(testDir, 'tests', 'item.json'),
      JSON.stringify({ kt: 'test', pk: 'item-1', name: 'Test' })
    );

    const items = await all<TestItem, 'test'>(
      {}, // Empty query
      undefined,
      pathBuilder,
      fileProcessor,
      directoryManager,
      coordinate
    );

    expect(items).toHaveLength(1);
  });

  it('should apply offset of 0 (should not skip anything)', async () => {
    await fs.mkdir(path.join(testDir, 'tests'), { recursive: true });
    await fs.writeFile(path.join(testDir, 'tests', 'item1.json'), JSON.stringify({ kt: 'test', pk: 'item-1', name: 'Item 1' }));
    await fs.writeFile(path.join(testDir, 'tests', 'item2.json'), JSON.stringify({ kt: 'test', pk: 'item-2', name: 'Item 2' }));

    const items = await all<TestItem, 'test'>(
      { offset: 0 },
      undefined,
      pathBuilder,
      fileProcessor,
      directoryManager,
      coordinate
    );

    expect(items).toHaveLength(2);
  });

  it('should apply limit of 0 (should return empty)', async () => {
    await fs.mkdir(path.join(testDir, 'tests'), { recursive: true });
    await fs.writeFile(path.join(testDir, 'tests', 'item1.json'), JSON.stringify({ kt: 'test', pk: 'item-1', name: 'Item 1' }));

    const items = await all<TestItem, 'test'>(
      { limit: 0 },
      undefined,
      pathBuilder,
      fileProcessor,
      directoryManager,
      coordinate
    );

    expect(items).toEqual([]);
  });

  it('should handle query with only offset (no limit)', async () => {
    await fs.mkdir(path.join(testDir, 'tests'), { recursive: true });
    await fs.writeFile(path.join(testDir, 'tests', 'item1.json'), JSON.stringify({ kt: 'test', pk: 'item-1', name: 'Item 1', value: 1 }));
    await fs.writeFile(path.join(testDir, 'tests', 'item2.json'), JSON.stringify({ kt: 'test', pk: 'item-2', name: 'Item 2', value: 2 }));
    await fs.writeFile(path.join(testDir, 'tests', 'item3.json'), JSON.stringify({ kt: 'test', pk: 'item-3', name: 'Item 3', value: 3 }));

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

  it('should handle query with only limit (no offset)', async () => {
    await fs.mkdir(path.join(testDir, 'tests'), { recursive: true });
    await fs.writeFile(path.join(testDir, 'tests', 'item1.json'), JSON.stringify({ kt: 'test', pk: 'item-1', name: 'Item 1' }));
    await fs.writeFile(path.join(testDir, 'tests', 'item2.json'), JSON.stringify({ kt: 'test', pk: 'item-2', name: 'Item 2' }));
    await fs.writeFile(path.join(testDir, 'tests', 'item3.json'), JSON.stringify({ kt: 'test', pk: 'item-3', name: 'Item 3' }));

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

  it('should handle query with custom filter and sort together', async () => {
    await fs.mkdir(path.join(testDir, 'tests'), { recursive: true });
    await fs.writeFile(path.join(testDir, 'tests', 'item1.json'), JSON.stringify({ kt: 'test', pk: 'item-1', name: 'Alpha', value: 3 }));
    await fs.writeFile(path.join(testDir, 'tests', 'item2.json'), JSON.stringify({ kt: 'test', pk: 'item-2', name: 'Beta', value: 1 }));
    await fs.writeFile(path.join(testDir, 'tests', 'item3.json'), JSON.stringify({ kt: 'test', pk: 'item-3', name: 'Gamma', value: 2 }));

    const items = await all<TestItem, 'test'>(
      {
        filter: (item: TestItem) => (item.value || 0) > 1,
        sort: (a: TestItem, b: TestItem) => (a.value || 0) - (b.value || 0)
      } as any,
      undefined,
      pathBuilder,
      fileProcessor,
      directoryManager,
      coordinate
    );

    expect(items).toHaveLength(2); // Only value > 1
    expect(items[0].value).toBe(2); // Gamma
    expect(items[1].value).toBe(3); // Alpha
  });

  it('should handle non-existent directory (ENOENT)', async () => {
    // Don't create the directory
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

  it('should filter out files without .json extension when filter applied', async () => {
    await fs.mkdir(path.join(testDir, 'tests'), { recursive: true });
    await fs.writeFile(path.join(testDir, 'tests', 'item.json'), JSON.stringify({ kt: 'test', pk: 'item-1', name: 'JSON' }));
    await fs.writeFile(path.join(testDir, 'tests', 'other.txt'), 'not json');

    const items = await all<TestItem, 'test'>(
      undefined,
      undefined,
      pathBuilder,
      fileProcessor,
      directoryManager,
      coordinate
    );

    expect(items).toHaveLength(1);
    expect(items[0].name).toBe('JSON');
  });
});

