import { useState, useCallback, useMemo, useEffect } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getGroupedRowModel,
  getExpandedRowModel,
  createColumnHelper,
  ColumnResizeMode,
  VisibilityState,
  SortingState,
  ColumnPinningState,
  ColumnOrderState,
  ColumnFiltersState,
  RowSelectionState,
  ExpandedState,
} from '@tanstack/react-table';
import type { DynamicData, TableFeatureConfig } from '../types/visualization';
import { formatFieldLabel, getFieldValue } from '../utils/tableUtils';
import type { QueryResponse } from '@looker/extension-sdk';

const columnHelper = createColumnHelper<DynamicData>();

const defaultColumn = {
  enableSorting: true,
  enableColumnFilter: false,
  enablePinning: false,
  enableGrouping: false,
  enableResizing: false,
  minSize: 100,
};

export const useTableLogic = (
  initialData: DynamicData[] = [],
  config?: TableFeatureConfig
) => {
  console.log('useTableLogic: Initializing with data', { 
    dataLength: initialData.length,
    initialData
  });

  // Core state
  const [data, setData] = useState<DynamicData[]>(initialData);
  const [columns, setColumns] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Basic table states that are always enabled
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(config?.rowsPerPage || 10);

  // Optional feature states - initialized but might not be used
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [columnPinning, setColumnPinning] = useState<ColumnPinningState>({});
  const [columnOrder, setColumnOrder] = useState<ColumnOrderState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [expanded, setExpanded] = useState<ExpandedState>({});

  // Create columns function moved outside and memoized with useCallback
  const createColumns = useCallback((queryResponse: QueryResponse) => {
    console.log('createColumns: Starting column creation from query response', {
      queryResponse,
      fieldDimensions: queryResponse.fieldDimensions?.length || 0,
      fieldMeasures: queryResponse.fieldMeasures?.length || 0,
      fieldTableCalculations: queryResponse.fieldTableCalculations?.length || 0
    });

    const allFields = [];

    // Process dimensions
    if (queryResponse.fieldDimensions) {
      console.log('Processing dimensions:', queryResponse.fieldDimensions);
      allFields.push(...queryResponse.fieldDimensions.map(dim => ({
        name: dim.name,
        label: dim.label || formatFieldLabel(dim.name),
        type: 'dimension' as const
      })));
    }

    // Process measures
    if (queryResponse.fieldMeasures) {
      console.log('Processing measures:', queryResponse.fieldMeasures);
      allFields.push(...queryResponse.fieldMeasures.map(measure => ({
        name: measure.name,
        label: measure.label || formatFieldLabel(measure.name),
        type: 'measure' as const
      })));
    }

    // Process table calculations
    if (queryResponse.fieldTableCalculations) {
      console.log('Processing table calculations:', queryResponse.fieldTableCalculations);
      allFields.push(...queryResponse.fieldTableCalculations.map(calc => ({
        name: calc.name,
        label: calc.label || formatFieldLabel(calc.name),
        type: 'calculation' as const
      })));
    }
    
    console.log('createColumns: Created fields', { 
      fieldCount: allFields.length,
      fields: allFields 
    });
    
    const newColumns = allFields.map((field) => {
      console.log(`Creating column for field: ${field.name}`);
      const column = columnHelper.accessor((row: DynamicData) => {
        const value = getFieldValue(row, field.name);
        console.log(`Accessing value for field ${field.name}:`, { row, value });
        return value;
      }, {
        id: field.name,
        header: () => field.label,
        // Basic features always enabled
        enableSorting: true,
        // Feature-specific column options
        enableColumnFilter: config?.enableColumnFilters ?? false,
        enablePinning: config?.enablePinning ?? false,
        enableGrouping: config?.enableGrouping ?? false,
        enableResizing: config?.enableColumnResizing ?? false,
        cell: (info: any) => {
          const value = info.getValue();
          console.log(`Rendering cell for ${field.name}:`, { value });
          
          if (value === null || value === undefined) {
            return '-';
          }

          if (typeof value === 'object' && value !== null) {
            if ('value' in value) {
              return value.rendered || value.value || '-';
            }
            return JSON.stringify(value);
          }

          if (typeof value === 'number') {
            return value.toLocaleString();
          }

          return value;
        },
      });
      console.log(`Created column for field ${field.name}:`, column);
      return column;
    });

    console.log('createColumns: Created columns', { 
      columnCount: newColumns.length,
      columnIds: newColumns.map(col => col.id)
    });
    
    setColumns(newColumns);
    return newColumns;
  }, [config]);

  // Memoize table options to ensure consistent reference
  const tableOptions = useMemo(() => {
    console.log('tableOptions: Creating table options', {
      dataLength: data.length,
      columnCount: columns.length,
      sampleData: data.length > 0 ? data[0] : null,
      columnIds: columns.map(col => col.id)
    });

    return {
      data,
      columns,
      defaultColumn,
      state: {
        sorting,
        globalFilter,
        pagination: {
          pageIndex,
          pageSize,
        },
        // Only include optional states if the feature is enabled
        columnVisibility,
        columnOrder,
        ...(config?.enableColumnFilters && { columnFilters }),
        ...(config?.enableRowSelection && { rowSelection }),
        ...(config?.enablePinning && { columnPinning }),
        ...(config?.enableGrouping && { expanded }),
      },
      // Core features
      getCoreRowModel: getCoreRowModel(),
      getSortedRowModel: getSortedRowModel(),
      getFilteredRowModel: getFilteredRowModel(),
      getPaginationRowModel: getPaginationRowModel(),
      
      // Optional feature models - only include if enabled
      ...(config?.enableGrouping && {
        getGroupedRowModel: getGroupedRowModel(),
        getExpandedRowModel: getExpandedRowModel(),
      }),

      // Feature flags
      enableRowSelection: config?.enableRowSelection ?? false,
      enableColumnFilters: config?.enableColumnFilters ?? false,
      enablePinning: config?.enablePinning ?? false,
      enableColumnResizing: config?.enableColumnResizing ?? false,
        
      // Column resize mode
      columnResizeMode: config?.columnResizeMode as ColumnResizeMode,
        
      // State handlers - only include if feature is enabled
      onSortingChange: setSorting,
      onGlobalFilterChange: setGlobalFilter,
      onColumnVisibilityChange: setColumnVisibility,
      onColumnOrderChange: setColumnOrder,
      ...(config?.enableColumnFilters && { onColumnFiltersChange: setColumnFilters }),
      ...(config?.enableRowSelection && { onRowSelectionChange: setRowSelection }),
      ...(config?.enablePinning && { onColumnPinningChange: setColumnPinning }),
      ...(config?.enableGrouping && { onExpandedChange: setExpanded }),
    };
  }, [
    data,
    columns,
    sorting,
    globalFilter,
    pageIndex,
    pageSize,
    columnVisibility,
    columnOrder,
    columnFilters,
    rowSelection,
    columnPinning,
    expanded,
    config
  ]);

  // Create table instance using memoized options
  const table = useReactTable(tableOptions);

  // Reset pagination when data changes
  useEffect(() => {
    console.log('Data changed, resetting pagination', {
      dataLength: data.length,
      sampleData: data.length > 0 ? data[0] : null,
      columns: columns.map(col => col.id)
    });
    setPageIndex(0);
  }, [data, columns]);

  // Log table state for debugging
  useEffect(() => {
    if (table) {
      console.log('useTableLogic: Table state updated', {
        rowCount: table.getRowModel().rows.length,
        columnCount: table.getAllColumns().length,
        pageCount: table.getPageCount(),
        selectedRows: Object.keys(table.getState().rowSelection).length,
        columnIds: table.getAllColumns().map(col => col.id),
        sampleData: data.length > 0 ? data[0] : null,
        tableState: table.getState(),
        data,
        columns
      });
    }
  }, [table, data, columns]);

  return {
    table,
    data,
    setData,
    columns,
    isLoading,
    setIsLoading,
    error,
    setError,
    createColumns,
  
    // Basic features
    sorting,
    setSorting,
    globalFilter,
    setGlobalFilter,
    pageIndex,
    setPageIndex,
    pageSize,
    setPageSize,
  
    // Optional features
    columnVisibility,
    setColumnVisibility,
    columnPinning,
    setColumnPinning,
    columnOrder,
    setColumnOrder,
    columnFilters,
    setColumnFilters,
    rowSelection,
    setRowSelection,
    expanded,
    setExpanded,
  };
};
