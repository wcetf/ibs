import { useMemo, useState } from 'react';
import ScrollWrapper from '../ScrollWrapper';
import Resizer from './Resizer';

export interface Props {
  title: string;
  children?: React.ReactNode;
  scrollResetKey?: any;
  resizeKey?: string;
  defaultWidth?: number;
}

const MIN_COLUMN_WIDTH = 200;
const MAX_COLUMN_WIDTH = 600;

export default function Column({ title, children, scrollResetKey, resizeKey, defaultWidth }: Props) {
  const [width, setWidth] = useState(Number(localStorage.getItem(`column:width:${resizeKey}`)) || defaultWidth || 0);
  const [widthOffset, setWidthOffset] = useState(0);
  const finalWidth = useMemo(() => width + widthOffset, [width, widthOffset]);

  function handleResize(offset: number, dragging: boolean) {
    const finalOffset = Math.max(
      MIN_COLUMN_WIDTH - width, 
      Math.min(MAX_COLUMN_WIDTH - width, offset),
    );
    if (dragging) {
      setWidthOffset(finalOffset);
    } else {
      setWidthOffset(0);
      setWidth(width + finalOffset);
      localStorage.setItem(`column:width:${resizeKey}`, String(width + finalOffset));
    }
  }

  function handleResetWidth() {
    setWidth(defaultWidth || 0);
    localStorage.removeItem(`column:width:${resizeKey}`);
  }

  return (
    <div className='h-full flex flex-col relative' style={{ width: finalWidth ? finalWidth : undefined }}>
      <div className='flex-none flex items-center px-6 py-4 bg-[var(--color-bg-2)] rounded-t-lg cursor-default'>
        <div className='font-bold tracking-wide'>{title}</div>
      </div>
      <ScrollWrapper
        className='flex-auto mt-2 min-h-0 bg-[var(--color-bg-2)] rounded-b-lg'
        resetKey={scrollResetKey}
      >
        {children}
      </ScrollWrapper>
      {resizeKey && (
        <Resizer
          className='absolute top-[17px] right-[-15px]'
          onResize={handleResize}
          onReset={handleResetWidth}
        />
      )}
    </div>
  );
}