export type Theme = 'light' | 'dark' | 'auto';

export function initTheme() {
  const onSystemThemeChange = (systemTheme: Theme) => {
    if (getTheme() === 'auto') {
      doApplyTheme(systemTheme);
    }
  };

  const mq = window.matchMedia("(prefers-color-scheme: dark)");
  mq.addEventListener('change', e => {
    onSystemThemeChange(mq.matches ? 'dark' : 'light');
  });

  applyTheme(getTheme());
}

export function onOtherTabThemeChanged(cb: () => void) {
  window.addEventListener('storage', e => {
    if (e.key === 'theme') {
      cb();
    }
  });
  return () => {
    window.removeEventListener('storage', cb);
  };
}

export function changeTheme(theme: Theme) {
  setTheme(theme);
  applyTheme(theme === 'auto' ? getSystemTheme() : theme);
}

export function getTheme(): Theme {
  const theme = localStorage.getItem('theme');
  return theme ? (theme as Theme) : 'auto';
}

function setTheme(theme: Theme) {
  localStorage.setItem('theme', theme);
}

export function applyTheme(theme: Theme) {
  if (theme === 'auto') {
    doApplyTheme(getSystemTheme());
  } else {
    doApplyTheme(theme);
  }
}

function doApplyTheme(theme: Theme) {
  if (theme === 'dark') {
    document.body.setAttribute('arco-theme', 'dark');
  } else {
    document.body.removeAttribute('arco-theme');
  }
}

function getSystemTheme(): Theme {
  const mq = window.matchMedia("(prefers-color-scheme: dark)");
  return mq.matches ? 'dark' : 'light';
}
