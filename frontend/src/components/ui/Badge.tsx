import styles from './ui.module.css';

interface Props {
  children: string;
  color?: 'success' | 'danger' | 'warning' | 'muted';
}

export default function Badge({ children, color = 'muted' }: Props) {
  const variantClass = {
    success: styles.badgeSuccess,
    danger: styles.badgeDanger,
    warning: styles.badgeWarning,
    muted: styles.badgeMuted,
  }[color];

  return (
    <span className={`${styles.badge} ${variantClass}`}>
      {children}
    </span>
  );
}
