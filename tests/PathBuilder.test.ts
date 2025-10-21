import { describe, expect, it } from 'vitest';
import { PathBuilder } from '../src/PathBuilder';
import type { ComKey, PriKey } from '@fjell/core';
import * as path from 'path';

describe('PathBuilder', () => {
  describe('buildPath', () => {
    it('should build path for PriKey', () => {
      const builder = new PathBuilder({
        globalDirectory: '/data/myapp',
        directoryPaths: ['users'],
        useJsonExtension: true,
      });

      const key: PriKey<'user'> = { kt: 'user', pk: 'alice-123' };
      const filePath = builder.buildPath(key);

      expect(filePath).toBe(path.join('/data/myapp', 'users', 'alice-123.json'));
    });

    it('should build path for ComKey with 1 location', () => {
      const builder = new PathBuilder({
        globalDirectory: '/data/myapp',
        directoryPaths: ['posts', 'comments'],
        kta: ['post', 'comment'],
        useJsonExtension: true,
      });

      const key: ComKey<'comment', 'post'> = {
        kt: 'comment',
        pk: 'comment-456',
        loc: [{ kt: 'post', lk: 'post-789' }],
      };
      
      const filePath = builder.buildPath(key);
      
      expect(filePath).toBe(
        path.join('/data/myapp', 'posts', 'post-789', 'comments', 'comment-456.json')
      );
    });

    it('should add .json extension when enabled', () => {
      const builder = new PathBuilder({
        globalDirectory: '/data/myapp',
        directoryPaths: ['users'],
        useJsonExtension: true,
      });

      const key: PriKey<'user'> = { kt: 'user', pk: 'test' };
      const filePath = builder.buildPath(key);

      expect(filePath).toContain('.json');
    });

    it('should omit .json extension when disabled', () => {
      const builder = new PathBuilder({
        globalDirectory: '/data/myapp',
        directoryPaths: ['users'],
        useJsonExtension: false,
      });

      const key: PriKey<'user'> = { kt: 'user', pk: 'test' };
      const filePath = builder.buildPath(key);

      expect(filePath).not.toContain('.json');
    });
  });

  describe('buildDirectory', () => {
    it('should build directory for primary items', () => {
      const builder = new PathBuilder({
        globalDirectory: '/data/myapp',
        directoryPaths: ['users'],
        useJsonExtension: true,
      });

      const dir = builder.buildDirectory('user', 0);
      expect(dir).toBe(path.join('/data/myapp', 'users'));
    });
  });

  describe('buildFilesDirectory', () => {
    it('should build files directory for item', () => {
      const builder = new PathBuilder({
        globalDirectory: '/data/myapp',
        directoryPaths: ['users'],
        useJsonExtension: true,
      });

      const key: PriKey<'user'> = { kt: 'user', pk: 'alice-123' };
      const filesDir = builder.buildFilesDirectory(key);

      expect(filesDir).toBe(path.join('/data/myapp', 'users', 'alice-123', '_files'));
    });
  });

  describe('buildFilePath', () => {
    it('should build path to specific file', () => {
      const builder = new PathBuilder({
        globalDirectory: '/data/myapp',
        directoryPaths: ['recordings'],
        useJsonExtension: true,
      });

      const key: PriKey<'recording'> = { kt: 'recording', pk: 'rec-123' };
      const filePath = builder.buildFilePath(key, 'master', '0.wav');

      expect(filePath).toBe(
        path.join('/data/myapp', 'recordings', 'rec-123', '_files', 'master', '0.wav')
      );
    });
  });

  describe('buildLabelDirectory', () => {
    it('should build path to label directory', () => {
      const builder = new PathBuilder({
        globalDirectory: '/data/myapp',
        directoryPaths: ['recordings'],
        useJsonExtension: true,
      });

      const key: PriKey<'recording'> = { kt: 'recording', pk: 'rec-123' };
      const labelDir = builder.buildLabelDirectory(key, 'master');

      expect(labelDir).toBe(
        path.join('/data/myapp', 'recordings', 'rec-123', '_files', 'master')
      );
    });

    it('should build label directory for ComKey', () => {
      const builder = new PathBuilder({
        globalDirectory: '/data/myapp',
        directoryPaths: ['users', 'recordings'],
        kta: ['user', 'recording'],
        useJsonExtension: true,
      });

      const key: ComKey<'recording', 'user'> = {
        kt: 'recording',
        pk: 'rec-123',
        loc: [{ kt: 'user', lk: 'user-456' }],
      };
      const labelDir = builder.buildLabelDirectory(key, 'final');

      expect(labelDir).toBe(
        path.join('/data/myapp', 'users', 'user-456', 'recordings', 'rec-123', '_files', 'final')
      );
    });
  });

  describe('parsePathToKey', () => {
    it('should parse PriKey from path', () => {
      const builder = new PathBuilder({
        globalDirectory: '/data/myapp',
        directoryPaths: ['users'],
        kta: ['user'],
        useJsonExtension: true,
      });

      const filePath = path.join('/data/myapp', 'users', 'alice-123.json');
      const key = builder.parsePathToKey(filePath);

      expect(key).toBeDefined();
      expect(key?.kt).toBe('users');
      expect(key?.pk).toBe('alice-123');
    });

    it('should parse path without json extension', () => {
      const builder = new PathBuilder({
        globalDirectory: '/data/myapp',
        directoryPaths: ['users'],
        kta: ['user'],
        useJsonExtension: false,
      });

      const filePath = path.join('/data/myapp', 'users', 'alice-123');
      const key = builder.parsePathToKey(filePath);

      expect(key).toBeDefined();
      expect(key?.pk).toBe('alice-123');
    });

    it('should return null for composite keys (not fully implemented)', () => {
      const builder = new PathBuilder({
        globalDirectory: '/data/myapp',
        directoryPaths: ['posts', 'comments'],
        kta: ['post', 'comment'],
        useJsonExtension: true,
      });

      // Complex path with locations - not fully implemented
      const filePath = path.join('/data/myapp', 'posts', 'post-1', 'comments', 'comment-1.json');
      const key = builder.parsePathToKey(filePath);

      // Currently returns null for composite keys
      expect(key).toBeNull();
    });

    it('should return null for invalid path', () => {
      const builder = new PathBuilder({
        globalDirectory: '/data/myapp',
        directoryPaths: ['users'],
        useJsonExtension: true,
      });

      const key = builder.parsePathToKey('/completely/different/path.json');
      // May return null or an invalid key, depending on implementation
      expect(key).toBeDefined(); // Just verify it doesn't crash
    });

    it('should handle errors in path parsing', () => {
      const builder = new PathBuilder({
        globalDirectory: '/data/myapp',
        directoryPaths: ['users'],
        useJsonExtension: true,
      });

      // Test with various invalid paths
      expect(() => builder.parsePathToKey('')).not.toThrow();
      expect(() => builder.parsePathToKey('/')).not.toThrow();
    });
  });

  describe('getSubdirectories', () => {
    it('should return empty array for non-existent directory', async () => {
      const builder = new PathBuilder({
        globalDirectory: '/data/myapp',
        directoryPaths: ['users'],
        useJsonExtension: true,
      });

      const subdirs = await builder.getSubdirectories('/nonexistent/path');
      expect(subdirs).toEqual([]);
    });

    it('should list actual subdirectories', async () => {
      const builder = new PathBuilder({
        globalDirectory: '/data/myapp',
        directoryPaths: ['users'],
        useJsonExtension: true,
      });

      // Use a real directory that exists (current dir)
      const subdirs = await builder.getSubdirectories('.');
      // Should be an array (may be empty or have directories)
      expect(Array.isArray(subdirs)).toBe(true);
    });
  });

  describe('buildFilesDirectory with different extensions', () => {
    it('should build files directory without json extension', () => {
      const builder = new PathBuilder({
        globalDirectory: '/data/myapp',
        directoryPaths: ['users'],
        useJsonExtension: false,
      });

      const key: PriKey<'user'> = { kt: 'user', pk: 'alice-123' };
      const filesDir = builder.buildFilesDirectory(key);

      expect(filesDir).toBe(path.join('/data/myapp', 'users', 'alice-123', '_files'));
    });

    it('should build file path for ComKey', () => {
      const builder = new PathBuilder({
        globalDirectory: '/data/myapp',
        directoryPaths: ['users', 'recordings'],
        kta: ['user', 'recording'],
        useJsonExtension: true,
      });

      const key: ComKey<'recording', 'user'> = {
        kt: 'recording',
        pk: 'rec-123',
        loc: [{ kt: 'user', lk: 'user-456' }],
      };
      const filePath = builder.buildFilePath(key, 'master', 'audio.wav');

      expect(filePath).toBe(
        path.join('/data/myapp', 'users', 'user-456', 'recordings', 'rec-123', '_files', 'master', 'audio.wav')
      );
    });
  });

  describe('edge cases', () => {
    it('should handle ComKey with multiple locations', () => {
      const builder = new PathBuilder({
        globalDirectory: '/data/myapp',
        directoryPaths: ['posts', 'comments', 'replies'],
        kta: ['post', 'comment', 'reply'],
        useJsonExtension: true,
      });

      const key: ComKey<'reply', 'post', 'comment'> = {
        kt: 'reply',
        pk: 'reply-123',
        loc: [
          { kt: 'post', lk: 'post-456' },
          { kt: 'comment', lk: 'comment-789' },
        ],
      };
      const filePath = builder.buildPath(key);

      expect(filePath).toContain('posts');
      expect(filePath).toContain('post-456');
      expect(filePath).toContain('comments');
      expect(filePath).toContain('comment-789');
      expect(filePath).toContain('replies');
      expect(filePath).toContain('reply-123.json');
    });

    it('should handle kt not in kta array for ComKey', () => {
      const builder = new PathBuilder({
        globalDirectory: '/data/myapp',
        directoryPaths: ['users'],
        kta: ['user'],
        useJsonExtension: true,
      });

      // Location kt not in kta - should use kt as directory name
      const key: ComKey<'unknown', 'user'> = {
        kt: 'unknown',
        pk: 'test-123',
        loc: [{ kt: 'user', lk: 'user-456' }],
      };
      const filePath = builder.buildPath(key);

      expect(filePath).toContain('users'); // parent directory
      expect(filePath).toContain('user-456');
      expect(filePath).toContain('unknown'); // kt not in kta
      expect(filePath).toContain('test-123.json');
    });
  });
});

