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

describe('Operations - Coverage Completion', () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = await fs.mkdtemp(path.join(os.tmpdir(), 'lib-fs-test-'));
  });

  afterEach(async () => {
    await fs.rm(testDir, { recursive: true, force: true });
  });

  it('should throw error for finder not found with single quotes (lines 153-154)', async () => {
    const definition = createDefinition<TestItem, 'test', never, never, never, never, never>(
      ['test'],
      [],
      ['tests'],
      testDir,
      {
        finders: {
          // Define a finder but call a different one
          existing: async () => []
        }
      }
    );

    const operations = createOperations(definition);

    // Try to call non-existent finder
    await expect(
      operations.find('does-not-exist', {})
    ).rejects.toThrow();
  });

  it('should throw error for findOne not found with single quotes (lines 162-163)', async () => {
    const definition = createDefinition<TestItem, 'test', never, never, never, never, never>(
      ['test'],
      [],
      ['tests'],
      testDir,
      {
        finders: {
          // Define a finder but call a different one
          existing: async () => []
        }
      }
    );

    const operations = createOperations(definition);

    // Try to call non-existent finder
    await expect(
      operations.findOne('also-does-not-exist', {})
    ).rejects.toThrow();
  });

  it('should execute finder with both params and locations', async () => {
    let receivedParams: any;
    let receivedLocations: any;

    const definition = createDefinition<TestItem, 'test', never, never, never, never, never>(
      ['test'],
      [],
      ['tests'],
      testDir,
      {
        finders: {
          withBoth: async (params: any, locations: any) => {
            receivedParams = params;
            receivedLocations = locations;
            return [];
          }
        }
      }
    );

    const operations = createOperations(definition);

    await operations.find('withBoth', { test: 'param' }, [{ kt: 'test', lk: 'loc-1' }]);

    expect(receivedParams).toEqual({ test: 'param' });
    expect(receivedLocations).toEqual([{ kt: 'test', lk: 'loc-1' }]);
  });
});

