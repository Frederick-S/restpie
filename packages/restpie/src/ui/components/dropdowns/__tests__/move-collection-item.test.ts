import { describe, expect, it, jest } from '@jest/globals';

import { buildMoveFolderTree, calculateMoveMetaSortKey } from '../move-collection-item';

const makeGroupChild = (
  id: string,
  name: string,
  parentId: string,
  children: any[] = [],
  ancestors: string[] = [],
) => ({
  doc: {
    _id: id,
    name,
    parentId,
    metaSortKey: 0,
    type: 'RequestGroup',
  },
  children,
  collapsed: false,
  hidden: false,
  pinned: false,
  level: ancestors.length,
  ancestors,
});

const makeRequestChild = (id: string, name: string, parentId: string, ancestors: string[] = []) => ({
  doc: {
    _id: id,
    name,
    parentId,
    metaSortKey: 0,
    type: 'Request',
    method: 'GET',
    url: 'https://example.com',
  },
  children: [],
  collapsed: false,
  hidden: false,
  pinned: false,
  level: ancestors.length,
  ancestors,
});

describe('buildMoveFolderTree', () => {
  it('builds root and folder-only hierarchy', () => {
    const folderB = makeGroupChild('fld_b', 'Folder B', 'fld_a', [], ['ws_1', 'fld_a']);
    const folderA = makeGroupChild('fld_a', 'Folder A', 'ws_1', [folderB], ['ws_1']);
    const looseRequest = makeRequestChild('req_1', 'Req 1', 'ws_1', ['ws_1']);

    const { rootNode, selectedParentId } = buildMoveFolderTree({
      requestTree: [folderA, looseRequest] as any,
      currentParentId: 'fld_b',
      workspaceId: 'ws_1',
      workspaceName: 'Workspace One',
    });

    expect(rootNode.id).toBe('ws_1');
    expect(rootNode.name).toBe('Workspace Root (Workspace One)');
    expect(rootNode.children.map(node => node.id)).toEqual(['fld_a']);
    expect(rootNode.children[0].children.map(node => node.id)).toEqual(['fld_b']);
    expect(selectedParentId).toBe('fld_b');
  });

  it('excludes moving folder and descendants', () => {
    const folderB = makeGroupChild('fld_b', 'Folder B', 'fld_a', [], ['ws_1', 'fld_a']);
    const folderA = makeGroupChild('fld_a', 'Folder A', 'ws_1', [folderB], ['ws_1']);
    const folderC = makeGroupChild('fld_c', 'Folder C', 'ws_1', [], ['ws_1']);

    const { rootNode, selectedParentId } = buildMoveFolderTree({
      requestTree: [folderA, folderC] as any,
      currentParentId: 'fld_a',
      workspaceId: 'ws_1',
      workspaceName: 'Workspace One',
      movingRequestGroupId: 'fld_a',
    });

    expect(rootNode.children.map(node => node.id)).toEqual(['fld_c']);
    expect(selectedParentId).toBe('ws_1');
  });

  it('falls back to workspace root when current parent is invalid', () => {
    const folderA = makeGroupChild('fld_a', 'Folder A', 'ws_1', [], ['ws_1']);

    const { selectedParentId } = buildMoveFolderTree({
      requestTree: [folderA] as any,
      currentParentId: 'missing_parent',
      workspaceId: 'ws_1',
      workspaceName: 'Workspace One',
    });

    expect(selectedParentId).toBe('ws_1');
  });
});

describe('calculateMoveMetaSortKey', () => {
  it('returns -Date.now() when destination is empty', () => {
    const nowSpy = jest.spyOn(Date, 'now').mockReturnValue(12345);
    const collection = [makeGroupChild('fld_a', 'Folder A', 'ws_1')] as any;

    const metaSortKey = calculateMoveMetaSortKey(collection, 'empty_parent');

    expect(metaSortKey).toBe(-12345);
    nowSpy.mockRestore();
  });

  it('returns before-first-child sort key when destination has children', () => {
    const collection = [
      {
        ...makeRequestChild('req_1', 'Req 1', 'parent_1'),
        doc: { ...makeRequestChild('req_1', 'Req 1', 'parent_1').doc, metaSortKey: 500 },
      },
      {
        ...makeRequestChild('req_2', 'Req 2', 'parent_1'),
        doc: { ...makeRequestChild('req_2', 'Req 2', 'parent_1').doc, metaSortKey: 100 },
      },
      {
        ...makeRequestChild('req_3', 'Req 3', 'other_parent'),
        doc: { ...makeRequestChild('req_3', 'Req 3', 'other_parent').doc, metaSortKey: 1 },
      },
    ] as any;

    const metaSortKey = calculateMoveMetaSortKey(collection, 'parent_1');

    expect(metaSortKey).toBe(0);
  });
});
