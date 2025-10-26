import { ComKey, Coordinate, Item, LocKeyArray, NotFoundError, PriKey } from '@fjell/core';
import { PathBuilder } from '../PathBuilder';
import { FileProcessor } from '../FileProcessor';
import { DirectoryManager } from '../DirectoryManager';
import { Options } from '../Options';
import FSLogger from '../logger';
import { get } from './get';
import { create, CreateOptions } from './create';
import { update, UpdateOptions } from './update';

const logger = FSLogger.get('ops', 'upsert');

/**
 * Update an item if it exists, create if it doesn't
 */
export async function upsert<
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
  locations: LocKeyArray<L1, L2, L3, L4, L5> | undefined,
  updateOptions: UpdateOptions | undefined,
  pathBuilder: PathBuilder,
  fileProcessor: FileProcessor,
  directoryManager: DirectoryManager,
  coordinate: Coordinate<S, L1, L2, L3, L4, L5>,
  fsOptions: Options<V, S, L1, L2, L3, L4, L5>
): Promise<V> {
  logger.default('upsert', { key, item, locations, updateOptions });

  let existing: V | null = null;

  try {
    // Try to get existing item
    logger.default('Retrieving item by key', { key });
    existing = await get<V, S, L1, L2, L3, L4, L5>(
      key,
      pathBuilder,
      fileProcessor,
      coordinate,
      fsOptions
    );
  } catch (error: any) {
    // Check if this is a NotFoundError (preserved by core wrapper)
    // Check both instanceof and error code to handle cases where
    // module duplication might break instanceof checks
    const isNotFound = error instanceof NotFoundError ||
      error?.name === 'NotFoundError' ||
      error?.errorInfo?.code === 'NOT_FOUND';

    if (isNotFound) {
      // If it's a "not found" error, existing stays null and we create below
      logger.default('Item not found, will create', { key, errorType: error?.name, errorCode: error?.errorInfo?.code });
    } else {
      // Re-throw other errors (connection issues, permissions, etc.)
      logger.error('Error getting item during upsert', { key, error: error?.message, name: error?.name, code: error?.errorInfo?.code });
      throw error;
    }
  }

  if (existing) {
    // Item exists - update with provided merge strategy
    logger.default('Item exists, updating', { key });
    return await update<V, S, L1, L2, L3, L4, L5>(
      key,
      item,
      updateOptions,
      pathBuilder,
      fileProcessor,
      directoryManager,
      coordinate,
      fsOptions
    );
  } else {
    // Item doesn't exist - create (options are ignored for creation)
    logger.default('Item does not exist, creating', { key });
    const createOptions: CreateOptions<S, L1, L2, L3, L4, L5> = {
      key,
      locations
    };

    return await create<V, S, L1, L2, L3, L4, L5>(
      item,
      createOptions,
      pathBuilder,
      fileProcessor,
      directoryManager,
      coordinate,
      fsOptions
    );
  }
}

