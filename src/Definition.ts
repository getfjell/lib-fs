import { Coordinate, createCoordinate, ItemTypeArray } from '@fjell/core';
import * as Library from '@fjell/lib';
import * as path from 'path';
import { Options } from './Options';
import FSLogger from './logger';

const logger = FSLogger.get('Definition');

export interface Definition<V, S, L1, L2, L3, L4, L5> {
  coordinate: Coordinate<S, L1, L2, L3, L4, L5>;
  options: Options<V, S, L1, L2, L3, L4, L5>;
  globalDirectory: string;
  directoryPaths: string[];
}

export function createDefinition<V, S, L1, L2, L3, L4, L5>(
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
    useJsonExtension: libOptions.useJsonExtension ?? true,
    autoCreateDirectories: libOptions.autoCreateDirectories ?? true,
    encoding: (libOptions.encoding as BufferEncoding) ?? 'utf-8',
    prettyPrint: libOptions.prettyPrint ?? false,
    fileMode: libOptions.fileMode ?? 0o644,
    directoryMode: libOptions.directoryMode ?? 0o755,
    files: {
      directory: libOptions.files?.directory ?? '_files',
      maxFileSize: libOptions.files?.maxFileSize,
      allowedContentTypes: libOptions.files?.allowedContentTypes,
      includeMetadataInItem: libOptions.files?.includeMetadataInItem ?? true,
      computeChecksums: libOptions.files?.computeChecksums ?? true,
    },
  };

  logger.debug('Definition created', { coordinate, absoluteGlobalDirectory });

  return {
    coordinate,
    options,
    globalDirectory: absoluteGlobalDirectory,
    directoryPaths,
  };
}
