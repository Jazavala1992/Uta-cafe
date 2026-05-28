import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Input from '@src/components/ui/Input';
import Select from '@src/components/ui/Select';
import Button from '@src/components/ui/Button';
import PasswordStrengthBar from '@src/components/ui/PasswordStrengthBar';
import { authService } from '@src/services/authService';
import { useUiStore } from '@src/store/uiStore';
import styles from './RegisterPage.module.css';

const schema = z
  .object({
    nombre: z.string().min(1, 'Nombre requerido'),
    apellido: z.string().min(1, 'Apellido requerido'),
    email: z.string().email('Email invalido'),
    rol: z.enum(['usuario', 'admin']),
    password: z.string().min(8, 'Minimo 8 caracteres'),
    confirmPassword: z.string().min(1, 'Confirmacion requerida'),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Las contrasenas no coinciden',
    path: ['confirmPassword'],
  });

type FormData = z.infer<typeof schema>;

export default function RegisterPage() {
  const addToast = useUiStore((s) => s.addToast);
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { rol: 'usuario' },
  });

  const password = useWatch({ control, name: 'password' });

  const onSubmit = async (data: FormData) => {
    try {
      await authService.register({
        nombre: data.nombre,
        apellido: data.apellido,
        email: data.email,
        rol: data.rol,
        password: data.password,
      });
      addToast('success', 'Usuario creado correctamente');
      reset({ nombre: '', apellido: '', email: '', rol: 'usuario', password: '', confirmPassword: '' });
    } catch (e) {
      addToast('error', e instanceof Error ? e.message : 'No se pudo crear el usuario');
    }
  };

  return (
    <section className={styles.card}>
      <h1 className={styles.title}>Registrar usuario</h1>
      <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
        <Input label="Nombre" {...register('nombre')} error={errors.nombre?.message} />
        <Input label="Apellido" {...register('apellido')} error={errors.apellido?.message} />
        <Input label="Email" type="email" {...register('email')} error={errors.email?.message} />
        <Select label="Rol" {...register('rol')} error={errors.rol?.message}>
          <option value="usuario">usuario</option>
          <option value="admin">admin</option>
        </Select>
        <div className={styles.passwordBlock}>
          <Input label="Contrasena" type="password" {...register('password')} error={errors.password?.message} />
          <PasswordStrengthBar password={password || ''} />
        </div>
        <Input
          label="Confirmar contrasena"
          type="password"
          {...register('confirmPassword')}
          error={errors.confirmPassword?.message}
        />
        <Button type="submit" disabled={isSubmitting}>
          Guardar usuario
        </Button>
      </form>
    </section>
  );
}
