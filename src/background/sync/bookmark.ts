import { Folder, Site } from '../../common/model';
import { debounce } from '../../common/stream';

export async function getBookmarkNodes(): Promise<[Map<string, Folder>, Map<string, Site>]> {
  const tree = await chrome.bookmarks.getTree();
  const sites = new Map<string, Site>();
  const folders = new Map<string, Folder>();
  resolveBookmarkNodes(tree, '', folders, sites);
  const filteredSites = filterSites(sites);
  const filteredFolders = filterFolders(folders, filteredSites);
  return [filteredFolders, filteredSites];
}

function resolveBookmarkNodes(
  nodes: chrome.bookmarks.BookmarkTreeNode[], 
  parentId: string, 
  folders: Map<string, Folder>,
  sites: Map<string, Site>) {
  for (const node of nodes) {
    const homeUrl = getHomeUrl(node.url || '');
    if (homeUrl) {
      if (sites.has(homeUrl)) {
        sites.get(homeUrl)!.folderIds.add(parentId);
        continue;
      }
      const site: Site = {
        homeUrl,
        folderIds: new Set(parentId ? [parentId] : []),
        domain: getDomain(homeUrl),
      }
      sites.set(homeUrl, site);
      continue;
    }
    const folder: Folder = {
      id: node.id,
      parentId,
      index: node.index || 0,
      title: node.title,
    };
    folders.set(folder.id, folder);
    resolveBookmarkNodes(node.children || [], folder.id, folders, sites);
  }
  return folders;
}

function getHomeUrl(url: string): string {
  if (!url) return '';
  const u = new URL(url);
  return u.origin;
}

function getDomain(url: string): string {
  if (!url) return '';
  const u = new URL(url);
  return u.hostname.replace(/^www\./, '');
}

function filterSites(sites: Map<string, Site>): Map<string, Site> {
  return new Map(Array.from(sites.entries()).filter(([_, s]) => s.homeUrl.startsWith('http')));
}

function filterFolders(folders: Map<string, Folder>, sites: Map<string, Site>): Map<string, Folder> {
  const parentIds = new Set(Array.from(folders.values()).map(d => d.parentId));
  const idsHasSite = new Set(Array.from(sites.values()).flatMap(s => Array.from(s.folderIds)));
  const filtered = new Map<string, Folder>();
  for (const [id, folder] of Array.from(folders.entries())) {
    if (parentIds.has(id) || idsHasSite.has(id)) {
      filtered.set(id, folder);
    };
  }
  return filtered;
}

export async function onBookmarkUpdated(cb: () => void) {
  const handler = debounce(cb, 100);
  chrome.bookmarks.onCreated.addListener(handler);
  chrome.bookmarks.onRemoved.addListener(handler);
  chrome.bookmarks.onChanged.addListener(handler);
  chrome.bookmarks.onMoved.addListener(handler);
  chrome.bookmarks.onChildrenReordered.addListener(handler);
  chrome.bookmarks.onImportEnded.addListener(handler);
  return () => {
    chrome.bookmarks.onCreated.removeListener(handler);
    chrome.bookmarks.onRemoved.removeListener(handler);
    chrome.bookmarks.onChanged.removeListener(handler);
    chrome.bookmarks.onMoved.removeListener(handler);
    chrome.bookmarks.onChildrenReordered.removeListener(handler);
    chrome.bookmarks.onImportEnded.removeListener(handler);
  };
}