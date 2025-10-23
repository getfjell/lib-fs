import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { update } from '../../src/ops/update';
import { PathBuilder } from '../../src/PathBuilder';
import { FileProcessor } from '../../src/FileProcessor';
import { DirectoryManager } from '../../src/DirectoryManager';
import type { ComKey, Coordinate, Item } from '@fjell/core';
import type { Options } from '../../src/Options';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

interface TestItem extends Item<'test'> {
  kt: 'test';
  pk: string;
  name: string;
}

interface ContainedItem extends Item<'comment', 'post'> {
  kt: 'comment';
  pk: string;
  loc: [{ kt: 'post'; lk: string }];
  text: string;
}

describe('update operation - Coverage Completion', () => {
  let testDir: string;
  let fileProcessor: FileProcessor;
  let directoryManager: DirectoryManager;
  let options: Options<TestItem, 'test'>;

  beforeEach(async () => {
    testDir = await fs.mkdtemp(path.join(os.tmpdir(), 'lib-fs-test-'));
    
    fileProcessor = new FileProcessor();
    directoryManager = new DirectoryManager(testDir);
    
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

  it('should preserve loc field in ComKey update (lines 93-94)', async () => {
    const containedPathBuilder = new PathBuilder({
      globalDirectory: testDir,
      directoryPaths: ['posts', 'comments'],
      useJsonExtension: true
    });

    const containedCoordinate = { kt: 'comment', kta: ['comment', 'post'] } as Coordinate<'comment', 'post'>;

    // Create directories and file using the actual path that will be constructed
    const commentPath = containedPathBuilder.buildPath({
      kt: 'comment',
      pk: 'comment-1',
      loc: [{ kt: 'post', lk: 'post-1' }]
    });
    await fs.mkdir(path.dirname(commentPath), { recursive: true });
    const item: ContainedItem = {
      kt: 'comment',
      pk: 'comment-1',
      loc: [{ kt: 'post', lk: 'post-1' }],
      text: 'Original comment'
    };
    await fs.writeFile(commentPath, JSON.stringify(item));

    const key: ComKey<'comment', 'post'> = {
      kt: 'comment',
      pk: 'comment-1',
      loc: [{ kt: 'post', lk: 'post-1' }]
    };

    // Update the item
    const updated = await update<ContainedItem, 'comment', 'post'>(
      key,
      { text: 'Updated comment' },
      { mergeStrategy: 'deep' },
      containedPathBuilder,
      fileProcessor,
      directoryManager,
      containedCoordinate,
      options as any
    );

    expect(updated.loc).toBeDefined();
    expect(updated.loc[0].kt).toBe('post');
    expect(updated.loc[0].lk).toBe('post-1');
    expect(updated.text).toBe('Updated comment');
  });
});

