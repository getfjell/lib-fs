# Changelog

## [4.4.0-dev.0] - 2025-01-XX

### Added
- Initial project setup and configuration
- Core type definitions and interfaces
  - Options interface with filesystem-specific configuration
  - Definition builder for library configuration
  - File attachment types (FileReference, FileCollection, UploadFileOptions)
- PathBuilder for building filesystem paths from Fjell keys
  - Support for primary keys (PriKey)
  - Support for composite keys (ComKey) with location hierarchies
  - File attachment path building
- FileProcessor for JSON serialization/deserialization
  - Pretty-print support
  - Item validation
- DirectoryManager for filesystem directory operations
  - Automatic directory creation
  - File listing (flat and recursive)
  - Directory validation
- Logging infrastructure using @fjell/logging
- Comprehensive test suite for core components
  - Definition tests
  - PathBuilder tests
  - FileProcessor tests
  - DirectoryManager tests

### Status
- ✅ Prompt 1: Project Setup - Complete
- ✅ Prompt 2: Core Types and Logger - Complete
- ⏳ Prompt 3: Primary Operations - Pending
- ⏳ Prompt 4: Filesystem Library Interface - Pending
- ⏳ Prompt 5: Contained Items Support - Pending
- ⏳ Prompt 6: File Attachments - Pending
- ⏳ Prompt 7: Finders, Actions, Facets - Pending
- ⏳ Prompt 8: Error Handling - Pending
- ⏳ Prompt 9: Testing Strategy - Pending
- ⏳ Prompt 10: Documentation - Pending
- ⏳ Prompt 11: Registry Integration - Pending
- ⏳ Prompt 12: Final Polish - Pending

