import React, { useContext, useEffect, useState, useCallback, useMemo } from "react";
import { ComponentsProvider } from "@looker/components";
import { ExtensionContext } from "@looker/extension-sdk-react";
import { flexRender } from "@tanstack/react-table";
import type { VisOptions } from "@looker/extension-sdk";
import { useTableLogic } from "./hooks/useTableLogic";
import { CollapsibleHeader } from "./components/CollapsibleHeader";
import { formatFieldLabel, getFieldValue } from "./utils/tableUtils";
import type { VisualizationConfig, TableFeatureConfig } from "./types/visualization";

// Loading skeleton component for better UX
const TableSkeleton = () => (
  <div className="animate-pulse">
    <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
    <div className="space-y-3">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="grid grid-cols-6 gap-4">
          {[...Array(6)].map((_, j) => (
            <div key={j} className="h-4 bg-gray-200 rounded"></div>
          ))}
        </div>
      ))}
    </div>
  </div>
);

// Error message component
const ErrorMessage = ({ message }: { message: string }) => (
  <div className="rounded-md bg-red-50 p-4 my-4" role="alert">
    <div className="flex">
      <div className="flex-shrink-0">
        <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
        </svg>
      </div>
      <div className="ml-3">
        <h3 className="text-sm font-medium text-red-800">Error</h3>
        <div className="mt-2 text-sm text-red-700">{message}</div>
      </div>
    </div>
  </div>
);

// Column visibility menu
const ColumnVisibilityMenu = ({ table }: { table: any }) => (
  <div className="dropdown inline-block relative group">
    <button className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">
      Columns
    </button>
    <div className="dropdown-menu hidden group-hover:block absolute z-10 bg-white border rounded-lg shadow-lg mt-1 py-1 min-w-[200px]">
      {table.getAllLeafColumns().map((column: any) => (
        <label key={column.id} className="flex items-center px-4 py-2 hover:bg-gray-50 cursor-pointer">
          <input
            type="checkbox"
            checked={column.getIsVisible()}
            onChange={column.getToggleVisibilityHandler()}
            className="mr-2"
          />
          <span className="text-sm">{column.id}</span>
        </label>
      ))}
    </div>
  </div>
);

export const Visualization: React.FC = () => {
  console.log('Visualization: Component rendering');

  const {
    extensionSDK: { visualizationSDK },
  } = useContext(ExtensionContext);

  const [isExpanded, setIsExpanded] = useState(true);
  const [hasInitialConfig, setHasInitialConfig] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Configuration state
  const [config, setConfig] = useState<VisualizationConfig>({
    chartTitle: '',
    titleAlignment: 'left',
    titleSize: 16,
    titleWeight: 500,
    titleColor: '#1F2937',
    titlePadding: 'normal',
    subtitle: '',
    subtitlePosition: 'below',
    subtitleSize: 14,
    subtitleColor: '#6B7280',
    subtitleWeight: 400,
    enableSearchBar: true,
    enableExpandCollapse: true,
    rowsPerPage: 10,
    enableColumnResizing: true,
    enableRowSelection: true,
    enableColumnFilters: true,
    enablePinning: true,
    enableGrouping: true,
    columnResizeMode: 'onChange'
  });

  // Data transformation function (similar to Looker's example)
  const transformQueryData = useCallback((rawData: any[]) => {
    console.log('Transforming query data', { rawDataLength: rawData.length });

    if (!rawData || rawData.length === 0) {
      console.warn('No data to transform');
      return [];
    }

    return rawData.map(row => {
      const transformedRow: any = {};
      
      Object.entries(row).forEach(([key, value]) => {
        // Handle Looker's nested value objects
        if (value && typeof value === 'object' && 'value' in value) {
          transformedRow[key] = value.value;
          transformedRow[`${key}_rendered`] = (value as any).rendered || value.value;
        } else {
          transformedRow[key] = value;
        }
      });

      return transformedRow;
    });
  }, []);

  // Memoize table features
  const tableFeatures: TableFeatureConfig = useMemo(() => ({
    enableColumnResizing: config.enableColumnResizing,
    enableRowSelection: config.enableRowSelection,
    enableColumnFilters: config.enableColumnFilters,
    enablePinning: config.enablePinning,
    enableGrouping: config.enableGrouping,
    columnResizeMode: config.columnResizeMode,
    rowsPerPage: config.rowsPerPage
  }), [
    config.enableColumnResizing,
    config.enableRowSelection,
    config.enableColumnFilters,
    config.enablePinning,
    config.enableGrouping,
    config.columnResizeMode,
    config.rowsPerPage
  ]);

  const {
    table,
    data,
    setData,
    columns,
    createColumns,
    globalFilter,
    setGlobalFilter,
    pageIndex,
    setPageIndex,
    pageSize,
    setPageSize
  } = useTableLogic([], tableFeatures);

  // Handle data update
  const handleDataUpdate = useCallback((queryResponse: any) => {
    console.log('Handling data update', { 
      hasQueryResponse: Boolean(queryResponse),
      rawData: queryResponse?.data,
      rawQueryResponse: queryResponse
    });

    try {
      // Determine the correct data source
      const rawData = queryResponse?._queryResponse?.data || 
                      queryResponse?.data || 
                      [];

      // Transform the data
      const transformedData = transformQueryData(rawData);

      console.log('Transformed data', {
        transformedDataLength: transformedData.length,
        sampleRow: transformedData[0]
      });

      if (transformedData.length === 0) {
        setError('No data available');
        setIsLoading(false);
        return;
      }

      // Prepare fields for column creation
      const fields = {
        fieldDimensions: [
          { 
            name: 'executive_summary.dynamic_reporting', 
            label: 'Reporting Date' 
          }
        ],
        fieldMeasures: [
          { 
            name: 'executive_summary.total_order_count_dynamic', 
            label: 'Total Order Count' 
          }
        ]
      };

      // Create columns
      const newColumns = createColumns({
        ...queryResponse,
        ...fields,
        data: transformedData
      });

      // Set data and clear loading state
      setData(transformedData);
      setIsLoading(false);
      setError(null);

    } catch (err) {
      console.error('Error processing data:', err);
      setError('Failed to process visualization data');
      setIsLoading(false);
    }
  }, [transformQueryData, createColumns, setData]);

  // Initial data load effect
  useEffect(() => {
    if (!visualizationSDK) {
      setError('Visualization SDK not available');
      setIsLoading(false);
      return;
    }

    // Check initial query response
    const queryResponse = visualizationSDK.queryResponse;
    
    console.log('Initial query response check', {
      hasResponse: Boolean(queryResponse),
      rawData: queryResponse?.data,
      rawQueryResponse: queryResponse
    });

    if (queryResponse?.data && queryResponse.data.length > 0) {
      handleDataUpdate(queryResponse);
    } else {
      setIsLoading(true);
    }
  }, [visualizationSDK, handleDataUpdate]);

  // Visualization configuration effect
  useEffect(() => {
    if (!visualizationSDK) return;

    const visConfiguration: VisOptions = {
      title: {
        type: 'string',
        display: 'text',
        label: 'Chart Title',
        placeholder: 'Untitled masterpiece',
        section: 'Chart Title Config',
        order: 0
      },
      title_alignment: {
        type: 'string',
        display: 'select',
        values: [
          {'Left': 'left'},
          {'Center': 'center'},
          {'Right': 'right'}
        ],
        default: 'left',
        label: 'Title Alignment',
        display_size: 'half',
        section: 'Chart Title Config',
        order: 1
      },
      title_color: {
        type: 'string',
        display: 'color',
        default: '#1F2937',
        label: 'Title Color',
        display_size: 'half',
        section: 'Chart Title Config',
        order: 1
      },
      title_size: {
        type: 'number',
        display: 'number',
        default: 16,
        label: 'Title Size',
        sublabel: '(e.g., 16px)',
        display_size: 'half',
        min: 12,
        max: 48,
        section: 'Chart Title Config',
        order: 3
      },
      title_weight: {
        type: 'number',
        display: 'number',
        default: 500,
        label: 'Title Weight',
        sublabel: '(100-900)',
        display_size: 'half',
        min: 100,
        max: 900,
        section: 'Chart Title Config',
        order: 3
      },
      title_padding: {
        type: 'string',
        display: 'select',
        values: [
          {'Compact': 'compact'},
          {'Normal': 'normal'},
          {'Relaxed': 'relaxed'}
        ],
        default: 'normal',
        label: 'Title Spacing',
        section: 'Chart Title Config',
        order: 5
      },
      subtitle: {
        type: 'string',
        display: 'text',
        label: 'Subtitle',
        default: '',
        placeholder: 'Subtitle or description text',
        section: 'Chart Title Config',
        order: 6
      },
      subtitle_position: {
        type: 'string',
        display: 'select',
        values: [
          {'Right of Title': 'right'},
          {'Below Title': 'below'}
        ],
        default: 'below',
        label: 'Subtitle Position',
        display_size: 'half',
        section: 'Chart Title Config',
        order: 7
      },
      subtitle_color: {
        type: 'string',
        display: 'color',
        default: '#6B7280',
        label: 'Subtitle Color',
        display_size: 'half',
        section: 'Chart Title Config',
        order: 8
      },
      subtitle_size: {
        type: 'number',
        display: 'number',
        default: 14,
        label: 'Subtitle Size',
        sublabel: '(e.g., 14px)',
        min: 10,
        max: 24,
        section: 'Chart Title Config',
        order: 9
      },
      enable_search: {
        type: 'boolean',
        display: 'toggle',
        default: true,
        label: 'Enable search bar',
        section: 'Table Features',
        order: 0
      },
      enable_expand_collapse: {
        type: 'boolean',
        display: 'toggle',
        default: true,
        label: 'Enable expand/collapse',
        section: 'Table Features',
        order: 1
      },
      rows_per_page: {
        type: 'number',
        display: 'number',
        default: 10,
        label: 'Rows per page',
        min: 1,
        max: 50,
        section: 'Table Features',
        order: 2
      },
      // TanStack Table v8 feature configurations
      enable_column_resizing: {
        type: 'boolean',
        display: 'toggle',
        default: true,
        label: 'Enable column resizing',
        section: 'Table Features',
        order: 3
      },
      enable_row_selection: {
        type: 'boolean',
        display: 'toggle',
        default: true,
        label: 'Enable row selection',
        section: 'Table Features',
        order: 4
      },
      enable_column_filters: {
        type: 'boolean',
        display: 'toggle',
        default: true,
        label: 'Enable column filters',
        section: 'Table Features',
        order: 5
      },
      enable_pinning: {
        type: 'boolean',
        display: 'toggle',
        default: true,
        label: 'Enable column pinning',
        section: 'Table Features',
        order: 6
      },
      enable_grouping: {
        type: 'boolean',
        display: 'toggle',
        default: true,
        label: 'Enable row grouping',
        section: 'Table Features',
        order: 7
      },
      column_resize_mode: {
        type: 'string',
        display: 'select',
        values: [
          {'On Change': 'onChange'},
          {'On End': 'onEnd'}
        ],
        default: 'onChange',
        label: 'Column resize mode',
        section: 'Table Features',
        order: 8
      }
    };

    visualizationSDK.configureVisualization(visConfiguration);
  }, [visualizationSDK]);

  // Update visualization config when data changes
  useEffect(() => {
    if (!visualizationSDK?.visualizationData) return;

    const visConfig = visualizationSDK.visualizationData.visConfig || {};
    console.log('Visualization: New config', visConfig);
    
    setConfig(prevConfig => {
      // Only update if values have changed
      const newConfig = {
        ...prevConfig,
        chartTitle: visConfig.title || '',
        titleAlignment: visConfig.title_alignment || 'left',
        titleSize: Number(visConfig.title_size) || 16,
        titleWeight: Number(visConfig.title_weight) || 500,
        titleColor: visConfig.title_color || '#1F2937',
        titlePadding: visConfig.title_padding || 'normal',
        subtitle: visConfig.subtitle || '',
        subtitlePosition: visConfig.subtitle_position || 'below',
        subtitleSize: Number(visConfig.subtitle_size) || 14,
        subtitleColor: visConfig.subtitle_color || '#6B7280',
        subtitleWeight: 400,
        enableSearchBar: visConfig.enable_search ?? true,
        enableExpandCollapse: visConfig.enable_expand_collapse ?? true,
        rowsPerPage: Number(visConfig.rows_per_page) || 10,
        enableColumnResizing: visConfig.enable_column_resizing ?? true,
        enableRowSelection: visConfig.enable_row_selection ?? true,
        enableColumnFilters: visConfig.enable_column_filters ?? true,
        enablePinning: visConfig.enable_pinning ?? true,
        enableGrouping: visConfig.enable_grouping ?? true,
        columnResizeMode: visConfig.column_resize_mode || 'onChange'
      };

      // Only update state if something has changed
      return JSON.stringify(newConfig) !== JSON.stringify(prevConfig) ? newConfig : prevConfig;
    });

    if (!hasInitialConfig) {
      setHasInitialConfig(true);
    }
  }, [visualizationSDK?.visualizationData, hasInitialConfig]);

  if (error) {
    console.log('Visualization: Rendering error state', { error });
    return <ErrorMessage message={error} />;
  }

  if (isLoading || !table) {
    return <TableSkeleton />;
  }

  return (
    <ComponentsProvider>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center mb-3">
          <div className="flex items-center space-x-2">
            {/* Search bar */}
            {config.enableSearchBar && (
              <input
                type="text"
                value={globalFilter ?? ''}
                onChange={e => setGlobalFilter(e.target.value)}
                className="px-3 py-1.5 border border-gray-300 rounded-lg w-64 text-sm"
                placeholder="Search all columns..."
                aria-label="Search all columns"
                disabled={isLoading}
              />
            )}
            
            {/* Column visibility menu */}
            <ColumnVisibilityMenu table={table} />
            
            {/* Row selection info */}
            {Object.keys(table.getState().rowSelection).length > 0 && (
              <div className="text-sm text-gray-600">
                {Object.keys(table.getState().rowSelection).length} row(s) selected
              </div>
            )}
          </div>

          {/* Page size selector */}
          <select
            value={pageSize}
            onChange={e => setPageSize(Number(e.target.value))}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
          >
            {[10, 20, 30, 40, 50].map(size => (
              <option key={size} value={size}>
                Show {size}
              </option>
            ))}
          </select>
        </div>

        <CollapsibleHeader
          isLoading={isLoading}
          isExpanded={isExpanded}
          setIsExpanded={setIsExpanded}
          enableExpandCollapse={config.enableExpandCollapse}
          chartTitle={config.chartTitle}
          subtitle={config.subtitle}
          titleAlignment={config.titleAlignment}
          titleSize={config.titleSize}
          titleWeight={config.titleWeight}
          titleColor={config.titleColor}
          titlePadding={config.titlePadding}
          subtitlePosition={config.subtitlePosition}
          subtitleSize={config.subtitleSize}
          subtitleColor={config.subtitleColor}
          subtitleWeight={config.subtitleWeight}
        >
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200" role="grid">
              <thead className="bg-gray-50">
                {table.getHeaderGroups().map((headerGroup: any) => (
                  <tr key={headerGroup.id} role="row">
                    {headerGroup.headers.map((header: any) => {
                      const isResizing = header.column.getIsResizing();
                      return (
                        <th 
                          key={header.id}
                          className={`
                            relative px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider 
                            ${header.column.getCanSort() ? 'cursor-pointer select-none' : ''}
                            ${isResizing ? 'bg-gray-200' : 'hover:bg-gray-100'}
                          `}
                          style={{
                            width: header.getSize(),
                          }}
                          onClick={header.column.getToggleSortingHandler()}
                          role="columnheader"
                          aria-sort={header.column.getIsSorted() ? (header.column.getIsSorted() === 'desc' ? 'descending' : 'ascending') : 'none'}
                        >
                          <div className="flex items-center justify-between group">
                            {header.isPlaceholder
                              ? null
                              : flexRender(
                                  header.column.columnDef.header,
                                  header.getContext()
                                )}
                            
                            {/* Sort indicator */}
                            <span className="ml-2">
                              {{
                                asc: ' 🔼',
                                desc: ' 🔽',
                              }[header.column.getIsSorted() as string] ?? null}
                            </span>

                            {/* Resize handle */}
                            {config.enableColumnResizing && header.column.getCanResize() && (
                              <div
                                onMouseDown={header.getResizeHandler()}
                                onTouchStart={header.getResizeHandler()}
                                className={`
                                  absolute right-0 top-0 h-full w-1 cursor-col-resize 
                                  ${isResizing ? 'bg-blue-500' : 'bg-gray-200 opacity-0 group-hover:opacity-100'}
                                `}
                              />
                            )}
                          </div>
                        </th>
                      );
                    })}
                  </tr>
                ))}
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {table.getRowModel().rows.map((row: any) => (
                  <tr 
                    key={row.id} 
                    className={`
                      hover:bg-gray-50
                      ${row.getIsSelected() ? 'bg-blue-50' : ''}
                    `}
                    onClick={config.enableRowSelection ? row.getToggleSelectedHandler() : undefined}
                    role="row"
                    aria-selected={row.getIsSelected()}
                  >
                    {row.getVisibleCells().map((cell: any) => (
                      <td 
                        key={cell.id}
                        className="px-4 py-2 whitespace-nowrap text-sm text-gray-500"
                        style={{
                          width: cell.column.getSize(),
                        }}
                        role="gridcell"
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {table.getRowModel().rows.length > 0 && (
            <div className="mt-3 flex justify-between items-center text-sm">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setPageIndex(0)}
                  disabled={!table.getCanPreviousPage()}
                  className="px-2.5 py-1 border rounded text-xs font-medium disabled:opacity-50 hover:bg-gray-50"
                  aria-label="First page"
                >
                  {'<<'}
                </button>
                <button
                  onClick={() => setPageIndex(Math.max(pageIndex - 1, 0))}
                  disabled={!table.getCanPreviousPage()}
                  className="px-2.5 py-1 border rounded text-xs font-medium disabled:opacity-50 hover:bg-gray-50"
                  aria-label="Previous page"
                >
                  {'<'}
                </button>
                <span className="text-xs text-gray-600" role="status">
                  Page {pageIndex + 1} of {table.getPageCount()}
                </span>
                <button
                  onClick={() => setPageIndex(Math.min(pageIndex + 1, table.getPageCount() - 1))}
                  disabled={!table.getCanNextPage()}
                  className="px-2.5 py-1 border rounded text-xs font-medium disabled:opacity-50 hover:bg-gray-50"
                  aria-label="Next page"
                >
                  {'>'}
                </button>
                <button
                  onClick={() => setPageIndex(table.getPageCount() - 1)}
                  disabled={!table.getCanNextPage()}
                  className="px-2.5 py-1 border rounded text-xs font-medium disabled:opacity-50 hover:bg-gray-50"
                  aria-label="Last page"
                >
                  {'>>'}
                </button>
              </div>
              <span className="text-xs text-gray-600">
                {table.getRowModel().rows.length} rows
              </span>
            </div>
          )}
        </CollapsibleHeader>
      </div>
    </ComponentsProvider>
  );
};
