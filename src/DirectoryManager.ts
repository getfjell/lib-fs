import * as fs from 'fs/promises';
import * as path from 'path';
import FSLogger from './logger';

const logger = FSLogger.get('DirectoryManager');

export class DirectoryManager {
  private globalDirectory: string;
  private directoryMode: number;

  constructor(
    globalDirectory: string,
    directoryMode: number = 0o755
  ) {
    this.globalDirectory = globalDirectory;
    this.directoryMode = directoryMode;
  }

  /**
   * Ensure a directory exists, create if needed
   */
  async ensureDirectory(dirPath: string): Promise<void> {
    try {
      await fs.access(dirPath, fs.constants.F_OK);
      logger.debug('Directory exists', { dirPath });
    } catch {
      // Directory doesn't exist, create it
      logger.info('Creating directory', { dirPath });
      await fs.mkdir(dirPath, {
        recursive: true,
        mode: this.directoryMode
      });
    }
  }

  /**
   * Check if directory exists
   */
  async directoryExists(dirPath: string): Promise<boolean> {
    try {
      const stats = await fs.stat(dirPath);
      return stats.isDirectory();
    } catch {
      return false;
    }
  }

  /**
   * List all files in a directory
   */
  async listFiles(dirPath: string, extension?: string): Promise<string[]> {
    try {
      const exists = await this.directoryExists(dirPath);
      if (!exists) {
        logger.debug('Directory does not exist', { dirPath });
        return [];
      }

      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      const files = entries
        .filter((entry) => entry.isFile())
        .map((entry) => path.join(dirPath, entry.name));

      if (extension) {
        return files.filter((file) => file.endsWith(extension));
      }

      return files;
    } catch (error) {
      logger.error('Failed to list files', { dirPath, error });
      return [];
    }
  }

  /**
   * Recursively list all files in a directory
   */
  async listFilesRecursive(dirPath: string, extension?: string): Promise<string[]> {
    try {
      const exists = await this.directoryExists(dirPath);
      if (!exists) {
        return [];
      }

      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      const files: string[] = [];

      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        
        if (entry.isDirectory()) {
          const subFiles = await this.listFilesRecursive(fullPath, extension);
          files.push(...subFiles);
        } else if (entry.isFile()) {
          if (!extension || fullPath.endsWith(extension)) {
            files.push(fullPath);
          }
        }
      }

      return files;
    } catch (error) {
      logger.error('Failed to list files recursively', { dirPath, error });
      return [];
    }
  }

  /**
   * Ensure all parent directories exist for a nested path
   */
  async ensureNestedDirectories(fullPath: string): Promise<void> {
    const dir = path.dirname(fullPath);
    await this.ensureDirectory(dir);
  }

  /**
   * List all files in nested directory structure
   */
  async listNestedFiles(basePath: string, extension?: string): Promise<string[]> {
    return this.listFilesRecursive(basePath, extension);
  }
}

