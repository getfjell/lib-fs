import { Coordinate, Item } from '@fjell/types';
import FSLogger from './logger';

const logger = FSLogger.get('FileProcessor');

export class FileProcessor {
  private prettyPrint: boolean;

  constructor(prettyPrint: boolean = false) {
    this.prettyPrint = prettyPrint;
  }

  /**
   * Serialize item to JSON string
   */
  serialize(item: Item<any, any, any, any, any, any>): string {
    try {
      if (this.prettyPrint) {
        return JSON.stringify(item, null, 2);
      }
      return JSON.stringify(item);
    } catch (error: any) {
      logger.error('Failed to serialize item for filesystem storage', {
        component: 'lib-fs',
        subcomponent: 'FileProcessor',
        operation: 'serialize',
        item: item ? `${item.kt}/${item.pk}` : 'undefined',
        errorType: error?.constructor?.name,
        errorMessage: error?.message,
        suggestion: 'Check for circular references, non-serializable values (functions, symbols), or BigInt values in item data'
      });
      throw new Error(
        `Failed to serialize item for filesystem storage: ${error?.message || error}. ` +
        `Item: ${item ? `${item.kt}/${item.pk}` : 'undefined'}. ` +
        `Suggestion: Remove non-serializable values from item data.`
      );
    }
  }

  /**
   * Deserialize JSON string to item
   */
  deserialize<V extends Item<any, any, any, any, any, any>>(
    content: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    coordinate: Coordinate<any, any, any, any, any, any>
  ): V | null {
    try {
      const item = JSON.parse(content) as V;
      
      // Basic validation
      if (!this.validateItemStructure(item)) {
        logger.warning('Invalid item structure', { item });
        return null;
      }

      return item;
    } catch (error) {
      logger.error('Failed to deserialize item', { content, error });
      return null;
    }
  }

  /**
   * Validate item structure
   */
  validateItemStructure(item: Item<any, any, any, any, any, any>): boolean {
    // Basic validation - item must have kt and pk
    if (!item || typeof item !== 'object') {
      return false;
    }

    if (!item.kt || typeof item.kt !== 'string') {
      logger.warning('Item missing or invalid kt', { item });
      return false;
    }

    if (!item.pk || typeof item.pk !== 'string') {
      logger.warning('Item missing or invalid pk', { item });
      return false;
    }

    return true;
  }
}

