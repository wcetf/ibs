import { parse } from 'node-html-parser';
import * as http from './http';

export interface Meta {
  title: string;
  feedUrl: string;
  faviconUrl: string;
}

export async function getMeta(homeUrl: string): Promise<Meta> {
  const result = await http.get(homeUrl);
  if (result.contentType.includes('xml')) {
    return {
      feedUrl: homeUrl,
      title: '',
      faviconUrl: '',
    };
  }
  if (!result.contentType.includes('html')) {
    throw new Error(`Invalid content type: ${result.contentType}`);
  }

  const root = parse(result.content);
  const title = root.querySelector('title')?.textContent || '';
  const faviconUrl = root.querySelector(
    'link[rel="shortcut icon"],link[rel="icon"]'
  )?.getAttribute('href') || '';
  let feedUrl = root.querySelector(
    'link[type="application/atom+xml"],link[type="application/rss+xml"]'
  )?.getAttribute('href') || '';

  return {
    title,
    feedUrl: absUrl(feedUrl, homeUrl),
    faviconUrl: absUrl(faviconUrl, homeUrl),
  };
}

function absUrl(url: string, baseUrl: string): string {
  if (!url) return '';
  const u = new URL(url, baseUrl);
  return u.href;
}
