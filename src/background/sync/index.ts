import asyncPool from 'tiny-async-pool';
import * as db from './db';
import * as tick from './tick';
import {
  Synchronization,
  Item,
  SyncInfo,
  Site,
  NotificationPolicy,
  Folder,
  NotificationAction,
  isSilent,
} from '../../common/model';
import {
  toPage,
  MSG_SYNC_PROGRESS_UPDATED,
  MSG_SYNC_INFO_UPDATED,
  MSG_UNREAD,
  MSG_NOTIFICATION_POLICIES_UPDATED,
} from '../../common/message';
import { faviconUrlFromBrowser } from '../../common/url';
import { notifyUnread } from '../notification';
import { Feed, getFeed } from './feed';
import { getMeta } from './html';
import { getBookmarkNodes, onBookmarkUpdated } from './bookmark';
import { formSerializable, toSerializable } from '../../common/data';

const CONCURRENCY = 20;
const MAX_ITEMS = 20;

let running = false;

export async function init() {
  await onBookmarkUpdated(handleBookmarkUpdated);
  await tick.init(1, execute);
}

export async function execute() {
  try {
    if (running) return;
    running = true;
    await doExecute();
  } catch (err) {
    console.error(err);
  } finally {
    running = false;
  }
}

async function doExecute() {
  await followBookmark();
  const syncs = await db.getSyncsToDetect();
  if (!syncs.length) return;
  const now = new Date();
  for (const sync of syncs) {
    sync.detectedAt = now;               
  }
  let completed = 0;
  toPage(MSG_SYNC_PROGRESS_UPDATED, 0, syncs.length);
  for await (const _ of asyncPool(CONCURRENCY, syncs, detect)) {
    toPage(MSG_SYNC_PROGRESS_UPDATED, ++completed, syncs.length);
  }
  await notify();
  toPage(MSG_SYNC_INFO_UPDATED, true);
}

async function detect(sync: Synchronization) {
  try {
    if (!sync.feedUrl) {
      const { title, feedUrl, faviconUrl } = await getMeta(sync.homeUrl);
      sync.homeTitle = title;
      sync.feedUrl = feedUrl;
      sync.faviconUrl = faviconUrl;
    }
    if (!sync.feedUrl) {
      sync.invalid = true;
      downgradeIntervalLevel(sync);
      return await saveSync(sync);
    }
    sync.invalid = false;

    const feed = await tryGetFeed(sync);
    await applyNewFeed(sync, feed);

    await saveSync(sync);
  } catch (err) {
    downgradeIntervalLevel(sync);
    await saveFailedSync(sync, err);
  } finally {
    console.log(`sync ${sync.homeUrl} done`, sync);
  }
}

async function tryGetFeed(sync: Synchronization): Promise<Feed> {
  try {
    return await getFeed(sync.feedUrl);
  } catch (err) {
    if (sync.failed) {
      sync.feedUrl = '';
    }
    throw err;
  }
}

async function applyNewFeed(sync: Synchronization, feed: Feed) {
  const newItems = feed.items.slice(0, MAX_ITEMS).map(i => ({
    url: i.url,
    title: i.title,
    description: i.description,
    publishedAt: i.publishedAt,
    detectedAt: sync.detectedAt,
  }));
  const hasNew = hasNewItem(sync.items, newItems);
  if (hasNew) {
    upgradeIntervalLevel(sync);
  } else {
    downgradeIntervalLevel(sync);
  }
  sync.title = feed.title || sync.title;
  sync.description = feed.description;
  sync.items = mergeItems(sync.items, newItems).slice(0, MAX_ITEMS);
}

async function saveFailedSync(sync: Synchronization, error: Error) {
  sync.failed = true;
  sync.failedReason = error.message;
  return db.bacthSaveSyncs([sync]);
}

async function saveSync(sync: Synchronization) {
  sync.failed = false;
  sync.failedReason = '';
  return db.bacthSaveSyncs([sync]);
}

function hasNewItem(oldItems: Item[], newItems: Item[]): boolean {
  const oldUrls = new Set(oldItems.map(i => i.url));
  for (const item of newItems) {
    if (!oldUrls.has(item.url)) return true;
  }
  return false;
}

function mergeItems(oldItems: Item[], newItems: Item[]): Item[] {
  const items: Item[] = [];
  const urls = new Set<string>();
  const oldMap = new Map(oldItems.map(i => [i.url, i]));
  for (const item of newItems) {
    if (urls.has(item.url)) continue;
    urls.add(item.url);
    const oldItem = oldMap.get(item.url);
    if (oldItem) {
      item.detectedAt = oldItem.detectedAt;
    }
    items.push(item);
  }
  for (const item of oldItems) {
    if (urls.has(item.url)) continue;
    urls.add(item.url);
    items.push(item);
  }
  return items;
}

function upgradeIntervalLevel(sync: Synchronization) {
  sync.intervalLevel = Math.floor(sync.intervalLevel / 2);
  sync.nextDetectAt = getNextDetectAt(sync.intervalLevel);
}

function downgradeIntervalLevel(sync: Synchronization) {
  sync.intervalLevel = Math.min(sync.intervalLevel + 1, sync.invalid ? 10 : 4);
  sync.nextDetectAt = getNextDetectAt(sync.intervalLevel);
}

function getNextDetectAt(level: number): Date {
  return new Date(Date.now() + 1000 * 60 * 10 * Math.pow(2, level));
}

async function handleBookmarkUpdated() {
  await followBookmark();
  await toPage(MSG_SYNC_INFO_UPDATED, false);
}

async function followBookmark() {
  const [folders, sites] = await getBookmarkNodes();
  const info = await getSyncInfo();

  const foldersToDelete: string[] = [];
  info.folders.forEach(folder => {
    if (!folders.has(folder.id)) {
      foldersToDelete.push(folder.id);
    }
  });

  const sitesToDelete: string[] = [];
  const syncsToSave: Synchronization[] = [];
  const syncsToDelete: string[] = [];
  uniqueSites(sites);
  sites.forEach(site => {
    if (!info.syncs.has(site.homeUrl)) {
      syncsToSave.push(createSync(site));
    }
  });
  info.sites.forEach(site => {
    if (!sites.has(site.homeUrl)) {
      sitesToDelete.push(site.homeUrl);
    }
  });
  info.syncs.forEach(sync => {
    if (!sites.has(sync.homeUrl)) {
      syncsToDelete.push(sync.homeUrl);
    }
  });

  await Promise.all([
    db.batchSaveFolders(Array.from(folders.values())),
    db.batchDeleteFolders(foldersToDelete),
    db.batchSaveSites(Array.from(sites.values())),
    db.batchDeleteSites(sitesToDelete),
    db.bacthSaveSyncs(syncsToSave),
    db.batchDeleteSyncs(syncsToDelete),
  ]);
}

async function uniqueSites(sites: Map<string, Site>) {
  for (const homeUrl of Array.from(sites.keys())) {
    const urls = getPreferredHomeUrls(homeUrl);
    for (const url of urls) {
      if (sites.has(url)) {
        sites.delete(homeUrl);
        break;
      }
    }
  }
}

function getPreferredHomeUrls(homeUrl: string): string[] {
  return [
    homeUrl.replace(/^https?:\/\/(www\.)?/, 'https://'),
    homeUrl.replace(/^http:\/\/www\./, 'http://'),
    homeUrl.replace(/^http:\/\/www\./, 'https://www.'),
  ].filter(url => url !== homeUrl);
}

async function notify() {
  const info = await getSyncInfo();
  let count = 0;
  info.syncs.forEach(sync => {
    count += getUnreadCount(sync, info.readAt);
  });
  await notifyUnread(count);
  toPage(MSG_UNREAD, count);
}

function getUnreadCount(sync: Synchronization, readAt: Date): number {
  if (isSilent(sync)) return 0;
  return sync.items.reduce((sum, i) => sum + (i.detectedAt > readAt ? 1 : 0), 0);
}

function createSync(site: Site): Synchronization {
  return {
    homeUrl: site.homeUrl,
    feedUrl: '',
    faviconUrl: faviconUrlFromBrowser(site.homeUrl),
    title: site.domain,
    homeTitle: '',
    description: '',
    items: [],
    invalid: false,
    failed: false,
    failedReason: '',
    detectedAt: new Date(0),
    nextDetectAt: new Date(0),
    intervalLevel: 0,
    autoNotificationAction: NotificationAction.Unset,
    manualNotificationAction: NotificationAction.Unset,
    createdAt: new Date(),
  };
}

export async function getSyncInfo(): Promise<SyncInfo> {
  const [folders, sites, syncs, readAt, policies] = await Promise.all([
    db.getAllFolders(), 
    db.getAllSites(), 
    db.getAllSyncs(),
    getReadAt(),
    getNotificationPolicies(),
  ]);

  const folderMap = new Map(folders.map(f => [f.id, f]));
  const siteMap = new Map(sites.map(s => [s.homeUrl, s]));
  const syncMap = new Map(syncs.map(s => [s.homeUrl, s]));
  computeSilent(folderMap, siteMap, syncMap, policies);

  return {
    folders: folderMap,
    sites: siteMap,
    syncs: syncMap,
    readAt,
  };
}

function computeSilent(
  folderMap: Map<string, Folder>, 
  siteMap: Map<string, Site>,
  syncMap: Map<string, Synchronization>,
  policies: NotificationPolicy[],
) {
  const sitePolicyMap = new Map<string, NotificationPolicy>(
    policies.filter(p => p.matcher.type === 'site').map(p => [p.matcher.key, p])
  );
  const folderPolicyMap = new Map<string, NotificationPolicy>(
    policies.filter(p => p.matcher.type === 'folder').map(p => [p.matcher.key, p])
  );

  syncMap.forEach(sync => {
    sync.autoNotificationAction = computeAutoNotificationAction(sync.items);
    sync.manualNotificationAction = NotificationAction.Unset;

    const site = siteMap.get(sync.homeUrl);
    if (!site) return;

    const sitePolicy = sitePolicyMap.get(site.homeUrl);
    if (sitePolicy) {
      sync.manualNotificationAction = sitePolicy.action;
      return;
    }
    
    const foldIdLinks = Array.from(site.folderIds.values()).map(id => [id, ...getParentFolderIds(id, folderMap)]);
    for (const ids of foldIdLinks) {
      for (const id of ids) {
        const folderPolicy = folderPolicyMap.get(id);
        if (folderPolicy) {
          sync.manualNotificationAction = folderPolicy.action;
          return;
        }
      }
    }
  });
}

function getParentFolderIds(id: string, folderMap: Map<string, Folder>): string[] {
  const ids: string[] = [];
  let folder = folderMap.get(id);
  while (folder) {
    ids.push(folder.id);
    folder = folderMap.get(folder.parentId);
  }
  return ids;
}

function computeAutoNotificationAction(items: Item[]): NotificationAction {
  if (!items.length) return NotificationAction.Notify;

  const diffs = items.map((i, index) => {
    return index === 0 ? 0 : i.publishedAt.getTime() - items[index - 1].publishedAt.getTime();
  });
  const tooOutOfOrder = diffs.filter(d => d > 0).length > items.length / 5;
  if (tooOutOfOrder) {
    return NotificationAction.DontNotify;
  }

  const sorted = items.map(i => i.publishedAt.getTime()).sort((a, b) => b - a).slice(0, 10);
  const intervals = sorted.map((t, i) => i === 0 ? 0 : sorted[i - 1] - t).filter(t => t > 0);
  const tooOfen = intervals.filter(i => i < 1000 * 60 * 60 * 12).length > 3;
  if (tooOfen) {
    return NotificationAction.DontNotify;
  }

  return NotificationAction.Notify;
}

async function getReadAt(): Promise<Date> {
  const { readAt } = await chrome.storage.sync.get('readAt');
  return formSerializable(readAt) ?? new Date();
}

export async function setReadAt(at: Date) {
  await chrome.storage.sync.set({ readAt: toSerializable(at) });
}

export async function saveNotificationPolicies(policies: NotificationPolicy[]) {
  await chrome.storage.sync.set({ notificationPolicies: toSerializable(policies) });
  toPage(MSG_NOTIFICATION_POLICIES_UPDATED);
}

export async function getNotificationPolicies(): Promise<NotificationPolicy[]> {
  const { notificationPolicies } = await chrome.storage.sync.get('notificationPolicies');
  return formSerializable(notificationPolicies) ?? [];
}
