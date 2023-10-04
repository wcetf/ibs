import { useEffect, useRef, useState } from 'react';
import { useRecoilState } from 'recoil';
import {
  toBackground,
  initMessageHandlers,
  MSG_GET_SYNC_INFO,
  MSG_SYNC_INFO_UPDATED,
  MSG_UNREAD,
  MSG_SET_READ_AT,
  MSG_NOTIFICATION_POLICIES_UPDATED,
  MSG_GET_NOTIFICATION_POLICIES,
} from '../../common/message';
import { SyncInfo } from '../../common/model';
import { syncState, notificationPoliciesState } from './state/sync';
import FolderList from './components/FolderList';
import SiteList from './components/SiteList';
import ItemList from './components/ItemList';
import Header from './components/Header';
import Init from './components/Init';

export default function App() {
  const [, setSync] = useRecoilState(syncState);
  const [, setNotificationPolicies] = useRecoilState(notificationPoliciesState);
  const [reloadButtonVisible, setReloadButtonVisible] = useState(false);
  const [inited, setInited] = useState(false);
  const [ready, setReady] = useState(false);
  const snapshot = useRef<SyncInfo | null>();

  async function load() {
    const [info, policies] = await Promise.all([
      toBackground(MSG_GET_SYNC_INFO),
      toBackground(MSG_GET_NOTIFICATION_POLICIES),
    ]);
    snapshot.current = info;
    setSync(info);
    setNotificationPolicies(policies);
    setReady(true);
    toBackground(MSG_SET_READ_AT, currReadAt(info));
  }

  function currReadAt(info: SyncInfo) {
    return Array.from(info.syncs.values()).reduce((acc, sync) => {
      return sync.detectedAt > acc ? sync.detectedAt : acc;
    }, info.readAt);
  }

  async function refresh() {
    const info = await toBackground(MSG_GET_SYNC_INFO);
    if (snapshot.current) {
      info.readAt = snapshot.current.readAt;
      info.syncs = snapshot.current.syncs;
    };
    setSync(info);
    setReady(true);
  }

  useEffect(() => {
    if (localStorage.getItem('inited') === 'true') {
      setInited(true);
      load();
    }
    return initMessageHandlers({
      [MSG_SYNC_INFO_UPDATED]: async (afterDetection: boolean) => {
        await refresh();
      },
      [MSG_NOTIFICATION_POLICIES_UPDATED]: async () => {
        setNotificationPolicies(await toBackground(MSG_GET_NOTIFICATION_POLICIES));
        await refresh();
      },
      [MSG_UNREAD]: async (count: number) => {
        if (count > 0) {
          setReloadButtonVisible(true);
        }
      },
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function handleInited() {
    localStorage.setItem('inited', 'true');
    setInited(true);
    load();
  }

  return (
    <div className='flex flex-col h-screen overflow-hidden bg-[var(--color-fill-1)]'>
      {ready && (
        <>
          <div className='flex-none'>
            <Header showReloadButton={reloadButtonVisible} />
          </div>
          <div className='flex-auto flex p-2 min-h-0'>
            <div className='flex-none p-2'>
              <FolderList />
            </div>
            <div className='flex-none p-2'>
              <SiteList />
            </div>
            <div className='flex-auto p-2'>
              <ItemList />
            </div>
          </div>
        </>
      )}
      {!inited && (
        <Init onInited={handleInited} />
      )}
    </div>
  );
}
