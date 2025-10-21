import * as Library from '@fjell/lib';
import { Item } from '@fjell/core';

export interface Options<
  V extends Item<S, L1, L2, L3, L4, L5>,
  S extends string,
  L1 extends string = never,
  L2 extends string = never,
  L3 extends string = never,
  L4 extends string = never,
  L5 extends string = never
> extends Library.Options<V, S, L1, L2, L3, L4, L5> {
  /** The global directory path where items are stored */
  globalDirectory: string;
  
  /** Whether to use .json extension for files (default: true) */
  useJsonExtension?: boolean;
  
  /** Whether to create directories if they don't exist (default: true) */
  autoCreateDirectories?: boolean;
  
  /** File encoding (default: 'utf-8') */
  encoding?: BufferEncoding;
  
  /** Whether to use pretty-printed JSON (default: false) */
  prettyPrint?: boolean;
  
  /** File permissions in octal (default: 0o644) */
  fileMode?: number;
  
  /** Directory permissions in octal (default: 0o755) */
  directoryMode?: number;
  
  /**
   * File attachment configuration
   */
  files?: {
    /** Subdirectory name for files (default: "_files") */
    directory?: string;
    
    /** Maximum file size in bytes (default: no limit) */
    maxFileSize?: number;
    
    /** Allowed content types (default: all allowed) */
    allowedContentTypes?: string[];
    
    /** Whether to include file metadata in item JSON (default: true) */
    includeMetadataInItem?: boolean;
    
    /** Whether to compute checksums (default: true) */
    computeChecksums?: boolean;
  };
}
