import { Item, ItemTypeArray } from '@fjell/types';
import { Registry } from '@fjell/lib';
import * as Library from '@fjell/lib';
import { createFilesystemLibrary, FilesystemLibrary } from './FilesystemLibrary';
import FSLogger from './logger';

const logger = FSLogger.get('FilesystemLibraryFactory');

/**
 * Configuration for Filesystem Library Factory
 */
export interface FilesystemLibraryFactoryConfig {
  globalDirectory: string;
  registry?: Registry;
  useJsonExtension?: boolean;
  autoCreateDirectories?: boolean;
  prettyPrint?: boolean;
}

/**
 * Factory for creating filesystem libraries for primary items
 */
export function createPrimaryFilesystemLibrary<
  V extends Item<S>,
  S extends string
>(
  keyType: S,
  directoryPath: string,
  config: FilesystemLibraryFactoryConfig,
  libOptions?: Partial<Library.Options<V, S>>
): FilesystemLibrary<V, S> {
  logger.default('createPrimaryFilesystemLibrary', { keyType, directoryPath, config });

  const kta = [keyType] as ItemTypeArray<S>;
  const directoryPaths = [directoryPath];

  const mergedOptions = {
    ...libOptions,
    globalDirectory: config.globalDirectory,
    useJsonExtension: config.useJsonExtension,
    autoCreateDirectories: config.autoCreateDirectories,
    prettyPrint: config.prettyPrint,
  };

  return createFilesystemLibrary<V, S>(
    kta,
    directoryPaths,
    config.globalDirectory,
    mergedOptions,
    null,
    config.registry
  );
}

/**
 * Factory for creating filesystem libraries for contained items (1 level)
 */
export function createContainedFilesystemLibrary<
  V extends Item<S, L1>,
  S extends string,
  L1 extends string
>(
  keyType: S,
  parentKeyType: L1,
  directoryPaths: [string, string],
  config: FilesystemLibraryFactoryConfig,
  libOptions?: Partial<Library.Options<V, S, L1>>
): FilesystemLibrary<V, S, L1> {
  logger.default('createContainedFilesystemLibrary', {
    keyType,
    parentKeyType,
    directoryPaths,
    config
  });

  const kta = [keyType, parentKeyType] as ItemTypeArray<S, L1>;

  const mergedOptions = {
    ...libOptions,
    globalDirectory: config.globalDirectory,
    useJsonExtension: config.useJsonExtension,
    autoCreateDirectories: config.autoCreateDirectories,
    prettyPrint: config.prettyPrint,
  };

  return createFilesystemLibrary<V, S, L1>(
    kta,
    [...directoryPaths],
    config.globalDirectory,
    mergedOptions,
    null,
    config.registry
  );
}

/**
 * Factory for creating filesystem libraries for contained items (2 levels)
 */
export function createContainedFilesystemLibrary2<
  V extends Item<S, L1, L2>,
  S extends string,
  L1 extends string,
  L2 extends string
>(
  keyType: S,
  parentKeyTypes: [L1, L2],
  directoryPaths: [string, string, string],
  config: FilesystemLibraryFactoryConfig,
  libOptions?: Partial<Library.Options<V, S, L1, L2>>
): FilesystemLibrary<V, S, L1, L2> {
  logger.default('createContainedFilesystemLibrary2', {
    keyType,
    parentKeyTypes,
    directoryPaths,
    config
  });

  const kta = [keyType, ...parentKeyTypes] as ItemTypeArray<S, L1, L2>;

  const mergedOptions = {
    ...libOptions,
    globalDirectory: config.globalDirectory,
    useJsonExtension: config.useJsonExtension,
    autoCreateDirectories: config.autoCreateDirectories,
    prettyPrint: config.prettyPrint,
  };

  return createFilesystemLibrary<V, S, L1, L2>(
    kta,
    [...directoryPaths],
    config.globalDirectory,
    mergedOptions,
    null,
    config.registry
  );
}
