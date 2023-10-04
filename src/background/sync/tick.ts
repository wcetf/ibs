const onTick = (() => {
  let running = false;
  return async (cb: () => void) => {
    try {
      if (running) return;
      running = true;
      await cb();
    } catch (err) {
      console.error(err);
    } finally {
      running = false;
    }
  };
})();

export async function init(periodInMinutes: number, cb: () => void) {
  await chrome.alarms.onAlarm.addListener(({ name }) => name === 'sync:tick' && onTick(cb));
  await chrome.alarms.create('sync:tick', { periodInMinutes });
}
