import { usePasswordStrength } from '@src/hooks/usePasswordStrength';
import styles from './ui.module.css';

interface Props {
  password: string;
}

export default function PasswordStrengthBar({ password }: Props) {
  const strength = usePasswordStrength(password);

  const config = {
    debil: { label: 'Debil', color: 'var(--color-danger)', width: '33%' },
    intermedio: { label: 'Intermedio', color: 'var(--color-warning)', width: '66%' },
    fuerte: { label: 'Fuerte', color: 'var(--color-success)', width: '100%' },
    '': { label: '', color: 'transparent', width: '0%' },
  };

  const cfg = config[strength];
  const fillClass = {
    debil: styles.passwordFillDebil,
    intermedio: styles.passwordFillIntermedio,
    fuerte: styles.passwordFillFuerte,
    '': styles.passwordFillEmpty,
  }[strength];

  const labelClass = {
    debil: styles.passwordLabelDebil,
    intermedio: styles.passwordLabelIntermedio,
    fuerte: styles.passwordLabelFuerte,
    '': styles.passwordLabelEmpty,
  }[strength];

  return (
    <div className={styles.passwordStrength}>
      <div className={styles.passwordTrack}>
        <div className={`${styles.passwordFill} ${fillClass}`} />
      </div>
      {strength && (
        <span className={`${styles.passwordLabel} ${labelClass}`}>
          Contrasena {cfg.label}
        </span>
      )}
    </div>
  );
}
