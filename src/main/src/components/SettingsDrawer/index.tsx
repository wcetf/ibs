import { Drawer } from '@arco-design/web-react';

export interface Props {
  visible: boolean;
  onClose: () => void;
}

export default function SettingsDrawer({ visible, onClose }: Props) {
  return (
    <Drawer
      width={600}
      title={<div className='font-bold tracking-wide'>SETTINGS</div>}
      visible={visible}
      footer={null}
      onOk={onClose}
      onCancel={onClose}
    >
      <div>
      </div>
    </Drawer>
  );
}
