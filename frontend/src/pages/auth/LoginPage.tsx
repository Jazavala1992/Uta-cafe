import { useEffect, useRef, useState } from 'react';
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

const TURNSTILE_SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY || '0x4AAAAAADg2PaMwZOdp6Pm0';

const schema = z.object({
  email: z.string().email('Email invalido'),
  password: z.string().min(1, 'La contrasena es requerida'),
});

type FormData = z.infer<typeof schema>;

declare global {
  interface Window {
    turnstile: {
      render: (container: string | HTMLElement, options: Record<string, unknown>) => string;
      reset: (widgetId: string) => void;
    };
  }
}

export default function LoginPage() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [intentos, setIntentos] = useState(0);
  const [bloqueado, setBloqueado] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [error, setError] = useState('');
  const [captchaToken, setCaptchaToken] = useState('');
  const captchaContainerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string>('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  useEffect(() => {
    // Cargar el script de Turnstile si no está cargado
    const existingScript = document.getElementById('turnstile-script');
    if (!existingScript) {
      const script = document.createElement('script');
      script.id = 'turnstile-script';
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js';
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }

    // Renderizar el widget cuando el script esté listo
    const renderWidget = () => {
      if (captchaContainerRef.current && window.turnstile) {
        widgetIdRef.current = window.turnstile.render(captchaContainerRef.current, {
          sitekey: TURNSTILE_SITE_KEY,
          theme: 'auto',
          callback: (token: string) => setCaptchaToken(token),
          'expired-callback': () => setCaptchaToken(''),
          'error-callback': () => {
            setCaptchaToken('');
            setError('Error al cargar el captcha, intenta de nuevo');
          },
        });
      }
    };

    if (window.turnstile) {
      renderWidget();
    } else {
      const script = document.getElementById('turnstile-script');
      script?.addEventListener('load', renderWidget);
      return () => script?.removeEventListener('load', renderWidget);
    }
  }, []);

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

    if (!captchaToken) {
      setError('Por favor completa el captcha');
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
      setCaptchaToken('');
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.reset(widgetIdRef.current);
      }
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
        <form onSubmit={(e) => void handleSubmit(onSubmit)(e)} className={styles.form}>
          <Input
            label="Email"
            type="email"
            {...register('email')}
            error={errors.email?.message}
          />
          <Input
            label="Contrasena"
            type="password"
            {...register('password')}
            error={errors.password?.message}
          />

          <div ref={captchaContainerRef} />

          <Button type="submit" disabled={isSubmitting || bloqueado || !captchaToken}>
            {bloqueado ? `Intenta de nuevo en ${countdown}s` : 'Ingresar'}
          </Button>
        </form>
      </section>
    </section>
  );
}