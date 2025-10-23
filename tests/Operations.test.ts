import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createOperations } from '../src/Operations';
import { createDefinition } from '../src/Definition';
import type { Item } from '@fjell/core';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

interface TestItem extends Item<'test'> {
  kt: 'test';
  pk: string;
  name: string;
  status?: string;
}

describe('Operations', () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = await fs.mkdtemp(path.join(os.tmpdir(), 'lib-fs-test-'));
  });

  afterEach(async () => {
    await fs.rm(testDir, { recursive: true, force: true });
  });

  it('should create operations from definition', () => {
    const definition = createDefinition<TestItem, 'test', never, never, never, never, never>(
      ['test'],
      [],
      ['tests'],
      testDir,
      {}
    );

    const operations = createOperations(definition);

    expect(operations).toBeDefined();
    expect(operations.get).toBeDefined();
    expect(operations.create).toBeDefined();
    expect(operations.update).toBeDefined();
    expect(operations.upsert).toBeDefined();
    expect(operations.remove).toBeDefined();
    expect(operations.all).toBeDefined();
    expect(operations.one).toBeDefined();
  });

  it('should execute get operation', async () => {
    const definition = createDefinition<TestItem, 'test', never, never, never, never, never>(
      ['test'],
      [],
      ['tests'],
      testDir,
      {}
    );

    const operations = createOperations(definition);

    // Should return null for non-existent item
    const result = await operations.get({ kt: 'test', pk: 'nonexistent' });
    expect(result).toBeNull();
  });

  it('should execute create operation', async () => {
    const definition = createDefinition<TestItem, 'test', never, never, never, never, never>(
      ['test'],
      [],
      ['tests'],
      testDir,
      {}
    );

    const operations = createOperations(definition);

    const item = await operations.create({ name: 'Test Item' });
    
    expect(item).toBeDefined();
    expect(item.kt).toBe('test');
    expect(item.pk).toBeDefined();
    expect(item.name).toBe('Test Item');
  });

  it('should execute update operation', async () => {
    const definition = createDefinition<TestItem, 'test', never, never, never, never, never>(
      ['test'],
      [],
      ['tests'],
      testDir,
      {}
    );

    const operations = createOperations(definition);

    const item = await operations.create({ pk: 'update-test', name: 'Original' });
    const updated = await operations.update(
      { kt: 'test', pk: item.pk },
      { name: 'Updated' }
    );

    expect(updated.name).toBe('Updated');
  });

  it('should have upsert operation defined', async () => {
    const definition = createDefinition<TestItem, 'test', never, never, never, never, never>(
      ['test'],
      [],
      ['tests'],
      testDir,
      {}
    );

    const operations = createOperations(definition);

    expect(operations.upsert).toBeDefined();
    expect(typeof operations.upsert).toBe('function');
  });

  it('should execute remove operation', async () => {
    const definition = createDefinition<TestItem, 'test', never, never, never, never, never>(
      ['test'],
      [],
      ['tests'],
      testDir,
      {}
    );

    const operations = createOperations(definition);

    const item = await operations.create({ pk: 'remove-test', name: 'To Remove' });
    const removed = await operations.remove({ kt: 'test', pk: item.pk });

    expect(removed).toBeDefined();
    expect(removed?.pk).toBe('remove-test');
  });

  it('should execute all operation', async () => {
    const definition = createDefinition<TestItem, 'test', never, never, never, never, never>(
      ['test'],
      [],
      ['tests'],
      testDir,
      {}
    );

    const operations = createOperations(definition);

    await operations.create({ pk: 'item-1', name: 'Item 1' });
    await operations.create({ pk: 'item-2', name: 'Item 2' });

    const items = await operations.all();

    expect(items).toHaveLength(2);
  });

  it('should execute one operation', async () => {
    const definition = createDefinition<TestItem, 'test', never, never, never, never, never>(
      ['test'],
      [],
      ['tests'],
      testDir,
      {}
    );

    const operations = createOperations(definition);

    await operations.create({ pk: 'item-1', name: 'Item 1' });

    const item = await operations.one();

    expect(item).toBeDefined();
    expect(item?.kt).toBe('test');
  });

  it('should execute finders when defined', async () => {
    const definition = createDefinition<TestItem, 'test', never, never, never, never, never>(
      ['test'],
      [],
      ['tests'],
      testDir,
      {
        finders: {
          byStatus: async (params: any) => {
            return [{ kt: 'test', pk: '1', name: 'Found', status: params.status }] as TestItem[];
          }
        }
      }
    );

    const operations = createOperations(definition);

    const results = await operations.find('byStatus', { status: 'active' });

    expect(results).toHaveLength(1);
    expect(results[0].status).toBe('active');
  });

  it('should throw error for undefined finder', async () => {
    const definition = createDefinition<TestItem, 'test', never, never, never, never, never>(
      ['test'],
      [],
      ['tests'],
      testDir,
      {}
    );

    const operations = createOperations(definition);

    await expect(
      operations.find('nonexistent', {})
    ).rejects.toThrow('Finder "nonexistent" not found');
  });

  it('should execute findOne when defined', async () => {
    const definition = createDefinition<TestItem, 'test', never, never, never, never, never>(
      ['test'],
      [],
      ['tests'],
      testDir,
      {
        finders: {
          byStatus: async () => {
            return [{ kt: 'test', pk: '1', name: 'Found' }] as TestItem[];
          }
        }
      }
    );

    const operations = createOperations(definition);

    const result = await operations.findOne('byStatus', {});

    expect(result).toBeDefined();
    expect(result?.pk).toBe('1');
  });

  it('should throw error for undefined findOne', async () => {
    const definition = createDefinition<TestItem, 'test', never, never, never, never, never>(
      ['test'],
      [],
      ['tests'],
      testDir,
      {}
    );

    const operations = createOperations(definition);

    await expect(
      operations.findOne('nonexistent', {})
    ).rejects.toThrow('Finder "nonexistent" not found');
  });
});

