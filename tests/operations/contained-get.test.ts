import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { create } from '../../src/ops/create';
import { get } from '../../src/ops/get';
import { PathBuilder } from '../../src/PathBuilder';
import { FileProcessor } from '../../src/FileProcessor';
import { DirectoryManager } from '../../src/DirectoryManager';
import type { ComKey, Coordinate, Item } from '@fjell/core';
import type { Options } from '../../src/Options';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

interface Comment extends Item<'comment', 'post'> {
  kt: 'comment';
  pk: string;
  loc: [{ kt: 'post'; lk: string }];
  text: string;
}

describe('Contained Items - get operation', () => {
  let testDir: string;
  let pathBuilder: PathBuilder;
  let fileProcessor: FileProcessor;
  let directoryManager: DirectoryManager;
  let coordinate: Coordinate<'comment', 'post'>;
  let options: Options<Comment, 'comment', 'post'>;

  beforeEach(async () => {
    testDir = await fs.mkdtemp(path.join(os.tmpdir(), 'lib-fs-test-'));
    
    pathBuilder = new PathBuilder({
      globalDirectory: testDir,
      directoryPaths: ['comments', 'posts'],
      kta: ['comment', 'post'],
      useJsonExtension: true
    });
    
    fileProcessor = new FileProcessor();
    directoryManager = new DirectoryManager(testDir);
    coordinate = { kt: 'comment', kta: ['comment', 'post'] } as Coordinate<'comment', 'post'>;
    
    options = {
      globalDirectory: testDir,
      encoding: 'utf-8',
      autoCreateDirectories: true
    } as Options<Comment, 'comment', 'post'>;
  });

  afterEach(async () => {
    await fs.rm(testDir, { recursive: true, force: true });
  });

  it('should get contained item by ComKey', async () => {
    // Create a comment
    const comment = await create<Comment, 'comment', 'post'>(
      { text: 'Test comment' },
      { locations: [{ kt: 'post', lk: 'post-1' }] },
      pathBuilder,
      fileProcessor,
      directoryManager,
      coordinate,
      options
    );

    // Get it back
    const key: ComKey<'comment', 'post'> = {
      kt: 'comment',
      pk: comment.pk,
      loc: [{ kt: 'post', lk: 'post-1' }]
    };

    const retrieved = await get<Comment, 'comment', 'post'>(
      key,
      pathBuilder,
      fileProcessor,
      coordinate,
      options
    );

    expect(retrieved).toBeDefined();
    expect(retrieved?.pk).toBe(comment.pk);
    expect(retrieved?.text).toBe('Test comment');
    expect(retrieved?.loc).toEqual([{ kt: 'post', lk: 'post-1' }]);
  });

  it('should return null for non-existent contained item', async () => {
    const key: ComKey<'comment', 'post'> = {
      kt: 'comment',
      pk: 'does-not-exist',
      loc: [{ kt: 'post', lk: 'post-1' }]
    };

    const result = await get<Comment, 'comment', 'post'>(
      key,
      pathBuilder,
      fileProcessor,
      coordinate,
      options
    );

    expect(result).toBeNull();
  });

  it('should verify correct directory structure was used', async () => {
    const comment = await create<Comment, 'comment', 'post'>(
      { text: 'Check path' },
      { locations: [{ kt: 'post', lk: 'post-123' }] },
      pathBuilder,
      fileProcessor,
      directoryManager,
      coordinate,
      options
    );

    // Verify the file is in the correct location
    const expectedPath = path.join(testDir, 'posts', 'post-123', 'comments', `${comment.pk}.json`);
    const exists = await fs.access(expectedPath, fs.constants.F_OK)
      .then(() => true)
      .catch(() => false);

    expect(exists).toBe(true);
  });
});

