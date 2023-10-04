import { useEffect, useMemo, useState } from 'react';
import { useRecoilValue } from 'recoil';
import { v4 as uuid } from 'uuid';
import { Button, Cascader, Message, Radio, Select } from '@arco-design/web-react';
import { IconPlus } from '@arco-design/web-react/icon';
import { NotificationPolicy, NotificationAction } from '../../../../../common/model';
import { toBackground, MSG_SAVE_NOTIFICATION_POLICIES } from '../../../../../common/message';
import { folderTreeState, syncState, notificationPoliciesState } from '../../../state/sync';
import Policy from './Policy';

export interface Props {
  className?: string;
}

export default function PolicyList({ className }: Props) {
  const policies = useRecoilValue(notificationPoliciesState);
  const folderTree = useRecoilValue(folderTreeState);
  const sync = useRecoilValue(syncState);
  const sites = useMemo(() => {
    const sites = Array.from(sync.sites.values());
    sites.sort((a, b) => a.domain.localeCompare(b.domain));
    return sites;
  }, [sync]);
  const [matcherType, setMatcherType] = useState<'folder' | 'site'>('folder');
  const [selectedFolderIds, setSelectedFolderIds] = useState<string[]>();
  const [selectedSiteHomeUrl, setSelectedSiteHomeUrl] = useState<string>();
  const canAddPolicy = useMemo(() => {
    return (matcherType === 'folder' && selectedFolderIds?.length) || (matcherType === 'site' && selectedSiteHomeUrl);
  }, [matcherType, selectedFolderIds, selectedSiteHomeUrl]);

  useEffect(() => {
    if (matcherType === 'folder') {
      setSelectedSiteHomeUrl(undefined);
    } else {
      setSelectedFolderIds(undefined);
    }
  }, [matcherType]);

  function handleAddPolicy() {
    if (!canAddPolicy) return;
    if (matcherType === 'folder') {
      handleAddPolicyForFolder(selectedFolderIds![selectedFolderIds!.length - 1]);
      setSelectedFolderIds(undefined);
    } else {
      handleAddPolicyForSite(selectedSiteHomeUrl!);
      setSelectedSiteHomeUrl(undefined);
    }
  }

  async function handleAddPolicyForFolder(id: string) {
    const policy: NotificationPolicy = {
      id: uuid(),
      matcher: {
        type: 'folder',
        key: id,
      },
      action: NotificationAction.Notify,
      createdAt: new Date(),
    };
    if (!checkDulicate(policy)) {
      return;
    }
    await toBackground(MSG_SAVE_NOTIFICATION_POLICIES, [policy, ...policies]);
  }

  async function handleAddPolicyForSite(homeUrl: string) {
    const policy: NotificationPolicy = {
      id: uuid(),
      matcher: {
        type: 'site',
        key: homeUrl,
      },
      action: NotificationAction.Notify,
      createdAt: new Date(),
    };
    if (!checkDulicate(policy)) {
      return;
    }
    await toBackground(MSG_SAVE_NOTIFICATION_POLICIES, [policy, ...policies]);
  }

  function checkDulicate(policy: NotificationPolicy): boolean {
    if (policies.some(p => p.matcher.type === policy.matcher.type && p.matcher.key === policy.matcher.key)) {
      Message.error('Policy already exists');
      return false;
    }
    return true;
  }

  async function handleActionChange(policy: NotificationPolicy, action: NotificationAction) {
    await toBackground(MSG_SAVE_NOTIFICATION_POLICIES, policies.map(p => p.id === policy.id ? { ...p, action } : p));
  }

  async function handleRemove(policy: NotificationPolicy) {
    await toBackground(MSG_SAVE_NOTIFICATION_POLICIES, policies.filter(p => p.id !== policy.id));
  }

  return (
    <div className={className}>
      <div className='flex items-center gap-2'>
        <Radio.Group className='flex-none' type='button' value={matcherType} onChange={setMatcherType}>
          <Radio value='folder'>Folder</Radio>
          <Radio value='site'>Site</Radio>
        </Radio.Group>
        {matcherType === 'folder' ? (
          <Cascader
            className='flex-auto min-w-0'
            placeholder='Select a folder'
            options={folderTree}
            changeOnSelect
            showSearch
            allowClear
            fieldNames={{
              children: 'children',
              label: 'title',
              value: 'id',
            }}
            expandTrigger='hover'
            value={selectedFolderIds || undefined}
            onChange={v => setSelectedFolderIds(v as string[] || [])}
          />
        ) : (
          <Select
            className='flex-auto min-w-0'
            placeholder='Select a site'
            showSearch
            allowClear
            value={selectedSiteHomeUrl || undefined}
            onChange={v => setSelectedSiteHomeUrl(v || '')}
          >
            {sites.map((site) => (
              <Select.Option key={site.homeUrl} value={site.homeUrl}>
                {site.domain}
              </Select.Option>
            ))}
          </Select>
        )}
        <Button
          className='flex-none'
          type='primary'
          icon={<IconPlus />}
          disabled={!canAddPolicy}
          onClick={handleAddPolicy}
        >
          Add Policy
        </Button>
      </div>
      <div className={`bg-[var(--color-fill-1)] rounded-md divide-y divide-[var(--color-bg-2)] ${className || ''}`}>
        {policies.map((policy) => (
          <Policy
            key={policy.id}
            policy={policy}
            onActionChange={action => handleActionChange(policy, action)}
            onRemove={() => handleRemove(policy)}
          />
        ))}
      </div>
    </div>
  )
}