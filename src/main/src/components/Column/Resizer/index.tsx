import { useState } from 'react';
import { IconDragDotVertical } from '@arco-design/web-react/icon';

export interface Props {
  className?: string;
  style?: React.CSSProperties;
  onResize?: (offset: number, dragging: boolean) => void;
  onReset?: () => void;
}

export default function Resizer({ className, style, onResize, onReset }: Props) {
  const [dragging, setDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [firstClickTime, setFirstClickTime] = useState(0);

  function handleMouseDown(e: React.MouseEvent<HTMLDivElement>) {
    if (Date.now() - firstClickTime < 300) {
      setDragging(false);
      onReset?.();
      return;
    }
    setFirstClickTime(Date.now());
    setDragging(true);
    setStartX(e.clientX);
    e.preventDefault();
  }

  function handleMouseUp(e: React.MouseEvent<HTMLDivElement>) {
    if (!dragging) return;
    setDragging(false);
    onResize?.(e.clientX - startX, false);
  }

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (!dragging) return;
    onResize?.(e.clientX - startX, true);
  }

  return (
    <div
      className={`cursor-col-resize opacity-10 hover:opacity-30 z-10 ${className || ''}`}
      style={style}
      onMouseDown={handleMouseDown}
    >
      <IconDragDotVertical />
      <div
        className='fixed inset-0 cursor-col-resize pointer-events-none'
        style={{ pointerEvents: dragging ? 'auto' : 'none' }}
        onMouseUp={handleMouseUp}
        onMouseMove={handleMouseMove}
      />
    </div>
  );
}