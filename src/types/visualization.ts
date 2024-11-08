// Types for visualization data
export type DynamicData = {
  [key: string]: any;
};

// Types for styling options
export type TitleAlignment = 'left' | 'center' | 'right';
export type TitlePadding = 'compact' | 'normal' | 'relaxed';
export type SubtitlePosition = 'right' | 'below';
export type ColumnResizeMode = 'onChange' | 'onEnd';

// Types for table configuration
export interface TableConfig {
  enableSearchBar: boolean;
  enableExpandCollapse: boolean;
  rowsPerPage: number;
  // TanStack Table v8 feature flags
  enableColumnResizing: boolean;
  enableRowSelection: boolean;
  enableColumnFilters: boolean;
  enablePinning: boolean;
  enableGrouping: boolean;
  columnResizeMode: ColumnResizeMode;
}

// Separate type for table features that can be partially provided
export type TableFeatureConfig = Partial<{
  enableColumnResizing: boolean;
  enableRowSelection: boolean;
  enableColumnFilters: boolean;
  enablePinning: boolean;
  enableGrouping: boolean;
  columnResizeMode: ColumnResizeMode;
  rowsPerPage: number;
}>;

// Types for title configuration
export interface TitleConfig {
  chartTitle: string;
  titleAlignment: TitleAlignment;
  titleSize: number;
  titleWeight: number;
  titleColor: string;
  titlePadding: TitlePadding;
}

// Types for subtitle configuration
export interface SubtitleConfig {
  subtitle: string;
  subtitlePosition: SubtitlePosition;
  subtitleSize: number;
  subtitleColor: string;
  subtitleWeight: number;
}

// Types for column configuration
export interface ColumnConfig {
  id: string;
  label: string;
  isVisible: boolean;
  isPinned?: 'left' | 'right' | false;
  width?: number;
  minWidth?: number;
  maxWidth?: number;
  enableColumnFilter?: boolean;
  enablePinning?: boolean;
  enableGrouping?: boolean;
  enableResizing?: boolean;
}

// Types for collapsible header
export interface CollapsibleHeaderProps extends TitleConfig, SubtitleConfig {
  isLoading: boolean;
  isExpanded: boolean;
  setIsExpanded: (expanded: boolean) => void;
  enableExpandCollapse: boolean;
  children?: React.ReactNode;
}

// Types for table state
export interface TableState {
  sorting: any[];
  columnFilters: any[];
  globalFilter: string;
  columnVisibility: Record<string, boolean>;
  columnOrder: string[];
  columnPinning: {
    left?: string[];
    right?: string[];
  };
  rowSelection: Record<string, boolean>;
  expanded: Record<string, boolean>;
}

// Combined configuration type
export interface VisualizationConfig extends TableConfig, TitleConfig, SubtitleConfig {
  columns?: ColumnConfig[];
}
