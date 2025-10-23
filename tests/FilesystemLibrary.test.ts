import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  createFilesystemLibrary,
  createFilesystemLibraryFromComponents,
  isFilesystemLibrary
} from '../src/FilesystemLibrary';
import { createDefinition } from '../src/Definition';
import { createOperations } from '../src/Operations';
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

describe('FilesystemLibrary', () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = await fs.mkdtemp(path.join(os.tmpdir(), 'lib-fs-test-'));
  });

  afterEach(async () => {
    await fs.rm(testDir, { recursive: true, force: true });
  });

  describe('createFilesystemLibrary', () => {
    it('should create library with all parameters', () => {
      const registry = createRegistry('test');
      
      const library = createFilesystemLibrary<User, 'user'>(
        ['user'],
        ['users'],
        testDir,
        { prettyPrint: true },
        ['user-scope'],
        registry
      );

      expect(library).toBeDefined();
      expect(library.globalDirectory).toBe(testDir);
      expect(library.coordinate.kta[0]).toBe('user');
      expect(library.operations).toBeDefined();
      expect(library.registry).toBe(registry);
    });

    it('should create library with defaults', () => {
      const library = createFilesystemLibrary<User, 'user'>(
        ['user'],
        ['users'],
        testDir,
        null,
        null,
        undefined
      );

      expect(library).toBeDefined();
      expect(library.globalDirectory).toBe(testDir);
      expect(library.operations).toBeDefined();
    });

    it('should create library with minimal parameters', () => {
      const library = createFilesystemLibrary<User, 'user'>(
        ['user'],
        ['users'],
        testDir
      );

      expect(library).toBeDefined();
      expect(library.coordinate.kta[0]).toBe('user');
    });

    it('should merge options correctly', () => {
      const library = createFilesystemLibrary<User, 'user'>(
        ['user'],
        ['users'],
        testDir,
        {
          prettyPrint: true,
          useJsonExtension: false,
          autoCreateDirectories: false
        }
      );

      expect(library.options.prettyPrint).toBe(true);
      expect(library.options.useJsonExtension).toBe(false);
      expect(library.options.autoCreateDirectories).toBe(false);
    });

    it('should work with contained items (1 level)', () => {
      const library = createFilesystemLibrary<any, 'comment', 'post'>(
        ['comment', 'post'],
        ['comments', 'posts'],
        testDir
      );

      expect(library).toBeDefined();
      expect(library.coordinate.kta).toEqual(['comment', 'post']);
    });

    it('should work with deeply nested items (3 levels)', () => {
      const library = createFilesystemLibrary<any, 'reply', 'post', 'comment', 'thread'>(
        ['reply', 'post', 'comment', 'thread'],
        ['replies', 'posts', 'comments', 'threads'],
        testDir
      );

      expect(library).toBeDefined();
      expect(library.coordinate.kta.length).toBe(4);
    });
  });

  describe('createFilesystemLibraryFromComponents', () => {
    it('should create library from components', () => {
      const registry = createRegistry('test');
      const definition = createDefinition<User, 'user', never, never, never, never, never>(
        ['user'],
        [],
        ['users'],
        testDir,
        {}
      );
      const operations = createOperations(definition, registry);

      const library = createFilesystemLibraryFromComponents(
        registry,
        definition.coordinate,
        testDir,
        operations,
        definition.options
      );

      expect(library).toBeDefined();
      expect(library.registry).toBe(registry);
      expect(library.coordinate).toBe(definition.coordinate);
      expect(library.globalDirectory).toBe(testDir);
      expect(library.operations).toBe(operations);
      expect(library.options).toBe(definition.options);
    });
  });

  describe('isFilesystemLibrary', () => {
    it('should return true for valid FilesystemLibrary', () => {
      const library = createFilesystemLibrary<User, 'user'>(
        ['user'],
        ['users'],
        testDir
      );

      expect(isFilesystemLibrary(library)).toBe(true);
    });

    it('should return false for null', () => {
      expect(isFilesystemLibrary(null)).toBe(false);
    });

    it('should return false for undefined', () => {
      expect(isFilesystemLibrary(undefined)).toBe(false);
    });

    it('should return false for non-object', () => {
      expect(isFilesystemLibrary('string')).toBe(false);
      expect(isFilesystemLibrary(123)).toBe(false);
      expect(isFilesystemLibrary(true)).toBe(false);
    });

    it('should return false for object without required properties', () => {
      expect(isFilesystemLibrary({})).toBe(false);
      expect(isFilesystemLibrary({ globalDirectory: '/path' })).toBe(false);
      expect(isFilesystemLibrary({ operations: {} })).toBe(false);
    });

    it('should return true for object with all required properties', () => {
      const mockLibrary = {
        globalDirectory: '/path',
        operations: {},
        coordinate: {}
      };

      expect(isFilesystemLibrary(mockLibrary)).toBe(true);
    });
  });
});

