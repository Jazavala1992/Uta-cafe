import { useEffect, useMemo, useState } from 'react';
import { useFieldArray, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, useParams } from 'react-router-dom';
import Select from '@src/components/ui/Select';
import Button from '@src/components/ui/Button';
import Input from '@src/components/ui/Input';
import { proveedorService } from '@src/services/proveedorService';
import { ordenCompraService } from '@src/services/ordenCompraService';
import type { Proveedor } from '@src/types';
import { useAuthStore } from '@src/store/authStore';
import { useUiStore } from '@src/store/uiStore';
import { formatCurrency } from '@src/utils/formatters';
import styles from './CompraForm.module.css';

const detailSchema = z.object({
  productoId: z.string().min(1, 'Producto requerido'),
  cantidad: z.coerce.number().min(1, 'Cantidad invalida'),
  precioUnitario: z.coerce.number().min(0, 'Precio invalido'),
});

const schema = z.object({
  proveedorId: z.string().min(1, 'Proveedor requerido'),
  fecha: z.string().min(1, 'Fecha requerida'),
  notas: z.string().optional(),
  estado: z.enum(['pendiente', 'recibida', 'cancelada']),
  detalle: z.array(detailSchema).min(1, 'Debe agregar al menos un producto'),
});

type FormData = z.infer<typeof schema>;

export default function CompraForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const addToast = useUiStore((s) => s.addToast);
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);

  const {
    register,
    control,
    setValue,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema) as never,
    defaultValues: {
      fecha: new Date().toISOString().slice(0, 10),
      estado: 'pendiente',
      notas: '',
      detalle: [{ productoId: '', cantidad: 1, precioUnitario: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'detalle' });

  useEffect(() => {
    let mounted = true;
    (async () => {
      const proveedoresData = await proveedorService.getAll(false);
      if (!mounted) return;
      setProveedores(proveedoresData);

      if (id) {
        const orden = await ordenCompraService.getById(id);
        if (orden && mounted) {
          reset({
            proveedorId: orden.proveedorId,
            fecha: orden.fecha.slice(0, 10),
            estado: orden.estado,
            notas: orden.notas,
            detalle: orden.detalle.length
              ? orden.detalle.map((d) => ({
                  productoId: d.productoId,
                  cantidad: d.cantidad,
                  precioUnitario: d.precioUnitario,
                }))
              : [{ productoId: '', cantidad: 1, precioUnitario: 0 }],
          });
        }
      }
    })();
    return () => {
      mounted = false;
    };
  }, [id, reset]);

  const proveedorId = useWatch({ control, name: 'proveedorId' });
  const detalleWatch = useWatch({ control, name: 'detalle' });
  const detalle = useMemo(() => detalleWatch ?? [], [detalleWatch]);
  const proveedorSeleccionado = useMemo(
    () => proveedores.find((proveedor) => proveedor.id === proveedorId),
    [proveedorId, proveedores],
  );

  const productosFiltrados = useMemo(() => {
    if (!proveedorSeleccionado) return [];
    return proveedorSeleccionado.productos ?? [];
  }, [proveedorSeleccionado]);

  useEffect(() => {
    const idsValidos = new Set(productosFiltrados.map((producto) => producto.id));
    detalle.forEach((item, index) => {
      if (item.productoId && !idsValidos.has(item.productoId)) {
        setValue(`detalle.${index}.productoId`, '');
      }
    });
  }, [detalle, productosFiltrados, setValue]);

  const total = useMemo(
    () => detalle.reduce((acc, d) => acc + (Number(d.cantidad) || 0) * (Number(d.precioUnitario) || 0), 0),
    [detalle]
  );

  const onSubmit = async (data: FormData) => {
    const proveedor = proveedores.find((p) => p.id === data.proveedorId);
    const payload = {
      proveedorId: data.proveedorId,
      proveedorNombre: proveedor?.razonSocial,
      usuarioId: user?.id ?? '1',
      estado: data.estado,
      total,
      fecha: new Date(data.fecha).toISOString(),
      notas: data.notas || '',
      detalle: data.detalle.map((d) => ({
        id: Math.random().toString(36).slice(2, 11),
        ordenId: id || 'nueva',
        productoId: d.productoId,
        productoNombre: productosFiltrados.find((p) => p.id === d.productoId)?.nombre,
        cantidad: d.cantidad,
        precioUnitario: d.precioUnitario,
        subtotal: d.cantidad * d.precioUnitario,
      })),
      activo: true,
    };

    if (id) await ordenCompraService.update(id, payload);
    else await ordenCompraService.create(payload);

    addToast('success', 'Orden de compra guardada');
    navigate('/compras');
  };

  return (
    <section className={styles.page}>
      <h1>{id ? 'Editar compra' : 'Nueva compra'}</h1>
      <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
        <div className={styles.topGrid}>
          <Select label="Proveedor" {...register('proveedorId')} error={errors.proveedorId?.message}>
            <option value="">Seleccione</option>
            {proveedores.map((p) => (
              <option key={p.id} value={p.id}>{p.razonSocial}</option>
            ))}
          </Select>
          <Input label="Fecha" type="date" {...register('fecha')} error={errors.fecha?.message} />
          <Select label="Estado" {...register('estado')}>
            <option value="pendiente">pendiente</option>
            <option value="recibida" disabled>recibida</option>
            <option value="cancelada">cancelada</option>
          </Select>
        </div>

        <label className={styles.notesField}>
          <span>Notas</span>
          <textarea {...register('notas')} rows={3} className={styles.textarea} />
        </label>

        <div className={styles.detailSection}>
          <h3>Detalle</h3>
          {fields.map((field, i) => (
            <div key={field.id} className={styles.detailRow}>
              <div className={styles.fieldCol}>
                <small className={styles.fieldLabel}>Producto</small>
                <Select
                  {...register(`detalle.${i}.productoId`)}
                >
                  <option value="">Seleccione producto</option>
                  {productosFiltrados.map((p) => (
                    <option key={p.id} value={p.id}>{p.nombre}</option>
                  ))}
                </Select>
              </div>
              <div className={styles.fieldCol}>
                <small className={styles.fieldLabel}>Cantidad</small>
                <Input type="number" min={1} {...register(`detalle.${i}.cantidad`)} />
              </div>
              <div className={styles.fieldCol}>
                <small className={styles.fieldLabel}>Precio unitario</small>
                <Input type="number" min={0} step="0.01" {...register(`detalle.${i}.precioUnitario`)} />
              </div>
              <div className={styles.fieldCol}>
                <small className={styles.fieldLabel}>Subtotal</small>
                <Input
                  readOnly
                  value={formatCurrency(
                    (Number(detalle?.[i]?.cantidad) || 0) * (Number(detalle?.[i]?.precioUnitario) || 0)
                  )}
                />
              </div>
              <Button type="button" variant="danger" onClick={() => remove(i)}>Quitar</Button>
            </div>
          ))}
          <Button type="button" variant="ghost" onClick={() => append({ productoId: '', cantidad: 1, precioUnitario: 0 })}>
            Agregar producto
          </Button>
          {proveedorSeleccionado && (proveedorSeleccionado.productos?.length ?? 0) > 0 ? (
            <small>
              Mostrando productos definidos en el catalogo del proveedor.
            </small>
          ) : null}
          {proveedorSeleccionado && (proveedorSeleccionado.productos?.length ?? 0) === 0 ? (
            <small>
              El proveedor no tiene productos cargados. Edita el proveedor para anadir su catalogo.
            </small>
          ) : null}
          {errors.detalle?.message ? <small className={styles.error}>{errors.detalle?.message}</small> : null}
        </div>

        <h3>Total: {formatCurrency(total)}</h3>
        <Button type="submit" disabled={isSubmitting}>Guardar compra</Button>
      </form>
    </section>
  );
}
