import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { create } from '../../src/ops/create';
import { get } from '../../src/ops/get';
import { all } from '../../src/ops/all';
import { PathBuilder } from '../../src/PathBuilder';
import { FileProcessor } from '../../src/FileProcessor';
import { DirectoryManager } from '../../src/DirectoryManager';
import type { ComKey, Coordinate, Item } from '@fjell/core';
import type { Options } from '../../src/Options';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

interface Reply extends Item<'reply', 'post', 'comment'> {
  kt: 'reply';
  pk: string;
  loc: [{ kt: 'post'; lk: string }, { kt: 'comment'; lk: string }];
  text: string;
}

describe('Contained Items - Nested (2+ levels)', () => {
  let testDir: string;
  let pathBuilder: PathBuilder;
  let fileProcessor: FileProcessor;
  let directoryManager: DirectoryManager;
  let coordinate: Coordinate<'reply', 'post', 'comment'>;
  let options: Options<Reply, 'reply', 'post', 'comment'>;

  beforeEach(async () => {
    testDir = await fs.mkdtemp(path.join(os.tmpdir(), 'lib-fs-test-'));
    
    pathBuilder = new PathBuilder({
      globalDirectory: testDir,
      directoryPaths: ['replies', 'posts', 'comments'],
      kta: ['reply', 'post', 'comment'],
      useJsonExtension: true
    });
    
    fileProcessor = new FileProcessor();
    directoryManager = new DirectoryManager(testDir);
    coordinate = { kt: 'reply', kta: ['reply', 'post', 'comment'] } as Coordinate<'reply', 'post', 'comment'>;
    
    options = {
      globalDirectory: testDir,
      encoding: 'utf-8',
      autoCreateDirectories: true
    } as Options<Reply, 'reply', 'post', 'comment'>;
  });

  afterEach(async () => {
    await fs.rm(testDir, { recursive: true, force: true });
  });

  it('should create reply with 2-level nesting', async () => {
    const reply = await create<Reply, 'reply', 'post', 'comment'>(
      { text: 'Reply to comment' },
      {
        locations: [
          { kt: 'post', lk: 'post-1' },
          { kt: 'comment', lk: 'comment-1' }
        ]
      },
      pathBuilder,
      fileProcessor,
      directoryManager,
      coordinate,
      options
    );

    expect(reply).toBeDefined();
    expect(reply.kt).toBe('reply');
    expect(reply.loc).toHaveLength(2);
    expect(reply.loc[0]).toEqual({ kt: 'post', lk: 'post-1' });
    expect(reply.loc[1]).toEqual({ kt: 'comment', lk: 'comment-1' });
  });

  it('should create correct nested directory structure', async () => {
    const reply = await create<Reply, 'reply', 'post', 'comment'>(
      { text: 'Nested structure test' },
      {
        locations: [
          { kt: 'post', lk: 'post-abc' },
          { kt: 'comment', lk: 'comment-xyz' }
        ]
      },
      pathBuilder,
      fileProcessor,
      directoryManager,
      coordinate,
      options
    );

    // Verify the directory hierarchy exists
    const expectedPath = path.join(testDir, 'posts', 'post-abc', 'comments', 'comment-xyz', 'replies');
    const exists = await directoryManager.directoryExists(expectedPath);
    expect(exists).toBe(true);

    // Verify file is in the right place
    const filePath = path.join(expectedPath, `${reply.pk}.json`);
    const fileExists = await fs.access(filePath, fs.constants.F_OK)
      .then(() => true)
      .catch(() => false);
    expect(fileExists).toBe(true);
  });

  it('should get reply by ComKey with 2 levels', async () => {
    const created = await create<Reply, 'reply', 'post', 'comment'>(
      { text: 'Get me back' },
      {
        locations: [
          { kt: 'post', lk: 'post-2' },
          { kt: 'comment', lk: 'comment-2' }
        ]
      },
      pathBuilder,
      fileProcessor,
      directoryManager,
      coordinate,
      options
    );

    const key: ComKey<'reply', 'post', 'comment'> = {
      kt: 'reply',
      pk: created.pk,
      loc: [
        { kt: 'post', lk: 'post-2' },
        { kt: 'comment', lk: 'comment-2' }
      ]
    };

    const retrieved = await get<Reply, 'reply', 'post', 'comment'>(
      key,
      pathBuilder,
      fileProcessor,
      coordinate,
      options
    );

    expect(retrieved).toEqual(created);
  });

  it('should list all replies in a specific comment', async () => {
    // Create replies in same comment
    await create<Reply, 'reply', 'post', 'comment'>(
      { text: 'Reply 1' },
      { locations: [{ kt: 'post', lk: 'post-1' }, { kt: 'comment', lk: 'comment-1' }] },
      pathBuilder,
      fileProcessor,
      directoryManager,
      coordinate,
      options
    );

    await create<Reply, 'reply', 'post', 'comment'>(
      { text: 'Reply 2' },
      { locations: [{ kt: 'post', lk: 'post-1' }, { kt: 'comment', lk: 'comment-1' }] },
      pathBuilder,
      fileProcessor,
      directoryManager,
      coordinate,
      options
    );

    // List replies in this specific comment
    const replies = await all<Reply, 'reply', 'post', 'comment'>(
      undefined,
      [{ kt: 'post', lk: 'post-1' }, { kt: 'comment', lk: 'comment-1' }],
      pathBuilder,
      fileProcessor,
      directoryManager,
      coordinate
    );

    expect(replies).toHaveLength(2);
  });

  it('should differentiate between different comment locations', async () => {
    // Create replies in different comments
    await create<Reply, 'reply', 'post', 'comment'>(
      { text: 'Comment A Reply' },
      { locations: [{ kt: 'post', lk: 'post-1' }, { kt: 'comment', lk: 'comment-a' }] },
      pathBuilder,
      fileProcessor,
      directoryManager,
      coordinate,
      options
    );

    await create<Reply, 'reply', 'post', 'comment'>(
      { text: 'Comment B Reply' },
      { locations: [{ kt: 'post', lk: 'post-1' }, { kt: 'comment', lk: 'comment-b' }] },
      pathBuilder,
      fileProcessor,
      directoryManager,
      coordinate,
      options
    );

    // List replies in comment-a
    const repliesA = await all<Reply, 'reply', 'post', 'comment'>(
      undefined,
      [{ kt: 'post', lk: 'post-1' }, { kt: 'comment', lk: 'comment-a' }],
      pathBuilder,
      fileProcessor,
      directoryManager,
      coordinate
    );

    expect(repliesA).toHaveLength(1);
    expect(repliesA[0].text).toBe('Comment A Reply');

    // List replies in comment-b
    const repliesB = await all<Reply, 'reply', 'post', 'comment'>(
      undefined,
      [{ kt: 'post', lk: 'post-1' }, { kt: 'comment', lk: 'comment-b' }],
      pathBuilder,
      fileProcessor,
      directoryManager,
      coordinate
    );

    expect(repliesB).toHaveLength(1);
    expect(repliesB[0].text).toBe('Comment B Reply');
  });
});

