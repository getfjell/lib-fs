import { Coordinate, Item, ItemTypeArray } from '@fjell/types';
import { createCoordinate } from '@fjell/core';
import * as Library from '@fjell/lib';
import * as path from 'path';
import { Options } from './Options';
import FSLogger from './logger';

const logger = FSLogger.get('Definition');

export interface Definition<
  V extends Item<S, L1, L2, L3, L4, L5>,
  S extends string,
  L1 extends string = never,
  L2 extends string = never,
  L3 extends string = never,
  L4 extends string = never,
  L5 extends string = never
> {
  coordinate: Coordinate<S, L1, L2, L3, L4, L5>;
  options: Options<V, S, L1, L2, L3, L4, L5>;
  globalDirectory: string;
  directoryPaths: string[];
  kta?: string[]; // Key type array as strings for PathBuilder
}

export function createDefinition<
  V extends Item<S, L1, L2, L3, L4, L5>,
  S extends string,
  L1 extends string = never,
  L2 extends string = never,
  L3 extends string = never,
  L4 extends string = never,
  L5 extends string = never
>(
  kta: ItemTypeArray<S, L1, L2, L3, L4, L5>,
  scopes: string[],
  directoryPaths: string[],
  globalDirectory: string,
  libOptions: Library.Options<V, S, L1, L2, L3, L4, L5>
): Definition<V, S, L1, L2, L3, L4, L5> {
  logger.info('Creating definition', { kta, globalDirectory, directoryPaths });

  // Validate globalDirectory is provided
  if (!globalDirectory) {
    throw new Error('globalDirectory is required');
  }

  // Validate directoryPaths length matches kta length
  if (directoryPaths.length !== kta.length) {
    throw new Error(
      `directoryPaths length (${directoryPaths.length}) must match kta length (${kta.length})`
    );
  }

  // Create coordinate from kta
  const coordinate = createCoordinate(kta);

  // Resolve globalDirectory to absolute path
  const absoluteGlobalDirectory = path.resolve(globalDirectory);

  // Merge options with defaults
  const options: Options<V, S, L1, L2, L3, L4, L5> = {
    ...libOptions,
    globalDirectory: absoluteGlobalDirectory,
    useJsonExtension: (libOptions as any).useJsonExtension ?? true,
    autoCreateDirectories: (libOptions as any).autoCreateDirectories ?? true,
    encoding: ((libOptions as any).encoding as BufferEncoding) ?? 'utf-8',
    prettyPrint: (libOptions as any).prettyPrint ?? false,
    fileMode: (libOptions as any).fileMode ?? 0o644,
    directoryMode: (libOptions as any).directoryMode ?? 0o755,
    files: {
      directory: (libOptions as any).files?.directory ?? '_files',
      maxFileSize: (libOptions as any).files?.maxFileSize,
      allowedContentTypes: (libOptions as any).files?.allowedContentTypes,
      includeMetadataInItem: (libOptions as any).files?.includeMetadataInItem ?? true,
      computeChecksums: (libOptions as any).files?.computeChecksums ?? true,
    },
  };

  logger.debug('Definition created', { coordinate, absoluteGlobalDirectory });

  // Store kta as string array for PathBuilder
  const ktaStrings = Array.isArray(kta) ? kta.map(String) : [String(kta)];

  return {
    coordinate,
    options,
    globalDirectory: absoluteGlobalDirectory,
    directoryPaths,
    kta: ktaStrings as any, // Store for PathBuilder usage
  };
}
