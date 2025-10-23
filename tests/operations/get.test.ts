import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { get } from '../../src/ops/get';
import { PathBuilder } from '../../src/PathBuilder';
import { FileProcessor } from '../../src/FileProcessor';
import { DirectoryManager } from '../../src/DirectoryManager';
import type { Coordinate, Item, PriKey } from '@fjell/core';
import type { Options } from '../../src/Options';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

interface TestItem extends Item<'test'> {
  kt: 'test';
  pk: string;
  name: string;
}

describe('get operation', () => {
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
      encoding: 'utf-8'
    } as Options<TestItem, 'test'>;
  });

  afterEach(async () => {
    await fs.rm(testDir, { recursive: true, force: true });
  });

  it('should get item by PriKey', async () => {
    // Create a test file
    const key: PriKey<'test'> = { kt: 'test', pk: 'test-123' };
    const item: TestItem = { kt: 'test', pk: 'test-123', name: 'Test Item' };
    
    const filePath = pathBuilder.buildPath(key);
    await directoryManager.ensureNestedDirectories(filePath);
    await fs.writeFile(filePath, JSON.stringify(item), 'utf-8');

    // Get the item
    const result = await get<TestItem, 'test'>(
      key,
      pathBuilder,
      fileProcessor,
      coordinate,
      options
    );

    expect(result).toBeDefined();
    expect(result?.kt).toBe('test');
    expect(result?.pk).toBe('test-123');
    expect(result?.name).toBe('Test Item');
  });

  it('should return null when item not found', async () => {
    const key: PriKey<'test'> = { kt: 'test', pk: 'does-not-exist' };

    const result = await get<TestItem, 'test'>(
      key,
      pathBuilder,
      fileProcessor,
      coordinate,
      options
    );

    expect(result).toBeNull();
  });

  it('should deserialize item correctly', async () => {
    const key: PriKey<'test'> = { kt: 'test', pk: 'test-456' };
    const item: TestItem = {
      kt: 'test',
      pk: 'test-456',
      name: 'Complex Item'
    };
    
    const filePath = pathBuilder.buildPath(key);
    await directoryManager.ensureNestedDirectories(filePath);
    await fs.writeFile(filePath, JSON.stringify(item), 'utf-8');

    const result = await get<TestItem, 'test'>(
      key,
      pathBuilder,
      fileProcessor,
      coordinate,
      options
    );

    expect(result).toEqual(item);
  });

  it('should return null for invalid JSON', async () => {
    const key: PriKey<'test'> = { kt: 'test', pk: 'invalid' };
    
    const filePath = pathBuilder.buildPath(key);
    await directoryManager.ensureNestedDirectories(filePath);
    await fs.writeFile(filePath, 'invalid json', 'utf-8');

    const result = await get<TestItem, 'test'>(
      key,
      pathBuilder,
      fileProcessor,
      coordinate,
      options
    );

    expect(result).toBeNull();
  });
});

