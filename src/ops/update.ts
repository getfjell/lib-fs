import * as fs from 'fs/promises';
import { ComKey, Coordinate, Item, PriKey } from '@fjell/core';
import { PathBuilder } from '../PathBuilder';
import { FileProcessor } from '../FileProcessor';
import { DirectoryManager } from '../DirectoryManager';
import { Options } from '../Options';
import FSLogger from '../logger';
import { get } from './get';
import deepmerge from 'deepmerge';

const logger = FSLogger.get('ops', 'update');

export interface UpdateOptions {
  mergeStrategy?: 'deep' | 'shallow' | 'replace';
}

/**
 * Update an existing item on filesystem
 */
export async function update<
  V extends Item<S, L1, L2, L3, L4, L5>,
  S extends string,
  L1 extends string = never,
  L2 extends string = never,
  L3 extends string = never,
  L4 extends string = never,
  L5 extends string = never
>(
  key: PriKey<S> | ComKey<S, L1, L2, L3, L4, L5>,
  item: Partial<Item<S, L1, L2, L3, L4, L5>>,
  updateOptions: UpdateOptions | undefined,
  pathBuilder: PathBuilder,
  fileProcessor: FileProcessor,
  directoryManager: DirectoryManager,
  coordinate: Coordinate<S, L1, L2, L3, L4, L5>,
  fsOptions: Options<V, S, L1, L2, L3, L4, L5>
): Promise<V> {
  logger.default('update', { key, item, updateOptions });

  try {
    // Get existing item
    const existing = await get<V, S, L1, L2, L3, L4, L5>(
      key,
      pathBuilder,
      fileProcessor,
      coordinate,
      fsOptions
    );

    if (!existing) {
      throw new Error(`Item not found: ${key.kt}/${key.pk}`);
    }

    // Apply merge strategy (default: 'deep')
    const mergeStrategy = updateOptions?.mergeStrategy || 'deep';
    let updatedItem: V;

    switch (mergeStrategy) {
      case 'deep':
        // Deep merge - recursively merge nested objects
        updatedItem = deepmerge(existing, item, {
          // Don't merge arrays, replace them
          arrayMerge: (destinationArray, sourceArray) => sourceArray
        }) as V;
        break;

      case 'shallow':
        // Shallow merge - top-level only
        updatedItem = {
          ...existing,
          ...item
        } as V;
        break;

      case 'replace':
        // Replace - use new data but preserve key fields
        updatedItem = {
          ...item,
          kt: key.kt,
          pk: key.pk,
          ...('loc' in key ? { loc: key.loc } : {})
        } as unknown as V;
        break;

      default:
        throw new Error(`Invalid merge strategy: ${mergeStrategy}`);
    }

    // Ensure key fields are preserved
    (updatedItem as any).kt = key.kt;
    (updatedItem as any).pk = key.pk;
    if ('loc' in key) {
      (updatedItem as any).loc = key.loc;
    }

    // Serialize updated item
    const content = fileProcessor.serialize(updatedItem);
    logger.default('Serialized updated item', { size: content.length });

    // Build path
    const path = pathBuilder.buildPath(key);

    // Write to file
    await fs.writeFile(path, content, {
      encoding: fsOptions.encoding || 'utf-8',
      mode: fsOptions.fileMode || 0o644
    });

    logger.default('Updated item', { path });
    return updatedItem;
  } catch (error) {
    logger.error('Error updating item', { key, error });
    throw error;
  }
}

