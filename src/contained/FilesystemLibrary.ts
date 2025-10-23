import { Item } from '@fjell/core';
import * as Library from '@fjell/lib';
import { createFilesystemLibrary, FilesystemLibrary } from '../FilesystemLibrary';
import FSLogger from '../logger';

const logger = FSLogger.get('contained', 'FilesystemLibrary');

/**
 * Specialized factory for contained items (1 level) - simpler API
 */
export function createContainedFilesystemLibrary<
  V extends Item<S, L1>,
  S extends string,
  L1 extends string
>(
  kta: [S, L1],
  directories: [string, string],
  globalDirectory: string,
  options?: Partial<Library.Options<V, S, L1>>
): FilesystemLibrary<V, S, L1> {
  logger.default('createContainedFilesystemLibrary', { kta, directories, globalDirectory });

  return createFilesystemLibrary<V, S, L1>(
    kta as any,
    [...directories],
    globalDirectory,
    options || {},
    []
  );
}
