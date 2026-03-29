import { describe, expect, it, jest } from '@jest/globals';
import { fireEvent, render, screen, within } from '@testing-library/react';
import React from 'react';

import { MoveCollectionItemModal } from '../move-collection-item-modal';

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

const baseProps = {
  title: 'Move Request',
  workspaceId: 'ws_1',
  workspaceName: 'Workspace One',
  currentParentId: 'fld_a',
  onMove: jest.fn(),
  onHide: jest.fn(),
};

describe('<MoveCollectionItemModal />', () => {
  it('renders hierarchical folder tree and excludes request nodes', () => {
    const folderB = makeGroupChild('fld_b', 'Folder B', 'fld_a', [], ['ws_1', 'fld_a']);
    const folderA = makeGroupChild('fld_a', 'Folder A', 'ws_1', [folderB], ['ws_1']);
    const requestNode = makeRequestChild('req_1', 'My Request', 'ws_1', ['ws_1']);

    render(
      <MoveCollectionItemModal
        {...baseProps}
        requestTree={[folderA, requestNode] as any}
      />,
    );

    expect(screen.getByText('Workspace Root (Workspace One)')).toBeInTheDocument();
    expect(screen.getByText('Folder A')).toBeInTheDocument();
    expect(screen.getByText('Folder B')).toBeInTheDocument();
    expect(screen.queryByText('My Request')).not.toBeInTheDocument();
  });

  it('collapses and expands folder children', () => {
    const folderB = makeGroupChild('fld_b', 'Folder B', 'fld_a', [], ['ws_1', 'fld_a']);
    const folderA = makeGroupChild('fld_a', 'Folder A', 'ws_1', [folderB], ['ws_1']);

    render(
      <MoveCollectionItemModal
        {...baseProps}
        requestTree={[folderA] as any}
      />,
    );

    const folderRow = screen.getByText('Folder A').closest('li');
    expect(folderRow).toBeTruthy();
    const folderToggle = within(folderRow as HTMLElement).getByLabelText('Collapse folder');
    fireEvent.click(folderToggle);
    expect(screen.queryByText('Folder B')).not.toBeInTheDocument();

    const expandToggle = within(folderRow as HTMLElement).getByLabelText('Expand folder');
    fireEvent.click(expandToggle);
    expect(screen.getByText('Folder B')).toBeInTheDocument();
  });

  it('enables move when destination changes and calls onMove', () => {
    const onMove = jest.fn();
    const folderB = makeGroupChild('fld_b', 'Folder B', 'ws_1', [], ['ws_1']);
    const folderA = makeGroupChild('fld_a', 'Folder A', 'ws_1', [], ['ws_1']);

    render(
      <MoveCollectionItemModal
        {...baseProps}
        onMove={onMove}
        requestTree={[folderA, folderB] as any}
      />,
    );

    const moveButton = screen.getByRole('button', { name: 'Move' });
    expect(moveButton).toBeDisabled();

    fireEvent.click(screen.getByRole('button', { name: 'Folder B' }));
    expect(moveButton).not.toBeDisabled();

    fireEvent.click(moveButton);
    expect(onMove).toHaveBeenCalledWith('fld_b');
  });
});
