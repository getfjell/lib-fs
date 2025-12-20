import { AllOptions, ComKey, Item, ItemQuery, LocKeyArray, PriKey } from '@fjell/types';
import * as Library from '@fjell/lib';
import { Definition } from './Definition';
import { PathBuilder } from './PathBuilder';
import { FileProcessor } from './FileProcessor';
import { DirectoryManager } from './DirectoryManager';
import * as ops from './ops';
import FSLogger from './logger';
import { Registry } from '@fjell/lib';

const logger = FSLogger.get('Operations');

/**
 * Create Operations implementation for Filesystem Library
 */
export const createOperations = <
  V extends Item<S, L1, L2, L3, L4, L5>,
  S extends string,
  L1 extends string = never,
  L2 extends string = never,
  L3 extends string = never,
  L4 extends string = never,
  L5 extends string = never
>(
    definition: Definition<V, S, L1, L2, L3, L4, L5>,
    _registry?: Registry
  ): Library.Operations<V, S, L1, L2, L3, L4, L5> => {
  logger.default('createOperations', {
    globalDirectory: definition.globalDirectory,
    coordinate: definition.coordinate
  });

  // Create PathBuilder, FileProcessor, and DirectoryManager instances
  const pathBuilder = new PathBuilder({
    globalDirectory: definition.globalDirectory,
    directoryPaths: definition.directoryPaths,
    kta: definition.coordinate.kta.map(String), // Pass kta for proper key type mapping
    useJsonExtension: definition.options.useJsonExtension
  });

  const fileProcessor = new FileProcessor(definition.options.prettyPrint || false);

  const directoryManager = new DirectoryManager(
    definition.globalDirectory,
    definition.options.directoryMode || 0o755
  );

  const { options, coordinate } = definition;

  // Create implementation operations (core CRUD and query operations)
  const implOps: Library.ImplementationOperations<V, S, L1, L2, L3, L4, L5> = {
    get: async (key: PriKey<S> | ComKey<S, L1, L2, L3, L4, L5>) => {
      return ops.get<V, S, L1, L2, L3, L4, L5>(
        key,
        pathBuilder,
        fileProcessor,
        coordinate,
        options
      );
    },

    create: async (
      item: Partial<Item<S, L1, L2, L3, L4, L5>>,
      createOptions?: ops.CreateOptions<S, L1, L2, L3, L4, L5>
    ) => {
      return ops.create<V, S, L1, L2, L3, L4, L5>(
        item,
        createOptions,
        pathBuilder,
        fileProcessor,
        directoryManager,
        coordinate,
        options
      );
    },

    update: async (
      key: PriKey<S> | ComKey<S, L1, L2, L3, L4, L5>,
      item: Partial<Item<S, L1, L2, L3, L4, L5>>,
      updateOptions?: ops.UpdateOptions
    ) => {
      return ops.update<V, S, L1, L2, L3, L4, L5>(
        key,
        item,
        updateOptions,
        pathBuilder,
        fileProcessor,
        directoryManager,
        coordinate,
        options
      );
    },

    upsert: async (
      key: PriKey<S> | ComKey<S, L1, L2, L3, L4, L5>,
      item: Partial<Item<S, L1, L2, L3, L4, L5>>,
      locations?: LocKeyArray<L1, L2, L3, L4, L5>,
      updateOptions?: ops.UpdateOptions
    ) => {
      return ops.upsert<V, S, L1, L2, L3, L4, L5>(
        key,
        item,
        locations,
        updateOptions,
        pathBuilder,
        fileProcessor,
        directoryManager,
        coordinate,
        options
      );
    },

    remove: async (key: PriKey<S> | ComKey<S, L1, L2, L3, L4, L5>) => {
      return ops.remove<V, S, L1, L2, L3, L4, L5>(
        key,
        pathBuilder,
        fileProcessor,
        coordinate,
        options
      );
    },

    all: async (
      query?: ItemQuery,
      locations?: LocKeyArray<L1, L2, L3, L4, L5> | [],
      allOptions?: AllOptions
    ) => {
      return ops.all<V, S, L1, L2, L3, L4, L5>(
        query,
        locations,
        pathBuilder,
        fileProcessor,
        directoryManager,
        coordinate,
        allOptions
      );
    },

    one: async (
      query?: ItemQuery,
      locations?: LocKeyArray<L1, L2, L3, L4, L5> | []
    ) => {
      return ops.one<V, S, L1, L2, L3, L4, L5>(
        query,
        locations,
        pathBuilder,
        fileProcessor,
        directoryManager,
        coordinate
      );
    },

    // Find operations - execute user-defined finders
    find: async (finder: string, params: any = {}, locations?: any, findOptions?: any) => {
      if (!options.finders || !options.finders[finder]) {
        const availableFinders = options.finders ? Object.keys(options.finders) : [];
        logger.error('Finder not found', {
          component: 'lib-fs',
          operation: 'find',
          requestedFinder: finder,
          availableFinders,
          suggestion: availableFinders.length > 0
            ? `Use one of: ${availableFinders.join(', ')}`
            : 'Define finders in your library options',
          coordinate: JSON.stringify(definition.coordinate)
        });
        throw new Error(
          `Finder '${finder}' not found. ` +
          (availableFinders.length > 0
            ? `Available finders: ${availableFinders.join(', ')}`
            : 'No finders defined.')
        );
      }
      
      // Execute user's finder function - pass findOptions for opt-in pagination support
      // Finder can return FindOperationResult<V> (opt-in) or V[] (legacy)
      // Type assertion needed because FinderMethod type from @fjell/lib may be stale
      return (options.finders[finder] as any)(params, locations, findOptions);
    },

    findOne: async (finder: string, params: any = {}, locations?: any) => {
      if (!options.finders || !options.finders[finder]) {
        const availableFinders = options.finders ? Object.keys(options.finders) : [];
        logger.error('Finder not found', {
          component: 'lib-fs',
          operation: 'findOne',
          requestedFinder: finder,
          availableFinders,
          suggestion: availableFinders.length > 0
            ? `Use one of: ${availableFinders.join(', ')}`
            : 'Define finders in your library options',
          coordinate: JSON.stringify(definition.coordinate)
        });
        throw new Error(
          `Finder '${finder}' not found. ` +
          (availableFinders.length > 0
            ? `Available finders: ${availableFinders.join(', ')}`
            : 'No finders defined.')
        );
      }
      
      // Call finder with limit: 1 and extract first item
      // Type assertion needed because FinderMethod type from @fjell/lib may be stale
      const result = await (options.finders[finder] as any)(params, locations, { limit: 1 });
      // Handle both FindOperationResult and V[] return types
      if (result && typeof result === 'object' && 'items' in result && 'metadata' in result) {
        return result.items.length > 0 ? result.items[0] : null;
      }
      const results = result as V[];
      return results && results.length > 0 ? results[0] : null;
    }
  };

  // Wrap with hooks, validation, and extended operations using @fjell/lib wrapper
  return Library.wrapOperations(implOps as any, options, coordinate, _registry || ({} as Registry));
};
