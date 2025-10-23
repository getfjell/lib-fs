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

describe('Contained Items - create operation', () => {
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

  it('should create contained item in specific location', async () => {
    const comment = await create<Comment, 'comment', 'post'>(
      { text: 'Great post!' },
      { locations: [{ kt: 'post', lk: 'post-456' }] },
      pathBuilder,
      fileProcessor,
      directoryManager,
      coordinate,
      options
    );

    expect(comment).toBeDefined();
    expect(comment.kt).toBe('comment');
    expect(comment.loc).toEqual([{ kt: 'post', lk: 'post-456' }]);
    expect(comment.text).toBe('Great post!');
  });

  it('should create nested directories automatically', async () => {
    const result = await create<Comment, 'comment', 'post'>(
      { text: 'Nested test' },
      { locations: [{ kt: 'post', lk: 'post-789' }] },
      pathBuilder,
      fileProcessor,
      directoryManager,
      coordinate,
      options
    );

    expect(result).toBeDefined();

    // Verify directory structure exists
    const dirPath = path.join(testDir, 'posts', 'post-789', 'comments');
    const exists = await directoryManager.directoryExists(dirPath);
    expect(exists).toBe(true);
  });

  it('should be retrievable after creation', async () => {
    const created = await create<Comment, 'comment', 'post'>(
      { text: 'Retrievable' },
      { locations: [{ kt: 'post', lk: 'post-111' }] },
      pathBuilder,
      fileProcessor,
      directoryManager,
      coordinate,
      options
    );

    const key: ComKey<'comment', 'post'> = {
      kt: 'comment',
      pk: created.pk,
      loc: [{ kt: 'post', lk: 'post-111' }]
    };

    const retrieved = await get<Comment, 'comment', 'post'>(
      key,
      pathBuilder,
      fileProcessor,
      coordinate,
      options
    );

    expect(retrieved).toEqual(created);
  });

  it('should handle custom pk', async () => {
    const result = await create<Comment, 'comment', 'post'>(
      { pk: 'custom-pk', text: 'Custom' },
      { locations: [{ kt: 'post', lk: 'post-222' }] },
      pathBuilder,
      fileProcessor,
      directoryManager,
      coordinate,
      options
    );

    expect(result.pk).toBe('custom-pk');
  });
});

