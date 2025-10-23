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
}

describe('Operations - Full Coverage', () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = await fs.mkdtemp(path.join(os.tmpdir(), 'lib-fs-test-'));
  });

  afterEach(async () => {
    await fs.rm(testDir, { recursive: true, force: true });
  });

  it('should test all operation paths', async () => {
    const definition = createDefinition<TestItem, 'test', never, never, never, never, never>(
      ['test'],
      [],
      ['tests'],
      testDir,
      {}
    );

    const ops = createOperations(definition);

    // Test all basic operations exist
    expect(ops.get).toBeDefined();
    expect(ops.create).toBeDefined();
    expect(ops.update).toBeDefined();
    expect(ops.upsert).toBeDefined();
    expect(ops.remove).toBeDefined();
    expect(ops.all).toBeDefined();
    expect(ops.one).toBeDefined();
    expect(ops.find).toBeDefined();
    expect(ops.findOne).toBeDefined();
  });

  it('should execute action operation if available', async () => {
    const definition = createDefinition<TestItem, 'test', never, never, never, never, never>(
      ['test'],
      [],
      ['tests'],
      testDir,
      {
        actions: {
          testAction: async (item: TestItem) => {
            return [{ ...item, name: 'Acted' } as TestItem, []];
          }
        }
      }
    );

    const ops = createOperations(definition);

    // Create item first
    const item = await ops.create({ pk: 'action-test', name: 'Original' });

    // Execute action
    const [result] = await ops.action({ kt: 'test', pk: item.pk }, 'testAction', {});

    expect(result.name).toBe('Acted');
  });

  it('should execute facet operation if available', async () => {
    const definition = createDefinition<TestItem, 'test', never, never, never, never, never>(
      ['test'],
      [],
      ['tests'],
      testDir,
      {
        facets: {
          testFacet: async (item: TestItem) => {
            return { computed: `${item.name} facet` };
          }
        }
      }
    );

    const ops = createOperations(definition);

    // Create item first
    const item = await ops.create({ pk: 'facet-test', name: 'Test' });

    // Execute facet
    const result = await ops.facet({ kt: 'test', pk: item.pk }, 'testFacet', {});

    expect(result).toEqual({ computed: 'Test facet' });
  });

  it('should have allAction and allFacet operations defined', async () => {
    const definition = createDefinition<TestItem, 'test', never, never, never, never, never>(
      ['test'],
      [],
      ['tests'],
      testDir,
      {}
    );

    const ops = createOperations(definition);

    // Verify operations exist (actual implementation tested via @fjell/lib)
    expect(ops.allAction).toBeDefined();
    expect(ops.allFacet).toBeDefined();
    expect(typeof ops.allAction).toBe('function');
    expect(typeof ops.allFacet).toBe('function');
  });
});

