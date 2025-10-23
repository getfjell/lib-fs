import * as fs from 'fs/promises';
import { ComKey, Coordinate, Item, PriKey } from '@fjell/core';
import { PathBuilder } from '../PathBuilder';
import { FileProcessor } from '../FileProcessor';
import FSLogger from '../logger';
import { get } from './get';
import { Options } from '../Options';

const logger = FSLogger.get('ops', 'remove');

/**
 * Remove an item from filesystem
 */
export async function remove<
  V extends Item<S, L1, L2, L3, L4, L5>,
  S extends string,
  L1 extends string = never,
  L2 extends string = never,
  L3 extends string = never,
  L4 extends string = never,
  L5 extends string = never
>(
  key: PriKey<S> | ComKey<S, L1, L2, L3, L4, L5>,
  pathBuilder: PathBuilder,
  fileProcessor: FileProcessor,
  coordinate: Coordinate<S, L1, L2, L3, L4, L5>,
  options: Options<V, S, L1, L2, L3, L4, L5>
): Promise<V | void> {
  logger.default('remove', { key });

  try {
    // Get existing item first (to return it)
    const existing = await get<V, S, L1, L2, L3, L4, L5>(
      key,
      pathBuilder,
      fileProcessor,
      coordinate,
      options
    );

    // Build path
    const path = pathBuilder.buildPath(key);

    // Delete file
    await fs.unlink(path);
    logger.default('Deleted item', { path });

    // Optionally delete associated files directory
    if (options.files && existing) {
      try {
        const filesDir = pathBuilder.buildFilesDirectory(key);
        await fs.rm(filesDir, { recursive: true, force: true });
        logger.default('Deleted files directory', { filesDir });
      } catch (error) {
        // Don't fail if files directory doesn't exist or can't be deleted
        logger.debug('Could not delete files directory', { error });
      }
    }

    return existing ?? (void 0 as void);
  } catch (error) {
    logger.error('Error removing item', { key, error });
    throw error;
  }
}

