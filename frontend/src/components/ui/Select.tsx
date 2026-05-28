import type { SelectHTMLAttributes } from 'react';
import styles from './ui.module.css';

interface Props extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
}

export default function Select({ label, error, children, className, ...props }: Props) {
  return (
    <label className={styles.field}>
      {label ? <span>{label}</span> : null}
      <select
        {...props}
        className={`${styles.input} ${className ?? ''}`.trim()}
      >
        {children}
      </select>
      {error ? <small className={styles.error}>{error}</small> : null}
    </label>
  );
}
