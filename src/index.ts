// Main exports for @fjell/lib-fs
export * from './FilesystemLibrary';
export * from './FilesystemLibraryFactory';
export * from './Options';
export * from './types/Files';
export type { Definition } from './Definition';

// Re-export commonly used types from @fjell/types for convenience
export type { PriKey, ComKey, Item } from '@fjell/types';

// Export specialized helpers
export { createPrimaryFilesystemLibrary } from './primary/FilesystemLibrary';
export { createContainedFilesystemLibrary } from './contained/FilesystemLibrary';
