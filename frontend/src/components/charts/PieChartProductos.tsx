import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import styles from './charts.module.css';

interface Props {
  data: { name: string; value: number }[];
}

const COLORS = ['#7b3f2e', '#2e5c3a', '#c27a5f', '#3b1c0d', '#4a7c5a'];

export default function PieChartProductos({ data }: Props) {
  return (
    <div className={styles.card}>
      <h3 className={styles.title}>Distribucion por categoria</h3>
      <ResponsiveContainer width="100%" height="90%">
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={88}>
            {data.map((_, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
