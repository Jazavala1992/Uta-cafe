import type { InputHTMLAttributes } from 'react';
import styles from './ui.module.css';

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export default function Input({ label, error, className, ...props }: Props) {
  return (
    <label className={styles.field}>
      {label ? <span>{label}</span> : null}
      <input
        {...props}
        className={`${styles.input} ${className ?? ''}`.trim()}
      />
      {error ? <small className={styles.error}>{error}</small> : null}
    </label>
  );
}
