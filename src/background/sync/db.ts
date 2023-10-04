import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { Synchronization, Folder, Site } from '../../common/model';

interface SyncDB extends DBSchema {
  syncs: {
    value: Synchronization;
    key: string;
    indexes: { 'nextDetectAt': number };
  };
  folders: {
    value: Folder;
    key: string;
    indexes: { 'id': string };
  };
  sites: {
    value: Site;
    key: string;
    indexes: { 'homeUrl': string };
  };
}

let db: IDBPDatabase<SyncDB>;
let initPromise: Promise<void>;

export async function init() {
  db = await openDB<SyncDB>('sync', 1, {
    upgrade(db) {
      db.createObjectStore('syncs', {
        keyPath: 'homeUrl',
      }).createIndex('nextDetectAt', 'nextDetectAt');
      db.createObjectStore('folders', {
        keyPath: 'id',
      });
      db.createObjectStore('sites', {
        keyPath: 'homeUrl',
      });
    },
    terminated() {
      init();
    },
  });
}

async function getDB(): Promise<IDBPDatabase<SyncDB>> {
  if (db) {
    return db;
  }
  if (!initPromise) {
    initPromise = init();
  }
  await initPromise;
  return db;
}

export async function bacthSaveSyncs(syncs: Synchronization[]) {
  if (!syncs.length) return;
  const tx = (await getDB()).transaction('syncs', 'readwrite');
  const store = tx.objectStore('syncs');
  for (const sync of syncs) {
    store.put(sync);
  }
  await tx.done;
}

export async function batchDeleteSyncs(homeUrls: string[]) {
  if (!homeUrls.length) return;
  const tx = (await getDB()).transaction('syncs', 'readwrite');
  const store = tx.objectStore('syncs');
  for (const homeUrl of homeUrls) {
    store.delete(homeUrl);
  }
  await tx.done;
}

export async function getAllSyncs(): Promise<Synchronization[]> {
  return (await getDB()).getAll('syncs');
}

export async function getSyncsToDetect(): Promise<Synchronization[]> {
  return (await getDB()).getAllFromIndex('syncs', 'nextDetectAt', IDBKeyRange.upperBound(new Date()));
}

export async function batchSaveFolders(folders: Folder[]) {
  if (!folders.length) return;
  const tx = (await getDB()).transaction('folders', 'readwrite');
  const store = tx.objectStore('folders');
  for (const folder of folders) {
    store.put(folder);
  }
  await tx.done;
}

export async function batchDeleteFolders(ids: string[]) {
  if (!ids.length) return;
  const tx = (await getDB()).transaction('folders', 'readwrite');
  const store = tx.objectStore('folders');
  for (const id of ids) {
    store.delete(id);
  }
  await tx.done;
}

export async function getFolder(id: string): Promise<Folder | undefined> {
  return (await getDB()).get('folders', id);
}

export async function getAllFolders(): Promise<Folder[]> {
  return (await getDB()).getAll('folders');
}

export async function batchSaveSites(sites: Site[]) {
  if (!sites.length) return;
  const tx = (await getDB()).transaction('sites', 'readwrite');
  const store = tx.objectStore('sites');
  for (const site of sites) {
    store.put(site);
  }
  await tx.done;
}

export async function batchDeleteSites(urls: string[]) {
  if (!urls.length) return;
  const tx = (await getDB()).transaction('sites', 'readwrite');
  const store = tx.objectStore('sites');
  for (const url of urls) {
    store.delete(url);
  }
  await tx.done;
}

export async function getSite(homeUrl: string): Promise<Site | undefined> {
  return (await getDB()).get('sites', homeUrl);
}

export async function getAllSites(): Promise<Site[]> {
  return (await getDB()).getAll('sites');
}
