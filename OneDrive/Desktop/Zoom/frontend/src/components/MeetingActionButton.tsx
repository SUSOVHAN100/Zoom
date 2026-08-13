import Link from 'next/link';
import { ReactNode } from 'react';

interface MeetingActionButtonProps {
  label: string;
  onClick?: () => void;
  href?: string;
  icon?: ReactNode;
  variant?: 'primary' | 'secondary' | 'danger' | 'success';
  style?: React.CSSProperties;
}

export default function MeetingActionButton({
  label,
  onClick,
  href,
  icon,
  variant = 'primary',
  style
}: MeetingActionButtonProps) {
  
  const getClassName = () => {
    switch (variant) {
      case 'secondary':
        return 'btn-action btn-action-secondary';
      case 'danger':
        return 'btn-action btn-action-danger';
      case 'success':
        return 'btn-action btn-action-success';
      case 'primary':
      default:
        return 'btn-action btn-action-primary';
    }
  };

  const className = getClassName();

  if (href) {
    return (
      <Link
        href={href}
        className={className}
        style={style}
      >
        {icon}
        {label}
      </Link>
    );
  }

  return (
    <button
      onClick={onClick}
      className={className}
      style={style}
    >
      {icon}
      {label}
    </button>
  );
}
