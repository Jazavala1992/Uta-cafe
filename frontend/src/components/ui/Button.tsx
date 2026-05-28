import type { ButtonHTMLAttributes } from 'react';
import styles from './ui.module.css';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
}

export default function Button({ variant = 'primary', className, ...props }: Props) {
  return (
    <button
      {...props}
      className={`${styles.button} ${styles[variant]} ${className ?? ''}`.trim()}
    />
  );
}
