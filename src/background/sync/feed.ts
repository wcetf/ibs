import { parse } from 'node-html-parser';
import { extractFromXml } from '@extractus/feed-extractor';
import * as http from './http';

export interface Feed {
  title: string;
  description: string;
  items: Item[];
}

export interface Item {
  url: string;
  title: string;
  description: string;
  publishedAt: Date;
}

export async function getFeed(feedUrl: string): Promise<Feed> {
  const result = await http.get(feedUrl);
  return resolveFeed(feedUrl, result.content);
}

function resolveFeed(baseUrl: string, content: string): Feed {
  const raw = extractFromXml(content, {
    descriptionMaxLen: 0,
    baseUrl,
  });
  const entries = raw.entries || [];
  if (entries[0]?.description === '[object Object]') {
    const origin = extractFromXml(content, {
      descriptionMaxLen: 0,
      normalization: false,
      baseUrl,
    }) as any;
    for (let i = 0; i < entries.length; i++) {
      entries[i].description = origin?.entry?.[i]?.summary || origin?.entry?.[i]?.content || '';
    }
  }
  const feed = {
    title: raw.title || '',
    description: raw.description || '',
    items: raw.entries?.map(e => ({
      url: e.link || '',
      title: e.title || '',
      description: ignoreIfTooShort(pureHtml(e.description || '', 300), 10),
      publishedAt: new Date(e.published || 0),
    })) || [],
  };
  return feed;
}

const urlRegex = /https?:\/\/(www\.)?([-a-z0-9@:%._\+~#=]{1,256}\.[a-z0-9()]{1,12})\b([-a-z0-9()@:%_\+.~#?&//=]*)/ig;

function pureHtml(html: string, limit: number): string {
  const root = parse(html);
  root.querySelectorAll('style').forEach(e => e.remove());
  root.querySelectorAll('script').forEach(e => e.remove());
  root.querySelectorAll('pre').forEach(e => e.textContent = '[code]');
  const text = root.textContent.replace(/\s+/g, ' ').replace(urlRegex, '$2').trim();
  return text.length > limit ? text.slice(0, limit) + '...' : text;
}

function ignoreIfTooShort(text: string, min: number): string {
  return text.length < min ? '' : text;
}