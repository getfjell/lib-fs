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
  });
});

