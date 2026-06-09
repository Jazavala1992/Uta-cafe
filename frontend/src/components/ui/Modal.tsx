import type { ReactNode } from 'react';
import styles from './ui.module.css';

interface Props {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  size?: 'default' | 'wide';
}

export default function Modal({ open, title, onClose, children, size = 'default' }: Props) {
  if (!open) return null;
  return (
    <div className={styles.modalOverlay}>
      <div className={`${styles.modalContent} ${size === 'wide' ? styles.modalContentWide : ''}`.trim()}>
        <div className={styles.modalHeader}>
          <h3>{title}</h3>
          <button onClick={onClose} className={styles.modalClose}>
            Cerrar
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
