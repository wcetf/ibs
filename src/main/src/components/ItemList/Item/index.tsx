import { useEffect, useMemo, useState } from 'react';
import { relative } from '../../../../../common/date';
import { outlink } from '../../../../../common/url'; 
import { ExItem } from '../../../model/sync';
import SiteInfoPopover from '../../SiteInfoPopover';

export interface Props {
  item: ExItem;
  style: React.CSSProperties;
}

export default function Item({ item, style }: Props) {
  const [now, setNow] = useState(new Date());
  const publishedAt = useMemo(() => relative(item.publishedAt, now), [item.publishedAt, now]);
  const titleStyle = useMemo(() => ({
    marginLeft: /^[【（「《]/.test(item.title) ? '-0.5em' : '',
  }), [item.title]);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000 * 60);
    return () => clearInterval(timer);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className='px-6 flex flex-col justify-center cursor-default' style={style}>
      <div className='truncate'>
        <a
          className='text-lg font-semibold hover:underline'
          style={titleStyle}
          href={outlink(item.url)}
          target='_blank'
          rel='noopener noreferrer'
        >
          {item.title}
        </a>
      </div>
      {item.description && <div className='mt-[2px] text-sm text-[var(--color-text-2)] truncate'>{item.description}</div>}
      <div className='flex items-center gap-1 mt-[2px] text-xs text-[var(--color-text-3)] whitespace-nowrap truncate'>
        <SiteInfoPopover site={item.site} sync={item.sync}>
          <div className='flex-auto flex-grow-0 hover:text-[var(--color-text-2)] cursor-pointer truncate'>
            {item.sync.title || item.sync.homeTitle || item.site.domain}
          </div>
        </SiteInfoPopover>
        <div className='opacity-70'>·</div>
        <div title={item.publishedAt.toLocaleString()}>{publishedAt}</div>
      </div>
    </div>
  );
}