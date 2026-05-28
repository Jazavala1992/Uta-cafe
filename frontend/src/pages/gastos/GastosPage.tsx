import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Table from '@src/components/ui/Table';
import Input from '@src/components/ui/Input';
import Button from '@src/components/ui/Button';
import { gastoService } from '@src/services/gastoService';
import type { Gasto } from '@src/types';
import { formatCurrency, formatDate } from '@src/utils/formatters';
import { useAuthStore } from '@src/store/authStore';
import styles from './GastosPage.module.css';

const schema = z.object({
  descripcion: z.string().min(1, 'Descripcion requerida'),
  categoria: z.string().min(1, 'Categoria requerida'),
  monto: z.coerce.number().min(0, 'Monto invalido'),
  fecha: z.string().min(1, 'Fecha requerida'),
});

type FormData = z.infer<typeof schema>;

export default function GastosPage() {
  const user = useAuthStore((s) => s.user);
  const [showDeleted, setShowDeleted] = useState(false);
  const [data, setData] = useState<Gasto[]>([]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema) as never,
    defaultValues: { fecha: new Date().toISOString().slice(0, 10) },
  });

  const load = async () => setData(await gastoService.getAll(showDeleted));
  useEffect(() => {
    void load();
  }, [showDeleted]);

  const onSubmit = async (values: FormData) => {
    await gastoService.create({
      usuarioId: user?.id || '1',
      descripcion: values.descripcion,
      categoria: values.categoria,
      monto: values.monto,
      fecha: new Date(values.fecha).toISOString(),
      activo: true,
    });
    reset({ descripcion: '', categoria: '', monto: 0, fecha: new Date().toISOString().slice(0, 10) });
    await load();
  };

  return (
    <section className={styles.page}>
      <h1>Gastos</h1>

      <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
        <Input label="Descripcion" {...register('descripcion')} error={errors.descripcion?.message} />
        <Input label="Categoria" {...register('categoria')} error={errors.categoria?.message} />
        <Input label="Monto" type="number" step="0.01" {...register('monto')} error={errors.monto?.message} />
        <Input label="Fecha" type="date" {...register('fecha')} error={errors.fecha?.message} />
        <div className={styles.submitWrap}>
          <Button type="submit" disabled={isSubmitting}>Agregar</Button>
        </div>
      </form>

      <Table<Gasto>
        columns={[
          { key: 'descripcion', header: 'Descripcion' },
          { key: 'categoria', header: 'Categoria' },
          { key: 'monto', header: 'Monto', render: (row) => formatCurrency(row.monto) },
          { key: 'fecha', header: 'Fecha', render: (row) => formatDate(row.fecha) },
        ]}
        data={data}
        searchable
        searchKeys={['descripcion', 'categoria']}
        showDeleted={showDeleted}
        onToggleShowDeleted={() => setShowDeleted((v) => !v)}
        isAdmin
        onDelete={async (row) => {
          await gastoService.delete(row.id);
          await load();
        }}
        onRestore={async (row) => {
          await gastoService.restore(row.id);
          await load();
        }}
      />
    </section>
  );
}
