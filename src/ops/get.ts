import * as fs from 'fs/promises';
import { ComKey, Coordinate, Item, PriKey } from '@fjell/types';
import { PathBuilder } from '../PathBuilder';
import { FileProcessor } from '../FileProcessor';
import { Options } from '../Options';
import FSLogger from '../logger';

const logger = FSLogger.get('ops', 'get');

/**
 * Get a single item by key from filesystem
 */
export async function get<
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
): Promise<V | null> {
  logger.default('get', { key });

  try {
    // Build the file path
    const path = pathBuilder.buildPath(key);
    logger.default('Built path', { path });

    // Check if file exists
    try {
      await fs.access(path, fs.constants.F_OK);
    } catch {
      logger.default('File not found', { path });
      return null;
    }

    // Read file content
    const content = await fs.readFile(path, options.encoding || 'utf-8');
    logger.default('Read file', { size: content.length });

    // Deserialize
    const item = fileProcessor.deserialize<V>(content, coordinate as any);
    
    if (!item) {
      logger.error('Failed to deserialize item', { path });
      return null;
    }

    return item;
  } catch (error) {
    logger.error('Error getting item', { key, error });
    throw error;
  }
}

