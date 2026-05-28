import { z } from 'zod';

export const emailSchema = z.string().email('Email invalido');
export const requiredText = (label: string) => z.string().min(1, `${label} es requerido`);
export const positiveNumber = (label: string) =>
  z.coerce.number().min(0, `${label} debe ser mayor o igual a 0`);
