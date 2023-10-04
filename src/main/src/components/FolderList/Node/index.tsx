import { useState } from 'react';
import { useRecoilState } from 'recoil';
import { currentFolderIdState } from '../../../state/sync';
import { FolderNode } from '../../../model/sync';
import NodeContent from '../NodeContent';

export interface Props {
  node: FolderNode;
  level: number;
}

export default function Node({ node, level }: { node: FolderNode, level: number }) {
  const [currentFolderId, setCurrentFolderId] = useRecoilState(currentFolderIdState);
  const [expanded, setExpanded] = useState(node.id === '1');
  return (
    <div>
      <NodeContent
        title={node.title}
        selected={currentFolderId === node.id}
        expanded={expanded}
        canExpand={node.children.length > 0}
        level={level}
        unreadCount={node.unreadCount}
        onClick={() => setCurrentFolderId(node.id)}
        onExpand={() => setExpanded(v => !v)}
      />
      {expanded && (
        <div>
          {node.children.map((node) => <Node key={node.id} node={node} level={level+1} />)}
        </div>
      )}
    </div>
  );
}
