import { useMemo } from 'react';
import { Popover, Descriptions } from '@arco-design/web-react';
import { DataType } from '@arco-design/web-react/es/Descriptions/interface';
import { Site, Synchronization, NotificationAction } from '../../../../common/model';
import { outlink } from '../../../../common/url';

export interface Props {
  site: Site;
  sync?: Synchronization
  children?: React.ReactNode;
}

export default function SiteInfoPopover({ site, sync, children }: Props) {
  const notifTitle = useMemo(() => {
    if (!sync) return 'Unknown';
    if (sync.manualNotificationAction === NotificationAction.DontNotify) return 'Never Notify';
    if (sync.manualNotificationAction === NotificationAction.Notify) return 'Always Notify';
    if (sync.autoNotificationAction === NotificationAction.DontNotify) return 'Auto (Don\'t Notify)';
    return 'Auto (Notify)';
  }, [sync]);

  const data = useMemo<DataType>(() => {
    if (!sync) return [];
    const updateTime = sync.items.reduce((max, item) => Math.max(max, item.publishedAt.getTime()), 0);
    return [
      {
        label: 'Site Home',
        value: (
          <a
            className='hover:underline'
            href={outlink(sync.homeUrl)}
            target='_blank'
            rel='noopener noreferrer'
          >
            {sync.homeTitle || site.domain}
          </a>
        ),
      },
      {
        label: 'Content Feed',
        value: sync.invalid ? (
          <div>Not Found</div>
        ) : (
          <a
            className='hover:underline'
            href={sync.feedUrl}
            target='_blank'
            rel='noopener noreferrer'
          >
            RSS / Atom {updateTime ? `(${new Date(updateTime).toLocaleString()})` : ''}
          </a>
        ),
      },
      {
        label: 'Notification',
        value: notifTitle,
      },
      {
        label: 'Detect Status',
        value: sync.failed ? `Failed (${sync.failedReason})` : 'Success',
      },
      {
        label: 'Detected At',
        value: sync.detectedAt.toLocaleString(),
      },
      {
        label: 'Next Detect At',
        value: sync.nextDetectAt.toLocaleString(),
      },
    ];
  }, [site, sync, notifTitle]);

  return (
    <Popover
      style={{ maxWidth: 600 }}
      title={null}
      content={sync ? (
        <Descriptions
          className='mt-1 cursor-default'
          column={1}
          data={data}
          labelStyle={{ textAlign: 'right', paddingRight: 12 }}
          size='small'
        />
      ) : (
        <div>Synchronization for this site is not yet prepared.</div>
      )}
      position='bottom'
      trigger='hover'
    >
      {children}
    </Popover>
  );
}