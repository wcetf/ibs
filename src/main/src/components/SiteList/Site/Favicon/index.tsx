import { useEffect, useRef, useState } from 'react';
import { faviconUrlFromBrowser } from '../../../../../../common/url';

export interface Props {
  url: string;
  freezing?: boolean;
  loadedFaviconUrls?: Set<string>;
}

const PLACEHOLDER = faviconUrlFromBrowser('https://notexists.wcetf.org');

export default function Favicon({ url, freezing, loadedFaviconUrls }: Props) {
  const [finalUrl, setFinalUrl] = useState(loadedFaviconUrls?.has(url) ? url : PLACEHOLDER);
  const [prepared, setPrepared] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const img = useRef<HTMLImageElement | null>();

  useEffect(() => {
    if (!url) {
      setFinalUrl(PLACEHOLDER);
      return;
    }
    if (freezing || error) {
      return;
    }
    if (loaded || loadedFaviconUrls?.has(url)) {
      setFinalUrl(url);
      return;
    }
    if (prepared) {
      return;
    }
    if (!img.current) {
      img.current = new Image();
    }
    img.current.referrerPolicy = 'no-referrer';
    img.current.onload = () => {
      setLoaded(true);
      loadedFaviconUrls?.add(url);
      if (!freezing) {
        setFinalUrl(url);
      }
    };
    img.current.onerror = () => {
      setError(true);
    }
    img.current.src = url;
    setPrepared(true);
  }, [url, freezing]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div
      className='flex-none w-4 h-4 rounded bg-cover bg-center'
      style={{ backgroundImage: `url(${finalUrl})` }}
    />
  );
}
