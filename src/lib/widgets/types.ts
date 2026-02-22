import type { ReactNode, ComponentType } from 'react';

export type BreakpointKey = 'lg' | 'md' | 'sm';

export interface LayoutItem {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
  minW?: number;
  minH?: number;
  maxW?: number;
  maxH?: number;
  static?: boolean;
}

export interface DefaultLayoutByBreakpoint {
  lg?: Partial<LayoutItem>;
  md?: Partial<LayoutItem>;
  sm?: Partial<LayoutItem>;
}

export interface WidgetDefinition<P = { orgId: string }> {
  id: string;
  title: string;
  description?: string;
  icon?: ReactNode;
  component: ComponentType<P & { orgId: string }>;
  default: DefaultLayoutByBreakpoint;
  minW?: number;
  minH?: number;
  maxW?: number;
  maxH?: number;
  requiresRole?: string[];
}

export interface UserWidgetLayoutRow {
  id: string;
  org_id: string;
  user_id: string;
  module_key: string;
  breakpoint: BreakpointKey;
  layout: LayoutItem[];
  hidden_widgets: string[];
  created_at: string;
  updated_at: string;
}
