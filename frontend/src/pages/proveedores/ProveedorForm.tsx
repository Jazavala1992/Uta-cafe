import { useFieldArray, useForm } from 'react-hook-form';
import { useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Input from '@src/components/ui/Input';
import Button from '@src/components/ui/Button';
import type { Proveedor } from '@src/types';
import styles from './ProveedorForm.module.css';

const schema = z.object({
  razonSocial: z.string().min(1, 'Razon social requerida'),
  contacto: z.string().min(1, 'Contacto requerido'),
  telefono: z.string().min(1, 'Telefono requerido'),
  email: z.string().email('Email invalido'),
  direccion: z.string().min(1, 'Direccion requerida'),
  productos: z.array(
    z.object({
      id: z.string(),
      nombre: z.string().min(1, 'Nombre requerido'),
    }),
  ),
});

type FormData = z.infer<typeof schema>;

interface Props {
  onSubmit: (values: Omit<Proveedor, 'id'>) => Promise<void>;
  onCancel?: () => void;
  initialValues?: Partial<Proveedor>;
  submitLabel?: string;
}

export default function ProveedorForm({ onSubmit, onCancel, initialValues, submitLabel }: Props) {
  const createLocalId = () => Math.random().toString(36).slice(2, 11);

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      razonSocial: initialValues?.razonSocial ?? '',
      contacto: initialValues?.contacto ?? '',
      telefono: initialValues?.telefono ?? '',
      email: initialValues?.email ?? '',
      direccion: initialValues?.direccion ?? '',
      productos: (initialValues?.productos ?? []).map((producto) => ({
        id: producto.id ?? '',
        nombre: producto.nombre,
      })),
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'productos',
  });

  useEffect(() => {
    reset({
      razonSocial: initialValues?.razonSocial ?? '',
      contacto: initialValues?.contacto ?? '',
      telefono: initialValues?.telefono ?? '',
      email: initialValues?.email ?? '',
      direccion: initialValues?.direccion ?? '',
      productos: (initialValues?.productos ?? []).map((producto) => ({
        id: producto.id || Math.random().toString(36).slice(2, 11),
        nombre: producto.nombre,
      })),
    });
  }, [initialValues, reset]);

  const submit = async (values: FormData) => {
    await onSubmit({
      ...values,
      productos: (values.productos ?? [])
        .filter((producto) => producto.nombre.trim().length > 0)
        .map((producto) => ({
          id: producto.id || Math.random().toString(36).slice(2, 11),
          nombre: producto.nombre.trim(),
        })),
      activo: true,
    });
    reset();
  };

  return (
    <form onSubmit={handleSubmit(submit)} className={styles.form}>
      <section className={styles.section}>
        <div className={styles.sectionHeading}>
          <h4>1. Datos del proveedor</h4>
          <small className={styles.helpText}>Primero completa la identidad y los datos de contacto.</small>
        </div>

        <Input label="Razon social" {...register('razonSocial')} error={errors.razonSocial?.message} />
        <div className={styles.grid2}>
          <Input label="Contacto" {...register('contacto')} error={errors.contacto?.message} />
          <Input label="Telefono" {...register('telefono')} error={errors.telefono?.message} />
        </div>
        <div className={styles.grid2}>
          <Input label="Email" type="email" {...register('email')} error={errors.email?.message} />
          <Input label="Direccion" {...register('direccion')} error={errors.direccion?.message} />
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeading}>
          <h4>2. Catalogo de productos</h4>
          <small className={styles.helpText}>Agrega los productos del proveedor para usarlos en compras.</small>
        </div>

        <label className={styles.multiField}>
          <span>Productos del proveedor</span>
          <div className={styles.productList}>
            {fields.length ? fields.map((field, index) => (
              <div key={field.id} className={styles.catalogRow}>
                <Input
                  label={`Producto ${index + 1}`}
                  {...register(`productos.${index}.nombre`)}
                  error={errors.productos?.[index]?.nombre?.message}
                />
                <Button type="button" variant="danger" onClick={() => remove(index)}>
                  Quitar
                </Button>
              </div>
            )) : <small className={styles.helpText}>Sin productos cargados.</small>}
          </div>
          <Button
            type="button"
            variant="ghost"
            onClick={() => append({ id: createLocalId(), nombre: '' })}
          >
            Agregar producto del proveedor
          </Button>
          <small className={styles.helpText}>
            Estos productos son propios del proveedor y se usan directamente al crear ordenes de compra.
          </small>
        </label>
      </section>

      <div className={styles.actions}>
        {onCancel ? (
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancelar
          </Button>
        ) : null}
        <Button type="submit" disabled={isSubmitting}>
          {submitLabel ?? 'Guardar proveedor'}
        </Button>
      </div>
    </form>
  );
}
