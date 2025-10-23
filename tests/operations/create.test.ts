import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { create } from '../../src/ops/create';
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

describe('create operation', () => {
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

  it('should create a new item', async () => {
    const item: Partial<TestItem> = {
      name: 'New Item'
    };

    const result = await create<TestItem, 'test'>(
      item,
      undefined,
      pathBuilder,
      fileProcessor,
      directoryManager,
      coordinate,
      options
    );

    expect(result).toBeDefined();
    expect(result.kt).toBe('test');
    expect(result.pk).toBeDefined();
    expect(result.name).toBe('New Item');
  });

  it('should generate UUID for pk if not provided', async () => {
    const item: Partial<TestItem> = {
      name: 'Auto PK'
    };

    const result = await create<TestItem, 'test'>(
      item,
      undefined,
      pathBuilder,
      fileProcessor,
      directoryManager,
      coordinate,
      options
    );

    expect(result.pk).toBeDefined();
    expect(result.pk).toMatch(/^[a-f0-9-]{36}$/); // UUID format
  });

  it('should use provided pk', async () => {
    const item: Partial<TestItem> = {
      pk: 'custom-pk',
      name: 'Custom PK Item'
    };

    const result = await create<TestItem, 'test'>(
      item,
      undefined,
      pathBuilder,
      fileProcessor,
      directoryManager,
      coordinate,
      options
    );

    expect(result.pk).toBe('custom-pk');
  });

  it('should create file on filesystem', async () => {
    const item: Partial<TestItem> = {
      pk: 'test-123',
      name: 'Test Item'
    };

    const result = await create<TestItem, 'test'>(
      item,
      undefined,
      pathBuilder,
      fileProcessor,
      directoryManager,
      coordinate,
      options
    );

    const filePath = pathBuilder.buildPath({ kt: 'test', pk: result.pk });
    const exists = await fs.access(filePath, fs.constants.F_OK)
      .then(() => true)
      .catch(() => false);

    expect(exists).toBe(true);
  });

  it('should create directories if they do not exist', async () => {
    const item: Partial<TestItem> = {
      name: 'Directory Test'
    };

    const result = await create<TestItem, 'test'>(
      item,
      undefined,
      pathBuilder,
      fileProcessor,
      directoryManager,
      coordinate,
      options
    );

    expect(result).toBeDefined();
    
    const dirPath = path.join(testDir, 'tests');
    const dirExists = await fs.stat(dirPath)
      .then(stats => stats.isDirectory())
      .catch(() => false);

    expect(dirExists).toBe(true);
  });

  it('should be retrievable with get', async () => {
    const item: Partial<TestItem> = {
      pk: 'get-test',
      name: 'Get Test Item'
    };

    const created = await create<TestItem, 'test'>(
      item,
      undefined,
      pathBuilder,
      fileProcessor,
      directoryManager,
      coordinate,
      options
    );

    const retrieved = await get<TestItem, 'test'>(
      { kt: 'test', pk: created.pk },
      pathBuilder,
      fileProcessor,
      coordinate,
      options
    );

    expect(retrieved).toEqual(created);
  });
});

