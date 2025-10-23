import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  createContainedFilesystemLibrary,
  createContainedFilesystemLibrary2,
  createPrimaryFilesystemLibrary
} from '../src/FilesystemLibraryFactory';
import type { Item } from '@fjell/core';
import { createRegistry } from '@fjell/registry';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

interface User extends Item<'user'> {
  kt: 'user';
  pk: string;
  name: string;
  email: string;
}

interface Comment extends Item<'comment', 'post'> {
  kt: 'comment';
  pk: string;
  loc: [{ kt: 'post'; lk: string }];
  text: string;
}

interface Reply extends Item<'reply', 'post', 'comment'> {
  kt: 'reply';
  pk: string;
  loc: [{ kt: 'post'; lk: string }, { kt: 'comment'; lk: string }];
  text: string;
}

describe('FilesystemLibraryFactory', () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = await fs.mkdtemp(path.join(os.tmpdir(), 'lib-fs-test-'));
  });

  afterEach(async () => {
    await fs.rm(testDir, { recursive: true, force: true });
  });

  describe('createPrimaryFilesystemLibrary', () => {
    it('should create primary library', () => {
      const library = createPrimaryFilesystemLibrary<User, 'user'>(
        'user',
        'users',
        { globalDirectory: testDir }
      );

      expect(library).toBeDefined();
      expect(library.globalDirectory).toBe(testDir);
      expect(library.coordinate.kta[0]).toBe('user');
      expect(library.operations).toBeDefined();
    });

    it('should create library with custom options', () => {
      const library = createPrimaryFilesystemLibrary<User, 'user'>(
        'user',
        'users',
        {
          globalDirectory: testDir,
          prettyPrint: true,
          useJsonExtension: false
        },
        {
          hooks: {
            beforeCreate: async (item) => item
          }
        }
      );

      expect(library.options.prettyPrint).toBe(true);
      expect(library.options.useJsonExtension).toBe(false);
    });

    it('should create library with registry', () => {
      const registry = createRegistry('test');
      
      const library = createPrimaryFilesystemLibrary<User, 'user'>(
        'user',
        'users',
        {
          globalDirectory: testDir,
          registry
        }
      );

      expect(library.registry).toBe(registry);
    });

    it('should work with auto-create directories enabled', () => {
      const library = createPrimaryFilesystemLibrary<User, 'user'>(
        'user',
        'users',
        {
          globalDirectory: testDir,
          autoCreateDirectories: true
        }
      );

      expect(library.options.autoCreateDirectories).toBe(true);
    });
  });

  describe('createContainedFilesystemLibrary', () => {
    it('should create contained library (1 level)', () => {
      const library = createContainedFilesystemLibrary<Comment, 'comment', 'post'>(
        'comment',
        'post',
        ['comments', 'posts'],
        { globalDirectory: testDir }
      );

      expect(library).toBeDefined();
      expect(library.coordinate.kta).toEqual(['comment', 'post']);
      expect(library.globalDirectory).toBe(testDir);
    });

    it('should create library with custom options', () => {
      const library = createContainedFilesystemLibrary<Comment, 'comment', 'post'>(
        'comment',
        'post',
        ['comments', 'posts'],
        {
          globalDirectory: testDir,
          prettyPrint: true
        },
        {
          hooks: {
            beforeCreate: async (item) => item
          }
        }
      );

      expect(library.options.prettyPrint).toBe(true);
      expect(library.options.hooks?.beforeCreate).toBeDefined();
    });

    it('should work with registry', () => {
      const registry = createRegistry('test');
      
      const library = createContainedFilesystemLibrary<Comment, 'comment', 'post'>(
        'comment',
        'post',
        ['comments', 'posts'],
        {
          globalDirectory: testDir,
          registry
        }
      );

      expect(library.registry).toBe(registry);
    });
  });

  describe('createContainedFilesystemLibrary2', () => {
    it('should create contained library (2 levels)', () => {
      const library = createContainedFilesystemLibrary2<Reply, 'reply', 'post', 'comment'>(
        'reply',
        ['post', 'comment'],
        ['replies', 'posts', 'comments'],
        { globalDirectory: testDir }
      );

      expect(library).toBeDefined();
      expect(library.coordinate.kta).toEqual(['reply', 'post', 'comment']);
      expect(library.globalDirectory).toBe(testDir);
    });

    it('should create library with all config options', () => {
      const registry = createRegistry('test');
      
      const library = createContainedFilesystemLibrary2<Reply, 'reply', 'post', 'comment'>(
        'reply',
        ['post', 'comment'],
        ['replies', 'posts', 'comments'],
        {
          globalDirectory: testDir,
          registry,
          useJsonExtension: true,
          autoCreateDirectories: true,
          prettyPrint: false
        }
      );

      expect(library.options.useJsonExtension).toBe(true);
      expect(library.options.autoCreateDirectories).toBe(true);
      expect(library.options.prettyPrint).toBe(false);
    });
  });
});

