import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import styles from './charts.module.css';

interface Props {
  data: { name: string; ingresos: number; egresos: number }[];
}

export default function LineChartTendencia({ data }: Props) {
  return (
    <div className={styles.card}>
      <h3 className={styles.title}>Tendencia 30 dias</h3>
      <ResponsiveContainer width="100%" height="90%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="ingresos" stroke="var(--color-primary)" strokeWidth={2} />
          <Line type="monotone" dataKey="egresos" stroke="var(--color-danger)" strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
