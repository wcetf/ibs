export interface SyncInfo {
  folders: Map<string, Folder>;
  sites: Map<string, Site>;
  syncs: Map<string, Synchronization>;
  readAt: Date;
}

export interface Synchronization {
  homeUrl: string;
  feedUrl: string;
  faviconUrl: string;
  title: string;
  homeTitle: string;
  description: string;
  items: Item[];
  invalid: boolean;
  failed: boolean;
  failedReason: string;
  detectedAt: Date;
  nextDetectAt: Date;
  intervalLevel: number;
  autoNotificationAction: NotificationAction;
  manualNotificationAction: NotificationAction;
  createdAt: Date;
}

export function isSilent(sync: Synchronization): boolean {
  if (sync.manualNotificationAction === NotificationAction.Notify) return false;
  if (sync.manualNotificationAction === NotificationAction.DontNotify) return true;
  if (sync.autoNotificationAction === NotificationAction.DontNotify) return true;
  return false;
}

export interface Item {
  url: string;
  title: string;
  description: string;
  publishedAt: Date;
  detectedAt: Date;
}

export interface Folder {
  id: string;
  parentId: string;
  index: number;
  title: string;
}

export interface Site {
  homeUrl: string;
  folderIds: Set<string>;
  domain: string;
}

export interface NotificationPolicy {
  id: string;
  matcher: NotificationPolicyMatcher;
  action: NotificationAction;
  createdAt: Date;
}

export interface NotificationPolicyMatcher {
  key: string;
  type: 'site' | 'folder';
}

export enum NotificationAction {
  Unset = 0,
  Notify = 1,
  DontNotify = 2,
}
