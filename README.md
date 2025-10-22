# @fjell/lib-fs

Filesystem persistence library for Fjell framework.

## Status

🚧 **Development / Alpha** - This library is under active development.

## Overview

Store Fjell Items as JSON files in the local filesystem with full support for the Fjell Operations interface. Perfect for local development, testing, and desktop applications.

## Features

- ✅ Full Operations interface implementation
- ✅ Primary and Contained items support
- ✅ **File attachments support** (same API as lib-gcs)
- ✅ Custom finders, actions, and facets
- ✅ Type-safe with TypeScript
- ✅ Hierarchical storage on filesystem
- ✅ Direct filesystem access
- ✅ No external dependencies (uses Node.js built-ins)

## Installation

```bash
npm install @fjell/lib-fs
```

## Quick Start

```typescript
import { createPrimaryFilesystemLibrary } from '@fjell/lib-fs';

interface User {
  kt: 'user';
  pk: string;
  name: string;
  email: string;
}

const userLib = createPrimaryFilesystemLibrary<User, 'user'>(
  'user',
  'users',
  { globalDirectory: './data' }
);

// Create a user
const user = await userLib.operations.create({
  name: 'Alice',
  email: 'alice@example.com'
});

// File stored at: ./data/users/{uuid}.json
```

## Use Cases

- ✅ Local development and testing
- ✅ Desktop applications
- ✅ Build-time data storage
- ✅ Configuration management
- ✅ Prototyping
- ✅ Development alternative to lib-gcs

## Documentation

Coming soon!

## License

Apache-2.0

## Author

Fjell Team

TEST
