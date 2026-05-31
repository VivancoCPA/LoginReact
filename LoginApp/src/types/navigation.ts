import React from 'react';

export interface NavigationItem {
  label: string;
  path?: string;
  icon?: React.ReactNode;
  roles?: string[];         // Future role-based access filtering
  permissions?: string[];   // Future permission-based access filtering
  children?: NavigationItem[];
}
