import { Folder, Item, Site, Synchronization } from '../../../common/model';

export interface FolderNode extends Folder {
  unreadCount: number;
  lastPublishedAt: Date | undefined;
  children: FolderNode[];
}

export interface ExSite extends Site {
  sync: Synchronization | undefined;
  unreadCount: number;
  lastPublishedAt: Date | undefined;
}

export interface ExItem extends Item {
  sync: Synchronization;
  site: Site;
}
