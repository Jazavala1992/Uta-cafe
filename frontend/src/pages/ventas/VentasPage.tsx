import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '@src/components/ui/Button';
import Modal from '@src/components/ui/Modal';
import Table from '@src/components/ui/Table';
import { ventaService } from '@src/services/ventaService';
import { useUiStore } from '@src/store/uiStore';
import type { NotaVenta } from '@src/types';
import { formatCurrency, formatDate } from '@src/utils/formatters';
import {
  compartirTicketNotaVentaPorWhatsApp,
  descargarTicketNotaVenta,
  generarTicketNotaVenta,
} from '@src/utils/pdfGenerator';
import styles from './VentasPage.module.css';

export default function VentasPage() {
  const navigate = useNavigate();
  const addToast = useUiStore((s) => s.addToast);
  const [showDeleted, setShowDeleted] = useState(false);
  const [data, setData] = useState<NotaVenta[]>([]);
  const [notaParaCerrar, setNotaParaCerrar] = useState<NotaVenta | null>(null);
  const [guardarPdfAlCerrar, setGuardarPdfAlCerrar] = useState(false);
  const [closing, setClosing] = useState(false);

  const load = async () => setData(await ventaService.getAll(showDeleted));
  useEffect(() => {
    void load();
  }, [showDeleted]);

  const cerrarNotaConAccion = async (
    row: NotaVenta,
    options: { shouldPrint: boolean; shouldWhatsApp: boolean; savePdf: boolean },
  ) => {
    setClosing(true);
    try {
      const notaCerrada = await ventaService.update(row.id, { estado: 'cerrada' });

      const ticketData = {
        numeroNota: notaCerrada.numeroNota,
        fecha: notaCerrada.fecha,
        mesaNumero: notaCerrada.mesaNumero,
        estado: notaCerrada.estado,
        detalle: notaCerrada.detalle,
        subtotal: notaCerrada.subtotal,
        descuento: notaCerrada.descuento,
        total: notaCerrada.total,
      };

      if (options.shouldPrint) {
        generarTicketNotaVenta(ticketData, { print: true, download: options.savePdf });
      } else if (options.savePdf) {
        descargarTicketNotaVenta(ticketData);
      }

      if (options.shouldWhatsApp) {
        const shared = await compartirTicketNotaVentaPorWhatsApp(ticketData);
        if (shared && options.savePdf) {
          descargarTicketNotaVenta(ticketData);
        }
        if (!shared) {
          addToast(
            'warning',
            'No se pudo abrir WhatsApp. Se guardo el PDF para que lo adjuntes manualmente.',
          );
          if (!options.savePdf) {
            descargarTicketNotaVenta(ticketData);
          }
        }
      }

      addToast('success', 'Nota cerrada correctamente');
      setNotaParaCerrar(null);
      await load();
    } finally {
      setClosing(false);
    }
  };

  return (
    <section className={styles.page}>
      <div className={styles.header}>
        <h1>Notas de venta</h1>
        <Button onClick={() => navigate('/ventas/nueva')}>Nueva nota</Button>
      </div>
      <Table<NotaVenta>
        columns={[
          { key: 'numeroNota', header: 'Numero nota' },
          { key: 'mesaNumero', header: 'Mesa' },
          { key: 'fecha', header: 'Fecha', render: (row) => formatDate(row.fecha) },
          { key: 'estado', header: 'Estado' },
          { key: 'total', header: 'Total', render: (row) => formatCurrency(row.total) },
        ]}
        data={data}
        searchable
        searchKeys={['numeroNota', 'estado']}
        showDeleted={showDeleted}
        onToggleShowDeleted={() => setShowDeleted((v) => !v)}
        isAdmin
        renderExtraActions={(row) => {
          const ticketData = {
            numeroNota: row.numeroNota,
            fecha: row.fecha,
            mesaNumero: row.mesaNumero,
            estado: row.estado,
            detalle: row.detalle,
            subtotal: row.subtotal,
            descuento: row.descuento,
            total: row.total,
          };

          return (
            <>
              {row.estado === 'abierta' ? (
                <Button
                  variant="secondary"
                  onClick={async () => {
                    setGuardarPdfAlCerrar(false);
                    setNotaParaCerrar(row);
                  }}
                >
                  Cerrar nota
                </Button>
              ) : null}
              <Button
                variant="secondary"
                onClick={() => {
                  if (row.estado !== 'cerrada') {
                    window.alert('Para imprimir ticket, la nota debe estar cerrada.');
                    return;
                  }
                  generarTicketNotaVenta(ticketData, { print: true, download: true });
                }}
              >
                Imprimir
              </Button>
              <Button
                variant="ghost"
                onClick={async () => {
                  if (row.estado !== 'cerrada') {
                    window.alert('Para enviar ticket por WhatsApp, la nota debe estar cerrada.');
                    return;
                  }

                  const shared = await compartirTicketNotaVentaPorWhatsApp(ticketData);
                  if (!shared) {
                    descargarTicketNotaVenta(ticketData);
                    addToast(
                      'warning',
                      'No se pudo abrir WhatsApp. Se descargo el PDF para adjuntarlo manualmente.',
                    );
                  }
                }}
              >
                WhatsApp
              </Button>
            </>
          );
        }}
        onEdit={(row) => navigate(`/ventas/${row.id}`)}
        onDelete={async (row) => {
          await ventaService.delete(row.id);
          await load();
        }}
        onRestore={async (row) => {
          await ventaService.restore(row.id);
          await load();
        }}
      />

      <Modal
        open={Boolean(notaParaCerrar)}
        title={notaParaCerrar ? `Cerrar nota ${notaParaCerrar.numeroNota}` : 'Cerrar nota'}
        onClose={() => {
          if (closing) return;
          setNotaParaCerrar(null);
        }}
      >
        <div className={styles.closeModalBody}>
          <p className={styles.closeModalText}>Elige que quieres hacer al cerrar la nota:</p>

          <div className={styles.actionCards}>
            <button
              type="button"
              className={styles.actionCard}
              disabled={!notaParaCerrar || closing}
              onClick={() => {
                if (!notaParaCerrar) return;
                void cerrarNotaConAccion(notaParaCerrar, {
                  shouldPrint: true,
                  shouldWhatsApp: false,
                  savePdf: guardarPdfAlCerrar,
                });
              }}
            >
              <span className={styles.actionCardTitle}>Imprimir</span>
              <span className={styles.actionCardDescription}>Cierra la nota e imprime el ticket.</span>
            </button>

            <button
              type="button"
              className={styles.actionCard}
              disabled={!notaParaCerrar || closing}
              onClick={() => {
                if (!notaParaCerrar) return;
                void cerrarNotaConAccion(notaParaCerrar, {
                  shouldPrint: false,
                  shouldWhatsApp: true,
                  savePdf: guardarPdfAlCerrar,
                });
              }}
            >
              <span className={styles.actionCardTitle}>WhatsApp</span>
              <span className={styles.actionCardDescription}>Cierra la nota y abre WhatsApp con el detalle listo para enviar.</span>
            </button>

            <button
              type="button"
              className={styles.actionCard}
              disabled={!notaParaCerrar || closing}
              onClick={() => {
                if (!notaParaCerrar) return;
                void cerrarNotaConAccion(notaParaCerrar, {
                  shouldPrint: true,
                  shouldWhatsApp: true,
                  savePdf: guardarPdfAlCerrar,
                });
              }}
            >
              <span className={styles.actionCardTitle}>Ambos</span>
              <span className={styles.actionCardDescription}>Imprime y abre WhatsApp con el detalle listo para enviar.</span>
            </button>

            <button
              type="button"
              className={styles.actionCard}
              disabled={!notaParaCerrar || closing}
              onClick={() => {
                if (!notaParaCerrar) return;
                void cerrarNotaConAccion(notaParaCerrar, {
                  shouldPrint: false,
                  shouldWhatsApp: false,
                  savePdf: guardarPdfAlCerrar,
                });
              }}
            >
              <span className={styles.actionCardTitle}>Solo cerrar</span>
              <span className={styles.actionCardDescription}>Cierra la nota sin imprimir ni compartir.</span>
            </button>
          </div>

          <label className={styles.saveCopyOption}>
            <input
              type="checkbox"
              checked={guardarPdfAlCerrar}
              disabled={closing}
              onChange={(event) => setGuardarPdfAlCerrar(event.target.checked)}
            />
            Guardar copia PDF
          </label>

          <div className={styles.closeModalActions}>
            <Button variant="ghost" onClick={() => setNotaParaCerrar(null)}>
              Cancelar
            </Button>
          </div>
        </div>
      </Modal>
    </section>
  );
}
