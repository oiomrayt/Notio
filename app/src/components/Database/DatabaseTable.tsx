import React, { useState, useEffect, useMemo } from 'react';
import { useTable, useSortBy, useFilters, usePagination, useRowSelect, Column } from 'react-table';
import { useAppDispatch, useAppSelector } from '../../hooks/reduxHooks';
import { fetchTableData, updateCell, addRow, deleteRow } from '../../store/slices/databaseSlice';
import FilterDropdown from './FilterDropdown';
import AddRowModal from './AddRowModal';
import { FaSort, FaSortUp, FaSortDown, FaPlus, FaTrash, FaFilter } from 'react-icons/fa';

interface TableColumn {
  id: string;
  name: string;
  type: string;
  options?: any;
  isRequired?: boolean;
}

interface TableRow {
  id: string;
  [key: string]: any;
}

interface DatabaseTableProps {
  tableId: string;
  columns: TableColumn[];
  onColumnAdd?: () => void;
  onColumnEdit?: (columnId: string) => void;
}

const DatabaseTable: React.FC<DatabaseTableProps> = ({
  tableId,
  columns,
  onColumnAdd,
  onColumnEdit,
}) => {
  const dispatch = useAppDispatch();
  const { rows, loading, error } = useAppSelector(
    state => state.database.tables[tableId] || { rows: [], loading: false, error: null },
  );

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);

  // Загрузка данных при монтировании компонента
  useEffect(() => {
    dispatch(fetchTableData(tableId));
  }, [dispatch, tableId]);

  // Обработчик изменения ячейки
  const handleCellChange = (rowId: string, columnId: string, value: any) => {
    dispatch(updateCell({ tableId, rowId, columnId, value }));
  };

  // Обработчик добавления строки
  const handleAddRow = (rowData: any) => {
    dispatch(addRow({ tableId, data: rowData }));
    setIsAddModalOpen(false);
  };

  // Обработчик удаления выбранных строк
  const handleDeleteSelected = () => {
    if (window.confirm('Вы уверены, что хотите удалить выбранные строки?')) {
      selectedRows.forEach(rowId => {
        dispatch(deleteRow({ tableId, rowId }));
      });
      setSelectedRows([]);
    }
  };

  // Создание колонок для react-table
  const tableColumns = useMemo<Column<TableRow>[]>(
    () =>
      columns.map(column => ({
        Header: () => (
          <div className="column-header" onClick={() => onColumnEdit && onColumnEdit(column.id)}>
            {column.name}
          </div>
        ),
        accessor: column.id,
        Cell: ({ row, value, column: { id } }) => {
          const cellType = columns.find(col => col.id === id)?.type;
          return (
            <EditableCell
              initialValue={value}
              rowId={row.original.id}
              columnId={id}
              type={cellType || 'text'}
              onChange={handleCellChange}
            />
          );
        },
        Filter: ({ column }) => <FilterDropdown column={column} />,
      })),
    [columns, onColumnEdit],
  );

  // Инициализация react-table
  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    prepareRow,
    page,
    canPreviousPage,
    canNextPage,
    pageOptions,
    pageCount,
    gotoPage,
    nextPage,
    previousPage,
    setPageSize,
    selectedFlatRows,
    state: { pageIndex, pageSize },
  } = useTable<TableRow>(
    {
      columns: tableColumns,
      data: rows,
      initialState: { pageIndex: 0, pageSize: 25 },
    },
    useFilters,
    useSortBy,
    usePagination,
    useRowSelect,
    hooks => {
      hooks.visibleColumns.push(columns => [
        {
          id: 'selection',
          Header: ({ getToggleAllRowsSelectedProps }) => (
            <div>
              <input type="checkbox" {...getToggleAllRowsSelectedProps()} />
            </div>
          ),
          Cell: ({ row }) => (
            <div>
              <input type="checkbox" {...row.getToggleRowSelectedProps()} />
            </div>
          ),
        },
        ...columns,
      ]);
    },
  );

  // Обновление выбранных строк при изменении выделения
  useEffect(() => {
    setSelectedRows(selectedFlatRows.map(row => row.original.id));
  }, [selectedFlatRows]);

  if (loading) {
    return <div className="loading">Загрузка данных...</div>;
  }

  if (error) {
    return <div className="error">Ошибка загрузки данных: {error}</div>;
  }

  return (
    <div className="database-table">
      <div className="table-toolbar">
        <button className="btn btn-primary" onClick={() => setIsAddModalOpen(true)}>
          <FaPlus /> Добавить строку
        </button>
        {selectedRows.length > 0 && (
          <button className="btn btn-danger" onClick={handleDeleteSelected}>
            <FaTrash /> Удалить выбранные ({selectedRows.length})
          </button>
        )}
        <button className="btn btn-outline" onClick={onColumnAdd}>
          <FaPlus /> Добавить колонку
        </button>
      </div>

      <div className="table-container">
        <table {...getTableProps()} className="data-table">
          <thead>
            {headerGroups.map(headerGroup => (
              <tr {...headerGroup.getHeaderGroupProps()}>
                {headerGroup.headers.map(column => (
                  <th {...column.getHeaderProps(column.getSortByToggleProps())}>
                    {column.render('Header')}
                    <span className="sort-indicator">
                      {column.isSorted ? (
                        column.isSortedDesc ? (
                          <FaSortDown />
                        ) : (
                          <FaSortUp />
                        )
                      ) : column.canSort ? (
                        <FaSort />
                      ) : null}
                    </span>
                    <div className="filter-indicator">{column.canFilter && <FaFilter />}</div>
                    <div>{column.canFilter ? column.render('Filter') : null}</div>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody {...getTableBodyProps()}>
            {page.map(row => {
              prepareRow(row);
              return (
                <tr {...row.getRowProps()}>
                  {row.cells.map(cell => (
                    <td {...cell.getCellProps()}>{cell.render('Cell')}</td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="pagination">
        <button onClick={() => gotoPage(0)} disabled={!canPreviousPage}>
          {'<<'}
        </button>
        <button onClick={() => previousPage()} disabled={!canPreviousPage}>
          {'<'}
        </button>
        <span>
          Страница{' '}
          <strong>
            {pageIndex + 1} из {pageOptions.length}
          </strong>
        </span>
        <button onClick={() => nextPage()} disabled={!canNextPage}>
          {'>'}
        </button>
        <button onClick={() => gotoPage(pageCount - 1)} disabled={!canNextPage}>
          {'>>'}
        </button>
        <select
          value={pageSize}
          onChange={e => {
            setPageSize(Number(e.target.value));
          }}
        >
          {[10, 25, 50, 100].map(pageSizeOption => (
            <option key={pageSizeOption} value={pageSizeOption}>
              Показать {pageSizeOption}
            </option>
          ))}
        </select>
      </div>

      {isAddModalOpen && (
        <AddRowModal
          columns={columns}
          onAdd={handleAddRow}
          onCancel={() => setIsAddModalOpen(false)}
        />
      )}
    </div>
  );
};

// Компонент редактируемой ячейки
interface EditableCellProps {
  initialValue: any;
  rowId: string;
  columnId: string;
  type: string;
  onChange: (rowId: string, columnId: string, value: any) => void;
}

const EditableCell: React.FC<EditableCellProps> = ({
  initialValue,
  rowId,
  columnId,
  type,
  onChange,
}) => {
  const [value, setValue] = useState(initialValue);
  const [isEditing, setIsEditing] = useState(false);

  // Обновление значения при изменении initialValue
  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  // Завершение редактирования
  const onBlur = () => {
    setIsEditing(false);
    if (value !== initialValue) {
      onChange(rowId, columnId, value);
    }
  };

  const renderInput = () => {
    switch (type) {
      case 'text':
        return (
          <input
            type="text"
            value={value || ''}
            onChange={e => setValue(e.target.value)}
            onBlur={onBlur}
            autoFocus
          />
        );
      case 'number':
        return (
          <input
            type="number"
            value={value || 0}
            onChange={e => setValue(Number(e.target.value))}
            onBlur={onBlur}
            autoFocus
          />
        );
      case 'date':
        return (
          <input
            type="date"
            value={value || ''}
            onChange={e => setValue(e.target.value)}
            onBlur={onBlur}
            autoFocus
          />
        );
      case 'boolean':
        return (
          <input
            type="checkbox"
            checked={value || false}
            onChange={e => {
              setValue(e.target.checked);
              onChange(rowId, columnId, e.target.checked);
            }}
          />
        );
      default:
        return (
          <input
            type="text"
            value={value || ''}
            onChange={e => setValue(e.target.value)}
            onBlur={onBlur}
            autoFocus
          />
        );
    }
  };

  if (isEditing) {
    return <div className="editable-cell">{renderInput()}</div>;
  }

  // Форматирование отображаемого значения в зависимости от типа
  const formattedValue = (() => {
    if (value === null || value === undefined) return '-';

    switch (type) {
      case 'date':
        return new Date(value).toLocaleDateString();
      case 'boolean':
        return value ? 'Да' : 'Нет';
      default:
        return String(value);
    }
  })();

  return (
    <div className="editable-cell" onClick={() => type !== 'boolean' && setIsEditing(true)}>
      {type === 'boolean' ? (
        <input
          type="checkbox"
          checked={value || false}
          onChange={e => {
            setValue(e.target.checked);
            onChange(rowId, columnId, e.target.checked);
          }}
        />
      ) : (
        formattedValue
      )}
    </div>
  );
};

export default DatabaseTable;
