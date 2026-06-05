import { useEffect, useMemo, useState } from 'react';
import { useFieldArray, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, useParams } from 'react-router-dom';
import Select from '@src/components/ui/Select';
import Button from '@src/components/ui/Button';
import Input from '@src/components/ui/Input';
import { categoriaService } from '@src/services/categoriaService';
import { productoService } from '@src/services/productoService';
import { ventaService } from '@src/services/ventaService';
import type { Categoria, Producto } from '@src/types';
import { useAuthStore } from '@src/store/authStore';
import { useUiStore } from '@src/store/uiStore';
import { formatCurrency } from '@src/utils/formatters';
import { construirMensajeWhatsAppNotaVenta, generarTicketNotaVenta } from '@src/utils/pdfGenerator';
import styles from './VentaForm.module.css';

const mesas = Array.from({ length: 10 }).map((_, i) => ({ id: String(i + 1), numero: i + 1 }));

const detailSchema = z.object({
  productoId: z.string().min(1, 'Producto requerido'),
  cantidad: z.coerce.number().min(1, 'Cantidad invalida'),
  precioUnitario: z.coerce.number().min(0, 'Precio invalido'),
  notas: z.string().optional(),
});

const schema = z.object({
  mesaId: z.string().min(1, 'Mesa requerida'),
  fecha: z.string().min(1, 'Fecha requerida'),
  descuento: z.coerce.number().min(0, 'Descuento invalido'),
  estado: z.enum(['abierta', 'cerrada', 'anulada']),
  submitAction: z.enum(['guardar', 'imprimir', 'whatsapp']).optional(),
  detalle: z.array(detailSchema).min(1, 'Debe agregar al menos un producto'),
});

type FormData = z.infer<typeof schema>;

export default function VentaForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const addToast = useUiStore((s) => s.addToast);

  const [productos, setProductos] = useState<Producto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [categoriaFiltro, setCategoriaFiltro] = useState('todas');

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
      mesaId: '',
      fecha: new Date().toISOString().slice(0, 16),
      descuento: 0,
      estado: 'abierta',
      submitAction: 'guardar',
      detalle: [],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'detalle' });
  const detalleWatch = useWatch({ control, name: 'detalle' });
  const detalle = useMemo(() => detalleWatch ?? [], [detalleWatch]);
  const descuento = useWatch({ control, name: 'descuento' }) ?? 0;

  const productosVendibles = useMemo(
    () =>
      productos.filter((producto) => {
        if (!producto.disponible) return false;
        if (!producto.usaStock) return true;
        return Number(producto.stockActual ?? 0) > 0;
      }),
    [productos],
  );

  useEffect(() => {
    const load = async () => {
      const [productosData, categoriasData] = await Promise.all([
        productoService.getAll(false),
        categoriaService.getAll(false),
      ]);
      setProductos(productosData.filter((producto) => producto.activo));
      setCategorias(categoriasData.filter((categoria) => categoria.activo));

      if (id) {
        const nota = await ventaService.getById(id);
        if (nota) {
          reset({
            mesaId: nota.mesaId,
            fecha: nota.fecha.slice(0, 16),
            estado: nota.estado,
            descuento: nota.descuento,
            detalle: nota.detalle.length
              ? nota.detalle.map((d) => ({
                  productoId: d.productoId,
                  cantidad: d.cantidad,
                  precioUnitario: d.precioUnitario,
                  notas: d.notas,
                }))
              : [],
          });
        }
      }
    };

    void load();
  }, [id, reset]);

  const productosFiltrados = useMemo(() => {
    const base = productosVendibles;
    if (categoriaFiltro === 'todas') return base;
    return base.filter((producto) => producto.categoriaId === categoriaFiltro);
  }, [categoriaFiltro, productosVendibles]);

  const subtotal = useMemo(
    () => detalle.reduce((acc, d) => acc + (Number(d.cantidad) || 0) * (Number(d.precioUnitario) || 0), 0),
    [detalle],
  );
  const total = Math.max(0, subtotal - (Number(descuento) || 0));

  const addProductoDesdeCard = (producto: Producto) => {
    const index = detalle.findIndex((item) => item.productoId === producto.id);
    if (index >= 0) {
      const cantidadActual = Number(detalle[index]?.cantidad || 0);
      setValue(`detalle.${index}.cantidad`, cantidadActual + 1, { shouldDirty: true, shouldValidate: true });
      return;
    }

    append({
      productoId: producto.id,
      cantidad: 1,
      precioUnitario: producto.precioUnitario,
      notas: '',
    });
  };

  const onSubmit = async (data: FormData) => {
    const mesa = mesas.find((m) => m.id === data.mesaId);
    const payload = {
      usuarioId: user?.id ?? '1',
      mesaId: data.mesaId,
      mesaNumero: mesa?.numero,
      numeroNota: id ? `N-${id}` : `N-${String(data.fecha || '').replace(/\D/g, '').slice(-6) || '000001'}`,
      estado: data.estado,
      subtotal,
      descuento: Number(data.descuento || 0),
      total,
      fecha: new Date(data.fecha).toISOString(),
      detalle: data.detalle.map((d) => ({
        id: Math.random().toString(36).slice(2, 11),
        notaId: id || 'nueva',
        productoId: d.productoId,
        productoNombre: productos.find((p) => p.id === d.productoId)?.nombre,
        cantidad: Number(d.cantidad || 0),
        precioUnitario: Number(d.precioUnitario || 0),
        subtotal: Number(d.cantidad || 0) * Number(d.precioUnitario || 0),
        notas: d.notas || '',
      })),
      activo: true,
    } as const;

    const submitAction = data.submitAction ?? 'guardar';

    if (id) await ventaService.update(id, payload);
    else await ventaService.create(payload);

    if (data.estado === 'cerrada' && submitAction !== 'guardar') {
      const ticketData = {
        numeroNota: payload.numeroNota,
        fecha: payload.fecha,
        mesaNumero: payload.mesaNumero,
        estado: payload.estado,
        detalle: payload.detalle,
        subtotal: payload.subtotal,
        descuento: payload.descuento,
        total: payload.total,
        generadoPor: user ? `${user.nombre} ${user.apellido}` : undefined,
      };

      if (submitAction === 'imprimir') {
        generarTicketNotaVenta(ticketData, { print: true, download: true });
      }

      if (submitAction === 'whatsapp') {
        const mensaje = construirMensajeWhatsAppNotaVenta(ticketData);
        window.open(`https://wa.me/?text=${encodeURIComponent(mensaje)}`, '_blank', 'noopener,noreferrer');
      }
    } else if (submitAction !== 'guardar' && data.estado !== 'cerrada') {
      addToast('warning', 'La nota debe estar cerrada para imprimir ticket.');
    }

    addToast('success', 'Nota de venta guardada');
    navigate('/ventas');
  };

  return (
    <section className={styles.page}>
      <h1>{id ? 'Editar venta' : 'Nueva venta'}</h1>
      <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
        <input type="hidden" {...register('submitAction')} />
        <div className={styles.topGrid}>
          <Select label="Mesa" {...register('mesaId')} error={errors.mesaId?.message}>
            <option value="">Seleccione</option>
            {mesas.map((m) => (
              <option key={m.id} value={m.id}>
                Mesa {m.numero}
              </option>
            ))}
          </Select>
          <Input label="Fecha y hora" type="datetime-local" {...register('fecha')} error={errors.fecha?.message} />
          <Select label="Estado" {...register('estado')}>
            <option value="abierta">abierta</option>
            <option value="cerrada">cerrada</option>
            <option value="anulada">anulada</option>
          </Select>
          <Input
            label="Descuento (Bs.)"
            type="number"
            step="0.01"
            {...register('descuento')}
            error={errors.descuento?.message}
          />
        </div>

        <div className={styles.categoryMenu}>
          <Button
            type="button"
            variant={categoriaFiltro === 'todas' ? 'secondary' : 'ghost'}
            onClick={() => setCategoriaFiltro('todas')}
          >
            Todas
          </Button>
          {categorias.filter((categoria) => productosVendibles.some((producto) => producto.categoriaId === categoria.id)).map((categoria) => (
            <Button
              key={categoria.id}
              type="button"
              variant={categoriaFiltro === categoria.id ? 'secondary' : 'ghost'}
              onClick={() => setCategoriaFiltro(categoria.id)}
            >
              {categoria.nombre}
            </Button>
          ))}
        </div>

        <div className={styles.cardsGrid}>
          {productosFiltrados.map((producto) => {
            const stock = Number(producto.stockActual ?? 0);
            const sinStock = producto.usaStock ? stock <= 0 : !producto.disponible;
            return (
              <button
                type="button"
                key={producto.id}
                className={`${styles.productCard} ${sinStock ? styles.cardDisabled : ''}`}
                onClick={() => addProductoDesdeCard(producto)}
                disabled={sinStock}
                title={sinStock ? 'No disponible' : 'Agregar a la orden'}
              >
                {producto.fotoUrl ? (
                  <img src={producto.fotoUrl} alt={producto.nombre} className={styles.productImage} />
                ) : (
                  <div className={styles.productImagePlaceholder}>Sin foto</div>
                )}
                <div className={styles.cardBody}>
                  <strong>{producto.nombre}</strong>
                  <small>{producto.categoriaNombre || 'Sin categoria'}</small>
                  <small>{formatCurrency(producto.precioUnitario)}</small>
                  {producto.usaStock ? (
                    <small className={sinStock ? styles.stockDanger : styles.stockInfo}>Stock: {stock}</small>
                  ) : (
                    <small className={styles.stockInfo}>Disponible manualmente</small>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        <div className={styles.detailSection}>
          <h3>Detalle de la nota</h3>
          {fields.length === 0 ? (
            <small>Agrega productos tocando las cards.</small>
          ) : (
            fields.map((field, i) => {
              const producto = productos.find((p) => p.id === detalle?.[i]?.productoId);
              const cantidad = Number(detalle?.[i]?.cantidad || 0);
              const precio = Number(detalle?.[i]?.precioUnitario || 0);
              return (
                <div key={field.id} className={styles.detailRow}>
                  <div className={styles.detailMain}>
                    <strong>{producto?.nombre ?? 'Producto'}</strong>
                    <small>{formatCurrency(precio)}</small>
                  </div>
                  <div className={styles.qtyControls}>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => {
                        if (cantidad <= 1) return;
                        setValue(`detalle.${i}.cantidad`, cantidad - 1, { shouldDirty: true, shouldValidate: true });
                      }}
                    >
                      -
                    </Button>
                    <Input type="number" min={1} {...register(`detalle.${i}.cantidad`)} />
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => {
                        setValue(`detalle.${i}.cantidad`, cantidad + 1, { shouldDirty: true, shouldValidate: true });
                      }}
                    >
                      +
                    </Button>
                  </div>
                  <Input
                    placeholder="Notas"
                    {...register(`detalle.${i}.notas`)}
                  />
                  <div className={styles.subtotalText}>{formatCurrency(cantidad * precio)}</div>
                  <Button type="button" variant="danger" onClick={() => remove(i)}>
                    Quitar
                  </Button>
                </div>
              );
            })
          )}
          {errors.detalle?.message ? <small className={styles.error}>{errors.detalle.message}</small> : null}
        </div>

        <h3>Subtotal: {formatCurrency(subtotal)}</h3>
        <h3>Total: {formatCurrency(total)}</h3>
        <div className={styles.submitActions}>
          <Button
            type="submit"
            disabled={isSubmitting}
            onClick={() => {
              setValue('submitAction', 'guardar', { shouldDirty: false, shouldValidate: false });
            }}
          >
            Guardar venta
          </Button>
          <Button
            type="submit"
            variant="secondary"
            disabled={isSubmitting}
            onClick={() => {
              setValue('submitAction', 'imprimir', { shouldDirty: false, shouldValidate: false });
            }}
          >
            Guardar e imprimir
          </Button>
          <Button
            type="submit"
            variant="ghost"
            disabled={isSubmitting}
            onClick={() => {
              setValue('submitAction', 'whatsapp', { shouldDirty: false, shouldValidate: false });
            }}
          >
            Guardar y WhatsApp
          </Button>
        </div>
      </form>
    </section>
  );
}
