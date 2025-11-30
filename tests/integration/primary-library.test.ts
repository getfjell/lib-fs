import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createPrimaryFilesystemLibrary } from '../../src/primary/FilesystemLibrary';
import { createPrimaryFilesystemLibrary as factoryCreate } from '../../src/FilesystemLibraryFactory';
import type { Item } from '@fjell/core';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

interface User extends Item<'user'> {
  kt: 'user';
  pk: string;
  name: string;
  email: string;
  status?: string;
}

describe('Primary Item Library Integration', () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = await fs.mkdtemp(path.join(os.tmpdir(), 'lib-fs-test-'));
  });

  afterEach(async () => {
    await fs.rm(testDir, { recursive: true, force: true });
  });

  describe('Using primary helper', () => {
    it('should create and get item', async () => {
      const userLib = createPrimaryFilesystemLibrary<User, 'user'>(
        'user',
        'users',
        testDir
      );

      const user = await userLib.operations.create({
        name: 'Alice',
        email: 'alice@example.com'
      });

      expect(user).toBeDefined();
      expect(user.kt).toBe('user');
      expect(user.name).toBe('Alice');

      const found = await userLib.operations.get({
        kt: 'user',
        pk: user.pk
      });

      expect(found).toEqual(user);
    });

    it('should update item', async () => {
      const userLib = createPrimaryFilesystemLibrary<User, 'user'>(
        'user',
        'users',
        testDir
      );

      const user = await userLib.operations.create({
        name: 'Bob',
        email: 'bob@example.com'
      });

      const updated = await userLib.operations.update(
        { kt: 'user', pk: user.pk },
        { name: 'Robert' }
      );

      expect(updated.name).toBe('Robert');
      expect(updated.email).toBe('bob@example.com'); // Preserved
    });

    it('should remove item', async () => {
      const userLib = createPrimaryFilesystemLibrary<User, 'user'>(
        'user',
        'users',
        testDir
      );

      const user = await userLib.operations.create({
        name: 'Charlie',
        email: 'charlie@example.com'
      });

      await userLib.operations.remove({ kt: 'user', pk: user.pk });

      const found = await userLib.operations.get({ kt: 'user', pk: user.pk });
      expect(found).toBeNull();
    });

    it('should list all items', async () => {
      const userLib = createPrimaryFilesystemLibrary<User, 'user'>(
        'user',
        'users',
        testDir
      );

      await userLib.operations.create({ name: 'User 1', email: 'user1@example.com' });
      await userLib.operations.create({ name: 'User 2', email: 'user2@example.com' });
      await userLib.operations.create({ name: 'User 3', email: 'user3@example.com' });

      const result = await userLib.operations.all();

      expect(result.items).toHaveLength(3);
      expect(result.metadata.total).toBe(3);
    });

    it('should use finders', async () => {
      const userLib = createPrimaryFilesystemLibrary<User, 'user'>(
        'user',
        'users',
        testDir,
        {
          finders: {
            byStatus: async (params) => {
              const result = await userLib.operations.all();
              return result.items.filter(u => u.status === params.status);
            }
          }
        }
      );

      await userLib.operations.create({ name: 'Active User', email: 'active@example.com', status: 'active' });
      await userLib.operations.create({ name: 'Inactive User', email: 'inactive@example.com', status: 'inactive' });

      const active = await userLib.operations.find('byStatus', { status: 'active' });

      expect(active).toHaveLength(1);
      expect(active[0].status).toBe('active');
    });

    it('should execute actions', async () => {
      const userLib = createPrimaryFilesystemLibrary<User, 'user'>(
        'user',
        'users',
        testDir,
        {
          actions: {
            activate: async (item) => {
              return [{ ...item, status: 'active' } as User, []];
            }
          }
        }
      );

      const user = await userLib.operations.create({
        name: 'Test User',
        email: 'test@example.com',
        status: 'inactive'
      });

      const [activated] = await userLib.operations.action(
        { kt: 'user', pk: user.pk },
        'activate',
        {}
      );

      expect(activated.status).toBe('active');
    });

    it('should compute facets', async () => {
      const userLib = createPrimaryFilesystemLibrary<User, 'user'>(
        'user',
        'users',
        testDir,
        {
          facets: {
            summary: async (item) => {
              return { email: item.email, name: item.name };
            }
          }
        }
      );

      const user = await userLib.operations.create({
        name: 'Test User',
        email: 'test@example.com'
      });

      const summary = await userLib.operations.facet(
        { kt: 'user', pk: user.pk },
        'summary',
        {}
      );

      expect(summary.email).toBe('test@example.com');
      expect(summary.name).toBe('Test User');
    });
  });

  describe('Using factory', () => {
    it('should create library with factory', () => {
      const library = factoryCreate<User, 'user'>(
        'user',
        'users',
        { globalDirectory: testDir }
      );

      expect(library).toBeDefined();
      expect(library.coordinate.kta[0]).toBe('user');
    });

    it('should perform full CRUD workflow', async () => {
      const library = factoryCreate<User, 'user'>(
        'user',
        'users',
        { globalDirectory: testDir }
      );

      // Create
      const created = await library.operations.create({
        name: 'Workflow User',
        email: 'workflow@example.com'
      });

      // Read
      const read = await library.operations.get({ kt: 'user', pk: created.pk });
      expect(read).toEqual(created);

      // Update
      const updated = await library.operations.update(
        { kt: 'user', pk: created.pk },
        { name: 'Updated Name' }
      );
      expect(updated.name).toBe('Updated Name');

      // Delete
      await library.operations.remove({ kt: 'user', pk: created.pk });
      const deleted = await library.operations.get({ kt: 'user', pk: created.pk });
      expect(deleted).toBeNull();
    });
  });

  describe('Hooks integration', () => {
    it('should support hooks configuration', async () => {
      const library = createPrimaryFilesystemLibrary<User, 'user'>(
        'user',
        'users',
        testDir,
        {
          hooks: {
            beforeCreate: async (item) => {
              return { ...item, status: 'new' };
            }
          }
        }
      );

      // Verify hooks are configured
      expect(library.options.hooks).toBeDefined();
      expect(library.options.hooks?.beforeCreate).toBeDefined();
    });

    it('should have operations that respect hooks', async () => {
      const library = createPrimaryFilesystemLibrary<User, 'user'>(
        'user',
        'users',
        testDir,
        {
          hooks: {
            afterCreate: async (item) => {
              return item;
            }
          }
        }
      );

      const user = await library.operations.create({
        name: 'Hook Test',
        email: 'hook@example.com'
      });

      // Operations should complete successfully with hooks configured
      expect(user).toBeDefined();
      expect(user.name).toBe('Hook Test');
    });
  });
});

