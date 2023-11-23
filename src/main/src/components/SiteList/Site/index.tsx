import UnreadCount from '../../UnreadCount';
import Favicon from './Favicon';

export interface Props {
  title: string;
  domain: string;
  homeUrl: string;
  faviconUrl?: string;
  selected?: boolean;
  empty?: boolean;
  failed?: boolean;
  unreadCount?: number;
  style?: React.CSSProperties;
  freezing?: boolean;
  loadedFaviconUrls?: Set<string>;
  onClick?: () => void;
}

export default function Site(props: Props) {
  return (
    <div
      key={props.homeUrl}
      className='flex items-center gap-3 px-6 cursor-pointer hover:bg-[var(--color-fill-1)] group'
      style={{
        ...props.style,
        backgroundColor: props.selected ? 'var(--color-fill-2)' : '',
        opacity: props.empty ? 0.5 : 1,
      }}
      onClick={props.onClick}
    >
      <Favicon
        url={props.faviconUrl || props.homeUrl.replace(/\/$/, '') + '/favicon.ico'}
        freezing={props.freezing}
        loadedFaviconUrls={props.loadedFaviconUrls}
      />
      <div className='flex-auto min-w-0'>
        <div className={`leading-tight truncate font-medium ${props.domain ? 'text-sm' : ''}`}>
          {props.title}
        </div>
        {props.domain && (
          <div className='mt[2px] leading-tight text-xs text-[var(--color-text-3)] truncate'>
            {props.domain}
          </div>
        )}
      </div>
      <UnreadCount count={props.unreadCount ?? 0} />
    </div>
  );
}
