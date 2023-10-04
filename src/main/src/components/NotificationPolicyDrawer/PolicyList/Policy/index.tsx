import { useRecoilValue } from 'recoil';
import { Button, Select, Popconfirm } from '@arco-design/web-react';
import {
  IconFolder,
  IconNotification,
  IconNotificationClose,
  IconCheck,
  IconDelete,
  IconHome,
} from '@arco-design/web-react/icon';
import { NotificationPolicy, NotificationAction } from '../../../../../../common/model';
import { syncState } from '../../../../state/sync';
import { useMemo } from 'react';

export interface Props {
  policy: NotificationPolicy;
  onActionChange: (action: NotificationAction) => void;
  onRemove: () => void;
}

export default function Policy({ policy, onActionChange, onRemove }: Props) {
  const sync = useRecoilValue(syncState);
  const title = useMemo(() => {
    if (policy.matcher.type === 'folder') {
      const titles: string[] = [];
      let id = policy.matcher.key;
      while (sync.folders.has(id)) {
        const folder = sync.folders.get(id)!;
        if (!folder.title) break;
        titles.unshift(folder.title);
        id = folder.parentId;
      }
      return titles.length ? titles.join(' / ') : '[The folder is not found]';
    }
    if (policy.matcher.type === 'site') {
      const site = sync.sites.get(policy.matcher.key);
      return site ? site.domain : '[The site is not found]';
    }
    return `[${policy.matcher.type}:${policy.matcher.key}]`;
  }, [policy, sync]);

  return (
    <div className='p-2'>
      <div className='flex items-center gap-2'>
        {policy.matcher.type === 'folder' ? (
          <IconFolder className='flex-none' />
        ) : (
          <IconHome className='flex-none' />
        )}
        <span className='flex-auto truncate cursor-default dir-rtl mr-2' title={title}>{title}</span>
        <Select
          triggerProps={{
            autoAlignPopupWidth: false,
            autoAlignPopupMinWidth: true,
            position: 'left',
          }}
          triggerElement={
            <Button
              className='flex-none'
              type='text'
              style={{
                color: policy.action === NotificationAction.Notify ? 'rgb(var(--success-6))' : 'rgb(var(--danger-6))',
              }}
              iconOnly
              icon={policy.action === NotificationAction.Notify ? <IconNotification /> : <IconNotificationClose />}
            />
          }
          value={policy.action}
          onChange={onActionChange}
        >
          <Select.Option
            value={NotificationAction.Notify}
            style={{
              fontWeight: policy.action === NotificationAction.Notify ? 600 : undefined,
            }}
          >
            <IconNotification style={{ color: 'rgb(var(--success-6))' }} />
            <span className='ml-2'>Always Notify</span>
            {policy.action === NotificationAction.Notify && <IconCheck className='ml-2' />}
          </Select.Option>
          <Select.Option
            value={NotificationAction.DontNotify}
            style={{
              fontWeight: policy.action === NotificationAction.DontNotify ? 600 : undefined,
            }}
          >
            <IconNotificationClose style={{ color: 'rgb(var(--danger-6))' }} />
            <span className='ml-2'>Never Notify</span>
            {policy.action === NotificationAction.DontNotify && <IconCheck className='ml-2' />}
          </Select.Option>
        </Select>
        <Popconfirm
          focusLock
          title='Are you sure you want to remove this policy?'
          style={{ maxWidth: 600 }}
          onOk={onRemove}
          cancelText='Cancel'
          okText='Remove'
        >
          <Button
            className='flex-none'
            type='text'
            style={{ color: 'rgb(var(--danger-6))' }}
            iconOnly
            icon={<IconDelete />}
          />
        </Popconfirm>
      </div>
    </div>
  );
}