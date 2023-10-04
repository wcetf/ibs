import { useEffect, useRef, useState } from 'react';

export interface Props {
  resetKey?: any;
  style?: React.CSSProperties;
  className?: string;
  children?: React.ReactNode;
}

export default function ScrollWrapper({ resetKey, style, className, children }: Props) {
  const bar = useRef<HTMLDivElement>(null);
  const box = useRef<HTMLDivElement | null>(null);
  const timer = useRef<any>(null);
  const [barTop, setBarTop] = useState(0);
  const [barHeight, setBarHeight] = useState(0);
  const [scrolling, setScrolling] = useState(false);
  const [startY, setStartY] = useState(0);
  const [startOffset, setStartOffset] = useState(0);
  const [visible, setVisible] = useState(false);
  const [hovering, setHovering] = useState(false);

  function autoHide() {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setVisible(false), 3000);
  }

  function handleScroll(e: React.UIEvent<HTMLDivElement>) {
    const target = e.target as HTMLDivElement;
    box.current = target;
    setBarTop(target.scrollTop / target.scrollHeight * target.offsetHeight);
    setBarHeight(target.offsetHeight / target.scrollHeight * target.offsetHeight);
    if (!hovering) return;
    setVisible(true);
    autoHide();
  }

  function handleMouseDown(e: React.MouseEvent<HTMLDivElement>) {
    setScrolling(true);
    if (!box.current) return;
    setStartY(e.clientY);
    setStartOffset(box.current.scrollTop);
  }

  function handleScrollingMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (!scrolling || !box.current) return;
    box.current.scrollTop = startOffset + (e.clientY - startY) / box.current.offsetHeight * box.current.scrollHeight;
    autoHide();
  }

  function handleScrollingMouseUp(e: React.MouseEvent<HTMLDivElement>) {
    setScrolling(false);
  }

  useEffect(() => {
    setTimeout(() => {
      if (box.current) {
        box.current.scrollTop = 0;
      }
    });
  }, [resetKey]);

  return (
    <div
      className={`relative no-scrollbar ${className || ''}`}
      style={style}
      onScrollCapture={handleScroll}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
    >
      {children}
      <div
        className='absolute top-0 bottom-0 right-[-11px] w-[7px] z-10'
        onMouseDown={handleMouseDown}
      >
        <div
          ref={bar}
          className='absolute left-0 right-0 bg-[var(--color-fill-3)] rounded-full transition-opacity duration-300 hover:bg-[var(--color-fill-4)]'
          style={{
            top: barTop,
            height: barHeight,
            opacity: visible ? 1 : 0,
            backgroundColor: scrolling ? 'var(--color-fill-4)' : '',
          }}
        />
        <div
          className='fixed inset-0 z-20'
          style={{ pointerEvents: scrolling ? 'auto' : 'none' }}
          onMouseMove={handleScrollingMouseMove}
          onMouseUp={handleScrollingMouseUp}
        />
      </div>
    </div>
  );
}