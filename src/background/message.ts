import {
  initMessageHandlers,
  MSG_GET_SYNC_INFO,
  MSG_SET_READ_AT,
  MSG_SAVE_NOTIFICATION_POLICIES,
  MSG_GET_NOTIFICATION_POLICIES,
} from '../common/message';
import { getSyncInfo, saveNotificationPolicies, getNotificationPolicies, setReadAt } from './sync';
import { clearUnreadNotification } from './notification';

export function init() {
  initMessageHandlers({
    [MSG_GET_SYNC_INFO]: getSyncInfo,
    [MSG_SET_READ_AT]: async (readAt: Date) => {
      await clearUnreadNotification();
      await setReadAt(readAt);
    },
    [MSG_SAVE_NOTIFICATION_POLICIES]: async (policies) => {
      await saveNotificationPolicies(policies);
    },
    [MSG_GET_NOTIFICATION_POLICIES]: async () => {
      return await getNotificationPolicies();
    },
  });
}
