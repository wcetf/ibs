import { NotificationPolicy, SyncInfo } from './model';
import { toSerializable, formSerializable } from './data';

export const MSG_SYNC_PROGRESS_UPDATED = 'MSG_SYNC_PROGRESS_UPDATED';
export const MSG_GET_SYNC_INFO = 'MSG_GET_SYNC_INFO';
export const MSG_SYNC_INFO_UPDATED = 'MSG_SYNC_INFO_UPDATED';
export const MSG_UNREAD = 'MSG_UNREAD';
export const MSG_SET_READ_AT = 'MSG_SET_READ_AT';
export const MSG_SAVE_NOTIFICATION_POLICIES = 'MSG_SAVE_NOTIFICATION_POLICIES';
export const MSG_GET_NOTIFICATION_POLICIES = 'MSG_GET_NOTIFICATION_POLICIES';
export const MSG_NOTIFICATION_POLICIES_UPDATED = 'MSG_NOTIFICATION_POLICIES_UPDATED';

interface MessageMap {
  MSG_SYNC_PROGRESS_UPDATED: (completed: number, total: number) => Promise<void>;
  MSG_GET_SYNC_INFO: () => Promise<SyncInfo>;
  MSG_SYNC_INFO_UPDATED: (afterDetection: boolean) => Promise<void>;
  MSG_UNREAD: (count: number) => Promise<void>;
  MSG_SET_READ_AT: (readAt: Date) => Promise<void>;
  MSG_SAVE_NOTIFICATION_POLICIES: (policies: NotificationPolicy[]) => Promise<void>;
  MSG_GET_NOTIFICATION_POLICIES: () => Promise<NotificationPolicy[]>;
  MSG_NOTIFICATION_POLICIES_UPDATED: () => Promise<void>;
}

export interface Message {
  key: string;
  payload: any;
}

export interface Response<T> {
  data?: T;
  error?: MessageError;
}

export interface MessageError {
  message: string;
}

export async function toBackground<K extends keyof MessageMap>(
  key: K, ...args: Parameters<MessageMap[K]>): Promise<Awaited<ReturnType<MessageMap[K]>>> {
  const msg: Message = { key, payload: toSerializable(args) };
  const res = await chrome.runtime.sendMessage(msg) as Response<Awaited<ReturnType<MessageMap[K]>>>;
  if (res?.error) {
    throw new Error(res.error.message);
  }
  return formSerializable(res?.data);
}

export function toPage<K extends keyof MessageMap>(key: K, ...args: Parameters<MessageMap[K]>) {
  const msg: Message = { key, payload: toSerializable(args) };
  chrome.runtime.sendMessage(msg).catch(() => {});
}

export function initMessageHandlers<K extends keyof MessageMap>(
  handlers: Record<K, MessageMap[K]>) {
  const listener = (
    msg: Message,
    sender: chrome.runtime.MessageSender,
    send: (res: Response<Awaited<ReturnType<MessageMap[K]>>>) => void) => {
      const handler = handlers[msg.key as K];
      if (!handler) {
        send({ error: { message: `handler not found, key: ${msg.key}` } });
        return false;
      }
      const args = formSerializable(msg.payload);
      ((handler as any)(...args) as ReturnType<MessageMap[K]>).then((data) => {
        send({ data: toSerializable(data) });
        console.log('handle message', msg.key, args, data);
      }).catch((err) => {
        send({ error: { message: err.message } });
        console.log('handle message', msg.key, args, err);
      });
      return true;
    }
  chrome.runtime.onMessage.addListener(listener);
  return () => chrome.runtime.onMessage.removeListener(listener);
}
