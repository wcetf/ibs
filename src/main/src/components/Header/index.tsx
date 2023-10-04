import { useState } from 'react';
import { IconGithub, IconMoreVertical, IconNotification, IconRefresh } from '@arco-design/web-react/icon';
import NotificationPolicyDrawer from '../NotificationPolicyDrawer';
import SettingsDrawer from '../SettingsDrawer';
import NavButton from './NavButton';
import ThemeButton from './ThemeButton';

export interface Props {
  showReloadButton?: boolean;
}

export default function Header({ showReloadButton }: Props) {
  const [notificationPolicyDrawerVisible, setNotificationPolicyDrawerVisible] = useState(false);
  const [settingsDrawerVisible, setSettingsDrawerVisible] = useState(false);
  return (
    <div className='p-4 flex items-center bg-[var(--color-bg-2)] cursor-default'>
      <div className='font-bold text-[1.7rem] font-[ui-serif,Times,serif] leading-none text-[var(--primary-5)]'>
        IBS
      </div>
      <div className='ml-3 text-xs text-[var(--color-text-3)] tracking-wider uppercase scale-75 origin-left leading-tight'>
        Stay Updated with <br />Bookmarked Independent Blogs
      </div>
      <div className='ml-auto' />
      {showReloadButton && (
        <NavButton
          className='ml-2'
          title='Reload to see new contents'
          icon={<IconRefresh fontSize={18} />}
          onClick={() => window.location.reload()}
        />
      )}
      <ThemeButton className='ml-2' />
      <NavButton
        className='ml-2'
        title='GitHub Repository'
        icon={<IconGithub fontSize={18} />}
        href='https://github.com/wcetf/ibs'
      />
      <NavButton
        className='ml-2 flex justify-center items-center'
        title='Notification Policies'
        icon={<IconNotification fontSize={18} />}
        onClick={() => setNotificationPolicyDrawerVisible(true)}
      />
      <NavButton
        // className='ml-2 flex justify-center items-center'
        className='hidden'
        title='Settings'
        icon={<IconMoreVertical fontSize={18} />}
        onClick={() => setSettingsDrawerVisible(true)}
      />
      <NotificationPolicyDrawer
        visible={notificationPolicyDrawerVisible}
        onClose={() => setNotificationPolicyDrawerVisible(false)}
      />
      <SettingsDrawer
        visible={settingsDrawerVisible}
        onClose={() => setSettingsDrawerVisible(false)}
      />
    </div>
  );
}
