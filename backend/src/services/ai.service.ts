import { BadRequestException, Injectable, ServiceUnavailableException } from '@nestjs/common';
import { DatabaseService } from '../common/database.service';
import { EnvService } from '../config/env.service';
import { ChatDto } from '@src/dto/chat.dto';

interface OllamaGenerateResponse {
  response?: string;
}

interface ProductoInventarioRow {
  nombre: string;
  categoria_nombre: string;
  stock_actual: string;
  stock_minimo: string;
}

@Injectable()
export class AiService {
  constructor(
    private readonly env: EnvService,
    private readonly db: DatabaseService,
  ) {}

  async chat(payload: ChatDto): Promise<{ reply: string; provider: string; model: string; tokens?: number }> {
    try {
      if (this.env.aiProvider !== 'ollama') {
        throw new BadRequestException(`AI_PROVIDER no soportado: ${this.env.aiProvider}`);
      }

      const inventoryContext = await this.buildInventoryContext(payload.prompt);
      const prompt = this.buildPrompt(payload, inventoryContext);
      const { reply, tokens } = await this.chatWithOllama(prompt, payload);

      return {
        reply,
        provider: this.env.aiProvider,
        model: this.env.ollamaModel,
        tokens: tokens ?? null,
      };
    } catch (error) {
      // Log full error for debugging during development
      // eslint-disable-next-line no-console
      console.error('AiService.chat error:', error instanceof Error ? error.stack || error.message : error);
      throw error;
    }
  }

  getStatus() {
    return {
      provider: this.env.aiProvider,
      model: this.env.ollamaModel,
      baseUrl: this.env.ollamaBaseUrl,
    };
  }

  private buildPrompt(payload: ChatDto, inventoryContext: string) {
    const sections: string[] = [];

    if (payload.systemPrompt?.trim()) {
      sections.push(payload.systemPrompt.trim());
    }

    sections.push(
      'Reglas: si la consulta es sobre stock, inventario, productos o existencias, usa solo los datos reales de la base de datos incluidos abajo. No inventes cantidades, productos ni disponibilidad. Si un producto no aparece, dilo claramente.',
    );

    if (inventoryContext) {
      sections.push(`Contexto real de inventario:\n${inventoryContext}`);
    }

    const salesContext = this.buildSalesContext(payload.prompt);
    if (salesContext) sections.push(`Contexto de ventas:\n${salesContext}`);

    const purchasesContext = this.buildPurchasesContext(payload.prompt);
    if (purchasesContext) sections.push(`Contexto de compras:\n${purchasesContext}`);

    sections.push(`Usuario: ${payload.prompt}\nAsistente:`);

    return sections.join('\n\n');
  }

  private async chatWithOllama(prompt: string, payload: ChatDto): Promise<{ reply: string; tokens?: number }> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.env.aiTimeoutMs);

    try {
      const res = await fetch(`${this.env.ollamaBaseUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.env.ollamaModel,
          prompt,
          stream: false,
          options: {
            temperature: payload.temperature,
            num_predict: payload.maxTokens,
          },
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        throw new ServiceUnavailableException(`Ollama respondio ${res.status}`);
      }

      const data = (await res.json()) as any;
      const reply = (data.response || data.text || data.output || '').trim();

      if (!reply) {
        throw new ServiceUnavailableException('Ollama no devolvio contenido');
      }

      let tokens: number | undefined;
      try {
        tokens = data.usage?.total_tokens ?? data.usage?.total ?? data.usage?.tokens?.total;
        if (typeof tokens === 'string') tokens = Number(tokens);
      } catch {
        tokens = undefined;
      }

      return { reply, tokens };
    } catch (error) {
      if (error instanceof ServiceUnavailableException) throw error;
      throw new ServiceUnavailableException('No se pudo conectar con Ollama local');
    } finally {
      clearTimeout(timeout);
    }
  }

  private async buildInventoryContext(prompt: string) {
    if (!this.isInventoryQuestion(prompt)) {
      return '';
    }

    try {
      const { rows } = await this.db.query<ProductoInventarioRow>(`
        SELECT nombre, categoria_nombre, stock_actual::text, stock_minimo::text
        FROM productos
        WHERE deleted_at IS NULL
          AND activo = TRUE
        ORDER BY stock_actual ASC, nombre ASC
          LIMIT 200
      `);

      if (!rows.length) {
        return 'No hay productos activos registrados en la base de datos.';
      }

      const normalizedPrompt = this.normalizeText(prompt);
      const matched = rows.filter((row) => this.matchesPrompt(row, normalizedPrompt));
      const lowStock = rows.filter((row) => this.isLowStock(row));

      const maxItems = Number(this.env.aiContextMaxItems || 30);
      const selected = this.uniqueRows([
        ...matched,
        ...lowStock.slice(0, Math.min(10, maxItems)),
        ...rows.slice(0, maxItems),
      ]).slice(0, maxItems);

      const inventoryLines = selected.map(
        (row) =>
          `- ${row.nombre} | categoria: ${row.categoria_nombre || 'Sin categoria'} | stock: ${this.formatNumber(row.stock_actual)} | minimo: ${this.formatNumber(row.stock_minimo)}`,
      );

      const lowStockLines = lowStock.length
        ? lowStock.slice(0, 10).map(
            (row) =>
              `- ${row.nombre} | stock: ${this.formatNumber(row.stock_actual)} | minimo: ${this.formatNumber(row.stock_minimo)}`,
          )
        : ['- Ninguno'];

      return [
        `Productos activos en BD: ${rows.length}`,
        'Inventario relevante:',
        ...inventoryLines,
        '',
        'Productos con stock bajo o sin stock:',
        ...lowStockLines,
      ].join('\n');
    } catch {
      return 'No se pudo leer la base de datos de inventario en este momento. Si preguntan por stock, indica que no pudiste consultar la BD.';
    }
  }

  private async buildSalesContext(prompt: string) {
    if (!this.isSalesQuestion(prompt)) return '';

    try {
      const { rows } = await this.db.query<{ numero_nota: string; fecha: string; total: string }>(`
        SELECT numero_nota, fecha::text, total::text
        FROM ventas
        WHERE deleted_at IS NULL
        ORDER BY fecha DESC
        LIMIT 10
      `);

      if (!rows.length) return 'No hay ventas registradas.';

      const lines = rows.map((r) => `- ${r.numero_nota} | fecha: ${r.fecha} | total: Bs. ${Number(r.total).toFixed(2)}`);
      return ['Ultimas ventas:', ...lines].join('\n');
    } catch {
      return 'No se pudo leer ventas desde la BD.';
    }
  }

  private async buildPurchasesContext(prompt: string) {
    if (!this.isPurchasesQuestion(prompt)) return '';

    try {
      const { rows } = await this.db.query<{ proveedor_nombre: string; fecha: string; total: string }>(`
        SELECT proveedor_nombre, fecha::text, total::text
        FROM ordenes_compra
        WHERE deleted_at IS NULL
        ORDER BY fecha DESC
        LIMIT 10
      `);

      if (!rows.length) return 'No hay ordenes de compra registradas.';

      const lines = rows.map((r) => `- ${r.proveedor_nombre || 'Proveedor'} | fecha: ${r.fecha} | total: Bs. ${Number(r.total).toFixed(2)}`);
      return ['Ultimas ordenes de compra:', ...lines].join('\n');
    } catch {
      return 'No se pudo leer ordenes de compra desde la BD.';
    }
  }

  private isSalesQuestion(prompt?: string) {
    if (!prompt) return false;
    const normalized = this.normalizeText(prompt);
    return /(venta|ventas|ventas del|ingresos|total de ventas|ventas del dia)/.test(normalized);
  }

  private isPurchasesQuestion(prompt?: string) {
    if (!prompt) return false;
    const normalized = this.normalizeText(prompt);
    return /(compra|compras|ordenes de compra|proveedor|orden de compra)/.test(normalized);
  }

  private isInventoryQuestion(prompt?: string) {
    if (!prompt) return false;
    const normalized = this.normalizeText(prompt);
    return /(stock|inventario|existenc|producto|productos|disponible|disponibles|agotad|faltant|cantidad|bodega)/.test(normalized);
  }

  private matchesPrompt(row: ProductoInventarioRow, normalizedPrompt: string) {
    const haystack = this.normalizeText(`${row.nombre} ${row.categoria_nombre}`);
    return normalizedPrompt
      .split(/\s+/)
      .filter((word) => word.length > 3)
      .some((word) => haystack.includes(word));
  }

  private isLowStock(row: ProductoInventarioRow) {
    const stockActual = Number(row.stock_actual ?? 0);
    const stockMinimo = Number(row.stock_minimo ?? 0);
    return stockActual <= 0 || stockActual <= stockMinimo;
  }

  private normalizeText(value?: string) {
    const v = String(value ?? '');
    return v
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();
  }

  private formatNumber(value: string) {
    const number = Number(value ?? 0);
    return Number.isInteger(number) ? String(number) : number.toFixed(2);
  }

  private uniqueRows(rows: ProductoInventarioRow[]) {
    const seen = new Set<string>();
    const unique: ProductoInventarioRow[] = [];

    for (const row of rows) {
      const key = `${row.nombre}::${row.categoria_nombre}`;
      if (seen.has(key)) continue;
      seen.add(key);
      unique.push(row);
    }

    return unique;
  }
}
