import { ComKey, PriKey } from '@fjell/core';

/**
 * Metadata for a file attachment
 */
export interface FileReference {
  /** File name (e.g., "0.wav", "cover.jpg") */
  name: string;
  
  /** Label/category (e.g., "master", "final", "thumbnail") */
  label: string;
  
  /** File size in bytes */
  size: number;
  
  /** MIME type (e.g., "audio/wav", "image/jpeg") */
  contentType: string;
  
  /** Upload timestamp */
  uploadedAt: Date;
  
  /** MD5 checksum for integrity verification */
  checksum?: string;
  
  /** Custom metadata */
  metadata?: Record<string, any>;
}

/**
 * File collection organized by label
 */
export type FileCollection = {
  [label: string]: FileReference[];
};

/**
 * Options for file upload
 */
export interface UploadFileOptions {
  /** MIME type (auto-detected if not provided) */
  contentType?: string;
  
  /** Custom metadata */
  metadata?: Record<string, any>;
  
  /** Whether to compute checksum (default: true) */
  computeChecksum?: boolean;
}

