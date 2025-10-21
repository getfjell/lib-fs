import { describe, expect, it } from 'vitest';
import { createDefinition } from '../src/Definition';
import type { Item } from '@fjell/core';

interface TestItem extends Item<'test'> {
  kt: 'test';
  pk: string;
  name: string;
}

describe('Definition', () => {
  describe('createDefinition', () => {
    it('should create definition for primary items', () => {
      const definition = createDefinition<TestItem, 'test', never, never, never, never, never>(
        ['test'],
        [],
        ['tests'],
        './data',
        {}
      );

      expect(definition).toBeDefined();
      expect(definition.globalDirectory).toContain('data');
      expect(definition.directoryPaths).toEqual(['tests']);
      expect(definition.coordinate.kta[0]).toBe('test');
    });

    it('should throw error for missing globalDirectory', () => {
      expect(() => {
        createDefinition<TestItem, 'test', never, never, never, never, never>(
          ['test'],
          [],
          ['tests'],
          '',
          {}
        );
      }).toThrow('globalDirectory is required');
    });

    it('should validate directoryPaths length matches kta', () => {
      expect(() => {
        createDefinition<TestItem, 'test', never, never, never, never, never>(
          ['test'],
          [],
          ['tests', 'extra'], // Wrong length
          './data',
          {}
        );
      }).toThrow('directoryPaths length');
    });

    it('should merge options correctly', () => {
      const definition = createDefinition<TestItem, 'test', never, never, never, never, never>(
        ['test'],
        [],
        ['tests'],
        './data',
        {
          prettyPrint: true,
          encoding: 'utf-16le' as BufferEncoding,
        }
      );

      expect(definition.options.prettyPrint).toBe(true);
      expect(definition.options.encoding).toBe('utf-16le');
      expect(definition.options.useJsonExtension).toBe(true); // default
      expect(definition.options.autoCreateDirectories).toBe(true); // default
    });

    it('should resolve relative paths to absolute', () => {
      const definition = createDefinition<TestItem, 'test', never, never, never, never, never>(
        ['test'],
        [],
        ['tests'],
        './data',
        {}
      );

      // Should be an absolute path
      expect(definition.globalDirectory).toMatch(/^[\/\\]/);
    });

    it('should store kta as string array', () => {
      const definition = createDefinition<TestItem, 'test', never, never, never, never, never>(
        ['test'],
        [],
        ['tests'],
        './data',
        {}
      );

      expect(definition.kta).toBeDefined();
      expect(Array.isArray(definition.kta)).toBe(true);
      expect(definition.kta).toHaveLength(1);
    });

    it('should set default file options', () => {
      const definition = createDefinition<TestItem, 'test', never, never, never, never, never>(
        ['test'],
        [],
        ['tests'],
        './data',
        {}
      );

      expect(definition.options.files).toBeDefined();
      expect(definition.options.files?.directory).toBe('_files');
      expect(definition.options.files?.includeMetadataInItem).toBe(true);
      expect(definition.options.files?.computeChecksums).toBe(true);
    });
  });
});

