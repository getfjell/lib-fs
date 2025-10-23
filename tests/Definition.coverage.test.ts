import { afterEach, beforeEach, describe, expect, it } from 'vitest';
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

describe('Definition - Coverage Completion', () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = await fs.mkdtemp(path.join(os.tmpdir(), 'lib-fs-test-'));
  });

  afterEach(async () => {
    await fs.rm(testDir, { recursive: true, force: true });
  });

  it('should set custom file options (lines 71-82)', () => {
    const definition = createDefinition<TestItem, 'test', never, never, never, never, never>(
      ['test'],
      [],
      ['tests'],
      testDir,
      {
        files: {
          directory: '_custom_files',
          maxFileSize: 1024 * 1024 * 10, // 10MB
          allowedContentTypes: ['audio/wav', 'image/jpeg'],
          includeMetadataInItem: false,
          computeChecksums: false
        }
      } as any
    );

    expect(definition.options.files?.directory).toBe('_custom_files');
    expect(definition.options.files?.maxFileSize).toBe(1024 * 1024 * 10);
    expect(definition.options.files?.allowedContentTypes).toEqual(['audio/wav', 'image/jpeg']);
    expect(definition.options.files?.includeMetadataInItem).toBe(false);
    expect(definition.options.files?.computeChecksums).toBe(false);
  });

  it('should use file option defaults when not provided', () => {
    const definition = createDefinition<TestItem, 'test', never, never, never, never, never>(
      ['test'],
      [],
      ['tests'],
      testDir,
      {}
    );

    expect(definition.options.files?.directory).toBe('_files');
    expect(definition.options.files?.includeMetadataInItem).toBe(true);
    expect(definition.options.files?.computeChecksums).toBe(true);
    expect(definition.options.files?.maxFileSize).toBeUndefined();
    expect(definition.options.files?.allowedContentTypes).toBeUndefined();
  });

  it('should handle partial file options', () => {
    const definition = createDefinition<TestItem, 'test', never, never, never, never, never>(
      ['test'],
      [],
      ['tests'],
      testDir,
      {
        files: {
          directory: '_custom',
          // Other options will use defaults
        }
      } as any
    );

    expect(definition.options.files?.directory).toBe('_custom');
    expect(definition.options.files?.includeMetadataInItem).toBe(true);
    expect(definition.options.files?.computeChecksums).toBe(true);
  });
});

