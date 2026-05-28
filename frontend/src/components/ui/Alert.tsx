import styles from './ui.module.css';

interface Props {
  type: 'success' | 'error' | 'warning';
  message: string;
}

export default function Alert({ type, message }: Props) {
  const variantClass = {
    success: styles.alertSuccess,
    error: styles.alertError,
    warning: styles.alertWarning,
  }[type];

  return (
    <div className={`${styles.alert} ${variantClass}`}>
      {message}
    </div>
  );
}
