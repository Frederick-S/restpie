import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import { globalBeforeEach } from '../../__jest__/before-each';
import * as models from '../index';
import type { WorkspaceMeta } from '../workspace-meta';

describe('init()', () => {
  beforeEach(globalBeforeEach);

  it('contains openRequestIds as empty array', () => {
    const defaults = models.workspaceMeta.init();
    expect(defaults.openRequestIds).toEqual([]);
  });

  it('contains all required fields', () => {
    expect(models.workspaceMeta.init()).toMatchObject({
      activeActivity: null,
      activeEnvironmentId: null,
      activeRequestId: null,
      openRequestIds: [],
      activeUnitTestSuiteId: null,
      hasSeen: true,
      sidebarFilter: '',
      sidebarHidden: false,
    });
  });
});

describe('migrate()', () => {
  beforeEach(globalBeforeEach);

  it('adds openRequestIds when missing', () => {
    const doc = { _id: 'wrkm_1' } as unknown as WorkspaceMeta;
    expect(doc.openRequestIds).toBeUndefined();

    const migrated = models.workspaceMeta.migrate(doc);
    expect(migrated.openRequestIds).toEqual([]);
  });

  it('preserves existing openRequestIds', () => {
    const doc = {
      _id: 'wrkm_1',
      openRequestIds: ['req_a', 'req_b'],
    } as unknown as WorkspaceMeta;

    const migrated = models.workspaceMeta.migrate(doc);
    expect(migrated.openRequestIds).toEqual(['req_a', 'req_b']);
  });

  it('replaces non-array openRequestIds with empty array', () => {
    const doc = {
      _id: 'wrkm_1',
      openRequestIds: 'invalid' as any,
    } as unknown as WorkspaceMeta;

    const migrated = models.workspaceMeta.migrate(doc);
    expect(migrated.openRequestIds).toEqual([]);
  });
});

describe('create() and update()', () => {
  beforeEach(globalBeforeEach);

  it('creates workspace meta with empty openRequestIds', async () => {
    Date.now = jest.fn<() => number>().mockReturnValue(1600000000000);
    const workspace = await models.workspace.create({ name: 'Test Workspace' });
    const meta = await models.workspaceMeta.create({ parentId: workspace._id });

    expect(meta.openRequestIds).toEqual([]);
    expect(meta.activeRequestId).toBeNull();
  });

  it('creates workspace meta with provided openRequestIds', async () => {
    const workspace = await models.workspace.create({ name: 'Test Workspace' });
    const meta = await models.workspaceMeta.create({
      parentId: workspace._id,
      openRequestIds: ['req_1', 'req_2'],
    });

    expect(meta.openRequestIds).toEqual(['req_1', 'req_2']);
  });

  it('updates openRequestIds', async () => {
    const workspace = await models.workspace.create({ name: 'Test Workspace' });
    const meta = await models.workspaceMeta.create({ parentId: workspace._id });
    expect(meta.openRequestIds).toEqual([]);

    const updated = await models.workspaceMeta.update(meta, {
      openRequestIds: ['req_1', 'req_2', 'req_3'],
    });
    expect(updated.openRequestIds).toEqual(['req_1', 'req_2', 'req_3']);
  });

  it('updates openRequestIds via updateByParentId', async () => {
    const workspace = await models.workspace.create({ name: 'Test Workspace' });
    await models.workspaceMeta.create({
      parentId: workspace._id,
      openRequestIds: ['req_1'],
    });

    await models.workspaceMeta.updateByParentId(workspace._id, {
      openRequestIds: ['req_1', 'req_2'],
    });

    const fetched = await models.workspaceMeta.getByParentId(workspace._id);
    expect(fetched?.openRequestIds).toEqual(['req_1', 'req_2']);
  });

  it('removes a request from openRequestIds', async () => {
    const workspace = await models.workspace.create({ name: 'Test Workspace' });
    const meta = await models.workspaceMeta.create({
      parentId: workspace._id,
      openRequestIds: ['req_1', 'req_2', 'req_3'],
    });

    const filtered = meta.openRequestIds.filter(id => id !== 'req_2');
    const updated = await models.workspaceMeta.update(meta, {
      openRequestIds: filtered,
    });

    expect(updated.openRequestIds).toEqual(['req_1', 'req_3']);
  });

  it('preserves openRequestIds order on update', async () => {
    const workspace = await models.workspace.create({ name: 'Test Workspace' });
    const meta = await models.workspaceMeta.create({
      parentId: workspace._id,
      openRequestIds: ['req_3', 'req_1', 'req_2'],
    });

    const updated = await models.workspaceMeta.update(meta, {
      activeRequestId: 'req_1',
    });

    expect(updated.openRequestIds).toEqual(['req_3', 'req_1', 'req_2']);
  });
});

describe('getOrCreateByParentId()', () => {
  beforeEach(globalBeforeEach);

  it('creates meta with default openRequestIds when none exists', async () => {
    const workspace = await models.workspace.create({ name: 'Test Workspace' });
    const meta = await models.workspaceMeta.getOrCreateByParentId(workspace._id);

    expect(meta.openRequestIds).toEqual([]);
  });

  it('returns existing meta with openRequestIds', async () => {
    const workspace = await models.workspace.create({ name: 'Test Workspace' });
    await models.workspaceMeta.create({
      parentId: workspace._id,
      openRequestIds: ['req_a'],
    });

    const meta = await models.workspaceMeta.getOrCreateByParentId(workspace._id);
    expect(meta.openRequestIds).toEqual(['req_a']);
  });
});
