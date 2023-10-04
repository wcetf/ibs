import { atom, selector, RecoilEnv } from 'recoil';
import { SyncInfo, Site, Folder, Synchronization, NotificationPolicy, isSilent } from '../../../common/model';
import { ExItem, ExSite, FolderNode } from '../model/sync';

RecoilEnv.RECOIL_DUPLICATE_ATOM_KEY_CHECKING_ENABLED = false;

export const syncState = atom<SyncInfo>({
  key: 'sync:info',
  default: {
    folders: new Map<string, Folder>(),
    sites: new Map<string, Site>(),
    syncs: new Map<string, Synchronization>(),
    readAt: new Date(),
  },
});

export const currentFolderIdState = atom<string | undefined>({
  key: 'sync:folder:current:id',
  default: undefined,
});

export const currentFolderState = selector<Folder | undefined>({
  key: 'sync:folder:current',
  get({ get }) {
    const info = get(syncState);
    const currentFolderId = get(currentFolderIdState);
    return currentFolderId === undefined ? undefined : info.folders.get(currentFolderId);
  },
  cachePolicy_UNSTABLE: {
    eviction: 'most-recent',
  },
});

export const folderTreeState = selector<FolderNode[]>({
  key: 'sync:folder:tree',
  get({ get }) {
    const info = get(syncState);
    const childrenMap = new Map<string, Folder[]>();
    info.folders.forEach(folder => {
      if (!folder.id || folder.id === '0') return;
      const children = childrenMap.get(folder.parentId) || [];
      children.push(folder);
      children.sort((a, b) => a.index - b.index);
      childrenMap.set(folder.parentId, children);
    });
    const rootFolders = childrenMap.get('0') || [];
    const unreadCountsMap = new Map<string, Map<string, number>>();
    info.syncs.forEach(sync => {
      const site = info.sites.get(sync.homeUrl);
      if (!site) return;
      for (const folderId of Array.from(site.folderIds)) {
        const counts = unreadCountsMap.get(folderId) || new Map<string, number>();
        counts.set(site.homeUrl, getSyncUnreadCount(sync, info.readAt));
        unreadCountsMap.set(folderId, counts);
      }
    });
    fillFolderUnreadCountsMap(rootFolders, childrenMap, unreadCountsMap);
    return resolveFolderNodes(rootFolders, childrenMap, unreadCountsMap, info.readAt);
  },
});

function fillFolderUnreadCountsMap(
  folders: Folder[], 
  childrenMap: Map<string, Folder[]>, 
  unreadCountsMap: Map<string, Map<string, number>>) {
  for (const folder of folders) {
    const counts = unreadCountsMap.get(folder.id) || new Map<string, number>();
    const children = childrenMap.get(folder.id) || [];
    fillFolderUnreadCountsMap(children, childrenMap, unreadCountsMap);
    for (const child of childrenMap.get(folder.id) || []) {
      unreadCountsMap.get(child.id)?.forEach((count, homeUrl) => {
        counts.set(homeUrl, count);
      });
    }
    unreadCountsMap.set(folder.id, counts);
  }
}

function resolveFolderNodes(
  folders: Folder[], 
  childrenMap: Map<string, Folder[]>, 
  unreadCountsMap: Map<string, Map<string, number>>,
  readAt: Date): FolderNode[] {
  const nodes: FolderNode[] = [];
  for (const folder of folders) {
    const children = resolveFolderNodes(childrenMap.get(folder.id) || [], childrenMap, unreadCountsMap, readAt);
    let unreadCount = 0;
    unreadCountsMap.get(folder.id)?.forEach(count => {
      unreadCount += count;
    });
    const node: FolderNode = {
      ...folder,
      unreadCount,
      lastPublishedAt: undefined,
      children,
    };
    for (const child of children) {
      if (!node.lastPublishedAt || node.lastPublishedAt.getTime() < child.lastPublishedAt!.getTime()) {
        node.lastPublishedAt = child.lastPublishedAt;
      }
    }
    nodes.push(node);
  }
  return nodes;
}

export const currentSiteHomeUrlState = atom<string | undefined>({
  key: 'sync:site:current:homeUrl',
  default: undefined,
});

export const currentSiteState = selector<Site | undefined>({
  key: 'sync:site:current',
  get({ get }) {
    const info = get(syncState);
    const currentSiteHomeUrl = get(currentSiteHomeUrlState);
    return currentSiteHomeUrl === undefined ? undefined : info.sites.get(currentSiteHomeUrl);
  },
  cachePolicy_UNSTABLE: {
    eviction: 'most-recent',
  },
});

export const sitesState = selector<ExSite[]>({
  key: 'sync:sites',
  get({ get }) {
    const info = get(syncState);
    const currentFolder = get(currentFolderState);
    
    let sites: Site[] = Array.from(info.sites.values());
    if (currentFolder) {
      const folderIds = fillSubFolderIds(currentFolder, info.folders, new Set([currentFolder.id]));
      sites = sites.filter(s => isInFolders(s, folderIds));
    }

    const list = sites.map<ExSite>(site => ({
      ...site,
      sync: info.syncs.get(site.homeUrl),
      unreadCount: getSyncUnreadCount(info.syncs.get(site.homeUrl), info.readAt),
      lastPublishedAt: getSyncLastPublishedAt(info.syncs.get(site.homeUrl)),
    }));

    list.sort((a, b) => {
      if (!a.sync && b.sync) return 1;
      if (a.sync && !b.sync) return -1;
      if (!a.sync && !b.sync) return 0;

      if (a.sync!.invalid && !b.sync!.invalid) return 1;
      if (!a.sync!.invalid && b.sync!.invalid) return -1;

      if (!a.sync!.items.length && b.sync!.items.length) return 1;
      if (a.sync!.items.length && !b.sync!.items.length) return -1;

      if (isSilent(a.sync!) && !isSilent(b.sync!)) return 1;
      if (!isSilent(a.sync!) && isSilent(b.sync!)) return -1;

      if (!a.unreadCount && b.unreadCount) return 1;
      if (a.unreadCount && !b.unreadCount) return -1;

      return compareDate(b.lastPublishedAt, a.lastPublishedAt);
    });

    return list;
  },
  cachePolicy_UNSTABLE: {
    eviction: 'most-recent',
  },
});

function fillSubFolderIds(folder: Folder, folders: Map<string, Folder>, idSet: Set<string>): Set<string> {
  folders.forEach(d => {
    if (d.parentId === folder.id) {
      idSet.add(d.id);
      fillSubFolderIds(d, folders, idSet);
    }
  });
  return idSet;
}

function isInFolders(site: Site, folderIds: Set<string>): boolean {
  for (const id of Array.from(site.folderIds)) {
    if (folderIds.has(id)) {
      return true;
    }
  }
  return false;
}

function getSyncUnreadCount(sync: Synchronization | undefined, readAt: Date): number {
  if (!sync || isSilent(sync)) return 0;
  return sync.items.reduce((sum, i) => sum + (i.detectedAt > readAt ? 1 : 0), 0);
}

function getSyncLastPublishedAt(sync: Synchronization | undefined): Date | undefined {
  let at: Date | undefined;
  for (const item of sync?.items || []) {
    if (!at || at.getTime() < item.publishedAt.getTime()) {
      at = item.publishedAt;
    }
  }
  return at;
}

export const itemsState = selector<[ExItem[], ExItem[]]>({
  key: 'sync:items',
  get({ get }) {
    const info = get(syncState);
    const currentSite = get(currentSiteState);
    const sites = get(sitesState);


    if (currentSite) {
      const sync = info.syncs.get(currentSite.homeUrl);
      const items = (sync?.items || []).map<ExItem>(item => ({
        ...item,
        sync: sync!,
        site: currentSite,
      }));
      items.sort((a, b) => compareDate(b.publishedAt, a.publishedAt));
      return [[], items];
    }

    const items: ExItem[] = [];
    for (const site of sites) {
      const sync = info.syncs.get(site.homeUrl);
      for (const item of sync?.items || []) {
        items.push({
          ...item,
          sync: sync!,
          site,
        });
      }
    }
    return splitCrossSiteItems(items, info.readAt);
  },
  cachePolicy_UNSTABLE: {
    eviction: 'most-recent',
  },
});

function splitCrossSiteItems(items: ExItem[], readAt: Date): [ExItem[], ExItem[]] {
  let startTime = new Date(Date.now() - 1000 * 60 * 60 * 24);
  startTime = readAt < startTime ? readAt : startTime;
  const notified = items.filter(item => !isSilent(item.sync) && item.detectedAt > startTime);
  notified.sort((a, b) => compareDate(b.detectedAt, a.detectedAt) || compareDate(b.publishedAt, a.publishedAt));

  const notifiedUrls = new Set(notified.map(item => item.url));
  let others = items.filter(item => !notifiedUrls.has(item.url));
  others.sort((a, b) => compareDate(b.detectedAt, a.detectedAt) || compareDate(b.publishedAt, a.publishedAt));
  others = limitSameSiteItems(others, 3);

  return [notified, others];
}

function compareDate(a: Date | undefined, b: Date | undefined): number {
  if (!a && !b) return 0;
  if (!a) return -1;
  if (!b) return 1;
  return a.getTime() - b.getTime();
}

function limitSameSiteItems(items: ExItem[], max: number): ExItem[] {
  const counts = new Map<string, number>();
  const result: ExItem[] = [];
  for (const item of items) {
    const c = counts.get(item.site.homeUrl) || 0;
    if (c < max) {
      counts.set(item.site.homeUrl, c + 1);
      result.push(item);
    }
  }
  return result;
}

export const notificationPoliciesState = atom<NotificationPolicy[]>({
  key: 'sync:notification:policy',
  default: [],
});
