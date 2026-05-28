import { useEffect, useState } from 'react';
import Table from '@src/components/ui/Table';
import Badge from '@src/components/ui/Badge';
import { authService } from '@src/services/authService';
import { formatDateTime } from '@src/utils/formatters';
import type { AccesoLog } from '@src/types';
import styles from './AccesoLogPage.module.css';

export default function AccesoLogPage() {
  const [search, setSearch] = useState('');
  const [logs, setLogs] = useState<AccesoLog[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        setLogs(await authService.getLogs());
      } catch {
        setLogs([]);
      }
    };
    void load();
  }, []);

  const data = logs.filter(
    (l) =>
      l.nombreUsuario.toLowerCase().includes(search.toLowerCase()) ||
      formatDateTime(l.fechaHora).toLowerCase().includes(search.toLowerCase())
  );

  return (
    <section className={styles.page}>
      <h1>Registro de acceso</h1>
      <input
        placeholder="Buscar por usuario o fecha"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className={styles.search}
      />
      <Table
        columns={[
          { key: 'nombreUsuario', header: 'Usuario' },
          { key: 'ip', header: 'IP' },
          { key: 'browser', header: 'Navegador' },
          {
            key: 'evento',
            header: 'Evento',
            render: (row) =>
              row.evento === 'ingreso' ? <Badge color="success">Ingreso</Badge> : <Badge color="danger">Salida</Badge>,
          },
          { key: 'fechaHora', header: 'Fecha y Hora', render: (row) => formatDateTime(row.fechaHora as string) },
        ]}
        data={data}
        pageSize={10}
      />
    </section>
  );
}
