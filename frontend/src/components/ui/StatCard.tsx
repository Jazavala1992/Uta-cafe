import styles from './ui.module.css';

interface Props {
  title: string;
  value: string;
  subtitle?: string;
}

export default function StatCard({ title, value, subtitle }: Props) {
  return (
    <article className={styles.statCard}>
      <p className={styles.statTitle}>{title}</p>
      <strong className={styles.statValue}>{value}</strong>
      {subtitle ? <p className={styles.statSubtitle}>{subtitle}</p> : null}
    </article>
  );
}
