import { useEffect, useState } from 'react';
import { Button } from '@arco-design/web-react';
import { MSG_SYNC_PROGRESS_UPDATED, MSG_SYNC_INFO_UPDATED, initMessageHandlers } from '../../../../common/message';
import icon from '../../../../assets/icons/icon-128.png';

export interface Props {
  onInited: () => void;
}

export default function Init({ onInited }: Props) {
  const [completed, setCompleted] = useState(0);
  const [total, setTotal] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    return initMessageHandlers({
      [MSG_SYNC_PROGRESS_UPDATED]: async (completed: number, total: number) => {
        setCompleted(completed);
        setTotal(total);
      },
      [MSG_SYNC_INFO_UPDATED]: async (afterDetection: boolean) => {
        if (afterDetection) {
          setDone(true);
        }
      },
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className='fixed inset-0 z-10 bg-[var(--color-bg-1)] flex flex-col items-center justify-center gap-4'>
      {done ? (
        <>
          <div className='relative mr-4'>
            <img src={icon} alt='icon' className='w-10 h-10' />
            <div className='absolute left-1/2 top-1/2 bg-red-600 text-white text-xs font-semibold p-1 px-2 rounded-md border-white border'>
              42
            </div>
          </div>
          <div className='font-semibold mt-3 tracking-wider'>
            Pin the extension to the toolbar to get notified of updates.
          </div>
          <Button
            type='primary'
            size='large'
            className='mt-3 font-semibold tracking-wider'
            onClick={onInited}
          >
            I got it, let's start
          </Button>
        </>
      ) : (
        <div className='font-semibold tracking-wider'>
          Initializing, this may take a few minutes. ({completed}/{total})
        </div>
      )}
    </div>
  );
}