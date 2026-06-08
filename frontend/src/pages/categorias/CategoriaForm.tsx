import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Input from '@src/components/ui/Input';
import Button from '@src/components/ui/Button';
import type { Categoria } from '@src/types';
import styles from './CategoriaForm.module.css';

const schema = z.object({
  nombre: z.string().min(1, 'Nombre requerido'),
  descripcion: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface Props {
  onSubmit: (values: Omit<Categoria, 'id'>) => Promise<void>;
  onCancel?: () => void;
  initialValues?: Partial<Categoria>;
  submitLabel?: string;
}

export default function CategoriaForm({ onSubmit, onCancel, initialValues, submitLabel }: Props) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema) as never,
    defaultValues: {
      nombre: initialValues?.nombre ?? '',
      descripcion: initialValues?.descripcion ?? '',
    },
  });

  useEffect(() => {
    reset({
      nombre: initialValues?.nombre ?? '',
      descripcion: initialValues?.descripcion ?? '',
    });
  }, [initialValues, reset]);

  const submit = async (values: FormData) => {
    await onSubmit({
      nombre: values.nombre.trim(),
      descripcion: values.descripcion?.trim() ?? '',
      activo: true,
    });
    reset({ nombre: '', descripcion: '' });
  };

  return (
    <form onSubmit={handleSubmit(submit)} className={styles.form}>
      <Input label="Nombre" {...register('nombre')} error={errors.nombre?.message} />
      <Input label="Descripcion" {...register('descripcion')} error={errors.descripcion?.message} />

      <div className={styles.actions}>
        {onCancel ? (
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancelar
          </Button>
        ) : null}
        <Button type="submit" disabled={isSubmitting}>
          {submitLabel ?? 'Guardar categoria'}
        </Button>
      </div>
    </form>
  );
}
