import { Button } from '@arco-design/web-react';

export interface Props {
  icon: React.ReactNode;
  href?: string;
  className?: string;
  title?: string;
  onClick?: () => void;
}

export default function NavButton({ icon, href, className, title, onClick }: Props) {
  return (
    <Button
      className={`flex justify-center items-center ${className}`}
      style={{ color: 'inherit' }}
      title={title}
      type='text'
      shape='circle'
      size='large'
      iconOnly
      icon={icon}
      href={href}
      target='_blank'
      rel='noopener noreferrer'
      onClick={onClick}
    />
  );
}
