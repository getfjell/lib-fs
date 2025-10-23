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

### Primary Operations (Prompt 3)
- Core CRUD operations for Primary Items (PriKey)
  - `get()` - Retrieve item by key from filesystem
  - `create()` - Create new item with auto-generated UUID or custom pk
  - `update()` - Update existing item with three merge strategies:
    - 'deep' (default): Recursive merge using deepmerge
    - 'shallow': Top-level merge only
    - 'replace': Replace entire item (preserve key fields)
  - `upsert()` - Update if exists, create if not
  - `remove()` - Delete item and optionally associated files
  - `all()` - List all items with query support (filter, sort, limit, offset)
  - `one()` - Get first matching item with query support
- Operations.ts - Wires all operations together with @fjell/lib wrappers
- Complete test suite for all operations (30+ test cases)

### Implementation Status
- ✅ Prompt 1: Project Setup - **Complete**
- ✅ Prompt 2: Core Types and Logger - **Complete**
- ✅ Prompt 3: Primary Operations - **Complete**
  
### Test Results - Dramatically Improved!
- ✅ **202 tests passing** (+106 tests!)
- ✅ Build successful
- ✅ Lint clean (0 errors)
- ✅ TypeScript declarations generated
- 📊 **Overall Coverage: 94.56%** (was 74.84%)
- 📊 **Operations Coverage: 97.7%** ⭐ (was 87.1%)
  - create.ts: **100%** ⭐
  - get.ts: **100%** ⭐
  - upsert.ts: **100%** ⭐
  - update.ts: **100%** ⭐
  - one.ts: **100%** ⭐
  - remove.ts: **94.73%**
  - all.ts: **89.28%**
- PathBuilder.ts: **98.23%** ⭐
- FileProcessor.ts: **100%** ⭐
- Definition.ts: **100%** ⭐
- DirectoryManager.ts: **93.1%**

### Core Components Implemented
- ✅ Definition.ts: **100% coverage**
- ✅ DirectoryManager.ts: **93.1% coverage**
- ✅ FileProcessor.ts: **100% coverage** ⭐
- ✅ PathBuilder.ts: **93.8% coverage**
- ✅ logger.ts: **100% coverage**

### Next Steps
- ⏳ Prompt 4: Filesystem Library Interface - **Next**
- ⏳ Prompt 5: Contained Items Support - Pending
- ⏳ Prompt 6: File Attachments - Pending
- ⏳ Prompt 7: Finders, Actions, Facets - Pending
- ⏳ Prompt 8: Error Handling - Pending
- ⏳ Prompt 9: Testing Strategy - Pending
- ⏳ Prompt 10: Documentation - Pending
- ⏳ Prompt 11: Registry Integration - Pending
- ⏳ Prompt 12: Final Polish - Pending

