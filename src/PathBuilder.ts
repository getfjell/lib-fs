import { ComKey, isComKey, PriKey } from '@fjell/core';
import * as path from 'path';
import * as fs from 'fs/promises';
import FSLogger from './logger';

const logger = FSLogger.get('PathBuilder');

export interface PathBuilderConfig {
  globalDirectory: string;
  directoryPaths: string[];
  kta?: string[]; // Key type array to map kt to directory paths
  useJsonExtension?: boolean;
}

export class PathBuilder {
  private globalDirectory: string;
  private directoryPaths: string[];
  private kta: string[];
  private useJsonExtension: boolean;

  constructor(config: PathBuilderConfig) {
    this.globalDirectory = config.globalDirectory;
    this.directoryPaths = config.directoryPaths;
    this.kta = config.kta || [];
    this.useJsonExtension = config.useJsonExtension ?? true;
  }

  /**
   * Build absolute file path for an item
   * Example: /data/myapp/user/uuid-123.json
   */
  buildPath(key: PriKey<any> | ComKey<any, any, any, any, any, any>): string {
    if (isComKey(key)) {
      return this.buildComKeyPath(key as ComKey<any, any, any, any, any, any>);
    }
    return this.buildPriKeyPath(key as PriKey<any>);
  }

  /**
   * Build path for a primary key
   */
  private buildPriKeyPath(key: PriKey<any>): string {
    const directory = this.buildDirectory(key.kt, 0);
    const filename = this.useJsonExtension ? `${key.pk}.json` : String(key.pk);
    return path.join(directory, filename);
  }

  /**
   * Build path for a composite key
   * Example: /data/myapp/post/post-456/comment/comment-123.json
   */
  private buildComKeyPath(key: ComKey<any, any, any, any, any, any>): string {
    let currentPath = this.globalDirectory;

    // Build path through location hierarchy
    if (key.loc) {
      for (const location of key.loc) {
        const locIndex = this.kta.indexOf(String(location.kt));
        if (locIndex !== -1 && this.directoryPaths[locIndex]) {
          currentPath = path.join(currentPath, this.directoryPaths[locIndex], String(location.lk));
        } else {
          currentPath = path.join(currentPath, String(location.kt), String(location.lk));
        }
      }
    }

    // Add final key type directory and filename
    const ktIndex = this.kta.indexOf(String(key.kt));
    const ktDirectory = ktIndex !== -1 && this.directoryPaths[ktIndex]
      ? this.directoryPaths[ktIndex]
      : String(key.kt);
    
    const filename = this.useJsonExtension ? `${key.pk}.json` : String(key.pk);
    return path.join(currentPath, ktDirectory, filename);
  }

  /**
   * Build directory path for a key type
   * Example: /data/myapp/user
   */
  buildDirectory(kt: string, index: number): string {
    const directoryName = this.directoryPaths[index] || kt;
    return path.join(this.globalDirectory, directoryName);
  }

  /**
   * Build path to the files directory for an item
   * Example: /data/myapp/user/uuid-123/_files
   */
  buildFilesDirectory(key: PriKey<any> | ComKey<any, any, any, any, any, any>): string {
    const itemPath = this.buildPath(key);
    // Remove the .json extension to get the base path
    const basePath = this.useJsonExtension
      ? itemPath.slice(0, -5) // Remove .json
      : itemPath;
    return path.join(path.dirname(basePath), path.basename(basePath), '_files');
  }

  /**
   * Build path to a specific file
   * Example: /data/myapp/user/uuid-123/_files/master/0.wav
   */
  buildFilePath(
    key: PriKey<any> | ComKey<any, any, any, any, any, any>,
    label: string,
    filename: string
  ): string {
    const filesDir = this.buildFilesDirectory(key);
    return path.join(filesDir, label, filename);
  }

  /**
   * Build path to a label directory
   * Example: /data/myapp/user/uuid-123/_files/master
   */
  buildLabelDirectory(
    key: PriKey<any> | ComKey<any, any, any, any, any, any>,
    label: string
  ): string {
    const filesDir = this.buildFilesDirectory(key);
    return path.join(filesDir, label);
  }

  /**
   * Parse file path back to a key
   * This is a simple implementation - may need enhancement for complex cases
   */
  parsePathToKey(filePath: string): PriKey<any> | ComKey<any, any, any, any, any, any> | null {
    try {
      // Remove global directory prefix
      const relativePath = path.relative(this.globalDirectory, filePath);
      const parts = relativePath.split(path.sep);

      // Remove .json extension if present
      let lastPart = parts[parts.length - 1];
      if (lastPart.endsWith('.json')) {
        lastPart = lastPart.slice(0, -5);
      }

      // Simple case: primary key (directory/pk)
      if (parts.length === 2) {
        const kt = this.getKeyTypeByDirectory(parts[0]);
        return { kt: kt as any, pk: lastPart };
      }

      // Complex case: composite key with locations
      // This is a simplified implementation
      logger.warning('parsePathToKey for composite keys not fully implemented', { filePath });
      return null;
    } catch (error) {
      logger.error('Failed to parse path to key', { filePath, error });
      return null;
    }
  }

  /**
   * Get all subdirectories for a directory
   */
  async getSubdirectories(dirPath: string): Promise<string[]> {
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      return entries
        .filter((entry) => entry.isDirectory())
        .map((entry) => path.join(dirPath, entry.name));
    } catch (error) {
      logger.error('Failed to get subdirectories', { dirPath, error });
      return [];
    }
  }

  /**
   * Helper to get key type at a specific index
   */
  private getKeyTypeAtIndex(index: number): string {
    // This is a simplified implementation
    // In a real implementation, we'd need to track the kta
    return this.directoryPaths[index];
  }

  /**
   * Helper to get key type by directory name
   */
  private getKeyTypeByDirectory(directory: string): string {
    const index = this.directoryPaths.indexOf(directory);
    if (index !== -1) {
      return this.directoryPaths[index];
    }
    return directory;
  }
}

