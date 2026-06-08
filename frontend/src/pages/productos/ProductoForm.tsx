import { useEffect, useMemo, useRef, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Button from '@src/components/ui/Button';
import Input from '@src/components/ui/Input';
import Select from '@src/components/ui/Select';
import type { Categoria, OrigenProducto, Producto, Proveedor } from '@src/types';
import styles from './ProductoForm.module.css';

const schema = z.object({
  nombre: z.string().min(1, 'Nombre requerido'),
  descripcion: z.string().optional(),
  fotoUrl: z.string().optional(),
  categoriaId: z.string().optional(),
  categoriaNombre: z.string().optional(),
  origen: z.enum(['interno', 'proveedor']),
  proveedorId: z.string().optional(),
  productoProveedorId: z.string().optional(),
  productoProveedorNombre: z.string().optional(),
  precioUnitario: z.coerce.number().min(0, 'Precio invalido'),
  unidadMedida: z.string().min(1, 'Unidad requerida'),
  stockActual: z.coerce.number().min(0, 'Stock actual invalido'),
  stockMinimo: z.coerce.number().min(0, 'Stock minimo invalido'),
  usaStock: z.boolean(),
  disponible: z.boolean(),
});

type FormData = z.infer<typeof schema>;

interface Props {
  categorias: Categoria[];
  proveedores: Proveedor[];
  onSubmit: (values: Omit<Producto, 'id'>) => Promise<void>;
  onCreateCategoria?: (values: { nombre: string; descripcion: string }) => Promise<Categoria | null>;
  onCancel?: () => void;
  initialValues?: Partial<Producto>;
  submitLabel?: string;
}

export default function ProductoForm({
  categorias,
  proveedores,
  onSubmit,
  onCreateCategoria,
  onCancel,
  initialValues,
  submitLabel,
}: Props) {
  const origenInicial: OrigenProducto = initialValues?.origen ?? (initialValues?.proveedorId ? 'proveedor' : 'interno');
  const ultimoProductoProveedorSincronizado = useRef(initialValues?.productoProveedorId ?? '');
  const [showQuickCategory, setShowQuickCategory] = useState(false);
  const [quickCategoriaNombre, setQuickCategoriaNombre] = useState('');
  const [quickCategoriaDescripcion, setQuickCategoriaDescripcion] = useState('');
  const [quickCategoriaError, setQuickCategoriaError] = useState('');
  const [creatingCategory, setCreatingCategory] = useState(false);

  const defaultValues = useMemo<FormData>(
    () => ({
      nombre: initialValues?.nombre ?? '',
      descripcion: initialValues?.descripcion ?? '',
      fotoUrl: initialValues?.fotoUrl ?? '',
      categoriaId: initialValues?.categoriaId ?? '',
      categoriaNombre: initialValues?.categoriaNombre ?? '',
      origen: origenInicial,
      proveedorId: initialValues?.proveedorId ?? '',
      productoProveedorId: initialValues?.productoProveedorId ?? '',
      productoProveedorNombre: initialValues?.productoProveedorNombre ?? '',
      precioUnitario: initialValues?.precioUnitario ?? 0,
      unidadMedida: initialValues?.unidadMedida ?? 'unidad',
      stockActual: initialValues?.stockActual ?? 0,
      stockMinimo: initialValues?.stockMinimo ?? 0,
      usaStock: initialValues?.usaStock ?? true,
      disponible: initialValues?.disponible ?? true,
    }),
    [initialValues, origenInicial],
  );

  const {
    register,
    handleSubmit,
    reset,
    control,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema) as never,
    defaultValues,
  });

  const origen = useWatch({ control, name: 'origen' });
  const fotoUrl = useWatch({ control, name: 'fotoUrl' });
  const categoriaId = useWatch({ control, name: 'categoriaId' });
  const proveedorId = useWatch({ control, name: 'proveedorId' });
  const productoProveedorId = useWatch({ control, name: 'productoProveedorId' });
  const usaStock = useWatch({ control, name: 'usaStock' });

  const categoriaSeleccionada = useMemo(
    () => categorias.find((categoria) => categoria.id === categoriaId),
    [categoriaId, categorias],
  );
  const proveedorSeleccionado = useMemo(
    () => proveedores.find((proveedor) => proveedor.id === proveedorId),
    [proveedorId, proveedores],
  );
  const catalogoProveedor = useMemo(() => proveedorSeleccionado?.productos ?? [], [proveedorSeleccionado]);
  const productoSeleccionado = useMemo(
    () => catalogoProveedor.find((producto) => producto.id === productoProveedorId),
    [catalogoProveedor, productoProveedorId],
  );

  useEffect(() => {
    reset(defaultValues);
    ultimoProductoProveedorSincronizado.current = defaultValues.productoProveedorId ?? '';
  }, [defaultValues, reset]);

  useEffect(() => {
    if (categoriaSeleccionada) {
      setValue('categoriaNombre', categoriaSeleccionada.nombre, { shouldDirty: true });
      return;
    }
    setValue('categoriaNombre', '', { shouldDirty: true });
  }, [categoriaSeleccionada, setValue]);

  useEffect(() => {
    if (origen !== 'proveedor') {
      setValue('proveedorId', '', { shouldDirty: true });
      setValue('productoProveedorId', '', { shouldDirty: true });
      setValue('productoProveedorNombre', '', { shouldDirty: true });
      return;
    }

    if (!proveedorSeleccionado) {
      setValue('productoProveedorId', '', { shouldDirty: true });
      setValue('productoProveedorNombre', '', { shouldDirty: true });
      return;
    }

    if (!catalogoProveedor.some((producto) => producto.id === productoProveedorId)) {
      setValue('productoProveedorId', '', { shouldDirty: true });
      setValue('productoProveedorNombre', '', { shouldDirty: true });
    }
  }, [catalogoProveedor, origen, productoProveedorId, proveedorSeleccionado, setValue]);

  useEffect(() => {
    if (origen !== 'proveedor' || !productoSeleccionado) return;
    if (ultimoProductoProveedorSincronizado.current === productoProveedorId) return;
    setValue('nombre', productoSeleccionado.nombre, { shouldDirty: true });
    setValue('productoProveedorNombre', productoSeleccionado.nombre, { shouldDirty: true });
    ultimoProductoProveedorSincronizado.current = productoProveedorId ?? '';
  }, [origen, productoProveedorId, productoSeleccionado, setValue]);

  const submit = async (values: FormData) => {
    const proveedor = proveedores.find((item) => item.id === values.proveedorId);
    const productoCatalogo = proveedor?.productos?.find((item) => item.id === values.productoProveedorId);
    const categoria = categorias.find((item) => item.id === values.categoriaId);

    await onSubmit({
      nombre: values.nombre.trim(),
      descripcion: values.descripcion?.trim() ?? '',
      fotoUrl: values.fotoUrl?.trim() ?? '',
      categoriaId: values.categoriaId?.trim() ?? '',
      categoriaNombre: categoria?.nombre ?? values.categoriaNombre?.trim() ?? '',
      origen: values.origen,
      proveedorId: values.origen === 'proveedor' ? values.proveedorId?.trim() ?? '' : '',
      productoProveedorId: values.origen === 'proveedor' ? values.productoProveedorId?.trim() ?? '' : '',
      productoProveedorNombre:
        values.origen === 'proveedor'
          ? productoCatalogo?.nombre ?? values.productoProveedorNombre?.trim() ?? ''
          : '',
      precioUnitario: Number(values.precioUnitario),
      unidadMedida: values.unidadMedida.trim() || 'unidad',
      stockActual: values.usaStock ? Number(values.stockActual) : values.disponible ? 1 : 0,
      stockMinimo: Number(values.stockMinimo),
      usaStock: values.usaStock,
      disponible: values.disponible,
      activo: true,
    });

    reset(defaultValues);
  };

  const createQuickCategory = async () => {
    const nombre = quickCategoriaNombre.trim();
    const descripcion = quickCategoriaDescripcion.trim();

    if (!nombre) {
      setQuickCategoriaError('Nombre de categoria requerido');
      return;
    }
    if (!onCreateCategoria) {
      setQuickCategoriaError('No se pudo crear la categoria en este formulario');
      return;
    }

    setQuickCategoriaError('');
    setCreatingCategory(true);
    try {
      const categoria = await onCreateCategoria({ nombre, descripcion });
      if (!categoria) {
        setQuickCategoriaError('No se pudo crear la categoria');
        return;
      }

      setValue('categoriaId', categoria.id, { shouldDirty: true, shouldValidate: true });
      setValue('categoriaNombre', categoria.nombre, { shouldDirty: true, shouldValidate: true });
      setQuickCategoriaNombre('');
      setQuickCategoriaDescripcion('');
      setShowQuickCategory(false);
    } catch {
      setQuickCategoriaError('No se pudo crear la categoria');
    } finally {
      setCreatingCategory(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(submit)} className={styles.form}>
      <section className={styles.section}>
        <div className={styles.sectionHeading}>
          <h4>1. Datos básicos</h4>
          <small className={styles.helpText}>Primero define el nombre, la descripción y la foto del producto.</small>
        </div>
        <div className={styles.grid2}>
          <Input label="Nombre del producto" {...register('nombre')} error={errors.nombre?.message} />
          <Select label="Origen del producto" {...register('origen')} error={errors.origen?.message}>
            <option value="interno">Interno</option>
            <option value="proveedor">De proveedor</option>
          </Select>
        </div>

        <Input label="Descripcion" {...register('descripcion')} error={errors.descripcion?.message} />
        <input type="hidden" {...register('fotoUrl')} />

        <div className={styles.photoSection}>
          <label className={styles.photoUploadLabel}>
            <span>Foto del producto</span>
            <input
              type="file"
              accept="image/*"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (!file) return;
                void resizeImageToDataUrl(file, 960, 0.78).then((result) => {
                  setValue('fotoUrl', result, { shouldDirty: true, shouldValidate: true });
                });
              }}
            />
          </label>
          {fotoUrl ? (
            <div className={styles.photoPreviewWrap}>
              <img src={fotoUrl} alt="Preview del producto" className={styles.photoPreview} />
              <Button
                type="button"
                variant="ghost"
                onClick={() => setValue('fotoUrl', '', { shouldDirty: true, shouldValidate: true })}
              >
                Quitar foto
              </Button>
            </div>
          ) : null}
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeading}>
          <h4>2. Categoria</h4>
          <small className={styles.helpText}>Asigna una categoria o crea una nueva sin salir del modal.</small>
        </div>

        <div className={styles.grid2}>
          <Select label="Categoria" {...register('categoriaId')} error={errors.categoriaId?.message}>
            <option value="">Sin categoria</option>
            {categorias.map((categoria) => (
              <option key={categoria.id} value={categoria.id}>
                {categoria.nombre}
              </option>
            ))}
          </Select>
          <Input label="Categoria seleccionada" value={categoriaSeleccionada?.nombre ?? ''} readOnly />
        </div>

        <div className={styles.quickCategoryWrap}>
          {!showQuickCategory ? (
            <Button type="button" variant="ghost" onClick={() => setShowQuickCategory(true)}>
              Crear categoria rapida
            </Button>
          ) : (
            <div className={styles.quickCategoryBox}>
              <div className={styles.grid2}>
                <Input
                  label="Nombre de categoria"
                  value={quickCategoriaNombre}
                  onChange={(event) => setQuickCategoriaNombre(event.target.value)}
                />
                <Input
                  label="Descripcion"
                  value={quickCategoriaDescripcion}
                  onChange={(event) => setQuickCategoriaDescripcion(event.target.value)}
                />
              </div>
              {quickCategoriaError ? <small className={styles.errorText}>{quickCategoriaError}</small> : null}
              <div className={styles.quickActions}>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setShowQuickCategory(false);
                    setQuickCategoriaError('');
                  }}
                >
                  Cancelar
                </Button>
                <Button type="button" onClick={() => void createQuickCategory()} disabled={creatingCategory}>
                  {creatingCategory ? 'Creando...' : 'Crear y seleccionar'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </section>

      {origen === 'proveedor' ? (
        <div className={styles.sourceBlock}>
          <div className={styles.sectionHeading}>
            <h4>3. Referencia de proveedor</h4>
            <small className={styles.helpText}>Solo aplica si el producto viene enlazado a un proveedor.</small>
          </div>
          <div className={styles.grid2}>
            <Select label="Proveedor" {...register('proveedorId')} error={errors.proveedorId?.message}>
              <option value="">Seleccione un proveedor</option>
              {proveedores.map((proveedor) => (
                <option key={proveedor.id} value={proveedor.id}>
                  {proveedor.razonSocial}
                </option>
              ))}
            </Select>
            <Input label="Proveedor seleccionado" value={proveedorSeleccionado?.razonSocial ?? ''} readOnly />
          </div>

          <div className={styles.grid2}>
            <Select
              label="Producto del proveedor"
              {...register('productoProveedorId')}
              error={errors.productoProveedorId?.message}
              disabled={!proveedorSeleccionado || catalogoProveedor.length === 0}
            >
              <option value="">Seleccione un producto</option>
              {catalogoProveedor.map((producto) => (
                <option key={producto.id} value={producto.id}>{producto.nombre}</option>
              ))}
            </Select>
            <Input
              label="Producto del proveedor"
              value={
                productoSeleccionado?.nombre ??
                valuesFallback(proveedores, proveedorId ?? '', productoProveedorId ?? '')
              }
              readOnly
            />
          </div>

          <small className={styles.helpText}>
            Este producto se enlaza con el catalogo del proveedor como referencia.
          </small>
        </div>
      ) : null}

      <section className={styles.section}>
        <div className={styles.sectionHeading}>
          <h4>4. Disponibilidad</h4>
          <small className={styles.helpText}>Aquí eliges si el producto se maneja con stock o solo como disponible.</small>
        </div>
        <div className={styles.grid2}>
          <label className={styles.toggleField}>
            <span>Controla stock real</span>
            <input type="checkbox" {...register('usaStock')} />
            <small className={styles.helpText}>Desactivalo para productos preparados que se gestionan por disponibilidad.</small>
          </label>
          <label className={styles.toggleField}>
            <span>Disponible para venta</span>
            <input type="checkbox" {...register('disponible')} />
            <small className={styles.helpText}>Si lo desactivas, el producto no aparecera para el cajero.</small>
          </label>
        </div>

        <div className={styles.grid3}>
          <Input
            label="Precio de venta"
            type="number"
            min={0}
            step="0.01"
            {...register('precioUnitario')}
            error={errors.precioUnitario?.message}
          />
          <Input label="Unidad de medida" {...register('unidadMedida')} error={errors.unidadMedida?.message} />
          <Input
            label="Stock actual"
            type="number"
            min={0}
            step="0.01"
            {...register('stockActual')}
            error={errors.stockActual?.message}
            readOnly={!usaStock}
          />
        </div>

        {usaStock ? (
          <>
            <small className={styles.helpText}>
              El stock actual se actualiza automaticamente con compras y notas de venta cerradas.
            </small>

            <Input
              label="Stock minimo"
              type="number"
              min={0}
              step="0.01"
              {...register('stockMinimo')}
              error={errors.stockMinimo?.message}
            />
          </>
        ) : (
          <small className={styles.helpText}>
            Este producto no descuenta stock; solo se controla su disponibilidad desde administracion.
          </small>
        )}
      </section>

      <div className={styles.actions}>
        {onCancel ? (
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancelar
          </Button>
        ) : null}
        <Button type="submit" disabled={isSubmitting}>
          {submitLabel ?? 'Guardar producto'}
        </Button>
      </div>
    </form>
  );
}

async function resizeImageToDataUrl(file: File, maxWidth: number, quality: number) {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '');
    reader.onerror = () => reject(new Error('No se pudo leer la imagen'));
    reader.readAsDataURL(file);
  });

  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('No se pudo cargar la imagen'));
    img.src = dataUrl;
  });

  const scale = image.width > maxWidth ? maxWidth / image.width : 1;
  const width = Math.max(1, Math.round(image.width * scale));
  const height = Math.max(1, Math.round(image.height * scale));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return dataUrl;

  ctx.drawImage(image, 0, 0, width, height);
  return canvas.toDataURL('image/jpeg', quality);
}

function valuesFallback(proveedores: Proveedor[], proveedorId: string, productoId: string) {
  const proveedor = proveedores.find((item) => item.id === proveedorId);
  return proveedor?.productos?.find((item) => item.id === productoId)?.nombre ?? '';
}
