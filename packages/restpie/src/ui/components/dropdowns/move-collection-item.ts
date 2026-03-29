import { isRequestGroup } from '../../../models/request-group';
import { Child } from '../../routes/workspace';

interface BuildMoveFolderTreeParams {
  requestTree: Child[];
  currentParentId: string;
  workspaceId: string;
  workspaceName: string;
  movingRequestGroupId?: string;
}

export interface MoveFolderNode {
  id: string;
  name: string;
  children: MoveFolderNode[];
}

const buildFolderNodes = (items: Child[], movingRequestGroupId?: string): MoveFolderNode[] =>
  items.flatMap(item => {
    const children = buildFolderNodes(item.children, movingRequestGroupId);

    if (!isRequestGroup(item.doc)) {
      return children;
    }

    if (movingRequestGroupId) {
      const isMovedFolder = item.doc._id === movingRequestGroupId;
      const isMovedFolderDescendant = item.ancestors?.includes(movingRequestGroupId);
      if (isMovedFolder || isMovedFolderDescendant) {
        return [];
      }
    }

    return [{
      id: item.doc._id,
      name: item.doc.name,
      children,
    }];
  });

const flattenTreeIds = (rootNode: MoveFolderNode): string[] => [
  rootNode.id,
  ...rootNode.children.flatMap(flattenTreeIds),
];

export const buildMoveFolderTree = ({
  requestTree,
  currentParentId,
  workspaceId,
  workspaceName,
  movingRequestGroupId,
}: BuildMoveFolderTreeParams): { rootNode: MoveFolderNode; selectedParentId: string } => {
  const rootNode = {
    id: workspaceId,
    name: `Workspace Root (${workspaceName})`,
    children: buildFolderNodes(requestTree, movingRequestGroupId),
  };

  const validFolderIds = new Set(flattenTreeIds(rootNode));
  const selectedParentId = validFolderIds.has(currentParentId)
    ? currentParentId
    : workspaceId;

  return {
    rootNode,
    selectedParentId,
  };
};

export const calculateMoveMetaSortKey = (collection: Child[], parentId: string) => {
  const destinationChildren = collection.filter(item => item.doc.parentId === parentId);

  if (!destinationChildren.length) {
    return -1 * Date.now();
  }

  const firstChildMetaSortKey = destinationChildren.reduce(
    (minMetaSortKey, child) => Math.min(minMetaSortKey, child.doc.metaSortKey),
    Number.POSITIVE_INFINITY,
  );

  return firstChildMetaSortKey - 100;
};
