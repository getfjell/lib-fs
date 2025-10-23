import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { PathBuilder } from '../src/PathBuilder';
import type { ComKey } from '@fjell/core';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

describe('PathBuilder - Advanced Coverage', () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = await fs.mkdtemp(path.join(os.tmpdir(), 'lib-fs-test-'));
  });

  afterEach(async () => {
    await fs.rm(testDir, { recursive: true, force: true });
  });

  describe('parsePathToKey edge cases', () => {
    it('should handle path outside global directory', () => {
      const builder = new PathBuilder({
        globalDirectory: testDir,
        directoryPaths: ['users'],
        useJsonExtension: true
      });

      const result = builder.parsePathToKey('/completely/different/path/user.json');
      
      // Should still attempt to parse even if outside global directory
      expect(result).toBeDefined();
    });

    it('should handle empty path', () => {
      const builder = new PathBuilder({
        globalDirectory: testDir,
        directoryPaths: ['users'],
        useJsonExtension: true
      });

      const result = builder.parsePathToKey('');
      expect(result).toBeNull();
    });

    it('should handle malformed paths', () => {
      const builder = new PathBuilder({
        globalDirectory: testDir,
        directoryPaths: ['users'],
        useJsonExtension: true
      });

      const result = builder.parsePathToKey('just-a-filename.json');
      
      // May return null or a simplified key
      expect(result === null || typeof result === 'object').toBe(true);
    });

    it('should parse path with custom key type', () => {
      const builder = new PathBuilder({
        globalDirectory: testDir,
        directoryPaths: ['custom-directory'],
        useJsonExtension: true
      });

      const filePath = path.join(testDir, 'custom-directory', 'item-123.json');
      const result = builder.parsePathToKey(filePath);
      
      expect(result).toBeDefined();
      expect(result?.pk).toBe('item-123');
    });
  });

  describe('getSubdirectories', () => {
    it('should list subdirectories successfully', async () => {
      const builder = new PathBuilder({
        globalDirectory: testDir,
        directoryPaths: ['users'],
        useJsonExtension: true
      });

      // Create some subdirectories
      await fs.mkdir(path.join(testDir, 'sub1'));
      await fs.mkdir(path.join(testDir, 'sub2'));
      await fs.writeFile(path.join(testDir, 'file.txt'), 'content');

      const subdirs = await builder.getSubdirectories(testDir);

      expect(subdirs).toHaveLength(2);
      expect(subdirs.some(d => d.includes('sub1'))).toBe(true);
      expect(subdirs.some(d => d.includes('sub2'))).toBe(true);
    });

    it('should return empty array for directory with no subdirectories', async () => {
      const builder = new PathBuilder({
        globalDirectory: testDir,
        directoryPaths: ['users'],
        useJsonExtension: true
      });

      // Create only files, no subdirectories
      await fs.writeFile(path.join(testDir, 'file1.txt'), 'content');
      await fs.writeFile(path.join(testDir, 'file2.txt'), 'content');

      const subdirs = await builder.getSubdirectories(testDir);

      expect(subdirs).toEqual([]);
    });

    it('should handle errors gracefully for non-existent directory', async () => {
      const builder = new PathBuilder({
        globalDirectory: testDir,
        directoryPaths: ['users'],
        useJsonExtension: true
      });

      const subdirs = await builder.getSubdirectories('/nonexistent/path');

      expect(subdirs).toEqual([]);
    });

    it('should handle permission errors', async () => {
      const builder = new PathBuilder({
        globalDirectory: testDir,
        directoryPaths: ['users'],
        useJsonExtension: true
      });

      // Try to read a path that might not be accessible
      const subdirs = await builder.getSubdirectories('/root/protected');

      // Should return empty array on error
      expect(subdirs).toEqual([]);
    });
  });

  describe('buildDirectory with different indices', () => {
    it('should build directory for index 0', () => {
      const builder = new PathBuilder({
        globalDirectory: testDir,
        directoryPaths: ['dir0', 'dir1', 'dir2'],
        useJsonExtension: true
      });

      const dir = builder.buildDirectory('test', 0);
      expect(dir).toBe(path.join(testDir, 'dir0'));
    });

    it('should build directory for index 1', () => {
      const builder = new PathBuilder({
        globalDirectory: testDir,
        directoryPaths: ['dir0', 'dir1', 'dir2'],
        useJsonExtension: true
      });

      const dir = builder.buildDirectory('test', 1);
      expect(dir).toBe(path.join(testDir, 'dir1'));
    });

    it('should build directory for index 2', () => {
      const builder = new PathBuilder({
        globalDirectory: testDir,
        directoryPaths: ['dir0', 'dir1', 'dir2'],
        useJsonExtension: true
      });

      const dir = builder.buildDirectory('test', 2);
      expect(dir).toBe(path.join(testDir, 'dir2'));
    });

    it('should use key type when index out of bounds', () => {
      const builder = new PathBuilder({
        globalDirectory: testDir,
        directoryPaths: ['dir0'],
        useJsonExtension: true
      });

      const dir = builder.buildDirectory('fallback', 5);
      expect(dir).toBe(path.join(testDir, 'fallback'));
    });
  });

  describe('ComKey path building', () => {
    it('should build path for ComKey with 2 locations', () => {
      const builder = new PathBuilder({
        globalDirectory: testDir,
        directoryPaths: ['posts', 'comments', 'replies'],
        useJsonExtension: true
      });

      const key: ComKey<'reply', 'post', 'comment'> = {
        kt: 'reply',
        pk: 'reply-1',
        loc: [
          { kt: 'post', lk: 'post-1' },
          { kt: 'comment', lk: 'comment-1' }
        ]
      };

      const filePath = builder.buildPath(key);

      // Should contain location keys and final key
      expect(filePath).toContain('post-1');
      expect(filePath).toContain('comment-1');
      expect(filePath).toContain('reply-1.json');
    });

    it('should build path for ComKey with 3 locations', () => {
      const builder = new PathBuilder({
        globalDirectory: testDir,
        directoryPaths: ['l1', 'l2', 'l3', 'l4'],
        useJsonExtension: true
      });

      const key: ComKey<'l4', 'l1', 'l2', 'l3'> = {
        kt: 'l4',
        pk: 'item-4',
        loc: [
          { kt: 'l1', lk: 'item-1' },
          { kt: 'l2', lk: 'item-2' },
          { kt: 'l3', lk: 'item-3' }
        ]
      };

      const filePath = builder.buildPath(key);

      expect(filePath).toContain('l1');
      expect(filePath).toContain('item-1');
      expect(filePath).toContain('l2');
      expect(filePath).toContain('item-2');
      expect(filePath).toContain('l3');
      expect(filePath).toContain('item-3');
      expect(filePath).toContain('l4');
      expect(filePath).toContain('item-4.json');
    });
  });
});

