import { useMemo } from 'react';
import { useRecoilState, useRecoilValue } from 'recoil';
import { folderTreeState, currentFolderIdState } from '../../state/sync';
import Column from '../Column';
import Node from './Node';
import NodeContent from './NodeContent';

export default function FolderList() {
  const tree = useRecoilValue(folderTreeState);
  const [currentFolderId, setCurrentFolderId] = useRecoilState(currentFolderIdState);
  const unreadCount = useMemo(() => tree.reduce((acc, node) => acc + node.unreadCount, 0), [tree]);

  return (
    <Column title='FOLDERS' resizeKey='folder' defaultWidth={300}>
      <div className='h-full overflow-y-auto'>
        <NodeContent
          title='All Folders'
          selected={currentFolderId === undefined}
          unreadCount={unreadCount}
          special={true}
          onClick={() => setCurrentFolderId(undefined)}
        />
        {tree.map((node) => <Node key={node.id} node={node} level={0} />)}
      </div>
    </Column>
  );
}
