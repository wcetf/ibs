import { Tag } from '@arco-design/web-react';

export interface Props {
  count: number;
}

export default function UnreadCount({ count }: Props) {
  return (
    <Tag
      className='flex-none ml-2 w-9 px-0 text-center'
      style={{
        // visibility: count > 0 ? 'visible' : 'hidden',
        display: count > 0 ? 'flex' : 'none',
      }}
      size='small'
      color='gray'
    >
      {count > 99 ? '99+' : count}
    </Tag>
  );
}