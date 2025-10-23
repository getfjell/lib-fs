import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createContainedFilesystemLibrary } from '../../src/contained/FilesystemLibrary';
import { createContainedFilesystemLibrary2 } from '../../src/FilesystemLibraryFactory';
import type { Item } from '@fjell/core';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

interface Comment extends Item<'comment', 'post'> {
  kt: 'comment';
  pk: string;
  loc: [{ kt: 'post'; lk: string }];
  text: string;
  author?: string;
}

interface Reply extends Item<'reply', 'post', 'comment'> {
  kt: 'reply';
  pk: string;
  loc: [{ kt: 'post'; lk: string }, { kt: 'comment'; lk: string }];
  text: string;
}

describe('Contained Item Library Integration', () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = await fs.mkdtemp(path.join(os.tmpdir(), 'lib-fs-test-'));
  });

  afterEach(async () => {
    await fs.rm(testDir, { recursive: true, force: true });
  });

  describe('1-level containment', () => {
    it('should create comment in specific post', async () => {
      const commentLib = createContainedFilesystemLibrary<Comment, 'comment', 'post'>(
        ['comment', 'post'],
        ['comments', 'posts'],
        testDir
      );

      const comment = await commentLib.operations.create(
        { text: 'Great post!' },
        { locations: [{ kt: 'post', lk: 'post-123' }] }
      );

      expect(comment).toBeDefined();
      expect(comment.kt).toBe('comment');
      expect(comment.loc[0].lk).toBe('post-123');
    });

    it('should get comment by ComKey', async () => {
      const commentLib = createContainedFilesystemLibrary<Comment, 'comment', 'post'>(
        ['comment', 'post'],
        ['comments', 'posts'],
        testDir
      );

      const created = await commentLib.operations.create(
        { text: 'Test comment' },
        { locations: [{ kt: 'post', lk: 'post-456' }] }
      );

      const retrieved = await commentLib.operations.get({
        kt: 'comment',
        pk: created.pk,
        loc: [{ kt: 'post', lk: 'post-456' }]
      });

      expect(retrieved).toEqual(created);
    });

    it('should list all comments in a post', async () => {
      const commentLib = createContainedFilesystemLibrary<Comment, 'comment', 'post'>(
        ['comment', 'post'],
        ['comments', 'posts'],
        testDir
      );

      await commentLib.operations.create(
        { text: 'Comment 1' },
        { locations: [{ kt: 'post', lk: 'post-1' }] }
      );

      await commentLib.operations.create(
        { text: 'Comment 2' },
        { locations: [{ kt: 'post', lk: 'post-1' }] }
      );

      const comments = await commentLib.operations.all(
        {},
        [{ kt: 'post', lk: 'post-1' }]
      );

      expect(comments).toHaveLength(2);
    });

    it('should update contained item', async () => {
      const commentLib = createContainedFilesystemLibrary<Comment, 'comment', 'post'>(
        ['comment', 'post'],
        ['comments', 'posts'],
        testDir
      );

      const created = await commentLib.operations.create(
        { text: 'Original', author: 'Alice' },
        { locations: [{ kt: 'post', lk: 'post-1' }] }
      );

      const updated = await commentLib.operations.update(
        {
          kt: 'comment',
          pk: created.pk,
          loc: [{ kt: 'post', lk: 'post-1' }]
        },
        { text: 'Updated' }
      );

      expect(updated.text).toBe('Updated');
      expect(updated.author).toBe('Alice'); // Preserved
    });

    it('should remove contained item', async () => {
      const commentLib = createContainedFilesystemLibrary<Comment, 'comment', 'post'>(
        ['comment', 'post'],
        ['comments', 'posts'],
        testDir
      );

      const created = await commentLib.operations.create(
        { text: 'To be deleted' },
        { locations: [{ kt: 'post', lk: 'post-1' }] }
      );

      await commentLib.operations.remove({
        kt: 'comment',
        pk: created.pk,
        loc: [{ kt: 'post', lk: 'post-1' }]
      });

      const retrieved = await commentLib.operations.get({
        kt: 'comment',
        pk: created.pk,
        loc: [{ kt: 'post', lk: 'post-1' }]
      });

      expect(retrieved).toBeNull();
    });
  });

  describe('2-level containment', () => {
    it('should create reply with 2-level nesting', async () => {
      const replyLib = createContainedFilesystemLibrary2<Reply, 'reply', 'post', 'comment'>(
        'reply',
        ['post', 'comment'],
        ['replies', 'posts', 'comments'],
        { globalDirectory: testDir }
      );

      const created = await replyLib.operations.create(
        { text: 'Reply to comment' },
        {
          locations: [
            { kt: 'post', lk: 'post-1' },
            { kt: 'comment', lk: 'comment-1' }
          ]
        }
      );

      expect(created).toBeDefined();
      expect(created.loc).toHaveLength(2);
    });

    it('should list replies in specific comment', async () => {
      const replyLib = createContainedFilesystemLibrary2<Reply, 'reply', 'post', 'comment'>(
        'reply',
        ['post', 'comment'],
        ['replies', 'posts', 'comments'],
        { globalDirectory: testDir }
      );

      await replyLib.operations.create(
        { text: 'Reply 1' },
        { locations: [{ kt: 'post', lk: 'post-1' }, { kt: 'comment', lk: 'comment-1' }] }
      );

      await replyLib.operations.create(
        { text: 'Reply 2' },
        { locations: [{ kt: 'post', lk: 'post-1' }, { kt: 'comment', lk: 'comment-1' }] }
      );

      const replies = await replyLib.operations.all(
        {},
        [{ kt: 'post', lk: 'post-1' }, { kt: 'comment', lk: 'comment-1' }]
      );

      expect(replies).toHaveLength(2);
    });

    it('should verify correct 3-level directory hierarchy', async () => {
      const replyLib = createContainedFilesystemLibrary2<Reply, 'reply', 'post', 'comment'>(
        'reply',
        ['post', 'comment'],
        ['replies', 'posts', 'comments'],
        { globalDirectory: testDir }
      );

      const created = await replyLib.operations.create(
        { text: 'Deep nested' },
        { locations: [{ kt: 'post', lk: 'p1' }, { kt: 'comment', lk: 'c1' }] }
      );

      expect(created).toBeDefined();

      // Check directory structure: posts/p1/comments/c1/replies/
      const expectedDir = path.join(testDir, 'posts', 'p1', 'comments', 'c1', 'replies');
      const exists = await fs.stat(expectedDir)
        .then(stats => stats.isDirectory())
        .catch(() => false);

      expect(exists).toBe(true);
    });

    it('should update and remove nested items', async () => {
      const replyLib = createContainedFilesystemLibrary2<Reply, 'reply', 'post', 'comment'>(
        'reply',
        ['post', 'comment'],
        ['replies', 'posts', 'comments'],
        { globalDirectory: testDir }
      );

      const reply = await replyLib.operations.create(
        { text: 'Original reply' },
        { locations: [{ kt: 'post', lk: 'post-1' }, { kt: 'comment', lk: 'comment-1' }] }
      );

      // Update
      const updated = await replyLib.operations.update(
        {
          kt: 'reply',
          pk: reply.pk,
          loc: [{ kt: 'post', lk: 'post-1' }, { kt: 'comment', lk: 'comment-1' }]
        },
        { text: 'Updated reply' }
      );

      expect(updated.text).toBe('Updated reply');

      // Remove
      await replyLib.operations.remove({
        kt: 'reply',
        pk: reply.pk,
        loc: [{ kt: 'post', lk: 'post-1' }, { kt: 'comment', lk: 'comment-1' }]
      });

      const deleted = await replyLib.operations.get({
        kt: 'reply',
        pk: reply.pk,
        loc: [{ kt: 'post', lk: 'post-1' }, { kt: 'comment', lk: 'comment-1' }]
      });

      expect(deleted).toBeNull();
    });
  });
});

