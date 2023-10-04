export function outlink(url: string): string {
  try {
    if (!url) return '';
    const u = new URL(url);
    u.searchParams.set('utm_source', 'ibs.wcetf.org');
    return u.href;
  } catch (err) {
    console.error('[outlink]', err);
    return url;
  }
}

export function faviconUrlFromBrowser(url: string) {
  const u = new URL(chrome.runtime.getURL("/_favicon/"));
  u.searchParams.set("pageUrl", url);
  return u.toString();
}
