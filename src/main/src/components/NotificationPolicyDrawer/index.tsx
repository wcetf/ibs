import { Drawer } from '@arco-design/web-react';
import PolicyList from './PolicyList';

export interface Props {
  visible: boolean;
  onClose: () => void;
}

export default function NotificationPolicyDrawer({ visible, onClose }: Props) {
  return (
    <Drawer
      width={580}
      title={<div className='font-bold tracking-wide'>NOTIFICATION POLICIES</div>}
      visible={visible}
      footer={null}
      onOk={onClose}
      onCancel={onClose}
    >
      <div>
        <div className='text-[var(--color-text-1)] text-sm leading-relaxed'>
          IBS doesn't notify you of every new content. 
          Its automatic notification policies are designed to minimize disruptions caused by frequent content updates, 
          which, in most cases, contribute to a better experience. 
          If you have specific preferences, you can manually adjust the notification policies here.
        </div>
        <PolicyList className='my-4' />
      </div>
    </Drawer>
  );
}
