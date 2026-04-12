import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import { globalBeforeEach } from '../../../__jest__/before-each';
import * as models from '../../../models';

jest.mock('react-router-dom', () => ({
  redirect: (url: string) => ({ __redirect: url }),
}));

// eslint-disable-next-line -- must import after jest.mock is declared (hoisted at runtime)
import { loader, deleteRequestAction } from '../request';

const dummyRequest = {} as any;

const mockFormData = (entries: Record<string, string>) => ({
  formData: async () => ({
    get: (key: string) => entries[key] ?? null,
  }),
});

describe('request loader openRequestIds', () => {
  beforeEach(globalBeforeEach);

  const makeParams = (workspaceId: string, requestId: string) => ({
    organizationId: 'org_1',
    projectId: 'proj_1',
    workspaceId,
    requestId,
  });

  it('adds requestId to openRequestIds on first visit', async () => {
    const workspace = await models.workspace.create({ name: 'Test' });
    await models.workspaceMeta.create({ parentId: workspace._id });
    const req = await models.request.create({ parentId: workspace._id, name: 'My Request' });
    await models.settings.getOrCreate();

    await loader({ params: makeParams(workspace._id, req._id), request: dummyRequest });

    const updatedMeta = await models.workspaceMeta.getByParentId(workspace._id);
    expect(updatedMeta?.openRequestIds).toContain(req._id);
    expect(updatedMeta?.activeRequestId).toBe(req._id);
  });

  it('does not duplicate requestId if already present', async () => {
    const workspace = await models.workspace.create({ name: 'Test' });
    const req = await models.request.create({ parentId: workspace._id, name: 'My Request' });
    await models.workspaceMeta.create({
      parentId: workspace._id,
      openRequestIds: [req._id],
    });
    await models.settings.getOrCreate();

    await loader({ params: makeParams(workspace._id, req._id), request: dummyRequest });

    const updatedMeta = await models.workspaceMeta.getByParentId(workspace._id);
    expect(updatedMeta?.openRequestIds).toEqual([req._id]);
  });

  it('appends new requestId without reordering existing ones', async () => {
    const workspace = await models.workspace.create({ name: 'Test' });
    const req1 = await models.request.create({ parentId: workspace._id, name: 'First' });
    const req2 = await models.request.create({ parentId: workspace._id, name: 'Second' });
    const req3 = await models.request.create({ parentId: workspace._id, name: 'Third' });
    await models.workspaceMeta.create({
      parentId: workspace._id,
      openRequestIds: [req1._id, req2._id],
    });
    await models.settings.getOrCreate();

    await loader({ params: makeParams(workspace._id, req3._id), request: dummyRequest });

    const updatedMeta = await models.workspaceMeta.getByParentId(workspace._id);
    expect(updatedMeta?.openRequestIds).toEqual([req1._id, req2._id, req3._id]);
  });

  it('preserves tab order when revisiting an existing request', async () => {
    const workspace = await models.workspace.create({ name: 'Test' });
    const req1 = await models.request.create({ parentId: workspace._id, name: 'First' });
    const req2 = await models.request.create({ parentId: workspace._id, name: 'Second' });
    const req3 = await models.request.create({ parentId: workspace._id, name: 'Third' });
    await models.workspaceMeta.create({
      parentId: workspace._id,
      openRequestIds: [req1._id, req2._id, req3._id],
    });
    await models.settings.getOrCreate();

    await loader({ params: makeParams(workspace._id, req1._id), request: dummyRequest });

    const updatedMeta = await models.workspaceMeta.getByParentId(workspace._id);
    expect(updatedMeta?.openRequestIds).toEqual([req1._id, req2._id, req3._id]);
  });

  it('handles missing openRequestIds gracefully', async () => {
    const workspace = await models.workspace.create({ name: 'Test' });
    const req = await models.request.create({ parentId: workspace._id, name: 'My Request' });
    const meta = await models.workspaceMeta.create({ parentId: workspace._id });
    await models.workspaceMeta.update(meta, { openRequestIds: undefined as any });
    await models.settings.getOrCreate();

    await loader({ params: makeParams(workspace._id, req._id), request: dummyRequest });

    const updatedMeta = await models.workspaceMeta.getByParentId(workspace._id);
    expect(updatedMeta?.openRequestIds).toEqual([req._id]);
  });
});

describe('deleteRequestAction openRequestIds', () => {
  beforeEach(globalBeforeEach);

  const makeDeleteArgs = (workspaceId: string, requestId: string) => ({
    params: {
      organizationId: 'org_1',
      projectId: 'proj_1',
      workspaceId,
    },
    request: mockFormData({ id: requestId }),
  });

  it('removes deleted request from openRequestIds', async () => {
    const workspace = await models.workspace.create({ name: 'Test' });
    const req1 = await models.request.create({ parentId: workspace._id, name: 'First' });
    const req2 = await models.request.create({ parentId: workspace._id, name: 'Second' });
    await models.workspaceMeta.create({
      parentId: workspace._id,
      activeRequestId: req1._id,
      openRequestIds: [req1._id, req2._id],
    });

    await deleteRequestAction(makeDeleteArgs(workspace._id, req2._id));

    const updatedMeta = await models.workspaceMeta.getByParentId(workspace._id);
    expect(updatedMeta?.openRequestIds).toEqual([req1._id]);
  });

  it('removes active request and redirects', async () => {
    const workspace = await models.workspace.create({ name: 'Test' });
    const req1 = await models.request.create({ parentId: workspace._id, name: 'First' });
    const req2 = await models.request.create({ parentId: workspace._id, name: 'Second' });
    await models.workspaceMeta.create({
      parentId: workspace._id,
      activeRequestId: req1._id,
      openRequestIds: [req1._id, req2._id],
    });

    const result = await deleteRequestAction(makeDeleteArgs(workspace._id, req1._id));

    expect(result).toEqual({ __redirect: expect.stringContaining('/debug') });

    const updatedMeta = await models.workspaceMeta.getByParentId(workspace._id);
    expect(updatedMeta?.openRequestIds).toEqual([req2._id]);
    expect(updatedMeta?.activeRequestId).toBeNull();
  });

  it('clears openRequestIds when last request is deleted', async () => {
    const workspace = await models.workspace.create({ name: 'Test' });
    const req = await models.request.create({ parentId: workspace._id, name: 'Only' });
    await models.workspaceMeta.create({
      parentId: workspace._id,
      activeRequestId: req._id,
      openRequestIds: [req._id],
    });

    await deleteRequestAction(makeDeleteArgs(workspace._id, req._id));

    const updatedMeta = await models.workspaceMeta.getByParentId(workspace._id);
    expect(updatedMeta?.openRequestIds).toEqual([]);
  });

  it('preserves order of remaining tabs after deletion', async () => {
    const workspace = await models.workspace.create({ name: 'Test' });
    const req1 = await models.request.create({ parentId: workspace._id, name: 'First' });
    const req2 = await models.request.create({ parentId: workspace._id, name: 'Second' });
    const req3 = await models.request.create({ parentId: workspace._id, name: 'Third' });
    await models.workspaceMeta.create({
      parentId: workspace._id,
      activeRequestId: req1._id,
      openRequestIds: [req1._id, req2._id, req3._id],
    });

    await deleteRequestAction(makeDeleteArgs(workspace._id, req2._id));

    const updatedMeta = await models.workspaceMeta.getByParentId(workspace._id);
    expect(updatedMeta?.openRequestIds).toEqual([req1._id, req3._id]);
  });
});
