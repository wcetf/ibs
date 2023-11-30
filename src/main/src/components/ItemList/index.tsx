import { useEffect, useMemo, useRef, useState } from 'react';
import { useRecoilValue } from 'recoil';
import { List, AutoSizer } from 'react-virtualized';
import { Button, Divider } from '@arco-design/web-react';
import { itemsState, currentFolderIdState, currentSiteHomeUrlState, syncState } from '../../state/sync';
import { outlink } from '../../../../common/url';
import Column from '../Column';
import Item from './Item';
import { IconArrowUp, IconEmpty } from '@arco-design/web-react/icon';

export default function ItemList() {
  const items = useRecoilValue(itemsState);
  const info = useRecoilValue(syncState);
  const currentFolderId = useRecoilValue(currentFolderIdState);
  const currentHomeUrl = useRecoilValue(currentSiteHomeUrlState);
  const emptyDesc = useMemo(() => {
    if (items[0].length || items[1].length) return '';
    if (!currentHomeUrl) return 'No updates yet.';
    const sync = info.syncs.get(currentHomeUrl || '');
    if (!sync) return 'Synchronization for this site is not yet prepared.';
    if (sync.invalid) return 'The content feed for this site could not be found.';
    if (sync.failed) return `Failed to synchronize with error: ${sync.failedReason}`;
    return '';
  }, [items, info, currentHomeUrl]);
  const [toTopVisible, setToTopVisible] = useState(false);
  const list = useRef<List | null>();

  useEffect(() => {
    list.current?.recomputeRowHeights();
  }, [items]);

  if (emptyDesc) {
    return (
      <Column title='RECENT UPDATES'>
        <div className='flex flex-col items-center justify-center h-full'>
          <IconEmpty fontSize={48} className='opacity-50' />
          <div className='mt-2 text-sm text-center opacity-50'>{emptyDesc}</div>
          {currentHomeUrl && (
            <Button
              className='mt-4 opacity-70'
              type='secondary'
              href={outlink(currentHomeUrl)}
              target='_blank'
              rel='noopener noreferrer'
            >
              Open Site Home
            </Button>
          )}
        </div>
      </Column>
    );
  }

  return (
    <Column title='RECENT UPDATES' scrollResetKey={`${currentFolderId}:${currentHomeUrl}`}>
      <div className='relative h-full'>
        <AutoSizer>
          {({ width, height }) => (
            <List
              ref={ref => list.current = ref}
              width={width}
              height={height}
              rowCount={(items[0].length ? items[0].length + 1 : 0) + items[1].length}
              rowHeight={({ index }) => {
                if (index < items[0].length) {
                  return items[0][index].description ? 96 : 72;
                }
                if (index && index === items[0].length) {
                  return 48;
                }
                return items[1][index-items[0].length+(items[0].length ? 1 : 0)].description ? 96 : 72 
              }}
              rowRenderer={({ index, key, style }) => (
                (index && index === items[0].length) ? (
                  <div key={key} style={style} className='flex items-center px-6 opacity-30'>
                    <Divider className='truncate'></Divider>
                  </div>
                ) : (
                  <Item
                    key={key}
                    item={items[0][index] || items[1][index-items[0].length+(items[0].length ? 1 : 0)]}
                    style={style}
                  />
                )
              )}
              onScroll={({ scrollTop }) => {
                setToTopVisible(scrollTop > 2000);
              }}
            />
          )}
        </AutoSizer>
        <Button
          className='absolute z-10 shadow transition-all duration-300'
          style={{
            right: 32,
            bottom: toTopVisible ? 32 : -64,
            opacity: toTopVisible ? 1 : 0,
          }}
          title='Scroll to top'
          type='primary' 
          shape='circle'
          size='large'
          iconOnly
          icon={<IconArrowUp />}
          onClick={() => list.current?.scrollToRow(0)}
        />
      </div>
    </Column>
  );
}