import { Item } from '@fjell/types';
import * as Library from '@fjell/lib';
import { createFilesystemLibrary, FilesystemLibrary } from '../FilesystemLibrary';
import FSLogger from '../logger';

const logger = FSLogger.get('primary', 'FilesystemLibrary');

/**
 * Specialized factory for primary items - simpler API
 */
export function createPrimaryFilesystemLibrary<
  V extends Item<S>,
  S extends string
>(
  keyType: S,
  directory: string,
  globalDirectory: string,
  options?: Partial<Library.Options<V, S>>
): FilesystemLibrary<V, S> {
  logger.default('createPrimaryFilesystemLibrary', { keyType, directory, globalDirectory });

  return createFilesystemLibrary<V, S>(
    [keyType],
    [directory],
    globalDirectory,
    options || {},
    []
  );
}
