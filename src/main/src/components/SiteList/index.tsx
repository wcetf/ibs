import { useEffect, useMemo, useRef, useState } from 'react';
import { useRecoilState, useRecoilValue } from 'recoil';
import { List, AutoSizer } from 'react-virtualized';
import { sitesState, currentSiteHomeUrlState, currentFolderIdState } from '../../state/sync';
import Column from '../Column';
import Site from './Site';

export default function SiteList() {
  const sites = useRecoilValue(sitesState);
  const currentFolderId = useRecoilValue(currentFolderIdState);
  const [currentHomeUrl, setCurrentHomeUrl] = useRecoilState(currentSiteHomeUrlState);
  const unreadCount = useMemo(() => sites.reduce((acc, site) => acc + site.unreadCount, 0), [sites]);
  const [scrolling, setScrolling] = useState(false);
  const scrollTimer = useRef<any>();
  const loadedFaviconUrls = useRef(new Set<string>());

  function handleScroll() {
    setScrolling(true);
    clearTimeout(scrollTimer.current);
    scrollTimer.current = setTimeout(() => setScrolling(false), 300);
  }

  useEffect(() => {
    setCurrentHomeUrl(undefined);
  }, [currentFolderId]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Column title='SITES' scrollResetKey={currentFolderId} resizeKey='site' defaultWidth={360}>
      <AutoSizer>
        {({ width, height }) => (
          <List
            width={width}
            height={height}
            rowCount={sites.length + 1}
            rowHeight={({ index }) => 48}
            rowRenderer={({ index, key, style }) => index === 0 ? (
              <Site
                key={key}
                title='All Sites'
                domain=''
                homeUrl=''
                selected={currentHomeUrl === undefined}
                unreadCount={unreadCount}
                style={style}
                onClick={() => setCurrentHomeUrl(undefined)}
              />
            ) : (
              <Site
                key={key}
                title={sites[index-1].sync?.homeTitle || sites[index-1].sync?.title || sites[index-1].domain}
                domain={sites[index-1].domain}
                homeUrl={sites[index-1].homeUrl}
                faviconUrl={sites[index-1].sync?.faviconUrl}
                selected={currentHomeUrl === sites[index-1].homeUrl}
                empty={sites[index-1].sync?.items.length === 0}
                failed={sites[index-1].sync?.failed}
                unreadCount={sites[index-1].unreadCount}
                style={style}
                freezing={scrolling}
                loadedFaviconUrls={loadedFaviconUrls.current}
                onClick={() => setCurrentHomeUrl(sites[index-1].homeUrl)}
              />
            )}
            onScroll={handleScroll}
          />
        )}
      </AutoSizer>
    </Column>
  );
}
