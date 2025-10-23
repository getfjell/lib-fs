import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { PathBuilder } from '../src/PathBuilder';
import type { ComKey } from '@fjell/core';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

describe('PathBuilder - Contained Items Support', () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = await fs.mkdtemp(path.join(os.tmpdir(), 'lib-fs-test-'));
  });

  afterEach(async () => {
    await fs.rm(testDir, { recursive: true, force: true });
  });

  describe('buildDirectoryFromLocations', () => {
    it('should build directory from single location', () => {
      const builder = new PathBuilder({
        globalDirectory: testDir,
        directoryPaths: ['comments', 'posts'],
        kta: ['comment', 'post'],
        useJsonExtension: true
      });

      const dirPath = builder.buildDirectoryFromLocations([
        { kt: 'post', lk: 'post-123' }
      ]);

      expect(dirPath).toBe(path.join(testDir, 'posts', 'post-123'));
    });

    it('should build directory from multiple locations', () => {
      const builder = new PathBuilder({
        globalDirectory: testDir,
        directoryPaths: ['replies', 'posts', 'comments'],
        kta: ['reply', 'post', 'comment'],
        useJsonExtension: true
      });

      const dirPath = builder.buildDirectoryFromLocations([
        { kt: 'post', lk: 'post-1' },
        { kt: 'comment', lk: 'comment-1' }
      ]);

      expect(dirPath).toBe(path.join(testDir, 'posts', 'post-1', 'comments', 'comment-1'));
    });

    it('should handle empty locations array', () => {
      const builder = new PathBuilder({
        globalDirectory: testDir,
        directoryPaths: ['comments', 'posts'],
        kta: ['comment', 'post'],
        useJsonExtension: true
      });

      const dirPath = builder.buildDirectoryFromLocations([]);

      expect(dirPath).toBe(testDir);
    });
  });

  describe('parseLocationsFromPath', () => {
    it('should parse locations from nested path', () => {
      const builder = new PathBuilder({
        globalDirectory: testDir,
        directoryPaths: ['comments', 'posts'],
        kta: ['comment', 'post'],
        useJsonExtension: true
      });

      const filePath = path.join(testDir, 'posts', 'post-123', 'comments', 'comment-456.json');
      const locations = builder.parseLocationsFromPath(filePath);

      expect(locations).toHaveLength(1);
      expect(locations[0].kt).toBe('posts');
      expect(locations[0].lk).toBe('post-123');
    });

    it('should parse multiple levels of nesting', () => {
      const builder = new PathBuilder({
        globalDirectory: testDir,
        directoryPaths: ['replies', 'posts', 'comments'],
        kta: ['reply', 'post', 'comment'],
        useJsonExtension: true
      });

      const filePath = path.join(
        testDir,
        'posts', 'post-1',
        'comments', 'comment-1',
        'replies', 'reply-1.json'
      );

      const locations = builder.parseLocationsFromPath(filePath);

      expect(locations).toHaveLength(2);
      expect(locations[0]).toEqual({ kt: 'posts', lk: 'post-1' });
      expect(locations[1]).toEqual({ kt: 'comments', lk: 'comment-1' });
    });

    it('should return empty array for primary item path', () => {
      const builder = new PathBuilder({
        globalDirectory: testDir,
        directoryPaths: ['users'],
        kta: ['user'],
        useJsonExtension: true
      });

      const filePath = path.join(testDir, 'users', 'user-123.json');
      const locations = builder.parseLocationsFromPath(filePath);

      expect(locations).toEqual([]);
    });

    it('should handle errors gracefully', () => {
      const builder = new PathBuilder({
        globalDirectory: testDir,
        directoryPaths: ['comments', 'posts'],
        kta: ['comment', 'post'],
        useJsonExtension: true
      });

      const locations = builder.parseLocationsFromPath(null as any);

      expect(locations).toEqual([]);
    });
  });

  describe('ComKey path building with kta', () => {
    it('should use kta to map key types to directories', () => {
      const builder = new PathBuilder({
        globalDirectory: testDir,
        directoryPaths: ['comment-dir', 'post-dir'],
        kta: ['comment', 'post'], // Maps comment -> comment-dir, post -> post-dir
        useJsonExtension: true
      });

      const key: ComKey<'comment', 'post'> = {
        kt: 'comment',
        pk: 'comment-1',
        loc: [{ kt: 'post', lk: 'post-1' }]
      };

      const filePath = builder.buildPath(key);

      // Should use post-dir for post (from directoryPaths)
      expect(filePath).toContain('post-dir');
      expect(filePath).toContain('post-1');
      expect(filePath).toContain('comment-dir');
      expect(filePath).toContain('comment-1.json');
    });

    it('should fallback to kt when not in kta', () => {
      const builder = new PathBuilder({
        globalDirectory: testDir,
        directoryPaths: ['comments'],
        kta: ['comment'], // Only comment mapped
        useJsonExtension: true
      });

      const key: ComKey<'comment', 'post'> = {
        kt: 'comment',
        pk: 'comment-1',
        loc: [{ kt: 'post', lk: 'post-1' }] // post not in kta
      };

      const filePath = builder.buildPath(key);

      // Should fallback to 'post' as directory name
      expect(filePath).toContain('post');
      expect(filePath).toContain('post-1');
    });
  });
});

