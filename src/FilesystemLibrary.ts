import * as Library from '@fjell/lib';
import { Coordinate, Item, ItemTypeArray } from '@fjell/types';
import { Registry } from '@fjell/lib';
import { Options } from './Options';
import { createDefinition } from './Definition';
import { createOperations } from './Operations';
import FSLogger from './logger';

const logger = FSLogger.get('FilesystemLibrary');

/**
 * The FilesystemLibrary interface extends the Library from @fjell/lib
 * and adds filesystem-specific properties and operations.
 */
export interface FilesystemLibrary<
  V extends Item<S, L1, L2, L3, L4, L5>,
  S extends string,
  L1 extends string = never,
  L2 extends string = never,
  L3 extends string = never,
  L4 extends string = never,
  L5 extends string = never
> extends Library.Library<V, S, L1, L2, L3, L4, L5> {
  /** The global directory path where items are stored */
  globalDirectory: string;

  // TODO: File attachment operations will be added in Prompt 6
  // files: FileOperations<V, S, L1, L2, L3, L4, L5>;
}

/**
 * Creates a new FilesystemLibrary with pre-created components
 */
export function createFilesystemLibraryFromComponents<
  V extends Item<S, L1, L2, L3, L4, L5>,
  S extends string,
  L1 extends string = never,
  L2 extends string = never,
  L3 extends string = never,
  L4 extends string = never,
  L5 extends string = never
>(
  registry: Registry,
  coordinate: Coordinate<S, L1, L2, L3, L4, L5>,
  globalDirectory: string,
  operations: Library.Operations<V, S, L1, L2, L3, L4, L5>,
  options: Options<V, S, L1, L2, L3, L4, L5>
): FilesystemLibrary<V, S, L1, L2, L3, L4, L5> {
  logger.default('createFilesystemLibraryFromComponents', {
    coordinate,
    globalDirectory
  });

  return {
    registry,
    coordinate,
    globalDirectory,
    operations,
    options,
  } as FilesystemLibrary<V, S, L1, L2, L3, L4, L5>;
}

/**
 * Creates a new FilesystemLibrary with the provided raw parameters
 */
export function createFilesystemLibrary<
  V extends Item<S, L1, L2, L3, L4, L5>,
  S extends string,
  L1 extends string = never,
  L2 extends string = never,
  L3 extends string = never,
  L4 extends string = never,
  L5 extends string = never
>(
  kta: ItemTypeArray<S, L1, L2, L3, L4, L5>,
  directoryPaths: string[],
  globalDirectory: string,
  libOptions?: Partial<Library.Options<V, S, L1, L2, L3, L4, L5>> & Partial<Options<V, S, L1, L2, L3, L4, L5>> | null,
  scopes?: string[] | null,
  registry?: Registry
): FilesystemLibrary<V, S, L1, L2, L3, L4, L5> {
  logger.default('createFilesystemLibrary', { kta, directoryPaths, globalDirectory, scopes });

  // Convert nulls to defaults
  const finalScopes = scopes || [];
  const finalOptions = libOptions || {};
  const finalRegistry = registry || ({} as Registry);

  // Create definition
  const definition = createDefinition<V, S, L1, L2, L3, L4, L5>(
    kta,
    finalScopes,
    directoryPaths,
    globalDirectory,
    finalOptions
  );

  // Create operations
  const operations = createOperations<V, S, L1, L2, L3, L4, L5>(
    definition,
    finalRegistry
  );

  // Get coordinate
  const coordinate = definition.coordinate;

  // Assemble library
  return createFilesystemLibraryFromComponents<V, S, L1, L2, L3, L4, L5>(
    finalRegistry,
    coordinate,
    globalDirectory,
    operations,
    definition.options
  );
}

/**
 * Type guard to check if an object is a FilesystemLibrary
 */
export function isFilesystemLibrary(library: any): library is FilesystemLibrary<any, any> {
  if (!library || typeof library !== 'object') {
    return false;
  }
  
  return (
    'globalDirectory' in library &&
    'operations' in library &&
    'coordinate' in library
  );
}
