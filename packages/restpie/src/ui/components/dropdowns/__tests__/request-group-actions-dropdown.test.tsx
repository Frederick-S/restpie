import { describe, expect, it, jest } from '@jest/globals';
import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';

import { RequestGroupActionsDropdown } from '../request-group-actions-dropdown';

const mockPatchGroup = jest.fn();

jest.mock('react-aria-components', () => ({
  Button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
  Item: ({ children }: any) => <div>{typeof children === 'function' ? children({}) : children}</div>,
  Menu: ({ items = [], onAction }: any) => (
    <div>
      {items.map((item: any) => (
        <button key={item.id} onClick={() => onAction?.(item.id)}>
          {item.name}
        </button>
      ))}
    </div>
  ),
  MenuTrigger: ({ children }: any) => <div>{children}</div>,
  Popover: ({ children }: any) => <div>{children}</div>,
}));

jest.mock('../../../hooks/use-request', () => ({
  useRequestGroupPatcher: () => mockPatchGroup,
}));

jest.mock('../../../../plugins', () => ({
  getRequestGroupActions: async () => [],
}));

jest.mock('../../../routes/root', () => ({}));
jest.mock('../../../routes/workspace', () => ({}));

jest.mock('../../modals/move-collection-item-modal', () => ({
  MoveCollectionItemModal: ({ onMove, onHide }: any) => (
    <div>
      <button onClick={() => onMove('dest_folder')}>Confirm Move</button>
      <button onClick={onHide}>Close Move Modal</button>
    </div>
  ),
}));

jest.mock('react-router-dom', () => ({
  useFetcher: () => ({ submit: jest.fn() }),
  useParams: () => ({ organizationId: 'org_1', projectId: 'proj_1', workspaceId: 'ws_1' }),
  useRouteLoaderData: (routeId: string) => {
    if (routeId === 'root') {
      return {
        settings: {
          hotKeyRegistry: {
            request_createHTTP: null,
          },
        },
      };
    }

    return {
      activeProject: { _id: 'proj_1' },
      activeWorkspace: { _id: 'ws_1', name: 'Workspace One' },
      collection: [{
        doc: { _id: 'existing_1', parentId: 'dest_folder', metaSortKey: 200 },
      }],
      requestTree: [],
    };
  },
}));

describe('<RequestGroupActionsDropdown />', () => {
  it('opens move modal and patches folder on confirm', () => {
    render(
      <RequestGroupActionsDropdown
        requestGroup={{
          _id: 'fld_a',
          parentId: 'ws_1',
          name: 'Folder A',
          type: 'RequestGroup',
        } as any}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Move' }));
    fireEvent.click(screen.getByRole('button', { name: 'Confirm Move' }));

    expect(mockPatchGroup).toHaveBeenCalledWith('fld_a', {
      parentId: 'dest_folder',
      metaSortKey: expect.any(Number),
    });
  });
});
