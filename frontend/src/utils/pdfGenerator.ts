import jsPDF from 'jspdf';

interface ReporteData {
  periodo: string;
  ventas: { numeroNota: string; fecha: string; total: number }[];
  gastos: { descripcion: string; categoria: string; monto: number }[];
  generadoPor: string;
}

export const generarReporteIngresosEgresos = (data: ReporteData): void => {
  const doc = new jsPDF();
  const margen = 20;
  let y = 20;

  doc.setFontSize(20);
  doc.setTextColor(123, 63, 46);
  doc.text('UTA Cafe', margen, y);

  y += 10;
  doc.setFontSize(14);
  doc.setTextColor(50, 50, 50);
  doc.text('Reporte de Ingresos y Egresos', margen, y);

  y += 7;
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(`Periodo: ${data.periodo}`, margen, y);
  doc.text(`Generado por: ${data.generadoPor}`, 120, y);

  y += 4;
  doc.text(`Fecha de generacion: ${new Date().toLocaleDateString('es-BO')}`, margen, y);

  y += 8;
  doc.setDrawColor(123, 63, 46);
  doc.line(margen, y, 190, y);

  y += 10;
  doc.setFontSize(12);
  doc.setTextColor(50, 50, 50);
  doc.text('Ventas', margen, y);

  y += 7;
  doc.setFontSize(9);
  doc.setFillColor(240, 235, 230);
  doc.rect(margen, y - 4, 170, 7, 'F');
  doc.text('N. Nota', margen + 2, y);
  doc.text('Fecha', 80, y);
  doc.text('Total (Bs.)', 150, y);

  y += 5;
  let totalVentas = 0;
  data.ventas.forEach((v) => {
    doc.text(v.numeroNota, margen + 2, y);
    doc.text(new Date(v.fecha).toLocaleDateString('es-BO'), 80, y);
    doc.text(v.total.toFixed(2), 150, y);
    totalVentas += v.total;
    y += 6;
    if (y > 270) {
      doc.addPage();
      y = 20;
    }
  });

  y += 3;
  doc.setFontSize(10);
  doc.text(`Total ingresos: Bs. ${totalVentas.toFixed(2)}`, 120, y);

  y += 12;
  doc.setFontSize(12);
  doc.text('Gastos', margen, y);

  y += 7;
  doc.setFontSize(9);
  doc.setFillColor(240, 235, 230);
  doc.rect(margen, y - 4, 170, 7, 'F');
  doc.text('Descripcion', margen + 2, y);
  doc.text('Categoria', 100, y);
  doc.text('Monto (Bs.)', 150, y);

  y += 5;
  let totalGastos = 0;
  data.gastos.forEach((g) => {
    doc.text(g.descripcion, margen + 2, y);
    doc.text(g.categoria, 100, y);
    doc.text(g.monto.toFixed(2), 150, y);
    totalGastos += g.monto;
    y += 6;
    if (y > 270) {
      doc.addPage();
      y = 20;
    }
  });

  y += 3;
  doc.setFontSize(10);
  doc.text(`Total egresos: Bs. ${totalGastos.toFixed(2)}`, 120, y);

  y += 12;
  doc.setDrawColor(123, 63, 46);
  doc.line(margen, y, 190, y);
  y += 8;
  doc.setFontSize(12);
  doc.setTextColor(123, 63, 46);
  doc.text(`Utilidad neta: Bs. ${(totalVentas - totalGastos).toFixed(2)}`, margen, y);

  doc.save(`reporte_uta_cafe_${Date.now()}.pdf`);
};

interface TicketDetalle {
  productoNombre?: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
  notas?: string;
}

export interface TicketNotaVentaData {
  numeroNota: string;
  fecha: string;
  mesaNumero?: number;
  estado: string;
  detalle: TicketDetalle[];
  subtotal: number;
  descuento: number;
  total: number;
  generadoPor?: string;
}

interface TicketOptions {
  print?: boolean;
  download?: boolean;
}

const buildTicketNotaVentaPdf = (data: TicketNotaVentaData) => {
  const baseHeight = 80;
  const detailHeight = Math.max(1, data.detalle.length) * 9;
  const totalHeight = Math.max(120, baseHeight + detailHeight + 30);
  const doc = new jsPDF({ unit: 'mm', format: [80, totalHeight] });
  const margin = 5;
  const maxWidth = 70;
  let y = 8;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('UTA Cafe', 40, y, { align: 'center' });

  y += 5;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('Ticket de produccion', 40, y, { align: 'center' });

  y += 5;
  doc.line(margin, y, 75, y);

  y += 4;
  doc.text(`Nota: ${data.numeroNota}`, margin, y);
  y += 4;
  doc.text(`Mesa: ${data.mesaNumero ?? '-'}`, margin, y);
  y += 4;
  doc.text(`Estado: ${data.estado}`, margin, y);
  y += 4;
  doc.text(`Fecha: ${new Date(data.fecha).toLocaleString('es-BO')}`, margin, y);

  y += 4;
  doc.line(margin, y, 75, y);

  y += 4;
  doc.setFont('helvetica', 'bold');
  doc.text('Detalle', margin, y);
  doc.setFont('helvetica', 'normal');

  for (const item of data.detalle) {
    y += 4;
    const nombre = `${item.cantidad} x ${item.productoNombre ?? 'Producto'}`;
    const lines = doc.splitTextToSize(nombre, maxWidth);
    doc.text(lines, margin, y);
    y += (Array.isArray(lines) ? lines.length : 1) * 3.8;
    doc.text(`Bs. ${item.subtotal.toFixed(2)}`, 75, y - 1, { align: 'right' });

    if (item.notas) {
      const notas = doc.splitTextToSize(`Nota: ${item.notas}`, maxWidth - 2);
      doc.setFontSize(7);
      doc.text(notas, margin + 1, y + 2);
      doc.setFontSize(8);
      y += (Array.isArray(notas) ? notas.length : 1) * 3.2;
    }
  }

  y += 2;
  doc.line(margin, y, 75, y);
  y += 4;
  doc.text(`Subtotal: Bs. ${data.subtotal.toFixed(2)}`, 75, y, { align: 'right' });
  y += 4;
  doc.text(`Descuento: Bs. ${data.descuento.toFixed(2)}`, 75, y, { align: 'right' });
  y += 4;
  doc.setFont('helvetica', 'bold');
  doc.text(`TOTAL: Bs. ${data.total.toFixed(2)}`, 75, y, { align: 'right' });
  doc.setFont('helvetica', 'normal');

  if (data.generadoPor) {
    y += 5;
    doc.setFontSize(7);
    doc.text(`Atendido por: ${data.generadoPor}`, margin, y);
    doc.setFontSize(8);
  }

  return doc;
};

export const getTicketNotaVentaFileName = (data: TicketNotaVentaData) =>
  `ticket_nota_${data.numeroNota.replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`;

export const descargarTicketNotaVenta = (data: TicketNotaVentaData) => {
  const doc = buildTicketNotaVentaPdf(data);
  doc.save(getTicketNotaVentaFileName(data));
};

export const generarTicketNotaVenta = (
  data: TicketNotaVentaData,
  options: TicketOptions = { print: true, download: true },
) => {
  const doc = buildTicketNotaVentaPdf(data);

  const fileName = getTicketNotaVentaFileName(data);

  if (options.download) {
    doc.save(fileName);
  }

  if (options.print) {
    doc.autoPrint();
    const blobUrl = doc.output('bloburl');
    window.open(blobUrl, '_blank', 'noopener,noreferrer');
  }
};

export const compartirTicketNotaVentaPorWhatsApp = async (data: TicketNotaVentaData) => {
  const mensaje = construirMensajeWhatsAppNotaVenta(data);
  const url = `https://wa.me/?text=${encodeURIComponent(mensaje)}`;
  const ventana = window.open(url, '_blank', 'noopener,noreferrer');

  return Boolean(ventana);
};

export const construirMensajeWhatsAppNotaVenta = (data: TicketNotaVentaData) => {
  const detalle = data.detalle
    .map((item) => `- ${item.cantidad}x ${item.productoNombre ?? 'Producto'} (Bs. ${item.subtotal.toFixed(2)})`)
    .join('\n');

  return [
    `Pedido ${data.numeroNota}`,
    `Mesa: ${data.mesaNumero ?? '-'}`,
    `Estado: ${data.estado}`,
    `Fecha: ${new Date(data.fecha).toLocaleString('es-BO')}`,
    '',
    'Detalle:',
    detalle || '- Sin items',
    '',
    `Total: Bs. ${data.total.toFixed(2)}`,
    data.generadoPor ? `Generado por: ${data.generadoPor}` : '',
  ].join('\n');
};
