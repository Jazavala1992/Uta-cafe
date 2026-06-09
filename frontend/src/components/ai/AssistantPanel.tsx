import { useEffect, useState } from 'react';
import Button from '@src/components/ui/Button';
import Alert from '@src/components/ui/Alert';
import { aiService } from '@src/services/aiService';
import styles from './AssistantPanel.module.css';

export default function AssistantPanel() {
  const [prompt, setPrompt] = useState('');
  const [reply, setReply] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState<{ provider: string; model: string } | null>(null);
  const [tokensUsed, setTokensUsed] = useState<number | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const s = await aiService.getStatus();
        if (!mounted) return;
        setStatus({ provider: s.provider, model: s.model });
      } catch {
        if (!mounted) return;
        setStatus(null);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const ask = async () => {
    if (!prompt.trim()) return;
    const currentPrompt = prompt;
    setLoading(true);
    setError('');
      try {
        const res = await aiService.chat({
          prompt: currentPrompt,
          systemPrompt:
            'Eres un asistente para una cafeteria. Responde breve, util y en espanol, con foco en ventas, compras, inventario y gastos.',
          temperature: 0.3,
          maxTokens: 400,
        });
        setReply(res.reply);
        setStatus({ provider: res.provider, model: res.model });
        setTokensUsed(res.tokens ?? null);
    } catch (e) {
      setReply('');
      setError(e instanceof Error ? e.message : 'No se pudo consultar al asistente');
    } finally {
      setLoading(false);
    }
  };

  const askAndClear = async (text: string) => {
    // Send given text and clear the input field
    if (!text.trim()) return;
    setPrompt('');
    const current = text;
    setLoading(true);
    setError('');
      try {
        const res = await aiService.chat({
          prompt: current,
          systemPrompt:
            'Eres un asistente para una cafeteria. Responde breve, util y en espanol, con foco en ventas, compras, inventario y gastos.',
          temperature: 0.3,
          maxTokens: 400,
        });
        setReply(res.reply);
        setStatus({ provider: res.provider, model: res.model });
        setTokensUsed(res.tokens ?? null);
    } catch (e) {
      setReply('');
      setError(e instanceof Error ? e.message : 'No se pudo consultar al asistente');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className={styles.card}>
      <div className={styles.header}>
        <h3>Asistente IA local</h3>
        {status ? (
          <small>
            {status.provider} - {status.model} | tokens: {tokensUsed !== null ? tokensUsed : 'N/D'}
          </small>
        ) : (
          <small>Sin conexion</small>
        )}
      </div>

      {error ? <Alert type="error" message={error} /> : null}

      <label className={styles.field}>
        <span>Consulta</span>
        <textarea
          className={styles.textarea}
          rows={4}
          placeholder="Ej: Resume las ventas del dia y sugiere acciones para mejorar margen"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              void askAndClear(prompt);
            }
          }}
        />
      </label>

      <div className={styles.actions}>
        <Button type="button" onClick={ask} disabled={loading || !prompt.trim()}>
          {loading ? 'Consultando...' : 'Preguntar'}
        </Button>
      </div>

      <label className={styles.field}>
        <span>Respuesta</span>
        <textarea className={styles.textarea} rows={8} readOnly value={reply} placeholder="La respuesta aparecera aqui" />
      </label>
    </section>
  );
}
