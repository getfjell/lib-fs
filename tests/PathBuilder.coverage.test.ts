import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { PathBuilder } from '../src/PathBuilder';
import type { ComKey } from '@fjell/core';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

describe('PathBuilder - Coverage Completion', () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = await fs.mkdtemp(path.join(os.tmpdir(), 'lib-fs-test-'));
  });

  afterEach(async () => {
    await fs.rm(testDir, { recursive: true, force: true });
  });

  it('should hit error catch in parsePathToKey (lines 151-153)', () => {
    const builder = new PathBuilder({
      globalDirectory: testDir,
      directoryPaths: ['users'],
      useJsonExtension: true
    });

    // Pass an invalid path that will cause an error in processing
    const result = builder.parsePathToKey(null as any);
    
    expect(result).toBeNull();
  });

  it('should use getKeyTypeAtIndex for ComKey (lines 177-178)', () => {
    const builder = new PathBuilder({
      globalDirectory: testDir,
      directoryPaths: ['posts', 'comments', 'replies', 'subreplies', 'deep'],
      useJsonExtension: true
    });

    // Create a deeply nested ComKey to exercise the helper methods
    const key: ComKey<'deep', 'posts', 'comments', 'replies', 'subreplies'> = {
      kt: 'deep',
      pk: 'deep-1',
      loc: [
        { kt: 'posts', lk: 'post-1' },
        { kt: 'comments', lk: 'comment-1' },
        { kt: 'replies', lk: 'reply-1' },
        { kt: 'subreplies', lk: 'subreply-1' }
      ]
    };

    const filePath = builder.buildPath(key);
    
    // Should successfully build path using all indices
    expect(filePath).toContain('deep-1.json');
    expect(filePath).toContain('post-1');
    expect(filePath).toContain('comment-1');
  });

  it('should call getKeyTypeByDirectory in parsePathToKey', () => {
    const builder = new PathBuilder({
      globalDirectory: testDir,
      directoryPaths: ['custom-dir'],
      useJsonExtension: true
    });

    const filePath = path.join(testDir, 'custom-dir', 'item-1.json');
    const result = builder.parsePathToKey(filePath);
    
    // Should successfully parse
    expect(result).toBeDefined();
    expect(result?.pk).toBe('item-1');
  });
});

