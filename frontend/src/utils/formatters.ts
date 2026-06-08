export const formatCurrency = (value: number): string => `Bs. ${value.toFixed(2)}`;

export const formatDate = (date: string): string => {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleDateString('es-BO');
};

export const formatDateTime = (date: string): string => {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return '-';
  return `${d.toLocaleDateString('es-BO')} ${d.toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' })}`;
};
