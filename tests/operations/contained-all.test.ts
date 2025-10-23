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

interface Comment extends Item<'comment', 'post'> {
  kt: 'comment';
  pk: string;
  loc: [{ kt: 'post'; lk: string }];
  text: string;
}

describe('Contained Items - all operation', () => {
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

  it('should list all items in a specific location', async () => {
    // Create multiple comments in same post
    await create<Comment, 'comment', 'post'>(
      { text: 'Comment 1' },
      { locations: [{ kt: 'post', lk: 'post-1' }] },
      pathBuilder,
      fileProcessor,
      directoryManager,
      coordinate,
      options
    );

    await create<Comment, 'comment', 'post'>(
      { text: 'Comment 2' },
      { locations: [{ kt: 'post', lk: 'post-1' }] },
      pathBuilder,
      fileProcessor,
      directoryManager,
      coordinate,
      options
    );

    await create<Comment, 'comment', 'post'>(
      { text: 'Comment 3' },
      { locations: [{ kt: 'post', lk: 'post-1' }] },
      pathBuilder,
      fileProcessor,
      directoryManager,
      coordinate,
      options
    );

    // List comments in post-1
    const comments = await all<Comment, 'comment', 'post'>(
      undefined,
      [{ kt: 'post', lk: 'post-1' }],
      pathBuilder,
      fileProcessor,
      directoryManager,
      coordinate
    );

    expect(comments).toHaveLength(3);
    comments.forEach(comment => {
      expect(comment.loc[0].lk).toBe('post-1');
    });
  });

  it('should list items only in specified location', async () => {
    // Create comments in different posts
    await create<Comment, 'comment', 'post'>(
      { text: 'Post 1 Comment 1' },
      { locations: [{ kt: 'post', lk: 'post-1' }] },
      pathBuilder,
      fileProcessor,
      directoryManager,
      coordinate,
      options
    );

    await create<Comment, 'comment', 'post'>(
      { text: 'Post 1 Comment 2' },
      { locations: [{ kt: 'post', lk: 'post-1' }] },
      pathBuilder,
      fileProcessor,
      directoryManager,
      coordinate,
      options
    );

    await create<Comment, 'comment', 'post'>(
      { text: 'Post 2 Comment 1' },
      { locations: [{ kt: 'post', lk: 'post-2' }] },
      pathBuilder,
      fileProcessor,
      directoryManager,
      coordinate,
      options
    );

    // List only post-1 comments
    const post1Comments = await all<Comment, 'comment', 'post'>(
      undefined,
      [{ kt: 'post', lk: 'post-1' }],
      pathBuilder,
      fileProcessor,
      directoryManager,
      coordinate
    );

    expect(post1Comments).toHaveLength(2);

    // List only post-2 comments
    const post2Comments = await all<Comment, 'comment', 'post'>(
      undefined,
      [{ kt: 'post', lk: 'post-2' }],
      pathBuilder,
      fileProcessor,
      directoryManager,
      coordinate
    );

    expect(post2Comments).toHaveLength(1);
  });

  it('should return empty array for location with no items', async () => {
    const comments = await all<Comment, 'comment', 'post'>(
      undefined,
      [{ kt: 'post', lk: 'empty-post' }],
      pathBuilder,
      fileProcessor,
      directoryManager,
      coordinate
    );

    expect(comments).toEqual([]);
  });

  it('should apply query filters to contained items', async () => {
    await create<Comment, 'comment', 'post'>(
      { text: 'Include me' },
      { locations: [{ kt: 'post', lk: 'post-1' }] },
      pathBuilder,
      fileProcessor,
      directoryManager,
      coordinate,
      options
    );

    await create<Comment, 'comment', 'post'>(
      { text: 'Exclude me' },
      { locations: [{ kt: 'post', lk: 'post-1' }] },
      pathBuilder,
      fileProcessor,
      directoryManager,
      coordinate,
      options
    );

    const filtered = await all<Comment, 'comment', 'post'>(
      {
        filter: (item: Comment) => item.text.includes('Include')
      } as any,
      [{ kt: 'post', lk: 'post-1' }],
      pathBuilder,
      fileProcessor,
      directoryManager,
      coordinate
    );

    expect(filtered).toHaveLength(1);
    expect(filtered[0].text).toBe('Include me');
  });
});

