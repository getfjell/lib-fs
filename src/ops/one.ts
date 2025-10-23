import { Coordinate, Item, ItemQuery, LocKeyArray } from '@fjell/core';
import { PathBuilder } from '../PathBuilder';
import { FileProcessor } from '../FileProcessor';
import { DirectoryManager } from '../DirectoryManager';
import FSLogger from '../logger';
import { all } from './all';

const logger = FSLogger.get('ops', 'one');

/**
 * Get first matching item from filesystem
 */
export async function one<
  V extends Item<S, L1, L2, L3, L4, L5>,
  S extends string,
  L1 extends string = never,
  L2 extends string = never,
  L3 extends string = never,
  L4 extends string = never,
  L5 extends string = never
>(
  query: ItemQuery | undefined,
  locations: LocKeyArray<L1, L2, L3, L4, L5> | [] | undefined,
  pathBuilder: PathBuilder,
  fileProcessor: FileProcessor,
  directoryManager: DirectoryManager,
  coordinate: Coordinate<S, L1, L2, L3, L4, L5>
): Promise<V | null> {
  logger.default('one', { query, locations });

  try {
    // Use all() with limit: 1
    const queryWithLimit: ItemQuery = {
      ...query,
      limit: 1
    };

    const items = await all<V, S, L1, L2, L3, L4, L5>(
      queryWithLimit,
      locations,
      pathBuilder,
      fileProcessor,
      directoryManager,
      coordinate
    );

    return items.length > 0 ? items[0] : null;
  } catch (error) {
    logger.error('Error getting one item', { error });
    throw error;
  }
}

