import { Button } from '@arco-design/web-react';
import { IconCaretDown, IconCaretRight, IconStar } from '@arco-design/web-react/icon';

interface Props {
  expanded: boolean;
  visible: boolean;
  special?: boolean;
  onClick?: () => void;
}

export default function ExpandButton({ expanded, visible, special, onClick }: Props) {
  return (
    <Button
      className='flex-none'
      type='text'
      shape='circle'
      size='mini'
      iconOnly
      icon={special ? <IconStar /> : (expanded ? <IconCaretDown /> : <IconCaretRight />)}
      style={{
        color: 'inherit',
        visibility: visible ? 'visible' : 'hidden',
      }}
      onClickCapture={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
    />
  );
}