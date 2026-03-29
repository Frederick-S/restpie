import { describe, expect, it, jest } from '@jest/globals';
import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';

import { RequestActionsDropdown } from '../request-actions-dropdown';

const mockPatchRequest = jest.fn();
const mockPatchRequestMeta = jest.fn();

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
  useRequestMetaPatcher: () => mockPatchRequestMeta,
  useRequestSetter: () => mockPatchRequest,
}));

jest.mock('../../../../plugins', () => ({
  getRequestActions: async () => [],
}));

jest.mock('../../../routes/root', () => ({}));
jest.mock('../../../routes/workspace', () => ({}));

jest.mock('../../modals/move-collection-item-modal', () => ({
  MoveCollectionItemModal: ({ onMove, onHide }: any) => (
    <div>
      <button onClick={() => onMove('dest_parent')}>Confirm Move</button>
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
            request_showGenerateCodeEditor: null,
            request_showSettings: null,
          },
        },
      };
    }

    return {
      activeWorkspace: { _id: 'ws_1', name: 'Workspace One' },
      collection: [{
        doc: { _id: 'existing_1', parentId: 'dest_parent', metaSortKey: 100 },
      }],
      requestTree: [],
    };
  },
}));

describe('<RequestActionsDropdown />', () => {
  it('opens move modal and patches request on confirm', () => {
    render(
      <RequestActionsDropdown
        activeEnvironment={{ _id: 'env_1' } as any}
        activeProject={{ _id: 'proj_1' } as any}
        isPinned={false}
        request={{
          _id: 'req_1',
          parentId: 'fld_a',
          name: 'My Request',
          method: 'GET',
          url: 'https://example.com',
          type: 'Request',
        } as any}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Move' }));
    fireEvent.click(screen.getByRole('button', { name: 'Confirm Move' }));

    expect(mockPatchRequest).toHaveBeenCalledWith('req_1', {
      parentId: 'dest_parent',
      metaSortKey: expect.any(Number),
    });
  });
});
