import { Coordinate, Item, ItemQuery, LocKeyArray } from '@fjell/core';
import { PathBuilder } from '../PathBuilder';
import { FileProcessor } from '../FileProcessor';
import { DirectoryManager } from '../DirectoryManager';
import FSLogger from '../logger';
import * as fs from 'fs/promises';
import * as path from 'path';

const logger = FSLogger.get('ops', 'all');

/**
 * Get all items from filesystem
 */
export async function all<
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
): Promise<V[]> {
  logger.default('all', { query, locations });

  try {
    // Determine directory path from coordinate and locations
    let directoryPath: string;
    
    if (locations && locations.length > 0) {
      // Build path from locations
      const basePath = pathBuilder.buildDirectoryFromLocations(locations as any[]);
      const kt = coordinate.kta[0];
      const ktIndex = 0; // First element is always the primary kt
      const ktDirectory = pathBuilder.buildDirectory(kt, ktIndex).split(path.sep).pop() || kt;
      directoryPath = path.join(basePath, ktDirectory);
    } else {
      // For primary items or no locations specified, use the first directory
      directoryPath = pathBuilder.buildDirectory(coordinate.kta[0], 0);
    }
    
    logger.default('Directory path', { directoryPath, locations });

    // List all JSON files in directory
    const files = await directoryManager.listFiles(directoryPath, '.json');
    logger.default('Found files', { count: files.length });

    // Read and deserialize all files in parallel
    const itemPromises = files.map(async (filePath) => {
      try {
        const content = await fs.readFile(filePath, 'utf-8');
        const item = fileProcessor.deserialize<V>(content, coordinate as any);
        return item;
      } catch (error) {
        logger.error('Failed to read/deserialize file', { filePath, error });
        return null;
      }
    });

    const allItems = await Promise.all(itemPromises);
    const items = allItems.filter((item) => item !== null) as V[];
    logger.default('Deserialized items', { count: items.length });

    // Apply query filters if provided
    let result = items;

    if (query) {
      // Apply custom filter if provided (via extended query)
      if ((query as any).filter) {
        result = result.filter((query as any).filter);
      }

      // Apply custom sort if provided (via extended query)
      if ((query as any).sort) {
        result = result.sort((query as any).sort);
      }

      // Apply offset
      if (query.offset && query.offset > 0) {
        result = result.slice(query.offset);
      }

      // Apply limit
      if (typeof query.limit !== 'undefined' && query.limit >= 0) {
        result = result.slice(0, query.limit);
      }
    }

    logger.default('Returning items', { count: result.length });
    return result;
  } catch (error) {
    logger.error('Error getting all items', { error });
    // If directory doesn't exist, return empty array
    if ((error as any).code === 'ENOENT') {
      logger.default('Directory does not exist, returning empty array');
      return [];
    }
    throw error;
  }
}

