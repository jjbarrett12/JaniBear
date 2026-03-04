'use client';

import { ReactNode } from 'react';
import { SlideOverDrawer } from '@/components/enterprise/slide-over-drawer';

const SALES_DRAWER_WIDTH = 'max-w-xl';

export function RightDrawer({
  open,
  onClose,
  title,
  children,
  width,
}: {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  children: ReactNode;
  width?: string;
}) {
  return (
    <SlideOverDrawer
      open={open}
      onClose={onClose}
      title={title}
      width={width ?? SALES_DRAWER_WIDTH}
    >
      {children}
    </SlideOverDrawer>
  );
}
