export async function notifyUnread(count: number) {
  if (count === 0) {
    await clearUnreadNotification();
    return;
  }
  await chrome.action.setBadgeBackgroundColor({ color: '#f53f3f' });
  await chrome.action.setBadgeTextColor({ color: '#fff' });
  await chrome.action.setBadgeText({ text: count > 99 ? '99+' : count.toString() });
}

export async function clearUnreadNotification() {
  await chrome.action.setBadgeText({ text: '' });
}
