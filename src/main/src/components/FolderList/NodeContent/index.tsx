import { useState } from 'react';
import { Dropdown, Menu } from '@arco-design/web-react';
import { IconFolder } from '@arco-design/web-react/icon';
import UnreadCount from '../../UnreadCount';
import ExpandButton from './ExpandButton';
import LevelLeftPadding from './LevelLeftPadding';

export interface Props {
  title: string;
  selected?: boolean;
  expanded?: boolean;
  canExpand?: boolean;
  level?: number;
  unreadCount?: number;
  special?: boolean;
  onClick?: () => void;
  onExpand?: () => void;
}

export default function NodePanel(props: Props) {
  const [holding, setHolding] = useState(false);
  return (
    <Dropdown
      trigger='contextMenu'
      position='bl'
      droplist={
        <Menu>
          <Menu.Item key='1'>Read All</Menu.Item>
          <Menu.Item key='2'>Silent</Menu.Item>
        </Menu>
      }
      onVisibleChange={(visible) => setHolding(visible)}
      disabled={true}
    >
      <div
        className='flex items-center px-6 h-12 cursor-pointer hover:bg-[var(--color-fill-1)] select-none'
        style={{
          backgroundColor: props.selected ? 'var(--color-fill-2)' : (holding ? 'var(--color-fill-1)' : ''),
        }}
        onClick={props.onClick}
        onDoubleClick={props.onExpand}
      >
        <LevelLeftPadding level={props.level ?? 0} />
        <ExpandButton
          expanded={props.expanded ?? false}
          visible={props.canExpand || props.special || false}
          special={props.special}
          onClick={props.onExpand}
        />
        <IconFolder className='flex-none ml-1' fontSize={18} />
        <div className='flex-auto ml-2 leading-none font-medium truncate min-w-0'>{props.title}</div>
        <UnreadCount count={props.unreadCount ?? 0} />
      </div>
    </Dropdown>
  );
}