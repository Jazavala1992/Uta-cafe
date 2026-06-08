import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { authService } from '@src/services/authService';
import { useAuthStore } from '@src/store/authStore';
import Input from '@src/components/ui/Input';
import Button from '@src/components/ui/Button';
import Alert from '@src/components/ui/Alert';
import logoUtaCafe from '@src/assets/UTA.png';
import styles from './LoginPage.module.css';

const schema = z.object({
  email: z.string().email('Email invalido'),
  password: z.string().min(1, 'La contrasena es requerida'),
  captcha: z.string().min(1, 'Resuelve el captcha'),
});

type FormData = z.infer<typeof schema>;

const generarCaptcha = () => {
  const a = Math.floor(Math.random() * 9) + 1;
  const b = Math.floor(Math.random() * 9) + 1;
  return { a, b, respuesta: a + b };
};

export default function LoginPage() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [captcha, setCaptcha] = useState(generarCaptcha);
  const [intentos, setIntentos] = useState(0);
  const [bloqueado, setBloqueado] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [error, setError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (!bloqueado) return;
    const interval = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(interval);
          setBloqueado(false);
          setIntentos(0);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [bloqueado]);

  const onSubmit = async (data: FormData) => {
    setError('');
    if (Number.parseInt(data.captcha, 10) !== captcha.respuesta) {
      setError('Captcha incorrecto');
      setCaptcha(generarCaptcha());
      reset({ email: data.email, password: data.password, captcha: '' });
      return;
    }
    try {
      const res = await authService.login(data.email, data.password);
      setAuth(res.user, res.token);
      navigate('/dashboard');
    } catch {
      const nuevosIntentos = intentos + 1;
      setIntentos(nuevosIntentos);
      setError('Credenciales incorrectas');
      setCaptcha(generarCaptcha());
      if (nuevosIntentos >= 3) {
        setCountdown(30);
        setBloqueado(true);
      }
    }
  };

  return (
    <section className={styles.page}>
      <section className={styles.card}>
        <div className={styles.logoWrap}>
          <img src={logoUtaCafe} alt="Logo UTA Cafe" className={styles.logo} />
        </div>
        <h1 className={styles.title}>Ingreso a UTA Café</h1>
        {error ? <Alert type="error" message={error} /> : null}
        <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
          <Input label="Email" type="email" {...register('email')} error={errors.email?.message} />
          <Input
            label="Contrasena"
            type="password"
            {...register('password')}
            error={errors.password?.message}
          />
          <Input
            label={`Resuelve: ${captcha.a} + ${captcha.b} = ?`}
            {...register('captcha')}
            error={errors.captcha?.message}
          />

          <Button type="submit" disabled={isSubmitting || bloqueado}>
            {bloqueado ? `Intenta de nuevo en ${countdown}s` : 'Ingresar'}
          </Button>
        </form>
      </section>
    </section>
  );
}
