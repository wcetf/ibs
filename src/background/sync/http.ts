export class HTTPResult {
  contentType: string;
  content: string;
}

const TIMEOUT = 1000 * 60;

const utf8Decoder = new TextDecoder('utf-8');
const gbkDecoder = new TextDecoder('gbk');

export async function get(url: string): Promise<HTTPResult> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT);
  const response = await fetch(url, {
    cache: 'default',
    redirect: 'follow',
    referrerPolicy: 'no-referrer',
    signal: controller.signal,
  });
  clearTimeout(timeoutId);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  return {
    contentType: response.headers.get('content-type') || '',
    content: ensureUtf8(await response.arrayBuffer()),
  };
}

function ensureUtf8(data: ArrayBuffer): string {
  const content = utf8Decoder.decode(data);
  if (isGbk(content)) {
    return gbkDecoder.decode(data);
  }
  return content;
}

function isGbk(content: string): boolean {
  return /(^.+\sencoding="gb)|(<meta\s+charset="gb)|(http-equiv="Content-Type".+charset=gb)/i.test(content);
}
