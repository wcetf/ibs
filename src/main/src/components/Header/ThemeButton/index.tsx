import { useEffect, useState } from 'react';
import {
  IconDesktop,
  IconSunFill,
  IconMoonFill,
} from '@arco-design/web-react/icon';
import { Theme, applyTheme, changeTheme, getTheme, onOtherTabThemeChanged } from '../../../theme';
import NavButton from '../NavButton';

export interface Props {
  className?: string;
}

export default function ThemeButton({ className }: Props) {
  const [theme, setTheme] = useState<Theme>('dark');

  useEffect(() => {
    setTheme(getTheme());
    return onOtherTabThemeChanged(() => {
      const nextTheme = getTheme();
      applyTheme(nextTheme);
      setTheme(nextTheme);
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function handleClick() {
    const nextTheme = theme === 'auto' ? 'dark' : theme === 'dark' ? 'light' : 'auto';
    changeTheme(nextTheme);
    setTheme(nextTheme);
  }

  return (
    <NavButton
      className={className}
      title='Theme'
      icon={
        (theme === 'auto' && <IconDesktop fontSize={18} />) ||
        (theme === 'light' && <IconSunFill fontSize={18} />) ||
        (theme === 'dark' && <IconMoonFill fontSize={18} />)
      }
      onClick={handleClick}
    />
  );
}
