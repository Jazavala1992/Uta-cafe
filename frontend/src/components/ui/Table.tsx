import { useMemo, useState } from 'react';
import Badge from './Badge';
import Button from './Button';
import { FiEdit3, FiRotateCcw, FiTrash2 } from 'react-icons/fi';
import styles from './ui.module.css';

interface TableProps<T> {
  columns: {
    key: string;
    header: string;
    render?: (row: T) => React.ReactNode;
    sortable?: boolean;
  }[];
  data: T[];
  onEdit?: (row: T) => void;
  onDelete?: (row: T) => void;
  onRestore?: (row: T) => void;
  renderExtraActions?: (row: T) => React.ReactNode;
  compactActions?: boolean;
  loading?: boolean;
  pageSize?: number;
  searchable?: boolean;
  searchKeys?: string[];
  showDeleted?: boolean;
  onToggleShowDeleted?: () => void;
  isAdmin?: boolean;
}

export default function Table<T extends object>({
  columns,
  data,
  onEdit,
  onDelete,
  onRestore,
  renderExtraActions,
  compactActions,
  loading,
  pageSize = 10,
  searchable,
  searchKeys = [],
  showDeleted,
  onToggleShowDeleted,
  isAdmin,
}: TableProps<T>) {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    if (!searchable || !search.trim()) return data;
    const q = search.toLowerCase();
    return data.filter((row) => {
      const rowMap = row as Record<string, unknown>;
      return searchKeys.some((key) => String(rowMap[key] ?? '').toLowerCase().includes(q));
    });
  }, [data, search, searchable, searchKeys]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  const hasActions = Boolean(onEdit || onDelete || onRestore || renderExtraActions);

  return (
    <section className={styles.tableCard}>
      <div className={styles.tableToolbar}>
        {searchable ? (
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Buscar..."
            className={styles.searchInput}
          />
        ) : (
          <div />
        )}
        {isAdmin ? (
          <Button variant="ghost" onClick={onToggleShowDeleted}>
            {showDeleted ? 'Ocultar eliminados' : 'Mostrar eliminados'}
          </Button>
        ) : null}
      </div>

      <div className={styles.tableScroll}>
        <table className={styles.table}>
          <thead>
            <tr className={styles.tableHeadRow}>
              {columns.map((col) => (
                <th key={col.key} className={styles.th}>
                  {col.header}
                </th>
              ))}
              {hasActions ? <th className={styles.th}>Acciones</th> : null}
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={columns.length + (hasActions ? 1 : 0)} className={styles.tableCell}>
                      <div className={styles.skeleton} />
                    </td>
                  </tr>
                ))
              : paginated.map((row, idx) => {
                  const rowMap = row as Record<string, unknown>;
                  const eliminado = Boolean(rowMap.deletedAt);
                  return (
                    <tr key={idx} className={eliminado ? styles.rowDeleted : styles.rowNormal}>
                      {columns.map((col) => (
                        <td key={col.key} className={styles.tableCell}>
                          {col.render ? col.render(row) : String(rowMap[col.key] ?? '-')}
                        </td>
                      ))}
                      {hasActions ? (
                        <td className={`${styles.tableCell} ${compactActions ? styles.tableCellCompactActions : ''}`}>
                          {compactActions ? (
                            <div className={styles.actionsCellCompact}>
                              {eliminado ? <Badge color="danger">Eliminado</Badge> : null}
                              {!eliminado && renderExtraActions ? (
                                <div className={styles.actionsExtraSlot}>{renderExtraActions(row)}</div>
                              ) : null}
                              <div className={styles.actionsButtonsCompact}>
                                {eliminado ? (
                                  <Button
                                    variant="ghost"
                                    onClick={() => onRestore?.(row)}
                                    className={`${styles.actionButtonCompact} ${styles.actionButtonRestoreCompact}`}
                                    aria-label="Restaurar"
                                    title="Restaurar"
                                  >
                                    <FiRotateCcw size={16} />
                                  </Button>
                                ) : (
                                  <>
                                    {onEdit ? (
                                      <Button
                                        variant="ghost"
                                        onClick={() => onEdit(row)}
                                        className={`${styles.actionButtonCompact} ${styles.actionButtonEditCompact}`}
                                        aria-label="Editar"
                                        title="Editar"
                                      >
                                        <FiEdit3 size={16} />
                                      </Button>
                                    ) : null}
                                    {onDelete ? (
                                      <Button
                                        variant="ghost"
                                        onClick={() => onDelete(row)}
                                        className={`${styles.actionButtonCompact} ${styles.actionButtonDeleteCompact}`}
                                        aria-label="Eliminar"
                                        title="Eliminar"
                                      >
                                        <FiTrash2 size={16} />
                                      </Button>
                                    ) : null}
                                  </>
                                )}
                              </div>
                            </div>
                          ) : (
                            <div className={styles.actionsCell}>
                              {eliminado ? <Badge color="danger">Eliminado</Badge> : null}
                              {eliminado ? (
                                <Button variant="secondary" onClick={() => onRestore?.(row)}>
                                  Restaurar
                                </Button>
                              ) : (
                                <>
                                  {renderExtraActions ? renderExtraActions(row) : null}
                                  {onEdit ? (
                                    <Button variant="ghost" onClick={() => onEdit(row)}>
                                      Editar
                                    </Button>
                                  ) : null}
                                  {onDelete ? (
                                    <Button variant="danger" onClick={() => onDelete(row)}>
                                      Eliminar
                                    </Button>
                                  ) : null}
                                </>
                              )}
                            </div>
                          )}
                        </td>
                      ) : null}
                    </tr>
                  );
                })}
          </tbody>
        </table>
      </div>

      <div className={styles.tableFooter}>
        <small>
          Pagina {page} de {totalPages}
        </small>
        <div className={styles.pagination}>
          <Button variant="ghost" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
            Anterior
          </Button>
          <Button
            variant="ghost"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            Siguiente
          </Button>
        </div>
      </div>
    </section>
  );
}
