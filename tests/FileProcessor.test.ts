import { describe, expect, it } from 'vitest';
import { FileProcessor } from '../src/FileProcessor';
import type { Coordinate, Item } from '@fjell/core';

interface TestItem extends Item<'test'> {
  kt: 'test';
  pk: string;
  name: string;
  nested?: {
    value: string;
  };
}

describe('FileProcessor', () => {
  describe('serialize', () => {
    it('should serialize item to JSON', () => {
      const processor = new FileProcessor();
      const item: TestItem = {
        kt: 'test',
        pk: 'test-123',
        name: 'Test Item',
      };

      const json = processor.serialize(item);
      expect(json).toBe(JSON.stringify(item));
    });

    it('should preserve all properties', () => {
      const processor = new FileProcessor();
      const item: TestItem = {
        kt: 'test',
        pk: 'test-123',
        name: 'Test Item',
        nested: { value: 'nested' },
      };

      const json = processor.serialize(item);
      const parsed = JSON.parse(json);
      
      expect(parsed.kt).toBe('test');
      expect(parsed.pk).toBe('test-123');
      expect(parsed.name).toBe('Test Item');
      expect(parsed.nested.value).toBe('nested');
    });

    it('should pretty print when enabled', () => {
      const processor = new FileProcessor(true);
      const item: TestItem = {
        kt: 'test',
        pk: 'test-123',
        name: 'Test',
      };

      const json = processor.serialize(item);
      expect(json).toContain('\n'); // Pretty printed has newlines
    });
  });

  describe('deserialize', () => {
    it('should deserialize JSON to item', () => {
      const processor = new FileProcessor();
      const item: TestItem = {
        kt: 'test',
        pk: 'test-123',
        name: 'Test Item',
      };
      const json = JSON.stringify(item);

      const coordinate = { kt: 'test' } as Coordinate<'test'>;
      const deserialized = processor.deserialize<TestItem>(json, coordinate);

      expect(deserialized).toBeDefined();
      expect(deserialized?.kt).toBe('test');
      expect(deserialized?.pk).toBe('test-123');
      expect(deserialized?.name).toBe('Test Item');
    });

    it('should return null for invalid JSON', () => {
      const processor = new FileProcessor();
      const coordinate = { kt: 'test' } as Coordinate<'test'>;
      const deserialized = processor.deserialize<TestItem>('invalid json', coordinate);

      expect(deserialized).toBeNull();
    });

    it('should return null for invalid item structure', () => {
      const processor = new FileProcessor();
      const json = JSON.stringify({ invalid: 'object' });
      const coordinate = { kt: 'test' } as Coordinate<'test'>;
      const deserialized = processor.deserialize<TestItem>(json, coordinate);

      expect(deserialized).toBeNull();
    });
  });

  describe('validateItemStructure', () => {
    it('should validate correct item structure', () => {
      const processor = new FileProcessor();
      const item: TestItem = {
        kt: 'test',
        pk: 'test-123',
        name: 'Test',
      };

      expect(processor.validateItemStructure(item)).toBe(true);
    });

    it('should reject item without kt', () => {
      const processor = new FileProcessor();
      const item = {
        pk: 'test-123',
        name: 'Test',
      } as any;

      expect(processor.validateItemStructure(item)).toBe(false);
    });

    it('should reject item without pk', () => {
      const processor = new FileProcessor();
      const item = {
        kt: 'test',
        name: 'Test',
      } as any;

      expect(processor.validateItemStructure(item)).toBe(false);
    });
  });
});

