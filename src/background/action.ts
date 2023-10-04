import { execute } from './sync';

export function init() {
  chrome.action.onClicked.addListener(async () => {
    await openMainPage();
  });
  chrome.runtime.onInstalled.addListener(async ({ reason }) => {
    if (reason === 'install') {
      await openMainPage();
      execute();
    }
  });
  chrome.tabs.onUpdated.addListener(async (tabId, { status }, tab) => {
    const url = chrome.runtime.getURL('main/index.html');
    if (!tab.url?.startsWith(url)) {
      return;
    }
    const tabs = await chrome.tabs.query({
      url: url + '*',
      windowId: chrome.windows.WINDOW_ID_CURRENT,
    });
    if (tabs.length > 1) {
      await chrome.tabs.remove(tabId);
      await chrome.tabs.update(tabs[0].id!, { active: true });
    }
  });
}

async function openMainPage() {
  const url = chrome.runtime.getURL('main/index.html');
  const tabs = await chrome.tabs.query({
    url: url + '*',
    windowId: chrome.windows.WINDOW_ID_CURRENT,
  });
  if (tabs.length) {
    await chrome.tabs.update(tabs[0].id!, { active: true });
    await chrome.tabs.reload(tabs[0].id!);
  } else {
    await chrome.tabs.create({ url });
  }
}
