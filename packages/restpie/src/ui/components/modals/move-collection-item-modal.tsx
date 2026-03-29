import React, { useEffect, useMemo, useRef, useState } from 'react';
import { OverlayContainer } from 'react-aria';

import { Child } from '../../routes/workspace';
import { Modal, ModalHandle, ModalProps } from '../base/modal';
import { ModalBody } from '../base/modal-body';
import { ModalFooter } from '../base/modal-footer';
import { ModalHeader } from '../base/modal-header';
import { buildMoveFolderTree, MoveFolderNode } from '../dropdowns/move-collection-item';
import { Icon } from '../icon';

interface Props extends ModalProps {
  title: string;
  workspaceId: string;
  workspaceName: string;
  requestTree: Child[];
  currentParentId: string;
  movingRequestGroupId?: string;
  onMove: (parentId: string) => void;
}

const INDENTATION_PX = 16;

export const MoveCollectionItemModal = ({
  title,
  workspaceId,
  workspaceName,
  requestTree,
  currentParentId,
  movingRequestGroupId,
  onMove,
  onHide,
}: Props) => {
  const modalRef = useRef<ModalHandle>(null);
  const [selectedParentId, setSelectedParentId] = useState(workspaceId);
  const [collapsedState, setCollapsedState] = useState<Record<string, boolean>>({});
  const { rootNode, selectedParentId: defaultSelectedParentId } = useMemo(() =>
    buildMoveFolderTree({
      requestTree,
      currentParentId,
      workspaceId,
      workspaceName,
      movingRequestGroupId,
    }), [
      requestTree,
      currentParentId,
      workspaceId,
      workspaceName,
      movingRequestGroupId,
    ]);

  useEffect(() => {
    modalRef.current?.show();
  }, []);

  useEffect(() => {
    setSelectedParentId(defaultSelectedParentId);
  }, [defaultSelectedParentId]);

  const setNodeCollapsed = (nodeId: string, isCollapsed: boolean) =>
    setCollapsedState(state => ({
      ...state,
      [nodeId]: isCollapsed,
    }));

  const renderNode = (node: MoveFolderNode, depth: number) => {
    const isCollapsed = Boolean(collapsedState[node.id]);
    const hasChildren = node.children.length > 0;
    const isSelected = selectedParentId === node.id;

    return (
      <li key={node.id}>
        <div
          className={`flex items-center gap-2 rounded-sm ${isSelected ? 'bg-[--hl-sm]' : 'hover:bg-[--hl-xs]'}`}
          style={{ paddingLeft: `${depth * INDENTATION_PX}px` }}
        >
          {hasChildren ? (
            <button
              aria-label={isCollapsed ? 'Expand folder' : 'Collapse folder'}
              className="w-6 h-6 flex items-center justify-center text-[--color-font] hover:bg-[--hl-sm] rounded-sm transition-colors"
              onClick={() => setNodeCollapsed(node.id, !isCollapsed)}
            >
              <Icon icon={isCollapsed ? 'caret-right' : 'caret-down'} className="w-3 h-3" />
            </button>
          ) : (
            <span className="w-6 h-6" />
          )}
          <button
            className="flex-1 text-left h-8 pr-2 text-[--color-font]"
            onClick={() => setSelectedParentId(node.id)}
          >
            {node.name}
          </button>
        </div>
        {!isCollapsed && hasChildren ? (
          <ul className="space-y-1">
            {node.children.map(child => renderNode(child, depth + 1))}
          </ul>
        ) : null}
      </li>
    );
  };

  const moveDisabled = !selectedParentId || selectedParentId === currentParentId;

  return (
    <OverlayContainer onClick={e => e.stopPropagation()}>
      <Modal ref={modalRef} tall onHide={onHide}>
        <ModalHeader>{title}</ModalHeader>
        <ModalBody>
          <p className="pad-bottom">Select destination folder.</p>
          <div className="border border-solid border-[--hl-sm] rounded-md p-2 max-h-[50vh] overflow-auto">
            <ul className="space-y-1">
              {renderNode(rootNode, 0)}
            </ul>
          </div>
        </ModalBody>
        <ModalFooter>
          <div>
            <button className="btn" onClick={() => modalRef.current?.hide()}>
              Cancel
            </button>
            <button
              className="btn"
              disabled={moveDisabled}
              onClick={() => {
                if (!moveDisabled) {
                  onMove(selectedParentId);
                  modalRef.current?.hide();
                }
              }}
            >
              Move
            </button>
          </div>
        </ModalFooter>
      </Modal>
    </OverlayContainer>
  );
};
