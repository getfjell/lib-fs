import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { upsert } from '../../src/ops/upsert';
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

describe('upsert operation - Advanced Coverage', () => {
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

  it('should handle upsert with all merge strategies on existing item', async () => {
    // Create initial item
    await fs.mkdir(path.join(testDir, 'tests'), { recursive: true });
    await fs.writeFile(
      path.join(testDir, 'tests', 'merge-test.json'),
      JSON.stringify({ kt: 'test', pk: 'merge-test', name: 'Original' })
    );

    // Test deep merge
    const deepResult = await upsert<TestItem, 'test'>(
      { kt: 'test', pk: 'merge-test' },
      { name: 'Deep' },
      undefined,
      { mergeStrategy: 'deep' },
      pathBuilder,
      fileProcessor,
      directoryManager,
      coordinate,
      options
    );
    expect(deepResult.name).toBe('Deep');

    // Test shallow merge
    const shallowResult = await upsert<TestItem, 'test'>(
      { kt: 'test', pk: 'merge-test' },
      { name: 'Shallow' },
      undefined,
      { mergeStrategy: 'shallow' },
      pathBuilder,
      fileProcessor,
      directoryManager,
      coordinate,
      options
    );
    expect(shallowResult.name).toBe('Shallow');

    // Test replace
    const replaceResult = await upsert<TestItem, 'test'>(
      { kt: 'test', pk: 'merge-test' },
      { name: 'Replace' },
      undefined,
      { mergeStrategy: 'replace' },
      pathBuilder,
      fileProcessor,
      directoryManager,
      coordinate,
      options
    );
    expect(replaceResult.name).toBe('Replace');
  });

  it('should handle upsert with locations parameter', async () => {
    const result = await upsert<TestItem, 'test'>(
      { kt: 'test', pk: 'with-locations' },
      { name: 'Test' },
      [], // Empty locations for primary item
      undefined,
      pathBuilder,
      fileProcessor,
      directoryManager,
      coordinate,
      options
    );

    expect(result.name).toBe('Test');
  });

  it('should handle error during upsert', async () => {
    // Create a scenario that might cause an error
    const badPathBuilder = new PathBuilder({
      globalDirectory: '/dev/null/impossible',
      directoryPaths: ['tests'],
      useJsonExtension: true
    });

    await expect(
      upsert<TestItem, 'test'>(
        { kt: 'test', pk: 'error-test' },
        { name: 'Test' },
        undefined,
        undefined,
        badPathBuilder,
        fileProcessor,
        directoryManager,
        coordinate,
        options
      )
    ).rejects.toThrow();
  });
});

